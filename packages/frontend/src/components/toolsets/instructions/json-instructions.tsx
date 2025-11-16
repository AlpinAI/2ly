/**
 * JSON Configuration Instructions
 *
 * WHY: Provides instructions for connecting agents using a generic JSON configuration.
 * Useful for custom integrations or platforms not explicitly supported.
 */

import { CodeBlock } from '@/components/ui/code-block';
import { sanitizeIdentifier } from '@/lib/utils';

export interface JSONInstructionsProps {
  agentName: string;
  natsServer: string;
  sanitizeAgentName?: boolean;
}

export function JSONInstructions({ agentName, natsServer, sanitizeAgentName = false }: JSONInstructionsProps) {
  const sanitizedAgentName = sanitizeAgentName ? sanitizeIdentifier(agentName) : agentName;

  const jsonConfigExample = `{
  "mcpServers": {
    "${sanitizedAgentName}": {
      "command": "npx",
      "args": [
        "-y",
        "@2ly/runtime"
      ],
      "env": {
        "RUNTIME_NAME": "${agentName}",
        "NATS_SERVERS": "nats://${natsServer || 'your-nats-server:4222'}"
      }
    }
  }
}`;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          Connect your agent using a JSON configuration file. This method provides flexibility for
          custom integrations.
        </p>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        1. Create your configuration file
      </h3>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
        Locate the configuration file for your agent, like{' '}
        <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
          config.json
        </code>{' '}
        and add the following server configuration:
      </p>
      <CodeBlock code={jsonConfigExample} language="json" size="small" />

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-6">
        2. Configure your agent
      </h3>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
        Update the configuration with your specific details:
      </p>
      <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1 mb-3">
        <li>
          <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
            RUNTIME_NAME
          </code>
          : A unique name for your agent
        </li>
        <li>
          <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
            NATS_SERVERS
          </code>
          : The NATS server of your 2ly instance
        </li>
      </ul>

      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Additional Resources
        </h4>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <li>• Ensure your NATS server is accessible from your agent</li>
          <li>• Use the configuration to initialize your MCP connection</li>
          <li>• Refer to your agent framework's documentation for integration details</li>
        </ul>
      </div>
    </div>
  );
}
