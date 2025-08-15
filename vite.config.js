import { defineConfig } from 'vite'
import netlify from "@netlify/vite-plugin";

export default defineConfig({
  root: 'src',
  build: {
    outDir: 'dist',
  },
  server: {
    open: '/login.html'
  },
  plugins: [netlify()],
})