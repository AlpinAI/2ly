/**
 * Langflow Instructions (New Design)
 *
 * WHY: Platform-specific instructions for connecting Langflow to 2LY via SSE.
 */

import { CodeBlock } from '@/components/ui/code-block';

interface LangflowInstructionsNewProps {
  sseUrl: string;
}

export function LangflowInstructionsNew({ sseUrl }: LangflowInstructionsNewProps) {
  return (
    <div className="space-y-4">
      {/* Image Placeholder */}
      <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 dark:text-gray-500 text-sm">Langflow Setup Screenshot</span>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
        Connect Langflow to 2LY
      </h3>

      <ol className="list-decimal list-inside space-y-4 text-base leading-relaxed text-gray-700 dark:text-gray-300 font-sans">
        <li>Open your Langflow project and add an <strong>MCP Server</strong> node</li>
        <li>Select <strong>SSE</strong> as the transport type</li>
        <li>
          Copy the <strong>SSE URL</strong> below and paste it into the Server URL field:
          <div className="mt-2">
            <CodeBlock code={sseUrl} language="bash" size="small" />
          </div>
        </li>
        <li>Connect the MCP Server node to your agent or chain</li>
        <li>Run your flow to test the connection</li>
      </ol>

      <p className="text-base text-gray-500 dark:text-gray-400 mt-4 font-sans">
        SSE (Server-Sent Events) provides efficient one-way streaming from the server to Langflow.
      </p>
    </div>
  );
}
