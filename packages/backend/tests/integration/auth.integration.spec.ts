import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { Container } from 'inversify';
import { execSync } from 'child_process';
import { unlinkSync } from 'fs';
import { createApp } from './app';
import { UserRepository } from '../repositories/user.repository';

// Auth Integration Tests are skipped because they currently require to have a running dev environment
// -> TODO: Implement tests with testcontainers so that we can run them autonomously
describe.skip('Authentication Integration Tests', () => {
  let app: FastifyInstance;
  let container: Container;
  let userRepository: UserRepository;

  beforeAll(async () => {
    // Use existing local services (assumes dev environment is running)
    // Setup environment variables for testing
    process.env.DGRAPH_URL = process.env.DGRAPH_URL || 'localhost:8080';
    process.env.NATS_SERVERS = process.env.NATS_SERVERS || 'localhost:4222';
    process.env.JWT_PRIVATE_KEY_PATH = '/tmp/test-private.pem';
    process.env.JWT_PUBLIC_KEY_PATH = '/tmp/test-public.pem';
    process.env.ENCRYPTION_KEY = 'test-encryption-key-for-pepper-32chars-very-secure';

    // Generate test JWT keys
    try {
      execSync('openssl genpkey -algorithm RSA -out /tmp/test-private.pem -outform PEM');
      execSync('openssl rsa -pubout -in /tmp/test-private.pem -out /tmp/test-public.pem');
    } catch {
      console.warn('Failed to generate JWT keys, they may already exist');
    }

    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  }, 30000);

  afterAll(async () => {
    // Clean up test keys
    try {
      unlinkSync('/tmp/test-private.pem');
      unlinkSync('/tmp/test-public.pem');
    } catch {
      // Ignore cleanup errors
    }
  }, 10000);

  beforeEach(async () => {
    // Create fresh Fastify app with dependency injection
    const result = await createApp();
    app = result.app;
    container = result.container;

    await app.ready();
    userRepository = container.get(UserRepository);

    // Create a test user for authentication
    await userRepository.create('test@example.com', 'testpassword123');
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.status).toBe('healthy');
      expect(body.uptime).toBeGreaterThan(0);
    });
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

      const uniqueEmail = `newuser-${Date.now()}@example.com`;
      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: {
            input: {
              email: uniqueEmail,
              password: 'newpassword123',
            },
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.registerUser.success).toBe(true);
      expect(body.data.registerUser.user.email).toBe(uniqueEmail);
      expect(body.data.registerUser.tokens.accessToken).toBeDefined();
      expect(body.data.registerUser.tokens.refreshToken).toBeDefined();
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

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: {
            input: {
              email: 'invalid@example.com',
              password: 'weak', // Less than 8 characters
            },
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.registerUser.success).toBe(false);
      expect(body.data.registerUser.errors).toContain('Password must be at least 8 characters long');
    });
  });

  describe('User Login via GraphQL', () => {
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

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: {
            input: {
              email: 'test@example.com',
              password: 'testpassword123',
            },
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.login.success).toBe(true);
      expect(body.data.login.user.email).toBe('test@example.com');
      expect(body.data.login.tokens.accessToken).toBeDefined();
      expect(body.data.login.tokens.refreshToken).toBeDefined();
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

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: mutation,
          variables: {
            input: {
              email: 'test@example.com',
              password: 'wrongpassword',
            },
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.login.success).toBe(false);
      expect(body.data.login.errors).toContain('Invalid email or password');
    });
  });

  describe('Token Validation REST API', () => {
    it('should validate valid access tokens', async () => {
      // First login to get a token
      const loginMutation = `
        mutation LoginUser($input: LoginInput!) {
          login(input: $input) {
            success
            tokens {
              accessToken
            }
          }
        }
      `;

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: loginMutation,
          variables: {
            input: {
              email: 'test@example.com',
              password: 'testpassword123',
            },
          },
        },
      });

      const loginBody = JSON.parse(loginResponse.payload);
      const accessToken = loginBody.data.login.tokens.accessToken;

      // Now validate the token
      const validationResponse = await app.inject({
        method: 'POST',
        url: '/auth/validate-token',
        payload: {
          token: accessToken,
        },
      });

      expect(validationResponse.statusCode).toBe(200);
      const validationBody = JSON.parse(validationResponse.payload);
      expect(validationBody.valid).toBe(true);
    });

    it('should reject invalid tokens', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/validate-token',
        payload: {
          token: 'invalid.jwt.token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.valid).toBe(false);
      expect(body.error).toBe('Token is invalid or expired');
    });
  });

  describe('Protected GraphQL Queries', () => {
    it('should access protected query with valid token', async () => {
      // Login first
      const loginMutation = `
        mutation LoginUser($input: LoginInput!) {
          login(input: $input) {
            success
            tokens {
              accessToken
            }
          }
        }
      `;

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: loginMutation,
          variables: {
            input: {
              email: 'test@example.com',
              password: 'testpassword123',
            },
          },
        },
      });

      const loginBody = JSON.parse(loginResponse.payload);
      const accessToken = loginBody.data.login.tokens.accessToken;

      // Try protected query
      const protectedQuery = `
        query Me {
          me {
            id
            email
          }
        }
      `;

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          query: protectedQuery,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.me.email).toBe('test@example.com');
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

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: protectedQuery,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.errors).toBeDefined();
      expect(body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting after many requests', async () => {
      // Set a low rate limit for testing
      process.env.RATE_LIMIT_MAX = '2';
      process.env.RATE_LIMIT_WINDOW = '60000'; // 1 minute

      // Create a new app instance with the rate limit settings
      const result = await createApp();
      const rateLimitedApp = result.app;
      await rateLimitedApp.ready();

      // Make requests up to the limit
      const response1 = await rateLimitedApp.inject({
        method: 'GET',
        url: '/auth/health',
      });
      expect(response1.statusCode).toBe(200);

      const response2 = await rateLimitedApp.inject({
        method: 'GET',
        url: '/auth/health',
      });
      expect(response2.statusCode).toBe(200);

      // Third request should be rate limited
      const response3 = await rateLimitedApp.inject({
        method: 'GET',
        url: '/auth/health',
      });
      expect(response3.statusCode).toBe(429);

      const body = JSON.parse(response3.payload);
      expect(body.error).toBe('Too Many Requests');

      // Clean up
      await rateLimitedApp.close();
      delete process.env.RATE_LIMIT_MAX;
      delete process.env.RATE_LIMIT_WINDOW;
    });
  });

  describe('Password Validation', () => {
    it('should validate passwords against policy', async () => {
      const validResponse = await app.inject({
        method: 'POST',
        url: '/auth/validate-password',
        payload: {
          password: 'validpassword123',
        },
      });

      expect(validResponse.statusCode).toBe(200);
      const validBody = JSON.parse(validResponse.payload);
      expect(validBody.isValid).toBe(true);

      const invalidResponse = await app.inject({
        method: 'POST',
        url: '/auth/validate-password',
        payload: {
          password: 'short',
        },
      });

      expect(invalidResponse.statusCode).toBe(200);
      const invalidBody = JSON.parse(invalidResponse.payload);
      expect(invalidBody.isValid).toBe(false);
      expect(invalidBody.errors).toContain('Password must be at least 8 characters long');
    });
  });

  describe('Session Management', () => {
    it('should refresh tokens successfully', async () => {
      // Login to get tokens
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

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: loginMutation,
          variables: {
            input: {
              email: 'test@example.com',
              password: 'testpassword123',
            },
          },
        },
      });

      const loginBody = JSON.parse(loginResponse.payload);
      const refreshToken = loginBody.data.login.tokens.refreshToken;

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

      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: refreshMutation,
          variables: {
            input: {
              refreshToken,
            },
          },
        },
      });

      expect(refreshResponse.statusCode).toBe(200);
      const refreshBody = JSON.parse(refreshResponse.payload);
      expect(refreshBody.data.refreshToken.success).toBe(true);
      expect(refreshBody.data.refreshToken.accessToken).toBeDefined();
    });

    it('should logout successfully', async () => {
      // Login first
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

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: loginMutation,
          variables: {
            input: {
              email: 'test@example.com',
              password: 'testpassword123',
            },
          },
        },
      });

      const loginBody = JSON.parse(loginResponse.payload);
      const refreshToken = loginBody.data.login.tokens.refreshToken;

      // Logout
      const logoutMutation = `
        mutation LogoutUser($input: LogoutUserInput!) {
          logoutUser(input: $input) {
            success
            errors
          }
        }
      `;

      const logoutResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: logoutMutation,
          variables: {
            input: {
              refreshToken,
            },
          },
        },
      });

      expect(logoutResponse.statusCode).toBe(200);
      const logoutBody = JSON.parse(logoutResponse.payload);
      expect(logoutBody.data.logoutUser.success).toBe(true);

      // Try to use the refresh token again - should fail
      const refreshMutation = `
        mutation RefreshToken($input: RefreshTokenInput!) {
          refreshToken(input: $input) {
            success
            errors
          }
        }
      `;

      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: refreshMutation,
          variables: {
            input: {
              refreshToken,
            },
          },
        },
      });

      const refreshBody = JSON.parse(refreshResponse.payload);
      expect(refreshBody.data.refreshToken.success).toBe(false);
    });
  });
});