/**
 * Registry GraphQL Mutations
 *
 * WHY: Mutations for managing MCP Registries.
 */

import { gql } from '@apollo/client';

/**
 * Create MCP Registry Mutation
 *
 * WHY: Create a new upstream MCP registry connection.
 */
export const CREATE_MCP_REGISTRY = gql`
  mutation CreateMCPRegistry($workspaceId: ID!, $name: String!, $upstreamUrl: String!) {
    createMCPRegistry(workspaceId: $workspaceId, name: $name, upstreamUrl: $upstreamUrl) {
      id
      name
      upstreamUrl
      createdAt
      lastSyncAt
    }
  }
`;

/**
 * Delete MCP Registry Mutation
 *
 * WHY: Delete an MCP registry and all its synced servers.
 */
export const DELETE_MCP_REGISTRY = gql`
  mutation DeleteMCPRegistry($id: ID!) {
    deleteMCPRegistry(id: $id) {
      id
      name
    }
  }
`;

/**
 * Sync Upstream Registry Mutation
 *
 * WHY: Sync servers from the upstream registry.
 * This fetches all servers from the upstream API and upserts them in our database.
 */
export const SYNC_UPSTREAM_REGISTRY = gql`
  mutation SyncUpstreamRegistry($registryId: ID!) {
    syncUpstreamRegistry(registryId: $registryId) {
      id
      name
      upstreamUrl
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
