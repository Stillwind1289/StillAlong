import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'favicon.png',
          'favicon-32x32.png',
          'favicon-16x16.png',
          'apple-touch-icon.png',
        ],
        manifest: {
          id: '/',
          name: 'Stillalong — Cozy Pixel Study Companion',
          short_name: 'Stillalong',
          description:
            'A warm retro GBA pixel-art virtual study companion and Pomodoro timer.',
          theme_color: '#11152A',
          background_color: '#11152A',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          globIgnores: [
            'assets/aistudio/**',
            'assets/sprites/frames/**',
            'assets/sprites/focus-desk-spritesheet.png',
            'assets/sprites/milo-desk-spritesheet.png',
            'assets/sprites/girl-spritesheet-normalized.png',
            'assets/sprites/white-kitty-spritesheet.png',
            'assets/sprites/boy_character.png',
            'assets/sprites/cat_character.png',
            'assets/sprites/girl_character.png',
            'assets/sprites/focus-books-prop.png',
            'assets/sprites/focus-locked-companions.png',
            'assets/sprites/study_desk.png',
          ],
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/llms.*\.txt$/,
            /^\/sitemap\.xml$/,
            /^\/robots\.txt$/,
            /\.html$/,
          ],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
