/**
 * CommandPalette Component
 *
 * WHY: Unified command palette activated by Cmd/Ctrl+K that provides multiple functions:
 * - Search (default)
 * - Switch workspace
 * - Change theme
 *
 * FEATURES:
 * - Keyboard shortcut: Cmd/Ctrl+K
 * - Multi-mode interface with navigation between functions
 * - Fuzzy search and keyboard navigation
 * - Integrated with cmdk library and Radix UI Dialog
 *
 * USAGE:
 * ```tsx
 * <CommandPalette />
 * ```
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, Layers, Palette, Moon, Sun, Check, Plus, FolderPlus, Database } from 'lucide-react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useUIStore, useCreateToolsetDialog, useManageToolsDialog } from '@/stores/uiStore';
import { GetWorkspacesDocument, type GetWorkspacesQuery } from '@/graphql/generated/graphql';

type CommandMode = 'main' | 'search' | 'workspace' | 'theme';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CommandMode>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const currentWorkspaceId = useWorkspaceId();
  const { theme, setTheme } = useTheme();
  const setAddSourceWorkflowOpen = useUIStore((state) => state.setAddSourceWorkflowOpen);
  const setAddServerWorkflowOpen = useUIStore((state) => state.setAddServerWorkflowOpen);
  const { openDialog: openCreateToolsetDialog } = useCreateToolsetDialog();

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

  // Reset to main mode when opening
  useEffect(() => {
    if (open) {
      setMode('main');
      setSearchQuery('');
    }
  }, [open]);

  const handleSelectWorkspace = (workspaceId: string) => {
    navigate(`/w/${workspaceId}/overview`);
    setOpen(false);
  };

  const handleSelectTheme = (selectedTheme: 'light' | 'dark') => {
    setTheme(selectedTheme);
    setOpen(false);
  };

  const handleAddSource = () => {
    setAddSourceWorkflowOpen(true);
    setOpen(false);
  };

  const handleAddServer = () => {
    setAddServerWorkflowOpen(true);
    setOpen(false);
  };

  const manageToolsDialog = useManageToolsDialog();
  const handleCreateToolSet = () => {
    openCreateToolsetDialog((toolSetId: string) => {
      manageToolsDialog.setSelectedToolsetId(toolSetId);
      manageToolsDialog.setOpen(true);
    });
    setOpen(false);
  };

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Search query:', searchQuery);
    setOpen(false);
  };

  const workspaces = data?.workspaces || [];

  const getPlaceholder = () => {
    switch (mode) {
      case 'search':
        return 'Search...';
      case 'workspace':
        return 'Search workspaces...';
      case 'theme':
        return 'Choose theme...';
      default:
        return 'Type a command or search...';
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'search':
        return 'Search';
      case 'workspace':
        return 'Switch Workspace';
      case 'theme':
        return 'Change Theme';
      default:
        return 'Command Palette';
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[640px] translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white p-0 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:border-gray-700 dark:bg-gray-800">
          <Dialog.Title className="sr-only">{getTitle()}</Dialog.Title>
          <Command className="rounded-lg" shouldFilter={true}>
            <CommandInput
              placeholder={getPlaceholder()}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="max-h-[400px] p-2">
              <CommandEmpty>
                {loading ? 'Loading...' : 'No results found.'}
              </CommandEmpty>

              {/* Main Mode - Show all commands */}
              {mode === 'main' && (
                <CommandGroup heading="Commands" className="mb-2">
                  <CommandItem
                    value="search"
                    onSelect={() => setMode('search')}
                    className="gap-3 cursor-pointer"
                  >
                    <Search className="h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">Search</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Find anything...</span>
                    </div>
                  </CommandItem>

                  <CommandItem
                    value="workspace"
                    onSelect={() => setMode('workspace')}
                    className="gap-3 cursor-pointer"
                  >
                    <Layers className="h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">Switch Workspace</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Change your workspace</span>
                    </div>
                  </CommandItem>

                  <CommandItem
                    value="add-source"
                    onSelect={handleAddSource}
                    className="gap-3 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">Add Source</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Browse and add sources</span>
                    </div>
                  </CommandItem>

                  <CommandItem
                    value="add-mcp-server"
                    onSelect={handleAddServer}
                    className="gap-3 cursor-pointer"
                  >
                    <Database className="h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">Add MCP Server</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Add server to private registry</span>
                    </div>
                  </CommandItem>

                  <CommandItem
                    value="new-tool-set"
                    onSelect={handleCreateToolSet}
                    className="gap-3 cursor-pointer"
                  >
                    <FolderPlus className="h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">New Tool Set</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Create a new tool set</span>
                    </div>
                  </CommandItem>

                  <CommandItem
                    value="theme"
                    onSelect={() => setMode('theme')}
                    className="gap-3 cursor-pointer"
                  >
                    <Palette className="h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">Change Theme</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Toggle dark/light mode</span>
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}

              {/* Search Mode */}
              {mode === 'search' && (
                <CommandGroup heading="Search Results" className="mb-2">
                  <CommandItem
                    value="search-action"
                    onSelect={handleSearch}
                    className="gap-3 cursor-pointer"
                  >
                    <Search className="h-4 w-4" />
                    <span>Search for "{searchQuery}"</span>
                  </CommandItem>
                  {/* TODO: Add actual search results here */}
                </CommandGroup>
              )}

              {/* Workspace Mode */}
              {mode === 'workspace' && (
                <CommandGroup heading="Workspaces" className="mb-2">
                  {workspaces.map((workspace: NonNullable<GetWorkspacesQuery['workspaces']>[number]) => (
                    <CommandItem
                      key={workspace.id}
                      value={workspace.name}
                      onSelect={() => handleSelectWorkspace(workspace.id)}
                      className="gap-3 cursor-pointer"
                    >
                      <Layers className="h-4 w-4" />
                      <div className="flex flex-1 items-center gap-2">
                        <span className="font-medium">{workspace.name}</span>
                        {workspace.id === currentWorkspaceId && (
                          <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">Current</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Theme Mode */}
              {mode === 'theme' && (
                <CommandGroup heading="Theme Options" className="mb-2">
                  <CommandItem
                    value="light"
                    onSelect={() => handleSelectTheme('light')}
                    className="gap-3 cursor-pointer"
                  >
                    <Sun className="h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">Light</span>
                      {theme === 'light' && <Check className="h-4 w-4" />}
                    </div>
                  </CommandItem>

                  <CommandItem
                    value="dark"
                    onSelect={() => handleSelectTheme('dark')}
                    className="gap-3 cursor-pointer"
                  >
                    <Moon className="h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">Dark</span>
                      {theme === 'dark' && <Check className="h-4 w-4" />}
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>

            <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <div className="flex items-center justify-between">
                <span>
                  Press <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-700">⌘K</kbd> to toggle
                </span>
                {mode !== 'main' && (
                  <button
                    onClick={() => setMode('main')}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Back to commands
                  </button>
                )}
              </div>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
