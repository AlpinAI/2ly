import { gql } from 'urql';

export const GET_AI_PROVIDERS_BY_WORKSPACE = gql`
  query GetAIProvidersByWorkspace($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      aiProviders {
        id
        provider
        encryptedApiKey
        baseUrl
        availableModels
        createdAt
        updatedAt
      }
    }
  }
`;

export const FIND_AI_PROVIDER_BY_TYPE = gql`
  query FindAIProviderByType($workspaceId: ID!, $provider: AIProviderType!) {
    getWorkspace(id: $workspaceId) {
      aiProviders(filter: { provider: { eq: $provider } }) {
        id
        provider
        encryptedApiKey
        baseUrl
        availableModels
        createdAt
        updatedAt
      }
    }
  }
`;

export const CREATE_AI_PROVIDER = gql`
  mutation CreateAIProvider(
    $workspaceId: ID!
    $provider: AIProviderType!
    $encryptedApiKey: String
    $baseUrl: String
    $availableModels: [String!]
    $now: DateTime!
  ) {
    addAIProviderConfig(
      input: [
        {
          workspace: { id: $workspaceId }
          provider: $provider
          encryptedApiKey: $encryptedApiKey
          baseUrl: $baseUrl
          availableModels: $availableModels
          createdAt: $now
          updatedAt: $now
        }
      ]
    ) {
      aIProviderConfig {
        id
        provider
        encryptedApiKey
        baseUrl
        availableModels
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_AI_PROVIDER = gql`
  mutation UpdateAIProvider(
    $id: ID!
    $encryptedApiKey: String
    $baseUrl: String
    $availableModels: [String!]
    $now: DateTime!
  ) {
    updateAIProviderConfig(
      input: {
        filter: { id: [$id] }
        set: {
          encryptedApiKey: $encryptedApiKey
          baseUrl: $baseUrl
          availableModels: $availableModels
          updatedAt: $now
        }
      }
    ) {
      aIProviderConfig {
        id
        provider
        encryptedApiKey
        baseUrl
        availableModels
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_AI_PROVIDER = gql`
  mutation DeleteAIProvider($id: ID!) {
    deleteAIProviderConfig(filter: { id: [$id] }) {
      aIProviderConfig {
        id
      }
    }
  }
`;

export const GET_AI_PROVIDER_BY_ID = gql`
  query GetAIProviderById($id: ID!) {
    getAIProviderConfig(id: $id) {
      id
      provider
      baseUrl
      availableModels
      encryptedApiKey
      createdAt
      updatedAt
      workspace {
        id
      }
    }
  }
`;

export const SET_DEFAULT_MODEL = gql`
  mutation SetDefaultModel($workspaceId: ID!, $providerModel: String!) {
    updateWorkspace(input: { filter: { id: [$workspaceId] }, set: { defaultAIModel: $providerModel } }) {
      workspace {
        id
        defaultAIModel
      }
    }
  }
`;
