import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Add resolve.alias to configure absolute import paths.
  // This allows you to import files using "@/" instead of relative paths.
  // For example: import MyComponent from '@/components/MyComponent'
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
