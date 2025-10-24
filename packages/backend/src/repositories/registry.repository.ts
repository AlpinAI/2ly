import { injectable, inject } from 'inversify';
import { DGraphService } from '../services/dgraph.service';
import { dgraphResolversTypes } from '@2ly/common';
import {
  ADD_MCP_REGISTRY,
  GET_MCP_REGISTRY,
  QUERY_WORKSPACE_WITH_REGISTRIES,
  DELETE_REGISTRY_SERVERS,
  DELETE_MCP_REGISTRY,
  ADD_REGISTRY_SERVER,
  UPDATE_REGISTRY_SERVER,
  DELETE_REGISTRY_SERVER,
  GET_REGISTRY_SERVER,
} from './registry.operations';
import { WorkspaceRepository } from './workspace.repository';

@injectable()
export class RegistryRepository {
  constructor(
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(WorkspaceRepository) private readonly workspaceRepository: WorkspaceRepository,
  ) { }

  async createRegistry(workspaceId: string, name: string): Promise<dgraphResolversTypes.McpRegistry> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation<{
      addMCPRegistry: { mCPRegistry: dgraphResolversTypes.McpRegistry[] };
    }>(ADD_MCP_REGISTRY, {
      name,
      workspaceId,
      now,
    });
    const created = res.addMCPRegistry.mCPRegistry[0];
    return created;
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

  async canModifyServer(serverId: string): Promise<boolean> {
    const server = await this.dgraphService.query<{
      getMCPRegistryServer: dgraphResolversTypes.McpRegistryServer;
    }>(GET_REGISTRY_SERVER, { id: serverId });

    const serverData = server.getMCPRegistryServer;
    if (!serverData) {
      throw new Error('Server not found');
    }

    // Check if any MCPServer configs reference this server
    const hasConfigurations = (serverData.configurations?.length ?? 0) > 0;
    return !hasConfigurations;
  }

  async addServerToRegistry(
    registryId: string,
    serverData: {
      name: string;
      description: string;
      title: string;
      repositoryUrl: string;
      version: string;
      packages?: string;
      remotes?: string;
    }
  ): Promise<dgraphResolversTypes.McpRegistryServer> {
    const now = new Date().toISOString();

    const variables: Partial<dgraphResolversTypes.McpRegistryServer> & { registryId: string, now: string } = {
      name: serverData.name,
      description: serverData.description,
      title: serverData.title,
      repositoryUrl: serverData.repositoryUrl,
      version: serverData.version,
      packages: serverData.packages || '{}',
      registryId,
      now,
    };

    if (serverData.remotes) {
      variables.remotes = serverData.remotes;
    }

    const res = await this.dgraphService.mutation<{
      addMCPRegistryServer: { mCPRegistryServer: dgraphResolversTypes.McpRegistryServer[] };
    }>(ADD_REGISTRY_SERVER, variables);

    return res.addMCPRegistryServer.mCPRegistryServer[0];
  }

  async updateServerInRegistry(
    serverId: string,
    serverData: {
      name?: string;
      description?: string;
      title?: string;
      repositoryUrl?: string;
      version?: string;
      packages?: string;
      remotes?: string;
    }
  ): Promise<dgraphResolversTypes.McpRegistryServer> {
    // Check if server can be modified
    const canModify = await this.canModifyServer(serverId);
    if (!canModify) {
      throw new Error('Cannot modify server that has linked configurations');
    }

    // Build update object with only provided fields
    const updateFields: Partial<dgraphResolversTypes.McpRegistryServer> = {};
    if (serverData.name !== undefined) updateFields.name = serverData.name;
    if (serverData.description !== undefined) updateFields.description = serverData.description;
    if (serverData.title !== undefined) updateFields.title = serverData.title;
    if (serverData.repositoryUrl !== undefined) updateFields.repositoryUrl = serverData.repositoryUrl;
    if (serverData.version !== undefined) updateFields.version = serverData.version;
    if (serverData.packages !== undefined) updateFields.packages = serverData.packages;
    if (serverData.remotes !== undefined) updateFields.remotes = serverData.remotes;

    const res = await this.dgraphService.mutation<{
      updateMCPRegistryServer: { mCPRegistryServer: dgraphResolversTypes.McpRegistryServer[] };
    }>(UPDATE_REGISTRY_SERVER, {
      id: serverId,
      ...updateFields,
    });

    return res.updateMCPRegistryServer.mCPRegistryServer[0];
  }

  async removeServerFromRegistry(serverId: string): Promise<dgraphResolversTypes.McpRegistryServer> {
    // Check if server can be deleted
    const canModify = await this.canModifyServer(serverId);
    if (!canModify) {
      throw new Error('Cannot delete server that has linked configurations');
    }

    const res = await this.dgraphService.mutation<{
      deleteMCPRegistryServer: { mCPRegistryServer: dgraphResolversTypes.McpRegistryServer[] };
    }>(DELETE_REGISTRY_SERVER, { id: serverId });

    return res.deleteMCPRegistryServer.mCPRegistryServer[0];
  }

}
