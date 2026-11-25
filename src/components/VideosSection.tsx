import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { VideoItem } from '../types';
import { Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { extractSafeTikTokId, isSafeMediaUrl, isSafeTikTokUrl } from '../utils/security';
import { useDevicePerformance } from '../utils/devicePerformance';
import { useMediaStyle } from '../hooks/useMediaStyle';

interface VideosSectionProps {
  id?: string;
  videos: VideoItem[];
}

const UNMUTE_SYNC_EVENT = 'omr_video_unmute_sync';

interface VisibilityEntry {
  visible: boolean;
  ratio: number;
  order: number;
  unmuted: boolean;
}

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

interface VideoWallItemProps {
  video: VideoItem;
  index: number;
  shouldPlay: boolean;
  onVisibilityReport: (id: string, entry: VisibilityEntry) => void;
}

/**
 * Carte vidéo épurée (HTML5 & TikTok sans habillage) :
 * - Lecture automatique coordonnée (évite la saturation réseau/décodeur et supprime les saccades)
 * - Boucle matérielle native sans `timeupdate` seek ni coupure
 * - Préchargement progressif (`metadata` par défaut, `auto` uniquement pour les lecteurs actifs)
 * - Un seul bouton discret : Couper / Activer le son (44×44 px)
 */
const VideoWallItem: React.FC<VideoWallItemProps> = React.memo(({
  video,
  index,
  shouldPlay,
  onVisibilityReport
}) => {
  const perf = useDevicePerformance();
  const mediaStyle = useMediaStyle();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isNearView, setIsNearView] = useState(false);
  const [srcReady, setSrcReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [reloadNonce, setReloadNonce] = useState(0);

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const shouldPlayRef = useRef(shouldPlay);
  shouldPlayRef.current = shouldPlay;

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

  // 1a. Chargement prédictif doux à l'approche du viewport (sans bloquer Hero/catalogue)
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
        rootMargin: perf.isMobile ? '180px 0px' : '280px 0px',
        threshold: 0.01
      }
    );

    preloadObserver.observe(el);
    return () => preloadObserver.disconnect();
  }, [perf.isMobile]);

  // Décalage progressif (stagger) des requêtes réseau pour ne pas saturer le navigateur d'un coup
  useEffect(() => {
    if (!isNearView) return;
    if (isVisible || index < 2) {
      setSrcReady(true);
      return;
    }
    const delayMs = Math.min(index, 6) * 85;
    const timer = window.setTimeout(() => setSrcReady(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [isNearView, isVisible, index]);

  // 1b. Suivi visibilité réelle & ratio d'apparition pour l'ordonnanceur de lecture
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const visibleNow = entry.isIntersecting && entry.intersectionRatio >= 0.18;
        setIsVisible(visibleNow);
        onVisibilityReport(video.id, {
          visible: visibleNow,
          ratio: Math.round(entry.intersectionRatio * 10) / 10,
          order: index,
          unmuted: !isMutedRef.current
        });
      },
      { threshold: [0, 0.18, 0.45, 0.75] }
    );

    visibilityObserver.observe(el);
    return () => {
      visibilityObserver.disconnect();
      onVisibilityReport(video.id, {
        visible: false,
        ratio: 0,
        order: index,
        unmuted: false
      });
    };
  }, [video.id, index, onVisibilityReport]);

  // Signaler le changement d'état sonore à l'ordonnanceur
  useEffect(() => {
    onVisibilityReport(video.id, {
      visible: isVisibleRef.current,
      ratio: isVisibleRef.current ? 0.8 : 0,
      order: index,
      unmuted: !isMuted
    });
  }, [isMuted, video.id, index, onVisibilityReport]);

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

  // Réinitialiser proprement l'état lors du remplacement de la source vidéo
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [safeDirectVideoUrl, tikTokId]);

  // Vérifier si la première image vidéo est déjà prête en cache
  useEffect(() => {
    if (!isTikTok && videoRef.current && videoRef.current.readyState >= 2) {
      setIsLoaded(true);
    }
  }, [srcReady, isTikTok, safeDirectVideoUrl]);

  // 3. Pilotage automatique HTML5 coordonné (uniquement les lecteurs actifs jouent)
  useEffect(() => {
    if (isTikTok || !videoRef.current || !srcReady) return;
    const v = videoRef.current;

    if (shouldPlay && isVisible) {
      v.defaultMuted = true;
      v.muted = isMutedRef.current;
      if (v.paused) {
        const playPromise = v.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            v.muted = true;
            v.defaultMuted = true;
            setIsMuted(true);
            v.play().catch(() => {});
          });
        }
      }
    } else {
      if (!isVisible && !isMutedRef.current) {
        v.muted = true;
        v.defaultMuted = true;
        setIsMuted(true);
      }
      if (!v.paused) {
        v.pause();
      }
    }
  }, [shouldPlay, isVisible, srcReady, isTikTok]);

  // 4. Pilotage automatique TikTok coordonné selon visibilité & budget actif
  useEffect(() => {
    if (!isTikTok || !srcReady) return;

    if (shouldPlay && isVisible) {
      if (isMutedRef.current) {
        postTikTokCommand('mute');
      }
      postTikTokCommand('play');
    } else {
      if (!isVisible && !isMutedRef.current) {
        setIsMuted(true);
      }
      postTikTokCommand('mute');
      postTikTokCommand('pause');
    }
  }, [shouldPlay, isVisible, srcReady, isTikTok, postTikTokCommand]);

  // 5. Reprise automatique propre lors du retour sur l'onglet
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isTikTok) {
          postTikTokCommand('mute');
          postTikTokCommand('pause');
        } else if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
        return;
      }

      if (!isVisibleRef.current || !shouldPlayRef.current) return;

      if (isTikTok) {
        if (isMutedRef.current) postTikTokCommand('mute');
        postTikTokCommand('play');
      } else if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTikTok, postTikTokCommand]);

  // 6. Écoute sécurisée et ciblée des événements TikTok Player v1
  useEffect(() => {
    if (!isTikTok || !srcReady) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://www.tiktok.com' && e.origin !== 'https://tiktok.com') return;
      if (iframeRef.current?.contentWindow && e.source !== iframeRef.current.contentWindow) {
        return;
      }

      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!data || typeof data !== 'object') return;

        if (data['x-tiktok-player'] === true) {
          const { type, value } = data;

          if (type === 'onPlayerReady') {
            setIsLoaded(true);
            postTikTokCommand('mute');
            setIsMuted(true);
            if (shouldPlayRef.current && isVisibleRef.current) {
              postTikTokCommand('play');
            } else {
              postTikTokCommand('pause');
            }
          } else if (type === 'onStateChange') {
            if (value === 1) {
              setIsLoaded(true);
            } else if (value === 0) {
              if (shouldPlayRef.current && isVisibleRef.current) {
                postTikTokCommand('seekTo', 0);
                postTikTokCommand('play');
              }
            } else if (value === 2 && shouldPlayRef.current && isVisibleRef.current) {
              postTikTokCommand('play');
            }
          } else if (type === 'onCurrentTime' && value && typeof value === 'object') {
            const currentTime = Number(value.currentTime || 0);
            const duration = Number(value.duration || 0);
            if (duration > 0.5 && currentTime >= duration - 0.18 && shouldPlayRef.current) {
              postTikTokCommand('seekTo', 0);
              postTikTokCommand('play');
            }
          } else if (type === 'onMuteChange' && typeof value === 'boolean') {
            setIsMuted(value);
          }
          return;
        }

        if (
          data.type === 'ended' ||
          (data.event === 'onPlayerStateChange' && data.info === 0) ||
          data.status === 'ended' ||
          data.eventName === 'video_ended'
        ) {
          if (shouldPlayRef.current) {
            postTikTokCommand('seekTo', 0);
            postTikTokCommand('play');
          }
        }
      } catch {
        // Ignorer silencieusement les messages non JSON
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isTikTok, srcReady, postTikTokCommand]);

  // 7. Secours uniquement si un navigateur ne boucle pas l'attribut natif `loop`
  const handleHtml5Ended = useCallback(() => {
    const v = videoRef.current;
    if (!v || v.loop) return;
    v.currentTime = 0;
    if (shouldPlayRef.current && isVisibleRef.current) {
      v.play().catch(() => {});
    }
  }, []);

  // 8. Unique action interactive : Bascule Muet / Son
  const handleToggleMute = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const nextMuted = !isMutedRef.current;
      setIsMuted(nextMuted);

      if (!nextMuted) {
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
  // 1. RENDU VIDÉO TIKTOK EN MODE ÉPURÉ
  // =========================================================================
  if (isTikTok) {
    return (
      <div
        ref={containerRef}
        onClick={handleToggleMute}
        className="relative w-full aspect-[9/16] overflow-hidden bg-[#090d16] shadow-md sm:shadow-lg border border-slate-200/60 dark:border-slate-800/80 cursor-pointer select-none transition-shadow duration-300"
        style={{ borderRadius: `${mediaStyle.videoRadius}px` }}
      >
        {!isLoaded && !hasError && srcReady && (
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
            {srcReady && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <iframe
                  ref={iframeRef}
                  key={`tiktok-clean-${tikTokId}-${reloadNonce}`}
                  src={buildChromelessTikTokUrl(tikTokId)}
                  title={video.title || `Présentation produit OUMAR IPHONE ${index + 1}`}
                  className={`w-full h-full border-0 outline-none block scale-[1.04] transition-opacity duration-300 ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  loading="lazy"
                  onLoad={() => {
                    window.setTimeout(() => {
                      postTikTokCommand('mute');
                      if (shouldPlayRef.current && isVisibleRef.current) {
                        postTikTokCommand('play');
                      } else {
                        postTikTokCommand('pause');
                      }
                      setIsLoaded(true);
                    }, 180);
                  }}
                  onError={() => {
                    setHasError(true);
                  }}
                />
              </div>
            )}

            <div className="absolute inset-0 z-20" aria-hidden="true" />

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
  // 2. RENDU VIDÉO DIRECTE HTML5 (MP4 / MOV / WebM)
  // - `preload="auto"` uniquement quand la carte est active/visible ; `metadata` sinon
  // - Aucune boucle JS artificielle sur `timeupdate` (boucle matérielle native `loop`)
  // =========================================================================
  const preloadMode: 'none' | 'metadata' | 'auto' = !srcReady
    ? 'none'
    : shouldPlay && !perf.isSlowConnection && perf.tier !== 'low'
    ? 'auto'
    : 'metadata';

  return (
    <div
      ref={containerRef}
      onClick={handleToggleMute}
      className="relative w-full aspect-[9/16] overflow-hidden bg-[#090d16] shadow-md sm:shadow-lg border border-slate-200/60 dark:border-slate-800/80 cursor-pointer select-none transition-shadow duration-300"
      style={{ borderRadius: `${mediaStyle.videoRadius}px` }}
    >
      {!isLoaded && !hasError && srcReady && (
        <div className="absolute inset-0 shimmer-surface z-10 pointer-events-none" />
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
          src={srcReady ? safeDirectVideoUrl : undefined}
          autoPlay={shouldPlay}
          muted={isMuted}
          loop
          playsInline
          preload={preloadMode}
          disablePictureInPicture
          disableRemotePlayback
          onLoadedData={() => setIsLoaded(true)}
          onCanPlay={() => {
            setIsLoaded(true);
            if (shouldPlayRef.current && isVisibleRef.current && videoRef.current?.paused) {
              videoRef.current.play().catch(() => {});
            }
          }}
          onPlaying={() => setIsLoaded(true)}
          onEnded={handleHtml5Ended}
          onError={() => setHasError(true)}
          onVolumeChange={() => {
            if (videoRef.current) setIsMuted(videoRef.current.muted);
          }}
          className={`w-full h-full object-cover block border-0 outline-none transform-gpu transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ borderRadius: `${mediaStyle.videoRadius}px` }}
        />
      )}

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
});

VideoWallItem.displayName = 'VideoWallItem';

/**
 * Mur de vidéos immersif 100 % épuré :
 * - Ordonnanceur intelligent limitant la lecture/buffering simultanés aux cartes réellement à l'écran
 * - Fluidité optimale sur iPhone, Android et Desktop sans ralentir le reste du site
 */
export const VideosSection: React.FC<VideosSectionProps> = ({
  id = 'videos',
  videos
}) => {
  const perf = useDevicePerformance();
  const publishedVideos = useMemo(
    () => videos.filter((v) => v.published !== false),
    [videos]
  );

  const [visibilityMap, setVisibilityMap] = useState<Record<string, VisibilityEntry>>({});

  const handleVisibilityReport = useCallback((vidId: string, entry: VisibilityEntry) => {
    setVisibilityMap((prev) => {
      const existing = prev[vidId];
      if (
        existing &&
        existing.visible === entry.visible &&
        existing.ratio === entry.ratio &&
        existing.order === entry.order &&
        existing.unmuted === entry.unmuted
      ) {
        return prev;
      }
      return { ...prev, [vidId]: entry };
    });
  }, []);

  // Budget matériel sûr : évite de décoder et télécharger 8 vidéos en parallèle
  const maxConcurrentPlayers = useMemo(() => {
    if (perf.isSlowConnection || perf.tier === 'low') return 1;
    if (perf.isMobile) return 2;
    return perf.tier === 'medium' ? 3 : 4;
  }, [perf.isSlowConnection, perf.tier, perf.isMobile]);

  const activePlayIds = useMemo(() => {
    const candidates = publishedVideos
      .map((v, idx) => {
        const meta = visibilityMap[v.id];
        return meta?.visible ? { id: v.id, ...meta, fallbackOrder: idx } : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        if (a.unmuted !== b.unmuted) return a.unmuted ? -1 : 1;
        if (b.ratio !== a.ratio) return b.ratio - a.ratio;
        return a.order - b.order;
      });

    return new Set(candidates.slice(0, maxConcurrentPlayers).map((c) => c.id));
  }, [publishedVideos, visibilityMap, maxConcurrentPlayers]);

  if (publishedVideos.length === 0) return null;

  return (
    <section
      id={id}
      className="perf-section w-full py-10 sm:py-16 px-4 sm:px-6 lg:px-8 scroll-mt-20 relative z-10 overflow-hidden"
    >
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-9">
          <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-slate-500 dark:text-slate-400 mb-1.5">
            EN DIRECT DE LA BOUTIQUE · ABIDJAN
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white font-['Outfit']">
            Nos Vidéos & Déballages
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 w-full justify-items-center">
          {publishedVideos.map((video, idx) => (
            <VideoWallItem
              key={video.id}
              video={video}
              index={idx}
              shouldPlay={activePlayIds.has(video.id)}
              onVisibilityReport={handleVisibilityReport}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
