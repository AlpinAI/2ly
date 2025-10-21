/**
 * Label Component Tests
 *
 * WHY: Test the Label component for accessibility and styling
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label } from './label';

describe('Label', () => {
  it('renders label with text', () => {
    render(<Label>Username</Label>);

    const label = screen.getByText('Username');
    expect(label).toBeDefined();
  });

  it('renders with htmlFor attribute', () => {
    render(<Label htmlFor="email">Email</Label>);

    const label = screen.getByText('Email');
    expect(label.getAttribute('for')).toBe('email');
  });

  it('renders with custom className', () => {
    render(<Label className="custom-label">Custom</Label>);

    const label = screen.getByText('Custom');
    expect(label.className).toContain('custom-label');
  });

  it('applies default styling', () => {
    render(<Label>Default Label</Label>);

    const label = screen.getByText('Default Label');
    expect(label.className).toContain('text-sm');
    expect(label.className).toContain('font-medium');
    expect(label.className).toContain('leading-none');
  });

  it('has peer-disabled styles', () => {
    render(<Label>Disabled Peer</Label>);

    const label = screen.getByText('Disabled Peer');
    expect(label.className).toContain('peer-disabled:cursor-not-allowed');
    expect(label.className).toContain('peer-disabled:opacity-70');
  });

  it('forwards ref to label element', () => {
    const ref = { current: null };
    render(<Label ref={ref}>With Ref</Label>);

    expect(ref.current).toBeDefined();
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it('renders with children elements', () => {
    render(
      <Label>
        Field <span className="required">*</span>
      </Label>
    );

    const label = screen.getByText(/Field/);
    expect(label).toBeDefined();

    const required = screen.getByText('*');
    expect(required).toBeDefined();
    expect(required.className).toContain('required');
  });

  it('works with form inputs', () => {
    render(
      <div>
        <Label htmlFor="username">Username</Label>
        <input id="username" type="text" />
      </div>
    );

    const label = screen.getByText('Username');
    const input = document.getElementById('username');

    expect(label.getAttribute('for')).toBe('username');
    expect(input).toBeDefined();
  });
});
