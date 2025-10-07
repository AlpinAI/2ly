/**
 * Authentication Utilities
 *
 * Collection of utility functions for authentication-related operations
 * including validation, JWT parsing, and navigation helpers.
 */

import { JwtPayload } from '../services/token.service';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PasswordStrengthResult extends ValidationResult {
  score: number; // 0-4 (weak to very strong)
  suggestions: string[];
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  severity?: 'error' | 'warning' | 'info';
}

export interface SystemNameValidationResult extends FieldValidationResult {
  suggestions?: string[];
}

/**
 * Validate email format using RFC 5322 compliant regex
 * @param email - Email address to validate
 * @returns True if email format is valid
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // RFC 5322 compliant email regex (simplified but robust)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return emailRegex.test(email.trim());
}

/**
 * Validate password strength and requirements
 * @param password - Password to validate
 * @returns Validation result with score and suggestions
 */
export function validatePassword(password: string): PasswordStrengthResult {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      score: 0,
      errors: ['Password is required'],
      suggestions: ['Please enter a password'],
    };
  }

  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Length requirements
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
    suggestions.push('Use at least 8 characters');
  } else if (password.length >= 8) {
    score += 1;
  }

  // Character variety requirements (simplified: lowercase + numbers)
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  // Optional checks for bonus points (not required)
  const hasUpperCase = /[A-Z]/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
    suggestions.push('Add lowercase letters (a-z)');
  } else {
    score += 0.5;
  }

  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
    suggestions.push('Add numbers (0-9)');
  } else {
    score += 0.5;
  }

  // Bonus points for uppercase (not required)
  if (hasUpperCase) {
    score += 0.5;
  }

  // Bonus points for special characters (not required)
  if (hasSpecialChars) {
    score += 0.5;
  }

  // Bonus points for length
  if (password.length >= 12) {
    score += 1;
  } else if (password.length >= 10) {
    score += 0.5;
  }

  // Common password patterns check
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters (aaa, 111)
    /123|234|345|456|567|678|789/, // Sequential numbers
    /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // Sequential letters
    /password|123456|qwerty|admin|welcome|login/i, // Common passwords
  ];

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    score = Math.max(0, score - 1);
    suggestions.push('Avoid common patterns like "123", "abc", or "password"');
  }

  // Normalize score to 0-4 range
  score = Math.min(4, Math.max(0, Math.round(score)));

  // Add strength suggestions
  if (score < 3) {
    suggestions.push('Consider using a passphrase with multiple words');
    suggestions.push('Mix letters, numbers, and special characters');
  }

  return {
    isValid: errors.length === 0 && score >= 2,
    score,
    errors,
    suggestions,
  };
}

/**
 * Safely parse JWT payload from token without validation
 * @param token - JWT token to parse
 * @returns Parsed JWT payload or null if invalid
 */
export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode base64url payload
    const payload = parts[1];
    const decodedPayload = base64UrlDecode(payload);

    return JSON.parse(decodedPayload) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Check if token is valid (not expired and properly formatted)
 * @param token - JWT token to validate
 * @returns True if token is valid and not expired
 */
export function isTokenValid(token: string): boolean {
  try {
    const payload = parseJwtPayload(token);
    if (!payload || !payload.exp) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch {
    return false;
  }
}

/**
 * Get the intended redirect path after authentication
 * @returns Redirect path or null if none stored
 */
export function getRedirectPath(): string | null {
  try {
    return sessionStorage.getItem('2ly_auth_redirect_path');
  } catch {
    return null;
  }
}

/**
 * Store intended redirect path for post-authentication navigation
 * @param path - Path to redirect to after authentication
 */
export function setRedirectPath(path: string): void {
  try {
    sessionStorage.setItem('2ly_auth_redirect_path', path);
  } catch (error) {
    console.warn('Failed to store redirect path:', error);
  }
}

/**
 * Clear stored redirect path
 */
export function clearRedirectPath(): void {
  try {
    sessionStorage.removeItem('2ly_auth_redirect_path');
  } catch (error) {
    console.warn('Failed to clear redirect path:', error);
  }
}

/**
 * Get password strength level description
 * @param score - Password strength score (0-4)
 * @returns Human-readable strength description
 */
export function getPasswordStrengthText(score: number): string {
  switch (score) {
    case 0:
      return 'Very Weak';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return 'Unknown';
  }
}

/**
 * Get password strength color for UI display
 * @param score - Password strength score (0-4)
 * @returns CSS color class or hex color
 */
export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return '#ef4444'; // red-500
    case 2:
      return '#f59e0b'; // amber-500
    case 3:
      return '#10b981'; // emerald-500
    case 4:
      return '#059669'; // emerald-600
    default:
      return '#6b7280'; // gray-500
  }
}

/**
 * Create a debounced validation function for real-time input validation
 * @param validationFn - Validation function to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced validation function
 */
export function createDebouncedValidator<T, R extends ValidationResult | FieldValidationResult>(
  validationFn: (value: T) => R,
  delay: number = 300
): (value: T, callback: (result: R) => void) => void {
  let timeoutId: NodeJS.Timeout;

  return (value: T, callback: (result: R) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validationFn(value);
      callback(result);
    }, delay);
  };
}

/**
 * Extract user initials from email for avatar display
 * @param email - User email address
 * @returns User initials (max 2 characters)
 */
export function getUserInitials(email: string): string {
  if (!email || typeof email !== 'string') {
    return '??';
  }

  const parts = email.split('@')[0].split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  return email.substring(0, 2).toUpperCase();
}

/**
 * Format authentication error message for user display
 * @param error - Error object or message
 * @returns User-friendly error message
 */
export function formatAuthError(error: unknown): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    // Map common error messages to user-friendly versions
    const message = error.message.toLowerCase();

    if (message.includes('invalid credentials') || message.includes('unauthorized')) {
      return 'Invalid email or password';
    }

    if (message.includes('user not found')) {
      return 'No account found with this email address';
    }

    if (message.includes('email already exists') || message.includes('user already exists')) {
      return 'An account with this email already exists';
    }

    if (message.includes('token expired') || message.includes('token invalid')) {
      return 'Your session has expired. Please log in again';
    }

    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again';
    }

    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Enhanced validation functions for authentication forms
 */

/**
 * Validate email input for authentication forms with real-time feedback
 * @param email - Email address to validate
 * @returns Field validation result with specific error message
 */
export function validateEmailInput(email: string): FieldValidationResult {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email address is required',
      severity: 'error',
    };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    return {
      isValid: false,
      error: 'Email address is required',
      severity: 'error',
    };
  }

  if (trimmedEmail.length > 254) {
    return {
      isValid: false,
      error: 'Email address is too long',
      severity: 'error',
    };
  }

  if (!validateEmail(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
      severity: 'error',
    };
  }

  return { isValid: true };
}

/**
 * Validate password input for authentication forms with strength indicators
 * @param password - Password to validate
 * @returns Enhanced validation result with strength information
 */
export function validatePasswordInput(password: string): PasswordStrengthResult {
  const strengthResult = validatePassword(password);

  // Convert to field validation format with enhanced messaging
  let primaryError = '';
  if (strengthResult.errors.length > 0) {
    if (password.length < 8) {
      primaryError = 'Password must be at least 8 characters long';
    } else if (strengthResult.score < 2) {
      primaryError = 'Password is too weak';
    } else {
      primaryError = strengthResult.errors[0];
    }
  }

  return {
    ...strengthResult,
    isValid: strengthResult.isValid,
    errors: primaryError ? [primaryError] : [],
  };
}

/**
 * Validate password confirmation field
 * @param password - Original password
 * @param confirmPassword - Password confirmation
 * @returns Field validation result
 */
export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): FieldValidationResult {
  if (!confirmPassword) {
    return {
      isValid: false,
      error: 'Please confirm your password',
      severity: 'error',
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: 'Passwords do not match',
      severity: 'error',
    };
  }

  return { isValid: true };
}

/**
 * Validate system name for system initialization
 * @param name - System name to validate
 * @returns System name validation result with suggestions
 */
export function validateSystemName(name: string): SystemNameValidationResult {
  if (!name || typeof name !== 'string') {
    return {
      isValid: false,
      error: 'System name is required',
      severity: 'error',
    };
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return {
      isValid: false,
      error: 'System name is required',
      severity: 'error',
    };
  }

  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: 'System name must be at least 2 characters long',
      severity: 'error',
    };
  }

  if (trimmedName.length > 50) {
    return {
      isValid: false,
      error: 'System name must be less than 50 characters',
      severity: 'error',
    };
  }

  // Check for valid characters (letters, numbers, spaces, hyphens, underscores)
  const validNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
  if (!validNameRegex.test(trimmedName)) {
    return {
      isValid: false,
      error: 'System name can only contain letters, numbers, spaces, hyphens, and underscores',
      severity: 'error',
      suggestions: ['Remove special characters except hyphens and underscores'],
    };
  }

  // Check for reasonable patterns
  if (/^\s+|\s+$/.test(trimmedName)) {
    return {
      isValid: false,
      error: 'System name cannot start or end with spaces',
      severity: 'error',
      suggestions: ['Remove leading and trailing spaces'],
    };
  }

  if (/\s{2,}/.test(trimmedName)) {
    return {
      isValid: true,
      error: 'Consider using single spaces between words',
      severity: 'warning',
      suggestions: ['Replace multiple spaces with single spaces'],
    };
  }

  return { isValid: true };
}

/**
 * Get password strength indicator properties for UI display
 * @param score - Password strength score (0-4)
 * @returns UI properties for password strength display
 */
export function getPasswordStrengthProps(score: number): {
  text: string;
  color: string;
  bgColor: string;
  width: string;
} {
  switch (score) {
    case 0:
      return {
        text: 'Very Weak',
        color: '#dc2626', // red-600
        bgColor: '#fef2f2', // red-50
        width: '20%',
      };
    case 1:
      return {
        text: 'Weak',
        color: '#ea580c', // orange-600
        bgColor: '#fff7ed', // orange-50
        width: '40%',
      };
    case 2:
      return {
        text: 'Fair',
        color: '#ca8a04', // yellow-600
        bgColor: '#fefce8', // yellow-50
        width: '60%',
      };
    case 3:
      return {
        text: 'Good',
        color: '#16a34a', // green-600
        bgColor: '#f0fdf4', // green-50
        width: '80%',
      };
    case 4:
      return {
        text: 'Strong',
        color: '#059669', // emerald-600
        bgColor: '#ecfdf5', // emerald-50
        width: '100%',
      };
    default:
      return {
        text: 'Unknown',
        color: '#6b7280', // gray-500
        bgColor: '#f9fafb', // gray-50
        width: '0%',
      };
  }
}

/**
 * Decode base64url string (JWT uses base64url, not standard base64)
 * @param str - Base64url encoded string
 * @returns Decoded string
 */
function base64UrlDecode(str: string): string {
  // Replace base64url characters with base64 characters
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }

  return atob(base64);
}