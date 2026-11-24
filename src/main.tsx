import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Synchronise dynamiquement le favicon officiel Apple (noir en mode clair, blanc en mode sombre)
// pour les navigateurs mobiles (iOS Safari / Chrome) qui ne réévaluent pas automatiquement `media=` lors d'un changement de thème.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const applyFaviconForScheme = (isDark: boolean) => {
    const el = document.getElementById('omr-dynamic-favicon') as HTMLLinkElement | null;
    if (el) {
      el.href = isDark ? '/favicon-dark.svg?v=4' : '/favicon-light.svg?v=4';
    }
  };
  applyFaviconForScheme(darkQuery.matches);
  if (typeof darkQuery.addEventListener === 'function') {
    darkQuery.addEventListener('change', (e) => applyFaviconForScheme(e.matches));
  }
}

createRoot(document.getElementById('root')!).render(<App />);
