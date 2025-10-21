/**
 * Authentication GraphQL Operations
 *
 * Contains all GraphQL queries and mutations related to authentication,
 * user management, and system initialization.
 */

import { gql } from '@apollo/client/core';

// Authentication Mutations

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        createdAt
        lastLoginAt
        adminOfWorkspaces {
          id
          name
        }
        membersOfWorkspaces {
          id
          name
        }
      }
      accessToken
      refreshToken
      expiresIn
    }
  }
`;

export const REGISTER_USER_MUTATION = gql`
  mutation RegisterUser($input: RegisterUserInput!) {
    registerUser(input: $input) {
      success
      user {
        id
        email
        createdAt
        adminOfWorkspaces {
          id
          name
        }
        membersOfWorkspaces {
          id
          name
        }
      }
      tokens {
        accessToken
        refreshToken
      }
      errors
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($input: RefreshTokenInput!) {
    refreshToken(input: $input) {
      success
      accessToken
      errors
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout($input: LogoutInput!) {
    logout(input: $input)
  }
`;

export const INIT_SYSTEM_MUTATION = gql`
  mutation InitSystem($adminPassword: String!, $email: String!) {
    initSystem(adminPassword: $adminPassword, email: $email) {
      id
      initialized
      createdAt
      updatedAt
      defaultWorkspace {
        id
        name
        createdAt
      }
    }
  }
`;

// Authentication Queries

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      createdAt
      lastLoginAt
      adminOfWorkspaces {
        id
        name
        createdAt
        globalRuntime {
          id
          name
        }
        defaultTestingRuntime {
          id
          name
        }
      }
      membersOfWorkspaces {
        id
        name
        createdAt
        globalRuntime {
          id
          name
        }
        defaultTestingRuntime {
          id
          name
        }
      }
    }
  }
`;

export const SYSTEM_STATUS_QUERY = gql`
  query SystemStatus {
    system {
      id
      initialized
      createdAt
      updatedAt
      defaultWorkspace {
        id
        name
        createdAt
      }
    }
  }
`;

// TypeScript types for GraphQL variables and responses

export interface LoginInput {
  email: string;
  password: string;
  deviceInfo?: string;
}

export interface RegisterUserInput {
  email: string;
  password: string;
  deviceInfo?: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface LogoutInput {
  refreshToken: string;
}

export interface InitSystemInput {
  adminPassword: string;
  email: string;
}

// Response Types

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  lastLoginAt?: string;
  adminOfWorkspaces: Workspace[];
  membersOfWorkspaces: Workspace[];
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  globalRuntime?: Runtime;
  defaultTestingRuntime?: Runtime;
}

export interface Runtime {
  id: string;
  name: string;
}

export interface System {
  id: string;
  name?: string;
  description?: string;
  initialized: boolean;
  createdAt: string;
  updatedAt: string;
  defaultWorkspace?: Workspace;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  login: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface RegisterUserResponse {
  registerUser: {
    success: boolean;
    user?: User;
    tokens?: AuthTokens;
    errors?: string[];
  };
}

export interface RefreshTokenResponse {
  refreshToken: {
    success: boolean;
    accessToken?: string;
    errors?: string[];
  };
}

export interface LogoutResponse {
  logout: boolean;
}

export interface InitSystemResponse {
  initSystem: System;
}

export interface MeResponse {
  me: User;
}

export interface SystemStatusResponse {
  system: System | null;
}

// Mutation Variables Types

export interface LoginVariables {
  input: LoginInput;
}

export interface RegisterUserVariables {
  input: RegisterUserInput;
}

export interface RefreshTokenVariables {
  input: RefreshTokenInput;
}

export interface LogoutVariables {
  input: LogoutInput;
}

export interface InitSystemVariables {
  adminPassword: string;
  email: string;
}