# langchain_2ly

2ly python module providing helpers to quickly connect [2ly](https://github.com/2ly-ai/2ly) to your agents in Python.

## Installation

```bash
pip install langchain_2ly
```

## Authentication

Before using the package, you need authentication credentials from your 2ly workspace. There are two authentication approaches:

### Approach 1: Workspace Key (Auto-Discovery)

Use a workspace-level key that can create and access any toolset in your workspace. This approach enables auto-discovery and creation of toolsets at runtime.

**Get your key:**
1. Open the 2ly UI
2. Go to Settings > API Keys
3. Click "Generate New Master Key"
4. Copy the key (starts with `WSK_`)

### Approach 2: Toolset-Specific Key (Recommended)

Use a toolset-specific key for granular security - each key only has access to one specific toolset. This is the recommended approach due to better security through limited scope.

**Get your key:**
1. Open the 2ly UI
2. Go to the Toolsets page
3. Create or select a toolset
4. Copy the toolset key (starts with `TSK_`)

## Quick Start

### Using Workspace Key (Auto-Discovery)

```python
import asyncio
from langchain_2ly import MCPToolset
from langgraph.prebuilt import create_react_agent

async def main():
    # Automatically creates or connects to a toolset named "My Agent"
    async with MCPToolset.with_workspace_key(
        name="My Agent",
        master_key="WSK_your_workspace_key_here"
    ) as mcp:
        tools = await mcp.get_langchain_tools()
        agent = create_react_agent(llm, tools)
        response = await agent.ainvoke({"messages": [{"role": "user", "content": "Hello!"}]})

if __name__ == "__main__":
    asyncio.run(main())
```

### Using Toolset-Specific Key (Recommended)

```python
import asyncio
from langchain_2ly import MCPToolset

async def main():
    # Uses a pre-created toolset with its own key
    async with MCPToolset.with_toolset_key(
        toolset_key="TSK_your_toolset_key_here"
    ) as mcp:
        tools = await mcp.get_langchain_tools()
        agent = create_react_agent(llm, tools)
        response = await agent.ainvoke({"messages": [{"role": "user", "content": "Hello!"}]})

if __name__ == "__main__":
    asyncio.run(main())
```

## API Classes

### MCPToolset

`MCPToolset` uses the [Langchain MCP adapters](https://github.com/langchain-ai/langchain-mcp-adapters) internally. This is the recommended class for most use cases.

**Factory methods:**
- `MCPToolset.with_workspace_key(name, master_key, ...)` - Auto-discovery mode
- `MCPToolset.with_toolset_key(toolset_key, ...)` - Toolset-specific mode (recommended)

**Constructor:**
```python
MCPToolset(
    name=None,                      # Toolset name (required with master_key)
    master_key=None,                # Workspace key WSK_...
    toolset_key=None,               # Toolset key TSK_...
    nats_servers="nats://localhost:4222",
    version="latest",               # @2ly/runtime npm version
    startup_timeout_seconds=20.0
)
```

### MCPClient

`MCPClient` is based strictly on the [Official MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) without the Langchain adapter dependency. The API is identical to `MCPToolset`.

**Factory methods:**
- `MCPClient.with_workspace_key(name, master_key, ...)` - Auto-discovery mode
- `MCPClient.with_toolset_key(toolset_key, ...)` - Toolset-specific mode (recommended)

**Constructor:**
```python
MCPClient(
    name=None,                      # Toolset name (required with master_key)
    master_key=None,                # Workspace key WSK_...
    toolset_key=None,               # Toolset key TSK_...
    nats_servers="nats://localhost:4222",
    version="latest",               # @2ly/runtime npm version
    startup_timeout_seconds=20.0,
    log_level=None                  # Optional: "info", "debug", "warn"
)
```

## Lifecycle Management

Both classes start the MCP runtime process lazily when you first call `get_langchain_tools()`. Using the `async with` context manager automatically handles cleanup:

```python
async with MCPToolset.with_workspace_key(name="Agent", master_key=key) as mcp:
    tools = await mcp.get_langchain_tools()
    # Use tools...
    # Automatic cleanup when exiting context
```

Alternatively, call `start()` and `stop()` manually:

```python
mcp = MCPToolset.with_workspace_key(name="Agent", master_key=key)
await mcp.start()
tools = await mcp.get_langchain_tools()
# Use tools...
await mcp.stop()
```

## Examples

All examples are in the `examples/` directory:

* **[langgraph_agent.py](examples/langgraph_agent.py)** - LangGraph agent with MCPToolset (workspace key)
* **[toolset_key_agent.py](examples/toolset_key_agent.py)** - LangGraph agent with toolset-specific key
* **[langgraph_without_adapter.py](examples/langgraph_without_adapter.py)** - LangGraph agent with MCPClient
* **[list_tools.py](examples/list_tools.py)** - Simple tool listing example

### Running Examples

1. Copy the example environment file:
```bash
cp examples/env.example examples/.env
```

2. Edit `examples/.env` and add your credentials:
```bash
GITHUB_TOKEN=github_pat_your_token_here
MASTER_KEY=WSK_your_workspace_key_here
```

3. Run an example:
```bash
cd examples
python langgraph_agent.py
```

# Development

## Prepare your venv

```bash
cd packages/langchain_2ly
python3.11 -m venv .venv # any version python3.10+ will do
source .venv/bin/activate
pip install --upgrade pip
pip install -e ".[all]"
```

## Execute tests

```bash
pytest
```

## Build locally

```bash
python -m build
```

## Test local installation

```bash
# update the filename to the build version
pip install dist/langchain_2ly-0.1.0-py3-none-any.whl --force-reinstall
```

## Run the examples

```bash
python examples/list_tools.py
python examples/langgraph_agent.py
python examples/langgraph_without_adapter.py
```