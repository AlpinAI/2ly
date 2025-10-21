/**
 * Vitest Test Setup
 *
 * WHY: Configure the testing environment for React component tests.
 * Sets up @testing-library/react and any global test utilities.
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test to prevent DOM pollution
afterEach(() => {
  cleanup();
});

// Mock matchMedia for dark mode detection (only in browser environments)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });

}
