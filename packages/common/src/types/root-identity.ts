export type RootIdentity =
  | {
      nature: 'runtime';
      id: string | null;
      name: string | null;
      workspaceId: string | null;
    }
  | {
      nature: 'skill';
      id: string | null;
      name: string | null;
      workspaceId: string;
    };
