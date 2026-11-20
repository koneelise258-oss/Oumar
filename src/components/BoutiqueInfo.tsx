import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { WHATSAPP_URL } from '../data/products';
import { loadStoreSettings } from '../data/storeSettings';
import { TikTokLogo, WhatsAppLogo } from './BrandIcons';
import { useAbidjanStoreStatus } from '../utils/storeHours';

export const BoutiqueInfo: React.FC = () => {
  const storeStatus = useAbidjanStoreStatus();
  const [settings, setSettings] = useState(() => loadStoreSettings());

  useEffect(() => {
    const syncSettings = () => setSettings(loadStoreSettings());
    window.addEventListener('oumar_settings_updated', syncSettings);
    return () => window.removeEventListener('oumar_settings_updated', syncSettings);
  }, []);

  const displayPhone = settings.whatsappPhone || '+225 01 61 44 36 37';
  const displayHours = settings.openingHours || 'Lun - Sam : 08h30 - 19h30';

  return (
    <section id="boutique" className="perf-section py-14 sm:py-20 bg-white dark:bg-[#0b0f17] border-t border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="text-[11px] font-bold tracking-[0.18em] text-slate-500 dark:text-slate-400 uppercase mb-2">
            BOUTIQUE & SERVICE APRÈS-VENTE
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white font-['Outfit'] mb-3 sm:mb-4">
            Venez tester nos appareils en boutique
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Une équipe d'experts à votre écoute à Cocody Angré et au Plateau pour vous accompagner dans le choix et la configuration de votre iPhone.
          </p>
        </div>

        {/* 3-Column Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-7">
          
          {/* Card 1: Boutique Cocody & Horaires automatiques Abidjan */}
          <div className="liquid-glass-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-slate-100">
                  <MapPin className="w-5 h-5" />
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                    storeStatus.isOpen
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60'
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      storeStatus.isOpen ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  <span>{storeStatus.statusLabel}</span>
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-950 dark:text-white font-['Outfit'] mb-2">
                Boutique {settings.storeName || 'OUMAR IPHONE'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Boutique d'excellence Apple à Abidjan. Retrait direct et test sur place de tous vos appareils.
              </p>
              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{displayHours}</span>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 pl-5">
                  {storeStatus.detailLabel}
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{displayPhone}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800">
              <a
                href={WHATSAPP_URL("Bonjour Oumar iPhone, je souhaite localiser votre boutique à Abidjan pour un retrait.")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 inline-flex items-center gap-1.5 transition-colors"
              >
                <WhatsAppLogo className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Contacter sur WhatsApp &rarr;</span>
              </a>
            </div>
          </div>

          {/* Card 2: Garantie & SAV */}
          <div id="garantie" className="liquid-glass-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-slate-100 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white font-['Outfit'] mb-2">
                {settings.warrantyText || 'Garantie 12 Mois Oumar'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Tous les appareils bénéficient d'un certificat d'authenticité et d'une garantie avec échange ou réparation immédiate.
              </p>
              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Batterie certifiée originale</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Écran d'origine sans message d'erreur</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                SAV assuré sur place à Abidjan
              </span>
            </div>
          </div>

          {/* Card 3: Communauté TikTok & Réseaux */}
          <div className="liquid-glass-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-slate-100 mb-4">
                <TikTokLogo className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white font-['Outfit'] mb-2">
                Rejoignez la Communauté
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Suivez nos arrivages hebdomadaires en direct, déballages d'iPhone scellés et conseils d'experts sur TikTok et WhatsApp.
              </p>
              <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <div>Compte officiel : <strong className="text-slate-800 dark:text-white">@oumar_iphone.0</strong></div>
                <div>Plus de 50 000 passionnés en Côte d'Ivoire</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800">
              <a
                href="https://www.tiktok.com/@oumar_iphone.0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-slate-900 dark:text-white hover:underline inline-flex items-center gap-1.5"
              >
                <TikTokLogo className="w-3.5 h-3.5 shrink-0" />
                <span>Voir les vidéos de déballage &rarr;</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
