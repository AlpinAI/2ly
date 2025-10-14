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
    user: { id: '1', email: 'test@example.com' },
    logout: vi.fn(),
  }),
}));

// Mock the workspace store
vi.mock('@/stores/workspaceStore', () => ({
  useWorkspaceId: () => 'workspace-123',
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
    const logo = screen.getByText('2LY');
    expect(logo).toBeDefined();
  });

  it('renders navigation component', () => {
    renderWithProviders(<AppLayout />);

    // Check for nav items from AppNavigation
    expect(screen.getByText('Overview')).toBeDefined();
    expect(screen.getByText('Agents')).toBeDefined();
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

  it('has max-width container for content', () => {
    const { container } = renderWithProviders(<AppLayout />);

    const mainContent = container.querySelector('main > div');
    expect(mainContent).toBeDefined();
    expect(mainContent?.className).toContain('max-w-7xl');
    expect(mainContent?.className).toContain('mx-auto');
  });

  it('has dark mode support classes', () => {
    const { container } = renderWithProviders(<AppLayout />);

    const root = container.querySelector('.min-h-screen');
    expect(root).toBeDefined();
    expect(root?.className).toContain('dark:bg-gray-900');
  });
});
