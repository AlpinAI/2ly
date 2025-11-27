/**
 * MCP Client Fixture for E2E Tests
 *
 * Provides a real MCP client implementation to test connectivity to 2ly runtime
 * via all three transport types: STDIO, SSE, and STREAM (Streamable HTTP)
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type {
  ListToolsResult,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Authentication parameters for MCP client connections
 */
export interface MCPAuthParams {
  /** Workspace key for workspace authentication */
  workspaceKey?: string;
  /** Toolset key for toolset-specific connections */
  toolsetKey?: string;
  /** Toolset name for toolset-specific connections */
  toolsetName?: string;
}

/**
 * STDIO connection parameters
 */
export interface STDIOConnectionParams {
  /** Command to execute (e.g., 'node') */
  command: string;
  /** Arguments to pass to command (e.g., ['dist/index.js']) */
  args: string[];
  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * MCP Client Fixture
 * Wraps the official MCP SDK client with test-specific utilities
 */
export class MCPClientFixture {
  private client: Client | null = null;
  private transport: Transport | null = null;
  private connectionType: 'STDIO' | 'SSE' | 'STREAM' | null = null;

  /**
   * Connect to runtime via STDIO transport
   * This is used for direct process communication (1:1 with toolset)
   */
  async connectSTDIO(params: STDIOConnectionParams, auth: MCPAuthParams): Promise<void> {
    if (this.client) {
      throw new Error('Client already connected. Call disconnect() first.');
    }

    // Merge auth params into environment
    const env = {
      ...params.env,
      ...(auth.workspaceKey ? { WORKSPACE_KEY: auth.workspaceKey } : {}),
      ...(auth.toolsetKey ? { TOOLSET_KEY: auth.toolsetKey } : {}),
      ...(auth.toolsetName ? { TOOLSET_NAME: auth.toolsetName } : {}),
    };

    this.transport = new StdioClientTransport({
      command: params.command,
      args: params.args,
      env,
    });

    this.client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await this.client.connect(this.transport);
    this.connectionType = 'STDIO';
  }

  /**
   * Connect to runtime via SSE transport
   * This uses Server-Sent Events for real-time communication
   */
  async connectSSE(baseUrl: string, auth: MCPAuthParams): Promise<void> {
    if (this.client) {
      throw new Error('Client already connected. Call disconnect() first.');
    }

    // Create headers from auth params
    const headers: Record<string, string> = {};
    if (auth.workspaceKey) headers['workspace_key'] = auth.workspaceKey;
    if (auth.toolsetKey) headers['toolset_key'] = auth.toolsetKey;
    if (auth.toolsetName) headers['toolset_name'] = auth.toolsetName;

    this.transport = new SSEClientTransport(new URL(`${baseUrl}/sse`), {
      requestInit: {
        headers,
      },
    });

    this.client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await this.client.connect(this.transport);
    this.connectionType = 'SSE';
  }

  /**
   * Connect to runtime via Streamable HTTP transport
   * This is the modern, spec-compliant transport using /mcp endpoint
   */
  async connectSTREAM(baseUrl: string, auth: MCPAuthParams): Promise<void> {
    if (this.client) {
      throw new Error('Client already connected. Call disconnect() first.');
    }

    // Create headers from auth params
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (auth.workspaceKey) headers['workspace_key'] = auth.workspaceKey;
    if (auth.toolsetKey) headers['toolset_key'] = auth.toolsetKey;
    if (auth.toolsetName) headers['toolset_name'] = auth.toolsetName;

    const url = new URL(`${baseUrl}/mcp`);

    this.transport = new StreamableHTTPClientTransport(url, {
      requestInit: {
        headers,
      },
    });

    this.client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await this.client.connect(this.transport);
    this.connectionType = 'STREAM';
  }

  /**
   * List all available tools from the connected server
   */
  async listTools(): Promise<ListToolsResult> {
    if (!this.client) {
      throw new Error('Client not connected. Call connect method first.');
    }

    return await this.client.listTools();
  }

  /**
   * Call a tool with the given name and arguments
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.client) {
      throw new Error('Client not connected. Call connect method first.');
    }

    return await this.client.callTool({
      name,
      arguments: args,
    });
  }

  /**
   * Disconnect and clean up the client
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    this.connectionType = null;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    type: 'STDIO' | 'SSE' | 'STREAM' | null;
  } {
    return {
      connected: this.client !== null,
      type: this.connectionType,
    };
  }

  /**
   * Get the underlying client instance (for advanced usage)
   */
  getClient(): Client | null {
    return this.client;
  }
}

/**
 * Factory function to create a new MCP client fixture
 */
export function createMCPClient(): MCPClientFixture {
  return new MCPClientFixture();
}
