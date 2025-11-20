import { injectable } from 'inversify';

/**
 * Simplified account security service for POC.
 * Basic security status checking without lockouts or activity tracking.
 *
 * TODO: Future security improvements could include:
 * - Account lockout after failed login attempts
 * - Suspicious activity detection and tracking
 * - IP-based monitoring
 * - Device fingerprinting
 * - Audit trail for security events
 * - Risk-based authentication
 * - Session management
 * - Multi-factor authentication preparation
 */
@injectable()
export class AccountSecurityService {
  /**
   * Gets basic account security status.
   */
  async getAccountSecurityStatus(_user: { id: string; email: string }) {
    // For POC: always return safe status
    return {
      isLocked: false,
      failedAttempts: 0,
      riskLevel: 'low' as const,
      securityRecommendations: [] as string[]
    };
  }

  /**
   * Handles failed login attempt (no-op for POC).
   */
  async handleFailedLoginAttempt(user: { id: string }, ipAddress: string, userAgent?: string) {
    // TODO: Implement failed login tracking when needed
    return {
      accountLocked: false,
      securityEvent: {
        eventType: 'failed_login' as const,
        metadata: {
          attemptNumber: 1,
          ipAddress,
          userAgent
        }
      }
    };
  }

  /**
   * Handles successful login (no-op for POC).
   */
  async handleSuccessfulLogin(user: { id: string }, ipAddress: string, userAgent?: string) {
    // TODO: Implement successful login tracking when needed
    return {
      securityEvent: {
        eventType: 'successful_login' as const,
        metadata: {
          ipAddress,
          userAgent
        }
      }
    };
  }

  /**
   * Manual account unlock (no-op for POC).
   */
  async unlockAccount(_userId: string, _adminUserId: string) {
    // TODO: Implement account unlocking when lockout is added
    return {
      success: true,
      message: 'Account unlock not needed in POC mode'
    };
  }

  /**
   * Clear suspicious activity tracking (no-op for POC).
   */
  clearSuspiciousActivityTracking() {
    // TODO: Implement when activity tracking is added
  }
}