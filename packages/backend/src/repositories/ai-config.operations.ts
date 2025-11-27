import { gql } from 'urql';

export const GET_AI_CONFIG = gql`
  query getAIConfig($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      aiConfig {
        id
        provider
        model
        encryptedApiKey
        createdAt
        updatedAt
      }
    }
  }
`;

export const ADD_AI_CONFIG = gql`
  mutation addAIConfig(
    $provider: AIProvider!
    $model: String!
    $encryptedApiKey: String!
    $now: DateTime!
    $workspaceId: ID!
  ) {
    addAIConfig(
      input: {
        provider: $provider
        model: $model
        encryptedApiKey: $encryptedApiKey
        createdAt: $now
        updatedAt: $now
        workspace: { id: $workspaceId }
      }
    ) {
      aIConfig {
        id
        provider
        model
        encryptedApiKey
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_AI_CONFIG = gql`
  mutation updateAIConfig(
    $id: ID!
    $provider: AIProvider!
    $model: String!
    $encryptedApiKey: String!
    $now: DateTime!
  ) {
    updateAIConfig(
      input: { filter: { id: [$id] }, set: { provider: $provider, model: $model, encryptedApiKey: $encryptedApiKey, updatedAt: $now } }
    ) {
      aIConfig {
        id
        provider
        model
        encryptedApiKey
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_AI_CONFIG = gql`
  mutation deleteAIConfig($id: ID!) {
    deleteAIConfig(filter: { id: [$id] }) {
      msg
      numUids
    }
  }
`;
