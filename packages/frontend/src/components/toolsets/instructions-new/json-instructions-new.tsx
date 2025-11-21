/**
 * JSON Instructions (New Design)
 *
 * WHY: Generic JSON configuration instructions for custom integrations via STDIO.
 */

export function JSONInstructionsNew() {
  return (
    <div className="space-y-4">
      {/* Image Placeholder */}
      <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 dark:text-gray-500 text-sm">JSON Configuration Example</span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        JSON Configuration
      </h3>

      <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700 dark:text-gray-300">
        <li>Copy the <strong>STDIO configuration</strong> JSON from the settings above</li>
        <li>Add it to your MCP client configuration file (e.g., <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">mcp.json</code>)</li>
        <li>The configuration uses npx to run the @2ly/runtime package</li>
        <li>The TOOLSET_KEY environment variable authenticates your connection</li>
        <li>Start your MCP client to connect to the toolset</li>
      </ol>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        This generic configuration works with any MCP-compatible client that supports STDIO transport.
      </p>
    </div>
  );
}
