import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        dir: './',
        setupFiles: [],
        include: [
            'packages/**/src/**/*.spec.ts',
            'packages/**/src/**/*.test.ts',
            'packages/**/__tests__/**/*.spec.ts',
            'packages/**/__tests__/**/*.test.ts'
        ],
        environmentMatchGlobs: [
            ['packages/frontend/**', 'jsdom']
        ],
        exclude: [
            '**/node_modules/**',
            'node_modules',
            'dist',
            '.git',
            'packages/**/dist/**',
            'packages/doc/**',
            'packages/**/tests/**'
        ],
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
            '@2ly/common/test-helpers': path.resolve(__dirname, 'packages/common/src/test-helpers.ts'),
            '@2ly/common': path.resolve(__dirname, 'packages/common/src/index.ts'),
            '@2ly/common/*': path.resolve(__dirname, 'packages/common/src/*')

        }
    }
});
