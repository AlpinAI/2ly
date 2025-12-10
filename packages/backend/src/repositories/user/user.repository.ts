import { injectable, inject } from 'inversify';
import { DGraphService } from '../../services/dgraph.service';
import { hashPassword, LoggerService } from '@skilder-ai/common';
import pino from 'pino';

// Import generated typed documents - provides full type safety for variables and responses
import {
  AddUserDocument,
  AddAdminToWorkspaceDocument,
  AddMemberToWorkspaceDocument,
  UpdateUserPasswordDocument,
  UpdateUserEmailDocument,
  FindUserByEmailDocument,
  FindUserByIdDocument,
  UpdateUserLastLoginDocument,
  IncrementFailedLoginAttemptsDocument,
  UnlockUserAccountDocument,
  type FindUserByEmailQuery,
} from '../../generated/dgraph';

// Type for user returned from findByEmail (with all auth-relevant fields)
type UserWithAuth = NonNullable<NonNullable<FindUserByEmailQuery['queryUser']>[0]>;

@injectable()
export class UserRepository {
  private logger: pino.Logger;
  constructor(
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(DGraphService) private readonly dgraphService: DGraphService
  ) {
    this.logger = this.loggerService.getLogger('UserRepository');
  }

  async create(email: string, password: string) {
    const now = new Date().toISOString();
    const hashedPassword = await hashPassword(password);
    // TypedDocumentNode provides full type inference - no manual type annotation needed
    const res = await this.dgraphService.mutation(AddUserDocument, {
      email,
      password: hashedPassword,
      now,
    });
    return res.addUser?.user?.[0];
  }

  async addAdminToWorkspace(userId: string, workspaceId: string) {
    const res = await this.dgraphService.mutation(AddAdminToWorkspaceDocument, {
      userId,
      workspaceId,
    });
    return res.updateUser?.user?.[0];
  }

  async addMemberToWorkspace(userId: string, workspaceId: string) {
    const res = await this.dgraphService.mutation(AddMemberToWorkspaceDocument, {
      userId,
      workspaceId,
    });
    return res.updateUser?.user?.[0];
  }

  async updateEmail(id: string, email: string) {
    const res = await this.dgraphService.mutation(UpdateUserEmailDocument, { id, email });
    return res.updateUser?.user?.[0];
  }

  async updatePassword(id: string, password: string) {
    const now = new Date().toISOString();
    const hashedPassword = await hashPassword(password);
    const res = await this.dgraphService.mutation(UpdateUserPasswordDocument, {
      id,
      password: hashedPassword,
      now,
    });
    return res.updateUser?.user?.[0];
  }

  /**
   * Find user by email address for authentication.
   */
  async findByEmail(email: string): Promise<UserWithAuth | null> {
    try {
      const res = await this.dgraphService.query(FindUserByEmailDocument, { email });

      if (!res.queryUser || res.queryUser.length === 0) {
        return null;
      }

      return res.queryUser[0];
    } catch (error) {
      this.logger.error(`Failed to find user by email: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to find user by email');
    }
  }

  /**
   * Find user by ID.
   */
  async findById(id: string) {
    try {
      const res = await this.dgraphService.query(FindUserByIdDocument, { id });
      return res.getUser ?? null;
    } catch (error) {
      this.logger.error(`Failed to find user by id: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to find user by id');
    }
  }

  /**
   * Update user's last login timestamp and reset failed login attempts.
   */
  async updateLastLogin(id: string) {
    try {
      const now = new Date().toISOString();
      const res = await this.dgraphService.mutation(UpdateUserLastLoginDocument, { id, now });
      return res.updateUser?.user?.[0];
    } catch (error) {
      this.logger.error(`Failed to update last login: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to update last login');
    }
  }

  /**
   * Increment failed login attempts and optionally lock the account.
   */
  async incrementFailedLoginAttempts(id: string, currentAttempts: number, lockDurationMinutes?: number) {
    try {
      const newAttempts = currentAttempts + 1;
      let lockedUntil: string | null = null;

      if (lockDurationMinutes && newAttempts >= 5) {
        const lockUntilDate = new Date();
        lockUntilDate.setMinutes(lockUntilDate.getMinutes() + lockDurationMinutes);
        lockedUntil = lockUntilDate.toISOString();
      }

      const res = await this.dgraphService.mutation(IncrementFailedLoginAttemptsDocument, {
        id,
        attempts: newAttempts,
        lockedUntil,
      });

      return res.updateUser?.user?.[0];
    } catch (error) {
      this.logger.error(
        `Failed to increment failed login attempts: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new Error('Failed to increment failed login attempts');
    }
  }

  /**
   * Unlock user account by resetting failed login attempts.
   */
  async unlockAccount(id: string) {
    try {
      const res = await this.dgraphService.mutation(UnlockUserAccountDocument, { id });
      return res.updateUser?.user?.[0];
    } catch (error) {
      this.logger.error(`Failed to unlock user account: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to unlock user account');
    }
  }

  /**
   * Check if user account is currently locked due to failed login attempts.
   */
  isAccountLocked(user: { lockedUntil?: string | null }): boolean {
    if (!user.lockedUntil) {
      return false;
    }

    const lockExpiry = new Date(user.lockedUntil);
    const now = new Date();

    return now < lockExpiry;
  }
}
