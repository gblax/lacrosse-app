import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/ncaa': {
        target: 'https://ncaa-api.henrygd.me',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ncaa/, ''),
      },
      '/api/espn': {
        target: 'https://site.api.espn.com/apis/site/v2/sports/lacrosse/mens-college-lacrosse',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/espn/, ''),
      },
    },
  },
})
