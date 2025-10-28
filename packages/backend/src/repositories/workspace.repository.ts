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
  SET_GLOBAL_RUNTIME,
  UNSET_GLOBAL_RUNTIME,
  CREATE_ONBOARDING_STEP,
  LINK_ONBOARDING_STEP_TO_WORKSPACE,
  QUERY_ONBOARDING_STEP_BY_STEP_ID,
  UPDATE_ONBOARDING_STEP_STATUS,
  ADD_REGISTRY_SERVER,
  UPDATE_REGISTRY_SERVER,
  DELETE_REGISTRY_SERVER,
  GET_REGISTRY_SERVER,
  QUERY_WORKSPACE_WITH_REGISTRY_SERVERS,
} from './workspace.operations';
import { GET_RUNTIME } from './runtime.operations';
import { QUERY_SYSTEM } from './system.operations';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { createSubscriptionFromQuery } from '../helpers';
import { INITIAL_ONBOARDING_STEPS } from './onboarding-step-definitions';
import { INITIAL_FEATURED_SERVERS } from './initial-servers';

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

    // Create featured servers directly on workspace from INITIAL_FEATURED_SERVERS
    const failedServers: string[] = [];
    for (const server of INITIAL_FEATURED_SERVERS) {
      try {
        await this.dgraphService.mutation(ADD_REGISTRY_SERVER, {
          name: server.name,
          description: server.description,
          title: server.name,
          repositoryUrl: server.repository?.url || '',
          version: server.version,
          packages: JSON.stringify(server.packages),
          remotes: server.remotes ? JSON.stringify(server.remotes) : null,
          _meta: null,
          workspaceId: workspace.id,
          now,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to create initial server ${server.name} for workspace ${workspace.id}:`, errorMessage);
        failedServers.push(server.name);
      }
    }

    if (failedServers.length > 0) {
      console.warn(`Workspace ${workspace.id} (${workspace.name}) created with ${failedServers.length} failed servers: ${failedServers.join(', ')}`);
    }

    // Initialize onboarding steps for new workspace
    await this.initializeOnboardingSteps(workspace.id);

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

  async findMCPToolsByWorkspace(workspaceId: string): Promise<apolloResolversTypes.McpTool[]> {
    const res = await this.dgraphService.query<{
      getWorkspace: { mcpTools: apolloResolversTypes.McpTool[] };
    }>(QUERY_WORKSPACE_WITH_MCP_TOOLS, { workspaceId });
    return res.getWorkspace.mcpTools || [];
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


  observeWorkspace(workspaceId: string): Observable<apolloResolversTypes.Workspace> {
    const query = createSubscriptionFromQuery(QUERY_WORKSPACE);
    return this.dgraphService
      .observe<apolloResolversTypes.Workspace>(query, { workspaceId }, 'getWorkspace', true);
  }

  async initializeOnboardingSteps(workspaceId: string): Promise<void> {
    const now = new Date().toISOString();
    
    // Get existing onboarding steps to avoid duplicates
    const workspace = await this.dgraphService.query<{
      getWorkspace: { onboardingSteps: { stepId: string }[] };
    }>(QUERY_WORKSPACE, { workspaceId });
    
    const existingStepIds = new Set(workspace.getWorkspace.onboardingSteps?.map(s => s.stepId) || []);
    
    // Create only missing steps
    for (const stepDef of INITIAL_ONBOARDING_STEPS) {
      if (!existingStepIds.has(stepDef.stepId)) {
        // First create the onboarding step
        const createResult = await this.dgraphService.mutation<{
          addOnboardingStep: { onboardingStep: { id: string }[] };
        }>(CREATE_ONBOARDING_STEP, {
          stepId: stepDef.stepId,
          type: stepDef.type,
          priority: stepDef.priority,
          now,
        });
        
        // Then link it to the workspace using the actual ID
        const stepId = createResult.addOnboardingStep.onboardingStep[0].id;
        await this.dgraphService.mutation<{
          updateWorkspace: { workspace: { id: string }[] };
        }>(LINK_ONBOARDING_STEP_TO_WORKSPACE, {
          workspaceId,
          stepId,
        });
      }
    }
  }

  async completeOnboardingStep(workspaceId: string, stepId: string): Promise<void> {
    const now = new Date().toISOString();
    
    // First, query for the onboarding step by stepId to get the dgraph ID
    const stepQuery = await this.dgraphService.query<{
      queryOnboardingStep: { id: string; stepId: string; status: string }[];
    }>(QUERY_ONBOARDING_STEP_BY_STEP_ID, { stepId });
    
    const step = stepQuery.queryOnboardingStep?.[0];
    if (!step) {
      throw new Error(`Onboarding step with stepId '${stepId}' not found`);
    }
    
    // Update the onboarding step status to COMPLETED
    await this.dgraphService.mutation<{
      updateOnboardingStep: { onboardingStep: { id: string }[] };
    }>(UPDATE_ONBOARDING_STEP_STATUS, {
      id: step.id,
      status: 'COMPLETED',
      now,
    });
  }

  async dismissOnboardingStep(workspaceId: string, stepId: string): Promise<void> {
    const now = new Date().toISOString();
    
    // First, query for the onboarding step by stepId to get the dgraph ID
    const stepQuery = await this.dgraphService.query<{
      queryOnboardingStep: { id: string; stepId: string; status: string }[];
    }>(QUERY_ONBOARDING_STEP_BY_STEP_ID, { stepId });
    
    const step = stepQuery.queryOnboardingStep?.[0];
    if (!step) {
      throw new Error(`Onboarding step with stepId '${stepId}' not found`);
    }
    
    // Update the onboarding step status to DISMISSED
    await this.dgraphService.mutation<{
      updateOnboardingStep: { onboardingStep: { id: string }[] };
    }>(UPDATE_ONBOARDING_STEP_STATUS, {
      id: step.id,
      status: 'DISMISSED',
      now,
    });
  }

  async checkAndCompleteStep(workspaceId: string, stepId: string): Promise<void> {
    // Get current workspace state
    const workspace = await this.dgraphService.query<{
      getWorkspace: {
        onboardingSteps: { stepId: string; status: string }[];
        registryServers: { id: string }[];
        mcpServers: { id: string }[];
        runtimes: { capabilities: string[] }[];
      };
    }>(QUERY_WORKSPACE, { workspaceId });

    // Check if step is already completed
    const step = workspace.getWorkspace.onboardingSteps?.find(s => s.stepId === stepId);
    if (step?.status === 'COMPLETED') {
      return; // Already completed
    }

    let shouldComplete = false;

    switch (stepId) {
      case 'install-mcp-server':
        { const servers = await this.dgraphService.query<{
          getWorkspace: { mcpServers: { id: string }[] };
        }>(QUERY_WORKSPACE_WITH_MCP_SERVERS, { workspaceId });
        shouldComplete = (servers.getWorkspace.mcpServers?.length || 0) > 0;
        break; }
      case 'create-tool-set':
        { const runtimes = await this.dgraphService.query<{
          getWorkspace: {
            runtimes: {
              capabilities: string[];
              mcpToolCapabilities: { id: string }[];
            }[]
          };
        }>(QUERY_WORKSPACE_WITH_RUNTIMES, { workspaceId });
        // Check if there's at least one runtime with 'agent' capability and at least one tool
        shouldComplete = (
          runtimes.getWorkspace.runtimes?.some(r =>
            (r.capabilities || []).some(c => c.toUpperCase() === 'AGENT') &&
            (r.mcpToolCapabilities?.length || 0) > 0
          ) || false
        );
        break; }
      case 'connect-tool-set-to-agent':
        { const runtimes = await this.dgraphService.query<{
          getWorkspace: {
            runtimes: {
              capabilities: string[];
              mcpToolCapabilities: { id: string }[];
            }[]
          };
        }>(QUERY_WORKSPACE_WITH_RUNTIMES, { workspaceId });
        // Check if there's at least one runtime with 'agent' capability and at least one tool
        // (Same condition as create-tool-set - completing one should complete the other)
        shouldComplete = (
          runtimes.getWorkspace.runtimes?.some(r =>
            (r.capabilities || []).some(c => c.toUpperCase() === 'AGENT') &&
            (r.mcpToolCapabilities?.length || 0) > 0
          ) || false
        );
        break; }
      default:
        return; // Unknown step
    }

    if (shouldComplete) {
      await this.completeOnboardingStep(workspaceId, stepId);
    }
  }

  // Registry server management methods

  /**
   * Get server usage information for error messages
   */
  private async getServerUsageInfo(serverId: string): Promise<{
    server: dgraphResolversTypes.McpRegistryServer;
    configCount: number;
    configNames: string[];
  }> {
    const result = await this.dgraphService.query<{
      getMCPRegistryServer: dgraphResolversTypes.McpRegistryServer;
    }>(GET_REGISTRY_SERVER, { id: serverId });

    const server = result.getMCPRegistryServer;
    if (!server) {
      throw new Error(`Registry server with ID '${serverId}' not found. It may have been deleted.`);
    }

    const configurations = server.configurations || [];
    const configCount = configurations.length;
    const configNames = configurations.map((config) => config.name).filter(Boolean);

    return { server, configCount, configNames };
  }

  async canModifyServer(serverId: string): Promise<boolean> {
    const { configCount } = await this.getServerUsageInfo(serverId);
    return configCount === 0;
  }

  async addServerToWorkspace(
    workspaceId: string,
    serverData: {
      name: string;
      description: string;
      title: string;
      repositoryUrl: string;
      version: string;
      packages?: string;
      remotes?: string;
    }
  ): Promise<dgraphResolversTypes.McpRegistryServer> {
    const now = new Date().toISOString();

    const variables: Partial<dgraphResolversTypes.McpRegistryServer> & { workspaceId: string, now: string } = {
      name: serverData.name,
      description: serverData.description,
      title: serverData.title,
      repositoryUrl: serverData.repositoryUrl,
      version: serverData.version,
      packages: serverData.packages || '{}',
      workspaceId,
      now,
    };

    if (serverData.remotes) {
      variables.remotes = serverData.remotes;
    }

    const res = await this.dgraphService.mutation<{
      addMCPRegistryServer: { mCPRegistryServer: dgraphResolversTypes.McpRegistryServer[] };
    }>(ADD_REGISTRY_SERVER, variables);

    return res.addMCPRegistryServer.mCPRegistryServer[0];
  }

  async updateServerInWorkspace(
    serverId: string,
    serverData: {
      name?: string;
      description?: string;
      title?: string;
      repositoryUrl?: string;
      version?: string;
      packages?: string;
      remotes?: string;
    }
  ): Promise<dgraphResolversTypes.McpRegistryServer> {
    // Check if server can be modified
    const { server, configCount, configNames } = await this.getServerUsageInfo(serverId);

    if (configCount > 0) {
      const sourceList = configNames.length > 0 ? configNames.slice(0, 3).join(', ') : 'source(s)';
      const moreText = configNames.length > 3 ? ` and ${configNames.length - 3} more` : '';
      throw new Error(
        `Cannot modify '${server.name}' because it's used by ${configCount} ${configCount === 1 ? 'source' : 'sources'} (${sourceList}${moreText}). ` +
        `Remove or reconfigure those sources first to modify this server.`,
      );
    }

    // Build update object with only provided fields
    const updateFields: Partial<dgraphResolversTypes.McpRegistryServer> = {};
    if (serverData.name !== undefined) updateFields.name = serverData.name;
    if (serverData.description !== undefined) updateFields.description = serverData.description;
    if (serverData.title !== undefined) updateFields.title = serverData.title;
    if (serverData.repositoryUrl !== undefined) updateFields.repositoryUrl = serverData.repositoryUrl;
    if (serverData.version !== undefined) updateFields.version = serverData.version;
    if (serverData.packages !== undefined) updateFields.packages = serverData.packages;
    if (serverData.remotes !== undefined) updateFields.remotes = serverData.remotes;

    const res = await this.dgraphService.mutation<{
      updateMCPRegistryServer: { mCPRegistryServer: dgraphResolversTypes.McpRegistryServer[] };
    }>(UPDATE_REGISTRY_SERVER, {
      id: serverId,
      ...updateFields,
    });

    return res.updateMCPRegistryServer.mCPRegistryServer[0];
  }

  async removeServerFromWorkspace(serverId: string): Promise<dgraphResolversTypes.McpRegistryServer> {
    // Check if server can be deleted
    // NOTE: There's a potential race condition between this check and the delete operation.
    // In high-concurrency scenarios, a configuration could be created after this check.
    // Dgraph doesn't support SQL-style "DELETE WHERE NOT EXISTS" conditional mutations.
    // The database schema enforces referential integrity, so dangling references won't occur,
    // but the UI should handle conflicts gracefully.
    const { server, configCount, configNames } = await this.getServerUsageInfo(serverId);

    if (configCount > 0) {
      const sourceList = configNames.length > 0 ? configNames.slice(0, 3).join(', ') : 'source(s)';
      const moreText = configNames.length > 3 ? ` and ${configNames.length - 3} more` : '';
      throw new Error(
        `Cannot delete '${server.name}' because it's used by ${configCount} ${configCount === 1 ? 'source' : 'sources'} (${sourceList}${moreText}). ` +
        `Remove those sources first to delete this server.`,
      );
    }

    // Perform deletion - this may fail if configurations were added concurrently
    // and Dgraph enforces referential integrity
    try {
      const res = await this.dgraphService.mutation<{
        deleteMCPRegistryServer: { mCPRegistryServer: dgraphResolversTypes.McpRegistryServer[] };
      }>(DELETE_REGISTRY_SERVER, { id: serverId });

      return res.deleteMCPRegistryServer.mCPRegistryServer[0];
    } catch (error) {
      // If delete fails, re-check to provide accurate error message
      const updatedInfo = await this.getServerUsageInfo(serverId).catch(() => null);
      if (updatedInfo && updatedInfo.configCount > 0) {
        const sourceList = updatedInfo.configNames.slice(0, 3).join(', ');
        throw new Error(
          `Cannot delete '${server.name}' because ${updatedInfo.configCount} configuration(s) were added concurrently (${sourceList}). ` +
          `Remove those configurations and try again.`,
        );
      }
      // Re-throw original error if not a configuration issue
      throw error;
    }
  }

  async findRegistryServersByWorkspace(workspaceId: string): Promise<dgraphResolversTypes.McpRegistryServer[]> {
    const res = await this.dgraphService.query<{
      getWorkspace: { registryServers: dgraphResolversTypes.McpRegistryServer[] };
    }>(QUERY_WORKSPACE_WITH_REGISTRY_SERVERS, { workspaceId });
    return res.getWorkspace.registryServers || [];
  }
}
