// Mock type definitions matching GraphQL schema structure

export interface MockMCPTool {
  id: string;
  name: string;
  description?: string;
  mcpServerName: string;
  category: 'input' | 'processing' | 'output';
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface MockToolSet {
  id: string;
  name: string;
  description?: string;
  mcpTools: MockMCPTool[];
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  icon: string;
  toolsetPreset: MockToolSet;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: {
    toolName: string;
    status: 'success' | 'error';
  }[];
}
