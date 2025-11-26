import { gql } from 'urql';

export const CREATE_LLM_API_KEY = gql`
  mutation createLLMAPIKey(
    $provider: LLMProvider!
    $encryptedKey: String!
    $maskedKey: String!
    $isActive: Boolean!
    $workspaceId: ID!
    $now: DateTime!
  ) {
    addLLMAPIKey(
      input: {
        provider: $provider
        encryptedKey: $encryptedKey
        maskedKey: $maskedKey
        isActive: $isActive
        createdAt: $now
        workspace: { id: $workspaceId }
      }
    ) {
      lLMAPIKey {
        id
        provider
        encryptedKey
        maskedKey
        isActive
        createdAt
        updatedAt
        lastValidatedAt
        workspace {
          id
        }
      }
    }
  }
`;

export const UPDATE_LLM_API_KEY = gql`
  mutation updateLLMAPIKey(
    $id: ID!
    $encryptedKey: String
    $maskedKey: String
    $lastValidatedAt: DateTime
    $now: DateTime!
  ) {
    updateLLMAPIKey(
      input: {
        filter: { id: [$id] }
        set: {
          encryptedKey: $encryptedKey
          maskedKey: $maskedKey
          lastValidatedAt: $lastValidatedAt
          updatedAt: $now
        }
      }
    ) {
      lLMAPIKey {
        id
        provider
        encryptedKey
        maskedKey
        isActive
        createdAt
        updatedAt
        lastValidatedAt
        workspace {
          id
        }
      }
    }
  }
`;

export const DELETE_LLM_API_KEY = gql`
  mutation deleteLLMAPIKey($id: ID!) {
    deleteLLMAPIKey(filter: { id: [$id] }) {
      lLMAPIKey {
        id
        provider
        maskedKey
      }
    }
  }
`;

export const SET_ACTIVE_LLM_API_KEY = gql`
  mutation setActiveLLMAPIKey($id: ID!, $provider: LLMProvider!, $workspaceId: ID!, $now: DateTime!) {
    # This mutation is atomic - both operations execute in a single transaction.
    # DGraph guarantees that either both operations succeed, or both fail.
    # The operations execute sequentially within the transaction:
    # 1. First, deactivate all other keys for this provider in the workspace
    # 2. Then, activate the target key
    # This prevents race conditions where multiple keys could be active simultaneously.

    deactivateOthers: updateLLMAPIKey(
      input: {
        filter: {
          and: [
            { workspace: { id: { eq: $workspaceId } } }
            { provider: { eq: $provider } }
            { id: { not: { eq: $id } } }
          ]
        }
        set: { isActive: false, updatedAt: $now }
      }
    ) {
      numUids
      lLMAPIKey {
        id
        isActive
      }
    }

    activateTarget: updateLLMAPIKey(
      input: {
        filter: {
          and: [
            { id: [$id] }
            { workspace: { id: { eq: $workspaceId } } }
            { provider: { eq: $provider } }
          ]
        }
        set: { isActive: true, updatedAt: $now }
      }
    ) {
      numUids
      lLMAPIKey {
        id
        provider
        encryptedKey
        maskedKey
        isActive
        createdAt
        updatedAt
        lastValidatedAt
        workspace {
          id
        }
      }
    }
  }
`;

export const FIND_LLM_API_KEYS_BY_WORKSPACE = gql`
  query findLLMAPIKeysByWorkspace($workspaceId: ID!) {
    queryLLMAPIKey(filter: { workspace: { id: { eq: $workspaceId } } }, order: { desc: createdAt }) {
      id
      provider
      encryptedKey
      maskedKey
      isActive
      createdAt
      updatedAt
      lastValidatedAt
      workspace {
        id
      }
    }
  }
`;

export const FIND_LLM_API_KEY_BY_ID = gql`
  query findLLMAPIKeyById($id: ID!) {
    getLLMAPIKey(id: $id) {
      id
      provider
      encryptedKey
      maskedKey
      isActive
      createdAt
      updatedAt
      lastValidatedAt
      workspace {
        id
      }
    }
  }
`;

export const FIND_ACTIVE_LLM_API_KEY = gql`
  query findActiveLLMAPIKey($workspaceId: ID!, $provider: LLMProvider!) {
    queryLLMAPIKey(
      filter: {
        and: [
          { workspace: { id: { eq: $workspaceId } } }
          { provider: { eq: $provider } }
          { isActive: true }
        ]
      }
    ) {
      id
      provider
      encryptedKey
      maskedKey
      isActive
      createdAt
      updatedAt
      lastValidatedAt
      workspace {
        id
      }
    }
  }
`;
