import React from 'react';
import { Gift, Tag } from 'lucide-react';
import { useStorePromotion } from '../hooks/useStorePromotion';

const GARLAND_COLORS = [
  'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]',
  'bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.85)]',
  'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.85)]',
  'bg-sky-200 shadow-[0_0_6px_rgba(186,230,253,0.85)]',
];

export const DecemberPromoBanner: React.FC = () => {
  const { promotion } = useStorePromotion();

  if (!promotion.bannerEnabled) return null;

  const hasActiveDiscount = promotion.enabled && promotion.discountPercent > 0;
  const discountSnippet = hasActiveDiscount
    ? `-${promotion.discountPercent}% SUR UNE SÉLECTION APPLE`
    : 'OFFRES SPÉCIALES DE FIN D’ANNÉE';

  const marqueeItems = [
    { text: promotion.bannerHeadline, accent: 'gold' as const, icon: 'gift' as const },
    { text: discountSnippet, accent: 'festive' as const, icon: 'tag' as const },
    { text: promotion.bannerSubline, accent: 'neutral' as const, icon: 'none' as const },
  ];

  const renderGroup = (groupKey: string) => (
    <div key={groupKey} className="flex items-center shrink-0 gap-6 sm:gap-8 pr-6 sm:pr-8">
      {marqueeItems.map((item, idx) => (
        <React.Fragment key={`${groupKey}-${idx}`}>
          <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase whitespace-nowrap">
            {item.icon === 'gift' && (
              <Gift className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
            )}
            {item.icon === 'tag' && (
              <Tag className="w-3.5 h-3.5 text-emerald-300 shrink-0" aria-hidden="true" />
            )}
            <span
              className={
                item.accent === 'gold'
                  ? 'text-amber-200 font-extrabold'
                  : item.accent === 'festive'
                  ? 'px-2 py-0.5 rounded bg-rose-600/85 text-white border border-rose-400/40 font-extrabold tabular-nums'
                  : 'text-slate-100/90 font-semibold'
              }
            >
              {item.text}
            </span>
          </span>
          <span aria-hidden="true" className="text-amber-400/70 text-[10px]">
            ◆
          </span>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <aside
      aria-label="Promotion de Décembre OUMAR IPHONE"
      className="omr-marquee-group relative w-full overflow-hidden bg-gradient-to-r from-[#06291f] via-[#0b1716] to-[#290b14] text-white border-y border-amber-400/25 select-none"
    >
      {/* Guirlande lumineuse discrète sur le rail supérieur */}
      <div
        aria-hidden="true"
        className="w-full h-[6px] flex items-center justify-around px-2 border-b border-white/10 bg-black/25 overflow-hidden"
      >
        {Array.from({ length: 32 }).map((_, i) => (
          <span
            key={`bulb-top-${i}`}
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${GARLAND_COLORS[i % GARLAND_COLORS.length]}`}
          />
        ))}
      </div>

      {/* Bandeau défilant fluide */}
      <a
        href="#catalogue"
        className="block py-2.5 sm:py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      >
        <div className="omr-marquee-track">
          {renderGroup('g1')}
          {renderGroup('g2')}
          {renderGroup('g3')}
          {renderGroup('g4')}
        </div>
      </a>

      {/* Filet festif discret sur la bordure inférieure */}
      <div
        aria-hidden="true"
        className="h-[2px] w-full bg-gradient-to-r from-emerald-500/70 via-amber-400/80 to-rose-500/70"
      />
    </aside>
  );
};
