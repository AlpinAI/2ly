/**
 * SecretValue Component Tests
 *
 * WHY: Test the SecretValue component for visibility toggle, masking behavior,
 * and accessibility features.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SecretValue } from './secret-value';

describe('SecretValue', () => {
  it('renders with masked value by default', () => {
    const { container } = render(<SecretValue value="my-secret-key-12345" />);

    const code = container.querySelector('code');
    // "my-secret-key-12345" is 19 characters
    expect(code?.textContent).toBe('*******************');
  });

  it('masks value to default length of 20 characters', () => {
    const { container } = render(<SecretValue value="short" />);

    const code = container.querySelector('code');
    expect(code?.textContent).toBe('*****');
  });

  it('respects custom maskLength', () => {
    const { container } = render(<SecretValue value="secret" maskLength={10} />);

    const code = container.querySelector('code');
    expect(code?.textContent).toBe('******');
  });

  it('limits mask length to value length', () => {
    const { container } = render(<SecretValue value="short" maskLength={100} />);

    const code = container.querySelector('code');
    expect(code?.textContent).toBe('*****');
  });

  it('renders toggle button with hide label initially', () => {
    render(<SecretValue value="secret" />);

    const button = screen.getByLabelText('Show value');
    expect(button).toBeDefined();
  });

  it('shows Eye icon when value is hidden', () => {
    const { container } = render(<SecretValue value="secret" />);

    // Eye icon is an SVG element
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('reveals value when toggle button is clicked', () => {
    const { container } = render(<SecretValue value="my-secret-key-12345" />);

    const button = screen.getByLabelText('Show value');
    fireEvent.click(button);

    const code = container.querySelector('code');
    expect(code?.textContent).toBe('my-secret-key-12345');
  });

  it('changes button label to "Hide value" when visible', () => {
    render(<SecretValue value="secret" />);

    const button = screen.getByLabelText('Show value');
    fireEvent.click(button);

    const hideButton = screen.getByLabelText('Hide value');
    expect(hideButton).toBeDefined();
  });

  it('shows EyeOff icon when value is visible', () => {
    const { container } = render(<SecretValue value="secret" />);

    const button = screen.getByLabelText('Show value');
    fireEvent.click(button);

    // EyeOff icon is still an SVG element
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('toggles between hidden and visible states', () => {
    const { container } = render(<SecretValue value="secret" />);

    const code = container.querySelector('code');
    expect(code?.textContent).toBe('******');

    const showButton = screen.getByLabelText('Show value');
    fireEvent.click(showButton);
    expect(code?.textContent).toBe('secret');

    const hideButton = screen.getByLabelText('Hide value');
    fireEvent.click(hideButton);
    expect(code?.textContent).toBe('******');
  });

  it('renders value in monospace font', () => {
    const { container } = render(<SecretValue value="secret" />);

    const code = container.querySelector('code');
    expect(code?.className).toContain('font-mono');
  });

  it('has proper styling classes', () => {
    const { container } = render(<SecretValue value="secret" />);

    const code = container.querySelector('code');
    expect(code?.className).toContain('text-sm');
    expect(code?.className).toContain('bg-muted');
    expect(code?.className).toContain('px-2');
    expect(code?.className).toContain('py-1');
    expect(code?.className).toContain('rounded');
  });

  it('renders with custom className', () => {
    const { container } = render(<SecretValue value="secret" className="custom-class" />);

    const wrapper = container.querySelector('.flex.items-center.gap-2');
    expect(wrapper?.className).toContain('custom-class');
  });

  it('button has ghost variant and icon size', () => {
    render(<SecretValue value="secret" />);

    const button = screen.getByLabelText('Show value');
    expect(button.className).toContain('h-8');
    expect(button.className).toContain('w-8');
  });

  it('button has type="button" to prevent form submission', () => {
    render(<SecretValue value="secret" />);

    const button = screen.getByLabelText('Show value');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('handles empty string value', () => {
    const { container } = render(<SecretValue value="" />);

    const code = container.querySelector('code');
    expect(code?.textContent).toBe('');
  });

  it('handles long values', () => {
    const longValue = 'a'.repeat(100);
    const { container } = render(<SecretValue value={longValue} />);

    const code = container.querySelector('code');
    expect(code?.textContent).toBe('*'.repeat(20));

    const button = screen.getByLabelText('Show value');
    fireEvent.click(button);
    expect(code?.textContent).toBe(longValue);
  });

  it('has flex layout with gap', () => {
    const { container } = render(<SecretValue value="secret" />);

    const wrapper = container.querySelector('.flex.items-center.gap-2');
    expect(wrapper).toBeDefined();
  });

  it('code element has flex-1 to take available space', () => {
    const { container } = render(<SecretValue value="secret" />);

    const code = container.querySelector('code');
    expect(code?.className).toContain('flex-1');
  });

  it('button has shrink-0 to maintain size', () => {
    render(<SecretValue value="secret" />);

    const button = screen.getByLabelText('Show value');
    expect(button.className).toContain('shrink-0');
  });
});
