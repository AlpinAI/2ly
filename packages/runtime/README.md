# Skilder - Runtime

Runtime process for [Skilder](https://github.com/skilder-ai/skilder) instances. Typically used to consume Skilder as MCP Server from an agent or to execute tool calls on the edge.

## Run as MCP Server

Add the following configuration in your MCP Client. This will run an "agent" on Skilder where you'll be able to add any tools from your instance.

```json
{
  "mcpServers": {
    "skilder": {
      "command": "npx",
      "args": ["@skilder-ai/runtime"],
      "env": {
        "RUNTIME_NAME": "<GIVE_A_NAME_HERE>"
      }
    }
  }
}
```

## Run as a tool executor

Execute the following command in your terminal:

```bash
RUNTIME_NAME=<GIVE_A_NAME_HERE> npx @skilder-ai/runtime
```

This will start a long-living node process with the ability to host MCP Servers and execute their tools from this runtime.