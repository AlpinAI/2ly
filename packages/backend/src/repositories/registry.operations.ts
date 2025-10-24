import { gql } from 'urql';

export const ADD_MCP_REGISTRY = gql`
  mutation addMCPRegistry($name: String!, $workspaceId: ID!, $now: DateTime!) {
    addMCPRegistry(
      input: {
        name: $name
        createdAt: $now
        workspace: { id: $workspaceId }
      }
    ) {
      mCPRegistry {
        id
        name
        createdAt
        lastSyncAt
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const GET_MCP_REGISTRY = gql`
  query getMCPRegistry($id: ID!) {
    getMCPRegistry(id: $id) {
      id
      name
      createdAt
      lastSyncAt
      workspace {
        id
        name
      }
      servers {
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

export const QUERY_WORKSPACE_WITH_REGISTRIES = gql`
  query getWorkspace($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      id
      mcpRegistries {
        id
        name
        createdAt
        lastSyncAt
        servers {
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

export const DELETE_MCP_REGISTRY = gql`
  mutation deleteMCPRegistry($id: ID!) {
    deleteMCPRegistry(filter: { id: [$id] }) {
      mCPRegistry {
        id
        name
        createdAt
        lastSyncAt
        workspace {
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
    $registryId: ID!
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
        registry: { id: $registryId }
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
        registry {
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
      registry {
        id
      }
      configurations {
        id
        name
      }
    }
  }
`;
