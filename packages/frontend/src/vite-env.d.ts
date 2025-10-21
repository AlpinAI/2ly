/// <reference types="vite/client" />
/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

/**
 * WHY: Vite type definitions for import.meta.env
 * This file provides TypeScript types for Vite's environment variables and import.meta
 */

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_HOST?: string;
  readonly VITE_GRAPHQL_HOST_SSL?: boolean;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
