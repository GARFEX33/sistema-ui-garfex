import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [TanStackRouterVite(), tailwindcss(), react()],
  build: { manifest: true },
  server: {
    proxy: {
      '/v1': { target: 'http://localhost:8090' },
    },
  },
})
