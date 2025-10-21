/**
 * N8N Connection Instructions
 *
 * WHY: Provides step-by-step instructions for connecting an N8N workflow
 * to 2LY using the MCP Client Tool.
 */

export interface N8NInstructionsProps {
  agentName: string;
}

export function N8NInstructions({ agentName }: N8NInstructionsProps) {
  // agentName is available for future use
  void agentName;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        1. Add an AI Agent in your workflow
      </h3>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        In the bottom of the AI Agent node you can click on + to add Tools
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-6">
        2. Choose the MCP Client Tool
      </h3>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">And configure as such:</p>
      <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-3">
        <li>
          <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
            Endpoint
          </code>
          : runtime_host/mcp:3001 where runtime_host points to a valid URL of a connected 2ly
          runtime.
        </li>
        <li>
          <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
            Server Transport
          </code>
          : HTTP Streamable
        </li>
        <li>
          <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
            Authentication
          </code>
          : None
        </li>
      </ul>

      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          At this stage, only a single agent is supported on n8n — but we're working on enabling
          multi-agent support for remote connections.
        </p>
      </div>
    </div>
  );
}
