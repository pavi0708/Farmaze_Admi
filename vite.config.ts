
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { componentTagger } from 'lovable-tagger'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  server: {
    port: 8080,
    host: '::',
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'https://staging-api.farmaze.com',
        changeOrigin: true,
        secure: true,
      },
      '/analytics-api': {
        target: 'https://staging-analytics.farmaze.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/analytics-api/, ''),
        secure: true,
      },
      '/agent-api': {
        target: 'https://staging-agent.farmaze.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agent-api/, ''),
        secure: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  preview: {
    port: 8080,
    host: '::',
    historyApiFallback: true
  }
}))
