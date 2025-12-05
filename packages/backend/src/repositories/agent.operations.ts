import { gql } from 'urql';

export const ADD_AGENT = gql`
  mutation addAgent(
    $name: String!
    $description: String
    $systemPrompt: String!
    $model: String!
    $temperature: Float!
    $maxTokens: Int!
    $runOn: ExecutionTarget
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
        runOn: $runOn
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
        runOn
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
    $runOn: ExecutionTarget
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
          runOn: $runOn
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
        runOn
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
        runOn
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
      runOn
      createdAt
      updatedAt
      skills {
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
        runOn
        createdAt
        updatedAt
        skills {
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

export const UPDATE_AGENT_RUN_ON = gql`
  mutation updateAgentRunOn($id: ID!, $runOn: ExecutionTarget) {
    updateAgent(input: { filter: { id: [$id] }, set: { runOn: $runOn } }) {
      agent {
        id
        runOn
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
        runOn
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
        runOn
        runtime {
          id
        }
      }
    }
  }
`;
