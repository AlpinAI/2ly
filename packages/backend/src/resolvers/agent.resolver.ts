import { apolloResolversTypes } from '@2ly/common';
import { Container } from 'inversify';
import { GraphQLError } from 'graphql';
import { AgentService } from '../services/agent.service';
import { AgentRepository, WorkspaceRepository } from '../repositories';
import { GraphQLContext } from '../types';
import { requireAuth, requireWorkspaceAccess, requireAuthAndWorkspaceAccess } from '../database/authorization.helpers';

/**
 * Factory function to create agent resolver functions for GraphQL schema.
 */
export function createAgentResolvers(container: Container) {
  const agentService = container.get(AgentService);
  const agentRepository = container.get(AgentRepository);
  const workspaceRepository = container.get(WorkspaceRepository);

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
    },
  };
}
