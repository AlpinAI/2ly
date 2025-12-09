import { injectable, inject } from 'inversify';
import { DGraphService } from '../services/dgraph.service';
import { dgraphResolversTypes, LoggerService } from '@skilder-ai/common';
import {
  ADD_SKILL,
  UPDATE_SKILL,
  DELETE_SKILL,
  GET_SKILL,
  QUERY_SKILLS_BY_WORKSPACE,
  ADD_MCP_TOOL_TO_SKILL,
  REMOVE_MCP_TOOL_FROM_SKILL,
  OBSERVE_SKILLS,
  QUERY_ALL_SKILLS,
  QUERY_SKILL_BY_NAME,
  GET_SKILL_AGENT_MCP_SERVERS,
  UPDATE_SKILL_MODE,
  UPDATE_SKILL_SMART_CONFIG,
  LINK_SKILL_TO_RUNTIME,
  UNLINK_SKILL_FROM_RUNTIME,
  QUERY_SMART_SKILLS_BY_RUNTIME,
} from './skill.operations';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { createSubscriptionFromQuery } from '../helpers';
import pino from 'pino';
import { WorkspaceRepository } from './workspace.repository';
import { IdentityRepository } from './identity.repository';

@injectable()
export class SkillRepository {
  private logger: pino.Logger;

  constructor(
    @inject(DGraphService) private readonly dgraphService: DGraphService,
    @inject(LoggerService) private readonly loggerService: LoggerService,
    @inject(WorkspaceRepository) private readonly workspaceRepository: WorkspaceRepository,
    @inject(IdentityRepository) private readonly identityRepository: IdentityRepository,
  ) {
    this.logger = this.loggerService.getLogger('skill.repository');
  }

  async create(
    name: string,
    description: string | undefined,
    workspaceId: string,
  ): Promise<dgraphResolversTypes.Skill> {
    const now = new Date().toISOString();

    // 1. Create the skill
    const res = await this.dgraphService.mutation<{
      addSkill: { skill: dgraphResolversTypes.Skill[] };
    }>(ADD_SKILL, {
      name,
      description: description ?? '',
      workspaceId,
      createdAt: now,
    });

    const skill = res.addSkill.skill[0];
    this.logger.debug(`Created skill ${name} with id ${skill.id}`);

    // 2. Create the skill key
    await this.identityRepository.createKey('skill', skill.id, `${name} Skill Key`, '');

    return skill;
  }

  async update(
    id: string,
    name: string,
    description: string | undefined,
  ): Promise<dgraphResolversTypes.Skill> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation<{
      updateSkill: { skill: dgraphResolversTypes.Skill[] };
    }>(UPDATE_SKILL, {
      id,
      name,
      description: description ?? '',
      updatedAt: now,
    });

    this.logger.info(`Updated skill ${id} with name ${name}`);
    return res.updateSkill.skill[0];
  }

  async delete(id: string): Promise<dgraphResolversTypes.Skill> {
    const res = await this.dgraphService.mutation<{
      deleteSkill: { skill: dgraphResolversTypes.Skill[] };
    }>(DELETE_SKILL, {
      id,
    });

    this.logger.info(`Deleted skill ${id}`);
    return res.deleteSkill.skill[0];
  }

  async findById(id: string): Promise<dgraphResolversTypes.Skill | null> {
    const response = await this.dgraphService.query<{ getSkill: dgraphResolversTypes.Skill | null }>(
      GET_SKILL,
      { id },
    );
    return response.getSkill;
  }

  async findByName(workspaceId: string, name: string): Promise<dgraphResolversTypes.Skill | null> {
    const response = await this.dgraphService.query<{ getWorkspace: { skills: dgraphResolversTypes.Skill[] } }>(
      QUERY_SKILL_BY_NAME,
      { workspaceId, name },
    );
    return response.getWorkspace?.skills?.[0] ?? null;
  }

  async findByWorkspace(workspaceId: string): Promise<dgraphResolversTypes.Skill[]> {
    const response = await this.dgraphService.query<{
      getWorkspace: { skills: dgraphResolversTypes.Skill[] } | null;
    }>(QUERY_SKILLS_BY_WORKSPACE, { workspaceId });
    return response.getWorkspace?.skills ?? [];
  }

  async addMCPToolToSkill(
    mcpToolId: string,
    skillId: string,
  ): Promise<dgraphResolversTypes.Skill> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation<{
      updateSkill: { skill: dgraphResolversTypes.Skill[] };
    }>(ADD_MCP_TOOL_TO_SKILL, {
      skillId,
      mcpToolId,
      updatedAt: now,
    });

    this.logger.info(`Added MCP tool ${mcpToolId} to skill ${skillId}`);

    // Trigger onboarding step completion check
    const skill = res.updateSkill.skill[0];
    if (skill.workspace?.id) {
      await this.workspaceRepository.checkAndCompleteStep(
        skill.workspace.id,
        'create-skill'
      );
    }

    return skill;
  }

  async removeMCPToolFromSkill(
    mcpToolId: string,
    skillId: string,
  ): Promise<dgraphResolversTypes.Skill> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation<{
      updateSkill: { skill: dgraphResolversTypes.Skill[] };
    }>(REMOVE_MCP_TOOL_FROM_SKILL, {
      skillId,
      mcpToolId,
      updatedAt: now,
    });

    this.logger.info(`Removed MCP tool ${mcpToolId} from skill ${skillId}`);
    return res.updateSkill.skill[0];
  }

  async updateMode(id: string, mode: dgraphResolversTypes.SkillMode): Promise<dgraphResolversTypes.Skill> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation<{
      updateSkill: { skill: dgraphResolversTypes.Skill[] };
    }>(UPDATE_SKILL_MODE, {
      id,
      mode,
      updatedAt: now,
    });

    this.logger.info(`Updated skill ${id} mode to ${mode}`);
    return res.updateSkill.skill[0];
  }

  async updateSmartConfig(
    id: string,
    config: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      executionTarget?: dgraphResolversTypes.ExecutionTarget;
    },
  ): Promise<dgraphResolversTypes.Skill> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation<{
      updateSkill: { skill: dgraphResolversTypes.Skill[] };
    }>(UPDATE_SKILL_SMART_CONFIG, {
      id,
      ...config,
      updatedAt: now,
    });

    this.logger.info(`Updated skill ${id} smart config`);
    return res.updateSkill.skill[0];
  }

  async linkRuntime(skillId: string, runtimeId: string): Promise<dgraphResolversTypes.Skill> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation<{
      updateSkill: { skill: dgraphResolversTypes.Skill[] };
    }>(LINK_SKILL_TO_RUNTIME, {
      skillId,
      runtimeId,
      updatedAt: now,
    });

    this.logger.info(`Linked skill ${skillId} to runtime ${runtimeId}`);
    return res.updateSkill.skill[0];
  }

  async unlinkRuntime(skillId: string): Promise<dgraphResolversTypes.Skill> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation<{
      updateSkill: { skill: dgraphResolversTypes.Skill[] };
    }>(UNLINK_SKILL_FROM_RUNTIME, {
      skillId,
      updatedAt: now,
    });

    this.logger.info(`Unlinked skill ${skillId} from runtime`);
    return res.updateSkill.skill[0];
  }

  async getSmartSkillsByRuntime(runtimeId: string): Promise<dgraphResolversTypes.Skill[]> {
    const response = await this.dgraphService.query<{
      getRuntime: { skills: dgraphResolversTypes.Skill[] } | null;
    }>(QUERY_SMART_SKILLS_BY_RUNTIME, { runtimeId });
    return response.getRuntime?.skills ?? [];
  }

  observeSmartSkillsOnRuntime(runtimeId: string): Observable<dgraphResolversTypes.Skill[]> {
    const query = createSubscriptionFromQuery(QUERY_SMART_SKILLS_BY_RUNTIME);
    return this.dgraphService
      .observe<{ skills: dgraphResolversTypes.Skill[] }>(
        query,
        { runtimeId },
        'getRuntime',
        true,
      )
      .pipe(map((runtime) => runtime?.skills ?? []));
  }

  observeSkills(workspaceId: string): Observable<dgraphResolversTypes.Skill[]> {
    const query = createSubscriptionFromQuery(OBSERVE_SKILLS('query'));
    return this.dgraphService
      .observe<{ skills: dgraphResolversTypes.Skill[] }>(
        query,
        { workspaceId },
        'getWorkspace',
        true,
      )
      .pipe(map((workspace) => workspace?.skills ?? []));
  }

  observeAllSkills(): Observable<dgraphResolversTypes.Skill[]> {
    const query = createSubscriptionFromQuery(QUERY_ALL_SKILLS);
    return this.dgraphService
      .observe<dgraphResolversTypes.Skill[]>(
        query,
        {},
        'querySkill',
        true,
      )
      .pipe(map((skills) => skills ?? []));
  }

  async getMCPServersOnAgent(skillId: string): Promise<dgraphResolversTypes.McpServer[]> {
    const response = await this.dgraphService.query<{ getSkill: dgraphResolversTypes.Skill }>(
      GET_SKILL_AGENT_MCP_SERVERS,
      { skillId },
    );
    return response.getSkill?.mcpTools
      ?.map((mcpTool) => mcpTool.mcpServer)
      .filter((mcpServer) => mcpServer.executionTarget === 'AGENT') ?? [];
  }

  observeMCPServersOnAgent(skillId: string): Observable<dgraphResolversTypes.McpServer[]> {
    const query = createSubscriptionFromQuery(GET_SKILL_AGENT_MCP_SERVERS);
    return this.dgraphService.observe<dgraphResolversTypes.Skill>(
      query,
      { skillId },
      'getSkill',
      true,
    ).pipe(
      map((skill) =>
        skill?.mcpTools
          ?.map((mcpTool) => mcpTool.mcpServer)
          .filter((mcpServer) => mcpServer.executionTarget === 'AGENT') ?? []
      ),
    );
  }
}
