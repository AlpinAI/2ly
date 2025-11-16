import { gql } from 'urql';

export const CREATE_IDENTITY_KEY = gql`
  mutation createIdentityKey(
    $key: String!
    $relatedId: String!
    $now: DateTime!
    $expiresAt: DateTime
    $description: String
    $permissions: String
  ) {
    addIdentityKey(
      input: {
        key: $key
        relatedId: $relatedId
        createdAt: $now
        expiresAt: $expiresAt
        description: $description
        permissions: $permissions
      }
    ) {
      identityKey {
        id
        key
        relatedId
        createdAt
        expiresAt
        revokedAt
        description
        permissions
      }
    }
  }
`;

export const REVOKE_IDENTITY_KEY = gql`
  mutation revokeIdentityKey($id: ID!, $now: DateTime!) {
    updateIdentityKey(input: { filter: { id: [$id] }, set: { revokedAt: $now } }) {
      identityKey {
        id
        key
        relatedId
        createdAt
        expiresAt
        revokedAt
        description
        permissions
      }
    }
  }
`;

export const FIND_IDENTITY_KEY = gql`
  query findIdentityKey($key: String!) {
    queryIdentityKey(filter: { key: { eq: $key } }) {
      id
      key
      relatedId
      createdAt
      expiresAt
      revokedAt
      description
      permissions
    }
  }
`;

export const DELETE_IDENTITY_KEY = gql`
  mutation deleteIdentityKey($id: ID!) {
    deleteIdentityKey(filter: { id: [$id] }) {
      identityKey {
        id
      }
    }
  }
`;

export const FIND_KEYS_BY_RELATED_ID = gql`
  query findKeysByRelatedId($relatedId: String!) {
    queryIdentityKey(filter: { relatedId: { eq: $relatedId } }) {
      id
      key
      relatedId
      createdAt
      expiresAt
      revokedAt
      description
      permissions
    }
  }
`;

export const FIND_KEY_BY_ID = gql`
  query findKeyById($id: ID!) {
    getIdentityKey(id: $id) {
      id
      key
      relatedId
      createdAt
      expiresAt
      revokedAt
      description
      permissions
    }
  }
`;
