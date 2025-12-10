import { gql } from 'urql';

export const CREATE_SESSION = gql`
  mutation createSession(
    $refreshToken: String!
    $userId: String!
    $deviceInfo: String
    $ipAddress: String
    $userAgent: String
    $now: DateTime!
    $expiresAt: DateTime!
  ) {
    addSession(
      input: {
        refreshToken: $refreshToken
        userId: $userId
        deviceInfo: $deviceInfo
        ipAddress: $ipAddress
        userAgent: $userAgent
        createdAt: $now
        lastUsedAt: $now
        expiresAt: $expiresAt
        isActive: true
      }
    ) {
      session {
        id
        refreshToken
        userId
        deviceInfo
        ipAddress
        userAgent
        createdAt
        expiresAt
        lastUsedAt
        isActive
      }
    }
  }
`;

export const FIND_SESSION_BY_REFRESH_TOKEN = gql`
  query findSessionByRefreshToken($refreshToken: String!) {
    querySession(filter: { refreshToken: { eq: $refreshToken }, isActive: true }) {
      id
      refreshToken
      userId
      deviceInfo
      ipAddress
      userAgent
      createdAt
      expiresAt
      lastUsedAt
      isActive
    }
  }
`;

export const UPDATE_SESSION_LAST_USED = gql`
  mutation updateSessionLastUsed($id: ID!, $now: DateTime!) {
    updateSession(input: { filter: { id: [$id] }, set: { lastUsedAt: $now } }) {
      session {
        id
        lastUsedAt
      }
    }
  }
`;

export const DEACTIVATE_SESSION = gql`
  mutation deactivateSession($id: ID!) {
    updateSession(input: { filter: { id: [$id] }, set: { isActive: false } }) {
      session {
        id
        isActive
      }
    }
  }
`;

export const DEACTIVATE_USER_SESSIONS = gql`
  mutation deactivateUserSessions($userId: String!) {
    updateSession(input: { filter: { userId: { eq: $userId }, isActive: true }, set: { isActive: false } }) {
      session {
        id
        userId
        isActive
      }
    }
  }
`;

export const CLEANUP_EXPIRED_SESSIONS = gql`
  mutation cleanupExpiredSessions($now: DateTime!) {
    updateSession(input: { filter: { expiresAt: { lt: $now } }, set: { isActive: false } }) {
      session {
        id
        expiresAt
        isActive
      }
    }
  }
`;

export const GET_USER_ACTIVE_SESSIONS = gql`
  query getUserActiveSessions($userId: String!) {
    querySession(
      filter: { userId: { eq: $userId }, isActive: true }
      order: { desc: lastUsedAt }
    ) {
      id
      deviceInfo
      ipAddress
      userAgent
      createdAt
      lastUsedAt
      expiresAt
    }
  }
`;