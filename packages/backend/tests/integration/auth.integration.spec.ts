/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { graphql, resetDatabase } from '@skilder-ai/common/test/fixtures';

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

      const uniqueEmail = `newuser-${Date.now()}@skilder.ai`;
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
          email: 'invalid@skilder.ai',
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

      const uniqueEmail = `workspace-test-${Date.now()}@skilder.ai`;
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
          email: 'user1@skilder.ai',
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
          email: 'user1@skilder.ai',
          password: 'testpassword123',
        },
      });

      expect(result.login.success).toBe(true);
      expect(result.login.user.email).toBe('user1@skilder.ai');
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
          email: 'user1@skilder.ai',
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
          email: 'user1@skilder.ai',
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
      expect(result.me.email).toBe('user1@skilder.ai');
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
          email: 'user1@skilder.ai',
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
          email: 'user1@skilder.ai',
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
          email: 'user1@skilder.ai',
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
          email: 'user1@skilder.ai',
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

  describe('Workspace Authorization', () => {
    it('should deny access to workspace query when not authenticated', async () => {
      // First register a user to create a workspace
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

      const uniqueEmail = `workspace-auth-${Date.now()}@skilder.ai`;
      const registerResult = await graphql(registerMutation, {
        input: {
          email: uniqueEmail,
          password: 'testpassword123',
        },
      });

      // Get the workspace ID using the authenticated token
      const accessToken = registerResult.registerUser.tokens.accessToken;
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
          }
        }
      `;
      const workspacesResult = await authenticatedGraphql(workspacesQuery, accessToken);
      const workspaceId = workspacesResult.workspaces[0].id;

      // Try to access the workspace without authentication
      const workspaceQuery = `
        query GetWorkspace($workspaceId: ID!) {
          workspace(workspaceId: $workspaceId) {
            id
            name
          }
        }
      `;

      try {
        await graphql(workspaceQuery, { workspaceId });
        expect(true).toBe(false); // Force failure if no error thrown
      } catch (error) {
        expect((error as Error).message).toContain('UNAUTHENTICATED');
      }
    });

    it('should deny access to workspace user is not a member of', async () => {
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

      // Register User A
      const userAEmail = `usera-${Date.now()}@skilder.ai`;
      const userAResult = await graphql(registerMutation, {
        input: {
          email: userAEmail,
          password: 'password123',
        },
      });
      const userAToken = userAResult.registerUser.tokens.accessToken;

      // Get User A's workspace
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
            name
          }
        }
      `;
      const userAWorkspaces = await authenticatedGraphql(workspacesQuery, userAToken);
      const userAWorkspaceId = userAWorkspaces.workspaces[0].id;

      // Register User B
      const userBEmail = `userb-${Date.now()}@skilder.ai`;
      const userBResult = await graphql(registerMutation, {
        input: {
          email: userBEmail,
          password: 'password123',
        },
      });
      const userBToken = userBResult.registerUser.tokens.accessToken;

      // User B tries to access User A's workspace
      const workspaceQuery = `
        query GetWorkspace($workspaceId: ID!) {
          workspace(workspaceId: $workspaceId) {
            id
            name
          }
        }
      `;

      try {
        await authenticatedGraphql(workspaceQuery, userBToken, { workspaceId: userAWorkspaceId });
        expect(true).toBe(false); // Force failure if no error thrown
      } catch (error) {
        expect((error as Error).message).toContain('FORBIDDEN');
      }
    });

    it('should allow access to workspace user is admin of', async () => {
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

      const uniqueEmail = `admin-access-${Date.now()}@skilder.ai`;
      const result = await graphql(registerMutation, {
        input: {
          email: uniqueEmail,
          password: 'password123',
        },
      });

      const accessToken = result.registerUser.tokens.accessToken;

      // Get the user's workspace
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
            name
          }
        }
      `;
      const workspacesResult = await authenticatedGraphql(workspacesQuery, accessToken);
      const workspaceId = workspacesResult.workspaces[0].id;

      // Access the workspace using the workspace query
      const workspaceQuery = `
        query GetWorkspace($workspaceId: ID!) {
          workspace(workspaceId: $workspaceId) {
            id
            name
          }
        }
      `;

      const workspace = await authenticatedGraphql(workspaceQuery, accessToken, { workspaceId });
      expect(workspace.workspace.id).toBe(workspaceId);
      expect(workspace.workspace.name).toContain('Personal Workspace');
    });

    it('should deny access to mcpTools query when not authenticated', async () => {
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

      const uniqueEmail = `mcptools-auth-${Date.now()}@skilder.ai`;
      const registerResult = await graphql(registerMutation, {
        input: {
          email: uniqueEmail,
          password: 'testpassword123',
        },
      });

      const accessToken = registerResult.registerUser.tokens.accessToken;
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
          }
        }
      `;
      const workspacesResult = await authenticatedGraphql(workspacesQuery, accessToken);
      const workspaceId = workspacesResult.workspaces[0].id;

      const mcpToolsQuery = `
        query GetMCPTools($workspaceId: ID!) {
          mcpTools(workspaceId: $workspaceId) {
            id
            name
          }
        }
      `;

      try {
        await graphql(mcpToolsQuery, { workspaceId });
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain('UNAUTHENTICATED');
      }
    });

    it('should deny access to mcpTools of another users workspace', async () => {
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

      // Register User A
      const userAEmail = `usera-tools-${Date.now()}@skilder.ai`;
      const userAResult = await graphql(registerMutation, {
        input: {
          email: userAEmail,
          password: 'password123',
        },
      });
      const userAToken = userAResult.registerUser.tokens.accessToken;

      // Get User A's workspace
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
          }
        }
      `;
      const userAWorkspaces = await authenticatedGraphql(workspacesQuery, userAToken);
      const userAWorkspaceId = userAWorkspaces.workspaces[0].id;

      // Register User B
      const userBEmail = `userb-tools-${Date.now()}@skilder.ai`;
      const userBResult = await graphql(registerMutation, {
        input: {
          email: userBEmail,
          password: 'password123',
        },
      });
      const userBToken = userBResult.registerUser.tokens.accessToken;

      // User B tries to access User A's mcpTools
      const mcpToolsQuery = `
        query GetMCPTools($workspaceId: ID!) {
          mcpTools(workspaceId: $workspaceId) {
            id
            name
          }
        }
      `;

      try {
        await authenticatedGraphql(mcpToolsQuery, userBToken, { workspaceId: userAWorkspaceId });
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain('FORBIDDEN');
      }
    });

    it('should deny access to skills of another users workspace', async () => {
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

      // Register User A
      const userAEmail = `usera-skills-${Date.now()}@skilder.ai`;
      const userAResult = await graphql(registerMutation, {
        input: {
          email: userAEmail,
          password: 'password123',
        },
      });
      const userAToken = userAResult.registerUser.tokens.accessToken;

      // Get User A's workspace
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
          }
        }
      `;
      const userAWorkspaces = await authenticatedGraphql(workspacesQuery, userAToken);
      const userAWorkspaceId = userAWorkspaces.workspaces[0].id;

      // Register User B
      const userBEmail = `userb-skills-${Date.now()}@skilder.ai`;
      const userBResult = await graphql(registerMutation, {
        input: {
          email: userBEmail,
          password: 'password123',
        },
      });
      const userBToken = userBResult.registerUser.tokens.accessToken;

      // User B tries to access User A's skills
      const skillsQuery = `
        query GetSkills($workspaceId: ID!) {
          skills(workspaceId: $workspaceId) {
            id
            name
          }
        }
      `;

      try {
        await authenticatedGraphql(skillsQuery, userBToken, { workspaceId: userAWorkspaceId });
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain('FORBIDDEN');
      }
    });

    it('should deny access to getRegistryServers of another users workspace', async () => {
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

      // Register User A
      const userAEmail = `usera-registry-${Date.now()}@skilder.ai`;
      const userAResult = await graphql(registerMutation, {
        input: {
          email: userAEmail,
          password: 'password123',
        },
      });
      const userAToken = userAResult.registerUser.tokens.accessToken;

      // Get User A's workspace
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
          }
        }
      `;
      const userAWorkspaces = await authenticatedGraphql(workspacesQuery, userAToken);
      const userAWorkspaceId = userAWorkspaces.workspaces[0].id;

      // Register User B
      const userBEmail = `userb-registry-${Date.now()}@skilder.ai`;
      const userBResult = await graphql(registerMutation, {
        input: {
          email: userBEmail,
          password: 'password123',
        },
      });
      const userBToken = userBResult.registerUser.tokens.accessToken;

      // User B tries to access User A's registry servers
      const registryServersQuery = `
        query GetRegistryServers($workspaceId: ID!) {
          getRegistryServers(workspaceId: $workspaceId) {
            id
            name
          }
        }
      `;

      try {
        await authenticatedGraphql(registryServersQuery, userBToken, { workspaceId: userAWorkspaceId });
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain('FORBIDDEN');
      }
    });

    it('should deny access to toolCalls of another users workspace', async () => {
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

      // Register User A
      const userAEmail = `usera-toolcalls-${Date.now()}@skilder.ai`;
      const userAResult = await graphql(registerMutation, {
        input: {
          email: userAEmail,
          password: 'password123',
        },
      });
      const userAToken = userAResult.registerUser.tokens.accessToken;

      // Get User A's workspace
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
          }
        }
      `;
      const userAWorkspaces = await authenticatedGraphql(workspacesQuery, userAToken);
      const userAWorkspaceId = userAWorkspaces.workspaces[0].id;

      // Register User B
      const userBEmail = `userb-toolcalls-${Date.now()}@skilder.ai`;
      const userBResult = await graphql(registerMutation, {
        input: {
          email: userBEmail,
          password: 'password123',
        },
      });
      const userBToken = userBResult.registerUser.tokens.accessToken;

      // User B tries to access User A's tool calls
      const toolCallsQuery = `
        query GetToolCalls($workspaceId: ID!) {
          toolCalls(workspaceId: $workspaceId) {
            stats {
              total
            }
          }
        }
      `;

      try {
        await authenticatedGraphql(toolCallsQuery, userBToken, { workspaceId: userAWorkspaceId });
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain('FORBIDDEN');
      }
    });

    it('should deny access to workspaceKeys of another users workspace', async () => {
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

      // Register User A
      const userAEmail = `usera-keys-${Date.now()}@skilder.ai`;
      const userAResult = await graphql(registerMutation, {
        input: {
          email: userAEmail,
          password: 'password123',
        },
      });
      const userAToken = userAResult.registerUser.tokens.accessToken;

      // Get User A's workspace
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
          }
        }
      `;
      const userAWorkspaces = await authenticatedGraphql(workspacesQuery, userAToken);
      const userAWorkspaceId = userAWorkspaces.workspaces[0].id;

      // Register User B
      const userBEmail = `userb-keys-${Date.now()}@skilder.ai`;
      const userBResult = await graphql(registerMutation, {
        input: {
          email: userBEmail,
          password: 'password123',
        },
      });
      const userBToken = userBResult.registerUser.tokens.accessToken;

      // User B tries to access User A's workspace keys
      const workspaceKeysQuery = `
        query GetWorkspaceKeys($workspaceId: ID!) {
          workspaceKeys(workspaceId: $workspaceId) {
            id
            description
          }
        }
      `;

      try {
        await authenticatedGraphql(workspaceKeysQuery, userBToken, { workspaceId: userAWorkspaceId });
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain('FORBIDDEN');
      }
    });

    it('should deny access to mcpServers of another users workspace', async () => {
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

      // Register User A
      const userAEmail = `usera-servers-${Date.now()}@skilder.ai`;
      const userAResult = await graphql(registerMutation, {
        input: {
          email: userAEmail,
          password: 'password123',
        },
      });
      const userAToken = userAResult.registerUser.tokens.accessToken;

      // Get User A's workspace
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
          }
        }
      `;
      const userAWorkspaces = await authenticatedGraphql(workspacesQuery, userAToken);
      const userAWorkspaceId = userAWorkspaces.workspaces[0].id;

      // Register User B
      const userBEmail = `userb-servers-${Date.now()}@skilder.ai`;
      const userBResult = await graphql(registerMutation, {
        input: {
          email: userBEmail,
          password: 'password123',
        },
      });
      const userBToken = userBResult.registerUser.tokens.accessToken;

      // User B tries to access User A's MCP servers
      const mcpServersQuery = `
        query GetMCPServers($workspaceId: ID!) {
          mcpServers(workspaceId: $workspaceId) {
            id
            name
          }
        }
      `;

      try {
        await authenticatedGraphql(mcpServersQuery, userBToken, { workspaceId: userAWorkspaceId });
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain('FORBIDDEN');
      }
    });

    it('should deny access to mcpServers query when not authenticated', async () => {
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

      const uniqueEmail = `mcpservers-auth-${Date.now()}@skilder.ai`;
      const registerResult = await graphql(registerMutation, {
        input: {
          email: uniqueEmail,
          password: 'testpassword123',
        },
      });

      const accessToken = registerResult.registerUser.tokens.accessToken;
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
          }
        }
      `;
      const workspacesResult = await authenticatedGraphql(workspacesQuery, accessToken);
      const workspaceId = workspacesResult.workspaces[0].id;

      const mcpServersQuery = `
        query GetMCPServers($workspaceId: ID!) {
          mcpServers(workspaceId: $workspaceId) {
            id
            name
          }
        }
      `;

      try {
        await graphql(mcpServersQuery, { workspaceId });
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain('UNAUTHENTICATED');
      }
    });

    it('should deny access to skillKey of another users skill', async () => {
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

      // Register User A and create a skill
      const userAEmail = `usera-skillkey-${Date.now()}@skilder.ai`;
      const userAResult = await graphql(registerMutation, {
        input: {
          email: userAEmail,
          password: 'password123',
        },
      });
      const userAToken = userAResult.registerUser.tokens.accessToken;

      // Get User A's workspace
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
          }
        }
      `;
      const userAWorkspaces = await authenticatedGraphql(workspacesQuery, userAToken);
      const userAWorkspaceId = userAWorkspaces.workspaces[0].id;

      // User A creates a Skill
      const createSkillMutation = `
        mutation CreateSkill($name: String!, $description: String!, $workspaceId: ID!) {
          createSkill(name: $name, description: $description, workspaceId: $workspaceId) {
            id
            name
          }
        }
      `;

      const skillResult = await authenticatedGraphql(createSkillMutation, userAToken, {
        name: 'User A Skill',
        description: 'A test skill',
        workspaceId: userAWorkspaceId,
      });
      const skillId = skillResult.createSkill.id;

      // Register User B
      const userBEmail = `userb-skillkey-${Date.now()}@skilder.ai`;
      const userBResult = await graphql(registerMutation, {
        input: {
          email: userBEmail,
          password: 'password123',
        },
      });
      const userBToken = userBResult.registerUser.tokens.accessToken;

      // User B tries to access User A's skill key
      const skillKeyQuery = `
        query GetSkillKey($skillId: ID!) {
          skillKey(skillId: $skillId) {
            id
            key
          }
        }
      `;

      try {
        await authenticatedGraphql(skillKeyQuery, userBToken, { skillId });
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain('FORBIDDEN');
      }
    });

    it('should deny access to skillKey query when not authenticated', async () => {
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

      // Register and create a skill
      const uniqueEmail = `skillkey-auth-${Date.now()}@skilder.ai`;
      const registerResult = await graphql(registerMutation, {
        input: {
          email: uniqueEmail,
          password: 'testpassword123',
        },
      });

      const accessToken = registerResult.registerUser.tokens.accessToken;
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
          }
        }
      `;
      const workspacesResult = await authenticatedGraphql(workspacesQuery, accessToken);
      const workspaceId = workspacesResult.workspaces[0].id;

      // Create a Skill
      const createSkillMutation = `
        mutation CreateSkill($name: String!, $description: String!, $workspaceId: ID!) {
          createSkill(name: $name, description: $description, workspaceId: $workspaceId) {
            id
          }
        }
      `;

      const skillResult = await authenticatedGraphql(createSkillMutation, accessToken, {
        name: 'Test Skill',
        description: 'A test skill',
        workspaceId,
      });
      const skillId = skillResult.createSkill.id;

      // Try to access skill key without authentication
      const skillKeyQuery = `
        query GetSkillKey($skillId: ID!) {
          skillKey(skillId: $skillId) {
            id
            key
          }
        }
      `;

      try {
        await graphql(skillKeyQuery, { skillId });
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain('UNAUTHENTICATED');
      }
    });
  });

  describe('Mutation Authorization', () => {
    /**
     * Test Category A: Direct workspaceId mutations
     * createSkill requires workspaceId parameter
     */
    it('should deny createSkill mutation when not authenticated', async () => {
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

      const uniqueEmail = `skill-auth-${Date.now()}@skilder.ai`;
      const registerResult = await graphql(registerMutation, {
        input: {
          email: uniqueEmail,
          password: 'testpassword123',
        },
      });

      const accessToken = registerResult.registerUser.tokens.accessToken;
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
          }
        }
      `;
      const workspacesResult = await authenticatedGraphql(workspacesQuery, accessToken);
      const workspaceId = workspacesResult.workspaces[0].id;

      // Try to create Skill without authentication
      const createSkillMutation = `
        mutation CreateSkill($name: String!, $description: String!, $workspaceId: ID!) {
          createSkill(name: $name, description: $description, workspaceId: $workspaceId) {
            id
            name
          }
        }
      `;

      try {
        await graphql(createSkillMutation, {
          name: 'Test Skill',
          description: 'A test skill',
          workspaceId,
        });
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain('UNAUTHENTICATED');
      }
    });

    it('should deny createSkill mutation in another users workspace', async () => {
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

      // Register User A
      const userAEmail = `usera-skill-mut-${Date.now()}@skilder.ai`;
      const userAResult = await graphql(registerMutation, {
        input: {
          email: userAEmail,
          password: 'password123',
        },
      });
      const userAToken = userAResult.registerUser.tokens.accessToken;

      // Get User A's workspace
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
          }
        }
      `;
      const userAWorkspaces = await authenticatedGraphql(workspacesQuery, userAToken);
      const userAWorkspaceId = userAWorkspaces.workspaces[0].id;

      // Register User B
      const userBEmail = `userb-skill-mut-${Date.now()}@skilder.ai`;
      const userBResult = await graphql(registerMutation, {
        input: {
          email: userBEmail,
          password: 'password123',
        },
      });
      const userBToken = userBResult.registerUser.tokens.accessToken;

      // User B tries to create a Skill in User A's workspace
      const createSkillMutation = `
        mutation CreateSkill($name: String!, $description: String!, $workspaceId: ID!) {
          createSkill(name: $name, description: $description, workspaceId: $workspaceId) {
            id
            name
          }
        }
      `;

      try {
        await authenticatedGraphql(createSkillMutation, userBToken, {
          name: 'Malicious Skill',
          description: 'Trying to create in wrong workspace',
          workspaceId: userAWorkspaceId,
        });
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain('FORBIDDEN');
      }
    });

    /**
     * Test Category B: Entity ID mutations requiring workspace lookup
     * updateWorkspace requires looking up the workspace by ID
     */
    it('should deny updateWorkspace mutation in another users workspace', async () => {
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

      // Register User A
      const userAEmail = `usera-workspace-mut-${Date.now()}@skilder.ai`;
      const userAResult = await graphql(registerMutation, {
        input: {
          email: userAEmail,
          password: 'password123',
        },
      });
      const userAToken = userAResult.registerUser.tokens.accessToken;

      // Get User A's workspace
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
          }
        }
      `;
      const userAWorkspaces = await authenticatedGraphql(workspacesQuery, userAToken);
      const userAWorkspaceId = userAWorkspaces.workspaces[0].id;

      // Register User B
      const userBEmail = `userb-workspace-mut-${Date.now()}@skilder.ai`;
      const userBResult = await graphql(registerMutation, {
        input: {
          email: userBEmail,
          password: 'password123',
        },
      });
      const userBToken = userBResult.registerUser.tokens.accessToken;

      // User B tries to update User A's workspace
      const updateWorkspaceMutation = `
        mutation UpdateWorkspace($id: ID!, $name: String!) {
          updateWorkspace(id: $id, name: $name) {
            id
            name
          }
        }
      `;

      try {
        await authenticatedGraphql(updateWorkspaceMutation, userBToken, {
          id: userAWorkspaceId,
          name: 'Hacked Workspace Name',
        });
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain('FORBIDDEN');
      }
    });

    /**
     * Test Category C: Cross-entity mutations (validates both entities)
     * Test pattern: User creates entities in their own workspace,
     * another user tries to manipulate them
     */
    it('should allow user to create and manage resources in their own workspace', async () => {
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

      const uniqueEmail = `own-workspace-${Date.now()}@skilder.ai`;
      const registerResult = await graphql(registerMutation, {
        input: {
          email: uniqueEmail,
          password: 'testpassword123',
        },
      });

      const accessToken = registerResult.registerUser.tokens.accessToken;

      // Get workspace
      const workspacesQuery = `
        query GetWorkspaces {
          workspaces {
            id
          }
        }
      `;
      const workspacesResult = await authenticatedGraphql(workspacesQuery, accessToken);
      const workspaceId = workspacesResult.workspaces[0].id;

      // Create a Skill in own workspace - should succeed
      const createSkillMutation = `
        mutation CreateSkill($name: String!, $description: String!, $workspaceId: ID!) {
          createSkill(name: $name, description: $description, workspaceId: $workspaceId) {
            id
            name
          }
        }
      `;

      const createResult = await authenticatedGraphql(createSkillMutation, accessToken, {
        name: 'My Skill',
        description: 'My own skill',
        workspaceId,
      });

      expect(createResult.createSkill).toBeDefined();
      expect(createResult.createSkill.name).toBe('My Skill');

      // Update the Skill - should succeed
      const updateSkillMutation = `
        mutation UpdateSkill($id: ID!, $name: String!, $description: String!) {
          updateSkill(id: $id, name: $name, description: $description) {
            id
            name
          }
        }
      `;

      const updateResult = await authenticatedGraphql(updateSkillMutation, accessToken, {
        id: createResult.createSkill.id,
        name: 'My Updated Skill',
        description: 'Updated description',
      });

      expect(updateResult.updateSkill.name).toBe('My Updated Skill');

      // Delete the Skill - should succeed
      const deleteSkillMutation = `
        mutation DeleteSkill($id: ID!) {
          deleteSkill(id: $id) {
            id
          }
        }
      `;

      const deleteResult = await authenticatedGraphql(deleteSkillMutation, accessToken, {
        id: createResult.createSkill.id,
      });

      expect(deleteResult.deleteSkill.id).toBe(createResult.createSkill.id);
    });
  });
});
