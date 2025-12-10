/**
 * @deprecated This file is deprecated. Use generated typed documents from '../../generated/dgraph'
 * instead. The .graphql files in this directory are the source of truth.
 *
 * This file will be removed once all consumers have migrated to the typed documents.
 */
import { gql } from 'urql';

export const ADD_USER = gql`
  mutation addUser($email: String!, $password: String!, $now: DateTime!) {
    addUser(input: { email: $email, password: $password, createdAt: $now, updatedAt: $now }) {
      user {
        id
        email
        createdAt
      }
    }
  }
`;

export const UPDATE_USER_EMAIL = gql`
  mutation updateUserEmail($id: ID!, $email: String!) {
    updateUser(input: { filter: { id: [$id] }, set: { email: $email } }) {
      user {
        id
        email
      }
    }
  }
`;

export const UPDATE_USER_PASSWORD = gql`
  mutation updateUserPassword($id: ID!, $password: String!, $now: DateTime!) {
    updateUser(input: { filter: { id: [$id] }, set: { password: $password, updatedAt: $now } }) {
      user {
        id
        email
      }
    }
  }
`;

export const ADD_ADMIN_TO_WORKSPACE = gql`
  mutation updateUser($userId: ID!, $workspaceId: ID!) {
    updateUser(input: { filter: { id: [$userId] }, set: { adminOfWorkspaces: { id: $workspaceId } } }) {
      user {
        id
        email
      }
    }
  }
`;

export const ADD_MEMBER_TO_WORKSPACE = gql`
  mutation updateUser($userId: ID!, $workspaceId: ID!) {
    updateUser(input: { filter: { id: [$userId] }, set: { membersOfWorkspaces: { id: $workspaceId } } }) {
      user {
        id
        email
      }
    }
  }
`;

export const FIND_USER_BY_EMAIL = gql`
  query findUserByEmail($email: String!) {
    queryUser(filter: { email: { eq: $email } }) {
      id
      email
      password
      createdAt
      updatedAt
      lastLoginAt
      failedLoginAttempts
      lockedUntil
      adminOfWorkspaces {
        id
        name
      }
      membersOfWorkspaces {
        id
        name
      }
    }
  }
`;

export const UPDATE_USER_LAST_LOGIN = gql`
  mutation updateUserLastLogin($id: ID!, $now: DateTime!) {
    updateUser(input: { filter: { id: [$id] }, set: { lastLoginAt: $now, failedLoginAttempts: 0 } }) {
      user {
        id
        email
        lastLoginAt
      }
    }
  }
`;

export const INCREMENT_FAILED_LOGIN_ATTEMPTS = gql`
  mutation incrementFailedLoginAttempts($id: ID!, $attempts: Int!, $lockedUntil: DateTime) {
    updateUser(input: { filter: { id: [$id] }, set: { failedLoginAttempts: $attempts, lockedUntil: $lockedUntil } }) {
      user {
        id
        email
        failedLoginAttempts
        lockedUntil
      }
    }
  }
`;

export const UNLOCK_USER_ACCOUNT = gql`
  mutation unlockUserAccount($id: ID!) {
    updateUser(input: { filter: { id: [$id] }, set: { failedLoginAttempts: 0, lockedUntil: null } }) {
      user {
        id
        email
        failedLoginAttempts
        lockedUntil
      }
    }
  }
`;

export const FIND_USER_BY_ID = gql`
  query findUserById($id: ID!) {
    getUser(id: $id) {
      id
      email
    }
  }
`;
