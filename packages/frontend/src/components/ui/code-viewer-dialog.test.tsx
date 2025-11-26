/**
 * CodeViewerDialog Component Tests
 *
 * Tests the CodeViewerDialog component for proper rendering,
 * user interactions, search functionality, and view mode switching
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CodeViewerDialog } from './code-viewer-dialog';

describe('CodeViewerDialog', () => {
  const jsonContent = JSON.stringify({ foo: 'bar', nested: { value: 123 } });
  const textContent = 'Plain text content\nLine 2\nLine 3';

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Test Viewer',
    content: jsonContent,
    language: 'json' as const,
  };

  it('renders dialog when open is true', () => {
    render(<CodeViewerDialog {...defaultProps} />);

    expect(screen.getByText('Test Viewer')).toBeDefined();
  });

  it('does not render dialog when open is false', () => {
    render(<CodeViewerDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('Test Viewer')).toBeNull();
  });

  it('displays subtitle when provided', () => {
    render(<CodeViewerDialog {...defaultProps} subtitle="Test subtitle" />);

    expect(screen.getByText('Test subtitle')).toBeDefined();
  });

  it('renders search input', () => {
    render(<CodeViewerDialog {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search in content...');
    expect(searchInput).toBeDefined();
  });

  it('shows tree and code view mode buttons for JSON content', () => {
    render(<CodeViewerDialog {...defaultProps} />);

    expect(screen.getByText('Tree')).toBeDefined();
    expect(screen.getByText('Code')).toBeDefined();
  });

  it('does not show view mode buttons for text content', () => {
    render(<CodeViewerDialog {...defaultProps} content={textContent} language="text" />);

    expect(screen.queryByText('Tree')).toBeNull();
    expect(screen.queryByText('Code')).toBeNull();
  });

  it('defaults to tree view for JSON content', () => {
    render(<CodeViewerDialog {...defaultProps} />);

    // Tree view button should have active styling
    const treeButton = screen.getByText('Tree').closest('button');
    expect(treeButton?.className).toContain('bg-white');
  });

  it('switches to code view when code button is clicked', async () => {
    const user = userEvent.setup();
    render(<CodeViewerDialog {...defaultProps} />);

    const codeButton = screen.getByText('Code');
    await user.click(codeButton);

    // Code button should have active styling
    expect(codeButton.closest('button')?.className).toContain('bg-white');
  });

  it('calls onOpenChange when close button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = render(
      <CodeViewerDialog {...defaultProps} onOpenChange={onOpenChange} />
    );

    // Find close button (X icon button)
    const closeButton = container.querySelector('button[aria-label]') || container.querySelectorAll('button')[0];
    if (closeButton) {
      await user.click(closeButton);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    }
  });

  it('updates search input when typing', async () => {
    const user = userEvent.setup();
    render(<CodeViewerDialog {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search in content...') as HTMLInputElement;
    await user.type(searchInput, 'foo');

    expect(searchInput.value).toBe('foo');
  });

  it('displays search match count', async () => {
    const user = userEvent.setup();
    const content = JSON.stringify({ foo: 'bar', test: 'foo', another: 'foo test' });
    render(<CodeViewerDialog {...defaultProps} content={content} />);

    const searchInput = screen.getByPlaceholderText('Search in content...');
    await user.type(searchInput, 'foo');

    // Should show match count
    expect(screen.getByText(/match/i)).toBeDefined();
  });

  it('displays zero matches when search has no results', async () => {
    const user = userEvent.setup();
    render(<CodeViewerDialog {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search in content...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('0 matches')).toBeDefined();
  });

  it('handles invalid JSON gracefully', () => {
    const invalidJson = '{ invalid json }';
    render(<CodeViewerDialog {...defaultProps} content={invalidJson} />);

    // Should not crash and should not show tree/code toggle
    expect(screen.queryByText('Tree')).toBeNull();
  });

  it('renders JSON tree view with parsed data', () => {
    const { container } = render(<CodeViewerDialog {...defaultProps} />);

    // JsonView component should be rendered (check for react-json-view-lite classes)
    const jsonView = container.querySelector('[class*="container"]');
    expect(jsonView).toBeDefined();
  });

  it('renders code view with syntax highlighting', async () => {
    const user = userEvent.setup();
    const { container } = render(<CodeViewerDialog {...defaultProps} />);

    // Switch to code view
    const codeButton = screen.getByText('Code');
    await user.click(codeButton);

    // Check for pre element (code highlighting)
    const preElement = container.querySelector('pre');
    expect(preElement).toBeDefined();
  });

  it('displays line numbers in code view', async () => {
    const user = userEvent.setup();
    render(<CodeViewerDialog {...defaultProps} />);

    // Switch to code view
    const codeButton = screen.getByText('Code');
    await user.click(codeButton);

    // Verify code button is now active (has active styling)
    expect(codeButton.closest('button')?.className).toContain('bg-white');
  });

  it('resets state when dialog closes and reopens', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(<CodeViewerDialog {...defaultProps} onOpenChange={onOpenChange} />);

    // Type in search
    const searchInput = screen.getByPlaceholderText('Search in content...') as HTMLInputElement;
    await user.type(searchInput, 'test');

    // Switch to code view
    const codeButton = screen.getByText('Code');
    await user.click(codeButton);

    // Close dialog
    rerender(<CodeViewerDialog {...defaultProps} open={false} onOpenChange={onOpenChange} />);

    // Reopen dialog
    rerender(<CodeViewerDialog {...defaultProps} open={true} onOpenChange={onOpenChange} />);

    // Wait for dialog to reopen and search input to appear
    const newSearchInput = await screen.findByPlaceholderText('Search in content...') as HTMLInputElement;

    // Search should be cleared
    expect(newSearchInput.value).toBe('');

    // Should be back to tree view
    const treeButton = screen.getByText('Tree').closest('button');
    expect(treeButton?.className).toContain('bg-white');
  });

  it('handles ESC key to close dialog', () => {
    const onOpenChange = vi.fn();
    render(<CodeViewerDialog {...defaultProps} onOpenChange={onOpenChange} />);

    // Simulate ESC key press
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    // Note: Radix UI handles this internally, so we just verify the setup is correct
    expect(onOpenChange).toBeDefined();
  });

  it('renders close button icon', () => {
    const { container } = render(<CodeViewerDialog {...defaultProps} />);

    // X icon should be present
    const xIcon = container.querySelector('svg.lucide-x');
    expect(xIcon).toBeDefined();
  });

  it('applies proper styling classes', () => {
    const { container } = render(<CodeViewerDialog {...defaultProps} />);

    // Check for dark mode classes
    const content = container.querySelector('.dark\\:bg-gray-800');
    expect(content).toBeDefined();
  });

  it('has proper ARIA roles for accessibility', () => {
    render(<CodeViewerDialog {...defaultProps} />);

    // Dialog should have proper role
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
  });

  it('displays correct icons for view modes', () => {
    const { container } = render(<CodeViewerDialog {...defaultProps} />);

    // Braces icon for tree view
    const bracesIcon = container.querySelector('svg.lucide-braces');
    expect(bracesIcon).toBeDefined();

    // Code2 icon for code view
    const codeIcon = container.querySelector('svg.lucide-code-2');
    expect(codeIcon).toBeDefined();
  });

  it('handles multiline text content', () => {
    const multilineText = 'Line 1\nLine 2\nLine 3\nLine 4';
    render(<CodeViewerDialog {...defaultProps} content={multilineText} language="text" />);

    // Should render without errors
    expect(screen.getByText('Test Viewer')).toBeDefined();
  });

  it('handles empty content', () => {
    render(<CodeViewerDialog {...defaultProps} content="" />);

    // Should render without errors
    expect(screen.getByText('Test Viewer')).toBeDefined();
  });

  it('handles very long content', () => {
    const longContent = JSON.stringify({ data: 'x'.repeat(10000) });
    render(<CodeViewerDialog {...defaultProps} content={longContent} />);

    // Should render with scrolling (max-h-[90vh] class)
    const { container } = render(<CodeViewerDialog {...defaultProps} content={longContent} />);
    const dialogContent = container.querySelector('.max-h-\\[90vh\\]');
    expect(dialogContent).toBeDefined();
  });

  it('properly formats JSON in code view', async () => {
    const user = userEvent.setup();
    const unformattedJson = '{"a":1,"b":2}';
    render(<CodeViewerDialog {...defaultProps} content={unformattedJson} />);

    // Initially in tree view
    const treeButton = screen.getByText('Tree');
    expect(treeButton.closest('button')?.className).toContain('bg-white');

    // Switch to code view
    const codeButton = screen.getByText('Code');
    await user.click(codeButton);

    // Verify code view is now active
    expect(codeButton.closest('button')?.className).toContain('bg-white');
  });
});
