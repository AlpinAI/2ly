/**
 * Button Component Tests
 *
 * WHY: Test the Button component with variants, sizes, and asChild prop
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByText('Click me');
    expect(button).toBeDefined();
    expect(button.tagName).toBe('BUTTON');
  });

  it('handles click events', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    const button = screen.getByText('Click me');
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders with default variant', () => {
    render(<Button>Default</Button>);

    const button = screen.getByText('Default');
    expect(button.className).toContain('bg-primary');
    expect(button.className).toContain('text-primary-foreground');
  });

  it('renders with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>);

    const button = screen.getByText('Delete');
    expect(button.className).toContain('bg-destructive');
    expect(button.className).toContain('text-destructive-foreground');
  });

  it('renders with outline variant', () => {
    render(<Button variant="outline">Outline</Button>);

    const button = screen.getByText('Outline');
    expect(button.className).toContain('border');
    expect(button.className).toContain('bg-background');
  });

  it('renders with secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);

    const button = screen.getByText('Secondary');
    expect(button.className).toContain('bg-secondary');
    expect(button.className).toContain('text-secondary-foreground');
  });

  it('renders with ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);

    const button = screen.getByText('Ghost');
    expect(button.className).toContain('hover:bg-accent');
  });

  it('renders with link variant', () => {
    render(<Button variant="link">Link</Button>);

    const button = screen.getByText('Link');
    expect(button.className).toContain('text-primary');
    expect(button.className).toContain('underline-offset-4');
  });

  it('renders with default size', () => {
    render(<Button>Default Size</Button>);

    const button = screen.getByText('Default Size');
    expect(button.className).toContain('h-10');
    expect(button.className).toContain('px-4');
  });

  it('renders with sm size', () => {
    render(<Button size="sm">Small</Button>);

    const button = screen.getByText('Small');
    expect(button.className).toContain('h-9');
  });

  it('renders with lg size', () => {
    render(<Button size="lg">Large</Button>);

    const button = screen.getByText('Large');
    expect(button.className).toContain('h-11');
  });

  it('renders with icon size', () => {
    render(<Button size="icon" aria-label="Icon button">X</Button>);

    const button = screen.getByLabelText('Icon button');
    expect(button.className).toContain('h-10');
    expect(button.className).toContain('w-10');
  });

  it('renders with custom className', () => {
    render(<Button className="custom-class">Custom</Button>);

    const button = screen.getByText('Custom');
    expect(button.className).toContain('custom-class');
  });

  it('renders as disabled', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByText('Disabled');
    expect(button.getAttribute('disabled')).toBe('');
    expect(button.className).toContain('disabled:opacity-50');
  });

  it('renders with type submit', () => {
    render(<Button type="submit">Submit</Button>);

    const button = screen.getByText('Submit');
    expect(button.getAttribute('type')).toBe('submit');
  });

  it('renders asChild with Slot component', () => {
    render(
      <Button asChild>
        <a href="/test">Link as Button</a>
      </Button>
    );

    const link = screen.getByText('Link as Button');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/test');
  });

  it('forwards ref to button element', () => {
    const ref = { current: null };
    render(<Button ref={ref}>With Ref</Button>);

    expect(ref.current).toBeDefined();
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('applies focus-visible styles', () => {
    render(<Button>Focus me</Button>);

    const button = screen.getByText('Focus me');
    expect(button.className).toContain('focus-visible:outline-none');
    expect(button.className).toContain('focus-visible:ring-2');
  });

  it('prevents pointer events when disabled', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByText('Disabled');
    expect(button.className).toContain('disabled:pointer-events-none');
  });
});
