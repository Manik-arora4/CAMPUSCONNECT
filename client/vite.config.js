import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
  // For production: upload files go to the backend
  define: {
    'import.meta.env.VITE_UPLOAD_URL': JSON.stringify(
      process.env.VITE_API_URL ? `${process.env.VITE_API_URL}/uploads` : ''
    ),
  },
});
