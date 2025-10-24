/**
 * useCloseOnNavigation Hook
 *
 * WHY: Reusable hook to close panels/modals when navigation occurs.
 * Ensures consistent behavior across all bottom panels and dialogs.
 *
 * USAGE:
 * ```tsx
 * function MyPanel() {
 *   const handleClose = useCallback(() => {
 *     setOpen(false);
 *     // ... any other cleanup
 *   }, [setOpen]);
 *
 *   useCloseOnNavigation(handleClose);
 *
 *   return <BottomPanel isOpen={open} onClose={handleClose}>...</BottomPanel>
 * }
 * ```
 *
 * WHY THIS PATTERN:
 * - Self-contained: Each component manages its own navigation behavior
 * - Reusable: Any component can opt into this behavior
 * - Testable: Hook can be tested in isolation
 * - Consistent: Same pattern across all panels
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Automatically calls the provided callback when route changes.
 *
 * @param onClose - Callback to execute when navigation occurs
 *
 * @example
 * ```tsx
 * const handleClose = useCallback(() => {
 *   setOpen(false);
 *   resetState();
 * }, [setOpen]);
 *
 * useCloseOnNavigation(handleClose);
 * ```
 */
export function useCloseOnNavigation(onClose: () => void) {
  const location = useLocation();
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip the effect on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Call onClose when pathname changes (after initial mount)
    onClose();
  }, [location.pathname, onClose]);
}
