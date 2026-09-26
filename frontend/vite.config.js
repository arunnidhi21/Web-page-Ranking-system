import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// When the Python backend runs on :8000, /api/* is proxied to it during `npm run dev`.
export default defineConfig({ plugins: [react()], server: { proxy: { '/api': 'http://localhost:8000' } } });
