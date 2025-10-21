import React from 'react';
import CodeBox from '../ui/CodeBox';

const LangflowConnectionInstructions: React.FC = () => {
    const quickStartCode = `# Import langchain_2ly
from langchain_2ly import MCPAdapter

# Instantiate MCPAdapter and list tools
async with MCPAdapter("my-agent") as mcp:
    tools = await mcp.get_langchain_tools()

# Create your agent with 2ly
agent = create_react_agent(llm, tools)

# Invoke as usual
agent_response = agent.invoke();

`;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">1. Install our connector</h3>
            <CodeBox
                code={`pip install langchain_2ly`}
                language="bash"
                className="text-sm"
            />

            <h3 className="text-lg font-semibold mb-4">2. Launch your agent with 2ly</h3>
            <CodeBox
                code={quickStartCode}
                language="python"
                className="text-sm"
            />
        </div>
    );
};

export default LangflowConnectionInstructions;


