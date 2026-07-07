import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  // Root-relative base works for `npm run dev` and most static hosts (Netlify /
  // Vercel / GH Pages via a project). If you deploy under a sub-path, set this
  // to that path (e.g. '/exam-portal/').
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
