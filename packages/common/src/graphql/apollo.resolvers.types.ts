import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
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
  accessToken: Scalars['String']['output'];
  errors?: Maybe<Array<Scalars['String']['output']>>;
  expiresIn: Scalars['Int']['output'];
  refreshToken: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  tokens?: Maybe<AuthTokens>;
  user: User;
};

export type AuthTokens = {
  accessToken: Scalars['String']['output'];
  refreshToken: Scalars['String']['output'];
};

export type CallToolResult = {
  result: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Infra = {
  nats?: Maybe<Scalars['String']['output']>;
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
  errors?: Maybe<Array<Scalars['String']['output']>>;
  success: Scalars['Boolean']['output'];
};

export type LogoutUserInput = {
  refreshToken: Scalars['String']['input'];
};

export type McpRegistry = {
  createdAt: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  lastSyncAt?: Maybe<Scalars['Date']['output']>;
  name: Scalars['String']['output'];
  servers?: Maybe<Array<McpRegistryServer>>;
  workspace: Workspace;
};

export type McpRegistry2lyMetadata = {
  registryVersion: Scalars['String']['output'];
};

export type McpRegistryServer = {
  _meta?: Maybe<Scalars['String']['output']>;
  configurations?: Maybe<Array<McpServer>>;
  createdAt: Scalars['Date']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastSeenAt: Scalars['Date']['output'];
  name: Scalars['String']['output'];
  packages?: Maybe<Scalars['String']['output']>;
  registry: McpRegistry;
  remotes?: Maybe<Scalars['String']['output']>;
  repositoryUrl: Scalars['String']['output'];
  title: Scalars['String']['output'];
  version: Scalars['String']['output'];
};

export type McpServer = {
  config: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  registryServer: McpRegistryServer;
  repositoryUrl: Scalars['String']['output'];
  runOn?: Maybe<McpServerRunOn>;
  runtime?: Maybe<Runtime>;
  tools?: Maybe<Array<McpTool>>;
  transport: McpTransportType;
  workspace: Workspace;
};

export enum McpServerRunOn {
  Agent = 'AGENT',
  Edge = 'EDGE',
  Global = 'GLOBAL'
}

export type McpTool = {
  annotations: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  inputSchema: Scalars['String']['output'];
  lastSeenAt: Scalars['Date']['output'];
  mcpServer: McpServer;
  name: Scalars['String']['output'];
  runtimes?: Maybe<Array<Runtime>>;
  status: ActiveStatus;
  workspace: Workspace;
};

export enum McpTransportType {
  Sse = 'SSE',
  Stdio = 'STDIO',
  Stream = 'STREAM'
}

export type Mutation = {
  addServerToRegistry: McpRegistryServer;
  callMCPTool: CallToolResult;
  completeOnboardingStep: Scalars['Boolean']['output'];
  createMCPRegistry: McpRegistry;
  createMCPServer: McpServer;
  createRuntime: Runtime;
  deleteMCPRegistry: McpRegistry;
  deleteMCPServer: McpServer;
  deleteMCPTool: McpTool;
  deleteRuntime: Runtime;
  dismissOnboardingStep: Scalars['Boolean']['output'];
  initSystem: System;
  linkMCPServerToRuntime: McpServer;
  linkMCPToolToRuntime: Runtime;
  login: AuthPayload;
  loginUser: AuthPayload;
  logout: Scalars['Boolean']['output'];
  logoutUser: LogoutPayload;
  refreshToken: RefreshTokenPayload;
  registerUser: RegisterUserPayload;
  removeServerFromRegistry: McpRegistryServer;
  setGlobalRuntime: Workspace;
  unlinkMCPServerFromRuntime: McpServer;
  unlinkMCPToolFromRuntime: Runtime;
  unsetGlobalRuntime: Workspace;
  updateMCPServer: McpServer;
  updateMCPServerRunOn: McpServer;
  updateRuntime: Runtime;
  updateServerInRegistry: McpRegistryServer;
  updateWorkspace: Workspace;
};


export type MutationAddServerToRegistryArgs = {
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  packages?: InputMaybe<Scalars['String']['input']>;
  registryId: Scalars['ID']['input'];
  remotes?: InputMaybe<Scalars['String']['input']>;
  repositoryUrl: Scalars['String']['input'];
  title: Scalars['String']['input'];
  version: Scalars['String']['input'];
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
  workspaceId: Scalars['ID']['input'];
};


export type MutationCreateMcpServerArgs = {
  config: Scalars['String']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  registryServerId: Scalars['ID']['input'];
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


export type MutationRemoveServerFromRegistryArgs = {
  serverId: Scalars['ID']['input'];
};


export type MutationSetGlobalRuntimeArgs = {
  id: Scalars['ID']['input'];
  runtimeId: Scalars['ID']['input'];
};


export type MutationUnlinkMcpServerFromRuntimeArgs = {
  mcpServerId: Scalars['ID']['input'];
};


export type MutationUnlinkMcpToolFromRuntimeArgs = {
  mcpToolId: Scalars['ID']['input'];
  runtimeId: Scalars['ID']['input'];
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


export type MutationUpdateServerInRegistryArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  packages?: InputMaybe<Scalars['String']['input']>;
  remotes?: InputMaybe<Scalars['String']['input']>;
  repositoryUrl?: InputMaybe<Scalars['String']['input']>;
  serverId: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateWorkspaceArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};

export type OnboardingStep = {
  createdAt: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  priority?: Maybe<Scalars['Int']['output']>;
  status: OnboardingStepStatus;
  stepId: Scalars['String']['output'];
  type: OnboardingStepType;
  updatedAt?: Maybe<Scalars['Date']['output']>;
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

export enum OrderDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type Query = {
  infra: Infra;
  isMCPAutoConfigEnabled: Scalars['Boolean']['output'];
  mcpRegistries?: Maybe<Array<McpRegistry>>;
  mcpServers?: Maybe<Array<McpServer>>;
  mcpTools?: Maybe<Array<McpTool>>;
  me?: Maybe<User>;
  system?: Maybe<System>;
  toolCalls: ToolCallsResult;
  workspace?: Maybe<Array<Workspace>>;
  workspaceMCPTools?: Maybe<Workspace>;
};


export type QueryMcpRegistriesArgs = {
  workspaceId: Scalars['ID']['input'];
};


export type QueryMcpServersArgs = {
  workspaceId: Scalars['ID']['input'];
};


export type QueryMcpToolsArgs = {
  workspaceId: Scalars['ID']['input'];
};


export type QueryToolCallsArgs = {
  filters?: InputMaybe<ToolCallFilters>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<OrderDirection>;
  workspaceId: Scalars['ID']['input'];
};


export type QueryWorkspaceMcpToolsArgs = {
  workspaceId: Scalars['ID']['input'];
};

export type RefreshTokenInput = {
  refreshToken: Scalars['String']['input'];
};

export type RefreshTokenPayload = {
  accessToken: Scalars['String']['output'];
  errors?: Maybe<Array<Scalars['String']['output']>>;
  expiresIn: Scalars['Int']['output'];
  success: Scalars['Boolean']['output'];
};

export type RegisterUserInput = {
  deviceInfo?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type RegisterUserPayload = {
  errors?: Maybe<Array<Scalars['String']['output']>>;
  success: Scalars['Boolean']['output'];
  tokens?: Maybe<AuthTokens>;
  user?: Maybe<User>;
};

export type Runtime = {
  capabilities?: Maybe<Array<Scalars['String']['output']>>;
  createdAt: Scalars['Date']['output'];
  description?: Maybe<Scalars['String']['output']>;
  hostIP?: Maybe<Scalars['String']['output']>;
  hostname?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastSeenAt?: Maybe<Scalars['Date']['output']>;
  mcpClientName?: Maybe<Scalars['String']['output']>;
  mcpServers?: Maybe<Array<McpServer>>;
  mcpToolCapabilities?: Maybe<Array<McpTool>>;
  name: Scalars['String']['output'];
  roots?: Maybe<Scalars['String']['output']>;
  status: ActiveStatus;
  workspace: Workspace;
};

export type Subscription = {
  mcpServers?: Maybe<Array<McpServer>>;
  runtimes?: Maybe<Array<Runtime>>;
  toolCalls?: Maybe<Array<ToolCall>>;
  workspace?: Maybe<Workspace>;
  workspaces?: Maybe<Array<Workspace>>;
};


export type SubscriptionMcpServersArgs = {
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
  createdAt: Scalars['Date']['output'];
  defaultWorkspace?: Maybe<Workspace>;
  id: Scalars['ID']['output'];
  initialized: Scalars['Boolean']['output'];
  updatedAt: Scalars['Date']['output'];
};

export type ToolCall = {
  calledAt: Scalars['Date']['output'];
  calledBy: Runtime;
  completedAt?: Maybe<Scalars['Date']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  executedBy?: Maybe<Runtime>;
  id: Scalars['ID']['output'];
  mcpTool: McpTool;
  status: ToolCallStatus;
  toolInput: Scalars['String']['output'];
  toolOutput?: Maybe<Scalars['String']['output']>;
};

export type ToolCallFilters = {
  dateFrom?: InputMaybe<Scalars['Date']['input']>;
  dateTo?: InputMaybe<Scalars['Date']['input']>;
  mcpServerIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  mcpToolIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  runtimeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Array<ToolCallStatus>>;
};

export type ToolCallStats = {
  avgDuration?: Maybe<Scalars['Float']['output']>;
  completed: Scalars['Int']['output'];
  failed: Scalars['Int']['output'];
  pending: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export enum ToolCallStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING'
}

export type ToolCallsResult = {
  hasMore: Scalars['Boolean']['output'];
  stats: ToolCallStats;
  toolCalls: Array<ToolCall>;
  totalCount: Scalars['Int']['output'];
};

export type User = {
  adminOfWorkspaces?: Maybe<Array<Workspace>>;
  createdAt: Scalars['Date']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastLoginAt?: Maybe<Scalars['Date']['output']>;
  membersOfWorkspaces?: Maybe<Array<Workspace>>;
  updatedAt: Scalars['Date']['output'];
};

export type Workspace = {
  createdAt: Scalars['Date']['output'];
  globalRuntime?: Maybe<Runtime>;
  id: Scalars['ID']['output'];
  mcpRegistries?: Maybe<Array<McpRegistry>>;
  mcpServers?: Maybe<Array<McpServer>>;
  mcpTools?: Maybe<Array<McpTool>>;
  name: Scalars['String']['output'];
  onboardingSteps?: Maybe<Array<OnboardingStep>>;
  runtimes?: Maybe<Array<Runtime>>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  ActiveStatus: ActiveStatus;
  AuthPayload: ResolverTypeWrapper<AuthPayload>;
  AuthTokens: ResolverTypeWrapper<AuthTokens>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CallToolResult: ResolverTypeWrapper<CallToolResult>;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Infra: ResolverTypeWrapper<Infra>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  LoginInput: LoginInput;
  LoginUserInput: LoginUserInput;
  LogoutInput: LogoutInput;
  LogoutPayload: ResolverTypeWrapper<LogoutPayload>;
  LogoutUserInput: LogoutUserInput;
  MCPRegistry: ResolverTypeWrapper<McpRegistry>;
  MCPRegistry2lyMetadata: ResolverTypeWrapper<McpRegistry2lyMetadata>;
  MCPRegistryServer: ResolverTypeWrapper<McpRegistryServer>;
  MCPServer: ResolverTypeWrapper<McpServer>;
  MCPServerRunOn: McpServerRunOn;
  MCPTool: ResolverTypeWrapper<McpTool>;
  MCPTransportType: McpTransportType;
  Mutation: ResolverTypeWrapper<{}>;
  OnboardingStep: ResolverTypeWrapper<OnboardingStep>;
  OnboardingStepStatus: OnboardingStepStatus;
  OnboardingStepType: OnboardingStepType;
  OrderDirection: OrderDirection;
  Query: ResolverTypeWrapper<{}>;
  RefreshTokenInput: RefreshTokenInput;
  RefreshTokenPayload: ResolverTypeWrapper<RefreshTokenPayload>;
  RegisterUserInput: RegisterUserInput;
  RegisterUserPayload: ResolverTypeWrapper<RegisterUserPayload>;
  Runtime: ResolverTypeWrapper<Runtime>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  System: ResolverTypeWrapper<System>;
  ToolCall: ResolverTypeWrapper<ToolCall>;
  ToolCallFilters: ToolCallFilters;
  ToolCallStats: ResolverTypeWrapper<ToolCallStats>;
  ToolCallStatus: ToolCallStatus;
  ToolCallsResult: ResolverTypeWrapper<ToolCallsResult>;
  User: ResolverTypeWrapper<User>;
  Workspace: ResolverTypeWrapper<Workspace>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AuthPayload: AuthPayload;
  AuthTokens: AuthTokens;
  Boolean: Scalars['Boolean']['output'];
  CallToolResult: CallToolResult;
  Date: Scalars['Date']['output'];
  Float: Scalars['Float']['output'];
  ID: Scalars['ID']['output'];
  Infra: Infra;
  Int: Scalars['Int']['output'];
  LoginInput: LoginInput;
  LoginUserInput: LoginUserInput;
  LogoutInput: LogoutInput;
  LogoutPayload: LogoutPayload;
  LogoutUserInput: LogoutUserInput;
  MCPRegistry: McpRegistry;
  MCPRegistry2lyMetadata: McpRegistry2lyMetadata;
  MCPRegistryServer: McpRegistryServer;
  MCPServer: McpServer;
  MCPTool: McpTool;
  Mutation: {};
  OnboardingStep: OnboardingStep;
  Query: {};
  RefreshTokenInput: RefreshTokenInput;
  RefreshTokenPayload: RefreshTokenPayload;
  RegisterUserInput: RegisterUserInput;
  RegisterUserPayload: RegisterUserPayload;
  Runtime: Runtime;
  String: Scalars['String']['output'];
  Subscription: {};
  System: System;
  ToolCall: ToolCall;
  ToolCallFilters: ToolCallFilters;
  ToolCallStats: ToolCallStats;
  ToolCallsResult: ToolCallsResult;
  User: User;
  Workspace: Workspace;
};

export type AuthPayloadResolvers<ContextType = object, ParentType extends ResolversParentTypes['AuthPayload'] = ResolversParentTypes['AuthPayload']> = {
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  errors?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  expiresIn?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  refreshToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  tokens?: Resolver<Maybe<ResolversTypes['AuthTokens']>, ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AuthTokensResolvers<ContextType = object, ParentType extends ResolversParentTypes['AuthTokens'] = ResolversParentTypes['AuthTokens']> = {
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  refreshToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CallToolResultResolvers<ContextType = object, ParentType extends ResolversParentTypes['CallToolResult'] = ResolversParentTypes['CallToolResult']> = {
  result?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type InfraResolvers<ContextType = object, ParentType extends ResolversParentTypes['Infra'] = ResolversParentTypes['Infra']> = {
  nats?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LogoutPayloadResolvers<ContextType = object, ParentType extends ResolversParentTypes['LogoutPayload'] = ResolversParentTypes['LogoutPayload']> = {
  errors?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type McpRegistryResolvers<ContextType = object, ParentType extends ResolversParentTypes['MCPRegistry'] = ResolversParentTypes['MCPRegistry']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastSyncAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  servers?: Resolver<Maybe<Array<ResolversTypes['MCPRegistryServer']>>, ParentType, ContextType>;
  workspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type McpRegistry2lyMetadataResolvers<ContextType = object, ParentType extends ResolversParentTypes['MCPRegistry2lyMetadata'] = ResolversParentTypes['MCPRegistry2lyMetadata']> = {
  registryVersion?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type McpRegistryServerResolvers<ContextType = object, ParentType extends ResolversParentTypes['MCPRegistryServer'] = ResolversParentTypes['MCPRegistryServer']> = {
  _meta?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  configurations?: Resolver<Maybe<Array<ResolversTypes['MCPServer']>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastSeenAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  packages?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  registry?: Resolver<ResolversTypes['MCPRegistry'], ParentType, ContextType>;
  remotes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  repositoryUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type McpServerResolvers<ContextType = object, ParentType extends ResolversParentTypes['MCPServer'] = ResolversParentTypes['MCPServer']> = {
  config?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  registryServer?: Resolver<ResolversTypes['MCPRegistryServer'], ParentType, ContextType>;
  repositoryUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  runOn?: Resolver<Maybe<ResolversTypes['MCPServerRunOn']>, ParentType, ContextType>;
  runtime?: Resolver<Maybe<ResolversTypes['Runtime']>, ParentType, ContextType>;
  tools?: Resolver<Maybe<Array<ResolversTypes['MCPTool']>>, ParentType, ContextType>;
  transport?: Resolver<ResolversTypes['MCPTransportType'], ParentType, ContextType>;
  workspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type McpToolResolvers<ContextType = object, ParentType extends ResolversParentTypes['MCPTool'] = ResolversParentTypes['MCPTool']> = {
  annotations?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  inputSchema?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastSeenAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  mcpServer?: Resolver<ResolversTypes['MCPServer'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  runtimes?: Resolver<Maybe<Array<ResolversTypes['Runtime']>>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ActiveStatus'], ParentType, ContextType>;
  workspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = object, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addServerToRegistry?: Resolver<ResolversTypes['MCPRegistryServer'], ParentType, ContextType, RequireFields<MutationAddServerToRegistryArgs, 'description' | 'name' | 'registryId' | 'repositoryUrl' | 'title' | 'version'>>;
  callMCPTool?: Resolver<ResolversTypes['CallToolResult'], ParentType, ContextType, RequireFields<MutationCallMcpToolArgs, 'input' | 'toolId'>>;
  completeOnboardingStep?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCompleteOnboardingStepArgs, 'stepId' | 'workspaceId'>>;
  createMCPRegistry?: Resolver<ResolversTypes['MCPRegistry'], ParentType, ContextType, RequireFields<MutationCreateMcpRegistryArgs, 'name' | 'workspaceId'>>;
  createMCPServer?: Resolver<ResolversTypes['MCPServer'], ParentType, ContextType, RequireFields<MutationCreateMcpServerArgs, 'config' | 'description' | 'name' | 'registryServerId' | 'repositoryUrl' | 'transport' | 'workspaceId'>>;
  createRuntime?: Resolver<ResolversTypes['Runtime'], ParentType, ContextType, RequireFields<MutationCreateRuntimeArgs, 'capabilities' | 'description' | 'name' | 'workspaceId'>>;
  deleteMCPRegistry?: Resolver<ResolversTypes['MCPRegistry'], ParentType, ContextType, RequireFields<MutationDeleteMcpRegistryArgs, 'id'>>;
  deleteMCPServer?: Resolver<ResolversTypes['MCPServer'], ParentType, ContextType, RequireFields<MutationDeleteMcpServerArgs, 'id'>>;
  deleteMCPTool?: Resolver<ResolversTypes['MCPTool'], ParentType, ContextType, RequireFields<MutationDeleteMcpToolArgs, 'id'>>;
  deleteRuntime?: Resolver<ResolversTypes['Runtime'], ParentType, ContextType, RequireFields<MutationDeleteRuntimeArgs, 'id'>>;
  dismissOnboardingStep?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDismissOnboardingStepArgs, 'stepId' | 'workspaceId'>>;
  initSystem?: Resolver<ResolversTypes['System'], ParentType, ContextType, RequireFields<MutationInitSystemArgs, 'adminPassword' | 'email'>>;
  linkMCPServerToRuntime?: Resolver<ResolversTypes['MCPServer'], ParentType, ContextType, RequireFields<MutationLinkMcpServerToRuntimeArgs, 'mcpServerId' | 'runtimeId'>>;
  linkMCPToolToRuntime?: Resolver<ResolversTypes['Runtime'], ParentType, ContextType, RequireFields<MutationLinkMcpToolToRuntimeArgs, 'mcpToolId' | 'runtimeId'>>;
  login?: Resolver<ResolversTypes['AuthPayload'], ParentType, ContextType, RequireFields<MutationLoginArgs, 'input'>>;
  loginUser?: Resolver<ResolversTypes['AuthPayload'], ParentType, ContextType, RequireFields<MutationLoginUserArgs, 'input'>>;
  logout?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationLogoutArgs, 'input'>>;
  logoutUser?: Resolver<ResolversTypes['LogoutPayload'], ParentType, ContextType, RequireFields<MutationLogoutUserArgs, 'input'>>;
  refreshToken?: Resolver<ResolversTypes['RefreshTokenPayload'], ParentType, ContextType, RequireFields<MutationRefreshTokenArgs, 'input'>>;
  registerUser?: Resolver<ResolversTypes['RegisterUserPayload'], ParentType, ContextType, RequireFields<MutationRegisterUserArgs, 'input'>>;
  removeServerFromRegistry?: Resolver<ResolversTypes['MCPRegistryServer'], ParentType, ContextType, RequireFields<MutationRemoveServerFromRegistryArgs, 'serverId'>>;
  setGlobalRuntime?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<MutationSetGlobalRuntimeArgs, 'id' | 'runtimeId'>>;
  unlinkMCPServerFromRuntime?: Resolver<ResolversTypes['MCPServer'], ParentType, ContextType, RequireFields<MutationUnlinkMcpServerFromRuntimeArgs, 'mcpServerId'>>;
  unlinkMCPToolFromRuntime?: Resolver<ResolversTypes['Runtime'], ParentType, ContextType, RequireFields<MutationUnlinkMcpToolFromRuntimeArgs, 'mcpToolId' | 'runtimeId'>>;
  unsetGlobalRuntime?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<MutationUnsetGlobalRuntimeArgs, 'id'>>;
  updateMCPServer?: Resolver<ResolversTypes['MCPServer'], ParentType, ContextType, RequireFields<MutationUpdateMcpServerArgs, 'config' | 'description' | 'id' | 'name' | 'repositoryUrl' | 'transport'>>;
  updateMCPServerRunOn?: Resolver<ResolversTypes['MCPServer'], ParentType, ContextType, RequireFields<MutationUpdateMcpServerRunOnArgs, 'mcpServerId' | 'runOn'>>;
  updateRuntime?: Resolver<ResolversTypes['Runtime'], ParentType, ContextType, RequireFields<MutationUpdateRuntimeArgs, 'description' | 'id' | 'name'>>;
  updateServerInRegistry?: Resolver<ResolversTypes['MCPRegistryServer'], ParentType, ContextType, RequireFields<MutationUpdateServerInRegistryArgs, 'serverId'>>;
  updateWorkspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType, RequireFields<MutationUpdateWorkspaceArgs, 'id' | 'name'>>;
};

export type OnboardingStepResolvers<ContextType = object, ParentType extends ResolversParentTypes['OnboardingStep'] = ResolversParentTypes['OnboardingStep']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  priority?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['OnboardingStepStatus'], ParentType, ContextType>;
  stepId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['OnboardingStepType'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = object, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  infra?: Resolver<ResolversTypes['Infra'], ParentType, ContextType>;
  isMCPAutoConfigEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  mcpRegistries?: Resolver<Maybe<Array<ResolversTypes['MCPRegistry']>>, ParentType, ContextType, RequireFields<QueryMcpRegistriesArgs, 'workspaceId'>>;
  mcpServers?: Resolver<Maybe<Array<ResolversTypes['MCPServer']>>, ParentType, ContextType, RequireFields<QueryMcpServersArgs, 'workspaceId'>>;
  mcpTools?: Resolver<Maybe<Array<ResolversTypes['MCPTool']>>, ParentType, ContextType, RequireFields<QueryMcpToolsArgs, 'workspaceId'>>;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  system?: Resolver<Maybe<ResolversTypes['System']>, ParentType, ContextType>;
  toolCalls?: Resolver<ResolversTypes['ToolCallsResult'], ParentType, ContextType, RequireFields<QueryToolCallsArgs, 'workspaceId'>>;
  workspace?: Resolver<Maybe<Array<ResolversTypes['Workspace']>>, ParentType, ContextType>;
  workspaceMCPTools?: Resolver<Maybe<ResolversTypes['Workspace']>, ParentType, ContextType, RequireFields<QueryWorkspaceMcpToolsArgs, 'workspaceId'>>;
};

export type RefreshTokenPayloadResolvers<ContextType = object, ParentType extends ResolversParentTypes['RefreshTokenPayload'] = ResolversParentTypes['RefreshTokenPayload']> = {
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  errors?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  expiresIn?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RegisterUserPayloadResolvers<ContextType = object, ParentType extends ResolversParentTypes['RegisterUserPayload'] = ResolversParentTypes['RegisterUserPayload']> = {
  errors?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  tokens?: Resolver<Maybe<ResolversTypes['AuthTokens']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RuntimeResolvers<ContextType = object, ParentType extends ResolversParentTypes['Runtime'] = ResolversParentTypes['Runtime']> = {
  capabilities?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hostIP?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hostname?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastSeenAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  mcpClientName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mcpServers?: Resolver<Maybe<Array<ResolversTypes['MCPServer']>>, ParentType, ContextType>;
  mcpToolCapabilities?: Resolver<Maybe<Array<ResolversTypes['MCPTool']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  roots?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ActiveStatus'], ParentType, ContextType>;
  workspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = object, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  mcpServers?: SubscriptionResolver<Maybe<Array<ResolversTypes['MCPServer']>>, "mcpServers", ParentType, ContextType, RequireFields<SubscriptionMcpServersArgs, 'workspaceId'>>;
  runtimes?: SubscriptionResolver<Maybe<Array<ResolversTypes['Runtime']>>, "runtimes", ParentType, ContextType, RequireFields<SubscriptionRuntimesArgs, 'workspaceId'>>;
  toolCalls?: SubscriptionResolver<Maybe<Array<ResolversTypes['ToolCall']>>, "toolCalls", ParentType, ContextType, RequireFields<SubscriptionToolCallsArgs, 'workspaceId'>>;
  workspace?: SubscriptionResolver<Maybe<ResolversTypes['Workspace']>, "workspace", ParentType, ContextType, RequireFields<SubscriptionWorkspaceArgs, 'workspaceId'>>;
  workspaces?: SubscriptionResolver<Maybe<Array<ResolversTypes['Workspace']>>, "workspaces", ParentType, ContextType>;
};

export type SystemResolvers<ContextType = object, ParentType extends ResolversParentTypes['System'] = ResolversParentTypes['System']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  defaultWorkspace?: Resolver<Maybe<ResolversTypes['Workspace']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  initialized?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ToolCallResolvers<ContextType = object, ParentType extends ResolversParentTypes['ToolCall'] = ResolversParentTypes['ToolCall']> = {
  calledAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  calledBy?: Resolver<ResolversTypes['Runtime'], ParentType, ContextType>;
  completedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  executedBy?: Resolver<Maybe<ResolversTypes['Runtime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  mcpTool?: Resolver<ResolversTypes['MCPTool'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ToolCallStatus'], ParentType, ContextType>;
  toolInput?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  toolOutput?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ToolCallStatsResolvers<ContextType = object, ParentType extends ResolversParentTypes['ToolCallStats'] = ResolversParentTypes['ToolCallStats']> = {
  avgDuration?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  completed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  failed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pending?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ToolCallsResultResolvers<ContextType = object, ParentType extends ResolversParentTypes['ToolCallsResult'] = ResolversParentTypes['ToolCallsResult']> = {
  hasMore?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  stats?: Resolver<ResolversTypes['ToolCallStats'], ParentType, ContextType>;
  toolCalls?: Resolver<Array<ResolversTypes['ToolCall']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserResolvers<ContextType = object, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  adminOfWorkspaces?: Resolver<Maybe<Array<ResolversTypes['Workspace']>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastLoginAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  membersOfWorkspaces?: Resolver<Maybe<Array<ResolversTypes['Workspace']>>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WorkspaceResolvers<ContextType = object, ParentType extends ResolversParentTypes['Workspace'] = ResolversParentTypes['Workspace']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  globalRuntime?: Resolver<Maybe<ResolversTypes['Runtime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  mcpRegistries?: Resolver<Maybe<Array<ResolversTypes['MCPRegistry']>>, ParentType, ContextType>;
  mcpServers?: Resolver<Maybe<Array<ResolversTypes['MCPServer']>>, ParentType, ContextType>;
  mcpTools?: Resolver<Maybe<Array<ResolversTypes['MCPTool']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  onboardingSteps?: Resolver<Maybe<Array<ResolversTypes['OnboardingStep']>>, ParentType, ContextType>;
  runtimes?: Resolver<Maybe<Array<ResolversTypes['Runtime']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = object> = {
  AuthPayload?: AuthPayloadResolvers<ContextType>;
  AuthTokens?: AuthTokensResolvers<ContextType>;
  CallToolResult?: CallToolResultResolvers<ContextType>;
  Date?: GraphQLScalarType;
  Infra?: InfraResolvers<ContextType>;
  LogoutPayload?: LogoutPayloadResolvers<ContextType>;
  MCPRegistry?: McpRegistryResolvers<ContextType>;
  MCPRegistry2lyMetadata?: McpRegistry2lyMetadataResolvers<ContextType>;
  MCPRegistryServer?: McpRegistryServerResolvers<ContextType>;
  MCPServer?: McpServerResolvers<ContextType>;
  MCPTool?: McpToolResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  OnboardingStep?: OnboardingStepResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RefreshTokenPayload?: RefreshTokenPayloadResolvers<ContextType>;
  RegisterUserPayload?: RegisterUserPayloadResolvers<ContextType>;
  Runtime?: RuntimeResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  System?: SystemResolvers<ContextType>;
  ToolCall?: ToolCallResolvers<ContextType>;
  ToolCallStats?: ToolCallStatsResolvers<ContextType>;
  ToolCallsResult?: ToolCallsResultResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  Workspace?: WorkspaceResolvers<ContextType>;
};

