import { inject, injectable } from 'inversify';
import { DGraphService } from '../../services/dgraph.service';
import { apolloResolversTypes, dgraphResolversTypes } from '@skilder-ai/common';
import {
    AddToolCallDocument,
    SetCalledByDocument,
    SetMcpToolDocument,
    SetSkillDocument,
    CompleteToolCallErrorDocument,
    CompleteToolCallSuccessDocument,
    QueryToolCallsDocument,
    QueryToolCallsFilteredDocument,
    SetExecutedByAgentDocument,
    SetExecutedByDocument,
} from '../../generated/dgraph';
import { map, Observable } from 'rxjs';
import { createSubscriptionFromQuery } from '../../helpers';

@injectable()
export class MonitoringRepository {
    constructor(@inject(DGraphService) private readonly dgraphService: DGraphService) { }

    async createToolCall(params: {
        isTest?: boolean;
        calledById?: string;
        toolInput: string;
        mcpToolId?: string;  // Optional - for MCP tool calls
        skillId?: string;    // Optional - for smart skill calls
    }): Promise<dgraphResolversTypes.ToolCall> {
        const now = new Date().toISOString();

        // Step 1: Create basic ToolCall (without mcpTool, skill, or calledBy)
        const res = await this.dgraphService.mutation(AddToolCallDocument, {
            toolInput: params.toolInput,
            calledAt: now,
            isTest: params.isTest ?? false,
        });

        let toolCall = res.addToolCall!.toolCall![0]!;

        // Step 2: Link mcpTool OR skill (mutually exclusive)
        if (params.mcpToolId) {
            const updateRes = await this.dgraphService.mutation(SetMcpToolDocument, {
                id: toolCall.id,
                mcpToolId: params.mcpToolId
            });
            toolCall = updateRes.updateToolCall!.toolCall![0]! as dgraphResolversTypes.ToolCall;
        } else if (params.skillId) {
            const updateRes = await this.dgraphService.mutation(SetSkillDocument, {
                id: toolCall.id,
                skillId: params.skillId
            });
            toolCall = updateRes.updateToolCall!.toolCall![0]! as dgraphResolversTypes.ToolCall;
        }

        // Step 3: If calledById provided, link the caller
        if (params.calledById) {
            const updateRes = await this.dgraphService.mutation(SetCalledByDocument, {
                id: toolCall.id,
                calledById: params.calledById
            });
            return updateRes.updateToolCall!.toolCall![0]! as dgraphResolversTypes.ToolCall;
        }

        return toolCall as dgraphResolversTypes.ToolCall;
    }

    async completeToolCall(id: string, toolOutput: string, executedByIdOrAgent: string | 'AGENT'): Promise<dgraphResolversTypes.ToolCall> {
        const completedAt = new Date().toISOString();
        const res = await this.dgraphService.mutation(CompleteToolCallSuccessDocument, { id, toolOutput, completedAt });
        await this.setExecutedBy(id, executedByIdOrAgent);
        return res.updateToolCall!.toolCall![0]! as dgraphResolversTypes.ToolCall;
    }

    async errorToolCall(id: string, errorMessage: string, executedByIdOrAgent: string | 'AGENT' | undefined): Promise<dgraphResolversTypes.ToolCall> {
        const completedAt = new Date().toISOString();
        const res = await this.dgraphService.mutation(CompleteToolCallErrorDocument, { id, error: errorMessage, completedAt });
        await this.setExecutedBy(id, executedByIdOrAgent);
        return res.updateToolCall!.toolCall![0]! as dgraphResolversTypes.ToolCall;
    }

    async setExecutedBy(id: string, executedByIdOrAgent: string | 'AGENT' | undefined) {
        if (executedByIdOrAgent === 'AGENT') {
            await this.dgraphService.mutation(SetExecutedByAgentDocument, { id });
        } else if (executedByIdOrAgent) {
            await this.dgraphService.mutation(SetExecutedByDocument, { id, executedById: executedByIdOrAgent });
        }
    }

    observeToolCalls(workspaceId: string): Observable<apolloResolversTypes.ToolCall[]> {
        const query = createSubscriptionFromQuery(QueryToolCallsDocument);
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
        // Fetch all tool calls for workspace (through mcpTools AND skills)
        const result = await this.dgraphService.query(QueryToolCallsFilteredDocument, {
            workspaceId: params.workspaceId,
        });

        // Flatten tool calls from all tools and skills
        const allToolCalls: apolloResolversTypes.ToolCall[] = [];

        // Add MCP tool calls with mcpTool reference
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

        // Add skill tool calls with skill reference
        if (result.getWorkspace?.skills) {
            result.getWorkspace.skills.forEach((skill) => {
                if (skill.skillToolCalls) {
                    skill.skillToolCalls.forEach((call) => {
                        allToolCalls.push({
                            ...call,
                            skill: {
                                id: skill.id,
                                name: skill.name,
                                mode: skill.mode,
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
                call.mcpTool && params.filters!.mcpToolIds!.includes(call.mcpTool.id)
            );
        }

        if (params.filters?.runtimeIds && params.filters.runtimeIds.length > 0) {
            filteredCalls = filteredCalls.filter((call) =>
                call.calledBy && params.filters!.runtimeIds!.includes(call.calledBy.id) ||
                (call.executedBy && params.filters!.runtimeIds!.includes(call.executedBy.id))
            );
        }

        // Apply search filter (case-insensitive)
        if (params.filters?.search && params.filters.search.trim()) {
            const searchLower = params.filters.search.toLowerCase().trim();
            filteredCalls = filteredCalls.filter((call) => {
                const toolName = call.mcpTool?.name?.toLowerCase() || call.skill?.name?.toLowerCase() || '';
                const toolDescription = call.mcpTool?.description?.toLowerCase() || '';
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


