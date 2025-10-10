/**
 * App Navigation Component
 *
 * WHY: Horizontal navigation bar for main app sections.
 * Uses Radix Tabs for accessible tab navigation with React Router.
 *
 * WHAT IT PROVIDES:
 * - Tab-based navigation (Overview, Agents, Tools, Settings)
 * - Active state highlighting
 * - Icons for each section
 * - Responsive behavior
 */

import { useLocation, Link } from 'react-router-dom';
import { Home, Bot, Wrench, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  {
    label: 'Overview',
    path: '/app/overview',
    icon: Home,
  },
  {
    label: 'Agents',
    path: '/app/agents',
    icon: Bot,
  },
  {
    label: 'Tools',
    path: '/app/tools',
    icon: Wrench,
  },
  {
    label: 'Settings',
    path: '/app/settings',
    icon: Settings,
  },
];

export function AppNavigation() {
  const location = useLocation();

  return (
    <nav className="bg-gray-100 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
      <div className="px-6">
        <div className="flex space-x-1" role="navigation" aria-label="Main navigation">
          {navItems.map(({ label, path, icon: Icon }) => {
            const isActive = location.pathname === path;

            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'rounded-t-md',
                  isActive
                    ? 'text-cyan-600 border-b-2 border-cyan-600 bg-white/50 dark:bg-gray-800/50'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-gray-800/30'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
