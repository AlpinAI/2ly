import { useWorkspace } from './useWorkspace';

export function useRequiredWorkspace() {
  const { currentWorkspace, ...rest } = useWorkspace();
  if (!currentWorkspace) {
    throw new Error('Workspace is required but not found in context');
  }
  return { currentWorkspace, ...rest };
}
