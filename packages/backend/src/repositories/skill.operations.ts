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
          runOn
        }
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
      }
    }
  }
`;

export const ADD_MCP_TOOL_TO_SKILL = gql`
  mutation addMCPToolToSkill(
    $skillId: ID!
    $mcpToolIds: [MCPToolRef!]!
    $updatedAt: DateTime!
  ) {
    updateSkill(
      input: {
        filter: { id: [$skillId] }
        set: {
          mcpTools: $mcpToolIds
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
            runOn
          }
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
            runOn
          }
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
        mcpTools {
          id
          name
          description
          status
          mcpServer {
            id
            name
            runOn
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
          runOn
        }
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
            runOn
          }
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
          runOn
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