/**
 * Help Menu Component
 *
 * WHY: Provides quick access to help resources, documentation, and support channels.
 * Replaces the notification bell with a more useful information menu.
 *
 * WHAT IT PROVIDES:
 * - Discord support link
 * - GitHub issue reporting
 * - Documentation access
 * - Repository link
 * - Contribution guide
 *
 * ACCESSIBILITY:
 * - Keyboard navigation support
 * - ARIA labels for screen readers
 * - External link indicators
 */

import { HelpCircle, MessageCircle, Bug, BookOpen, Github, GitPullRequest } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface HelpMenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  description?: string;
}

const helpMenuItems: HelpMenuItem[] = [
  {
    label: 'Get Support',
    icon: <MessageCircle className="h-4 w-4" />,
    href: 'https://discord.gg/XSFPRSyp',
    description: 'Ask our Discord community',
  },
  {
    label: 'Report Issue',
    icon: <Bug className="h-4 w-4" />,
    href: 'https://github.com/AlpinAI/2ly/issues',
    description: 'Report bugs or request features',
  },
  {
    label: 'Browse Docs',
    icon: <BookOpen className="h-4 w-4" />,
    href: 'https://docs.2ly.ai/getting-started/welcome',
    description: 'Read the documentation',
  },
  {
    label: 'View Repository',
    icon: <Github className="h-4 w-4" />,
    href: 'https://github.com/AlpinAI/2ly',
    description: 'Visit our GitHub repository',
  },
  {
    label: 'Contribute',
    icon: <GitPullRequest className="h-4 w-4" />,
    href: 'https://github.com/AlpinAI/2ly/blob/main/dev/README.md',
    description: 'Learn how to contribute',
  },
];

export function HelpMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'p-2 text-cyan-600 dark:text-cyan-400',
            'hover:bg-cyan-50 dark:hover:bg-cyan-950',
            'rounded-lg transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
            'dark:focus:ring-offset-gray-800'
          )}
          aria-label="Help and resources"
          title="Help and resources"
        >
          <HelpCircle className="h-6 w-6" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <span>Help & Resources</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {helpMenuItems.map((item) => (
          <DropdownMenuItem key={item.label} asChild>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-start gap-3 cursor-pointer',
                'focus:outline-none'
              )}
            >
              <span className="text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0">
                {item.icon}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-medium">{item.label}</span>
                {item.description && (
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {item.description}
                  </span>
                )}
              </div>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
