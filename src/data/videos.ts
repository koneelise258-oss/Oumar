import { VideoItem } from '../types';

export const STORAGE_KEY_VIDEOS = 'oumar_videos_data';

// Real functional initial showcase videos (can be deleted, replaced or reordered by admin)
// No demo videos are shown as if they were official OUMAR IPHONE content.
export const INITIAL_VIDEOS: VideoItem[] = [];

const isSampleVideo = (video: VideoItem): boolean =>
  video.url.includes('commondatastorage.googleapis.com/gtv-videos-bucket/sample/');

export function loadVideos(): VideoItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_VIDEOS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((video) => !isSampleVideo(video)).sort((a, b) => a.order - b.order);
      }
    }
  } catch (err) {
    console.error('Error loading videos from localStorage', err);
  }
  // An absent or invalid cache must not silently restore sample videos.
  return [];
}

export interface SaveVideosOptions {
  allowStripLargeDataUrls?: boolean;
}

export function saveVideos(videos: VideoItem[], options: SaveVideosOptions = {}): boolean {
  if (typeof window === 'undefined') return true;
  const allowStripLargeDataUrls = options.allowStripLargeDataUrls !== false;
  const sorted = [...videos].sort((a, b) => a.order - b.order);

  // Toujours notifier l'application en mémoire même si le cache localStorage est saturé
  window.dispatchEvent(new CustomEvent('oumar_videos_updated', { detail: sorted }));

  try {
    localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(sorted));
    return true;
  } catch (err: any) {
    const isQuotaError =
      err?.name === 'QuotaExceededError' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      String(err?.message || '').toLowerCase().includes('quota');

    if (isQuotaError && allowStripLargeDataUrls) {
      // Conserver uniquement les vidéos légères (URLs HTTPS, TikTok ou petits blobs) dans le cache local
      try {
        const lightweight = sorted.filter(
          (v) => !v.url.startsWith('data:') || v.url.length <= 150_000
        );
        localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(lightweight));
        return true;
      } catch {
        try {
          localStorage.removeItem(STORAGE_KEY_VIDEOS);
        } catch {
          // Ignore storage cleanup error
        }
        return false;
      }
    }

    if (!isQuotaError) {
      console.warn('Unable to cache videos in localStorage:', err);
    }
    return false;
  }
}

export function resetVideos(): VideoItem[] {
  saveVideos([]);
  return [];
}
