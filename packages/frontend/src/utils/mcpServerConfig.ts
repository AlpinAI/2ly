import { apolloResolversTypes } from '@2ly/common';

/**
 * Extended McpServer type that includes parsed config properties
 */
export interface McpServerWithConfig extends apolloResolversTypes.McpServer {
  command?: string;
  args?: string;
  ENV?: string;
  serverUrl?: string;
  headers?: string;
}

/**
 * Parsed config structure for STDIO transport
 */
interface StdioConfig {
  identifier?: string;
  packageArguments?: Array<{ name?: string; value?: string }>;
  runtimeArguments?: Array<{ name?: string; value?: string }>;
  environmentVariables?: Array<{ name?: string; value?: string }>;
  registryType?: string;
}

/**
 * Parsed config structure for SSE/STREAM transport
 */
interface TransportConfig {
  type?: string;
  url?: string;
  headers?: Array<{ name?: string; value?: string }>;
}

/**
 * Parse the config field of an McpServer and extract the relevant properties
 */
export function parseMcpServerConfig(server: apolloResolversTypes.McpServer): McpServerWithConfig {
  const result: McpServerWithConfig = { ...server };

  try {
    const config = JSON.parse(server.config);
    
    if (server.transport === apolloResolversTypes.McpTransportType.Stdio) {
      const stdioConfig = config as StdioConfig;
      
      // Extract command from registry type
      let command = '';
      switch (stdioConfig.registryType) {
        case 'npm':
          command = 'npx';
          break;
        case 'pypi':
          command = 'uvx';
          break;
        case 'nuget':
          command = 'dnx';
          break;
        case 'oci':
          command = 'docker';
          break;
        default:
          command = 'unknown';
      }
      
      // Build args array
      const args: string[] = [];
      
      // Add runtime arguments
      if (stdioConfig.runtimeArguments) {
        stdioConfig.runtimeArguments.forEach((arg) => {
          if (arg.name) {
            args.push(`--${arg.name}`);
            if (arg.value) {
              args.push(String(arg.value));
            }
          } else if (arg.value) {
            args.push(String(arg.value));
          }
        });
      }
      
      // Add docker 'run' subcommand for OCI containers
      if (stdioConfig.registryType === 'oci') {
        args.push('run');
      }
      
      // Add package identifier
      if (stdioConfig.identifier) {
        const normalizedIdentifier = stdioConfig.identifier.replace(/^npm:/, '');
        args.push(normalizedIdentifier);
      }
      
      // Add package arguments
      if (stdioConfig.packageArguments) {
        stdioConfig.packageArguments.forEach((arg) => {
          if (arg.type === 'named' && arg.name) {
            args.push(`--${arg.name}`);
            if (arg.value) {
              args.push(String(arg.value));
            }
          } else if (arg.value) {
            args.push(String(arg.value));
          }
        });
      }
      
      // Build environment variables
      const envVars: string[] = [];
      if (stdioConfig.environmentVariables) {
        stdioConfig.environmentVariables.forEach((envVar) => {
          if (envVar.name && envVar.value) {
            envVars.push(`${envVar.name}=${envVar.value}`);
          }
        });
      }
      
      result.command = command;
      result.args = args.join(' ');
      result.ENV = envVars.join('\n');
      
    } else if (server.transport === apolloResolversTypes.McpTransportType.Sse || 
               server.transport === apolloResolversTypes.McpTransportType.Stream) {
      const transportConfig = config as TransportConfig;
      
      result.serverUrl = transportConfig.url || '';
      
      // Build headers string
      const headerEntries: string[] = [];
      if (transportConfig.headers) {
        transportConfig.headers.forEach((header) => {
          if (header.name && header.value) {
            headerEntries.push(`${header.name}: ${header.value}`);
          }
        });
      }
      result.headers = headerEntries.join('\n');
    }
    
  } catch (error) {
    console.warn(`Failed to parse config for server ${server.name}:`, error);
  }
  
  return result;
}

/**
 * Parse multiple McpServer objects
 */
export function parseMcpServerConfigs(servers: apolloResolversTypes.McpServer[]): McpServerWithConfig[] {
  return servers.map(parseMcpServerConfig);
}

/**
 * Build config JSON string from form data
 */
export function buildConfigFromFormData(formData: {
  command?: string;
  args?: string;
  ENV?: string;
  serverUrl?: string;
  headers?: string;
  transport: apolloResolversTypes.McpTransportType;
}): string {
  if (formData.transport === apolloResolversTypes.McpTransportType.Stdio) {
    // For STDIO transport, build a Package config
    const config: StdioConfig = {
      identifier: 'placeholder', // This should be set from the server selection
      registryType: 'npm', // This should be determined from the command
    };
    
    // Parse args into runtime and package arguments
    if (formData.args) {
      const args = formData.args.split(' ');
      config.runtimeArguments = args.map(arg => ({ value: arg }));
    }
    
    // Parse environment variables
    if (formData.ENV) {
      config.environmentVariables = formData.ENV.split('\n').map(env => {
        const [name, value] = env.split('=');
        return { name, value };
      }).filter(env => env.name && env.value);
    }
    
    return JSON.stringify(config);
  } else {
    // For SSE/STREAM transport, build a Transport config
    const config: TransportConfig = {
      type: formData.transport === apolloResolversTypes.McpTransportType.Sse ? 'sse' : 'streamableHttp',
      url: formData.serverUrl,
    };
    
    // Parse headers
    if (formData.headers) {
      config.headers = formData.headers.split('\n').map(header => {
        const [name, value] = header.split(': ');
        return { name, value };
      }).filter(header => header.name && header.value);
    }
    
    return JSON.stringify(config);
  }
}
