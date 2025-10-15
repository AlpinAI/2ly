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
  Date: { input: Date; output: Date; }
};

export enum ActiveStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}

export type AuthPayload = {
  __typename: 'AuthPayload';
  accessToken: Scalars['String']['output'];
  errors: Maybe<Array<Scalars['String']['output']>>;
  expiresIn: Scalars['Int']['output'];
  refreshToken: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  tokens: Maybe<AuthTokens>;
  user: User;
};

export type AuthTokens = {
  __typename: 'AuthTokens';
  accessToken: Scalars['String']['output'];
  refreshToken: Scalars['String']['output'];
};

export type CallToolResult = {
  __typename: 'CallToolResult';
  result: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Infra = {
  __typename: 'Infra';
  nats: Maybe<Scalars['String']['output']>;
};

export type LoginInput = {
  deviceInfo?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type LoginUserInput = {
  deviceInfo?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type LogoutInput = {
  refreshToken: Scalars['String']['input'];
};

export type LogoutPayload = {
  __typename: 'LogoutPayload';
  errors: Maybe<Array<Scalars['String']['output']>>;
  success: Scalars['Boolean']['output'];
};

export type LogoutUserInput = {
  refreshToken: Scalars['String']['input'];
};

export type McpRegistry = {
  __typename: 'MCPRegistry';
  createdAt: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  lastSyncAt: Maybe<Scalars['Date']['output']>;
  name: Scalars['String']['output'];
  servers: Maybe<Array<McpRegistryServer>>;
  upstreamUrl: Scalars['String']['output'];
  workspace: Workspace;
};

export type McpRegistry2lyMetadata = {
  __typename: 'MCPRegistry2lyMetadata';
  registryVersion: Scalars['String']['output'];
};

export type McpRegistryServer = {
  __typename: 'MCPRegistryServer';
  _meta: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastSeenAt: Scalars['Date']['output'];
  name: Scalars['String']['output'];
  packages: Maybe<Scalars['String']['output']>;
  registry: McpRegistry;
  remotes: Maybe<Scalars['String']['output']>;
  repositoryUrl: Scalars['String']['output'];
  title: Scalars['String']['output'];
  version: Scalars['String']['output'];
};

export type McpServer = {
  __typename: 'MCPServer';
  config: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  repositoryUrl: Scalars['String']['output'];
  runOn: Maybe<McpServerRunOn>;
  runtime: Maybe<Runtime>;
  tools: Maybe<Array<McpTool>>;
  transport: McpTransportType;
  workspace: Workspace;
};

export enum McpServerRunOn {
  Agent = 'AGENT',
  Edge = 'EDGE',
  Global = 'GLOBAL'
}

export type McpTool = {
  __typename: 'MCPTool';
  annotations: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  inputSchema: Scalars['String']['output'];
  lastSeenAt: Scalars['Date']['output'];
  mcpServer: McpServer;
  name: Scalars['String']['output'];
  runtimes: Maybe<Array<Runtime>>;
  status: ActiveStatus;
  workspace: Workspace;
};

export enum McpTransportType {
  Sse = 'SSE',
  Stdio = 'STDIO',
  Stream = 'STREAM'
}

export type Mutation = {
  __typename: 'Mutation';
  callMCPTool: CallToolResult;
  completeOnboardingStep: Workspace;
  createMCPRegistry: McpRegistry;
  createMCPServer: McpServer;
  createRuntime: Runtime;
  deleteMCPRegistry: McpRegistry;
  deleteMCPServer: McpServer;
  deleteMCPTool: McpTool;
  deleteRuntime: Runtime;
  dismissOnboardingStep: Workspace;
  initSystem: System;
  linkMCPServerToRuntime: McpServer;
  linkMCPToolToRuntime: Runtime;
  login: AuthPayload;
  loginUser: AuthPayload;
  logout: Scalars['Boolean']['output'];
  logoutUser: LogoutPayload;
  refreshToken: RefreshTokenPayload;
  registerUser: RegisterUserPayload;
  setDefaultTestingRuntime: Workspace;
  setGlobalRuntime: Workspace;
  syncUpstreamRegistry: McpRegistry;
  unlinkMCPServerFromRuntime: McpServer;
  unlinkMCPToolFromRuntime: Runtime;
  unsetDefaultTestingRuntime: Workspace;
  unsetGlobalRuntime: Workspace;
  updateMCPServer: McpServer;
  updateMCPServerRunOn: McpServer;
  updateRuntime: Runtime;
  updateWorkspace: Workspace;
};


export type MutationCallMcpToolArgs = {
  input: Scalars['String']['input'];
  toolId: Scalars['ID']['input'];
};


export type MutationCompleteOnboardingStepArgs = {
  stepId: Scalars['String']['input'];
  workspaceId: Scalars['ID']['input'];
};


export type MutationCreateMcpRegistryArgs = {
  name: Scalars['String']['input'];
  upstreamUrl: Scalars['String']['input'];
  workspaceId: Scalars['ID']['input'];
};


export type MutationCreateMcpServerArgs = {
  config: Scalars['String']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  repositoryUrl: Scalars['String']['input'];
  runOn?: InputMaybe<McpServerRunOn>;
  transport: McpTransportType;
  workspaceId: Scalars['ID']['input'];
};


export type MutationCreateRuntimeArgs = {
  capabilities: Array<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  workspaceId: Scalars['ID']['input'];
};


export type MutationDeleteMcpRegistryArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMcpServerArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMcpToolArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteRuntimeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDismissOnboardingStepArgs = {
  stepId: Scalars['String']['input'];
  workspaceId: Scalars['ID']['input'];
};


export type MutationInitSystemArgs = {
  adminPassword: Scalars['String']['input'];
  email: Scalars['String']['input'];
};


export type MutationLinkMcpServerToRuntimeArgs = {
  mcpServerId: Scalars['ID']['input'];
  runtimeId: Scalars['ID']['input'];
};


export type MutationLinkMcpToolToRuntimeArgs = {
  mcpToolId: Scalars['ID']['input'];
  runtimeId: Scalars['ID']['input'];
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationLoginUserArgs = {
  input: LoginUserInput;
};


export type MutationLogoutArgs = {
  input: LogoutInput;
};


export type MutationLogoutUserArgs = {
  input: LogoutUserInput;
};


export type MutationRefreshTokenArgs = {
  input: RefreshTokenInput;
};


export type MutationRegisterUserArgs = {
  input: RegisterUserInput;
};


export type MutationSetDefaultTestingRuntimeArgs = {
  id: Scalars['ID']['input'];
  runtimeId: Scalars['ID']['input'];
};


export type MutationSetGlobalRuntimeArgs = {
  id: Scalars['ID']['input'];
  runtimeId: Scalars['ID']['input'];
};


export type MutationSyncUpstreamRegistryArgs = {
  registryId: Scalars['ID']['input'];
};


export type MutationUnlinkMcpServerFromRuntimeArgs = {
  mcpServerId: Scalars['ID']['input'];
};


export type MutationUnlinkMcpToolFromRuntimeArgs = {
  mcpToolId: Scalars['ID']['input'];
  runtimeId: Scalars['ID']['input'];
};


export type MutationUnsetDefaultTestingRuntimeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUnsetGlobalRuntimeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateMcpServerArgs = {
  config: Scalars['String']['input'];
  description: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  repositoryUrl: Scalars['String']['input'];
  runOn?: InputMaybe<McpServerRunOn>;
  transport: McpTransportType;
};


export type MutationUpdateMcpServerRunOnArgs = {
  mcpServerId: Scalars['ID']['input'];
  runOn: McpServerRunOn;
  runtimeId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationUpdateRuntimeArgs = {
  description: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdateWorkspaceArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};

export type OnboardingStep = {
  __typename: 'OnboardingStep';
  completedAt: Maybe<Scalars['Date']['output']>;
  createdAt: Scalars['Date']['output'];
  dismissedAt: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
  priority: Maybe<Scalars['Int']['output']>;
  status: OnboardingStepStatus;
  stepId: Scalars['String']['output'];
  type: OnboardingStepType;
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

export type Query = {
  __typename: 'Query';
  infra: Infra;
  isMCPAutoConfigEnabled: Scalars['Boolean']['output'];
  mcpRegistries: Maybe<Array<McpRegistry>>;
  mcpServers: Maybe<Array<McpServer>>;
  me: Maybe<User>;
  system: Maybe<System>;
  workspace: Maybe<Array<Workspace>>;
  workspaceMCPTools: Maybe<Workspace>;
};


export type QueryMcpRegistriesArgs = {
  workspaceId: Scalars['ID']['input'];
};


export type QueryMcpServersArgs = {
  workspaceId: Scalars['ID']['input'];
};


export type QueryWorkspaceMcpToolsArgs = {
  workspaceId: Scalars['ID']['input'];
};

export type RefreshTokenInput = {
  refreshToken: Scalars['String']['input'];
};

export type RefreshTokenPayload = {
  __typename: 'RefreshTokenPayload';
  accessToken: Scalars['String']['output'];
  errors: Maybe<Array<Scalars['String']['output']>>;
  expiresIn: Scalars['Int']['output'];
  success: Scalars['Boolean']['output'];
};

export type RegisterUserInput = {
  deviceInfo?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type RegisterUserPayload = {
  __typename: 'RegisterUserPayload';
  errors: Maybe<Array<Scalars['String']['output']>>;
  success: Scalars['Boolean']['output'];
  tokens: Maybe<AuthTokens>;
  user: Maybe<User>;
};

export type Runtime = {
  __typename: 'Runtime';
  capabilities: Maybe<Array<Scalars['String']['output']>>;
  createdAt: Scalars['Date']['output'];
  description: Maybe<Scalars['String']['output']>;
  hostIP: Maybe<Scalars['String']['output']>;
  hostname: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastSeenAt: Maybe<Scalars['Date']['output']>;
  mcpClientName: Maybe<Scalars['String']['output']>;
  mcpServers: Maybe<Array<McpServer>>;
  mcpToolCapabilities: Maybe<Array<McpTool>>;
  name: Scalars['String']['output'];
  roots: Maybe<Scalars['String']['output']>;
  status: ActiveStatus;
  workspace: Workspace;
};

export type Subscription = {
  __typename: 'Subscription';
  mcpRegistries: Maybe<Array<McpRegistry>>;
  mcpServers: Maybe<Array<McpServer>>;
  mcpTools: Maybe<Array<Maybe<McpTool>>>;
  runtimes: Maybe<Array<Runtime>>;
  toolCalls: Maybe<Array<ToolCall>>;
  workspace: Maybe<Workspace>;
  workspaces: Maybe<Array<Workspace>>;
};


export type SubscriptionMcpRegistriesArgs = {
  workspaceId: Scalars['ID']['input'];
};


export type SubscriptionMcpServersArgs = {
  workspaceId: Scalars['ID']['input'];
};


export type SubscriptionMcpToolsArgs = {
  workspaceId: Scalars['ID']['input'];
};


export type SubscriptionRuntimesArgs = {
  workspaceId: Scalars['ID']['input'];
};


export type SubscriptionToolCallsArgs = {
  workspaceId: Scalars['ID']['input'];
};


export type SubscriptionWorkspaceArgs = {
  workspaceId: Scalars['ID']['input'];
};

export type System = {
  __typename: 'System';
  createdAt: Scalars['Date']['output'];
  defaultWorkspace: Maybe<Workspace>;
  id: Scalars['ID']['output'];
  initialized: Scalars['Boolean']['output'];
  updatedAt: Scalars['Date']['output'];
};

export type ToolCall = {
  __typename: 'ToolCall';
  calledAt: Scalars['Date']['output'];
  calledBy: Runtime;
  completedAt: Maybe<Scalars['Date']['output']>;
  error: Maybe<Scalars['String']['output']>;
  executedBy: Maybe<Runtime>;
  id: Scalars['ID']['output'];
  mcpTool: McpTool;
  status: ToolCallStatus;
  toolInput: Scalars['String']['output'];
  toolOutput: Maybe<Scalars['String']['output']>;
};

export enum ToolCallStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING'
}

export type User = {
  __typename: 'User';
  adminOfWorkspaces: Maybe<Array<Workspace>>;
  createdAt: Scalars['Date']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastLoginAt: Maybe<Scalars['Date']['output']>;
  membersOfWorkspaces: Maybe<Array<Workspace>>;
  updatedAt: Scalars['Date']['output'];
};

export type Workspace = {
  __typename: 'Workspace';
  createdAt: Scalars['Date']['output'];
  defaultTestingRuntime: Maybe<Runtime>;
  globalRuntime: Maybe<Runtime>;
  id: Scalars['ID']['output'];
  mcpRegistries: Maybe<Array<McpRegistry>>;
  mcpServers: Maybe<Array<McpServer>>;
  mcpTools: Maybe<Array<McpTool>>;
  name: Scalars['String']['output'];
  onboardingSteps: Maybe<Array<OnboardingStep>>;
  runtimes: Maybe<Array<Runtime>>;
};

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { login: { __typename: 'AuthPayload', success: boolean, errors: Array<string> | null, user: { __typename: 'User', id: string, email: string }, tokens: { __typename: 'AuthTokens', accessToken: string, refreshToken: string } | null } };

export type LogoutMutationVariables = Exact<{
  input: LogoutInput;
}>;


export type LogoutMutation = { logout: boolean };

export type RefreshTokenMutationVariables = Exact<{
  input: RefreshTokenInput;
}>;


export type RefreshTokenMutation = { refreshToken: { __typename: 'RefreshTokenPayload', success: boolean, accessToken: string, errors: Array<string> | null } };

export type RegisterMutationVariables = Exact<{
  input: RegisterUserInput;
}>;


export type RegisterMutation = { registerUser: { __typename: 'RegisterUserPayload', success: boolean, errors: Array<string> | null, user: { __typename: 'User', id: string, email: string } | null, tokens: { __typename: 'AuthTokens', accessToken: string, refreshToken: string } | null } };

export type CreateMcpServerMutationVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  description: Scalars['String']['input'];
  repositoryUrl: Scalars['String']['input'];
  transport: McpTransportType;
  config: Scalars['String']['input'];
}>;


export type CreateMcpServerMutation = { createMCPServer: { __typename: 'MCPServer', id: string, name: string, description: string, transport: McpTransportType, runOn: McpServerRunOn | null, runtime: { __typename: 'Runtime', id: string, name: string } | null } };

export type DeleteMcpServerMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteMcpServerMutation = { deleteMCPServer: { __typename: 'MCPServer', id: string } };

export type GetMcpServersQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type GetMcpServersQuery = { mcpServers: Array<{ __typename: 'MCPServer', id: string, name: string, description: string, repositoryUrl: string, transport: McpTransportType, runOn: McpServerRunOn | null, config: string, tools: Array<{ __typename: 'MCPTool', id: string, name: string }> | null, runtime: { __typename: 'Runtime', id: string, name: string } | null }> | null };

export type SubscribeMcpServersSubscriptionVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type SubscribeMcpServersSubscription = { mcpServers: Array<{ __typename: 'MCPServer', id: string, name: string, description: string, repositoryUrl: string, transport: McpTransportType, runOn: McpServerRunOn | null, config: string, tools: Array<{ __typename: 'MCPTool', id: string, name: string }> | null, runtime: { __typename: 'Runtime', id: string, name: string } | null }> | null };

export type UpdateMcpServerRunOnMutationVariables = Exact<{
  mcpServerId: Scalars['ID']['input'];
  runOn: McpServerRunOn;
  runtimeId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type UpdateMcpServerRunOnMutation = { updateMCPServerRunOn: { __typename: 'MCPServer', id: string, runOn: McpServerRunOn | null, runtime: { __typename: 'Runtime', id: string, name: string } | null } };

export type CallMcpToolMutationVariables = Exact<{
  toolId: Scalars['ID']['input'];
  input: Scalars['String']['input'];
}>;


export type CallMcpToolMutation = { callMCPTool: { __typename: 'CallToolResult', success: boolean, result: string } };

export type GetMcpToolsQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type GetMcpToolsQuery = { workspaceMCPTools: { __typename: 'Workspace', id: string, name: string, mcpTools: Array<{ __typename: 'MCPTool', id: string, name: string, description: string, inputSchema: string, status: ActiveStatus, createdAt: Date, lastSeenAt: Date, mcpServer: { __typename: 'MCPServer', id: string, name: string } }> | null } | null };

export type SubscribeMcpToolsSubscriptionVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type SubscribeMcpToolsSubscription = { mcpTools: Array<{ __typename: 'MCPTool', id: string, name: string, description: string, inputSchema: string, annotations: string, status: ActiveStatus, createdAt: Date, lastSeenAt: Date, mcpServer: { __typename: 'MCPServer', id: string, name: string, description: string, repositoryUrl: string }, runtimes: Array<{ __typename: 'Runtime', id: string, name: string, status: ActiveStatus, capabilities: Array<string> | null }> | null } | null> | null };

export type CreateMcpRegistryMutationVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  upstreamUrl: Scalars['String']['input'];
}>;


export type CreateMcpRegistryMutation = { createMCPRegistry: { __typename: 'MCPRegistry', id: string, name: string, upstreamUrl: string, createdAt: Date, lastSyncAt: Date | null } };

export type DeleteMcpRegistryMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteMcpRegistryMutation = { deleteMCPRegistry: { __typename: 'MCPRegistry', id: string, name: string } };

export type GetMcpRegistriesQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type GetMcpRegistriesQuery = { mcpRegistries: Array<{ __typename: 'MCPRegistry', id: string, name: string, upstreamUrl: string, createdAt: Date, lastSyncAt: Date | null, servers: Array<{ __typename: 'MCPRegistryServer', id: string, name: string, description: string, title: string, repositoryUrl: string, version: string, packages: string | null, remotes: string | null, _meta: string | null, createdAt: Date, lastSeenAt: Date }> | null }> | null };

export type SubscribeMcpRegistriesSubscriptionVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type SubscribeMcpRegistriesSubscription = { mcpRegistries: Array<{ __typename: 'MCPRegistry', id: string, name: string, upstreamUrl: string, createdAt: Date, lastSyncAt: Date | null, servers: Array<{ __typename: 'MCPRegistryServer', id: string, name: string, description: string, title: string, repositoryUrl: string, version: string, packages: string | null, remotes: string | null, _meta: string | null, createdAt: Date, lastSeenAt: Date }> | null }> | null };

export type SyncUpstreamRegistryMutationVariables = Exact<{
  registryId: Scalars['ID']['input'];
}>;


export type SyncUpstreamRegistryMutation = { syncUpstreamRegistry: { __typename: 'MCPRegistry', id: string, name: string, upstreamUrl: string, lastSyncAt: Date | null, servers: Array<{ __typename: 'MCPRegistryServer', id: string, name: string, description: string, title: string, repositoryUrl: string, version: string, packages: string | null, remotes: string | null, _meta: string | null, createdAt: Date, lastSeenAt: Date }> | null } };

export type GetRuntimesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRuntimesQuery = { workspace: Array<{ __typename: 'Workspace', id: string, name: string, runtimes: Array<{ __typename: 'Runtime', id: string, name: string, description: string | null, status: ActiveStatus, createdAt: Date, lastSeenAt: Date | null, capabilities: Array<string> | null, hostIP: string | null, hostname: string | null, mcpClientName: string | null }> | null }> | null };

export type SubscribeRuntimesSubscriptionVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type SubscribeRuntimesSubscription = { runtimes: Array<{ __typename: 'Runtime', id: string, name: string, description: string | null, status: ActiveStatus, createdAt: Date, lastSeenAt: Date | null, capabilities: Array<string> | null, hostIP: string | null, hostname: string | null, mcpClientName: string | null, mcpServers: Array<{ __typename: 'MCPServer', id: string, name: string, description: string }> | null, mcpToolCapabilities: Array<{ __typename: 'MCPTool', id: string, name: string, description: string, status: ActiveStatus }> | null }> | null };

export type InitSystemMutationVariables = Exact<{
  email: Scalars['String']['input'];
  adminPassword: Scalars['String']['input'];
}>;


export type InitSystemMutation = { initSystem: { __typename: 'System', id: string, initialized: boolean, createdAt: Date, updatedAt: Date } };

export type CompleteOnboardingStepMutationVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  stepId: Scalars['String']['input'];
}>;


export type CompleteOnboardingStepMutation = { completeOnboardingStep: { __typename: 'Workspace', id: string, name: string, onboardingSteps: Array<{ __typename: 'OnboardingStep', id: string, stepId: string, type: OnboardingStepType, status: OnboardingStepStatus, completedAt: Date | null, dismissedAt: Date | null, priority: number | null, createdAt: Date }> | null } };

export type DismissOnboardingStepMutationVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
  stepId: Scalars['String']['input'];
}>;


export type DismissOnboardingStepMutation = { dismissOnboardingStep: { __typename: 'Workspace', id: string, name: string, onboardingSteps: Array<{ __typename: 'OnboardingStep', id: string, stepId: string, type: OnboardingStepType, status: OnboardingStepStatus, completedAt: Date | null, dismissedAt: Date | null, priority: number | null, createdAt: Date }> | null } };

export type GetDefaultWorkspaceQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDefaultWorkspaceQuery = { system: { __typename: 'System', id: string, defaultWorkspace: { __typename: 'Workspace', id: string, name: string, onboardingSteps: Array<{ __typename: 'OnboardingStep', id: string, stepId: string, type: OnboardingStepType, status: OnboardingStepStatus, completedAt: Date | null, priority: number | null, createdAt: Date }> | null } | null } | null };

export type GetWorkspacesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetWorkspacesQuery = { workspace: Array<{ __typename: 'Workspace', id: string, name: string, createdAt: Date }> | null, system: { __typename: 'System', id: string, defaultWorkspace: { __typename: 'Workspace', id: string, name: string } | null } | null };

export type SubscribeWorkspaceSubscriptionVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type SubscribeWorkspaceSubscription = { workspace: { __typename: 'Workspace', id: string, name: string, createdAt: Date, onboardingSteps: Array<{ __typename: 'OnboardingStep', id: string, stepId: string, type: OnboardingStepType, status: OnboardingStepStatus, completedAt: Date | null, dismissedAt: Date | null, priority: number | null, createdAt: Date }> | null } | null };

export type ValidateWorkspaceQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type ValidateWorkspaceQuery = { workspaceMCPTools: { __typename: 'Workspace', id: string, name: string } | null };


export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tokens"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Logout"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LogoutInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const RefreshTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RefreshToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RefreshTokenInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refreshToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"errors"}}]}}]}}]} as unknown as DocumentNode<RefreshTokenMutation, RefreshTokenMutationVariables>;
export const RegisterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Register"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RegisterUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registerUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tokens"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"}}]}}]}}]} as unknown as DocumentNode<RegisterMutation, RegisterMutationVariables>;
export const CreateMcpServerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateMCPServer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"repositoryUrl"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"transport"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MCPTransportType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"config"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMCPServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"Argument","name":{"kind":"Name","value":"repositoryUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"repositoryUrl"}}},{"kind":"Argument","name":{"kind":"Name","value":"transport"},"value":{"kind":"Variable","name":{"kind":"Name","value":"transport"}}},{"kind":"Argument","name":{"kind":"Name","value":"config"},"value":{"kind":"Variable","name":{"kind":"Name","value":"config"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"transport"}},{"kind":"Field","name":{"kind":"Name","value":"runOn"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateMcpServerMutation, CreateMcpServerMutationVariables>;
export const DeleteMcpServerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMCPServer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMCPServer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteMcpServerMutation, DeleteMcpServerMutationVariables>;
export const GetMcpServersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMCPServers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mcpServers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"transport"}},{"kind":"Field","name":{"kind":"Name","value":"runOn"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetMcpServersQuery, GetMcpServersQueryVariables>;
export const SubscribeMcpServersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeMCPServers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mcpServers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"transport"}},{"kind":"Field","name":{"kind":"Name","value":"runOn"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"tools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<SubscribeMcpServersSubscription, SubscribeMcpServersSubscriptionVariables>;
export const UpdateMcpServerRunOnDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMCPServerRunOn"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mcpServerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"runOn"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MCPServerRunOn"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"runtimeId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMCPServerRunOn"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"mcpServerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mcpServerId"}}},{"kind":"Argument","name":{"kind":"Name","value":"runOn"},"value":{"kind":"Variable","name":{"kind":"Name","value":"runOn"}}},{"kind":"Argument","name":{"kind":"Name","value":"runtimeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"runtimeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"runOn"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateMcpServerRunOnMutation, UpdateMcpServerRunOnMutationVariables>;
export const CallMcpToolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CallMCPTool"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"callMCPTool"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"toolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"result"}}]}}]}}]} as unknown as DocumentNode<CallMcpToolMutation, CallMcpToolMutationVariables>;
export const GetMcpToolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMCPTools"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMCPTools"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetMcpToolsQuery, GetMcpToolsQueryVariables>;
export const SubscribeMcpToolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeMCPTools"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"annotations"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"runtimes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"}}]}}]}}]}}]} as unknown as DocumentNode<SubscribeMcpToolsSubscription, SubscribeMcpToolsSubscriptionVariables>;
export const CreateMcpRegistryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateMCPRegistry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"upstreamUrl"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMCPRegistry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"upstreamUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"upstreamUrl"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"upstreamUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSyncAt"}}]}}]}}]} as unknown as DocumentNode<CreateMcpRegistryMutation, CreateMcpRegistryMutationVariables>;
export const DeleteMcpRegistryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMCPRegistry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMCPRegistry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<DeleteMcpRegistryMutation, DeleteMcpRegistryMutationVariables>;
export const GetMcpRegistriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMCPRegistries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mcpRegistries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"upstreamUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSyncAt"}},{"kind":"Field","name":{"kind":"Name","value":"servers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"packages"}},{"kind":"Field","name":{"kind":"Name","value":"remotes"}},{"kind":"Field","name":{"kind":"Name","value":"_meta"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetMcpRegistriesQuery, GetMcpRegistriesQueryVariables>;
export const SubscribeMcpRegistriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeMCPRegistries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mcpRegistries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"upstreamUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSyncAt"}},{"kind":"Field","name":{"kind":"Name","value":"servers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"packages"}},{"kind":"Field","name":{"kind":"Name","value":"remotes"}},{"kind":"Field","name":{"kind":"Name","value":"_meta"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]}}]}}]} as unknown as DocumentNode<SubscribeMcpRegistriesSubscription, SubscribeMcpRegistriesSubscriptionVariables>;
export const SyncUpstreamRegistryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SyncUpstreamRegistry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"registryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncUpstreamRegistry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"registryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"registryId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"upstreamUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastSyncAt"}},{"kind":"Field","name":{"kind":"Name","value":"servers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"packages"}},{"kind":"Field","name":{"kind":"Name","value":"remotes"}},{"kind":"Field","name":{"kind":"Name","value":"_meta"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]}}]}}]} as unknown as DocumentNode<SyncUpstreamRegistryMutation, SyncUpstreamRegistryMutationVariables>;
export const GetRuntimesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRuntimes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"runtimes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"}},{"kind":"Field","name":{"kind":"Name","value":"hostIP"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"mcpClientName"}}]}}]}}]}}]} as unknown as DocumentNode<GetRuntimesQuery, GetRuntimesQueryVariables>;
export const SubscribeRuntimesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeRuntimes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runtimes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"}},{"kind":"Field","name":{"kind":"Name","value":"hostIP"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"mcpClientName"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"mcpToolCapabilities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<SubscribeRuntimesSubscription, SubscribeRuntimesSubscriptionVariables>;
export const InitSystemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InitSystem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"adminPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"initSystem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"adminPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"adminPassword"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"initialized"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<InitSystemMutation, InitSystemMutationVariables>;
export const CompleteOnboardingStepDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteOnboardingStep"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"stepId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completeOnboardingStep"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"stepId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"stepId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"onboardingSteps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stepId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"dismissedAt"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<CompleteOnboardingStepMutation, CompleteOnboardingStepMutationVariables>;
export const DismissOnboardingStepDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DismissOnboardingStep"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"stepId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dismissOnboardingStep"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"stepId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"stepId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"onboardingSteps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stepId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"dismissedAt"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<DismissOnboardingStepMutation, DismissOnboardingStepMutationVariables>;
export const GetDefaultWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDefaultWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"defaultWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"onboardingSteps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stepId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetDefaultWorkspaceQuery, GetDefaultWorkspaceQueryVariables>;
export const GetWorkspacesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"defaultWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetWorkspacesQuery, GetWorkspacesQueryVariables>;
export const SubscribeWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"onboardingSteps"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stepId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"dismissedAt"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<SubscribeWorkspaceSubscription, SubscribeWorkspaceSubscriptionVariables>;
export const ValidateWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ValidateWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMCPTools"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ValidateWorkspaceQuery, ValidateWorkspaceQueryVariables>;