import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
// import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './', // Use relative paths for assets
  plugins: [
    react(),
    // enable PWA plugin after installing and configuring it
    // VitePWA({ registerType: 'autoUpdate' }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Bundle everything into fewer files for better performance
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
    // Copy launcher files to dist
    copyPublicDir: true,
  },
  publicDir: 'public', // Ensure public directory is processed
});
