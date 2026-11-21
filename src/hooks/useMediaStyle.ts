import { useState, useEffect } from 'react';
import {
  MediaStyleSettings,
  getMediaStyleSettings,
  clampMediaStyle
} from '../data/storeSettings';

/**
 * Hook réactif synchronisé en temps réel avec les réglages d'arrondi des médias
 * (modifiables depuis l'espace administrateur -> Médiathèque & Recadrage).
 */
export function useMediaStyle(): MediaStyleSettings {
  const [mediaStyle, setMediaStyle] = useState<MediaStyleSettings>(() => getMediaStyleSettings());

  useEffect(() => {
    const handleMediaStyleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail === 'object') {
        setMediaStyle(clampMediaStyle(detail));
      } else {
        setMediaStyle(getMediaStyleSettings());
      }
    };

    const handleSettingsUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.heroSettings?.mediaStyle) {
        setMediaStyle(clampMediaStyle(detail.heroSettings.mediaStyle));
      } else if (detail?.mediaStyle) {
        setMediaStyle(clampMediaStyle(detail.mediaStyle));
      } else {
        setMediaStyle(getMediaStyleSettings());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'oumar_store_settings') {
        setMediaStyle(getMediaStyleSettings());
      }
    };

    window.addEventListener('oumar_media_style_updated', handleMediaStyleUpdate);
    window.addEventListener('oumar_hero_settings_updated', handleSettingsUpdate);
    window.addEventListener('oumar_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('oumar_media_style_updated', handleMediaStyleUpdate);
      window.removeEventListener('oumar_hero_settings_updated', handleSettingsUpdate);
      window.removeEventListener('oumar_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return mediaStyle;
}
