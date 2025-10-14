/**
 * Apollo Client Links Configuration
 *
 * WHY: Links are Apollo's middleware system for handling GraphQL requests.
 * Each link has a specific responsibility in the request/response pipeline.
 *
 * ARCHITECTURE:
 * Request Flow: Component → Apollo Client → Links Chain → Server
 * Response Flow: Server → Links Chain → Apollo Client → Component
 *
 * LINK CHAIN (order matters!):
 * 1. Error Link - Global error handling
 * 2. Auth Link - Inject JWT tokens
 * 3. Split Link - Route to HTTP or WebSocket based on operation type
 *    ├─ HTTP Link - For queries & mutations
 *    └─ WebSocket Link - For subscriptions
 */

import {
  ApolloLink,
  HttpLink,
  from,
  split,
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { createClient } from 'graphql-ws';

/**
 * Backend GraphQL Endpoints
 *
 * WHY environment variables: Allow different endpoints for dev/staging/prod
 * WHY fallback to localhost: Works out of the box in development
 */
const HTTP_ENDPOINT =
  import.meta.env.VITE_GRAPHQL_HTTP_ENDPOINT || 'http://localhost:3000/graphql';
const WS_ENDPOINT =
  import.meta.env.VITE_GRAPHQL_WS_ENDPOINT || 'ws://localhost:3000/graphql-ws';

// Log endpoints in development/test for debugging connection issues
if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
  console.log('[Apollo] GraphQL HTTP Endpoint:', HTTP_ENDPOINT);
  console.log('[Apollo] GraphQL WS Endpoint:', WS_ENDPOINT);
}

/**
 * Error Link - Global Error Handling (Apollo Client v4)
 *
 * WHY: Centralized error handling for all GraphQL operations.
 * Catches both GraphQL errors (from backend) and network errors.
 *
 * APOLLO v4 CHANGE: Error handling API changed
 * - Use CombinedGraphQLErrors.is(error) to check for GraphQL errors
 * - Access errors via error.errors array
 * - Otherwise it's a network error
 *
 * USAGE: Logged errors can be sent to error monitoring (Sentry, etc.)
 */
export const errorLink = onError(({ error, operation }) => {
  // WHY: Check if it's a GraphQL error with errors array
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        extensions
      );

      // WHY: Check for authentication errors
      if (extensions?.code === 'UNAUTHENTICATED') {
        // TODO: Redirect to login or refresh token
        console.warn('User is not authenticated. Redirecting to login...');
      }
    });
  } else {
    // WHY: Otherwise it's a network error
    console.error(`[Network error ${operation.operationName}]:`, error);
  }
});

/**
 * Auth Link - JWT Token Injection
 *
 * WHY: Automatically adds authentication headers to every request.
 * The token is retrieved from localStorage (managed by AuthContext).
 *
 * SECURITY NOTE:
 * - Tokens are stored in localStorage (XSS vulnerable but convenient)
 * - Alternative: httpOnly cookies (CSRF vulnerable but XSS safe)
 * - 2LY uses JWT in Authorization header pattern
 */
export const authLink = new ApolloLink((operation, forward) => {
  // WHY: Get token from localStorage
  // TODO: Integrate with AuthContext once it's implemented
  const token = localStorage.getItem('2ly-auth-token');

  // WHY: Set authorization header if token exists
  if (token) {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        authorization: `Bearer ${token}`,
      },
    }));
  }

  return forward(operation);
});

/**
 * HTTP Link - REST-like GraphQL Transport
 *
 * WHY: Handles queries and mutations over HTTP POST.
 * Standard GraphQL transport, works with any GraphQL server.
 */
export const httpLink = new HttpLink({
  uri: HTTP_ENDPOINT,
  // WHY: Include credentials for CORS requests (if backend uses cookies)
  credentials: 'include',
});

/**
 * WebSocket Link - Real-time Subscriptions
 *
 * WHY: Subscriptions require persistent connection (WebSocket).
 * HTTP is request-response, WebSocket is bidirectional.
 *
 * PROTOCOL: Uses graphql-ws protocol (newer, recommended)
 * Alternative: subscriptions-transport-ws (deprecated)
 */
export const wsLink = new GraphQLWsLink(
  createClient({
    url: WS_ENDPOINT,

    // WHY: Connection parameters sent on WebSocket handshake
    connectionParams: () => {
      const token = localStorage.getItem('2ly-auth-token');
      return token ? { authorization: `Bearer ${token}` } : {};
    },

    // WHY: Retry connection on failure (important for subscriptions)
    retryAttempts: 5,

    // WHY: Keep connection alive (prevent timeout)
    keepAlive: 10_000, // 10 seconds
  // TODO: address this issue at the monorepo level  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any // Type assertion to handle duplicate graphql-ws versions in monorepo
);

/**
 * Split Link - Route Operations by Type
 *
 * WHY: Queries/Mutations use HTTP, Subscriptions use WebSocket.
 * Apollo needs to know which transport to use for each operation.
 *
 * HOW IT WORKS:
 * 1. Check operation definition
 * 2. If subscription → WebSocket
 * 3. Else → HTTP
 */
export const splitLink = split(
  // WHY: Determine if operation is a subscription
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,    // Use WebSocket for subscriptions
  httpLink   // Use HTTP for queries and mutations
);

/**
 * Complete Link Chain
 *
 * WHY: Compose all links into a single chain.
 * Order matters: errorLink → authLink → splitLink
 *
 * FLOW:
 * 1. Error handling (wraps everything)
 * 2. Auth injection (before network call)
 * 3. Transport selection (HTTP vs WebSocket)
 */
export const link = from([
  errorLink,
  authLink,
  splitLink,
]);
