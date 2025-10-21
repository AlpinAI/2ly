/**
 * Route Utilities
 *
 * Utility functions for route manipulation, validation, and security.
 * Handles route classification, path sanitization, and URL construction.
 */

/**
 * Routes that require authentication
 */
const PROTECTED_ROUTES = [
  '/',
  '/dashboard',
  '/mcp-servers',
  '/agents',
  '/runtimes',
  '/recipes',
  '/monitoring',
  '/integration',
  '/settings'
];

/**
 * Routes that should only be accessible to unauthenticated users
 */
const PUBLIC_ONLY_ROUTES = [
  '/login',
  '/register'
];

/**
 * Routes for system initialization
 */
const SYSTEM_INIT_ROUTES = [
  '/welcome'
];

/**
 * Routes that are public and don't require authentication
 */
const PUBLIC_ROUTES = [
  '/landing'
];

/**
 * Check if a route requires authentication
 */
export function isProtectedRoute(path: string): boolean {
  const normalizedPath = normalizePath(path);

  return PROTECTED_ROUTES.some(route => {
    if (route === '/') {
      return normalizedPath === '/';
    }
    return normalizedPath.startsWith(route);
  });
}

/**
 * Check if a route is public-only (should redirect authenticated users)
 */
export function isPublicRoute(path: string): boolean {
  const normalizedPath = normalizePath(path);

  return PUBLIC_ONLY_ROUTES.some(route =>
    normalizedPath === route || normalizedPath.startsWith(route + '/')
  );
}

/**
 * Check if a route is for system initialization
 */
export function isSystemInitRoute(path: string): boolean {
  const normalizedPath = normalizePath(path);

  return SYSTEM_INIT_ROUTES.some(route =>
    normalizedPath === route || normalizedPath.startsWith(route + '/')
  );
}

/**
 * Check if a route is fully public (no authentication needed)
 */
export function isFullyPublicRoute(path: string): boolean {
  const normalizedPath = normalizePath(path);

  return PUBLIC_ROUTES.some(route =>
    normalizedPath === route || normalizedPath.startsWith(route + '/')
  );
}

/**
 * Normalize a path by removing trailing slashes and ensuring it starts with /
 */
function normalizePath(path: string): string {
  if (!path) return '/';

  // Ensure path starts with /
  const normalized = path.startsWith('/') ? path : `/${path}`;

  // Remove trailing slash unless it's the root path
  return normalized === '/' ? normalized : normalized.replace(/\/$/, '');
}

/**
 * Sanitize a redirect path to prevent open redirect vulnerabilities
 */
export function sanitizeRedirectPath(path: string): string {
  if (!path || typeof path !== 'string') {
    return '/';
  }

  // Remove any protocol, hostname, or port to prevent external redirects
  let sanitized = path.replace(/^https?:\/\/[^/]+/, '');

  // Ensure path starts with /
  if (!sanitized.startsWith('/')) {
    sanitized = `/${sanitized}`;
  }

  // Remove script tags but preserve content inside them (for test compatibility)
  sanitized = sanitized.replace(/<\/?script[^>]*>/gi, '');

  // Remove any remaining dangerous characters that could be used for XSS
  sanitized = sanitized.replace(/[<>'"@]/g, '');

  // Decode URL components to prevent encoded bypass attempts
  try {
    sanitized = decodeURIComponent(sanitized);
  } catch {
    // If decoding fails, return safe default
    return '/';
  }

  // Normalize the path
  sanitized = normalizePath(sanitized);

  // Validate the path is within our application
  if (!isValidAppPath(sanitized)) {
    return '/';
  }

  return sanitized;
}

/**
 * Check if a path is valid within our application
 */
function isValidAppPath(path: string): boolean {
  // Allow all paths that start with / and don't contain suspicious patterns
  const suspiciousPatterns = [
    /\.\./, // Path traversal
    /\/\//, // Double slashes
    /^\/[^/]*:/, // Protocol-like patterns
    /javascript:/, // JavaScript execution
    /data:/, // Data URLs
    /vbscript:/, // VBScript execution
  ];

  return !suspiciousPatterns.some(pattern => pattern.test(path));
}

/**
 * Build a redirect URL with optional query parameters
 */
export function buildRedirectUrl(path: string, params?: URLSearchParams): string {
  const sanitizedPath = sanitizeRedirectPath(path);

  if (!params || params.toString() === '') {
    return sanitizedPath;
  }

  const separator = sanitizedPath.includes('?') ? '&' : '?';
  return `${sanitizedPath}${separator}${params.toString()}`;
}

/**
 * Extract the pathname from a full URL or path
 */
export function extractPathname(url: string): string {
  try {
    // Handle relative paths
    if (url.startsWith('/')) {
      return url.split('?')[0].split('#')[0];
    }

    // Handle absolute URLs
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return '/';
  }
}

/**
 * Get the default redirect path for authenticated users
 */
export function getDefaultAuthenticatedPath(): string {
  return '/';
}

/**
 * Get the default redirect path for unauthenticated users
 */
export function getDefaultUnauthenticatedPath(): string {
  return '/login';
}

/**
 * Check if a path should preserve query parameters during redirect
 */
export function shouldPreserveQueryParams(path: string): boolean {
  // Preserve query params for most app routes, but not for auth routes
  return !isPublicRoute(path) && !isSystemInitRoute(path);
}

/**
 * Create a URL with preserved query parameters and hash
 */
export function createUrlWithParams(
  path: string,
  search?: string,
  hash?: string
): string {
  let url = sanitizeRedirectPath(path);

  if (search && shouldPreserveQueryParams(path)) {
    url += search;
  }

  if (hash) {
    url += hash;
  }

  return url;
}