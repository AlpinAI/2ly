import React from 'react';
import CodeBox from '../../ui/CodeBox';

const LanggraphConnectionInstructions: React.FC<{ natsServer: string; agentName?: string }> = ({ natsServer, agentName }) => {
    const installCommand = 'pip install langchain_2ly';
    const displayAgentName = agentName || 'My Agent';
    const quickStartCode = `# Import MCPAdapter
from langchain_2ly import MCPAdapter${natsServer ? `

# Set the NATS url
nats="nats://${natsServer}"
options={
    "nats_servers": nats
}` : ''}

# Instantiate MCPAdapter
async with MCPAdapter("${displayAgentName}"${natsServer ? `, options` : ''}) as mcp:

    # Retrive tools
    tools = await mcp.get_langchain_tools()
    
    # Create your agent as usual
    agent = create_react_agent(llm, tools)
    agent_response = await agent.ainvoke(...)
`;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">1. Install connector</h3>
            <CodeBox code={installCommand} language="bash" size="small" />
            <p className="text-sm text-gray-700">Contains our MCP Adapter to connect to 2LY Runtime.</p>

            <h3 className="text-lg font-semibold mb-2">2. Use tools in LangGraph</h3>
            <CodeBox code={quickStartCode} language="python" size="small" />
            <p className="text-sm text-gray-700">When instantiating the MCPAdapter, give it the name of your agent. Agents are automatically created in 2ly if they don't yet exist.</p>
            <p><br></br></p>
        </div>
    );
};

export default LanggraphConnectionInstructions;


