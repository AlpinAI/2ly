import React from 'react';
import Status from '../ui/Status';
import { apolloResolversTypes } from '@2ly/common';

interface MCPToolCardProps {
    tool: apolloResolversTypes.McpTool;
    mcpServer: apolloResolversTypes.McpServer;
}

const MCPToolCard: React.FC<MCPToolCardProps> = ({ tool }) => {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="mb-2">
                        <h3 className="text-sm font-medium text-gray-900">{tool.name}</h3>
                    </div>

                    <p
                        className="mb-3 text-xs text-gray-500 line-clamp-3 cursor-help"
                        title={tool.description}
                    >
                        {tool.description}
                    </p>

                </div>

                <div className="ml-4 flex-shrink-0">
                    <Status status={tool.status} size="sm" />
                </div>
            </div>
        </div>
    );
};

export default MCPToolCard;
