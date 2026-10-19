import { VideoItem } from '../types';

export const STORAGE_KEY_VIDEOS = 'oumar_videos_data';

// Real functional initial showcase videos (can be deleted, replaced or reordered by admin)
export const INITIAL_VIDEOS: VideoItem[] = [
  {
    id: 'vid-1',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    type: 'html5',
    title: 'iPhone 15 Pro Titane — Présentation Officielle',
    published: true,
    order: 1,
    createdAt: Date.now() - 3600000 * 24 * 3,
  },
  {
    id: 'vid-2',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    type: 'html5',
    title: 'iPhone 15 Pro Max — Déballage & Inspection 35 Points',
    published: true,
    order: 2,
    createdAt: Date.now() - 3600000 * 24 * 2,
  },
  {
    id: 'vid-3',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    type: 'html5',
    title: 'Boutique Abidjan — Arrivage Stocks Neufs Scellés',
    published: true,
    order: 3,
    createdAt: Date.now() - 3600000 * 24 * 1,
  },
  {
    id: 'vid-4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    type: 'html5',
    title: 'Test Audio & Écran Super Retina XDR — OUMAR IPHONE',
    published: true,
    order: 4,
    createdAt: Date.now() - 3600000 * 12,
  }
];

export function loadVideos(): VideoItem[] {
  if (typeof window === 'undefined') return INITIAL_VIDEOS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_VIDEOS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => a.order - b.order);
      }
    }
  } catch (err) {
    console.error('Error loading videos from localStorage', err);
  }
  return INITIAL_VIDEOS;
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
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_VIDEOS);
    window.dispatchEvent(new CustomEvent('oumar_videos_updated', { detail: INITIAL_VIDEOS }));
  }
  return INITIAL_VIDEOS;
}
