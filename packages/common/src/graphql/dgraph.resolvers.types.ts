import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
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
  DateTime: { input: any; output: any; }
};

export enum ActiveStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}

export type McpRegistryServer = {
  _meta?: Maybe<Scalars['String']['output']>;
  configurations?: Maybe<Array<McpServer>>;
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastSeenAt: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  packages: Scalars['String']['output'];
  remotes?: Maybe<Scalars['String']['output']>;
  repositoryUrl: Scalars['String']['output'];
  title: Scalars['String']['output'];
  version: Scalars['String']['output'];
  workspace: Workspace;
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
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  inputSchema: Scalars['String']['output'];
  lastSeenAt: Scalars['DateTime']['output'];
  mcpServer: McpServer;
  name: Scalars['String']['output'];
  runtimes?: Maybe<Array<Runtime>>;
  status: ActiveStatus;
  toolCalls?: Maybe<Array<ToolCall>>;
  workspace: Workspace;
};

export enum McpTransportType {
  Sse = 'SSE',
  Stdio = 'STDIO',
  Stream = 'STREAM'
}

export type OnboardingStep = {
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  priority?: Maybe<Scalars['Int']['output']>;
  status: OnboardingStepStatus;
  stepId: Scalars['String']['output'];
  type: OnboardingStepType;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
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

export type Runtime = {
  capabilities?: Maybe<Array<Scalars['String']['output']>>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  hostIP?: Maybe<Scalars['String']['output']>;
  hostname?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastSeenAt?: Maybe<Scalars['DateTime']['output']>;
  mcpClientName?: Maybe<Scalars['String']['output']>;
  mcpServers?: Maybe<Array<McpServer>>;
  mcpToolCapabilities?: Maybe<Array<McpTool>>;
  name: Scalars['String']['output'];
  processId?: Maybe<Scalars['String']['output']>;
  roots?: Maybe<Scalars['String']['output']>;
  status: ActiveStatus;
  toolCalls?: Maybe<Array<ToolCall>>;
  toolResponses?: Maybe<Array<ToolCall>>;
  workspace: Workspace;
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

export type System = {
  admins?: Maybe<Array<User>>;
  createdAt: Scalars['DateTime']['output'];
  defaultWorkspace?: Maybe<Workspace>;
  id: Scalars['ID']['output'];
  initialized: Scalars['Boolean']['output'];
  instanceId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  workspaces?: Maybe<Array<Workspace>>;
};

export type ToolCall = {
  calledAt: Scalars['DateTime']['output'];
  calledBy: Runtime;
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  executedBy?: Maybe<Runtime>;
  id: Scalars['ID']['output'];
  mcpTool: McpTool;
  status: ToolCallStatus;
  toolInput: Scalars['String']['output'];
  toolOutput?: Maybe<Scalars['String']['output']>;
};

export enum ToolCallStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING'
}

export type User = {
  adminOfWorkspaces?: Maybe<Array<Workspace>>;
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  failedLoginAttempts?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  lastLoginAt?: Maybe<Scalars['DateTime']['output']>;
  lockedUntil?: Maybe<Scalars['DateTime']['output']>;
  membersOfWorkspaces?: Maybe<Array<Workspace>>;
  password: Scalars['String']['output'];
  sessions?: Maybe<Array<Session>>;
  updatedAt: Scalars['DateTime']['output'];
};

export type Workspace = {
  admins?: Maybe<Array<User>>;
  createdAt: Scalars['DateTime']['output'];
  globalRuntime?: Maybe<Runtime>;
  id: Scalars['ID']['output'];
  mcpServers?: Maybe<Array<McpServer>>;
  mcpTools?: Maybe<Array<McpTool>>;
  name: Scalars['String']['output'];
  onboardingSteps?: Maybe<Array<OnboardingStep>>;
  registryServers?: Maybe<Array<McpRegistryServer>>;
  runtimes?: Maybe<Array<Runtime>>;
  system: System;
  users?: Maybe<Array<User>>;
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

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
export type ResolversTypes = ResolversObject<{
  ActiveStatus: ActiveStatus;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  MCPRegistryServer: ResolverTypeWrapper<McpRegistryServer>;
  MCPServer: ResolverTypeWrapper<McpServer>;
  MCPServerRunOn: McpServerRunOn;
  MCPTool: ResolverTypeWrapper<McpTool>;
  MCPTransportType: McpTransportType;
  OnboardingStep: ResolverTypeWrapper<OnboardingStep>;
  OnboardingStepStatus: OnboardingStepStatus;
  OnboardingStepType: OnboardingStepType;
  Runtime: ResolverTypeWrapper<Runtime>;
  Session: ResolverTypeWrapper<Session>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  System: ResolverTypeWrapper<System>;
  ToolCall: ResolverTypeWrapper<ToolCall>;
  ToolCallStatus: ToolCallStatus;
  User: ResolverTypeWrapper<User>;
  Workspace: ResolverTypeWrapper<Workspace>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Boolean: Scalars['Boolean']['output'];
  DateTime: Scalars['DateTime']['output'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  MCPRegistryServer: McpRegistryServer;
  MCPServer: McpServer;
  MCPTool: McpTool;
  OnboardingStep: OnboardingStep;
  Runtime: Runtime;
  Session: Session;
  String: Scalars['String']['output'];
  System: System;
  ToolCall: ToolCall;
  User: User;
  Workspace: Workspace;
}>;

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type McpRegistryServerResolvers<ContextType = any, ParentType extends ResolversParentTypes['MCPRegistryServer'] = ResolversParentTypes['MCPRegistryServer']> = ResolversObject<{
  _meta?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  configurations?: Resolver<Maybe<Array<ResolversTypes['MCPServer']>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastSeenAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  packages?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  remotes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  repositoryUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  workspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type McpServerResolvers<ContextType = any, ParentType extends ResolversParentTypes['MCPServer'] = ResolversParentTypes['MCPServer']> = ResolversObject<{
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
}>;

export type McpToolResolvers<ContextType = any, ParentType extends ResolversParentTypes['MCPTool'] = ResolversParentTypes['MCPTool']> = ResolversObject<{
  annotations?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  inputSchema?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastSeenAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  mcpServer?: Resolver<ResolversTypes['MCPServer'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  runtimes?: Resolver<Maybe<Array<ResolversTypes['Runtime']>>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ActiveStatus'], ParentType, ContextType>;
  toolCalls?: Resolver<Maybe<Array<ResolversTypes['ToolCall']>>, ParentType, ContextType>;
  workspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OnboardingStepResolvers<ContextType = any, ParentType extends ResolversParentTypes['OnboardingStep'] = ResolversParentTypes['OnboardingStep']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  priority?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['OnboardingStepStatus'], ParentType, ContextType>;
  stepId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['OnboardingStepType'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RuntimeResolvers<ContextType = any, ParentType extends ResolversParentTypes['Runtime'] = ResolversParentTypes['Runtime']> = ResolversObject<{
  capabilities?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hostIP?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hostname?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastSeenAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  mcpClientName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mcpServers?: Resolver<Maybe<Array<ResolversTypes['MCPServer']>>, ParentType, ContextType>;
  mcpToolCapabilities?: Resolver<Maybe<Array<ResolversTypes['MCPTool']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  processId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  roots?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ActiveStatus'], ParentType, ContextType>;
  toolCalls?: Resolver<Maybe<Array<ResolversTypes['ToolCall']>>, ParentType, ContextType>;
  toolResponses?: Resolver<Maybe<Array<ResolversTypes['ToolCall']>>, ParentType, ContextType>;
  workspace?: Resolver<ResolversTypes['Workspace'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SessionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Session'] = ResolversParentTypes['Session']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  deviceInfo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  expiresAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  ipAddress?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lastUsedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  refreshToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  userAgent?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SystemResolvers<ContextType = any, ParentType extends ResolversParentTypes['System'] = ResolversParentTypes['System']> = ResolversObject<{
  admins?: Resolver<Maybe<Array<ResolversTypes['User']>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  defaultWorkspace?: Resolver<Maybe<ResolversTypes['Workspace']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  initialized?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  instanceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  workspaces?: Resolver<Maybe<Array<ResolversTypes['Workspace']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ToolCallResolvers<ContextType = any, ParentType extends ResolversParentTypes['ToolCall'] = ResolversParentTypes['ToolCall']> = ResolversObject<{
  calledAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  calledBy?: Resolver<ResolversTypes['Runtime'], ParentType, ContextType>;
  completedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  executedBy?: Resolver<Maybe<ResolversTypes['Runtime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  mcpTool?: Resolver<ResolversTypes['MCPTool'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ToolCallStatus'], ParentType, ContextType>;
  toolInput?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  toolOutput?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  adminOfWorkspaces?: Resolver<Maybe<Array<ResolversTypes['Workspace']>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  failedLoginAttempts?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastLoginAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  lockedUntil?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  membersOfWorkspaces?: Resolver<Maybe<Array<ResolversTypes['Workspace']>>, ParentType, ContextType>;
  password?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sessions?: Resolver<Maybe<Array<ResolversTypes['Session']>>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type WorkspaceResolvers<ContextType = any, ParentType extends ResolversParentTypes['Workspace'] = ResolversParentTypes['Workspace']> = ResolversObject<{
  admins?: Resolver<Maybe<Array<ResolversTypes['User']>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  globalRuntime?: Resolver<Maybe<ResolversTypes['Runtime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  mcpServers?: Resolver<Maybe<Array<ResolversTypes['MCPServer']>>, ParentType, ContextType>;
  mcpTools?: Resolver<Maybe<Array<ResolversTypes['MCPTool']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  onboardingSteps?: Resolver<Maybe<Array<ResolversTypes['OnboardingStep']>>, ParentType, ContextType>;
  registryServers?: Resolver<Maybe<Array<ResolversTypes['MCPRegistryServer']>>, ParentType, ContextType>;
  runtimes?: Resolver<Maybe<Array<ResolversTypes['Runtime']>>, ParentType, ContextType>;
  system?: Resolver<ResolversTypes['System'], ParentType, ContextType>;
  users?: Resolver<Maybe<Array<ResolversTypes['User']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = any> = ResolversObject<{
  DateTime?: GraphQLScalarType;
  MCPRegistryServer?: McpRegistryServerResolvers<ContextType>;
  MCPServer?: McpServerResolvers<ContextType>;
  MCPTool?: McpToolResolvers<ContextType>;
  OnboardingStep?: OnboardingStepResolvers<ContextType>;
  Runtime?: RuntimeResolvers<ContextType>;
  Session?: SessionResolvers<ContextType>;
  System?: SystemResolvers<ContextType>;
  ToolCall?: ToolCallResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  Workspace?: WorkspaceResolvers<ContextType>;
}>;

