import { injectable, inject } from 'inversify';
import { AIProviderService, LoggerService } from '@skilder-ai/common';
import pino from 'pino';
import { AIProviderRepository } from '../repositories/ai-provider/ai-provider.repository';
import { AIConfigRepository } from '../repositories/ai-config/ai-config.repository';
import { WorkspaceRepository } from '../repositories/workspace/workspace.repository';
import {
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_GUARDRAILS_MAX_LENGTH,
  SKILL_KNOWLEDGE_MAX_LENGTH,
} from '../constants';

export interface GeneratedSkillData {
  name: string;
  description: string;
  guardrails?: string;
  associatedKnowledge?: string;
  suggestedToolIds: string[];
}

const DEFAULT_SKILL_GENERATION_PROMPT = `You are a skill configuration assistant. Given a user's description of what they want to accomplish, generate a structured skill configuration.

IMPORTANT RULES:
1. Description must be ${SKILL_DESCRIPTION_MAX_LENGTH} characters or less
2. Guardrails must be ${SKILL_GUARDRAILS_MAX_LENGTH} characters or less
3. Associated knowledge must be ${SKILL_KNOWLEDGE_MAX_LENGTH} characters or less
4. Be concise and specific
5. Suggest tools based on the available MCP tools provided

Respond ONLY with valid JSON in this exact format:
{
  "name": "Skill Name",
  "description": "Brief description (max ${SKILL_DESCRIPTION_MAX_LENGTH} chars)",
  "guardrails": "Safety rules and constraints (max ${SKILL_GUARDRAILS_MAX_LENGTH} chars)",
  "associatedKnowledge": "Relevant context and knowledge (max ${SKILL_KNOWLEDGE_MAX_LENGTH} chars)",
  "suggestedToolIds": ["tool-id-1", "tool-id-2"]
}`;

@injectable()
export class AISkillGenerationService {
  private logger: pino.Logger;

  constructor(
    @inject(AIProviderService) private readonly aiProviderService: AIProviderService,
    @inject(AIProviderRepository) private readonly aiProviderRepo: AIProviderRepository,
    @inject(AIConfigRepository) private readonly aiConfigRepo: AIConfigRepository,
    @inject(WorkspaceRepository) private readonly workspaceRepo: WorkspaceRepository,
    @inject(LoggerService) private readonly loggerService: LoggerService,
  ) {
    this.logger = this.loggerService.getLogger('ai-skill-generation.service');
  }

  /**
   * Generate skill configuration using AI based on user prompt
   */
  async generateSkill(
    userPrompt: string,
    workspaceId: string,
    providerId: string,
  ): Promise<GeneratedSkillData> {
    this.logger.info(`Generating skill for workspace ${workspaceId} using provider ${providerId}`);

    // 1. Get AI provider config
    const providerConfig = await this.aiProviderRepo.findById(providerId);
    if (!providerConfig) {
      throw new Error(`AI provider ${providerId} not found`);
    }

    // 2. Get workspace to check for default model
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    // 3. Get system prompt from AI config (or use default)
    let systemPrompt = DEFAULT_SKILL_GENERATION_PROMPT;
    try {
      const aiConfig = await this.aiConfigRepo.findByKey(workspaceId, 'skill-generation-prompt');
      if (aiConfig?.value) {
        systemPrompt = aiConfig.value;
      }
    } catch (error) {
      this.logger.warn(`Failed to load custom skill generation prompt, using default: ${error}`);
    }

    // 4. Get available MCP tools for context
    const availableTools = await this.workspaceRepo.findMCPToolsByWorkspace(workspaceId);
    const toolsContext = availableTools.map((tool: { id: string; name: string; description?: string | null }) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description || '',
    }));

    // 5. Build the full prompt
    const fullPrompt = `${systemPrompt}

Available MCP Tools:
${JSON.stringify(toolsContext, null, 2)}

User Request:
${userPrompt}`;

    // 6. Determine which model to use
    let fullModelString: string;

    // Try to use workspace default model if set
    if (workspace.defaultAIModel) {
      fullModelString = workspace.defaultAIModel;
      this.logger.info(`Using workspace default model: ${fullModelString}`);
    } else {
      // Fall back to first available model from the selected provider
      if (!providerConfig.availableModels || providerConfig.availableModels.length === 0) {
        throw new Error(`AI provider ${providerId} has no available models configured`);
      }

      const providerType = providerConfig.provider.toLowerCase();
      const modelName = providerConfig.availableModels[0];
      fullModelString = `${providerType}/${modelName}`;
      this.logger.info(`No default model set, using first available model from provider: ${fullModelString}`);
    }

    // 7. Parse model string to get provider and model name (same as chatWithModel resolver)
    // This ensures we handle the model string correctly regardless of its source
    const { provider: parsedProvider, modelName: parsedModelName } = this.aiProviderService.parseModelString(fullModelString);

    // 8. Get decrypted config for the parsed provider
    const finalConfig = await this.aiProviderRepo.getDecryptedConfig(
      workspaceId,
      parsedProvider,
    );

    this.logger.info(`Calling AI with provider: ${parsedProvider}, model: ${parsedModelName}`);

    // 9. Make the AI request
    const response = await this.aiProviderService.chat(
      finalConfig,
      parsedProvider,
      parsedModelName,
      fullPrompt,
    );

    // 10. Parse the AI response
    const generatedData = this.parseAIResponse(response);

    // 11. Validate field lengths
    this.validateGeneratedData(generatedData);

    // 12. Filter suggested tools to only include valid IDs
    const validToolIds = new Set(availableTools.map((t: { id: string }) => t.id));
    generatedData.suggestedToolIds = generatedData.suggestedToolIds.filter((id: string) => validToolIds.has(id));

    this.logger.info(`Successfully generated skill: ${generatedData.name}`);
    return generatedData;
  }

  private parseAIResponse(response: string): GeneratedSkillData {
    try {
      // Try to extract JSON from the response (AI might wrap it in markdown code blocks)
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;

      const parsed = JSON.parse(jsonString.trim());

      if (!parsed.name || !parsed.description) {
        throw new Error('AI response missing required fields: name and description');
      }

      return {
        name: parsed.name,
        description: parsed.description,
        guardrails: parsed.guardrails || undefined,
        associatedKnowledge: parsed.associatedKnowledge || undefined,
        suggestedToolIds: Array.isArray(parsed.suggestedToolIds) ? parsed.suggestedToolIds : [],
      };
    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${error}`);
      const truncatedResponse = response.length > 500 ? `${response.slice(0, 500)}... (truncated)` : response;
      this.logger.debug(`AI response was: ${truncatedResponse}`);
      throw new Error('Failed to parse AI-generated skill data. The AI response was not in the expected JSON format.');
    }
  }

  private validateGeneratedData(data: GeneratedSkillData): void {
    if (data.description.length > SKILL_DESCRIPTION_MAX_LENGTH) {
      throw new Error(`AI-generated description exceeds ${SKILL_DESCRIPTION_MAX_LENGTH} characters`);
    }
    if (data.guardrails && data.guardrails.length > SKILL_GUARDRAILS_MAX_LENGTH) {
      throw new Error(`AI-generated guardrails exceed ${SKILL_GUARDRAILS_MAX_LENGTH} characters`);
    }
    if (data.associatedKnowledge && data.associatedKnowledge.length > SKILL_KNOWLEDGE_MAX_LENGTH) {
      throw new Error(`AI-generated associated knowledge exceeds ${SKILL_KNOWLEDGE_MAX_LENGTH} characters`);
    }
  }
}
