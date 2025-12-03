import { apolloResolversTypes, dgraphResolversTypes } from '@2ly/common';
import { Container } from 'inversify';
import { GraphQLError } from 'graphql';
import { AIProviderService, AIProviderType } from '../services/ai/ai-provider.service';
import { AIProviderRepository, WorkspaceRepository } from '../repositories';
import { SkillRepository } from '../repositories/skill.repository';
import { GraphQLContext } from '../types';
import { requireAuth, requireWorkspaceAccess, requireAuthAndWorkspaceAccess } from '../database/authorization.helpers';

/**
 * Factory function to create resolver functions for GraphQL schema.
 */
export function createAIProviderResolvers(container: Container) {

  const aiProviderService = container.get(AIProviderService);
  const aiProviderRepository = container.get(AIProviderRepository);
  const workspaceRepository = container.get(WorkspaceRepository);
  const skillRepository = container.get(SkillRepository);

  return {
    Query: {
      getAIProviders: async (
        _: unknown,
        { workspaceId }: { workspaceId: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return aiProviderRepository.getByWorkspace(workspaceId);
      },

      getAIProvider: async (
        _: unknown,
        { provider, workspaceId }: { provider: apolloResolversTypes.AiProviderType; workspaceId: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return aiProviderRepository.findByType(workspaceId, provider.toUpperCase() as dgraphResolversTypes.AiProviderType);
      },

      getAIModels: async (
        _: unknown,
        { workspaceId }: { workspaceId: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return aiProviderRepository.listAllModels(workspaceId);
      },
    },
    Mutation: {
      configureAIProvider: async (
        _: unknown,
        {
          workspaceId,
          provider,
          apiKey,
          baseUrl,
        }: {
          workspaceId: string;
          provider: apolloResolversTypes.AiProviderType;
          apiKey?: string | null;
          baseUrl?: string | null;
        },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return aiProviderService.configure(workspaceId, provider.toLowerCase() as AIProviderType, apiKey ?? undefined, baseUrl ?? undefined);
      },

      removeAIProvider: async (
        _: unknown,
        { providerId }: { providerId: string },
        context: GraphQLContext
      ) => {
        const userId = requireAuth(context);
        const provider = await aiProviderRepository.findById(providerId);
        if (!provider) {
          throw new GraphQLError('AI provider not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await requireWorkspaceAccess(workspaceRepository, userId, provider.workspaceId);
        return aiProviderRepository.delete(providerId);
      },

      setDefaultAIModel: async (
        _: unknown,
        { workspaceId, defaultModel }: { workspaceId: string; defaultModel: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return aiProviderRepository.setDefaultModel(workspaceId, defaultModel);
      },

      chatWithModel: async (
        _: unknown,
        { workspaceId, model, message }: { workspaceId: string; model: string; message: string },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);
        return aiProviderService.chat(workspaceId, model, message);
      },

      chatWithSkill: async (
        _: unknown,
        {
          workspaceId,
          skillId,
          messages,
        }: {
          workspaceId: string;
          skillId: string;
          messages: Array<{ role: apolloResolversTypes.ChatMessageRole; content: string }>;
        },
        context: GraphQLContext
      ) => {
        await requireAuthAndWorkspaceAccess(workspaceRepository, context, workspaceId);

        // Fetch skill data
        const skill = await skillRepository.findById(skillId);
        if (!skill) {
          throw new GraphQLError('Skill not found', { extensions: { code: 'NOT_FOUND' } });
        }

        // Verify skill belongs to workspace
        if (skill.workspace?.id !== workspaceId) {
          throw new GraphQLError('Skill does not belong to workspace', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        // Get workspace default model
        const workspace = await workspaceRepository.findById(workspaceId);
        if (!workspace?.defaultAIModel) {
          throw new GraphQLError('No default AI model configured for workspace', {
            extensions: { code: 'PRECONDITION_FAILED' },
          });
        }

        // Build skill context for system message
        const toolsList = skill.mcpTools
          ?.map((tool) => `- ${tool.name}: ${tool.description}`)
          .join('\n') || 'No tools configured';

        const systemMessage = {
          role: 'system' as const,
          content: `You are a helpful assistant that answers questions about a skill called "${skill.name}".

Skill Description: ${skill.description || 'No description provided'}

Available Tools:
${toolsList}

You should help users understand what this skill does, what tools it has, and how to use it effectively. Be concise and helpful.`,
        };

        // Convert GraphQL message format to service format
        const conversationMessages = messages.map((msg) => ({
          role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
          content: msg.content,
        }));

        // Prepend system message if not already present
        const hasSystemMessage = conversationMessages.some((msg) => msg.role === 'system');
        const fullMessages = hasSystemMessage
          ? conversationMessages
          : [systemMessage, ...conversationMessages];

        return aiProviderService.chatWithHistory(workspaceId, workspace.defaultAIModel, fullMessages);
      },
    },
  };
}
