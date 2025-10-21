import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest Configuration for Unit Tests
 *
 * Unit tests run without testcontainers - they are fast and isolated.
 * For integration tests that need testcontainers, use vitest.integration.config.ts
 */

export default defineConfig({
    test: {
        environment: 'node',
        dir: './',
        include: [
            'packages/**/src/**/*.spec.ts',
            'packages/**/src/**/*.spec.tsx',
            'packages/**/src/**/*.test.ts',
            'packages/**/src/**/*.test.tsx',
            'packages/**/__tests__/**/*.spec.ts',
            'packages/**/__tests__/**/*.spec.tsx',
            'packages/**/__tests__/**/*.test.ts',
            'packages/**/__tests__/**/*.test.tsx'
        ],
        exclude: [
            '**/node_modules/**',
            'node_modules',
            'dist',
            '.git',
            'packages/**/dist/**',
            'packages/doc/**',
            'packages/depr-frontend/**',
            'packages/**/src/**/*.integration.spec.ts',
            'packages/backend/tests/**'
        ],
        environmentMatchGlobs: [
            ['packages/frontend/**', 'jsdom'],
        ],
        setupFiles: ['./packages/frontend/src/test/setup.ts'],
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
        }
    },
    resolve: {
        alias: {
            '@2ly/common/test/testcontainers': path.resolve(__dirname, 'packages/common/src/test/testcontainers.ts'),
            '@2ly/common/test/vitest': path.resolve(__dirname, 'packages/common/src/test/vitest.ts'),
            '@2ly/common': path.resolve(__dirname, 'packages/common/src/index.ts'),
            '@2ly/common/*': path.resolve(__dirname, 'packages/common/src/*'),
            '@': path.resolve(__dirname, 'packages/frontend/src'),
            '@/*': path.resolve(__dirname, 'packages/frontend/src/*')
        }
    }
});
