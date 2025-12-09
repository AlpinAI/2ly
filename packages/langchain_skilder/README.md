# langchain_skilder

Skilder python module providing helpers to quickly connect [Skilder](https://github.com/skilder-ai/skilder) to your agents in Python.

## Installation

```bash
pip install langchain_skilder
```

## Authentication

Before using the package, you need authentication credentials from your Skilder workspace. There are two authentication approaches:

### Approach 1: Workspace Key (Auto-Discovery)

Use a workspace-level key that can create and access any skill in your workspace. This approach enables auto-discovery and creation of skills at runtime.

**Get your key:**
1. Open the Skilder UI
2. Go to Settings > API Keys
3. Click "Generate New Workspace Key"
4. Copy the key (starts with `WSK_`)

### Approach 2: Skill-Specific Key (Recommended)

Use a skill-specific key for granular security - each key only has access to one specific skill. This is the recommended approach due to better security through limited scope.

**Get your key:**
1. Open the Skilder UI
2. Go to the Skills page
3. Create or select a skill
4. Copy the skill key (starts with `SKL_`)

## Quick Start

### Using Workspace Key (Auto-Discovery)

```python
import asyncio
from langchain_skilder import MCPSkill
from langgraph.prebuilt import create_react_agent

async def main():
    # Automatically creates or connects to a skill named "My Agent"
    async with MCPSkill.with_workspace_key(
        name="My Agent",
        workspace_key="WSK_your_workspace_key_here"
    ) as mcp:
        tools = await mcp.get_langchain_tools()
        agent = create_react_agent(llm, tools)
        response = await agent.ainvoke({"messages": [{"role": "user", "content": "Hello!"}]})

if __name__ == "__main__":
    asyncio.run(main())
```

### Using Skill-Specific Key (Recommended)

```python
import asyncio
from langchain_skilder import MCPSkill

async def main():
    # Uses a pre-created skill with its own key
    async with MCPSkill.with_skill_key(
        skill_key="SKL_your_skill_key_here"
    ) as mcp:
        tools = await mcp.get_langchain_tools()
        agent = create_react_agent(llm, tools)
        response = await agent.ainvoke({"messages": [{"role": "user", "content": "Hello!"}]})

if __name__ == "__main__":
    asyncio.run(main())
```

## API Classes

### MCPSkill

`MCPSkill` uses the [Langchain MCP adapters](https://github.com/langchain-ai/langchain-mcp-adapters) internally. This is the recommended class for most use cases.

**Factory methods:**
- `MCPSkill.with_workspace_key(name, workspace_key, ...)` - Auto-discovery mode
- `MCPSkill.with_skill_key(skill_key, ...)` - Skill-specific mode (recommended)

**Constructor:**
```python
MCPSkill(
    name=None,                      # Skill name (required with workspace_key)
    workspace_key=None,                # Workspace key WSK_...
    skill_key=None,               # Skill key SKL_...
    nats_servers="nats://localhost:4222",
    version="latest",               # @skilder-ai/runtime npm version
    startup_timeout_seconds=20.0
)
```

### MCPClient

`MCPClient` is based strictly on the [Official MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) without the Langchain adapter dependency. The API is identical to `MCPSkill`.

**Factory methods:**
- `MCPClient.with_workspace_key(name, workspace_key, ...)` - Auto-discovery mode
- `MCPClient.with_skill_key(skill_key, ...)` - Skill-specific mode (recommended)

**Constructor:**
```python
MCPClient(
    name=None,                      # Skill name (required with workspace_key)
    workspace_key=None,                # Workspace key WSK_...
    skill_key=None,               # Skill key SKL_...
    nats_servers="nats://localhost:4222",
    version="latest",               # @skilder-ai/runtime npm version
    startup_timeout_seconds=20.0,
    log_level=None                  # Optional: "info", "debug", "warn"
)
```

## Lifecycle Management

Both classes start the MCP runtime process lazily when you first call `get_langchain_tools()`. Using the `async with` context manager automatically handles cleanup:

```python
async with MCPSkill.with_workspace_key(name="Agent", workspace_key=key) as mcp:
    tools = await mcp.get_langchain_tools()
    # Use tools...
    # Automatic cleanup when exiting context
```

Alternatively, call `start()` and `stop()` manually:

```python
mcp = MCPSkill.with_workspace_key(name="Agent", workspace_key=key)
await mcp.start()
tools = await mcp.get_langchain_tools()
# Use tools...
await mcp.stop()
```

## Examples

All examples are in the `examples/` directory:

* **[langgraph_agent.py](examples/langgraph_agent.py)** - LangGraph agent with MCPSkill (workspace key)
* **[skill_key_agent.py](examples/skill_key_agent.py)** - LangGraph agent with skill-specific key
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
WORKSPACE_KEY=WSK_your_workspace_key_here
```

3. Run an example:
```bash
cd examples
python langgraph_agent.py
```

# Development

## Prepare your venv

```bash
cd packages/langchain_skilder
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
pip install dist/langchain_skilder-0.1.0-py3-none-any.whl --force-reinstall
```

## Run the examples

```bash
python examples/list_tools.py
python examples/langgraph_agent.py
python examples/langgraph_without_adapter.py
```