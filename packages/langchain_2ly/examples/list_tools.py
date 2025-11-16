import asyncio
import os
from dotenv import load_dotenv
from langchain_2ly import MCPClient

# Get 2ly authentication - workspace key for auto-discovery
load_dotenv()
master_key = os.environ.get("MASTER_KEY")
if not master_key:
    print("Error: Please set the MASTER_KEY environment variable with a workspace key from 2ly")
    print("Get your key from the 2ly UI: Settings > API Keys > Generate New Master Key")
    exit(1)

async def main():
    # Using workspace key + toolset name for auto-discovery
    async with MCPClient.with_workspace_key(
        name="List Tools Example",
        master_key=master_key
    ) as mcp:
        tools = await mcp.get_langchain_tools()
        print(f"Found {len(tools)} tools:")
        for tool in tools:
            print(f"  - {tool.name}")

if __name__ == "__main__":
    asyncio.run(main())