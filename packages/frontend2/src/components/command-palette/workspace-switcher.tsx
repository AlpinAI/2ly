/**
 * WorkspaceSwitcher Component
 *
 * WHY: Command palette for switching between workspaces using Cmd/Ctrl+K.
 * Uses cmdk library with Radix UI Dialog for accessible keyboard navigation.
 *
 * FEATURES:
 * - Keyboard shortcut: Cmd/Ctrl+K
 * - Fuzzy search through workspaces
 * - Navigate to workspace on selection
 * - Shows current workspace
 *
 * USAGE:
 * ```tsx
 * <WorkspaceSwitcher />
 * ```
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { Command } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { GetWorkspacesDocument, type GetWorkspacesQuery } from '@/graphql/generated/graphql';

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const currentWorkspaceId = useWorkspaceId();

  const { data, loading } = useQuery(GetWorkspacesDocument);

  // Register keyboard shortcut (Cmd/Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectWorkspace = (workspaceId: string) => {
    navigate(`/w/${workspaceId}/overview`);
    setOpen(false);
  };

  const workspaces = data?.workspace || [];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[550px] translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white p-0 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:border-gray-700 dark:bg-gray-800">
          <Dialog.Title className="sr-only">Switch Workspace</Dialog.Title>
          <Command className="rounded-lg" shouldFilter={true}>
            <div className="border-b border-gray-200 px-3 dark:border-gray-700">
              <Command.Input
                placeholder="Switch workspace..."
                className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-gray-400"
              />
            </div>
            <Command.List className="max-h-[400px] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {loading ? 'Loading workspaces...' : 'No workspaces found.'}
              </Command.Empty>

              <Command.Group heading="Workspaces" className="mb-2">
                {workspaces.map((workspace: NonNullable<GetWorkspacesQuery['workspace']>[number]) => (
                  <Command.Item
                    key={workspace.id}
                    value={workspace.name}
                    onSelect={() => handleSelectWorkspace(workspace.id)}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none data-[selected=true]:bg-blue-100 data-[selected=true]:text-blue-900 dark:data-[selected=true]:bg-blue-900 dark:data-[selected=true]:text-blue-100"
                  >
                    <div className="flex flex-1 items-center gap-2">
                      <span className="font-medium">{workspace.name}</span>
                      {workspace.id === currentWorkspaceId && (
                        <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                          Current
                        </span>
                      )}
                      {workspace.id === data?.system?.defaultWorkspace?.id && (
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          Default
                        </span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>

            <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Press <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-700">⌘K</kbd> to
              toggle
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
