interface RegistryConfiguration {
  readonly id: string;
  readonly name: string;
  readonly upstreamUrl: string;
  readonly proxyPath: string | null;
}

export const REGISTRY_CONFIGURATIONS: readonly RegistryConfiguration[] = [
  {
    id: 'official',
    name: 'Official MCP Registry',
    upstreamUrl: 'https://registry.modelcontextprotocol.io/v0/servers',
    proxyPath: '/mcp-registry/v0/servers',
  },
  {
    id: 'github',
    name: 'Github MCP Registry',
    upstreamUrl: 'https://api.mcp.github.com/v0.1/servers',
    proxyPath: null,
  },
] as const;

export const CUSTOM_REGISTRY_ID = 'custom';

export function getRegistryUrl(registryId: string, customUrl?: string): string {
  if (registryId === CUSTOM_REGISTRY_ID) {
    return customUrl || '';
  }

  const registry = REGISTRY_CONFIGURATIONS.find((r) => r.id === registryId);
  if (!registry) {
    throw new Error(`Registry with id "${registryId}" not found`);
  }

  return registry.proxyPath || registry.upstreamUrl;
}

export function getRegistryById(registryId: string): RegistryConfiguration | undefined {
  return REGISTRY_CONFIGURATIONS.find((r) => r.id === registryId);
}
