import { injectable } from 'inversify';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Password policy service.
 * Validates password requirements:
 * - Minimum 8 characters
 * - At least one letter
 * - At least one number
 *
 * TODO: Future improvements could include:
 * - Password strength scoring
 * - Common password checking
 * - Password history enforcement
 * - User information validation
 * - Entropy calculation
 */
@injectable()
export class PasswordPolicyService {
  private readonly minLength = parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10);

  /**
   * Validates password against policy:
   * - Minimum 8 characters
   * - At least one letter
   * - At least one number
   */
  validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (!password || password.length < this.minLength) {
      errors.push(`Password must be at least ${this.minLength} characters long`);
    }

    if (!/[a-zA-Z]/.test(password)) {
      errors.push('Password must contain at least one letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets current policy configuration.
   */
  getPolicyConfig() {
    return {
      minLength: this.minLength,
      // TODO: Add other policy settings when needed
    };
  }

  /**
   * Generates a simple secure password (for testing/development).
   */
  generateSecurePassword(length: number = 12): { password: string } {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return { password };
  }
}