import type { BuildOptions } from 'esbuild';
import esbuildPluginTsc from 'esbuild-plugin-tsc';
import { copy } from 'esbuild-plugin-copy';

export function createBuildSettings(options: BuildOptions): BuildOptions {
  return {
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    platform: 'node',
    sourcemap: !options.minify,
    banner: { js: '#!/usr/bin/env node' }, // Required to make the script executable
    plugins: [
      // this plugin tells esbuild to use the official typescript compiler and allow all typescript
      // features to be available
      esbuildPluginTsc({
        force: true,
      }),
      copy({
        assets: [
          {
            from: '../common/schema/build/dgraph.schema.graphql',
            to: 'dgraph.schema.graphql',
          },
          {
            from: '../common/schema/build/apollo.schema.graphql',
            to: 'apollo.schema.graphql',
          },
          {
            from: 'data/mcp-server-catalog.json',
            to: 'mcp-server-catalog.json',
          },
        ],
      }),
    ],
    ...options,
  };
}
