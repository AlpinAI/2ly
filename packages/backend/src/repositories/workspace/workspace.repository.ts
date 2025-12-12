import { inject, injectable } from 'inversify';
import { DGraphService } from '../../services/dgraph.service';
import { apolloResolversTypes, dgraphResolversTypes } from '@skilder-ai/common';
import {
  AddWorkspaceDocument,
  QueryWorkspaceDocument,
  QueryWorkspacesByUserDocument,
  CheckUserWorkspaceAccessDocument,
  QueryWorkspaceWithRuntimesDocument,
  QueryWorkspaceWithMcpServersDocument,
  QueryWorkspaceWithMcpToolsDocument,
  CreateOnboardingStepDocument,
  LinkOnboardingStepToWorkspaceDocument,
  UpdateOnboardingStepStatusDocument,
  AddRegistryServerDocument,
  UpdateRegistryServerDocument,
  DeleteRegistryServerDocument,
  GetRegistryServerDocument,
  QueryWorkspaceWithRegistryServersDocument,
  UpdateWorkspaceDocument,
  OnboardingStepType,
  OnboardingStepStatus,
} from '../../generated/dgraph';
import { QuerySystemDocument } from "../../generated/dgraph";
import { Observable, combineLatestWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { createSubscriptionFromQuery } from '../../helpers';
import { INITIAL_ONBOARDING_STEPS } from './onboarding-step-definitions';
import { INITIAL_FEATURED_SERVERS } from './initial-servers';
import { QuerySkillsByWorkspaceDocument } from "../../generated/dgraph";
import { IdentityRepository } from '../identity/identity.repository';
import { LoggerService } from '@skilder-ai/common';
import { SystemRepository } from '../system/system.repository';
import { UserRepository } from '../user/user.repository';
import pino from 'pino';

@injectable()
export class WorkspaceRepository {
  private logger: pino.Logger;

  constructor(
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(IdentityRepository) private readonly identityRepository: IdentityRepository,
    @inject(SystemRepository) private readonly systemRepository: SystemRepository,
    @inject(UserRepository) private readonly userRepository: UserRepository,
  ) {
    this.logger = this.loggerService.getLogger('WorkspaceRepository');
  }

  async create(name: string, adminId: string, options: { masterKey?: string } = {}): Promise<apolloResolversTypes.Workspace> {
    const now = new Date().toISOString();

    // 1. Get system
    const system = await this.dgraphService.query(QuerySystemDocument, {});
    if (!system.querySystem || !system.querySystem[0]) {
      throw new Error('System not found');
    }
    const systemId = system.querySystem[0].id;

    // 2. Validate admin exists
    const admin = await this.userRepository.findById(adminId);
    if (!admin) {
      throw new Error(`User with ID '${adminId}' not found`);
    }

    // 3. Create workspace
    const res = await this.dgraphService.mutation(AddWorkspaceDocument, {
      name,
      now,
      systemId,
      adminId,
    });
    const workspace = res.addWorkspace!.workspace![0]! as unknown as apolloResolversTypes.Workspace;

    // 4. Create workspace key
    const identityOptions = { key: options?.masterKey };
    await this.identityRepository.createKey('workspace', workspace.id, 'Default Workspace key', '', identityOptions);

    // 5. Create featured servers directly on workspace from INITIAL_FEATURED_SERVERS
    const failedServers: string[] = [];
    for (const server of INITIAL_FEATURED_SERVERS) {
      try {
        await this.dgraphService.mutation(AddRegistryServerDocument, {
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
        this.logger.error(`Failed to create initial server ${server.name} for workspace ${workspace.id}: ${errorMessage}`);
        failedServers.push(server.name);
      }
    }

    if (failedServers.length > 0) {
      this.logger.warn(`Workspace ${workspace.id} (${workspace.name}) created with ${failedServers.length} failed servers: ${failedServers.join(', ')}`);
    }

    // 6. Initialize onboarding steps for new workspace
    await this.initializeOnboardingSteps(workspace.id);

    return workspace;
  }

  async findAll(userId: string): Promise<dgraphResolversTypes.Workspace[]> {
    // Filter workspaces by admin relationship
    const res = await this.dgraphService.query(QueryWorkspacesByUserDocument, { userId });

    return (res.getUser?.adminOfWorkspaces || []) as dgraphResolversTypes.Workspace[];
  }

  /**
   * Check if a user has access to a specific workspace.
   * A user has access if they are either an admin or member of the workspace.
   */
  async hasUserAccess(userId: string, workspaceId: string): Promise<boolean> {
    const res = await this.dgraphService.query(CheckUserWorkspaceAccessDocument, { userId, workspaceId });

    if (!res.getUser) {
      return false;
    }

    const isAdmin = (res.getUser.adminOfWorkspaces?.length ?? 0) > 0;
    const isMember = (res.getUser.membersOfWorkspaces?.length ?? 0) > 0;

    return isAdmin || isMember;
  }

  async findById(workspaceId: string): Promise<dgraphResolversTypes.Workspace> {
    const res = await this.dgraphService.query(QueryWorkspaceDocument, { workspaceId });
    return res.getWorkspace! as dgraphResolversTypes.Workspace;
  }

  async findByIdWithRuntimes(workspaceId: string): Promise<apolloResolversTypes.Workspace> {
    const res = await this.dgraphService.query(QueryWorkspaceWithRuntimesDocument, { workspaceId });
    return res.getWorkspace! as apolloResolversTypes.Workspace;
  }

  async getRuntimes(workspaceId: string): Promise<apolloResolversTypes.Runtime[]> {
    const res = await this.dgraphService.query(QueryWorkspaceWithRuntimesDocument, { workspaceId });
    return (res.getWorkspace!.runtimes || []) as unknown as apolloResolversTypes.Runtime[];
  }

  async update(id: string, name: string): Promise<apolloResolversTypes.Workspace> {
    const res = await this.dgraphService.mutation(UpdateWorkspaceDocument, { id, name });
    return res.updateWorkspace!.workspace![0]! as unknown as apolloResolversTypes.Workspace;
  }

  observeRuntimes(workspaceId: string): Observable<apolloResolversTypes.Runtime[]> {
    const query = createSubscriptionFromQuery(QueryWorkspaceWithRuntimesDocument);
    return this.dgraphService
      .observe<apolloResolversTypes.Workspace>(query, { workspaceId }, 'getWorkspace', true)
      .pipe(
        combineLatestWith(this.systemRepository.observeRuntimes()),
        map(([workspace, systemRuntimes]) => {
          const allRuntimes = workspace.runtimes ? [...workspace.runtimes] : [];
          return [...allRuntimes, ...systemRuntimes];
        })
      );
  }

  observeMCPServers(workspaceId: string): Observable<apolloResolversTypes.McpServer[]> {
    const query = createSubscriptionFromQuery(QueryWorkspaceWithMcpServersDocument);
    return this.dgraphService
      .observe<{ mcpServers: apolloResolversTypes.McpServer[] }>(query, { workspaceId }, 'getWorkspace', true)
      .pipe(map((workspace) => workspace.mcpServers || []));
  }

  async findMCPToolsByWorkspace(workspaceId: string): Promise<apolloResolversTypes.McpTool[]> {
    const res = await this.dgraphService.query(QueryWorkspaceWithMcpToolsDocument, { workspaceId });
    return (res.getWorkspace!.mcpTools || []) as unknown as apolloResolversTypes.McpTool[];
  }

  observeMCPTools(workspaceId: string): Observable<apolloResolversTypes.McpTool[]> {
    const query = createSubscriptionFromQuery(QueryWorkspaceWithMcpToolsDocument);
    return this.dgraphService
      .observe<{ mcpTools: apolloResolversTypes.McpTool[] }>(query, { workspaceId }, 'getWorkspace', true)
      .pipe(map((workspace) => workspace.mcpTools || []));
  }

  observeWorkspaces(userId: string): Observable<apolloResolversTypes.Workspace[]> {
    // Observe workspaces by admin relationship
    const query = createSubscriptionFromQuery(QueryWorkspacesByUserDocument);
    return this.dgraphService
      .observe<{ adminOfWorkspaces: apolloResolversTypes.Workspace[] }>(query, { userId }, 'getUser', true)
      .pipe(map((user) => user?.adminOfWorkspaces || []));
  }


  observeWorkspace(workspaceId: string): Observable<apolloResolversTypes.Workspace> {
    const query = createSubscriptionFromQuery(QueryWorkspaceDocument);
    return this.dgraphService
      .observe<apolloResolversTypes.Workspace>(query, { workspaceId }, 'getWorkspace', true);
  }

  async getWorkspaceOnboardingSteps(workspaceId: string): Promise<apolloResolversTypes.OnboardingStep[]> {
    const res = await this.dgraphService.query(QueryWorkspaceDocument, { workspaceId });
    const steps = res.getWorkspace?.onboardingSteps?.filter((s): s is NonNullable<typeof s> => s !== null && s !== undefined) || [];
    return steps as unknown as apolloResolversTypes.OnboardingStep[];
  }

  async initializeOnboardingSteps(workspaceId: string): Promise<void> {
    const now = new Date().toISOString();

    // Get existing onboarding steps to avoid duplicates
    const existingSteps = await this.getWorkspaceOnboardingSteps(workspaceId);
    const existingStepIds = new Set(existingSteps.map(s => s.stepId));

    // Create only missing steps
    for (const stepDef of INITIAL_ONBOARDING_STEPS) {
      if (!existingStepIds.has(stepDef.stepId)) {
        // First create the onboarding step
        const createResult = await this.dgraphService.mutation(CreateOnboardingStepDocument, {
          stepId: stepDef.stepId,
          type: stepDef.type as OnboardingStepType,
          priority: stepDef.priority,
          now,
        });

        // Then link it to the workspace using the actual ID
        const stepId = createResult.addOnboardingStep!.onboardingStep![0]!.id;
        await this.dgraphService.mutation(LinkOnboardingStepToWorkspaceDocument, {
          workspaceId,
          stepId,
        });
      }
    }
  }

  async completeOnboardingStep(workspaceId: string, stepId: string, metadata?: Record<string, unknown>): Promise<void> {
    const now = new Date().toISOString();

    const existingSteps = await this.getWorkspaceOnboardingSteps(workspaceId);
    const existingStep = existingSteps.find(s => s.stepId === stepId);
    if (!existingStep) {
      throw new Error(`Onboarding step with stepId '${stepId}' not found`);
    }

    if (existingStep.status === 'COMPLETED') {
      return;
    }

    // Update the onboarding step status to COMPLETED
    await this.dgraphService.mutation(UpdateOnboardingStepStatusDocument, {
      id: existingStep.id,
      status: OnboardingStepStatus.Completed,
      now,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });
  }

  async dismissOnboardingStep(workspaceId: string, stepId: string): Promise<void> {
    const now = new Date().toISOString();

    const existingSteps = await this.getWorkspaceOnboardingSteps(workspaceId);
    const existingStep = existingSteps.find(s => s.stepId === stepId);
    if (!existingStep) {
      throw new Error(`Onboarding step with stepId '${stepId}' not found`);
    }

    if (existingStep.status === 'DISMISSED') {
      return;
    }

    // Update the onboarding step status to DISMISSED
    await this.dgraphService.mutation(UpdateOnboardingStepStatusDocument, {
      id: existingStep.id,
      status: OnboardingStepStatus.Dismissed,
      now,
    });
  }

  async checkAndCompleteStep(workspaceId: string, stepId: string): Promise<void> {
    // Get current workspace state
    const workspace = await this.dgraphService.query(QueryWorkspaceDocument, { workspaceId });

    // Check if step is already completed
    const step = workspace.getWorkspace!.onboardingSteps?.find(s => s.stepId === stepId);
    if (step?.status === 'COMPLETED') {
      return; // Already completed
    }

    let shouldComplete = false;

    switch (stepId) {
      case 'install-mcp-server':
        { const servers = await this.dgraphService.query(QueryWorkspaceWithMcpServersDocument, { workspaceId });
        shouldComplete = (servers.getWorkspace!.mcpServers?.length || 0) > 0;
        break; }
      case 'create-skill':
        { // Check if workspace has at least one Skill with at least one tool
        const skills = await this.dgraphService.query(QuerySkillsByWorkspaceDocument, { workspaceId });

        shouldComplete = (skills.getWorkspace?.skills?.some(ts => ts.mcpTools && ts.mcpTools.length > 0) ?? false);
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
   * Get a registry server by ID with its workspace.
   * Used for authorization checks on registry server mutations.
   */
  async getRegistryServerById(serverId: string): Promise<dgraphResolversTypes.McpRegistryServer | null> {
    const result = await this.dgraphService.query(GetRegistryServerDocument, { id: serverId });
    return result.getMCPRegistryServer as dgraphResolversTypes.McpRegistryServer | null;
  }

  /**
   * Get server usage information for error messages
   */
  private async getServerUsageInfo(serverId: string): Promise<{
    server: dgraphResolversTypes.McpRegistryServer;
    configCount: number;
    configNames: string[];
  }> {
    const result = await this.dgraphService.query(GetRegistryServerDocument, { id: serverId });

    const server = result.getMCPRegistryServer;
    if (!server) {
      throw new Error(`Registry server with ID '${serverId}' not found. It may have been deleted.`);
    }

    const configurations = server.configurations || [];
    const configCount = configurations.length;
    const configNames = configurations.map((config) => config!.name).filter(Boolean);

    return { server: server as dgraphResolversTypes.McpRegistryServer, configCount, configNames };
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

    const res = await this.dgraphService.mutation(AddRegistryServerDocument, {
      name: variables.name!,
      description: variables.description!,
      title: variables.title!,
      repositoryUrl: variables.repositoryUrl!,
      version: variables.version!,
      packages: variables.packages!,
      remotes: variables.remotes,
      workspaceId: variables.workspaceId,
      now: variables.now,
    });

    return res.addMCPRegistryServer!.mCPRegistryServer![0]! as dgraphResolversTypes.McpRegistryServer;
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

    const res = await this.dgraphService.mutation(UpdateRegistryServerDocument, {
      id: serverId,
      ...updateFields,
    });

    return res.updateMCPRegistryServer!.mCPRegistryServer![0]! as dgraphResolversTypes.McpRegistryServer;
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
      const res = await this.dgraphService.mutation(DeleteRegistryServerDocument, { id: serverId });

      return res.deleteMCPRegistryServer!.mCPRegistryServer![0]! as dgraphResolversTypes.McpRegistryServer;
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
    const res = await this.dgraphService.query(QueryWorkspaceWithRegistryServersDocument, { workspaceId });
    return (res.getWorkspace!.registryServers || []) as dgraphResolversTypes.McpRegistryServer[];
  }
}
