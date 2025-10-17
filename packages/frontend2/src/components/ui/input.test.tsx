/**
 * Input Component Tests
 *
 * WHY: Test the Input component for different types, states, and interactions
 */

import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './input';

describe('Input', () => {
  it('renders input with placeholder', () => {
    render(<Input placeholder="Enter text" />);

    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeDefined();
    expect(input.tagName).toBe('INPUT');
  });

  it('renders with text type by default', () => {
    render(<Input placeholder="Text input" />);

    const input = screen.getByPlaceholderText('Text input');
    expect(input.getAttribute('type')).toBe(null);
  });

  it('renders with custom type', () => {
    render(<Input type="email" placeholder="Email" />);

    const input = screen.getByPlaceholderText('Email');
    expect(input.getAttribute('type')).toBe('email');
  });

  it('renders with password type', () => {
    render(<Input type="password" placeholder="Password" />);

    const input = screen.getByPlaceholderText('Password');
    expect(input.getAttribute('type')).toBe('password');
  });

  it('handles value changes', () => {
    const onChange = vi.fn();
    render(<Input placeholder="Input" onChange={onChange} />);

    const input = screen.getByPlaceholderText('Input');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(onChange).toHaveBeenCalled();
  });

  it('renders as disabled', () => {
    render(<Input placeholder="Disabled" disabled />);

    const input = screen.getByPlaceholderText('Disabled');
    expect(input.getAttribute('disabled')).toBe('');
    expect(input.className).toContain('disabled:cursor-not-allowed');
  });

  it('renders with custom className', () => {
    render(<Input placeholder="Custom" className="custom-input" />);

    const input = screen.getByPlaceholderText('Custom');
    expect(input.className).toContain('custom-input');
  });

  it('applies focus-visible styles', () => {
    render(<Input placeholder="Focus" />);

    const input = screen.getByPlaceholderText('Focus');
    expect(input.className).toContain('focus-visible:outline-none');
    expect(input.className).toContain('focus-visible:ring-2');
  });

  it('renders with default value', () => {
    render(<Input placeholder="Input" defaultValue="default" />);

    const input = screen.getByPlaceholderText('Input') as HTMLInputElement;
    expect(input.value).toBe('default');
  });

  it('renders with controlled value', () => {
    render(<Input placeholder="Input" value="controlled" onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText('Input') as HTMLInputElement;
    expect(input.value).toBe('controlled');
  });

  it('forwards ref to input element', () => {
    const ref = { current: null };
    render(<Input ref={ref} placeholder="Input" />);

    expect(ref.current).toBeDefined();
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('renders with required attribute', () => {
    render(<Input placeholder="Required" required />);

    const input = screen.getByPlaceholderText('Required');
    expect(input.getAttribute('required')).toBe('');
  });

  it('renders with maxLength attribute', () => {
    render(<Input placeholder="Input" maxLength={10} />);

    const input = screen.getByPlaceholderText('Input');
    expect(input.getAttribute('maxlength')).toBe('10');
  });

  it('renders with readonly attribute', () => {
    render(<Input placeholder="Readonly" readOnly />);

    const input = screen.getByPlaceholderText('Readonly');
    expect(input.getAttribute('readonly')).toBe('');
  });

  it('applies placeholder styles', () => {
    render(<Input placeholder="Placeholder test" />);

    const input = screen.getByPlaceholderText('Placeholder test');
    expect(input.className).toContain('placeholder:text-muted-foreground');
  });

  it('handles file input type', () => {
    render(<Input type="file" aria-label="File upload" />);

    const input = screen.getByLabelText('File upload');
    expect(input.getAttribute('type')).toBe('file');
    expect(input.className).toContain('file:border-0');
  });

  it('works in controlled mode', () => {
    const Component = () => {
      const [value, setValue] = React.useState('');
      return (
        <Input
          placeholder="Controlled"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      );
    };

    render(<Component />);

    const input = screen.getByPlaceholderText('Controlled') as HTMLInputElement;
    expect(input.value).toBe('');

    fireEvent.change(input, { target: { value: 'new value' } });
    expect(input.value).toBe('new value');
  });
});
