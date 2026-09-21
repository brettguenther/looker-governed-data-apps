import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    host: 'localhost',
    port: 3000,
    https: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('/@looker/') || id.includes('/buffer/')) {
              return 'vendor-looker';
            }
            if (
              id.includes('/recharts/') ||
              id.includes('/d3-') ||
              id.includes('/victory-vendor/')
            ) {
              return 'vendor-charts';
            }
            if (
              id.includes('/lucide-react/') ||
              id.includes('/clsx/') ||
              id.includes('/tailwind-merge/')
            ) {
              return 'vendor-ui';
            }
          }
        },
      },
    },
  },
})
