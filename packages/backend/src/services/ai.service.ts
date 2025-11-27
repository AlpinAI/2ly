/**
 * AI Service
 *
 * WHY: Integrate with OpenAI and Anthropic APIs for AI-powered features.
 * Provides tool suggestion capabilities for tool set builder.
 *
 * FEATURES:
 * - Support for both OpenAI and Anthropic providers
 * - API key validation
 * - Tool suggestion based on natural language descriptions
 * - Error handling and rate limiting awareness
 */

import { injectable } from 'inversify';

export enum AIProvider {
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
}

export interface AIToolSuggestion {
  toolId: string;
  toolName: string;
  reason: string;
  confidence: number;
}

export interface SuggestToolsResult {
  suggestions: AIToolSuggestion[];
  externalSuggestions: string[];
}

export interface ToolSetMetadataSuggestion {
  name: string;
  description: string;
  suggestions: AIToolSuggestion[];
  externalSuggestions: string[];
}

export interface MCPToolInfo {
  id: string;
  name: string;
  description: string;
}

export interface RepositoryAnalysisResult {
  name: string;
  description: string;
  version: string;
  transportType: 'STDIO' | 'SSE' | 'STREAMABLE_HTTP';
  command?: string;
  args?: string[];
  envVars?: Array<{ key: string; value: string }>;
  url?: string;
  headers?: Array<{ key: string; value: string }>;
}

@injectable()
export class AIService {
  /**
   * Validate an API key by making a test request
   */
  async validateApiKey(provider: AIProvider, apiKey: string): Promise<boolean> {
    try {
      if (provider === AIProvider.OPENAI) {
        return await this.validateOpenAIKey(apiKey);
      } else if (provider === AIProvider.ANTHROPIC) {
        return await this.validateAnthropicKey(apiKey);
      }
      return false;
    } catch (error) {
      console.error('[AIService] API key validation failed:', error);
      // Log more details for debugging
      if (error instanceof Error) {
        console.error('[AIService] Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }
      return false;
    }
  }

  /**
   * Suggest tools for a tool set based on natural language description
   */
  async suggestTools(
    provider: AIProvider,
    model: string,
    apiKey: string,
    description: string,
    availableTools: MCPToolInfo[],
  ): Promise<SuggestToolsResult> {
    if (provider === AIProvider.OPENAI) {
      return await this.suggestToolsOpenAI(model, apiKey, description, availableTools);
    } else if (provider === AIProvider.ANTHROPIC) {
      return await this.suggestToolsAnthropic(model, apiKey, description, availableTools);
    }

    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  /**
   * Suggest tool set metadata (name, description, and tools) based on user's goal
   */
  async suggestToolSetMetadata(
    provider: AIProvider,
    model: string,
    apiKey: string,
    userGoal: string,
    availableTools: MCPToolInfo[],
  ): Promise<ToolSetMetadataSuggestion> {
    if (provider === AIProvider.OPENAI) {
      return await this.suggestToolSetMetadataOpenAI(model, apiKey, userGoal, availableTools);
    } else if (provider === AIProvider.ANTHROPIC) {
      return await this.suggestToolSetMetadataAnthropic(model, apiKey, userGoal, availableTools);
    }

    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  /**
   * Analyze a GitHub repository URL and extract MCP server configuration
   */
  async analyzeRepositoryUrl(
    provider: AIProvider,
    model: string,
    apiKey: string,
    repositoryUrl: string,
  ): Promise<RepositoryAnalysisResult> {
    if (provider === AIProvider.OPENAI) {
      return await this.analyzeRepositoryOpenAI(model, apiKey, repositoryUrl);
    } else if (provider === AIProvider.ANTHROPIC) {
      return await this.analyzeRepositoryAnthropic(model, apiKey, repositoryUrl);
    }

    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  /**
   * Validate OpenAI API key
   */
  private async validateOpenAIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AIService] OpenAI validation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
      }

      return response.ok;
    } catch (error) {
      console.error('[AIService] OpenAI validation error:', error);
      throw error;
    }
  }

  /**
   * Validate Anthropic API key
   */
  private async validateAnthropicKey(apiKey: string): Promise<boolean> {
    // Anthropic doesn't have a simple validation endpoint, so we make a minimal completion request
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    return response.ok;
  }

  /**
   * Suggest tools using OpenAI
   */
  private async suggestToolsOpenAI(
    model: string,
    apiKey: string,
    description: string,
    availableTools: MCPToolInfo[],
  ): Promise<SuggestToolsResult> {
    const prompt = this.buildToolSuggestionPrompt(description, availableTools);

    // Only use response_format for models that support it (gpt-4-turbo and newer)
    const supportsJsonMode = model.includes('gpt-4-turbo') || model.includes('gpt-4o') || model.includes('gpt-4-1106');
    const requestBody: Record<string, unknown> = {
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that suggests relevant tools based on user goals. Respond ONLY with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    };

    if (supportsJsonMode) {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return this.parseToolSuggestionResponse(content);
  }

  /**
   * Suggest tools using Anthropic
   */
  private async suggestToolsAnthropic(
    model: string,
    apiKey: string,
    description: string,
    availableTools: MCPToolInfo[],
  ): Promise<SuggestToolsResult> {
    const prompt = this.buildToolSuggestionPrompt(description, availableTools);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `You are a helpful assistant that suggests relevant tools based on user goals. Respond ONLY with valid JSON.\n\n${prompt}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      throw new Error('No response from Anthropic');
    }

    return this.parseToolSuggestionResponse(content);
  }

  /**
   * Build prompt for tool suggestion
   */
  private buildToolSuggestionPrompt(description: string, availableTools: MCPToolInfo[]): string {
    const toolsList = availableTools
      .map((tool) => `- ID: ${tool.id}, Name: ${tool.name}, Description: ${tool.description}`)
      .join('\n');

    return `User wants to: "${description}"

Available tools in the workspace:
${toolsList}

Analyze the user's goal and suggest the most relevant tools from the available tools list.

For each suggested tool, provide:
1. The exact tool ID from the list
2. The tool name
3. A brief reason why this tool is relevant
4. A confidence score (0.0 to 1.0)

If NO tools from the available list match the user's goal, suggest external MCP server names that might help (e.g., "gmail", "slack", "notion").

Respond with JSON in this exact format:
{
  "suggestions": [
    {
      "toolId": "tool-id-from-list",
      "toolName": "tool-name",
      "reason": "brief explanation",
      "confidence": 0.95
    }
  ],
  "externalSuggestions": ["mcp-server-name-1", "mcp-server-name-2"]
}

If no relevant tools are found, return empty suggestions array but include external suggestions.`;
  }

  /**
   * Parse AI response into structured result
   */
  private parseToolSuggestionResponse(content: string): SuggestToolsResult {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        suggestions: parsed.suggestions || [],
        externalSuggestions: parsed.externalSuggestions || [],
      };
    } catch (error) {
      console.error('[AIService] Failed to parse AI response:', error);
      return {
        suggestions: [],
        externalSuggestions: [],
      };
    }
  }

  /**
   * Analyze repository using OpenAI
   */
  private async analyzeRepositoryOpenAI(
    model: string,
    apiKey: string,
    repositoryUrl: string,
  ): Promise<RepositoryAnalysisResult> {
    const prompt = this.buildRepositoryAnalysisPrompt(repositoryUrl);

    const supportsJsonMode = model.includes('gpt-4-turbo') || model.includes('gpt-4o') || model.includes('gpt-4-1106');
    const requestBody: Record<string, unknown> = {
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at analyzing GitHub repositories for MCP (Model Context Protocol) servers. Respond ONLY with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    };

    if (supportsJsonMode) {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return this.parseRepositoryAnalysisResponse(content);
  }

  /**
   * Analyze repository using Anthropic
   */
  private async analyzeRepositoryAnthropic(
    model: string,
    apiKey: string,
    repositoryUrl: string,
  ): Promise<RepositoryAnalysisResult> {
    const prompt = this.buildRepositoryAnalysisPrompt(repositoryUrl);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `You are an expert at analyzing GitHub repositories for MCP (Model Context Protocol) servers. Respond ONLY with valid JSON.\n\n${prompt}`,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      throw new Error('No response from Anthropic');
    }

    return this.parseRepositoryAnalysisResponse(content);
  }

  /**
   * Build prompt for repository analysis
   */
  private buildRepositoryAnalysisPrompt(repositoryUrl: string): string {
    return `Analyze this GitHub repository URL for an MCP (Model Context Protocol) server and extract configuration details: ${repositoryUrl}

CRITICAL INSTRUCTIONS:
You MUST carefully read the repository's README.md to find the EXACT installation commands and configuration. Look for sections like "Installation", "Setup", "Quick Start", or "Usage".

Extract the following information:

1. **name**: Extract from repository name or package name
   - Example: "github.com/org/server-github" → "github-mcp"
   - Example: "github.com/org/deepcontext-mcp" → "deepcontext-mcp"

2. **description**: Brief description (1-2 sentences) from README

3. **version**: Use "1.0.0" as default

4. **transportType**: Almost always "STDIO" for MCP servers (use "SSE" or "STREAMABLE_HTTP" only if explicitly stated)

5. **For STDIO servers - FOLLOW THESE RULES EXACTLY:**

   A. **command**: The executable to run
      - If instructions show "npx @package/name" → command is "npx"
      - If instructions show "node server.js" → command is "node"
      - If instructions show "python server.py" → command is "python"
      - If instructions show "uvx package-name" → command is "uvx"

   B. **args**: Array of ALL arguments that come AFTER the command
      - For "npx @package/name" → args: ["-y", "@package/name"]
      - For "npx -y @wildcard-ai/deepcontext@latest" → args: ["-y", "@wildcard-ai/deepcontext@latest"]
      - For "node dist/index.js" → args: ["dist/index.js"]
      - For "uvx mcp-server-fetch" → args: ["mcp-server-fetch"]
      - ALWAYS include the "-y" flag if using npx to skip install prompts
      - ALWAYS include "@latest" suffix if shown in examples

   C. **envVars**: Environment variables from setup instructions
      - Look for "MUST set", "required", "environment variables", "API key"
      - Extract the KEY name exactly as shown
      - Leave value EMPTY (empty string "") - user will fill it later
      - Common patterns:
        * WILDCARD_API_KEY (for Wildcard services)
        * GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN (for GitHub)
        * ANTHROPIC_API_KEY (for Anthropic)
        * OPENAI_API_KEY (for OpenAI)
      - Format: [{"key": "API_KEY_NAME", "value": ""}]

6. **For SSE/STREAMABLE_HTTP servers:**
   - url: The server endpoint URL
   - headers: Array of HTTP headers in format [{"key": "Authorization", "value": ""}]

EXAMPLES OF CORRECT EXTRACTION:

Example 1 - npx with package:
README shows: "npx -y @modelcontextprotocol/server-github"
Environment: "Requires GITHUB_TOKEN"
→ {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "envVars": [{"key": "GITHUB_TOKEN", "value": ""}]
}

Example 2 - npx with @latest:
README shows: "npx @wildcard-ai/deepcontext@latest" with "WILDCARD_API_KEY required"
→ {
  "command": "npx",
  "args": ["-y", "@wildcard-ai/deepcontext@latest"],
  "envVars": [{"key": "WILDCARD_API_KEY", "value": ""}]
}

Example 3 - uvx command:
README shows: "uvx mcp-server-fetch"
→ {
  "command": "uvx",
  "args": ["mcp-server-fetch"],
  "envVars": []
}

Example 4 - Local node:
README shows: "node dist/index.js" with "API_KEY env var"
→ {
  "command": "node",
  "args": ["dist/index.js"],
  "envVars": [{"key": "API_KEY", "value": ""}]
}

Respond with JSON in this EXACT format (no extra fields):
{
  "name": "server-name",
  "description": "What the server does",
  "version": "1.0.0",
  "transportType": "STDIO",
  "command": "npx",
  "args": ["-y", "@package/name@latest"],
  "envVars": [{"key": "REQUIRED_KEY", "value": ""}],
  "url": null,
  "headers": []
}`;
  }

  /**
   * Parse repository analysis response
   */
  private parseRepositoryAnalysisResponse(content: string): RepositoryAnalysisResult {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize the response
      return {
        name: parsed.name || 'unknown-server',
        description: parsed.description || 'MCP Server',
        version: parsed.version || '1.0.0',
        transportType: parsed.transportType || 'STDIO',
        command: parsed.command || undefined,
        args: parsed.args || undefined,
        envVars: parsed.envVars || undefined,
        url: parsed.url || undefined,
        headers: parsed.headers || undefined,
      };
    } catch (error) {
      console.error('[AIService] Failed to parse repository analysis:', error);
      // Return minimal valid response
      return {
        name: 'unknown-server',
        description: 'Unable to analyze repository',
        version: '1.0.0',
        transportType: 'STDIO',
      };
    }
  }

  /**
   * Suggest tool set metadata using OpenAI
   */
  private async suggestToolSetMetadataOpenAI(
    model: string,
    apiKey: string,
    userGoal: string,
    availableTools: MCPToolInfo[],
  ): Promise<ToolSetMetadataSuggestion> {
    const prompt = this.buildToolSetMetadataPrompt(userGoal, availableTools);

    const supportsJsonMode = model.includes('gpt-4-turbo') || model.includes('gpt-4o') || model.includes('gpt-4-1106');
    const requestBody: Record<string, unknown> = {
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that creates tool set metadata based on user goals. Respond ONLY with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    };

    if (supportsJsonMode) {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return this.parseToolSetMetadataResponse(content);
  }

  /**
   * Suggest tool set metadata using Anthropic
   */
  private async suggestToolSetMetadataAnthropic(
    model: string,
    apiKey: string,
    userGoal: string,
    availableTools: MCPToolInfo[],
  ): Promise<ToolSetMetadataSuggestion> {
    const prompt = this.buildToolSetMetadataPrompt(userGoal, availableTools);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `You are a helpful assistant that creates tool set metadata based on user goals. Respond ONLY with valid JSON.\n\n${prompt}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      throw new Error('No response from Anthropic');
    }

    return this.parseToolSetMetadataResponse(content);
  }

  /**
   * Build prompt for tool set metadata suggestion
   */
  private buildToolSetMetadataPrompt(userGoal: string, availableTools: MCPToolInfo[]): string {
    const toolsList = availableTools
      .map((tool) => `- ID: ${tool.id}, Name: ${tool.name}, Description: ${tool.description}`)
      .join('\n');

    return `User wants to create a tool set to accomplish this goal: "${userGoal}"

Available tools in the workspace:
${toolsList}

Analyze the user's goal and create:
1. A concise tool set name (maximum 6 words) that captures the essence of what they want to do
2. A brief description (maximum 60 words) explaining what this tool set is for
3. Suggest the most relevant tools from the available tools list
4. If NO tools match, suggest ONLY from this verified list of official MCP servers (use exact names):

OFFICIAL MCP SERVERS (use these exact names ONLY):
- brave-search (web search)
- everything (search files on Windows)
- fetch (web content fetching)
- filesystem (file operations)
- gdrive (Google Drive integration)
- git (Git repository operations)
- github (GitHub API integration)
- gitlab (GitLab API integration)
- google-maps (Google Maps integration)
- memory (persistent key-value storage)
- postgres (PostgreSQL database)
- puppeteer (browser automation)
- sequential-thinking (structured reasoning)
- slack (Slack messaging)
- sqlite (SQLite database)
- sentry (error tracking)
- aws-kb-retrieval-server (AWS knowledge base)
- bigquery (Google BigQuery)
- cloudflare (Cloudflare management)
- docker (Docker container management)
- kubernetes (Kubernetes cluster management)
- playwright (browser automation)
- spotify (Spotify integration)
- time (time/timezone operations)

Guidelines:
- Name should be professional and descriptive (e.g., "GitHub Repository Manager", "Email Campaign Tools")
- Description should explain the purpose and use cases
- Focus on tools that directly support the user's goal
- Include a confidence score (0.0 to 1.0) for each suggested tool
- For external suggestions: ONLY use server names from the official list above
- If no official MCP server matches the need, return empty externalSuggestions array
- DO NOT invent or suggest server names that are not in the official list

Respond with JSON in this exact format:
{
  "name": "Tool Set Name (max 6 words)",
  "description": "Brief description of what this tool set does and why it's useful (max 60 words)",
  "suggestions": [
    {
      "toolId": "tool-id-from-list",
      "toolName": "tool-name",
      "reason": "why this tool helps with the goal",
      "confidence": 0.95
    }
  ],
  "externalSuggestions": ["brave-search", "github"]
}

IMPORTANT: externalSuggestions must ONLY contain names from the official MCP servers list above. Never invent server names.`;
  }

  /**
   * Parse tool set metadata response
   */
  private parseToolSetMetadataResponse(content: string): ToolSetMetadataSuggestion {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate constraints
      const name = parsed.name || 'New Tool Set';
      const description = parsed.description || 'A collection of tools';

      // Truncate if needed
      const nameWords = name.split(' ').slice(0, 6).join(' ');
      const descWords = description.split(' ').slice(0, 60).join(' ');

      return {
        name: nameWords,
        description: descWords,
        suggestions: parsed.suggestions || [],
        externalSuggestions: parsed.externalSuggestions || [],
      };
    } catch (error) {
      console.error('[AIService] Failed to parse tool set metadata response:', error);
      return {
        name: 'New Tool Set',
        description: 'A collection of tools for your workspace',
        suggestions: [],
        externalSuggestions: [],
      };
    }
  }
}
