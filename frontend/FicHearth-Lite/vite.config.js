// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Make sure Vite binds to all interfaces or use your server IP address
    port: 3000, // Frontend server
    allowedHosts: ['fichearth.net', 'www.fichearth.net'],
  },
  base: '/',
});


