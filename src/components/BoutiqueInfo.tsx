import React from 'react';
import { MapPin, Phone, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { WHATSAPP_URL } from '../data/products';

export const BoutiqueInfo: React.FC = () => {
  return (
    <section id="boutique" className="py-20 bg-white dark:bg-[#0b0f17] border-t border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">
            BOUTIQUE & SERVICE APRÈS-VENTE
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white font-['Outfit'] mb-4">
            Venez tester nos appareils en boutique
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Une équipe d'experts à votre écoute à Cocody Angré et au Plateau pour vous accompagner dans le choix et la configuration de votre iPhone.
          </p>
        </div>

        {/* 3-Column Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Boutique Cocody */}
          <div className="liquid-glass-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-slate-100 mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white font-['Outfit'] mb-2">
                Boutique OUMAR IPHONE
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Boutique d'excellence Apple à Abidjan. Retrait direct et test sur place de tous vos appareils.
              </p>
              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Lun - Sam : 08h30 - 19h30</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  <span>+225 07 78 02 42 85</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800">
              <a
                href={WHATSAPP_URL("Bonjour Oumar iPhone, je souhaite localiser votre boutique à Abidjan pour un retrait.")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1"
              >
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
                Garantie 12 Mois Oumar
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Tous les appareils bénéficient d'un certificat d'authenticité et d'une garantie avec échange ou réparation immédiate.
              </p>
              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Batterie certifiée originale</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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
                <span className="text-base font-extrabold font-['Outfit']">TT</span>
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
                className="text-xs font-semibold text-slate-900 dark:text-white hover:underline"
              >
                Voir les vidéos de déballage &rarr;
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
