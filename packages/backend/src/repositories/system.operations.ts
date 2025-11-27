import { gql } from 'urql';

export const CREATE_SYSTEM = gql`
  mutation createSystem($adminId: ID!, $now: DateTime!, $instanceId: String!) {
    addSystem(input: {
      createdAt: $now,
      updatedAt: $now,
      initialized: false,
      instanceId: $instanceId,
      admins: { id: $adminId }
    }) {
      system {
        id
        initialized
        createdAt
        updatedAt
        instanceId
        admins {
          id
          email
        }
      }
    }
  }
`;

export const QUERY_SYSTEM = gql`
  query getSystem {
    querySystem {
      id
      initialized
      createdAt
      updatedAt
      instanceId
      defaultWorkspace {
        id
        name
        createdAt
      }
      admins {
        id
        email
      }
    }
  }
`;

export const SET_DEFAULT_WORKSPACE = gql`
  mutation setDefaultWorkspace($systemId: ID!, $workspaceId: ID!) {
    updateSystem(input: { filter: { id: [$systemId] }, set: { defaultWorkspace: { id: $workspaceId } } }) {
      system {
        id
        instanceId
        defaultWorkspace {
          id
          name
        }
        admins {
          id
          email
        }
      }
    }
  }
`;

export const INIT_SYSTEM = gql`
  mutation initSystem($systemId: ID!, $now: DateTime!) {
    updateSystem(input: { filter: { id: [$systemId] }, set: { initialized: true, updatedAt: $now } }) {
      system {
        id
        initialized
        createdAt
        updatedAt
        instanceId
        defaultWorkspace {
          id
          name
          createdAt
        }
        admins {
          id
          email
        }
      }
    }
  }
`;

export const QUERY_SYSTEM_WITH_DEFAULT_WORKSPACE = gql`
  query getSystemWithDefaultWorkspace {
    querySystem {
      id
      initialized
      createdAt
      updatedAt
      instanceId
      defaultWorkspace {
        id
        name
        createdAt
        globalRuntime {
          id
          name
          status
        }
      }
      admins {
        id
        email
      }
    }
  }
`;
