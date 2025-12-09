import { GraphQLDateTime } from 'graphql-scalars';
import { GraphQLError } from 'graphql';
import { container as defaultContainer } from '../di/container';
import { apolloResolversTypes, LoggerService, EXECUTION_TARGET } from '@skilder-ai/common';
import { Observable } from 'rxjs';
import { latestValueFrom } from 'rxjs-for-await';
import {
  MCPServerRepository,
  MCPToolRepository,
  RuntimeRepository,
  WorkspaceRepository,
  SystemRepository,
  UserRepository,
  MonitoringRepository,
  SkillRepository,
  IdentityRepository,
  KEY_NATURE_PREFIX,
} from '../repositories';
import { createAuthResolvers } from '../resolvers/auth.resolver';
import { createAIProviderResolvers } from '../resolvers/ai-provider.resolver';
import { AuthenticationService, JwtService, PasswordPolicyService } from '../services/auth';
import { Container } from 'inversify';
import { requireAuth, requireWorkspaceAccess, requireAuthAndWorkspaceAccess, withPeriodicValidation } from './authorization.helpers';
import { validateRuntimeForWorkspace, updateExecutionTargetWithRuntime, applyRuntimeLinking } from './execution-target.helpers';
import { GraphQLContext } from '../types';

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
  const skillRepository = container.get(SkillRepository);
  const identityRepository = container.get(IdentityRepository);
  const authenticationService = container.get(AuthenticationService);
  const jwtService = container.get(JwtService);
  const monitoringRepository = container.get(MonitoringRepository);

  // Create authentication resolvers
  const userRepository = container.get(UserRepository);
  const passwordPolicyService = container.get(PasswordPolicyService);
  const authResolvers = createAuthResolvers(authenticationService, jwtService, userRepository, passwordPolicyService);

  // Create AI provider resolvers
  const aiProviderResolvers = createAIProviderResolvers(container);

  return {
    Date: GraphQLDateTime,
    Query: {

      workspaces: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
        const userId = requireAuth(context);
        return workspaceRepository.findAll(userId);
      },
      workspace: async (
        _parent: unknown,
        { workspaceId }: { workspaceId: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return workspaceRepository.findByIdWithRuntimes(workspaceId);
      },
      mcpServers: async (
        _parent: unknown,
        { workspaceId }: { workspaceId: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return mcpServerRepository.findByWorkspace(workspaceId);
      },
      mcpTools: async (
        _parent: unknown,
        { workspaceId }: { workspaceId: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return workspaceRepository.findMCPToolsByWorkspace(workspaceId);
      },
      skills: async (
        _parent: unknown,
        { workspaceId }: { workspaceId: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return skillRepository.findByWorkspace(workspaceId);
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
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return workspaceRepository.findById(workspaceId);
      },
      getRegistryServers: async (
        _parent: unknown,
        { workspaceId }: { workspaceId: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return workspaceRepository.findRegistryServersByWorkspace(workspaceId);
      },
      // Monitoring query with filtering and pagination
      toolCalls: async (
        _parent: unknown,
        args: apolloResolversTypes.QueryToolCallsArgs,
        context: GraphQLContext
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
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return identityRepository.findKeysByRelatedId(workspaceId);
      },
      skillKey: async (
        _parent: unknown,
        { skillId }: { skillId: string },
        context: GraphQLContext
      ) => {
        const userId = requireAuth(context);
        const skill = await skillRepository.findById(skillId);
        if (!skill?.workspace?.id) {
          throw new GraphQLError('Skill not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, skill.workspace.id);
        const keys = await identityRepository.findKeysByRelatedId(skillId);
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
      // AI Provider queries
      ...aiProviderResolvers.Query,
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

      updateMCPServerExecutionTarget: async (
        _parent: unknown,
        { mcpServerId, executionTarget, runtimeId }: { mcpServerId: string; executionTarget: EXECUTION_TARGET; runtimeId?: string | null },
        context: GraphQLContext,
      ) => {
        const userId = requireAuth(context);
        const mcpServer = await mcpServerRepository.findById(mcpServerId);
        if (!mcpServer?.workspace?.id) {
          throw new GraphQLError('MCP Server not found', { extensions: { code: 'NOT_FOUND' } });
        }
        if (runtimeId) {
          await validateRuntimeForWorkspace(runtimeRepository, runtimeId, mcpServer.workspace.id, 'MCP Server');
        }
        await requireWorkspaceAccess(workspaceRepository, userId, mcpServer.workspace.id);
        return updateExecutionTargetWithRuntime(mcpServerRepository, mcpServerId, executionTarget, runtimeId);
      },
      createMCPServer: async (
        _parent: unknown,
        {
          name,
          description,
          repositoryUrl,
          transport,
          config,
          executionTarget,
          workspaceId,
          registryServerId,
        }: {
          name: string;
          description: string;
          repositoryUrl: string;
          transport: 'STREAM' | 'STDIO' | 'SSE';
          config: string;
          executionTarget?: EXECUTION_TARGET | null;
          workspaceId: string;
          registryServerId: string;
        },
        context: GraphQLContext,
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return mcpServerRepository.create(
          name,
          description,
          repositoryUrl,
          transport,
          config,
          executionTarget ?? null,
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
        context: GraphQLContext,
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
        context: GraphQLContext,
      ) => {
        const userId = requireAuth(context);
        const runtime = await runtimeRepository.getRuntime(id);
        if (!runtime?.workspace?.id) {
          throw new GraphQLError('Runtime not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, runtime.workspace.id);
        return runtimeRepository.update(id, name, description);
      },
      deleteRuntime: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
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
        context: GraphQLContext,
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
        context: GraphQLContext,
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
          executionTarget,
        }: {
          id: string;
          name: string;
          description: string;
          repositoryUrl: string;
          transport: 'STREAM' | 'STDIO' | 'SSE';
          config: string;
          executionTarget?: EXECUTION_TARGET | null;
        },
        context: GraphQLContext,
      ) => {
        const userId = requireAuth(context);
        const mcpServer = await mcpServerRepository.findById(id);
        if (!mcpServer?.workspace?.id) {
          throw new GraphQLError('MCP Server not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, mcpServer.workspace.id);
        return mcpServerRepository.update(id, name, description, repositoryUrl, transport, config, executionTarget ?? null);
      },
      deleteMCPServer: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
        const userId = requireAuth(context);
        const mcpServer = await mcpServerRepository.findById(id);
        if (!mcpServer?.workspace?.id) {
          throw new GraphQLError('MCP Server not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, mcpServer.workspace.id);
        return mcpServerRepository.delete(id);
      },
      updateWorkspace: async (_parent: unknown, { id, name }: { id: string; name: string }, context: GraphQLContext) => {
        // For updateWorkspace, the id IS the workspaceId
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, id);
        return workspaceRepository.update(id, name);
      },
      initSystem: async (_parent: unknown, { adminPassword, email }: { adminPassword: string; email: string }) => {
        return systemRepository.initSystem(adminPassword, email);
      },
      callMCPTool: async (_parent: unknown, { toolId, input }: { toolId: string; input: string }, context: GraphQLContext) => {
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
        context: GraphQLContext,
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
        context: GraphQLContext,
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
      removeServerFromRegistry: async (_parent: unknown, { serverId }: { serverId: string }, context: GraphQLContext) => {
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
        context: GraphQLContext,
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        await workspaceRepository.completeOnboardingStep(workspaceId, stepId);
        return true;
      },

      dismissOnboardingStep: async (
        _parent: unknown,
        { workspaceId, stepId }: { workspaceId: string; stepId: string },
        context: GraphQLContext,
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        await workspaceRepository.dismissOnboardingStep(workspaceId, stepId);
        return true;
      },

      // Key management mutations
      createWorkspaceKey: async (
        _parent: unknown,
        { workspaceId, description }: { workspaceId: string; description: string },
        context: GraphQLContext,
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return identityRepository.createKey('workspace', workspaceId, description);
      },

      revokeKey: async (_parent: unknown, { keyId }: { keyId: string }, context: GraphQLContext) => {
        const userId = requireAuth(context);
        const key = await identityRepository.findKeyById(keyId);
        if (!key) {
          throw new GraphQLError('Key not found', { extensions: { code: 'NOT_FOUND' } });
        }
        // Determine workspace based on key type prefix
        const prefix = key.key.substring(0, 3);
        let workspaceId: string | undefined;
        if (prefix === KEY_NATURE_PREFIX.workspace) {
          // Workspace key - relatedId is the workspace ID
          workspaceId = key.relatedId;
        } else if (prefix === KEY_NATURE_PREFIX.skill) {
          // Skill key - lookup skill to get workspace
          const skill = await skillRepository.findById(key.relatedId);
          workspaceId = skill?.workspace?.id;
        } else if (prefix === KEY_NATURE_PREFIX.runtime) {
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

      // Skill mutations
      createSkill: async (
        _parent: unknown,
        { name, description, workspaceId }: { name: string; description: string; workspaceId: string },
        context: GraphQLContext,
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return skillRepository.create(name, description, workspaceId);
      },

      updateSkill: async (
        _parent: unknown,
        { id, name, description }: { id: string; name: string; description: string },
        context: GraphQLContext,
      ) => {
        const userId = requireAuth(context);
        const skill = await skillRepository.findById(id);
        if (!skill?.workspace?.id) {
          throw new GraphQLError('Skill not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, skill.workspace.id);
        return skillRepository.update(id, name, description);
      },

      deleteSkill: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
        const userId = requireAuth(context);
        const skill = await skillRepository.findById(id);
        if (!skill?.workspace?.id) {
          throw new GraphQLError('Skill not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, skill.workspace.id);
        return skillRepository.delete(id);
      },

      addMCPToolToSkill: async (
        _parent: unknown,
        { mcpToolId, skillId }: { mcpToolId: string; skillId: string },
        context: GraphQLContext,
      ) => {
        const userId = requireAuth(context);
        const tool = await mcpToolRepository.getToolWithWorkspace(mcpToolId);
        if (!tool?.workspace?.id) {
          throw new GraphQLError('MCP Tool not found', { extensions: { code: 'NOT_FOUND' } });
        }
        const skill = await skillRepository.findById(skillId);
        if (!skill?.workspace?.id) {
          throw new GraphQLError('Skill not found', { extensions: { code: 'NOT_FOUND' } });
        }
        if (tool.workspace.id !== skill.workspace.id) {
          throw new GraphQLError('MCP Tool and Skill must belong to the same workspace', {
            extensions: { code: 'BAD_REQUEST' },
          });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, tool.workspace.id);
        return skillRepository.addMCPToolToSkill(mcpToolId, skillId);
      },

      removeMCPToolFromSkill: async (
        _parent: unknown,
        { mcpToolId, skillId }: { mcpToolId: string; skillId: string },
        context: GraphQLContext,
      ) => {
        const userId = requireAuth(context);
        const tool = await mcpToolRepository.getToolWithWorkspace(mcpToolId);
        if (!tool?.workspace?.id) {
          throw new GraphQLError('MCP Tool not found', { extensions: { code: 'NOT_FOUND' } });
        }
        const skill = await skillRepository.findById(skillId);
        if (!skill?.workspace?.id) {
          throw new GraphQLError('Skill not found', { extensions: { code: 'NOT_FOUND' } });
        }
        if (tool.workspace.id !== skill.workspace.id) {
          throw new GraphQLError('MCP Tool and Skill must belong to the same workspace', {
            extensions: { code: 'BAD_REQUEST' },
          });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, tool.workspace.id);
        return skillRepository.removeMCPToolFromSkill(mcpToolId, skillId);
      },

      updateSkillMode: async (
        _parent: unknown,
        { id, mode }: apolloResolversTypes.MutationUpdateSkillModeArgs,
        context: GraphQLContext,
      ) => {
        const userId = requireAuth(context);
        const skill = await skillRepository.findById(id);
        if (!skill?.workspace?.id) {
          throw new GraphQLError('Skill not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, skill.workspace.id);
        return skillRepository.updateMode(id, mode);
      },

      updateSkillSmartConfig: async (
        _parent: unknown,
        { input }: apolloResolversTypes.MutationUpdateSkillSmartConfigArgs,
        context: GraphQLContext,
      ) => {
        const userId = requireAuth(context);
        const skill = await skillRepository.findById(input.id);
        if (!skill?.workspace?.id) {
          throw new GraphQLError('Skill not found', { extensions: { code: 'NOT_FOUND' } });
        }
        if (input.runtimeId) {
          await validateRuntimeForWorkspace(runtimeRepository, input.runtimeId, skill.workspace.id, 'Skill');
        }
        await requireWorkspaceAccess(workspaceRepository, userId, skill.workspace.id);

        // Update the smart config fields
        await skillRepository.updateSmartConfig(input.id, {
          model: input.model ?? undefined,
          temperature: input.temperature ?? undefined,
          maxTokens: input.maxTokens ?? undefined,
          systemPrompt: input.systemPrompt ?? undefined,
          executionTarget: input.executionTarget ?? undefined,
        });

        // Handle runtime linking/unlinking based on executionTarget
        if (input.executionTarget) {
          return applyRuntimeLinking(skillRepository, input.id, input.executionTarget, input.runtimeId);
        }

        // Return the updated skill
        const updatedSkill = await skillRepository.findById(input.id);
        if (!updatedSkill) {
          throw new GraphQLError('Skill not found after update', { extensions: { code: 'NOT_FOUND' } });
        }
        return updatedSkill;
      },

      // AI Provider mutations
      ...aiProviderResolvers.Mutation,
    },
    Runtime: {},
    MCPServer: {},
    MCPTool: {},
    Skill: {},
    Subscription: {
      // SECURITY: All workspace-scoped subscriptions use withPeriodicValidation
      // to re-check access every 5 minutes and complete gracefully if revoked
      workspace: {
        subscribe: async (
          _parent: unknown,
          { workspaceId }: { workspaceId: string },
          context: GraphQLContext
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
          context: GraphQLContext
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
          context: GraphQLContext
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
          context: GraphQLContext
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
        subscribe: (_parent: unknown, _args: unknown, context: GraphQLContext) => {
          const userId = requireAuth(context);
          const observable = workspaceRepository.observeWorkspaces(userId);
          return observableToAsyncGenerator(observable, 'workspaces');
        },
      },
      toolCalls: {
        subscribe: async (
          _parent: unknown,
          { workspaceId }: { workspaceId: string },
          context: GraphQLContext
        ) => {
          const userId = await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
          const observable = monitoringRepository.observeToolCalls(workspaceId);
          const generator = observableToAsyncGenerator(observable, 'toolCalls');
          return withPeriodicValidation(generator, userId, workspaceId, workspaceRepository, logger);
        },
      },
      skills: {
        subscribe: async (
          _parent: unknown,
          { workspaceId }: { workspaceId: string },
          context: GraphQLContext
        ) => {
          const userId = await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
          const observable = skillRepository.observeSkills(workspaceId);
          const generator = observableToAsyncGenerator(observable, 'skills');
          return withPeriodicValidation(generator, userId, workspaceId, workspaceRepository, logger);
        },
      },
    },
  };
};
