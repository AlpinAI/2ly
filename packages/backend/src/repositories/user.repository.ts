import { injectable, inject } from 'inversify';
import { DGraphService } from '../services/dgraph.service';
import { dgraphResolversTypes, hashPassword, LoggerService } from '@2ly/common';
import {
  ADD_USER,
  ADD_ADMIN_TO_WORKSPACE,
  ADD_MEMBER_TO_WORKSPACE,
  UPDATE_USER_PASSWORD,
  UPDATE_USER_EMAIL,
  FIND_USER_BY_EMAIL,
  UPDATE_USER_LAST_LOGIN,
  INCREMENT_FAILED_LOGIN_ATTEMPTS,
  UNLOCK_USER_ACCOUNT,
} from './user.operations';
import pino from 'pino';

@injectable()
export class UserRepository {
  private logger: pino.Logger;
  constructor(
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(DGraphService) private readonly dgraphService: DGraphService
  ) {
    this.logger = this.loggerService.getLogger('UserRepository');
  }

  async create(email: string, password: string): Promise<dgraphResolversTypes.User> {
    const now = new Date().toISOString();
    const hashedPassword = await hashPassword(password);
    const res = await this.dgraphService.mutation<{
      addUser: { user: dgraphResolversTypes.User[] };
    }>(ADD_USER, {
      email,
      password: hashedPassword,
      now,
    });
    return res.addUser.user[0];
  }

  async addAdminToWorkspace(userId: string, workspaceId: string): Promise<dgraphResolversTypes.User> {
    const res = await this.dgraphService.mutation<{
      updateUser: { user: dgraphResolversTypes.User[] };
    }>(ADD_ADMIN_TO_WORKSPACE, {
      userId,
      workspaceId,
    });
    return res.updateUser.user[0];
  }

  async addMemberToWorkspace(userId: string, workspaceId: string): Promise<dgraphResolversTypes.User> {
    const res = await this.dgraphService.mutation<{
      updateUser: { user: dgraphResolversTypes.User[] };
    }>(ADD_MEMBER_TO_WORKSPACE, {
      userId,
      workspaceId,
    });
    return res.updateUser.user[0];
  }

  async updateEmail(id: string, email: string): Promise<dgraphResolversTypes.User> {
    const res = await this.dgraphService.mutation<{
      updateUser: { user: dgraphResolversTypes.User[] };
    }>(UPDATE_USER_EMAIL, { id, email });
    return res.updateUser.user[0];
  }

  async updatePassword(id: string, password: string): Promise<dgraphResolversTypes.User> {
    const now = new Date().toISOString();
    const hashedPassword = await hashPassword(password);
    const res = await this.dgraphService.mutation<{
      updateUser: { user: dgraphResolversTypes.User[] };
    }>(UPDATE_USER_PASSWORD, { id, password: hashedPassword, now });
    return res.updateUser.user[0];
  }

  /**
   * Find user by email address for authentication.
   */
  async findByEmail(email: string): Promise<dgraphResolversTypes.User | null> {
    try {
      const res = await this.dgraphService.query<{
        queryUser: dgraphResolversTypes.User[];
      }>(FIND_USER_BY_EMAIL, { email });

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
   * Update user's last login timestamp and reset failed login attempts.
   */
  async updateLastLogin(id: string): Promise<dgraphResolversTypes.User> {
    try {
      const now = new Date().toISOString();
      const res = await this.dgraphService.mutation<{
        updateUser: { user: dgraphResolversTypes.User[] };
      }>(UPDATE_USER_LAST_LOGIN, { id, now });
      return res.updateUser.user[0];
    } catch (error) {
      this.logger.error(`Failed to update last login: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to update last login');
    }
  }

  /**
   * Increment failed login attempts and optionally lock the account.
   */
  async incrementFailedLoginAttempts(
    id: string,
    currentAttempts: number,
    lockDurationMinutes?: number
  ): Promise<dgraphResolversTypes.User> {
    try {
      const newAttempts = currentAttempts + 1;
      let lockedUntil: string | null = null;

      if (lockDurationMinutes && newAttempts >= 5) {
        const lockUntilDate = new Date();
        lockUntilDate.setMinutes(lockUntilDate.getMinutes() + lockDurationMinutes);
        lockedUntil = lockUntilDate.toISOString();
      }

      const res = await this.dgraphService.mutation<{
        updateUser: { user: dgraphResolversTypes.User[] };
      }>(INCREMENT_FAILED_LOGIN_ATTEMPTS, {
        id,
        attempts: newAttempts,
        lockedUntil,
      });

      return res.updateUser.user[0];
    } catch (error) {
      this.logger.error(`Failed to increment failed login attempts: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to increment failed login attempts');
    }
  }

  /**
   * Unlock user account by resetting failed login attempts.
   */
  async unlockAccount(id: string): Promise<dgraphResolversTypes.User> {
    try {
      const res = await this.dgraphService.mutation<{
        updateUser: { user: dgraphResolversTypes.User[] };
      }>(UNLOCK_USER_ACCOUNT, { id });
      return res.updateUser.user[0];
    } catch (error) {
      this.logger.error(`Failed to unlock user account: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to unlock user account');
    }
  }

  /**
   * Check if user account is currently locked due to failed login attempts.
   */
  isAccountLocked(user: dgraphResolversTypes.User): boolean {
    if (!user.lockedUntil) {
      return false;
    }

    const lockExpiry = new Date(user.lockedUntil);
    const now = new Date();

    return now < lockExpiry;
  }
}
