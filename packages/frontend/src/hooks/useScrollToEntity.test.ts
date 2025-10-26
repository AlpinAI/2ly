/**
 * useScrollToEntity Hook Tests
 *
 * Tests entity scrolling and highlighting functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollToEntity } from './useScrollToEntity';

describe('useScrollToEntity', () => {
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    // Create a mock element
    mockElement = document.createElement('div');
    mockElement.scrollIntoView = vi.fn();
    mockElement.classList.add = vi.fn();
    mockElement.classList.remove = vi.fn();

    // Mock setTimeout
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return a function', () => {
    const { result } = renderHook(() => useScrollToEntity());
    expect(typeof result.current).toBe('function');
  });

  it('should call scrollIntoView when invoked with an element', () => {
    const { result } = renderHook(() => useScrollToEntity());

    result.current(mockElement);

    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  });

  it('should add highlight class to element', () => {
    const { result } = renderHook(() => useScrollToEntity());

    result.current(mockElement);

    expect(mockElement.classList.add).toHaveBeenCalledWith('entity-highlight');
  });

  it('should remove highlight class after timeout', () => {
    const { result } = renderHook(() => useScrollToEntity());

    result.current(mockElement);

    // Fast-forward time by 2.5 seconds
    vi.advanceTimersByTime(2500);

    expect(mockElement.classList.remove).toHaveBeenCalledWith('entity-highlight');
  });

  it('should clear previous timeout when called again', () => {
    const { result } = renderHook(() => useScrollToEntity());
    const mockElement2 = document.createElement('div');
    mockElement2.classList.add = vi.fn();
    mockElement2.classList.remove = vi.fn();
    mockElement2.scrollIntoView = vi.fn();

    // First call
    result.current(mockElement);

    // Advance time partway
    vi.advanceTimersByTime(1000);

    // Second call should clear first timeout
    result.current(mockElement2);

    // Advance to when first timeout would have fired
    vi.advanceTimersByTime(1500);

    // First element should not have removeClass called yet
    expect(mockElement.classList.remove).not.toHaveBeenCalled();

    // Advance to when second timeout fires
    vi.advanceTimersByTime(1000);

    // Second element should have removeClass called
    expect(mockElement2.classList.remove).toHaveBeenCalledWith('entity-highlight');
  });
});
