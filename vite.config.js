import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/user': {
        target: 'http://localhost:3000', // Backend server
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/user/, '/user'),
      },
    },
  },
});
