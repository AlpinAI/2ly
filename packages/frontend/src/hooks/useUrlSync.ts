/**
 * useUrlSync Hook
 *
 * WHY: Synchronizes entity selection with URL query parameters.
 * Enables deep linking and shareable URLs for entities.
 *
 * FEATURES:
 * - Reads `id` query parameter from URL
 * - Updates URL when entity is selected (without page reload)
 * - Preserves other query parameters
 * - Returns current ID from URL and setter function
 *
 * USAGE:
 * const { selectedId, setSelectedId } = useUrlSync();
 *
 * // On mount, selectedId will contain the ID from URL if present
 * // When calling setSelectedId('abc'), URL updates to ?id=abc
 */

import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export interface UseUrlSyncReturn {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  clearSelection: () => void;
}

export function useUrlSync(): UseUrlSyncReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get current ID from URL
  const selectedId = useMemo(() => {
    return searchParams.get('id');
  }, [searchParams]);

  // Update URL with new ID (preserving other params)
  const setSelectedId = useCallback(
    (id: string | null) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          if (id) {
            newParams.set('id', id);
          } else {
            newParams.delete('id');
          }
          return newParams;
        },
        { replace: true } // Use replace to avoid polluting browser history
      );
    },
    [setSearchParams]
  );

  // Clear selection (remove id from URL)
  const clearSelection = useCallback(() => {
    setSelectedId(null);
  }, [setSelectedId]);

  return { selectedId, setSelectedId, clearSelection };
}
