/**
 * Dgraph GraphQL Client for E2E Test Fixtures
 *
 * Provides direct access to Dgraph's auto-generated GraphQL API for test seeding.
 * This bypasses the Apollo API layer to enable comprehensive test fixture creation
 * including entities that shouldn't be exposed via the client API (tools, toolCalls).
 */

/**
 * Execute a GraphQL mutation/query against Dgraph directly
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function dgraphQL<T = any>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const dgraphUrl = process.env.DGRAPH_URL;
  if (!dgraphUrl) {
    throw new Error('DGRAPH_URL not set. Ensure global setup has run.');
  }

  const response = await fetch(dgraphUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(`Dgraph GraphQL errors: ${JSON.stringify(result.errors, null, 2)}`);
  }

  return result.data as T;
}
