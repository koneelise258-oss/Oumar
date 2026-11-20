import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { TikTokLogo, WhatsAppLogo } from './BrandIcons';
import { WHATSAPP_URL } from '../data/products';
import { loadStoreSettings } from '../data/storeSettings';

export const SocialSection: React.FC = () => {
  const [phoneDisplay, setPhoneDisplay] = useState<string>(
    () => loadStoreSettings().whatsappPhone || '+225 01 61 44 36 37'
  );

  useEffect(() => {
    const syncPhone = () => {
      setPhoneDisplay(loadStoreSettings().whatsappPhone || '+225 01 61 44 36 37');
    };
    window.addEventListener('oumar_settings_updated', syncPhone);
    return () => window.removeEventListener('oumar_settings_updated', syncPhone);
  }, []);

  return (
    <section
      id="reseaux"
      className="perf-section w-full py-10 sm:py-16 px-4 sm:px-6 lg:px-8 relative z-10 bg-slate-50/60 dark:bg-slate-900/30 border-y border-slate-200/60 dark:border-slate-800/60"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header de section épuré */}
        <div className="flex flex-col items-center text-center mb-7 sm:mb-10 space-y-2">
          <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-emerald-700 dark:text-emerald-400">
            COMMUNAUTÉ & CONTACT DIRECT
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] tracking-tight text-slate-950 dark:text-white">
            Nos Réseaux Sociaux
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg">
            Abonnez-vous à notre fil TikTok officiel et échangez directement avec notre équipe via WhatsApp à Abidjan.
          </p>
        </div>

        {/* Disposition équilibrée sur 2 colonnes mobile et desktop */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-3xl mx-auto">
          {/* Card TikTok */}
          <a
            href="https://www.tiktok.com/@oumar_iphone.0"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-slate-900 to-black text-white shadow-md hover:shadow-xl transition-all duration-300 md:hover:-translate-y-1 active:scale-[0.98] flex flex-col justify-between border border-slate-800"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />

            <div className="space-y-3 relative z-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <TikTokLogo className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
            href={WHATSAPP_URL('Bonjour OUMAR IPHONE, je souhaite des informations sur vos disponibilités à Abidjan.')}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-emerald-900/90 to-emerald-950 text-white shadow-md hover:shadow-xl transition-all duration-300 md:hover:-translate-y-1 active:scale-[0.98] flex flex-col justify-between border border-emerald-800/80"
          >
            {/* Arrière-plan décoratif subtil */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />

            <div className="space-y-3 relative z-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-800/80 border border-emerald-700/60 flex items-center justify-center text-emerald-300 shadow-xs group-hover:scale-105 transition-transform">
                <WhatsAppLogo className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
              </div>

              <div>
                <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 tracking-wide uppercase block">
                  WhatsApp Direct
                </span>
                <h3 className="text-xs sm:text-lg font-bold font-['Outfit'] text-white truncate group-hover:text-emerald-300 transition-colors">
                  {phoneDisplay}
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
