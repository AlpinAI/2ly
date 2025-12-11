import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'schema/build/apollo.schema.graphql',
  generates: {
    './src/graphql/apollo.resolvers.types.ts': {
      config: {
        useIndexSignature: false,
        skipTypename: true,
        skipDirectiveValidation: true,
        strictScalars: true,
        scalars: {
          Date: 'Date',
        },
        avoidOptionals: {
          field: false,
          inputValue: false,
          object: false,
          defaultValue: false,
        },
        maybeValue: 'T | null',
        inputMaybeValue: 'T | null | undefined',
        noSchemaStitching: true,
        useTypeImports: true,
        contextType: 'object',
        defaultScalarType: 'unknown',
      },
      plugins: ['typescript', 'typescript-resolvers'],
    },
  },
};
export default config;
