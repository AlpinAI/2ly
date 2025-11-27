import { gql } from 'urql';

export const ADD_TOOLSET = gql`
  mutation addToolSet(
    $name: String!
    $description: String
    $workspaceId: ID!
    $createdAt: DateTime!
  ) {
    addToolSet(
      input: {
        name: $name
        description: $description
        workspace: { id: $workspaceId }
        createdAt: $createdAt
        updatedAt: $createdAt
      }
    ) {
      toolSet {
        id
        name
        description
        createdAt
        updatedAt
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const UPDATE_TOOLSET = gql`
  mutation updateToolSet(
    $id: ID!
    $name: String!
    $description: String
    $updatedAt: DateTime!
  ) {
    updateToolSet(
      input: {
        filter: { id: [$id] }
        set: {
          name: $name
          description: $description
          updatedAt: $updatedAt
        }
      }
    ) {
      toolSet {
        id
        name
        description
        createdAt
        updatedAt
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const DELETE_TOOLSET = gql`
  mutation deleteToolSet($id: ID!) {
    deleteToolSet(filter: { id: [$id] }) {
      toolSet {
        id
        name
        description
        createdAt
        updatedAt
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const GET_TOOLSET = gql`
  query getToolSet($id: ID!) {
    getToolSet(id: $id) {
      id
      name
      description
      createdAt
      updatedAt
      mcpTools {
        id
        name
        description
        inputSchema
        annotations
        status
        createdAt
        lastSeenAt
        mcpServer {
          id
          name
          runOn
        }
      }
      workspace {
        id
        name
      }
    }
  }
`;

export const QUERY_TOOLSETS_BY_WORKSPACE = gql`
  query getWorkspaceToolSets($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      id
      toolSets {
        id
        name
        description
        createdAt
        updatedAt
        mcpTools {
          id
          name
          description
          inputSchema
          annotations
          status
          createdAt
          lastSeenAt
        }
      }
    }
  }
`;

export const ADD_MCP_TOOL_TO_TOOLSET = gql`
  mutation addMCPToolToToolSet(
    $toolSetId: ID!
    $mcpToolId: ID!
    $updatedAt: DateTime!
  ) {
    updateToolSet(
      input: {
        filter: { id: [$toolSetId] }
        set: {
          mcpTools: [{ id: $mcpToolId }]
          updatedAt: $updatedAt
        }
      }
    ) {
      toolSet {
        id
        name
        description
        createdAt
        updatedAt
        mcpTools {
          id
          name
          description
          inputSchema
          annotations
          status
          createdAt
          lastSeenAt
          mcpServer {
            id
            name
            runOn
          }
        }
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const REMOVE_MCP_TOOL_FROM_TOOLSET = gql`
  mutation removeMCPToolFromToolSet(
    $toolSetId: ID!
    $mcpToolId: ID!
    $updatedAt: DateTime!
  ) {
    updateToolSet(
      input: {
        filter: { id: [$toolSetId] }
        remove: {
          mcpTools: [{ id: $mcpToolId }]
        }
        set: {
          updatedAt: $updatedAt
        }
      }
    ) {
      toolSet {
        id
        name
        description
        createdAt
        updatedAt
        mcpTools {
          id
          name
          description
          inputSchema
          annotations
          status
          createdAt
          lastSeenAt
          mcpServer {
            id
            name
            runOn
          }
        }
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const OBSERVE_TOOLSETS = (type: 'query' | 'subscription' = 'query') => gql`
  ${type === 'query' ? 'query' : 'subscription'} getWorkspaceToolSets($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      id
      toolSets {
        id
        name
        description
        createdAt
        updatedAt
        mcpTools {
          id
          name
          description
          status
          mcpServer {
            id
            name
            runOn
          }
        }
      }
    }
  }
`;

export const QUERY_ALL_TOOLSETS = gql`
  query queryAllToolSets {
    queryToolSet {
      id
      name
      description
      createdAt
      updatedAt
      mcpTools {
        id
        name
        description
        inputSchema
        annotations
        status
        createdAt
        lastSeenAt
        mcpServer {
          id
          name
          runOn
        }
      }
      workspace {
        id
        name
      }
    }
  }
`;

export const QUERY_TOOLSET_BY_NAME = gql`
  query getWorkspaceToolSetByName($workspaceId: ID!, $name: String!) {
    getWorkspace(id: $workspaceId) {
      id
      toolSets(filter: { name: { eq: $name } }) {
        id
        name
        description
        createdAt
        updatedAt
        mcpTools {
          id
          name
          description
          inputSchema
          annotations
          status
          createdAt
          lastSeenAt
          mcpServer {
            id
            name
            runOn
          }
        }
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const GET_TOOLSET_AGENT_MCP_SERVERS = gql`
  query getToolSet($toolsetId: ID!) {
    getToolSet(id: $toolsetId) {
      mcpTools {
        mcpServer {
          id
          name
          description
          transport
          config
          runOn
          tools {
            id
            name
            description
            inputSchema
            annotations
          }
        }
      }
    }
  }
`;