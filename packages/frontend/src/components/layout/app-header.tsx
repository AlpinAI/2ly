/**
 * App Header Component
 *
 * WHY: Main application header for authenticated users.
 * Contains logo, command palette trigger, help menu, user menu, and theme toggle.
 *
 * WHAT IT PROVIDES:
 * - Logo with link to dashboard
 * - Command palette trigger button (⌘K)
 * - Help menu with resources and support links
 * - User menu with profile and logout
 * - Theme toggle
 * - Workspace indicator
 */

import { Link, useParams } from 'react-router-dom';
import { LogOut, Settings, Terminal, Link2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { HelpMenu } from '@/components/layout/help-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { CommandPalette } from '@/components/command-palette/command-palette';

export function AppHeader() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { workspaceId } = useParams<{ workspaceId: string }>();

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
                <img
                  src={theme === 'dark' ? '/logo-skilder-dark.png' : '/logo-skilder.png'}
                  alt="Skilder"
                  className="h-12 w-auto"
                />
              </Link>
            </div>

            {/* Right: Command Palette + Actions */}
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
                title="Open command palette"
                aria-label="Open command palette"
                className={cn(
                  'hidden md:flex items-center gap-2 px-3 h-10',
                  'rounded-lg border border-gray-300 dark:border-gray-600',
                  'bg-white dark:bg-gray-800',
                  'text-sm text-gray-700 dark:text-gray-300',
                  'hover:bg-gray-50 dark:hover:bg-gray-700',
                  'hover:border-gray-400 dark:hover:border-gray-500',
                  'transition-colors'
                )}
              >
                <Terminal className="h-4 w-4" />
                <span className="font-medium">Commands</span>
                <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 dark:bg-gray-700 px-1.5 font-mono text-[10px] font-medium opacity-100">
                  ⌘K
                </kbd>
              </button>

            {/* Help Menu */}
            <HelpMenu />

            {/* Theme Toggle */}
            <ThemeToggle />

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
                  <Link to={`/w/${workspaceId}/my-integrations`} className="flex items-center cursor-pointer">
                    <Link2 className="mr-2 h-4 w-4" />
                    <span>My Integrations</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/w/${workspaceId}/settings`} className="flex items-center cursor-pointer">
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
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
