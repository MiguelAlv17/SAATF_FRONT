import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // En desarrollo, /api se redirige al ambiente QA de SAATF.
    proxy: {
      '/api': {
        target: 'https://api.saatf.qa.payfri-bi.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
