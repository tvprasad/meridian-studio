/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress dynamic-import-already-statically-imported warning for msalConfig
        if (warning.code === 'PLUGIN_WARNING' && warning.message?.includes('dynamically imported by')) return;
        warn(warning);
      },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-msal': ['@azure/msal-browser', '@azure/msal-react'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-markdown': ['react-markdown'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
