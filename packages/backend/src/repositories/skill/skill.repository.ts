import { injectable, inject } from 'inversify';
import { DGraphService } from '../../services/dgraph.service';
import { dgraphResolversTypes, LoggerService } from '@skilder-ai/common';
import {
  AddSkillDocument,
  UpdateSkillDocument,
  DeleteSkillDocument,
  GetSkillDocument,
  QuerySkillsByWorkspaceDocument,
  AddMcpToolToSkillDocument,
  RemoveMcpToolFromSkillDocument,
  ObserveSkillsQueryDocument,
  QueryAllSkillsDocument,
  QuerySkillByNameDocument,
  GetSkillAgentMcpServersDocument,
  UpdateSkillModeDocument,
  UpdateSkillSmartConfigDocument,
  LinkSkillToRuntimeDocument,
  UnlinkSkillFromRuntimeDocument,
  QuerySmartSkillsByRuntimeDocument,
} from '../../generated/dgraph';
import {
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_GUARDRAILS_MAX_LENGTH,
  SKILL_KNOWLEDGE_MAX_LENGTH,
} from '../../constants';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { createSubscriptionFromQuery } from '../../helpers';
import pino from 'pino';
import { WorkspaceRepository } from '../workspace/workspace.repository';
import { IdentityRepository } from '../identity/identity.repository';

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

  private validateSkillFields(
    description?: string,
    guardrails?: string,
    associatedKnowledge?: string,
  ): void {
    if (description && description.length > SKILL_DESCRIPTION_MAX_LENGTH) {
      throw new Error(`Skill description cannot exceed ${SKILL_DESCRIPTION_MAX_LENGTH} characters`);
    }
    if (guardrails && guardrails.length > SKILL_GUARDRAILS_MAX_LENGTH) {
      throw new Error(`Skill guardrails cannot exceed ${SKILL_GUARDRAILS_MAX_LENGTH} characters`);
    }
    if (associatedKnowledge && associatedKnowledge.length > SKILL_KNOWLEDGE_MAX_LENGTH) {
      throw new Error(`Skill associated knowledge cannot exceed ${SKILL_KNOWLEDGE_MAX_LENGTH} characters`);
    }
  }

  async create(
    name: string,
    description: string | undefined,
    workspaceId: string,
    guardrails?: string,
    associatedKnowledge?: string,
  ): Promise<dgraphResolversTypes.Skill> {
    const now = new Date().toISOString();
    this.validateSkillFields(description, guardrails, associatedKnowledge);

    // 1. Create the skill
    const res = await this.dgraphService.mutation(AddSkillDocument, {
      name,
      description: description ?? '',
      guardrails: guardrails ?? null,
      associatedKnowledge: associatedKnowledge ?? null,
      workspaceId,
      createdAt: now,
    });

    const skill = res.addSkill!.skill![0]! as dgraphResolversTypes.Skill;
    this.logger.debug(`Created skill ${name} with id ${skill.id}`);

    // 2. Create the skill key
    await this.identityRepository.createKey('skill', skill.id, `${name} Skill Key`, '');

    return skill;
  }

  async update(
    id: string,
    name: string,
    description: string | undefined,
    guardrails?: string,
    associatedKnowledge?: string,
  ): Promise<dgraphResolversTypes.Skill> {
    const now = new Date().toISOString();
    this.validateSkillFields(description, guardrails, associatedKnowledge);

    const res = await this.dgraphService.mutation(UpdateSkillDocument, {
      id,
      name,
      description: description ?? '',
      guardrails: guardrails ?? null,
      associatedKnowledge: associatedKnowledge ?? null,
      updatedAt: now,
    });

    this.logger.info(`Updated skill ${id} with name ${name}`);
    return res.updateSkill!.skill![0]! as dgraphResolversTypes.Skill;
  }

  async delete(id: string): Promise<dgraphResolversTypes.Skill> {
    const res = await this.dgraphService.mutation(DeleteSkillDocument, {
      id,
    });

    this.logger.info(`Deleted skill ${id}`);
    return res.deleteSkill!.skill![0]! as dgraphResolversTypes.Skill;
  }

  async findById(id: string): Promise<dgraphResolversTypes.Skill | null> {
    const response = await this.dgraphService.query(GetSkillDocument, { id });
    return response.getSkill as dgraphResolversTypes.Skill | null;
  }

  async findByName(workspaceId: string, name: string): Promise<dgraphResolversTypes.Skill | null> {
    const response = await this.dgraphService.query(QuerySkillByNameDocument, { workspaceId, name });
    return (response.getWorkspace?.skills?.[0] ?? null) as dgraphResolversTypes.Skill | null;
  }

  async findByWorkspace(workspaceId: string): Promise<dgraphResolversTypes.Skill[]> {
    const response = await this.dgraphService.query(QuerySkillsByWorkspaceDocument, { workspaceId });
    return (response.getWorkspace?.skills ?? []) as dgraphResolversTypes.Skill[];
  }

  async addMCPToolToSkill(
    mcpToolId: string,
    skillId: string,
  ): Promise<dgraphResolversTypes.Skill> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation(AddMcpToolToSkillDocument, {
      skillId,
      mcpToolId,
      updatedAt: now,
    });

    this.logger.info(`Added MCP tool ${mcpToolId} to skill ${skillId}`);

    // Trigger onboarding step completion check
    const skill = res.updateSkill!.skill![0]! as dgraphResolversTypes.Skill;
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
    const res = await this.dgraphService.mutation(RemoveMcpToolFromSkillDocument, {
      skillId,
      mcpToolId,
      updatedAt: now,
    });

    this.logger.info(`Removed MCP tool ${mcpToolId} from skill ${skillId}`);
    return res.updateSkill!.skill![0]! as dgraphResolversTypes.Skill;
  }

  async updateMode(id: string, mode: dgraphResolversTypes.SkillMode): Promise<dgraphResolversTypes.Skill> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation(UpdateSkillModeDocument, {
      id,
      mode,
      updatedAt: now,
    });

    this.logger.info(`Updated skill ${id} mode to ${mode}`);
    return res.updateSkill!.skill![0]! as dgraphResolversTypes.Skill;
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
    const res = await this.dgraphService.mutation(UpdateSkillSmartConfigDocument, {
      id,
      ...config,
      updatedAt: now,
    });

    this.logger.info(`Updated skill ${id} smart config`);
    return res.updateSkill!.skill![0]! as dgraphResolversTypes.Skill;
  }

  async linkRuntime(skillId: string, runtimeId: string): Promise<dgraphResolversTypes.Skill> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation(LinkSkillToRuntimeDocument, {
      skillId,
      runtimeId,
      updatedAt: now,
    });

    this.logger.info(`Linked skill ${skillId} to runtime ${runtimeId}`);
    return res.updateSkill!.skill![0]! as dgraphResolversTypes.Skill;
  }

  async unlinkRuntime(skillId: string): Promise<dgraphResolversTypes.Skill> {
    const now = new Date().toISOString();
    const res = await this.dgraphService.mutation(UnlinkSkillFromRuntimeDocument, {
      skillId,
      updatedAt: now,
    });

    this.logger.info(`Unlinked skill ${skillId} from runtime`);
    return res.updateSkill!.skill![0]! as dgraphResolversTypes.Skill;
  }

  async getSmartSkillsByRuntime(runtimeId: string): Promise<dgraphResolversTypes.Skill[]> {
    const response = await this.dgraphService.query(QuerySmartSkillsByRuntimeDocument, { runtimeId });
    return (response.getRuntime?.skills ?? []) as dgraphResolversTypes.Skill[];
  }

  observeSmartSkillsOnRuntime(runtimeId: string): Observable<dgraphResolversTypes.Skill[]> {
    const query = createSubscriptionFromQuery(QuerySmartSkillsByRuntimeDocument);
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
    const query = createSubscriptionFromQuery(ObserveSkillsQueryDocument);
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
    const query = createSubscriptionFromQuery(QueryAllSkillsDocument);
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
    const response = await this.dgraphService.query(GetSkillAgentMcpServersDocument, { skillId });
    return (response.getSkill?.mcpTools
      ?.map((mcpTool) => mcpTool.mcpServer!)
      .filter((mcpServer) => mcpServer.executionTarget === 'AGENT') ?? []) as dgraphResolversTypes.McpServer[];
  }

  observeMCPServersOnAgent(skillId: string): Observable<dgraphResolversTypes.McpServer[]> {
    const query = createSubscriptionFromQuery(GetSkillAgentMcpServersDocument);
    return this.dgraphService.observe<dgraphResolversTypes.Skill>(
      query,
      { skillId },
      'getSkill',
      true,
    ).pipe(
      map((skill) =>
        skill?.mcpTools
          ?.map((mcpTool) => mcpTool.mcpServer!)
          .filter((mcpServer) => mcpServer.executionTarget === 'AGENT') ?? []
      ),
    );
  }
}
