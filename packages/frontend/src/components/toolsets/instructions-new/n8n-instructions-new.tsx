/**
 * N8N Instructions (New Design)
 *
 * WHY: Platform-specific instructions for connecting N8N to 2LY via STREAM.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { CodeBlock } from '@/components/ui/code-block';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface N8NInstructionsNewProps {
  streamUrl: string;
}

export function N8NInstructionsNew({ streamUrl }: N8NInstructionsNewProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

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

      <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300 [&>svg]:text-amber-800 dark:[&>svg]:text-amber-300">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Docker Users</AlertTitle>
        <AlertDescription>
          If you are running n8n in Docker, you must use <code>host.docker.internal</code> instead of <code>localhost</code> to reach 2LY.
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        >
          <span>Advanced configuration</span>
          {isAdvancedOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </button>
        
        {isAdvancedOpen && (
          <div className="bg-white p-4 dark:bg-gray-900">
            <ul className="list-disc list-inside space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <li>Learn how to connect with a header key instead of query string parameter</li>
              <li>Learn how to connect with the master key and a toolset name instead of the toolset key</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
