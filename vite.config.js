import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html'),
        login: path.resolve(__dirname, 'src/login.html')
      }
    }
  },
  server: {
    open: '/login.html'
  }
})