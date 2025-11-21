/**
 * Langchain Instructions (New Design)
 *
 * WHY: Platform-specific instructions for connecting Langchain/Langgraph to 2LY via STDIO.
 */

import { CodeBlock } from '@/components/ui/code-block';

export interface LangchainInstructionsNewProps {
  toolsetKey: string;
}

export function LangchainInstructionsNew({ toolsetKey }: LangchainInstructionsNewProps) {
  const installCommand = 'pip install langchain_2ly';

  const quickStartCode = `from langchain_2ly import MCPToolset

options = {
    "toolset_key": "${toolsetKey || '<toolset_key>'}"
}

async with MCPToolset.with_toolset_key(options) as mcp:
    tools = await mcp.get_langchain_tools()
    agent = create_react_agent(llm, tools)
    response = await agent.ainvoke(...)`;

  return (
    <div className="space-y-4">
      {/* Image Placeholder */}
      <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 dark:text-gray-500 text-sm">Langchain Setup Screenshot</span>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
        Connect Langchain/Langgraph to 2LY
      </h3>

      <ol className="list-decimal list-inside space-y-4 text-base leading-relaxed text-gray-700 dark:text-gray-300 font-sans">
        <li>
          Install the langchain_2ly package:
          <div className="mt-2">
            <CodeBlock code={installCommand} language="bash" size="small" />
          </div>
        </li>
        <li>
          Use the MCPToolset in your code:
          <div className="mt-2">
            <CodeBlock code={quickStartCode} language="python" size="small" />
          </div>
        </li>
        <li>The STDIO configuration from settings above can be used for alternative runtime setup</li>
      </ol>

      <p className="text-base text-gray-500 dark:text-gray-400 mt-4 font-sans">
        STDIO provides local process-based communication, ideal for Python environments.
      </p>
    </div>
  );
}
