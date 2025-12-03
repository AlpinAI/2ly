/**
 * AppLayout Component Tests
 *
 * WHY: Test the AppLayout wrapper renders header, navigation, and children
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './app-layout';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'user1@2ly.ai' },
    logout: vi.fn(),
  }),
}));

// Mock the workspace store
vi.mock('@/stores/workspaceStore', () => ({
  useWorkspaceId: () => 'workspace-123',
  useWorkspaceStore: () => ({
    workspaceId: 'workspace-123',
    syncFromUrl: vi.fn(),
  }),
}));

// Mock CommandPalette to avoid Apollo client dependency
vi.mock('@/components/command-palette/command-palette', () => ({
  CommandPalette: () => null,
}));

// Mock global panels and dialogs that use Apollo
vi.mock('@/components/sources/add-source-workflow', () => ({
  AddSourceWorkflow: () => null,
}));

vi.mock('@/components/registry/add-server-workflow', () => ({
  AddServerWorkflow: () => null,
}));

vi.mock('@/components/skills/skill-management-panel', () => ({
  SkillManagementPanel: () => null,
}));

vi.mock('@/components/skills/create-skill-dialog', () => ({
  CreateSkillDialog: () => null,
}));

vi.mock('@/components/skills/connect-skill-dialog', () => ({
  ConnectSkillDialog: () => null,
}));

vi.mock('@/components/skills/connect-skill-dialog-new', () => ({
  ConnectSkillDialogNew: () => null,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>{component}</ThemeProvider>
    </BrowserRouter>
  );
};

describe('AppLayout', () => {
  it('renders header component', () => {
    renderWithProviders(<AppLayout />);

    // Check for logo from AppHeader
    const logo = screen.getByAltText('2LY') as HTMLImageElement;
    expect(logo).toBeDefined();
    expect(logo.src).toContain('/logo-2ly.png');
  });

  it('renders navigation component', () => {
    renderWithProviders(<AppLayout />);

    // Check for nav items from AppNavigation
    expect(screen.getByText('Overview')).toBeDefined();
    expect(screen.getByText('Skills')).toBeDefined();
  });

  it('renders children via Outlet', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<div>Test Content</div>} />
            </Route>
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    );

    const content = screen.getByText('Test Content');
    expect(content).toBeDefined();
  });

  it('has proper layout structure', () => {
    const { container } = renderWithProviders(<AppLayout />);

    // Should have header, nav, and main elements
    const header = container.querySelector('header');
    const nav = container.querySelector('nav');
    const main = container.querySelector('main');

    expect(header).toBeDefined();
    expect(nav).toBeDefined();
    expect(main).toBeDefined();
  });

  it('has dark mode support classes', () => {
    const { container } = renderWithProviders(<AppLayout />);

    const root = container.querySelector('.h-screen');
    expect(root).toBeDefined();
    expect(root?.className).toContain('dark:bg-gray-900');
  });
});
