/**
 * AppHeader Component Tests
 *
 * WHY: Test the AppHeader renders all elements correctly
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppHeader } from './app-header';
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
}));

// Mock CommandPalette to avoid Apollo client dependency
vi.mock('@/components/command-palette/command-palette', () => ({
  CommandPalette: () => null,
}));

// Mock HelpMenu to simplify tests
vi.mock('@/components/layout/help-menu', () => ({
  HelpMenu: () => <button aria-label="Help and resources">Help</button>,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>{component}</ThemeProvider>
    </BrowserRouter>
  );
};

describe('AppHeader', () => {
  it('renders logo', () => {
    renderWithProviders(<AppHeader />);
    const logo = screen.getByAltText('2LY') as HTMLImageElement;
    expect(logo).toBeDefined();
    expect(logo.src).toContain('/logo-2ly.png');
  });

  it('renders command palette trigger button with proper styling', () => {
    renderWithProviders(<AppHeader />);

    // Find the command palette trigger button by its aria-label
    const commandButton = screen.getByRole('button', { name: /open command palette/i });
    expect(commandButton).toBeDefined();

    // Verify button contains the expected content
    expect(screen.getByText('Commands')).toBeDefined();
    expect(screen.getByText('⌘K')).toBeDefined();

    // Verify button has proper attributes
    expect(commandButton.getAttribute('title')).toBe('Open command palette');
  });

  it('opens command palette on button click', () => {
    renderWithProviders(<AppHeader />);

    // Find the command palette trigger button
    const commandButton = screen.getByRole('button', { name: /open command palette/i });

    // Spy on document.dispatchEvent to verify keyboard event is dispatched
    const dispatchEventSpy = vi.spyOn(document, 'dispatchEvent');

    // Click the button
    fireEvent.click(commandButton);

    // Verify that a keyboard event was dispatched with correct properties
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'keydown',
        key: 'k',
        metaKey: true,
        bubbles: true
      })
    );

    dispatchEventSpy.mockRestore();
  });

  it('renders help menu button', () => {
    renderWithProviders(<AppHeader />);

    const helpButton = screen.getByLabelText('Help and resources');
    expect(helpButton).toBeDefined();
  });

  it('renders user menu button', () => {
    renderWithProviders(<AppHeader />);

    const userMenuButton = screen.getByLabelText('User menu');
    expect(userMenuButton).toBeDefined();
  });

  it('renders user initials in avatar', () => {
    renderWithProviders(<AppHeader />);

    // user1@2ly.ai should give "TE" initials
    const initials = screen.getByText('TE');
    expect(initials).toBeDefined();
  });

  it('renders theme toggle', () => {
    const { container } = renderWithProviders(<AppHeader />);

    // ThemeToggle should be present (check for sun/moon icon)
    const themeButton = container.querySelector('button[aria-label*="theme"]');
    expect(themeButton).toBeDefined();
  });

  it('has sticky positioning', () => {
    const { container } = renderWithProviders(<AppHeader />);

    const header = container.querySelector('header');
    expect(header).toBeDefined();
    expect(header?.className).toContain('sticky');
    expect(header?.className).toContain('top-0');
  });
});
