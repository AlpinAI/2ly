/**
 * Seed Data Type Definitions
 *
 * Provides strongly-typed structures for database seeding in tests.
 * Supports comprehensive seeding for E2E tests and simple seeding for integration tests.
 */

import { dgraphResolversTypes } from '@2ly/common';
import type { RegistryServerSeed, MCPServerSeed, OmitGenerated } from './mcp-types';

/**
 * Seed data interface - uses dgraphResolversTypes for consistency with schema
 * Object references are converted to string IDs for seeding convenience
 */
export interface SeedData {
  workspaces?: Array<Pick<dgraphResolversTypes.Workspace, 'name'>>;
  users?: Array<Pick<dgraphResolversTypes.User, 'email' | 'password'>>;
  mcpServers?: Array<MCPServerSeed>;
  registryServers?: Array<RegistryServerSeed>;
  tools?: Array<OmitGenerated<dgraphResolversTypes.McpTool, 'skills' | 'toolCalls' | 'workspace' | 'mcpServer'> & {
    mcpServerId: string; // ID reference for seeding
  }
  >;
  runtimes?: Array<OmitGenerated<dgraphResolversTypes.Runtime, 'mcpServers' | 'toolResponses' | 'workspace'> & {
    workspaceId: string; // ID reference for seeding
  }
  >;
  skills?: Array<OmitGenerated<dgraphResolversTypes.Skill, 'mcpTools' | 'toolCalls' | 'workspace'> & {
    toolIds: string[]; // Tool name references
    workspaceId: string; // ID reference for seeding
  }>;
  toolCalls?: Array<
    OmitGenerated<dgraphResolversTypes.ToolCall, 'executedBy' | 'calledBy' | 'calledAt' | 'completedAt' | 'mcpTool'> & {
      calledAt: string; // DateTime as string for seeding
      completedAt?: string; // DateTime as string for seeding
      mcpToolId: string; // ID reference for seeding
      calledById: string; // ID reference for seeding
      executedById?: string; // ID reference for seeding
    }
  >;
}

/**
 * Database state structure for inspection
 */
export interface DatabaseState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workspaces: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mcpServers: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  system: any;
}
