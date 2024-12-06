import type { VitestConfig } from 'vitest';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.spec.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
    watchExclude: ['**/node_modules/**', '**/dist/**'],
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    sequence: {
      shuffle: true,
    },
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
    },
  },
} satisfies VitestConfig);
