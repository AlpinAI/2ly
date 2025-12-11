import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'schema/build/dgraph.schema.graphql',
  generates: {
    './src/graphql/dgraph.resolvers.types.ts': {
      config: {
        useIndexSignature: true,
        skipTypename: true,
        skipDirectiveValidation: true,
      },
      plugins: ['typescript', 'typescript-resolvers'],
    },
  },
};
export default config;
