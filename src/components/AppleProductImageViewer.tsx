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
}

// Cache global en mémoire des images déjà préchargées pour éviter les requêtes réseau répétées
const PRELOADED_URLS = new Set<string>();

/**
 * Composant de visualisation d'image produit haute performance & transition Apple fluide.
 * - Précharge les finitions couleur UNIQUEMENT lorsque la carte approche du viewport (gain majeur sur mobile)
 * - Conserve l'image précédente visible pendant le chargement de la suivante (zéro flash blanc)
 * - Squelette shimmer doux avant l'arrivée de la première image
 * - S'adapte automatiquement aux performances CPU/RAM/réseau de l'appareil
 */
export const AppleProductImageViewer: React.FC<AppleProductImageViewerProps> = ({
  src,
  alt,
  allImagesToPreload = [],
  className = 'max-h-[85%] max-w-full object-contain drop-shadow-xl select-none',
  containerClassName = 'relative aspect-square w-full flex items-center justify-center my-auto py-4 overflow-hidden',
  fallbackImage,
  priority = false
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
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const initial = src || fallbackImage || '';
    return Boolean(initial && !PRELOADED_URLS.has(initial));
  });
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);

  const requestIdRef = useRef<number>(0);

  // Charger la nouvelle source d'image avec transition Apple sans flash blanc
  useEffect(() => {
    const targetSrc = src || fallbackImage || '';
    if (!targetSrc) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    if (targetSrc === currentSrc && !hasError && retryKey === 0) return;

    const currentReqId = ++requestIdRef.current;

    if (currentSrc && currentSrc !== targetSrc) {
      setPreviousSrc(currentSrc);
      setIsAnimating(true);
    } else {
      setIsLoading(true);
    }

    setHasError(false);

    if (PRELOADED_URLS.has(targetSrc)) {
      setCurrentSrc(targetSrc);
      setIsLoading(false);

      if (currentSrc && currentSrc !== targetSrc) {
        setTimeout(() => {
          if (requestIdRef.current === currentReqId) {
            setIsAnimating(false);
            setPreviousSrc(null);
          }
        }, perf.tier === 'low' ? 160 : 360);
      } else {
        setIsAnimating(false);
      }
      return;
    }

    const img = new Image();
    img.decoding = 'async';
    img.src = targetSrc;

    const applyTransition = () => {
      if (requestIdRef.current !== currentReqId) return;

      PRELOADED_URLS.add(targetSrc);
      setCurrentSrc(targetSrc);
      setIsLoading(false);

      requestAnimationFrame(() => {
        if (requestIdRef.current !== currentReqId) return;

        setTimeout(() => {
          if (requestIdRef.current === currentReqId) {
            setIsAnimating(false);
            setPreviousSrc(null);
          }
        }, perf.tier === 'low' ? 160 : 380);
      });
    };

    if (img.complete && img.naturalWidth > 0) {
      applyTransition();
    } else {
      img.onload = applyTransition;
      img.onerror = () => {
        if (requestIdRef.current !== currentReqId) return;
        setIsLoading(false);
        setIsAnimating(false);
        setPreviousSrc(null);
        setHasError(true);
      };
    }
  }, [src, fallbackImage, retryKey, perf.tier]);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsLoading(true);
    setRetryKey((prev) => prev + 1);
  };

  const transitionClasses = perf.tier === 'low' || perf.prefersReducedMotion
    ? (isAnimating ? 'opacity-0' : 'opacity-100')
    : (isAnimating ? 'opacity-0 scale-[0.96] translate-x-1.5' : 'opacity-100 scale-100 translate-x-0');

  return (
    <div ref={containerRef} className={containerClassName}>
      {/* Squelette shimmer doux pendant le premier chargement */}
      {isLoading && !previousSrc && !hasError && (
        <div className="absolute inset-2 rounded-2xl shimmer-surface z-0 pointer-events-none" />
      )}

      {/* Sous-couche : Image précédente maintenue visible durant le changement de finition */}
      {previousSrc && isAnimating && (
        <img
          src={previousSrc}
          alt=""
          className={`${className} absolute inset-0 m-auto pointer-events-none opacity-80 transition-opacity ${
            perf.tier === 'low' ? 'duration-150' : 'duration-380'
          } ease-[cubic-bezier(0.16,1,0.3,1)]`}
          aria-hidden="true"
        />
      )}

      {/* Couche principale : Image active */}
      {!hasError && currentSrc && (
        <img
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
          className={`${className} relative z-10 transition-all ${
            perf.tier === 'low' ? 'duration-150' : 'duration-380'
          } ease-[cubic-bezier(0.16,1,0.3,1)] ${transitionClasses}`}
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
