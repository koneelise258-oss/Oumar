import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Synchronise dynamiquement le favicon officiel Apple :
// - Navigateur en mode sombre -> logo Apple BLANC
// - Navigateur en mode clair  -> logo Apple NOIR
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const applyFaviconForScheme = (isDark: boolean) => {
    const svgIcon = document.getElementById('omr-dynamic-favicon') as HTMLLinkElement | null;
    if (svgIcon) {
      svgIcon.href = isDark ? '/favicon-dark.svg?v=6' : '/favicon-light.svg?v=6';
    }
    const pngUpdates: Array<[string, string, string]> = [
      ['omr-dynamic-png-192', '/favicon-dark-192x192.png?v=6', '/favicon-192x192.png?v=6'],
      ['omr-dynamic-png-96', '/favicon-dark-96x96.png?v=6', '/favicon-96x96.png?v=6'],
      ['omr-dynamic-png-48', '/favicon-dark-48x48.png?v=6', '/favicon-48x48.png?v=6'],
      ['omr-apple-touch-icon', '/apple-touch-icon-dark.png?v=6', '/apple-touch-icon.png?v=6']
    ];
    for (const [id, darkHref, lightHref] of pngUpdates) {
      const el = document.getElementById(id) as HTMLLinkElement | null;
      if (el) {
        el.media = 'all';
        el.href = isDark ? darkHref : lightHref;
      }
    }
  };
  applyFaviconForScheme(darkQuery.matches);
  if (typeof darkQuery.addEventListener === 'function') {
    darkQuery.addEventListener('change', (e) => applyFaviconForScheme(e.matches));
  }
}

createRoot(document.getElementById('root')!).render(<App />);
