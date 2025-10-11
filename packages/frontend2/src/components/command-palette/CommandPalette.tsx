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
import { Command } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, Layers, Palette, Moon, Sun, Check, Plus } from 'lucide-react';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useUIStore } from '@/stores/uiStore';
import { GetWorkspacesDocument, type GetWorkspacesQuery } from '@/graphql/generated/graphql';

type CommandMode = 'main' | 'search' | 'workspace' | 'theme';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CommandMode>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const currentWorkspaceId = useWorkspaceId();
  const { theme, setTheme } = useTheme();
  const setAddToolWorkflowOpen = useUIStore((state) => state.setAddToolWorkflowOpen);

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

  const handleAddTool = () => {
    setAddToolWorkflowOpen(true);
    setOpen(false);
  };

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Search query:', searchQuery);
    setOpen(false);
  };

  const workspaces = data?.workspace || [];

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
            <div className="border-b border-gray-200 px-3 dark:border-gray-700">
              <Command.Input
                placeholder={getPlaceholder()}
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-gray-400"
              />
            </div>
            <Command.List className="max-h-[400px] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {loading ? 'Loading...' : 'No results found.'}
              </Command.Empty>

              {/* Main Mode - Show all commands */}
              {mode === 'main' && (
                <Command.Group heading="Commands" className="mb-2">
                  <Command.Item
                    value="search"
                    onSelect={() => setMode('search')}
                    className="relative flex cursor-pointer select-none items-center gap-3 rounded-sm px-3 py-2 text-sm outline-none data-[selected=true]:bg-blue-100 data-[selected=true]:text-blue-900 dark:data-[selected=true]:bg-blue-900 dark:data-[selected=true]:text-blue-100"
                  >
                    <Search className="h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">Search</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Find anything...</span>
                    </div>
                  </Command.Item>

                  <Command.Item
                    value="workspace"
                    onSelect={() => setMode('workspace')}
                    className="relative flex cursor-pointer select-none items-center gap-3 rounded-sm px-3 py-2 text-sm outline-none data-[selected=true]:bg-blue-100 data-[selected=true]:text-blue-900 dark:data-[selected=true]:bg-blue-900 dark:data-[selected=true]:text-blue-100"
                  >
                    <Layers className="h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">Switch Workspace</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Change your workspace</span>
                    </div>
                  </Command.Item>

                  <Command.Item
                    value="add-tool"
                    onSelect={handleAddTool}
                    className="relative flex cursor-pointer select-none items-center gap-3 rounded-sm px-3 py-2 text-sm outline-none data-[selected=true]:bg-blue-100 data-[selected=true]:text-blue-900 dark:data-[selected=true]:bg-blue-900 dark:data-[selected=true]:text-blue-100"
                  >
                    <Plus className="h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">Add Tool</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Browse and install MCP tools</span>
                    </div>
                  </Command.Item>

                  <Command.Item
                    value="theme"
                    onSelect={() => setMode('theme')}
                    className="relative flex cursor-pointer select-none items-center gap-3 rounded-sm px-3 py-2 text-sm outline-none data-[selected=true]:bg-blue-100 data-[selected=true]:text-blue-900 dark:data-[selected=true]:bg-blue-900 dark:data-[selected=true]:text-blue-100"
                  >
                    <Palette className="h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">Change Theme</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Toggle dark/light mode</span>
                    </div>
                  </Command.Item>
                </Command.Group>
              )}

              {/* Search Mode */}
              {mode === 'search' && (
                <Command.Group heading="Search Results" className="mb-2">
                  <Command.Item
                    value="search-action"
                    onSelect={handleSearch}
                    className="relative flex cursor-pointer select-none items-center gap-3 rounded-sm px-3 py-2 text-sm outline-none data-[selected=true]:bg-blue-100 data-[selected=true]:text-blue-900 dark:data-[selected=true]:bg-blue-900 dark:data-[selected=true]:text-blue-100"
                  >
                    <Search className="h-4 w-4" />
                    <span>Search for "{searchQuery}"</span>
                  </Command.Item>
                  {/* TODO: Add actual search results here */}
                </Command.Group>
              )}

              {/* Workspace Mode */}
              {mode === 'workspace' && (
                <Command.Group heading="Workspaces" className="mb-2">
                  {workspaces.map((workspace: NonNullable<GetWorkspacesQuery['workspace']>[number]) => (
                    <Command.Item
                      key={workspace.id}
                      value={workspace.name}
                      onSelect={() => handleSelectWorkspace(workspace.id)}
                      className="relative flex cursor-pointer select-none items-center gap-3 rounded-sm px-3 py-2 text-sm outline-none data-[selected=true]:bg-blue-100 data-[selected=true]:text-blue-900 dark:data-[selected=true]:bg-blue-900 dark:data-[selected=true]:text-blue-100"
                    >
                      <Layers className="h-4 w-4" />
                      <div className="flex flex-1 items-center gap-2">
                        <span className="font-medium">{workspace.name}</span>
                        {workspace.id === currentWorkspaceId && (
                          <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">Current</span>
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
              )}

              {/* Theme Mode */}
              {mode === 'theme' && (
                <Command.Group heading="Theme Options" className="mb-2">
                  <Command.Item
                    value="light"
                    onSelect={() => handleSelectTheme('light')}
                    className="relative flex cursor-pointer select-none items-center gap-3 rounded-sm px-3 py-2 text-sm outline-none data-[selected=true]:bg-blue-100 data-[selected=true]:text-blue-900 dark:data-[selected=true]:bg-blue-900 dark:data-[selected=true]:text-blue-100"
                  >
                    <Sun className="h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">Light</span>
                      {theme === 'light' && <Check className="h-4 w-4" />}
                    </div>
                  </Command.Item>

                  <Command.Item
                    value="dark"
                    onSelect={() => handleSelectTheme('dark')}
                    className="relative flex cursor-pointer select-none items-center gap-3 rounded-sm px-3 py-2 text-sm outline-none data-[selected=true]:bg-blue-100 data-[selected=true]:text-blue-900 dark:data-[selected=true]:bg-blue-900 dark:data-[selected=true]:text-blue-100"
                  >
                    <Moon className="h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <span className="font-medium">Dark</span>
                      {theme === 'dark' && <Check className="h-4 w-4" />}
                    </div>
                  </Command.Item>
                </Command.Group>
              )}
            </Command.List>

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
