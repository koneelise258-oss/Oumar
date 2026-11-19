import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VideoItem } from '../types';
import { ExternalLink, Play, Pause, Volume2, VolumeX, RefreshCw, RotateCcw } from 'lucide-react';
import { extractSafeTikTokId, isSafeMediaUrl, isSafeTikTokUrl } from '../utils/security';
import { useDevicePerformance } from '../utils/devicePerformance';

interface VideosSectionProps {
  id?: string;
  videos: VideoItem[];
}

/**
 * Extrait proprement l'identifiant numérique unique d'une vidéo TikTok après validation stricte du domaine.
 */
export const extractTikTokVideoId = (rawUrl: string): string | null => {
  return extractSafeTikTokId(rawUrl);
};

/**
 * Composant individuel ultra-optimisé pour mobile et desktop :
 * - Chargement prédictif à l'approche du viewport (ne charge pas les vidéos hors-écran au démarrage)
 * - Mise en pause automatique dès que la carte sort de l'écran (économie batterie, CPU et bande passante)
 * - Boucle ininterrompue sans écran noir
 * - Façade légère 1-clic pour TikTok sur connexions mobiles lentes
 */
const VideoWallItem: React.FC<{ video: VideoItem; index: number }> = ({ video, index }) => {
  const perf = useDevicePerformance();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef<boolean>(false);

  const [isNearView, setIsNearView] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [tikTokKey, setTikTokKey] = useState(0);
  // Sur mobile avec connexion lente ou faible puissance, façade interactive légère avant de charger l'iframe TikTok
  const useLightTikTokFacade = perf.isSlowConnection || (perf.isMobile && perf.tier === 'low');
  const [tikTokActivated, setTikTokActivated] = useState(!useLightTikTokFacade);

  const isTikTok = video.type === 'tiktok' || isSafeTikTokUrl(video.url);
  const tikTokId = isTikTok ? extractTikTokVideoId(video.url) : null;
  const safeDirectVideoUrl = !isTikTok && isSafeMediaUrl(video.url) ? video.url : undefined;

  useEffect(() => {
    if (!useLightTikTokFacade) {
      setTikTokActivated(true);
    }
  }, [useLightTikTokFacade]);

  // 1a. Observer zone élargie pour attacher la source juste avant d'arriver sur la vidéo
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const preloadObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsNearView(true);
          preloadObserver.disconnect();
        }
      },
      {
        rootMargin: perf.isMobile ? '180px 0px' : '320px 0px',
        threshold: 0.01
      }
    );

    preloadObserver.observe(el);
    return () => preloadObserver.disconnect();
  }, [perf.isMobile]);

  // 1b. Observer visibilité réelle : auto-play à l'entrée, auto-pause immédiat hors-écran
  useEffect(() => {
    if (!containerRef.current || isTikTok) return;
    const el = containerRef.current;

    const playObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.25 }
    );

    playObserver.observe(el);
    return () => playObserver.disconnect();
  }, [isTikTok]);

  // 2. Pilotage lecture/pause intelligent selon visibilité à l'écran
  useEffect(() => {
    if (isTikTok || !videoRef.current) return;
    const v = videoRef.current;

    if (isVisible && isNearView && !userPausedRef.current) {
      v.defaultMuted = true;
      v.muted = isMuted;

      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch(() => {
            v.muted = true;
            setIsMuted(true);
            v.play()
              .then(() => {
                setIsPlaying(true);
                setIsBuffering(false);
              })
              .catch(() => setIsPlaying(false));
          });
      }
    } else if (!isVisible && !v.paused) {
      v.pause();
      setIsPlaying(false);
    }
  }, [isVisible, isNearView, isTikTok, isMuted]);

  // 3. Reprise automatique lors du retour sur l'onglet
  useEffect(() => {
    if (isTikTok) return;
    const handleVisibility = () => {
      if (!videoRef.current) return;
      if (document.hidden) {
        videoRef.current.pause();
      } else if (isVisible && !userPausedRef.current) {
        videoRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isVisible, isTikTok]);

  // 4. Boucle ininterrompue sans écran noir
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    if (v.duration > 0 && v.currentTime >= v.duration - 0.12) {
      v.currentTime = 0;
      if (!userPausedRef.current && isVisible) {
        v.play().catch(() => {});
      }
    }
  }, [isVisible]);

  const handleEnded = useCallback(() => {
    if (!videoRef.current || userPausedRef.current) return;
    const v = videoRef.current;
    v.currentTime = 0;
    v.play().catch(() => {});
  }, []);

  // 5. Écoute sécurisée des événements TikTok postMessage
  useEffect(() => {
    if (!isTikTok || !tikTokActivated) return;
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://www.tiktok.com' && e.origin !== 'https://tiktok.com') return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (
          data?.type === 'ended' ||
          (data?.event === 'onPlayerStateChange' && data?.info === 0) ||
          data?.status === 'ended' ||
          data?.eventName === 'video_ended'
        ) {
          setTikTokKey((k) => k + 1);
        }
      } catch {
        // Ignorer les messages non JSON
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isTikTok, tikTokActivated]);

  // Contrôles de lecture HTML5
  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current || isTikTok) return;

    if (videoRef.current.paused) {
      userPausedRef.current = false;
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      userPausedRef.current = true;
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isTikTok]);

  // Contrôle du son HTML5 (sans couper la lecture)
  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current || isTikTok) return;

    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    videoRef.current.defaultMuted = nextMuted;
    setIsMuted(nextMuted);
  }, [isTikTok]);

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsBuffering(true);
    userPausedRef.current = false;
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  const handleReloadTikTok = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTikTokKey((k) => k + 1);
    setIsBuffering(true);
  };

  // 1. RENDU DES VIDÉOS TIKTOK
  if (isTikTok) {
    const fallbackUrl = tikTokId
      ? `https://www.tiktok.com/@oumar_iphone.0/video/${tikTokId}`
      : `https://www.tiktok.com/@oumar_iphone.0`;

    return (
      <div
        ref={containerRef}
        className="relative w-full aspect-[9/16] rounded-2xl sm:rounded-[28px] overflow-hidden bg-[#0a0f1d] shadow-md sm:shadow-lg border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-center transition-transform duration-300 md:hover:scale-[1.015] select-none group"
      >
        {isNearView && tikTokActivated && tikTokId && !hasError ? (
          <>
            {isBuffering && (
              <div className="absolute inset-0 shimmer-surface z-10 pointer-events-none" />
            )}

            <iframe
              key={`tiktok-${tikTokId}-${tikTokKey}`}
              src={`https://www.tiktok.com/player/v1/${tikTokId}?autoplay=1`}
              title={video.title || `Vidéo TikTok OUMAR IPHONE ${index + 1}`}
              className={`w-full h-full border-0 outline-none rounded-2xl sm:rounded-[28px] block relative z-0 transition-opacity duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
              onLoad={() => {
                setIsLoaded(true);
                setIsBuffering(false);
              }}
              onError={() => {
                setHasError(true);
                setIsBuffering(false);
              }}
            />

            <button
              type="button"
              onClick={handleReloadTikTok}
              className="absolute top-2.5 right-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-white backdrop-blur-sm transition-all active:scale-95 cursor-pointer shadow-md border border-white/10 z-30 opacity-85 group-hover:opacity-100"
              title="Rejouer la vidéo"
              aria-label="Rejouer la vidéo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </>
        ) : (
          /* Façade rapide 1-clic (économise les données mobiles) ou repli TikTok */
          <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white space-y-3">
            {tikTokId && !hasError && !tikTokActivated ? (
              <button
                type="button"
                onClick={() => {
                  setIsBuffering(true);
                  setTikTokActivated(true);
                }}
                className="w-14 h-14 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                aria-label={`Lire la vidéo ${video.title || 'OUMAR IPHONE'}`}
              >
                <Play className="w-6 h-6 ml-0.5 fill-current" />
              </button>
            ) : (
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shadow-md">
                <Play className="w-5 h-5 ml-0.5 fill-current" />
              </div>
            )}

            <div className="space-y-0.5 max-w-[90%]">
              <span className="text-xs font-bold font-['Outfit'] block text-white truncate">
                {video.title || 'Déballage Boutique OUMAR'}
              </span>
              <span className="text-[11px] text-slate-400 block">
                @oumar_iphone.0
              </span>
            </div>

            {tikTokId && !hasError && !tikTokActivated ? (
              <button
                type="button"
                onClick={() => {
                  setIsBuffering(true);
                  setTikTokActivated(true);
                }}
                className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/15 transition-colors cursor-pointer"
              >
                Lancer la vidéo
              </button>
            ) : (
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>Voir sur TikTok</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. RENDU DES VIDÉOS DIRECTES (HTML5 MP4 / WebM) — RAPIDE, AUTO-PAUSE HORS-ÉCRAN & BOUCLE CONTINUE
  const preloadMode = perf.isMobile || perf.isSlowConnection || perf.tier === 'low' ? 'metadata' : 'auto';

  return (
    <div
      ref={containerRef}
      onClick={togglePlay}
      className="relative w-full aspect-[9/16] rounded-2xl sm:rounded-[28px] overflow-hidden bg-[#090d16] shadow-md sm:shadow-lg border border-slate-200/60 dark:border-slate-800/80 cursor-pointer select-none transition-transform duration-300 md:hover:scale-[1.015] group"
    >
      {/* Squelette Shimmer fluide avant la première image vidéo */}
      {(!isLoaded || isBuffering) && !hasError && (
        <div className="absolute inset-0 shimmer-surface z-10 pointer-events-none transition-opacity duration-300" />
      )}

      {/* Repli propre en cas d'erreur réseau */}
      {hasError ? (
        <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-slate-900 text-white space-y-2.5">
          <p className="text-xs text-slate-300">Vidéo momentanément indisponible.</p>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={isNearView ? safeDirectVideoUrl : undefined}
          muted={isMuted}
          loop
          playsInline
          webkit-playsinline="true"
          preload={isNearView ? preloadMode : 'none'}
          disablePictureInPicture
          onLoadedData={() => {
            setIsLoaded(true);
            setIsBuffering(false);
          }}
          onCanPlay={() => {
            setIsLoaded(true);
            setIsBuffering(false);
            if (isVisible && !userPausedRef.current && videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
          }}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsLoaded(true);
            setIsBuffering(false);
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={() => {
            setHasError(true);
            setIsBuffering(false);
          }}
          onVolumeChange={() => {
            if (videoRef.current) setIsMuted(videoRef.current.muted);
          }}
          className={`w-full h-full object-cover rounded-2xl sm:rounded-[28px] block border-0 outline-none transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Overlay discret quand mis en pause manuellement */}
      {!isPlaying && !hasError && isLoaded && !isBuffering && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity z-20">
          <div className="w-12 h-12 rounded-full bg-white/95 text-slate-950 flex items-center justify-center shadow-xl">
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </div>
        </div>
      )}

      {/* Contrôle du son (Zone tactile 44x44px) */}
      {!hasError && (
        <button
          type="button"
          onClick={toggleMute}
          className="absolute top-2.5 right-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-sm transition-all active:scale-90 cursor-pointer shadow-md border border-white/10 z-30"
          title={isMuted ? 'Activer le son' : 'Couper le son'}
          aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
        </button>
      )}

      {/* Contrôle Play / Pause (Zone tactile 44x44px) */}
      {!hasError && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute bottom-2.5 left-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-sm transition-all active:scale-90 cursor-pointer opacity-85 group-hover:opacity-100 shadow-md border border-white/10 z-30"
          title={isPlaying ? 'Mettre en pause' : 'Lire'}
          aria-label={isPlaying ? 'Mettre en pause' : 'Lire'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
          )}
        </button>
      )}
    </div>
  );
};

/**
 * Mur de vidéos immersif et ultra-rapide, structuré avec en-tête éditorial épuré.
 */
export const VideosSection: React.FC<VideosSectionProps> = ({
  id = 'videos',
  videos
}) => {
  const publishedVideos = videos.filter((v) => v.published !== false);

  if (publishedVideos.length === 0) return null;

  return (
    <section
      id={id}
      className="perf-section w-full py-10 sm:py-16 px-4 sm:px-6 lg:px-8 scroll-mt-20 relative z-10 overflow-hidden"
    >
      <div className="w-full max-w-7xl mx-auto">
        {/* En-tête de section propre et équilibré */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-9">
          <div>
            <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-slate-500 dark:text-slate-400 mb-1.5">
              EN DIRECT DE LA BOUTIQUE · ABIDJAN
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white font-['Outfit']">
              Nos Vidéos & Déballages
            </h2>
          </div>

          <a
            href="https://www.tiktok.com/@oumar_iphone.0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors self-start sm:self-auto"
          >
            <span>Suivre @oumar_iphone.0</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Grille adaptative 2 colonnes mobile -> 4 colonnes desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 w-full justify-items-center">
          {publishedVideos.map((video, idx) => (
            <VideoWallItem key={video.id} video={video} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};
