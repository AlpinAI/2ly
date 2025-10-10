/**
 * App Header Component
 *
 * WHY: Main application header for authenticated users.
 * Contains logo, search, notifications, user menu, and theme toggle.
 *
 * WHAT IT PROVIDES:
 * - Logo with link to dashboard
 * - Global search input (placeholder)
 * - Notifications bell with popover
 * - User menu with profile and logout
 * - Theme toggle
 * - Workspace indicator
 */

import { Link } from 'react-router-dom';
import { Bell, User as UserIcon, LogOut, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceId } from '@/stores/workspaceStore';
import { cn } from '@/lib/utils';
import { CommandPalette } from '@/components/command-palette/CommandPalette';

export function AppHeader() {
  const { user, logout } = useAuth();
  const workspaceId = useWorkspaceId();

  // Extract user initials from email
  const getUserInitials = (email: string): string => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <CommandPalette />
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Logo and Workspace */}
            <div className="flex items-center gap-4 min-w-0">
              <Link to="/app/overview" className="flex items-center gap-2 flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">2LY</h1>
              </Link>
              {workspaceId && (
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  Workspace: {workspaceId}
                </span>
              )}
            </div>

            {/* Right: Search + Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Command Palette Trigger Button (hidden on mobile) */}
              <button
                onClick={() => {
                  // Trigger keyboard event to open command palette
                  const event = new KeyboardEvent('keydown', {
                    key: 'k',
                    metaKey: true,
                    bubbles: true
                  });
                  document.dispatchEvent(event);
                }}
                className={cn(
                  'hidden md:flex items-center gap-2 px-3 h-10 w-64 lg:w-80',
                  'rounded-lg border border-gray-300 dark:border-gray-600',
                  'bg-white dark:bg-gray-800',
                  'text-sm text-gray-500 dark:text-gray-400',
                  'hover:border-gray-400 dark:hover:border-gray-500',
                  'transition-colors'
                )}
              >
                <span>Search...</span>
                <kbd className="ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 dark:bg-gray-700 px-1.5 font-mono text-[10px] font-medium opacity-100">
                  ⌘K
                </kbd>
              </button>

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'p-2 text-gray-600 dark:text-gray-400',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'rounded-lg transition-colors',
                    'relative'
                  )}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {/* Notification badge (placeholder) */}
                  {/* <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" /> */}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    No new notifications
                  </p>
                </div>
              </PopoverContent>
            </Popover>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-2',
                    'p-1.5 rounded-lg',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'transition-colors'
                  )}
                  aria-label="User menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user?.email} />
                    <AvatarFallback className="bg-cyan-600 text-white text-xs">
                      {user ? getUserInitials(user.email) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">My Account</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/app/settings" className="flex items-center cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/settings" className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
