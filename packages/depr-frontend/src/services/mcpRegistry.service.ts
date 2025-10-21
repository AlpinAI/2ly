// Official registry OPENAPI Reference: (this is the one we consume)
// https://registry.modelcontextprotocol.io/openapi.yaml
// Generic registry OPENAPI Reference:
// https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/openapi.yaml
// JSON SCHEMA of API Responses
// https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/server.schema.json
import { apolloResolversTypes } from '@2ly/common';
import type { components } from '../types/mcp-registry';

export interface McpRegistry2lyMetadata {
    registryVersion: string;
}

type ServerResponse = components['schemas']['ServerResponse'];
type ServerList = components['schemas']['ServerListResponse'];
export type McpServerFromRegistry = ServerResponse;
export type McpServerConfig = components["schemas"]["Package"] | components["schemas"]["Transport"];

interface ListParams {
    limit: number;
    cursor?: string;
}

// Use dev proxy to avoid CORS; real base is https://registry.modelcontextprotocol.io
const DEFAULT_BASE_URL = '/mcp-registry/v0';
const REGISTRY_BASE_URL = (import.meta as unknown as { env: Record<string, string> }).env.VITE_MCP_REGISTRY_URL || DEFAULT_BASE_URL;

const SERVERS_PATH = '/servers';

function buildRequestUrl(path: string): URL {
    const base = REGISTRY_BASE_URL;
    const isAbsolute = /^https?:\/\//.test(base);
    return isAbsolute ? new URL(`${base}${path}`) : new URL(`${base}${path}`, window.location.origin);
}

export async function searchServers(query: string, params: ListParams): Promise<{ servers: McpServerFromRegistry[]; hasMore: boolean; nextCursor?: string }> {
    // Try primary search endpoint with 'search'
    const url = buildRequestUrl(SERVERS_PATH);
    if (query.length > 0) {
        url.searchParams.set('search', query);
    }
    if (params.cursor) {
        url.searchParams.set('cursor', params.cursor);
    }
    url.searchParams.set('limit', String(params.limit));
    url.searchParams.set('version', 'latest');

    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) throw new Error(`ERR_MCP_REGISTRY_SEARCH_FAILED:${res.status}`);

    const data = (await res.json()) as ServerList;
    const servers = data.servers ?? [];
    console.log('servers', servers);
    const hasMore = !!data.metadata.nextCursor;
    return { servers, hasMore, nextCursor: data.metadata.nextCursor };
}

interface ConfigurabePartBase {
    context: 'environment_variable' | 'package_argument' | 'header';
    name: string;
    description?: string;
    default?: string;
    value?: string;
    required?: boolean;
    secret?: boolean;
}

interface ConfigurableBoolean extends ConfigurabePartBase {
    type: 'boolean';

}

interface ConfigurableString extends ConfigurabePartBase {
    type: 'string';
}

interface ConfigurableChoices extends ConfigurabePartBase {
    type: 'choices';
    choices: string[];
}

export type ConfigurableParts = ConfigurableBoolean | ConfigurableString | ConfigurableChoices;

const isPackage = (config: McpServerConfig): config is components["schemas"]["Package"] => {
    return Object.keys(config).includes('registryType');
}

const isRemote = (config: McpServerConfig): config is components["schemas"]["Transport"] => {
    return Object.keys(config).includes('type');
}

export function isConfigurationSupported(config: McpServerConfig): boolean {
    if (isPackage(config)) {
        // only stdio transport is supported
        if (config.transport?.type !== 'stdio') {
            return false;
        }
        // Support npm, pypi, docker, and oci registries
        const supportedRegistries = [
            'https://registry.npmjs.org',
            'https://pypi.org',
            'https://hub.docker.com',
            'https://ghcr.io'
        ];
        if (config.registryBaseUrl && !supportedRegistries.includes(config.registryBaseUrl)) {
            return false;
        }
        return true;
    } else if (isRemote(config)) {
        // only streamable transport is supported
        if (config.type !== 'streamable') {
            return false;
        }
        return true;
    }
    return false;
}

export function extractConfigurableParts(config: McpServerConfig): ConfigurableParts[] {
    const parts: ConfigurableParts[] = [];

    if (isPackage(config)) {
        for (const arg of config.environmentVariables ?? []) {
            switch (arg.format) {
                case 'string':
                    if (arg.choices && arg.choices.length > 0) {
                        parts.push({ context: 'environment_variable', type: 'choices', name: arg.name, description: arg.description, default: String(arg.default ?? ''), required: arg.isRequired, choices: arg.choices.map((c) => String(c)) });
                    } else {
                        parts.push({ context: 'environment_variable', type: 'string', name: arg.name, description: arg.description, default: String(arg.default ?? ''), required: arg.isRequired, secret: arg.isSecret });
                    }
                    break;
                case 'boolean':
                    parts.push({ context: 'environment_variable', type: 'boolean', name: arg.name, description: arg.description, default: String(Boolean(arg.default)), required: arg.isRequired });
                    break;
                default:
                    console.error(`Unsupported format for environment variable: ${arg.format}`);
            }
        }
        for (const arg of config.packageArguments ?? []) {
            switch (arg.format) {
                case 'string':
                    parts.push({ context: 'package_argument', type: 'string', name: arg.name ?? '', description: arg.description, default: String(arg.default ?? ''), required: arg.isRequired, secret: arg.isSecret });
                    break;
                case 'boolean':
                    parts.push({ context: 'package_argument', type: 'boolean', name: arg.name ?? '', description: arg.description, default: String(arg.default ?? ''), required: arg.isRequired });
                    break;
                default:
                    console.error(`Unsupported format for package argument: ${arg.format}`);
            }
        }
    }
    else if (isRemote(config)) {
        for (const arg of config.headers ?? []) {
            switch (arg.format) {
                case 'string':
                    if (arg.choices && arg.choices.length > 0) {
                        parts.push({ context: 'header', type: 'choices', name: arg.name, description: arg.description, default: String(arg.default ?? ''), required: arg.isRequired, choices: arg.choices.map((c) => String(c)) });
                    } else {
                        parts.push({ context: 'header', type: 'string', name: arg.name, description: arg.description, default: String(arg.default ?? ''), required: arg.isRequired, secret: arg.isSecret });
                    }
                    break;
                default:
                    console.error(`Unsupported format for header: ${arg.format}`);
            }
        }
    }
    return parts;
}

export function mapConfig(serverResponse: McpServerFromRegistry, config: McpServerConfig, parts: ConfigurableParts[]): Partial<apolloResolversTypes.McpServer> {
    const server = serverResponse.server;
    const name = server.name;
    const description = server.description ?? '';
    const repositoryUrl = server.repository?.url ?? '';
    let transport = '';
    let command = '';
    const args: string[] = [];
    const ENV: Record<string, string> = {};
    let serverUrl = '';
    let headers = '';

    const configEnvValues = parts.filter(part => part.context === 'environment_variable').reduce((acc, part) => {
        acc[part.name] = part.value ?? part.default ?? null;
        return acc;
    }, {} as Record<string, string | null>);
    const configHeaderValues = parts.filter(part => part.context === 'header').reduce((acc, part) => {
        acc[part.name] = part.value ?? part.default ?? null;
        return acc;
    }, {} as Record<string, string | null>);
    const configPackageArgumentValues = parts.filter(part => part.context === 'package_argument').reduce((acc, part) => {
        acc[part.name] = part.value ?? part.default ?? null;
        return acc;
    }, {} as Record<string, string | null>);

    if (isPackage(config)) {
        transport = 'STDIO';

        switch (config.registryType) {
            case 'npm':
                if (config.registryBaseUrl !== 'https://registry.npmjs.org') {
                    throw new Error(`Unsupported registry base URL for package based MCP server: ${config.registryBaseUrl}`);
                }
                command = 'npx';
                args.push(`${config.identifier}@${config.version}`);
                for (const arg of config.packageArguments ?? []) {
                    const value = arg.name
                        ? (configPackageArgumentValues[arg.name] ?? arg.value ?? arg.default ?? '')
                        : (arg.value ?? arg.default ?? '');
                    switch (arg.type) {
                        case 'positional':
                            args.push(value);
                            break;
                        case 'named':
                            args.push(`--${arg.name}=${value}`);
                            break;
                        default:
                            throw new Error(`Unsupported argument type for package based MCP server: ${arg.type}`);
                    }
                }
                for (const env of config.environmentVariables ?? []) {
                    ENV[env.name] = configEnvValues[env.name] ?? env.value ?? '';
                }
                break;

            case 'pypi':
                command = 'uvx';
                args.push(config.identifier);
                for (const arg of config.packageArguments ?? []) {
                    const value = arg.name
                        ? (configPackageArgumentValues[arg.name] ?? arg.value ?? arg.default ?? '')
                        : (arg.value ?? arg.default ?? '');
                    switch (arg.type) {
                        case 'positional':
                            args.push(value);
                            break;
                        case 'named':
                            args.push(`--${arg.name}=${value}`);
                            break;
                        default:
                            throw new Error(`Unsupported argument type for package based MCP server: ${arg.type}`);
                    }
                }
                for (const env of config.environmentVariables ?? []) {
                    ENV[env.name] = configEnvValues[env.name] ?? env.value ?? '';
                }
                break;

            case 'docker':
            case 'oci': {
                command = 'docker';
                args.push('run');
                args.push('-i');
                args.push('--rm');

                // Add environment variables as -e flags
                for (const env of config.environmentVariables ?? []) {
                    const value = configEnvValues[env.name] ?? env.value ?? '';
                    if (value) {
                        args.push('-e');
                        args.push(env.name);
                        ENV[env.name] = value;
                    }
                }

                // Add the image identifier
                const imageUrl = config.registryType === 'oci'
                    ? `${config.registryBaseUrl}/${config.identifier}:${config.version}`
                    : `${config.identifier}:${config.version}`;
                args.push(imageUrl);

                // Add package arguments
                for (const arg of config.packageArguments ?? []) {
                    const value = arg.name
                        ? (configPackageArgumentValues[arg.name] ?? arg.value ?? arg.default ?? '')
                        : (arg.value ?? arg.default ?? '');
                    if (value) {
                        switch (arg.type) {
                            case 'positional':
                                args.push(value);
                                break;
                            case 'named':
                                args.push(`--${arg.name}=${value}`);
                                break;
                            default:
                                throw new Error(`Unsupported argument type for package based MCP server: ${arg.type}`);
                        }
                    }
                }
                break;
            }

            default:
                throw new Error(`Unsupported registry type for package based MCP server: ${config.registryType}`);
        }
    } else if (isRemote(config)) {
        switch (config.type) {
            case 'streamable': {
                transport = 'STREAM';
                serverUrl = config.url ?? '';

                // Format headers from configurable parts (key: value format)
                const headerEntries = Object.entries(configHeaderValues)
                    .filter(([, value]) => value !== null && value !== '')
                    .map(([key, value]) => `${key}: ${value}`);
                headers = headerEntries.join('\n');
                break;
            }
            default:
                throw new Error(`Unsupported remote transport type for remote based MCP server: ${config.type}`);
        }
    }
    return {
        name,
        description,
        repositoryUrl,
        transport: transport as apolloResolversTypes.McpTransportType,
        command,
        args: args.join(' '),
        ENV: Object.entries(ENV).map(([key, value]) => `${key}=${value}`).join('\n'),
        serverUrl,
        headers,
    };
}

export function getRegistryBaseUrl(): string {
    return REGISTRY_BASE_URL;
}


