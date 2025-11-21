/**
 * N8N Instructions (New Design)
 *
 * WHY: Platform-specific instructions for connecting N8N to 2LY via STREAM.
 */

export function N8NInstructionsNew() {
  return (
    <div className="space-y-4">
      {/* Image Placeholder */}
      <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 dark:text-gray-500 text-sm">N8N Setup Screenshot</span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Connect N8N to 2LY
      </h3>

      <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700 dark:text-gray-300">
        <li>Open your N8N workflow and add an <strong>MCP Client Tool</strong> node</li>
        <li>Select <strong>Streamable HTTP</strong> as the connection type</li>
        <li>Copy the <strong>STREAM URL</strong> from the settings above and paste it into the URL field</li>
        <li>Configure any additional authentication if required</li>
        <li>Test the connection to verify it works</li>
      </ol>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        The STREAM connection provides real-time bidirectional communication between N8N and your toolset.
      </p>
    </div>
  );
}
