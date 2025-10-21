import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 8888,
    proxy: {
      '/mcp-registry': {
        target: 'https://registry.modelcontextprotocol.io',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/mcp-registry/, ''),
      },
    },
  },
  // Example: Uncomment to customize env directory or prefix
  // envDir: 'env',
  // envPrefix: 'VITE_',
});
