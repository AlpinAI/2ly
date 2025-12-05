import { gql } from 'urql';

export const ADD_AGENT = gql`
  mutation addAgent(
    $name: String!
    $description: String
    $systemPrompt: String!
    $model: String!
    $temperature: Float!
    $maxTokens: Int!
    $executionTarget: ExecutionTarget
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
        executionTarget: $executionTarget
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
        executionTarget
        createdAt
        updatedAt
        runtime {
          id
          name
          description
          status
          lastSeenAt
        }
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
    $executionTarget: ExecutionTarget
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
          executionTarget: $executionTarget
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
        executionTarget
        createdAt
        updatedAt
        runtime {
          id
          name
          description
          status
          lastSeenAt
        }
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
        executionTarget
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
      executionTarget
      createdAt
      updatedAt
      skills {
        id
        name
        description
      }
      tools {
        id
        name
        description
      }
      runtime {
        id
        name
        description
        status
        lastSeenAt
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
        executionTarget
        createdAt
        updatedAt
        skills {
          id
          name
          description
        }
        tools {
          id
          name
          description
        }
        runtime {
          id
          name
          description
          status
          lastSeenAt
        }
      }
    }
  }
`;

export const UPDATE_AGENT_EXECUTION_TARGET = gql`
  mutation updateAgentRunOn($id: ID!, $executionTarget: ExecutionTarget) {
    updateAgent(input: { filter: { id: [$id] }, set: { executionTarget: $executionTarget } }) {
      agent {
        id
        executionTarget
        runtime {
          id
          name
          description
          status
          lastSeenAt
        }
      }
    }
  }
`;

export const AGENT_LINK_RUNTIME = gql`
  mutation agentLinkRuntime($agentId: ID!, $runtimeId: ID!) {
    updateAgent(input: { filter: { id: [$agentId] }, set: { runtime: { id: $runtimeId } } }) {
      agent {
        id
        name
        description
        executionTarget
        runtime {
          id
          name
          description
          status
          lastSeenAt
        }
      }
    }
  }
`;

export const AGENT_UNLINK_RUNTIME = gql`
  mutation agentUnlinkRuntime($agentId: ID!, $runtimeId: ID!) {
    updateAgent(input: { filter: { id: [$agentId] }, remove: { runtime: { id: $runtimeId } } }) {
      agent {
        id
        name
        description
        executionTarget
        runtime {
          id
        }
      }
    }
  }
`;
