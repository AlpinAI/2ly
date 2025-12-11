/**
 * Apollo Client Instance
 *
 * WHY: Creates the configured Apollo Client instance that will be used
 * throughout the application. This is the heart of our GraphQL integration.
 *
 * WHAT IT PROVIDES:
 * - Normalized caching (automatic cache updates)
 * - Type-safe queries/mutations/subscriptions
 * - Real-time data via WebSocket subscriptions
 * - Optimistic UI updates
 * - Error handling
 * - DevTools integration
 *
 * USAGE:
 * Import this client in ApolloProvider to wrap your app.
 */

import { ApolloClient, InMemoryCache } from '@apollo/client';
import { link } from './links';

/**
 * Cache Configuration
 *
 * WHY InMemoryCache:
 * - Normalized cache: Stores entities once, references everywhere
 * - Automatic updates: Updating one entity updates all queries using it
 * - Smart caching: Reduces network requests
 *
 * HOW NORMALIZATION WORKS:
 * 1. Apollo identifies entities by __typename + id
 * 2. Stores them in a flat structure: { "Agent:123": { ... } }
 * 3. Queries reference entities by ID, not duplicate data
 * 4. Updating Agent:123 updates ALL queries containing it
 *
 * EXAMPLE:
 * ```
 * Query 1: agents list → [{ id: "123", name: "Agent 1" }, ...]
 * Query 2: agent detail → { id: "123", name: "Agent 1", ... }
 *
 * Cache stores:
 * {
 *   "Agent:123": { id: "123", name: "Agent 1", ... },
 *   ROOT_QUERY: {
 *     agents: [{ __ref: "Agent:123" }, ...],
 *     agent: { __ref: "Agent:123" }
 *   }
 * }
 *
 * Mutation updates Agent:123 → Both queries update automatically!
 * ```
 */
export const cache = new InMemoryCache({
  /**
   * Type Policies - Custom Cache Behavior
   *
   * WHY: Define how specific types should be cached and merged.
   */
  typePolicies: {
    Query: {
      fields: {
        /**
         * WHY: This policy tells Apollo how to handle the 'agents' query.
         * By default, Apollo caches by arguments, but we want to merge results.
         */
        agents: {
          // WHY: Merge strategy for pagination or refetching
          merge(_existing = [], incoming) {
            return incoming; // Replace (for now)
            // TODO: Implement pagination merging if needed
          },
        },

        /**
         * WHY: Similar pattern for other list queries
         */
        mcpServers: {
          merge(_existing = [], incoming) {
            return incoming;
          },
        },

        mcpTools: {
          merge(_existing = [], incoming) {
            return incoming;
          },
        },

        runtimes: {
          merge(_existing = [], incoming) {
            return incoming;
          },
        },

        skills: {
          merge(_existing = [], incoming) {
            return incoming;
          },
        },
      },
    },

    /**
     * Agent Type Policy
     *
     * WHY: Define key fields for normalization.
     * Apollo uses these to identify unique entities.
     */
    Runtime: {
      keyFields: ['id'],
    },

    MCPServer: {
      keyFields: ['id'],
    },

    MCPTool: {
      keyFields: ['id'],
    },

    Workspace: {
      keyFields: ['id'],
    },

    Skill: {
      keyFields: ['id'],
    },
  },

  /**
   * WHY: Allow cache to be serialized to localStorage
   * Enables cache persistence across page reloads
   * TODO: Implement cache persistence if needed
   */
  // dataIdFromObject(responseObject) {
  //   switch (responseObject.__typename) {
  //     case 'Agent': return `Agent:${responseObject.id}`;
  //     default: return defaultDataIdFromObject(responseObject);
  //   }
  // },
});

/**
 * Apollo Client Instance
 *
 * WHY: The configured client with all our links and cache.
 */
export const apolloClient = new ApolloClient({
  // WHY: Link chain (error handling, auth, transport selection)
  link,

  // WHY: In-memory cache with type policies
  cache,

  /**
   * Dev Tools Integration
   *
   * WHY: Enable Apollo DevTools in development for debugging.
   * Install: https://chrome.google.com/webstore/detail/apollo-client-devtools
   */
  devtools: {
    enabled: import.meta.env.DEV,
  },

  /**
   * Default Options
   *
   * WHY: Set default fetch policies for consistency.
   * These can be overridden per query/mutation.
   */
  defaultOptions: {
    watchQuery: {
      // WHY: cache-and-network = show cached data immediately, then refetch
      // Good for dashboards: instant UI + fresh data
      fetchPolicy: 'cache-and-network',

      // WHY: Show errors in UI (don't silence them)
      errorPolicy: 'all',

      // WHY: Re-fetch on component mount
      nextFetchPolicy: 'cache-first',
    },

    query: {
      // WHY: cache-first = use cache if available, only fetch if missing
      // Good for static data like tool catalogs
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },

    mutate: {
      // WHY: no-cache = always send mutation to server
      // Mutations shouldn't read from cache
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },

  /**
   * Client Awareness - Identifies client in Apollo Studio
   *
   * WHY: Helps track which client (web, mobile, etc.) is making requests.
   * Useful for monitoring and debugging in production.
   */
  clientAwareness: {
    name: 'Skilder Frontend',
    version: '2.0',
  },
});

/**
 * Reset Cache Utility
 *
 * WHY: Useful for logging out (clear all cached data).
 * Call this when user logs out to prevent data leaks.
 */
export const resetApolloCache = async () => {
  await apolloClient.clearStore();
};

/**
 * Refetch All Queries Utility
 *
 * WHY: Force refresh all active queries.
 * Useful after major state changes or reconnection.
 */
export const refetchAllQueries = async () => {
  await apolloClient.refetchQueries({ include: 'active' });
};
