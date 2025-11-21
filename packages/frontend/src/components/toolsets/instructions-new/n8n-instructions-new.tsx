/**
 * N8N Instructions (New Design)
 *
 * WHY: Platform-specific instructions for connecting N8N to 2LY via STREAM.
 */

import { CodeBlock } from '@/components/ui/code-block';

interface N8NInstructionsNewProps {
  streamUrl: string;
}

export function N8NInstructionsNew({ streamUrl }: N8NInstructionsNewProps) {
  return (
    <div className="space-y-4">
      {/* Screenshot */}
      <img
        src="/connect-instructions/n8n.png"
        alt="N8N MCP Client configuration"
        className="w-auto rounded-lg border border-gray-200 dark:border-gray-700"
      />

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Connect N8N to 2LY
      </h3>

      <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700 dark:text-gray-300">
        <li>Open your N8N workflow and add an <strong>MCP Client</strong> node</li>
        <li>Select <strong>HTTP Streamable</strong> as the connection type</li>
        <li>
          Copy the <strong>STREAM URL</strong> below and paste it into the URL field:
          <div className="mt-2">
            <CodeBlock code={streamUrl} language="bash" size="small" />
          </div>
        </li>
      </ol>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        The STREAM connection provides real-time bidirectional communication between N8N and your toolset.
      </p>

      <hr className="border-t border-gray-200 dark:border-gray-700 my-6" />

      <h4 className="text-base font-semibold text-gray-900 dark:text-white">Advanced configuration</h4>
      <ul className="list-disc list-inside space-y-3 text-sm text-gray-700 dark:text-gray-300">
        <li>Learn how to connect with a header key instead of query string parameter</li>
        <li>Learn how to connect with the master key and a toolset name instead of the toolset key</li>
      </ul>
    </div>
  );
}
