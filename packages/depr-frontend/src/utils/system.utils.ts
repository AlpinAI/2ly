/**
 * System Utilities
 *
 * Utility functions for system status operations, validation, and formatting.
 * Provides helper functions for system requirements, health checks, and data formatting.
 */

import { SystemStatus, ServiceStatus } from '../services/system.service';

export interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

export interface SystemRequirements {
  browserSupported: boolean;
  javascriptEnabled: boolean;
  localStorageAvailable: boolean;
  cookiesEnabled: boolean;
  webSocketSupported: boolean;
}

/**
 * Parse a semantic version string into structured version info
 * @param version Version string (e.g., "1.2.3", "2.0.0-beta.1", "1.0.0+build.123")
 * @returns Structured version information
 */
export const parseSystemVersion = (version: string): VersionInfo => {
  const versionRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9\-.]+))?(?:\+([a-zA-Z0-9\-.]+))?$/;
  const match = version.match(versionRegex);

  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || undefined,
    build: match[5] || undefined,
  };
};

/**
 * Calculate and format system uptime from start time
 * @param startTime Start time of the system
 * @returns Formatted uptime string
 */
export const calculateUptime = (startTime: Date): string => {
  const now = new Date();
  const uptimeMs = now.getTime() - startTime.getTime();

  if (uptimeMs < 0) {
    return 'Unknown';
  }

  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days} day${days !== 1 ? 's' : ''}${remainingHours > 0 ? `, ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}` : ''}`;
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours !== 1 ? 's' : ''}${remainingMinutes > 0 ? `, ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}` : ''}`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes} minute${minutes !== 1 ? 's' : ''}${remainingSeconds > 0 ? `, ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}` : ''}`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
};

/**
 * Validate system health based on status information
 * @param status System status object
 * @returns True if system is considered healthy
 */
export const validateSystemHealth = (status: SystemStatus): boolean => {
  // Check overall health status
  if (status.health === 'unhealthy') {
    return false;
  }

  // Check if system is initialized (required for health)
  if (!status.initialized) {
    return false;
  }

  // Check service statuses
  const criticalServices = status.services.filter(service =>
    service.name === 'GraphQL API' ||
    service.name === 'Database' ||
    service.name === 'Authentication'
  );

  // All critical services must be online
  const criticalServicesHealthy = criticalServices.every(service =>
    service.status === 'online'
  );

  if (!criticalServicesHealthy) {
    return false;
  }

  // Check for excessive response times
  const slowServices = status.services.filter(service =>
    service.responseTime && service.responseTime > 5000 // 5 seconds
  );

  // Too many slow services indicate degraded performance
  if (slowServices.length > status.services.length / 2) {
    return false;
  }

  return true;
};

/**
 * Format system status information into a human-readable string
 * @param status System status object
 * @returns Formatted system information string
 */
export const formatSystemInfo = (status: SystemStatus): string => {
  const parts: string[] = [];

  // Status
  parts.push(`Status: ${status.initialized ? 'Initialized' : 'Not Initialized'}`);

  // Health
  const healthEmoji = {
    healthy: '🟢',
    degraded: '🟡',
    unhealthy: '🔴',
  }[status.health];
  parts.push(`Health: ${healthEmoji} ${status.health.charAt(0).toUpperCase() + status.health.slice(1)}`);

  // Version
  if (status.version) {
    parts.push(`Version: ${status.version}`);
  }

  // Uptime
  if (status.uptime) {
    const uptimeString = calculateUptime(new Date(Date.now() - status.uptime));
    parts.push(`Uptime: ${uptimeString}`);
  }

  // Services
  if (status.services.length > 0) {
    const onlineServices = status.services.filter(s => s.status === 'online').length;
    parts.push(`Services: ${onlineServices}/${status.services.length} online`);
  }

  return parts.join(' | ');
};

/**
 * Check browser and environment requirements
 * @returns Object with requirement check results
 */
export const checkSystemRequirements = (): SystemRequirements => {
  const requirements: SystemRequirements = {
    browserSupported: true,
    javascriptEnabled: true, // If this runs, JavaScript is enabled
    localStorageAvailable: false,
    cookiesEnabled: false,
    webSocketSupported: false,
  };

  // Check localStorage availability
  try {
    const testKey = '__system_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    requirements.localStorageAvailable = true;
  } catch (error) {
    console.warn('localStorage is not available:', error);
  }

  // Check cookies enabled
  try {
    document.cookie = '__system_cookie_test__=test; path=/';
    const cookiesEnabled = document.cookie.indexOf('__system_cookie_test__=test') !== -1;
    requirements.cookiesEnabled = cookiesEnabled;

    // Clean up test cookie
    if (cookiesEnabled) {
      document.cookie = '__system_cookie_test__=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }
  } catch (error) {
    console.warn('Cookie check failed:', error);
  }

  // Check WebSocket support
  requirements.webSocketSupported = typeof WebSocket !== 'undefined';

  // Check browser support (basic feature detection)
  try {
    // Check for modern JavaScript features we depend on
    const hasPromise = typeof Promise !== 'undefined';
    const hasFetch = typeof fetch !== 'undefined';
    const hasWeakMap = typeof WeakMap !== 'undefined';
    const hasSymbol = typeof Symbol !== 'undefined';

    requirements.browserSupported = hasPromise && hasFetch && hasWeakMap && hasSymbol;
  } catch (error) {
    console.warn('Browser feature detection failed:', error);
    requirements.browserSupported = false;
  }

  return requirements;
};

/**
 * Get browser information for debugging and support
 * @returns Object with browser and environment information
 */
export const getBrowserInfo = (): {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  viewportSize: string;
  timezone: string;
  cookieEnabled: boolean;
  onlineStatus: boolean;
} => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cookieEnabled: navigator.cookieEnabled,
    onlineStatus: navigator.onLine,
  };
};

/**
 * Generate a system health report for debugging
 * @param status System status object
 * @returns Comprehensive health report
 */
export const generateHealthReport = (status: SystemStatus): {
  summary: string;
  requirements: SystemRequirements;
  browserInfo: ReturnType<typeof getBrowserInfo>;
  services: ServiceStatus[];
  recommendations: string[];
  timestamp: Date;
} => {
  const requirements = checkSystemRequirements();
  const browserInfo = getBrowserInfo();
  const recommendations: string[] = [];

  // Generate recommendations based on status
  if (!status.initialized) {
    recommendations.push('System needs to be initialized');
  }

  if (status.health !== 'healthy') {
    recommendations.push('Check system services and connectivity');
  }

  if (!requirements.localStorageAvailable) {
    recommendations.push('Enable localStorage for full functionality');
  }

  if (!requirements.cookiesEnabled) {
    recommendations.push('Enable cookies for authentication features');
  }

  if (!requirements.webSocketSupported) {
    recommendations.push('Upgrade browser for real-time features');
  }

  const offlineServices = status.services.filter(s => s.status === 'offline');
  if (offlineServices.length > 0) {
    recommendations.push(`Restore offline services: ${offlineServices.map(s => s.name).join(', ')}`);
  }

  const slowServices = status.services.filter(s => s.responseTime && s.responseTime > 2000);
  if (slowServices.length > 0) {
    recommendations.push(`Investigate slow services: ${slowServices.map(s => s.name).join(', ')}`);
  }

  return {
    summary: formatSystemInfo(status),
    requirements,
    browserInfo,
    services: status.services,
    recommendations,
    timestamp: new Date(),
  };
};