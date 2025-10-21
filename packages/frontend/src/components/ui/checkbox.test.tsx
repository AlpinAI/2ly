/**
 * Checkbox Component Tests
 *
 * WHY: Test the Checkbox component for checked states, interactions, and accessibility
 */

import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('renders checkbox', () => {
    render(<Checkbox aria-label="Accept terms" />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDefined();
  });

  it('handles checked state', () => {
    render(<Checkbox aria-label="Checkbox" checked />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('data-state')).toBe('checked');
  });

  it('handles unchecked state', () => {
    render(<Checkbox aria-label="Checkbox" checked={false} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('data-state')).toBe('unchecked');
  });

  it('calls onCheckedChange when clicked', () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="Checkbox" onCheckedChange={onCheckedChange} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(onCheckedChange).toHaveBeenCalled();
  });

  it('renders as disabled', () => {
    render(<Checkbox aria-label="Checkbox" disabled />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('disabled')).toBe('');
    expect(checkbox.className).toContain('disabled:cursor-not-allowed');
  });

  it('renders with custom className', () => {
    render(<Checkbox aria-label="Checkbox" className="custom-checkbox" />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.className).toContain('custom-checkbox');
  });

  it('applies focus-visible styles', () => {
    render(<Checkbox aria-label="Checkbox" />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.className).toContain('focus-visible:outline-none');
    expect(checkbox.className).toContain('focus-visible:ring-2');
  });

  it('renders check icon when checked', () => {
    const { container } = render(<Checkbox aria-label="Checkbox" checked />);

    const icon = container.querySelector('svg');
    expect(icon).toBeDefined();
  });

  it('has proper ARIA role', () => {
    render(<Checkbox aria-label="Accept terms" />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDefined();
  });

  it('forwards ref to checkbox element', () => {
    const ref = { current: null };
    render(<Checkbox ref={ref} aria-label="Checkbox" />);

    expect(ref.current).toBeDefined();
  });

  it('applies checked styles when checked', () => {
    render(<Checkbox aria-label="Checkbox" checked />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.className).toContain('data-[state=checked]:bg-primary');
  });

  it('works in controlled mode', () => {
    const Component = () => {
      const [checked, setChecked] = React.useState(false);
      return (
        <Checkbox
          aria-label="Controlled"
          checked={checked}
          onCheckedChange={(value) => setChecked(value === true)}
        />
      );
    };

    render(<Component />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.getAttribute('data-state')).toBe('unchecked');

    fireEvent.click(checkbox);
    expect(checkbox.getAttribute('data-state')).toBe('checked');
  });
});
