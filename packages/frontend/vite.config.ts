import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { REGISTRY_CONFIGURATIONS } from './src/config/registries';

function generateProxyConfiguration() {
  const proxyConfig: Record<string, { target: string; changeOrigin: boolean; secure: boolean; rewrite: (path: string) => string }> = {};

  for (const registry of REGISTRY_CONFIGURATIONS) {
    if (registry.proxyPath) {
      const proxyBase = registry.proxyPath.split('/')[1];
      const proxyKey = `/${proxyBase}`;
      
      if (!proxyConfig[proxyKey]) {
        proxyConfig[proxyKey] = {
          target: registry.upstreamUrl.split('/')[2].includes(':') 
            ? registry.upstreamUrl.split('/').slice(0, 3).join('/')
            : `${registry.upstreamUrl.split('/')[0]}//${registry.upstreamUrl.split('/')[2]}`,
          changeOrigin: true,
          secure: true,
          rewrite: (pathToRewrite) => pathToRewrite.replace(new RegExp(`^${proxyKey}`), ''),
        };
      }
    }
  }

  return proxyConfig;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8888,
    host: true,
    proxy: generateProxyConfiguration(),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],
  },
});
