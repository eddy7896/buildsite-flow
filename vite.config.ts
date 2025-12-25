import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: parseInt(process.env.VITE_DEV_PORT || '5173', 10),
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL 
          ? process.env.VITE_API_URL.replace('/api', '')
          : `http://localhost:${process.env.PORT || process.env.BACKEND_PORT || 3000}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'esbuild', // Use esbuild for faster, less memory-intensive minification
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'recharts'],
    exclude: ['crypto'],
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
})
