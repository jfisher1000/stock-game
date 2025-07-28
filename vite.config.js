import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // Import the 'path' module

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Add the resolve.alias configuration here
  resolve: {
    alias: {
      // This sets up the '@' alias to point to the 'src' directory
      '@': path.resolve(__dirname, './src'),
    },
  },
})
