import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div>
            <div className="text-xl font-bold tracking-tight text-white font-['Outfit'] mb-1">
              OUMAR IPHONE
            </div>
            <p className="text-xs text-slate-400">
              Boutique Apple certifiée à Abidjan · Cocody Angré & Plateau
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-400">
            <a href="#catalogue" className="hover:text-white transition-colors">Catalogue</a>
            <a href="#garantie" className="hover:text-white transition-colors">Garantie & SAV</a>
            <a href="#boutique" className="hover:text-white transition-colors">Nos Boutiques</a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">TikTok</a>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} OUMAR IPHONE SARL. Tous droits réservés. Abidjan, Côte d'Ivoire.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Paiement sécurisé : Wave · Orange Money · Espèces à la livraison</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
