import { useEffect, useState } from 'react';
import { observe } from '../services/apollo.client';
import { MCP_TOOLS_SUBSCRIPTION } from '../graphql';

export function useMCPToolsCount(workspaceId: string | undefined): number {
    const [toolsCount, setToolsCount] = useState<number>(0);

    useEffect(() => {
        if (!workspaceId) return;
        const subscription = observe<{ mcpTools: Array<{ id: string }> }>({
            query: MCP_TOOLS_SUBSCRIPTION,
            variables: { workspaceId },
        });

        const subscription$ = subscription.subscribe({
            next: (data) => {
                console.log('MCP tools:', data);
                if (Array.isArray(data.mcpTools)) {
                    setToolsCount(data.mcpTools.length);
                }
            },
            error: (error) => {
                console.error('MCP tools subscription error:', error);
            },
        });

        return () => {
            subscription$.unsubscribe();
        };
    }, [workspaceId]);

    return toolsCount;
}


