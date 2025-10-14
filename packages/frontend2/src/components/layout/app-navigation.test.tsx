/**
 * AppNavigation Component Tests
 *
 * WHY: Test the AppNavigation renders all tabs and handles active states
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AppNavigation } from './app-navigation';

describe('AppNavigation', () => {
  it('renders all navigation items', () => {
    render(
      <BrowserRouter>
        <AppNavigation />
      </BrowserRouter>
    );

    expect(screen.getByText('Overview')).toBeDefined();
    expect(screen.getByText('Agents')).toBeDefined();
    expect(screen.getByText('Tools')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('highlights active tab based on current route', () => {
    render(
      <MemoryRouter initialEntries={['/app/overview']}>
        <AppNavigation />
      </MemoryRouter>
    );

    const overviewLink = screen.getByText('Overview').closest('a');
    expect(overviewLink).toBeDefined();
    expect(overviewLink?.getAttribute('aria-current')).toBe('page');
  });

  it('does not highlight inactive tabs', () => {
    render(
      <MemoryRouter initialEntries={['/app/overview']}>
        <AppNavigation />
      </MemoryRouter>
    );

    const agentsLink = screen.getByText('Agents').closest('a');
    expect(agentsLink?.getAttribute('aria-current')).toBeNull();
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

    // Should have 4 SVG icons (one for each nav item)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(4);
  });

  it('has correct links for each tab', () => {
    render(
      <BrowserRouter>
        <AppNavigation />
      </BrowserRouter>
    );

    const overviewLink = screen.getByText('Overview').closest('a');
    const agentsLink = screen.getByText('Agents').closest('a');
    const toolsLink = screen.getByText('Tools').closest('a');
    const settingsLink = screen.getByText('Settings').closest('a');

    expect(overviewLink?.getAttribute('href')).toBe('/app/overview');
    expect(agentsLink?.getAttribute('href')).toBe('/app/agents');
    expect(toolsLink?.getAttribute('href')).toBe('/app/tools');
    expect(settingsLink?.getAttribute('href')).toBe('/app/settings');
  });
});
