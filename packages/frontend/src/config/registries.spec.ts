import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { REGISTRY_CONFIGURATIONS } from './registries';

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const NGINX_CONFIG_PATH = join(CURRENT_DIR, '../../nginx.conf');

interface NginxProxyLocation {
  readonly path: string;
  readonly proxyPass: string;
}

function getProxyBasePath(proxyPath: string): string {
  const parts = proxyPath.split('/').filter(Boolean);
  return parts.length > 0 ? `/${parts[0]}` : proxyPath;
}

function getUpstreamBase(upstreamUrl: string): string {
  try {
    const url = new URL(upstreamUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return upstreamUrl;
  }
}

function parseNginxProxyLocations(nginxContent: string): NginxProxyLocation[] {
  const locations: NginxProxyLocation[] = [];
  const lines = nginxContent.split('\n');
  
  let currentLocation: string | null = null;
  let braceDepth = 0;
  let locationBlock = '';
  
  for (const line of lines) {
    const locationMatch = /location\s+\^~\s+(\/[^/\s]+\/)/.exec(line);
    if (locationMatch) {
      currentLocation = locationMatch[1].replace(/\/$/, '');
      locationBlock = '';
      braceDepth = 0;
    }
    
    if (currentLocation !== null) {
      locationBlock += line + '\n';
      
      braceDepth += (line.match(/\{/g) || []).length;
      braceDepth -= (line.match(/\}/g) || []).length;
      
      if (braceDepth === 0 && locationBlock.includes('{')) {
        const proxyPassMatch = /proxy_pass\s+([^;]+);/.exec(locationBlock);
        if (proxyPassMatch) {
          locations.push({
            path: currentLocation,
            proxyPass: proxyPassMatch[1].trim(),
          });
        }
        currentLocation = null;
        locationBlock = '';
      }
    }
  }
  
  return locations;
}

describe('Registry Configuration Sync', () => {
  const nginxContent = readFileSync(NGINX_CONFIG_PATH, 'utf-8');
  const nginxProxyLocations = parseNginxProxyLocations(nginxContent);

  it('should have nginx location blocks for all proxied registries', () => {
    const proxiedRegistries = REGISTRY_CONFIGURATIONS.filter(
      (registry) => registry.proxyPath !== null
    );

    for (const registry of proxiedRegistries) {
      const proxyBasePath = getProxyBasePath(registry.proxyPath!);
      const nginxLocation = nginxProxyLocations.find(
        (location) => location.path === proxyBasePath
      );

      expect(
        nginxLocation,
        `Expected nginx.conf to contain location block for ${proxyBasePath} (registry: ${registry.name}). Please update nginx.conf to match registries.ts`
      ).toBeDefined();
    }
  });

  it('should have correct proxy_pass targets in nginx', () => {
    const proxiedRegistries = REGISTRY_CONFIGURATIONS.filter(
      (registry) => registry.proxyPath !== null
    );

    for (const registry of proxiedRegistries) {
      const proxyBasePath = getProxyBasePath(registry.proxyPath!);
      const nginxLocation = nginxProxyLocations.find(
        (location) => location.path === proxyBasePath
      );

      if (nginxLocation) {
        const expectedUpstreamBase = getUpstreamBase(registry.upstreamUrl);
        
        expect(
          nginxLocation.proxyPass,
          `Expected nginx proxy_pass for ${proxyBasePath} to be ${expectedUpstreamBase} but got ${nginxLocation.proxyPass}. Please update nginx.conf to match registries.ts`
        ).toBe(expectedUpstreamBase);
      }
    }
  });

  it('should not have orphaned nginx proxies', () => {
    const registryProxyPaths = REGISTRY_CONFIGURATIONS
      .filter((registry) => registry.proxyPath !== null)
      .map((registry) => getProxyBasePath(registry.proxyPath!));

    for (const nginxLocation of nginxProxyLocations) {
      const isDefinedInRegistry = registryProxyPaths.includes(nginxLocation.path);
      
      expect(
        isDefinedInRegistry,
        `Found nginx location block for ${nginxLocation.path} but no corresponding registry in registries.ts. Please remove from nginx.conf or add to registries.ts`
      ).toBe(true);
    }
  });
});

