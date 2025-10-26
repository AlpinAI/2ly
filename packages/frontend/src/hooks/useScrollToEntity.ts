/**
 * useScrollToEntity Hook
 *
 * WHY: Automatically scrolls to and highlights an entity in a table.
 * Essential for deep linking - when user visits URL with entity ID,
 * the table should scroll to that entity and highlight it temporarily.
 *
 * FEATURES:
 * - Scrolls entity into view with smooth animation
 * - Adds temporary highlight class (fades after 2.5s)
 * - Handles pagination (caller must ensure entity is on current page)
 * - Uses ref-based approach for performance
 *
 * USAGE:
 * const scrollToEntity = useScrollToEntity();
 *
 * // When entity is loaded and ready:
 * useEffect(() => {
 *   if (entityId && entityRef.current) {
 *     scrollToEntity(entityRef.current);
 *   }
 * }, [entityId]);
 */

import { useCallback, useRef } from 'react';

export type ScrollToEntityFn = (element: HTMLElement) => void;

export function useScrollToEntity(): ScrollToEntityFn {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToEntity = useCallback((element: HTMLElement) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Scroll into view with smooth animation
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });

    // Add highlight class
    element.classList.add('entity-highlight');

    // Remove highlight after 2.5 seconds
    timeoutRef.current = setTimeout(() => {
      element.classList.remove('entity-highlight');
      timeoutRef.current = null;
    }, 2500);
  }, []);

  return scrollToEntity;
}
