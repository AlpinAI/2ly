/**
 * Search Component Tests
 *
 * WHY: Test the Search input component with keyboard shortcut hint
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Search } from './search';

describe('Search', () => {
  it('renders search input', () => {
    render(<Search placeholder="Search..." />);

    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeDefined();
    expect(input.getAttribute('type')).toBe('search');
  });

  it('renders with keyboard shortcut hint when showShortcut is true', () => {
    render(<Search placeholder="Search..." showShortcut />);

    const shortcut = screen.getByText('⌘K');
    expect(shortcut).toBeDefined();
    expect(shortcut.tagName).toBe('KBD');
  });

  it('does not render shortcut by default', () => {
    render(<Search placeholder="Search..." />);

    const shortcut = screen.queryByText('⌘K');
    expect(shortcut).toBeNull();
  });

  it('renders with custom shortcut text', () => {
    render(<Search placeholder="Search..." showShortcut shortcutText="Ctrl+K" />);

    const shortcut = screen.getByText('Ctrl+K');
    expect(shortcut).toBeDefined();
  });

  it('renders with custom className', () => {
    render(<Search placeholder="Search..." inputClassName="w-96" />);

    const input = screen.getByPlaceholderText('Search...');
    expect(input.className).toContain('w-96');
  });

  it('renders with search icon', () => {
    const { container } = render(<Search placeholder="Search..." />);

    // SVG icon should be present
    const icon = container.querySelector('svg');
    expect(icon).toBeDefined();
  });
});
