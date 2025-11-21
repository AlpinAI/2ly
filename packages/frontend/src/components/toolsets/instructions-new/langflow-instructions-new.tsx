/**
 * Langflow Instructions (New Design)
 *
 * WHY: Platform-specific instructions for connecting Langflow to 2LY via SSE.
 */

import { CodeBlock } from '@/components/ui/code-block';

interface LangflowInstructionsNewProps {
  sseUrl: string;
  toolsetName: string;
}

export function LangflowInstructionsNew({ sseUrl, toolsetName }: LangflowInstructionsNewProps) {
  return (
    <div className="space-y-4">
      {/* Screenshot */}
      <img
        src="/connect-instructions/langflow.png"
        alt="Langflow MCP Client configuration"
        className="w-auto rounded-lg border border-gray-200 dark:border-gray-700"
      />

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
        Connect Langflow to 2LY
      </h3>

      <ol className="list-decimal list-inside space-y-4 text-base leading-relaxed text-gray-700 dark:text-gray-300 font-sans">
        <li>Open your Langflow project and add an <strong>MCP Tools</strong> component</li>
        <li>Click <strong>Add MCP Server</strong> or use the dropdown to select or add a new server</li>
        <li>Select <strong>SSE</strong> as the transport type</li>
        <li>Give it a name: <strong>{toolsetName}</strong></li>
        <li>
          Copy the <strong>SSE URL</strong> below and paste it into the Server URL field:
          <div className="mt-2">
            <CodeBlock code={sseUrl} language="bash" size="small" />
          </div>
        </li>
        <li>Click <strong>Add Server</strong></li>
        <li>At the top of the component, toggle the <strong>Tool Mode</strong> switch</li>
        <li>Now you can plug the Toolset output into your agent Tools input</li>
      </ol>
    </div>
  );
}
