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
  createdAt: Scalars['DateTime']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  executionTarget?: InputMaybe<ExecutionTarget>;
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
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  executionTarget?: Maybe<ExecutionTarget>;
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
  count?: Maybe<Scalars['Int']['output']>;
  createdAtMax?: Maybe<Scalars['DateTime']['output']>;
  createdAtMin?: Maybe<Scalars['DateTime']['output']>;
  descriptionMax?: Maybe<Scalars['String']['output']>;
  descriptionMin?: Maybe<Scalars['String']['output']>;
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
  CreatedAt = 'createdAt',
  Description = 'description',
  ExecutionTarget = 'executionTarget',
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
  CreatedAt = 'createdAt',
  Description = 'description',
  MaxTokens = 'maxTokens',
  Model = 'model',
  Name = 'name',
  SystemPrompt = 'systemPrompt',
  Temperature = 'temperature',
  UpdatedAt = 'updatedAt'
}

export type SkillPatch = {
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  executionTarget?: InputMaybe<ExecutionTarget>;
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
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  executionTarget?: InputMaybe<ExecutionTarget>;
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