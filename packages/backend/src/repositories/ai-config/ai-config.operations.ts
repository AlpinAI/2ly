import { gql } from 'urql';

export const GET_AI_CONFIGS_BY_WORKSPACE = gql`
  query getAIConfigsByWorkspace($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      id
      aiConfigs {
        id
        key
        value
        description
        createdAt
        updatedAt
      }
    }
  }
`;

export const FIND_AI_CONFIG_BY_KEY = gql`
  query findAIConfigByKey($workspaceId: ID!, $key: String!) {
    getWorkspace(id: $workspaceId) {
      id
      aiConfigs(filter: { key: { eq: $key } }) {
        id
        key
        value
        description
        createdAt
        updatedAt
      }
    }
  }
`;

export const CREATE_AI_CONFIG = gql`
  mutation createAIConfig(
    $workspaceId: ID!
    $key: String!
    $value: String!
    $description: String
    $now: DateTime!
  ) {
    addAIConfig(
      input: {
        key: $key
        value: $value
        description: $description
        workspace: { id: $workspaceId }
        createdAt: $now
        updatedAt: $now
      }
    ) {
      aIConfig {
        id
        key
        value
        description
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_AI_CONFIG = gql`
  mutation updateAIConfig(
    $id: ID!
    $value: String!
    $description: String
    $now: DateTime!
  ) {
    updateAIConfig(
      input: {
        filter: { id: [$id] }
        set: {
          value: $value
          description: $description
          updatedAt: $now
        }
      }
    ) {
      aIConfig {
        id
        key
        value
        description
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_AI_CONFIG = gql`
  mutation deleteAIConfig($id: ID!) {
    deleteAIConfig(filter: { id: [$id] }) {
      aIConfig {
        id
      }
    }
  }
`;

export const OBSERVE_AI_CONFIGS = (type: 'query' | 'subscription' = 'query') => gql`
  ${type === 'query' ? 'query' : 'subscription'} getWorkspaceAIConfigs($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      id
      aiConfigs {
        id
        key
        value
        description
        createdAt
        updatedAt
      }
    }
  }
`;
