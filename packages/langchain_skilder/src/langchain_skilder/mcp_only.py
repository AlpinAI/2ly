"""MCP client utilities without langchain_mcp_adapters.

This module exposes `MCPClient`, a small helper that starts an MCP
runtime process on first use (lazy), keeps a shared session open between
operations, and provides LangChain-compatible tools.

Lifecycle overview:
- Preferred: use `async with MCPClient("rt") as mcp:` to auto-stop.
- First call to `get_langchain_tools()` or `call_tool(...)` lazily starts the
  MCP process and establishes a `ClientSession`.
- You may call multiple tools; they reuse the same session.
- If not using a context manager, call `await mcp.stop()` before exit.

Under the hood:
- We use `mcp.client.stdio.stdio_client` to spawn the runtime via `npx` and
  manage stdio-based JSON-RPC.
- We keep a background task alive while `_stop_requested` is False.
- A short startup future is awaited so that API calls only proceed after
  `session.initialize()` finishes or a timeout occurs.
"""

from typing import Optional, TypedDict, List, Dict, Any
import contextlib
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langchain_core.tools import BaseTool
import asyncio

class TwolyOptions(TypedDict, total=False):
    """Configuration for the MCP runtime process.

    - workspace_key: Workspace key (requires name parameter)
    - skill_key: Skill-specific key (standalone)
    - nats_servers: NATS connection URL used by the runtime. Defaults to local.
    - version: npm version/range for `@skilder-ai/runtime` when executed via `npx`.
    - startup_timeout_seconds: Max time to wait for session initialization.
    - log_level: Optional runtime log level forwarded via env var (info, debug, warn)
    """
    workspace_key: str
    skill_key: str
    nats_servers: str
    version: str
    startup_timeout_seconds: float
    log_level: str

def _validate_auth(name: Optional[str], workspace_key: Optional[str], skill_key: Optional[str]) -> None:
    """Validate authentication configuration.

    Rules:
    - Exactly one of workspace_key or skill_key must be provided
    - workspace_key requires name parameter
    - skill_key must not have name parameter

    Raises:
        ValueError: If authentication configuration is invalid
    """
    has_workspace_key = workspace_key is not None
    has_skill_key = skill_key is not None

    # Must have exactly one key type
    if not has_workspace_key and not has_skill_key:
        raise ValueError(
            "Authentication required: provide either 'workspace_key' (with 'name') or 'skill_key'. "
            "Get keys from the Skilder UI: Settings > API Keys (workspace key) or Skills page (skill key)."
        )

    if has_workspace_key and has_skill_key:
        raise ValueError(
            "Authentication conflict: provide either 'workspace_key' or 'skill_key', not both."
        )

    # Validate workspace_key requirements
    if has_workspace_key and not name:
        raise ValueError(
            "When using 'workspace_key' (workspace key), you must provide a 'name' parameter to identify the skill."
        )

    # Validate skill_key requirements
    if has_skill_key and name:
        raise ValueError(
            "When using 'skill_key', do not provide a 'name' parameter. "
            "The skill is identified by the key itself."
        )

class MCPTool(BaseTool):
    """Light wrapper that adapts MCP tools to LangChain's `BaseTool`.

    Each instance holds a reference to the shared `MCPClient`
    instance to execute calls over the same MCP session. Input validation is
    not enforced here; tool schemas are provided to the agent for planning.
    """
    _mcp_instance: Any
    _input_schema: Dict[str, Any]

    def __init__(self, name: str, description: str, input_schema: Dict[str, Any], mcp_instance: 'MCPClient'):
        super().__init__(
            name=name,
            description=description,
            args_schema=None
        )
        self._mcp_instance = mcp_instance
        self._input_schema = input_schema or {}
    
    async def _arun(self, **kwargs) -> str:
        """Execute the tool asynchronously using the shared MCP session."""
        try:
            result = await self._mcp_instance.call_tool(self.name, kwargs)
            
            if result.get("isError", False):
                return f"Error executing {self.name}: {result.get('content', 'Unknown error')}"
            
            # Format the content for return
            content = result.get("content", [])
            if isinstance(content, list) and content:
                # Handle different content types
                formatted_content = []
                for item in content:
                    if isinstance(item, dict):
                        if item.get("type") == "text":
                            formatted_content.append(item.get("text", ""))
                        else:
                            formatted_content.append(str(item))
                    else:
                        formatted_content.append(str(item))
                return "\n".join(formatted_content)
            else:
                return str(content)
                
        except Exception as e:
            return f"Error calling {self.name}: {str(e)}"
    
    def _run(self, **kwargs) -> str:
        """Synchronous escape hatch; prefer async agents in practice."""
        import asyncio
        try:
            # Try to get the current event loop
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If we're already in an async context, we can't use asyncio.run()
                # This is a limitation - ideally the agent should use async execution
                return "Error: Synchronous execution not supported in async context. Please use async agent execution."
            else:
                return asyncio.run(self._arun(**kwargs))
        except RuntimeError:
            # No event loop running, safe to use asyncio.run()
            return asyncio.run(self._arun(**kwargs))

class MCPClient:
    """Minimal MCP client with a lazy, shared session for LangChain tools.

    Authentication approaches:
    1. Workspace key + skill name (auto-discovery):
       MCPClient(name="My Agent", workspace_key="WSK_...", ...)
       - Enables automatic creation and discovery of skills at runtime
    2. Skill-specific key (recommended):
       MCPClient(skill_key="SKL_...", ...)
       - Provides granular security with access limited to one skill

    See factory methods for convenient initialization:
    - MCPClient.with_workspace_key(name, workspace_key)
    - MCPClient.with_skill_key(skill_key)

    Public API:
    - get_langchain_tools(): Fetch LangChain `BaseTool` objects (starts session
      on first use). Compatible with LangChain/LangGraph agents.
    - tools(): Get a list of dicts describing available tools (name,
      description, inputSchema).
    - call_tool(tool_name, arguments): Execute a specific tool using the shared
      session.
    - stop(): Gracefully shutdowns the background process and clears state.

    Session lifecycle (developer-facing):
    - Session starts when start() is called implicitly by first tool operation.
    - A background task holds the stdio client context and `ClientSession`.
    - `stop()` requests shutdown and awaits the background task.
    """

    def __init__(
        self,
        name: Optional[str] = None,
        workspace_key: Optional[str] = None,
        skill_key: Optional[str] = None,
        nats_servers: str = "nats://localhost:4222",
        version: str = "latest",
        startup_timeout_seconds: float = 20.0,
        log_level: Optional[str] = None
    ):
        """Initialize MCPClient with authentication.

        Args:
            name: Skill name (required when using workspace_key)
            workspace_key: Workspace key (requires name parameter)
            skill_key: Skill-specific key (standalone)
            nats_servers: NATS connection URL
            version: npm version for @skilder-ai/runtime
            startup_timeout_seconds: Max time to wait for session initialization
            log_level: Optional runtime log level (info, debug, warn)

        Raises:
            ValueError: If authentication configuration is invalid
        """
        # Validate authentication
        _validate_auth(name, workspace_key, skill_key)

        self.name = name

        # Build environment variables
        env = {
            "NATS_SERVERS": nats_servers,
        }

        if workspace_key:
            env["WORKSPACE_KEY"] = workspace_key
            env["SKILL_NAME"] = name  # type: ignore (validated above)
        elif skill_key:
            env["SKILL_KEY"] = skill_key

        if log_level:
            env["LOG_LEVEL"] = log_level

        self.serverParams = StdioServerParameters(
            # command="npx",
            # args=["@skilder-ai/runtime@" + version],
            command="node",
            args=["/Users/ben/web/alpinai/Skilder/packages/runtime/dist/index.js"],
            env=env,
        )

        # Lazy-initialized MCP session and background runner state
        self._session: Optional[ClientSession] = None
        self._runner_task: Optional[asyncio.Task] = None
        self._started_future: Optional[asyncio.Future] = None
        self._stop_requested: bool = False
        self._runner_exception: Optional[BaseException] = None
        self._started = False
        self._lock = asyncio.Lock()
        self._startup_timeout_seconds = startup_timeout_seconds

    @classmethod
    def with_workspace_key(
        cls,
        name: str,
        workspace_key: str,
        nats_servers: str = "nats://localhost:4222",
        version: str = "latest",
        startup_timeout_seconds: float = 20.0,
        log_level: Optional[str] = None
    ) -> "MCPClient":
        """Create MCPClient with workspace key for auto-discovery.

        This approach enables automatic creation and discovery of skills
        at runtime using a workspace-level key.

        Args:
            name: Skill name to create or connect to
            workspace_key: Workspace key (get from Settings > API Keys in UI)
            nats_servers: NATS connection URL
            version: npm version for @skilder-ai/runtime
            startup_timeout_seconds: Max time to wait for session initialization
            log_level: Optional runtime log level (info, debug, warn)

        Returns:
            MCPClient instance configured with workspace authentication

        Example:
            async with MCPClient.with_workspace_key(
                name="My LangGraph Agent",
                workspace_key="WSK_xyz123..."
            ) as mcp:
                tools = await mcp.get_langchain_tools()
        """
        return cls(
            name=name,
            workspace_key=workspace_key,
            nats_servers=nats_servers,
            version=version,
            startup_timeout_seconds=startup_timeout_seconds,
            log_level=log_level
        )

    @classmethod
    def with_skill_key(
        cls,
        skill_key: str,
        nats_servers: str = "nats://localhost:4222",
        version: str = "latest",
        startup_timeout_seconds: float = 20.0,
        log_level: Optional[str] = None
    ) -> "MCPClient":
        """Create MCPClient with skill-specific key (recommended).

        This approach provides granular security by using a key specific to
        one skill. Recommended for better security. Requires pre-creating
        the skill via UI or API.

        Args:
            skill_key: Skill-specific key (get from Skills page in UI)
            nats_servers: NATS connection URL
            version: npm version for @skilder-ai/runtime
            startup_timeout_seconds: Max time to wait for session initialization
            log_level: Optional runtime log level (info, debug, warn)

        Returns:
            MCPClient instance configured with skill authentication

        Example:
            async with MCPClient.with_skill_key(
                skill_key="SKL_abc456..."
            ) as mcp:
                tools = await mcp.get_langchain_tools()
        """
        return cls(
            skill_key=skill_key,
            nats_servers=nats_servers,
            version=version,
            startup_timeout_seconds=startup_timeout_seconds,
            log_level=log_level
        )

    async def __aenter__(self) -> "MCPClient":
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        await self.stop()

    def __del__(self) -> None:
        try:
            self._stop_requested = True
            if self._runner_task is not None:
                self._runner_task.cancel()
        except Exception:
            pass

    async def start(self) -> None:
        """Start the MCP runtime and initialize the session if not already started.

        Safe to call multiple times; subsequent calls are no-ops. This method
        waits until `ClientSession.initialize()` completes or times out.
        """
        if self._started:
            return
        self._runner_exception = None
        self._started_future = asyncio.get_running_loop().create_future()
        self._stop_requested = False
        self._runner_task = asyncio.create_task(self._run_session())
        try:
            assert self._started_future is not None
            await asyncio.wait_for(self._started_future, timeout=self._startup_timeout_seconds)
        except asyncio.TimeoutError as error:
            self._stop_requested = True
            if self._runner_task is not None:
                self._runner_task.cancel()
                with contextlib.suppress(Exception, asyncio.CancelledError):
                    await self._runner_task
            self._runner_task = None
            self._started_future = None
            self._session = None
            self._started = False
            raise RuntimeError("MCP runtime startup timed out. Ensure runtime can start and dependencies (e.g., NATS) are reachable.") from error
        if self._runner_exception is not None:
            await self.stop()
            raise RuntimeError("MCP runtime failed to start") from self._runner_exception
        self._started = True

    async def stop(self) -> None:
        """Stop the background task, close the session, and clear internal state."""
        if not self._started and self._runner_task is None:
            return
        try:
            self._stop_requested = True
            if self._runner_task is not None:
                try:
                    await asyncio.wait_for(self._runner_task, timeout=self._startup_timeout_seconds)
                except asyncio.TimeoutError:
                    self._runner_task.cancel()
                    with contextlib.suppress(Exception, asyncio.CancelledError):
                        await self._runner_task
                except asyncio.CancelledError:
                    pass
        finally:
            self._runner_task = None
            self._started_future = None
            self._session = None
            self._started = False

    async def _run_session(self) -> None:
        """Background task that owns the stdio client and MCP session.

        It sets `_started_future` once `initialize()` is done so callers waiting
        on `start()` can proceed. The loop idles until `_stop_requested`.
        """
        try:
            async with stdio_client(self.serverParams) as (read, write):
                async with ClientSession(read, write) as session:
                    self._session = session
                    await session.initialize()
                    if self._started_future is not None and not self._started_future.done():
                        self._started_future.set_result(None)
                    while not self._stop_requested:
                        await asyncio.sleep(0.01)
        except BaseException as error:
            self._runner_exception = error
            if self._started_future is not None and not self._started_future.done():
                self._started_future.set_result(None)
            raise
        finally:
            self._session = None

    async def get_langchain_tools(self) -> List[BaseTool]:
        """Return LangChain tools. Starts the session on first use.

        Use with LangChain/LangGraph agents. Tools reuse the same MCP session.
        """
        await self.start()
        assert self._session is not None
        tools_result = await self._session.list_tools()
        
        langchain_tools = []
        for tool in tools_result.tools:
            mcp_tool = MCPTool(
                name=tool.name,
                description=tool.description or "",
                input_schema=tool.inputSchema or {},
                mcp_instance=self
            )
            langchain_tools.append(mcp_tool)
        
        return langchain_tools

    async def list_tools(self) -> List[BaseTool]:
        """Alias for `get_langchain_tools()` for symmetry with adapter variant."""
        return await self.get_langchain_tools()

    async def tools(self) -> List[Dict[str, Any]]:
        """Return tool metadata as simple dicts (name, description, inputSchema)."""
        langchain_tools = await self.get_langchain_tools()
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "inputSchema": getattr(tool, "_input_schema", {})
            }
            for tool in langchain_tools
        ]
    
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call a specific tool on the shared session.

        Arguments are passed as-is to the MCP tool. The return structure mirrors
        MCP responses with `content` and `isError` keys.
        """
        await self.start()
        assert self._session is not None
        async with self._lock:
            result = await self._session.call_tool(tool_name, arguments)
            return {
                "content": result.content,
                "isError": result.isError
            }

    async def get_tool_by_name(self, tool_name: str) -> Optional[BaseTool]:
        """Convenience helper to retrieve a tool object by name."""
        tools = await self.get_langchain_tools()
        for tool in tools:
            if tool.name == tool_name:
                return tool
        return None
