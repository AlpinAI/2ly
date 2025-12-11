import { gql } from 'urql';

export const GET_OAUTH_PROVIDERS_BY_WORKSPACE = gql`
  query GetOAuthProvidersByWorkspace($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      oauthProviders {
        id
        provider
        enabled
        clientId
        encryptedClientSecret
        tenantId
        createdAt
        updatedAt
      }
    }
  }
`;

export const FIND_OAUTH_PROVIDER_BY_TYPE = gql`
  query FindOAuthProviderByType($workspaceId: ID!, $provider: OAuthProviderType!) {
    getWorkspace(id: $workspaceId) {
      oauthProviders(filter: { provider: { eq: $provider } }) {
        id
        provider
        enabled
        clientId
        encryptedClientSecret
        tenantId
        createdAt
        updatedAt
      }
    }
  }
`;

export const CREATE_OAUTH_PROVIDER = gql`
  mutation CreateOAuthProvider(
    $workspaceId: ID!
    $provider: OAuthProviderType!
    $enabled: Boolean!
    $clientId: String!
    $encryptedClientSecret: String!
    $tenantId: String
    $now: DateTime!
  ) {
    addOAuthProviderConfig(
      input: [
        {
          workspace: { id: $workspaceId }
          provider: $provider
          enabled: $enabled
          clientId: $clientId
          encryptedClientSecret: $encryptedClientSecret
          tenantId: $tenantId
          createdAt: $now
          updatedAt: $now
        }
      ]
    ) {
      oAuthProviderConfig {
        id
        provider
        enabled
        clientId
        tenantId
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_OAUTH_PROVIDER = gql`
  mutation UpdateOAuthProvider(
    $id: ID!
    $clientId: String
    $encryptedClientSecret: String
    $tenantId: String
    $now: DateTime!
  ) {
    updateOAuthProviderConfig(
      input: {
        filter: { id: [$id] }
        set: {
          clientId: $clientId
          encryptedClientSecret: $encryptedClientSecret
          tenantId: $tenantId
          updatedAt: $now
        }
      }
    ) {
      oAuthProviderConfig {
        id
        provider
        enabled
        clientId
        tenantId
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_OAUTH_PROVIDER_ENABLED = gql`
  mutation UpdateOAuthProviderEnabled($id: ID!, $enabled: Boolean!, $now: DateTime!) {
    updateOAuthProviderConfig(
      input: {
        filter: { id: [$id] }
        set: { enabled: $enabled, updatedAt: $now }
      }
    ) {
      oAuthProviderConfig {
        id
        provider
        enabled
        clientId
        tenantId
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_OAUTH_PROVIDER = gql`
  mutation DeleteOAuthProvider($id: ID!) {
    deleteOAuthProviderConfig(filter: { id: [$id] }) {
      oAuthProviderConfig {
        id
      }
    }
  }
`;

export const GET_OAUTH_PROVIDER_BY_ID = gql`
  query GetOAuthProviderById($id: ID!) {
    getOAuthProviderConfig(id: $id) {
      id
      provider
      workspace {
        id
      }
    }
  }
`;
