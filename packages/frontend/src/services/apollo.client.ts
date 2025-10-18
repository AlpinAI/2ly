import {
  ApolloClient,
  InMemoryCache,
  split,
  HttpLink,
  SubscriptionOptions,
  from,
  fromPromise
} from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { Observable } from 'rxjs';
import { tokenService } from './token.service';

import { loadErrorMessages, loadDevMessages } from '@apollo/client/dev';

loadDevMessages();
loadErrorMessages();

const buildGraphQLUrls = () => {
  const location = window.location;
  const isSSL = location.protocol === 'https:';
  const host = location.hostname;

  const httpProtocol = isSSL ? 'https:' : 'http:';
  const wsProtocol = isSSL ? 'wss:' : 'ws:';

  const httpUrl = `${httpProtocol}//${host}:3000/graphql`;
  const wsUrl = `${wsProtocol}//${host}:3000/graphql-ws`;

  return { httpUrl, wsUrl };
};

const getGraphQLUrls = () => {
  const envHttpUrl = import.meta.env.VITE_GRAPHQL_HTTP_URL;
  const envWsUrl = import.meta.env.VITE_GRAPHQL_WS_URL;

  if (envHttpUrl && envWsUrl) {
    return { httpUrl: envHttpUrl, wsUrl: envWsUrl };
  }

  return buildGraphQLUrls();
};

const { httpUrl, wsUrl } = getGraphQLUrls();

// Authentication link - adds Authorization header to all requests
const authLink = setContext((_, { headers }) => {
  const token = tokenService.getAccessToken();
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

// Token refresh state management
let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

// Handle token refresh with concurrent request management
const handleTokenRefreshAndRetry = async (): Promise<void> => {
  if (isRefreshing) {
    // If refresh is already in progress, wait for it to complete
    return new Promise<void>((resolve) => {
      pendingRequests.push(resolve);
    });
  }

  isRefreshing = true;

  try {
    // Check if refresh token is available
    if (!tokenService.hasValidRefreshToken()) {
      throw new Error('No valid refresh token available');
    }

    // Attempt token refresh via direct fetch to avoid circular dependency
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${httpUrl.replace('/graphql', '')}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          mutation RefreshToken($input: RefreshTokenInput!) {
            refreshToken(input: $input) {
              success
              accessToken
              errors
              expiresIn
            }
          }
        `,
        variables: {
          input: { refreshToken }
        }
      })
    });

    const result = await response.json();
    if (result.data?.refreshToken?.success && result.data.refreshToken.accessToken) {
      tokenService.setTokens(result.data.refreshToken.accessToken, refreshToken);
    } else {
      throw new Error('Token refresh failed');
    }

    // Resolve all pending requests
    pendingRequests.forEach((resolve) => resolve());
    pendingRequests = [];

  } catch (error) {
    console.error('Token refresh failed:', error);

    // Clear tokens on refresh failure
    tokenService.clearTokens();

    // Resolve pending requests even on failure to prevent hanging
    pendingRequests.forEach((resolve) => resolve());
    pendingRequests = [];

    // Redirect to login on refresh failure
    window.location.href = '/login';

    throw error;
  } finally {
    isRefreshing = false;
  }
};

// Error handling link with token refresh
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  // Handle GraphQL errors
  if (graphQLErrors) {
    for (const error of graphQLErrors) {
      console.error(`GraphQL error: ${error.message}`, error);

      // Handle specific authentication errors
      if (error.extensions?.code === 'UNAUTHENTICATED') {
        console.log('Authentication error detected, attempting token refresh');

        // Return promise that handles token refresh and retry
        return fromPromise(
          handleTokenRefreshAndRetry()
        ).flatMap(() => forward(operation));
      }
    }
  }

  // Handle network errors
  if (networkError) {
    console.error('Network error:', networkError);

    // Handle HTTP authentication errors
    if (
      'statusCode' in networkError &&
      (networkError.statusCode === 401 || networkError.statusCode === 403)
    ) {
      console.log('HTTP authentication error detected, attempting token refresh');

      return fromPromise(
        handleTokenRefreshAndRetry()
      ).flatMap(() => forward(operation));
    }
  }
});

// Retry link for handling transient failures
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error) => {
      // Retry on network errors but not on authentication errors
      // (those should be handled by the error link)
      return Boolean(
        error &&
        !error.message?.includes('401') &&
        !error.message?.includes('403') &&
        !error.message?.includes('UNAUTHENTICATED')
      );
    },
  },
});

// HTTP link for queries and mutations
const httpLink = new HttpLink({
  uri: httpUrl,
});

// WebSocket link for subscriptions with authentication
const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUrl,
    connectionParams: () => {
      const token = tokenService.getAccessToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  }),
);

// Split link to route subscriptions via WebSocket and queries/mutations via HTTP with auth
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  from([authLink, errorLink, retryLink, httpLink])
);

// Create unified Apollo Client with authentication
export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    dataIdFromObject: (object) => {
      if (object.__typename === 'Subscription' || object.__typename === 'Mutation') {
        return undefined;
      }
      if (!object.id) {
        console.warn('No id found for object', object);
      }
      return `${object.__typename}:${object.id ?? object.__ref}`;
    },
  }),
  defaultOptions: {
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

// Add manual token refresh capability
export const refreshAuthToken = async (): Promise<void> => {
  await handleTokenRefreshAndRetry();
};

// Subscription helper with authentication
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const observe = <TData, TVariables extends Record<string, any> = Record<string, any>>(
  options: SubscriptionOptions<TVariables, TData>,
): Observable<TData> => {
  return new Observable<TData>((observer) => {
    const subscription = client.subscribe<TData, TVariables>(options);

    subscription.subscribe({
      next(result) {
        if (result.data) {
          observer.next(result.data);
        }
      },
      error(err) {
        observer.error(err);
      },
      complete() {
        observer.complete();
      },
    });
  });
};
