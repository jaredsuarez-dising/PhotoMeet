import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        eventos: resolve(__dirname, 'eventos.html'),
        profile: resolve(__dirname, 'profile.html'),
        calendario: resolve(__dirname, 'calendario.html')
      }
    }
  },
  publicDir: 'public'
}); 