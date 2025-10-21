import React from 'react';
import CodeBox from '../../ui/CodeBox';

const InspectorConnectionInstructions: React.FC = () => {
    const script = 'npx @modelcontextprotocol/inspector npx @2ly/runtime';

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">Inspect tools with MCP Inspector</h3>
            <CodeBox code={script} language="bash" className="text-sm" />
        </div>
    );
};

export default InspectorConnectionInstructions;


