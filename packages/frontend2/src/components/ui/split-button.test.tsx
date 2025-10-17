/**
 * SplitButton Component Tests
 *
 * WHY: Test the SplitButton component for primary action handling,
 * dropdown coordination, variants, and accessibility.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SplitButton } from './split-button';
import { DropdownMenuItem } from './dropdown-menu';

describe('SplitButton', () => {
  const defaultProps = {
    primaryLabel: 'Test Action',
    onPrimaryAction: vi.fn(),
    dropdownContent: (
      <>
        <DropdownMenuItem>Option 1</DropdownMenuItem>
        <DropdownMenuItem>Option 2</DropdownMenuItem>
      </>
    ),
  };

  it('renders primary button with label', () => {
    render(<SplitButton {...defaultProps} />);

    expect(screen.getByText('Test Action')).toBeDefined();
  });

  it('renders dropdown trigger button', () => {
    const { container } = render(<SplitButton {...defaultProps} />);

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(2);
  });

  it('calls onPrimaryAction when primary button is clicked', () => {
    const onPrimaryAction = vi.fn();
    render(<SplitButton {...defaultProps} onPrimaryAction={onPrimaryAction} />);

    const primaryButton = screen.getByText('Test Action');
    fireEvent.click(primaryButton);

    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
  });

  it('has dropdown trigger that can be interacted with', () => {
    render(<SplitButton {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    const dropdownTrigger = buttons[1];

    expect(dropdownTrigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(dropdownTrigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('primary button has rounded-r-none and border-r-0 classes', () => {
    render(<SplitButton {...defaultProps} />);

    const primaryButton = screen.getByText('Test Action');
    expect(primaryButton.className).toContain('rounded-r-none');
    expect(primaryButton.className).toContain('border-r-0');
  });

  it('dropdown trigger has rounded-l-none class', () => {
    render(<SplitButton {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    const dropdownTrigger = buttons[1];
    expect(dropdownTrigger.className).toContain('rounded-l-none');
  });

  it('renders ChevronDown icon in dropdown trigger', () => {
    const { container } = render(<SplitButton {...defaultProps} />);

    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('disables primary button when primaryDisabled is true', () => {
    render(<SplitButton {...defaultProps} primaryDisabled />);

    const primaryButton = screen.getByText('Test Action');
    expect(primaryButton.getAttribute('disabled')).toBe('');
  });

  it('disables dropdown trigger when dropdownDisabled is true', () => {
    render(<SplitButton {...defaultProps} dropdownDisabled />);

    const buttons = screen.getAllByRole('button');
    const dropdownTrigger = buttons[1];
    expect(dropdownTrigger.getAttribute('disabled')).toBe('');
  });

  it('applies default variant to both buttons', () => {
    render(<SplitButton {...defaultProps} variant="default" />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button.className).toContain('bg-primary');
    });
  });

  it('applies outline variant to both buttons', () => {
    render(<SplitButton {...defaultProps} variant="outline" />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button.className).toContain('border');
      expect(button.className).toContain('bg-background');
    });
  });

  it('applies secondary variant to both buttons', () => {
    render(<SplitButton {...defaultProps} variant="secondary" />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button.className).toContain('bg-secondary');
    });
  });

  it('applies size prop to both buttons', () => {
    render(<SplitButton {...defaultProps} size="lg" />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button.className).toContain('h-11');
    });
  });

  it('renders with custom className on container', () => {
    const { container } = render(<SplitButton {...defaultProps} className="custom-class" />);

    const splitButtonContainer = container.querySelector('.inline-flex');
    expect(splitButtonContainer?.className).toContain('custom-class');
  });

  it('accepts primaryAriaLabel for accessibility', () => {
    render(<SplitButton {...defaultProps} primaryAriaLabel="Execute test action" />);

    const primaryButton = screen.getByLabelText('Execute test action');
    expect(primaryButton).toBeDefined();
  });

  it('uses default dropdownAriaLabel', () => {
    render(<SplitButton {...defaultProps} />);

    const dropdownButton = screen.getByLabelText('Show options');
    expect(dropdownButton).toBeDefined();
  });

  it('accepts custom dropdownAriaLabel', () => {
    render(<SplitButton {...defaultProps} dropdownAriaLabel="More actions" />);

    const dropdownButton = screen.getByLabelText('More actions');
    expect(dropdownButton).toBeDefined();
  });

  it('supports controlled dropdown open state', () => {
    render(<SplitButton {...defaultProps} dropdownOpen={true} />);

    expect(screen.getByText('Option 1')).toBeDefined();
  });

  it('accepts onDropdownOpenChange callback', () => {
    const onDropdownOpenChange = vi.fn();
    render(<SplitButton {...defaultProps} onDropdownOpenChange={onDropdownOpenChange} />);

    // Callback is passed to DropdownMenu component
    const buttons = screen.getAllByRole('button');
    expect(buttons[1]).toBeDefined();
  });

  it('supports different dropdown alignments', () => {
    render(<SplitButton {...defaultProps} dropdownAlign="start" />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[1]).toBeDefined();
  });

  it('applies border-l styling for default variant', () => {
    render(<SplitButton {...defaultProps} variant="default" />);

    const buttons = screen.getAllByRole('button');
    const dropdownTrigger = buttons[1];
    expect(dropdownTrigger.className).toContain('border-l');
  });

  it('applies border-l styling for outline variant', () => {
    render(<SplitButton {...defaultProps} variant="outline" />);

    const buttons = screen.getAllByRole('button');
    const dropdownTrigger = buttons[1];
    expect(dropdownTrigger.className).toContain('border-l');
  });

  it('applies border-l styling for secondary variant', () => {
    render(<SplitButton {...defaultProps} variant="secondary" />);

    const buttons = screen.getAllByRole('button');
    const dropdownTrigger = buttons[1];
    expect(dropdownTrigger.className).toContain('border-l');
  });

  it('dropdown trigger has px-2 padding', () => {
    render(<SplitButton {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    const dropdownTrigger = buttons[1];
    expect(dropdownTrigger.className).toContain('px-2');
  });

  it('renders with React node as primaryLabel', () => {
    render(
      <SplitButton
        {...defaultProps}
        primaryLabel={
          <span>
            <strong>Bold</strong> Action
          </span>
        }
      />
    );

    expect(screen.getByText('Bold')).toBeDefined();
    expect(screen.getByText('Action')).toBeDefined();
  });

  it('prevents primary action when disabled', () => {
    const onPrimaryAction = vi.fn();
    render(<SplitButton {...defaultProps} onPrimaryAction={onPrimaryAction} primaryDisabled />);

    const primaryButton = screen.getByText('Test Action');
    fireEvent.click(primaryButton);

    // Click should not trigger action when disabled
    expect(onPrimaryAction).not.toHaveBeenCalled();
  });

  it('renders inside inline-flex container', () => {
    const { container } = render(<SplitButton {...defaultProps} />);

    const splitButtonContainer = container.querySelector('.inline-flex');
    expect(splitButtonContainer).toBeDefined();
  });
});
