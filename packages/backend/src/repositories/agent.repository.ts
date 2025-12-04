import { injectable, inject } from 'inversify';
import { DGraphService } from '../services/dgraph.service';
import { dgraphResolversTypes, LoggerService } from '@2ly/common';
import {
  ADD_AGENT,
  UPDATE_AGENT,
  DELETE_AGENT,
  GET_AGENT,
  GET_AGENTS_BY_WORKSPACE,
} from './agent.operations';
import pino from 'pino';

@injectable()
export class AgentRepository {
  private logger: pino.Logger;

  constructor(
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(LoggerService) private readonly loggerService: LoggerService,
  ) {
    this.logger = this.loggerService.getLogger('agent-repository');
  }

  async create(
    name: string,
    description: string | undefined,
    systemPrompt: string,
    model: string,
    temperature: number,
    maxTokens: number,
    workspaceId: string,
  ): Promise<dgraphResolversTypes.Agent> {
    const now = new Date().toISOString();

    const res = await this.dgraphService.mutation<{
      addAgent: { agent: dgraphResolversTypes.Agent[] };
    }>(ADD_AGENT, {
      name,
      description: description ?? '',
      systemPrompt,
      model,
      temperature,
      maxTokens,
      workspaceId,
      createdAt: now,
    });

    const agent = res.addAgent.agent[0];
    this.logger.debug(`Created agent ${name} with id ${agent.id}`);

    return agent;
  }

  async update(
    id: string,
    name?: string,
    description?: string,
    systemPrompt?: string,
    model?: string,
    temperature?: number,
    maxTokens?: number,
  ): Promise<dgraphResolversTypes.Agent> {
    const now = new Date().toISOString();

    // Build the update object with only provided fields
    const updateFields: Record<string, unknown> = {
      updatedAt: now,
    };

    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (systemPrompt !== undefined) updateFields.systemPrompt = systemPrompt;
    if (model !== undefined) updateFields.model = model;
    if (temperature !== undefined) updateFields.temperature = temperature;
    if (maxTokens !== undefined) updateFields.maxTokens = maxTokens;

    const res = await this.dgraphService.mutation<{
      updateAgent: { agent: dgraphResolversTypes.Agent[] };
    }>(UPDATE_AGENT, {
      id,
      ...updateFields,
    });

    this.logger.info(`Updated agent ${id}`);
    return res.updateAgent.agent[0];
  }

  async delete(id: string): Promise<dgraphResolversTypes.Agent> {
    const res = await this.dgraphService.mutation<{
      deleteAgent: { agent: dgraphResolversTypes.Agent[] };
    }>(DELETE_AGENT, {
      id,
    });

    this.logger.info(`Deleted agent ${id}`);
    return res.deleteAgent.agent[0];
  }

  async findById(id: string): Promise<dgraphResolversTypes.Agent | null> {
    const response = await this.dgraphService.query<{ getAgent: dgraphResolversTypes.Agent | null }>(
      GET_AGENT,
      { id },
    );
    return response.getAgent;
  }

  async findAllByWorkspaceId(workspaceId: string): Promise<dgraphResolversTypes.Agent[]> {
    const response = await this.dgraphService.query<{
      getWorkspace: { agents: dgraphResolversTypes.Agent[] } | null;
    }>(GET_AGENTS_BY_WORKSPACE, { workspaceId });
    return response.getWorkspace?.agents ?? [];
  }
}
