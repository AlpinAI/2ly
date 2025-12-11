import { gql } from 'urql';

export const GET_USER_OAUTH_CONNECTIONS_BY_WORKSPACE = gql`
  query GetUserOAuthConnectionsByWorkspace {
    queryUserOAuthConnection(
      filter: {
        and: [
          { has: workspace }
          { has: user }
        ]
      }
    ) {
      id
      provider
      accountEmail
      accountName
      accountAvatarUrl
      providerAccountId
      scopes
      tokenExpiresAt
      createdAt
      updatedAt
      lastUsedAt
      workspace {
        id
      }
      user {
        id
      }
    }
  }
`;

export const FIND_USER_OAUTH_CONNECTION_BY_PROVIDER = gql`
  query FindUserOAuthConnectionByProvider($provider: OAuthProviderType!) {
    queryUserOAuthConnection(
      filter: {
        and: [
          { provider: { eq: $provider } }
          { has: workspace }
          { has: user }
        ]
      }
    ) {
      id
      provider
      encryptedAccessToken
      encryptedRefreshToken
      tokenExpiresAt
      scopes
      accountEmail
      accountName
      accountAvatarUrl
      providerAccountId
      createdAt
      updatedAt
      lastUsedAt
      workspace {
        id
      }
      user {
        id
      }
    }
  }
`;

export const GET_USER_OAUTH_CONNECTION_BY_ID = gql`
  query GetUserOAuthConnectionById($id: ID!) {
    getUserOAuthConnection(id: $id) {
      id
      provider
      encryptedAccessToken
      encryptedRefreshToken
      tokenExpiresAt
      scopes
      accountEmail
      accountName
      accountAvatarUrl
      providerAccountId
      createdAt
      updatedAt
      lastUsedAt
      workspace {
        id
      }
      user {
        id
      }
    }
  }
`;

export const CREATE_USER_OAUTH_CONNECTION = gql`
  mutation CreateUserOAuthConnection(
    $workspaceId: ID!
    $userId: ID!
    $provider: OAuthProviderType!
    $encryptedAccessToken: String!
    $encryptedRefreshToken: String
    $tokenExpiresAt: DateTime
    $scopes: [String!]
    $accountEmail: String
    $accountName: String
    $accountAvatarUrl: String
    $providerAccountId: String
    $now: DateTime!
  ) {
    addUserOAuthConnection(
      input: [
        {
          workspace: { id: $workspaceId }
          user: { id: $userId }
          provider: $provider
          encryptedAccessToken: $encryptedAccessToken
          encryptedRefreshToken: $encryptedRefreshToken
          tokenExpiresAt: $tokenExpiresAt
          scopes: $scopes
          accountEmail: $accountEmail
          accountName: $accountName
          accountAvatarUrl: $accountAvatarUrl
          providerAccountId: $providerAccountId
          createdAt: $now
          updatedAt: $now
        }
      ]
    ) {
      userOAuthConnection {
        id
        provider
        accountEmail
        accountName
        accountAvatarUrl
        providerAccountId
        scopes
        tokenExpiresAt
        createdAt
        updatedAt
        lastUsedAt
      }
    }
  }
`;

export const UPDATE_USER_OAUTH_CONNECTION = gql`
  mutation UpdateUserOAuthConnection(
    $id: ID!
    $encryptedAccessToken: String
    $encryptedRefreshToken: String
    $tokenExpiresAt: DateTime
    $scopes: [String!]
    $accountEmail: String
    $accountName: String
    $accountAvatarUrl: String
    $now: DateTime!
  ) {
    updateUserOAuthConnection(
      input: {
        filter: { id: [$id] }
        set: {
          encryptedAccessToken: $encryptedAccessToken
          encryptedRefreshToken: $encryptedRefreshToken
          tokenExpiresAt: $tokenExpiresAt
          scopes: $scopes
          accountEmail: $accountEmail
          accountName: $accountName
          accountAvatarUrl: $accountAvatarUrl
          updatedAt: $now
        }
      }
    ) {
      userOAuthConnection {
        id
        provider
        accountEmail
        accountName
        accountAvatarUrl
        providerAccountId
        scopes
        tokenExpiresAt
        createdAt
        updatedAt
        lastUsedAt
      }
    }
  }
`;

export const UPDATE_USER_OAUTH_CONNECTION_LAST_USED = gql`
  mutation UpdateUserOAuthConnectionLastUsed($id: ID!, $now: DateTime!) {
    updateUserOAuthConnection(
      input: {
        filter: { id: [$id] }
        set: { lastUsedAt: $now }
      }
    ) {
      userOAuthConnection {
        id
        lastUsedAt
      }
    }
  }
`;

export const DELETE_USER_OAUTH_CONNECTION = gql`
  mutation DeleteUserOAuthConnection($id: ID!) {
    deleteUserOAuthConnection(filter: { id: [$id] }) {
      userOAuthConnection {
        id
      }
    }
  }
`;
