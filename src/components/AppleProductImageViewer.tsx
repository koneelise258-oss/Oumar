import React, { useState, useEffect, useRef } from 'react';
import { useDevicePerformance } from '../utils/devicePerformance';
import { RotateCcw, ImageOff } from 'lucide-react';

interface AppleProductImageViewerProps {
  src: string;
  alt: string;
  allImagesToPreload?: string[];
  className?: string;
  containerClassName?: string;
  fallbackImage?: string;
  priority?: boolean;
  /** Couleur hexadécimale sélectionnée pour le halo ambiant subtil et fluide */
  accentHex?: string;
  /** Clé de couleur courante pour animer doucement même si deux finitions partagent la même photo */
  colorKey?: string;
  /** Arrondi des bords appliqué directement aux visuels (en px) */
  imageRoundedPx?: number;
}

// Cache global en mémoire des images déjà préchargées pour éviter les requêtes réseau répétées
const PRELOADED_URLS = new Set<string>();

type TransitionPhase = 'idle' | 'prepare' | 'crossfade';

/**
 * Convertit un code hexadécimal (#RRGGBB ou #RGB) en "r, g, b" pour un halo ambiant subtil.
 */
function hexToRgbTuple(hex?: string): string | null {
  if (!hex || typeof hex !== 'string') return null;
  const clean = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return null;
}

/**
 * Composant de visualisation d'image produit haute performance & transition Apple fluide.
 * - Crossfade simultané doux et tranquille (480ms ease-out Apple) sans flash blanc
 * - Halo lumineux subtil harmonisé avec la couleur Apple sélectionnée
 * - Précharge les finitions couleur UNIQUEMENT lorsque la carte approche du viewport
 * - S'adapte automatiquement aux performances CPU/RAM/réseau de l'appareil
 */
export const AppleProductImageViewer: React.FC<AppleProductImageViewerProps> = ({
  src,
  alt,
  allImagesToPreload = [],
  className = 'max-h-[85%] max-w-full object-contain drop-shadow-xl select-none',
  containerClassName = 'relative aspect-square w-full flex items-center justify-center my-auto py-4 overflow-hidden',
  fallbackImage,
  priority = false,
  accentHex,
  colorKey,
  imageRoundedPx
}) => {
  const perf = useDevicePerformance();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState<boolean>(priority);

  // Déclencher le préchargement des finitions uniquement à l'approche de l'écran
  useEffect(() => {
    if (priority || isNearViewport || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: perf.isMobile ? '120px 0px' : '220px 0px', threshold: 0.01 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority, isNearViewport, perf.isMobile]);

  // Préchargement adaptatif des autres couleurs (uniquement si carte visible + connexion suffisante)
  useEffect(() => {
    if (!isNearViewport || perf.isSlowConnection || !allImagesToPreload || allImagesToPreload.length === 0) {
      return;
    }

    const maxToPreload = perf.isMobile ? Math.min(2, perf.maxConcurrentPreloads) : perf.maxConcurrentPreloads;
    const urlsToPreload = allImagesToPreload
      .filter((url) => url && typeof url === 'string' && url.trim() && url !== src && !PRELOADED_URLS.has(url))
      .slice(0, maxToPreload);

    if (urlsToPreload.length === 0) return;

    const schedulePreload = () => {
      urlsToPreload.forEach((url) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
        img.onload = () => PRELOADED_URLS.add(url);
      });
    };

    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(schedulePreload, { timeout: 2200 });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const timer = setTimeout(schedulePreload, 220);
      return () => clearTimeout(timer);
    }
  }, [isNearViewport, allImagesToPreload, src, perf.maxConcurrentPreloads, perf.isMobile, perf.isSlowConnection]);

  const [currentSrc, setCurrentSrc] = useState<string>(src || fallbackImage || '');
  const [previousSrc, setPreviousSrc] = useState<string | null>(null);
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const [settleTick, setSettleTick] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const initial = src || fallbackImage || '';
    return Boolean(initial && !PRELOADED_URLS.has(initial));
  });
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);

  const requestIdRef = useRef<number>(0);
  const currentSrcRef = useRef<string>(currentSrc);
  currentSrcRef.current = currentSrc;
  const lastColorKeyRef = useRef<string | undefined>(colorKey);
  const raf1Ref = useRef<number | null>(null);
  const raf2Ref = useRef<number | null>(null);
  const cleanupTimerRef = useRef<number | null>(null);

  const clearPendingTimers = () => {
    if (raf1Ref.current !== null) {
      cancelAnimationFrame(raf1Ref.current);
      raf1Ref.current = null;
    }
    if (raf2Ref.current !== null) {
      cancelAnimationFrame(raf2Ref.current);
      raf2Ref.current = null;
    }
    if (cleanupTimerRef.current !== null) {
      window.clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }
  };

  useEffect(() => clearPendingTimers, []);

  // Déclenche une légère respiration visuelle si la couleur change mais pointe vers la même photo
  useEffect(() => {
    if (colorKey !== undefined && lastColorKeyRef.current !== undefined && colorKey !== lastColorKeyRef.current) {
      const targetSrc = src || fallbackImage || '';
      if (targetSrc === currentSrcRef.current) {
        setSettleTick((t) => t + 1);
      }
    }
    lastColorKeyRef.current = colorKey;
  }, [colorKey, src, fallbackImage]);

  // Charger la nouvelle source d'image avec véritable crossfade simultané doux et tranquille
  useEffect(() => {
    const targetSrc = src || fallbackImage || '';
    if (!targetSrc) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const activeSrc = currentSrcRef.current;
    if (targetSrc === activeSrc && !hasError && retryKey === 0) return;

    clearPendingTimers();
    const currentReqId = ++requestIdRef.current;
    const isReduced = perf.tier === 'low' || perf.prefersReducedMotion;
    const transitionMs = isReduced ? 180 : 480;

    const startCrossfade = (outgoingSrc: string | null) => {
      if (requestIdRef.current !== currentReqId) return;

      PRELOADED_URLS.add(targetSrc);
      setHasError(false);
      setIsLoading(false);

      if (!outgoingSrc || outgoingSrc === targetSrc || isReduced) {
        setCurrentSrc(targetSrc);
        setPreviousSrc(null);
        setPhase('idle');
        return;
      }

      // Étape 1 : Monter l'image entrante à opacity: 0 pendant que l'ancienne reste visible à opacity: 1
      setPreviousSrc(outgoingSrc);
      setCurrentSrc(targetSrc);
      setPhase('prepare');

      // Étape 2 : Double rAF pour que le navigateur applique l'état initial avant de lancer le fondu croisé simultané
      raf1Ref.current = requestAnimationFrame(() => {
        if (requestIdRef.current !== currentReqId) return;
        raf2Ref.current = requestAnimationFrame(() => {
          if (requestIdRef.current !== currentReqId) return;
          setPhase('crossfade');

          cleanupTimerRef.current = window.setTimeout(() => {
            if (requestIdRef.current === currentReqId) {
              setPreviousSrc(null);
              setPhase('idle');
            }
          }, transitionMs + 30);
        });
      });
    };

    if (!activeSrc) {
      setIsLoading(true);
    }

    if (PRELOADED_URLS.has(targetSrc)) {
      startCrossfade(activeSrc || null);
      return;
    }

    const img = new Image();
    img.decoding = 'async';
    img.src = targetSrc;

    if (img.complete && img.naturalWidth > 0) {
      startCrossfade(activeSrc || null);
    } else {
      img.onload = () => startCrossfade(activeSrc || null);
      img.onerror = () => {
        if (requestIdRef.current !== currentReqId) return;
        setIsLoading(false);
        setPhase('idle');
        setPreviousSrc(null);
        setHasError(true);
      };
    }
  }, [src, fallbackImage, retryKey, perf.tier, perf.prefersReducedMotion]);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsLoading(true);
    setRetryKey((prev) => prev + 1);
  };

  const isReduced = perf.tier === 'low' || perf.prefersReducedMotion;
  const rgbTuple = hexToRgbTuple(accentHex);

  const outgoingClasses =
    phase === 'prepare'
      ? 'opacity-100 scale-100'
      : 'opacity-0 scale-[0.985]';

  const incomingClasses =
    phase === 'prepare'
      ? 'opacity-0 scale-[0.975]'
      : 'opacity-100 scale-100';

  const durationClass = isReduced ? 'duration-150' : 'duration-[480ms]';
  const settleAnimationClass = !isReduced && settleTick > 0 && phase === 'idle' ? 'animate-color-settle' : '';

  return (
    <div ref={containerRef} className={containerClassName}>
      {/* Halo ambiant discret teinté par la couleur Apple choisie (transition douce et tranquille) */}
      {rgbTuple && !isReduced && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-0 transition-all duration-700 ease-out"
          style={{
            background: `radial-gradient(circle at 50% 52%, rgba(${rgbTuple}, 0.16) 0%, rgba(${rgbTuple}, 0.05) 45%, transparent 72%)`
          }}
        />
      )}

      {/* Squelette shimmer doux pendant le premier chargement */}
      {isLoading && !previousSrc && !hasError && (
        <div className="absolute inset-2 rounded-2xl shimmer-surface z-0 pointer-events-none" />
      )}

      {/* Sous-couche : Image précédente qui s'efface en douceur pendant le fondu croisé */}
      {previousSrc && (
        <img
          src={previousSrc}
          alt=""
          className={`${className} absolute inset-0 m-auto z-[5] pointer-events-none transition-[opacity,transform] ${durationClass} ease-[cubic-bezier(0.22,1,0.36,1)] ${outgoingClasses}`}
          style={imageRoundedPx !== undefined ? { borderRadius: `${imageRoundedPx}px` } : undefined}
          aria-hidden="true"
        />
      )}

      {/* Couche principale : Nouvelle finition qui apparaît en fondu croisé */}
      {!hasError && currentSrc && (
        <img
          key={settleTick > 0 ? `settle-${settleTick}` : 'active-img'}
          src={currentSrc}
          alt={alt}
          onLoad={() => {
            PRELOADED_URLS.add(currentSrc);
            setIsLoading(false);
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className={`${className} relative z-10 transition-[opacity,transform] ${durationClass} ease-[cubic-bezier(0.22,1,0.36,1)] ${incomingClasses} ${settleAnimationClass}`}
          style={imageRoundedPx !== undefined ? { borderRadius: `${imageRoundedPx}px` } : undefined}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
        />
      )}

      {/* État d'erreur clair avec bouton de nouvelle tentative */}
      {hasError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <ImageOff className="w-7 h-7 text-slate-400 mb-2" />
          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Photo indisponible
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
        </div>
      )}
    </div>
  );
};
