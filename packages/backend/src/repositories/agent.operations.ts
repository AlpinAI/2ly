import { gql } from 'urql';

export const ADD_AGENT = gql`
  mutation addAgent(
    $name: String!
    $description: String
    $systemPrompt: String!
    $model: String!
    $temperature: Float!
    $maxTokens: Int!
    $workspaceId: ID!
    $createdAt: DateTime!
  ) {
    addAgent(
      input: {
        name: $name
        description: $description
        systemPrompt: $systemPrompt
        model: $model
        temperature: $temperature
        maxTokens: $maxTokens
        workspace: { id: $workspaceId }
        createdAt: $createdAt
        updatedAt: $createdAt
      }
    ) {
      agent {
        id
        name
        description
        systemPrompt
        model
        temperature
        maxTokens
        createdAt
        updatedAt
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const UPDATE_AGENT = gql`
  mutation updateAgent(
    $id: ID!
    $name: String
    $description: String
    $systemPrompt: String
    $model: String
    $temperature: Float
    $maxTokens: Int
    $updatedAt: DateTime!
  ) {
    updateAgent(
      input: {
        filter: { id: [$id] }
        set: {
          name: $name
          description: $description
          systemPrompt: $systemPrompt
          model: $model
          temperature: $temperature
          maxTokens: $maxTokens
          updatedAt: $updatedAt
        }
      }
    ) {
      agent {
        id
        name
        description
        systemPrompt
        model
        temperature
        maxTokens
        createdAt
        updatedAt
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const DELETE_AGENT = gql`
  mutation deleteAgent($id: ID!) {
    deleteAgent(filter: { id: [$id] }) {
      agent {
        id
        name
        description
        systemPrompt
        model
        temperature
        maxTokens
        createdAt
        updatedAt
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const GET_AGENT = gql`
  query getAgent($id: ID!) {
    getAgent(id: $id) {
      id
      name
      description
      systemPrompt
      model
      temperature
      maxTokens
      createdAt
      updatedAt
      skills {
        id
        name
        description
      }
      workspace {
        id
        name
      }
    }
  }
`;

export const GET_AGENTS_BY_WORKSPACE = gql`
  query getWorkspaceAgents($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      id
      agents {
        id
        name
        description
        systemPrompt
        model
        temperature
        maxTokens
        createdAt
        updatedAt
        skills {
          id
          name
          description
        }
      }
    }
  }
`;
