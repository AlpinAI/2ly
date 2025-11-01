/**
 * AppNavigation Component Tests
 *
 * WHY: Test the AppNavigation renders all tabs and handles active states
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AppNavigation } from './app-navigation';

// Mock useParams to return a valid workspaceId
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ workspaceId: 'test-workspace' }),
  };
});

describe('AppNavigation', () => {
  it('renders all navigation items', () => {
    render(
      <BrowserRouter>
        <AppNavigation />
      </BrowserRouter>
    );

    expect(screen.getByText('Overview')).toBeDefined();
    expect(screen.getByText('Sources')).toBeDefined();
    expect(screen.getByText('Tools')).toBeDefined();
    expect(screen.getByText('Tool Sets')).toBeDefined();
    expect(screen.getByText('Monitoring')).toBeDefined();
    expect(screen.getByText('Visualization')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('highlights active tab based on current route', () => {
    render(
      <MemoryRouter initialEntries={['/w/test-workspace/overview']}>
        <AppNavigation />
      </MemoryRouter>
    );

    const overviewLink = screen.getByText('Overview').closest('a');
    expect(overviewLink).toBeDefined();
    expect(overviewLink?.getAttribute('aria-current')).toBe('page');
  });

  it('does not highlight inactive tabs', () => {
    render(
      <MemoryRouter initialEntries={['/w/test-workspace/overview']}>
        <AppNavigation />
      </MemoryRouter>
    );

    const toolSetsLink = screen.getByText('Tool Sets').closest('a');
    expect(toolSetsLink?.getAttribute('aria-current')).toBeNull();
  });

  it('renders with proper ARIA navigation role', () => {
    const { container } = render(
      <BrowserRouter>
        <AppNavigation />
      </BrowserRouter>
    );

    const nav = container.querySelector('nav');
    expect(nav).toBeDefined();

    const navContainer = container.querySelector('[role="navigation"]');
    expect(navContainer).toBeDefined();
    expect(navContainer?.getAttribute('aria-label')).toBe('Main navigation');
  });

  it('renders icons for each navigation item', () => {
    const { container } = render(
      <BrowserRouter>
        <AppNavigation />
      </BrowserRouter>
    );

    // Should have 7 SVG icons (one for each nav item: 6 left + 1 right)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBe(7);
  });

  it('has correct links for each tab', () => {
    render(
      <BrowserRouter>
        <AppNavigation />
      </BrowserRouter>
    );

    const overviewLink = screen.getByText('Overview').closest('a');
    const sourcesLink = screen.getByText('Sources').closest('a');
    const toolsLink = screen.getByText('Tools').closest('a');
    const toolSetsLink = screen.getByText('Tool Sets').closest('a');
    const monitoringLink = screen.getByText('Monitoring').closest('a');
    const visualizationLink = screen.getByText('Visualization').closest('a');
    const settingsLink = screen.getByText('Settings').closest('a');

    expect(overviewLink?.getAttribute('href')).toBe('/w/test-workspace/overview');
    expect(sourcesLink?.getAttribute('href')).toBe('/w/test-workspace/sources');
    expect(toolsLink?.getAttribute('href')).toBe('/w/test-workspace/tools');
    expect(toolSetsLink?.getAttribute('href')).toBe('/w/test-workspace/toolsets');
    expect(monitoringLink?.getAttribute('href')).toBe('/w/test-workspace/monitoring');
    expect(visualizationLink?.getAttribute('href')).toBe('/w/test-workspace/visualization');
    expect(settingsLink?.getAttribute('href')).toBe('/w/test-workspace/settings');
  });
});
