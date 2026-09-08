import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import process from 'node:process'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: Number(process.env.FRONTEND_PORT ?? 5173),
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL ?? 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
