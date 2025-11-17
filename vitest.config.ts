import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

/**
 * Vitest Configuration for Unit Tests
 *
 * Unit tests run without testcontainers - they are fast and isolated.
 * For integration tests that need testcontainers, use vitest.integration.config.ts
 */

export default defineConfig({
    test: {
        globals: true,
        coverage: {
            reporter: ['text', 'html', 'lcov'],
            provider: 'v8',
            all: true,
            reportsDirectory: './coverage',
            include: ['packages/**/src/**/*.{ts,tsx}'],
            exclude: [
                '**/*.d.ts',
                '**/dist/**',
                '**/tooling/**',
                '**/node_modules/**',
                '**/schema/**',
                '**/*.config.*',
                '**/index.ts',
                '**/index.browser.ts',
                'packages/doc/**'
            ]
        },
        // Use projects to separate frontend (React + jsdom) from backend (Node.js)
        projects: [
            {
                test: {
                    name: 'frontend',
                    environment: 'jsdom',
                    include: [
                        'packages/frontend/src/**/*.spec.ts',
                        'packages/frontend/src/**/*.spec.tsx',
                        'packages/frontend/src/**/*.test.ts',
                        'packages/frontend/src/**/*.test.tsx'
                    ],
                    exclude: [
                        '**/node_modules/**',
                        '**/dist/**',
                        '**/e2e/**'
                    ],
                    setupFiles: ['./packages/frontend/src/test/setup.ts']
                },
                plugins: [react()],
                resolve: {
                    alias: {
                        '@': path.resolve(__dirname, 'packages/frontend/src')
                    }
                }
            },
            {
                test: {
                    name: 'backend',
                    environment: 'node',
                    include: [
                        'packages/backend/src/**/*.spec.ts',
                        'packages/backend/__tests__/**/*.spec.ts',
                        'packages/backend/__tests__/**/*.test.ts',
                        'packages/common/src/**/*.spec.ts',
                        'packages/common/__tests__/**/*.spec.ts',
                        'packages/runtime/src/**/*.spec.ts',
                        'packages/runtime/__tests__/**/*.spec.ts'
                    ],
                    exclude: [
                        '**/node_modules/**',
                        '**/dist/**',
                        'packages/backend/tests/**',
                        '**/*.integration.spec.ts'
                    ]
                },
                resolve: {
                    alias: {
                        '@2ly/common/test/test.containers': path.resolve(__dirname, 'packages/common/src/test/test.containers.ts'),
                        '@2ly/common/test/vitest': path.resolve(__dirname, 'packages/common/src/test/vitest.ts'),
                        '@2ly/common': path.resolve(__dirname, 'packages/common/src/index.ts')
                    }
                }
            }
        ]
    }
});
