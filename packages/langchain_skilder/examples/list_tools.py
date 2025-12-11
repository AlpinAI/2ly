import asyncio
import os
from dotenv import load_dotenv
from langchain_skilder import MCPClient

# Get Skilder authentication - workspace key for auto-discovery
load_dotenv()
workspace_key = os.environ.get("WORKSPACE_KEY")
if not workspace_key:
    print("Error: Please set the WORKSPACE_KEY environment variable with a workspace key from Skilder")
    print("Get your key from the Skilder UI: Settings > API Keys > Generate New Workspace Key")
    exit(1)

async def main():
    # Using workspace key + skill name for auto-discovery
    async with MCPClient.with_workspace_key(
        name="List Tools Example",
        workspace_key=workspace_key
    ) as mcp:
        tools = await mcp.get_langchain_tools()
        print(f"Found {len(tools)} tools:")
        for tool in tools:
            print(f"  - {tool.name}")

if __name__ == "__main__":
    asyncio.run(main())