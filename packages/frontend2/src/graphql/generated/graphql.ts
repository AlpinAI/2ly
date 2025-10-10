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
  servers: Maybe<Array<McpRegistryUpstreamServer>>;
  upstreamUrl: Scalars['String']['output'];
  workspace: Workspace;
};

export type McpRegistry2lyMetadata = {
  __typename: 'MCPRegistry2lyMetadata';
  registryVersion: Scalars['String']['output'];
};

export type McpRegistryServer = {
  __typename: 'MCPRegistryServer';
  ENV: Maybe<Scalars['String']['output']>;
  _2ly: McpRegistry2lyMetadata;
  args: Maybe<Scalars['String']['output']>;
  command: Maybe<Scalars['String']['output']>;
  config: Scalars['String']['output'];
  description: Scalars['String']['output'];
  headers: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  repositoryUrl: Scalars['String']['output'];
  serverUrl: Maybe<Scalars['String']['output']>;
  transport: McpTransportType;
};

export type McpRegistryUpstreamServer = {
  __typename: 'MCPRegistryUpstreamServer';
  _meta: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastSeenAt: Scalars['Date']['output'];
  name: Scalars['String']['output'];
  packages: Scalars['String']['output'];
  registry: McpRegistry;
  remotes: Maybe<Scalars['String']['output']>;
  repositoryUrl: Scalars['String']['output'];
  title: Scalars['String']['output'];
  version: Scalars['String']['output'];
};

export type McpServer = {
  __typename: 'MCPServer';
  ENV: Scalars['String']['output'];
  args: Scalars['String']['output'];
  command: Scalars['String']['output'];
  description: Scalars['String']['output'];
  headers: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  repositoryUrl: Scalars['String']['output'];
  runOn: Maybe<McpServerRunOn>;
  runtime: Maybe<Runtime>;
  serverUrl: Scalars['String']['output'];
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
  Stdio = 'STDIO',
  Stream = 'STREAM'
}

export type Mutation = {
  __typename: 'Mutation';
  callMCPTool: CallToolResult;
  createMCPRegistry: McpRegistry;
  createMCPServer: McpServer;
  createRuntime: Runtime;
  deleteMCPRegistry: McpRegistry;
  deleteMCPServer: McpServer;
  deleteMCPTool: McpTool;
  deleteRuntime: Runtime;
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


export type MutationCreateMcpRegistryArgs = {
  name: Scalars['String']['input'];
  upstreamUrl: Scalars['String']['input'];
  workspaceId: Scalars['ID']['input'];
};


export type MutationCreateMcpServerArgs = {
  ENV: Scalars['String']['input'];
  args: Scalars['String']['input'];
  command: Scalars['String']['input'];
  description: Scalars['String']['input'];
  headers?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  repositoryUrl: Scalars['String']['input'];
  runOn?: InputMaybe<McpServerRunOn>;
  serverUrl: Scalars['String']['input'];
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
  ENV: Scalars['String']['input'];
  args: Scalars['String']['input'];
  command: Scalars['String']['input'];
  description: Scalars['String']['input'];
  headers?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  repositoryUrl: Scalars['String']['input'];
  runOn?: InputMaybe<McpServerRunOn>;
  serverUrl: Scalars['String']['input'];
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

export type Query = {
  __typename: 'Query';
  fetchMCPServerConfig: Maybe<McpRegistryServer>;
  infra: Infra;
  isMCPAutoConfigEnabled: Scalars['Boolean']['output'];
  mcpRegistries: Maybe<Array<McpRegistry>>;
  mcpServers: Maybe<Array<McpServer>>;
  me: Maybe<User>;
  registry: Registry;
  searchMCPServers: Maybe<Array<McpRegistryServer>>;
  system: Maybe<System>;
  workspace: Maybe<Array<Workspace>>;
  workspaceMCPTools: Maybe<Workspace>;
};


export type QueryFetchMcpServerConfigArgs = {
  repositoryUrl: Scalars['String']['input'];
};


export type QueryMcpRegistriesArgs = {
  workspaceId: Scalars['ID']['input'];
};


export type QuerySearchMcpServersArgs = {
  query: Scalars['String']['input'];
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

export type Registry = {
  __typename: 'Registry';
  description: Scalars['String']['output'];
  servers: Maybe<Array<McpRegistryServer>>;
  version: Scalars['String']['output'];
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

export type RegisterMutationVariables = Exact<{
  input: RegisterUserInput;
}>;


export type RegisterMutation = { registerUser: { __typename: 'RegisterUserPayload', success: boolean, errors: Array<string> | null, user: { __typename: 'User', id: string, email: string } | null, tokens: { __typename: 'AuthTokens', accessToken: string, refreshToken: string } | null } };

export type RefreshTokenMutationVariables = Exact<{
  input: RefreshTokenInput;
}>;


export type RefreshTokenMutation = { refreshToken: { __typename: 'RefreshTokenPayload', success: boolean, accessToken: string, errors: Array<string> | null } };

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

export type SyncUpstreamRegistryMutationVariables = Exact<{
  registryId: Scalars['ID']['input'];
}>;


export type SyncUpstreamRegistryMutation = { syncUpstreamRegistry: { __typename: 'MCPRegistry', id: string, name: string, upstreamUrl: string, lastSyncAt: Date | null, servers: Array<{ __typename: 'MCPRegistryUpstreamServer', id: string, name: string, description: string, title: string, repositoryUrl: string, version: string, packages: string, remotes: string | null, _meta: string | null, createdAt: Date, lastSeenAt: Date }> | null } };

export type InitSystemMutationVariables = Exact<{
  email: Scalars['String']['input'];
  adminPassword: Scalars['String']['input'];
}>;


export type InitSystemMutation = { initSystem: { __typename: 'System', id: string, initialized: boolean, createdAt: Date, updatedAt: Date } };

export type GetMcpToolsQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type GetMcpToolsQuery = { workspaceMCPTools: { __typename: 'Workspace', id: string, name: string, mcpTools: Array<{ __typename: 'MCPTool', id: string, name: string, description: string, inputSchema: string, status: ActiveStatus, createdAt: Date, lastSeenAt: Date, mcpServer: { __typename: 'MCPServer', id: string, name: string } }> | null } | null };

export type GetMcpRegistriesQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type GetMcpRegistriesQuery = { mcpRegistries: Array<{ __typename: 'MCPRegistry', id: string, name: string, upstreamUrl: string, createdAt: Date, lastSyncAt: Date | null, servers: Array<{ __typename: 'MCPRegistryUpstreamServer', id: string, name: string, description: string, title: string, repositoryUrl: string, version: string, packages: string, remotes: string | null, _meta: string | null, createdAt: Date, lastSeenAt: Date }> | null }> | null };

export type GetRuntimesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRuntimesQuery = { workspace: Array<{ __typename: 'Workspace', id: string, name: string, runtimes: Array<{ __typename: 'Runtime', id: string, name: string, description: string | null, status: ActiveStatus, createdAt: Date, lastSeenAt: Date | null, capabilities: Array<string> | null, hostIP: string | null, hostname: string | null, mcpClientName: string | null }> | null }> | null };

export type GetWorkspacesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetWorkspacesQuery = { workspace: Array<{ __typename: 'Workspace', id: string, name: string, createdAt: Date }> | null, system: { __typename: 'System', id: string, defaultWorkspace: { __typename: 'Workspace', id: string, name: string } | null } | null };

export type SubscribeMcpRegistriesSubscriptionVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type SubscribeMcpRegistriesSubscription = { mcpRegistries: Array<{ __typename: 'MCPRegistry', id: string, name: string, upstreamUrl: string, createdAt: Date, lastSyncAt: Date | null, servers: Array<{ __typename: 'MCPRegistryUpstreamServer', id: string, name: string, description: string, title: string, repositoryUrl: string, version: string, packages: string, remotes: string | null, _meta: string | null, createdAt: Date, lastSeenAt: Date }> | null }> | null };


export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tokens"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Logout"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LogoutInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const RegisterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Register"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RegisterUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registerUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tokens"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"}}]}}]}}]} as unknown as DocumentNode<RegisterMutation, RegisterMutationVariables>;
export const RefreshTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RefreshToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RefreshTokenInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refreshToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"errors"}}]}}]}}]} as unknown as DocumentNode<RefreshTokenMutation, RefreshTokenMutationVariables>;
export const CreateMcpRegistryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateMCPRegistry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"upstreamUrl"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMCPRegistry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"upstreamUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"upstreamUrl"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"upstreamUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSyncAt"}}]}}]}}]} as unknown as DocumentNode<CreateMcpRegistryMutation, CreateMcpRegistryMutationVariables>;
export const DeleteMcpRegistryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMCPRegistry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMCPRegistry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<DeleteMcpRegistryMutation, DeleteMcpRegistryMutationVariables>;
export const SyncUpstreamRegistryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SyncUpstreamRegistry"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"registryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncUpstreamRegistry"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"registryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"registryId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"upstreamUrl"}},{"kind":"Field","name":{"kind":"Name","value":"lastSyncAt"}},{"kind":"Field","name":{"kind":"Name","value":"servers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"packages"}},{"kind":"Field","name":{"kind":"Name","value":"remotes"}},{"kind":"Field","name":{"kind":"Name","value":"_meta"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]}}]}}]} as unknown as DocumentNode<SyncUpstreamRegistryMutation, SyncUpstreamRegistryMutationVariables>;
export const InitSystemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InitSystem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"adminPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"initSystem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"adminPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"adminPassword"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"initialized"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<InitSystemMutation, InitSystemMutationVariables>;
export const GetMcpToolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMCPTools"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaceMCPTools"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mcpTools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inputSchema"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"mcpServer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetMcpToolsQuery, GetMcpToolsQueryVariables>;
export const GetMcpRegistriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMCPRegistries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mcpRegistries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"upstreamUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSyncAt"}},{"kind":"Field","name":{"kind":"Name","value":"servers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"packages"}},{"kind":"Field","name":{"kind":"Name","value":"remotes"}},{"kind":"Field","name":{"kind":"Name","value":"_meta"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetMcpRegistriesQuery, GetMcpRegistriesQueryVariables>;
export const GetRuntimesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRuntimes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"runtimes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}},{"kind":"Field","name":{"kind":"Name","value":"capabilities"}},{"kind":"Field","name":{"kind":"Name","value":"hostIP"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"mcpClientName"}}]}}]}}]}}]} as unknown as DocumentNode<GetRuntimesQuery, GetRuntimesQueryVariables>;
export const GetWorkspacesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"system"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"defaultWorkspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetWorkspacesQuery, GetWorkspacesQueryVariables>;
export const SubscribeMcpRegistriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeMCPRegistries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mcpRegistries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workspaceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workspaceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"upstreamUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSyncAt"}},{"kind":"Field","name":{"kind":"Name","value":"servers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"repositoryUrl"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"packages"}},{"kind":"Field","name":{"kind":"Name","value":"remotes"}},{"kind":"Field","name":{"kind":"Name","value":"_meta"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]}}]}}]} as unknown as DocumentNode<SubscribeMcpRegistriesSubscription, SubscribeMcpRegistriesSubscriptionVariables>;