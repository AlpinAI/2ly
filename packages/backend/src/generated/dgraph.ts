import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  Int64: { input: string; output: string; }
};

export type AiConfig = {
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  value: Scalars['String']['output'];
  workspace: Workspace;
};


export type AiConfigWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
};

export type AiConfigAggregateResult = {
  count?: Maybe<Scalars['Int']['output']>;
  createdAtMax?: Maybe<Scalars['DateTime']['output']>;
  createdAtMin?: Maybe<Scalars['DateTime']['output']>;
  descriptionMax?: Maybe<Scalars['String']['output']>;
  descriptionMin?: Maybe<Scalars['String']['output']>;
  keyMax?: Maybe<Scalars['String']['output']>;
  keyMin?: Maybe<Scalars['String']['output']>;
  updatedAtMax?: Maybe<Scalars['DateTime']['output']>;
  updatedAtMin?: Maybe<Scalars['DateTime']['output']>;
  valueMax?: Maybe<Scalars['String']['output']>;
  valueMin?: Maybe<Scalars['String']['output']>;
};

export type AiConfigFilter = {
  and?: InputMaybe<Array<InputMaybe<AiConfigFilter>>>;
  has?: InputMaybe<Array<InputMaybe<AiConfigHasFilter>>>;
  id?: InputMaybe<Array<Scalars['ID']['input']>>;
  key?: InputMaybe<StringHashFilter>;
  not?: InputMaybe<AiConfigFilter>;
  or?: InputMaybe<Array<InputMaybe<AiConfigFilter>>>;
};

export enum AiConfigHasFilter {
  CreatedAt = 'createdAt',
  Description = 'description',
  Key = 'key',
  UpdatedAt = 'updatedAt',
  Value = 'value',
  Workspace = 'workspace'
}

export type AiConfigOrder = {
  asc?: InputMaybe<AiConfigOrderable>;
  desc?: InputMaybe<AiConfigOrderable>;
  then?: InputMaybe<AiConfigOrder>;
};

export enum AiConfigOrderable {
  CreatedAt = 'createdAt',
  Description = 'description',
  Key = 'key',
  UpdatedAt = 'updatedAt',
  Value = 'value'
}

export type AiConfigPatch = {
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export type AiConfigRef = {
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export type AiProviderConfig = {
  availableModels?: Maybe<Array<Scalars['String']['output']>>;
  baseUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  encryptedApiKey?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  provider: AiProviderType;
  updatedAt: Scalars['DateTime']['output'];
  workspace: Workspace;
};


export type AiProviderConfigWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
};

export type AiProviderConfigAggregateResult = {
  baseUrlMax?: Maybe<Scalars['String']['output']>;
  baseUrlMin?: Maybe<Scalars['String']['output']>;
  count?: Maybe<Scalars['Int']['output']>;
  createdAtMax?: Maybe<Scalars['DateTime']['output']>;
  createdAtMin?: Maybe<Scalars['DateTime']['output']>;
  encryptedApiKeyMax?: Maybe<Scalars['String']['output']>;
  encryptedApiKeyMin?: Maybe<Scalars['String']['output']>;
  updatedAtMax?: Maybe<Scalars['DateTime']['output']>;
  updatedAtMin?: Maybe<Scalars['DateTime']['output']>;
};

export type AiProviderConfigFilter = {
  and?: InputMaybe<Array<InputMaybe<AiProviderConfigFilter>>>;
  has?: InputMaybe<Array<InputMaybe<AiProviderConfigHasFilter>>>;
  id?: InputMaybe<Array<Scalars['ID']['input']>>;
  not?: InputMaybe<AiProviderConfigFilter>;
  or?: InputMaybe<Array<InputMaybe<AiProviderConfigFilter>>>;
  provider?: InputMaybe<AiProviderType_Hash>;
};

export enum AiProviderConfigHasFilter {
  AvailableModels = 'availableModels',
  BaseUrl = 'baseUrl',
  CreatedAt = 'createdAt',
  EncryptedApiKey = 'encryptedApiKey',
  Provider = 'provider',
  UpdatedAt = 'updatedAt',
  Workspace = 'workspace'
}

export type AiProviderConfigOrder = {
  asc?: InputMaybe<AiProviderConfigOrderable>;
  desc?: InputMaybe<AiProviderConfigOrderable>;
  then?: InputMaybe<AiProviderConfigOrder>;
};

export enum AiProviderConfigOrderable {
  BaseUrl = 'baseUrl',
  CreatedAt = 'createdAt',
  EncryptedApiKey = 'encryptedApiKey',
  UpdatedAt = 'updatedAt'
}

export type AiProviderConfigPatch = {
  availableModels?: InputMaybe<Array<Scalars['String']['input']>>;
  baseUrl?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  encryptedApiKey?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<AiProviderType>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export type AiProviderConfigRef = {
  availableModels?: InputMaybe<Array<Scalars['String']['input']>>;
  baseUrl?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  encryptedApiKey?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  provider?: InputMaybe<AiProviderType>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export enum AiProviderType {
  Anthropic = 'ANTHROPIC',
  Google = 'GOOGLE',
  Ollama = 'OLLAMA',
  Openai = 'OPENAI'
}

export type AiProviderType_Hash = {
  eq?: InputMaybe<AiProviderType>;
  in?: InputMaybe<Array<InputMaybe<AiProviderType>>>;
};

export enum ActiveStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}

export type ActiveStatus_Hash = {
  eq?: InputMaybe<ActiveStatus>;
  in?: InputMaybe<Array<InputMaybe<ActiveStatus>>>;
};

export type AddAiConfigInput = {
  createdAt: Scalars['DateTime']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
  updatedAt: Scalars['DateTime']['input'];
  value: Scalars['String']['input'];
  workspace: WorkspaceRef;
};

export type AddAiConfigPayload = {
  aIConfig?: Maybe<Array<Maybe<AiConfig>>>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type AddAiConfigPayloadAiConfigArgs = {
  filter?: InputMaybe<AiConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<AiConfigOrder>;
};

export type AddAiProviderConfigInput = {
  availableModels?: InputMaybe<Array<Scalars['String']['input']>>;
  baseUrl?: InputMaybe<Scalars['String']['input']>;
  createdAt: Scalars['DateTime']['input'];
  encryptedApiKey?: InputMaybe<Scalars['String']['input']>;
  provider: AiProviderType;
  updatedAt: Scalars['DateTime']['input'];
  workspace: WorkspaceRef;
};

export type AddAiProviderConfigPayload = {
  aIProviderConfig?: Maybe<Array<Maybe<AiProviderConfig>>>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type AddAiProviderConfigPayloadAiProviderConfigArgs = {
  filter?: InputMaybe<AiProviderConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<AiProviderConfigOrder>;
};

export type AddIdentityKeyInput = {
  createdAt: Scalars['DateTime']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  key: Scalars['String']['input'];
  permissions?: InputMaybe<Scalars['String']['input']>;
  relatedId: Scalars['String']['input'];
  revokedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type AddIdentityKeyPayload = {
  identityKey?: Maybe<Array<Maybe<IdentityKey>>>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type AddIdentityKeyPayloadIdentityKeyArgs = {
  filter?: InputMaybe<IdentityKeyFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<IdentityKeyOrder>;
};

export type AddMcpRegistryServerInput = {
  _meta?: InputMaybe<Scalars['String']['input']>;
  configurations?: InputMaybe<Array<McpServerRef>>;
  createdAt: Scalars['DateTime']['input'];
  description: Scalars['String']['input'];
  lastSeenAt: Scalars['DateTime']['input'];
  name: Scalars['String']['input'];
  packages?: InputMaybe<Scalars['String']['input']>;
  remotes?: InputMaybe<Scalars['String']['input']>;
  repositoryUrl: Scalars['String']['input'];
  title: Scalars['String']['input'];
  version: Scalars['String']['input'];
  workspace: WorkspaceRef;
};

export type AddMcpRegistryServerPayload = {
  mCPRegistryServer?: Maybe<Array<Maybe<McpRegistryServer>>>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type AddMcpRegistryServerPayloadMCpRegistryServerArgs = {
  filter?: InputMaybe<McpRegistryServerFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpRegistryServerOrder>;
};

export type AddMcpServerInput = {
  config: Scalars['String']['input'];
  description: Scalars['String']['input'];
  executionTarget?: InputMaybe<ExecutionTarget>;
  name: Scalars['String']['input'];
  registryServer: McpRegistryServerRef;
  repositoryUrl: Scalars['String']['input'];
  runtime?: InputMaybe<RuntimeRef>;
  tools?: InputMaybe<Array<McpToolRef>>;
  transport: McpTransportType;
  workspace: WorkspaceRef;
};

export type AddMcpServerPayload = {
  mCPServer?: Maybe<Array<Maybe<McpServer>>>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type AddMcpServerPayloadMCpServerArgs = {
  filter?: InputMaybe<McpServerFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpServerOrder>;
};

export type AddMcpToolInput = {
  annotations: Scalars['String']['input'];
  createdAt: Scalars['DateTime']['input'];
  description: Scalars['String']['input'];
  inputSchema: Scalars['String']['input'];
  lastSeenAt: Scalars['DateTime']['input'];
  mcpServer: McpServerRef;
  name: Scalars['String']['input'];
  skills?: InputMaybe<Array<SkillRef>>;
  status: ActiveStatus;
  toolCalls?: InputMaybe<Array<ToolCallRef>>;
  workspace: WorkspaceRef;
};

export type AddMcpToolPayload = {
  mCPTool?: Maybe<Array<Maybe<McpTool>>>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type AddMcpToolPayloadMCpToolArgs = {
  filter?: InputMaybe<McpToolFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpToolOrder>;
};

export type AddOAuthProviderConfigInput = {
  clientId: Scalars['String']['input'];
  createdAt: Scalars['DateTime']['input'];
  enabled: Scalars['Boolean']['input'];
  encryptedClientSecret: Scalars['String']['input'];
  provider: OAuthProviderType;
  tenantId?: InputMaybe<Scalars['String']['input']>;
  updatedAt: Scalars['DateTime']['input'];
  workspace: WorkspaceRef;
};

export type AddOAuthProviderConfigPayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  oAuthProviderConfig?: Maybe<Array<Maybe<OAuthProviderConfig>>>;
};


export type AddOAuthProviderConfigPayloadOAuthProviderConfigArgs = {
  filter?: InputMaybe<OAuthProviderConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<OAuthProviderConfigOrder>;
};

export type AddOnboardingStepInput = {
  createdAt: Scalars['DateTime']['input'];
  metadata?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  status: OnboardingStepStatus;
  stepId: Scalars['String']['input'];
  type: OnboardingStepType;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type AddOnboardingStepPayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  onboardingStep?: Maybe<Array<Maybe<OnboardingStep>>>;
};


export type AddOnboardingStepPayloadOnboardingStepArgs = {
  filter?: InputMaybe<OnboardingStepFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<OnboardingStepOrder>;
};

export type AddRuntimeInput = {
  createdAt: Scalars['DateTime']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  hostIP?: InputMaybe<Scalars['String']['input']>;
  hostname?: InputMaybe<Scalars['String']['input']>;
  lastSeenAt?: InputMaybe<Scalars['DateTime']['input']>;
  mcpClientName?: InputMaybe<Scalars['String']['input']>;
  mcpServers?: InputMaybe<Array<McpServerRef>>;
  name: Scalars['String']['input'];
  processId?: InputMaybe<Scalars['String']['input']>;
  roots?: InputMaybe<Scalars['String']['input']>;
  skills?: InputMaybe<Array<SkillRef>>;
  status: ActiveStatus;
  system?: InputMaybe<SystemRef>;
  toolResponses?: InputMaybe<Array<ToolCallRef>>;
  type: RuntimeType;
  workspace?: InputMaybe<WorkspaceRef>;
};

export type AddRuntimePayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  runtime?: Maybe<Array<Maybe<Runtime>>>;
};


export type AddRuntimePayloadRuntimeArgs = {
  filter?: InputMaybe<RuntimeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<RuntimeOrder>;
};

export type AddSessionInput = {
  createdAt: Scalars['DateTime']['input'];
  deviceInfo?: InputMaybe<Scalars['String']['input']>;
  expiresAt: Scalars['DateTime']['input'];
  ipAddress?: InputMaybe<Scalars['String']['input']>;
  isActive: Scalars['Boolean']['input'];
  lastUsedAt?: InputMaybe<Scalars['DateTime']['input']>;
  refreshToken: Scalars['String']['input'];
  user: UserRef;
  userAgent?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['String']['input'];
};

export type AddSessionPayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  session?: Maybe<Array<Maybe<Session>>>;
};


export type AddSessionPayloadSessionArgs = {
  filter?: InputMaybe<SessionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SessionOrder>;
};

export type AddSkillInput = {
  associatedKnowledge?: InputMaybe<Scalars['String']['input']>;
  createdAt: Scalars['DateTime']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  executionTarget?: InputMaybe<ExecutionTarget>;
  guardrails?: InputMaybe<Scalars['String']['input']>;
  maxTokens?: InputMaybe<Scalars['Int']['input']>;
  mcpTools?: InputMaybe<Array<McpToolRef>>;
  mode?: InputMaybe<SkillMode>;
  model?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  runtime?: InputMaybe<RuntimeRef>;
  skillToolCalls?: InputMaybe<Array<ToolCallRef>>;
  systemPrompt?: InputMaybe<Scalars['String']['input']>;
  temperature?: InputMaybe<Scalars['Float']['input']>;
  toolCalls?: InputMaybe<Array<ToolCallRef>>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  workspace: WorkspaceRef;
};

export type AddSkillPayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  skill?: Maybe<Array<Maybe<Skill>>>;
};


export type AddSkillPayloadSkillArgs = {
  filter?: InputMaybe<SkillFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SkillOrder>;
};

export type AddSystemInput = {
  admins?: InputMaybe<Array<UserRef>>;
  createdAt: Scalars['DateTime']['input'];
  defaultWorkspace?: InputMaybe<WorkspaceRef>;
  initialized: Scalars['Boolean']['input'];
  instanceId: Scalars['String']['input'];
  runtimes?: InputMaybe<Array<RuntimeRef>>;
  updatedAt: Scalars['DateTime']['input'];
  workspaces?: InputMaybe<Array<WorkspaceRef>>;
};

export type AddSystemPayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  system?: Maybe<Array<Maybe<System>>>;
};


export type AddSystemPayloadSystemArgs = {
  filter?: InputMaybe<SystemFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SystemOrder>;
};

export type AddToolCallInput = {
  calledAt: Scalars['DateTime']['input'];
  calledBy?: InputMaybe<SkillRef>;
  completedAt?: InputMaybe<Scalars['DateTime']['input']>;
  error?: InputMaybe<Scalars['String']['input']>;
  executedBy?: InputMaybe<RuntimeRef>;
  executedByAgent?: InputMaybe<Scalars['Boolean']['input']>;
  isTest: Scalars['Boolean']['input'];
  mcpTool?: InputMaybe<McpToolRef>;
  skill?: InputMaybe<SkillRef>;
  status: ToolCallStatus;
  toolInput: Scalars['String']['input'];
  toolOutput?: InputMaybe<Scalars['String']['input']>;
};

export type AddToolCallPayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  toolCall?: Maybe<Array<Maybe<ToolCall>>>;
};


export type AddToolCallPayloadToolCallArgs = {
  filter?: InputMaybe<ToolCallFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ToolCallOrder>;
};

export type AddUserInput = {
  adminOfWorkspaces?: InputMaybe<Array<WorkspaceRef>>;
  createdAt: Scalars['DateTime']['input'];
  email: Scalars['String']['input'];
  failedLoginAttempts?: InputMaybe<Scalars['Int']['input']>;
  lastLoginAt?: InputMaybe<Scalars['DateTime']['input']>;
  lockedUntil?: InputMaybe<Scalars['DateTime']['input']>;
  membersOfWorkspaces?: InputMaybe<Array<WorkspaceRef>>;
  oauthConnections?: InputMaybe<Array<UserOAuthConnectionRef>>;
  password: Scalars['String']['input'];
  sessions?: InputMaybe<Array<SessionRef>>;
  updatedAt: Scalars['DateTime']['input'];
};

export type AddUserOAuthConnectionInput = {
  accountAvatarUrl?: InputMaybe<Scalars['String']['input']>;
  accountEmail?: InputMaybe<Scalars['String']['input']>;
  accountName?: InputMaybe<Scalars['String']['input']>;
  createdAt: Scalars['DateTime']['input'];
  encryptedAccessToken: Scalars['String']['input'];
  encryptedRefreshToken?: InputMaybe<Scalars['String']['input']>;
  lastUsedAt?: InputMaybe<Scalars['DateTime']['input']>;
  provider: OAuthProviderType;
  providerAccountId?: InputMaybe<Scalars['String']['input']>;
  scopes?: InputMaybe<Array<Scalars['String']['input']>>;
  tokenExpiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt: Scalars['DateTime']['input'];
  user: UserRef;
  workspace: WorkspaceRef;
};

export type AddUserOAuthConnectionPayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  userOAuthConnection?: Maybe<Array<Maybe<UserOAuthConnection>>>;
};


export type AddUserOAuthConnectionPayloadUserOAuthConnectionArgs = {
  filter?: InputMaybe<UserOAuthConnectionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<UserOAuthConnectionOrder>;
};

export type AddUserPayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  user?: Maybe<Array<Maybe<User>>>;
};


export type AddUserPayloadUserArgs = {
  filter?: InputMaybe<UserFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<UserOrder>;
};

export type AddWorkspaceInput = {
  admins?: InputMaybe<Array<UserRef>>;
  aiConfigs?: InputMaybe<Array<AiConfigRef>>;
  aiProviders?: InputMaybe<Array<AiProviderConfigRef>>;
  createdAt: Scalars['DateTime']['input'];
  defaultAIModel?: InputMaybe<Scalars['String']['input']>;
  mcpServers?: InputMaybe<Array<McpServerRef>>;
  mcpTools?: InputMaybe<Array<McpToolRef>>;
  name: Scalars['String']['input'];
  oauthProviders?: InputMaybe<Array<OAuthProviderConfigRef>>;
  onboardingSteps?: InputMaybe<Array<OnboardingStepRef>>;
  registryServers?: InputMaybe<Array<McpRegistryServerRef>>;
  runtimes?: InputMaybe<Array<RuntimeRef>>;
  skills?: InputMaybe<Array<SkillRef>>;
  system: SystemRef;
  userOAuthConnections?: InputMaybe<Array<UserOAuthConnectionRef>>;
  users?: InputMaybe<Array<UserRef>>;
};

export type AddWorkspacePayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  workspace?: Maybe<Array<Maybe<Workspace>>>;
};


export type AddWorkspacePayloadWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<WorkspaceOrder>;
};

export type AuthRule = {
  and?: InputMaybe<Array<InputMaybe<AuthRule>>>;
  not?: InputMaybe<AuthRule>;
  or?: InputMaybe<Array<InputMaybe<AuthRule>>>;
  rule?: InputMaybe<Scalars['String']['input']>;
};

export type ContainsFilter = {
  point?: InputMaybe<PointRef>;
  polygon?: InputMaybe<PolygonRef>;
};

export type CustomHttp = {
  body?: InputMaybe<Scalars['String']['input']>;
  forwardHeaders?: InputMaybe<Array<Scalars['String']['input']>>;
  graphql?: InputMaybe<Scalars['String']['input']>;
  introspectionHeaders?: InputMaybe<Array<Scalars['String']['input']>>;
  method: HttpMethod;
  mode?: InputMaybe<Mode>;
  secretHeaders?: InputMaybe<Array<Scalars['String']['input']>>;
  skipIntrospection?: InputMaybe<Scalars['Boolean']['input']>;
  url: Scalars['String']['input'];
};

export type DateTimeFilter = {
  between?: InputMaybe<DateTimeRange>;
  eq?: InputMaybe<Scalars['DateTime']['input']>;
  ge?: InputMaybe<Scalars['DateTime']['input']>;
  gt?: InputMaybe<Scalars['DateTime']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']['input']>>>;
  le?: InputMaybe<Scalars['DateTime']['input']>;
  lt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type DateTimeRange = {
  max: Scalars['DateTime']['input'];
  min: Scalars['DateTime']['input'];
};

export type DeleteAiConfigPayload = {
  aIConfig?: Maybe<Array<Maybe<AiConfig>>>;
  msg?: Maybe<Scalars['String']['output']>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type DeleteAiConfigPayloadAiConfigArgs = {
  filter?: InputMaybe<AiConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<AiConfigOrder>;
};

export type DeleteAiProviderConfigPayload = {
  aIProviderConfig?: Maybe<Array<Maybe<AiProviderConfig>>>;
  msg?: Maybe<Scalars['String']['output']>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type DeleteAiProviderConfigPayloadAiProviderConfigArgs = {
  filter?: InputMaybe<AiProviderConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<AiProviderConfigOrder>;
};

export type DeleteIdentityKeyPayload = {
  identityKey?: Maybe<Array<Maybe<IdentityKey>>>;
  msg?: Maybe<Scalars['String']['output']>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type DeleteIdentityKeyPayloadIdentityKeyArgs = {
  filter?: InputMaybe<IdentityKeyFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<IdentityKeyOrder>;
};

export type DeleteMcpRegistryServerPayload = {
  mCPRegistryServer?: Maybe<Array<Maybe<McpRegistryServer>>>;
  msg?: Maybe<Scalars['String']['output']>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type DeleteMcpRegistryServerPayloadMCpRegistryServerArgs = {
  filter?: InputMaybe<McpRegistryServerFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpRegistryServerOrder>;
};

export type DeleteMcpServerPayload = {
  mCPServer?: Maybe<Array<Maybe<McpServer>>>;
  msg?: Maybe<Scalars['String']['output']>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type DeleteMcpServerPayloadMCpServerArgs = {
  filter?: InputMaybe<McpServerFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpServerOrder>;
};

export type DeleteMcpToolPayload = {
  mCPTool?: Maybe<Array<Maybe<McpTool>>>;
  msg?: Maybe<Scalars['String']['output']>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type DeleteMcpToolPayloadMCpToolArgs = {
  filter?: InputMaybe<McpToolFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpToolOrder>;
};

export type DeleteOAuthProviderConfigPayload = {
  msg?: Maybe<Scalars['String']['output']>;
  numUids?: Maybe<Scalars['Int']['output']>;
  oAuthProviderConfig?: Maybe<Array<Maybe<OAuthProviderConfig>>>;
};


export type DeleteOAuthProviderConfigPayloadOAuthProviderConfigArgs = {
  filter?: InputMaybe<OAuthProviderConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<OAuthProviderConfigOrder>;
};

export type DeleteOnboardingStepPayload = {
  msg?: Maybe<Scalars['String']['output']>;
  numUids?: Maybe<Scalars['Int']['output']>;
  onboardingStep?: Maybe<Array<Maybe<OnboardingStep>>>;
};


export type DeleteOnboardingStepPayloadOnboardingStepArgs = {
  filter?: InputMaybe<OnboardingStepFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<OnboardingStepOrder>;
};

export type DeleteRuntimePayload = {
  msg?: Maybe<Scalars['String']['output']>;
  numUids?: Maybe<Scalars['Int']['output']>;
  runtime?: Maybe<Array<Maybe<Runtime>>>;
};


export type DeleteRuntimePayloadRuntimeArgs = {
  filter?: InputMaybe<RuntimeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<RuntimeOrder>;
};

export type DeleteSessionPayload = {
  msg?: Maybe<Scalars['String']['output']>;
  numUids?: Maybe<Scalars['Int']['output']>;
  session?: Maybe<Array<Maybe<Session>>>;
};


export type DeleteSessionPayloadSessionArgs = {
  filter?: InputMaybe<SessionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SessionOrder>;
};

export type DeleteSkillPayload = {
  msg?: Maybe<Scalars['String']['output']>;
  numUids?: Maybe<Scalars['Int']['output']>;
  skill?: Maybe<Array<Maybe<Skill>>>;
};


export type DeleteSkillPayloadSkillArgs = {
  filter?: InputMaybe<SkillFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SkillOrder>;
};

export type DeleteSystemPayload = {
  msg?: Maybe<Scalars['String']['output']>;
  numUids?: Maybe<Scalars['Int']['output']>;
  system?: Maybe<Array<Maybe<System>>>;
};


export type DeleteSystemPayloadSystemArgs = {
  filter?: InputMaybe<SystemFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SystemOrder>;
};

export type DeleteToolCallPayload = {
  msg?: Maybe<Scalars['String']['output']>;
  numUids?: Maybe<Scalars['Int']['output']>;
  toolCall?: Maybe<Array<Maybe<ToolCall>>>;
};


export type DeleteToolCallPayloadToolCallArgs = {
  filter?: InputMaybe<ToolCallFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ToolCallOrder>;
};

export type DeleteUserOAuthConnectionPayload = {
  msg?: Maybe<Scalars['String']['output']>;
  numUids?: Maybe<Scalars['Int']['output']>;
  userOAuthConnection?: Maybe<Array<Maybe<UserOAuthConnection>>>;
};


export type DeleteUserOAuthConnectionPayloadUserOAuthConnectionArgs = {
  filter?: InputMaybe<UserOAuthConnectionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<UserOAuthConnectionOrder>;
};

export type DeleteUserPayload = {
  msg?: Maybe<Scalars['String']['output']>;
  numUids?: Maybe<Scalars['Int']['output']>;
  user?: Maybe<Array<Maybe<User>>>;
};


export type DeleteUserPayloadUserArgs = {
  filter?: InputMaybe<UserFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<UserOrder>;
};

export type DeleteWorkspacePayload = {
  msg?: Maybe<Scalars['String']['output']>;
  numUids?: Maybe<Scalars['Int']['output']>;
  workspace?: Maybe<Array<Maybe<Workspace>>>;
};


export type DeleteWorkspacePayloadWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<WorkspaceOrder>;
};

export type DgraphDefault = {
  value?: InputMaybe<Scalars['String']['input']>;
};

export enum DgraphIndex {
  Bool = 'bool',
  Day = 'day',
  Exact = 'exact',
  Float = 'float',
  Fulltext = 'fulltext',
  Geo = 'geo',
  Hash = 'hash',
  Hnsw = 'hnsw',
  Hour = 'hour',
  Int = 'int',
  Int64 = 'int64',
  Month = 'month',
  Regexp = 'regexp',
  Term = 'term',
  Trigram = 'trigram',
  Year = 'year'
}

export enum ExecutionTarget {
  Agent = 'AGENT',
  Edge = 'EDGE'
}

export type ExecutionTarget_Hash = {
  eq?: InputMaybe<ExecutionTarget>;
  in?: InputMaybe<Array<InputMaybe<ExecutionTarget>>>;
};

export type FloatFilter = {
  between?: InputMaybe<FloatRange>;
  eq?: InputMaybe<Scalars['Float']['input']>;
  ge?: InputMaybe<Scalars['Float']['input']>;
  gt?: InputMaybe<Scalars['Float']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Float']['input']>>>;
  le?: InputMaybe<Scalars['Float']['input']>;
  lt?: InputMaybe<Scalars['Float']['input']>;
};

export type FloatRange = {
  max: Scalars['Float']['input'];
  min: Scalars['Float']['input'];
};

export type GenerateMutationParams = {
  add?: InputMaybe<Scalars['Boolean']['input']>;
  delete?: InputMaybe<Scalars['Boolean']['input']>;
  update?: InputMaybe<Scalars['Boolean']['input']>;
};

export type GenerateQueryParams = {
  aggregate?: InputMaybe<Scalars['Boolean']['input']>;
  get?: InputMaybe<Scalars['Boolean']['input']>;
  password?: InputMaybe<Scalars['Boolean']['input']>;
  query?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum HttpMethod {
  Delete = 'DELETE',
  Get = 'GET',
  Patch = 'PATCH',
  Post = 'POST',
  Put = 'PUT'
}

export type IdentityKey = {
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  permissions?: Maybe<Scalars['String']['output']>;
  relatedId: Scalars['String']['output'];
  revokedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type IdentityKeyAggregateResult = {
  count?: Maybe<Scalars['Int']['output']>;
  createdAtMax?: Maybe<Scalars['DateTime']['output']>;
  createdAtMin?: Maybe<Scalars['DateTime']['output']>;
  descriptionMax?: Maybe<Scalars['String']['output']>;
  descriptionMin?: Maybe<Scalars['String']['output']>;
  expiresAtMax?: Maybe<Scalars['DateTime']['output']>;
  expiresAtMin?: Maybe<Scalars['DateTime']['output']>;
  keyMax?: Maybe<Scalars['String']['output']>;
  keyMin?: Maybe<Scalars['String']['output']>;
  permissionsMax?: Maybe<Scalars['String']['output']>;
  permissionsMin?: Maybe<Scalars['String']['output']>;
  relatedIdMax?: Maybe<Scalars['String']['output']>;
  relatedIdMin?: Maybe<Scalars['String']['output']>;
  revokedAtMax?: Maybe<Scalars['DateTime']['output']>;
  revokedAtMin?: Maybe<Scalars['DateTime']['output']>;
};

export type IdentityKeyFilter = {
  and?: InputMaybe<Array<InputMaybe<IdentityKeyFilter>>>;
  expiresAt?: InputMaybe<DateTimeFilter>;
  has?: InputMaybe<Array<InputMaybe<IdentityKeyHasFilter>>>;
  id?: InputMaybe<Array<Scalars['ID']['input']>>;
  key?: InputMaybe<StringHashFilter>;
  not?: InputMaybe<IdentityKeyFilter>;
  or?: InputMaybe<Array<InputMaybe<IdentityKeyFilter>>>;
  relatedId?: InputMaybe<StringHashFilter>;
  revokedAt?: InputMaybe<DateTimeFilter>;
};

export enum IdentityKeyHasFilter {
  CreatedAt = 'createdAt',
  Description = 'description',
  ExpiresAt = 'expiresAt',
  Key = 'key',
  Permissions = 'permissions',
  RelatedId = 'relatedId',
  RevokedAt = 'revokedAt'
}

export type IdentityKeyOrder = {
  asc?: InputMaybe<IdentityKeyOrderable>;
  desc?: InputMaybe<IdentityKeyOrderable>;
  then?: InputMaybe<IdentityKeyOrder>;
};

export enum IdentityKeyOrderable {
  CreatedAt = 'createdAt',
  Description = 'description',
  ExpiresAt = 'expiresAt',
  Key = 'key',
  Permissions = 'permissions',
  RelatedId = 'relatedId',
  RevokedAt = 'revokedAt'
}

export type IdentityKeyPatch = {
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  permissions?: InputMaybe<Scalars['String']['input']>;
  relatedId?: InputMaybe<Scalars['String']['input']>;
  revokedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type IdentityKeyRef = {
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  permissions?: InputMaybe<Scalars['String']['input']>;
  relatedId?: InputMaybe<Scalars['String']['input']>;
  revokedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type Int64Filter = {
  between?: InputMaybe<Int64Range>;
  eq?: InputMaybe<Scalars['Int64']['input']>;
  ge?: InputMaybe<Scalars['Int64']['input']>;
  gt?: InputMaybe<Scalars['Int64']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Int64']['input']>>>;
  le?: InputMaybe<Scalars['Int64']['input']>;
  lt?: InputMaybe<Scalars['Int64']['input']>;
};

export type Int64Range = {
  max: Scalars['Int64']['input'];
  min: Scalars['Int64']['input'];
};

export type IntFilter = {
  between?: InputMaybe<IntRange>;
  eq?: InputMaybe<Scalars['Int']['input']>;
  ge?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  le?: InputMaybe<Scalars['Int']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
};

export type IntRange = {
  max: Scalars['Int']['input'];
  min: Scalars['Int']['input'];
};

export type IntersectsFilter = {
  multiPolygon?: InputMaybe<MultiPolygonRef>;
  polygon?: InputMaybe<PolygonRef>;
};

export type McpRegistryServer = {
  _meta?: Maybe<Scalars['String']['output']>;
  configurations?: Maybe<Array<McpServer>>;
  configurationsAggregate?: Maybe<McpServerAggregateResult>;
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastSeenAt: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  packages?: Maybe<Scalars['String']['output']>;
  remotes?: Maybe<Scalars['String']['output']>;
  repositoryUrl: Scalars['String']['output'];
  title: Scalars['String']['output'];
  version: Scalars['String']['output'];
  workspace: Workspace;
};


export type McpRegistryServerConfigurationsArgs = {
  filter?: InputMaybe<McpServerFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpServerOrder>;
};


export type McpRegistryServerConfigurationsAggregateArgs = {
  filter?: InputMaybe<McpServerFilter>;
};


export type McpRegistryServerWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
};

export type McpRegistryServerAggregateResult = {
  _metaMax?: Maybe<Scalars['String']['output']>;
  _metaMin?: Maybe<Scalars['String']['output']>;
  count?: Maybe<Scalars['Int']['output']>;
  createdAtMax?: Maybe<Scalars['DateTime']['output']>;
  createdAtMin?: Maybe<Scalars['DateTime']['output']>;
  descriptionMax?: Maybe<Scalars['String']['output']>;
  descriptionMin?: Maybe<Scalars['String']['output']>;
  lastSeenAtMax?: Maybe<Scalars['DateTime']['output']>;
  lastSeenAtMin?: Maybe<Scalars['DateTime']['output']>;
  nameMax?: Maybe<Scalars['String']['output']>;
  nameMin?: Maybe<Scalars['String']['output']>;
  packagesMax?: Maybe<Scalars['String']['output']>;
  packagesMin?: Maybe<Scalars['String']['output']>;
  remotesMax?: Maybe<Scalars['String']['output']>;
  remotesMin?: Maybe<Scalars['String']['output']>;
  repositoryUrlMax?: Maybe<Scalars['String']['output']>;
  repositoryUrlMin?: Maybe<Scalars['String']['output']>;
  titleMax?: Maybe<Scalars['String']['output']>;
  titleMin?: Maybe<Scalars['String']['output']>;
  versionMax?: Maybe<Scalars['String']['output']>;
  versionMin?: Maybe<Scalars['String']['output']>;
};

export type McpRegistryServerFilter = {
  and?: InputMaybe<Array<InputMaybe<McpRegistryServerFilter>>>;
  has?: InputMaybe<Array<InputMaybe<McpRegistryServerHasFilter>>>;
  id?: InputMaybe<Array<Scalars['ID']['input']>>;
  name?: InputMaybe<StringHashFilter>;
  not?: InputMaybe<McpRegistryServerFilter>;
  or?: InputMaybe<Array<InputMaybe<McpRegistryServerFilter>>>;
};

export enum McpRegistryServerHasFilter {
  Meta = '_meta',
  Configurations = 'configurations',
  CreatedAt = 'createdAt',
  Description = 'description',
  LastSeenAt = 'lastSeenAt',
  Name = 'name',
  Packages = 'packages',
  Remotes = 'remotes',
  RepositoryUrl = 'repositoryUrl',
  Title = 'title',
  Version = 'version',
  Workspace = 'workspace'
}

export type McpRegistryServerOrder = {
  asc?: InputMaybe<McpRegistryServerOrderable>;
  desc?: InputMaybe<McpRegistryServerOrderable>;
  then?: InputMaybe<McpRegistryServerOrder>;
};

export enum McpRegistryServerOrderable {
  Meta = '_meta',
  CreatedAt = 'createdAt',
  Description = 'description',
  LastSeenAt = 'lastSeenAt',
  Name = 'name',
  Packages = 'packages',
  Remotes = 'remotes',
  RepositoryUrl = 'repositoryUrl',
  Title = 'title',
  Version = 'version'
}

export type McpRegistryServerPatch = {
  _meta?: InputMaybe<Scalars['String']['input']>;
  configurations?: InputMaybe<Array<McpServerRef>>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  lastSeenAt?: InputMaybe<Scalars['DateTime']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  packages?: InputMaybe<Scalars['String']['input']>;
  remotes?: InputMaybe<Scalars['String']['input']>;
  repositoryUrl?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export type McpRegistryServerRef = {
  _meta?: InputMaybe<Scalars['String']['input']>;
  configurations?: InputMaybe<Array<McpServerRef>>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  lastSeenAt?: InputMaybe<Scalars['DateTime']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  packages?: InputMaybe<Scalars['String']['input']>;
  remotes?: InputMaybe<Scalars['String']['input']>;
  repositoryUrl?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export type McpServer = {
  config: Scalars['String']['output'];
  description: Scalars['String']['output'];
  executionTarget?: Maybe<ExecutionTarget>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  registryServer: McpRegistryServer;
  repositoryUrl: Scalars['String']['output'];
  runtime?: Maybe<Runtime>;
  tools?: Maybe<Array<McpTool>>;
  toolsAggregate?: Maybe<McpToolAggregateResult>;
  transport: McpTransportType;
  workspace: Workspace;
};


export type McpServerRegistryServerArgs = {
  filter?: InputMaybe<McpRegistryServerFilter>;
};


export type McpServerRuntimeArgs = {
  filter?: InputMaybe<RuntimeFilter>;
};


export type McpServerToolsArgs = {
  filter?: InputMaybe<McpToolFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpToolOrder>;
};


export type McpServerToolsAggregateArgs = {
  filter?: InputMaybe<McpToolFilter>;
};


export type McpServerWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
};

export type McpServerAggregateResult = {
  configMax?: Maybe<Scalars['String']['output']>;
  configMin?: Maybe<Scalars['String']['output']>;
  count?: Maybe<Scalars['Int']['output']>;
  descriptionMax?: Maybe<Scalars['String']['output']>;
  descriptionMin?: Maybe<Scalars['String']['output']>;
  nameMax?: Maybe<Scalars['String']['output']>;
  nameMin?: Maybe<Scalars['String']['output']>;
  repositoryUrlMax?: Maybe<Scalars['String']['output']>;
  repositoryUrlMin?: Maybe<Scalars['String']['output']>;
};

export type McpServerFilter = {
  and?: InputMaybe<Array<InputMaybe<McpServerFilter>>>;
  executionTarget?: InputMaybe<ExecutionTarget_Hash>;
  has?: InputMaybe<Array<InputMaybe<McpServerHasFilter>>>;
  id?: InputMaybe<Array<Scalars['ID']['input']>>;
  name?: InputMaybe<StringHashFilter>;
  not?: InputMaybe<McpServerFilter>;
  or?: InputMaybe<Array<InputMaybe<McpServerFilter>>>;
};

export enum McpServerHasFilter {
  Config = 'config',
  Description = 'description',
  ExecutionTarget = 'executionTarget',
  Name = 'name',
  RegistryServer = 'registryServer',
  RepositoryUrl = 'repositoryUrl',
  Runtime = 'runtime',
  Tools = 'tools',
  Transport = 'transport',
  Workspace = 'workspace'
}

export type McpServerOrder = {
  asc?: InputMaybe<McpServerOrderable>;
  desc?: InputMaybe<McpServerOrderable>;
  then?: InputMaybe<McpServerOrder>;
};

export enum McpServerOrderable {
  Config = 'config',
  Description = 'description',
  Name = 'name',
  RepositoryUrl = 'repositoryUrl'
}

export type McpServerPatch = {
  config?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  executionTarget?: InputMaybe<ExecutionTarget>;
  name?: InputMaybe<Scalars['String']['input']>;
  registryServer?: InputMaybe<McpRegistryServerRef>;
  repositoryUrl?: InputMaybe<Scalars['String']['input']>;
  runtime?: InputMaybe<RuntimeRef>;
  tools?: InputMaybe<Array<McpToolRef>>;
  transport?: InputMaybe<McpTransportType>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export type McpServerRef = {
  config?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  executionTarget?: InputMaybe<ExecutionTarget>;
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  registryServer?: InputMaybe<McpRegistryServerRef>;
  repositoryUrl?: InputMaybe<Scalars['String']['input']>;
  runtime?: InputMaybe<RuntimeRef>;
  tools?: InputMaybe<Array<McpToolRef>>;
  transport?: InputMaybe<McpTransportType>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export type McpTool = {
  annotations: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  inputSchema: Scalars['String']['output'];
  lastSeenAt: Scalars['DateTime']['output'];
  mcpServer: McpServer;
  name: Scalars['String']['output'];
  skills?: Maybe<Array<Skill>>;
  skillsAggregate?: Maybe<SkillAggregateResult>;
  status: ActiveStatus;
  toolCalls?: Maybe<Array<ToolCall>>;
  toolCallsAggregate?: Maybe<ToolCallAggregateResult>;
  workspace: Workspace;
};


export type McpToolMcpServerArgs = {
  filter?: InputMaybe<McpServerFilter>;
};


export type McpToolSkillsArgs = {
  filter?: InputMaybe<SkillFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SkillOrder>;
};


export type McpToolSkillsAggregateArgs = {
  filter?: InputMaybe<SkillFilter>;
};


export type McpToolToolCallsArgs = {
  filter?: InputMaybe<ToolCallFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ToolCallOrder>;
};


export type McpToolToolCallsAggregateArgs = {
  filter?: InputMaybe<ToolCallFilter>;
};


export type McpToolWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
};

export type McpToolAggregateResult = {
  annotationsMax?: Maybe<Scalars['String']['output']>;
  annotationsMin?: Maybe<Scalars['String']['output']>;
  count?: Maybe<Scalars['Int']['output']>;
  createdAtMax?: Maybe<Scalars['DateTime']['output']>;
  createdAtMin?: Maybe<Scalars['DateTime']['output']>;
  descriptionMax?: Maybe<Scalars['String']['output']>;
  descriptionMin?: Maybe<Scalars['String']['output']>;
  inputSchemaMax?: Maybe<Scalars['String']['output']>;
  inputSchemaMin?: Maybe<Scalars['String']['output']>;
  lastSeenAtMax?: Maybe<Scalars['DateTime']['output']>;
  lastSeenAtMin?: Maybe<Scalars['DateTime']['output']>;
  nameMax?: Maybe<Scalars['String']['output']>;
  nameMin?: Maybe<Scalars['String']['output']>;
};

export type McpToolFilter = {
  and?: InputMaybe<Array<InputMaybe<McpToolFilter>>>;
  has?: InputMaybe<Array<InputMaybe<McpToolHasFilter>>>;
  id?: InputMaybe<Array<Scalars['ID']['input']>>;
  name?: InputMaybe<StringHashFilter>;
  not?: InputMaybe<McpToolFilter>;
  or?: InputMaybe<Array<InputMaybe<McpToolFilter>>>;
  status?: InputMaybe<ActiveStatus_Hash>;
};

export enum McpToolHasFilter {
  Annotations = 'annotations',
  CreatedAt = 'createdAt',
  Description = 'description',
  InputSchema = 'inputSchema',
  LastSeenAt = 'lastSeenAt',
  McpServer = 'mcpServer',
  Name = 'name',
  Skills = 'skills',
  Status = 'status',
  ToolCalls = 'toolCalls',
  Workspace = 'workspace'
}

export type McpToolOrder = {
  asc?: InputMaybe<McpToolOrderable>;
  desc?: InputMaybe<McpToolOrderable>;
  then?: InputMaybe<McpToolOrder>;
};

export enum McpToolOrderable {
  Annotations = 'annotations',
  CreatedAt = 'createdAt',
  Description = 'description',
  InputSchema = 'inputSchema',
  LastSeenAt = 'lastSeenAt',
  Name = 'name'
}

export type McpToolPatch = {
  annotations?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  inputSchema?: InputMaybe<Scalars['String']['input']>;
  lastSeenAt?: InputMaybe<Scalars['DateTime']['input']>;
  mcpServer?: InputMaybe<McpServerRef>;
  name?: InputMaybe<Scalars['String']['input']>;
  skills?: InputMaybe<Array<SkillRef>>;
  status?: InputMaybe<ActiveStatus>;
  toolCalls?: InputMaybe<Array<ToolCallRef>>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export type McpToolRef = {
  annotations?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  inputSchema?: InputMaybe<Scalars['String']['input']>;
  lastSeenAt?: InputMaybe<Scalars['DateTime']['input']>;
  mcpServer?: InputMaybe<McpServerRef>;
  name?: InputMaybe<Scalars['String']['input']>;
  skills?: InputMaybe<Array<SkillRef>>;
  status?: InputMaybe<ActiveStatus>;
  toolCalls?: InputMaybe<Array<ToolCallRef>>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export enum McpTransportType {
  Sse = 'SSE',
  Stdio = 'STDIO',
  Stream = 'STREAM'
}

export enum Mode {
  Batch = 'BATCH',
  Single = 'SINGLE'
}

export type MultiPolygon = {
  polygons: Array<Polygon>;
};

export type MultiPolygonRef = {
  polygons: Array<PolygonRef>;
};

export type Mutation = {
  addAIConfig?: Maybe<AddAiConfigPayload>;
  addAIProviderConfig?: Maybe<AddAiProviderConfigPayload>;
  addIdentityKey?: Maybe<AddIdentityKeyPayload>;
  addMCPRegistryServer?: Maybe<AddMcpRegistryServerPayload>;
  addMCPServer?: Maybe<AddMcpServerPayload>;
  addMCPTool?: Maybe<AddMcpToolPayload>;
  addOAuthProviderConfig?: Maybe<AddOAuthProviderConfigPayload>;
  addOnboardingStep?: Maybe<AddOnboardingStepPayload>;
  addRuntime?: Maybe<AddRuntimePayload>;
  addSession?: Maybe<AddSessionPayload>;
  addSkill?: Maybe<AddSkillPayload>;
  addSystem?: Maybe<AddSystemPayload>;
  addToolCall?: Maybe<AddToolCallPayload>;
  addUser?: Maybe<AddUserPayload>;
  addUserOAuthConnection?: Maybe<AddUserOAuthConnectionPayload>;
  addWorkspace?: Maybe<AddWorkspacePayload>;
  deleteAIConfig?: Maybe<DeleteAiConfigPayload>;
  deleteAIProviderConfig?: Maybe<DeleteAiProviderConfigPayload>;
  deleteIdentityKey?: Maybe<DeleteIdentityKeyPayload>;
  deleteMCPRegistryServer?: Maybe<DeleteMcpRegistryServerPayload>;
  deleteMCPServer?: Maybe<DeleteMcpServerPayload>;
  deleteMCPTool?: Maybe<DeleteMcpToolPayload>;
  deleteOAuthProviderConfig?: Maybe<DeleteOAuthProviderConfigPayload>;
  deleteOnboardingStep?: Maybe<DeleteOnboardingStepPayload>;
  deleteRuntime?: Maybe<DeleteRuntimePayload>;
  deleteSession?: Maybe<DeleteSessionPayload>;
  deleteSkill?: Maybe<DeleteSkillPayload>;
  deleteSystem?: Maybe<DeleteSystemPayload>;
  deleteToolCall?: Maybe<DeleteToolCallPayload>;
  deleteUser?: Maybe<DeleteUserPayload>;
  deleteUserOAuthConnection?: Maybe<DeleteUserOAuthConnectionPayload>;
  deleteWorkspace?: Maybe<DeleteWorkspacePayload>;
  updateAIConfig?: Maybe<UpdateAiConfigPayload>;
  updateAIProviderConfig?: Maybe<UpdateAiProviderConfigPayload>;
  updateIdentityKey?: Maybe<UpdateIdentityKeyPayload>;
  updateMCPRegistryServer?: Maybe<UpdateMcpRegistryServerPayload>;
  updateMCPServer?: Maybe<UpdateMcpServerPayload>;
  updateMCPTool?: Maybe<UpdateMcpToolPayload>;
  updateOAuthProviderConfig?: Maybe<UpdateOAuthProviderConfigPayload>;
  updateOnboardingStep?: Maybe<UpdateOnboardingStepPayload>;
  updateRuntime?: Maybe<UpdateRuntimePayload>;
  updateSession?: Maybe<UpdateSessionPayload>;
  updateSkill?: Maybe<UpdateSkillPayload>;
  updateSystem?: Maybe<UpdateSystemPayload>;
  updateToolCall?: Maybe<UpdateToolCallPayload>;
  updateUser?: Maybe<UpdateUserPayload>;
  updateUserOAuthConnection?: Maybe<UpdateUserOAuthConnectionPayload>;
  updateWorkspace?: Maybe<UpdateWorkspacePayload>;
};


export type MutationAddAiConfigArgs = {
  input: Array<AddAiConfigInput>;
};


export type MutationAddAiProviderConfigArgs = {
  input: Array<AddAiProviderConfigInput>;
};


export type MutationAddIdentityKeyArgs = {
  input: Array<AddIdentityKeyInput>;
  upsert?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationAddMcpRegistryServerArgs = {
  input: Array<AddMcpRegistryServerInput>;
};


export type MutationAddMcpServerArgs = {
  input: Array<AddMcpServerInput>;
};


export type MutationAddMcpToolArgs = {
  input: Array<AddMcpToolInput>;
};


export type MutationAddOAuthProviderConfigArgs = {
  input: Array<AddOAuthProviderConfigInput>;
};


export type MutationAddOnboardingStepArgs = {
  input: Array<AddOnboardingStepInput>;
};


export type MutationAddRuntimeArgs = {
  input: Array<AddRuntimeInput>;
};


export type MutationAddSessionArgs = {
  input: Array<AddSessionInput>;
};


export type MutationAddSkillArgs = {
  input: Array<AddSkillInput>;
};


export type MutationAddSystemArgs = {
  input: Array<AddSystemInput>;
};


export type MutationAddToolCallArgs = {
  input: Array<AddToolCallInput>;
};


export type MutationAddUserArgs = {
  input: Array<AddUserInput>;
};


export type MutationAddUserOAuthConnectionArgs = {
  input: Array<AddUserOAuthConnectionInput>;
};


export type MutationAddWorkspaceArgs = {
  input: Array<AddWorkspaceInput>;
};


export type MutationDeleteAiConfigArgs = {
  filter: AiConfigFilter;
};


export type MutationDeleteAiProviderConfigArgs = {
  filter: AiProviderConfigFilter;
};


export type MutationDeleteIdentityKeyArgs = {
  filter: IdentityKeyFilter;
};


export type MutationDeleteMcpRegistryServerArgs = {
  filter: McpRegistryServerFilter;
};


export type MutationDeleteMcpServerArgs = {
  filter: McpServerFilter;
};


export type MutationDeleteMcpToolArgs = {
  filter: McpToolFilter;
};


export type MutationDeleteOAuthProviderConfigArgs = {
  filter: OAuthProviderConfigFilter;
};


export type MutationDeleteOnboardingStepArgs = {
  filter: OnboardingStepFilter;
};


export type MutationDeleteRuntimeArgs = {
  filter: RuntimeFilter;
};


export type MutationDeleteSessionArgs = {
  filter: SessionFilter;
};


export type MutationDeleteSkillArgs = {
  filter: SkillFilter;
};


export type MutationDeleteSystemArgs = {
  filter: SystemFilter;
};


export type MutationDeleteToolCallArgs = {
  filter: ToolCallFilter;
};


export type MutationDeleteUserArgs = {
  filter: UserFilter;
};


export type MutationDeleteUserOAuthConnectionArgs = {
  filter: UserOAuthConnectionFilter;
};


export type MutationDeleteWorkspaceArgs = {
  filter: WorkspaceFilter;
};


export type MutationUpdateAiConfigArgs = {
  input: UpdateAiConfigInput;
};


export type MutationUpdateAiProviderConfigArgs = {
  input: UpdateAiProviderConfigInput;
};


export type MutationUpdateIdentityKeyArgs = {
  input: UpdateIdentityKeyInput;
};


export type MutationUpdateMcpRegistryServerArgs = {
  input: UpdateMcpRegistryServerInput;
};


export type MutationUpdateMcpServerArgs = {
  input: UpdateMcpServerInput;
};


export type MutationUpdateMcpToolArgs = {
  input: UpdateMcpToolInput;
};


export type MutationUpdateOAuthProviderConfigArgs = {
  input: UpdateOAuthProviderConfigInput;
};


export type MutationUpdateOnboardingStepArgs = {
  input: UpdateOnboardingStepInput;
};


export type MutationUpdateRuntimeArgs = {
  input: UpdateRuntimeInput;
};


export type MutationUpdateSessionArgs = {
  input: UpdateSessionInput;
};


export type MutationUpdateSkillArgs = {
  input: UpdateSkillInput;
};


export type MutationUpdateSystemArgs = {
  input: UpdateSystemInput;
};


export type MutationUpdateToolCallArgs = {
  input: UpdateToolCallInput;
};


export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
};


export type MutationUpdateUserOAuthConnectionArgs = {
  input: UpdateUserOAuthConnectionInput;
};


export type MutationUpdateWorkspaceArgs = {
  input: UpdateWorkspaceInput;
};

export type NearFilter = {
  coordinate: PointRef;
  distance: Scalars['Float']['input'];
};

export type OAuthProviderConfig = {
  clientId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  enabled: Scalars['Boolean']['output'];
  encryptedClientSecret: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  provider: OAuthProviderType;
  tenantId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  workspace: Workspace;
};


export type OAuthProviderConfigWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
};

export type OAuthProviderConfigAggregateResult = {
  clientIdMax?: Maybe<Scalars['String']['output']>;
  clientIdMin?: Maybe<Scalars['String']['output']>;
  count?: Maybe<Scalars['Int']['output']>;
  createdAtMax?: Maybe<Scalars['DateTime']['output']>;
  createdAtMin?: Maybe<Scalars['DateTime']['output']>;
  encryptedClientSecretMax?: Maybe<Scalars['String']['output']>;
  encryptedClientSecretMin?: Maybe<Scalars['String']['output']>;
  tenantIdMax?: Maybe<Scalars['String']['output']>;
  tenantIdMin?: Maybe<Scalars['String']['output']>;
  updatedAtMax?: Maybe<Scalars['DateTime']['output']>;
  updatedAtMin?: Maybe<Scalars['DateTime']['output']>;
};

export type OAuthProviderConfigFilter = {
  and?: InputMaybe<Array<InputMaybe<OAuthProviderConfigFilter>>>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  has?: InputMaybe<Array<InputMaybe<OAuthProviderConfigHasFilter>>>;
  id?: InputMaybe<Array<Scalars['ID']['input']>>;
  not?: InputMaybe<OAuthProviderConfigFilter>;
  or?: InputMaybe<Array<InputMaybe<OAuthProviderConfigFilter>>>;
  provider?: InputMaybe<OAuthProviderType_Hash>;
};

export enum OAuthProviderConfigHasFilter {
  ClientId = 'clientId',
  CreatedAt = 'createdAt',
  Enabled = 'enabled',
  EncryptedClientSecret = 'encryptedClientSecret',
  Provider = 'provider',
  TenantId = 'tenantId',
  UpdatedAt = 'updatedAt',
  Workspace = 'workspace'
}

export type OAuthProviderConfigOrder = {
  asc?: InputMaybe<OAuthProviderConfigOrderable>;
  desc?: InputMaybe<OAuthProviderConfigOrderable>;
  then?: InputMaybe<OAuthProviderConfigOrder>;
};

export enum OAuthProviderConfigOrderable {
  ClientId = 'clientId',
  CreatedAt = 'createdAt',
  EncryptedClientSecret = 'encryptedClientSecret',
  TenantId = 'tenantId',
  UpdatedAt = 'updatedAt'
}

export type OAuthProviderConfigPatch = {
  clientId?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  encryptedClientSecret?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<OAuthProviderType>;
  tenantId?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export type OAuthProviderConfigRef = {
  clientId?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  encryptedClientSecret?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  provider?: InputMaybe<OAuthProviderType>;
  tenantId?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export enum OAuthProviderType {
  Google = 'GOOGLE',
  Microsoft = 'MICROSOFT',
  Notion = 'NOTION'
}

export type OAuthProviderType_Hash = {
  eq?: InputMaybe<OAuthProviderType>;
  in?: InputMaybe<Array<InputMaybe<OAuthProviderType>>>;
};

export type OnboardingStep = {
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  metadata?: Maybe<Scalars['String']['output']>;
  priority?: Maybe<Scalars['Int']['output']>;
  status: OnboardingStepStatus;
  stepId: Scalars['String']['output'];
  type: OnboardingStepType;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type OnboardingStepAggregateResult = {
  count?: Maybe<Scalars['Int']['output']>;
  createdAtMax?: Maybe<Scalars['DateTime']['output']>;
  createdAtMin?: Maybe<Scalars['DateTime']['output']>;
  metadataMax?: Maybe<Scalars['String']['output']>;
  metadataMin?: Maybe<Scalars['String']['output']>;
  priorityAvg?: Maybe<Scalars['Float']['output']>;
  priorityMax?: Maybe<Scalars['Int']['output']>;
  priorityMin?: Maybe<Scalars['Int']['output']>;
  prioritySum?: Maybe<Scalars['Int']['output']>;
  stepIdMax?: Maybe<Scalars['String']['output']>;
  stepIdMin?: Maybe<Scalars['String']['output']>;
  updatedAtMax?: Maybe<Scalars['DateTime']['output']>;
  updatedAtMin?: Maybe<Scalars['DateTime']['output']>;
};

export type OnboardingStepFilter = {
  and?: InputMaybe<Array<InputMaybe<OnboardingStepFilter>>>;
  has?: InputMaybe<Array<InputMaybe<OnboardingStepHasFilter>>>;
  id?: InputMaybe<Array<Scalars['ID']['input']>>;
  not?: InputMaybe<OnboardingStepFilter>;
  or?: InputMaybe<Array<InputMaybe<OnboardingStepFilter>>>;
  stepId?: InputMaybe<StringHashFilter>;
};

export enum OnboardingStepHasFilter {
  CreatedAt = 'createdAt',
  Metadata = 'metadata',
  Priority = 'priority',
  Status = 'status',
  StepId = 'stepId',
  Type = 'type',
  UpdatedAt = 'updatedAt'
}

export type OnboardingStepOrder = {
  asc?: InputMaybe<OnboardingStepOrderable>;
  desc?: InputMaybe<OnboardingStepOrderable>;
  then?: InputMaybe<OnboardingStepOrder>;
};

export enum OnboardingStepOrderable {
  CreatedAt = 'createdAt',
  Metadata = 'metadata',
  Priority = 'priority',
  StepId = 'stepId',
  UpdatedAt = 'updatedAt'
}

export type OnboardingStepPatch = {
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  metadata?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<OnboardingStepStatus>;
  stepId?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<OnboardingStepType>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type OnboardingStepRef = {
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  metadata?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<OnboardingStepStatus>;
  stepId?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<OnboardingStepType>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export enum OnboardingStepStatus {
  Completed = 'COMPLETED',
  Dismissed = 'DISMISSED',
  Pending = 'PENDING'
}

export enum OnboardingStepType {
  Announcement = 'ANNOUNCEMENT',
  Learning = 'LEARNING',
  Onboarding = 'ONBOARDING'
}

export type Point = {
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
};

export type PointGeoFilter = {
  near?: InputMaybe<NearFilter>;
  within?: InputMaybe<WithinFilter>;
};

export type PointList = {
  points: Array<Point>;
};

export type PointListRef = {
  points: Array<PointRef>;
};

export type PointRef = {
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
};

export type Polygon = {
  coordinates: Array<PointList>;
};

export type PolygonGeoFilter = {
  contains?: InputMaybe<ContainsFilter>;
  intersects?: InputMaybe<IntersectsFilter>;
  near?: InputMaybe<NearFilter>;
  within?: InputMaybe<WithinFilter>;
};

export type PolygonRef = {
  coordinates: Array<PointListRef>;
};

export type Query = {
  aggregateAIConfig?: Maybe<AiConfigAggregateResult>;
  aggregateAIProviderConfig?: Maybe<AiProviderConfigAggregateResult>;
  aggregateIdentityKey?: Maybe<IdentityKeyAggregateResult>;
  aggregateMCPRegistryServer?: Maybe<McpRegistryServerAggregateResult>;
  aggregateMCPServer?: Maybe<McpServerAggregateResult>;
  aggregateMCPTool?: Maybe<McpToolAggregateResult>;
  aggregateOAuthProviderConfig?: Maybe<OAuthProviderConfigAggregateResult>;
  aggregateOnboardingStep?: Maybe<OnboardingStepAggregateResult>;
  aggregateRuntime?: Maybe<RuntimeAggregateResult>;
  aggregateSession?: Maybe<SessionAggregateResult>;
  aggregateSkill?: Maybe<SkillAggregateResult>;
  aggregateSystem?: Maybe<SystemAggregateResult>;
  aggregateToolCall?: Maybe<ToolCallAggregateResult>;
  aggregateUser?: Maybe<UserAggregateResult>;
  aggregateUserOAuthConnection?: Maybe<UserOAuthConnectionAggregateResult>;
  aggregateWorkspace?: Maybe<WorkspaceAggregateResult>;
  getAIConfig?: Maybe<AiConfig>;
  getAIProviderConfig?: Maybe<AiProviderConfig>;
  getIdentityKey?: Maybe<IdentityKey>;
  getMCPRegistryServer?: Maybe<McpRegistryServer>;
  getMCPServer?: Maybe<McpServer>;
  getMCPTool?: Maybe<McpTool>;
  getOAuthProviderConfig?: Maybe<OAuthProviderConfig>;
  getOnboardingStep?: Maybe<OnboardingStep>;
  getRuntime?: Maybe<Runtime>;
  getSession?: Maybe<Session>;
  getSkill?: Maybe<Skill>;
  getSystem?: Maybe<System>;
  getToolCall?: Maybe<ToolCall>;
  getUser?: Maybe<User>;
  getUserOAuthConnection?: Maybe<UserOAuthConnection>;
  getWorkspace?: Maybe<Workspace>;
  queryAIConfig?: Maybe<Array<Maybe<AiConfig>>>;
  queryAIProviderConfig?: Maybe<Array<Maybe<AiProviderConfig>>>;
  queryIdentityKey?: Maybe<Array<Maybe<IdentityKey>>>;
  queryMCPRegistryServer?: Maybe<Array<Maybe<McpRegistryServer>>>;
  queryMCPServer?: Maybe<Array<Maybe<McpServer>>>;
  queryMCPTool?: Maybe<Array<Maybe<McpTool>>>;
  queryOAuthProviderConfig?: Maybe<Array<Maybe<OAuthProviderConfig>>>;
  queryOnboardingStep?: Maybe<Array<Maybe<OnboardingStep>>>;
  queryRuntime?: Maybe<Array<Maybe<Runtime>>>;
  querySession?: Maybe<Array<Maybe<Session>>>;
  querySkill?: Maybe<Array<Maybe<Skill>>>;
  querySystem?: Maybe<Array<Maybe<System>>>;
  queryToolCall?: Maybe<Array<Maybe<ToolCall>>>;
  queryUser?: Maybe<Array<Maybe<User>>>;
  queryUserOAuthConnection?: Maybe<Array<Maybe<UserOAuthConnection>>>;
  queryWorkspace?: Maybe<Array<Maybe<Workspace>>>;
};


export type QueryAggregateAiConfigArgs = {
  filter?: InputMaybe<AiConfigFilter>;
};


export type QueryAggregateAiProviderConfigArgs = {
  filter?: InputMaybe<AiProviderConfigFilter>;
};


export type QueryAggregateIdentityKeyArgs = {
  filter?: InputMaybe<IdentityKeyFilter>;
};


export type QueryAggregateMcpRegistryServerArgs = {
  filter?: InputMaybe<McpRegistryServerFilter>;
};


export type QueryAggregateMcpServerArgs = {
  filter?: InputMaybe<McpServerFilter>;
};


export type QueryAggregateMcpToolArgs = {
  filter?: InputMaybe<McpToolFilter>;
};


export type QueryAggregateOAuthProviderConfigArgs = {
  filter?: InputMaybe<OAuthProviderConfigFilter>;
};


export type QueryAggregateOnboardingStepArgs = {
  filter?: InputMaybe<OnboardingStepFilter>;
};


export type QueryAggregateRuntimeArgs = {
  filter?: InputMaybe<RuntimeFilter>;
};


export type QueryAggregateSessionArgs = {
  filter?: InputMaybe<SessionFilter>;
};


export type QueryAggregateSkillArgs = {
  filter?: InputMaybe<SkillFilter>;
};


export type QueryAggregateSystemArgs = {
  filter?: InputMaybe<SystemFilter>;
};


export type QueryAggregateToolCallArgs = {
  filter?: InputMaybe<ToolCallFilter>;
};


export type QueryAggregateUserArgs = {
  filter?: InputMaybe<UserFilter>;
};


export type QueryAggregateUserOAuthConnectionArgs = {
  filter?: InputMaybe<UserOAuthConnectionFilter>;
};


export type QueryAggregateWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
};


export type QueryGetAiConfigArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetAiProviderConfigArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetIdentityKeyArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetMcpRegistryServerArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetMcpServerArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetMcpToolArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetOAuthProviderConfigArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetOnboardingStepArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetRuntimeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetSessionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetSkillArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetSystemArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetToolCallArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetUserOAuthConnectionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetWorkspaceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryQueryAiConfigArgs = {
  filter?: InputMaybe<AiConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<AiConfigOrder>;
};


export type QueryQueryAiProviderConfigArgs = {
  filter?: InputMaybe<AiProviderConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<AiProviderConfigOrder>;
};


export type QueryQueryIdentityKeyArgs = {
  filter?: InputMaybe<IdentityKeyFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<IdentityKeyOrder>;
};


export type QueryQueryMcpRegistryServerArgs = {
  filter?: InputMaybe<McpRegistryServerFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpRegistryServerOrder>;
};


export type QueryQueryMcpServerArgs = {
  filter?: InputMaybe<McpServerFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpServerOrder>;
};


export type QueryQueryMcpToolArgs = {
  filter?: InputMaybe<McpToolFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpToolOrder>;
};


export type QueryQueryOAuthProviderConfigArgs = {
  filter?: InputMaybe<OAuthProviderConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<OAuthProviderConfigOrder>;
};


export type QueryQueryOnboardingStepArgs = {
  filter?: InputMaybe<OnboardingStepFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<OnboardingStepOrder>;
};


export type QueryQueryRuntimeArgs = {
  filter?: InputMaybe<RuntimeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<RuntimeOrder>;
};


export type QueryQuerySessionArgs = {
  filter?: InputMaybe<SessionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SessionOrder>;
};


export type QueryQuerySkillArgs = {
  filter?: InputMaybe<SkillFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SkillOrder>;
};


export type QueryQuerySystemArgs = {
  filter?: InputMaybe<SystemFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SystemOrder>;
};


export type QueryQueryToolCallArgs = {
  filter?: InputMaybe<ToolCallFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ToolCallOrder>;
};


export type QueryQueryUserArgs = {
  filter?: InputMaybe<UserFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<UserOrder>;
};


export type QueryQueryUserOAuthConnectionArgs = {
  filter?: InputMaybe<UserOAuthConnectionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<UserOAuthConnectionOrder>;
};


export type QueryQueryWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<WorkspaceOrder>;
};

export type Runtime = {
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  hostIP?: Maybe<Scalars['String']['output']>;
  hostname?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastSeenAt?: Maybe<Scalars['DateTime']['output']>;
  mcpClientName?: Maybe<Scalars['String']['output']>;
  mcpServers?: Maybe<Array<McpServer>>;
  mcpServersAggregate?: Maybe<McpServerAggregateResult>;
  name: Scalars['String']['output'];
  processId?: Maybe<Scalars['String']['output']>;
  roots?: Maybe<Scalars['String']['output']>;
  skills?: Maybe<Array<Skill>>;
  skillsAggregate?: Maybe<SkillAggregateResult>;
  status: ActiveStatus;
  system?: Maybe<System>;
  toolResponses?: Maybe<Array<ToolCall>>;
  toolResponsesAggregate?: Maybe<ToolCallAggregateResult>;
  type: RuntimeType;
  workspace?: Maybe<Workspace>;
};


export type RuntimeMcpServersArgs = {
  filter?: InputMaybe<McpServerFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpServerOrder>;
};


export type RuntimeMcpServersAggregateArgs = {
  filter?: InputMaybe<McpServerFilter>;
};


export type RuntimeSkillsArgs = {
  filter?: InputMaybe<SkillFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SkillOrder>;
};


export type RuntimeSkillsAggregateArgs = {
  filter?: InputMaybe<SkillFilter>;
};


export type RuntimeSystemArgs = {
  filter?: InputMaybe<SystemFilter>;
};


export type RuntimeToolResponsesArgs = {
  filter?: InputMaybe<ToolCallFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ToolCallOrder>;
};


export type RuntimeToolResponsesAggregateArgs = {
  filter?: InputMaybe<ToolCallFilter>;
};


export type RuntimeWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
};

export type RuntimeAggregateResult = {
  count?: Maybe<Scalars['Int']['output']>;
  createdAtMax?: Maybe<Scalars['DateTime']['output']>;
  createdAtMin?: Maybe<Scalars['DateTime']['output']>;
  descriptionMax?: Maybe<Scalars['String']['output']>;
  descriptionMin?: Maybe<Scalars['String']['output']>;
  hostIPMax?: Maybe<Scalars['String']['output']>;
  hostIPMin?: Maybe<Scalars['String']['output']>;
  hostnameMax?: Maybe<Scalars['String']['output']>;
  hostnameMin?: Maybe<Scalars['String']['output']>;
  lastSeenAtMax?: Maybe<Scalars['DateTime']['output']>;
  lastSeenAtMin?: Maybe<Scalars['DateTime']['output']>;
  mcpClientNameMax?: Maybe<Scalars['String']['output']>;
  mcpClientNameMin?: Maybe<Scalars['String']['output']>;
  nameMax?: Maybe<Scalars['String']['output']>;
  nameMin?: Maybe<Scalars['String']['output']>;
  processIdMax?: Maybe<Scalars['String']['output']>;
  processIdMin?: Maybe<Scalars['String']['output']>;
  rootsMax?: Maybe<Scalars['String']['output']>;
  rootsMin?: Maybe<Scalars['String']['output']>;
};

export type RuntimeFilter = {
  and?: InputMaybe<Array<InputMaybe<RuntimeFilter>>>;
  has?: InputMaybe<Array<InputMaybe<RuntimeHasFilter>>>;
  id?: InputMaybe<Array<Scalars['ID']['input']>>;
  name?: InputMaybe<StringHashFilter>;
  not?: InputMaybe<RuntimeFilter>;
  or?: InputMaybe<Array<InputMaybe<RuntimeFilter>>>;
  status?: InputMaybe<ActiveStatus_Hash>;
  type?: InputMaybe<RuntimeType_Hash>;
};

export enum RuntimeHasFilter {
  CreatedAt = 'createdAt',
  Description = 'description',
  HostIp = 'hostIP',
  Hostname = 'hostname',
  LastSeenAt = 'lastSeenAt',
  McpClientName = 'mcpClientName',
  McpServers = 'mcpServers',
  Name = 'name',
  ProcessId = 'processId',
  Roots = 'roots',
  Skills = 'skills',
  Status = 'status',
  System = 'system',
  ToolResponses = 'toolResponses',
  Type = 'type',
  Workspace = 'workspace'
}

export type RuntimeOrder = {
  asc?: InputMaybe<RuntimeOrderable>;
  desc?: InputMaybe<RuntimeOrderable>;
  then?: InputMaybe<RuntimeOrder>;
};

export enum RuntimeOrderable {
  CreatedAt = 'createdAt',
  Description = 'description',
  HostIp = 'hostIP',
  Hostname = 'hostname',
  LastSeenAt = 'lastSeenAt',
  McpClientName = 'mcpClientName',
  Name = 'name',
  ProcessId = 'processId',
  Roots = 'roots'
}

export type RuntimePatch = {
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  hostIP?: InputMaybe<Scalars['String']['input']>;
  hostname?: InputMaybe<Scalars['String']['input']>;
  lastSeenAt?: InputMaybe<Scalars['DateTime']['input']>;
  mcpClientName?: InputMaybe<Scalars['String']['input']>;
  mcpServers?: InputMaybe<Array<McpServerRef>>;
  name?: InputMaybe<Scalars['String']['input']>;
  processId?: InputMaybe<Scalars['String']['input']>;
  roots?: InputMaybe<Scalars['String']['input']>;
  skills?: InputMaybe<Array<SkillRef>>;
  status?: InputMaybe<ActiveStatus>;
  system?: InputMaybe<SystemRef>;
  toolResponses?: InputMaybe<Array<ToolCallRef>>;
  type?: InputMaybe<RuntimeType>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export type RuntimeRef = {
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  hostIP?: InputMaybe<Scalars['String']['input']>;
  hostname?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  lastSeenAt?: InputMaybe<Scalars['DateTime']['input']>;
  mcpClientName?: InputMaybe<Scalars['String']['input']>;
  mcpServers?: InputMaybe<Array<McpServerRef>>;
  name?: InputMaybe<Scalars['String']['input']>;
  processId?: InputMaybe<Scalars['String']['input']>;
  roots?: InputMaybe<Scalars['String']['input']>;
  skills?: InputMaybe<Array<SkillRef>>;
  status?: InputMaybe<ActiveStatus>;
  system?: InputMaybe<SystemRef>;
  toolResponses?: InputMaybe<Array<ToolCallRef>>;
  type?: InputMaybe<RuntimeType>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export enum RuntimeType {
  Edge = 'EDGE',
  Mcp = 'MCP'
}

export type RuntimeType_Hash = {
  eq?: InputMaybe<RuntimeType>;
  in?: InputMaybe<Array<InputMaybe<RuntimeType>>>;
};

export type Session = {
  createdAt: Scalars['DateTime']['output'];
  deviceInfo?: Maybe<Scalars['String']['output']>;
  expiresAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  ipAddress?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  lastUsedAt?: Maybe<Scalars['DateTime']['output']>;
  refreshToken: Scalars['String']['output'];
  user: User;
  userAgent?: Maybe<Scalars['String']['output']>;
  userId: Scalars['String']['output'];
};


export type SessionUserArgs = {
  filter?: InputMaybe<UserFilter>;
};

export type SessionAggregateResult = {
  count?: Maybe<Scalars['Int']['output']>;
  createdAtMax?: Maybe<Scalars['DateTime']['output']>;
  createdAtMin?: Maybe<Scalars['DateTime']['output']>;
  deviceInfoMax?: Maybe<Scalars['String']['output']>;
  deviceInfoMin?: Maybe<Scalars['String']['output']>;
  expiresAtMax?: Maybe<Scalars['DateTime']['output']>;
  expiresAtMin?: Maybe<Scalars['DateTime']['output']>;
  ipAddressMax?: Maybe<Scalars['String']['output']>;
  ipAddressMin?: Maybe<Scalars['String']['output']>;
  lastUsedAtMax?: Maybe<Scalars['DateTime']['output']>;
  lastUsedAtMin?: Maybe<Scalars['DateTime']['output']>;
  refreshTokenMax?: Maybe<Scalars['String']['output']>;
  refreshTokenMin?: Maybe<Scalars['String']['output']>;
  userAgentMax?: Maybe<Scalars['String']['output']>;
  userAgentMin?: Maybe<Scalars['String']['output']>;
  userIdMax?: Maybe<Scalars['String']['output']>;
  userIdMin?: Maybe<Scalars['String']['output']>;
};

export type SessionFilter = {
  and?: InputMaybe<Array<InputMaybe<SessionFilter>>>;
  expiresAt?: InputMaybe<DateTimeFilter>;
  has?: InputMaybe<Array<InputMaybe<SessionHasFilter>>>;
  id?: InputMaybe<Array<Scalars['ID']['input']>>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  not?: InputMaybe<SessionFilter>;
  or?: InputMaybe<Array<InputMaybe<SessionFilter>>>;
  refreshToken?: InputMaybe<StringHashFilter>;
  userId?: InputMaybe<StringHashFilter>;
};

export enum SessionHasFilter {
  CreatedAt = 'createdAt',
  DeviceInfo = 'deviceInfo',
  ExpiresAt = 'expiresAt',
  IpAddress = 'ipAddress',
  IsActive = 'isActive',
  LastUsedAt = 'lastUsedAt',
  RefreshToken = 'refreshToken',
  User = 'user',
  UserAgent = 'userAgent',
  UserId = 'userId'
}

export type SessionOrder = {
  asc?: InputMaybe<SessionOrderable>;
  desc?: InputMaybe<SessionOrderable>;
  then?: InputMaybe<SessionOrder>;
};

export enum SessionOrderable {
  CreatedAt = 'createdAt',
  DeviceInfo = 'deviceInfo',
  ExpiresAt = 'expiresAt',
  IpAddress = 'ipAddress',
  LastUsedAt = 'lastUsedAt',
  RefreshToken = 'refreshToken',
  UserAgent = 'userAgent',
  UserId = 'userId'
}

export type SessionPatch = {
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  deviceInfo?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  ipAddress?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  lastUsedAt?: InputMaybe<Scalars['DateTime']['input']>;
  refreshToken?: InputMaybe<Scalars['String']['input']>;
  user?: InputMaybe<UserRef>;
  userAgent?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type SessionRef = {
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  deviceInfo?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  ipAddress?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  lastUsedAt?: InputMaybe<Scalars['DateTime']['input']>;
  refreshToken?: InputMaybe<Scalars['String']['input']>;
  user?: InputMaybe<UserRef>;
  userAgent?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type Skill = {
  associatedKnowledge?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  executionTarget?: Maybe<ExecutionTarget>;
  guardrails?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  maxTokens?: Maybe<Scalars['Int']['output']>;
  mcpTools?: Maybe<Array<McpTool>>;
  mcpToolsAggregate?: Maybe<McpToolAggregateResult>;
  mode?: Maybe<SkillMode>;
  model?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  runtime?: Maybe<Runtime>;
  skillToolCalls?: Maybe<Array<ToolCall>>;
  skillToolCallsAggregate?: Maybe<ToolCallAggregateResult>;
  systemPrompt?: Maybe<Scalars['String']['output']>;
  temperature?: Maybe<Scalars['Float']['output']>;
  toolCalls?: Maybe<Array<ToolCall>>;
  toolCallsAggregate?: Maybe<ToolCallAggregateResult>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  workspace: Workspace;
};


export type SkillMcpToolsArgs = {
  filter?: InputMaybe<McpToolFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpToolOrder>;
};


export type SkillMcpToolsAggregateArgs = {
  filter?: InputMaybe<McpToolFilter>;
};


export type SkillRuntimeArgs = {
  filter?: InputMaybe<RuntimeFilter>;
};


export type SkillSkillToolCallsArgs = {
  filter?: InputMaybe<ToolCallFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ToolCallOrder>;
};


export type SkillSkillToolCallsAggregateArgs = {
  filter?: InputMaybe<ToolCallFilter>;
};


export type SkillToolCallsArgs = {
  filter?: InputMaybe<ToolCallFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ToolCallOrder>;
};


export type SkillToolCallsAggregateArgs = {
  filter?: InputMaybe<ToolCallFilter>;
};


export type SkillWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
};

export type SkillAggregateResult = {
  associatedKnowledgeMax?: Maybe<Scalars['String']['output']>;
  associatedKnowledgeMin?: Maybe<Scalars['String']['output']>;
  count?: Maybe<Scalars['Int']['output']>;
  createdAtMax?: Maybe<Scalars['DateTime']['output']>;
  createdAtMin?: Maybe<Scalars['DateTime']['output']>;
  descriptionMax?: Maybe<Scalars['String']['output']>;
  descriptionMin?: Maybe<Scalars['String']['output']>;
  guardrailsMax?: Maybe<Scalars['String']['output']>;
  guardrailsMin?: Maybe<Scalars['String']['output']>;
  maxTokensAvg?: Maybe<Scalars['Float']['output']>;
  maxTokensMax?: Maybe<Scalars['Int']['output']>;
  maxTokensMin?: Maybe<Scalars['Int']['output']>;
  maxTokensSum?: Maybe<Scalars['Int']['output']>;
  modelMax?: Maybe<Scalars['String']['output']>;
  modelMin?: Maybe<Scalars['String']['output']>;
  nameMax?: Maybe<Scalars['String']['output']>;
  nameMin?: Maybe<Scalars['String']['output']>;
  systemPromptMax?: Maybe<Scalars['String']['output']>;
  systemPromptMin?: Maybe<Scalars['String']['output']>;
  temperatureAvg?: Maybe<Scalars['Float']['output']>;
  temperatureMax?: Maybe<Scalars['Float']['output']>;
  temperatureMin?: Maybe<Scalars['Float']['output']>;
  temperatureSum?: Maybe<Scalars['Float']['output']>;
  updatedAtMax?: Maybe<Scalars['DateTime']['output']>;
  updatedAtMin?: Maybe<Scalars['DateTime']['output']>;
};

export type SkillFilter = {
  and?: InputMaybe<Array<InputMaybe<SkillFilter>>>;
  executionTarget?: InputMaybe<ExecutionTarget_Hash>;
  has?: InputMaybe<Array<InputMaybe<SkillHasFilter>>>;
  id?: InputMaybe<Array<Scalars['ID']['input']>>;
  mode?: InputMaybe<SkillMode_Hash>;
  name?: InputMaybe<StringHashFilter>;
  not?: InputMaybe<SkillFilter>;
  or?: InputMaybe<Array<InputMaybe<SkillFilter>>>;
};

export enum SkillHasFilter {
  AssociatedKnowledge = 'associatedKnowledge',
  CreatedAt = 'createdAt',
  Description = 'description',
  ExecutionTarget = 'executionTarget',
  Guardrails = 'guardrails',
  MaxTokens = 'maxTokens',
  McpTools = 'mcpTools',
  Mode = 'mode',
  Model = 'model',
  Name = 'name',
  Runtime = 'runtime',
  SkillToolCalls = 'skillToolCalls',
  SystemPrompt = 'systemPrompt',
  Temperature = 'temperature',
  ToolCalls = 'toolCalls',
  UpdatedAt = 'updatedAt',
  Workspace = 'workspace'
}

export enum SkillMode {
  List = 'LIST',
  Optimized = 'OPTIMIZED',
  Smart = 'SMART'
}

export type SkillMode_Hash = {
  eq?: InputMaybe<SkillMode>;
  in?: InputMaybe<Array<InputMaybe<SkillMode>>>;
};

export type SkillOrder = {
  asc?: InputMaybe<SkillOrderable>;
  desc?: InputMaybe<SkillOrderable>;
  then?: InputMaybe<SkillOrder>;
};

export enum SkillOrderable {
  AssociatedKnowledge = 'associatedKnowledge',
  CreatedAt = 'createdAt',
  Description = 'description',
  Guardrails = 'guardrails',
  MaxTokens = 'maxTokens',
  Model = 'model',
  Name = 'name',
  SystemPrompt = 'systemPrompt',
  Temperature = 'temperature',
  UpdatedAt = 'updatedAt'
}

export type SkillPatch = {
  associatedKnowledge?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  executionTarget?: InputMaybe<ExecutionTarget>;
  guardrails?: InputMaybe<Scalars['String']['input']>;
  maxTokens?: InputMaybe<Scalars['Int']['input']>;
  mcpTools?: InputMaybe<Array<McpToolRef>>;
  mode?: InputMaybe<SkillMode>;
  model?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  runtime?: InputMaybe<RuntimeRef>;
  skillToolCalls?: InputMaybe<Array<ToolCallRef>>;
  systemPrompt?: InputMaybe<Scalars['String']['input']>;
  temperature?: InputMaybe<Scalars['Float']['input']>;
  toolCalls?: InputMaybe<Array<ToolCallRef>>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export type SkillRef = {
  associatedKnowledge?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  executionTarget?: InputMaybe<ExecutionTarget>;
  guardrails?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  maxTokens?: InputMaybe<Scalars['Int']['input']>;
  mcpTools?: InputMaybe<Array<McpToolRef>>;
  mode?: InputMaybe<SkillMode>;
  model?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  runtime?: InputMaybe<RuntimeRef>;
  skillToolCalls?: InputMaybe<Array<ToolCallRef>>;
  systemPrompt?: InputMaybe<Scalars['String']['input']>;
  temperature?: InputMaybe<Scalars['Float']['input']>;
  toolCalls?: InputMaybe<Array<ToolCallRef>>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export type StringExactFilter = {
  between?: InputMaybe<StringRange>;
  eq?: InputMaybe<Scalars['String']['input']>;
  ge?: InputMaybe<Scalars['String']['input']>;
  gt?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  le?: InputMaybe<Scalars['String']['input']>;
  lt?: InputMaybe<Scalars['String']['input']>;
};

export type StringFullTextFilter = {
  alloftext?: InputMaybe<Scalars['String']['input']>;
  anyoftext?: InputMaybe<Scalars['String']['input']>;
};

export type StringHashFilter = {
  eq?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type StringNgramFilter = {
  ngram?: InputMaybe<Scalars['String']['input']>;
};

export type StringRange = {
  max: Scalars['String']['input'];
  min: Scalars['String']['input'];
};

export type StringRegExpFilter = {
  regexp?: InputMaybe<Scalars['String']['input']>;
};

export type StringTermFilter = {
  allofterms?: InputMaybe<Scalars['String']['input']>;
  anyofterms?: InputMaybe<Scalars['String']['input']>;
};

export type Subscription = {
  aggregateAIConfig?: Maybe<AiConfigAggregateResult>;
  aggregateAIProviderConfig?: Maybe<AiProviderConfigAggregateResult>;
  aggregateIdentityKey?: Maybe<IdentityKeyAggregateResult>;
  aggregateMCPRegistryServer?: Maybe<McpRegistryServerAggregateResult>;
  aggregateMCPServer?: Maybe<McpServerAggregateResult>;
  aggregateMCPTool?: Maybe<McpToolAggregateResult>;
  aggregateOAuthProviderConfig?: Maybe<OAuthProviderConfigAggregateResult>;
  aggregateRuntime?: Maybe<RuntimeAggregateResult>;
  aggregateSession?: Maybe<SessionAggregateResult>;
  aggregateSkill?: Maybe<SkillAggregateResult>;
  aggregateSystem?: Maybe<SystemAggregateResult>;
  aggregateUser?: Maybe<UserAggregateResult>;
  aggregateUserOAuthConnection?: Maybe<UserOAuthConnectionAggregateResult>;
  aggregateWorkspace?: Maybe<WorkspaceAggregateResult>;
  getAIConfig?: Maybe<AiConfig>;
  getAIProviderConfig?: Maybe<AiProviderConfig>;
  getIdentityKey?: Maybe<IdentityKey>;
  getMCPRegistryServer?: Maybe<McpRegistryServer>;
  getMCPServer?: Maybe<McpServer>;
  getMCPTool?: Maybe<McpTool>;
  getOAuthProviderConfig?: Maybe<OAuthProviderConfig>;
  getRuntime?: Maybe<Runtime>;
  getSession?: Maybe<Session>;
  getSkill?: Maybe<Skill>;
  getSystem?: Maybe<System>;
  getUser?: Maybe<User>;
  getUserOAuthConnection?: Maybe<UserOAuthConnection>;
  getWorkspace?: Maybe<Workspace>;
  queryAIConfig?: Maybe<Array<Maybe<AiConfig>>>;
  queryAIProviderConfig?: Maybe<Array<Maybe<AiProviderConfig>>>;
  queryIdentityKey?: Maybe<Array<Maybe<IdentityKey>>>;
  queryMCPRegistryServer?: Maybe<Array<Maybe<McpRegistryServer>>>;
  queryMCPServer?: Maybe<Array<Maybe<McpServer>>>;
  queryMCPTool?: Maybe<Array<Maybe<McpTool>>>;
  queryOAuthProviderConfig?: Maybe<Array<Maybe<OAuthProviderConfig>>>;
  queryRuntime?: Maybe<Array<Maybe<Runtime>>>;
  querySession?: Maybe<Array<Maybe<Session>>>;
  querySkill?: Maybe<Array<Maybe<Skill>>>;
  querySystem?: Maybe<Array<Maybe<System>>>;
  queryUser?: Maybe<Array<Maybe<User>>>;
  queryUserOAuthConnection?: Maybe<Array<Maybe<UserOAuthConnection>>>;
  queryWorkspace?: Maybe<Array<Maybe<Workspace>>>;
};


export type SubscriptionAggregateAiConfigArgs = {
  filter?: InputMaybe<AiConfigFilter>;
};


export type SubscriptionAggregateAiProviderConfigArgs = {
  filter?: InputMaybe<AiProviderConfigFilter>;
};


export type SubscriptionAggregateIdentityKeyArgs = {
  filter?: InputMaybe<IdentityKeyFilter>;
};


export type SubscriptionAggregateMcpRegistryServerArgs = {
  filter?: InputMaybe<McpRegistryServerFilter>;
};


export type SubscriptionAggregateMcpServerArgs = {
  filter?: InputMaybe<McpServerFilter>;
};


export type SubscriptionAggregateMcpToolArgs = {
  filter?: InputMaybe<McpToolFilter>;
};


export type SubscriptionAggregateOAuthProviderConfigArgs = {
  filter?: InputMaybe<OAuthProviderConfigFilter>;
};


export type SubscriptionAggregateRuntimeArgs = {
  filter?: InputMaybe<RuntimeFilter>;
};


export type SubscriptionAggregateSessionArgs = {
  filter?: InputMaybe<SessionFilter>;
};


export type SubscriptionAggregateSkillArgs = {
  filter?: InputMaybe<SkillFilter>;
};


export type SubscriptionAggregateSystemArgs = {
  filter?: InputMaybe<SystemFilter>;
};


export type SubscriptionAggregateUserArgs = {
  filter?: InputMaybe<UserFilter>;
};


export type SubscriptionAggregateUserOAuthConnectionArgs = {
  filter?: InputMaybe<UserOAuthConnectionFilter>;
};


export type SubscriptionAggregateWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
};


export type SubscriptionGetAiConfigArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionGetAiProviderConfigArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionGetIdentityKeyArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
};


export type SubscriptionGetMcpRegistryServerArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionGetMcpServerArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionGetMcpToolArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionGetOAuthProviderConfigArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionGetRuntimeArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionGetSessionArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionGetSkillArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionGetSystemArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionGetUserArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionGetUserOAuthConnectionArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionGetWorkspaceArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionQueryAiConfigArgs = {
  filter?: InputMaybe<AiConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<AiConfigOrder>;
};


export type SubscriptionQueryAiProviderConfigArgs = {
  filter?: InputMaybe<AiProviderConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<AiProviderConfigOrder>;
};


export type SubscriptionQueryIdentityKeyArgs = {
  filter?: InputMaybe<IdentityKeyFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<IdentityKeyOrder>;
};


export type SubscriptionQueryMcpRegistryServerArgs = {
  filter?: InputMaybe<McpRegistryServerFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpRegistryServerOrder>;
};


export type SubscriptionQueryMcpServerArgs = {
  filter?: InputMaybe<McpServerFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpServerOrder>;
};


export type SubscriptionQueryMcpToolArgs = {
  filter?: InputMaybe<McpToolFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpToolOrder>;
};


export type SubscriptionQueryOAuthProviderConfigArgs = {
  filter?: InputMaybe<OAuthProviderConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<OAuthProviderConfigOrder>;
};


export type SubscriptionQueryRuntimeArgs = {
  filter?: InputMaybe<RuntimeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<RuntimeOrder>;
};


export type SubscriptionQuerySessionArgs = {
  filter?: InputMaybe<SessionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SessionOrder>;
};


export type SubscriptionQuerySkillArgs = {
  filter?: InputMaybe<SkillFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SkillOrder>;
};


export type SubscriptionQuerySystemArgs = {
  filter?: InputMaybe<SystemFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SystemOrder>;
};


export type SubscriptionQueryUserArgs = {
  filter?: InputMaybe<UserFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<UserOrder>;
};


export type SubscriptionQueryUserOAuthConnectionArgs = {
  filter?: InputMaybe<UserOAuthConnectionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<UserOAuthConnectionOrder>;
};


export type SubscriptionQueryWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<WorkspaceOrder>;
};

export type System = {
  admins?: Maybe<Array<User>>;
  adminsAggregate?: Maybe<UserAggregateResult>;
  createdAt: Scalars['DateTime']['output'];
  defaultWorkspace?: Maybe<Workspace>;
  id: Scalars['ID']['output'];
  initialized: Scalars['Boolean']['output'];
  instanceId: Scalars['String']['output'];
  runtimes?: Maybe<Array<Runtime>>;
  runtimesAggregate?: Maybe<RuntimeAggregateResult>;
  updatedAt: Scalars['DateTime']['output'];
  workspaces?: Maybe<Array<Workspace>>;
  workspacesAggregate?: Maybe<WorkspaceAggregateResult>;
};


export type SystemAdminsArgs = {
  filter?: InputMaybe<UserFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<UserOrder>;
};


export type SystemAdminsAggregateArgs = {
  filter?: InputMaybe<UserFilter>;
};


export type SystemDefaultWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
};


export type SystemRuntimesArgs = {
  filter?: InputMaybe<RuntimeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<RuntimeOrder>;
};


export type SystemRuntimesAggregateArgs = {
  filter?: InputMaybe<RuntimeFilter>;
};


export type SystemWorkspacesArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<WorkspaceOrder>;
};


export type SystemWorkspacesAggregateArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
};

export type SystemAggregateResult = {
  count?: Maybe<Scalars['Int']['output']>;
  createdAtMax?: Maybe<Scalars['DateTime']['output']>;
  createdAtMin?: Maybe<Scalars['DateTime']['output']>;
  instanceIdMax?: Maybe<Scalars['String']['output']>;
  instanceIdMin?: Maybe<Scalars['String']['output']>;
  updatedAtMax?: Maybe<Scalars['DateTime']['output']>;
  updatedAtMin?: Maybe<Scalars['DateTime']['output']>;
};

export type SystemFilter = {
  and?: InputMaybe<Array<InputMaybe<SystemFilter>>>;
  has?: InputMaybe<Array<InputMaybe<SystemHasFilter>>>;
  id?: InputMaybe<Array<Scalars['ID']['input']>>;
  not?: InputMaybe<SystemFilter>;
  or?: InputMaybe<Array<InputMaybe<SystemFilter>>>;
};

export enum SystemHasFilter {
  Admins = 'admins',
  CreatedAt = 'createdAt',
  DefaultWorkspace = 'defaultWorkspace',
  Initialized = 'initialized',
  InstanceId = 'instanceId',
  Runtimes = 'runtimes',
  UpdatedAt = 'updatedAt',
  Workspaces = 'workspaces'
}

export type SystemOrder = {
  asc?: InputMaybe<SystemOrderable>;
  desc?: InputMaybe<SystemOrderable>;
  then?: InputMaybe<SystemOrder>;
};

export enum SystemOrderable {
  CreatedAt = 'createdAt',
  InstanceId = 'instanceId',
  UpdatedAt = 'updatedAt'
}

export type SystemPatch = {
  admins?: InputMaybe<Array<UserRef>>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  defaultWorkspace?: InputMaybe<WorkspaceRef>;
  initialized?: InputMaybe<Scalars['Boolean']['input']>;
  instanceId?: InputMaybe<Scalars['String']['input']>;
  runtimes?: InputMaybe<Array<RuntimeRef>>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  workspaces?: InputMaybe<Array<WorkspaceRef>>;
};

export type SystemRef = {
  admins?: InputMaybe<Array<UserRef>>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  defaultWorkspace?: InputMaybe<WorkspaceRef>;
  id?: InputMaybe<Scalars['ID']['input']>;
  initialized?: InputMaybe<Scalars['Boolean']['input']>;
  instanceId?: InputMaybe<Scalars['String']['input']>;
  runtimes?: InputMaybe<Array<RuntimeRef>>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  workspaces?: InputMaybe<Array<WorkspaceRef>>;
};

export type ToolCall = {
  calledAt: Scalars['DateTime']['output'];
  calledBy?: Maybe<Skill>;
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  executedBy?: Maybe<Runtime>;
  executedByAgent?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  isTest: Scalars['Boolean']['output'];
  mcpTool?: Maybe<McpTool>;
  skill?: Maybe<Skill>;
  status: ToolCallStatus;
  toolInput: Scalars['String']['output'];
  toolOutput?: Maybe<Scalars['String']['output']>;
};


export type ToolCallCalledByArgs = {
  filter?: InputMaybe<SkillFilter>;
};


export type ToolCallExecutedByArgs = {
  filter?: InputMaybe<RuntimeFilter>;
};


export type ToolCallMcpToolArgs = {
  filter?: InputMaybe<McpToolFilter>;
};


export type ToolCallSkillArgs = {
  filter?: InputMaybe<SkillFilter>;
};

export type ToolCallAggregateResult = {
  calledAtMax?: Maybe<Scalars['DateTime']['output']>;
  calledAtMin?: Maybe<Scalars['DateTime']['output']>;
  completedAtMax?: Maybe<Scalars['DateTime']['output']>;
  completedAtMin?: Maybe<Scalars['DateTime']['output']>;
  count?: Maybe<Scalars['Int']['output']>;
  errorMax?: Maybe<Scalars['String']['output']>;
  errorMin?: Maybe<Scalars['String']['output']>;
  toolInputMax?: Maybe<Scalars['String']['output']>;
  toolInputMin?: Maybe<Scalars['String']['output']>;
  toolOutputMax?: Maybe<Scalars['String']['output']>;
  toolOutputMin?: Maybe<Scalars['String']['output']>;
};

export type ToolCallFilter = {
  and?: InputMaybe<Array<InputMaybe<ToolCallFilter>>>;
  has?: InputMaybe<Array<InputMaybe<ToolCallHasFilter>>>;
  id?: InputMaybe<Array<Scalars['ID']['input']>>;
  not?: InputMaybe<ToolCallFilter>;
  or?: InputMaybe<Array<InputMaybe<ToolCallFilter>>>;
};

export enum ToolCallHasFilter {
  CalledAt = 'calledAt',
  CalledBy = 'calledBy',
  CompletedAt = 'completedAt',
  Error = 'error',
  ExecutedBy = 'executedBy',
  ExecutedByAgent = 'executedByAgent',
  IsTest = 'isTest',
  McpTool = 'mcpTool',
  Skill = 'skill',
  Status = 'status',
  ToolInput = 'toolInput',
  ToolOutput = 'toolOutput'
}

export type ToolCallOrder = {
  asc?: InputMaybe<ToolCallOrderable>;
  desc?: InputMaybe<ToolCallOrderable>;
  then?: InputMaybe<ToolCallOrder>;
};

export enum ToolCallOrderable {
  CalledAt = 'calledAt',
  CompletedAt = 'completedAt',
  Error = 'error',
  ToolInput = 'toolInput',
  ToolOutput = 'toolOutput'
}

export type ToolCallPatch = {
  calledAt?: InputMaybe<Scalars['DateTime']['input']>;
  calledBy?: InputMaybe<SkillRef>;
  completedAt?: InputMaybe<Scalars['DateTime']['input']>;
  error?: InputMaybe<Scalars['String']['input']>;
  executedBy?: InputMaybe<RuntimeRef>;
  executedByAgent?: InputMaybe<Scalars['Boolean']['input']>;
  isTest?: InputMaybe<Scalars['Boolean']['input']>;
  mcpTool?: InputMaybe<McpToolRef>;
  skill?: InputMaybe<SkillRef>;
  status?: InputMaybe<ToolCallStatus>;
  toolInput?: InputMaybe<Scalars['String']['input']>;
  toolOutput?: InputMaybe<Scalars['String']['input']>;
};

export type ToolCallRef = {
  calledAt?: InputMaybe<Scalars['DateTime']['input']>;
  calledBy?: InputMaybe<SkillRef>;
  completedAt?: InputMaybe<Scalars['DateTime']['input']>;
  error?: InputMaybe<Scalars['String']['input']>;
  executedBy?: InputMaybe<RuntimeRef>;
  executedByAgent?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  isTest?: InputMaybe<Scalars['Boolean']['input']>;
  mcpTool?: InputMaybe<McpToolRef>;
  skill?: InputMaybe<SkillRef>;
  status?: InputMaybe<ToolCallStatus>;
  toolInput?: InputMaybe<Scalars['String']['input']>;
  toolOutput?: InputMaybe<Scalars['String']['input']>;
};

export enum ToolCallStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING'
}

export type UpdateAiConfigInput = {
  filter: AiConfigFilter;
  remove?: InputMaybe<AiConfigPatch>;
  set?: InputMaybe<AiConfigPatch>;
};

export type UpdateAiConfigPayload = {
  aIConfig?: Maybe<Array<Maybe<AiConfig>>>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type UpdateAiConfigPayloadAiConfigArgs = {
  filter?: InputMaybe<AiConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<AiConfigOrder>;
};

export type UpdateAiProviderConfigInput = {
  filter: AiProviderConfigFilter;
  remove?: InputMaybe<AiProviderConfigPatch>;
  set?: InputMaybe<AiProviderConfigPatch>;
};

export type UpdateAiProviderConfigPayload = {
  aIProviderConfig?: Maybe<Array<Maybe<AiProviderConfig>>>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type UpdateAiProviderConfigPayloadAiProviderConfigArgs = {
  filter?: InputMaybe<AiProviderConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<AiProviderConfigOrder>;
};

export type UpdateIdentityKeyInput = {
  filter: IdentityKeyFilter;
  remove?: InputMaybe<IdentityKeyPatch>;
  set?: InputMaybe<IdentityKeyPatch>;
};

export type UpdateIdentityKeyPayload = {
  identityKey?: Maybe<Array<Maybe<IdentityKey>>>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type UpdateIdentityKeyPayloadIdentityKeyArgs = {
  filter?: InputMaybe<IdentityKeyFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<IdentityKeyOrder>;
};

export type UpdateMcpRegistryServerInput = {
  filter: McpRegistryServerFilter;
  remove?: InputMaybe<McpRegistryServerPatch>;
  set?: InputMaybe<McpRegistryServerPatch>;
};

export type UpdateMcpRegistryServerPayload = {
  mCPRegistryServer?: Maybe<Array<Maybe<McpRegistryServer>>>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type UpdateMcpRegistryServerPayloadMCpRegistryServerArgs = {
  filter?: InputMaybe<McpRegistryServerFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpRegistryServerOrder>;
};

export type UpdateMcpServerInput = {
  filter: McpServerFilter;
  remove?: InputMaybe<McpServerPatch>;
  set?: InputMaybe<McpServerPatch>;
};

export type UpdateMcpServerPayload = {
  mCPServer?: Maybe<Array<Maybe<McpServer>>>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type UpdateMcpServerPayloadMCpServerArgs = {
  filter?: InputMaybe<McpServerFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpServerOrder>;
};

export type UpdateMcpToolInput = {
  filter: McpToolFilter;
  remove?: InputMaybe<McpToolPatch>;
  set?: InputMaybe<McpToolPatch>;
};

export type UpdateMcpToolPayload = {
  mCPTool?: Maybe<Array<Maybe<McpTool>>>;
  numUids?: Maybe<Scalars['Int']['output']>;
};


export type UpdateMcpToolPayloadMCpToolArgs = {
  filter?: InputMaybe<McpToolFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpToolOrder>;
};

export type UpdateOAuthProviderConfigInput = {
  filter: OAuthProviderConfigFilter;
  remove?: InputMaybe<OAuthProviderConfigPatch>;
  set?: InputMaybe<OAuthProviderConfigPatch>;
};

export type UpdateOAuthProviderConfigPayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  oAuthProviderConfig?: Maybe<Array<Maybe<OAuthProviderConfig>>>;
};


export type UpdateOAuthProviderConfigPayloadOAuthProviderConfigArgs = {
  filter?: InputMaybe<OAuthProviderConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<OAuthProviderConfigOrder>;
};

export type UpdateOnboardingStepInput = {
  filter: OnboardingStepFilter;
  remove?: InputMaybe<OnboardingStepPatch>;
  set?: InputMaybe<OnboardingStepPatch>;
};

export type UpdateOnboardingStepPayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  onboardingStep?: Maybe<Array<Maybe<OnboardingStep>>>;
};


export type UpdateOnboardingStepPayloadOnboardingStepArgs = {
  filter?: InputMaybe<OnboardingStepFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<OnboardingStepOrder>;
};

export type UpdateRuntimeInput = {
  filter: RuntimeFilter;
  remove?: InputMaybe<RuntimePatch>;
  set?: InputMaybe<RuntimePatch>;
};

export type UpdateRuntimePayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  runtime?: Maybe<Array<Maybe<Runtime>>>;
};


export type UpdateRuntimePayloadRuntimeArgs = {
  filter?: InputMaybe<RuntimeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<RuntimeOrder>;
};

export type UpdateSessionInput = {
  filter: SessionFilter;
  remove?: InputMaybe<SessionPatch>;
  set?: InputMaybe<SessionPatch>;
};

export type UpdateSessionPayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  session?: Maybe<Array<Maybe<Session>>>;
};


export type UpdateSessionPayloadSessionArgs = {
  filter?: InputMaybe<SessionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SessionOrder>;
};

export type UpdateSkillInput = {
  filter: SkillFilter;
  remove?: InputMaybe<SkillPatch>;
  set?: InputMaybe<SkillPatch>;
};

export type UpdateSkillPayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  skill?: Maybe<Array<Maybe<Skill>>>;
};


export type UpdateSkillPayloadSkillArgs = {
  filter?: InputMaybe<SkillFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SkillOrder>;
};

export type UpdateSystemInput = {
  filter: SystemFilter;
  remove?: InputMaybe<SystemPatch>;
  set?: InputMaybe<SystemPatch>;
};

export type UpdateSystemPayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  system?: Maybe<Array<Maybe<System>>>;
};


export type UpdateSystemPayloadSystemArgs = {
  filter?: InputMaybe<SystemFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SystemOrder>;
};

export type UpdateToolCallInput = {
  filter: ToolCallFilter;
  remove?: InputMaybe<ToolCallPatch>;
  set?: InputMaybe<ToolCallPatch>;
};

export type UpdateToolCallPayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  toolCall?: Maybe<Array<Maybe<ToolCall>>>;
};


export type UpdateToolCallPayloadToolCallArgs = {
  filter?: InputMaybe<ToolCallFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<ToolCallOrder>;
};

export type UpdateUserInput = {
  filter: UserFilter;
  remove?: InputMaybe<UserPatch>;
  set?: InputMaybe<UserPatch>;
};

export type UpdateUserOAuthConnectionInput = {
  filter: UserOAuthConnectionFilter;
  remove?: InputMaybe<UserOAuthConnectionPatch>;
  set?: InputMaybe<UserOAuthConnectionPatch>;
};

export type UpdateUserOAuthConnectionPayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  userOAuthConnection?: Maybe<Array<Maybe<UserOAuthConnection>>>;
};


export type UpdateUserOAuthConnectionPayloadUserOAuthConnectionArgs = {
  filter?: InputMaybe<UserOAuthConnectionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<UserOAuthConnectionOrder>;
};

export type UpdateUserPayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  user?: Maybe<Array<Maybe<User>>>;
};


export type UpdateUserPayloadUserArgs = {
  filter?: InputMaybe<UserFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<UserOrder>;
};

export type UpdateWorkspaceInput = {
  filter: WorkspaceFilter;
  remove?: InputMaybe<WorkspacePatch>;
  set?: InputMaybe<WorkspacePatch>;
};

export type UpdateWorkspacePayload = {
  numUids?: Maybe<Scalars['Int']['output']>;
  workspace?: Maybe<Array<Maybe<Workspace>>>;
};


export type UpdateWorkspacePayloadWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<WorkspaceOrder>;
};

export type User = {
  adminOfWorkspaces?: Maybe<Array<Workspace>>;
  adminOfWorkspacesAggregate?: Maybe<WorkspaceAggregateResult>;
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  failedLoginAttempts?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  lastLoginAt?: Maybe<Scalars['DateTime']['output']>;
  lockedUntil?: Maybe<Scalars['DateTime']['output']>;
  membersOfWorkspaces?: Maybe<Array<Workspace>>;
  membersOfWorkspacesAggregate?: Maybe<WorkspaceAggregateResult>;
  oauthConnections?: Maybe<Array<UserOAuthConnection>>;
  oauthConnectionsAggregate?: Maybe<UserOAuthConnectionAggregateResult>;
  password: Scalars['String']['output'];
  sessions?: Maybe<Array<Session>>;
  sessionsAggregate?: Maybe<SessionAggregateResult>;
  updatedAt: Scalars['DateTime']['output'];
};


export type UserAdminOfWorkspacesArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<WorkspaceOrder>;
};


export type UserAdminOfWorkspacesAggregateArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
};


export type UserMembersOfWorkspacesArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<WorkspaceOrder>;
};


export type UserMembersOfWorkspacesAggregateArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
};


export type UserOauthConnectionsArgs = {
  filter?: InputMaybe<UserOAuthConnectionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<UserOAuthConnectionOrder>;
};


export type UserOauthConnectionsAggregateArgs = {
  filter?: InputMaybe<UserOAuthConnectionFilter>;
};


export type UserSessionsArgs = {
  filter?: InputMaybe<SessionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SessionOrder>;
};


export type UserSessionsAggregateArgs = {
  filter?: InputMaybe<SessionFilter>;
};

export type UserAggregateResult = {
  count?: Maybe<Scalars['Int']['output']>;
  createdAtMax?: Maybe<Scalars['DateTime']['output']>;
  createdAtMin?: Maybe<Scalars['DateTime']['output']>;
  emailMax?: Maybe<Scalars['String']['output']>;
  emailMin?: Maybe<Scalars['String']['output']>;
  failedLoginAttemptsAvg?: Maybe<Scalars['Float']['output']>;
  failedLoginAttemptsMax?: Maybe<Scalars['Int']['output']>;
  failedLoginAttemptsMin?: Maybe<Scalars['Int']['output']>;
  failedLoginAttemptsSum?: Maybe<Scalars['Int']['output']>;
  lastLoginAtMax?: Maybe<Scalars['DateTime']['output']>;
  lastLoginAtMin?: Maybe<Scalars['DateTime']['output']>;
  lockedUntilMax?: Maybe<Scalars['DateTime']['output']>;
  lockedUntilMin?: Maybe<Scalars['DateTime']['output']>;
  passwordMax?: Maybe<Scalars['String']['output']>;
  passwordMin?: Maybe<Scalars['String']['output']>;
  updatedAtMax?: Maybe<Scalars['DateTime']['output']>;
  updatedAtMin?: Maybe<Scalars['DateTime']['output']>;
};

export type UserFilter = {
  and?: InputMaybe<Array<InputMaybe<UserFilter>>>;
  email?: InputMaybe<StringHashFilter>;
  has?: InputMaybe<Array<InputMaybe<UserHasFilter>>>;
  id?: InputMaybe<Array<Scalars['ID']['input']>>;
  not?: InputMaybe<UserFilter>;
  or?: InputMaybe<Array<InputMaybe<UserFilter>>>;
};

export enum UserHasFilter {
  AdminOfWorkspaces = 'adminOfWorkspaces',
  CreatedAt = 'createdAt',
  Email = 'email',
  FailedLoginAttempts = 'failedLoginAttempts',
  LastLoginAt = 'lastLoginAt',
  LockedUntil = 'lockedUntil',
  MembersOfWorkspaces = 'membersOfWorkspaces',
  OauthConnections = 'oauthConnections',
  Password = 'password',
  Sessions = 'sessions',
  UpdatedAt = 'updatedAt'
}

export type UserOAuthConnection = {
  accountAvatarUrl?: Maybe<Scalars['String']['output']>;
  accountEmail?: Maybe<Scalars['String']['output']>;
  accountName?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  encryptedAccessToken: Scalars['String']['output'];
  encryptedRefreshToken?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastUsedAt?: Maybe<Scalars['DateTime']['output']>;
  provider: OAuthProviderType;
  providerAccountId?: Maybe<Scalars['String']['output']>;
  scopes?: Maybe<Array<Scalars['String']['output']>>;
  tokenExpiresAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  workspace: Workspace;
};


export type UserOAuthConnectionUserArgs = {
  filter?: InputMaybe<UserFilter>;
};


export type UserOAuthConnectionWorkspaceArgs = {
  filter?: InputMaybe<WorkspaceFilter>;
};

export type UserOAuthConnectionAggregateResult = {
  accountAvatarUrlMax?: Maybe<Scalars['String']['output']>;
  accountAvatarUrlMin?: Maybe<Scalars['String']['output']>;
  accountEmailMax?: Maybe<Scalars['String']['output']>;
  accountEmailMin?: Maybe<Scalars['String']['output']>;
  accountNameMax?: Maybe<Scalars['String']['output']>;
  accountNameMin?: Maybe<Scalars['String']['output']>;
  count?: Maybe<Scalars['Int']['output']>;
  createdAtMax?: Maybe<Scalars['DateTime']['output']>;
  createdAtMin?: Maybe<Scalars['DateTime']['output']>;
  encryptedAccessTokenMax?: Maybe<Scalars['String']['output']>;
  encryptedAccessTokenMin?: Maybe<Scalars['String']['output']>;
  encryptedRefreshTokenMax?: Maybe<Scalars['String']['output']>;
  encryptedRefreshTokenMin?: Maybe<Scalars['String']['output']>;
  lastUsedAtMax?: Maybe<Scalars['DateTime']['output']>;
  lastUsedAtMin?: Maybe<Scalars['DateTime']['output']>;
  providerAccountIdMax?: Maybe<Scalars['String']['output']>;
  providerAccountIdMin?: Maybe<Scalars['String']['output']>;
  tokenExpiresAtMax?: Maybe<Scalars['DateTime']['output']>;
  tokenExpiresAtMin?: Maybe<Scalars['DateTime']['output']>;
  updatedAtMax?: Maybe<Scalars['DateTime']['output']>;
  updatedAtMin?: Maybe<Scalars['DateTime']['output']>;
};

export type UserOAuthConnectionFilter = {
  accountEmail?: InputMaybe<StringHashFilter>;
  and?: InputMaybe<Array<InputMaybe<UserOAuthConnectionFilter>>>;
  has?: InputMaybe<Array<InputMaybe<UserOAuthConnectionHasFilter>>>;
  id?: InputMaybe<Array<Scalars['ID']['input']>>;
  not?: InputMaybe<UserOAuthConnectionFilter>;
  or?: InputMaybe<Array<InputMaybe<UserOAuthConnectionFilter>>>;
  provider?: InputMaybe<OAuthProviderType_Hash>;
  providerAccountId?: InputMaybe<StringHashFilter>;
};

export enum UserOAuthConnectionHasFilter {
  AccountAvatarUrl = 'accountAvatarUrl',
  AccountEmail = 'accountEmail',
  AccountName = 'accountName',
  CreatedAt = 'createdAt',
  EncryptedAccessToken = 'encryptedAccessToken',
  EncryptedRefreshToken = 'encryptedRefreshToken',
  LastUsedAt = 'lastUsedAt',
  Provider = 'provider',
  ProviderAccountId = 'providerAccountId',
  Scopes = 'scopes',
  TokenExpiresAt = 'tokenExpiresAt',
  UpdatedAt = 'updatedAt',
  User = 'user',
  Workspace = 'workspace'
}

export type UserOAuthConnectionOrder = {
  asc?: InputMaybe<UserOAuthConnectionOrderable>;
  desc?: InputMaybe<UserOAuthConnectionOrderable>;
  then?: InputMaybe<UserOAuthConnectionOrder>;
};

export enum UserOAuthConnectionOrderable {
  AccountAvatarUrl = 'accountAvatarUrl',
  AccountEmail = 'accountEmail',
  AccountName = 'accountName',
  CreatedAt = 'createdAt',
  EncryptedAccessToken = 'encryptedAccessToken',
  EncryptedRefreshToken = 'encryptedRefreshToken',
  LastUsedAt = 'lastUsedAt',
  ProviderAccountId = 'providerAccountId',
  TokenExpiresAt = 'tokenExpiresAt',
  UpdatedAt = 'updatedAt'
}

export type UserOAuthConnectionPatch = {
  accountAvatarUrl?: InputMaybe<Scalars['String']['input']>;
  accountEmail?: InputMaybe<Scalars['String']['input']>;
  accountName?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  encryptedAccessToken?: InputMaybe<Scalars['String']['input']>;
  encryptedRefreshToken?: InputMaybe<Scalars['String']['input']>;
  lastUsedAt?: InputMaybe<Scalars['DateTime']['input']>;
  provider?: InputMaybe<OAuthProviderType>;
  providerAccountId?: InputMaybe<Scalars['String']['input']>;
  scopes?: InputMaybe<Array<Scalars['String']['input']>>;
  tokenExpiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  user?: InputMaybe<UserRef>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export type UserOAuthConnectionRef = {
  accountAvatarUrl?: InputMaybe<Scalars['String']['input']>;
  accountEmail?: InputMaybe<Scalars['String']['input']>;
  accountName?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  encryptedAccessToken?: InputMaybe<Scalars['String']['input']>;
  encryptedRefreshToken?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  lastUsedAt?: InputMaybe<Scalars['DateTime']['input']>;
  provider?: InputMaybe<OAuthProviderType>;
  providerAccountId?: InputMaybe<Scalars['String']['input']>;
  scopes?: InputMaybe<Array<Scalars['String']['input']>>;
  tokenExpiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  user?: InputMaybe<UserRef>;
  workspace?: InputMaybe<WorkspaceRef>;
};

export type UserOrder = {
  asc?: InputMaybe<UserOrderable>;
  desc?: InputMaybe<UserOrderable>;
  then?: InputMaybe<UserOrder>;
};

export enum UserOrderable {
  CreatedAt = 'createdAt',
  Email = 'email',
  FailedLoginAttempts = 'failedLoginAttempts',
  LastLoginAt = 'lastLoginAt',
  LockedUntil = 'lockedUntil',
  Password = 'password',
  UpdatedAt = 'updatedAt'
}

export type UserPatch = {
  adminOfWorkspaces?: InputMaybe<Array<WorkspaceRef>>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  failedLoginAttempts?: InputMaybe<Scalars['Int']['input']>;
  lastLoginAt?: InputMaybe<Scalars['DateTime']['input']>;
  lockedUntil?: InputMaybe<Scalars['DateTime']['input']>;
  membersOfWorkspaces?: InputMaybe<Array<WorkspaceRef>>;
  oauthConnections?: InputMaybe<Array<UserOAuthConnectionRef>>;
  password?: InputMaybe<Scalars['String']['input']>;
  sessions?: InputMaybe<Array<SessionRef>>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type UserRef = {
  adminOfWorkspaces?: InputMaybe<Array<WorkspaceRef>>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  failedLoginAttempts?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  lastLoginAt?: InputMaybe<Scalars['DateTime']['input']>;
  lockedUntil?: InputMaybe<Scalars['DateTime']['input']>;
  membersOfWorkspaces?: InputMaybe<Array<WorkspaceRef>>;
  oauthConnections?: InputMaybe<Array<UserOAuthConnectionRef>>;
  password?: InputMaybe<Scalars['String']['input']>;
  sessions?: InputMaybe<Array<SessionRef>>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type WithinFilter = {
  polygon: PolygonRef;
};

export type Workspace = {
  admins?: Maybe<Array<User>>;
  adminsAggregate?: Maybe<UserAggregateResult>;
  aiConfigs?: Maybe<Array<AiConfig>>;
  aiConfigsAggregate?: Maybe<AiConfigAggregateResult>;
  aiProviders?: Maybe<Array<AiProviderConfig>>;
  aiProvidersAggregate?: Maybe<AiProviderConfigAggregateResult>;
  createdAt: Scalars['DateTime']['output'];
  defaultAIModel?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  mcpServers?: Maybe<Array<McpServer>>;
  mcpServersAggregate?: Maybe<McpServerAggregateResult>;
  mcpTools?: Maybe<Array<McpTool>>;
  mcpToolsAggregate?: Maybe<McpToolAggregateResult>;
  name: Scalars['String']['output'];
  oauthProviders?: Maybe<Array<OAuthProviderConfig>>;
  oauthProvidersAggregate?: Maybe<OAuthProviderConfigAggregateResult>;
  onboardingSteps?: Maybe<Array<OnboardingStep>>;
  onboardingStepsAggregate?: Maybe<OnboardingStepAggregateResult>;
  registryServers?: Maybe<Array<McpRegistryServer>>;
  registryServersAggregate?: Maybe<McpRegistryServerAggregateResult>;
  runtimes?: Maybe<Array<Runtime>>;
  runtimesAggregate?: Maybe<RuntimeAggregateResult>;
  skills?: Maybe<Array<Skill>>;
  skillsAggregate?: Maybe<SkillAggregateResult>;
  system: System;
  userOAuthConnections?: Maybe<Array<UserOAuthConnection>>;
  userOAuthConnectionsAggregate?: Maybe<UserOAuthConnectionAggregateResult>;
  users?: Maybe<Array<User>>;
  usersAggregate?: Maybe<UserAggregateResult>;
};


export type WorkspaceAdminsArgs = {
  filter?: InputMaybe<UserFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<UserOrder>;
};


export type WorkspaceAdminsAggregateArgs = {
  filter?: InputMaybe<UserFilter>;
};


export type WorkspaceAiConfigsArgs = {
  filter?: InputMaybe<AiConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<AiConfigOrder>;
};


export type WorkspaceAiConfigsAggregateArgs = {
  filter?: InputMaybe<AiConfigFilter>;
};


export type WorkspaceAiProvidersArgs = {
  filter?: InputMaybe<AiProviderConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<AiProviderConfigOrder>;
};


export type WorkspaceAiProvidersAggregateArgs = {
  filter?: InputMaybe<AiProviderConfigFilter>;
};


export type WorkspaceMcpServersArgs = {
  filter?: InputMaybe<McpServerFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpServerOrder>;
};


export type WorkspaceMcpServersAggregateArgs = {
  filter?: InputMaybe<McpServerFilter>;
};


export type WorkspaceMcpToolsArgs = {
  filter?: InputMaybe<McpToolFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpToolOrder>;
};


export type WorkspaceMcpToolsAggregateArgs = {
  filter?: InputMaybe<McpToolFilter>;
};


export type WorkspaceOauthProvidersArgs = {
  filter?: InputMaybe<OAuthProviderConfigFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<OAuthProviderConfigOrder>;
};


export type WorkspaceOauthProvidersAggregateArgs = {
  filter?: InputMaybe<OAuthProviderConfigFilter>;
};


export type WorkspaceOnboardingStepsArgs = {
  filter?: InputMaybe<OnboardingStepFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<OnboardingStepOrder>;
};


export type WorkspaceOnboardingStepsAggregateArgs = {
  filter?: InputMaybe<OnboardingStepFilter>;
};


export type WorkspaceRegistryServersArgs = {
  filter?: InputMaybe<McpRegistryServerFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<McpRegistryServerOrder>;
};


export type WorkspaceRegistryServersAggregateArgs = {
  filter?: InputMaybe<McpRegistryServerFilter>;
};


export type WorkspaceRuntimesArgs = {
  filter?: InputMaybe<RuntimeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<RuntimeOrder>;
};


export type WorkspaceRuntimesAggregateArgs = {
  filter?: InputMaybe<RuntimeFilter>;
};


export type WorkspaceSkillsArgs = {
  filter?: InputMaybe<SkillFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<SkillOrder>;
};


export type WorkspaceSkillsAggregateArgs = {
  filter?: InputMaybe<SkillFilter>;
};


export type WorkspaceSystemArgs = {
  filter?: InputMaybe<SystemFilter>;
};


export type WorkspaceUserOAuthConnectionsArgs = {
  filter?: InputMaybe<UserOAuthConnectionFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<UserOAuthConnectionOrder>;
};


export type WorkspaceUserOAuthConnectionsAggregateArgs = {
  filter?: InputMaybe<UserOAuthConnectionFilter>;
};


export type WorkspaceUsersArgs = {
  filter?: InputMaybe<UserFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<UserOrder>;
};


export type WorkspaceUsersAggregateArgs = {
  filter?: InputMaybe<UserFilter>;
};

export type WorkspaceAggregateResult = {
  count?: Maybe<Scalars['Int']['output']>;
  createdAtMax?: Maybe<Scalars['DateTime']['output']>;
  createdAtMin?: Maybe<Scalars['DateTime']['output']>;
  defaultAIModelMax?: Maybe<Scalars['String']['output']>;
  defaultAIModelMin?: Maybe<Scalars['String']['output']>;
  nameMax?: Maybe<Scalars['String']['output']>;
  nameMin?: Maybe<Scalars['String']['output']>;
};

export type WorkspaceFilter = {
  and?: InputMaybe<Array<InputMaybe<WorkspaceFilter>>>;
  has?: InputMaybe<Array<InputMaybe<WorkspaceHasFilter>>>;
  id?: InputMaybe<Array<Scalars['ID']['input']>>;
  name?: InputMaybe<StringHashFilter>;
  not?: InputMaybe<WorkspaceFilter>;
  or?: InputMaybe<Array<InputMaybe<WorkspaceFilter>>>;
};

export enum WorkspaceHasFilter {
  Admins = 'admins',
  AiConfigs = 'aiConfigs',
  AiProviders = 'aiProviders',
  CreatedAt = 'createdAt',
  DefaultAiModel = 'defaultAIModel',
  McpServers = 'mcpServers',
  McpTools = 'mcpTools',
  Name = 'name',
  OauthProviders = 'oauthProviders',
  OnboardingSteps = 'onboardingSteps',
  RegistryServers = 'registryServers',
  Runtimes = 'runtimes',
  Skills = 'skills',
  System = 'system',
  UserOAuthConnections = 'userOAuthConnections',
  Users = 'users'
}

export type WorkspaceOrder = {
  asc?: InputMaybe<WorkspaceOrderable>;
  desc?: InputMaybe<WorkspaceOrderable>;
  then?: InputMaybe<WorkspaceOrder>;
};

export enum WorkspaceOrderable {
  CreatedAt = 'createdAt',
  DefaultAiModel = 'defaultAIModel',
  Name = 'name'
}

export type WorkspacePatch = {
  admins?: InputMaybe<Array<UserRef>>;
  aiConfigs?: InputMaybe<Array<AiConfigRef>>;
  aiProviders?: InputMaybe<Array<AiProviderConfigRef>>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  defaultAIModel?: InputMaybe<Scalars['String']['input']>;
  mcpServers?: InputMaybe<Array<McpServerRef>>;
  mcpTools?: InputMaybe<Array<McpToolRef>>;
  name?: InputMaybe<Scalars['String']['input']>;
  oauthProviders?: InputMaybe<Array<OAuthProviderConfigRef>>;
  onboardingSteps?: InputMaybe<Array<OnboardingStepRef>>;
  registryServers?: InputMaybe<Array<McpRegistryServerRef>>;
  runtimes?: InputMaybe<Array<RuntimeRef>>;
  skills?: InputMaybe<Array<SkillRef>>;
  system?: InputMaybe<SystemRef>;
  userOAuthConnections?: InputMaybe<Array<UserOAuthConnectionRef>>;
  users?: InputMaybe<Array<UserRef>>;
};

export type WorkspaceRef = {
  admins?: InputMaybe<Array<UserRef>>;
  aiConfigs?: InputMaybe<Array<AiConfigRef>>;
  aiProviders?: InputMaybe<Array<AiProviderConfigRef>>;
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  defaultAIModel?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  mcpServers?: InputMaybe<Array<McpServerRef>>;
  mcpTools?: InputMaybe<Array<McpToolRef>>;
  name?: InputMaybe<Scalars['String']['input']>;
  oauthProviders?: InputMaybe<Array<OAuthProviderConfigRef>>;
  onboardingSteps?: InputMaybe<Array<OnboardingStepRef>>;
  registryServers?: InputMaybe<Array<McpRegistryServerRef>>;
  runtimes?: InputMaybe<Array<RuntimeRef>>;
  skills?: InputMaybe<Array<SkillRef>>;
  system?: InputMaybe<SystemRef>;
  userOAuthConnections?: InputMaybe<Array<UserOAuthConnectionRef>>;
  users?: InputMaybe<Array<UserRef>>;
};

export type CreateAiConfigMutationVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  now: Scalars['DateTime']['input'];
}>;


export type CreateAiConfigMutation = { addAIConfig?: { aIConfig?: Array<{ id: string, key: string, value: string, description?: string | null, createdAt: string, updatedAt: string } | null> | null } | null };

export type DeleteAiConfigMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAiConfigMutation = { deleteAIConfig?: { aIConfig?: Array<{ id: string } | null> | null } | null };

export type FindAiConfigByKeyQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  key: Scalars['String']['input'];
}>;


export type FindAiConfigByKeyQuery = { getWorkspace?: { id: string, aiConfigs?: Array<{ id: string, key: string, value: string, description?: string | null, createdAt: string, updatedAt: string }> | null } | null };

export type GetAiConfigByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetAiConfigByIdQuery = { getAIConfig?: { id: string, key: string, value: string, description?: string | null, createdAt: string, updatedAt: string, workspace: { id: string } } | null };

export type GetAiConfigsByWorkspaceQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type GetAiConfigsByWorkspaceQuery = { getWorkspace?: { id: string, aiConfigs?: Array<{ id: string, key: string, value: string, description?: string | null, createdAt: string, updatedAt: string }> | null } | null };

export type ObserveAiConfigsSubscriptionSubscriptionVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type ObserveAiConfigsSubscriptionSubscription = { getWorkspace?: { id: string, aiConfigs?: Array<{ id: string, key: string, value: string, description?: string | null, createdAt: string, updatedAt: string }> | null } | null };

export type UpdateAiConfigMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  value: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  now: Scalars['DateTime']['input'];
}>;


export type UpdateAiConfigMutation = { updateAIConfig?: { aIConfig?: Array<{ id: string, key: string, value: string, description?: string | null, createdAt: string, updatedAt: string } | null> | null } | null };

export type CreateAiProviderMutationVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  provider: AiProviderType;
  encryptedApiKey?: InputMaybe<Scalars['String']['input']>;
  baseUrl?: InputMaybe<Scalars['String']['input']>;
  availableModels?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  now: Scalars['DateTime']['input'];
}>;


export type CreateAiProviderMutation = { addAIProviderConfig?: { aIProviderConfig?: Array<{ id: string, provider: AiProviderType, encryptedApiKey?: string | null, baseUrl?: string | null, availableModels?: Array<string> | null, createdAt: string, updatedAt: string } | null> | null } | null };

export type DeleteAiProviderMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAiProviderMutation = { deleteAIProviderConfig?: { aIProviderConfig?: Array<{ id: string } | null> | null } | null };

export type FindAiProviderByTypeQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  provider: AiProviderType;
}>;


export type FindAiProviderByTypeQuery = { getWorkspace?: { aiProviders?: Array<{ id: string, provider: AiProviderType, encryptedApiKey?: string | null, baseUrl?: string | null, availableModels?: Array<string> | null, createdAt: string, updatedAt: string }> | null } | null };

export type GetAiProviderByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetAiProviderByIdQuery = { getAIProviderConfig?: { id: string, provider: AiProviderType, baseUrl?: string | null, availableModels?: Array<string> | null, encryptedApiKey?: string | null, createdAt: string, updatedAt: string, workspace: { id: string } } | null };

export type GetAiProvidersByWorkspaceQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type GetAiProvidersByWorkspaceQuery = { getWorkspace?: { aiProviders?: Array<{ id: string, provider: AiProviderType, encryptedApiKey?: string | null, baseUrl?: string | null, availableModels?: Array<string> | null, createdAt: string, updatedAt: string }> | null } | null };

export type SetDefaultModelMutationVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  providerModel: Scalars['String']['input'];
}>;


export type SetDefaultModelMutation = { updateWorkspace?: { workspace?: Array<{ id: string, defaultAIModel?: string | null } | null> | null } | null };

export type UpdateAiProviderMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  encryptedApiKey?: InputMaybe<Scalars['String']['input']>;
  baseUrl?: InputMaybe<Scalars['String']['input']>;
  availableModels?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  now: Scalars['DateTime']['input'];
}>;


export type UpdateAiProviderMutation = { updateAIProviderConfig?: { aIProviderConfig?: Array<{ id: string, provider: AiProviderType, encryptedApiKey?: string | null, baseUrl?: string | null, availableModels?: Array<string> | null, createdAt: string, updatedAt: string } | null> | null } | null };

export type CreateIdentityKeyMutationVariables = Exact<{
  key: Scalars['String']['input'];
  relatedId: Scalars['String']['input'];
  now: Scalars['DateTime']['input'];
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  permissions?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateIdentityKeyMutation = { addIdentityKey?: { identityKey?: Array<{ id: string, key: string, relatedId: string, createdAt: string, expiresAt?: string | null, revokedAt?: string | null, description?: string | null, permissions?: string | null } | null> | null } | null };

export type DeleteIdentityKeyMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteIdentityKeyMutation = { deleteIdentityKey?: { identityKey?: Array<{ id: string } | null> | null } | null };

export type FindIdentityKeyQueryVariables = Exact<{
  key: Scalars['String']['input'];
}>;


export type FindIdentityKeyQuery = { queryIdentityKey?: Array<{ id: string, key: string, relatedId: string, createdAt: string, expiresAt?: string | null, revokedAt?: string | null, description?: string | null, permissions?: string | null } | null> | null };

export type FindKeyByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type FindKeyByIdQuery = { getIdentityKey?: { id: string, key: string, relatedId: string, createdAt: string, expiresAt?: string | null, revokedAt?: string | null, description?: string | null, permissions?: string | null } | null };

export type FindKeysByRelatedIdQueryVariables = Exact<{
  relatedId: Scalars['String']['input'];
}>;


export type FindKeysByRelatedIdQuery = { queryIdentityKey?: Array<{ id: string, key: string, relatedId: string, createdAt: string, expiresAt?: string | null, revokedAt?: string | null, description?: string | null, permissions?: string | null } | null> | null };

export type RevokeIdentityKeyMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  now: Scalars['DateTime']['input'];
}>;


export type RevokeIdentityKeyMutation = { updateIdentityKey?: { identityKey?: Array<{ id: string, key: string, relatedId: string, createdAt: string, expiresAt?: string | null, revokedAt?: string | null, description?: string | null, permissions?: string | null } | null> | null } | null };

export type AddMcpServerMutationVariables = Exact<{
  name: Scalars['String']['input'];
  description: Scalars['String']['input'];
  repositoryUrl: Scalars['String']['input'];
  transport: McpTransportType;
  config: Scalars['String']['input'];
  workspaceId: Scalars['ID']['input'];
  registryServerId: Scalars['ID']['input'];
  executionTarget?: InputMaybe<ExecutionTarget>;
}>;


export type AddMcpServerMutation = { addMCPServer?: { mCPServer?: Array<{ id: string, name: string, description: string, repositoryUrl: string, transport: McpTransportType, config: string, executionTarget?: ExecutionTarget | null, workspace: { id: string, name: string }, registryServer: { id: string, name: string } } | null> | null } | null };

export type DeleteMcpServerMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteMcpServerMutation = { deleteMCPServer?: { mCPServer?: Array<{ id: string, name: string, description: string, repositoryUrl: string, transport: McpTransportType, config: string, executionTarget?: ExecutionTarget | null, workspace: { id: string, name: string } } | null> | null } | null };

export type DeleteMcpToolsMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type DeleteMcpToolsMutation = { deleteMCPTool?: { mCPTool?: Array<{ id: string } | null> | null } | null };

export type GetMcpServerQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetMcpServerQuery = { getMCPServer?: { id: string, executionTarget?: ExecutionTarget | null, runtime?: { id: string } | null } | null };

export type GetMcpServerWithWorkspaceQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetMcpServerWithWorkspaceQuery = { getMCPServer?: { id: string, workspace: { id: string } } | null };

export type LinkRuntimeMutationVariables = Exact<{
  mcpServerId: Scalars['ID']['input'];
  runtimeId: Scalars['ID']['input'];
}>;


export type LinkRuntimeMutation = { updateMCPServer?: { mCPServer?: Array<{ id: string, name: string, description: string, executionTarget?: ExecutionTarget | null, runtime?: { id: string, name: string, description?: string | null, status: ActiveStatus, lastSeenAt?: string | null } | null } | null> | null } | null };

export type QueryMcpServerCapabilitiesQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type QueryMcpServerCapabilitiesQuery = { getMCPServer?: { id: string, tools?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string, status: ActiveStatus, createdAt: string, lastSeenAt: string }> | null } | null };

export type QueryMcpServersQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryMcpServersQuery = { queryMCPServer?: Array<{ id: string, name: string, description: string, repositoryUrl: string, transport: McpTransportType, config: string, executionTarget?: ExecutionTarget | null, tools?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string, status: ActiveStatus, createdAt: string, lastSeenAt: string }> | null, runtime?: { id: string, name: string, description?: string | null, status: ActiveStatus, lastSeenAt?: string | null } | null, workspace: { id: string, name: string } } | null> | null };

export type QueryMcpServersByWorkspaceQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type QueryMcpServersByWorkspaceQuery = { queryMCPServer?: Array<{ id: string, name: string, description: string, repositoryUrl: string, transport: McpTransportType, config: string, executionTarget?: ExecutionTarget | null, tools?: Array<{ id: string, name: string }> | null, runtime?: { id: string, name: string } | null, workspace: { id: string } } | null> | null };

export type SubscribeMcpServerCapabilitiesSubscriptionVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SubscribeMcpServerCapabilitiesSubscription = { getMCPServer?: { id: string, tools?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string, status: ActiveStatus, createdAt: string, lastSeenAt: string }> | null } | null };

export type UnlinkRuntimeMutationVariables = Exact<{
  mcpServerId: Scalars['ID']['input'];
  runtimeId: Scalars['ID']['input'];
}>;


export type UnlinkRuntimeMutation = { updateMCPServer?: { mCPServer?: Array<{ id: string, name: string, description: string, executionTarget?: ExecutionTarget | null, runtime?: { id: string } | null } | null> | null } | null };

export type UpdateExecutionTargetMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  executionTarget?: InputMaybe<ExecutionTarget>;
}>;


export type UpdateExecutionTargetMutation = { updateMCPServer?: { mCPServer?: Array<{ id: string, executionTarget?: ExecutionTarget | null, runtime?: { id: string, name: string, description?: string | null, status: ActiveStatus, lastSeenAt?: string | null } | null } | null> | null } | null };

export type UpdateMcpServerMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  description: Scalars['String']['input'];
  repositoryUrl: Scalars['String']['input'];
  transport: McpTransportType;
  config: Scalars['String']['input'];
  executionTarget?: InputMaybe<ExecutionTarget>;
}>;


export type UpdateMcpServerMutation = { updateMCPServer?: { mCPServer?: Array<{ id: string, name: string, description: string, repositoryUrl: string, transport: McpTransportType, config: string, executionTarget?: ExecutionTarget | null, workspace: { id: string, name: string } } | null> | null } | null };

export type GetMcpToolWithWorkspaceQueryVariables = Exact<{
  toolId: Scalars['ID']['input'];
}>;


export type GetMcpToolWithWorkspaceQuery = { getMCPTool?: { id: string, name: string, workspace: { id: string, name: string }, mcpServer: { id: string, executionTarget?: ExecutionTarget | null } } | null };

export type SetMcpToolStatusMutationVariables = Exact<{
  mcpToolId: Scalars['ID']['input'];
  status: ActiveStatus;
}>;


export type SetMcpToolStatusMutation = { updateMCPTool?: { mCPTool?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string, status: ActiveStatus } | null> | null } | null };

export type AddToolCallMutationVariables = Exact<{
  toolInput: Scalars['String']['input'];
  calledAt: Scalars['DateTime']['input'];
  isTest: Scalars['Boolean']['input'];
}>;


export type AddToolCallMutation = { addToolCall?: { toolCall?: Array<{ id: string, toolInput: string, calledAt: string, status: ToolCallStatus, isTest: boolean } | null> | null } | null };

export type CompleteToolCallErrorMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  error: Scalars['String']['input'];
  completedAt: Scalars['DateTime']['input'];
}>;


export type CompleteToolCallErrorMutation = { updateToolCall?: { toolCall?: Array<{ id: string, status: ToolCallStatus, error?: string | null, completedAt?: string | null, isTest: boolean } | null> | null } | null };

export type CompleteToolCallSuccessMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  toolOutput: Scalars['String']['input'];
  completedAt: Scalars['DateTime']['input'];
}>;


export type CompleteToolCallSuccessMutation = { updateToolCall?: { toolCall?: Array<{ id: string, status: ToolCallStatus, toolOutput?: string | null, completedAt?: string | null, isTest: boolean } | null> | null } | null };

export type QueryToolCallsQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type QueryToolCallsQuery = { getWorkspace?: { mcpTools?: Array<{ id: string, toolCalls?: Array<{ id: string, toolInput: string, toolOutput?: string | null, error?: string | null, calledAt: string, completedAt?: string | null, status: ToolCallStatus, isTest: boolean, mcpTool?: { id: string, name: string, mcpServer: { id: string, name: string } } | null, calledBy?: { id: string, name: string } | null, executedBy?: { id: string, name: string } | null }> | null }> | null } | null };

export type QueryToolCallsFilteredQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type QueryToolCallsFilteredQuery = { getWorkspace?: { mcpTools?: Array<{ id: string, name: string, description: string, mcpServer: { id: string, name: string }, toolCalls?: Array<{ id: string, toolInput: string, toolOutput?: string | null, error?: string | null, calledAt: string, completedAt?: string | null, status: ToolCallStatus, isTest: boolean, executedByAgent?: boolean | null, calledBy?: { id: string, name: string } | null, executedBy?: { id: string, name: string, hostname?: string | null } | null }> | null }> | null, skills?: Array<{ id: string, name: string, mode?: SkillMode | null, skillToolCalls?: Array<{ id: string, toolInput: string, toolOutput?: string | null, error?: string | null, calledAt: string, completedAt?: string | null, status: ToolCallStatus, isTest: boolean, executedByAgent?: boolean | null, calledBy?: { id: string, name: string } | null, executedBy?: { id: string, name: string, hostname?: string | null } | null }> | null }> | null } | null };

export type SetCalledByMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  calledById: Scalars['ID']['input'];
}>;


export type SetCalledByMutation = { updateToolCall?: { toolCall?: Array<{ id: string, calledBy?: { id: string, name: string } | null } | null> | null } | null };

export type SetExecutedByMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  executedById: Scalars['ID']['input'];
}>;


export type SetExecutedByMutation = { updateToolCall?: { toolCall?: Array<{ id: string, executedBy?: { id: string, name: string } | null } | null> | null } | null };

export type SetExecutedByAgentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SetExecutedByAgentMutation = { updateToolCall?: { toolCall?: Array<{ id: string, executedByAgent?: boolean | null } | null> | null } | null };

export type SetMcpToolMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  mcpToolId: Scalars['ID']['input'];
}>;


export type SetMcpToolMutation = { updateToolCall?: { toolCall?: Array<{ id: string, mcpTool?: { id: string, name: string } | null } | null> | null } | null };

export type SetSkillMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  skillId: Scalars['ID']['input'];
}>;


export type SetSkillMutation = { updateToolCall?: { toolCall?: Array<{ id: string, skill?: { id: string, name: string, mode?: SkillMode | null } | null } | null> | null } | null };

export type CreateOAuthProviderMutationVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  provider: OAuthProviderType;
  enabled: Scalars['Boolean']['input'];
  clientId: Scalars['String']['input'];
  encryptedClientSecret: Scalars['String']['input'];
  tenantId?: InputMaybe<Scalars['String']['input']>;
  now: Scalars['DateTime']['input'];
}>;


export type CreateOAuthProviderMutation = { addOAuthProviderConfig?: { oAuthProviderConfig?: Array<{ id: string, provider: OAuthProviderType, enabled: boolean, clientId: string, tenantId?: string | null, createdAt: string, updatedAt: string } | null> | null } | null };

export type DeleteOAuthProviderMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteOAuthProviderMutation = { deleteOAuthProviderConfig?: { oAuthProviderConfig?: Array<{ id: string } | null> | null } | null };

export type FindOAuthProviderByTypeQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  provider: OAuthProviderType;
}>;


export type FindOAuthProviderByTypeQuery = { getWorkspace?: { oauthProviders?: Array<{ id: string, provider: OAuthProviderType, enabled: boolean, clientId: string, encryptedClientSecret: string, tenantId?: string | null, createdAt: string, updatedAt: string }> | null } | null };

export type GetOAuthProviderByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetOAuthProviderByIdQuery = { getOAuthProviderConfig?: { id: string, provider: OAuthProviderType, workspace: { id: string } } | null };

export type GetOAuthProvidersByWorkspaceQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type GetOAuthProvidersByWorkspaceQuery = { getWorkspace?: { oauthProviders?: Array<{ id: string, provider: OAuthProviderType, enabled: boolean, clientId: string, encryptedClientSecret: string, tenantId?: string | null, createdAt: string, updatedAt: string }> | null } | null };

export type UpdateOAuthProviderMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  clientId?: InputMaybe<Scalars['String']['input']>;
  encryptedClientSecret?: InputMaybe<Scalars['String']['input']>;
  tenantId?: InputMaybe<Scalars['String']['input']>;
  now: Scalars['DateTime']['input'];
}>;


export type UpdateOAuthProviderMutation = { updateOAuthProviderConfig?: { oAuthProviderConfig?: Array<{ id: string, provider: OAuthProviderType, enabled: boolean, clientId: string, tenantId?: string | null, createdAt: string, updatedAt: string } | null> | null } | null };

export type UpdateOAuthProviderEnabledMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  enabled: Scalars['Boolean']['input'];
  now: Scalars['DateTime']['input'];
}>;


export type UpdateOAuthProviderEnabledMutation = { updateOAuthProviderConfig?: { oAuthProviderConfig?: Array<{ id: string, provider: OAuthProviderType, enabled: boolean, clientId: string, tenantId?: string | null, createdAt: string, updatedAt: string } | null> | null } | null };

export type AddMcpServerToRuntimeMutationVariables = Exact<{
  runtimeId: Scalars['ID']['input'];
  mcpServerId: Scalars['ID']['input'];
}>;


export type AddMcpServerToRuntimeMutation = { updateRuntime?: { runtime?: Array<{ id: string, mcpServers?: Array<{ id: string, description: string, transport: McpTransportType, config: string }> | null } | null> | null } | null };

export type AddMcpToolMutationVariables = Exact<{
  toolName: Scalars['String']['input'];
  toolDescription: Scalars['String']['input'];
  toolInputSchema: Scalars['String']['input'];
  toolAnnotations: Scalars['String']['input'];
  now: Scalars['DateTime']['input'];
  workspaceId: Scalars['ID']['input'];
  mcpServerId: Scalars['ID']['input'];
}>;


export type AddMcpToolMutation = { addMCPTool?: { mCPTool?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string, status: ActiveStatus, workspace: { id: string } } | null> | null } | null };

export type AddSystemRuntimeMutationVariables = Exact<{
  name: Scalars['String']['input'];
  description: Scalars['String']['input'];
  status: ActiveStatus;
  type: RuntimeType;
  createdAt: Scalars['DateTime']['input'];
  lastSeenAt: Scalars['DateTime']['input'];
  systemId: Scalars['ID']['input'];
}>;


export type AddSystemRuntimeMutation = { addRuntime?: { runtime?: Array<{ id: string, name: string, description?: string | null, status: ActiveStatus, type: RuntimeType, createdAt: string, lastSeenAt?: string | null, workspace?: { id: string, name: string } | null, system?: { id: string } | null } | null> | null } | null };

export type AddWorkspaceRuntimeMutationVariables = Exact<{
  name: Scalars['String']['input'];
  description: Scalars['String']['input'];
  status: ActiveStatus;
  type: RuntimeType;
  createdAt: Scalars['DateTime']['input'];
  lastSeenAt: Scalars['DateTime']['input'];
  workspaceId: Scalars['ID']['input'];
}>;


export type AddWorkspaceRuntimeMutation = { addRuntime?: { runtime?: Array<{ id: string, name: string, description?: string | null, status: ActiveStatus, type: RuntimeType, createdAt: string, lastSeenAt?: string | null, workspace?: { id: string, name: string } | null, system?: { id: string } | null } | null> | null } | null };

export type DeleteRuntimeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteRuntimeMutation = { deleteRuntime?: { runtime?: Array<{ id: string, name: string, description?: string | null, status: ActiveStatus, createdAt: string, lastSeenAt?: string | null } | null> | null } | null };

export type GetRuntimeQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetRuntimeQuery = { getRuntime?: { id: string, name: string, description?: string | null, status: ActiveStatus, type: RuntimeType, createdAt: string, lastSeenAt?: string | null, processId?: string | null, hostIP?: string | null, hostname?: string | null, mcpClientName?: string | null, roots?: string | null, workspace?: { id: string } | null, system?: { id: string } | null } | null };

export type GetRuntimeAllToolsQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetRuntimeAllToolsQuery = { getRuntime?: { id: string, workspace?: { id: string } | null, mcpServers?: Array<{ id: string, tools?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string, status: ActiveStatus }> | null }> | null } | null };

export type GetRuntimeEdgeMcpServersQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetRuntimeEdgeMcpServersQuery = { getRuntime?: { id: string, mcpServers?: Array<{ id: string, name: string, description: string, transport: McpTransportType, config: string, executionTarget?: ExecutionTarget | null, tools?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string }> | null }> | null } | null };

export type QueryActiveRuntimesQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryActiveRuntimesQuery = { queryRuntime?: Array<{ id: string, name: string, description?: string | null, status: ActiveStatus, createdAt: string, lastSeenAt?: string | null, processId?: string | null, hostIP?: string | null, hostname?: string | null, mcpClientName?: string | null, roots?: string | null, workspace?: { id: string, name: string } | null, system?: { id: string } | null } | null> | null };

export type QueryMcpServerWithToolQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  toolName: Scalars['String']['input'];
}>;


export type QueryMcpServerWithToolQuery = { getMCPServer?: { id: string, workspace: { id: string }, tools?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string, status: ActiveStatus }> | null } | null };

export type QuerySystemRuntimeByNameQueryVariables = Exact<{
  systemId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
}>;


export type QuerySystemRuntimeByNameQuery = { getSystem?: { id: string, runtimes?: Array<{ id: string, name: string, description?: string | null, status: ActiveStatus, createdAt: string, lastSeenAt?: string | null, processId?: string | null, hostIP?: string | null, hostname?: string | null, mcpClientName?: string | null, roots?: string | null }> | null } | null };

export type QueryWorkspaceRuntimeByNameQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
}>;


export type QueryWorkspaceRuntimeByNameQuery = { getWorkspace?: { id: string, runtimes?: Array<{ id: string, name: string, description?: string | null, status: ActiveStatus, createdAt: string, lastSeenAt?: string | null, processId?: string | null, hostIP?: string | null, hostname?: string | null, mcpClientName?: string | null, roots?: string | null }> | null } | null };

export type SetRootsMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  roots: Scalars['String']['input'];
}>;


export type SetRootsMutation = { updateRuntime?: { runtime?: Array<{ id: string, roots?: string | null } | null> | null } | null };

export type SetRuntimeActiveMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  processId: Scalars['String']['input'];
  hostIP: Scalars['String']['input'];
  hostname: Scalars['String']['input'];
}>;


export type SetRuntimeActiveMutation = { updateRuntime?: { runtime?: Array<{ id: string, name: string, status: ActiveStatus, createdAt: string, lastSeenAt?: string | null, processId?: string | null, hostIP?: string | null, hostname?: string | null, mcpClientName?: string | null, roots?: string | null, workspace?: { id: string } | null, system?: { id: string } | null } | null> | null } | null };

export type SetRuntimeInactiveMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SetRuntimeInactiveMutation = { updateRuntime?: { runtime?: Array<{ id: string, name: string, status: ActiveStatus, createdAt: string, lastSeenAt?: string | null, processId?: string | null, hostIP?: string | null, hostname?: string | null, mcpClientName?: string | null, roots?: string | null, mcpServers?: Array<{ id: string, tools?: Array<{ id: string, name: string, status: ActiveStatus }> | null }> | null, workspace?: { id: string } | null, system?: { id: string } | null } | null> | null } | null };

export type UpdateMcpToolMutationVariables = Exact<{
  toolId: Scalars['ID']['input'];
  toolDescription: Scalars['String']['input'];
  toolInputSchema: Scalars['String']['input'];
  toolAnnotations: Scalars['String']['input'];
  now: Scalars['DateTime']['input'];
  status: ActiveStatus;
}>;


export type UpdateMcpToolMutation = { updateMCPTool?: { mCPTool?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string, status: ActiveStatus, workspace: { id: string } } | null> | null } | null };

export type UpdateRuntimeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  description: Scalars['String']['input'];
}>;


export type UpdateRuntimeMutation = { updateRuntime?: { runtime?: Array<{ id: string, name: string, description?: string | null, status: ActiveStatus, type: RuntimeType, createdAt: string, lastSeenAt?: string | null, workspace?: { id: string, name: string } | null, system?: { id: string } | null } | null> | null } | null };

export type UpdateRuntimeLastSeenMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  now: Scalars['DateTime']['input'];
}>;


export type UpdateRuntimeLastSeenMutation = { updateRuntime?: { runtime?: Array<{ id: string, lastSeenAt?: string | null } | null> | null } | null };

export type CleanupExpiredSessionsMutationVariables = Exact<{
  now: Scalars['DateTime']['input'];
}>;


export type CleanupExpiredSessionsMutation = { updateSession?: { session?: Array<{ id: string, expiresAt: string, isActive: boolean } | null> | null } | null };

export type CreateSessionMutationVariables = Exact<{
  refreshToken: Scalars['String']['input'];
  userId: Scalars['String']['input'];
  userIdRef: Scalars['ID']['input'];
  deviceInfo?: InputMaybe<Scalars['String']['input']>;
  ipAddress?: InputMaybe<Scalars['String']['input']>;
  userAgent?: InputMaybe<Scalars['String']['input']>;
  now: Scalars['DateTime']['input'];
  expiresAt: Scalars['DateTime']['input'];
}>;


export type CreateSessionMutation = { addSession?: { session?: Array<{ id: string, refreshToken: string, userId: string, deviceInfo?: string | null, ipAddress?: string | null, userAgent?: string | null, createdAt: string, expiresAt: string, lastUsedAt?: string | null, isActive: boolean } | null> | null } | null };

export type DeactivateSessionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeactivateSessionMutation = { updateSession?: { session?: Array<{ id: string, isActive: boolean } | null> | null } | null };

export type DeactivateUserSessionsMutationVariables = Exact<{
  userId: Scalars['String']['input'];
}>;


export type DeactivateUserSessionsMutation = { updateSession?: { session?: Array<{ id: string, userId: string, isActive: boolean } | null> | null } | null };

export type FindSessionByRefreshTokenQueryVariables = Exact<{
  refreshToken: Scalars['String']['input'];
}>;


export type FindSessionByRefreshTokenQuery = { querySession?: Array<{ id: string, refreshToken: string, userId: string, deviceInfo?: string | null, ipAddress?: string | null, userAgent?: string | null, createdAt: string, expiresAt: string, lastUsedAt?: string | null, isActive: boolean } | null> | null };

export type GetUserActiveSessionsQueryVariables = Exact<{
  userId: Scalars['String']['input'];
}>;


export type GetUserActiveSessionsQuery = { querySession?: Array<{ id: string, deviceInfo?: string | null, ipAddress?: string | null, userAgent?: string | null, createdAt: string, lastUsedAt?: string | null, expiresAt: string } | null> | null };

export type UpdateSessionLastUsedMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  now: Scalars['DateTime']['input'];
}>;


export type UpdateSessionLastUsedMutation = { updateSession?: { session?: Array<{ id: string, lastUsedAt?: string | null } | null> | null } | null };

export type AddMcpToolToSkillMutationVariables = Exact<{
  skillId: Scalars['ID']['input'];
  mcpToolId: Scalars['ID']['input'];
  updatedAt: Scalars['DateTime']['input'];
}>;


export type AddMcpToolToSkillMutation = { updateSkill?: { skill?: Array<{ id: string, name: string, description?: string | null, createdAt: string, updatedAt?: string | null, mcpTools?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string, status: ActiveStatus, createdAt: string, lastSeenAt: string, mcpServer: { id: string, name: string, executionTarget?: ExecutionTarget | null } }> | null, workspace: { id: string, name: string } } | null> | null } | null };

export type AddSkillMutationVariables = Exact<{
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  guardrails?: InputMaybe<Scalars['String']['input']>;
  associatedKnowledge?: InputMaybe<Scalars['String']['input']>;
  workspaceId: Scalars['ID']['input'];
  createdAt: Scalars['DateTime']['input'];
}>;


export type AddSkillMutation = { addSkill?: { skill?: Array<{ id: string, name: string, description?: string | null, guardrails?: string | null, associatedKnowledge?: string | null, createdAt: string, updatedAt?: string | null, workspace: { id: string, name: string } } | null> | null } | null };

export type DeleteSkillMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSkillMutation = { deleteSkill?: { skill?: Array<{ id: string, name: string, description?: string | null, createdAt: string, updatedAt?: string | null, workspace: { id: string, name: string } } | null> | null } | null };

export type GetSkillQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetSkillQuery = { getSkill?: { id: string, name: string, description?: string | null, guardrails?: string | null, associatedKnowledge?: string | null, createdAt: string, updatedAt?: string | null, mode?: SkillMode | null, model?: string | null, temperature?: number | null, maxTokens?: number | null, systemPrompt?: string | null, executionTarget?: ExecutionTarget | null, runtime?: { id: string, name: string } | null, mcpTools?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string, status: ActiveStatus, createdAt: string, lastSeenAt: string, mcpServer: { id: string, name: string, executionTarget?: ExecutionTarget | null } }> | null, workspace: { id: string, name: string } } | null };

export type GetSkillAgentMcpServersQueryVariables = Exact<{
  skillId: Scalars['ID']['input'];
}>;


export type GetSkillAgentMcpServersQuery = { getSkill?: { mcpTools?: Array<{ mcpServer: { id: string, name: string, description: string, transport: McpTransportType, config: string, executionTarget?: ExecutionTarget | null, tools?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string }> | null } }> | null } | null };

export type LinkSkillToRuntimeMutationVariables = Exact<{
  skillId: Scalars['ID']['input'];
  runtimeId: Scalars['ID']['input'];
  updatedAt: Scalars['DateTime']['input'];
}>;


export type LinkSkillToRuntimeMutation = { updateSkill?: { skill?: Array<{ id: string, name: string, description?: string | null, createdAt: string, updatedAt?: string | null, mode?: SkillMode | null, model?: string | null, temperature?: number | null, maxTokens?: number | null, systemPrompt?: string | null, executionTarget?: ExecutionTarget | null, runtime?: { id: string, name: string } | null, workspace: { id: string, name: string } } | null> | null } | null };

export type ObserveSkillsQueryQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type ObserveSkillsQueryQuery = { getWorkspace?: { id: string, skills?: Array<{ id: string, name: string, description?: string | null, createdAt: string, updatedAt?: string | null, mode?: SkillMode | null, model?: string | null, temperature?: number | null, maxTokens?: number | null, systemPrompt?: string | null, executionTarget?: ExecutionTarget | null, runtime?: { id: string, name: string } | null, mcpTools?: Array<{ id: string, name: string, description: string, status: ActiveStatus, mcpServer: { id: string, name: string, executionTarget?: ExecutionTarget | null } }> | null }> | null } | null };

export type ObserveSkillsSubscriptionSubscriptionVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type ObserveSkillsSubscriptionSubscription = { getWorkspace?: { id: string, skills?: Array<{ id: string, name: string, description?: string | null, createdAt: string, updatedAt?: string | null, mode?: SkillMode | null, model?: string | null, temperature?: number | null, maxTokens?: number | null, systemPrompt?: string | null, executionTarget?: ExecutionTarget | null, runtime?: { id: string, name: string } | null, mcpTools?: Array<{ id: string, name: string, description: string, status: ActiveStatus, mcpServer: { id: string, name: string, executionTarget?: ExecutionTarget | null } }> | null }> | null } | null };

export type QueryAllSkillsQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryAllSkillsQuery = { querySkill?: Array<{ id: string, name: string, description?: string | null, createdAt: string, updatedAt?: string | null, mode?: SkillMode | null, model?: string | null, temperature?: number | null, maxTokens?: number | null, systemPrompt?: string | null, executionTarget?: ExecutionTarget | null, runtime?: { id: string, name: string } | null, mcpTools?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string, status: ActiveStatus, createdAt: string, lastSeenAt: string, mcpServer: { id: string, name: string, executionTarget?: ExecutionTarget | null } }> | null, workspace: { id: string, name: string } } | null> | null };

export type QuerySkillByNameQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
}>;


export type QuerySkillByNameQuery = { getWorkspace?: { id: string, skills?: Array<{ id: string, name: string, description?: string | null, createdAt: string, updatedAt?: string | null, mcpTools?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string, status: ActiveStatus, createdAt: string, lastSeenAt: string, mcpServer: { id: string, name: string, executionTarget?: ExecutionTarget | null } }> | null, workspace: { id: string, name: string } }> | null } | null };

export type QuerySkillsByWorkspaceQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type QuerySkillsByWorkspaceQuery = { getWorkspace?: { id: string, skills?: Array<{ id: string, name: string, description?: string | null, createdAt: string, updatedAt?: string | null, mcpTools?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string, status: ActiveStatus, createdAt: string, lastSeenAt: string }> | null }> | null } | null };

export type QuerySmartSkillsByRuntimeQueryVariables = Exact<{
  runtimeId: Scalars['ID']['input'];
}>;


export type QuerySmartSkillsByRuntimeQuery = { getRuntime?: { id: string, skills?: Array<{ id: string, name: string, description?: string | null, mode?: SkillMode | null, model?: string | null, temperature?: number | null, maxTokens?: number | null, systemPrompt?: string | null, executionTarget?: ExecutionTarget | null, workspace: { id: string, name: string } }> | null } | null };

export type RemoveMcpToolFromSkillMutationVariables = Exact<{
  skillId: Scalars['ID']['input'];
  mcpToolId: Scalars['ID']['input'];
  updatedAt: Scalars['DateTime']['input'];
}>;


export type RemoveMcpToolFromSkillMutation = { updateSkill?: { skill?: Array<{ id: string, name: string, description?: string | null, createdAt: string, updatedAt?: string | null, mcpTools?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string, status: ActiveStatus, createdAt: string, lastSeenAt: string, mcpServer: { id: string, name: string, executionTarget?: ExecutionTarget | null } }> | null, workspace: { id: string, name: string } } | null> | null } | null };

export type UnlinkSkillFromRuntimeMutationVariables = Exact<{
  skillId: Scalars['ID']['input'];
  updatedAt: Scalars['DateTime']['input'];
}>;


export type UnlinkSkillFromRuntimeMutation = { updateSkill?: { skill?: Array<{ id: string, name: string, description?: string | null, createdAt: string, updatedAt?: string | null, mode?: SkillMode | null, model?: string | null, temperature?: number | null, maxTokens?: number | null, systemPrompt?: string | null, executionTarget?: ExecutionTarget | null, runtime?: { id: string, name: string } | null, workspace: { id: string, name: string } } | null> | null } | null };

export type UpdateSkillMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  guardrails?: InputMaybe<Scalars['String']['input']>;
  associatedKnowledge?: InputMaybe<Scalars['String']['input']>;
  updatedAt: Scalars['DateTime']['input'];
}>;


export type UpdateSkillMutation = { updateSkill?: { skill?: Array<{ id: string, name: string, description?: string | null, guardrails?: string | null, associatedKnowledge?: string | null, createdAt: string, updatedAt?: string | null, workspace: { id: string, name: string } } | null> | null } | null };

export type UpdateSkillModeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  mode: SkillMode;
  updatedAt: Scalars['DateTime']['input'];
}>;


export type UpdateSkillModeMutation = { updateSkill?: { skill?: Array<{ id: string, name: string, description?: string | null, createdAt: string, updatedAt?: string | null, mode?: SkillMode | null, model?: string | null, temperature?: number | null, maxTokens?: number | null, systemPrompt?: string | null, executionTarget?: ExecutionTarget | null, runtime?: { id: string, name: string } | null, mcpTools?: Array<{ id: string, name: string }> | null, workspace: { id: string, name: string } } | null> | null } | null };

export type UpdateSkillSmartConfigMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  model?: InputMaybe<Scalars['String']['input']>;
  temperature?: InputMaybe<Scalars['Float']['input']>;
  maxTokens?: InputMaybe<Scalars['Int']['input']>;
  systemPrompt?: InputMaybe<Scalars['String']['input']>;
  executionTarget?: InputMaybe<ExecutionTarget>;
  updatedAt: Scalars['DateTime']['input'];
}>;


export type UpdateSkillSmartConfigMutation = { updateSkill?: { skill?: Array<{ id: string, name: string, description?: string | null, createdAt: string, updatedAt?: string | null, mode?: SkillMode | null, model?: string | null, temperature?: number | null, maxTokens?: number | null, systemPrompt?: string | null, executionTarget?: ExecutionTarget | null, runtime?: { id: string, name: string } | null, mcpTools?: Array<{ id: string, name: string }> | null, workspace: { id: string, name: string } } | null> | null } | null };

export type CreateSystemMutationVariables = Exact<{
  adminId: Scalars['ID']['input'];
  now: Scalars['DateTime']['input'];
  instanceId: Scalars['String']['input'];
}>;


export type CreateSystemMutation = { addSystem?: { system?: Array<{ id: string, initialized: boolean, createdAt: string, updatedAt: string, instanceId: string, admins?: Array<{ id: string, email: string }> | null } | null> | null } | null };

export type InitSystemMutationVariables = Exact<{
  systemId: Scalars['ID']['input'];
  now: Scalars['DateTime']['input'];
}>;


export type InitSystemMutation = { updateSystem?: { system?: Array<{ id: string, initialized: boolean, createdAt: string, updatedAt: string, instanceId: string, defaultWorkspace?: { id: string, name: string, createdAt: string } | null, admins?: Array<{ id: string, email: string }> | null } | null> | null } | null };

export type QuerySystemQueryVariables = Exact<{ [key: string]: never; }>;


export type QuerySystemQuery = { querySystem?: Array<{ id: string, initialized: boolean, createdAt: string, updatedAt: string, instanceId: string, defaultWorkspace?: { id: string, name: string, createdAt: string } | null, admins?: Array<{ id: string, email: string }> | null } | null> | null };

export type QuerySystemWithDefaultWorkspaceQueryVariables = Exact<{ [key: string]: never; }>;


export type QuerySystemWithDefaultWorkspaceQuery = { querySystem?: Array<{ id: string, initialized: boolean, createdAt: string, updatedAt: string, instanceId: string, defaultWorkspace?: { id: string, name: string, createdAt: string } | null, runtimes?: Array<{ id: string, name: string, description?: string | null, status: ActiveStatus, type: RuntimeType, createdAt: string }> | null, admins?: Array<{ id: string, email: string }> | null } | null> | null };

export type QuerySystemWithRuntimesQueryVariables = Exact<{ [key: string]: never; }>;


export type QuerySystemWithRuntimesQuery = { querySystem?: Array<{ id: string, runtimes?: Array<{ id: string, name: string, description?: string | null, status: ActiveStatus, createdAt: string, lastSeenAt?: string | null, roots?: string | null, type: RuntimeType, hostname?: string | null, mcpClientName?: string | null, hostIP?: string | null, mcpServers?: Array<{ id: string, name: string, description: string }> | null }> | null } | null> | null };

export type SetDefaultWorkspaceMutationVariables = Exact<{
  systemId: Scalars['ID']['input'];
  workspaceId: Scalars['ID']['input'];
}>;


export type SetDefaultWorkspaceMutation = { updateSystem?: { system?: Array<{ id: string, instanceId: string, defaultWorkspace?: { id: string, name: string } | null, admins?: Array<{ id: string, email: string }> | null } | null> | null } | null };

export type CreateUserOAuthConnectionMutationVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
  provider: OAuthProviderType;
  encryptedAccessToken: Scalars['String']['input'];
  encryptedRefreshToken?: InputMaybe<Scalars['String']['input']>;
  tokenExpiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  scopes?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  accountEmail?: InputMaybe<Scalars['String']['input']>;
  accountName?: InputMaybe<Scalars['String']['input']>;
  accountAvatarUrl?: InputMaybe<Scalars['String']['input']>;
  providerAccountId?: InputMaybe<Scalars['String']['input']>;
  now: Scalars['DateTime']['input'];
}>;


export type CreateUserOAuthConnectionMutation = { addUserOAuthConnection?: { userOAuthConnection?: Array<{ id: string, provider: OAuthProviderType, accountEmail?: string | null, accountName?: string | null, accountAvatarUrl?: string | null, providerAccountId?: string | null, scopes?: Array<string> | null, tokenExpiresAt?: string | null, createdAt: string, updatedAt: string, lastUsedAt?: string | null } | null> | null } | null };

export type DeleteUserOAuthConnectionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteUserOAuthConnectionMutation = { deleteUserOAuthConnection?: { userOAuthConnection?: Array<{ id: string } | null> | null } | null };

export type FindUserOAuthConnectionByProviderQueryVariables = Exact<{
  provider: OAuthProviderType;
}>;


export type FindUserOAuthConnectionByProviderQuery = { queryUserOAuthConnection?: Array<{ id: string, provider: OAuthProviderType, encryptedAccessToken: string, encryptedRefreshToken?: string | null, tokenExpiresAt?: string | null, scopes?: Array<string> | null, accountEmail?: string | null, accountName?: string | null, accountAvatarUrl?: string | null, providerAccountId?: string | null, createdAt: string, updatedAt: string, lastUsedAt?: string | null, workspace: { id: string }, user: { id: string } } | null> | null };

export type GetUserOAuthConnectionByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserOAuthConnectionByIdQuery = { getUserOAuthConnection?: { id: string, provider: OAuthProviderType, encryptedAccessToken: string, encryptedRefreshToken?: string | null, tokenExpiresAt?: string | null, scopes?: Array<string> | null, accountEmail?: string | null, accountName?: string | null, accountAvatarUrl?: string | null, providerAccountId?: string | null, createdAt: string, updatedAt: string, lastUsedAt?: string | null, workspace: { id: string }, user: { id: string } } | null };

export type GetUserOAuthConnectionsByWorkspaceQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUserOAuthConnectionsByWorkspaceQuery = { queryUserOAuthConnection?: Array<{ id: string, provider: OAuthProviderType, accountEmail?: string | null, accountName?: string | null, accountAvatarUrl?: string | null, providerAccountId?: string | null, scopes?: Array<string> | null, tokenExpiresAt?: string | null, createdAt: string, updatedAt: string, lastUsedAt?: string | null, workspace: { id: string }, user: { id: string } } | null> | null };

export type UpdateUserOAuthConnectionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  encryptedAccessToken?: InputMaybe<Scalars['String']['input']>;
  encryptedRefreshToken?: InputMaybe<Scalars['String']['input']>;
  tokenExpiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  scopes?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  accountEmail?: InputMaybe<Scalars['String']['input']>;
  accountName?: InputMaybe<Scalars['String']['input']>;
  accountAvatarUrl?: InputMaybe<Scalars['String']['input']>;
  now: Scalars['DateTime']['input'];
}>;


export type UpdateUserOAuthConnectionMutation = { updateUserOAuthConnection?: { userOAuthConnection?: Array<{ id: string, provider: OAuthProviderType, accountEmail?: string | null, accountName?: string | null, accountAvatarUrl?: string | null, providerAccountId?: string | null, scopes?: Array<string> | null, tokenExpiresAt?: string | null, createdAt: string, updatedAt: string, lastUsedAt?: string | null } | null> | null } | null };

export type UpdateUserOAuthConnectionLastUsedMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  now: Scalars['DateTime']['input'];
}>;


export type UpdateUserOAuthConnectionLastUsedMutation = { updateUserOAuthConnection?: { userOAuthConnection?: Array<{ id: string, lastUsedAt?: string | null } | null> | null } | null };

export type AddAdminToWorkspaceMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  workspaceId: Scalars['ID']['input'];
}>;


export type AddAdminToWorkspaceMutation = { updateUser?: { user?: Array<{ id: string, email: string } | null> | null } | null };

export type AddMemberToWorkspaceMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  workspaceId: Scalars['ID']['input'];
}>;


export type AddMemberToWorkspaceMutation = { updateUser?: { user?: Array<{ id: string, email: string } | null> | null } | null };

export type AddUserMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  now: Scalars['DateTime']['input'];
}>;


export type AddUserMutation = { addUser?: { user?: Array<{ id: string, email: string, createdAt: string } | null> | null } | null };

export type FindUserByEmailQueryVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type FindUserByEmailQuery = { queryUser?: Array<{ id: string, email: string, password: string, createdAt: string, updatedAt: string, lastLoginAt?: string | null, failedLoginAttempts?: number | null, lockedUntil?: string | null, adminOfWorkspaces?: Array<{ id: string, name: string }> | null, membersOfWorkspaces?: Array<{ id: string, name: string }> | null } | null> | null };

export type FindUserByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type FindUserByIdQuery = { getUser?: { id: string, email: string } | null };

export type IncrementFailedLoginAttemptsMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  attempts: Scalars['Int']['input'];
  lockedUntil?: InputMaybe<Scalars['DateTime']['input']>;
}>;


export type IncrementFailedLoginAttemptsMutation = { updateUser?: { user?: Array<{ id: string, email: string, failedLoginAttempts?: number | null, lockedUntil?: string | null } | null> | null } | null };

export type UnlockUserAccountMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UnlockUserAccountMutation = { updateUser?: { user?: Array<{ id: string, email: string, failedLoginAttempts?: number | null, lockedUntil?: string | null } | null> | null } | null };

export type UpdateUserEmailMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  email: Scalars['String']['input'];
}>;


export type UpdateUserEmailMutation = { updateUser?: { user?: Array<{ id: string, email: string } | null> | null } | null };

export type UpdateUserLastLoginMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  now: Scalars['DateTime']['input'];
}>;


export type UpdateUserLastLoginMutation = { updateUser?: { user?: Array<{ id: string, email: string, lastLoginAt?: string | null } | null> | null } | null };

export type UpdateUserPasswordMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  password: Scalars['String']['input'];
  now: Scalars['DateTime']['input'];
}>;


export type UpdateUserPasswordMutation = { updateUser?: { user?: Array<{ id: string, email: string } | null> | null } | null };

export type AddRegistryServerMutationVariables = Exact<{
  name: Scalars['String']['input'];
  description: Scalars['String']['input'];
  title: Scalars['String']['input'];
  repositoryUrl: Scalars['String']['input'];
  version: Scalars['String']['input'];
  packages: Scalars['String']['input'];
  remotes?: InputMaybe<Scalars['String']['input']>;
  _meta?: InputMaybe<Scalars['String']['input']>;
  workspaceId: Scalars['ID']['input'];
  now: Scalars['DateTime']['input'];
}>;


export type AddRegistryServerMutation = { addMCPRegistryServer?: { mCPRegistryServer?: Array<{ id: string, name: string, description: string, title: string, repositoryUrl: string, version: string, packages?: string | null, remotes?: string | null, _meta?: string | null, createdAt: string, lastSeenAt: string, workspace: { id: string } } | null> | null } | null };

export type AddWorkspaceMutationVariables = Exact<{
  name: Scalars['String']['input'];
  now: Scalars['DateTime']['input'];
  systemId: Scalars['ID']['input'];
  adminId: Scalars['ID']['input'];
}>;


export type AddWorkspaceMutation = { addWorkspace?: { workspace?: Array<{ id: string, name: string, createdAt: string, system: { id: string, initialized: boolean, admins?: Array<{ id: string, email: string }> | null } } | null> | null } | null };

export type CheckUserWorkspaceAccessQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  workspaceId: Scalars['ID']['input'];
}>;


export type CheckUserWorkspaceAccessQuery = { getUser?: { id: string, adminOfWorkspaces?: Array<{ id: string }> | null, membersOfWorkspaces?: Array<{ id: string }> | null } | null };

export type CreateOnboardingStepMutationVariables = Exact<{
  stepId: Scalars['String']['input'];
  type: OnboardingStepType;
  priority: Scalars['Int']['input'];
  now: Scalars['DateTime']['input'];
}>;


export type CreateOnboardingStepMutation = { addOnboardingStep?: { onboardingStep?: Array<{ id: string, stepId: string, type: OnboardingStepType, status: OnboardingStepStatus, priority?: number | null, createdAt: string } | null> | null } | null };

export type DeleteRegistryServerMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteRegistryServerMutation = { deleteMCPRegistryServer?: { mCPRegistryServer?: Array<{ id: string, name: string } | null> | null } | null };

export type GetRegistryServerQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetRegistryServerQuery = { getMCPRegistryServer?: { id: string, name: string, description: string, title: string, repositoryUrl: string, version: string, packages?: string | null, remotes?: string | null, _meta?: string | null, createdAt: string, lastSeenAt: string, workspace: { id: string }, configurations?: Array<{ id: string, name: string }> | null } | null };

export type LinkOnboardingStepToWorkspaceMutationVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  stepId: Scalars['ID']['input'];
}>;


export type LinkOnboardingStepToWorkspaceMutation = { updateWorkspace?: { workspace?: Array<{ id: string, name: string, onboardingSteps?: Array<{ id: string, stepId: string, type: OnboardingStepType, status: OnboardingStepStatus, priority?: number | null, createdAt: string, updatedAt?: string | null }> | null } | null> | null } | null };

export type QueryWorkspaceQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type QueryWorkspaceQuery = { getWorkspace?: { id: string, name: string, createdAt: string, defaultAIModel?: string | null, onboardingSteps?: Array<{ id: string, stepId: string, type: OnboardingStepType, status: OnboardingStepStatus, priority?: number | null, createdAt: string, updatedAt?: string | null, metadata?: string | null }> | null } | null };

export type QueryWorkspaceWithMcpServersQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type QueryWorkspaceWithMcpServersQuery = { getWorkspace?: { id: string, mcpServers?: Array<{ id: string, name: string, description: string, repositoryUrl: string, transport: McpTransportType, config: string, executionTarget?: ExecutionTarget | null, tools?: Array<{ id: string, name: string, description: string, status: ActiveStatus, inputSchema: string, annotations: string, mcpServer: { id: string, name: string, description: string, executionTarget?: ExecutionTarget | null } }> | null, runtime?: { id: string, name: string, description?: string | null, status: ActiveStatus, lastSeenAt?: string | null, createdAt: string } | null, workspace: { id: string, name: string } }> | null } | null };

export type QueryWorkspaceWithMcpToolsQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type QueryWorkspaceWithMcpToolsQuery = { getWorkspace?: { id: string, mcpTools?: Array<{ id: string, name: string, description: string, inputSchema: string, annotations: string, status: ActiveStatus, createdAt: string, lastSeenAt: string, mcpServer: { id: string, name: string, description: string, repositoryUrl: string, executionTarget?: ExecutionTarget | null }, skills?: Array<{ id: string, name: string, description?: string | null }> | null }> | null } | null };

export type QueryWorkspaceWithRegistryServersQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type QueryWorkspaceWithRegistryServersQuery = { getWorkspace?: { id: string, registryServers?: Array<{ id: string, name: string, description: string, title: string, repositoryUrl: string, version: string, packages?: string | null, remotes?: string | null, _meta?: string | null, createdAt: string, lastSeenAt: string, configurations?: Array<{ id: string, name: string }> | null }> | null } | null };

export type QueryWorkspaceWithRuntimesQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type QueryWorkspaceWithRuntimesQuery = { getWorkspace?: { id: string, name: string, defaultAIModel?: string | null, runtimes?: Array<{ id: string, name: string, description?: string | null, status: ActiveStatus, createdAt: string, lastSeenAt?: string | null, roots?: string | null, type: RuntimeType, hostname?: string | null, mcpClientName?: string | null, hostIP?: string | null, mcpServers?: Array<{ id: string, name: string, description: string, executionTarget?: ExecutionTarget | null }> | null }> | null } | null };

export type QueryWorkspacesByUserQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type QueryWorkspacesByUserQuery = { getUser?: { id: string, adminOfWorkspaces?: Array<{ id: string, name: string, createdAt: string }> | null } | null };

export type UpdateOnboardingStepStatusMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  status: OnboardingStepStatus;
  now: Scalars['DateTime']['input'];
  metadata?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateOnboardingStepStatusMutation = { updateOnboardingStep?: { onboardingStep?: Array<{ id: string, stepId: string, type: OnboardingStepType, status: OnboardingStepStatus, priority?: number | null, metadata?: string | null, createdAt: string, updatedAt?: string | null } | null> | null } | null };

export type UpdateRegistryServerMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  repositoryUrl?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
  packages?: InputMaybe<Scalars['String']['input']>;
  remotes?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateRegistryServerMutation = { updateMCPRegistryServer?: { mCPRegistryServer?: Array<{ id: string, name: string, description: string, title: string, repositoryUrl: string, version: string, packages?: string | null, remotes?: string | null, _meta?: string | null, createdAt: string, lastSeenAt: string } | null> | null } | null };

export type UpdateWorkspaceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
}>;


export type UpdateWorkspaceMutation = { updateWorkspace?: { workspace?: Array<{ id: string, name: string, createdAt: string } | null> | null } | null };


export const CreateAiConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAiConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"value"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addAIConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"value"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"workspace"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"createdAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aIConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<CreateAiConfigMutation, CreateAiConfigMutationVariables>;
export const DeleteAiConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAiConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAIConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aIConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteAiConfigMutation, DeleteAiConfigMutationVariables>;
export const FindAiConfigByKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindAiConfigByKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"aiConfigs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"key"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<FindAiConfigByKeyQuery, FindAiConfigByKeyQueryVariables>;
export const GetAiConfigByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAiConfigById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAIConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetAiConfigByIdQuery, GetAiConfigByIdQueryVariables>;
export const GetAiConfigsByWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAiConfigsByWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"aiConfigs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetAiConfigsByWorkspaceQuery, GetAiConfigsByWorkspaceQueryVariables>;
export const ObserveAiConfigsSubscriptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ObserveAiConfigsSubscription"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"aiConfigs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<ObserveAiConfigsSubscriptionSubscription, ObserveAiConfigsSubscriptionSubscriptionVariables>;
export const UpdateAiConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAiConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"value"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAIConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"value"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aIConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateAiConfigMutation, UpdateAiConfigMutationVariables>;
export const CreateAiProviderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAiProvider"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"provider"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AIProviderType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"encryptedApiKey"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"baseUrl"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"availableModels"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addAIProviderConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"workspace"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"provider"},"value":{"kind":"Variable","name":{"kind":"Name","value":"provider"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"encryptedApiKey"},"value":{"kind":"Variable","name":{"kind":"Name","value":"encryptedApiKey"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"baseUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"baseUrl"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"availableModels"},"value":{"kind":"Variable","name":{"kind":"Name","value":"availableModels"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"createdAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aIProviderConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"encryptedApiKey"}},{"kind":"Field","name":{"kind":"Name","value":"baseUrl"}},{"kind":"Field","name":{"kind":"Name","value":"availableModels"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<CreateAiProviderMutation, CreateAiProviderMutationVariables>;
export const DeleteAiProviderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAiProvider"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAIProviderConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aIProviderConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteAiProviderMutation, DeleteAiProviderMutationVariables>;
export const FindAiProviderByTypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindAiProviderByType"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"provider"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AIProviderType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aiProviders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"provider"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"provider"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"encryptedApiKey"}},{"kind":"Field","name":{"kind":"Name","value":"baseUrl"}},{"kind":"Field","name":{"kind":"Name","value":"availableModels"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<FindAiProviderByTypeQuery, FindAiProviderByTypeQueryVariables>;
export const GetAiProviderByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAiProviderById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAIProviderConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"baseUrl"}},{"kind":"Field","name":{"kind":"Name","value":"availableModels"}},{"kind":"Field","name":{"kind":"Name","value":"encryptedApiKey"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetAiProviderByIdQuery, GetAiProviderByIdQueryVariables>;
export const GetAiProvidersByWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAiProvidersByWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aiProviders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"encryptedApiKey"}},{"kind":"Field","name":{"kind":"Name","value":"baseUrl"}},{"kind":"Field","name":{"kind":"Name","value":"availableModels"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetAiProvidersByWorkspaceQuery, GetAiProvidersByWorkspaceQueryVariables>;
export const SetDefaultModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetDefaultModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"providerModel"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"defaultAIModel"},"value":{"kind":"Variable","name":{"kind":"Name","value":"providerModel"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"defaultAIModel"}}]}}]}}]}}]} as unknown as DocumentNode<SetDefaultModelMutation, SetDefaultModelMutationVariables>;
export const UpdateAiProviderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAiProvider"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"encryptedApiKey"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"baseUrl"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"availableModels"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAIProviderConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"encryptedApiKey"},"value":{"kind":"Variable","name":{"kind":"Name","value":"encryptedApiKey"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"baseUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"baseUrl"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"availableModels"},"value":{"kind":"Variable","name":{"kind":"Name","value":"availableModels"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"aIProviderConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"encryptedApiKey"}},{"kind":"Field","name":{"kind":"Name","value":"baseUrl"}},{"kind":"Field","name":{"kind":"Name","value":"availableModels"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateAiProviderMutation, UpdateAiProviderMutationVariables>;
export const CreateIdentityKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateIdentityKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"relatedId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expiresAt"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"permissions"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addIdentityKey"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"key"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"relatedId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"relatedId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"createdAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"expiresAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expiresAt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"permissions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"permissions"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"identityKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"relatedId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"revokedAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}}]}}]}}]} as unknown as DocumentNode<CreateIdentityKeyMutation, CreateIdentityKeyMutationVariables>;
export const DeleteIdentityKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteIdentityKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteIdentityKey"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"identityKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteIdentityKeyMutation, DeleteIdentityKeyMutationVariables>;
export const FindIdentityKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindIdentityKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"key"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queryIdentityKey"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"key"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"key"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"relatedId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"revokedAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}}]}}]} as unknown as DocumentNode<FindIdentityKeyQuery, FindIdentityKeyQueryVariables>;
export const FindKeyByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindKeyById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getIdentityKey"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"relatedId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"revokedAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}}]}}]} as unknown as DocumentNode<FindKeyByIdQuery, FindKeyByIdQueryVariables>;
export const FindKeysByRelatedIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindKeysByRelatedId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"relatedId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queryIdentityKey"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"relatedId"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"relatedId"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"relatedId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"revokedAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}}]}}]} as unknown as DocumentNode<FindKeysByRelatedIdQuery, FindKeysByRelatedIdQueryVariables>;
export const RevokeIdentityKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevokeIdentityKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateIdentityKey"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"revokedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"identityKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"relatedId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"revokedAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}}]}}]}}]} as unknown as DocumentNode<RevokeIdentityKeyMutation, RevokeIdentityKeyMutationVariables>;
export const AddMcpServerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddMcpServer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"repositoryUrl"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"transport"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MCPTransportType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"config"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"registryServerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"executionTarget"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ExecutionTarget"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addMCPServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"repositoryUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"repositoryUrl"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"transport"},"value":{"kind":"Variable","name":{"kind":"Name","value":"transport"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"config"},"value":{"kind":"Variable","name":{"kind":"Name","value":"config"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"executionTarget"},"value":{"kind":"Variable","name":{"kind":"Name","value":"executionTarget"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"workspace"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"registryServer"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"registryServerId"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mCPServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"transport"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"registryServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AddMcpServerMutation, AddMcpServerMutationVariables>;
export const DeleteMcpServerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMcpServer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMCPServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mCPServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"transport"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DeleteMcpServerMutation, DeleteMcpServerMutationVariables>;
export const DeleteMcpToolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMcpTools"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMCPTool"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mCPTool"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteMcpToolsMutation, DeleteMcpToolsMutationVariables>;
export const GetMcpServerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMcpServer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getMCPServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetMcpServerQuery, GetMcpServerQueryVariables>;
export const GetMcpServerWithWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMcpServerWithWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getMCPServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetMcpServerWithWorkspaceQuery, GetMcpServerWithWorkspaceQueryVariables>;
export const LinkRuntimeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LinkRuntime"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mcpServerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"runtimeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMCPServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"mcpServerId"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"runtime"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"runtimeId"}}}]}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mCPServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]}}]}}]}}]} as unknown as DocumentNode<LinkRuntimeMutation, LinkRuntimeMutationVariables>;
export const QueryMcpServerCapabilitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryMcpServerCapabilities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getMCPServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]}}]}}]} as unknown as DocumentNode<QueryMcpServerCapabilitiesQuery, QueryMcpServerCapabilitiesQueryVariables>;
export const QueryMcpServersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryMcpServers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queryMCPServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"transport"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<QueryMcpServersQuery, QueryMcpServersQueryVariables>;
export const QueryMcpServersByWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryMcpServersByWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queryMCPServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"has"},"value":{"kind":"EnumValue","value":"workspace"}}]}}],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"cascade"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"transport"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<QueryMcpServersByWorkspaceQuery, QueryMcpServersByWorkspaceQueryVariables>;
export const SubscribeMcpServerCapabilitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeMcpServerCapabilities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getMCPServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]}}]}}]} as unknown as DocumentNode<SubscribeMcpServerCapabilitiesSubscription, SubscribeMcpServerCapabilitiesSubscriptionVariables>;
export const UnlinkRuntimeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnlinkRuntime"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mcpServerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"runtimeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMCPServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"mcpServerId"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"remove"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"runtime"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"runtimeId"}}}]}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mCPServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UnlinkRuntimeMutation, UnlinkRuntimeMutationVariables>;
export const UpdateExecutionTargetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateExecutionTarget"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"executionTarget"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ExecutionTarget"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMCPServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"executionTarget"},"value":{"kind":"Variable","name":{"kind":"Name","value":"executionTarget"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mCPServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateExecutionTargetMutation, UpdateExecutionTargetMutationVariables>;
export const UpdateMcpServerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMcpServer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"repositoryUrl"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"transport"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MCPTransportType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"config"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"executionTarget"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ExecutionTarget"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMCPServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"repositoryUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"repositoryUrl"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"transport"},"value":{"kind":"Variable","name":{"kind":"Name","value":"transport"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"config"},"value":{"kind":"Variable","name":{"kind":"Name","value":"config"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"executionTarget"},"value":{"kind":"Variable","name":{"kind":"Name","value":"executionTarget"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mCPServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"transport"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateMcpServerMutation, UpdateMcpServerMutationVariables>;
export const GetMcpToolWithWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMcpToolWithWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getMCPTool"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"mcpServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}}]}}]}}]}}]} as unknown as DocumentNode<GetMcpToolWithWorkspaceQuery, GetMcpToolWithWorkspaceQueryVariables>;
export const SetMcpToolStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetMcpToolStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mcpToolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ActiveStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMCPTool"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"mcpToolId"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mCPTool"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<SetMcpToolStatusMutation, SetMcpToolStatusMutationVariables>;
export const AddToolCallDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddToolCall"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toolInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"calledAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isTest"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addToolCall"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"toolInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toolInput"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"calledAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"calledAt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"EnumValue","value":"PENDING"}},{"kind":"ObjectField","name":{"kind":"Name","value":"isTest"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isTest"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toolCall"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"toolInput"}},{"kind":"Field","name":{"kind":"Name","value":"calledAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isTest"}}]}}]}}]}}]} as unknown as DocumentNode<AddToolCallMutation, AddToolCallMutationVariables>;
export const CompleteToolCallErrorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteToolCallError"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"error"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"completedAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateToolCall"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"EnumValue","value":"FAILED"}},{"kind":"ObjectField","name":{"kind":"Name","value":"error"},"value":{"kind":"Variable","name":{"kind":"Name","value":"error"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"completedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"completedAt"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toolCall"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isTest"}}]}}]}}]}}]} as unknown as DocumentNode<CompleteToolCallErrorMutation, CompleteToolCallErrorMutationVariables>;
export const CompleteToolCallSuccessDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteToolCallSuccess"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toolOutput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"completedAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateToolCall"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"EnumValue","value":"COMPLETED"}},{"kind":"ObjectField","name":{"kind":"Name","value":"toolOutput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toolOutput"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"completedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"completedAt"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toolCall"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"toolOutput"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isTest"}}]}}]}}]}}]} as unknown as DocumentNode<CompleteToolCallSuccessMutation, CompleteToolCallSuccessMutationVariables>;
export const QueryToolCallsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryToolCalls"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"toolCalls"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"toolInput"}},{"kind":"Field","name":{"kind":"Name","value":"toolOutput"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"calledAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isTest"}},{"kind":"Field","name":{"kind":"Name","value":"mcpTool"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"calledBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"executedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<QueryToolCallsQuery, QueryToolCallsQueryVariables>;
export const QueryToolCallsFilteredDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryToolCallsFiltered"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"toolCalls"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"order"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"desc"},"value":{"kind":"EnumValue","value":"calledAt"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"toolInput"}},{"kind":"Field","name":{"kind":"Name","value":"toolOutput"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"calledAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isTest"}},{"kind":"Field","name":{"kind":"Name","value":"executedByAgent"}},{"kind":"Field","name":{"kind":"Name","value":"calledBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"executedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"skills"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"skillToolCalls"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"order"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"desc"},"value":{"kind":"EnumValue","value":"calledAt"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"toolInput"}},{"kind":"Field","name":{"kind":"Name","value":"toolOutput"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"calledAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isTest"}},{"kind":"Field","name":{"kind":"Name","value":"executedByAgent"}},{"kind":"Field","name":{"kind":"Name","value":"calledBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"executedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<QueryToolCallsFilteredQuery, QueryToolCallsFilteredQueryVariables>;
export const SetCalledByDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetCalledBy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"calledById"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateToolCall"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"calledBy"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"calledById"}}}]}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toolCall"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"calledBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SetCalledByMutation, SetCalledByMutationVariables>;
export const SetExecutedByDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetExecutedBy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"executedById"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateToolCall"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"executedBy"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"executedById"}}}]}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toolCall"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SetExecutedByMutation, SetExecutedByMutationVariables>;
export const SetExecutedByAgentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetExecutedByAgent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateToolCall"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"executedByAgent"},"value":{"kind":"BooleanValue","value":true}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toolCall"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executedByAgent"}}]}}]}}]}}]} as unknown as DocumentNode<SetExecutedByAgentMutation, SetExecutedByAgentMutationVariables>;
export const SetMcpToolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetMcpTool"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mcpToolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateToolCall"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"mcpTool"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mcpToolId"}}}]}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toolCall"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mcpTool"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SetMcpToolMutation, SetMcpToolMutationVariables>;
export const SetSkillDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetSkill"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skillId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateToolCall"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"skill"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skillId"}}}]}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toolCall"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"skill"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SetSkillMutation, SetSkillMutationVariables>;
export const CreateOAuthProviderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOAuthProvider"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"provider"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OAuthProviderType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"encryptedClientSecret"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tenantId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addOAuthProviderConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"workspace"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"provider"},"value":{"kind":"Variable","name":{"kind":"Name","value":"provider"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"clientId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"encryptedClientSecret"},"value":{"kind":"Variable","name":{"kind":"Name","value":"encryptedClientSecret"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"tenantId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tenantId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"createdAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"oAuthProviderConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<CreateOAuthProviderMutation, CreateOAuthProviderMutationVariables>;
export const DeleteOAuthProviderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteOAuthProvider"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteOAuthProviderConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"oAuthProviderConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteOAuthProviderMutation, DeleteOAuthProviderMutationVariables>;
export const FindOAuthProviderByTypeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindOAuthProviderByType"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"provider"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OAuthProviderType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"oauthProviders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"provider"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"provider"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"encryptedClientSecret"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<FindOAuthProviderByTypeQuery, FindOAuthProviderByTypeQueryVariables>;
export const GetOAuthProviderByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOAuthProviderById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getOAuthProviderConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetOAuthProviderByIdQuery, GetOAuthProviderByIdQueryVariables>;
export const GetOAuthProvidersByWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetOAuthProvidersByWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"oauthProviders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"encryptedClientSecret"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetOAuthProvidersByWorkspaceQuery, GetOAuthProvidersByWorkspaceQueryVariables>;
export const UpdateOAuthProviderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOAuthProvider"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"encryptedClientSecret"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tenantId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOAuthProviderConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"clientId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"clientId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"encryptedClientSecret"},"value":{"kind":"Variable","name":{"kind":"Name","value":"encryptedClientSecret"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"tenantId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tenantId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"oAuthProviderConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateOAuthProviderMutation, UpdateOAuthProviderMutationVariables>;
export const UpdateOAuthProviderEnabledDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOAuthProviderEnabled"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOAuthProviderConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"oAuthProviderConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"clientId"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateOAuthProviderEnabledMutation, UpdateOAuthProviderEnabledMutationVariables>;
export const AddMcpServerToRuntimeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddMcpServerToRuntime"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"runtimeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mcpServerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRuntime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"runtimeId"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"mcpServers"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mcpServerId"}}}]}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"transport"}},{"kind":"Field","name":{"kind":"Name","value":"config"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AddMcpServerToRuntimeMutation, AddMcpServerToRuntimeMutationVariables>;
export const AddMcpToolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddMcpTool"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toolName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toolDescription"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toolInputSchema"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toolAnnotations"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mcpServerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addMCPTool"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toolName"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toolDescription"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"inputSchema"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toolInputSchema"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"annotations"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toolAnnotations"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"EnumValue","value":"ACTIVE"}},{"kind":"ObjectField","name":{"kind":"Name","value":"createdAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lastSeenAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"workspace"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"mcpServer"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mcpServerId"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mCPTool"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AddMcpToolMutation, AddMcpToolMutationVariables>;
export const AddSystemRuntimeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddSystemRuntime"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ActiveStatus"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RuntimeType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createdAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lastSeenAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"systemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addRuntime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"createdAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createdAt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lastSeenAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lastSeenAt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"system"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"systemId"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AddSystemRuntimeMutation, AddSystemRuntimeMutationVariables>;
export const AddWorkspaceRuntimeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddWorkspaceRuntime"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ActiveStatus"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RuntimeType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createdAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lastSeenAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addRuntime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"createdAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createdAt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lastSeenAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lastSeenAt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"workspace"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AddWorkspaceRuntimeMutation, AddWorkspaceRuntimeMutationVariables>;
export const DeleteRuntimeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteRuntime"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRuntime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteRuntimeMutation, DeleteRuntimeMutationVariables>;
export const GetRuntimeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRuntime"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getRuntime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"processId"}},{"kind":"Field","name":{"kind":"Name","value":"hostIP"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"mcpClientName"}},{"kind":"Field","name":{"kind":"Name","value":"roots"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetRuntimeQuery, GetRuntimeQueryVariables>;
export const GetRuntimeAllToolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRuntimeAllTools"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getRuntime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"mcpServers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"EnumValue","value":"ACTIVE"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetRuntimeAllToolsQuery, GetRuntimeAllToolsQueryVariables>;
export const GetRuntimeEdgeMcpServersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRuntimeEdgeMcpServers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getRuntime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"executionTarget"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"EnumValue","value":"EDGE"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"transport"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetRuntimeEdgeMcpServersQuery, GetRuntimeEdgeMcpServersQueryVariables>;
export const QueryActiveRuntimesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryActiveRuntimes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queryRuntime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"EnumValue","value":"ACTIVE"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"processId"}},{"kind":"Field","name":{"kind":"Name","value":"hostIP"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"mcpClientName"}},{"kind":"Field","name":{"kind":"Name","value":"roots"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<QueryActiveRuntimesQuery, QueryActiveRuntimesQueryVariables>;
export const QueryMcpServerWithToolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryMcpServerWithTool"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toolName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getMCPServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toolName"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<QueryMcpServerWithToolQuery, QueryMcpServerWithToolQueryVariables>;
export const QuerySystemRuntimeByNameDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuerySystemRuntimeByName"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"systemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSystem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"systemId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"runtimes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"processId"}},{"kind":"Field","name":{"kind":"Name","value":"hostIP"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"mcpClientName"}},{"kind":"Field","name":{"kind":"Name","value":"roots"}}]}}]}}]}}]} as unknown as DocumentNode<QuerySystemRuntimeByNameQuery, QuerySystemRuntimeByNameQueryVariables>;
export const QueryWorkspaceRuntimeByNameDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryWorkspaceRuntimeByName"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"runtimes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"processId"}},{"kind":"Field","name":{"kind":"Name","value":"hostIP"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"mcpClientName"}},{"kind":"Field","name":{"kind":"Name","value":"roots"}}]}}]}}]}}]} as unknown as DocumentNode<QueryWorkspaceRuntimeByNameQuery, QueryWorkspaceRuntimeByNameQueryVariables>;
export const SetRootsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetRoots"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roots"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRuntime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"roots"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roots"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"roots"}}]}}]}}]}}]} as unknown as DocumentNode<SetRootsMutation, SetRootsMutationVariables>;
export const SetRuntimeActiveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetRuntimeActive"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"processId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hostIP"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRuntime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"EnumValue","value":"ACTIVE"}},{"kind":"ObjectField","name":{"kind":"Name","value":"lastSeenAt"},"value":{"kind":"StringValue","value":"2025-12-12T00:00:00Z","block":false}},{"kind":"ObjectField","name":{"kind":"Name","value":"processId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"processId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"hostIP"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hostIP"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"hostname"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"processId"}},{"kind":"Field","name":{"kind":"Name","value":"hostIP"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"mcpClientName"}},{"kind":"Field","name":{"kind":"Name","value":"roots"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SetRuntimeActiveMutation, SetRuntimeActiveMutationVariables>;
export const SetRuntimeInactiveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetRuntimeInactive"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRuntime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"EnumValue","value":"INACTIVE"}},{"kind":"ObjectField","name":{"kind":"Name","value":"processId"},"value":{"kind":"StringValue","value":"","block":false}},{"kind":"ObjectField","name":{"kind":"Name","value":"hostIP"},"value":{"kind":"StringValue","value":"","block":false}},{"kind":"ObjectField","name":{"kind":"Name","value":"hostname"},"value":{"kind":"StringValue","value":"","block":false}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"processId"}},{"kind":"Field","name":{"kind":"Name","value":"hostIP"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"mcpClientName"}},{"kind":"Field","name":{"kind":"Name","value":"roots"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SetRuntimeInactiveMutation, SetRuntimeInactiveMutationVariables>;
export const UpdateMcpToolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMcpTool"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toolDescription"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toolInputSchema"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toolAnnotations"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ActiveStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMCPTool"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"toolId"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toolDescription"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"inputSchema"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toolInputSchema"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"annotations"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toolAnnotations"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lastSeenAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mCPTool"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateMcpToolMutation, UpdateMcpToolMutationVariables>;
export const UpdateRuntimeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRuntime"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRuntime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateRuntimeMutation, UpdateRuntimeMutationVariables>;
export const UpdateRuntimeLastSeenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRuntimeLastSeen"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRuntime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"lastSeenAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateRuntimeLastSeenMutation, UpdateRuntimeLastSeenMutationVariables>;
export const CleanupExpiredSessionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CleanupExpiredSessions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"expiresAt"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"lt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"BooleanValue","value":false}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"session"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]}}]} as unknown as DocumentNode<CleanupExpiredSessionsMutation, CleanupExpiredSessionsMutationVariables>;
export const CreateSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"refreshToken"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userIdRef"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deviceInfo"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ipAddress"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userAgent"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expiresAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"refreshToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"refreshToken"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"user"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userIdRef"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"deviceInfo"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deviceInfo"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"ipAddress"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ipAddress"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"userAgent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userAgent"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"createdAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lastUsedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"expiresAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expiresAt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"BooleanValue","value":true}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"session"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"deviceInfo"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"userAgent"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]}}]} as unknown as DocumentNode<CreateSessionMutation, CreateSessionMutationVariables>;
export const DeactivateSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeactivateSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"BooleanValue","value":false}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"session"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]}}]} as unknown as DocumentNode<DeactivateSessionMutation, DeactivateSessionMutationVariables>;
export const DeactivateUserSessionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeactivateUserSessions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"userId"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"BooleanValue","value":true}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"BooleanValue","value":false}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"session"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]}}]} as unknown as DocumentNode<DeactivateUserSessionsMutation, DeactivateUserSessionsMutationVariables>;
export const FindSessionByRefreshTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindSessionByRefreshToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"refreshToken"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"querySession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"refreshToken"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"refreshToken"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"BooleanValue","value":true}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"deviceInfo"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"userAgent"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<FindSessionByRefreshTokenQuery, FindSessionByRefreshTokenQueryVariables>;
export const GetUserActiveSessionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserActiveSessions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"querySession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"userId"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"BooleanValue","value":true}}]}},{"kind":"Argument","name":{"kind":"Name","value":"order"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"desc"},"value":{"kind":"EnumValue","value":"lastUsedAt"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"deviceInfo"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"userAgent"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]} as unknown as DocumentNode<GetUserActiveSessionsQuery, GetUserActiveSessionsQueryVariables>;
export const UpdateSessionLastUsedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSessionLastUsed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"lastUsedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"session"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsedAt"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateSessionLastUsedMutation, UpdateSessionLastUsedMutationVariables>;
export const AddMcpToolToSkillDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddMcpToolToSkill"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skillId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mcpToolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updatedAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSkill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"skillId"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"mcpTools"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mcpToolId"}}}]}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updatedAt"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skill"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AddMcpToolToSkillMutation, AddMcpToolToSkillMutationVariables>;
export const AddSkillDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddSkill"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"guardrails"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"associatedKnowledge"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createdAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addSkill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"guardrails"},"value":{"kind":"Variable","name":{"kind":"Name","value":"guardrails"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"associatedKnowledge"},"value":{"kind":"Variable","name":{"kind":"Name","value":"associatedKnowledge"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"workspace"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"createdAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createdAt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createdAt"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skill"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"guardrails"}},{"kind":"Field","name":{"kind":"Name","value":"associatedKnowledge"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AddSkillMutation, AddSkillMutationVariables>;
export const DeleteSkillDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSkill"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSkill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skill"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<DeleteSkillMutation, DeleteSkillMutationVariables>;
export const GetSkillDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSkill"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSkill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"guardrails"}},{"kind":"Field","name":{"kind":"Name","value":"associatedKnowledge"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"maxTokens"}},{"kind":"Field","name":{"kind":"Name","value":"systemPrompt"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetSkillQuery, GetSkillQueryVariables>;
export const GetSkillAgentMcpServersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSkillAgentMcpServers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skillId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSkill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skillId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mcpServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"transport"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetSkillAgentMcpServersQuery, GetSkillAgentMcpServersQueryVariables>;
export const LinkSkillToRuntimeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LinkSkillToRuntime"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skillId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"runtimeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updatedAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSkill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"skillId"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"runtime"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"runtimeId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updatedAt"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skill"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"maxTokens"}},{"kind":"Field","name":{"kind":"Name","value":"systemPrompt"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<LinkSkillToRuntimeMutation, LinkSkillToRuntimeMutationVariables>;
export const ObserveSkillsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ObserveSkillsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"skills"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"maxTokens"}},{"kind":"Field","name":{"kind":"Name","value":"systemPrompt"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ObserveSkillsQueryQuery, ObserveSkillsQueryQueryVariables>;
export const ObserveSkillsSubscriptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ObserveSkillsSubscription"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"skills"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"maxTokens"}},{"kind":"Field","name":{"kind":"Name","value":"systemPrompt"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ObserveSkillsSubscriptionSubscription, ObserveSkillsSubscriptionSubscriptionVariables>;
export const QueryAllSkillsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryAllSkills"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"querySkill"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"maxTokens"}},{"kind":"Field","name":{"kind":"Name","value":"systemPrompt"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<QueryAllSkillsQuery, QueryAllSkillsQueryVariables>;
export const QuerySkillByNameDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuerySkillByName"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"skills"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<QuerySkillByNameQuery, QuerySkillByNameQueryVariables>;
export const QuerySkillsByWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuerySkillsByWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"skills"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]}}]}}]}}]} as unknown as DocumentNode<QuerySkillsByWorkspaceQuery, QuerySkillsByWorkspaceQueryVariables>;
export const QuerySmartSkillsByRuntimeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuerySmartSkillsByRuntime"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"runtimeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getRuntime"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"runtimeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"skills"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"mode"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"EnumValue","value":"SMART"}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"executionTarget"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"EnumValue","value":"EDGE"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"maxTokens"}},{"kind":"Field","name":{"kind":"Name","value":"systemPrompt"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<QuerySmartSkillsByRuntimeQuery, QuerySmartSkillsByRuntimeQueryVariables>;
export const RemoveMcpToolFromSkillDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveMcpToolFromSkill"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skillId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mcpToolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updatedAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSkill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"skillId"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"remove"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"mcpTools"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mcpToolId"}}}]}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updatedAt"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skill"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<RemoveMcpToolFromSkillMutation, RemoveMcpToolFromSkillMutationVariables>;
export const UnlinkSkillFromRuntimeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnlinkSkillFromRuntime"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skillId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updatedAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSkill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"skillId"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"remove"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"runtime"},"value":{"kind":"ObjectValue","fields":[]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updatedAt"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skill"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"maxTokens"}},{"kind":"Field","name":{"kind":"Name","value":"systemPrompt"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UnlinkSkillFromRuntimeMutation, UnlinkSkillFromRuntimeMutationVariables>;
export const UpdateSkillDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSkill"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"guardrails"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"associatedKnowledge"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updatedAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSkill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"guardrails"},"value":{"kind":"Variable","name":{"kind":"Name","value":"guardrails"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"associatedKnowledge"},"value":{"kind":"Variable","name":{"kind":"Name","value":"associatedKnowledge"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updatedAt"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skill"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"guardrails"}},{"kind":"Field","name":{"kind":"Name","value":"associatedKnowledge"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateSkillMutation, UpdateSkillMutationVariables>;
export const UpdateSkillModeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSkillMode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SkillMode"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updatedAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSkill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"mode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mode"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updatedAt"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skill"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"maxTokens"}},{"kind":"Field","name":{"kind":"Name","value":"systemPrompt"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateSkillModeMutation, UpdateSkillModeMutationVariables>;
export const UpdateSkillSmartConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSkillSmartConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"model"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"temperature"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"maxTokens"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"systemPrompt"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"executionTarget"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ExecutionTarget"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updatedAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSkill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"model"},"value":{"kind":"Variable","name":{"kind":"Name","value":"model"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"temperature"},"value":{"kind":"Variable","name":{"kind":"Name","value":"temperature"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"maxTokens"},"value":{"kind":"Variable","name":{"kind":"Name","value":"maxTokens"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"systemPrompt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"systemPrompt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"executionTarget"},"value":{"kind":"Variable","name":{"kind":"Name","value":"executionTarget"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updatedAt"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"skill"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"temperature"}},{"kind":"Field","name":{"kind":"Name","value":"maxTokens"}},{"kind":"Field","name":{"kind":"Name","value":"systemPrompt"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateSkillSmartConfigMutation, UpdateSkillSmartConfigMutationVariables>;
export const CreateSystemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSystem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"adminId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"instanceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addSystem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"createdAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"initialized"},"value":{"kind":"BooleanValue","value":false}},{"kind":"ObjectField","name":{"kind":"Name","value":"instanceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"instanceId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"admins"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"adminId"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"initialized"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"instanceId"}},{"kind":"Field","name":{"kind":"Name","value":"admins"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateSystemMutation, CreateSystemMutationVariables>;
export const InitSystemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InitSystem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"systemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSystem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"systemId"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"initialized"},"value":{"kind":"BooleanValue","value":true}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"initialized"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"instanceId"}},{"kind":"Field","name":{"kind":"Name","value":"defaultWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"admins"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]}}]} as unknown as DocumentNode<InitSystemMutation, InitSystemMutationVariables>;
export const QuerySystemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuerySystem"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"querySystem"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"initialized"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"instanceId"}},{"kind":"Field","name":{"kind":"Name","value":"defaultWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"admins"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<QuerySystemQuery, QuerySystemQueryVariables>;
export const QuerySystemWithDefaultWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuerySystemWithDefaultWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"querySystem"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"initialized"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"instanceId"}},{"kind":"Field","name":{"kind":"Name","value":"defaultWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"runtimes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"admins"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<QuerySystemWithDefaultWorkspaceQuery, QuerySystemWithDefaultWorkspaceQueryVariables>;
export const QuerySystemWithRuntimesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuerySystemWithRuntimes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"querySystem"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"runtimes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"roots"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"mcpClientName"}},{"kind":"Field","name":{"kind":"Name","value":"hostIP"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]}}]} as unknown as DocumentNode<QuerySystemWithRuntimesQuery, QuerySystemWithRuntimesQueryVariables>;
export const SetDefaultWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetDefaultWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"systemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSystem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"systemId"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"defaultWorkspace"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}]}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"instanceId"}},{"kind":"Field","name":{"kind":"Name","value":"defaultWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"admins"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SetDefaultWorkspaceMutation, SetDefaultWorkspaceMutationVariables>;
export const CreateUserOAuthConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateUserOAuthConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"provider"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OAuthProviderType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"encryptedAccessToken"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"encryptedRefreshToken"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tokenExpiresAt"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"scopes"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountEmail"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountName"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountAvatarUrl"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"providerAccountId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addUserOAuthConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"workspace"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"user"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"provider"},"value":{"kind":"Variable","name":{"kind":"Name","value":"provider"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"encryptedAccessToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"encryptedAccessToken"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"encryptedRefreshToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"encryptedRefreshToken"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"tokenExpiresAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tokenExpiresAt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"scopes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"scopes"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"accountEmail"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountEmail"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"accountName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountName"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"accountAvatarUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountAvatarUrl"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"providerAccountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"providerAccountId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"createdAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userOAuthConnection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"accountEmail"}},{"kind":"Field","name":{"kind":"Name","value":"accountName"}},{"kind":"Field","name":{"kind":"Name","value":"accountAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"tokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsedAt"}}]}}]}}]}}]} as unknown as DocumentNode<CreateUserOAuthConnectionMutation, CreateUserOAuthConnectionMutationVariables>;
export const DeleteUserOAuthConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteUserOAuthConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUserOAuthConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userOAuthConnection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteUserOAuthConnectionMutation, DeleteUserOAuthConnectionMutationVariables>;
export const FindUserOAuthConnectionByProviderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindUserOAuthConnectionByProvider"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"provider"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OAuthProviderType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queryUserOAuthConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"and"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"provider"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"provider"}}}]}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"has"},"value":{"kind":"EnumValue","value":"workspace"}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"has"},"value":{"kind":"EnumValue","value":"user"}}]}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"encryptedAccessToken"}},{"kind":"Field","name":{"kind":"Name","value":"encryptedRefreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"tokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"accountEmail"}},{"kind":"Field","name":{"kind":"Name","value":"accountName"}},{"kind":"Field","name":{"kind":"Name","value":"accountAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsedAt"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<FindUserOAuthConnectionByProviderQuery, FindUserOAuthConnectionByProviderQueryVariables>;
export const GetUserOAuthConnectionByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserOAuthConnectionById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getUserOAuthConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"encryptedAccessToken"}},{"kind":"Field","name":{"kind":"Name","value":"encryptedRefreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"tokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"accountEmail"}},{"kind":"Field","name":{"kind":"Name","value":"accountName"}},{"kind":"Field","name":{"kind":"Name","value":"accountAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsedAt"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetUserOAuthConnectionByIdQuery, GetUserOAuthConnectionByIdQueryVariables>;
export const GetUserOAuthConnectionsByWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserOAuthConnectionsByWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queryUserOAuthConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"and"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"has"},"value":{"kind":"EnumValue","value":"workspace"}}]},{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"has"},"value":{"kind":"EnumValue","value":"user"}}]}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"accountEmail"}},{"kind":"Field","name":{"kind":"Name","value":"accountName"}},{"kind":"Field","name":{"kind":"Name","value":"accountAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"tokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsedAt"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetUserOAuthConnectionsByWorkspaceQuery, GetUserOAuthConnectionsByWorkspaceQueryVariables>;
export const UpdateUserOAuthConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserOAuthConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"encryptedAccessToken"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"encryptedRefreshToken"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tokenExpiresAt"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"scopes"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountEmail"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountName"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountAvatarUrl"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserOAuthConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"encryptedAccessToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"encryptedAccessToken"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"encryptedRefreshToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"encryptedRefreshToken"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"tokenExpiresAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tokenExpiresAt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"scopes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"scopes"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"accountEmail"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountEmail"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"accountName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountName"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"accountAvatarUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountAvatarUrl"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userOAuthConnection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"accountEmail"}},{"kind":"Field","name":{"kind":"Name","value":"accountName"}},{"kind":"Field","name":{"kind":"Name","value":"accountAvatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"providerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"scopes"}},{"kind":"Field","name":{"kind":"Name","value":"tokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsedAt"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateUserOAuthConnectionMutation, UpdateUserOAuthConnectionMutationVariables>;
export const UpdateUserOAuthConnectionLastUsedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserOAuthConnectionLastUsed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserOAuthConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"lastUsedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userOAuthConnection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsedAt"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateUserOAuthConnectionLastUsedMutation, UpdateUserOAuthConnectionLastUsedMutationVariables>;
export const AddAdminToWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddAdminToWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"userId"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"adminOfWorkspaces"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}]}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<AddAdminToWorkspaceMutation, AddAdminToWorkspaceMutationVariables>;
export const AddMemberToWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddMemberToWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"userId"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"membersOfWorkspaces"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}]}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<AddMemberToWorkspaceMutation, AddMemberToWorkspaceMutationVariables>;
export const AddUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"createdAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<AddUserMutation, AddUserMutationVariables>;
export const FindUserByEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindUserByEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queryUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"email"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"password"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"failedLoginAttempts"}},{"kind":"Field","name":{"kind":"Name","value":"lockedUntil"}},{"kind":"Field","name":{"kind":"Name","value":"adminOfWorkspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"membersOfWorkspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<FindUserByEmailQuery, FindUserByEmailQueryVariables>;
export const FindUserByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FindUserById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<FindUserByIdQuery, FindUserByIdQueryVariables>;
export const IncrementFailedLoginAttemptsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"IncrementFailedLoginAttempts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"attempts"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lockedUntil"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"failedLoginAttempts"},"value":{"kind":"Variable","name":{"kind":"Name","value":"attempts"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lockedUntil"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lockedUntil"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"failedLoginAttempts"}},{"kind":"Field","name":{"kind":"Name","value":"lockedUntil"}}]}}]}}]}}]} as unknown as DocumentNode<IncrementFailedLoginAttemptsMutation, IncrementFailedLoginAttemptsMutationVariables>;
export const UnlockUserAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnlockUserAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"failedLoginAttempts"},"value":{"kind":"IntValue","value":"0"}},{"kind":"ObjectField","name":{"kind":"Name","value":"lockedUntil"},"value":{"kind":"NullValue"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"failedLoginAttempts"}},{"kind":"Field","name":{"kind":"Name","value":"lockedUntil"}}]}}]}}]}}]} as unknown as DocumentNode<UnlockUserAccountMutation, UnlockUserAccountMutationVariables>;
export const UpdateUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateUserEmailMutation, UpdateUserEmailMutationVariables>;
export const UpdateUserLastLoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserLastLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"lastLoginAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"failedLoginAttempts"},"value":{"kind":"IntValue","value":"0"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateUserLastLoginMutation, UpdateUserLastLoginMutationVariables>;
export const UpdateUserPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateUserPasswordMutation, UpdateUserPasswordMutationVariables>;
export const AddRegistryServerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddRegistryServer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"repositoryUrl"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"version"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"packages"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"remotes"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"_meta"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addMCPRegistryServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"repositoryUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"repositoryUrl"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"version"},"value":{"kind":"Variable","name":{"kind":"Name","value":"version"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"packages"},"value":{"kind":"Variable","name":{"kind":"Name","value":"packages"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"remotes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"remotes"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"_meta"},"value":{"kind":"Variable","name":{"kind":"Name","value":"_meta"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"createdAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lastSeenAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"workspace"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mCPRegistryServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"packages"}},{"kind":"Field","name":{"kind":"Name","value":"remotes"}},{"kind":"Field","name":{"kind":"Name","value":"_meta"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AddRegistryServerMutation, AddRegistryServerMutationVariables>;
export const AddWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"systemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"adminId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"createdAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"system"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"systemId"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"admins"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"adminId"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"initialized"}},{"kind":"Field","name":{"kind":"Name","value":"admins"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<AddWorkspaceMutation, AddWorkspaceMutationVariables>;
export const CheckUserWorkspaceAccessDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CheckUserWorkspaceAccess"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"adminOfWorkspaces"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"membersOfWorkspaces"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<CheckUserWorkspaceAccessQuery, CheckUserWorkspaceAccessQueryVariables>;
export const CreateOnboardingStepDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOnboardingStep"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"stepId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingStepType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"priority"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addOnboardingStep"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"stepId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"stepId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"EnumValue","value":"PENDING"}},{"kind":"ObjectField","name":{"kind":"Name","value":"priority"},"value":{"kind":"Variable","name":{"kind":"Name","value":"priority"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"createdAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboardingStep"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stepId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<CreateOnboardingStepMutation, CreateOnboardingStepMutationVariables>;
export const DeleteRegistryServerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteRegistryServer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMCPRegistryServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mCPRegistryServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteRegistryServerMutation, DeleteRegistryServerMutationVariables>;
export const GetRegistryServerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRegistryServer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getMCPRegistryServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"packages"}},{"kind":"Field","name":{"kind":"Name","value":"remotes"}},{"kind":"Field","name":{"kind":"Name","value":"_meta"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"configurations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetRegistryServerQuery, GetRegistryServerQueryVariables>;
export const LinkOnboardingStepToWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LinkOnboardingStepToWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"stepId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"onboardingSteps"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"stepId"}}}]}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"onboardingSteps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stepId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]}}]} as unknown as DocumentNode<LinkOnboardingStepToWorkspaceMutation, LinkOnboardingStepToWorkspaceMutationVariables>;
export const QueryWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"defaultAIModel"}},{"kind":"Field","name":{"kind":"Name","value":"onboardingSteps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stepId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}}]}}]}}]}}]} as unknown as DocumentNode<QueryWorkspaceQuery, QueryWorkspaceQueryVariables>;
export const QueryWorkspaceWithMcpServersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryWorkspaceWithMcpServers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"transport"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<QueryWorkspaceWithMcpServersQuery, QueryWorkspaceWithMcpServersQueryVariables>;
export const QueryWorkspaceWithMcpToolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryWorkspaceWithMcpTools"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}}]}},{"kind":"Field","name":{"kind":"Name","value":"skills"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]}}]} as unknown as DocumentNode<QueryWorkspaceWithMcpToolsQuery, QueryWorkspaceWithMcpToolsQueryVariables>;
export const QueryWorkspaceWithRegistryServersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryWorkspaceWithRegistryServers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"registryServers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"packages"}},{"kind":"Field","name":{"kind":"Name","value":"remotes"}},{"kind":"Field","name":{"kind":"Name","value":"_meta"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"configurations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<QueryWorkspaceWithRegistryServersQuery, QueryWorkspaceWithRegistryServersQueryVariables>;
export const QueryWorkspaceWithRuntimesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryWorkspaceWithRuntimes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"defaultAIModel"}},{"kind":"Field","name":{"kind":"Name","value":"runtimes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"roots"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"mcpClientName"}},{"kind":"Field","name":{"kind":"Name","value":"hostIP"}},{"kind":"Field","name":{"kind":"Name","value":"mcpClientName"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"executionTarget"}}]}}]}}]}}]}}]} as unknown as DocumentNode<QueryWorkspaceWithRuntimesQuery, QueryWorkspaceWithRuntimesQueryVariables>;
export const QueryWorkspacesByUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryWorkspacesByUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"adminOfWorkspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<QueryWorkspacesByUserQuery, QueryWorkspacesByUserQueryVariables>;
export const UpdateOnboardingStepStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOnboardingStepStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OnboardingStepStatus"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"now"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"metadata"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOnboardingStep"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"updatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"now"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"metadata"},"value":{"kind":"Variable","name":{"kind":"Name","value":"metadata"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboardingStep"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stepId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateOnboardingStepStatusMutation, UpdateOnboardingStepStatusMutationVariables>;
export const UpdateRegistryServerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRegistryServer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"repositoryUrl"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"version"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"packages"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"remotes"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMCPRegistryServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"repositoryUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"repositoryUrl"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"version"},"value":{"kind":"Variable","name":{"kind":"Name","value":"version"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"packages"},"value":{"kind":"Variable","name":{"kind":"Name","value":"packages"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"remotes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"remotes"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mCPRegistryServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"packages"}},{"kind":"Field","name":{"kind":"Name","value":"remotes"}},{"kind":"Field","name":{"kind":"Name","value":"_meta"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateRegistryServerMutation, UpdateRegistryServerMutationVariables>;
export const UpdateWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"ListValue","values":[{"kind":"Variable","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"set"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateWorkspaceMutation, UpdateWorkspaceMutationVariables>;