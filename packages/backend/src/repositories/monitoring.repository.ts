import { inject, injectable } from 'inversify';
import { DGraphService } from '../services/dgraph.service';
import { apolloResolversTypes, dgraphResolversTypes } from '@2ly/common';
import {
    ADD_TOOL_CALL,
    COMPLETE_TOOL_CALL_ERROR,
    COMPLETE_TOOL_CALL_SUCCESS,
    QUERY_TOOL_CALLS,
    QUERY_TOOL_CALLS_FILTERED,
} from './monitoring.operations';
import { map, Observable } from 'rxjs';
import { createSubscriptionFromQuery } from '../helpers';

@injectable()
export class MonitoringRepository {
    constructor(@inject(DGraphService) private readonly dgraphService: DGraphService) { }

    async createToolCall(params: {
        calledById: string;
        toolInput: string;
        mcpToolId: string;
    }): Promise<dgraphResolversTypes.ToolCall> {
        const now = new Date().toISOString();
        const res = await this.dgraphService.mutation<{
            addToolCall: { toolCall: dgraphResolversTypes.ToolCall[] };
        }>(ADD_TOOL_CALL, {
            toolInput: params.toolInput,
            calledAt: now,
            calledById: params.calledById,
            mcpToolId: params.mcpToolId
        });
        return res.addToolCall.toolCall[0];
    }

    async completeToolCall(id: string, toolOutput: string, executedById: string): Promise<dgraphResolversTypes.ToolCall> {
        const completedAt = new Date().toISOString();
        const res = await this.dgraphService.mutation<{
            updateToolCall: { toolCall: dgraphResolversTypes.ToolCall[] };
        }>(COMPLETE_TOOL_CALL_SUCCESS, { id, toolOutput, completedAt, executedById });
        return res.updateToolCall.toolCall[0];
    }

    async errorToolCall(id: string, errorMessage: string): Promise<dgraphResolversTypes.ToolCall> {
        const completedAt = new Date().toISOString();
        const res = await this.dgraphService.mutation<{
            updateToolCall: { toolCall: dgraphResolversTypes.ToolCall[] };
        }>(COMPLETE_TOOL_CALL_ERROR, { id, error: errorMessage, completedAt });
        return res.updateToolCall.toolCall[0];
    }

    observeToolCalls(workspaceId: string): Observable<apolloResolversTypes.ToolCall[]> {
        const query = createSubscriptionFromQuery(QUERY_TOOL_CALLS);
        return this.dgraphService
            .observe<{ mcpTools: dgraphResolversTypes.McpTool[] }>(query, { workspaceId }, 'getWorkspace', true)
            .pipe(map((workspace) => workspace.mcpTools.flatMap((mcpTool) => mcpTool.toolCalls).filter(x => x !== null && x !== undefined) || []));
    }

    /**
     * Query tool calls with filtering and pagination
     * @param params Query parameters including workspace, pagination, and filters
     * @returns Paginated tool calls with stats
     */
    async queryToolCalls(params: {
        workspaceId: string;
        limit: number;
        offset: number;
        filters?: apolloResolversTypes.ToolCallFilters;
        orderDirection?: apolloResolversTypes.OrderDirection;
    }): Promise<apolloResolversTypes.ToolCallsResult> {
        // Fetch all tool calls for workspace (through mcpTools)
        const result = await this.dgraphService.query<{
            getWorkspace: {
                mcpTools: Array<{
                    id: string;
                    name: string;
                    description: string;
                    mcpServer: { id: string; name: string };
                    toolCalls: dgraphResolversTypes.ToolCall[];
                }>;
            };
        }>(QUERY_TOOL_CALLS_FILTERED, {
            workspaceId: params.workspaceId,
        });

        // Flatten tool calls from all tools and add mcpTool reference
        const allToolCalls: apolloResolversTypes.ToolCall[] = [];
        if (result.getWorkspace?.mcpTools) {
            result.getWorkspace.mcpTools.forEach((mcpTool) => {
                if (mcpTool.toolCalls) {
                    mcpTool.toolCalls.forEach((call) => {
                        // WHY: Cast through unknown because we only populate fields needed by resolvers
                        // The GraphQL resolver will only return the fields requested by the client
                        allToolCalls.push({
                            ...call,
                            mcpTool: {
                                id: mcpTool.id,
                                name: mcpTool.name,
                                description: mcpTool.description,
                                mcpServer: mcpTool.mcpServer,
                            },
                        } as unknown as apolloResolversTypes.ToolCall);
                    });
                }
            });
        }

        // Apply filters
        let filteredCalls = allToolCalls;

        if (params.filters?.status && params.filters.status.length > 0) {
            filteredCalls = filteredCalls.filter((call) =>
                params.filters!.status!.includes(call.status as apolloResolversTypes.ToolCallStatus)
            );
        }

        if (params.filters?.mcpToolIds && params.filters.mcpToolIds.length > 0) {
            filteredCalls = filteredCalls.filter((call) =>
                params.filters!.mcpToolIds!.includes(call.mcpTool.id)
            );
        }

        if (params.filters?.runtimeIds && params.filters.runtimeIds.length > 0) {
            filteredCalls = filteredCalls.filter((call) =>
                params.filters!.runtimeIds!.includes(call.calledBy.id) ||
                (call.executedBy && params.filters!.runtimeIds!.includes(call.executedBy.id))
            );
        }

        // Apply search filter (case-insensitive)
        if (params.filters?.search && params.filters.search.trim()) {
            const searchLower = params.filters.search.toLowerCase().trim();
            filteredCalls = filteredCalls.filter((call) => {
                const toolName = call.mcpTool.name?.toLowerCase() || '';
                const toolDescription = call.mcpTool.description?.toLowerCase() || '';
                const toolInput = call.toolInput?.toLowerCase() || '';
                const toolOutput = call.toolOutput?.toLowerCase() || '';
                const error = call.error?.toLowerCase() || '';

                return (
                    toolName.includes(searchLower) ||
                    toolDescription.includes(searchLower) ||
                    toolInput.includes(searchLower) ||
                    toolOutput.includes(searchLower) ||
                    error.includes(searchLower)
                );
            });
        }

        // Apply sorting by calledAt date
        filteredCalls.sort((a, b) => {
            const dateA = new Date(a.calledAt).getTime();
            const dateB = new Date(b.calledAt).getTime();

            // Default to DESC (newest first) if not specified
            const direction = params.orderDirection || 'DESC';

            if (direction === 'ASC') {
                return dateA - dateB; // Oldest first
            } else {
                return dateB - dateA; // Newest first
            }
        });

        // Calculate stats from all calls (before pagination)
        const stats: apolloResolversTypes.ToolCallStats = {
            total: filteredCalls.length,
            pending: filteredCalls.filter((c) => c.status === 'PENDING').length,
            completed: filteredCalls.filter((c) => c.status === 'COMPLETED').length,
            failed: filteredCalls.filter((c) => c.status === 'FAILED').length,
            avgDuration: null, // TODO: Calculate from completed calls
        };

        // Apply pagination
        const paginatedCalls = filteredCalls.slice(params.offset, params.offset + params.limit);

        return {
            toolCalls: paginatedCalls,
            totalCount: filteredCalls.length,
            hasMore: filteredCalls.length > params.offset + params.limit,
            stats,
        };
    }

}


