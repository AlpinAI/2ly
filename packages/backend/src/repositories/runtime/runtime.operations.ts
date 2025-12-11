import { gql } from 'urql';


export const ADD_SYSTEM_RUNTIME = gql`
  mutation addSystemRuntime(
    $name: String!
    $description: String!
    $status: ActiveStatus!
    $type: RuntimeType!
    $createdAt: DateTime!
    $lastSeenAt: DateTime!
    $systemId: ID!
  ) {
    addRuntime(
      input: {
        name: $name
        description: $description
        status: $status
        type: $type
        createdAt: $createdAt
        lastSeenAt: $lastSeenAt
        system: { id: $systemId }
      }
    ) {
      runtime {
        id
        name
        description
        status
        type
        createdAt
        lastSeenAt
        workspace {
          id
          name
        }
        system {
          id
        }
      }
    }
  }
`;

export const ADD_WORKSPACE_RUNTIME = gql`
  mutation addRuntime(
    $name: String!
    $description: String!
    $status: ActiveStatus!
    $type: RuntimeType!
    $createdAt: DateTime!
    $lastSeenAt: DateTime!
    $workspaceId: ID!
  ) {
    addRuntime(
      input: {
        name: $name
        description: $description
        status: $status
        type: $type
        createdAt: $createdAt
        lastSeenAt: $lastSeenAt
        workspace: { id: $workspaceId }
      }
    ) {
      runtime {
        id
        name
        description
        status
        type
        createdAt
        lastSeenAt
        workspace {
          id
          name
        }
        system {
          id
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
        type
        createdAt
        lastSeenAt
        workspace {
          id
          name
        }
        system {
          id
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
      type
      createdAt
      lastSeenAt
      processId
      hostIP
      hostname
      mcpClientName
      roots
      workspace {
        id
      }
      system {
        id
      }
    }
  }
`;

export const GET_RUNTIME_EDGE_MCP_SERVERS = gql`
  query getRuntime($id: ID!) {
    getRuntime(id: $id) {
      id
      mcpServers(filter: { executionTarget: { eq: EDGE } }) {
        id
        name
        description
        transport
        config
        executionTarget
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

export const GET_RUNTIME_ALL_TOOLS = gql`
  query getRuntime($id: ID!) {
    getRuntime(id: $id) {
      id
      workspace {
        id
      }
      mcpServers {
        id
        tools(filter: { status: { eq: ACTIVE } }) {
          id
          name
          description
          inputSchema
          annotations
          status
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
      system {
        id
      }
    }
  }
`;

export const QUERY_SYSTEM_RUNTIME_BY_NAME = gql`
  query getSystemRuntimeByName($systemId: ID!, $name: String!) {
    getSystem(id: $systemId) {
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

export const QUERY_WORKSPACE_RUNTIME_BY_NAME = gql`
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
        workspace {
          id
        }
        system {
          id
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
        workspace {
          id
        }
        system {
          id
        }
      }
    }
  }
`;

export const UPDATE_RUNTIME_LAST_SEEN = gql`
  mutation updateRuntimeLastSeen($id: ID!, $now: DateTime!) {
    updateRuntime(input: { filter: { id: [$id] }, set: { lastSeenAt: $now } }) {
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

