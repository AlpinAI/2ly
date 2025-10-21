/**
 * Alert Component Tests
 *
 * WHY: Test the Alert component with variants, title, and description
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from './alert';

describe('Alert', () => {
  it('renders alert with content', () => {
    render(<Alert>Alert message</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert).toBeDefined();
    expect(screen.getByText('Alert message')).toBeDefined();
  });

  it('renders with default variant', () => {
    render(<Alert>Default alert</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-background');
    expect(alert.className).toContain('text-foreground');
  });

  it('renders with destructive variant', () => {
    render(<Alert variant="destructive">Error alert</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-red-50');
    expect(alert.className).toContain('text-red-600');
  });

  it('renders with success variant', () => {
    render(<Alert variant="success">Success alert</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-green-50');
    expect(alert.className).toContain('text-green-700');
  });

  it('renders with custom className', () => {
    render(<Alert className="custom-alert">Custom</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('custom-alert');
  });

  it('has proper ARIA role', () => {
    render(<Alert>Alert</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert).toBeDefined();
  });

  it('forwards ref to alert element', () => {
    const ref = { current: null };
    render(<Alert ref={ref}>With Ref</Alert>);

    expect(ref.current).toBeDefined();
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('AlertTitle', () => {
  it('renders alert title', () => {
    render(<AlertTitle>Alert Title</AlertTitle>);

    const title = screen.getByText('Alert Title');
    expect(title).toBeDefined();
    expect(title.tagName).toBe('H5');
  });

  it('applies default styling', () => {
    render(<AlertTitle>Title</AlertTitle>);

    const title = screen.getByText('Title');
    expect(title.className).toContain('font-medium');
    expect(title.className).toContain('leading-none');
  });

  it('renders with custom className', () => {
    render(<AlertTitle className="custom-title">Title</AlertTitle>);

    const title = screen.getByText('Title');
    expect(title.className).toContain('custom-title');
  });

  it('forwards ref to title element', () => {
    const ref = { current: null };
    render(<AlertTitle ref={ref}>Title</AlertTitle>);

    expect(ref.current).toBeDefined();
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });
});

describe('AlertDescription', () => {
  it('renders alert description', () => {
    render(<AlertDescription>Description text</AlertDescription>);

    const description = screen.getByText('Description text');
    expect(description).toBeDefined();
    expect(description.tagName).toBe('DIV');
  });

  it('applies default styling', () => {
    render(<AlertDescription>Description</AlertDescription>);

    const description = screen.getByText('Description');
    expect(description.className).toContain('text-sm');
  });

  it('renders with custom className', () => {
    render(<AlertDescription className="custom-desc">Description</AlertDescription>);

    const description = screen.getByText('Description');
    expect(description.className).toContain('custom-desc');
  });

  it('forwards ref to description element', () => {
    const ref = { current: null };
    render(<AlertDescription ref={ref}>Description</AlertDescription>);

    expect(ref.current).toBeDefined();
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('Alert Composition', () => {
  it('renders complete alert with title and description', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeDefined();
    expect(screen.getByText('Error')).toBeDefined();
    expect(screen.getByText('Something went wrong')).toBeDefined();
  });

  it('renders alert with icon and content', () => {
    const { container } = render(
      <Alert>
        <svg data-testid="alert-icon" />
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>
    );

    const icon = container.querySelector('[data-testid="alert-icon"]');
    expect(icon).toBeDefined();
  });
});
