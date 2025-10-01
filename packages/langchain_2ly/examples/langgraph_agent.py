import asyncio
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from pydantic import SecretStr
from langchain_2ly import MCPAdapter
from langgraph.prebuilt import create_react_agent
from format_response import format_agent_response
import openai

# Prepare the LLM
load_dotenv()
token = os.environ.get("GITHUB_TOKEN")
if not token:
    print("Error: Please set the GITHUB_TOKEN environment variable with a valid GitHub token to access Github models")
    exit(1)

endpoint = "https://models.inference.ai.azure.com"
model_name = "gpt-4o-mini"

llm = ChatOpenAI(
    model=model_name,
    temperature=0,
    timeout=None,
    max_retries=2,
    api_key=SecretStr(token),
    base_url=endpoint
)

# Set the prompts
system_prompt = """
    You are a funny assistant adding jokes to any conversations.
"""
user_prompt = "Tell me how many tools you have access to and their names. If you have a tool called 'list_allowed_directories', call it and list the result of this tool call."

async def main():
    try:
        async with MCPAdapter("Langgraph Agent") as mcp:
            tools = await mcp.get_langchain_tools()
            agent = create_react_agent(llm, tools)
            agent_response = await agent.ainvoke({"messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}]})
            format_agent_response(agent_response, user_prompt, model_name)
    except openai.AuthenticationError:
        print("Error: Invalid API key. Please check your GITHUB_TOKEN environment variable and ensure it's a valid GitHub token. If you haven't yet done so, you should copy the env.example file into .env and place your token in it.")
        exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        exit(1)

if __name__ == "__main__":
    asyncio.run(main())