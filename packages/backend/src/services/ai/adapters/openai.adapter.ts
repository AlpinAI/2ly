import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import type {
  IAIClient,
  AIClientConfig,
  AIChatRequest,
  AIChatResponse,
  AIStreamChunk,
  AICredentialValidation,
  AIModel,
  AIProviderType,
} from '../ai-client.interface';
import { DEFAULT_MODELS } from '../ai-client.interface';

/**
 * OpenAI Adapter - Implements IAIClient using Vercel AI SDK.
 */
export class OpenAIAdapter implements IAIClient {
  readonly provider: AIProviderType = 'openai';
  private readonly client: ReturnType<typeof createOpenAI>;
  private readonly defaultModel: string;

  constructor(config: AIClientConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });

    this.defaultModel = config.defaultModel || DEFAULT_MODELS.openai;
  }

  async chat(request: AIChatRequest): Promise<AIChatResponse> {
    const model = request.model || this.defaultModel;

    const result = await generateText({
      model: this.client(model),
      messages: request.messages,
      temperature: request.temperature,
      maxOutputTokens: request.maxTokens,
    });

    return {
      content: result.text,
      model,
      finishReason: result.finishReason,
      usage: result.usage
        ? {
            promptTokens: result.usage.inputTokens || 0,
            completionTokens: result.usage.outputTokens || 0,
            totalTokens: (result.usage.inputTokens || 0) + (result.usage.outputTokens || 0),
          }
        : undefined,
    };
  }

  async *stream(request: AIChatRequest): AsyncIterable<AIStreamChunk> {
    const model = request.model || this.defaultModel;

    const result = streamText({
      model: this.client(model),
      messages: request.messages,
      temperature: request.temperature,
      maxOutputTokens: request.maxTokens,
    });

    for await (const chunk of result.textStream) {
      yield { content: chunk, done: false };
    }

    yield { content: '', done: true };
  }

  async validateCredentials(): Promise<AICredentialValidation> {
    try {
      // Make a minimal API call to validate credentials
      await generateText({
        model: this.client('gpt-4o-mini'),
        messages: [{ role: 'user', content: 'Hi' }],
        maxOutputTokens: 1,
      });

      const models = await this.listModels();

      return {
        valid: true,
        availableModels: models.map((m) => m.id),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        valid: false,
        error: `OpenAI API validation failed: ${message}`,
      };
    }
  }

  async listModels(): Promise<AIModel[]> {
    // Return common OpenAI models - full list would require an API call
    return [
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000 },
      { id: 'gpt-4', name: 'GPT-4', contextWindow: 8192 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385 },
      { id: 'o1', name: 'o1', contextWindow: 200000 },
      { id: 'o1-mini', name: 'o1 Mini', contextWindow: 128000 },
      { id: 'o1-preview', name: 'o1 Preview', contextWindow: 128000 },
    ];
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }
}
