import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import process from 'node:process'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: Number(process.env.FRONTEND_PORT ?? 5173),
    proxy: {
      // More specific paths must be registered before the generic '/api'
      // fallback below, since Vite matches proxy entries in insertion order.
      '/api/contact': {
        target: process.env.VITE_CONTACT_API_URL ?? 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api': {
        target: process.env.VITE_API_URL ?? 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
