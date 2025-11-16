export interface RootIdentity {
  nature: 'runtime' | 'toolset';
  id: string | null;
  name: string | null;
  workspaceId: string;
}
