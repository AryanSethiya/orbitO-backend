import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@core': resolve(__dirname, './src/core'),
      '@app': resolve(__dirname, './src/application'),
      '@infra': resolve(__dirname, './src/infrastructure'),
      '@interfaces': resolve(__dirname, './src/interfaces'),
      '@config': resolve(__dirname, './src/config'),
    },
  },
});
