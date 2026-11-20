import React from 'react';
import { Home, Package, Search, ArrowRight } from 'lucide-react';
import { WHATSAPP_URL } from '../data/products';
import { AppleLogo, WhatsAppLogo } from './BrandIcons';

interface NotFoundPageProps {
  requestedPath?: string;
  onGoHome: () => void;
  onGoCatalogue: () => void;
  onOpenSearch: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  requestedPath,
  onGoHome,
  onGoCatalogue,
  onOpenSearch
}) => {
  // Ne jamais afficher un chemin potentiellement trop long ou suspect tel quel
  const safeDisplayPath =
    requestedPath && requestedPath.length <= 64
      ? requestedPath.replace(/[<>"'`]/g, '')
      : null;

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 sm:px-6 py-14 sm:py-24 bg-[#fafbfc] dark:bg-[#0b0f17] transition-colors">
      <div className="w-full max-w-2xl text-center">
        {/* Clean Apple-inspired minimal emblem */}
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6">
          <AppleLogo className="w-8 h-8 sm:w-9 sm:h-9 text-slate-900 dark:text-white" />
        </div>

        {/* Display 404 Numeral */}
        <div className="text-7xl sm:text-8xl lg:text-9xl font-extrabold tracking-tighter font-['Outfit'] text-slate-950 dark:text-white leading-none select-none mb-4">
          404
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white font-['Outfit'] mb-3 [text-wrap:balance]">
          Cette page est introuvable.
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
          Le lien que vous avez suivi n’existe plus ou a été déplacé. Retrouvez tous nos iPhone, iPad et MacBook certifiés directement depuis l’accueil.
        </p>

        {safeDisplayPath && safeDisplayPath !== '/' && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-mono text-slate-500 dark:text-slate-400 mb-8 max-w-full truncate">
            <span className="truncate">{safeDisplayPath}</span>
          </div>
        )}

        {/* Primary & Secondary Actions (>= 44px touch targets) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mb-10">
          <button
            type="button"
            onClick={onGoHome}
            className="min-h-[48px] px-6 py-3 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-sm font-bold inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l’accueil</span>
          </button>

          <button
            type="button"
            onClick={onGoCatalogue}
            className="min-h-[48px] px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Explorer le catalogue</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenSearch}
            className="min-h-[48px] px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Rechercher</span>
          </button>
        </div>

        {/* Helpful Boutique Contact Strip */}
        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>Besoin d’un modèle précis en boutique à Abidjan ?</span>
          <a
            href={WHATSAPP_URL("Bonjour OUMAR IPHONE, je cherche un modèle Apple disponible en boutique.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 hover:underline min-h-[36px] px-2"
          >
            <WhatsAppLogo className="w-4 h-4 shrink-0" />
            <span>Contacter Oumar sur WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
