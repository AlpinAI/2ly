import ModelClient from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import { inject, injectable } from 'inversify';
import pino from 'pino';
import { Service, LoggerService, apolloResolversTypes } from '@2ly/common';

export const AZURE_ENDPOINT = 'AZURE_ENDPOINT';
export const AZURE_API_KEY = 'AZURE_API_KEY';
export const BRAVE_SEARCH_API_KEY = 'BRAVE_SEARCH_API_KEY';

interface SearchResult {
  url: string;
  title: string;
  snippet: string;
}

@injectable()
export class MCPServerAutoConfigService extends Service {
  name = 'mcp-server-auto-config';
  private logger: pino.Logger;
  private client!: ReturnType<typeof ModelClient>;
  private _isConfigured: boolean = false;

  constructor(
    @inject(LoggerService) private loggerService: LoggerService,
    @inject(AZURE_ENDPOINT) private azureEndpoint: string,
    @inject(AZURE_API_KEY) private azureApiKey: string,
    @inject(BRAVE_SEARCH_API_KEY) private braveApiKey: string,
  ) {
    super();
    this.logger = this.loggerService.getLogger('mcp-auto-config');
  }

  protected async initialize() {
    this.logger.info('Initializing MCPServerAutoConfigService');
    const msg = (part: string) =>
      `${part} is not set, some AI features of 2ly will not be available. You can set the AZURE_ENDPOINT, AZURE_API_KEY and BRAVE_SEARCH_API_KEY environment variables to enable it.`;
    if (!this.azureEndpoint) {
      this.logger.warn(msg('Azure endpoint'));
      return;
    }
    if (!this.azureApiKey) {
      this.logger.warn(msg('Azure API key'));
      return;
    }
    if (!this.braveApiKey) {
      this.logger.warn(msg('Brave Search API key'));
      return;
    }
    this.client = ModelClient(this.azureEndpoint, new AzureKeyCredential(this.azureApiKey));
    this._isConfigured = true;
  }

  protected async shutdown() {
    this.logger.info('Shutting down MCPServerAutoConfigService');
  }

  public isConfigured(): boolean {
    return this._isConfigured;
  }

  private async searchMCPServers(problemDescription: string, maxResults: number = 20): Promise<SearchResult[]> {
    this.logger.debug(`Searching for MCP servers for problem: ${problemDescription}`);
    // Clean and simplify the problem description for better search results
    const cleanDescription = problemDescription
      .replace(/["']/g, '') // Remove quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Create a more effective search query
    const searchQuery = `MCP server ${cleanDescription} model context protocol github`;

    try {
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=${maxResults}`,
        {
          headers: {
            'X-Subscription-Token': this.braveApiKey,
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Brave Search API error: ${response.status}`);
      }

      const data: unknown = await response.json();
      const web = (data as { web?: { results?: Array<Record<string, unknown>> } }).web;
      const results = web?.results || [];
      this.logger.debug(`Found ${results.length} web results`);
      const mapped: SearchResult[] = results
        .map((item) => {
          const url = typeof item.url === 'string' ? item.url : '';
          const title = typeof item.title === 'string' ? item.title : '';
          const snippet =
            typeof (item as { description?: unknown }).description === 'string'
              ? (item as { description: string }).description
              : '';
          if (!url || !title) return undefined;
          return { url, title, snippet } as SearchResult;
        })
        .filter((v): v is SearchResult => Boolean(v));
      return mapped;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Fetch documentation from a URL
   */
  private async fetchDocumentation(url: string): Promise<string> {
    this.logger.debug(`Fetching documentation from ${url}`);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const content = await response.text();

      // Extract relevant content (README, documentation sections)
      // This is a simplified extraction - in production, you might want to use a proper HTML parser
      const strippedContent = content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      this.logger.debug(`Stripped content length: ${strippedContent.length}`);
      return strippedContent.substring(0, 12000); // Limit content length
    } catch (error) {
      console.error(`Error fetching documentation from ${url}:`, error);
      return '';
    }
  }

  /**
   * Use Azure AI to analyze search results and determine the best MCP server
   */
  private async findBestMCPServer(
    problemDescription: string,
    searchResults: SearchResult[],
    maxServers: number = 3,
  ): Promise<string | null> {
    this.logger.debug(
      `Finding best MCP server for problem: ${problemDescription}, with ${searchResults.length} search results, (max ${maxServers})`,
    );
    const searchResultsText = searchResults
      .map((result) => `URL: ${result.url}\nTitle: ${result.title}\nSnippet: ${result.snippet}`)
      .join('\n\n');

    const prompt = `You are an expert in MCP (Model Context Protocol) servers. Given the following problem description and search results, determine if there is one or more suitable MCP servers available.

Problem Description: ${problemDescription}

Search Results:
${searchResultsText}

Analyze the search results and determine:
1. Is there a relevant MCP server that can solve this problem?
2. If yes, You must return a maximum of ${maxServers} servers. They must be ordered by relevance to the problem and quality of the documentation. If there are less than ${maxServers} servers, return only the number of servers that are available.
3. Return ONLY the GitHub repository URL of the best matches, separated by commas, or "NONE" if no suitable server is found.

Response format: URLs, separated by commas, or "NONE"`;

    try {
      const response = await this.client.path('/chat/completions').post({
        body: {
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: 'gpt-4o', // GitHub model
          max_tokens: 200,
          temperature: 0.1,
        },
      });

      if (response.status === '200') {
        const body = response.body as unknown;
        const content =
          typeof (body as { choices?: Array<{ message?: { content?: string } }> }).choices !== 'undefined'
            ? (body as { choices: Array<{ message?: { content?: string } }> }).choices[0]?.message?.content?.trim()
            : undefined;
        if (typeof content === 'string') {
          this.logger.debug(`Best MCP servers found: ${content}`);
          return content === 'NONE' ? null : content;
        }
      }

      throw new Error(`API call failed with status: ${response.status}`);
    } catch (error) {
      console.error('Error finding best MCP server:', error);
      return null;
    }
  }

  /**
   * Use Azure AI to extract configuration from documentation
   */
  private async extractMCPConfiguration(
    documentation: string,
    repositoryUrl: string,
  ): Promise<apolloResolversTypes.McpRegistryServer | null> {
    this.logger.debug(`Extracting MCP configuration for ${repositoryUrl}`);
    const prompt = `You are an expert in MCP (Model Context Protocol) server configuration. Based on the following documentation, extract the configuration details for this MCP server following the official MCP registry schema.

Repository URL: ${repositoryUrl}
Documentation:
${documentation}

Return a JSON object with this structure:
- name: Full descriptive name from the documentation
- description: Brief description of what the server does
- repositoryUrl: URL of the repository
- transport: "STDIO" for command-line servers, "SSE" for SSE servers, "STREAM" for HTTP streaming servers
- config: A SINGLE Package object (for STDIO) OR a SINGLE Transport object (for SSE/STREAM)

For STDIO transport, config should be a Package object:
{
  "identifier": "npm:<package-name>" or "docker:<image>",
  "packageArguments": [
    {
      "name": "arg1",
      "type": "string",
      "description": "Description",
      "isRequired": true,
      "value": "$ARG1"  // Use $VAR for user-configurable values
    }
  ],
  "runtimeArguments": [],  // Optional, for node/python flags
  "environmentVariables": [
    {
      "name": "ENV_VAR",
      "value": "$ENV_VAR",
      "description": "Description",
      "isRequired": true,
      "isSecret": false
    }
  ]
}

For SSE/STREAM transport, config should be a Transport object:
{
  "type": "sse" or "streamableHttp",
  "url": "$URL",  // Use $VAR for user-configurable values
  "headers": [
    {
      "name": "Authorization",
      "value": "Bearer $TOKEN",
      "description": "Auth token",
      "isRequired": true,
      "isSecret": true
    }
  ]
}

Example for STDIO (filesystem server):
{
  "name": "Filesystem MCP Server",
  "description": "File system operations",
  "repositoryUrl": "https://github.com/modelcontextprotocol/server-filesystem",
  "transport": "STDIO",
  "config": {
    "identifier": "npm:@modelcontextprotocol/server-filesystem",
    "packageArguments": [
      {
        "name": "path",
        "type": "string",
        "description": "The file system path to access",
        "isRequired": true,
        "value": "$PATH"
      }
    ],
    "environmentVariables": []
  }
}

Example for STREAM (GitHub server):
{
  "name": "GitHub MCP Server",
  "description": "GitHub integration",
  "repositoryUrl": "https://github.com/github/github-mcp-server",
  "transport": "STREAM",
  "config": {
    "type": "streamableHttp",
    "url": "https://api.githubcopilot.com/mcp/",
    "headers": [
      {
        "name": "Authorization",
        "value": "Bearer $PAT",
        "description": "GitHub Personal Access Token",
        "isRequired": true,
        "isSecret": true
      }
    ]
  }
}

Return ONLY valid JSON following this format.`;

    try {
      const response = await this.client.path('/chat/completions').post({
        body: {
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: 'gpt-4o',
          max_tokens: 800,
          temperature: 0.1,
        },
      });

      if (response.status === '200') {
        const body = response.body as unknown;
        const content =
          typeof (body as { choices?: Array<{ message?: { content?: string } }> }).choices !== 'undefined'
            ? (body as { choices: Array<{ message?: { content?: string } }> }).choices[0]?.message?.content?.trim()
            : undefined;

        if (content) {
          // Extract JSON from the response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const server = JSON.parse(jsonMatch[0]);
              // The config field should contain the single Package or Transport object
              // (not an array, just the one selected configuration)
              return {
                name: server.name,
                description: server.description,
                repositoryUrl: repositoryUrl,
                packages: JSON.stringify(server.config), // Store config as packages JSON
                title: server.name,
                version: '1.0.0',
                createdAt: new Date(),
                lastSeenAt: new Date(),
                id: '', // Will be set by the database
                registry: { id: '' } as apolloResolversTypes.McpRegistry, // Will be set by the database
              };
            } catch (parseError) {
              console.error('Error parsing JSON configuration:', parseError);
            }
          }
        }
      }

      throw new Error(`API call failed with status: ${response.status}`);
    } catch (error) {
      console.error('Error extracting MCP configuration:', error);
      return null;
    }
  }

  /**
   * Fetch MCP server config from repository URL
   */
  async fetchMCPServerConfig(repositoryUrl: string): Promise<apolloResolversTypes.McpRegistryServer | null> {
    this.logger.debug(`Fetching MCP server config for ${repositoryUrl}`);
    const documentation = await this.fetchDocumentation(repositoryUrl);
    if (!documentation) {
      return null;
    }
    return this.extractMCPConfiguration(documentation, repositoryUrl);
  }

  /**
   * Main method to find and configure MCP server for a given problem
   */
  async findMCPServerForProblem(
    problemDescription: string,
    maxServers: number = 3,
  ): Promise<apolloResolversTypes.McpRegistryServer[]> {
    try {
      this.logger.debug(`Searching for MCP server for problem: ${problemDescription}`);

      // Step 1: Search for relevant MCP servers
      const searchResults = await this.searchMCPServers(problemDescription);

      if (searchResults.length === 0) {
        return [];
      }

      // Step 2: Use AI to find the best match
      const bestServerUrls = await this.findBestMCPServer(problemDescription, searchResults, maxServers);

      if (!bestServerUrls) {
        return [];
      }

      this.logger.debug(`Found best MCP servers: ${bestServerUrls}`);

      // Step 3: Loop over the results, extract the configuration and return the MCP server
      const mcpServers = await Promise.all(
        bestServerUrls.split(',').map(async (url: string) => {
          const configuration = await this.fetchMCPServerConfig(url);
          await new Promise((resolve) => setTimeout(resolve, 1500)); // Wait 1 second to avoid rate limiting
          if (!configuration) {
            return null;
          }
          return configuration;
        }),
      );

      const nonNullMcpServers = mcpServers.filter((s) => s !== null);

      this.logger.debug(`Found ${nonNullMcpServers.length} MCP servers`);

      // Step 4: Return the MCP servers
      return nonNullMcpServers;
    } catch (error) {
      console.error('Error in findMCPServerForProblem:', error);
      return [];
    }
  }
}
