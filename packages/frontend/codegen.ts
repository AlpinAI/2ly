/**
 * GraphQL Code Generator Configuration (Apollo Client v4)
 *
 * WHY: Automates TypeScript type generation from GraphQL schema and operations.
 * This ensures type safety between frontend and backend GraphQL APIs.
 *
 * APOLLO v4 APPROACH:
 * - Uses typed-document-node for type-safe queries (not generated hooks)
 * - Use Apollo's useQuery/useMutation hooks with typed documents
 * - Official Apollo recommendation: typescript + typescript-operations + typed-document-node
 *
 * WHAT IT GENERATES:
 * 1. TypeScript types from GraphQL schema
 * 2. TypeScript types for all GraphQL operations
 * 3. Typed document nodes for type-safe Apollo Client usage
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
  // WHY: Point to common schema as the source of truth
  schema: '../common/schema/apollo.schema.graphql',

  // WHY: Scan for all GraphQL operations in our source code
  // Operations include queries, mutations, and subscriptions
  documents: ['src/graphql/**/*.graphql', 'src/graphql/**/*.ts'],

  // Output configuration
  generates: {
    // Main generated file with all types and typed documents
    './src/graphql/generated/graphql.ts': {
      // WHY: Apollo-recommended plugins for v4
      // Order matters: typescript → operations → typed-document-node
      plugins: [
        'typescript', // Generate TypeScript types from schema
        'typescript-operations', // Generate types for operations
        'typed-document-node', // Generate typed document nodes for type-safe queries
      ],

      // Configuration options (Apollo-recommended)
      config: {
        // WHY: Type safety and Apollo Client v4 compatibility
        avoidOptionals: {
          field: true, // Make fields non-optional
          inputValue: false, // Keep input values optional
        },

        // WHY: Scalar type mappings
        scalars: {
          Date: 'Date', // Map GraphQL Date to TypeScript Date
        },

        // WHY: Unknown for unconfigured scalars (type safety)
        defaultScalarType: 'unknown',

        // WHY: Always include __typename (Apollo cache needs it)
        nonOptionalTypename: true,

        // WHY: Don't add __typename to Query/Mutation/Subscription root types
        skipTypeNameForRoot: true,

        // WHY: Use type imports for better tree-shaking
        useTypeImports: true,
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
