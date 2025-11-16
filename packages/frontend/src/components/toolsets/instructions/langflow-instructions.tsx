/**
 * Langflow Connection Instructions
 *
 * WHY: Provides step-by-step instructions for connecting a Langflow workflow
 * to 2LY using the MCP Server node.
 */

import { CodeBlock } from '@/components/ui/code-block';

export interface LangflowInstructionsProps {
  agentName: string;
  natsServer: string;
}

export function LangflowInstructions({ agentName, natsServer }: LangflowInstructionsProps) {
  const langflowConfig = {
    mcpServers: {
      '2ly': {
        command: 'npx',
        args: ['@2ly/runtime'],
        env: {
          NATS_SERVERS: natsServer ? `nats://${natsServer}` : 'nats://localhost:4222',
          RUNTIME_NAME: agentName,
        },
      },
    },
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Configure MCP Server node
      </h3>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        Add an MCP Server node with the following configuration:
      </p>
      <CodeBlock code={JSON.stringify(langflowConfig, null, 2)} language="json" size="small" />

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          This configuration will connect your Langflow workflow to the 2LY runtime, giving you
          access to all configured tools.
        </p>
      </div>
    </div>
  );
}
