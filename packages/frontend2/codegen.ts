/**
 * GraphQL Code Generator Configuration
 *
 * WHY: Automates TypeScript type generation from GraphQL schema and operations.
 * This ensures type safety between frontend and backend GraphQL APIs.
 *
 * WHAT IT GENERATES:
 * 1. TypeScript types from GraphQL schema
 * 2. React hooks for queries, mutations, subscriptions (useGetAgentsQuery, etc.)
 * 3. TypeScript types for all GraphQL operations
 *
 * HOW IT WORKS:
 * - Reads schema from backend: ../backend/dist/apollo.schema.graphql
 * - Scans for operations in: src/graphql/ ** / *.graphql
 * - Outputs generated code to: src/graphql/generated/
 *
 * USAGE:
 * - `npm run codegen` - Generate types once
 * - `npm run codegen:watch` - Watch mode for development
 */

import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // WHY: Point to backend schema as the source of truth
  schema: '../backend/dist/apollo.schema.graphql',

  // WHY: Scan for all GraphQL operations in our source code
  // Operations include queries, mutations, and subscriptions
  documents: ['src/graphql/**/*.graphql', 'src/graphql/**/*.ts'],

  // Output configuration
  generates: {
    // Main generated file with all types and hooks
    './src/graphql/generated/graphql.ts': {
      // WHY: These plugins generate TypeScript types and React hooks
      // Order matters: typescript → operations → react-apollo
      plugins: [
        'typescript', // Generate TypeScript types from schema
        'typescript-operations', // Generate types for operations
        'typescript-react-apollo', // Generate React hooks (useQuery, useMutation, etc.)
      ],

      // Configuration options
      config: {
        // WHY: Skip __typename in input types (cleaner type definitions)
        skipTypename: true,

        // WHY: Don't add undefined to optional types (stricter types)
        avoidOptionals: {
          field: false,
          inputValue: false,
          object: false,
        },

        // WHY: Scalar type mappings
        scalars: {
          Date: 'Date', // Map GraphQL Date to TypeScript Date
        },

        // WHY: Use type imports for better tree-shaking
        useTypeImports: true,

        // WHY: Enable React 19 compatibility
        dedupeFragments: true,

        // WHY: Strict null handling
        maybeValue: 'T | null',

        // WHY: React Apollo specific config
        withHooks: true, // Generate React hooks
        withComponent: false, // Don't generate React components (hooks only)
        withHOC: false, // Don't generate HOCs (hooks only)
      },
    },
  },

  // WHY: Generate types in watch mode for better DX
  watch: false,

  // WHY: Show errors in console
  silent: false,

  // WHY: Fail on errors (don't generate partial types)
  errorsOnly: false,
};

export default config;
