/**
 * GraphQL Code Generator Configuration for Backend Dgraph Operations
 *
 * Generates typed documents for Dgraph operations, providing:
 * - Type-safe variables (compile-time validation)
 * - Type-safe responses (no more manual type annotations)
 * - Compatible with urql's DocumentInput type
 *
 * NOTE: Requires Dgraph to be running for introspection.
 * Start with: npm run start:dev
 */
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Use live Dgraph introspection to get the full schema including auto-generated Query/Mutation types
  schema: process.env.DGRAPH_GRAPHQL_URL || 'http://localhost:8080/graphql',
  documents: ['src/repositories/**/*.graphql'],
  generates: {
    './src/generated/dgraph.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        skipTypename: true,
        scalars: {
          DateTime: 'string',
          Int64: 'string',
        },
        defaultScalarType: 'unknown',
        avoidOptionals: {
          field: false,
          inputValue: false,
        },
        useTypeImports: true,
      },
    },
  },
};

export default config;
