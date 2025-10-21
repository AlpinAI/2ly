/**
 * System Initialization Service
 *
 * Service layer for system initialization operations, health checks,
 * and system status management. Integrates with the existing authentication
 * service and GraphQL operations.
 */

import { ApolloClient } from '@apollo/client/core';
import { AuthService } from './auth.service';
import {
  SYSTEM_STATUS_QUERY,
  type SystemStatusResponse,
  type System,
  type User,
  type Workspace,
} from '../graphql/auth.operations';

export interface SystemInitConfig {
  adminEmail: string;
  adminPassword: string;
  systemName?: string;
  systemDescription?: string;
}

export interface InitializationResult {
  success: boolean;
  system: System;
  user: User;
  workspace: Workspace;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface InitializationProgress {
  step: string;
  message: string;
  progress: number; // 0-100
  isComplete: boolean;
  error?: string;
}

export interface SystemStatus {
  initialized: boolean;
  version?: string;
  uptime?: number;
  health: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceStatus[];
  lastInitialized?: Date;
  system?: System;
  error?: string;
}

export interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  lastChecked: Date;
  responseTime?: number;
  error?: string;
}

export class SystemInitializationError extends Error {
  public readonly code: string;
  public readonly details?: string[];

  constructor(message: string, code: string = 'SYSTEM_INIT_ERROR', details?: string[]) {
    super(message);
    this.name = 'SystemInitializationError';
    this.code = code;
    this.details = details;
  }
}

export class SystemInitializationService {
  private apolloClient: ApolloClient<unknown>;
  private authService: AuthService;
  private progressListeners: ((progress: InitializationProgress) => void)[] = [];

  constructor(apolloClient: ApolloClient<unknown>, authService: AuthService) {
    this.apolloClient = apolloClient;
    this.authService = authService;
  }

  /**
   * Check the current system status and initialization state
   * @returns Current system status information
   */
  async checkSystemStatus(): Promise<SystemStatus> {
    try {
      const response = await this.apolloClient.query<SystemStatusResponse>({
        query: SYSTEM_STATUS_QUERY,
        errorPolicy: 'all',
        fetchPolicy: 'network-only', // Always check server for system status
      });

      if (response.errors) {
        console.warn('System status check had errors:', response.errors);
      }

      const system = response.data?.system;

      // For now, we'll construct a basic status response
      // This can be expanded when more detailed system health endpoints are available
      const status: SystemStatus = {
        initialized: system?.initialized ?? false,
        health: this.determineSystemHealth(system, response.errors),
        services: await this.checkServiceStatuses(),
        system: system || undefined,
        lastInitialized: system?.createdAt ? new Date(system.createdAt) : undefined,
      };

      return status;
    } catch (error) {
      console.error('System status check failed:', error);

      // Return unhealthy status on error
      return {
        initialized: false,
        health: 'unhealthy',
        services: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Initialize the system with the provided configuration
   * @param config System initialization configuration
   * @returns Initialization result with created resources
   */
  async initializeSystem(config: SystemInitConfig): Promise<InitializationResult> {
    try {
      // Validate configuration first
      const validation = await this.validateSystemConfig(config);
      if (!validation.isValid) {
        throw new SystemInitializationError(
          'Invalid system configuration',
          'VALIDATION_ERROR',
          validation.errors
        );
      }

      this.emitProgress({
        step: 'validation',
        message: 'Configuration validated successfully',
        progress: 20,
        isComplete: false,
      });

      // Check if system is already initialized
      const currentStatus = await this.checkSystemStatus();
      if (currentStatus.initialized) {
        throw new SystemInitializationError(
          'System has already been initialized',
          'ALREADY_INITIALIZED'
        );
      }

      this.emitProgress({
        step: 'initialization',
        message: 'Initializing system...',
        progress: 40,
        isComplete: false,
      });

      // Use the authentication service to initialize the system
      const authResult = await this.authService.initializeSystem(
        config.adminEmail,
        config.adminPassword
      );

      if (!authResult.success || !authResult.user || !authResult.accessToken || !authResult.refreshToken) {
        throw new SystemInitializationError(
          'System initialization failed',
          'INIT_FAILED',
          authResult.errors
        );
      }

      this.emitProgress({
        step: 'finalization',
        message: 'Finalizing setup...',
        progress: 80,
        isComplete: false,
      });

      // Get updated system status to return complete information
      const updatedStatus = await this.checkSystemStatus();

      this.emitProgress({
        step: 'complete',
        message: 'System initialization complete!',
        progress: 100,
        isComplete: true,
      });

      // Get the default workspace from the system or create a temporary one
      const workspace: Workspace = updatedStatus.system?.defaultWorkspace || {
        id: 'temp-workspace',
        name: 'Default Workspace',
        createdAt: new Date().toISOString(),
      };

      return {
        success: true,
        system: updatedStatus.system!,
        user: authResult.user,
        workspace,
        tokens: {
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken,
        },
      };
    } catch (error) {
      console.error('System initialization failed:', error);

      const errorMessage = error instanceof SystemInitializationError
        ? error.message
        : 'System initialization failed due to an unexpected error';

      this.emitProgress({
        step: 'error',
        message: errorMessage,
        progress: 0,
        isComplete: false,
        error: errorMessage,
      });

      if (error instanceof SystemInitializationError) {
        throw error;
      }

      throw new SystemInitializationError(
        errorMessage,
        'NETWORK_ERROR'
      );
    }
  }


  /**
   * Get real-time initialization progress updates
   * @param listener Function to call with progress updates
   * @returns Cleanup function to remove listener
   */
  onInitializationProgress(listener: (progress: InitializationProgress) => void): () => void {
    this.progressListeners.push(listener);

    return () => {
      const index = this.progressListeners.indexOf(listener);
      if (index > -1) {
        this.progressListeners.splice(index, 1);
      }
    };
  }

  /**
   * Validate the complete system configuration
   * @param config System configuration to validate
   * @returns Validation result
   */
  private async validateSystemConfig(config: SystemInitConfig): Promise<ValidationResult> {
    const errors: string[] = [];

    // Email validation
    if (!config.adminEmail || typeof config.adminEmail !== 'string') {
      errors.push('Admin email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.adminEmail.trim())) {
      errors.push('Admin email must be a valid email address');
    }

    // Password validation
    if (!config.adminPassword || typeof config.adminPassword !== 'string') {
      errors.push('Admin password is required');
    } else if (config.adminPassword.length < 8) {
      errors.push('Admin password must be at least 8 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Determine system health based on available information
   * @param system System data from GraphQL
   * @param errors Any GraphQL errors
   * @returns Health status
   */
  private determineSystemHealth(system: System | null | undefined, errors?: readonly unknown[]): 'healthy' | 'degraded' | 'unhealthy' {
    if (errors && errors.length > 0) {
      return 'degraded';
    }

    if (!system) {
      return 'unhealthy';
    }

    if (system.initialized) {
      return 'healthy';
    }

    return 'unhealthy';
  }

  /**
   * Check the status of various system services
   * @returns Array of service status information
   */
  private async checkServiceStatuses(): Promise<ServiceStatus[]> {
    const services: ServiceStatus[] = [];
    const now = new Date();

    // GraphQL API Service
    try {
      const startTime = Date.now();
      await this.apolloClient.query({
        query: SYSTEM_STATUS_QUERY,
        fetchPolicy: 'network-only',
      });

      services.push({
        name: 'GraphQL API',
        status: 'online',
        lastChecked: now,
        responseTime: Date.now() - startTime,
      });
    } catch (error) {
      services.push({
        name: 'GraphQL API',
        status: 'offline',
        lastChecked: now,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Add more service checks as needed (database, NATS, etc.)
    // These would require additional endpoints or service discovery

    return services;
  }

  /**
   * Emit progress update to all listeners
   * @param progress Progress information to emit
   */
  private emitProgress(progress: InitializationProgress): void {
    this.progressListeners.forEach(listener => {
      try {
        listener(progress);
      } catch (error) {
        console.error('Error in progress listener:', error);
      }
    });
  }
}

// Singleton instance for use throughout the application
let _systemServiceInstance: SystemInitializationService | null = null;

/**
 * Factory function to create or get the SystemInitializationService singleton
 */
export const getSystemInitializationService = (
  apolloClient?: ApolloClient<unknown>,
  authService?: AuthService
): SystemInitializationService => {
  if (!_systemServiceInstance) {
    if (!apolloClient || !authService) {
      throw new Error('SystemInitializationService requires Apollo Client and AuthService for initialization');
    }
    _systemServiceInstance = new SystemInitializationService(apolloClient, authService);
  }
  return _systemServiceInstance;
};

/**
 * Reset the singleton instance (useful for testing)
 */
export const resetSystemInitializationService = (): void => {
  _systemServiceInstance = null;
};