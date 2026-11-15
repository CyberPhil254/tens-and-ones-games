/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-64.png'],
      // Fonts and Oreo's pictures are kept for offline use too. Only woff2: every browser we support reads it.
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'] },
      manifest: {
        name: 'Tens and Ones',
        short_name: 'Tens and Ones',
        description: 'Maths practice for primary school children.',
        lang: 'en',
        display: 'standalone',
        start_url: '/',
        background_color: '#F3F6FB',
        theme_color: '#F3F6FB',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test-setup.ts'],
  },
});
