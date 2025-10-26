/**
 * useUrlSync Hook Tests
 *
 * Tests URL synchronization functionality for deep linking.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useUrlSync } from './useUrlSync';

// Mock useSearchParams
const mockSetSearchParams = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  };
});

describe('useUrlSync', () => {
  it('should return null when no id parameter is present', () => {
    mockSearchParams.delete('id');
    const { result } = renderHook(() => useUrlSync(), {
      wrapper: BrowserRouter,
    });

    expect(result.current.selectedId).toBeNull();
  });

  it('should return id from URL query parameter', () => {
    mockSearchParams.set('id', 'test-id-123');
    const { result } = renderHook(() => useUrlSync(), {
      wrapper: BrowserRouter,
    });

    expect(result.current.selectedId).toBe('test-id-123');
  });

  it('should update URL when setSelectedId is called', () => {
    mockSearchParams.delete('id');
    const { result } = renderHook(() => useUrlSync(), {
      wrapper: BrowserRouter,
    });

    act(() => {
      result.current.setSelectedId('new-id');
    });

    expect(mockSetSearchParams).toHaveBeenCalled();
  });

  it('should remove id from URL when setSelectedId is called with null', () => {
    mockSearchParams.set('id', 'existing-id');
    const { result } = renderHook(() => useUrlSync(), {
      wrapper: BrowserRouter,
    });

    act(() => {
      result.current.setSelectedId(null);
    });

    expect(mockSetSearchParams).toHaveBeenCalled();
  });

  it('should clear selection when clearSelection is called', () => {
    mockSearchParams.set('id', 'test-id');
    const { result } = renderHook(() => useUrlSync(), {
      wrapper: BrowserRouter,
    });

    act(() => {
      result.current.clearSelection();
    });

    expect(mockSetSearchParams).toHaveBeenCalled();
  });
});
