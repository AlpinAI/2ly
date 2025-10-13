import { gql } from '@apollo/client/core';

export const CREATE_MCP_SERVER_MUTATION = gql`
  mutation CreateMCPServer(
    $name: String!
    $description: String!
    $repositoryUrl: String!
    $transport: MCPTransportType!
    $config: String!
    $workspaceId: ID!
  ) {
    createMCPServer(
      name: $name
      description: $description
      repositoryUrl: $repositoryUrl
      transport: $transport
      config: $config
      workspaceId: $workspaceId
    ) {
      id
      name
      description
      repositoryUrl
      transport
      config
      runOn
    }
  }
`;

export const LINK_MCP_SERVER_TO_RUNTIME_MUTATION = gql`
  mutation LinkMCPServerToRuntime($mcpServerId: ID!, $runtimeId: ID!) {
    linkMCPServerToRuntime(mcpServerId: $mcpServerId, runtimeId: $runtimeId) {
      id
      name
      description
      runOn
      runtime {
        id
        name
        description
        status
      }
    }
  }
`;

export const UNLINK_MCP_SERVER_FROM_RUNTIME_MUTATION = gql`
  mutation UnlinkMCPServerFromRuntime($mcpServerId: ID!) {
    unlinkMCPServerFromRuntime(mcpServerId: $mcpServerId) {
      id
    }
  }
`;

export const UPDATE_MCP_SERVER_MUTATION = gql`
  mutation UpdateMCPServer(
    $id: ID!
    $name: String!
    $description: String!
    $repositoryUrl: String!
    $transport: MCPTransportType!
    $config: String!
    $runOn: MCPServerRunOn
  ) {
    updateMCPServer(
      id: $id
      name: $name
      description: $description
      repositoryUrl: $repositoryUrl
      transport: $transport
      config: $config
      runOn: $runOn
    ) {
      id
      name
      description
      repositoryUrl
      transport
      config
      runOn
    }
  }
`;

export const DELETE_TOOL_CAPABILITY_MUTATION = gql`
  mutation DeleteToolCapability($id: ID!) {
    deleteToolCapability(id: $id) {
      id
      name
    }
  }
`;

export const DELETE_MCP_SERVER_MUTATION = gql`
  mutation DeleteMCPServer($id: ID!) {
    deleteMCPServer(id: $id) {
      id
      name
      description
      repositoryUrl
      transport
      config
      runOn
    }
  }
`;

export const CREATE_TOOL_CAPABILITY_MUTATION = gql`
  mutation CreateToolCapability(
    $name: String!
    $description: String!
    $inputSchema: String!
    $annotations: String!
    $status: ActiveStatus!
    $workspaceId: ID!
    $toolId: ID!
  ) {
    createToolCapability(
      name: $name
      description: $description
      inputSchema: $inputSchema
      annotations: $annotations
      status: $status
      workspaceId: $workspaceId
      toolId: $toolId
    ) {
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
      }
      runtimes {
        id
        name
      }
      workspace {
        id
        name
      }
    }
  }
`;

export const LINK_TOOL_CAPABILITY_TO_AGENT_MUTATION = gql`
  mutation LinkToolCapabilityToAgent($toolCapabilityId: ID!, $agentRuntimeId: ID!) {
    linkToolCapabilityToAgent(toolCapabilityId: $toolCapabilityId, agentRuntimeId: $agentRuntimeId) {
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
      }
      runtimes {
        id
        name
      }
      workspace {
        id
        name
      }
    }
  }
`;

export const UPDATE_TOOL_CAPABILITY_MUTATION = gql`
  mutation UpdateToolCapability(
    $id: ID!
    $name: String!
    $description: String!
    $inputSchema: String!
    $annotations: String!
    $status: ActiveStatus!
  ) {
    updateToolCapability(
      id: $id
      name: $name
      description: $description
      inputSchema: $inputSchema
      annotations: $annotations
      status: $status
    ) {
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
      }
      runtimes {
        id
        name
      }
      workspace {
        id
        name
      }
    }
  }
`;

export const UNLINK_TOOL_CAPABILITY_FROM_AGENT_MUTATION = gql`
  mutation UnlinkToolCapabilityFromAgent($toolCapabilityId: ID!, $agentRuntimeId: ID!) {
    unlinkToolCapabilityFromAgent(toolCapabilityId: $toolCapabilityId, agentRuntimeId: $agentRuntimeId) {
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
      }
      runtimes {
        id
        name
      }
      workspace {
        id
        name
      }
    }
  }
`;

export const DELETE_RUNTIME = gql`
  mutation deleteRuntime($id: ID!) {
    deleteRuntime(id: $id) {
      id
      name
      description
      status
      createdAt
      lastSeenAt
    }
  }
`;

export const IMPORT_MCP_SERVER_CATALOG_MUTATION = gql`
  mutation importMcpServerCatalog($workspaceId: ID!, $catalog: String!) {
    importMcpServerCatalog(workspaceId: $workspaceId, catalog: $catalog) {
      id
      name
      description
      repositoryUrl
      transport
      command
      args
      ENV
      serverUrl
      workspace {
        id
        name
      }
    }
  }
`;

export const INIT_SYSTEM_MUTATION = gql`
  mutation InitSystem($name: String!, $adminPassword: String!, $email: String!) {
    initSystem(name: $name, adminPassword: $adminPassword, email: $email) {
      id
      initialized
    }
  }
`;

export const UPDATE_WORKSPACE_MUTATION = gql`
  mutation UpdateWorkspace($id: ID!, $name: String!) {
    updateWorkspace(id: $id, name: $name) {
      id
      name
      createdAt
    }
  }
`;

export const SET_GLOBAL_RUNTIME_MUTATION = gql`
  mutation SetGlobalRuntime($id: ID!, $runtimeId: ID!) {
    setGlobalRuntime(id: $id, runtimeId: $runtimeId) {
      id
      name
    }
  }
`;

export const UNSET_GLOBAL_RUNTIME_MUTATION = gql`
  mutation UnsetGlobalRuntime($id: ID!) {
    unsetGlobalRuntime(id: $id) {
      id
      name
    }
  }
`;

export const SET_DEFAULT_TESTING_RUNTIME_MUTATION = gql`
  mutation SetDefaultTestingRuntime($id: ID!, $runtimeId: ID!) {
    setDefaultTestingRuntime(id: $id, runtimeId: $runtimeId) {
      id
      name
      defaultTestingRuntime {
        id
        name
      }
    }
  }
`;

export const UNSET_DEFAULT_TESTING_RUNTIME_MUTATION = gql`
  mutation UnsetDefaultTestingRuntime($id: ID!) {
    unsetDefaultTestingRuntime(id: $id) {
      id
      name
    }
  }
`;

export const UPDATE_MCP_SERVER_RUN_ON_MUTATION = gql`
  mutation UpdateMCPServerRunOn($mcpServerId: ID!, $runOn: MCPServerRunOn!, $runtimeId: ID) {
    updateMCPServerRunOn(mcpServerId: $mcpServerId, runOn: $runOn, runtimeId: $runtimeId) {
      id
      runOn
      runtime {
        id
        name
        description
        status
      }
    }
  }
`;

export const CREATE_RUNTIME_MUTATION = gql`
  mutation CreateRuntime($name: String!, $description: String!, $capabilities: [String!]!, $workspaceId: ID!) {
    createRuntime(name: $name, description: $description, capabilities: $capabilities, workspaceId: $workspaceId) {
      id
      name
      description
      status
      createdAt
      lastSeenAt
      capabilities
    }
  }
`;

export const UPDATE_RUNTIME_MUTATION = gql`
  mutation UpdateRuntime($id: ID!, $name: String!, $description: String!) {
    updateRuntime(id: $id, name: $name, description: $description) {
      id
      name
      description
      status
      createdAt
      lastSeenAt
      capabilities
    }
  }
`;

export const CALL_MCP_TOOL_MUTATION = gql`
  mutation CallMCPTool($toolId: ID!, $input: String!) {
    callMCPTool(toolId: $toolId, input: $input) {
      success
      result
    }
  }
`;
