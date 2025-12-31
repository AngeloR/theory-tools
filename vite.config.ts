import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all interfaces so the dev server is reachable via hostname/LAN.
    host: true,
    // Allow access via the machine name in addition to localhost.
    allowedHosts: ['minas-morgul'],
  },
  preview: {
    host: true,
    allowedHosts: ['minas-morgul'],
  },
})
