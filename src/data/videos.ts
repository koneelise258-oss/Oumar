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

export function saveVideos(videos: VideoItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const sorted = [...videos].sort((a, b) => a.order - b.order);
    localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(sorted));
    window.dispatchEvent(new CustomEvent('oumar_videos_updated', { detail: sorted }));
  } catch (err) {
    console.error('Error saving videos to localStorage', err);
  }
}

export function resetVideos(): VideoItem[] {
  saveVideos([]);
  return [];
}
