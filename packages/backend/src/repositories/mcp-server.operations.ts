import { gql } from 'urql';

export const ADD_MCPSERVER = gql`
  mutation addMCPServer(
    $name: String!
    $description: String!
    $repositoryUrl: String!
    $transport: MCPTransportType!
    $config: String!
    $workspaceId: ID!
    $registryServerId: ID!
    $runOn: MCPServerRunOn
  ) {
    addMCPServer(
      input: {
        name: $name
        description: $description
        repositoryUrl: $repositoryUrl
        transport: $transport
        config: $config
        runOn: $runOn
        workspace: { id: $workspaceId }
        registryServer: { id: $registryServerId }
      }
    ) {
      mCPServer {
        id
        name
        description
        repositoryUrl
        transport
        config
        runOn
        workspace {
          id
          name
        }
        registryServer {
          id
          name
        }
      }
    }
  }
`;

export const UPDATE_MCPSERVER = gql`
  mutation updateMCPServer(
    $id: ID!
    $name: String!
    $description: String!
    $repositoryUrl: String!
    $transport: MCPTransportType!
    $config: String!
    $runOn: MCPServerRunOn
  ) {
    updateMCPServer(
      input: {
        filter: { id: [$id] }
        set: {
          name: $name
          description: $description
          repositoryUrl: $repositoryUrl
          transport: $transport
          config: $config
          runOn: $runOn
        }
      }
    ) {
      mCPServer {
        id
        name
        description
        repositoryUrl
        transport
        config
        runOn
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const UPDATE_MCPSERVER_RUN_ON = gql`
  mutation updateMCPServerRunOn($id: ID!, $runOn: MCPServerRunOn) {
    updateMCPServer(input: { filter: { id: [$id] }, set: { runOn: $runOn } }) {
      mCPServer {
        id
        runOn
        runtime {
          id
          name
          description
          status
          lastSeenAt
        }
      }
    }
  }
`;

export const GET_MCPSERVER = gql`
  query getMCPServer($id: ID!) {
    getMCPServer(id: $id) {
      id
      runOn
      runtime {
        id
      }
    }
  }
`;

export const GET_MCPSERVER_WITH_WORKSPACE = gql`
  query getMCPServerWithWorkspace($id: ID!) {
    getMCPServer(id: $id) {
      id
      workspace {
        id
      }
    }
  }
`;

export const LINK_RUNTIME = gql`
  mutation linkRuntime($mcpServerId: ID!, $runtimeId: ID!) {
    updateMCPServer(input: { filter: { id: [$mcpServerId] }, set: { runtime: { id: $runtimeId } } }) {
      mCPServer {
        id
        name
        description
        runOn
        runtime {
          id
          name
          description
          status
          lastSeenAt
        }
      }
    }
  }
`;

export const UNLINK_RUNTIME = gql`
  mutation unlinkRuntime($mcpServerId: ID!, $runtimeId: ID!) {
    updateMCPServer(input: { filter: { id: [$mcpServerId] }, remove: { runtime: { id: $runtimeId } } }) {
      mCPServer {
        id
        name
        description
        runOn
        runtime {
          id
        }
      }
    }
  }
`;

export const DELETE_MCP_TOOLS = gql`
  mutation deleteMCPTools($ids: [ID!]!) {
    deleteMCPTool(filter: { id: $ids }) {
      mCPTool {
        id
      }
    }
  }
`;

export const DELETE_MCPSERVER = gql`
  mutation deleteMCPServer($id: ID!) {
    deleteMCPServer(filter: { id: [$id] }) {
      mCPServer {
        id
        name
        description
        repositoryUrl
        transport
        config
        runOn
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const QUERY_MCP_SERVER_CAPABILITIES = (type: 'query' | 'subscription' = 'query') => gql`
  ${type === 'query' ? 'query' : 'subscription'} getMCPServer($id: ID!) {
    getMCPServer(id: $id) {
      id
      tools {
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
`;

export const QUERY_MCPSERVERS = gql`
  query {
    queryMCPServer {
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
        inputSchema
        annotations
        status
        createdAt
        lastSeenAt
      }
      runtime {
        id
        name
        description
        status
        lastSeenAt
      }
      workspace {
        id
        name
      }
    }
  }
`;
