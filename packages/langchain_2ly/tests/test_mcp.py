import pytest
from unittest.mock import AsyncMock, patch
from mcp import StdioServerParameters
from langchain_2ly.mcp import MCPToolset, TwolyOptions


class TestMCPToolsetInitialization:
    """Test MCPToolset initialization with new authentication."""

    def test_init_with_workspace_key(self):
        """Test initialization with workspace key and name."""
        mcp = MCPToolset(name="test-skill", workspace_key="WSK_test123")

        assert mcp.name == "test-skill"
        assert isinstance(mcp.serverParams, StdioServerParameters)
        assert mcp.serverParams.command == "npx"
        assert mcp.serverParams.args == ["@2ly/runtime@latest"]
        assert mcp.serverParams.env["WORKSPACE_KEY"] == "WSK_test123"
        assert mcp.serverParams.env["SKILL_NAME"] == "test-skill"
        assert mcp.serverParams.env["NATS_SERVERS"] == "nats://localhost:4222"

    def test_init_with_skill_key(self):
        """Test initialization with skill-specific key."""
        mcp = MCPToolset(skill_key="SKL_test456")

        assert mcp.name is None
        assert mcp.serverParams.env["SKILL_KEY"] == "SKL_test456"
        assert "WORKSPACE_KEY" not in mcp.serverParams.env
        assert "SKILL_NAME" not in mcp.serverParams.env

    def test_init_with_custom_options(self):
        """Test initialization with custom NATS and version."""
        mcp = MCPToolset(
            name="custom",
            workspace_key="WSK_abc",
            nats_servers="nats://custom:4222",
            version="1.2.3"
        )

        assert mcp.serverParams.env["NATS_SERVERS"] == "nats://custom:4222"
        assert mcp.serverParams.args == ["@2ly/runtime@1.2.3"]

    def test_init_requires_authentication(self):
        """Test that initialization requires authentication."""
        with pytest.raises(ValueError, match="Authentication required"):
            MCPToolset()

    def test_init_rejects_both_keys(self):
        """Test that both keys cannot be used together."""
        with pytest.raises(ValueError, match="Authentication conflict"):
            MCPToolset(name="test", workspace_key="WSK_123", skill_key="SKL_456")

    def test_init_workspace_key_requires_name(self):
        """Test that workspace_key requires a name."""
        with pytest.raises(ValueError, match="must provide a 'name' parameter"):
            MCPToolset(workspace_key="WSK_123")

    def test_init_skill_key_rejects_name(self):
        """Test that skill_key must not have a name."""
        with pytest.raises(ValueError, match="do not provide a 'name' parameter"):
            MCPToolset(name="test", skill_key="SKL_123")


class TestMCPToolsetFactoryMethods:
    """Test MCPToolset factory methods."""

    def test_with_workspace_key(self):
        """Test with_workspace_key factory method."""
        mcp = MCPToolset.with_workspace_key(
            name="my-skill",
            workspace_key="WSK_factory",
            nats_servers="nats://factory:4222"
        )

        assert mcp.name == "my-skill"
        assert mcp.serverParams.env["WORKSPACE_KEY"] == "WSK_factory"
        assert mcp.serverParams.env["SKILL_NAME"] == "my-skill"
        assert mcp.serverParams.env["NATS_SERVERS"] == "nats://factory:4222"

    def test_with_skill_key(self):
        """Test with_skill_key factory method."""
        mcp = MCPToolset.with_skill_key(
            skill_key="SKL_factory",
            version="2.0.0"
        )

        assert mcp.serverParams.env["SKILL_KEY"] == "SKL_factory"
        assert mcp.serverParams.args == ["@2ly/runtime@2.0.0"]
        assert "WORKSPACE_KEY" not in mcp.serverParams.env


class TestMCPToolsetTools:
    """Test MCPToolset tool retrieval."""

    @pytest.mark.asyncio
    async def test_get_langchain_tools_success(self):
        """Test successful tool retrieval."""
        mock_tools = [{"name": "tool1"}, {"name": "tool2"}]
        mock_read = AsyncMock()
        mock_write = AsyncMock()
        mock_session = AsyncMock()
        mock_session.initialize = AsyncMock()

        with patch('langchain_2ly.mcp.stdio_client') as mock_stdio_client, \
             patch('langchain_2ly.mcp.ClientSession') as mock_client_session, \
             patch('langchain_2ly.mcp.load_mcp_tools') as mock_load_tools:

            mock_stdio_client.return_value.__aenter__.return_value = (mock_read, mock_write)
            mock_client_session.return_value.__aenter__.return_value = mock_session
            mock_load_tools.return_value = mock_tools

            mcp = MCPToolset.with_workspace_key(name="test", workspace_key="WSK_test")
            result = await mcp.get_langchain_tools()

            assert result == mock_tools
            mock_stdio_client.assert_called_once_with(mcp.serverParams)
            mock_client_session.assert_called_once_with(mock_read, mock_write)
            mock_session.initialize.assert_called_once()
            mock_load_tools.assert_called_once_with(mock_session)

    @pytest.mark.asyncio
    async def test_list_tools_alias(self):
        """Test that list_tools is an alias for get_langchain_tools."""
        mock_tools = [{"name": "tool1"}]

        with patch('langchain_2ly.mcp.stdio_client') as mock_stdio_client, \
             patch('langchain_2ly.mcp.ClientSession') as mock_client_session, \
             patch('langchain_2ly.mcp.load_mcp_tools') as mock_load_tools:

            mock_stdio_client.return_value.__aenter__.return_value = (AsyncMock(), AsyncMock())
            mock_client_session.return_value.__aenter__.return_value = AsyncMock()
            mock_load_tools.return_value = mock_tools

            mcp = MCPToolset.with_skill_key(skill_key="SKL_test")
            result = await mcp.list_tools()

            assert result == mock_tools

    @pytest.mark.asyncio
    async def test_tools_alias(self):
        """Test that tools is an alias for get_langchain_tools."""
        mock_tools = [{"name": "tool1"}]

        with patch('langchain_2ly.mcp.stdio_client') as mock_stdio_client, \
             patch('langchain_2ly.mcp.ClientSession') as mock_client_session, \
             patch('langchain_2ly.mcp.load_mcp_tools') as mock_load_tools:

            mock_stdio_client.return_value.__aenter__.return_value = (AsyncMock(), AsyncMock())
            mock_client_session.return_value.__aenter__.return_value = AsyncMock()
            mock_load_tools.return_value = mock_tools

            mcp = MCPToolset.with_workspace_key(name="test", workspace_key="WSK_test")
            result = await mcp.tools()

            assert result == mock_tools


class TestMCPToolsetLifecycle:
    """Test MCPToolset lifecycle management."""

    @pytest.mark.asyncio
    async def test_context_manager(self):
        """Test async context manager."""
        mock_read = AsyncMock()
        mock_write = AsyncMock()
        mock_session = AsyncMock()
        mock_session.initialize = AsyncMock()

        with patch('langchain_2ly.mcp.stdio_client') as mock_stdio_client, \
             patch('langchain_2ly.mcp.ClientSession') as mock_client_session, \
             patch('langchain_2ly.mcp.load_mcp_tools') as mock_load_tools:

            mock_stdio_client.return_value.__aenter__.return_value = (mock_read, mock_write)
            mock_client_session.return_value.__aenter__.return_value = mock_session
            mock_client_session.return_value.__aexit__.return_value = None
            mock_load_tools.return_value = []

            async with MCPToolset.with_workspace_key(name="test", workspace_key="WSK_test") as mcp:
                await mcp.get_langchain_tools()
                assert mcp._session is not None

            # After exiting context, session should be cleaned up
            assert mock_client_session.return_value.__aexit__.await_count == 1
            assert mcp._session is None
            assert mcp._runner_task is None
            assert mcp._started is False

    @pytest.mark.asyncio
    async def test_manual_start_stop(self):
        """Test manual start and stop."""
        mock_read = AsyncMock()
        mock_write = AsyncMock()
        mock_session = AsyncMock()
        mock_session.initialize = AsyncMock()

        with patch('langchain_2ly.mcp.stdio_client') as mock_stdio_client, \
             patch('langchain_2ly.mcp.ClientSession') as mock_client_session, \
             patch('langchain_2ly.mcp.load_mcp_tools') as mock_load_tools:

            mock_stdio_client.return_value.__aenter__.return_value = (mock_read, mock_write)
            mock_client_session.return_value.__aenter__.return_value = mock_session
            mock_client_session.return_value.__aexit__.return_value = None
            mock_load_tools.return_value = []

            mcp = MCPToolset.with_skill_key(skill_key="SKL_test")
            await mcp.start()
            await mcp.get_langchain_tools()
            assert mcp._session is not None

            await mcp.stop()
            assert mcp._session is None
            assert mcp._runner_task is None
            assert mcp._started is False


class TestMCPToolsetEnvironmentVariables:
    """Test environment variable configuration."""

    def test_default_nats_servers(self):
        """Test default NATS servers configuration."""
        mcp = MCPToolset.with_workspace_key(name="test", workspace_key="WSK_test")
        assert mcp.serverParams.env["NATS_SERVERS"] == "nats://localhost:4222"

    def test_custom_nats_servers(self):
        """Test custom NATS servers configuration."""
        mcp = MCPToolset.with_workspace_key(
            name="test",
            workspace_key="WSK_test",
            nats_servers="nats://prod:4222"
        )
        assert mcp.serverParams.env["NATS_SERVERS"] == "nats://prod:4222"

    def test_default_version(self):
        """Test default runtime version."""
        mcp = MCPToolset.with_skill_key(skill_key="SKL_test")
        assert mcp.serverParams.args == ["@2ly/runtime@latest"]

    def test_custom_version(self):
        """Test custom runtime version."""
        mcp = MCPToolset.with_workspace_key(
            name="test",
            workspace_key="WSK_test",
            version="1.5.0"
        )
        assert mcp.serverParams.args == ["@2ly/runtime@1.5.0"]

    def test_no_deprecated_runtime_name(self):
        """Test that RUNTIME_NAME is not set (deprecated)."""
        mcp = MCPToolset.with_workspace_key(name="test", workspace_key="WSK_test")
        assert "RUNTIME_NAME" not in mcp.serverParams.env

    def test_no_deprecated_workspace_id(self):
        """Test that WORKSPACE_ID is not set (deprecated)."""
        mcp = MCPToolset.with_skill_key(skill_key="SKL_test")
        assert "WORKSPACE_ID" not in mcp.serverParams.env
