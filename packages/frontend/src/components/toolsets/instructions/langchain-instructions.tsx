/**
 * Langchain/Langgraph Connection Instructions
 *
 * WHY: Provides step-by-step instructions for connecting a Langchain or Langgraph
 * agent to 2LY using the langchain_2ly Python package.
 */

import { CodeBlock } from '@/components/ui/code-block';

export interface LangchainInstructionsProps {
  toolsetKey: string;
  natsServer: string;
}

export function LangchainInstructions({ toolsetKey, natsServer }: LangchainInstructionsProps) {
  const installCommand = 'pip install langchain_2ly';

  const quickStartCode = `# Import MCPToolset
from langchain_2ly import MCPToolset
# Configure connection
options={${natsServer ? `
  "nats_servers": "nats://${natsServer},"`: ''}
  "toolset_key": "${toolsetKey}"
}

# Instantiate MCPToolset
async with MCPToolset.with_toolset_key(options) as mcp:

    # Retrieve tools
    tools = await mcp.get_langchain_tools()

    # Create your agent as usual
    agent = create_react_agent(llm, tools)
    agent_response = await agent.ainvoke(...)
`;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        1. Install connector
      </h3>
      <CodeBlock code={installCommand} language="bash" size="small" />
      <p className="text-sm text-gray-700 dark:text-gray-300">
        Contains our MCP Adapter to connect to 2LY Runtime.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-6">
        2. Use tools in Langchain/Langgraph
      </h3>
      <CodeBlock code={quickStartCode} language="python" size="small" />
      <p className="text-sm text-gray-700 dark:text-gray-300">
        When instantiating the MCPAdapter, give it the name of your agent. Agents are
        automatically created in 2ly if they don't yet exist.
      </p>
    </div>
  );
}
