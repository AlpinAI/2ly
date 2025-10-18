import { gql } from 'urql';

export const ADD_MCP_REGISTRY = gql`
  mutation addMCPRegistry($name: String!, $upstreamUrl: String!, $workspaceId: ID!, $now: DateTime!) {
    addMCPRegistry(
      input: {
        name: $name
        upstreamUrl: $upstreamUrl
        createdAt: $now
        workspace: { id: $workspaceId }
      }
    ) {
      mCPRegistry {
        id
        name
        upstreamUrl
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
      upstreamUrl
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
        upstreamUrl
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
        upstreamUrl
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

export const UPDATE_REGISTRY_SERVER_LAST_SEEN = gql`
  mutation updateRegistryServerLastSeen($id: ID!, $lastSeenAt: DateTime!) {
    updateMCPRegistryServer(
      input: {
        filter: { id: [$id] }
        set: { lastSeenAt: $lastSeenAt }
      }
    ) {
      mCPRegistryServer {
        id
        lastSeenAt
      }
    }
  }
`;

export const UPDATE_REGISTRY_LAST_SYNC = gql`
  mutation updateRegistryLastSync($id: ID!, $lastSyncAt: DateTime!) {
    updateMCPRegistry(
      input: {
        filter: { id: [$id] }
        set: { lastSyncAt: $lastSyncAt }
      }
    ) {
      mCPRegistry {
        id
        name
        upstreamUrl
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

export const QUERY_REGISTRY_SERVER_BY_NAME = gql`
  query queryRegistryServerByName($name: String!) {
    queryMCPRegistryServer(filter: { name: { eq: $name } }) {
      id
      name
      version
      lastSeenAt
    }
  }
`;
