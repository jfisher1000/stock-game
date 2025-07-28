import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath, URL } from 'node:url' // Import necessary modules

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This is the modern, robust way to set up a path alias in Vite.
      // It uses 'import.meta.url' to ensure the path is resolved correctly.
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    watch: {
      // This setting can help with file change detection in some environments.
      usePolling: true,
    },
  },
})
