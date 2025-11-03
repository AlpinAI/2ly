import { gql } from 'urql';

export const CREATE_TOKEN = gql`
  mutation createToken(
    $key: String!
    $type: TokenType!
    $workspaceId: String!
    $toolsetId: String
    $runtimeId: String
    $now: DateTime!
    $expiresAt: DateTime
    $description: String
    $permissions: String
  ) {
    addToken(
      input: {
        key: $key
        type: $type
        workspaceId: $workspaceId
        toolsetId: $toolsetId
        runtimeId: $runtimeId
        createdAt: $now
        expiresAt: $expiresAt
        description: $description
        permissions: $permissions
      }
    ) {
      token {
        id
        key
        type
        workspaceId
        toolsetId
        runtimeId
        createdAt
        expiresAt
        revokedAt
        description
        permissions
      }
    }
  }
`;

export const REVOKE_TOKEN = gql`
  mutation revokeToken($id: ID!, $now: DateTime!) {
    updateToken(input: { filter: { id: [$id] }, set: { revokedAt: $now } }) {
      token {
        id
        key
        type
        revokedAt
      }
    }
  }
`;

export const FIND_TOKENS_BY_TYPE = gql`
  query findTokensByType($type: TokenType!, $workspaceId: String!) {
    queryToken(filter: { type: { eq: $type }, workspaceId: { eq: $workspaceId } }) {
      id
      key
      type
      workspaceId
      toolsetId
      runtimeId
      createdAt
      expiresAt
      revokedAt
      description
      permissions
    }
  }
`;

export const FIND_TOKENS_BY_TOOLSET = gql`
  query findTokensByToolset($toolsetId: String!) {
    queryToken(filter: { toolsetId: { eq: $toolsetId } }) {
      id
      key
      type
      workspaceId
      toolsetId
      runtimeId
      createdAt
      expiresAt
      revokedAt
      description
      permissions
    }
  }
`;

export const FIND_TOKENS_BY_RUNTIME = gql`
  query findTokensByRuntime($runtimeId: String!) {
    queryToken(filter: { runtimeId: { eq: $runtimeId } }) {
      id
      key
      type
      workspaceId
      toolsetId
      runtimeId
      createdAt
      expiresAt
      revokedAt
      description
      permissions
    }
  }
`;

export const DELETE_TOKEN = gql`
  mutation deleteToken($id: ID!) {
    deleteToken(filter: { id: [$id] }) {
      token {
        id
      }
    }
  }
`;
