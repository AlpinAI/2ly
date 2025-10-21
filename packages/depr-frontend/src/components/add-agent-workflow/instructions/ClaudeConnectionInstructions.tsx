import React from 'react';
import CodeBox from '../../ui/CodeBox';

const ClaudeConnectionInstructions: React.FC = () => {
    const command = 'npx @2ly/runtime@latest';

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">Run runtime with Claude via MCP</h3>
            <p className="text-sm text-gray-700">Use the magic link setup and run the following:</p>
            <CodeBox code={command} language="bash" className="text-sm" />
        </div>
    );
};

export default ClaudeConnectionInstructions;


