/**
 * Textarea Component Tests
 *
 * WHY: Test the Textarea component for different states and interactions
 */

import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders textarea with placeholder', () => {
    render(<Textarea placeholder="Enter description" />);

    const textarea = screen.getByPlaceholderText('Enter description');
    expect(textarea).toBeDefined();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('handles value changes', () => {
    const onChange = vi.fn();
    render(<Textarea placeholder="Description" onChange={onChange} />);

    const textarea = screen.getByPlaceholderText('Description');
    fireEvent.change(textarea, { target: { value: 'test content' } });

    expect(onChange).toHaveBeenCalled();
  });

  it('renders as disabled', () => {
    render(<Textarea placeholder="Disabled" disabled />);

    const textarea = screen.getByPlaceholderText('Disabled');
    expect(textarea.getAttribute('disabled')).toBe('');
    expect(textarea.className).toContain('disabled:cursor-not-allowed');
  });

  it('renders with custom className', () => {
    render(<Textarea placeholder="Custom" className="custom-textarea" />);

    const textarea = screen.getByPlaceholderText('Custom');
    expect(textarea.className).toContain('custom-textarea');
  });

  it('applies focus-visible styles', () => {
    render(<Textarea placeholder="Focus" />);

    const textarea = screen.getByPlaceholderText('Focus');
    expect(textarea.className).toContain('focus-visible:outline-none');
    expect(textarea.className).toContain('focus-visible:ring-2');
  });

  it('renders with default value', () => {
    render(<Textarea placeholder="Textarea" defaultValue="default content" />);

    const textarea = screen.getByPlaceholderText('Textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('default content');
  });

  it('renders with controlled value', () => {
    render(<Textarea placeholder="Textarea" value="controlled" onChange={vi.fn()} />);

    const textarea = screen.getByPlaceholderText('Textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('controlled');
  });

  it('forwards ref to textarea element', () => {
    const ref = { current: null };
    render(<Textarea ref={ref} placeholder="Textarea" />);

    expect(ref.current).toBeDefined();
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('renders with required attribute', () => {
    render(<Textarea placeholder="Required" required />);

    const textarea = screen.getByPlaceholderText('Required');
    expect(textarea.getAttribute('required')).toBe('');
  });

  it('renders with maxLength attribute', () => {
    render(<Textarea placeholder="Textarea" maxLength={100} />);

    const textarea = screen.getByPlaceholderText('Textarea');
    expect(textarea.getAttribute('maxlength')).toBe('100');
  });

  it('renders with readonly attribute', () => {
    render(<Textarea placeholder="Readonly" readOnly />);

    const textarea = screen.getByPlaceholderText('Readonly');
    expect(textarea.getAttribute('readonly')).toBe('');
  });

  it('applies placeholder styles', () => {
    render(<Textarea placeholder="Placeholder test" />);

    const textarea = screen.getByPlaceholderText('Placeholder test');
    expect(textarea.className).toContain('placeholder:text-muted-foreground');
  });

  it('renders with rows attribute', () => {
    render(<Textarea placeholder="Textarea" rows={5} />);

    const textarea = screen.getByPlaceholderText('Textarea');
    expect(textarea.getAttribute('rows')).toBe('5');
  });

  it('has resize-y class for vertical resizing', () => {
    render(<Textarea placeholder="Resizable" />);

    const textarea = screen.getByPlaceholderText('Resizable');
    expect(textarea.className).toContain('resize-y');
  });

  it('works in controlled mode', () => {
    const Component = () => {
      const [value, setValue] = React.useState('');
      return (
        <Textarea
          placeholder="Controlled"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      );
    };

    render(<Component />);

    const textarea = screen.getByPlaceholderText('Controlled') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');

    fireEvent.change(textarea, { target: { value: 'new content' } });
    expect(textarea.value).toBe('new content');
  });
});
