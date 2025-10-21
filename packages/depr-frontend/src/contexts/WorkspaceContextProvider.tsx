import React, { useState, useEffect } from 'react';
import { gql, useSubscription } from '@apollo/client';
import { client, observe } from '../services/apollo.client';
import { apolloResolversTypes } from '@2ly/common';
import { RUNTIMES_SUBSCRIPTION } from '../graphql';
import { WorkspaceContext } from './WorkspaceContext';

const WORKSPACES_SUBSCRIPTION = gql`
  subscription {
    workspaces {
      id
      name
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
`;

const SYSTEM_QUERY = gql`
  query {
    system {
      id
      initialized
      defaultWorkspace {
        id
        name
      }
    }
  }
`;

const INFRA_QUERY = gql`
  query {
    infra {
      nats
    }
  }
`;

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [system, setSystem] = useState<apolloResolversTypes.System | null>(null);
  const [infra, setInfra] = useState<apolloResolversTypes.Infra | null>(null);
  const [workspaces, setWorkspaces] = useState<apolloResolversTypes.Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<apolloResolversTypes.Workspace | null>(null);
  const [loadingSystem, setLoadingSystem] = useState(true);
  const [loadingInfra, setLoadingInfra] = useState(true);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [loadingRuntimes, setLoadingRuntimes] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runtimes, setRuntimes] = useState<apolloResolversTypes.Runtime[]>([]);
  // Subscribe to workspaces for real-time updates
  const { data: workspacesData, error: workspacesError } = useSubscription(WORKSPACES_SUBSCRIPTION);

  // Fetch system data on mount
  useEffect(() => {
    const fetchSystem = async () => {
      try {
        const response = await client.query<{
          system: apolloResolversTypes.System;
        }>({
          query: SYSTEM_QUERY,
        });
        setSystem(response.data.system);
      } catch (error) {
        console.error('Failed to fetch system:', error);
        setError('Failed to fetch system data, is the backend running?');
      } finally {
        setLoadingSystem(false);
      }
    };
    fetchSystem();
  }, []);

  // Fetch infra data on mount
  useEffect(() => {
    const fetchInfra = async () => {
      try {
        const response = await client.query<{
          infra: apolloResolversTypes.Infra;
        }>({
          query: INFRA_QUERY,
        });
        setInfra(response.data.infra);
      } catch (error) {
        console.error('Failed to fetch infra:', error);
        setError('Failed to fetch infra data, is the backend running?');
      } finally {
        setLoadingInfra(false);
      }
    };
    fetchInfra();
  }, []);

  // Update workspaces when subscription data changes
  useEffect(() => {
    if (workspacesData?.workspaces) {
      const fetchedWorkspaces = workspacesData.workspaces;
      setWorkspaces(fetchedWorkspaces);

      // Set current workspace if none is selected and workspaces are available
      if (fetchedWorkspaces.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(fetchedWorkspaces[0]);
      }

      // Update globalRuntime and defaultTestingRuntime if necessary
      if (currentWorkspace) {
        const fetchedWorkspace = fetchedWorkspaces.find((workspace: apolloResolversTypes.Workspace) => workspace.id === currentWorkspace.id);
        const globalRuntime = fetchedWorkspace?.globalRuntime;
        const defaultTestingRuntime = fetchedWorkspace?.defaultTestingRuntime;
        if (currentWorkspace.defaultTestingRuntime?.id !== defaultTestingRuntime?.id || currentWorkspace.globalRuntime?.id !== globalRuntime?.id) {
          setCurrentWorkspace(fetchedWorkspace);
        }
      }
      setLoadingWorkspaces(false);
    }
  }, [workspacesData, currentWorkspace]);

  // Handle subscription errors
  useEffect(() => {
    if (workspacesError) {
      console.error('Workspaces subscription error:', workspacesError);
      setError('Failed to subscribe to workspace updates');
    }
  }, [workspacesError]);

  // Subscribe to current workspace runtimes
  useEffect(() => {
    if (!currentWorkspace) {
      setRuntimes([]);
      return;
    }
    const subscription = observe<{ runtimes: apolloResolversTypes.Runtime[] }>({
      query: RUNTIMES_SUBSCRIPTION,
      variables: { workspaceId: currentWorkspace.id },
    });

    const subscription$ = subscription.subscribe({
      next: (data) => {
        setRuntimes(data.runtimes);
        setLoadingRuntimes(false);
      },
    });

    return () => {
      subscription$.unsubscribe();
    };
  }, [currentWorkspace]);

  useEffect(() => {
    setLoading(loadingSystem || loadingWorkspaces || loadingRuntimes || loadingInfra);
  }, [loadingSystem, loadingWorkspaces, loadingRuntimes, loadingInfra]);

  return (
    <WorkspaceContext.Provider value={{ system, workspaces, currentWorkspace, runtimes, loading, setCurrentWorkspace, error, infra }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
