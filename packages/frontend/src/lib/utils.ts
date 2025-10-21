/**
 * Utility Functions
 *
 * WHY: Centralized utilities that are used across the application.
 * These are pure functions that don't have side effects.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn - Class Name utility
 *
 * WHY: Combines Tailwind classes intelligently by:
 * 1. Using clsx for conditional class logic
 * 2. Using tailwind-merge to resolve conflicting Tailwind classes
 *
 * PROBLEM IT SOLVES:
 * Without this, conflicting Tailwind classes would both apply.
 * Example: "p-4 p-2" would apply both paddings (incorrect)
 * With cn: "p-4 p-2" becomes just "p-2" (correct - last one wins)
 *
 * DESIGN PATTERN:
 * This is a standard pattern in the Tailwind/shadcn ecosystem for
 * component libraries where you need to merge base styles with
 * prop-based overrides.
 *
 * @param inputs - Class values (strings, objects, arrays)
 * @returns Merged class string with conflicts resolved
 *
 * @example
 * ```tsx
 * // Basic usage
 * cn('p-4', 'text-white') // "p-4 text-white"
 *
 * // Conditional classes
 * cn('base-class', isActive && 'active-class') // "base-class active-class" or "base-class"
 *
 * // Resolving conflicts (last wins)
 * cn('p-4', 'p-2') // "p-2"
 * cn('text-red-500', 'text-blue-500') // "text-blue-500"
 *
 * // Component pattern
 * function Button({ className, ...props }) {
 *   return <button className={cn('base-styles', className)} {...props} />;
 * }
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
