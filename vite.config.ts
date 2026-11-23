import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { bugBazaarApi } from './server/mockApi.ts';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), bugBazaarApi()],
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
      base: '/Bug-Bazaar-Umair/',
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [path.resolve(root, 'src/assets/sass')],
        additionalData(source: string, filename: string) {
          const normalized = filename.replaceAll('\\', '/');
          if (
            normalized.endsWith('/src/assets/sass/variables.scss') ||
            normalized.endsWith('/src/assets/sass/mixins.scss') ||
            normalized.endsWith('/src/assets/sass/global.scss')
          ) {
            return source;
          }
          return `@use "variables" as *;\n@use "mixins" as *;\n${source}`;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
