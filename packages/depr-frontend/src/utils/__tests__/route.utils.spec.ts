/**
 * Route Utilities Tests
 *
 * Tests for route utility functions including path validation,
 * security checks, and route classification.
 */

import { describe, it, expect } from 'vitest';
import {
  isProtectedRoute,
  isPublicRoute,
  isSystemInitRoute,
  isFullyPublicRoute,
  sanitizeRedirectPath,
  buildRedirectUrl,
  extractPathname,
  getDefaultAuthenticatedPath,
  getDefaultUnauthenticatedPath,
  shouldPreserveQueryParams,
  createUrlWithParams
} from '../route.utils';

describe('route.utils', () => {
  describe('isProtectedRoute', () => {
    it('identifies protected routes correctly', () => {
      expect(isProtectedRoute('/')).toBe(true);
      expect(isProtectedRoute('/dashboard')).toBe(true);
      expect(isProtectedRoute('/mcp-servers')).toBe(true);
      expect(isProtectedRoute('/agents')).toBe(true);
      expect(isProtectedRoute('/agents/123')).toBe(true);
      expect(isProtectedRoute('/settings')).toBe(true);
    });

    it('identifies non-protected routes correctly', () => {
      expect(isProtectedRoute('/login')).toBe(false);
      expect(isProtectedRoute('/register')).toBe(false);
      expect(isProtectedRoute('/landing')).toBe(false);
      expect(isProtectedRoute('/welcome')).toBe(false);
    });

    it('handles trailing slashes correctly', () => {
      expect(isProtectedRoute('/dashboard/')).toBe(true);
      expect(isProtectedRoute('/login/')).toBe(false);
    });

    it('handles empty and invalid paths', () => {
      expect(isProtectedRoute('')).toBe(true); // Empty path defaults to '/'
      expect(isProtectedRoute('invalid')).toBe(false);
    });
  });

  describe('isPublicRoute', () => {
    it('identifies public-only routes correctly', () => {
      expect(isPublicRoute('/login')).toBe(true);
      expect(isPublicRoute('/register')).toBe(true);
      expect(isPublicRoute('/login/forgot-password')).toBe(true);
    });

    it('identifies non-public-only routes correctly', () => {
      expect(isPublicRoute('/dashboard')).toBe(false);
      expect(isPublicRoute('/landing')).toBe(false);
      expect(isPublicRoute('/welcome')).toBe(false);
    });
  });

  describe('isSystemInitRoute', () => {
    it('identifies system initialization routes correctly', () => {
      expect(isSystemInitRoute('/welcome')).toBe(true);
      expect(isSystemInitRoute('/welcome/step-1')).toBe(true);
    });

    it('identifies non-system-init routes correctly', () => {
      expect(isSystemInitRoute('/login')).toBe(false);
      expect(isSystemInitRoute('/dashboard')).toBe(false);
      expect(isSystemInitRoute('/landing')).toBe(false);
    });
  });

  describe('isFullyPublicRoute', () => {
    it('identifies fully public routes correctly', () => {
      expect(isFullyPublicRoute('/landing')).toBe(true);
      expect(isFullyPublicRoute('/landing/features')).toBe(true);
    });

    it('identifies non-fully-public routes correctly', () => {
      expect(isFullyPublicRoute('/login')).toBe(false);
      expect(isFullyPublicRoute('/dashboard')).toBe(false);
      expect(isFullyPublicRoute('/welcome')).toBe(false);
    });
  });

  describe('sanitizeRedirectPath', () => {
    it('sanitizes valid paths correctly', () => {
      expect(sanitizeRedirectPath('/dashboard')).toBe('/dashboard');
      expect(sanitizeRedirectPath('/agents/123')).toBe('/agents/123');
      expect(sanitizeRedirectPath('dashboard')).toBe('/dashboard');
    });

    it('removes protocol and hostname', () => {
      expect(sanitizeRedirectPath('https://example.com/dashboard')).toBe('/dashboard');
      expect(sanitizeRedirectPath('http://localhost:3000/agents')).toBe('/agents');
    });

    it('removes dangerous characters', () => {
      expect(sanitizeRedirectPath('/path<script>alert(1)</script>')).toBe('/pathalert(1)');
      expect(sanitizeRedirectPath('/path"onclick=alert(1)')).toBe('/pathonclick=alert(1)');
      expect(sanitizeRedirectPath("/path'onload=alert(1)")).toBe('/pathonload=alert(1)');
    });

    it('handles path traversal attempts', () => {
      expect(sanitizeRedirectPath('../../../etc/passwd')).toBe('/');
      expect(sanitizeRedirectPath('/dashboard/../admin')).toBe('/');
    });

    it('handles double slashes', () => {
      expect(sanitizeRedirectPath('//example.com/dashboard')).toBe('/');
      expect(sanitizeRedirectPath('/path//with//doubles')).toBe('/');
    });

    it('handles URL encoding bypass attempts', () => {
      expect(sanitizeRedirectPath('/%2E%2E%2F%2E%2E%2Fetc')).toBe('/');
      expect(sanitizeRedirectPath('/dashboard%2F%2E%2E%2Fadmin')).toBe('/');
    });

    it('returns safe default for invalid inputs', () => {
      expect(sanitizeRedirectPath('')).toBe('/');
      expect(sanitizeRedirectPath(null as unknown as string)).toBe('/');
      expect(sanitizeRedirectPath(undefined as unknown as string)).toBe('/');
      expect(sanitizeRedirectPath('javascript:alert(1)')).toBe('/');
      expect(sanitizeRedirectPath('data:text/html,<script>alert(1)</script>')).toBe('/');
    });

    it('handles malformed URL decoding', () => {
      expect(sanitizeRedirectPath('/path%')).toBe('/');
      expect(sanitizeRedirectPath('/path%ZZ')).toBe('/');
    });
  });

  describe('buildRedirectUrl', () => {
    it('builds URLs without parameters', () => {
      expect(buildRedirectUrl('/dashboard')).toBe('/dashboard');
    });

    it('builds URLs with parameters', () => {
      const params = new URLSearchParams({ returnTo: '/agents', tab: 'active' });
      const url = buildRedirectUrl('/login', params);
      expect(url).toBe('/login?returnTo=%2Fagents&tab=active');
    });

    it('appends parameters to existing query string', () => {
      const params = new URLSearchParams({ newParam: 'value' });
      const url = buildRedirectUrl('/path?existing=1', params);
      expect(url).toBe('/path?existing=1&newParam=value');
    });

    it('sanitizes the path before building URL', () => {
      const params = new URLSearchParams({ param: 'value' });
      const url = buildRedirectUrl('https://evil.com/dashboard', params);
      expect(url).toBe('/dashboard?param=value');
    });

    it('handles empty parameters', () => {
      const params = new URLSearchParams();
      expect(buildRedirectUrl('/dashboard', params)).toBe('/dashboard');
    });
  });

  describe('extractPathname', () => {
    it('extracts pathname from relative URLs', () => {
      expect(extractPathname('/dashboard')).toBe('/dashboard');
      expect(extractPathname('/agents?filter=active#list')).toBe('/agents');
    });

    it('extracts pathname from absolute URLs', () => {
      expect(extractPathname('https://example.com/dashboard')).toBe('/dashboard');
      expect(extractPathname('http://localhost:3000/agents?filter=active')).toBe('/agents');
    });

    it('handles malformed URLs gracefully', () => {
      expect(extractPathname('not-a-url')).toBe('/');
      expect(extractPathname('')).toBe('/');
      expect(extractPathname('://malformed')).toBe('/');
    });
  });

  describe('getDefaultAuthenticatedPath', () => {
    it('returns the default path for authenticated users', () => {
      expect(getDefaultAuthenticatedPath()).toBe('/');
    });
  });

  describe('getDefaultUnauthenticatedPath', () => {
    it('returns the default path for unauthenticated users', () => {
      expect(getDefaultUnauthenticatedPath()).toBe('/login');
    });
  });

  describe('shouldPreserveQueryParams', () => {
    it('preserves query params for protected routes', () => {
      expect(shouldPreserveQueryParams('/dashboard')).toBe(true);
      expect(shouldPreserveQueryParams('/agents')).toBe(true);
      expect(shouldPreserveQueryParams('/')).toBe(true);
    });

    it('does not preserve query params for auth routes', () => {
      expect(shouldPreserveQueryParams('/login')).toBe(false);
      expect(shouldPreserveQueryParams('/register')).toBe(false);
    });

    it('does not preserve query params for system init routes', () => {
      expect(shouldPreserveQueryParams('/welcome')).toBe(false);
    });
  });

  describe('createUrlWithParams', () => {
    it('creates URL with all components', () => {
      const url = createUrlWithParams('/dashboard', '?tab=agents', '#section');
      expect(url).toBe('/dashboard?tab=agents#section');
    });

    it('creates URL without optional components', () => {
      expect(createUrlWithParams('/dashboard')).toBe('/dashboard');
      expect(createUrlWithParams('/dashboard', '?tab=agents')).toBe('/dashboard?tab=agents');
      expect(createUrlWithParams('/dashboard', '', '#section')).toBe('/dashboard#section');
    });

    it('skips query params for routes that should not preserve them', () => {
      const url = createUrlWithParams('/login', '?returnTo=/dashboard', '#form');
      expect(url).toBe('/login#form'); // Query params skipped, hash preserved
    });

    it('sanitizes the path', () => {
      const url = createUrlWithParams('https://evil.com/dashboard', '?safe=param');
      expect(url).toBe('/dashboard?safe=param');
    });
  });

  describe('Edge Cases', () => {
    it('handles paths with special characters', () => {
      expect(sanitizeRedirectPath('/agents/user@example.com')).toBe('/agents/userexample.com');
      expect(sanitizeRedirectPath('/path with spaces')).toBe('/path with spaces');
    });

    it('handles very long paths', () => {
      const longPath = '/dashboard/' + 'a'.repeat(1000);
      const sanitized = sanitizeRedirectPath(longPath);
      expect(sanitized).toContain('/dashboard/');
      expect(sanitized.length).toBeGreaterThan(1000);
    });

    it('handles international characters', () => {
      expect(sanitizeRedirectPath('/café/résumé')).toBe('/café/résumé');
      expect(sanitizeRedirectPath('/用户/配置')).toBe('/用户/配置');
    });
  });
});