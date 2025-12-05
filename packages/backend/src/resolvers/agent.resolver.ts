import { apolloResolversTypes, EXECUTION_TARGET } from '@2ly/common';
import { Container } from 'inversify';
import { GraphQLError } from 'graphql';
import { AgentService } from '../services/agent.service';
import { AgentRepository, WorkspaceRepository, RuntimeRepository } from '../repositories';
import { GraphQLContext } from '../types';
import { requireAuth, requireWorkspaceAccess, requireAuthAndWorkspaceAccess } from '../database/authorization.helpers';

/**
 * Factory function to create agent resolver functions for GraphQL schema.
 */
export function createAgentResolvers(container: Container) {
  const agentService = container.get(AgentService);
  const agentRepository = container.get(AgentRepository);
  const workspaceRepository = container.get(WorkspaceRepository);
  const runtimeRepository = container.get(RuntimeRepository);

  return {
    Query: {
      getAgent: async (
        _: unknown,
        { id }: { id: string },
        context: GraphQLContext
      ) => {
        const userId = requireAuth(context);
        const agent = await agentRepository.findById(id);
        if (!agent?.workspace?.id) {
          throw new GraphQLError('Agent not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, agent.workspace.id);
        return agent;
      },

      getAgentsByWorkspace: async (
        _: unknown,
        { workspaceId }: { workspaceId: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return agentRepository.findAllByWorkspaceId(workspaceId);
      },
    },

    Mutation: {
      createAgent: async (
        _: unknown,
        { input }: { input: apolloResolversTypes.CreateAgentInput },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, input.workspaceId);

        // Apply default values
        const temperature = input.temperature ?? 1.0;
        const maxTokens = input.maxTokens ?? 4096;

        return agentRepository.create(
          input.name,
          input.description ?? undefined,
          input.systemPrompt,
          input.model,
          temperature,
          maxTokens,
          input.workspaceId,
          input.runOn as EXECUTION_TARGET | null | undefined,
        );
      },

      updateAgent: async (
        _: unknown,
        { input }: { input: apolloResolversTypes.UpdateAgentInput },
        context: GraphQLContext
      ) => {
        const userId = requireAuth(context);
        const agent = await agentRepository.findById(input.id);
        if (!agent?.workspace?.id) {
          throw new GraphQLError('Agent not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, agent.workspace.id);

        return agentRepository.update(
          input.id,
          input.name ?? undefined,
          input.description ?? undefined,
          input.systemPrompt ?? undefined,
          input.model ?? undefined,
          input.temperature ?? undefined,
          input.maxTokens ?? undefined,
          input.runOn as EXECUTION_TARGET | null | undefined,
        );
      },

      deleteAgent: async (
        _: unknown,
        { id }: { id: string },
        context: GraphQLContext
      ) => {
        const userId = requireAuth(context);
        const agent = await agentRepository.findById(id);
        if (!agent?.workspace?.id) {
          throw new GraphQLError('Agent not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, agent.workspace.id);
        return agentRepository.delete(id);
      },

      callAgent: async (
        _: unknown,
        { agentId, userMessages }: { agentId: string; userMessages: string[] },
        context: GraphQLContext
      ) => {
        const userId = requireAuth(context);
        const agent = await agentRepository.findById(agentId);
        if (!agent?.workspace?.id) {
          throw new GraphQLError('Agent not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, agent.workspace.id);
        return agentService.call(agentId, userMessages);
      },

      updateAgentRunOn: async (
        _: unknown,
        { agentId, runOn, runtimeId }: { agentId: string; runOn: EXECUTION_TARGET; runtimeId?: string | null },
        context: GraphQLContext
      ) => {
        const userId = requireAuth(context);
        const agent = await agentRepository.findById(agentId);
        if (!agent?.workspace?.id) {
          throw new GraphQLError('Agent not found', { extensions: { code: 'NOT_FOUND' } });
        }
        // If runtimeId provided, verify it belongs to the same workspace
        // or that it's a system runtime
        if (runtimeId) {
          const runtime = await runtimeRepository.getRuntime(runtimeId);
          if (!runtime?.workspace?.id && !runtime?.system?.id) {
            throw new GraphQLError('Runtime not found', { extensions: { code: 'NOT_FOUND' } });
          }
          if (runtime.workspace?.id && agent.workspace.id !== runtime.workspace.id) {
            throw new GraphQLError('Agent and Runtime must belong to the same workspace', {
              extensions: { code: 'BAD_REQUEST' },
            });
          }
        }
        await requireWorkspaceAccess(workspaceRepository, userId, agent.workspace.id);
        await agentRepository.updateRunOn(agentId, runOn);
        if (runOn !== 'EDGE') {
          return agentRepository.unlinkRuntime(agentId);
        }
        if (runtimeId) {
          return agentRepository.linkRuntime(agentId, runtimeId);
        }
        return agentRepository.unlinkRuntime(agentId);
      },
    },
  };
}
