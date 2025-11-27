export type RootIdentity =
  | {
      nature: 'runtime';
      id: string | null;
      name: string | null;
      workspaceId: string | null;
    }
  | {
      nature: 'toolset';
      id: string | null;
      name: string | null;
      workspaceId: string;
    };
