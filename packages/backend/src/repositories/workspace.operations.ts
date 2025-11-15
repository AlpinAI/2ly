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
      createdAt
      globalRuntime {
        id
        name
      }
      onboardingSteps {
        id
        stepId
        type
        status
        priority
        createdAt
        updatedAt
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
        type
        hostname
        mcpClientName
        hostIP
        mcpClientName
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
        config
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
          name
          description
          repositoryUrl
        }
        toolSets {
          id
          name
          description
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

export const CREATE_ONBOARDING_STEP = gql`
  mutation createOnboardingStep($stepId: String!, $type: OnboardingStepType!, $priority: Int!, $now: DateTime!) {
    addOnboardingStep(input: {
      stepId: $stepId
      type: $type
      status: PENDING
      priority: $priority
      createdAt: $now
    }) {
      onboardingStep {
        id
        stepId
        type
        status
        priority
        createdAt
      }
    }
  }
`;

export const UPDATE_ONBOARDING_STEP_STATUS = gql`
  mutation updateOnboardingStepCompleted($id: ID!, $status: OnboardingStepStatus!, $now: DateTime!) {
    updateOnboardingStep(input: {
      filter: { id: [$id] }
      set: {
        status: $status
        updatedAt: $now
      }
    }) {
      onboardingStep {
        id
        stepId
        type
        status
        priority
        createdAt
        updatedAt
      }
    }
  }
`;

export const LINK_ONBOARDING_STEP_TO_WORKSPACE = gql`
  mutation linkOnboardingStepToWorkspace($workspaceId: ID!, $stepId: ID!) {
    updateWorkspace(input: {
      filter: { id: [$workspaceId] }
      set: { onboardingSteps: { id: $stepId } }
    }) {
      workspace {
        id
        name
        onboardingSteps {
          id
          stepId
          type
          status
          priority
          createdAt
          updatedAt
        }
      }
    }
  }
`;

// Registry server operations
export const QUERY_WORKSPACE_WITH_REGISTRY_SERVERS = gql`
  query getWorkspaceWithRegistryServers($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      id
      registryServers {
        id
        name
        description
        title
        repositoryUrl
        version
        packages
        remotes
        _meta
        createdAt
        lastSeenAt
        configurations {
          id
          name
        }
      }
    }
  }
`;

export const ADD_REGISTRY_SERVER = gql`
  mutation addRegistryServer(
    $name: String!
    $description: String!
    $title: String!
    $repositoryUrl: String!
    $version: String!
    $packages: String!
    $remotes: String
    $_meta: String
    $workspaceId: ID!
    $now: DateTime!
  ) {
    addMCPRegistryServer(
      input: {
        name: $name
        description: $description
        title: $title
        repositoryUrl: $repositoryUrl
        version: $version
        packages: $packages
        remotes: $remotes
        _meta: $_meta
        createdAt: $now
        lastSeenAt: $now
        workspace: { id: $workspaceId }
      }
    ) {
      mCPRegistryServer {
        id
        name
        description
        title
        repositoryUrl
        version
        packages
        remotes
        _meta
        createdAt
        lastSeenAt
        workspace {
          id
        }
      }
    }
  }
`;

export const UPDATE_REGISTRY_SERVER = gql`
  mutation updateRegistryServer(
    $id: ID!
    $name: String
    $description: String
    $title: String
    $repositoryUrl: String
    $version: String
    $packages: String
    $remotes: String
  ) {
    updateMCPRegistryServer(
      input: {
        filter: { id: [$id] }
        set: {
          name: $name
          description: $description
          title: $title
          repositoryUrl: $repositoryUrl
          version: $version
          packages: $packages
          remotes: $remotes
        }
      }
    ) {
      mCPRegistryServer {
        id
        name
        description
        title
        repositoryUrl
        version
        packages
        remotes
        _meta
        createdAt
        lastSeenAt
      }
    }
  }
`;

export const DELETE_REGISTRY_SERVER = gql`
  mutation deleteRegistryServer($id: ID!) {
    deleteMCPRegistryServer(filter: { id: [$id] }) {
      mCPRegistryServer {
        id
        name
      }
    }
  }
`;

export const DELETE_REGISTRY_SERVERS = gql`
  mutation deleteRegistryServers($ids: [ID!]!) {
    deleteMCPRegistryServer(filter: { id: $ids }) {
      mCPRegistryServer {
        id
      }
    }
  }
`;

export const GET_REGISTRY_SERVER = gql`
  query getRegistryServer($id: ID!) {
    getMCPRegistryServer(id: $id) {
      id
      name
      description
      title
      repositoryUrl
      version
      packages
      remotes
      _meta
      createdAt
      lastSeenAt
      workspace {
        id
      }
      configurations {
        id
        name
      }
    }
  }
`;
