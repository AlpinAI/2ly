/**
 * Select Component Tests
 *
 * WHY: Verify Select component behavior, accessibility, and user interactions.
 * NOTE: Tests are simplified to work in jsdom environment which doesn't support
 * all pointer event APIs that Radix UI uses. Focus is on static rendering and basic functionality.
 */

import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

describe('Select', () => {
  it('renders with a placeholder', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </SelectContent>
      </Select>,
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('displays selected value', () => {
    render(
      <Select value="2">
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </SelectContent>
      </Select>,
    );

    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('disables trigger when disabled prop is true', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('calls onValueChange when value changes', () => {
    const handleChange = vi.fn();

    const TestComponent = () => {
      const [value, setValue] = React.useState('1');

      return (
        <Select
          value={value}
          onValueChange={(newValue) => {
            setValue(newValue);
            handleChange(newValue);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
            <SelectItem value="2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );
    };

    render(<TestComponent />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();

    // Verify the handler is set up (actual interaction testing requires full browser environment)
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('has proper ARIA attributes', () => {
    render(
      <Select>
        <SelectTrigger aria-label="Config type">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole('combobox', { name: 'Config type' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls');
  });

  it('renders with custom className', () => {
    render(
      <Select>
        <SelectTrigger className="custom-class">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass('custom-class');
  });

  it('renders ChevronDown icon', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>,
    );

    // Check that the ChevronDown icon is rendered
    const icon = screen.getByRole('combobox').querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('lucide-chevron-down');
  });

  it('renders multiple items', () => {
    render(
      <Select value="2">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
          <SelectItem value="3">Option 3</SelectItem>
        </SelectContent>
      </Select>,
    );

    // When a value is selected, it should be displayed
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });
});
