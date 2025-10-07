import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  Server,
  Play,
  ChevronDown,
  LineChart,
  FlaskConical,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useWorkspace } from '../../contexts/useWorkspace';

type SidebarProps = {
  className?: string;
};

type NavItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
};

const NavItem = ({ to, icon, label, collapsed }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
          collapsed && 'justify-center px-2',
        )
      }
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
};

const WorkspaceDropdown: React.FC<{ name: string }> = ({ name }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative mb-2">
      <button
        type="button"
        className="flex items-center w-full gap-2 rounded-md px-2 py-1 text-base font-semibold text-gray-800 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-200"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate flex-1 text-left">{name}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="absolute left-0 z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200"
        >
          <div className="py-1">
            <div
              className="px-4 py-2 text-sm text-gray-700 cursor-default select-none"
            // In the future, this will be a clickable item for switching
            >
              {name}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const { currentWorkspace } = useWorkspace();

  return (
    <motion.div
      className={cn('relative flex flex-col border-r border-gray-200 bg-white', collapsed ? 'w-16' : 'w-64', className)}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="flex h-16 items-center px-4"
        onMouseEnter={() => setLogoHovered(true)}
        onMouseLeave={() => setLogoHovered(false)}
      >
        <div className={cn('flex items-center gap-2 font-semibold text-primary-700', collapsed && 'justify-center')}>
          {collapsed ? (
            logoHovered ? (
              <button
                onClick={() => setCollapsed(false)}
                className="flex items-center justify-center rounded-full p-2 shadow-lg bg-white border border-gray-200 hover:bg-gray-100 hover:text-gray-900 text-gray-500"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <img src="/logo-2ly.png" alt="2LY Logo" className="h-8 w-8" />
            )
          ) : (
            <img src="/logo-2ly.png" alt="2LY Logo" className="h-10" />
          )}
        </div>
      </div>

      {/* Workspace Section Header */}
      {!collapsed && (
        <div className="px-4 pb-1">
          <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Workspace</span>
          {currentWorkspace ? (
            <WorkspaceDropdown name={currentWorkspace.name} />
          ) : (
            <div className="truncate text-base font-semibold text-gray-400 px-1 py-1 mb-2 italic">No workspace</div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto py-2 px-4">
        <nav className="flex flex-col gap-1">
          <NavItem to="/mcp-servers" icon={<Server className="h-5 w-5" />} label="Tools Registry" collapsed={collapsed} />
          <NavItem to="/agents" icon={<Cpu className="h-5 w-5" />} label="Agents" collapsed={collapsed} />
          <NavItem to="/playground" icon={<FlaskConical className="h-5 w-5" />} label="Playground" collapsed={collapsed} />
          <NavItem to="/monitoring" icon={<LineChart className="h-5 w-5" />} label="Monitoring" collapsed={collapsed} />
          <NavItem to="/runtimes" icon={<Play className="h-5 w-5" />} label="Runtimes" collapsed={collapsed} />
          {/* <NavItem to="/recipes" icon={<CookingPot className="h-5 w-5" />} label="Recipes" collapsed={collapsed} /> */}
        </nav>
      </div>

      <div className="mt-auto border-t border-gray-200 py-4 px-4">
        <nav className="flex flex-col gap-1">
          <NavItem to="/settings" icon={<Settings className="h-5 w-5" />} label="Settings" collapsed={collapsed} />
        </nav>
      </div>
      {/* Floating toggle button only when expanded */}
      {!collapsed && (
        <button
          onClick={() => setCollapsed(true)}
          className={cn(
            'absolute z-20 shadow-lg bg-white border border-gray-200 rounded-full p-2 transition-all',
            '-right-4',
            'hover:bg-gray-100 hover:text-gray-900 text-gray-500',
          )}
          style={{
            transform: 'translate(2px, -50%)',
            top: 63,
          }}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
    </motion.div>
  );
};

export default Sidebar;
