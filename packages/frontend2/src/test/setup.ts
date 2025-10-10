/**
 * Vitest Test Setup
 *
 * WHY: Configure the testing environment for React component tests.
 * Sets up @testing-library/react and any global test utilities.
 */

import '@testing-library/jest-dom/vitest';

// Mock matchMedia for dark mode detection
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
