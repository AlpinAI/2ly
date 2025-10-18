/**
 * BottomPanel Component (Headless)
 *
 * WHY: Reusable panel that slides up from bottom of screen, positioned below navigation.
 * Headless design - consumers control their own header/content/footer structure.
 *
 * RESPONSIBILITIES:
 * - Calculate position below navigation bar
 * - Handle slide animations (300ms)
 * - Manage mounting/unmounting timing
 * - Prevent body scroll when open
 * - Handle ESC key with optional custom handler
 * - Provide flexbox container for content
 *
 * LAYOUT STRATEGY:
 * - Panel sets available height: from nav bottom to viewport bottom
 * - Provides flex column container (h-full flex flex-col)
 * - Consumers use flex classes: flex-shrink-0 (header/footer), flex-1 (content)
 * - No magic numbers, no calc() needed by consumers
 *
 * USAGE:
 * ```tsx
 * <BottomPanel isOpen={isOpen} onClose={onClose}>
 *   <div className="flex-shrink-0 border-b px-6 py-4">Header</div>
 *   <div className="flex-1 overflow-auto">Scrollable content</div>
 *   <div className="flex-shrink-0 border-t px-6 py-4">Footer</div>
 * </BottomPanel>
 * ```
 */

import { useEffect, useState, useRef } from 'react';

export interface BottomPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  onEscape?: () => void; // Optional custom escape handler (e.g., for back navigation)
}

export function BottomPanel({ isOpen, onClose, children, onEscape }: BottomPanelProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [topOffset, setTopOffset] = useState(0);

  const panelRef = useRef<HTMLDivElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate exact position below navigation
  useEffect(() => {
    const calculateTopOffset = () => {
      const navElement = document.querySelector('nav');
      if (navElement) {
        const rect = navElement.getBoundingClientRect();
        setTopOffset(rect.bottom);
      } else {
        // Fallback if nav not found
        setTopOffset(112);
      }
    };

    if (isOpen) {
      calculateTopOffset();
      window.addEventListener('resize', calculateTopOffset);
      return () => window.removeEventListener('resize', calculateTopOffset);
    }
  }, [isOpen]);

  // Handle mounting and animation timing
  useEffect(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    if (isOpen) {
      setIsAnimating(false);
      setShouldRender(true);

      // Double requestAnimationFrame ensures DOM is ready
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      animationTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        animationTimeoutRef.current = null;
      }, 300); // Match transition duration
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [isOpen]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (onEscape) {
          onEscape();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, onEscape]);

  if (!shouldRender) return null;

  return (
    <div
      ref={panelRef}
      className={`fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl transition-transform duration-300 ease-out ${
        isAnimating ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{
        top: `${topOffset}px`,
      }}
    >
      {/* Flex column container - takes full height, consumers control layout */}
      <div className="h-full flex flex-col">{children}</div>
    </div>
  );
}
