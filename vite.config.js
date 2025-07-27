import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Add this esbuild configuration
  esbuild: {
    loader: 'jsx',
    include: [
      // Add this line to treat all .js files under src as .jsx
      'src/**/*.js',
      'src/**/*.jsx',
    ],
  },
})
