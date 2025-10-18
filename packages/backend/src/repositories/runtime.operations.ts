import { gql } from 'urql';

export const ADD_RUNTIME = gql`
  mutation addRuntime(
    $name: String!
    $description: String!
    $status: ActiveStatus!
    $createdAt: DateTime!
    $lastSeenAt: DateTime!
    $workspaceId: ID!
    $capabilities: [String!]!
  ) {
    addRuntime(
      input: {
        name: $name
        description: $description
        status: $status
        createdAt: $createdAt
        lastSeenAt: $lastSeenAt
        workspace: { id: $workspaceId }
        capabilities: $capabilities
      }
    ) {
      runtime {
        id
        name
        description
        status
        createdAt
        lastSeenAt
        capabilities
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const UPDATE_RUNTIME = gql`
  mutation updateRuntime($id: ID!, $name: String!, $description: String!) {
    updateRuntime(input: { filter: { id: [$id] }, set: { name: $name, description: $description } }) {
      runtime {
        id
        name
        description
        status
        createdAt
        lastSeenAt
        capabilities
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const DELETE_RUNTIME = gql`
  mutation deleteRuntime($id: ID!) {
    deleteRuntime(filter: { id: [$id] }) {
      runtime {
        id
        name
        description
        status
        createdAt
        lastSeenAt
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const ADD_MCPSERVER_TO_RUNTIME = gql`
  mutation updateRuntime($runtimeId: ID!, $mcpServerId: ID!) {
    updateRuntime(input: { filter: { id: [$runtimeId] }, set: { mcpServers: { id: $mcpServerId } } }) {
      runtime {
        id
        mcpServers {
          id
          description
          transport
          config
        }
      }
    }
  }
`;

export const GET_RUNTIME = gql`
  query getRuntime($id: ID!) {
    getRuntime(id: $id) {
      id
      name
      description
      status
      createdAt
      lastSeenAt
      processId
      hostIP
      hostname
      mcpClientName
      capabilities
      roots
      workspace {
        id
        globalRuntime {
          id
        }
      }
    }
  }
`;

export const GET_RUNTIME_EDGE_MCP_SERVERS = gql`
  query getRuntime($id: ID!) {
    getRuntime(id: $id) {
      id
      mcpServers(filter: { runOn: { eq: EDGE } }) {
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
`;

export const GET_RUNTIME_AGENT_MCP_SERVERS = gql`
  query getRuntime($id: ID!) {
    getRuntime(id: $id) {
      id
      mcpToolCapabilities {
        id
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

export const GET_RUNTIME_GLOBAL_MCP_SERVERS = gql`
  query getWorkspace($id: ID!) {
    getWorkspace(id: $id) {
      id
      mcpServers(filter: { runOn: { eq: GLOBAL } }) {
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
`;

export const QUERY_ACTIVE_RUNTIMES = gql`
  query queryActiveRuntimes {
    queryRuntime(filter: { status: { eq: ACTIVE } }) {
      id
      name
      description
      status
      createdAt
      lastSeenAt
      processId
      hostIP
      hostname
      mcpClientName
      roots
      workspace {
        id
        name
      }
    }
  }
`;

export const QUERY_RUNTIME_BY_NAME = gql`
  query getWorkspaceRuntimeByName($workspaceId: ID!, $name: String!) {
    getWorkspace(id: $workspaceId) {
      id
      runtimes(filter: { name: { eq: $name } }) {
        id
        name
        description
        status
        createdAt
        lastSeenAt
        processId
        hostIP
        hostname
        mcpClientName
        roots
      }
    }
  }
`;

export const QUERY_MCPSERVER_WITH_TOOL = gql`
  query getMCPServer($id: ID!, $toolName: String!) {
    getMCPServer(id: $id) {
      id
      workspace {
        id
      }
      tools(filter: { name: { eq: $toolName } }) {
        id
        name
        description
        inputSchema
        annotations
        status
      }
    }
  }
`;

export const SET_RUNTIME_INACTIVE = gql`
  mutation setRuntimeInactive($id: ID!) {
    updateRuntime(
      input: { filter: { id: [$id] }, set: { status: INACTIVE, processId: "", hostIP: "", hostname: "" } }
    ) {
      runtime {
        id
        name
        status
        createdAt
        lastSeenAt
        processId
        hostIP
        hostname
        mcpClientName
        roots
        mcpServers {
          id
          tools {
            id
            name
            status
          }
        }
      }
    }
  }
`;

export const SET_RUNTIME_ACTIVE = gql`
  mutation setRuntimeActive($id: ID!, $processId: String!, $hostIP: String!, $hostname: String!) {
    updateRuntime(input: { filter: { id: [$id] }, set: { status: ACTIVE, lastSeenAt: "${new Date().toISOString()}", processId: $processId, hostIP: $hostIP, hostname: $hostname } }) {
      runtime {
        id
        name
        status
        createdAt
        lastSeenAt
        processId
        hostIP
        hostname
        mcpClientName
        roots
      }
    }
  }
`;

export const UPDATE_RUNTIME_LAST_SEEN = gql`
  mutation updateRuntimeLastSeen($id: ID!) {
    updateRuntime(input: { filter: { id: [$id] }, set: { lastSeenAt: "${new Date().toISOString()}" } }) {
      runtime {
        id
        lastSeenAt
      }
    }
  }
`;

export const ADD_MCP_TOOL = gql`
  mutation addMCPTool(
    $toolName: String!
    $toolDescription: String!
    $toolInputSchema: String!
    $toolAnnotations: String!
    $now: DateTime!
    $workspaceId: ID!
    $mcpServerId: ID!
  ) {
    addMCPTool(
      input: {
        name: $toolName
        description: $toolDescription
        inputSchema: $toolInputSchema
        annotations: $toolAnnotations
        status: ACTIVE
        createdAt: $now
        lastSeenAt: $now
        workspace: { id: $workspaceId }
        mcpServer: { id: $mcpServerId }
      }
    ) {
      mCPTool {
        id
        name
        description
        inputSchema
        annotations
        status
        workspace {
          id
        }
      }
    }
  }
`;

export const UPDATE_MCP_TOOL = gql`
  mutation updateMCPTool(
    $toolId: ID!
    $toolDescription: String!
    $toolInputSchema: String!
    $toolAnnotations: String!
    $now: DateTime!
    $status: ActiveStatus!
  ) {
    updateMCPTool(
      input: {
        filter: { id: [$toolId] }
        set: {
          description: $toolDescription
          inputSchema: $toolInputSchema
          annotations: $toolAnnotations
          lastSeenAt: $now
          status: $status
        }
      }
    ) {
      mCPTool {
        id
        name
        description
        inputSchema
        annotations
        status
        workspace {
          id
        }
      }
    }
  }
`;

export const SET_ROOTS = gql`
  mutation setRoots($id: ID!, $roots: String!) {
    updateRuntime(input: { filter: { id: [$id] }, set: { roots: $roots } }) {
      runtime {
        id
        roots
      }
    }
  }
`;

export const SET_MCP_CLIENT_NAME = gql`
  mutation setMcpClientName($id: ID!, $mcpClientName: String!) {
    updateRuntime(input: { filter: { id: [$id] }, set: { mcpClientName: $mcpClientName } }) {
      runtime {
        id
        mcpClientName
      }
    }
  }
`;

export const LINK_MCP_TOOL = gql`
  mutation linkMCPTool($mcpToolId: ID!, $runtimeId: ID!) {
    updateRuntime(input: { filter: { id: [$runtimeId] }, set: { mcpToolCapabilities: { id: $mcpToolId } } }) {
      runtime {
        id
        name
        description
        mcpToolCapabilities {
          id
          name
        }
      }
    }
  }
`;

export const UNLINK_MCP_TOOL = gql`
  mutation unlinkMCPTool($mcpToolId: ID!, $runtimeId: ID!) {
    updateRuntime(input: { filter: { id: [$runtimeId] }, remove: { mcpToolCapabilities: { id: $mcpToolId } } }) {
      runtime {
        id
        name
        mcpToolCapabilities {
          id
          name
        }
      }
    }
  }
`;

export const QUERY_RUNTIME_MCP_TOOLS = gql`
  query getRuntime($id: ID!) {
    getRuntime(id: $id) {
      id
      name
      status
      mcpToolCapabilities(filter: { status: { eq: ACTIVE } }) {
        id
        name
        description
        inputSchema
        annotations
        status
      }
    }
  }
`;

export const SET_RUNTIME_CAPABILITIES = gql`
  mutation setRuntimeCapabilities($id: ID!, $capabilities: [String!]!) {
    updateRuntime(input: { filter: { id: [$id] }, set: { capabilities: $capabilities } }) {
      runtime {
        id
        capabilities
      }
    }
  }
`;
