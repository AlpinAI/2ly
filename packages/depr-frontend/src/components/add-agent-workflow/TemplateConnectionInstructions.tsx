import React, { useState } from 'react';
import CodeBox from '../ui/CodeBox';

type TemplateOption = 'N8N' | 'Claude' | 'MCP Inspector';

const TemplateConnectionInstructions: React.FC = () => {
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption>('N8N');

    const n8nConfig = `{
  "type": "mcp",
  "server": "http://localhost:7801",
  "runtime": "@2ly/runtime"
}`;
    const claudeCommand = `npx @2ly/runtime@latest`;
    const inspectorScript = `npx @modelcontextprotocol/inspector npx @2ly/runtime`;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">1. Choose your template</h3>
            <select
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value as TemplateOption)}
            >
                <option value="N8N">N8N</option>
                <option value="Claude">Claude</option>
                <option value="MCP Inspector">MCP Inspector</option>
            </select>

            <h3 className="text-lg font-semibold mb-2">2. Instructions</h3>

            {selectedTemplate === 'N8N' && (
                <div className="space-y-2">
                    <p className="text-sm text-gray-700">Add an MCP Server node with the following configuration:</p>
                    <CodeBox code={n8nConfig} language="json" className="text-sm" />
                </div>
            )}

            {selectedTemplate === 'Claude' && (
                <div className="space-y-2">
                    <p className="text-sm text-gray-700">Use the magic link setup and run the following to add @2ly/runtime:</p>
                    <CodeBox code={claudeCommand} language="bash" className="text-sm" />
                </div>
            )}

            {selectedTemplate === 'MCP Inspector' && (
                <div className="space-y-2">
                    <p className="text-sm text-gray-700">Run the inspector with the runtime using:</p>
                    <CodeBox code={inspectorScript} language="bash" className="text-sm" />
                </div>
            )}
        </div>
    );
};

export default TemplateConnectionInstructions;


