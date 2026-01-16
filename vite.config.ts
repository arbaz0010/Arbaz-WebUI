import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext', // Needed for top-level await in Transformers.js
  },
  server: {
    // This proxy allows you to run 'npm run dev' and connect to a local llama.cpp server
    // running on port 8080 without CORS errors.
    proxy: {
      '/v1': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        // Rewriting is usually not needed for llama.cpp if it expects /v1
      }
    }
  }
});