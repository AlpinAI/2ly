import { GraphQLDateTime } from 'graphql-scalars';
import { container as defaultContainer } from '../di/container';
import { apolloResolversTypes, MCP_SERVER_RUN_ON } from '@2ly/common';
import { Observable } from 'rxjs';
import { latestValueFrom } from 'rxjs-for-await';
import { MCPServerAutoConfigService } from '../services/mcp-auto-config.service';
import {
  MCPServerRepository,
  RuntimeRepository,
  WorkspaceRepository,
  SystemRepository,
  UserRepository,
  MonitoringRepository,
  ToolSetRepository,
  IdentityRepository,
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
  const mcpServerRepository = container.get(MCPServerRepository);
  const runtimeRepository = container.get(RuntimeRepository);
  const workspaceRepository = container.get(WorkspaceRepository);
  const toolSetRepository = container.get(ToolSetRepository);
  const identityRepository = container.get(IdentityRepository);
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
      toolSets: async (_parent: unknown, { workspaceId }: { workspaceId: string }) => {
        return toolSetRepository.findByWorkspace(workspaceId);
      },
      system: async () => {
        return systemRepository.getSystem();
      },
      infra: async () => {
        let exposedNatsServers = 'localhost:4222';
        let exposedRemoteMCP = 'localhost:3001';
        if (process.env.EXPOSED_NATS_SERVERS) {
          exposedNatsServers = process.env.EXPOSED_NATS_SERVERS;
        }
        if (process.env.EXPOSED_REMOTE_MCP) {
          exposedRemoteMCP = process.env.EXPOSED_REMOTE_MCP;
        }
        return {
          nats: exposedNatsServers,
          remoteMCP: exposedRemoteMCP,
        };
      },
      workspaceMCPTools: async (_parent: unknown, { workspaceId }: { workspaceId: string }) => {
        return workspaceRepository.findById(workspaceId);
      },
      isMCPAutoConfigEnabled: async () => {
        return mcpAutoConfigService.isConfigured();
      },
      getRegistryServers: async (_parent: unknown, { workspaceId }: { workspaceId: string }) => {
        return workspaceRepository.findRegistryServersByWorkspace(workspaceId);
      },
      // Monitoring query with filtering and pagination
      toolCalls: async (
        _parent: unknown,
        args: apolloResolversTypes.QueryToolCallsArgs
      ) => {
        return monitoringRepository.queryToolCalls({
          workspaceId: args.workspaceId,
          limit: args.limit ?? 100,
          offset: args.offset ?? 0,
          filters: args.filters ?? undefined,
          orderDirection: args.orderDirection ?? undefined,
        });
      },
      // Key management queries
      workspaceKeys: async (_parent: unknown, { workspaceId }: { workspaceId: string }) => {
        return identityRepository.findKeysByRelatedId(workspaceId);
      },
      toolsetKey: async (_parent: unknown, { toolsetId }: { toolsetId: string }) => {
        const keys = await identityRepository.findKeysByRelatedId(toolsetId);
        return keys.length > 0 ? keys[0] : null;
      },
      keyValue: async (_parent: unknown, { keyId }: { keyId: string }) => {
        const key = await identityRepository.findKeyById(keyId);
        if (!key) {
          throw new Error('Key not found');
        }
        return key.key;
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
          registryServerId,
        }: {
          name: string;
          description: string;
          repositoryUrl: string;
          transport: 'STREAM' | 'STDIO' | 'SSE';
          config: string;
          runOn?: MCP_SERVER_RUN_ON | null;
          workspaceId: string;
          registryServerId: string;
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
          registryServerId,
        );
      },
      createRuntime: async (
        _parent: unknown,
        {
          name,
          description,
          workspaceId,
          type,
        }: {
          name: string;
          description: string;
          workspaceId: string;
          type: 'EDGE' | 'MCP';
        },
      ) => {
        return runtimeRepository.create(name, description, 'INACTIVE', workspaceId, type);
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
      // Registry server mutations
      addServerToRegistry: async (
        _parent: unknown,
        args: apolloResolversTypes.MutationAddServerToRegistryArgs,
      ) => {
        return workspaceRepository.addServerToWorkspace(args.workspaceId, {
          name: args.name,
          description: args.description,
          title: args.title,
          repositoryUrl: args.repositoryUrl,
          version: args.version,
          packages: args.packages ?? undefined,
          remotes: args.remotes ?? undefined,
        });
      },
      updateServerInRegistry: async (
        _parent: unknown,
        args: apolloResolversTypes.MutationUpdateServerInRegistryArgs,
      ) => {
        return workspaceRepository.updateServerInWorkspace(args.serverId, {
          name: args.name ?? undefined,
          description: args.description ?? undefined,
          title: args.title ?? undefined,
          repositoryUrl: args.repositoryUrl ?? undefined,
          version: args.version ?? undefined,
          packages: args.packages ?? undefined,
          remotes: args.remotes ?? undefined,
        });
      },
      removeServerFromRegistry: async (_parent: unknown, { serverId }: { serverId: string }) => {
        return workspaceRepository.removeServerFromWorkspace(serverId);
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

      // Key management mutations
      createWorkspaceKey: async (
        _parent: unknown,
        { workspaceId, description }: { workspaceId: string; description: string },
      ) => {
        return identityRepository.createKey('workspace', workspaceId, description);
      },

      revokeKey: async (_parent: unknown, { keyId }: { keyId: string }) => {
        const key = await identityRepository.findKeyById(keyId);
        if (!key) {
          throw new Error('Key not found');
        }
        return identityRepository.revokeKey(key.key);
      },

      // ToolSet mutations
      createToolSet: async (
        _parent: unknown,
        { name, description, workspaceId }: { name: string; description: string; workspaceId: string },
      ) => {
        return toolSetRepository.create(name, description, workspaceId);
      },

      updateToolSet: async (
        _parent: unknown,
        { id, name, description }: { id: string; name: string; description: string },
      ) => {
        return toolSetRepository.update(id, name, description);
      },

      deleteToolSet: async (_parent: unknown, { id }: { id: string }) => {
        return toolSetRepository.delete(id);
      },

      addMCPToolToToolSet: async (
        _parent: unknown,
        { mcpToolId, toolSetId }: { mcpToolId: string; toolSetId: string },
      ) => {
        return toolSetRepository.addMCPToolToToolSet(mcpToolId, toolSetId);
      },

      removeMCPToolFromToolSet: async (
        _parent: unknown,
        { mcpToolId, toolSetId }: { mcpToolId: string; toolSetId: string },
      ) => {
        return toolSetRepository.removeMCPToolFromToolSet(mcpToolId, toolSetId);
      },
    },
    Runtime: {},
    MCPServer: {},
    MCPTool: {},
    ToolSet: {},
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
      mcpTools: {
        subscribe: (_parent: unknown, { workspaceId }: { workspaceId: string }) => {
          const observable = workspaceRepository.observeMCPTools(workspaceId);
          return observableToAsyncGenerator(observable, 'mcpTools');
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
      toolSets: {
        subscribe: (_parent: unknown, { workspaceId }: { workspaceId: string }) => {
          const observable = toolSetRepository.observeToolSets(workspaceId);
          return observableToAsyncGenerator(observable, 'toolSets');
        },
      },
    },
  };
};
