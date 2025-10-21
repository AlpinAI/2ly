import React from 'react';
import CodeBox from '../../ui/CodeBox';

const LangflowConnectionInstructions: React.FC<{ natsServer: string; agentName?: string }> = ({ natsServer, agentName }) => {
    const displayAgentName = agentName || 'My Agent';
    const langflowConfig = {
        "mcpServers": {
            "2ly": {
                "command": "npx",
                "args": [
                    "@2ly/runtime"
                ],
                "env": {
                    "NATS_SERVERS": "nats://localhost:4222",
                    "RUNTIME_NAME": displayAgentName
                }
            }
        }
    };
    if (natsServer) {
        langflowConfig.mcpServers["2ly"].env.NATS_SERVERS = `nats://${natsServer}`;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">Configure MCP Server node</h3>
            <p className="text-sm text-gray-700">Add an MCP Server node with the following configuration:</p>
            <CodeBox code={JSON.stringify(langflowConfig, null, 2)} language="json" size="small" />
        </div>
    );
};

export default LangflowConnectionInstructions;


