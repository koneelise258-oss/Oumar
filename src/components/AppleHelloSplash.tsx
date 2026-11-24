import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppleLogo } from './BrandIcons';

interface AppleHelloSplashProps {
  onComplete: () => void;
}

// Tracés officiels extraits de la ressource Apple SF-Hello (hello-en.svg)
const HELLO_PATH_1 =
  'M-109.06069946289062,95.92639923095703 C1.9544999599456787,157.6403045654297 103.11389923095703,236.9969940185547 217.881103515625,372.07550048828125 C296,464.2846984863281 337.9999084472656,569.5725708007812 340,642.1939697265625 C341,696.1920166015625 314.6702880859375,737.156005859375 266,737.156005859375 C212,737.156005859375 178,696.1920166015625 157,602.1610107421875 C134,498.82000732421875 117,380.239990234375 74,0';

const HELLO_PATH_2 =
  'M78.21453094482422,37.160953521728516 C100.22924041748047,230.68260192871094 184,372 291,372 C355,372 395.6745910644531,321 384.1253967285156,248 C377.6238098144531,205 370.0873107910156,161 361.3063049316406,110 C351.0714111328125,46 380.3254089355469,-4 468.96173095703125,-4 C598.2246704101562,-4 739.2435302734375,67.83381652832031 811.4124145507812,179.0941619873047 C836,217 846,251 847,284 C848,344 814,389 754,389 C678,389 620,303 620,193 C620,75 684,-8 819.9180908203125,-8 C1004.7244873046875,-8 1209.4246826171875,213.84754943847656 1303.4808349609375,461.42327880859375 C1330.037353515625,531.3258056640625 1340,596.2349243164062 1340,641.593994140625 C1340,695.3764038085938 1323,736.673583984375 1275,736.673583984375 C1228,736.673583984375 1197,700.1784057617188 1169,642.5543823242188 C1136.1939697265625,575.7216186523438 1111.927734375,479.32598876953125 1102,370.3599853515625 C1077,96.94000244140625 1133,-4 1266.152099609375,-4 C1427.6083984375,-4 1607.1151123046875,220.92921447753906 1698.771728515625,462.18878173828125 C1725.037353515625,531.3258056640625 1735,596.2349243164062 1735,641.593994140625 C1735,695.3764038085938 1718,736.673583984375 1670,736.673583984375 C1623,736.673583984375 1592,700.1784057617188 1564,642.5543823242188 C1531.1939697265625,575.7216186523438 1506.927734375,479.32598876953125 1497,370.3599853515625 C1472,96.94000244140625 1528,-4 1646.906005859375,-4 C1765.623779296875,-4 1830.114990234375,99.48485565185547 1868.77880859375,209.3712158203125 C1907,318 1954,385 2052,385 C2133,385 2197,325 2197,212 C2197,87 2115.90087890625,-7 2013.41845703125,-8 C1923.234130859375,-9 1864,64 1870,174 C1877,296 1951,385 2048,385 C2104,385 2151.03564453125,360.1071472167969 2188,333 C2288.21435546875,259.8928527832031 2365.4287109375,305.0714416503906 2395,377.3571472167969';

export const AppleHelloSplash: React.FC<AppleHelloSplashProps> = ({ onComplete }) => {
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const [showBrand, setShowBrand] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const dismissedRef = useRef(false);

  const triggerExit = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setIsExiting(true);
    window.setTimeout(() => {
      onComplete();
    }, 460);
  };

  useLayoutEffect(() => {
    const p1 = path1Ref.current;
    const p2 = path2Ref.current;
    if (!p1 || !p2) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const len1 = p1.getTotalLength();
    const len2 = p2.getTotalLength();

    if (prefersReducedMotion) {
      p1.style.strokeDasharray = 'none';
      p1.style.strokeDashoffset = '0';
      p2.style.strokeDasharray = 'none';
      p2.style.strokeDashoffset = '0';
      setShowBrand(true);
      const t = window.setTimeout(triggerExit, 550);
      return () => window.clearTimeout(t);
    }

    p1.style.strokeDasharray = `${len1}`;
    p1.style.strokeDashoffset = `${len1}`;
    p2.style.strokeDasharray = `${len2}`;
    p2.style.strokeDashoffset = `${len2}`;

    const anim1 =
      typeof p1.animate === 'function'
        ? p1.animate(
            [{ strokeDashoffset: len1 }, { strokeDashoffset: 0 }],
            {
              duration: 460,
              delay: 120,
              easing: 'cubic-bezier(0.32, 0.04, 0.25, 1)',
              fill: 'forwards'
            }
          )
        : null;

    const anim2 =
      typeof p2.animate === 'function'
        ? p2.animate(
            [{ strokeDashoffset: len2 }, { strokeDashoffset: 0 }],
            {
              duration: 1380,
              delay: 480,
              easing: 'cubic-bezier(0.25, 0.08, 0.22, 1)',
              fill: 'forwards'
            }
          )
        : null;

    if (!anim1 || !anim2) {
      p1.style.strokeDashoffset = '0';
      p2.style.strokeDashoffset = '0';
    }

    const brandTimer = window.setTimeout(() => setShowBrand(true), 1220);
    const exitTimer = window.setTimeout(triggerExit, 2250);

    return () => {
      anim1?.cancel();
      anim2?.cancel();
      window.clearTimeout(brandTimer);
      window.clearTimeout(exitTimer);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        triggerExit();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Bienvenue sur OUMAR IPHONE"
      onClick={triggerExit}
      className={`fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isExiting
          ? 'opacity-0 scale-[1.018] pointer-events-none'
          : 'opacity-100 scale-100'
      } bg-[#fafbfc] dark:bg-[#050810]`}
    >
      {/* Voile d'ondes lumineuses iOS Setup en arrière-plan (doux et apaisé) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-[20%] -left-[12%] w-[70vw] h-[70vw] max-w-[680px] max-h-[680px] rounded-full blur-[90px] opacity-45 dark:opacity-28 omr-hello-orb-1"
          style={{
            background:
              'radial-gradient(circle, rgba(125,211,252,0.55) 0%, rgba(186,230,253,0.18) 55%, transparent 75%)'
          }}
        />
        <div
          className="absolute -bottom-[22%] -right-[10%] w-[72vw] h-[72vw] max-w-[700px] max-h-[700px] rounded-full blur-[96px] opacity-45 dark:opacity-25 omr-hello-orb-2"
          style={{
            background:
              'radial-gradient(circle, rgba(196,181,253,0.45) 0%, rgba(253,230,138,0.22) 55%, transparent 75%)'
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[45vh] max-w-[820px] rounded-full blur-[80px] opacity-35 dark:opacity-20"
          style={{
            background:
              'radial-gradient(ellipse, rgba(226,232,240,0.7) 0%, transparent 72%)'
          }}
        />
      </div>

      {/* Calligraphie officielle Apple SF-Hello */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8 w-full max-w-xl">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="-145 -45 2576 820"
          className="w-[240px] sm:w-[320px] md:w-[370px] h-auto overflow-visible text-slate-950 dark:text-white drop-shadow-[0_6px_24px_rgba(15,23,42,0.06)] dark:drop-shadow-[0_6px_28px_rgba(255,255,255,0.08)]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="omr-hello-ink" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.96" />
              <stop offset="55%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.88" />
            </linearGradient>
          </defs>
          <g transform="scale(1, -1) translate(0, -728.156005859375)">
            <path
              ref={path1Ref}
              d={HELLO_PATH_1}
              fill="none"
              stroke="url(#omr-hello-ink)"
              strokeWidth="62"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              ref={path2Ref}
              d={HELLO_PATH_2}
              fill="none"
              stroke="url(#omr-hello-ink)"
              strokeWidth="62"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>

        {/* Signature boutique Apple Abidjan discrète */}
        <div
          className={`mt-7 flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-[0.22em] uppercase text-slate-700 dark:text-slate-300 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            showBrand ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <AppleLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4 -mt-0.5 text-slate-950 dark:text-white shrink-0" />
          <span className="font-['Outfit'] font-bold tracking-[0.22em]">OUMAR IPHONE</span>
          <span className="text-slate-400 dark:text-slate-500 font-normal" aria-hidden="true">
            ·
          </span>
          <span className="tracking-[0.16em] text-slate-500 dark:text-slate-400 font-medium">
            Abidjan
          </span>
        </div>
      </div>

      {/* Bouton discret pour passer immédiatement */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          triggerExit();
        }}
        className="absolute bottom-7 sm:bottom-9 z-10 min-h-[44px] px-5 py-2 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        Passer
      </button>
    </div>
  );
};
