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

/**
 * hasOutputError - Checks if a tool output contains isError: true
 *
 * WHY: Tool outputs may be successful at the GraphQL level (success: true)
 * but contain error information within the output itself (isError: true).
 * This function helps determine if the actual tool execution failed.
 *
 * APPROACH:
 * 1. Attempt to parse the output as JSON
 * 2. Check if the parsed object has isError property set to true
 * 3. Return false if parsing fails or isError is not true
 *
 * @param output - The tool output string to check
 * @returns true if output contains isError: true, false otherwise
 *
 * @example
 * ```ts
 * hasOutputError('{"isError": true, "message": "Failed"}') // true
 * hasOutputError('{"isError": false, "data": "success"}') // false
 * hasOutputError('{"data": "success"}') // false
 * hasOutputError('Plain text output') // false
 * hasOutputError('') // false
 * hasOutputError(null) // false
 * ```
 */
export function hasOutputError(output: string | null | undefined): boolean {
  if (!output) {
    return false;
  }

  try {
    const parsed = JSON.parse(output);
    return parsed?.isError === true;
  } catch {
    // If parsing fails, treat as non-error (fall back to GraphQL success field)
    return false;
  }
}

/**
 * sanitizeIdentifier - Converts a name into a valid identifier
 *
 * WHY: Used to create safe configuration keys from user-provided names.
 * Ensures generated identifiers are valid for JSON keys, environment variables,
 * and other contexts where special characters may cause issues.
 *
 * RULES:
 * 1. Convert to lowercase
 * 2. Replace spaces with hyphens
 * 3. Remove special characters (keep only alphanumeric, hyphens, and underscores)
 * 4. Prefix with underscore if result starts with a number
 * 5. Fallback to "agent" if result is empty
 *
 * @param name - The name to sanitize
 * @returns A sanitized identifier string
 *
 * @example
 * ```ts
 * sanitizeIdentifier('My Agent') // "my-agent"
 * sanitizeIdentifier('Production Runtime') // "production-runtime"
 * sanitizeIdentifier('Agent #1') // "agent-1"
 * sanitizeIdentifier('123 Agent') // "_123-agent"
 * sanitizeIdentifier('!!!') // "agent"
 * sanitizeIdentifier('') // "agent"
 * ```
 */
export function sanitizeIdentifier(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'agent';
  }

  let sanitized = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9_-]/g, '') // Remove special characters
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  // If starts with a number, prefix with underscore
  if (sanitized && /^\d/.test(sanitized)) {
    sanitized = `_${sanitized}`;
  }

  // Fallback to "agent" if empty after sanitization
  return sanitized || 'agent';
}
