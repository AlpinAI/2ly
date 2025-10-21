import { gql } from '@apollo/client/core';

export const REGISTRY_QUERY = gql`
  query GetRegistry {
    registry {
      version
      description
      servers {
        name
        description
        repositoryUrl
        transport
        config
      }
    }
  }
`;

export const SEARCH_MCP_SERVERS_QUERY = gql`
  query SearchMCPServers($query: String!) {
    searchMCPServers(query: $query) {
      name
      description
      repositoryUrl
      transport
      config
      runOn
    }
  }
`;

export const FETCH_MCP_SERVER_CONFIG_QUERY = gql`
  query FetchMCPServerConfig($repositoryUrl: String!) {
    fetchMCPServerConfig(repositoryUrl: $repositoryUrl) {
      name
      description
      repositoryUrl
      transport
      config
      runOn
    }
  }
`;

export const IS_MCP_AUTO_CONFIG_ENABLED_QUERY = gql`
  query IsMCPAutoConfigEnabled {
    isMCPAutoConfigEnabled
  }
`;
