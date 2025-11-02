export interface RootIdentity {
  id: string | null;
  RID: string | null;
  processId: string;
  workspaceId: string;
  name: string;
  version: string;
  hostIP: string;
  hostname: string;
  metadata: Record<string, unknown>;
}
