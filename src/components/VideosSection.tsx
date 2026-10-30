import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VideoItem } from '../types';
import { ExternalLink, Play, Pause, Volume2, VolumeX, RefreshCw, Loader2 } from 'lucide-react';

interface VideosSectionProps {
  id?: string;
  videos: VideoItem[];
  onOpenAdmin?: () => void;
}

/**
 * Extrait proprement l'identifiant numérique unique d'une vidéo TikTok depuis n'importe quel format d'URL,
 * en supprimant tous les paramètres de suivi (query strings) et les ancres hash.
 */
export const extractTikTokVideoId = (rawUrl: string): string | null => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const cleanUrl = rawUrl.trim().split('?')[0].split('#')[0];
  const match = cleanUrl.match(/(?:video|embed(?:\/v2)?|player\/v1)\/(\d+)/i);
  if (match && match[1]) {
    return match[1];
  }
  if (/^\d+$/.test(cleanUrl)) {
    return cleanUrl;
  }
  return null;
};

/**
 * Composant individuel pour l'affichage fluide, centré et hautement optimisé d'une vidéo de la grille.
 */
const VideoWallItem: React.FC<{ video: VideoItem }> = ({ video }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const isTikTok = video.type === 'tiktok' || video.url.includes('tiktok.com');
  const tikTokId = isTikTok ? extractTikTokVideoId(video.url) : null;

  // IntersectionObserver à chargement prédictif (rootMargin: 250px)
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (!isTikTok && videoRef.current) {
              // Tente un démarrage automatique muet
              videoRef.current
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
            }
          }
        });
      },
      {
        rootMargin: '250px 0px',
        threshold: 0.1
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isTikTok]);

  // Contrôles de lecture HTML5
  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current || isTikTok) return;

    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isTikTok]);

  // Contrôle du son HTML5 (Bascule muet/non muet SANS réinitialiser currentTime ni impacter les autres vidéos)
  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current || isTikTok) return;

    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  }, [isTikTok]);

  // Réessai manuel en cas d'erreur de chargement réseau
  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsBuffering(true);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  // 1. RENDU DES VIDÉOS TIKTOK (Lecteur officiel compatible player/v1)
  if (isTikTok) {
    const fallbackUrl = tikTokId
      ? `https://www.tiktok.com/@oumar_iphone.0/video/${tikTokId}`
      : `https://www.tiktok.com/@oumar_iphone.0`;

    return (
      <div
        ref={containerRef}
        className="relative w-full aspect-[9/16] rounded-2xl sm:rounded-[28px] overflow-hidden bg-[#0a0f1d] shadow-lg border-0 outline-none flex items-center justify-center transition-transform duration-300 hover:scale-[1.015] select-none"
      >
        {/* Squelette de chargement discret pendant l'initialisation */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center z-10 animate-pulse">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin opacity-80" />
          </div>
        )}

        {isInView && tikTokId && !hasError ? (
          <iframe
            src={`https://www.tiktok.com/player/v1/${tikTokId}?autoplay=1`}
            title={video.title || "Vidéo TikTok OUMAR IPHONE"}
            className="w-full h-full border-0 outline-none rounded-2xl sm:rounded-[28px] block relative z-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
        ) : (
          /* Carte d'attente / Repli élégant TikTok */
          <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white space-y-3">
            <div className="w-11 h-11 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shadow-md">
              <Play className="w-5 h-5 ml-0.5 fill-current" />
            </div>
            <div className="space-y-0.5 max-w-[85%]">
              <span className="text-xs font-bold font-['Outfit'] block text-white truncate">
                {video.title || "Vidéo TikTok OUMAR"}
              </span>
              <span className="text-[11px] text-slate-400 block">
                @oumar_iphone.0
              </span>
            </div>
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Voir sur TikTok</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    );
  }

  // 2. RENDU DES VIDÉOS DIRECTES (HTML5 MP4 / WebM)
  return (
    <div
      ref={containerRef}
      onClick={togglePlay}
      className="relative w-full aspect-[9/16] rounded-2xl sm:rounded-[28px] overflow-hidden bg-[#090d16] shadow-lg border-0 outline-none cursor-pointer select-none transition-transform duration-300 hover:scale-[1.015] group"
    >
      {/* Squelette de chargement en arrière-plan */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10 backdrop-blur-[2px] transition-opacity">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin opacity-90" />
        </div>
      )}

      {/* Message d'erreur de lecture sécurisé avec bouton de réessai */}
      {hasError ? (
        <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-slate-900 text-white space-y-2">
          <p className="text-xs text-slate-300">Vidéo momentanément indisponible.</p>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={isInView ? (video.url || undefined) : undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => {
            setIsLoaded(true);
            setIsBuffering(false);
          }}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsBuffering(false);
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onError={() => {
            setHasError(true);
            setIsBuffering(false);
          }}
          onVolumeChange={() => {
            if (videoRef.current) setIsMuted(videoRef.current.muted);
          }}
          className="w-full h-full object-cover rounded-2xl sm:rounded-[28px] block border-0 outline-none"
        />
      )}

      {/* Overlay indicateur pause quand la vidéo est suspendue */}
      {!isPlaying && !hasError && !isBuffering && (
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center transition-opacity z-20">
          <div className="w-12 h-12 rounded-full bg-white/90 text-slate-950 flex items-center justify-center shadow-xl">
            <Play className="w-6 h-6 ml-1 fill-current" />
          </div>
        </div>
      )}

      {/* Bouton de contrôle du Son (Active/Désactive le son SANS réinitialiser le temps) */}
      {!hasError && (
        <button
          type="button"
          onClick={toggleMute}
          className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-md border border-white/10 z-30"
          title={isMuted ? "Activer le son" : "Couper le son"}
          aria-label={isMuted ? "Activer le son" : "Couper le son"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
          )}
        </button>
      )}

      {/* Bouton discret de contrôle Play/Pause en bas à gauche */}
      {!hasError && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute bottom-3 left-3 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition-all active:scale-90 cursor-pointer opacity-80 group-hover:opacity-100 shadow-md border border-white/10 z-30"
          title={isPlaying ? "Mettre en pause" : "Lire"}
          aria-label={isPlaying ? "Mettre en pause" : "Lire"}
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
 * Mur de vidéos immersif parfaitement centré, sans texte, sans bordure et à chargement ultrarapide.
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
      className="w-full py-8 sm:py-16 px-4 sm:px-6 lg:px-8 scroll-mt-20 relative z-10 overflow-hidden flex flex-col items-center justify-center"
    >
      {/* Conteneur de centrage parfait équilibré à gauche et à droite */}
      <div className="w-full max-w-7xl mx-auto flex justify-center items-center">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-7 w-full justify-center justify-items-center">
          {publishedVideos.map((video) => (
            <VideoWallItem key={video.id} video={video} />
          ))}
        </div>
      </div>
    </section>
  );
};
