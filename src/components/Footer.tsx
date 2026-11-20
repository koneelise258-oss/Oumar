import React, { useRef } from 'react';
import { AppleLogo, TikTokLogo } from './BrandIcons';

interface FooterProps {
  onSecretAccess?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSecretAccess }) => {
  // Geste furtif invisible : 7 clics/taps rapides (< 3 secondes) sur le texte du copyright
  // Aucun curseur spécial, aucun titre, aucun indice visuel ou sémantique pour les visiteurs.
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<number | null>(null);

  const handleBrandTap = () => {
    if (!onSecretAccess) return;

    tapCountRef.current += 1;

    if (tapTimerRef.current !== null) {
      window.clearTimeout(tapTimerRef.current);
    }

    if (tapCountRef.current >= 7) {
      tapCountRef.current = 0;
      tapTimerRef.current = null;
      onSecretAccess();
      return;
    }

    tapTimerRef.current = window.setTimeout(() => {
      tapCountRef.current = 0;
      tapTimerRef.current = null;
    }, 3000);
  };

  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-white font-['Outfit'] mb-1">
              <AppleLogo className="w-4 h-4 -mt-0.5 text-white shrink-0" />
              <span>OUMAR IPHONE</span>
            </div>
            <p className="text-xs text-slate-400">
              Boutique Apple d’excellence certifiée à Abidjan · Cocody Angré 8ème Tranche & Plateau Avenue Chardy
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-400">
            <a href="#catalogue" className="hover:text-white transition-colors">Catalogue</a>
            <a href="#garantie" className="hover:text-white transition-colors">Garantie & SAV</a>
            <a href="#boutique" className="hover:text-white transition-colors">Nos Boutiques</a>
            <a href="https://www.tiktok.com/@oumar_iphone.0" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
              <TikTokLogo className="w-3.5 h-3.5 shrink-0" />
              <span>TikTok @oumar_iphone.0</span>
            </a>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="select-none" onClick={handleBrandTap}>
            &copy; {new Date().getFullYear()} OUMAR IPHONE SARL. Tous droits réservés. Abidjan, Côte d'Ivoire.
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span>Appareils originaux testés & certifiés en boutique OUMAR IPHONE</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
