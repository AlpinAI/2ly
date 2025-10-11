/**
 * AddToolWorkflow Component
 *
 * WHY: Animated panel that slides up from bottom to display tool browser.
 * Replaces page content to show search, filters, and available MCP tools.
 *
 * ARCHITECTURE:
 * - CSS transform animations (translateY)
 * - Contains ToolBrowserContent for search and cards
 * - Closes with X button or ESC key
 * - Positioned directly below navigation menu
 */

import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolBrowserContent } from './ToolBrowserContent';

interface AddToolWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddToolWorkflow({ isOpen, onClose }: AddToolWorkflowProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [topOffset, setTopOffset] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate exact position below navigation
  useEffect(() => {
    const calculateTopOffset = () => {
      // Find the navigation element by looking for the nav element
      const navElement = document.querySelector('nav');
      if (navElement) {
        const rect = navElement.getBoundingClientRect();
        // Set top offset to the bottom of the nav element
        setTopOffset(rect.bottom);
      } else {
        // Fallback if nav not found
        setTopOffset(112);
      }
    };

    if (isOpen) {
      calculateTopOffset();
      // Recalculate on window resize
      window.addEventListener('resize', calculateTopOffset);
      return () => window.removeEventListener('resize', calculateTopOffset);
    }
  }, [isOpen]);

  // Handle mounting and animation timing
  useEffect(() => {
    // Clear any pending animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    if (isOpen) {
      // Always start with animation disabled to ensure starting from bottom
      setIsAnimating(false);
      setShouldRender(true);

      // Double requestAnimationFrame ensures:
      // 1st RAF: Component mounts with translate-y-full
      // 2nd RAF: Browser paints the initial state
      // Then: We can safely trigger the animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      // Start close animation
      setIsAnimating(false);

      // Wait for CSS transition to complete (300ms) before unmounting
      animationTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        animationTimeoutRef.current = null;
      }, 300);
    }

    // Cleanup function
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

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Sliding Panel - positioned below header and navigation */}
      <div
        ref={panelRef}
        className={`fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          top: `${topOffset}px`,
        }}
      >
        {/* Panel Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Add Tools from Registry</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full" aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto" style={{ height: `calc(100vh - ${topOffset}px - 73px)` }}>
          <ToolBrowserContent />
        </div>
      </div>
    </>
  );
}
