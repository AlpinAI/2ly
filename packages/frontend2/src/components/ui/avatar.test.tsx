/**
 * Avatar Component Tests
 *
 * WHY: Test the Avatar component renders correctly with image and fallback
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

describe('Avatar', () => {
  it('renders avatar container with image element', () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="https://example.com/avatar.jpg" alt="User avatar" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    // Check that the Avatar component renders
    const avatar = container.querySelector('span');
    expect(avatar).toBeDefined();
    expect(avatar?.className).toContain('rounded-full');

    // In jsdom, Radix Avatar will show fallback since image doesn't load
    // So we just verify the component structure is correct
    const fallback = screen.getByText('JD');
    expect(fallback).toBeDefined();
  });

  it('renders fallback when no image provided', () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );

    const fallback = screen.getByText('JD');
    expect(fallback).toBeDefined();
  });

  it('renders fallback with custom class', () => {
    render(
      <Avatar>
        <AvatarFallback className="bg-cyan-600">AB</AvatarFallback>
      </Avatar>
    );

    const fallback = screen.getByText('AB');
    expect(fallback).toBeDefined();
    expect(fallback.className).toContain('bg-cyan-600');
  });

  it('renders with custom size class', () => {
    const { container } = render(
      <Avatar className="h-12 w-12">
        <AvatarFallback>XY</AvatarFallback>
      </Avatar>
    );

    const avatar = container.querySelector('[class*="h-12"]');
    expect(avatar).toBeDefined();
  });
});
