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

import { useLocation, Link, useParams } from 'react-router-dom';
import { Home, Bot, Wrench, Server, Settings, Activity, Network } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: typeof Home;
}

const leftNavItems: NavItem[] = [
  {
    label: 'Overview',
    path: 'overview',
    icon: Home,
  },
  {
    label: 'Sources',
    path: 'sources',
    icon: Server,
  },
  {
    label: 'Tools',
    path: 'tools',
    icon: Wrench,
  },
  {
    label: 'Tool Sets',
    path: 'toolsets',
    icon: Bot,
  },
  {
    label: 'Monitoring',
    path: 'monitoring',
    icon: Activity,
  },
  {
    label: 'Knowledge Graph',
    path: 'knowledge-graph',
    icon: Network,
  },
];

const rightNavItems: NavItem[] = [
  {
    label: 'Settings',
    path: 'settings',
    icon: Settings,
  },
];

export function AppNavigation() {
  const location = useLocation();
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const renderNavItems = (items: NavItem[]) => {
    return items.map(({ label, path, icon: Icon }) => {
      const fullPath = `/w/${workspaceId}/${path}`;
      const isActive = location.pathname === fullPath;

      return (
        <Link
          key={path}
          to={fullPath}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'rounded-t-md',
            isActive
              ? 'text-cyan-600 border-b-2 border-cyan-600 bg-white/50 dark:bg-gray-800/50'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-gray-800/30',
          )}
          aria-current={isActive ? 'page' : undefined}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Link>
      );
    });
  };

  return (
    <nav className="bg-gray-100 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
      <div className="px-6">
        <div className="flex justify-between" role="navigation" aria-label="Main navigation">
          <div className="flex space-x-1">
            {renderNavItems(leftNavItems)}
          </div>
          <div className="flex space-x-1">
            {renderNavItems(rightNavItems)}
          </div>
        </div>
      </div>
    </nav>
  );
}
