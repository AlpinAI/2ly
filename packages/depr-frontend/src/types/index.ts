import { apolloResolversTypes } from '@2ly/common';

export type Agent = {
  id: string;
  name: string;
  description: string;
  flowId: string;
  flow: string;
  status: apolloResolversTypes.ActiveStatus;
  connected: boolean;
  connectedSince?: string;
  clientName?: string;
  tools: string[];
  createdAt: Date;
  lastActive?: string;
  // Additional fields to match Runtime type
  mcpClientName?: string;
  lastSeenAt?: Date;
  workspace: {
    id: string;
    name: string;
    createdAt: Date;
  };
  capabilities?: string[];
};

export type Tool = {
  id: string;
  name: string;
  description: string;
  type: 'api' | 'database' | 'custom' | 'mcp';
  status: 'active' | 'inactive';
  configuration: Record<string, unknown>;
  agentIds: string[];
  usage: number;
  createdAt: string;
  lastUsed?: string;
};

export type Recipe = {
  id: string;
  name: string;
  description: string;
  tools: string[];
  createdAt: string;
  lastUsed?: string;
};

export type UsageData = {
  date: string;
  count: number;
};

export type ToolUsage = {
  toolId: string;
  toolName: string;
  usageData: UsageData[];
  totalUsage: number;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
};
