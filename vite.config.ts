import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { bugBazaarApi } from './server/mockApi.ts';

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * Project sites live under /repo-name/. Local dev stays at /.
 * Why: an absolute base baked into every dev server would break `npm run dev`.
 */
function siteBase(): string {
  const raw = process.env.VITE_BASE_PATH ?? '/';
  if (raw === '/' || raw === '') {
    return '/';
  }
  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

/**
 * GitHub Pages has no history fallback. A missing route returns 404.html.
 * Why: copying the app shell lets the router read the original URL.
 */
function pagesSpaFallback(): Plugin {
  return {
    name: 'pages-spa-fallback',
    apply: 'build',
    closeBundle() {
      const indexFile = path.resolve(root, 'dist/index.html');
      if (!fs.existsSync(indexFile)) {
        return;
      }
      fs.copyFileSync(indexFile, path.resolve(root, 'dist/404.html'));
    },
  };
}

export default defineConfig({
  base: siteBase(),
  plugins: [react(), bugBazaarApi(), pagesSpaFallback()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(root, 'index.html'),
        sw: path.resolve(root, 'src/sw.ts'),
      },
      output: {
        entryFileNames(chunk) {
          return chunk.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
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
