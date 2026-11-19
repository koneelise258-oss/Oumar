import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'X-XSS-Protection': '0',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
};

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Désactiver les sourcemaps en production pour ne pas exposer le code source TypeScript
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          // Isole les composants d'administration et l'éditeur média dans un chunk dédié chargé uniquement à la demande
          manualChunks: (id) => {
            if (
              id.includes('AdminDashboard') ||
              id.includes('AdminAuthModal') ||
              id.includes('MediaCropper') ||
              id.includes('migrationSql')
            ) {
              return 'internal-ops';
            }
            return undefined;
          }
        }
      }
    },
    server: {
      headers: SECURITY_HEADERS,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      headers: SECURITY_HEADERS,
    }
  };
});
