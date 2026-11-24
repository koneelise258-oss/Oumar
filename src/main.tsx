import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Synchronise dynamiquement le favicon officiel Apple (noir en mode clair, blanc en mode sombre)
// sur SVG, PNG et apple-touch-icon (indispensable pour iOS Safari lors des changements clair/sombre).
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const applyFaviconForScheme = (isDark: boolean) => {
    const svgIcon = document.getElementById('omr-dynamic-favicon') as HTMLLinkElement | null;
    if (svgIcon) {
      svgIcon.href = isDark ? '/favicon-dark.svg?v=5' : '/favicon-light.svg?v=5';
    }
    const pngIcon = document.getElementById('omr-dynamic-png') as HTMLLinkElement | null;
    if (pngIcon) {
      pngIcon.media = 'all';
      pngIcon.href = isDark ? '/favicon-dark-192x192.png?v=5' : '/favicon-192x192.png?v=5';
    }
    const appleIcon = document.getElementById('omr-apple-touch-icon') as HTMLLinkElement | null;
    if (appleIcon) {
      appleIcon.media = 'all';
      appleIcon.href = isDark ? '/apple-touch-icon-dark.png?v=5' : '/apple-touch-icon.png?v=5';
    }
  };
  applyFaviconForScheme(darkQuery.matches);
  if (typeof darkQuery.addEventListener === 'function') {
    darkQuery.addEventListener('change', (e) => applyFaviconForScheme(e.matches));
  }
}

createRoot(document.getElementById('root')!).render(<App />);
