import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { bloomPwaPlugin } from './scripts/pwa-plugin.js';

export default defineConfig({
  plugins: [react(), tailwindcss(), bloomPwaPlugin(), {
    name: 'production-local-only-policy',
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        // The production policy also protects static hosting. Development needs
        // Vite's local WebSocket and injected fast-refresh preamble.
        return context.server ? html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*\/>/, '') : html;
      },
    },
  }],
  server: {
    proxy: { '/api': 'http://127.0.0.1:3000' },
  },
  build: {
    outDir: 'dist', sourcemap: false,
    rollupOptions: { output: { manualChunks: id => id.includes('node_modules') ? 'vendor' : undefined } },
  },
});
