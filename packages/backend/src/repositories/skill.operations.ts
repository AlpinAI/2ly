import { gql } from 'urql';

export const ADD_SKILL = gql`
  mutation addSkill(
    $name: String!
    $description: String
    $workspaceId: ID!
    $createdAt: DateTime!
  ) {
    addSkill(
      input: {
        name: $name
        description: $description
        workspace: { id: $workspaceId }
        createdAt: $createdAt
        updatedAt: $createdAt
      }
    ) {
      skill {
        id
        name
        description
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

export const UPDATE_SKILL = gql`
  mutation updateSkill(
    $id: ID!
    $name: String!
    $description: String
    $updatedAt: DateTime!
  ) {
    updateSkill(
      input: {
        filter: { id: [$id] }
        set: {
          name: $name
          description: $description
          updatedAt: $updatedAt
        }
      }
    ) {
      skill {
        id
        name
        description
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

export const DELETE_SKILL = gql`
  mutation deleteSkill($id: ID!) {
    deleteSkill(filter: { id: [$id] }) {
      skill {
        id
        name
        description
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

export const GET_SKILL = gql`
  query getSkill($id: ID!) {
    getSkill(id: $id) {
      id
      name
      description
      createdAt
      updatedAt
      mode
      model
      temperature
      maxTokens
      systemPrompt
      executionTarget
      runtime {
        id
        name
      }
      mcpTools {
        id
        name
        description
        inputSchema
        annotations
        status
        createdAt
        lastSeenAt
        mcpServer {
          id
          name
          executionTarget
        }
      }
      agentTools {
        id
        name
        description
        model
      }
      workspace {
        id
        name
      }
    }
  }
`;

export const QUERY_SKILLS_BY_WORKSPACE = gql`
  query getWorkspaceSkills($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      id
      skills {
        id
        name
        description
        createdAt
        updatedAt
        mcpTools {
          id
          name
          description
          inputSchema
          annotations
          status
          createdAt
          lastSeenAt
        }
        agentTools {
          id
          name
          description
          model
        }
      }
    }
  }
`;

export const ADD_MCP_TOOL_TO_SKILL = gql`
  mutation addMCPToolToSkill(
    $skillId: ID!
    $mcpToolId: ID!
    $updatedAt: DateTime!
  ) {
    updateSkill(
      input: {
        filter: { id: [$skillId] }
        set: {
          mcpTools: [{ id: $mcpToolId }]
          updatedAt: $updatedAt
        }
      }
    ) {
      skill {
        id
        name
        description
        createdAt
        updatedAt
        mcpTools {
          id
          name
          description
          inputSchema
          annotations
          status
          createdAt
          lastSeenAt
          mcpServer {
            id
            name
            executionTarget
          }
        }
        agentTools {
          id
          name
          description
          model
        }
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const REMOVE_MCP_TOOL_FROM_SKILL = gql`
  mutation removeMCPToolFromSkill(
    $skillId: ID!
    $mcpToolId: ID!
    $updatedAt: DateTime!
  ) {
    updateSkill(
      input: {
        filter: { id: [$skillId] }
        remove: {
          mcpTools: [{ id: $mcpToolId }]
        }
        set: {
          updatedAt: $updatedAt
        }
      }
    ) {
      skill {
        id
        name
        description
        createdAt
        updatedAt
        mcpTools {
          id
          name
          description
          inputSchema
          annotations
          status
          createdAt
          lastSeenAt
          mcpServer {
            id
            name
            executionTarget
          }
        }
        agentTools {
          id
          name
          description
          model
        }
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const OBSERVE_SKILLS = (type: 'query' | 'subscription' = 'query') => gql`
  ${type === 'query' ? 'query' : 'subscription'} getWorkspaceSkills($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      id
      skills {
        id
        name
        description
        createdAt
        updatedAt
        mode
        model
        temperature
        maxTokens
        systemPrompt
        executionTarget
        runtime {
          id
          name
        }
        mcpTools {
          id
          name
          description
          status
          mcpServer {
            id
            name
            executionTarget
          }
        }
      }
    }
  }
`;

export const QUERY_ALL_SKILLS = gql`
  query queryAllSkills {
    querySkill {
      id
      name
      description
      createdAt
      updatedAt
      mode
      model
      temperature
      maxTokens
      systemPrompt
      executionTarget
      runtime {
        id
        name
      }
      mcpTools {
        id
        name
        description
        inputSchema
        annotations
        status
        createdAt
        lastSeenAt
        mcpServer {
          id
          name
          executionTarget
        }
      }
      agentTools {
        id
        name
        description
        model
      }
      workspace {
        id
        name
      }
    }
  }
`;

export const QUERY_SKILL_BY_NAME = gql`
  query getWorkspaceSkillByName($workspaceId: ID!, $name: String!) {
    getWorkspace(id: $workspaceId) {
      id
      skills(filter: { name: { eq: $name } }) {
        id
        name
        description
        createdAt
        updatedAt
        mcpTools {
          id
          name
          description
          inputSchema
          annotations
          status
          createdAt
          lastSeenAt
          mcpServer {
            id
            name
            executionTarget
          }
        }
        agentTools {
          id
          name
          description
          model
        }
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const GET_SKILL_AGENT_MCP_SERVERS = gql`
  query getSkill($skillId: ID!) {
    getSkill(id: $skillId) {
      mcpTools {
        mcpServer {
          id
          name
          description
          transport
          config
          executionTarget
          tools {
            id
            name
            description
            inputSchema
            annotations
          }
        }
      }
    }
  }
`;

export const ADD_AGENT_TO_SKILL = gql`
  mutation addAgentToSkill($skillId: ID!, $agentId: ID!, $updatedAt: DateTime!) {
    updateSkill(
      input: {
        filter: { id: [$skillId] }
        set: { agentTools: [{ id: $agentId }], updatedAt: $updatedAt }
      }
    ) {
      skill {
        id
        name
        description
        createdAt
        updatedAt
        mcpTools {
          id
          name
          description
          inputSchema
          annotations
          status
          createdAt
          lastSeenAt
          mcpServer {
            id
            name
            executionTarget
          }
        }
        agentTools {
          id
          name
          description
          model
        }
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const UPDATE_SKILL_MODE = gql`
  mutation updateSkillMode($id: ID!, $mode: SkillMode!, $updatedAt: DateTime!) {
    updateSkill(
      input: {
        filter: { id: [$id] }
        set: { mode: $mode, updatedAt: $updatedAt }
      }
    ) {
      skill {
        id
        name
        description
        createdAt
        updatedAt
        mode
        model
        temperature
        maxTokens
        systemPrompt
        executionTarget
        runtime {
          id
          name
        }
        mcpTools {
          id
          name
        }
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const UPDATE_SKILL_SMART_CONFIG = gql`
  mutation updateSkillSmartConfig(
    $id: ID!
    $model: String
    $temperature: Float
    $maxTokens: Int
    $systemPrompt: String
    $executionTarget: ExecutionTarget
    $updatedAt: DateTime!
  ) {
    updateSkill(
      input: {
        filter: { id: [$id] }
        set: {
          model: $model
          temperature: $temperature
          maxTokens: $maxTokens
          systemPrompt: $systemPrompt
          executionTarget: $executionTarget
          updatedAt: $updatedAt
        }
      }
    ) {
      skill {
        id
        name
        description
        createdAt
        updatedAt
        mode
        model
        temperature
        maxTokens
        systemPrompt
        executionTarget
        runtime {
          id
          name
        }
        mcpTools {
          id
          name
        }
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const LINK_SKILL_TO_RUNTIME = gql`
  mutation linkSkillToRuntime($skillId: ID!, $runtimeId: ID!, $updatedAt: DateTime!) {
    updateSkill(
      input: {
        filter: { id: [$skillId] }
        set: { runtime: { id: $runtimeId }, updatedAt: $updatedAt }
      }
    ) {
      skill {
        id
        name
        description
        createdAt
        updatedAt
        mode
        model
        temperature
        maxTokens
        systemPrompt
        executionTarget
        runtime {
          id
          name
        }
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const UNLINK_SKILL_FROM_RUNTIME = gql`
  mutation unlinkSkillFromRuntime($skillId: ID!, $updatedAt: DateTime!) {
    updateSkill(
      input: {
        filter: { id: [$skillId] }
        remove: { runtime: {} }
        set: { updatedAt: $updatedAt }
      }
    ) {
      skill {
        id
        name
        description
        createdAt
        updatedAt
        mode
        model
        temperature
        maxTokens
        systemPrompt
        executionTarget
        runtime {
          id
          name
        }
        workspace {
          id
          name
        }
      }
    }
  }
`;

export const QUERY_SMART_SKILLS_BY_RUNTIME = gql`
  query querySmartSkillsByRuntime($runtimeId: ID!) {
    getRuntime(id: $runtimeId) {
      id
      skills(filter: { mode: { eq: SMART }, executionTarget: { eq: EDGE } }) {
        id
        name
        description
        mode
        model
        temperature
        maxTokens
        systemPrompt
        executionTarget
        workspace {
          id
          name
        }
      }
    }
  }
`;