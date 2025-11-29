import { gql } from 'urql';

export const AI_PROVIDER_FRAGMENT = gql`
  fragment AIProviderFields on AIProviderConfig {
    id
    provider
    encryptedApiKey
    baseUrl
    defaultModel
    availableModels
    isActive
    createdAt
    updatedAt
  }
`;

export const GET_AI_PROVIDERS_BY_WORKSPACE = gql`
  query getAIProvidersByWorkspace($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      aiProviders {
        ...AIProviderFields
      }
    }
  }
  ${AI_PROVIDER_FRAGMENT}
`;

export const GET_AI_PROVIDER = gql`
  query getAIProvider($workspaceId: ID!, $provider: AIProviderType!) {
    queryAIProviderConfig(filter: { provider: { eq: $provider }, isActive: true }) @cascade {
      ...AIProviderFields
      workspace(filter: { id: [$workspaceId] }) {
        id
      }
    }
  }
  ${AI_PROVIDER_FRAGMENT}
`;

export const GET_ACTIVE_AI_PROVIDER = gql`
  query getActiveAIProvider($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      aiProviders(filter: { isActive: true }, first: 1) {
        ...AIProviderFields
      }
    }
  }
  ${AI_PROVIDER_FRAGMENT}
`;

export const CREATE_AI_PROVIDER = gql`
  mutation createAIProvider(
    $workspaceId: ID!
    $provider: AIProviderType!
    $encryptedApiKey: String
    $baseUrl: String
    $defaultModel: String
    $availableModels: [String!]
    $isActive: Boolean!
    $now: DateTime!
  ) {
    addAIProviderConfig(
      input: {
        workspace: { id: $workspaceId }
        provider: $provider
        encryptedApiKey: $encryptedApiKey
        baseUrl: $baseUrl
        defaultModel: $defaultModel
        availableModels: $availableModels
        isActive: $isActive
        createdAt: $now
        updatedAt: $now
      }
    ) {
      aIProviderConfig {
        ...AIProviderFields
      }
    }
  }
  ${AI_PROVIDER_FRAGMENT}
`;

export const UPDATE_AI_PROVIDER = gql`
  mutation updateAIProvider(
    $id: ID!
    $encryptedApiKey: String
    $baseUrl: String
    $defaultModel: String
    $availableModels: [String!]
    $isActive: Boolean
    $now: DateTime!
  ) {
    updateAIProviderConfig(
      input: {
        filter: { id: [$id] }
        set: {
          encryptedApiKey: $encryptedApiKey
          baseUrl: $baseUrl
          defaultModel: $defaultModel
          availableModels: $availableModels
          isActive: $isActive
          updatedAt: $now
        }
      }
    ) {
      aIProviderConfig {
        ...AIProviderFields
      }
    }
  }
  ${AI_PROVIDER_FRAGMENT}
`;

export const DELETE_AI_PROVIDER = gql`
  mutation deleteAIProvider($id: ID!) {
    deleteAIProviderConfig(filter: { id: [$id] }) {
      aIProviderConfig {
        id
      }
    }
  }
`;

export const SET_AI_PROVIDER_ACTIVE = gql`
  mutation setAIProviderActive($workspaceId: ID!, $providerId: ID!, $now: DateTime!) {
    # First, deactivate all providers for this workspace
    deactivateAll: updateAIProviderConfig(
      input: { filter: { isActive: true }, set: { isActive: false, updatedAt: $now } }
    ) @cascade {
      aIProviderConfig(filter: { workspace: { id: [$workspaceId] } }) {
        id
      }
    }
    # Then activate the specified provider
    activate: updateAIProviderConfig(input: { filter: { id: [$providerId] }, set: { isActive: true, updatedAt: $now } }) {
      aIProviderConfig {
        ...AIProviderFields
      }
    }
  }
  ${AI_PROVIDER_FRAGMENT}
`;

export const FIND_AI_PROVIDER_BY_TYPE = gql`
  query findAIProviderByType($workspaceId: ID!, $provider: AIProviderType!) {
    getWorkspace(id: $workspaceId) {
      aiProviders(filter: { provider: { eq: $provider } }, first: 1) {
        ...AIProviderFields
      }
    }
  }
  ${AI_PROVIDER_FRAGMENT}
`;

export const DEACTIVATE_ALL_AI_PROVIDERS = gql`
  mutation deactivateAllAIProviders($workspaceId: ID!, $now: DateTime!) {
    updateAIProviderConfig(input: { filter: { isActive: true }, set: { isActive: false, updatedAt: $now } }) @cascade {
      aIProviderConfig(filter: { workspace: { id: [$workspaceId] } }) {
        ...AIProviderFields
      }
    }
  }
  ${AI_PROVIDER_FRAGMENT}
`;
