import { GraphQLDateTime } from 'graphql-scalars';
import { GraphQLError } from 'graphql';
import { container as defaultContainer } from '../di/container';
import { apolloResolversTypes, LoggerService, MCP_SERVER_RUN_ON } from '@2ly/common';
import { Observable } from 'rxjs';
import { latestValueFrom } from 'rxjs-for-await';
import { MCPServerAutoConfigService } from '../services/mcp-auto-config.service';
import {
  MCPServerRepository,
  MCPToolRepository,
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
import { requireAuth, requireWorkspaceAccess, requireAuthAndWorkspaceAccess, AuthContext, withPeriodicValidation } from './authorization.helpers';

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
  const logger = container.get(LoggerService).getLogger('resolvers');
  const systemRepository = container.get(SystemRepository);
  const mcpServerRepository = container.get(MCPServerRepository);
  const mcpToolRepository = container.get(MCPToolRepository);
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

      workspaces: async (_parent: unknown, _args: unknown, context: AuthContext) => {
        const userId = requireAuth(context);
        return workspaceRepository.findAll(userId);
      },
      workspace: async (
        _parent: unknown,
        { workspaceId }: { workspaceId: string },
        context: AuthContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return workspaceRepository.findByIdWithRuntimes(workspaceId);
      },
      mcpServers: async () => {
        return mcpServerRepository.findAll();
      },
      mcpTools: async (
        _parent: unknown,
        { workspaceId }: { workspaceId: string },
        context: AuthContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return workspaceRepository.findMCPToolsByWorkspace(workspaceId);
      },
      toolSets: async (
        _parent: unknown,
        { workspaceId }: { workspaceId: string },
        context: AuthContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return toolSetRepository.findByWorkspace(workspaceId);
      },
      system: async () => {
        return systemRepository.getSystem();
      },
      infra: async () => {
        let exposedNatsServers = '';
        let exposedRemoteMCP = '';
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
      workspaceMCPTools: async (
        _parent: unknown,
        { workspaceId }: { workspaceId: string },
        context: AuthContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return workspaceRepository.findById(workspaceId);
      },
      isMCPAutoConfigEnabled: async () => {
        return mcpAutoConfigService.isConfigured();
      },
      getRegistryServers: async (
        _parent: unknown,
        { workspaceId }: { workspaceId: string },
        context: AuthContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return workspaceRepository.findRegistryServersByWorkspace(workspaceId);
      },
      // Monitoring query with filtering and pagination
      toolCalls: async (
        _parent: unknown,
        args: apolloResolversTypes.QueryToolCallsArgs,
        context: AuthContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, args.workspaceId);
        return monitoringRepository.queryToolCalls({
          workspaceId: args.workspaceId,
          limit: args.limit ?? 100,
          offset: args.offset ?? 0,
          filters: args.filters ?? undefined,
          orderDirection: args.orderDirection ?? undefined,
        });
      },
      // Key management queries
      workspaceKeys: async (
        _parent: unknown,
        { workspaceId }: { workspaceId: string },
        context: AuthContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
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

      // Override registerUser to create personal workspace
      registerUser: async (
        _: unknown,
        { input }: { input: apolloResolversTypes.RegisterUserInput }
      ) => {
        // Register the user first using the original resolver
        const result = await authResolvers.Mutation.registerUser(_, { input });

        // If registration was successful, create a personal workspace
        if (result.success && result.user) {
          try {
            const workspaceName = `Personal Workspace (${input.email})`;
            await workspaceRepository.create(workspaceName, result.user.id);
          } catch (error) {
            console.error('Failed to create personal workspace for new user:', error);
            // Don't fail the registration if workspace creation fails
          }
        }

        return result;
      },

      updateMCPServerRunOn: async (
        _parent: unknown,
        { mcpServerId, runOn, runtimeId }: { mcpServerId: string; runOn: MCP_SERVER_RUN_ON; runtimeId?: string | null },
        context: AuthContext,
      ) => {
        const userId = requireAuth(context);
        const mcpServer = await mcpServerRepository.findById(mcpServerId);
        if (!mcpServer?.workspace?.id) {
          throw new GraphQLError('MCP Server not found', { extensions: { code: 'NOT_FOUND' } });
        }
        // If runtimeId provided, verify it belongs to the same workspace
        // or that it's a system runtime
        if (runtimeId) {
          const runtime = await runtimeRepository.getRuntime(runtimeId);
          if (!runtime?.workspace?.id && !runtime?.system?.id) {
            throw new GraphQLError('Runtime not found', { extensions: { code: 'NOT_FOUND' } });
          }
          if (runtime.workspace?.id && mcpServer.workspace.id !== runtime.workspace.id) {
            throw new GraphQLError('MCP Server and Runtime must belong to the same workspace', {
              extensions: { code: 'BAD_REQUEST' },
            });
          }
        }
        await requireWorkspaceAccess(workspaceRepository, userId, mcpServer.workspace.id);
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
        context: AuthContext,
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
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
        context: AuthContext,
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return runtimeRepository.create('workspace', workspaceId, name, description, 'INACTIVE', type);
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
        context: AuthContext,
      ) => {
        const userId = requireAuth(context);
        const runtime = await runtimeRepository.getRuntime(id);
        if (!runtime?.workspace?.id) {
          throw new GraphQLError('Runtime not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, runtime.workspace.id);
        return runtimeRepository.update(id, name, description);
      },
      deleteRuntime: async (_parent: unknown, { id }: { id: string }, context: AuthContext) => {
        const userId = requireAuth(context);
        const runtime = await runtimeRepository.getRuntime(id);
        if (!runtime?.workspace?.id) {
          throw new GraphQLError('Runtime not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, runtime.workspace.id);
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
        context: AuthContext,
      ) => {
        const userId = requireAuth(context);
        const mcpServer = await mcpServerRepository.findById(mcpServerId);
        if (!mcpServer?.workspace?.id) {
          throw new GraphQLError('MCP Server not found', { extensions: { code: 'NOT_FOUND' } });
        }
        const runtime = await runtimeRepository.getRuntime(runtimeId);
        if (!runtime?.workspace?.id) {
          throw new GraphQLError('Runtime not found', { extensions: { code: 'NOT_FOUND' } });
        }
        if (mcpServer.workspace.id !== runtime.workspace.id) {
          throw new GraphQLError('MCP Server and Runtime must belong to the same workspace', {
            extensions: { code: 'BAD_REQUEST' },
          });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, mcpServer.workspace.id);
        return mcpServerRepository.linkRuntime(mcpServerId, runtimeId);
      },
      unlinkMCPServerFromRuntime: async (
        _parent: unknown,
        {
          mcpServerId,
        }: {
          mcpServerId: string;
        },
        context: AuthContext,
      ) => {
        const userId = requireAuth(context);
        const mcpServer = await mcpServerRepository.findById(mcpServerId);
        if (!mcpServer?.workspace?.id) {
          throw new GraphQLError('MCP Server not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, mcpServer.workspace.id);
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
        context: AuthContext,
      ) => {
        const userId = requireAuth(context);
        const mcpServer = await mcpServerRepository.findById(id);
        if (!mcpServer?.workspace?.id) {
          throw new GraphQLError('MCP Server not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, mcpServer.workspace.id);
        return mcpServerRepository.update(id, name, description, repositoryUrl, transport, config, runOn ?? null);
      },
      deleteMCPServer: async (_parent: unknown, { id }: { id: string }, context: AuthContext) => {
        const userId = requireAuth(context);
        const mcpServer = await mcpServerRepository.findById(id);
        if (!mcpServer?.workspace?.id) {
          throw new GraphQLError('MCP Server not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, mcpServer.workspace.id);
        return mcpServerRepository.delete(id);
      },
      updateWorkspace: async (_parent: unknown, { id, name }: { id: string; name: string }, context: AuthContext) => {
        // For updateWorkspace, the id IS the workspaceId
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, id);
        return workspaceRepository.update(id, name);
      },
      initSystem: async (_parent: unknown, { adminPassword, email }: { adminPassword: string; email: string }) => {
        return systemRepository.initSystem(adminPassword, email);
      },
      callMCPTool: async (_parent: unknown, { toolId, input }: { toolId: string; input: string }, context: AuthContext) => {
        const userId = requireAuth(context);
        const tool = await mcpToolRepository.getToolWithWorkspace(toolId);
        if (!tool?.workspace?.id) {
          throw new GraphQLError('MCP Tool not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, tool.workspace.id);
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
        context: AuthContext,
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, args.workspaceId);
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
        context: AuthContext,
      ) => {
        const userId = requireAuth(context);
        const server = await workspaceRepository.getRegistryServerById(args.serverId);
        if (!server?.workspace?.id) {
          throw new GraphQLError('Registry server not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, server.workspace.id);
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
      removeServerFromRegistry: async (_parent: unknown, { serverId }: { serverId: string }, context: AuthContext) => {
        const userId = requireAuth(context);
        const server = await workspaceRepository.getRegistryServerById(serverId);
        if (!server?.workspace?.id) {
          throw new GraphQLError('Registry server not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, server.workspace.id);
        return workspaceRepository.removeServerFromWorkspace(serverId);
      },

      // Onboarding mutations
      completeOnboardingStep: async (
        _parent: unknown,
        { workspaceId, stepId }: { workspaceId: string; stepId: string },
        context: AuthContext,
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        await workspaceRepository.completeOnboardingStep(workspaceId, stepId);
        return true;
      },

      dismissOnboardingStep: async (
        _parent: unknown,
        { workspaceId, stepId }: { workspaceId: string; stepId: string },
        context: AuthContext,
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        await workspaceRepository.dismissOnboardingStep(workspaceId, stepId);
        return true;
      },

      // Key management mutations
      createWorkspaceKey: async (
        _parent: unknown,
        { workspaceId, description }: { workspaceId: string; description: string },
        context: AuthContext,
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return identityRepository.createKey('workspace', workspaceId, description);
      },

      revokeKey: async (_parent: unknown, { keyId }: { keyId: string }, context: AuthContext) => {
        const userId = requireAuth(context);
        const key = await identityRepository.findKeyById(keyId);
        if (!key) {
          throw new GraphQLError('Key not found', { extensions: { code: 'NOT_FOUND' } });
        }
        // Determine workspace based on key type (prefix: WSK=workspace, TSK=toolset, RTK=runtime)
        const prefix = key.key.substring(0, 3);
        let workspaceId: string | undefined;
        if (prefix === 'WSK') {
          // Workspace key - relatedId is the workspace ID
          workspaceId = key.relatedId;
        } else if (prefix === 'TSK') {
          // Toolset key - lookup toolset to get workspace
          const toolSet = await toolSetRepository.findById(key.relatedId);
          workspaceId = toolSet?.workspace?.id;
        } else if (prefix === 'RTK') {
          // Runtime key - lookup runtime to get workspace
          const runtime = await runtimeRepository.getRuntime(key.relatedId);
          workspaceId = runtime?.workspace?.id;
        }
        if (!workspaceId) {
          throw new GraphQLError('Cannot determine workspace for key', { extensions: { code: 'BAD_REQUEST' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, workspaceId);
        return identityRepository.revokeKey(key.key);
      },

      // ToolSet mutations
      createToolSet: async (
        _parent: unknown,
        { name, description, workspaceId }: { name: string; description: string; workspaceId: string },
        context: AuthContext,
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return toolSetRepository.create(name, description, workspaceId);
      },

      updateToolSet: async (
        _parent: unknown,
        { id, name, description }: { id: string; name: string; description: string },
        context: AuthContext,
      ) => {
        const userId = requireAuth(context);
        const toolSet = await toolSetRepository.findById(id);
        if (!toolSet?.workspace?.id) {
          throw new GraphQLError('Tool Set not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, toolSet.workspace.id);
        return toolSetRepository.update(id, name, description);
      },

      deleteToolSet: async (_parent: unknown, { id }: { id: string }, context: AuthContext) => {
        const userId = requireAuth(context);
        const toolSet = await toolSetRepository.findById(id);
        if (!toolSet?.workspace?.id) {
          throw new GraphQLError('Tool Set not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, toolSet.workspace.id);
        return toolSetRepository.delete(id);
      },

      addMCPToolToToolSet: async (
        _parent: unknown,
        { mcpToolId, toolSetId }: { mcpToolId: string; toolSetId: string },
        context: AuthContext,
      ) => {
        const userId = requireAuth(context);
        const tool = await mcpToolRepository.getToolWithWorkspace(mcpToolId);
        if (!tool?.workspace?.id) {
          throw new GraphQLError('MCP Tool not found', { extensions: { code: 'NOT_FOUND' } });
        }
        const toolSet = await toolSetRepository.findById(toolSetId);
        if (!toolSet?.workspace?.id) {
          throw new GraphQLError('Tool Set not found', { extensions: { code: 'NOT_FOUND' } });
        }
        if (tool.workspace.id !== toolSet.workspace.id) {
          throw new GraphQLError('MCP Tool and Tool Set must belong to the same workspace', {
            extensions: { code: 'BAD_REQUEST' },
          });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, tool.workspace.id);
        return toolSetRepository.addMCPToolToToolSet(mcpToolId, toolSetId);
      },

      removeMCPToolFromToolSet: async (
        _parent: unknown,
        { mcpToolId, toolSetId }: { mcpToolId: string; toolSetId: string },
        context: AuthContext,
      ) => {
        const userId = requireAuth(context);
        const tool = await mcpToolRepository.getToolWithWorkspace(mcpToolId);
        if (!tool?.workspace?.id) {
          throw new GraphQLError('MCP Tool not found', { extensions: { code: 'NOT_FOUND' } });
        }
        const toolSet = await toolSetRepository.findById(toolSetId);
        if (!toolSet?.workspace?.id) {
          throw new GraphQLError('Tool Set not found', { extensions: { code: 'NOT_FOUND' } });
        }
        if (tool.workspace.id !== toolSet.workspace.id) {
          throw new GraphQLError('MCP Tool and Tool Set must belong to the same workspace', {
            extensions: { code: 'BAD_REQUEST' },
          });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, tool.workspace.id);
        return toolSetRepository.removeMCPToolFromToolSet(mcpToolId, toolSetId);
      },
    },
    Runtime: {},
    MCPServer: {},
    MCPTool: {},
    ToolSet: {},
    Subscription: {
      // SECURITY: All workspace-scoped subscriptions use withPeriodicValidation
      // to re-check access every 5 minutes and complete gracefully if revoked
      workspace: {
        subscribe: async (
          _parent: unknown,
          { workspaceId }: { workspaceId: string },
          context: AuthContext
        ) => {
          const userId = await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
          const observable = workspaceRepository.observeWorkspace(workspaceId);
          const generator = observableToAsyncGenerator(observable, 'workspace');
          return withPeriodicValidation(generator, userId, workspaceId, workspaceRepository, logger);
        },
      },
      runtimes: {
        subscribe: async (
          _parent: unknown,
          { workspaceId }: { workspaceId: string },
          context: AuthContext
        ) => {
          const userId = await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
          const observable = workspaceRepository.observeRuntimes(workspaceId);
          const generator = observableToAsyncGenerator(observable, 'runtimes');
          return withPeriodicValidation(generator, userId, workspaceId, workspaceRepository, logger);
        },
      },
      mcpServers: {
        subscribe: async (
          _parent: unknown,
          { workspaceId }: { workspaceId: string },
          context: AuthContext
        ) => {
          const userId = await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
          const observable = workspaceRepository.observeMCPServers(workspaceId);
          const generator = observableToAsyncGenerator(observable, 'mcpServers');
          return withPeriodicValidation(generator, userId, workspaceId, workspaceRepository, logger);
        },
      },
      mcpTools: {
        subscribe: async (
          _parent: unknown,
          { workspaceId }: { workspaceId: string },
          context: AuthContext
        ) => {
          const userId = await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
          const observable = workspaceRepository.observeMCPTools(workspaceId);
          const generator = observableToAsyncGenerator(observable, 'mcpTools');
          return withPeriodicValidation(generator, userId, workspaceId, workspaceRepository, logger);
        },
      },
      workspaces: {
        // Note: This subscription is user-scoped (lists user's workspaces), not workspace-scoped.
        // No periodic workspace validation needed as user is always viewing their own workspaces.
        subscribe: (_parent: unknown, _args: unknown, context: AuthContext) => {
          const userId = requireAuth(context);
          const observable = workspaceRepository.observeWorkspaces(userId);
          return observableToAsyncGenerator(observable, 'workspaces');
        },
      },
      toolCalls: {
        subscribe: async (
          _parent: unknown,
          { workspaceId }: { workspaceId: string },
          context: AuthContext
        ) => {
          const userId = await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
          const observable = monitoringRepository.observeToolCalls(workspaceId);
          const generator = observableToAsyncGenerator(observable, 'toolCalls');
          return withPeriodicValidation(generator, userId, workspaceId, workspaceRepository, logger);
        },
      },
      toolSets: {
        subscribe: async (
          _parent: unknown,
          { workspaceId }: { workspaceId: string },
          context: AuthContext
        ) => {
          const userId = await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
          const observable = toolSetRepository.observeToolSets(workspaceId);
          const generator = observableToAsyncGenerator(observable, 'toolSets');
          return withPeriodicValidation(generator, userId, workspaceId, workspaceRepository, logger);
        },
      },
    },
  };
};
