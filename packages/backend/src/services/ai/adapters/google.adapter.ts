import { createGoogleGenerativeAI } from '@ai-sdk/google';
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
 * Google Gemini Adapter - Implements IAIClient using Vercel AI SDK.
 */
export class GoogleAdapter implements IAIClient {
  readonly provider: AIProviderType = 'google';
  private readonly client: ReturnType<typeof createGoogleGenerativeAI>;
  private readonly defaultModel: string;

  constructor(config: AIClientConfig) {
    if (!config.apiKey) {
      throw new Error('Google API key is required');
    }

    this.client = createGoogleGenerativeAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });

    this.defaultModel = config.defaultModel || DEFAULT_MODELS.google;
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
        model: this.client('gemini-1.5-flash'),
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
        error: `Google API validation failed: ${message}`,
      };
    }
  }

  async listModels(): Promise<AIModel[]> {
    return [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', contextWindow: 1000000 },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextWindow: 2000000 },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', contextWindow: 1000000 },
      { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', contextWindow: 1000000 },
      { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', contextWindow: 32768 },
    ];
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }
}
