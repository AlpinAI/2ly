import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest Configuration for Integration Tests
 *
 * Integration tests require testcontainers setup (Dgraph, NATS, Backend)
 * This includes:
 * - *.integration.spec.ts files
 * - Tests in packages/backend/tests/**
 */

export default defineConfig({
    test: {
        environment: 'node',
        dir: './',
        include: [
            'packages/**/src/**/*.integration.spec.ts',
            'packages/backend/tests/**/*.spec.ts'
        ],
        exclude: [
            '**/node_modules/**',
            'node_modules',
            'dist',
            '.git',
            'packages/**/dist/**',
            'packages/doc/**',
            'packages/frontend*/tests/**'
        ],
        globalSetup: [
            'packages/backend/tests/setup.ts'
        ],
        globals: true,
        // Longer timeout for integration tests with containers
        testTimeout: 30000,
        hookTimeout: 30000,
        coverage: {
            reporter: ['text', 'html', 'lcov'],
            provider: 'v8',
            all: true,
            reportsDirectory: './coverage/integration',
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
            '@2ly/common/*': path.resolve(__dirname, 'packages/common/src/*')

        }
    }
});
