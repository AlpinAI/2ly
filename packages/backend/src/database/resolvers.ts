import { GraphQLDateTime } from 'graphql-scalars';
import { container as defaultContainer } from '../di/container';
import { apolloResolversTypes, MCP_SERVER_RUN_ON } from '@2ly/common';
import { Observable } from 'rxjs';
import { latestValueFrom } from 'rxjs-for-await';
import { MCPServerAutoConfigService } from '../services/mcp-auto-config.service';
import {
  RegistryRepository,
  MCPServerRepository,
  RuntimeRepository,
  WorkspaceRepository,
  SystemRepository,
  UserRepository,
  MonitoringRepository,
} from '../repositories';
import { createAuthResolvers } from '../resolvers/auth.resolver';
import { AuthenticationService, JwtService, PasswordPolicyService } from '../services/auth';
import { Container } from 'inversify';

const observableToAsyncGenerator = <T, K extends string>(
  observable: Observable<T>,
  key: K,
): AsyncGenerator<Record<K, T>> => {
  return (async function* () {
    for await (const value of latestValueFrom(observable)) {
      yield { [key]: value } as Record<K, T>;
    }
  })();
};

export const resolvers = (container: Container = defaultContainer): apolloResolversTypes.Resolvers => {
  const systemRepository = container.get(SystemRepository);
  const registryRepository = container.get(RegistryRepository);
  const mcpServerRepository = container.get(MCPServerRepository);
  const runtimeRepository = container.get(RuntimeRepository);
  const workspaceRepository = container.get(WorkspaceRepository);
  const mcpAutoConfigService = container.get(MCPServerAutoConfigService);
  const authenticationService = container.get(AuthenticationService);
  const jwtService = container.get(JwtService);
  const monitoringRepository = container.get(MonitoringRepository);

  // Create authentication resolvers
  const userRepository = container.get(UserRepository);
  const passwordPolicyService = container.get(PasswordPolicyService);
  const authResolvers = createAuthResolvers(authenticationService, jwtService, userRepository, passwordPolicyService);
  return {
    Date: GraphQLDateTime,
    Query: {

      workspace: async () => {
        return workspaceRepository.findAll();
      },
      mcpServers: async () => {
        return mcpServerRepository.findAll();
      },
      mcpTools: async (_parent: unknown, { workspaceId }: { workspaceId: string }) => {
        return workspaceRepository.findMCPToolsByWorkspace(workspaceId);
      },
      system: async () => {
        return systemRepository.getSystem();
      },
      infra: async () => {
        let exposedNatsServers = 'localhost:4222';
        if (process.env.EXPOSED_NATS_SERVERS) {
          exposedNatsServers = process.env.EXPOSED_NATS_SERVERS;
        }
        return {
          nats: exposedNatsServers,
        };
      },
      workspaceMCPTools: async (_parent: unknown, { workspaceId }: { workspaceId: string }) => {
        return workspaceRepository.findById(workspaceId);
      },
      isMCPAutoConfigEnabled: async () => {
        return mcpAutoConfigService.isConfigured();
      },
      mcpRegistries: async (_parent: unknown, { workspaceId }: { workspaceId: string }) => {
        return registryRepository.findByWorkspace(workspaceId);
      },
      // Authentication queries
      ...authResolvers.Query,
    },
    Mutation: {
      // Authentication mutations
      ...authResolvers.Mutation,

      updateMCPServerRunOn: async (
        _parent: unknown,
        { mcpServerId, runOn, runtimeId }: { mcpServerId: string; runOn: MCP_SERVER_RUN_ON; runtimeId?: string | null },
      ) => {
        await mcpServerRepository.updateRunOn(mcpServerId, runOn);
        if (runOn !== 'EDGE') {
          return mcpServerRepository.unlinkRuntime(mcpServerId);
        }
        if (runtimeId) {
          return mcpServerRepository.linkRuntime(mcpServerId, runtimeId);
        }
        return mcpServerRepository.unlinkRuntime(mcpServerId);
      },
      createMCPServer: async (
        _parent: unknown,
        {
          name,
          description,
          repositoryUrl,
          transport,
          config,
          runOn,
          workspaceId,
        }: {
          name: string;
          description: string;
          repositoryUrl: string;
          transport: 'STREAM' | 'STDIO' | 'SSE';
          config: string;
          runOn?: MCP_SERVER_RUN_ON | null;
          workspaceId: string;
        },
      ) => {
        return mcpServerRepository.create(
          name,
          description,
          repositoryUrl,
          transport,
          config,
          runOn ?? null,
          workspaceId,
        );
      },
      createRuntime: async (
        _parent: unknown,
        {
          name,
          description,
          workspaceId,
          capabilities,
        }: {
          name: string;
          description: string;
          workspaceId: string;
          capabilities: string[];
        },
      ) => {
        return runtimeRepository.create(name, description, 'INACTIVE', workspaceId, capabilities);
      },
      updateRuntime: async (
        _parent: unknown,
        {
          id,
          name,
          description,
        }: {
          id: string;
          name: string;
          description: string;
        },
      ) => {
        return runtimeRepository.update(id, name, description);
      },
      deleteRuntime: async (_parent: unknown, { id }: { id: string }) => {
        return runtimeRepository.delete(id);
      },
      linkMCPToolToRuntime: async (
        _parent: unknown,
        {
          mcpToolId,
          runtimeId,
        }: {
          mcpToolId: string;
          runtimeId: string;
        },
      ) => {
        return runtimeRepository.linkMCPToolToRuntime(mcpToolId, runtimeId);
      },
      unlinkMCPToolFromRuntime: async (
        _parent: unknown,
        {
          mcpToolId,
          runtimeId,
        }: {
          mcpToolId: string;
          runtimeId: string;
        },
      ) => {
        return runtimeRepository.unlinkMCPToolFromRuntime(mcpToolId, runtimeId);
      },
      linkMCPServerToRuntime: async (
        _parent: unknown,
        {
          mcpServerId,
          runtimeId,
        }: {
          mcpServerId: string;
          runtimeId: string;
        },
      ) => {
        return mcpServerRepository.linkRuntime(mcpServerId, runtimeId);
      },
      unlinkMCPServerFromRuntime: async (
        _parent: unknown,
        {
          mcpServerId,
        }: {
          mcpServerId: string;
        },
      ) => {
        return mcpServerRepository.unlinkRuntime(mcpServerId);
      },
      updateMCPServer: async (
        _parent: unknown,
        {
          id,
          name,
          description,
          repositoryUrl,
          transport,
          config,
          runOn,
        }: {
          id: string;
          name: string;
          description: string;
          repositoryUrl: string;
          transport: 'STREAM' | 'STDIO' | 'SSE';
          config: string;
          runOn?: MCP_SERVER_RUN_ON | null;
        },
      ) => {
        return mcpServerRepository.update(id, name, description, repositoryUrl, transport, config, runOn ?? null);
      },
      deleteMCPServer: async (_parent: unknown, { id }: { id: string }) => {
        return mcpServerRepository.delete(id);
      },
      updateWorkspace: async (_parent: unknown, { id, name }: { id: string; name: string }) => {
        return workspaceRepository.update(id, name);
      },
      setGlobalRuntime: async (_parent: unknown, { id, runtimeId }: { id: string; runtimeId: string }) => {
        await workspaceRepository.setGlobalRuntime(runtimeId);
        return workspaceRepository.findById(id);
      },
      unsetGlobalRuntime: async (_parent: unknown, { id }: { id: string }) => {
        await workspaceRepository.unsetGlobalRuntime(id);
        return workspaceRepository.findById(id);
      },
      initSystem: async (_parent: unknown, { adminPassword, email }: { adminPassword: string; email: string }) => {
        return systemRepository.initSystem(adminPassword, email);
      },
      callMCPTool: async (_parent: unknown, { toolId, input }: { toolId: string; input: string }) => {
        try {
          return runtimeRepository.callMCPTool(toolId, input);
        } catch (error: unknown) {
          return {
            success: false,
            result: 'Failed to call MCP tool: ' + (error instanceof Error ? error.message : String(error)),
          };
        }
      },
      createMCPRegistry: async (
        _parent: unknown,
        { workspaceId, name, upstreamUrl }: { workspaceId: string; name: string; upstreamUrl: string },
      ) => {
        console.log('create mcp registry', workspaceId, name, upstreamUrl);
        return registryRepository.createRegistry(workspaceId, name, upstreamUrl);
      },
      deleteMCPRegistry: async (_parent: unknown, { id }: { id: string }) => {
        return registryRepository.deleteRegistry(id);
      },
      syncUpstreamRegistry: async (_parent: unknown, { registryId }: { registryId: string }) => {
        return registryRepository.syncUpstream(registryId);
      },

      // Onboarding mutations
      completeOnboardingStep: async (
        _parent: unknown,
        { workspaceId, stepId }: { workspaceId: string; stepId: string },
      ) => {
        await workspaceRepository.completeOnboardingStep(workspaceId, stepId);
        return true;
      },

      dismissOnboardingStep: async (
        _parent: unknown,
        { workspaceId, stepId }: { workspaceId: string; stepId: string },
      ) => {
        await workspaceRepository.dismissOnboardingStep(workspaceId, stepId);
        return true;
      },
    },
    Runtime: {},
    MCPServer: {},
    MCPTool: {},
    Subscription: {
      workspace: {
        subscribe: (_parent: unknown, { workspaceId }: { workspaceId: string }) => {
          const observable = workspaceRepository.observeWorkspace(workspaceId);
          return observableToAsyncGenerator(observable, 'workspace');
        },
      },
      runtimes: {
        subscribe: (_parent: unknown, { workspaceId }: { workspaceId: string }) => {
          const observable = workspaceRepository.observeRuntimes(workspaceId);
          return observableToAsyncGenerator(observable, 'runtimes');
        },
      },
      mcpServers: {
        subscribe: (_parent: unknown, { workspaceId }: { workspaceId: string }) => {
          const observable = workspaceRepository.observeMCPServers(workspaceId);
          return observableToAsyncGenerator(observable, 'mcpServers');
        },
      },
      workspaces: {
        subscribe: () => {
          const observable = workspaceRepository.observeWorkspaces();
          return observableToAsyncGenerator(observable, 'workspaces');
        },
      },
      toolCalls: {
        subscribe: (_parent: unknown, { workspaceId }: { workspaceId: string }) => {
          const observable = monitoringRepository.observeToolCalls(workspaceId);
          return observableToAsyncGenerator(observable, 'toolCalls');
        },
      },
    },
  };
};
