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

// In-memory cache of loaded image URLs to prevent repeated network requests
const PRELOADED_URLS = new Set<string>();

/**
 * Composant de visualisation d'image produit adaptatif & haute performance.
 * - S'adapte dynamiquement au niveau de performance du téléphone/PC
 * - Cache global en mémoire pour les images déjà chargées
 * - Dégradation élégante sans masquer l'erreur par l'image d'une mauvaise couleur
 * - Bouton de nouvelle tentative en cas d'échec réseau
 * - Prise en charge de prefers-reduced-motion et des téléphones mobiles modestes
 */
export const AppleProductImageViewer: React.FC<AppleProductImageViewerProps> = ({
  src,
  alt,
  allImagesToPreload = [],
  className = "max-h-[85%] max-w-full object-contain drop-shadow-xl select-none",
  containerClassName = "relative aspect-square w-full flex items-center justify-center my-auto py-4 overflow-hidden",
  fallbackImage,
  priority = false
}) => {
  const perf = useDevicePerformance();

  // Preload finish images into memory cache based on performance profile
  useEffect(() => {
    if (!allImagesToPreload || allImagesToPreload.length === 0) return;

    const urlsToPreload = allImagesToPreload
      .filter((url) => url && typeof url === 'string' && url.trim() && !PRELOADED_URLS.has(url))
      .slice(0, perf.maxConcurrentPreloads);

    if (urlsToPreload.length === 0) return;

    // Use requestIdleCallback when available or setTimeout on low devices
    const schedulePreload = () => {
      urlsToPreload.forEach((url) => {
        const img = new Image();
        img.src = url;
        img.onload = () => PRELOADED_URLS.add(url);
      });
    };

    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(schedulePreload, { timeout: 2000 });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const timer = setTimeout(schedulePreload, 150);
      return () => clearTimeout(timer);
    }
  }, [allImagesToPreload, perf.maxConcurrentPreloads]);

  const [currentSrc, setCurrentSrc] = useState<string>(src || fallbackImage || '');
  const [previousSrc, setPreviousSrc] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);

  const requestIdRef = useRef<number>(0);

  // Charger la nouvelle source d'image avec transition adaptative
  useEffect(() => {
    const targetSrc = src || fallbackImage || '';
    if (!targetSrc) {
      setHasError(true);
      return;
    }

    // Si la source est identique et qu'il n'y a pas de retry forcé, ignorer
    if (targetSrc === currentSrc && !hasError && retryKey === 0) return;

    const currentReqId = ++requestIdRef.current;
    
    // Conserver l'image précédente en sous-couche uniquement si elle existe et diffère
    if (currentSrc && currentSrc !== targetSrc) {
      setPreviousSrc(currentSrc);
      setIsAnimating(true);
    } else {
      setIsLoading(true);
    }

    setHasError(false);

    // Déjà en cache mémoire ?
    if (PRELOADED_URLS.has(targetSrc)) {
      setCurrentSrc(targetSrc);
      setIsLoading(false);

      if (previousSrc && previousSrc !== targetSrc) {
        setTimeout(() => {
          if (requestIdRef.current === currentReqId) {
            setIsAnimating(false);
            setPreviousSrc(null);
          }
        }, perf.tier === 'low' ? 150 : 350);
      } else {
        setIsAnimating(false);
      }
      return;
    }

    // Chargement asynchrone
    const img = new Image();
    img.src = targetSrc;

    const applyTransition = () => {
      if (requestIdRef.current !== currentReqId) return; // Requête obsolète

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
        }, perf.tier === 'low' ? 150 : 380);
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
  }, [src, retryKey, perf.tier]);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsLoading(true);
    setRetryKey((prev) => prev + 1);
  };

  // Simplification visuelle sur appareil modeste
  const transitionClasses = perf.tier === 'low' || perf.prefersReducedMotion
    ? (isAnimating ? 'opacity-0' : 'opacity-100')
    : (isAnimating ? 'opacity-0 scale-[0.96] translate-x-1.5' : 'opacity-100 scale-100 translate-x-0');

  return (
    <div className={containerClassName}>
      {/* Sous-couche : Image précédente pour éviter les flashs blancs */}
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
          onError={() => setHasError(true)}
          className={`${className} relative z-10 transition-all ${
            perf.tier === 'low' ? 'duration-150' : 'duration-380'
          } ease-[cubic-bezier(0.16,1,0.3,1)] ${transitionClasses}`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}

      {/* Spinner de chargement discret sur connexion lente */}
      {isLoading && !previousSrc && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xs rounded-2xl">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* État d'erreur clair avec bouton de nouvelle tentative (sans masquer l'erreur par une fausse couleur) */}
      {hasError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <ImageOff className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Photo indisponible pour cette finition
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
        </div>
      )}
    </div>
  );
};
