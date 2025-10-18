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
} from './workspace.operations';
import {
  QUERY_WORKSPACE_WITH_REGISTRIES
} from './registry.operations';
import { GET_RUNTIME } from './runtime.operations';
import { QUERY_SYSTEM } from './system.operations';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { createSubscriptionFromQuery } from '../helpers';
import { INITIAL_ONBOARDING_STEPS } from './onboarding-step-definitions';

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
    console.log('checkAndCompleteStep', workspaceId, stepId);
    // Get current workspace state
    const workspace = await this.dgraphService.query<{
      getWorkspace: {
        onboardingSteps: { stepId: string; status: string }[];
        mcpRegistries: { id: string }[];
        mcpServers: { id: string }[];
        runtimes: { capabilities: string[] }[];
      };
    }>(QUERY_WORKSPACE, { workspaceId });

    // Check if step is already completed
    const step = workspace.getWorkspace.onboardingSteps?.find(s => s.stepId === stepId);
    if (step?.status === 'COMPLETED') {
      console.log('step is already completed', stepId);
      return; // Already completed
    }

    let shouldComplete = false;

    switch (stepId) {
      case 'choose-mcp-registry':
        { const mcpRegistries = await this.dgraphService.query<{
          getWorkspace: { mcpRegistries: { id: string }[] };
        }>(QUERY_WORKSPACE_WITH_REGISTRIES, { workspaceId });
        shouldComplete = (mcpRegistries.getWorkspace.mcpRegistries?.length || 0) > 0;
        break; }
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
      default:
        return; // Unknown step
    }

    console.log('shouldComplete', shouldComplete);

    if (shouldComplete) {
      await this.completeOnboardingStep(workspaceId, stepId);
    }
  }
}
