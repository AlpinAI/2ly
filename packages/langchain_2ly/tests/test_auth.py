import pytest
from langchain_2ly.mcp import MCPToolset, _validate_auth
from langchain_2ly.mcp_only import MCPClient


class TestAuthenticationValidation:
    """Test authentication validation logic."""

    def test_validate_auth_requires_one_key(self):
        """Test that at least one authentication key is required."""
        with pytest.raises(ValueError, match="Authentication required"):
            _validate_auth(name="test", master_key=None, toolset_key=None)

    def test_validate_auth_rejects_both_keys(self):
        """Test that both keys cannot be provided together."""
        with pytest.raises(ValueError, match="Authentication conflict"):
            _validate_auth(name="test", master_key="WSK_123", toolset_key="TSK_456")

    def test_validate_auth_master_key_requires_name(self):
        """Test that master_key requires a name."""
        with pytest.raises(ValueError, match="must provide a 'name' parameter"):
            _validate_auth(name=None, master_key="WSK_123", toolset_key=None)

    def test_validate_auth_toolset_key_rejects_name(self):
        """Test that toolset_key must not have a name."""
        with pytest.raises(ValueError, match="do not provide a 'name' parameter"):
            _validate_auth(name="test", master_key=None, toolset_key="TSK_456")

    def test_validate_auth_master_key_with_name_ok(self):
        """Test valid master_key + name combination."""
        # Should not raise
        _validate_auth(name="test", master_key="WSK_123", toolset_key=None)

    def test_validate_auth_toolset_key_without_name_ok(self):
        """Test valid toolset_key without name."""
        # Should not raise
        _validate_auth(name=None, master_key=None, toolset_key="TSK_456")


class TestMCPToolsetAuthentication:
    """Test MCPToolset authentication configuration."""

    def test_init_with_master_key_and_name(self):
        """Test initialization with master_key and name."""
        mcp = MCPToolset(name="test", master_key="WSK_123")

        assert mcp.name == "test"
        assert mcp.serverParams.env["MASTER_KEY"] == "WSK_123"
        assert mcp.serverParams.env["TOOLSET_NAME"] == "test"
        assert "TOOLSET_KEY" not in mcp.serverParams.env

    def test_init_with_toolset_key(self):
        """Test initialization with toolset_key."""
        mcp = MCPToolset(toolset_key="TSK_456")

        assert mcp.name is None
        assert mcp.serverParams.env["TOOLSET_KEY"] == "TSK_456"
        assert "MASTER_KEY" not in mcp.serverParams.env
        assert "TOOLSET_NAME" not in mcp.serverParams.env

    def test_init_with_no_auth_raises(self):
        """Test that initialization without auth raises error."""
        with pytest.raises(ValueError, match="Authentication required"):
            MCPToolset()

    def test_init_with_both_keys_raises(self):
        """Test that initialization with both keys raises error."""
        with pytest.raises(ValueError, match="Authentication conflict"):
            MCPToolset(name="test", master_key="WSK_123", toolset_key="TSK_456")

    def test_with_workspace_key_factory(self):
        """Test with_workspace_key factory method."""
        mcp = MCPToolset.with_workspace_key(name="test", master_key="WSK_123")

        assert mcp.name == "test"
        assert mcp.serverParams.env["MASTER_KEY"] == "WSK_123"
        assert mcp.serverParams.env["TOOLSET_NAME"] == "test"

    def test_with_toolset_key_factory(self):
        """Test with_toolset_key factory method."""
        mcp = MCPToolset.with_toolset_key(toolset_key="TSK_456")

        assert mcp.serverParams.env["TOOLSET_KEY"] == "TSK_456"
        assert "MASTER_KEY" not in mcp.serverParams.env


class TestMCPClientAuthentication:
    """Test MCPClient authentication configuration."""

    def test_init_with_master_key_and_name(self):
        """Test initialization with master_key and name."""
        mcp = MCPClient(name="test", master_key="WSK_123")

        assert mcp.name == "test"
        assert mcp.serverParams.env["MASTER_KEY"] == "WSK_123"
        assert mcp.serverParams.env["TOOLSET_NAME"] == "test"
        assert "TOOLSET_KEY" not in mcp.serverParams.env

    def test_init_with_toolset_key(self):
        """Test initialization with toolset_key."""
        mcp = MCPClient(toolset_key="TSK_456")

        assert mcp.name is None
        assert mcp.serverParams.env["TOOLSET_KEY"] == "TSK_456"
        assert "MASTER_KEY" not in mcp.serverParams.env
        assert "TOOLSET_NAME" not in mcp.serverParams.env

    def test_with_workspace_key_factory(self):
        """Test with_workspace_key factory method."""
        mcp = MCPClient.with_workspace_key(name="test", master_key="WSK_123")

        assert mcp.name == "test"
        assert mcp.serverParams.env["MASTER_KEY"] == "WSK_123"
        assert mcp.serverParams.env["TOOLSET_NAME"] == "test"

    def test_with_toolset_key_factory(self):
        """Test with_toolset_key factory method."""
        mcp = MCPClient.with_toolset_key(toolset_key="TSK_456")

        assert mcp.serverParams.env["TOOLSET_KEY"] == "TSK_456"
        assert "MASTER_KEY" not in mcp.serverParams.env

    def test_log_level_option(self):
        """Test that log_level option is passed to environment."""
        mcp = MCPClient(name="test", master_key="WSK_123", log_level="debug")

        assert mcp.serverParams.env["LOG_LEVEL"] == "debug"


class TestEnvironmentVariables:
    """Test environment variable configuration."""

    def test_nats_servers_default(self):
        """Test default NATS servers."""
        mcp = MCPToolset(name="test", master_key="WSK_123")
        assert mcp.serverParams.env["NATS_SERVERS"] == "nats://localhost:4222"

    def test_nats_servers_custom(self):
        """Test custom NATS servers."""
        mcp = MCPToolset(name="test", master_key="WSK_123", nats_servers="nats://custom:4222")
        assert mcp.serverParams.env["NATS_SERVERS"] == "nats://custom:4222"

    def test_version_default(self):
        """Test default version."""
        mcp = MCPToolset(name="test", master_key="WSK_123")
        assert mcp.serverParams.args == ["@2ly/runtime@latest"]

    def test_version_custom(self):
        """Test custom version."""
        mcp = MCPToolset(name="test", master_key="WSK_123", version="1.2.3")
        assert mcp.serverParams.args == ["@2ly/runtime@1.2.3"]
