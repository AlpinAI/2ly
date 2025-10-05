import { ThemeToggle } from '@/components/ThemeToggle';
import { Home, Bot, Wrench, Settings, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors font-mono">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">2LY</h1>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <User className="h-5 w-5" />
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Secondary Navigation */}
      <nav className="bg-gray-100 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6">
          <div className="flex space-x-1">
            {[
              { icon: Home, label: 'Overview', active: true },
              { icon: Bot, label: 'Agents', active: false },
              { icon: Wrench, label: 'Tools', active: false },
              { icon: Settings, label: 'Settings', active: false },
            ].map(({ icon: Icon, label, active }) => (
              <button
                key={label}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'text-cyan-600 border-b-2 border-cyan-600 bg-white/50 dark:bg-gray-800/50'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Dashboard Overview
          </h2>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[
              { label: 'Active Agents', value: '12', color: 'text-cyan-600' },
              { label: 'Connected Tools', value: '47', color: 'text-blue-600' },
              { label: 'Total Calls', value: '15,847', color: 'text-purple-600' },
              { label: 'Success Rate', value: '99.2%', color: 'text-green-600' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{label}</p>
                <p className={cn('text-2xl font-bold', color)}>{value}</p>
              </div>
            ))}
          </div>

          {/* Placeholder for more content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your recent agent activity will appear here...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
