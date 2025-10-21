/**
 * Theme Context
 *
 * WHY: Provides a centralized theme management system for the entire application.
 * This follows the React Context pattern to avoid prop drilling and ensures
 * consistent theme state across all components.
 *
 * DESIGN DECISIONS:
 * - Uses Tailwind's 'dark' class strategy on the html element for CSS-based theming
 * - Persists theme preference to localStorage for better UX across sessions
 * - Respects system preference (prefers-color-scheme) as the default
 * - Provides both toggle and explicit setter for flexibility
 *
 * USAGE:
 * 1. Wrap your app with <ThemeProvider>
 * 2. Use useTheme() hook in any component to access/change theme
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ThemeProvider>
 *       <YourApp />
 *     </ThemeProvider>
 *   );
 * }
 *
 * function SomeComponent() {
 *   const { theme, toggleTheme } = useTheme();
 *   return <button onClick={toggleTheme}>{theme}</button>;
 * }
 * ```
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider Component
 *
 * WHY: Manages theme state and synchronizes it with:
 * 1. localStorage (persistence)
 * 2. DOM (applying the theme via class)
 * 3. System preference (initial default)
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // WHY lazy initialization: Prevents hydration mismatch and checks preferences only once
  const [theme, setThemeState] = useState<Theme>(() => {
    // Priority 1: User's saved preference
    const stored = localStorage.getItem('2ly-theme') as Theme;
    if (stored) return stored;

    // Priority 2: System preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    // Priority 3: Default to light
    return 'light';
  });

  // WHY useEffect: Synchronize theme changes to DOM and localStorage
  // This ensures the Tailwind 'dark:' classes work correctly
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('2ly-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme Hook
 *
 * WHY: Provides type-safe access to theme context with runtime validation.
 * Throws an error if used outside ThemeProvider to catch bugs early.
 *
 * @returns Theme context with current theme and functions to change it
 * @throws Error if used outside ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
