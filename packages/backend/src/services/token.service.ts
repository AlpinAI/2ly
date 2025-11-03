import { injectable, inject } from 'inversify';
import { TokenRepository } from '../repositories/token.repository';
import { ToolSetRepository } from '../repositories/toolset.repository';
import { dgraphResolversTypes, verifyPassword } from '@2ly/common';
import { createUser, fromSeed } from 'nkeys.js';
import * as crypto from 'crypto';

export interface NatsJwtClaims {
  sub: string;
  toolsetId: string;
  workspaceId: string;
  permissions: string[];
  exp: number;
  iat: number;
}

/**
 * TokenService handles validation of Master Keys, Toolset Keys, and Runtime Keys.
 * It also generates NATS JWTs for authenticated runtimes.
 */
@injectable()
export class TokenService {
  constructor(
    @inject(TokenRepository) private readonly tokenRepository: TokenRepository,
    @inject(ToolSetRepository) private readonly toolSetRepository: ToolSetRepository
  ) {}

  /**
   * Validate Master Key and return associated toolset.
   * Master Key requires both the key and toolset name for validation.
   */
  async validateMasterKey(key: string, toolsetName: string): Promise<dgraphResolversTypes.ToolSet | null> {
    try {
      // Find the toolset by name first
      const toolset = await this.toolSetRepository.findByName(toolsetName);
      if (!toolset) {
        return null;
      }

      // Find all master keys for this workspace
      const tokens = await this.tokenRepository.findByType('MASTER_KEY', toolset.workspace.id);

      // Check each token to see if it matches and is associated with this toolset
      for (const token of tokens) {
        // Skip if expired or revoked
        if (!this.tokenRepository.isTokenValid(token)) {
          continue;
        }

        // Skip if not associated with this toolset
        if (token.toolsetId !== toolset.id) {
          continue;
        }

        // Verify the key
        const isMatch = await verifyPassword(key, token.key);
        if (isMatch) {
          return toolset;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to validate master key:', error);
      return null;
    }
  }

  /**
   * Validate Toolset Key and return associated toolset.
   * Toolset Key only requires the key for validation.
   */
  async validateToolsetKey(_key: string): Promise<dgraphResolversTypes.ToolSet | null> {
    try {
      // We need to check all toolset keys across all workspaces
      // This is less efficient, but necessary for the authentication flow
      // In production, we might want to add an index or cache layer

      // For now, we'll need to get the token first, then lookup the toolset
      // Since we can't efficiently search by key (it's hashed), we need to
      // iterate through tokens. In a real system, we might store a key fingerprint.

      // This is a limitation of the current design - we need workspace context
      // For Phase 2, we'll accept this limitation and require workspace to be known
      // or we iterate through all tokens (acceptable for PoC with limited tokens)

      throw new Error('validateToolsetKey requires workspace context or full scan - not implemented in Phase 2');
    } catch (error) {
      console.error('Failed to validate toolset key:', error);
      return null;
    }
  }

  /**
   * Generate NATS JWT for an authenticated runtime.
   * The JWT contains claims about the runtime's permissions and identity.
   */
  async generateNatsJwt(
    toolsetId: string,
    runtimeId: string,
    workspaceId: string
  ): Promise<string> {
    try {
      // Get NATS operator/account keys from environment
      const operatorSeed = process.env.NATS_OPERATOR_SEED;
      const accountSeed = process.env.NATS_ACCOUNT_SEED;

      if (!operatorSeed || !accountSeed) {
        throw new Error('NATS_OPERATOR_SEED and NATS_ACCOUNT_SEED must be set in environment');
      }

      // Create user key pair for this runtime
      const userKeyPair = createUser();
      const userPublicKey = userKeyPair.getPublicKey();

      // Create the JWT claims
      const now = Math.floor(Date.now() / 1000);
      const claims: NatsJwtClaims = {
        sub: `runtime:${runtimeId}`,
        toolsetId,
        workspaceId,
        permissions: [`toolset.${toolsetId}.*`],
        exp: now + 3600, // 1 hour expiration
        iat: now,
      };

      // Sign the JWT with the account key
      const accountKeyPair = fromSeed(Buffer.from(accountSeed));
      const jwt = this.createNatsUserJwt(userPublicKey, accountKeyPair, claims);

      return jwt;
    } catch (error) {
      console.error('Failed to generate NATS JWT:', error);
      throw new Error('Failed to generate NATS JWT');
    }
  }

  /**
   * Generate an access token for runtime-to-backend communication.
   * This is a simple token that can be used to authenticate API requests.
   */
  async generateAccessToken(runtimeId: string, toolsetId: string): Promise<string> {
    try {
      // Generate a secure random token
      const token = crypto.randomBytes(32).toString('base64url');

      // Store the token with runtime association
      await this.tokenRepository.create({
        key: token,
        type: 'RUNTIME_KEY',
        workspaceId: 'PENDING', // Will be set during handshake
        toolsetId,
        runtimeId,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        description: 'Runtime access token',
      });

      return token;
    } catch (error) {
      console.error('Failed to generate access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Create a NATS user JWT with the given claims.
   * This is a simplified implementation - in production, use a proper JWT library.
   */
  private createNatsUserJwt(
    userPublicKey: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accountKeyPair: any,
    claims: NatsJwtClaims
  ): string {
    // NATS JWT structure
    const header = {
      typ: 'JWT',
      alg: 'ed25519-nkey',
    };

    const payload = {
      jti: crypto.randomBytes(16).toString('hex'),
      iat: claims.iat,
      iss: accountKeyPair.getPublicKey(),
      name: claims.sub,
      sub: userPublicKey,
      nats: {
        pub: {
          allow: claims.permissions,
        },
        sub: {
          allow: claims.permissions,
        },
        type: 'user',
        version: 2,
      },
      exp: claims.exp,
      toolsetId: claims.toolsetId,
      workspaceId: claims.workspaceId,
    };

    // Encode header and payload
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    // Create signature
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = accountKeyPair.sign(Buffer.from(signatureInput));
    const encodedSignature = Buffer.from(signature).toString('base64url');

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  }

  /**
   * Validate a token and check if it's expired or revoked.
   */
  async isTokenValid(tokenId: string): Promise<boolean> {
    try {
      const tokens = await this.tokenRepository.findByType('RUNTIME_KEY', 'PENDING');
      const token = tokens.find(t => t.id === tokenId);

      if (!token) {
        return false;
      }

      return this.tokenRepository.isTokenValid(token);
    } catch (error) {
      console.error('Failed to validate token:', error);
      return false;
    }
  }
}
