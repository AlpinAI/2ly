import { gql } from 'urql';

export const ADD_TOOL_CALL = gql`
  mutation addToolCall(
    $toolInput: String!
    $calledAt: DateTime!
    $isTest: Boolean!
  ) {
    addToolCall(
      input: {
        toolInput: $toolInput
        calledAt: $calledAt
        status: PENDING
        isTest: $isTest
      }
    ) {
      toolCall {
        id
        toolInput
        calledAt
        status
        isTest
      }
    }
  }
`;

export const SET_CALLED_BY = gql`
  mutation setCalledBy($id: ID!, $calledById: ID!) {
    updateToolCall(
      input: { filter: { id: [$id] }, set: { calledBy: { id: $calledById } } }
    ) {
      toolCall {
        id
        calledBy { id name }
      }
    }
  }
`;

export const SET_MCP_TOOL = gql`
  mutation setMcpTool($id: ID!, $mcpToolId: ID!) {
    updateToolCall(
      input: { filter: { id: [$id] }, set: { mcpTool: { id: $mcpToolId } } }
    ) {
      toolCall {
        id
        mcpTool { id name }
      }
    }
  }
`;

export const SET_SKILL = gql`
  mutation setSkill($id: ID!, $skillId: ID!) {
    updateToolCall(
      input: { filter: { id: [$id] }, set: { skill: { id: $skillId } } }
    ) {
      toolCall {
        id
        skill { id name mode }
      }
    }
  }
`;

export const COMPLETE_TOOL_CALL_SUCCESS = gql`
  mutation completeToolCallSuccess($id: ID!, $toolOutput: String!, $completedAt: DateTime!) {
    updateToolCall(
      input: { filter: { id: [$id] }, set: { status: COMPLETED, toolOutput: $toolOutput, completedAt: $completedAt } }
    ) {
      toolCall {
        id
        status
        toolOutput
        completedAt
        isTest
      }
    }
  }
`;

export const COMPLETE_TOOL_CALL_ERROR = gql`
  mutation completeToolCallError($id: ID!, $error: String!, $completedAt: DateTime!) {
    updateToolCall(
      input: { filter: { id: [$id] }, set: { status: FAILED, error: $error, completedAt: $completedAt } }
    ) {
      toolCall {
        id
        status
        error
        completedAt
        isTest
      }
    }
  }
`;

export const SET_EXECUTED_BY_AGENT = gql`
  mutation setExecutedByAgent($id: ID!) {
    updateToolCall(
      input: { filter: { id: [$id] }, set: { executedByAgent: true } }
    ) {
      toolCall { id executedByAgent }
    }
  }
`;

export const SET_EXECUTED_BY = gql`
  mutation setExecutedBy($id: ID!, $executedById: ID!) {
    updateToolCall(
      input: { filter: { id: [$id] }, set: { executedBy: { id: $executedById } } }
    ) {
      toolCall { id executedBy { id name } }
    }
  }
`;

export const QUERY_TOOL_CALLS = gql`
  query toolCalls($workspaceId: ID!) {
    getWorkspace(id: $workspaceId) {
      mcpTools {
        id
        toolCalls {
          id
          toolInput
          toolOutput
          error
          calledAt
          completedAt
          status
          isTest
          mcpTool { id name mcpServer { id name } }
          calledBy { id name }
          executedBy { id name }
        }
      }
    }
  }
`;

// New scalable query with filtering and pagination
// WHY: Query through Workspace -> MCPTools -> ToolCalls AND Skills -> skillToolCalls
export const QUERY_TOOL_CALLS_FILTERED = gql`
  query queryToolCallsFiltered(
    $workspaceId: ID!
  ) {
    getWorkspace(id: $workspaceId) {
      mcpTools {
        id
        name
        description
        mcpServer {
          id
          name
        }
        toolCalls(order: { desc: calledAt }) {
          id
          toolInput
          toolOutput
          error
          calledAt
          completedAt
          status
          isTest
          executedByAgent
          calledBy {
            id
            name
          }
          executedBy {
            id
            name
            hostname
          }
        }
      }
      skills {
        id
        name
        mode
        skillToolCalls(order: { desc: calledAt }) {
          id
          toolInput
          toolOutput
          error
          calledAt
          completedAt
          status
          isTest
          executedByAgent
          calledBy {
            id
            name
          }
          executedBy {
            id
            name
            hostname
          }
        }
      }
    }
  }
`;
