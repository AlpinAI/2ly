/**
 * Registry GraphQL Queries
 *
 * WHY: Queries for fetching MCP Registry data.
 */

import { gql } from '@apollo/client';

/**
 * Get MCP Registries Query
 *
 * WHY: Fetch all registries for a workspace with their servers.
 */
export const GET_MCP_REGISTRIES = gql`
  query GetMCPRegistries($workspaceId: ID!) {
    mcpRegistries(workspaceId: $workspaceId) {
      id
      name
      upstreamUrl
      createdAt
      lastSyncAt
      servers {
        id
        name
        description
        title
        repositoryUrl
        version
        packages
        remotes
        _meta
        createdAt
        lastSeenAt
      }
    }
  }
`;
