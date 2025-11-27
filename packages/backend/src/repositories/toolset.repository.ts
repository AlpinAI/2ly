import { injectable, inject } from 'inversify';
import { DGraphService } from '../services/dgraph.service';
import { dgraphResolversTypes, LoggerService } from '@2ly/common';
import {
  ADD_TOOLSET,
  UPDATE_TOOLSET,
  DELETE_TOOLSET,
  GET_TOOLSET,
  QUERY_TOOLSETS_BY_WORKSPACE,
  ADD_MCP_TOOL_TO_TOOLSET,
  REMOVE_MCP_TOOL_FROM_TOOLSET,
  OBSERVE_TOOLSETS,
  QUERY_ALL_TOOLSETS,
  QUERY_TOOLSET_BY_NAME,
  GET_TOOLSET_AGENT_MCP_SERVERS,
} from './toolset.operations';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { createSubscriptionFromQuery } from '../helpers';
import pino from 'pino';
import { WorkspaceRepository } from './workspace.repository';
import { IdentityRepository } from './identity.repository';

@injectable()
export class ToolSetRepository {
  private logger: pino.Logger;

  constructor(
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(WorkspaceRepository) private readonly workspaceRepository: WorkspaceRepository,
    @inject(IdentityRepository) private readonly identityRepository: IdentityRepository,
  ) {
    this.logger = this.loggerService.getLogger('toolset-repository');
  }

  async create(
    name: string,
    description: string | undefined,
    workspaceId: string,
  ): Promise<dgraphResolversTypes.ToolSet> {
    const now = new Date().toISOString();

    // 1. Create the toolset
    const res = await this.dgraphService.mutation<{
      addToolSet: { toolSet: dgraphResolversTypes.ToolSet[] };
    }>(ADD_TOOLSET, {
      name,
      description: description ?? '',
      workspaceId,
      createdAt: now,
    });

    const toolSet = res.addToolSet.toolSet[0];
    this.logger.debug(`Created toolset ${name} with id ${toolSet.id}`);

    // 2. Create the toolset key
    await this.identityRepository.createKey('toolset', toolSet.id, `${name} Toolset Key`, '');

    return toolSet;
  }

  async update(
    id: string,
    name: string,
    description: string | undefined,
  ): Promise<dgraphResolversTypes.ToolSet> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation<{
      updateToolSet: { toolSet: dgraphResolversTypes.ToolSet[] };
    }>(UPDATE_TOOLSET, {
      id,
      name,
      description: description ?? '',
      updatedAt: now,
    });

    this.logger.info(`Updated toolset ${id} with name ${name}`);
    return res.updateToolSet.toolSet[0];
  }

  async delete(id: string): Promise<dgraphResolversTypes.ToolSet> {
    const res = await this.dgraphService.mutation<{
      deleteToolSet: { toolSet: dgraphResolversTypes.ToolSet[] };
    }>(DELETE_TOOLSET, {
      id,
    });

    this.logger.info(`Deleted toolset ${id}`);
    return res.deleteToolSet.toolSet[0];
  }

  async findById(id: string): Promise<dgraphResolversTypes.ToolSet | null> {
    const response = await this.dgraphService.query<{ getToolSet: dgraphResolversTypes.ToolSet | null }>(
      GET_TOOLSET,
      { id },
    );
    return response.getToolSet;
  }

  async findByName(workspaceId: string, name: string): Promise<dgraphResolversTypes.ToolSet | null> {
    const response = await this.dgraphService.query<{ getWorkspace: { toolSets: dgraphResolversTypes.ToolSet[] } }>(
      QUERY_TOOLSET_BY_NAME,
      { workspaceId, name },
    );
    return response.getWorkspace?.toolSets?.[0] ?? null;
  }

  async findByWorkspace(workspaceId: string): Promise<dgraphResolversTypes.ToolSet[]> {
    const response = await this.dgraphService.query<{
      getWorkspace: { toolSets: dgraphResolversTypes.ToolSet[] } | null;
    }>(QUERY_TOOLSETS_BY_WORKSPACE, { workspaceId });
    return response.getWorkspace?.toolSets ?? [];
  }

  async addMCPToolToToolSet(
    mcpToolId: string,
    toolSetId: string,
  ): Promise<dgraphResolversTypes.ToolSet> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation<{
      updateToolSet: { toolSet: dgraphResolversTypes.ToolSet[] };
    }>(ADD_MCP_TOOL_TO_TOOLSET, {
      toolSetId,
      mcpToolId,
      updatedAt: now,
    });

    this.logger.info(`Added MCP tool ${mcpToolId} to toolset ${toolSetId}`);

    // Trigger onboarding step completion check
    const toolSet = res.updateToolSet.toolSet[0];
    if (toolSet.workspace?.id) {
      await this.workspaceRepository.checkAndCompleteStep(
        toolSet.workspace.id,
        'create-tool-set'
      );
    }

    return toolSet;
  }

  async removeMCPToolFromToolSet(
    mcpToolId: string,
    toolSetId: string,
  ): Promise<dgraphResolversTypes.ToolSet> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation<{
      updateToolSet: { toolSet: dgraphResolversTypes.ToolSet[] };
    }>(REMOVE_MCP_TOOL_FROM_TOOLSET, {
      toolSetId,
      mcpToolId,
      updatedAt: now,
    });

    this.logger.info(`Removed MCP tool ${mcpToolId} from toolset ${toolSetId}`);
    return res.updateToolSet.toolSet[0];
  }

  observeToolSets(workspaceId: string): Observable<dgraphResolversTypes.ToolSet[]> {
    const query = createSubscriptionFromQuery(OBSERVE_TOOLSETS('query'));
    return this.dgraphService
      .observe<{ toolSets: dgraphResolversTypes.ToolSet[] }>(
        query,
        { workspaceId },
        'getWorkspace',
        true,
      )
      .pipe(map((workspace) => workspace?.toolSets ?? []));
  }

  observeAllToolSets(): Observable<dgraphResolversTypes.ToolSet[]> {
    const query = createSubscriptionFromQuery(QUERY_ALL_TOOLSETS);
    return this.dgraphService
      .observe<dgraphResolversTypes.ToolSet[]>(
        query,
        {},
        'queryToolSet',
        true,
      )
      .pipe(map((toolSets) => toolSets ?? []));
  }

  async getMCPServersOnAgent(toolsetId: string): Promise<dgraphResolversTypes.McpServer[]> {
    const response = await this.dgraphService.query<{ getToolSet: dgraphResolversTypes.ToolSet }>(
      GET_TOOLSET_AGENT_MCP_SERVERS,
      { toolsetId },
    );
    return response.getToolSet?.mcpTools
      ?.map((mcpTool) => mcpTool.mcpServer)
      .filter((mcpServer) => mcpServer.runOn === 'AGENT') ?? [];
  }

  observeMCPServersOnAgent(toolsetId: string): Observable<dgraphResolversTypes.McpServer[]> {
    const query = createSubscriptionFromQuery(GET_TOOLSET_AGENT_MCP_SERVERS);
    return this.dgraphService.observe<dgraphResolversTypes.ToolSet>(
      query,
      { toolsetId },
      'getToolSet',
      true,
    ).pipe(
      map((toolset) =>
        toolset?.mcpTools
          ?.map((mcpTool) => mcpTool.mcpServer)
          .filter((mcpServer) => mcpServer.runOn === 'AGENT') ?? []
      ),
    );
  }
}
