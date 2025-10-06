import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
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

export type McpRegistry2lyMetadata = {
  registryVersion: Scalars['String']['output'];
};

export type McpRegistryServer = {
  ENV?: Maybe<Scalars['String']['output']>;
  _2ly: McpRegistry2lyMetadata;
  args?: Maybe<Scalars['String']['output']>;
  command?: Maybe<Scalars['String']['output']>;
  config: Scalars['String']['output'];
  description: Scalars['String']['output'];
  headers?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  repositoryUrl: Scalars['String']['output'];
  serverUrl?: Maybe<Scalars['String']['output']>;
  transport: McpTransportType;
};

export type McpServer = {
  ENV: Scalars['String']['output'];
  args: Scalars['String']['output'];
  command: Scalars['String']['output'];
  description: Scalars['String']['output'];
  headers?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  repositoryUrl: Scalars['String']['output'];
  runOn?: Maybe<McpServerRunOn>;
  runtime?: Maybe<Runtime>;
  serverUrl: Scalars['String']['output'];
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
  Stdio = 'STDIO',
  Stream = 'STREAM'
}

export type Mutation = {
  callMCPTool: CallToolResult;
  createMCPServer: McpServer;
  createRuntime: Runtime;
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
  fetchMCPServerConfig?: Maybe<McpRegistryServer>;
  infra: Infra;
  isMCPAutoConfigEnabled: Scalars['Boolean']['output'];
  mcpServers?: Maybe<Array<McpServer>>;
  me?: Maybe<User>;
  registry: Registry;
  searchMCPServers?: Maybe<Array<McpRegistryServer>>;
  system?: Maybe<System>;
  workspace?: Maybe<Array<Workspace>>;
  workspaceMCPTools?: Maybe<Workspace>;
};


export type QueryFetchMcpServerConfigArgs = {
  repositoryUrl: Scalars['String']['input'];
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

export type Registry = {
  description: Scalars['String']['output'];
  servers?: Maybe<Array<McpRegistryServer>>;
  version: Scalars['String']['output'];
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
  mcpTools?: Maybe<Array<Maybe<McpTool>>>;
  runtimes?: Maybe<Array<Runtime>>;
  toolCalls?: Maybe<Array<ToolCall>>;
  workspaces?: Maybe<Array<Workspace>>;
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

export enum ToolCallStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING'
}

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
  defaultTestingRuntime?: Maybe<Runtime>;
  globalRuntime?: Maybe<Runtime>;
  id: Scalars['ID']['output'];
  mcpServers?: Maybe<Array<McpServer>>;
  mcpTools?: Maybe<Array<McpTool>>;
  name: Scalars['String']['output'];
  runtimes?: Maybe<Array<Runtime>>;
};

export type GetMcpToolsQueryVariables = Exact<{
  workspaceId: Scalars['ID']['input'];
}>;


export type GetMcpToolsQuery = { workspaceMCPTools?: { id: string, name: string, mcpTools?: Array<{ id: string, name: string, description: string, inputSchema: string, status: ActiveStatus, createdAt: Date, lastSeenAt: Date, mcpServer: { id: string, name: string } }> | null } | null };

export type GetRuntimesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRuntimesQuery = { workspace?: Array<{ id: string, name: string, runtimes?: Array<{ id: string, name: string, description?: string | null, status: ActiveStatus, createdAt: Date, lastSeenAt?: Date | null, capabilities?: Array<string> | null, hostIP?: string | null, hostname?: string | null, mcpClientName?: string | null }> | null }> | null };

export type GetWorkspacesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetWorkspacesQuery = { workspace?: Array<{ id: string, name: string, createdAt: Date }> | null, system?: { id: string, defaultWorkspace?: { id: string, name: string } | null } | null };


export const GetMcpToolsDocument = gql`
    query GetMCPTools($workspaceId: ID!) {
  workspaceMCPTools(workspaceId: $workspaceId) {
    id
    name
    mcpTools {
      id
      name
      description
      inputSchema
      status
      createdAt
      lastSeenAt
      mcpServer {
        id
        name
      }
    }
  }
}
    `;

/**
 * __useGetMcpToolsQuery__
 *
 * To run a query within a React component, call `useGetMcpToolsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMcpToolsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMcpToolsQuery({
 *   variables: {
 *      workspaceId: // value for 'workspaceId'
 *   },
 * });
 */
export function useGetMcpToolsQuery(baseOptions: Apollo.QueryHookOptions<GetMcpToolsQuery, GetMcpToolsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetMcpToolsQuery, GetMcpToolsQueryVariables>(GetMcpToolsDocument, options);
      }
export function useGetMcpToolsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetMcpToolsQuery, GetMcpToolsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetMcpToolsQuery, GetMcpToolsQueryVariables>(GetMcpToolsDocument, options);
        }
export type GetMcpToolsQueryHookResult = ReturnType<typeof useGetMcpToolsQuery>;
export type GetMcpToolsLazyQueryHookResult = ReturnType<typeof useGetMcpToolsLazyQuery>;
export type GetMcpToolsQueryResult = Apollo.QueryResult<GetMcpToolsQuery, GetMcpToolsQueryVariables>;
export const GetRuntimesDocument = gql`
    query GetRuntimes {
  workspace {
    id
    name
    runtimes {
      id
      name
      description
      status
      createdAt
      lastSeenAt
      capabilities
      hostIP
      hostname
      mcpClientName
    }
  }
}
    `;

/**
 * __useGetRuntimesQuery__
 *
 * To run a query within a React component, call `useGetRuntimesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetRuntimesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetRuntimesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetRuntimesQuery(baseOptions?: Apollo.QueryHookOptions<GetRuntimesQuery, GetRuntimesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetRuntimesQuery, GetRuntimesQueryVariables>(GetRuntimesDocument, options);
      }
export function useGetRuntimesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetRuntimesQuery, GetRuntimesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetRuntimesQuery, GetRuntimesQueryVariables>(GetRuntimesDocument, options);
        }
export type GetRuntimesQueryHookResult = ReturnType<typeof useGetRuntimesQuery>;
export type GetRuntimesLazyQueryHookResult = ReturnType<typeof useGetRuntimesLazyQuery>;
export type GetRuntimesQueryResult = Apollo.QueryResult<GetRuntimesQuery, GetRuntimesQueryVariables>;
export const GetWorkspacesDocument = gql`
    query GetWorkspaces {
  workspace {
    id
    name
    createdAt
  }
  system {
    id
    defaultWorkspace {
      id
      name
    }
  }
}
    `;

/**
 * __useGetWorkspacesQuery__
 *
 * To run a query within a React component, call `useGetWorkspacesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWorkspacesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWorkspacesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetWorkspacesQuery(baseOptions?: Apollo.QueryHookOptions<GetWorkspacesQuery, GetWorkspacesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetWorkspacesQuery, GetWorkspacesQueryVariables>(GetWorkspacesDocument, options);
      }
export function useGetWorkspacesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetWorkspacesQuery, GetWorkspacesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetWorkspacesQuery, GetWorkspacesQueryVariables>(GetWorkspacesDocument, options);
        }
export type GetWorkspacesQueryHookResult = ReturnType<typeof useGetWorkspacesQuery>;
export type GetWorkspacesLazyQueryHookResult = ReturnType<typeof useGetWorkspacesLazyQuery>;
export type GetWorkspacesQueryResult = Apollo.QueryResult<GetWorkspacesQuery, GetWorkspacesQueryVariables>;