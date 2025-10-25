import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { JwtService, JwtPayload } from './jwt.service';
import { generateKeyPairSync } from 'crypto';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { resolve } from 'path';

describe('JwtService', () => {
  let jwtService: JwtService;
  const testKeysDir = resolve(process.cwd(), 'test-keys');
  const privateKeyPath = resolve(testKeysDir, 'private.pem');
  const publicKeyPath = resolve(testKeysDir, 'public.pem');
  const originalEnv = process.env;

  beforeAll(() => {
    // Generate test RSA keys
    mkdirSync(testKeysDir, { recursive: true });
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    writeFileSync(privateKeyPath, privateKey);
    writeFileSync(publicKeyPath, publicKey);

    // Set test environment variables
    process.env.JWT_PRIVATE_KEY_PATH = privateKeyPath;
    process.env.JWT_PUBLIC_KEY_PATH = publicKeyPath;
    process.env.JWT_ISSUER = 'test-issuer';
    process.env.JWT_ACCESS_TOKEN_TTL = '300'; // 5 minutes
    process.env.JWT_REFRESH_TOKEN_TTL = '1800'; // 30 minutes
  });

  afterAll(() => {
    // Cleanup test files and restore environment
    try {
      unlinkSync(privateKeyPath);
      unlinkSync(publicKeyPath);
    } catch {
      // Ignore cleanup errors
    }
    process.env = originalEnv;
  });

  beforeEach(() => {
    jwtService = new JwtService();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(jwtService.getAccessTokenTtl()).toBe(300);
      expect(jwtService.getRefreshTokenTtl()).toBe(1800);
    });

    it('should throw error if paths are not absolute', () => {
      const originalPrivateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;
      const originalPublicKeyPath = process.env.JWT_PUBLIC_KEY_PATH;

      process.env.JWT_PRIVATE_KEY_PATH = './keys/private-dev.pem';
      process.env.JWT_PUBLIC_KEY_PATH = './keys/public-dev.pem';

      expect(() => new JwtService()).toThrow(
        'JWT service initialization failed: JWT key paths must be absolute paths for security (start with /)'
      );

      process.env.JWT_PRIVATE_KEY_PATH = originalPrivateKeyPath;
      process.env.JWT_PUBLIC_KEY_PATH = originalPublicKeyPath;
    });

    it('should throw error if keys are not found', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const originalPrivateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;
      process.env.JWT_PRIVATE_KEY_PATH = '/nonexistent/path';

      expect(() => new JwtService()).toThrow('JWT service initialization failed: unable to load RSA keys');

      process.env.JWT_PRIVATE_KEY_PATH = originalPrivateKeyPath;

      consoleErrorSpy.mockRestore();
    });
  });

  describe('generateTokenPair', () => {
    it('should generate valid access and refresh tokens', async () => {
      const payload: JwtPayload = {
        userId: 'user123',
        email: 'test@example.com',
        workspaceId: 'workspace123',
        role: 'admin',
      };

      const tokens = await jwtService.generateTokenPair(payload);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    it('should generate tokens with correct payload', async () => {
      const payload: JwtPayload = {
        userId: 'user123',
        email: 'test@example.com',
        workspaceId: 'workspace123',
        role: 'member',
      };

      const tokens = await jwtService.generateTokenPair(payload);

      const accessVerification = await jwtService.verifyToken(tokens.accessToken, 'access');
      const refreshVerification = await jwtService.verifyToken(tokens.refreshToken, 'refresh');

      expect(accessVerification.valid).toBe(true);
      expect(accessVerification.payload).toEqual({
        userId: payload.userId,
        email: payload.email,
        workspaceId: payload.workspaceId,
        role: payload.role,
      });

      expect(refreshVerification.valid).toBe(true);
      expect(refreshVerification.payload?.userId).toBe(payload.userId);
      expect(refreshVerification.payload?.email).toBe(payload.email);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const token = 'eyJhbGciOiJSUzI1NiJ9...';
      const authHeader = `Bearer ${token}`;

      const extracted = jwtService.extractTokenFromHeader(authHeader);
      expect(extracted).toBe(token);
    });

    it('should return null for invalid header format', () => {
      const invalidHeaders = [
        '',
        'Basic dXNlcjpwYXNz',
        'Bearer',
        'Bearer token1 token2',
        undefined,
      ];

      invalidHeaders.forEach(header => {
        const extracted = jwtService.extractTokenFromHeader(header);
        expect(extracted).toBeNull();
      });
    });

    it('should return null for missing header', () => {
      const extracted = jwtService.extractTokenFromHeader();
      expect(extracted).toBeNull();
    });
  });
});