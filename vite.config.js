import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This section configures the path alias for Vite.
  // It tells Vite that any import starting with '@/'
  // should be resolved from the 'src' directory.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // This section helps ensure the dev server reliably
  // detects file changes in certain environments.
  server: {
    watch: {
      usePolling: true,
    },
  },
})
