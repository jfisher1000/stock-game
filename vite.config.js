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
  // This configuration tells Vite to treat .js files as .jsx files,
  // which is necessary because your project uses JSX syntax in .js files.
  esbuild: {
    loader: 'jsx',
    include: [
      'src/**/*.js',
      'src/**/*.jsx',
    ],
  },
})
