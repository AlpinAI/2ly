import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { AuthRoutes } from './auth.routes';
import type { AuthenticationService } from '../services/auth/auth.service';
import type { PasswordPolicyService } from '../services/auth/password-policy.service';
import { LoggerService } from '@2ly/common';
import { LoggerServiceMock } from '@2ly/common/test/vitest';

// Mock services
const mockAuthService = {
  verifyAccessToken: vi.fn(),
} as unknown as AuthenticationService;

const mockPasswordPolicyService = {
  validatePassword: vi.fn(),
} as unknown as PasswordPolicyService;

describe('AuthRoutes', () => {
  let fastify: FastifyInstance;
  let routes: AuthRoutes;

  beforeEach(async () => {
    fastify = Fastify({ logger: false });
    routes = new AuthRoutes(
      new LoggerServiceMock() as unknown as LoggerService,
      mockAuthService,
      mockPasswordPolicyService,
    );

    await routes.register(fastify);
    await fastify.ready();

    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (fastify) {
      await fastify.close();
    }
  });

  describe('Health Check Endpoint', () => {
    it('should return healthy status', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/auth/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.status).toBe('healthy');
      expect(body.uptime).toBeGreaterThan(0);
      expect(body.timestamp).toBeDefined();
    });

    it('should include cache control headers', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/auth/health',
      });

      expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
    });
  });

  describe('Token Validation Endpoint', () => {
    it('should validate valid JWT token', async () => {
      (mockAuthService.verifyAccessToken as unknown as Mock).mockResolvedValue({
        userId: 'user123',
        email: 'test@example.com',
        role: 'member',
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/validate-token',
        payload: { token: 'valid.jwt.token' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.valid).toBe(true);
    });

    it('should reject invalid JWT token', async () => {
      (mockAuthService.verifyAccessToken as unknown as Mock).mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/validate-token',
        payload: { token: 'invalid.jwt.token' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.valid).toBe(false);
      expect(body.error).toBe('Token is invalid or expired');
    });

    it('should return error for missing token', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/validate-token',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.valid).toBe(false);
      expect(body.error).toBe('Token is required');
    });

    it('should handle service errors gracefully', async () => {
      (mockAuthService.verifyAccessToken as unknown as Mock).mockRejectedValue(new Error('Service error'));

      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/validate-token',
        payload: { token: 'some.token' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.valid).toBe(false);
      expect(body.error).toBe('Token validation failed');
    });
  });

  describe('Password Validation Endpoint', () => {
    it('should validate password against policy', async () => {
      (mockPasswordPolicyService.validatePassword as unknown as Mock).mockReturnValue({
        isValid: true,
        errors: []
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/validate-password',
        payload: { password: 'validpassword123' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.isValid).toBe(true);
      expect(body.errors).toHaveLength(0);
    });

    it('should return validation errors for weak passwords', async () => {
      (mockPasswordPolicyService.validatePassword as unknown as Mock).mockReturnValue({
        isValid: false,
        errors: ['Password must be at least 8 characters long']
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/validate-password',
        payload: { password: 'weak' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.isValid).toBe(false);
      expect(body.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject request without password', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/validate-password',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.isValid).toBe(false);
      expect(body.errors).toContain('Password is required');
    });
  });
});