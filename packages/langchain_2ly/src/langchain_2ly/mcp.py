from typing import Optional, TypedDict, List
import asyncio
import contextlib
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langchain_mcp_adapters.tools import load_mcp_tools
from langchain_core.tools import BaseTool

class TwolyOptions(TypedDict, total=False):
    workspace_key: str
    toolset_key: str
    nats_servers: str
    version: str
    startup_timeout_seconds: float

def _validate_auth(name: Optional[str], workspace_key: Optional[str], toolset_key: Optional[str]) -> None:
    """Validate authentication configuration.

    Rules:
    - Exactly one of workspace_key or toolset_key must be provided
    - workspace_key requires name parameter
    - toolset_key must not have name parameter

    Raises:
        ValueError: If authentication configuration is invalid
    """
    has_workspace_key = workspace_key is not None
    has_toolset_key = toolset_key is not None

    # Must have exactly one key type
    if not has_workspace_key and not has_toolset_key:
        raise ValueError(
            "Authentication required: provide either 'workspace_key' (with 'name') or 'toolset_key'. "
            "Get keys from the 2ly UI: Settings > API Keys (workspace key) or Toolsets page (toolset key)."
        )

    if has_workspace_key and has_toolset_key:
        raise ValueError(
            "Authentication conflict: provide either 'workspace_key' or 'toolset_key', not both."
        )

    # Validate workspace_key requirements
    if has_workspace_key and not name:
        raise ValueError(
            "When using 'workspace_key' (workspace key), you must provide a 'name' parameter to identify the toolset."
        )

    # Validate toolset_key requirements
    if has_toolset_key and name:
        raise ValueError(
            "When using 'toolset_key', do not provide a 'name' parameter. "
            "The toolset is identified by the key itself."
        )

class MCPToolset:
    """Connect to 2ly toolsets and access MCP tools via LangChain.

    Authentication approaches:
    1. Workspace key + toolset name (auto-discovery):
       MCPToolset(name="My Agent", workspace_key="WSK_...", ...)
       - Enables automatic creation and discovery of toolsets at runtime
    2. Toolset-specific key (recommended):
       MCPToolset(toolset_key="TSK_...", ...)
       - Provides granular security with access limited to one toolset

    See factory methods for convenient initialization:
    - MCPToolset.with_workspace_key(name, workspace_key)
    - MCPToolset.with_toolset_key(toolset_key)
    """

    def __init__(
        self,
        name: Optional[str] = None,
        workspace_key: Optional[str] = None,
        toolset_key: Optional[str] = None,
        nats_servers: str = "nats://localhost:4222",
        version: str = "latest",
        startup_timeout_seconds: float = 20.0
    ):
        """Initialize MCPToolset with authentication.

        Args:
            name: Toolset name (required when using workspace_key)
            workspace_key: Workspace key (requires name parameter)
            toolset_key: Toolset-specific key (standalone)
            nats_servers: NATS connection URL
            version: npm version for @2ly/runtime
            startup_timeout_seconds: Max time to wait for session initialization

        Raises:
            ValueError: If authentication configuration is invalid
        """
        # Validate authentication
        _validate_auth(name, workspace_key, toolset_key)

        self.name = name
        _opts = {
            "workspace_key": workspace_key,
            "toolset_key": toolset_key,
            "nats_servers": nats_servers,
            "version": version,
            "startup_timeout_seconds": startup_timeout_seconds
        }
        self.options = _opts

        # Build environment variables
        env = {
            "NATS_SERVERS": nats_servers,
        }

        if workspace_key:
            env["WORKSPACE_KEY"] = workspace_key
            env["TOOLSET_NAME"] = name  # type: ignore (validated above)
        elif toolset_key:
            env["TOOLSET_KEY"] = toolset_key

        self.serverParams = StdioServerParameters(
            # command="npx",
            # args=["@2ly/runtime@" + version],
            command="node",
            args=["/Users/ben/web/alpinai/2ly/packages/runtime/dist/index.js"],
            env=env,
        )
        self._session: Optional[ClientSession] = None
        self._runner_task: Optional[asyncio.Task] = None
        self._started_future: Optional[asyncio.Future] = None
        self._stop_requested: bool = False
        self._runner_exception: Optional[BaseException] = None
        self._started = False
        self._startup_timeout_seconds = startup_timeout_seconds

    @classmethod
    def with_workspace_key(
        cls,
        name: str,
        workspace_key: str,
        nats_servers: str = "nats://localhost:4222",
        version: str = "latest",
        startup_timeout_seconds: float = 20.0
    ) -> "MCPToolset":
        """Create MCPToolset with workspace key for auto-discovery.

        This approach enables automatic creation and discovery of toolsets
        at runtime using a workspace-level key.

        Args:
            name: Toolset name to create or connect to
            workspace_key: Workspace key (get from Settings > API Keys in UI)
            nats_servers: NATS connection URL
            version: npm version for @2ly/runtime
            startup_timeout_seconds: Max time to wait for session initialization

        Returns:
            MCPToolset instance configured with workspace authentication

        Example:
            async with MCPToolset.with_workspace_key(
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
            startup_timeout_seconds=startup_timeout_seconds
        )

    @classmethod
    def with_toolset_key(
        cls,
        toolset_key: str,
        nats_servers: str = "nats://localhost:4222",
        version: str = "latest",
        startup_timeout_seconds: float = 20.0
    ) -> "MCPToolset":
        """Create MCPToolset with toolset-specific key (recommended).

        This approach provides granular security by using a key specific to
        one toolset. Recommended for better security. Requires pre-creating
        the toolset via UI or API.

        Args:
            toolset_key: Toolset-specific key (get from Toolsets page in UI)
            nats_servers: NATS connection URL
            version: npm version for @2ly/runtime
            startup_timeout_seconds: Max time to wait for session initialization

        Returns:
            MCPToolset instance configured with toolset authentication

        Example:
            async with MCPToolset.with_toolset_key(
                toolset_key="TSK_abc456..."
            ) as mcp:
                tools = await mcp.get_langchain_tools()
        """
        return cls(
            toolset_key=toolset_key,
            nats_servers=nats_servers,
            version=version,
            startup_timeout_seconds=startup_timeout_seconds
        )

    async def __aenter__(self) -> "MCPToolset":
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
            raise RuntimeError("MCP runtime startup timed out. Ensure runtime can start and dependencies are reachable.") from error
        if self._runner_exception is not None:
            await self.stop()
            raise RuntimeError("MCP runtime failed to start") from self._runner_exception
        self._started = True

    async def stop(self) -> None:
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
        await self.start()
        assert self._session is not None
        tools = await load_mcp_tools(self._session)
        return tools

    async def list_tools(self) -> List[BaseTool]:
        return await self.get_langchain_tools()

    async def tools(self) -> List[BaseTool]:
        return await self.get_langchain_tools()