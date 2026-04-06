import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    // Fichiers de test unitaire (pas les e2e Playwright)
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    // Timeout par test
    testTimeout: 5_000,
    // Environment happy-dom pour les tests composants React (compatible Node 24)
    environment: 'happy-dom',
    // Setup files pour React Testing Library
    setupFiles: ['./tests/setup.ts'],
    // Coverage (v8 provider)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['lib/**', 'components/**'],
      exclude: ['**/*.test.*', '**/node_modules/**'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
