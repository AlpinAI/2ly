/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { graphql, resetDatabase } from '@2ly/common/test/fixtures';

/**
 * Authentication Integration Tests
 *
 * Tests the complete authentication flow including:
 * - User registration
 * - Login/logout
 * - Token validation and refresh
 * - Protected routes
 * - Password validation
 * - Session management
 *
 * Uses the real backend running in testcontainers.
 */

/**
 * Helper function for authenticated GraphQL requests
 */
async function authenticatedGraphql<T = any>(
  query: string,
  accessToken: string,
  variables?: Record<string, any>,
): Promise<T> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error('API_URL not set. Ensure global setup has run.');
  }

  const response = await fetch(`${apiUrl}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors, null, 2)}`);
  }

  return result.data as T;
}

describe('Authentication Integration Tests', () => {
  // Reset database before each test for isolation
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('User Registration via GraphQL', () => {
    it('should register a new user successfully', async () => {
      const mutation = `
        mutation RegisterUser($input: RegisterUserInput!) {
          registerUser(input: $input) {
            success
            user {
              id
              email
            }
            tokens {
              accessToken
              refreshToken
            }
            errors
          }
        }
      `;

      const uniqueEmail = `newuser-${Date.now()}@2ly.ai`;
      const result = await graphql(mutation, {
        input: {
          email: uniqueEmail,
          password: 'newpassword123',
        },
      });

      expect(result.registerUser.success).toBe(true);
      expect(result.registerUser.user.email).toBe(uniqueEmail);
      expect(result.registerUser.tokens.accessToken).toBeDefined();
      expect(result.registerUser.tokens.refreshToken).toBeDefined();
    });

    it('should reject registration with invalid password', async () => {
      const mutation = `
        mutation RegisterUser($input: RegisterUserInput!) {
          registerUser(input: $input) {
            success
            errors
          }
        }
      `;

      const result = await graphql(mutation, {
        input: {
          email: 'invalid@2ly.ai',
          password: 'weak', // Less than 8 characters
        },
      });

      expect(result.registerUser.success).toBe(false);
      expect(result.registerUser.errors).toContain('Password must be at least 8 characters long');
    });

    it('should create a personal workspace when user registers', async () => {
      const registerMutation = `
        mutation RegisterUser($input: RegisterUserInput!) {
          registerUser(input: $input) {
            success
            user {
              id
              email
            }
            tokens {
              accessToken
            }
          }
        }
      `;

      const uniqueEmail = `workspace-test-${Date.now()}@2ly.ai`;
      const registerResult = await graphql(registerMutation, {
        input: {
          email: uniqueEmail,
          password: 'testpassword123',
        },
      });

      expect(registerResult.registerUser.success).toBe(true);

      // Query workspaces using the new user's token
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
            name
          }
        }
      `;

      const accessToken = registerResult.registerUser.tokens.accessToken;
      const workspacesResult = await authenticatedGraphql(workspacesQuery, accessToken);

      // Should have one personal workspace
      expect(workspacesResult.workspaces).toHaveLength(1);
      expect(workspacesResult.workspaces[0].name).toBe(`Personal Workspace (${uniqueEmail})`);
    });
  });

  describe('User Login via GraphQL', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const registerMutation = `
        mutation RegisterUser($input: RegisterUserInput!) {
          registerUser(input: $input) {
            success
          }
        }
      `;

      await graphql(registerMutation, {
        input: {
          email: 'user1@2ly.ai',
          password: 'testpassword123',
        },
      });
    });

    it('should login successfully with valid credentials', async () => {
      const mutation = `
        mutation LoginUser($input: LoginInput!) {
          login(input: $input) {
            success
            user {
              id
              email
            }
            tokens {
              accessToken
              refreshToken
            }
            errors
          }
        }
      `;

      const result = await graphql(mutation, {
        input: {
          email: 'user1@2ly.ai',
          password: 'testpassword123',
        },
      });

      expect(result.login.success).toBe(true);
      expect(result.login.user.email).toBe('user1@2ly.ai');
      expect(result.login.tokens.accessToken).toBeDefined();
      expect(result.login.tokens.refreshToken).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      const mutation = `
        mutation LoginUser($input: LoginInput!) {
          login(input: $input) {
            success
            errors
          }
        }
      `;

      const result = await graphql(mutation, {
        input: {
          email: 'user1@2ly.ai',
          password: 'wrongpassword',
        },
      });

      expect(result.login.success).toBe(false);
      expect(result.login.errors).toContain('Invalid email or password');
    });
  });

  describe('Protected GraphQL Queries', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register to get a token
      const registerMutation = `
        mutation RegisterUser($input: RegisterUserInput!) {
          registerUser(input: $input) {
            success
            tokens {
              accessToken
            }
          }
        }
      `;

      const result = await graphql(registerMutation, {
        input: {
          email: 'user1@2ly.ai',
          password: 'testpassword123',
        },
      });

      accessToken = result.registerUser.tokens.accessToken;
    });

    it('should access protected query with valid token', async () => {
      const protectedQuery = `
        query Me {
          me {
            id
            email
          }
        }
      `;

      const result = await authenticatedGraphql(protectedQuery, accessToken);
      expect(result.me.email).toBe('user1@2ly.ai');
    });

    it('should reject protected query without token', async () => {
      const protectedQuery = `
        query Me {
          me {
            id
            email
          }
        }
      `;

      // Use regular graphql (without auth) and expect it to throw
      try {
        await graphql(protectedQuery);
        // If we get here, the test should fail
        expect(true).toBe(false); // Force failure
      } catch (error) {
        // Expected to throw due to GraphQL errors
        expect((error as Error).message).toContain('UNAUTHENTICATED');
      }
    });
  });



  describe('Session Management', () => {
    it('should refresh tokens successfully', async () => {
      // First register a user
      const registerMutation = `
        mutation RegisterUser($input: RegisterUserInput!) {
          registerUser(input: $input) {
            success
          }
        }
      `;

      await graphql(registerMutation, {
        input: {
          email: 'user1@2ly.ai',
          password: 'testpassword123',
        },
      });

      // Then login to get tokens with a proper session
      const loginMutation = `
        mutation LoginUser($input: LoginInput!) {
          login(input: $input) {
            success
            tokens {
              accessToken
              refreshToken
            }
          }
        }
      `;

      const loginResult = await graphql(loginMutation, {
        input: {
          email: 'user1@2ly.ai',
          password: 'testpassword123',
        },
      });

      const refreshToken = loginResult.login.tokens.refreshToken;

      // Refresh the token
      const refreshMutation = `
        mutation RefreshToken($input: RefreshTokenInput!) {
          refreshToken(input: $input) {
            success
            accessToken
            errors
          }
        }
      `;

      const refreshResult = await graphql(refreshMutation, {
        input: {
          refreshToken,
        },
      });

      expect(refreshResult.refreshToken.success).toBe(true);
      expect(refreshResult.refreshToken.accessToken).toBeDefined();
    });

    it('should logout successfully', async () => {
      // First register a user
      const registerMutation = `
        mutation RegisterUser($input: RegisterUserInput!) {
          registerUser(input: $input) {
            success
          }
        }
      `;

      await graphql(registerMutation, {
        input: {
          email: 'user1@2ly.ai',
          password: 'testpassword123',
        },
      });

      // Then login to get tokens
      const loginMutation = `
        mutation LoginUser($input: LoginInput!) {
          login(input: $input) {
            success
            tokens {
              refreshToken
            }
          }
        }
      `;

      const loginResult = await graphql(loginMutation, {
        input: {
          email: 'user1@2ly.ai',
          password: 'testpassword123',
        },
      });

      const refreshToken = loginResult.login.tokens.refreshToken;

      // Logout
      const logoutMutation = `
        mutation LogoutUser($input: LogoutUserInput!) {
          logoutUser(input: $input) {
            success
            errors
          }
        }
      `;

      const logoutResult = await graphql(logoutMutation, {
        input: {
          refreshToken,
        },
      });

      expect(logoutResult.logoutUser.success).toBe(true);

      // Try to use the refresh token again - should fail
      const refreshMutation = `
        mutation RefreshToken($input: RefreshTokenInput!) {
          refreshToken(input: $input) {
            success
            errors
          }
        }
      `;

      const refreshResult = await graphql(refreshMutation, {
        input: {
          refreshToken,
        },
      });

      expect(refreshResult.refreshToken.success).toBe(false);
    });
  });
});
