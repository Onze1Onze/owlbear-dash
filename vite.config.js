import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: { rollupOptions: { input: { panel: 'index.html', background: 'background.html' } } }
});
