import { injectable, inject } from 'inversify';
import { readFileSync } from 'fs';
import path from 'path';
import { DGraphService } from '../services/dgraph.service';
import { dgraphResolversTypes, mcpRegistry } from '@2ly/common';
import {
  ADD_MCP_REGISTRY,
  GET_MCP_REGISTRY,
  QUERY_WORKSPACE_WITH_REGISTRIES,
  DELETE_REGISTRY_SERVERS,
  DELETE_MCP_REGISTRY,
  UPSERT_REGISTRY_SERVER,
  UPDATE_REGISTRY_LAST_SYNC,
  UPDATE_REGISTRY_SERVER_LAST_SEEN,
  QUERY_REGISTRY_SERVER_BY_NAME,
} from './registry.operations';

// Use generated types from MCP Registry OpenAPI schema
type UpstreamResponse = mcpRegistry.components['schemas']['ServerListResponse'];
type UpstreamServer = mcpRegistry.components['schemas']['ServerResponse'];

@injectable()
export class RegistryRepository {
  constructor(@inject(DGraphService) private readonly dgraphService: DGraphService) { }

  getDefaultRegistryPath(): string {
    return path.join(__dirname, '..', 'data', 'mcp-server-catalog.json');
  }

  async getRegistry(path: string, type: 'local' | 'remote'): Promise<string> {
    if (type === 'local') {
      return readFileSync(path, 'utf-8');
    }
    return fetch(path).then(res => res.text());
  }

  async createRegistry(workspaceId: string, name: string, upstreamUrl: string): Promise<dgraphResolversTypes.McpRegistry> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation<{
      addMCPRegistry: { mCPRegistry: dgraphResolversTypes.McpRegistry[] };
    }>(ADD_MCP_REGISTRY, {
      name,
      upstreamUrl,
      workspaceId,
      now,
    });
    return res.addMCPRegistry.mCPRegistry[0];
  }

  async findByWorkspace(workspaceId: string): Promise<dgraphResolversTypes.McpRegistry[]> {
    const res = await this.dgraphService.query<{
      getWorkspace: { mcpRegistries: dgraphResolversTypes.McpRegistry[] };
    }>(QUERY_WORKSPACE_WITH_REGISTRIES, { workspaceId });
    return res.getWorkspace.mcpRegistries || [];
  }

  async deleteRegistry(id: string): Promise<dgraphResolversTypes.McpRegistry> {
    // Get all servers to delete
    const registry = await this.dgraphService.query<{
      getMCPRegistry: dgraphResolversTypes.McpRegistry;
    }>(GET_MCP_REGISTRY, { id });

    const serverIds = registry.getMCPRegistry.servers?.map((server) => server.id) ?? [];

    // Delete all servers linked to the registry
    if (serverIds.length > 0) {
      await this.dgraphService.mutation(DELETE_REGISTRY_SERVERS, {
        ids: serverIds,
      });
    }

    // Delete the registry
    const res = await this.dgraphService.mutation<{
      deleteMCPRegistry: { mCPRegistry: dgraphResolversTypes.McpRegistry[] };
    }>(DELETE_MCP_REGISTRY, { id });

    return res.deleteMCPRegistry.mCPRegistry[0];
  }

  async syncUpstream(registryId: string): Promise<dgraphResolversTypes.McpRegistry> {
    // Fetch registry details
    const registry = await this.dgraphService.query<{
      getMCPRegistry: dgraphResolversTypes.McpRegistry;
    }>(GET_MCP_REGISTRY, { id: registryId });

    const registryData = registry.getMCPRegistry;
    if (!registryData) {
      throw new Error('Registry not found');
    }

    const upstreamUrl = registryData.upstreamUrl;
    let cursor: string | undefined;
    let allServers: UpstreamServer[] = [];

    // Fetch all pages from upstream
    do {
      const url = new URL(upstreamUrl);
      url.searchParams.set('limit', '100');
      if (cursor) {
        url.searchParams.set('cursor', cursor);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch from upstream: ${response.statusText}`);
      }

      const data: UpstreamResponse = await response.json();
      allServers = allServers.concat(data.servers ?? []);
      cursor = data.metadata.nextCursor;
    } while (cursor);

    // Upsert each server
    const now = new Date().toISOString();
    for (const serverResponse of allServers) {
      const server = serverResponse.server;
      if (!server) {
        continue;
      }
      // Check if server already exists
      const existingServers = await this.dgraphService.query<{
        queryMCPRegistryServer: dgraphResolversTypes.McpRegistryServer[];
      }>(QUERY_REGISTRY_SERVER_BY_NAME, { name: server.name });

      const existingServer = existingServers?.queryMCPRegistryServer?.find(
        s => s.registry?.id === registryId
      );

      if (existingServer) {
        // Update lastSeenAt
        await this.dgraphService.mutation(UPDATE_REGISTRY_SERVER_LAST_SEEN, {
          id: existingServer.id,
          lastSeenAt: now,
        });
      } else {
        // Create new server
        const variables: any = {
          name: server.name,
          description: server.description || '',
          title: server.name,
          repositoryUrl: server.repository?.url || '',
          version: server.version || '0.0.0',
          packages: JSON.stringify(server.packages || {}),
          registryId,
          now,
        };

        // Only add optional fields if they have values
        if (server.remotes) {
          variables.remotes = JSON.stringify(server.remotes);
        }
        if (serverResponse._meta) {
          variables._meta = JSON.stringify(serverResponse._meta);
        }

        await this.dgraphService.mutation(UPSERT_REGISTRY_SERVER, variables);
      }
    }

    // Update lastSyncAt
    const updateRes = await this.dgraphService.mutation<{
      updateMCPRegistry: { mCPRegistry: dgraphResolversTypes.McpRegistry[] };
    }>(UPDATE_REGISTRY_LAST_SYNC, {
      id: registryId,
      lastSyncAt: now,
    });

    return updateRes.updateMCPRegistry.mCPRegistry[0];
  }

}
