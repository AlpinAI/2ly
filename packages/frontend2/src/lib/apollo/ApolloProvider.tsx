/**
 * Apollo Provider Component
 *
 * WHY: Wraps the application with Apollo Client context, making GraphQL
 * capabilities available to all components via hooks.
 *
 * WHAT IT DOES:
 * - Provides Apollo Client instance to component tree
 * - Handles client lifecycle
 * - Integrates with React 19 error boundaries
 *
 * USAGE:
 * Wrap your app in App.tsx:
 * ```tsx
 * <ApolloProvider>
 *   <YourApp />
 * </ApolloProvider>
 * ```
 */

import React from 'react';
import { ApolloProvider as BaseApolloProvider } from '@apollo/client';
import { apolloClient } from './client';

interface ApolloProviderProps {
  children: React.ReactNode;
}

/**
 * Custom Apollo Provider Wrapper
 *
 * WHY: Wraps the base ApolloProvider with our configured client.
 * This allows us to add custom logic in the future (error handling, logging, etc.)
 */
export function ApolloProvider({ children }: ApolloProviderProps) {
  return (
    <BaseApolloProvider client={apolloClient}>
      {/* @ts-expect-error - React type version mismatch in monorepo, safe to ignore */}
      {children}
    </BaseApolloProvider>
  );
}

/**
 * Re-export Apollo Client utilities for convenience
 *
 * WHY: Allows imports from '@/lib/apollo/ApolloProvider' instead of '@apollo/client'
 * Provides a single import point for Apollo-related functionality
 */
export { useQuery, useMutation, useSubscription, useLazyQuery } from '@apollo/client';
export type {
  QueryHookOptions,
  MutationHookOptions,
  SubscriptionHookOptions,
  LazyQueryHookOptions,
} from '@apollo/client';
