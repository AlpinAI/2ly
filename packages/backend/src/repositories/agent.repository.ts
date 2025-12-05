import { injectable, inject } from 'inversify';
import { DGraphService } from '../services/dgraph.service';
import { dgraphResolversTypes, LoggerService, EXECUTION_TARGET } from '@2ly/common';
import {
  ADD_AGENT,
  UPDATE_AGENT,
  DELETE_AGENT,
  GET_AGENT,
  GET_AGENTS_BY_WORKSPACE,
  UPDATE_AGENT_RUN_ON,
  AGENT_LINK_RUNTIME,
  AGENT_UNLINK_RUNTIME,
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
    runOn?: EXECUTION_TARGET | null,
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
      runOn: runOn ?? null,
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
    runOn?: EXECUTION_TARGET | null,
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
    if (runOn !== undefined) updateFields.runOn = runOn;

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

  async updateRunOn(id: string, runOn: EXECUTION_TARGET): Promise<dgraphResolversTypes.Agent> {
    const res = await this.dgraphService.mutation<{
      updateAgent: { agent: dgraphResolversTypes.Agent[] };
    }>(UPDATE_AGENT_RUN_ON, {
      id,
      runOn,
    });
    return res.updateAgent.agent[0];
  }

  async linkRuntime(agentId: string, runtimeId: string): Promise<dgraphResolversTypes.Agent> {
    const res = await this.dgraphService.mutation<{
      updateAgent: { agent: dgraphResolversTypes.Agent[] };
    }>(AGENT_LINK_RUNTIME, {
      agentId,
      runtimeId,
    });
    return res.updateAgent.agent[0];
  }

  async unlinkRuntime(agentId: string): Promise<dgraphResolversTypes.Agent> {
    // get the currently linked runtime
    const agent = await this.findById(agentId);
    const currentRuntime = agent?.runtime;
    if (!currentRuntime) {
      // no runtime linked to agent, early return the agent
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }
      return agent;
    }

    const res = await this.dgraphService.mutation<{
      updateAgent: { agent: dgraphResolversTypes.Agent[] };
    }>(AGENT_UNLINK_RUNTIME, {
      agentId,
      runtimeId: currentRuntime.id,
    });
    return res.updateAgent.agent[0];
  }
}
