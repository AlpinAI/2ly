import { createContext } from 'react';
import { apolloResolversTypes } from '@2ly/common';

export interface WorkspaceContextType {
    system: apolloResolversTypes.System | null;
    infra: apolloResolversTypes.Infra | null;
    workspaces: apolloResolversTypes.Workspace[];
    currentWorkspace: apolloResolversTypes.Workspace | null;
    runtimes: apolloResolversTypes.Runtime[];
    loading: boolean;
    setCurrentWorkspace: (workspace: apolloResolversTypes.Workspace) => void;
    error: string | null;
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);
