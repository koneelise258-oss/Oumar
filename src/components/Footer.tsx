import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div>
            <div className="text-xl font-bold tracking-tight text-white font-['Outfit'] mb-1">
              OUMAR IPHONE
            </div>
            <p className="text-xs text-slate-400">
              Boutique Apple d’excellence certifiée à Abidjan · Cocody Angré 8ème Tranche & Plateau Avenue Chardy
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-400">
            <a href="#catalogue" className="hover:text-white transition-colors">Catalogue</a>
            <a href="#garantie" className="hover:text-white transition-colors">Garantie & SAV</a>
            <a href="#boutique" className="hover:text-white transition-colors">Nos Boutiques</a>
            <a href="https://www.tiktok.com/@oumar_iphone.0" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">TikTok @oumar_iphone.0</a>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} OUMAR IPHONE SARL. Tous droits réservés. Abidjan, Côte d'Ivoire.
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span>Appareils originaux testés & certifiés en boutique OUMAR IPHONE</span>

            {/* Discreet Admin Portal Access for Boutique Owner */}
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
                title="Accès sécurisé réservé à la direction"
              >
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Espace Administrateur</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
