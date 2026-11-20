import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VideoItem } from '../types';
import { Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { extractSafeTikTokId, isSafeMediaUrl, isSafeTikTokUrl } from '../utils/security';
import { useDevicePerformance } from '../utils/devicePerformance';

interface VideosSectionProps {
  id?: string;
  videos: VideoItem[];
}

const UNMUTE_SYNC_EVENT = 'omr_video_unmute_sync';

/**
 * Extrait proprement l'identifiant numérique unique d'une vidéo TikTok après validation stricte du domaine.
 */
export const extractTikTokVideoId = (rawUrl: string): string | null => {
  return extractSafeTikTokId(rawUrl);
};

/**
 * Construit l'URL officielle TikTok Player v1 en mode 100 % épuré :
 * lecture automatique muette, boucle continue, sans likes/commentaires/partage/description/musique/barre de progression.
 */
const buildChromelessTikTokUrl = (tikTokId: string): string => {
  const params = new URLSearchParams({
    autoplay: '1',
    muted: '1',
    loop: '1',
    controls: '0',
    progress_bar: '0',
    play_button: '0',
    volume_control: '0',
    fullscreen_button: '0',
    timestamp: '0',
    music_info: '0',
    description: '0',
    rel: '0',
    native_context_menu: '0',
    closed_caption: '0'
  });
  return `https://www.tiktok.com/player/v1/${tikTokId}?${params.toString()}`;
};

/**
 * Carte vidéo épurée (HTML5 & TikTok sans habillage) :
 * - Lecture automatique et boucle continue sans clic requis
 * - Aucun bouton like / commentaire / partage / pause / rechargement
 * - Un seul bouton discret : Couper / Activer le son (44×44 px)
 * - Un seul son actif à la fois sur toute la grille (coupe automatiquement les autres vidéos)
 */
const VideoWallItem: React.FC<{ video: VideoItem; index: number }> = ({ video, index }) => {
  const perf = useDevicePerformance();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isNearView, setIsNearView] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [reloadNonce, setReloadNonce] = useState(0);

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  const isTikTok = video.type === 'tiktok' || isSafeTikTokUrl(video.url);
  const tikTokId = isTikTok ? extractTikTokVideoId(video.url) : null;
  const safeDirectVideoUrl = !isTikTok && isSafeMediaUrl(video.url) ? video.url : undefined;

  // Envoi sécurisé de commandes officielles au lecteur TikTok via postMessage
  const postTikTokCommand = useCallback((type: string, value?: unknown) => {
    const targetWindow = iframeRef.current?.contentWindow;
    if (!targetWindow) return;
    try {
      const payload =
        value !== undefined
          ? { 'x-tiktok-player': true, type, value }
          : { 'x-tiktok-player': true, type };
      targetWindow.postMessage(payload, 'https://www.tiktok.com');
    } catch {
      // Ignorer si l'iframe n'est pas encore initialisée
    }
  }, []);

  // 1a. Chargement prédictif à l'approche du viewport (rapide sur mobile sans bloquer la Hero)
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
        rootMargin: perf.isMobile ? '260px 0px' : '420px 0px',
        threshold: 0.01
      }
    );

    preloadObserver.observe(el);
    return () => preloadObserver.disconnect();
  }, [perf.isMobile]);

  // 1b. Suivi visibilité réelle : lecture automatique à l'écran + coupure du son hors-écran
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    visibilityObserver.observe(el);
    return () => visibilityObserver.disconnect();
  }, []);

  // 2. Coordination audio globale : quand une autre vidéo active le son, celle-ci repasse en muet
  useEffect(() => {
    const handleOtherUnmuted = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      if (customEvent.detail?.id === video.id) return;

      if (!isMutedRef.current) {
        setIsMuted(true);
        if (isTikTok) {
          postTikTokCommand('mute');
        } else if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.defaultMuted = true;
        }
      }
    };

    window.addEventListener(UNMUTE_SYNC_EVENT, handleOtherUnmuted);
    return () => window.removeEventListener(UNMUTE_SYNC_EVENT, handleOtherUnmuted);
  }, [video.id, isTikTok, postTikTokCommand]);

  // 3. Pilotage automatique HTML5 (autoplay continu à l'écran, pause + muet hors-écran)
  useEffect(() => {
    if (isTikTok || !videoRef.current) return;
    const v = videoRef.current;

    if (isVisible && isNearView) {
      v.defaultMuted = true;
      v.muted = isMutedRef.current;
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          v.muted = true;
          v.defaultMuted = true;
          setIsMuted(true);
          v.play().catch(() => {});
        });
      }
    } else if (!isVisible) {
      if (!isMutedRef.current) {
        v.muted = true;
        v.defaultMuted = true;
        setIsMuted(true);
      }
      if (!v.paused) {
        v.pause();
      }
    }
  }, [isVisible, isNearView, isTikTok]);

  // 4. Pilotage automatique TikTok selon la visibilité (reprise auto à l'écran, muet hors-écran)
  useEffect(() => {
    if (!isTikTok || !isNearView) return;

    if (isVisible) {
      if (isMutedRef.current) {
        postTikTokCommand('mute');
      }
      postTikTokCommand('play');
    } else {
      // Couper le son si l'utilisateur a défilé loin de la vidéo
      if (!isMutedRef.current) {
        setIsMuted(true);
        postTikTokCommand('mute');
      }
    }
  }, [isVisible, isNearView, isTikTok, postTikTokCommand]);

  // 5. Reprise automatique lors du retour sur l'onglet
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isTikTok) {
          postTikTokCommand('mute');
        } else if (videoRef.current) {
          videoRef.current.pause();
        }
        return;
      }

      if (!isVisibleRef.current) return;

      if (isTikTok) {
        if (isMutedRef.current) postTikTokCommand('mute');
        postTikTokCommand('play');
      } else if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTikTok, postTikTokCommand]);

  // 6. Écoute sécurisée et ciblée des événements TikTok Player v1 (boucle fluide sans écran noir)
  useEffect(() => {
    if (!isTikTok || !isNearView) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://www.tiktok.com' && e.origin !== 'https://tiktok.com') return;
      // Filtrer strictement les messages provenant de CETTE iframe uniquement
      if (iframeRef.current?.contentWindow && e.source !== iframeRef.current.contentWindow) {
        return;
      }

      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!data || typeof data !== 'object') return;

        // Événements officiels x-tiktok-player
        if (data['x-tiktok-player'] === true) {
          const { type, value } = data;

          if (type === 'onPlayerReady') {
            setIsLoaded(true);
            postTikTokCommand('mute');
            setIsMuted(true);
            postTikTokCommand('play');
          } else if (type === 'onStateChange') {
            if (value === 1) {
              // En cours de lecture
              setIsLoaded(true);
            } else if (value === 0) {
              // Fin de vidéo : boucle immédiate sans recharger l'iframe
              postTikTokCommand('seekTo', 0);
              postTikTokCommand('play');
            } else if (value === 2 && isVisibleRef.current) {
              // Empêche la vidéo de rester figée en pause
              postTikTokCommand('play');
            }
          } else if (type === 'onCurrentTime' && value && typeof value === 'object') {
            const currentTime = Number(value.currentTime || 0);
            const duration = Number(value.duration || 0);
            // Anticipation de fin pour éliminer tout écran de fin ou recommandation TikTok
            if (duration > 0.5 && currentTime >= duration - 0.18) {
              postTikTokCommand('seekTo', 0);
              postTikTokCommand('play');
            }
          } else if (type === 'onMuteChange' && typeof value === 'boolean') {
            setIsMuted(value);
          }
          return;
        }

        // Compatibilité descendante si un événement de fin alternatif est émis
        if (
          data.type === 'ended' ||
          (data.event === 'onPlayerStateChange' && data.info === 0) ||
          data.status === 'ended' ||
          data.eventName === 'video_ended'
        ) {
          postTikTokCommand('seekTo', 0);
          postTikTokCommand('play');
        }
      } catch {
        // Ignorer silencieusement les messages non JSON
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isTikTok, isNearView, postTikTokCommand]);

  // 7. Boucle HTML5 continue sans micro-coupure
  const handleHtml5TimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.duration > 0 && v.currentTime >= v.duration - 0.12) {
      v.currentTime = 0;
      if (isVisibleRef.current) {
        v.play().catch(() => {});
      }
    }
  }, []);

  const handleHtml5Ended = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }, []);

  // 8. Unique action interactive : Bascule Muet / Son (sans jamais mettre en pause)
  const handleToggleMute = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const nextMuted = !isMutedRef.current;
      setIsMuted(nextMuted);

      if (!nextMuted) {
        // Couper le son de toutes les autres vidéos de la section
        window.dispatchEvent(new CustomEvent(UNMUTE_SYNC_EVENT, { detail: { id: video.id } }));
      }

      if (isTikTok) {
        postTikTokCommand(nextMuted ? 'mute' : 'unMute');
        postTikTokCommand('play');
      } else if (videoRef.current) {
        videoRef.current.muted = nextMuted;
        videoRef.current.defaultMuted = nextMuted;
        if (videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
        }
      }
    },
    [isTikTok, postTikTokCommand, video.id]
  );

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsLoaded(false);
    setIsMuted(true);
    if (isTikTok) {
      setReloadNonce((n) => n + 1);
    } else if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  // =========================================================================
  // 1. RENDU VIDÉO TIKTOK EN MODE ÉPURÉ (SANS LIKES, COMMENTAIRES, PARTAGE)
  // =========================================================================
  if (isTikTok) {
    return (
      <div
        ref={containerRef}
        onClick={handleToggleMute}
        className="relative w-full aspect-[9/16] rounded-2xl sm:rounded-[28px] overflow-hidden bg-[#090d16] shadow-md sm:shadow-lg border border-slate-200/60 dark:border-slate-800/80 cursor-pointer select-none transition-transform duration-300 md:hover:scale-[1.015]"
      >
        {/* Squelette Shimmer fluide avant le démarrage de la lecture */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 shimmer-surface z-10 pointer-events-none" />
        )}

        {hasError || !tikTokId ? (
          <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-slate-900 text-white space-y-2.5">
            <p className="text-xs text-slate-300">Vidéo momentanément indisponible.</p>
            {tikTokId && (
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Réessayer</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {isNearView && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <iframe
                  ref={iframeRef}
                  key={`tiktok-clean-${tikTokId}-${reloadNonce}`}
                  src={buildChromelessTikTokUrl(tikTokId)}
                  title={video.title || `Présentation produit OUMAR IPHONE ${index + 1}`}
                  className={`w-full h-full border-0 outline-none block scale-[1.04] transition-opacity duration-400 ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  loading="eager"
                  onLoad={() => {
                    // Forcer la lecture muette automatique dès le chargement du lecteur
                    window.setTimeout(() => {
                      postTikTokCommand('mute');
                      postTikTokCommand('play');
                      setIsLoaded(true);
                    }, 180);
                    window.setTimeout(() => {
                      if (isVisibleRef.current) {
                        postTikTokCommand('play');
                      }
                    }, 750);
                  }}
                  onError={() => {
                    setHasError(true);
                  }}
                />
              </div>
            )}

            {/* Voile transparent anti-survol : empêche l'apparition des boutons TikTok au survol ou au clic */}
            <div className="absolute inset-0 z-20" aria-hidden="true" />

            {/* UNIQUE BOUTON : Couper / Activer le son (44×44 px) */}
            <button
              type="button"
              onClick={handleToggleMute}
              className="absolute bottom-3 right-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/55 hover:bg-black/80 text-white backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-lg border border-white/15 z-30"
              title={isMuted ? 'Activer le son' : 'Couper le son'}
              aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
              aria-pressed={!isMuted}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white/90" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          </>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. RENDU VIDÉO DIRECTE HTML5 (MP4 / WebM) — AUTOPLAY BOUCLE + BOUTON SON UNIQUE
  // =========================================================================
  const preloadMode = perf.isSlowConnection || perf.tier === 'low' ? 'metadata' : 'auto';

  return (
    <div
      ref={containerRef}
      onClick={handleToggleMute}
      className="relative w-full aspect-[9/16] rounded-2xl sm:rounded-[28px] overflow-hidden bg-[#090d16] shadow-md sm:shadow-lg border border-slate-200/60 dark:border-slate-800/80 cursor-pointer select-none transition-transform duration-300 md:hover:scale-[1.015]"
    >
      {/* Squelette Shimmer fluide avant la première image vidéo */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 shimmer-surface z-10 pointer-events-none transition-opacity duration-300" />
      )}

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
          autoPlay
          muted={isMuted}
          loop
          playsInline
          webkit-playsinline="true"
          preload={isNearView ? preloadMode : 'none'}
          disablePictureInPicture
          onLoadedData={() => setIsLoaded(true)}
          onCanPlay={() => {
            setIsLoaded(true);
            if (isVisibleRef.current && videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
          }}
          onPlaying={() => setIsLoaded(true)}
          onTimeUpdate={handleHtml5TimeUpdate}
          onEnded={handleHtml5Ended}
          onError={() => setHasError(true)}
          onVolumeChange={() => {
            if (videoRef.current) setIsMuted(videoRef.current.muted);
          }}
          className={`w-full h-full object-cover rounded-2xl sm:rounded-[28px] block border-0 outline-none transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* UNIQUE BOUTON : Couper / Activer le son (44×44 px) */}
      {!hasError && (
        <button
          type="button"
          onClick={handleToggleMute}
          className="absolute bottom-3 right-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/55 hover:bg-black/80 text-white backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-lg border border-white/15 z-30"
          title={isMuted ? 'Activer le son' : 'Couper le son'}
          aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
          aria-pressed={!isMuted}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-white/90" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
        </button>
      )}
    </div>
  );
};

/**
 * Mur de vidéos immersif 100 % épuré : lecture automatique, boucle continue, seul bouton Muet / Son.
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
        {/* En-tête éditorial sobre et natif boutique (sans mention TikTok) */}
        <div className="mb-6 sm:mb-9">
          <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-slate-500 dark:text-slate-400 mb-1.5">
            EN DIRECT DE LA BOUTIQUE · ABIDJAN
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white font-['Outfit']">
            Nos Vidéos & Déballages
          </h2>
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
