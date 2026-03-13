import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Raise the warning threshold slightly — we deliberately split chunks
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        /**
         * Manual chunk strategy
         * ─────────────────────
         * vendor      – React + router (always needed, cached long-term)
         * query       – TanStack Query (data-fetching layer)
         * ui-lib      – styled-components (large CSS-in-JS runtime)
         * forms       – react-hook-form + zod + resolvers (only checkout/RSVP)
         * misc        – zustand, dompurify, canvas-confetti (small utilities)
         *
         * All section components are kept out of manual chunks so Rollup can
         * tree-shake and assign them to their own dynamic-import chunks from
         * the React.lazy() calls in HomePage.
         */
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          'ui-lib': ['styled-components'],
          forms: ['react-hook-form', 'zod', '@hookform/resolvers'],
          misc: ['zustand', 'dompurify', 'canvas-confetti'],
        },
      },
    },
  },
})
