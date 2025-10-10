/**
 * Registry GraphQL Subscriptions
 *
 * WHY: Real-time updates for MCP Registry changes.
 */

import { gql } from '@apollo/client';

/**
 * MCP Registries Subscription
 *
 * WHY: Subscribe to real-time updates of registries for a workspace.
 * Updates when registries are added, removed, or synced.
 */
export const SUBSCRIBE_MCP_REGISTRIES = gql`
  subscription SubscribeMCPRegistries($workspaceId: ID!) {
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
