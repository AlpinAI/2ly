/**
 * Authentication GraphQL Mutations
 *
 * WHY: Centralized auth mutations for login, logout, register, etc.
 */

import { gql } from '@apollo/client';

/**
 * Login Mutation
 *
 * WHY: Authenticate user with email/password, get tokens.
 */
export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      success
      user {
        id
        email
      }
      tokens {
        accessToken
        refreshToken
      }
      errors
    }
  }
`;

/**
 * Logout Mutation
 *
 * WHY: Invalidate refresh token on server.
 */
export const LOGOUT_MUTATION = gql`
  mutation Logout($input: LogoutInput!) {
    logout(input: $input)
  }
`;

/**
 * Register Mutation
 *
 * WHY: Create new user account.
 */
export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterUserInput!) {
    registerUser(input: $input) {
      success
      user {
        id
        email
      }
      tokens {
        accessToken
        refreshToken
      }
      errors
    }
  }
`;

/**
 * Refresh Token Mutation
 *
 * WHY: Get new access token using refresh token.
 */
export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($input: RefreshTokenInput!) {
    refreshToken(input: $input) {
      success
      accessToken
      errors
    }
  }
`;
