import React from 'react';
import { MessageCircle, ExternalLink, Sparkles } from 'lucide-react';

export const SocialSection: React.FC = () => {
  return (
    <section 
      id="reseaux" 
      className="w-full py-8 sm:py-14 px-3 sm:px-6 lg:px-8 relative z-10 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-200/60 dark:border-slate-800/60"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header de section */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-10 space-y-1.5 sm:space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Communauté & Contact Direct</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold font-['Outfit'] tracking-tight text-slate-900 dark:text-white">
            Nos Réseaux Sociaux
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg">
            Abonnez-vous à notre fil TikTok officiel et échangez directement avec notre équipe via WhatsApp à Abidjan.
          </p>
        </div>

        {/* Disposition sur 2 colonnes strictes sur mobile (grid-cols-2) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-3xl mx-auto">
          {/* Card TikTok */}
          <a
            href="https://www.tiktok.com/@oumar_iphone.0"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-slate-900 to-black text-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between border border-slate-800"
          >
            {/* Arrière-plan décoratif subtil */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />

            <div className="space-y-3 relative z-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                {/* Icône TikTok SVG officielle */}
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-white"
                  viewBox="0 0 24 24"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.33 6.33 0 0 0 6.33-6.33V9a8.16 8.16 0 0 0 4.92 1.64V7.19a4.85 4.85 0 0 1-1-.5z" />
                </svg>
              </div>

              <div>
                <span className="text-[10px] sm:text-xs font-semibold text-rose-400 tracking-wide uppercase block">
                  TikTok Officiel
                </span>
                <h3 className="text-xs sm:text-lg font-bold font-['Outfit'] text-white truncate group-hover:text-rose-300 transition-colors">
                  @oumar_iphone.0
                </h3>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs font-medium text-slate-300 relative z-10">
              <span className="truncate">Découvrir nos vidéos</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </a>

          {/* Card WhatsApp */}
          <a
            href="https://wa.me/2250778024285?text=Bonjour%20OUMAR%20IPHONE%2C%20je%20souhaite%20des%20informations"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-emerald-900/90 to-emerald-950 text-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between border border-emerald-800/80"
          >
            {/* Arrière-plan décoratif subtil */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />

            <div className="space-y-3 relative z-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-800/80 border border-emerald-700/60 flex items-center justify-center text-emerald-300 shadow-xs group-hover:scale-105 transition-transform">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-emerald-300" />
              </div>

              <div>
                <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 tracking-wide uppercase block">
                  WhatsApp Direct
                </span>
                <h3 className="text-xs sm:text-lg font-bold font-['Outfit'] text-white truncate group-hover:text-emerald-300 transition-colors">
                  +225 07 78 02 42 85
                </h3>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-800/80 flex items-center justify-between text-[11px] sm:text-xs font-medium text-emerald-200 relative z-10">
              <span className="truncate">Discuter sur WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-emerald-400 group-hover:text-white transition-colors" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};
