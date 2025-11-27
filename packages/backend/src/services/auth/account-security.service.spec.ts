import { describe, it, expect, beforeEach } from 'vitest';
import { AccountSecurityService } from './account-security.service';

describe('AccountSecurityService', () => {
  let service: AccountSecurityService;

  beforeEach(() => {
    service = new AccountSecurityService();
  });

  describe('Account Security Status', () => {
    it('should return low risk status for any user (POC mode)', async () => {
      const mockUser = {
        id: 'user123',
        email: 'user1@2ly.ai',
      };

      const status = await service.getAccountSecurityStatus(mockUser);

      expect(status.isLocked).toBe(false);
      expect(status.failedAttempts).toBe(0);
      expect(status.riskLevel).toBe('low');
      expect(status.securityRecommendations).toHaveLength(0);
    });
  });

  describe('Failed Login Attempt Handling', () => {
    it('should return no-op result for failed login attempts (POC mode)', async () => {
      const mockUser = { id: 'user123' };

      const result = await service.handleFailedLoginAttempt(
        mockUser,
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result.accountLocked).toBe(false);
      expect(result.securityEvent.eventType).toBe('failed_login');
      expect(result.securityEvent.metadata?.attemptNumber).toBe(1);
      expect(result.securityEvent.metadata?.ipAddress).toBe('192.168.1.1');
      expect(result.securityEvent.metadata?.userAgent).toBe('Mozilla/5.0');
    });
  });

  describe('Successful Login Handling', () => {
    it('should return no-op result for successful login (POC mode)', async () => {
      const mockUser = { id: 'user123' };

      const result = await service.handleSuccessfulLogin(
        mockUser,
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result.securityEvent.eventType).toBe('successful_login');
      expect(result.securityEvent.metadata?.ipAddress).toBe('192.168.1.1');
      expect(result.securityEvent.metadata?.userAgent).toBe('Mozilla/5.0');
    });
  });

  describe('Manual Account Unlock', () => {
    it('should return success for unlock attempts (not needed in POC)', async () => {
      const result = await service.unlockAccount('user123', 'admin456');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Account unlock not needed in POC mode');
    });
  });

  describe('Suspicious Activity Tracking', () => {
    it('should do nothing when clearing suspicious activity (POC mode)', () => {
      // This should not throw an error
      service.clearSuspiciousActivityTracking();
      expect(true).toBe(true); // Just to have an assertion
    });
  });
});