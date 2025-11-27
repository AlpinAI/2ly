import { gql } from 'urql';

export const GET_MCP_TOOL_WITH_WORKSPACE = gql`
  query getMCPToolWithWorkspace($toolId: ID!) {
    getMCPTool(id: $toolId) {
      id
      name
      workspace {
        id
        name
      }
      mcpServer {
        id
        runOn
      }
    }
  }
`;

export const SET_MCP_TOOL_STATUS = gql`
  mutation setMCPToolStatus($mcpToolId: ID!, $status: ActiveStatus!) {
    updateMCPTool(input: { filter: { id: [$mcpToolId] }, set: { status: $status } }) {
      mCPTool {
        id
        name
        description
        inputSchema
        annotations
        status
      }
    }
  }
`;
