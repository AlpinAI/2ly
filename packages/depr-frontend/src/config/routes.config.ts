/**
 * Route Configuration
 *
 * Centralized route configuration with authentication metadata.
 * Defines route permissions, requirements, and metadata for the application.
 */

export interface RouteConfig {
  path: string;
  authRequired: boolean;
  systemInitRequired?: boolean;
  workspaceRequired?: boolean;
  roles?: string[];
  redirect?: {
    authenticated: string;
    unauthenticated: string;
  };
  meta?: {
    title: string;
    description?: string;
    breadcrumb?: string;
    icon?: string;
  };
  children?: RouteConfig[];
}

/**
 * Main application route configuration
 */
export const routeConfig: RouteConfig[] = [
  // Public routes (no authentication required)
  {
    path: '/landing',
    authRequired: false,
    meta: {
      title: '2ly - AI Tool Management',
      description: 'Welcome to 2LY, the AI tool management platform',
      breadcrumb: 'Home'
    }
  },

  // Authentication routes (redirect authenticated users)
  {
    path: '/login',
    authRequired: false,
    redirect: {
      authenticated: '/',
      unauthenticated: '/login'
    },
    meta: {
      title: 'Login - 2ly',
      description: 'Sign in to your 2LY account',
      breadcrumb: 'Login'
    }
  },
  {
    path: '/register',
    authRequired: false,
    redirect: {
      authenticated: '/',
      unauthenticated: '/register'
    },
    meta: {
      title: 'Register - 2ly',
      description: 'Create a new 2ly account',
      breadcrumb: 'Register'
    }
  },

  // System initialization route
  {
    path: '/welcome',
    authRequired: false, // Can be accessed without auth for initial setup
    systemInitRequired: false, // This route handles system initialization
    meta: {
      title: 'Welcome - 2ly',
      description: 'Set up your 2ly workspace',
      breadcrumb: 'Welcome'
    }
  },

  // Protected routes (require authentication)
  {
    path: '/',
    authRequired: true,
    workspaceRequired: true,
    redirect: {
      authenticated: '/',
      unauthenticated: '/login'
    },
    meta: {
      title: '2ly Dashboard',
      description: 'Main dashboard',
      breadcrumb: 'Home'
    }
  },

  // MCP Servers
  {
    path: '/mcp-servers',
    authRequired: true,
    workspaceRequired: true,
    meta: {
      title: 'MCP Servers - 2ly',
      description: 'Manage your Model Context Protocol servers',
      breadcrumb: 'MCP Servers',
      icon: 'server'
    },
    children: [
      {
        path: '/mcp-servers/new',
        authRequired: true,
        workspaceRequired: true,
        meta: {
          title: 'Add MCP Server - 2ly',
          description: 'Add a new MCP server',
          breadcrumb: 'Add Server'
        }
      }
    ]
  },

  // Dashboard
  {
    path: '/dashboard',
    authRequired: true,
    workspaceRequired: true,
    meta: {
      title: 'Dashboard - 2ly',
      description: 'System dashboard and analytics',
      breadcrumb: 'Dashboard',
      icon: 'chart'
    }
  },

  // Agents
  {
    path: '/agents',
    authRequired: true,
    workspaceRequired: true,
    meta: {
      title: 'Agents - 2ly',
      description: 'Manage your AI agents',
      breadcrumb: 'Agents',
      icon: 'robot'
    },
    children: [
      {
        path: '/agents/new',
        authRequired: true,
        workspaceRequired: true,
        meta: {
          title: 'Add Agent - 2ly',
          description: 'Create a new AI agent',
          breadcrumb: 'Add Agent'
        }
      },
      {
        path: '/agents/:runtimeId/capabilities',
        authRequired: true,
        workspaceRequired: true,
        meta: {
          title: 'Agent Capabilities - 2ly',
          description: 'Configure agent capabilities',
          breadcrumb: 'Capabilities'
        }
      }
    ]
  },

  // Runtimes
  {
    path: '/runtimes',
    authRequired: true,
    workspaceRequired: true,
    meta: {
      title: 'Runtimes - 2ly',
      description: 'Manage runtime environments',
      breadcrumb: 'Runtimes',
      icon: 'cpu'
    }
  },

  // Recipes
  {
    path: '/recipes',
    authRequired: true,
    workspaceRequired: true,
    meta: {
      title: 'Recipes - 2ly',
      description: 'AI workflow recipes',
      breadcrumb: 'Recipes',
      icon: 'book'
    }
  },

  // Monitoring
  {
    path: '/monitoring',
    authRequired: true,
    workspaceRequired: true,
    meta: {
      title: 'Monitoring - 2ly',
      description: 'System monitoring and logs',
      breadcrumb: 'Monitoring',
      icon: 'activity'
    }
  },

  // Integration
  {
    path: '/integration',
    authRequired: true,
    workspaceRequired: true,
    meta: {
      title: 'Integration - 2ly',
      description: 'Third-party integrations',
      breadcrumb: 'Integration',
      icon: 'link'
    }
  },

  // Settings
  {
    path: '/settings',
    authRequired: true,
    workspaceRequired: false, // Settings might be accessible without workspace
    meta: {
      title: 'Settings - 2ly',
      description: 'Application settings',
      breadcrumb: 'Settings',
      icon: 'settings'
    }
  }
];

/**
 * Utility functions for route configuration
 */

/**
 * Find route configuration by path
 */
export function findRouteConfig(path: string): RouteConfig | undefined {
  // Normalize path
  const normalizedPath = path.replace(/\/+$/, '') || '/';

  function searchRoutes(routes: RouteConfig[]): RouteConfig | undefined {
    for (const route of routes) {
      if (route.path === normalizedPath) {
        return route;
      }

      // Check children
      if (route.children) {
        const childResult = searchRoutes(route.children);
        if (childResult) {
          return childResult;
        }
      }

      // Check pattern matching for dynamic routes
      if (route.path.includes(':')) {
        const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${routePattern}$`);
        if (regex.test(normalizedPath)) {
          return route;
        }
      }
    }

    return undefined;
  }

  return searchRoutes(routeConfig);
}

/**
 * Get route metadata for a given path
 */
export function getRouteMetadata(path: string) {
  const config = findRouteConfig(path);
  return config?.meta || null;
}

/**
 * Check if route requires authentication
 */
export function routeRequiresAuth(path: string): boolean {
  const config = findRouteConfig(path);
  return config?.authRequired ?? false;
}

/**
 * Check if route requires workspace
 */
export function routeRequiresWorkspace(path: string): boolean {
  const config = findRouteConfig(path);
  return config?.workspaceRequired ?? false;
}

/**
 * Check if route requires system initialization
 */
export function routeRequiresSystemInit(path: string): boolean {
  const config = findRouteConfig(path);
  return config?.systemInitRequired ?? false;
}

/**
 * Get redirect configuration for a route
 */
export function getRouteRedirect(path: string, isAuthenticated: boolean): string | undefined {
  const config = findRouteConfig(path);
  if (!config?.redirect) {
    return undefined;
  }

  return isAuthenticated ? config.redirect.authenticated : config.redirect.unauthenticated;
}

/**
 * Get all routes that match a specific criteria
 */
export function getRoutesByProperty<K extends keyof RouteConfig>(
  property: K,
  value: RouteConfig[K]
): RouteConfig[] {
  const results: RouteConfig[] = [];

  function searchRoutes(routes: RouteConfig[]): void {
    for (const route of routes) {
      if (route[property] === value) {
        results.push(route);
      }

      if (route.children) {
        searchRoutes(route.children);
      }
    }
  }

  searchRoutes(routeConfig);
  return results;
}

/**
 * Get navigation menu items (routes with metadata)
 */
export function getNavigationRoutes(): RouteConfig[] {
  return routeConfig.filter(route =>
    route.authRequired &&
    route.meta &&
    !route.path.includes(':') &&
    route.path !== '/'
  );
}

/**
 * Build breadcrumb trail for a given path
 */
export function buildBreadcrumbs(path: string): Array<{
  label: string;
  path: string;
}> {
  const breadcrumbs: Array<{ label: string; path: string }> = [];
  const pathSegments = path.split('/').filter(Boolean);

  let currentPath = '';

  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    const config = findRouteConfig(currentPath);

    if (config?.meta?.breadcrumb) {
      breadcrumbs.push({
        label: config.meta.breadcrumb,
        path: currentPath
      });
    }
  }

  return breadcrumbs;
}

/**
 * Validate route configuration at build time
 */
export function validateRouteConfig(): string[] {
  const errors: string[] = [];

  function validateRoutes(routes: RouteConfig[], parentPath = ''): void {
    for (const route of routes) {
      const fullPath = parentPath + route.path;

      // Check for valid path format
      if (!route.path.startsWith('/')) {
        errors.push(`Route path must start with '/': ${route.path}`);
      }

      // Check for required meta information on protected routes
      if (route.authRequired && !route.meta) {
        errors.push(`Protected route missing metadata: ${fullPath}`);
      }

      // Validate redirect configuration
      if (route.redirect) {
        if (!route.redirect.authenticated || !route.redirect.unauthenticated) {
          errors.push(`Incomplete redirect configuration: ${fullPath}`);
        }
      }

      // Validate children
      if (route.children) {
        validateRoutes(route.children, fullPath);
      }
    }
  }

  validateRoutes(routeConfig);
  return errors;
}

// Validate configuration in development
if (process.env.NODE_ENV === 'development') {
  const errors = validateRouteConfig();
  if (errors.length > 0) {
    console.warn('Route configuration errors:', errors);
  }
}