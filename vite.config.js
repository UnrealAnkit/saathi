import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // We don't need to externalize framer-motion, we just need to make sure it's installed
  optimizeDeps: {
    include: ['framer-motion'],
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
  },
}); 