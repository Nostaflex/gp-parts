import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Fichiers de test unitaire (pas les e2e Playwright)
    include: ['tests/unit/**/*.test.ts'],
    // Timeout par test
    testTimeout: 5_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
