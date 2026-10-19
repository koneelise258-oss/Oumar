import React, { useRef, useEffect } from 'react';
import { VideoItem } from '../types';

interface VideosSectionProps {
  id?: string;
  videos: VideoItem[];
  onOpenAdmin?: () => void;
}

// Single Video Wall Item strictly adhering to:
// - No text, no captions, no overlaid badges/buttons
// - No borders, no outlines, no harsh shadows
// - Generously rounded corners (24px)
// - Autoplay muted in loop when in viewport
// - Single click: restart & unmute
// - Double click: toggle pause / resume
const VideoWallItem: React.FC<{ video: VideoItem }> = ({ video }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyPausedRef = useRef<boolean>(false);

  // TikTok helper
  const getTikTokVideoId = (url: string): string | null => {
    const match = url.match(/\/video\/(\d+)/);
    if (match) return match[1];
    const embedMatch = url.match(/\/embed\/(?:v2\/)?(\d+)/);
    if (embedMatch) return embedMatch[1];
    return null;
  };

  const isTikTok = video.type === 'tiktok' || video.url.includes('tiktok.com');
  const tikTokId = isTikTok ? getTikTokVideoId(video.url) : null;

  // IntersectionObserver for intelligent autoplay on scroll
  useEffect(() => {
    if (isTikTok || !videoRef.current) return;
    const el = videoRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isManuallyPausedRef.current) {
            el.play().catch(() => {});
          } else if (!entry.isIntersecting) {
            el.pause();
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isTikTok]);

  // Click handler differentiating single vs double click
  const handlePointerClick = () => {
    if (isTikTok) return;

    if (clickTimeoutRef.current) {
      // DOUBLE CLICK -> Pause or Resume
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;

      if (videoRef.current) {
        if (videoRef.current.paused) {
          isManuallyPausedRef.current = false;
          videoRef.current.play().catch(() => {});
        } else {
          isManuallyPausedRef.current = true;
          videoRef.current.pause();
        }
      }
    } else {
      // SINGLE CLICK -> Restart from 0 & Unmute without stopping other videos
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.muted = false;
          isManuallyPausedRef.current = false;
          videoRef.current.play().catch(() => {});
        }
      }, 250);
    }
  };

  if (isTikTok && tikTokId) {
    return (
      <div className="relative w-full aspect-[9/16] rounded-[24px] overflow-hidden bg-black/90 shadow-xs border-0 outline-none">
        <iframe
          src={`https://www.tiktok.com/embed/v2/${tikTokId}`}
          title="OUMAR IPHONE Video"
          className="w-full h-full border-0 outline-none rounded-[24px]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      onClick={handlePointerClick}
      className="relative w-full aspect-[9/16] rounded-[24px] overflow-hidden bg-slate-900/5 dark:bg-slate-950/40 border-0 outline-none cursor-pointer select-none transition-transform duration-300 hover:scale-[1.012] active:scale-[0.99]"
    >
      <video
        ref={videoRef}
        src={video.url}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover rounded-[24px] pointer-events-none block border-0 outline-none"
      />
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
      className="w-full py-8 sm:py-14 px-4 sm:px-6 lg:px-8 scroll-mt-20 relative z-10"
    >
      <div className="max-w-7xl mx-auto">
        {publishedVideos.length > 0 ? (
          /* Pure Video Wall: No titles, no descriptions, no captions, no overlaid buttons, no decorative borders */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
            {publishedVideos.map((video) => (
              <VideoWallItem key={video.id} video={video} />
            ))}
          </div>
        ) : (
          /* Subtle empty state only when zero videos are published */
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
