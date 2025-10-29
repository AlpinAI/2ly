/**
 * HelpMenu Component Tests
 *
 * WHY: Test the HelpMenu renders correctly with all menu items and proper accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpMenu } from './help-menu';

describe('HelpMenu', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Silence expected console errors from Radix UI dropdown menu
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders help menu trigger button', () => {
    render(<HelpMenu />);

    const trigger = screen.getByRole('button', { name: /help and resources/i });
    expect(trigger).toBeDefined();
    expect(trigger.getAttribute('aria-label')).toBe('Help and resources');
    expect(trigger.getAttribute('title')).toBe('Help and resources');
  });

  it('opens menu on trigger click', async () => {
    const user = userEvent.setup();
    render(<HelpMenu />);

    const trigger = screen.getByRole('button', { name: /help and resources/i });
    await user.click(trigger);

    expect(screen.getByText('Help & Resources')).toBeDefined();
  });

  it('renders all 5 menu items with correct labels', async () => {
    const user = userEvent.setup();
    render(<HelpMenu />);

    const trigger = screen.getByRole('button', { name: /help and resources/i });
    await user.click(trigger);

    expect(screen.getByText('Get Support')).toBeDefined();
    expect(screen.getByText('Report Issue')).toBeDefined();
    expect(screen.getByText('Browse Docs')).toBeDefined();
    expect(screen.getByText('View Repository')).toBeDefined();
    expect(screen.getByText('Contribute')).toBeDefined();
  });

  it('renders menu items with descriptions', async () => {
    const user = userEvent.setup();
    render(<HelpMenu />);

    const trigger = screen.getByRole('button', { name: /help and resources/i });
    await user.click(trigger);

    expect(screen.getByText('Ask our Discord community')).toBeDefined();
    expect(screen.getByText('Report bugs or request features')).toBeDefined();
    expect(screen.getByText('Read the documentation')).toBeDefined();
    expect(screen.getByText('Visit our GitHub repository')).toBeDefined();
    expect(screen.getByText('Learn how to contribute')).toBeDefined();
  });

  it('all menu items are external links with correct hrefs', async () => {
    const user = userEvent.setup();
    render(<HelpMenu />);

    const trigger = screen.getByRole('button', { name: /help and resources/i });
    await user.click(trigger);

    const links = document.querySelectorAll('a[target="_blank"]');
    expect(links.length).toBe(5);

    const expectedHrefs = [
      'https://discord.gg/XSFPRSyp',
      'https://github.com/AlpinAI/2ly/issues',
      'https://docs.2ly.ai/getting-started/welcome',
      'https://github.com/AlpinAI/2ly',
      'https://github.com/AlpinAI/2ly/blob/main/dev/README.md',
    ];

    links.forEach((link, index) => {
      expect(link.getAttribute('href')).toBe(expectedHrefs[index]);
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      expect(link.getAttribute('target')).toBe('_blank');
    });
  });

  it('has proper security attributes on external links', async () => {
    const user = userEvent.setup();
    render(<HelpMenu />);

    const trigger = screen.getByRole('button', { name: /help and resources/i });
    await user.click(trigger);

    const links = document.querySelectorAll('a[target="_blank"]');

    links.forEach((link) => {
      // All external links should have rel="noopener noreferrer" for security
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  it('trigger button has cyan color styling', () => {
    render(<HelpMenu />);

    const trigger = screen.getByRole('button', { name: /help and resources/i });

    // Check for cyan color classes
    expect(trigger.className).toContain('text-cyan-600');
    expect(trigger.className).toContain('dark:text-cyan-400');
    expect(trigger.className).toContain('hover:bg-cyan-50');
    expect(trigger.className).toContain('dark:hover:bg-cyan-950');
  });

  it('has focus ring for keyboard navigation', () => {
    render(<HelpMenu />);

    const trigger = screen.getByRole('button', { name: /help and resources/i });

    // Check for focus ring classes
    expect(trigger.className).toContain('focus:ring-2');
    expect(trigger.className).toContain('focus:ring-cyan-500');
  });

  it('menu items have proper icon styling', async () => {
    const user = userEvent.setup();
    render(<HelpMenu />);

    const trigger = screen.getByRole('button', { name: /help and resources/i });
    await user.click(trigger);

    // Find all icon containers (they have cyan color class)
    const iconContainers = document.querySelectorAll('.text-cyan-600');

    // Should have icons in trigger (1) + label (1) + each menu item (5) = 7 total
    expect(iconContainers.length).toBeGreaterThanOrEqual(5);
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<HelpMenu />);

    const trigger = screen.getByRole('button', { name: /help and resources/i });

    // Focus the trigger
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    // Open with Enter key
    await user.keyboard('{Enter}');

    expect(screen.getByText('Help & Resources')).toBeDefined();
  });

  it('menu closes after selecting an item', async () => {
    const user = userEvent.setup();
    render(<HelpMenu />);

    const trigger = screen.getByRole('button', { name: /help and resources/i });
    await user.click(trigger);

    expect(screen.getByText('Get Support')).toBeDefined();

    // Click on a menu item
    const menuItem = screen.getByText('Get Support').closest('a');
    if (menuItem) {
      await user.click(menuItem);
    }

    // Menu should close (Radix UI handles this automatically)
    // We just verify the interaction doesn't cause errors
    expect(screen.queryByText('Get Support')).toBeNull();
  });
});
