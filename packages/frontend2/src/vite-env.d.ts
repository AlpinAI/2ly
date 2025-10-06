/// <reference types="vite/client" />

/**
 * WHY: Vite type definitions for import.meta.env
 * This file provides TypeScript types for Vite's environment variables and import.meta
 */

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
