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
} from './toolset.operations';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { createSubscriptionFromQuery } from '../helpers';
import pino from 'pino';

@injectable()
export class ToolSetRepository {
  private logger: pino.Logger;

  constructor(
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(LoggerService) private readonly loggerService: LoggerService,
  ) {
    this.logger = this.loggerService.getLogger('toolset-repository');
  }

  async create(
    name: string,
    description: string | undefined,
    workspaceId: string,
  ): Promise<dgraphResolversTypes.ToolSet> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation<{
      addToolSet: { toolSet: dgraphResolversTypes.ToolSet[] };
    }>(ADD_TOOLSET, {
      name,
      description: description ?? '',
      workspaceId,
      createdAt: now,
    });

    this.logger.info(`Created toolset ${name} with id ${res.addToolSet.toolSet[0].id}`);
    return res.addToolSet.toolSet[0];
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
    return res.updateToolSet.toolSet[0];
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
}
