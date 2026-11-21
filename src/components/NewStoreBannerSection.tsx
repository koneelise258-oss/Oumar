import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Building2, HardHat, Volume2, VolumeX, ArrowUpRight, Video } from 'lucide-react';
import { WHATSAPP_URL } from '../data/products';
import { WhatsAppLogo } from './BrandIcons';
import { useStorePromotion } from '../hooks/useStorePromotion';
import { useMediaStyle } from '../hooks/useMediaStyle';
import { extractSafeTikTokId, isSafeMediaUrl, isSafeTikTokUrl } from '../utils/security';

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
    closed_caption: '0',
  });
  return `https://www.tiktok.com/player/v1/${tikTokId}?${params.toString()}`;
};

export const NewStoreBannerSection: React.FC = () => {
  const { newStoreTeaser } = useStorePromotion();
  const mediaStyle = useMediaStyle();

  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const rawUrl = newStoreTeaser.videoUrl?.trim() || '';
  const isTikTok = Boolean(rawUrl && (newStoreTeaser.videoType === 'tiktok' || isSafeTikTokUrl(rawUrl)));
  const tikTokId = isTikTok ? extractSafeTikTokId(rawUrl) : null;
  const safeDirectVideoUrl = !isTikTok && rawUrl && isSafeMediaUrl(rawUrl) ? rawUrl : '';
  const hasPlayableVideo = Boolean((isTikTok && tikTokId) || safeDirectVideoUrl);

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
      // Ignore cross-origin errors while iframe initializes
    }
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !hasPlayableVideo) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasPlayableVideo]);

  useEffect(() => {
    if (!hasPlayableVideo || isTikTok || !videoRef.current) return;
    const v = videoRef.current;
    if (isVisible) {
      v.defaultMuted = true;
      v.muted = isMutedRef.current;
      v.play().catch(() => {
        v.muted = true;
        setIsMuted(true);
        v.play().catch(() => {});
      });
    } else {
      if (!isMutedRef.current) {
        v.muted = true;
        setIsMuted(true);
      }
      if (!v.paused) v.pause();
    }
  }, [isVisible, hasPlayableVideo, isTikTok]);

  useEffect(() => {
    if (!hasPlayableVideo || !isTikTok) return;
    if (isVisible) {
      if (isMutedRef.current) postTikTokCommand('mute');
      postTikTokCommand('play');
    } else if (!isMutedRef.current) {
      setIsMuted(true);
      postTikTokCommand('mute');
    }
  }, [isVisible, hasPlayableVideo, isTikTok, postTikTokCommand]);

  useEffect(() => {
    if (!hasPlayableVideo || !isTikTok) return;
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://www.tiktok.com' && e.origin !== 'https://tiktok.com') return;
      if (iframeRef.current?.contentWindow && e.source !== iframeRef.current.contentWindow) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.['x-tiktok-player'] === true) {
          if (data.type === 'onPlayerReady') {
            postTikTokCommand('mute');
            setIsMuted(true);
            postTikTokCommand('play');
          } else if (data.type === 'onStateChange' && data.value === 0) {
            postTikTokCommand('seekTo', 0);
            postTikTokCommand('play');
          }
        }
      } catch {
        // Ignore malformed message
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [hasPlayableVideo, isTikTok, postTikTokCommand]);

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (isTikTok) {
      postTikTokCommand(nextMuted ? 'mute' : 'unMute');
      if (!nextMuted) postTikTokCommand('play');
    } else if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      videoRef.current.defaultMuted = nextMuted;
      if (!nextMuted) {
        videoRef.current.volume = 1;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  if (!newStoreTeaser.enabled) return null;

  const frameRadius = Math.max(12, Math.min(36, mediaStyle.videoRadius));

  return (
    <section
      ref={sectionRef}
      id="nouveau-magasin"
      className="perf-section py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-[#fafbfc] dark:bg-[#0b0f17] transition-colors"
    >
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#090e1a] via-[#0f172a] to-[#111827] text-white border border-slate-200/80 dark:border-slate-800 shadow-xl">
          {/* Grille architecturale ultra-discrète en arrière-plan */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Reflet architectural animé (motion design léger GPU) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-40 bg-gradient-to-r from-transparent via-amber-300/15 to-transparent omr-beam-sweep"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center p-5 sm:p-8 lg:p-10">
            {/* Colonne Gauche : Contenu éditorial épuré */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-bold tracking-[0.14em] uppercase">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span>{newStoreTeaser.badgeLabel}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] tracking-tight text-white leading-tight">
                {newStoreTeaser.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                {newStoreTeaser.subtitle}
              </p>

              {/* Barre d'avancement architecturale */}
              <div className="max-w-md pt-1 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="inline-flex items-center gap-1.5 text-slate-300">
                    <HardHat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Avancement des travaux</span>
                  </span>
                  <span className="font-mono font-bold text-amber-300 tabular-nums">
                    {newStoreTeaser.progressPercent}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 transition-all duration-700"
                    style={{ width: `${newStoreTeaser.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Action discrète */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href={WHATSAPP_URL(
                    'Bonjour Oumar iPhone, je souhaite être informé(e) de l’ouverture de votre nouveau magasin à Abidjan.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-bold transition-all active:scale-[0.98] whitespace-nowrap"
                >
                  <WhatsAppLogo className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Être averti à l’ouverture</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </a>
              </div>
            </div>

            {/* Colonne Droite : Encadré Vidéo compact du nouveau magasin */}
            <div className="lg:col-span-5">
              <div
                className="relative w-full aspect-video bg-black/70 border border-white/15 overflow-hidden shadow-2xl"
                style={{ borderRadius: `${frameRadius}px` }}
              >
                {hasPlayableVideo ? (
                  <>
                    {isTikTok && tikTokId ? (
                      <iframe
                        ref={iframeRef}
                        src={buildChromelessTikTokUrl(tikTokId)}
                        title={newStoreTeaser.title}
                        className="w-full h-full border-0"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        src={safeDirectVideoUrl}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Bouton unique discret Son / Muet (44x44px) */}
                    <button
                      type="button"
                      onClick={handleToggleSound}
                      aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                      className="absolute bottom-3 right-3 z-20 w-11 h-11 rounded-full bg-black/65 hover:bg-black/85 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer active:scale-95"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center bg-gradient-to-br from-slate-900/90 to-slate-950/95">
                    <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-300 mb-3">
                      <Video className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-white font-['Outfit'] tracking-wide">
                      Showroom OUMAR IPHONE
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[230px]">
                      Aperçu vidéo du chantier bientôt publié depuis l’espace administration.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
