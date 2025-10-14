import { inject, injectable } from 'inversify';
import { DGraphService } from '../services/dgraph.service';
import { apolloResolversTypes, dgraphResolversTypes } from '@2ly/common';
import {
  ADD_WORKSPACE,
  QUERY_WORKSPACE,
  QUERY_WORKSPACES,
  QUERY_WORKSPACE_WITH_RUNTIMES,
  QUERY_WORKSPACE_WITH_MCP_SERVERS,
  QUERY_WORKSPACE_WITH_MCP_TOOLS,
  SET_DEFAULT_TESTING_RUNTIME,
  SET_GLOBAL_RUNTIME,
  UNSET_DEFAULT_TESTING_RUNTIME,
  UNSET_GLOBAL_RUNTIME,
} from './workspace.operations';
import {
  QUERY_WORKSPACE_WITH_REGISTRIES
} from './registry.operations';
import { GET_RUNTIME } from './runtime.operations';
import { QUERY_SYSTEM } from './system.operations';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { createSubscriptionFromQuery } from '../helpers';

@injectable()
export class WorkspaceRepository {
  constructor(
    @inject(DGraphService) private readonly dgraphService: DGraphService,
  ) { }

  async create(name: string, adminId: string): Promise<apolloResolversTypes.Workspace> {
    const now = new Date().toISOString();
    const system = await this.dgraphService.query<{
      querySystem: dgraphResolversTypes.System[];
    }>(QUERY_SYSTEM, {});
    if (!system.querySystem[0]) {
      throw new Error('System not found');
    }
    const systemId = system.querySystem[0].id;
    // Create workspace
    const res = await this.dgraphService.mutation<{
      addWorkspace: { workspace: apolloResolversTypes.Workspace[] };
    }>(ADD_WORKSPACE, {
      name,
      now,
      systemId,
      adminId,
    });
    const workspace = res.addWorkspace.workspace[0];

    return workspace;
  }

  async findAll(): Promise<dgraphResolversTypes.Workspace[]> {
    const res = await this.dgraphService.query<{ queryWorkspace: dgraphResolversTypes.Workspace[] }>(
      QUERY_WORKSPACES,
      {},
    );
    return res.queryWorkspace;
  }

  async findById(workspaceId: string): Promise<dgraphResolversTypes.Workspace> {
    const res = await this.dgraphService.query<{
      getWorkspace: dgraphResolversTypes.Workspace;
    }>(QUERY_WORKSPACE, { workspaceId });
    return res.getWorkspace;
  }

  async update(id: string, name: string): Promise<apolloResolversTypes.Workspace> {
    const { UPDATE_WORKSPACE } = await import('./workspace.operations');
    const res = await this.dgraphService.mutation<{
      updateWorkspace: { workspace: apolloResolversTypes.Workspace[] };
    }>(UPDATE_WORKSPACE, { id, name });
    return res.updateWorkspace.workspace[0];
  }

  async setDefaultTestingRuntime(runtimeId: string): Promise<void> {
    const runtime = await this.dgraphService.query<{ getRuntime: dgraphResolversTypes.Runtime }>(GET_RUNTIME, { id: runtimeId });
    if (!runtime.getRuntime.workspace) {
      throw new Error('Runtime is not linked to a workspace');
    }
    const workspaceId = runtime.getRuntime.workspace.id;
    await this.dgraphService.mutation<{
      updateWorkspace: { workspace: apolloResolversTypes.Workspace[] };
    }>(SET_DEFAULT_TESTING_RUNTIME, { id: workspaceId, runtimeId: runtimeId });
    return;
  }

  async unsetDefaultTestingRuntime(workspaceId: string): Promise<void> {
    await this.dgraphService.mutation<{
      updateWorkspace: { workspace: apolloResolversTypes.Workspace[] };
    }>(UNSET_DEFAULT_TESTING_RUNTIME, { id: workspaceId });
    return;
  }

  async setGlobalRuntime(runtimeId: string): Promise<void> {
    const runtime = await this.dgraphService.query<{ getRuntime: dgraphResolversTypes.Runtime }>(GET_RUNTIME, { id: runtimeId });
    if (!runtime.getRuntime.workspace) {
      throw new Error('Runtime is not linked to a workspace');
    }
    const workspaceId = runtime.getRuntime.workspace.id;
    await this.dgraphService.mutation<{
      updateWorkspace: { workspace: apolloResolversTypes.Workspace[] };
    }>(SET_GLOBAL_RUNTIME, { id: workspaceId, runtimeId: runtimeId });
    return;
  }

  async unsetGlobalRuntime(workspaceId: string): Promise<void> {
    await this.dgraphService.mutation<{
      updateWorkspace: { workspace: apolloResolversTypes.Workspace[] };
    }>(UNSET_GLOBAL_RUNTIME, { id: workspaceId });
    return;
  }

  observeRuntimes(workspaceId: string): Observable<apolloResolversTypes.Runtime[]> {
    const query = createSubscriptionFromQuery(QUERY_WORKSPACE_WITH_RUNTIMES);
    return this.dgraphService
      .observe<apolloResolversTypes.Workspace>(query, { workspaceId }, 'getWorkspace', true)
      .pipe(map((workspace) => workspace.runtimes || []));
  }

  observeMCPServers(workspaceId: string): Observable<apolloResolversTypes.McpServer[]> {
    const query = createSubscriptionFromQuery(QUERY_WORKSPACE_WITH_MCP_SERVERS);
    return this.dgraphService
      .observe<{ mcpServers: apolloResolversTypes.McpServer[] }>(query, { workspaceId }, 'getWorkspace', true)
      .pipe(map((workspace) => workspace.mcpServers || []));
  }

  observeMCPTools(workspaceId: string): Observable<apolloResolversTypes.McpTool[]> {
    const query = createSubscriptionFromQuery(QUERY_WORKSPACE_WITH_MCP_TOOLS);
    return this.dgraphService
      .observe<{ mcpTools: apolloResolversTypes.McpTool[] }>(query, { workspaceId }, 'getWorkspace', true)
      .pipe(map((workspace) => workspace.mcpTools || []));
  }

  observeWorkspaces(): Observable<apolloResolversTypes.Workspace[]> {
    const query = createSubscriptionFromQuery(QUERY_WORKSPACES);
    return this.dgraphService
      .observe<apolloResolversTypes.Workspace[]>(query, {}, 'queryWorkspace', true);
  }

  observeMCPRegistries(workspaceId: string): Observable<apolloResolversTypes.McpRegistry[]> {
    const query = createSubscriptionFromQuery(QUERY_WORKSPACE_WITH_REGISTRIES);
    return this.dgraphService
      .observe<{ mcpRegistries: apolloResolversTypes.McpRegistry[] }>(query, { workspaceId }, 'getWorkspace', true)
      .pipe(map((workspace) => workspace?.mcpRegistries || []));
  }
}
