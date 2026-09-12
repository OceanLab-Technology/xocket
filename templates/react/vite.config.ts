import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Note: vite.config.ts with @/* path alias is written by the typescript generator
export default defineConfig({
  plugins: [react()],
})
