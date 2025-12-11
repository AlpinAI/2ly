import asyncio
from types import SimpleNamespace
import pytest
from unittest.mock import AsyncMock, patch

from langchain_skilder.mcp_only import MCPClient, TwolyOptions


class _ToolObj(SimpleNamespace):
    pass


class _ToolsResult(SimpleNamespace):
    pass


class TestMCPClientInit:
    """Test MCPClient initialization with new authentication."""

    def test_init_with_workspace_key(self):
        """Test initialization with workspace key and name."""
        instance = MCPClient(name="test-client", workspace_key="WSK_test123")

        assert instance.name == "test-client"
        assert instance.serverParams.command == "npx"
        assert instance.serverParams.args == ["@skilder-ai/runtime@latest"]
        assert instance.serverParams.env["WORKSPACE_KEY"] == "WSK_test123"
        assert instance.serverParams.env["SKILL_NAME"] == "test-client"
        assert instance.serverParams.env["NATS_SERVERS"] == "nats://localhost:4222"

    def test_init_with_skill_key(self):
        """Test initialization with skill-specific key."""
        instance = MCPClient(skill_key="SKL_test456")

        assert instance.name is None
        assert instance.serverParams.env["SKILL_KEY"] == "SKL_test456"
        assert "WORKSPACE_KEY" not in instance.serverParams.env
        assert "SKILL_NAME" not in instance.serverParams.env

    def test_init_with_custom_options(self):
        """Test initialization with custom options."""
        instance = MCPClient(
            name="custom",
            workspace_key="WSK_abc",
            nats_servers="nats://custom:4222",
            version="1.2.3",
            log_level="debug"
        )

        assert instance.serverParams.args == ["@skilder-ai/runtime@1.2.3"]
        assert instance.serverParams.env["NATS_SERVERS"] == "nats://custom:4222"
        assert instance.serverParams.env["LOG_LEVEL"] == "debug"

    def test_init_requires_authentication(self):
        """Test that initialization requires authentication."""
        with pytest.raises(ValueError, match="Authentication required"):
            MCPClient()

    def test_factory_with_workspace_key(self):
        """Test with_workspace_key factory method."""
        instance = MCPClient.with_workspace_key(
            name="factory-test",
            workspace_key="WSK_factory"
        )

        assert instance.name == "factory-test"
        assert instance.serverParams.env["WORKSPACE_KEY"] == "WSK_factory"
        assert instance.serverParams.env["SKILL_NAME"] == "factory-test"

    def test_factory_with_skill_key(self):
        """Test with_skill_key factory method."""
        instance = MCPClient.with_skill_key(skill_key="SKL_factory")

        assert instance.serverParams.env["SKILL_KEY"] == "SKL_factory"
        assert "WORKSPACE_KEY" not in instance.serverParams.env


@pytest.mark.asyncio
async def test_get_langchain_tools_and_tools_dict():
    """Test get_langchain_tools and tools methods."""
    mock_read = AsyncMock()
    mock_write = AsyncMock()
    mock_session = AsyncMock()
    tool_a = _ToolObj(name="tA", description="A", inputSchema={"type": "object", "properties": {}})
    tool_b = _ToolObj(name="tB", description="B", inputSchema=None)
    mock_session.list_tools = AsyncMock(return_value=_ToolsResult(tools=[tool_a, tool_b]))
    mock_session.initialize = AsyncMock()

    stdio_ctx = AsyncMock()
    stdio_ctx.__aenter__.return_value = (mock_read, mock_write)
    stdio_ctx.__aexit__.return_value = None

    client_ctx = AsyncMock()
    client_ctx.__aenter__.return_value = mock_session
    client_ctx.__aexit__.return_value = None

    with patch("langchain_skilder.mcp_only.stdio_client", return_value=stdio_ctx) as _stdio, \
         patch("langchain_skilder.mcp_only.ClientSession", return_value=client_ctx) as _client:
        instance = MCPClient.with_workspace_key(name="test", workspace_key="WSK_test")
        lc_tools = await instance.get_langchain_tools()
        assert [t.name for t in lc_tools] == ["tA", "tB"]
        tools_dict = await instance.tools()
        assert isinstance(tools_dict, list)
        assert {d["name"] for d in tools_dict} == {"tA", "tB"}
        await instance.stop()


@pytest.mark.asyncio
async def test_call_tool_uses_same_session_and_returns_content():
    """Test that call_tool uses the same session and returns correct content."""
    mock_read = AsyncMock()
    mock_write = AsyncMock()
    mock_session = AsyncMock()
    mock_session.initialize = AsyncMock()
    mock_session.list_tools = AsyncMock(return_value=_ToolsResult(tools=[]))
    mock_session.call_tool = AsyncMock(return_value=SimpleNamespace(content=[{"type": "text", "text": "ok"}], isError=False))

    stdio_ctx = AsyncMock()
    stdio_ctx.__aenter__.return_value = (mock_read, mock_write)
    stdio_ctx.__aexit__.return_value = None

    client_ctx = AsyncMock()
    client_ctx.__aenter__.return_value = mock_session
    client_ctx.__aexit__.return_value = None

    with patch("langchain_skilder.mcp_only.stdio_client", return_value=stdio_ctx), \
         patch("langchain_skilder.mcp_only.ClientSession", return_value=client_ctx):
        instance = MCPClient.with_skill_key(skill_key="SKL_test")
        await instance.get_langchain_tools()
        result = await instance.call_tool("x", {"a": 1})
        assert result == {"content": [{"type": "text", "text": "ok"}], "isError": False}
        mock_session.call_tool.assert_awaited_once_with("x", {"a": 1})
        await instance.stop()


@pytest.mark.asyncio
async def test_start_timeout_raises_runtime_error_and_cleans_up():
    """Test that startup timeout raises RuntimeError and cleans up."""
    with patch("langchain_skilder.mcp_only.asyncio.wait_for", side_effect=asyncio.TimeoutError), \
         patch("langchain_skilder.mcp_only.stdio_client") as stdio_mock:
        stdio_mock.return_value.__aenter__.return_value = (AsyncMock(), AsyncMock())
        instance = MCPClient.with_workspace_key(
            name="test",
            workspace_key="WSK_test",
            startup_timeout_seconds=0.01
        )
        with pytest.raises(RuntimeError, match="startup timed out"):
            await instance.start()
        await instance.stop()


@pytest.mark.asyncio
async def test_lazy_initialization_only_on_first_use():
    """Test that session is initialized lazily on first use."""
    with patch("langchain_skilder.mcp_only.stdio_client") as stdio_mock, \
         patch("langchain_skilder.mcp_only.ClientSession") as client_mock:
        instance = MCPClient.with_skill_key(skill_key="SKL_test")
        assert stdio_mock.called is False

        mock_read = AsyncMock()
        mock_write = AsyncMock()
        stdio_ctx = AsyncMock()
        stdio_ctx.__aenter__.return_value = (mock_read, mock_write)
        stdio_ctx.__aexit__.return_value = None
        stdio_mock.return_value = stdio_ctx

        mock_session = AsyncMock()
        mock_session.initialize = AsyncMock()
        mock_session.list_tools = AsyncMock(return_value=_ToolsResult(tools=[]))
        client_ctx = AsyncMock()
        client_ctx.__aenter__.return_value = mock_session
        client_ctx.__aexit__.return_value = None
        client_mock.return_value = client_ctx

        await instance.get_langchain_tools()
        assert stdio_mock.called is True
        await instance.stop()


@pytest.mark.asyncio
async def test_stop_closes_session_and_clears_state():
    """Test that stop closes the session and clears internal state."""
    mock_read = AsyncMock()
    mock_write = AsyncMock()

    stdio_ctx = AsyncMock()
    stdio_ctx.__aenter__.return_value = (mock_read, mock_write)
    stdio_ctx.__aexit__.return_value = None

    mock_session = AsyncMock()
    mock_session.initialize = AsyncMock()
    mock_session.list_tools = AsyncMock(return_value=_ToolsResult(tools=[]))

    client_ctx = AsyncMock()
    client_ctx.__aenter__.return_value = mock_session
    client_ctx.__aexit__.return_value = None

    with patch("langchain_skilder.mcp_only.stdio_client", return_value=stdio_ctx), \
         patch("langchain_skilder.mcp_only.ClientSession", return_value=client_ctx):
        instance = MCPClient.with_workspace_key(name="test", workspace_key="WSK_test")
        await instance.get_langchain_tools()
        assert instance._session is not None
        await instance.stop()
        assert client_ctx.__aexit__.await_count == 1
        assert instance._session is None
        assert instance._runner_task is None
        assert instance._started is False
        assert getattr(instance, "_started_future", None) is None


@pytest.mark.asyncio
async def test_context_manager_lifecycle():
    """Test that async context manager handles lifecycle correctly."""
    mock_read = AsyncMock()
    mock_write = AsyncMock()
    mock_session = AsyncMock()
    mock_session.initialize = AsyncMock()
    mock_session.list_tools = AsyncMock(return_value=_ToolsResult(tools=[]))

    stdio_ctx = AsyncMock()
    stdio_ctx.__aenter__.return_value = (mock_read, mock_write)
    stdio_ctx.__aexit__.return_value = None

    client_ctx = AsyncMock()
    client_ctx.__aenter__.return_value = mock_session
    client_ctx.__aexit__.return_value = None

    with patch("langchain_skilder.mcp_only.stdio_client", return_value=stdio_ctx), \
         patch("langchain_skilder.mcp_only.ClientSession", return_value=client_ctx):
        async with MCPClient.with_skill_key(skill_key="SKL_test") as instance:
            await instance.get_langchain_tools()
            assert instance._session is not None

        # After exiting context, should be cleaned up
        assert client_ctx.__aexit__.await_count == 1
        assert instance._session is None


class TestMCPClientEnvironmentVariables:
    """Test environment variable configuration."""

    def test_no_deprecated_runtime_name(self):
        """Test that RUNTIME_NAME is not set (deprecated)."""
        instance = MCPClient.with_workspace_key(name="test", workspace_key="WSK_test")
        assert "RUNTIME_NAME" not in instance.serverParams.env

    def test_no_deprecated_workspace_id(self):
        """Test that WORKSPACE_ID is not set (deprecated)."""
        instance = MCPClient.with_skill_key(skill_key="SKL_test")
        assert "WORKSPACE_ID" not in instance.serverParams.env

    def test_log_level_optional(self):
        """Test that log_level is optional."""
        instance = MCPClient.with_workspace_key(name="test", workspace_key="WSK_test")
        assert "LOG_LEVEL" not in instance.serverParams.env

    def test_log_level_when_provided(self):
        """Test that log_level is set when provided."""
        instance = MCPClient.with_workspace_key(
            name="test",
            workspace_key="WSK_test",
            log_level="debug"
        )
        assert instance.serverParams.env["LOG_LEVEL"] == "debug"
