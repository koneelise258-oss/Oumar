import React, { useRef, useEffect, useState } from 'react';
import { VideoItem } from '../types';
import { ExternalLink, Play, Pause, Volume2, VolumeX } from 'lucide-react';

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

const VideoWallItem: React.FC<{ video: VideoItem }> = ({ video }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const isTikTok = video.type === 'tiktok' || video.url.includes('tiktok.com');
  const tikTokId = isTikTok ? extractTikTokVideoId(video.url) : null;

  // IntersectionObserver pour déclencher la visibilité et l'autoplay muet HTML5
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (!isTikTok && videoRef.current) {
              // Tente un démarrage muet automatique
              videoRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isTikTok]);

  // Synchronisation des évènements vidéo HTML5 (sans réinitialiser le temps)
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current || isTikTok) return;

    if (videoRef.current.paused) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current || isTikTok) return;

    // Basculer le son SANS toucher à currentTime
    const newMuted = !videoRef.current.muted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  // 1. Rendu TikTok avec le lecteur officiel player/v1
  if (isTikTok) {
    const fallbackUrl = tikTokId
      ? `https://www.tiktok.com/@oumar_iphone.0/video/${tikTokId}`
      : `https://www.tiktok.com/@oumar_iphone.0`;

    return (
      <div
        ref={containerRef}
        className="relative w-full aspect-[9/16] rounded-2xl sm:rounded-[24px] overflow-hidden bg-slate-950 shadow-xs border-0 outline-none flex items-center justify-center transition-transform duration-300 hover:scale-[1.012]"
      >
        {isInView && tikTokId && !hasError ? (
          <iframe
            src={`https://www.tiktok.com/player/v1/${tikTokId}?autoplay=1`}
            title={video.title || "Vidéo TikTok OUMAR IPHONE"}
            className="w-full h-full border-0 outline-none rounded-2xl sm:rounded-[24px] block"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            onError={() => setHasError(true)}
          />
        ) : (
          /* Carte d'attente / Repli fluide redirigeant vers le compte officiel TikTok OUMAR IPHONE */
          <div className="w-full h-full p-3 sm:p-6 flex flex-col items-center justify-center text-center bg-gradient-to-b from-slate-900 to-black text-white space-y-2 sm:space-y-3">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Play className="w-4 h-4 sm:w-6 sm:h-6 ml-0.5 fill-current" />
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <span className="text-[11px] sm:text-xs font-bold font-['Outfit'] block text-white truncate max-w-full">
                Vidéo TikTok OUMAR
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 block">
                @oumar_iphone.0
              </span>
            </div>
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 sm:mt-2 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Voir sur TikTok</span>
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </a>
          </div>
        )}
      </div>
    );
  }

  // 2. Rendu Fichier Vidéo Direct (HTML5 MP4 / WebM)
  return (
    <div
      ref={containerRef}
      onClick={togglePlay}
      className="relative w-full aspect-[9/16] rounded-2xl sm:rounded-[24px] overflow-hidden bg-slate-900/5 dark:bg-slate-950/40 border-0 outline-none cursor-pointer select-none transition-transform duration-300 hover:scale-[1.012] group"
    >
      <video
        ref={videoRef}
        src={video.url || undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onVolumeChange={() => {
          if (videoRef.current) setIsMuted(videoRef.current.muted);
        }}
        className="w-full h-full object-cover rounded-2xl sm:rounded-[24px] block border-0 outline-none"
      />

      {/* Overlay indicateur pause quand la vidéo est suspendue */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 ml-1 fill-current" />
          </div>
        </div>
      )}

      {/* Bouton de contrôle du Son (Active/Désactive le son SANS réinitialiser le temps) */}
      <button
        type="button"
        onClick={toggleMute}
        className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-md border border-white/10"
        title={isMuted ? "Activer le son" : "Couper le son"}
        aria-label={isMuted ? "Activer le son" : "Couper le son"}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 text-rose-400" />
        ) : (
          <Volume2 className="w-4 h-4 text-emerald-400" />
        )}
      </button>

      {/* Bouton manuel Pause/Lecture au survol/au bas de la vidéo */}
      <button
        type="button"
        onClick={togglePlay}
        className="absolute bottom-2.5 left-2.5 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all active:scale-90 cursor-pointer opacity-80 group-hover:opacity-100 shadow-md border border-white/10"
        title={isPlaying ? "Mettre en pause" : "Lire"}
        aria-label={isPlaying ? "Mettre en pause" : "Lire"}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 text-white" />
        ) : (
          <Play className="w-4 h-4 text-white fill-current ml-0.5" />
        )}
      </button>
    </div>
  );
};

export const VideosSection: React.FC<VideosSectionProps> = ({
  id = 'videos',
  videos,
  onOpenAdmin,
}) => {
  const publishedVideos = videos.filter((v) => v.published !== false);

  return (
    <section 
      id={id} 
      className="w-full py-6 sm:py-14 px-3 sm:px-6 lg:px-8 scroll-mt-20 relative z-10"
    >
      <div className="max-w-7xl mx-auto">
        {publishedVideos.length > 0 ? (
          /* Mur de vidéos en 2 colonnes sur mobile */
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6 lg:gap-7">
            {publishedVideos.map((video) => (
              <VideoWallItem key={video.id} video={video} />
            ))}
          </div>
        ) : (
          /* État vide discret si aucune vidéo n'est publiée */
          <div className="w-full py-12 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
              Aucune vidéo de présentation pour le moment.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
