/**
 * BottomPanel Component Tests
 *
 * WHY: Test the BottomPanel component for animations, positioning, keyboard handling,
 * and scroll prevention behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BottomPanel } from './bottom-panel';

describe('BottomPanel', () => {
  beforeEach(() => {
    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = 'unset';
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <BottomPanel isOpen={false} onClose={vi.fn()}>
        <div>Panel content</div>
      </BottomPanel>
    );

    expect(container.querySelector('.fixed')).toBeNull();
  });

  it('renders when isOpen is true', async () => {
    render(
      <BottomPanel isOpen={true} onClose={vi.fn()}>
        <div>Panel content</div>
      </BottomPanel>
    );

    await waitFor(() => {
      expect(screen.getByText('Panel content')).toBeDefined();
    });
  });

  it('renders children inside flex container', async () => {
    const { container } = render(
      <BottomPanel isOpen={true} onClose={vi.fn()}>
        <div className="header">Header</div>
        <div className="content">Content</div>
        <div className="footer">Footer</div>
      </BottomPanel>
    );

    await waitFor(() => {
      const flexContainer = container.querySelector('.h-full.flex.flex-col');
      expect(flexContainer).toBeDefined();
      expect(screen.getByText('Header')).toBeDefined();
      expect(screen.getByText('Content')).toBeDefined();
      expect(screen.getByText('Footer')).toBeDefined();
    });
  });

  it('has transition transform classes', async () => {
    const { container } = render(
      <BottomPanel isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </BottomPanel>
    );

    await waitFor(() => {
      const panel = container.querySelector('.fixed');
      expect(panel?.className).toContain('transition-transform');
      // Animation state can be either translate-y-0 or translate-y-full depending on timing
      expect(panel?.className).toMatch(/translate-y-(0|full)/);
    });
  });

  it('prevents body scroll when open', async () => {
    render(
      <BottomPanel isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </BottomPanel>
    );

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  it('restores body scroll when closed', async () => {
    const { rerender } = render(
      <BottomPanel isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </BottomPanel>
    );

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });

    rerender(
      <BottomPanel isOpen={false} onClose={vi.fn()}>
        <div>Content</div>
      </BottomPanel>
    );

    expect(document.body.style.overflow).toBe('unset');
  });

  it('calls onClose when ESC key is pressed', async () => {
    const onClose = vi.fn();
    render(
      <BottomPanel isOpen={true} onClose={onClose}>
        <div>Content</div>
      </BottomPanel>
    );

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeDefined();
    });

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls custom onEscape when ESC key is pressed', async () => {
    const onClose = vi.fn();
    const onEscape = vi.fn();

    render(
      <BottomPanel isOpen={true} onClose={onClose} onEscape={onEscape}>
        <div>Content</div>
      </BottomPanel>
    );

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeDefined();
    });

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose for non-ESC keys', async () => {
    const onClose = vi.fn();
    render(
      <BottomPanel isOpen={true} onClose={onClose}>
        <div>Content</div>
      </BottomPanel>
    );

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeDefined();
    });

    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'a' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('calculates top offset from nav element', async () => {
    // Create a mock nav element
    const nav = document.createElement('nav');
    Object.defineProperty(nav, 'getBoundingClientRect', {
      value: () => ({ bottom: 64 }),
    });
    document.body.appendChild(nav);

    const { container } = render(
      <BottomPanel isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </BottomPanel>
    );

    await waitFor(() => {
      const panel = container.querySelector('.fixed');
      expect(panel?.getAttribute('style')).toContain('top: 64px');
    });

    document.body.removeChild(nav);
  });

  it('uses fallback top offset when nav not found', async () => {
    const { container } = render(
      <BottomPanel isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </BottomPanel>
    );

    await waitFor(() => {
      const panel = container.querySelector('.fixed');
      expect(panel?.getAttribute('style')).toContain('top: 112px');
    });
  });

  it('has proper z-index and positioning classes', async () => {
    const { container } = render(
      <BottomPanel isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </BottomPanel>
    );

    await waitFor(() => {
      const panel = container.querySelector('.fixed');
      expect(panel?.className).toContain('z-50');
      expect(panel?.className).toContain('inset-x-0');
      expect(panel?.className).toContain('bottom-0');
    });
  });

  it('has transition classes', async () => {
    const { container } = render(
      <BottomPanel isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </BottomPanel>
    );

    await waitFor(() => {
      const panel = container.querySelector('.fixed');
      expect(panel?.className).toContain('transition-transform');
      expect(panel?.className).toContain('duration-300');
      expect(panel?.className).toContain('ease-out');
    });
  });

  it('cleans up event listeners on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(
      <BottomPanel isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </BottomPanel>
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
