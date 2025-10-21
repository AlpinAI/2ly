import { gql } from '@apollo/client/core';

export const MCP_SERVERS_SUBSCRIPTION = gql`
  subscription MCPServers($workspaceId: ID!) {
    mcpServers(workspaceId: $workspaceId) {
      id
      name
      description
      repositoryUrl
      transport
      config
      runOn
      tools {
        id
        name
        description
        status
        inputSchema
        annotations
      }
      runtime {
        id
        name
        description
        status
        createdAt
        lastSeenAt
        roots
        capabilities
        mcpToolCapabilities {
          id
          name
          description
          status
        }
      }
      workspace {
        id
        name
      }
    }
  }
`;

export const TOOL_CAPABILITIES_SUBSCRIPTION = gql`
  subscription ToolCapabilities($workspaceId: ID!) {
    toolCapabilities(workspaceId: $workspaceId) {
      id
      name
      description
      inputSchema
      annotations
      status
      createdAt
      lastSeenAt
      tool {
        id
        name
        description
        status
        mcpServer {
          id
          name
          description
          runtime {
            id
            name
            description
            status
          }
        }
      }
      runtimes {
        id
        name
        description
        status
        createdAt
        lastSeenAt
        roots
        capabilities
        mcpToolCapabilities {
          id
          name
          description
          status
        }
      }
      workspace {
        id
        name
      }
    }
  }
`;

export const RUNTIMES_SUBSCRIPTION = gql`
  subscription Runtimes($workspaceId: ID!) {
    runtimes(workspaceId: $workspaceId) {
      id
      name
      description
      status
      createdAt
      lastSeenAt
      roots
      capabilities
      hostname
      hostIP
      mcpClientName
      mcpToolCapabilities {
        id
        name
        description
        status
      }
      mcpServers {
        id
        name
        description
      }
    }
  }
`;

export const MCP_TOOLS_SUBSCRIPTION = gql`
  subscription MCPTools($workspaceId: ID!) {
    mcpTools(workspaceId: $workspaceId) {
      id
    }
  }
`;

export const TOOL_CALLS_SUBSCRIPTION = gql`
  subscription ToolCalls($workspaceId: ID!) {
    toolCalls(workspaceId: $workspaceId) {
      id
      toolInput
      calledAt
      completedAt
      status
      toolOutput
      error
      mcpTool {
        id
        name
        mcpServer {
          id
          name
        }
      }
      calledBy {
        id
        name
        hostname
      }
      executedBy {
        id
        name
        hostname
      }
    }
  }
`;
