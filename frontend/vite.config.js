import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const apiTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:5000';
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', port: 3000,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
      '/ws': { target: apiTarget.replace(/^http/, 'ws'), ws: true, changeOrigin: true },
    },
  },
});
