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
import { ApolloProvider as BaseApolloProvider } from '@apollo/client/react';
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
      {children}
    </BaseApolloProvider>
  );
}

/**
 * Re-export Apollo Client v4 hooks for convenience
 *
 * ⚠️ DEPRECATED: DO NOT USE THESE RE-EXPORTS IN NEW CODE
 *
 * PREFER: Import directly from '@apollo/client/react' instead
 * ```tsx
 * // ✅ Correct - Direct import
 * import { useQuery, useMutation } from '@apollo/client/react';
 *
 * // ❌ Avoid - Jump import through re-export
 * import { useQuery, useMutation } from '@/lib/apollo/ApolloProvider';
 * ```
 *
 * WHY PREFER DIRECT IMPORTS:
 * - Clearer dependency tracking
 * - Better tree-shaking
 * - Easier to find all usage with grep/search
 * - Follows standard Apollo Client conventions
 * - Less indirection = simpler mental model
 *
 * These re-exports are kept for backward compatibility only.
 * See packages/frontend/docs/CONVENTIONS.md for more details.
 */
export { useQuery, useMutation, useSubscription, useLazyQuery } from '@apollo/client/react';
