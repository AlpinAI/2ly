import { gql } from 'urql';

export const ADD_WORKSPACE = gql`
  mutation addWorkspace($name: String!, $now: DateTime!, $systemId: ID!, $adminId: ID!) {
    addWorkspace(input: { name: $name, createdAt: $now, system: { id: $systemId }, admins: { id: $adminId } }) {
      workspace {
        id
        name
        createdAt
        system {
          id
          initialized
          admins {
            id
            email
          }
        }
      }
    }
  }
`;

export const QUERY_WORKSPACE = gql`
  query getWorkspace($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      id
      name
      globalRuntime {
        id
        name
      }
      defaultTestingRuntime {
        id
        name
      }
    }
  }
`;

export const QUERY_WORKSPACES = gql`
  query queryWorkspace {
    queryWorkspace {
      id
      name
      createdAt
      globalRuntime {
        id
        name
      }
      defaultTestingRuntime {
        id
        name
      }
    }
  }
`;

export const QUERY_WORKSPACE_WITH_RUNTIMES = gql`
  query getWorkspace($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      id
      runtimes {
        id
        name
        description
        status
        createdAt
        lastSeenAt
        roots
        capabilities
        hostname
        mcpClientName
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
  }
`;

export const QUERY_WORKSPACE_WITH_MCP_SERVERS = gql`
  query getWorkspace($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      id
      mcpServers {
        id
        name
        description
        repositoryUrl
        transport
        command
        args
        ENV
        serverUrl
        runOn
        tools {
          id
          name
          description
          status
          inputSchema
          annotations
          mcpServer {
            id
            name
            description
          }
        }
        runtime {
          id
          name
          description
          status
          lastSeenAt
          createdAt
        }
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const QUERY_WORKSPACE_WITH_MCP_TOOLS = gql`
  query getWorkspace($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      id
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
        }
      }
    }
  }
`;

export const UPDATE_WORKSPACE = gql`
  mutation updateWorkspace($id: ID!, $name: String!) {
    updateWorkspace(input: { filter: { id: [$id] }, set: { name: $name } }) {
      workspace {
        id
        name
        createdAt
      }
    }
  }
`;

export const SET_DEFAULT_TESTING_RUNTIME = gql`
  mutation setDefaultTestingRuntime($id: ID!, $runtimeId: ID!) {
    updateWorkspace(input: { filter: { id: [$id] }, set: { defaultTestingRuntime: { id: $runtimeId } } }) {
      workspace {
        id
      }
    }
  }
`;

export const UNSET_DEFAULT_TESTING_RUNTIME = gql`
  mutation unsetDefaultTestingRuntime($id: ID!) {
    updateWorkspace(input: { filter: { id: [$id] }, set: { defaultTestingRuntime: null } }) {
      workspace {
        id
      }
    }
  }
`;

export const SET_GLOBAL_RUNTIME = gql`
  mutation setGlobalRuntime($id: ID!, $runtimeId: ID!) {
    updateWorkspace(input: { filter: { id: [$id] }, set: { globalRuntime: { id: $runtimeId } } }) {
      workspace {
        id
      }
    }
  }
`;

export const UNSET_GLOBAL_RUNTIME = gql`
  mutation unsetGlobalRuntime($id: ID!) {
    updateWorkspace(input: { filter: { id: [$id] }, set: { globalRuntime: null } }) {
      workspace {
        id
      }
    }
  }
`;