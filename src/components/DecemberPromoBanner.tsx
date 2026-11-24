import React from 'react';
import { ArrowRight, Gift, Tag } from 'lucide-react';
import { useStorePromotion } from '../hooks/useStorePromotion';

export const DecemberPromoBanner: React.FC = () => {
  const { promotion } = useStorePromotion();

  if (!promotion.bannerEnabled) return null;

  const hasActiveDiscount = promotion.enabled && promotion.discountPercent > 0;
  const badgeMain = hasActiveDiscount ? `-${promotion.discountPercent}%` : 'DÉCEMBRE';
  const discountLabel = hasActiveDiscount
    ? `${promotion.discountPercent}% DE RÉDUCTION IMMÉDIATE`
    : 'OFFRES FESTIVES DE FIN D’ANNÉE';

  const scrollToCatalogue = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById('catalogue');
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderMarqueeHalf = (halfKey: string) => (
    <div key={halfKey} className="flex items-center shrink-0">
      {[0, 1].map((dupIdx) => (
        <div
          key={`${halfKey}-set-${dupIdx}`}
          className="flex items-center shrink-0 gap-6 sm:gap-8 pr-6 sm:pr-8"
        >
          {/* 1. Titre principal champagne */}
          <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-extrabold tracking-[0.16em] uppercase whitespace-nowrap font-['Outfit'] bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
            <Gift className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
            <span>{promotion.bannerHeadline}</span>
          </span>

          <span
            aria-hidden="true"
            className="w-1 h-1 rotate-45 bg-amber-300/60 shrink-0"
          />

          {/* 2. Pourcentage / Offre active */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400/18 via-emerald-400/15 to-amber-400/18 border border-amber-300/35 text-[11px] sm:text-xs font-extrabold tracking-[0.12em] uppercase text-white whitespace-nowrap tabular-nums">
            <Tag className="w-3 h-3 text-emerald-300 shrink-0" aria-hidden="true" />
            <span>{discountLabel}</span>
          </span>

          <span
            aria-hidden="true"
            className="w-1 h-1 rotate-45 bg-emerald-300/50 shrink-0"
          />

          {/* 3. Sous-titre boutique */}
          <span className="text-[11px] sm:text-xs font-medium tracking-[0.11em] uppercase text-slate-200/90 whitespace-nowrap">
            {promotion.bannerSubline}
          </span>

          <span
            aria-hidden="true"
            className="w-1 h-1 rotate-45 bg-rose-300/60 shrink-0"
          />
        </div>
      ))}
    </div>
  );

  return (
    <aside
      aria-label="Promotion de Décembre OUMAR IPHONE"
      className="relative w-full overflow-hidden bg-[#070b12] text-white border-y border-amber-300/20 select-none"
    >
      {/* Halo ambiant luxe festif (statique + GPU composite, zéro clignotement) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(60% 140% at 12% 50%, rgba(16, 185, 129, 0.16), transparent 70%), radial-gradient(55% 140% at 88% 50%, rgba(245, 158, 11, 0.18), transparent 70%), radial-gradient(40% 100% at 50% 50%, rgba(225, 29, 72, 0.10), transparent 75%)'
        }}
      />

      {/* Rail lumineux animé en haut (glissement continu sans saccade) */}
      <div
        aria-hidden="true"
        className="relative w-full h-[2px] overflow-hidden bg-white/5"
      >
        <div
          className="omr-promo-rail flex w-[200%] h-full"
          style={{
            background:
              'linear-gradient(90deg, rgba(16,185,129,0.2) 0%, rgba(251,191,36,0.95) 20%, rgba(244,63,94,0.85) 35%, rgba(52,211,153,0.9) 50%, rgba(251,191,36,0.95) 70%, rgba(244,63,94,0.85) 85%, rgba(16,185,129,0.2) 100%)'
          }}
        />
      </div>

      {/* Reflet spéculaire dynamique qui traverse toute la banderole */}
      <div
        aria-hidden="true"
        className="omr-promo-glint pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-amber-200/18 to-transparent"
      />

      {/* Corps interactif principal (sans pause au toucher ni au survol) */}
      <a
        href="#catalogue"
        onClick={scrollToCatalogue}
        className="group relative z-10 flex items-center w-full min-h-[46px] sm:min-h-[50px] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      >
        {/* Bloc ancre gauche — pourcentage en typographie éditoriale */}
        <div className="relative z-20 shrink-0 flex items-center gap-2 pl-3 sm:pl-5 pr-3 sm:pr-4 py-2 bg-[#070b12]/90 backdrop-blur-md border-r border-white/10">
          <span className="text-xs sm:text-sm font-black tracking-tight font-['Outfit'] tabular-nums bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent">
            {badgeMain}
          </span>
          <span className="hidden lg:inline-block text-[10px] font-bold tracking-[0.16em] uppercase text-emerald-300/90">
            FÊTES
          </span>
        </div>

        {/* Piste de défilement infinie (ne s'arrête jamais au tap/toucher) */}
        <div className="relative flex-1 overflow-hidden">
          {/* Fondu progressif sur les bords du texte défilant */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-5 sm:w-8 bg-gradient-to-r from-[#070b12] to-transparent z-10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-5 sm:w-8 bg-gradient-to-l from-[#070b12] to-transparent z-10"
          />

          <div className="omr-marquee-track py-2.5 sm:py-3">
            {renderMarqueeHalf('half-a')}
            {renderMarqueeHalf('half-b')}
          </div>
        </div>

        {/* Action ancre droite — accès direct au catalogue */}
        <div className="relative z-20 shrink-0 flex items-center gap-1.5 pl-3 pr-3 sm:pr-5 py-2 bg-[#070b12]/90 backdrop-blur-md border-l border-white/10">
          <span className="hidden sm:inline text-[11px] font-bold tracking-[0.12em] uppercase text-amber-200 group-hover:text-white transition-colors">
            Voir l’offre
          </span>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-400/15 border border-amber-300/35 text-amber-200 group-hover:bg-amber-300 group-hover:text-slate-950 transition-colors">
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </a>

      {/* Filet champagne inférieur */}
      <div
        aria-hidden="true"
        className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/45 to-transparent"
      />
    </aside>
  );
};
