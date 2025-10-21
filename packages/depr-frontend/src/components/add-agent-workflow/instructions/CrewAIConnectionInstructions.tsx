import React from 'react';
import CodeBox from '../../ui/CodeBox';

const CrewAIConnectionInstructions: React.FC = () => {
    const setup = `# Install 2ly runtime for tool exposure\nnpm i -g @2ly/runtime\n\n# Start runtime and register tools\n2ly-runtime start`;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">Expose tools to CrewAI via MCP</h3>
            <CodeBox code={setup} language="bash" className="text-sm" />
        </div>
    );
};

export default CrewAIConnectionInstructions;


