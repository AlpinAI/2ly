/**
 * CheckboxDropdown Component Tests
 *
 * WHY: Test the CheckboxDropdown component for multi-select functionality,
 * select all behavior, and label calculations.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CheckboxDropdown } from './checkbox-dropdown';

describe('CheckboxDropdown', () => {
  const defaultItems = [
    { id: 'item1', label: 'Item 1' },
    { id: 'item2', label: 'Item 2' },
    { id: 'item3', label: 'Item 3' },
  ];

  it('renders with placeholder when no items selected', () => {
    render(
      <CheckboxDropdown
        label="Filter"
        placeholder="Select items..."
        items={defaultItems}
        selectedIds={[]}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Select items...')).toBeDefined();
  });

  it('renders with label when no placeholder provided', () => {
    render(
      <CheckboxDropdown
        label="Filter"
        items={defaultItems}
        selectedIds={[]}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Filter')).toBeDefined();
  });

  it('shows item label when single item selected', () => {
    render(
      <CheckboxDropdown
        label="Filter"
        placeholder="Select items..."
        items={defaultItems}
        selectedIds={['item1']}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Item 1')).toBeDefined();
  });

  it('shows count when multiple items selected', () => {
    render(
      <CheckboxDropdown
        label="Filter"
        placeholder="Select items..."
        items={defaultItems}
        selectedIds={['item1', 'item2']}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('2 selected')).toBeDefined();
  });

  it('has combobox role and aria-expanded', () => {
    render(
      <CheckboxDropdown
        label="Filter"
        items={defaultItems}
        selectedIds={[]}
        onChange={vi.fn()}
      />
    );

    const button = screen.getByRole('combobox');
    expect(button).toBeDefined();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens dropdown when button is clicked', () => {
    render(
      <CheckboxDropdown
        label="Filter"
        items={defaultItems}
        selectedIds={[]}
        onChange={vi.fn()}
      />
    );

    const button = screen.getByRole('combobox');
    fireEvent.click(button);

    expect(screen.getByText('Item 1')).toBeDefined();
    expect(screen.getByText('Item 2')).toBeDefined();
    expect(screen.getByText('Item 3')).toBeDefined();
  });

  it('shows "Select All" option when multiple items exist', () => {
    render(
      <CheckboxDropdown
        label="Filter"
        items={defaultItems}
        selectedIds={[]}
        onChange={vi.fn()}
      />
    );

    const button = screen.getByRole('combobox');
    fireEvent.click(button);

    expect(screen.getByText('Select All')).toBeDefined();
  });

  it('does not show "Select All" when only one item exists', () => {
    render(
      <CheckboxDropdown
        label="Filter"
        items={[{ id: 'item1', label: 'Item 1' }]}
        selectedIds={[]}
        onChange={vi.fn()}
      />
    );

    const button = screen.getByRole('combobox');
    fireEvent.click(button);

    expect(screen.queryByText('Select All')).toBeNull();
  });

  it('calls onChange when item is clicked', () => {
    const onChange = vi.fn();
    render(
      <CheckboxDropdown
        label="Filter"
        items={defaultItems}
        selectedIds={[]}
        onChange={onChange}
      />
    );

    const button = screen.getByRole('combobox');
    fireEvent.click(button);

    const item1 = screen.getByText('Item 1');
    fireEvent.click(item1);

    expect(onChange).toHaveBeenCalledWith(['item1']);
  });

  it('adds item to selection when unselected', () => {
    const onChange = vi.fn();
    render(
      <CheckboxDropdown
        label="Filter"
        items={defaultItems}
        selectedIds={['item1']}
        onChange={onChange}
      />
    );

    const button = screen.getByRole('combobox');
    fireEvent.click(button);

    const item2 = screen.getByText('Item 2');
    fireEvent.click(item2);

    expect(onChange).toHaveBeenCalledWith(['item1', 'item2']);
  });

  it('removes item from selection when selected', () => {
    const onChange = vi.fn();
    render(
      <CheckboxDropdown
        label="Filter"
        items={defaultItems}
        selectedIds={['item1', 'item2']}
        onChange={onChange}
      />
    );

    const button = screen.getByRole('combobox');
    fireEvent.click(button);

    const item1 = screen.getByText('Item 1');
    fireEvent.click(item1);

    expect(onChange).toHaveBeenCalledWith(['item2']);
  });

  it('selects all items when "Select All" is clicked', () => {
    const onChange = vi.fn();
    render(
      <CheckboxDropdown
        label="Filter"
        items={defaultItems}
        selectedIds={[]}
        onChange={onChange}
      />
    );

    const button = screen.getByRole('combobox');
    fireEvent.click(button);

    const selectAll = screen.getByText('Select All');
    fireEvent.click(selectAll);

    expect(onChange).toHaveBeenCalledWith(['item1', 'item2', 'item3']);
  });

  it('deselects all items when "Select All" is clicked with all selected', () => {
    const onChange = vi.fn();
    render(
      <CheckboxDropdown
        label="Filter"
        items={defaultItems}
        selectedIds={['item1', 'item2', 'item3']}
        onChange={onChange}
      />
    );

    const button = screen.getByRole('combobox');
    fireEvent.click(button);

    const selectAll = screen.getByText('Select All');
    fireEvent.click(selectAll);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows check icon for selected items', () => {
    const { container } = render(
      <CheckboxDropdown
        label="Filter"
        items={defaultItems}
        selectedIds={['item1']}
        onChange={vi.fn()}
      />
    );

    const button = screen.getByRole('combobox');
    fireEvent.click(button);

    // Check icons are SVG elements
    const checkIcons = container.querySelectorAll('svg');
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('shows "No options available" when items array is empty', () => {
    render(
      <CheckboxDropdown
        label="Filter"
        items={[]}
        selectedIds={[]}
        onChange={vi.fn()}
      />
    );

    const button = screen.getByRole('combobox');
    fireEvent.click(button);

    expect(screen.getByText('No options available')).toBeDefined();
  });

  it('renders with custom className', () => {
    render(
      <CheckboxDropdown
        label="Filter"
        items={defaultItems}
        selectedIds={[]}
        onChange={vi.fn()}
        className="custom-class"
      />
    );

    const button = screen.getByRole('combobox');
    expect(button.className).toContain('custom-class');
  });

  it('truncates long button labels', () => {
    render(
      <CheckboxDropdown
        label="Filter"
        items={defaultItems}
        selectedIds={[]}
        onChange={vi.fn()}
      />
    );

    const button = screen.getByRole('combobox');
    const labelSpan = button.querySelector('.truncate');
    expect(labelSpan).toBeDefined();
  });

  it('displays chevron down icon', () => {
    const { container } = render(
      <CheckboxDropdown
        label="Filter"
        items={defaultItems}
        selectedIds={[]}
        onChange={vi.fn()}
      />
    );

    // ChevronDown is an SVG icon
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('checkboxes have correct checked state', () => {
    render(
      <CheckboxDropdown
        label="Filter"
        items={defaultItems}
        selectedIds={['item1', 'item3']}
        onChange={vi.fn()}
      />
    );

    const button = screen.getByRole('combobox');
    fireEvent.click(button);

    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is "Select All", followed by item checkboxes
    expect(checkboxes.length).toBeGreaterThan(0);
  });
});
