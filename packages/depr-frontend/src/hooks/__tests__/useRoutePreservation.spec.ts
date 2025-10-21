/**
 * useRoutePreservation Hook Tests
 *
 * Tests for the route preservation hook including storage operations,
 * route validation, and deep-link restoration.
 */

import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useRoutePreservation } from '../useRoutePreservation';

// Mock React Router
const mockNavigate = vi.fn();
let mockLocation = { pathname: '/test', search: '?param=1', hash: '#section' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation
  };
});

// Mock route utilities
vi.mock('../../utils/route.utils', () => ({
  sanitizeRedirectPath: vi.fn((path: string) => path),
  createUrlWithParams: vi.fn((path: string, search?: string, hash?: string) => {
    return path + (search || '') + (hash || '');
  }),
  getDefaultAuthenticatedPath: vi.fn(() => '/'),
  isProtectedRoute: vi.fn((path: string) => {
    const pathname = path.split('?')[0].split('#')[0];
    return pathname !== '/login' && pathname !== '/register' && pathname !== '/landing';
  }),
  isPublicRoute: vi.fn((path: string) => {
    const pathname = path.split('?')[0].split('#')[0];
    return pathname === '/login' || pathname === '/register';
  }),
  isSystemInitRoute: vi.fn((path: string) => {
    const pathname = path.split('?')[0].split('#')[0];
    return pathname === '/welcome';
  })
}));

const PRESERVED_ROUTE_KEY = '2ly_preserved_route';

function renderUseRoutePreservation() {
  return renderHook(() => useRoutePreservation());
}

describe('useRoutePreservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock location to default
    mockLocation = { pathname: '/test', search: '?param=1', hash: '#section' };
    // Clear storage before each test
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('preserveCurrentRoute', () => {
    it('stores the current route with query parameters and hash', () => {
      const { result } = renderUseRoutePreservation();

      result.current.preserveCurrentRoute();

      const stored = sessionStorage.getItem(PRESERVED_ROUTE_KEY);
      expect(stored).toBe('/test?param=1#section');
    });

    it('does not store public routes', () => {
      mockLocation = { pathname: '/login', search: '?param=1', hash: '#section' };
      const { result } = renderUseRoutePreservation();

      result.current.preserveCurrentRoute();

      const stored = sessionStorage.getItem(PRESERVED_ROUTE_KEY);
      expect(stored).toBeNull();
    });
  });

  describe('preserveRoute', () => {
    it('stores a valid protected route', () => {
      const { result } = renderUseRoutePreservation();

      result.current.preserveRoute('/dashboard');

      const stored = sessionStorage.getItem(PRESERVED_ROUTE_KEY);
      expect(stored).toBe('/dashboard');
    });

    it('ignores public-only routes', () => {
      const { result } = renderUseRoutePreservation();

      result.current.preserveRoute('/login');

      const stored = sessionStorage.getItem(PRESERVED_ROUTE_KEY);
      expect(stored).toBeNull();
    });

    it('ignores system initialization routes', () => {
      const { result } = renderUseRoutePreservation();

      result.current.preserveRoute('/welcome');

      const stored = sessionStorage.getItem(PRESERVED_ROUTE_KEY);
      expect(stored).toBeNull();
    });
  });

  describe('getPreservedRoute', () => {
    it('returns null when no route is preserved', () => {
      const { result } = renderUseRoutePreservation();

      const preserved = result.current.getPreservedRoute();

      expect(preserved).toBeNull();
    });

    it('returns the preserved route when available', () => {
      sessionStorage.setItem(PRESERVED_ROUTE_KEY, '/dashboard');
      const { result } = renderUseRoutePreservation();

      const preserved = result.current.getPreservedRoute();

      expect(preserved).toBe('/dashboard');
    });

    it('clears and returns null for invalid preserved routes', () => {
      sessionStorage.setItem(PRESERVED_ROUTE_KEY, '/login');
      const { result } = renderUseRoutePreservation();

      const preserved = result.current.getPreservedRoute();

      expect(preserved).toBeNull();
      expect(sessionStorage.getItem(PRESERVED_ROUTE_KEY)).toBeNull();
    });

    it('handles storage errors gracefully', () => {
      // Mock sessionStorage to throw error
      const originalGetItem = sessionStorage.getItem;
      sessionStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const { result } = renderUseRoutePreservation();
      const preserved = result.current.getPreservedRoute();

      expect(preserved).toBeNull();

      // Restore original method
      sessionStorage.getItem = originalGetItem;
    });
  });

  describe('clearPreservedRoute', () => {
    it('removes the preserved route from storage', () => {
      sessionStorage.setItem(PRESERVED_ROUTE_KEY, '/dashboard');
      const { result } = renderUseRoutePreservation();

      result.current.clearPreservedRoute();

      expect(sessionStorage.getItem(PRESERVED_ROUTE_KEY)).toBeNull();
    });

    it('handles storage errors gracefully', () => {
      const originalRemoveItem = sessionStorage.removeItem;
      sessionStorage.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const { result } = renderUseRoutePreservation();

      expect(() => result.current.clearPreservedRoute()).not.toThrow();

      sessionStorage.removeItem = originalRemoveItem;
    });
  });

  describe('hasPreservedRoute', () => {
    it('returns false when no route is preserved', () => {
      const { result } = renderUseRoutePreservation();

      expect(result.current.hasPreservedRoute()).toBe(false);
    });

    it('returns true when a valid route is preserved', () => {
      sessionStorage.setItem(PRESERVED_ROUTE_KEY, '/dashboard');
      const { result } = renderUseRoutePreservation();

      expect(result.current.hasPreservedRoute()).toBe(true);
    });

    it('returns false for invalid preserved routes', () => {
      sessionStorage.setItem(PRESERVED_ROUTE_KEY, '/login');
      const { result } = renderUseRoutePreservation();

      expect(result.current.hasPreservedRoute()).toBe(false);
    });
  });

  describe('redirectToPreservedRoute', () => {
    it('navigates to preserved route and clears it', () => {
      sessionStorage.setItem(PRESERVED_ROUTE_KEY, '/dashboard');
      const { result } = renderUseRoutePreservation();

      result.current.redirectToPreservedRoute();

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      expect(sessionStorage.getItem(PRESERVED_ROUTE_KEY)).toBeNull();
    });

    it('navigates to fallback when no preserved route', () => {
      const { result } = renderUseRoutePreservation();

      result.current.redirectToPreservedRoute('/fallback');

      expect(mockNavigate).toHaveBeenCalledWith('/fallback', { replace: true });
    });

    it('navigates to default path when no preserved route and no fallback', () => {
      const { result } = renderUseRoutePreservation();

      result.current.redirectToPreservedRoute();

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  describe('Storage Fallback', () => {
    it('falls back to localStorage when sessionStorage is not available', () => {
      // Mock sessionStorage to be undefined
      const originalSessionStorage = window.sessionStorage;
      delete (window as unknown as { sessionStorage?: Storage }).sessionStorage;

      const { result } = renderUseRoutePreservation();
      result.current.preserveRoute('/dashboard');

      const stored = localStorage.getItem(PRESERVED_ROUTE_KEY);
      expect(stored).toBe('/dashboard');

      // Restore sessionStorage
      window.sessionStorage = originalSessionStorage;
    });
  });
});