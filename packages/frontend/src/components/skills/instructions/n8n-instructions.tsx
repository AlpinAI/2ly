/**
 * N8N Instructions (New Design)
 *
 * WHY: Platform-specific instructions for connecting N8N to Skilder via STREAM.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { CodeBlock } from '@/components/ui/code-block';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface N8NInstructionsProps {
  streamUrl: string;
}

export function N8NInstructions({ streamUrl }: N8NInstructionsProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Screenshot */}
      <img
        src="/connect-instructions/n8n.png"
        alt="N8N MCP Client configuration"
        className="w-auto rounded-lg border border-gray-200 dark:border-gray-700"
      />

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
        Connect N8N to Skilder
      </h3>

      <ol className="font-sans list-decimal list-inside space-y-1 text-base leading-relaxed text-gray-700 dark:text-gray-300">
        <li>Open your N8N workflow and add an <strong>MCP Client</strong> node</li>
        <li>Select <strong>HTTP Streamable</strong> as the connection type</li>
        <li>
          Copy the <strong>STREAM URL</strong> below and paste it into the URL field:
          <div className="mt-2">
            <CodeBlock code={streamUrl} language="bash" size="small" />
          </div>
        </li>
      </ol>

      {(streamUrl.includes('localhost') || streamUrl.includes('127.0.0.1')) && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300 [&>svg]:text-amber-800 dark:[&>svg]:text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Docker Users</AlertTitle>
          <AlertDescription className="font-sans">
            If you are running n8n in Docker, you must use <code>host.docker.internal</code> instead of <code>localhost</code> to reach Skilder.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left text-base font-medium text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
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

            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">Send the skill key as a header instead of query string</h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-sans">
              To improve security, pass the key as a header instead of a query parameter:
              <ol className="list-decimal list-inside mt-1 space-y-1 ml-1">
                <li>Remove <code>?key=...</code> from the URL</li>
                <li>Add a header named <code className="font-bold text-gray-800 dark:text-gray-200">SKILL_KEY</code> with your key value</li>
              </ol>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
