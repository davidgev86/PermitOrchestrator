import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/**/*.test.ts',
      'server/**/*.test.ts',
      'packages/**/*.test.ts'
    ],
    exclude: [
      'node_modules',
      'dist',
      'client'
    ],
    coverage: {
      include: [
        'server/**/*.ts',
        'packages/**/*.ts'
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.d.ts',
        'server/index.ts',
        'node_modules',
        'dist'
      ],
      reporter: ['text', 'json', 'html']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@server': path.resolve(__dirname, 'server'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@jp-core': path.resolve(__dirname, 'packages/jp-core')
    }
  }
});