import { useState, useEffect } from 'react';
import {
  StorePromotionSettings,
  NewStoreTeaserSettings,
  getStorePromotionSettings,
  getNewStoreTeaserSettings,
  normalizeStorePromotion,
  normalizeNewStoreTeaser,
} from '../data/storeSettings';

/**
 * Hook réactif synchronisé en temps réel avec les promotions (-X%, exclusions, banderole Décembre)
 * et l'encart Nouveau Magasin en construction.
 */
export function useStorePromotion(): {
  promotion: StorePromotionSettings;
  newStoreTeaser: NewStoreTeaserSettings;
} {
  const [promotion, setPromotion] = useState<StorePromotionSettings>(() => getStorePromotionSettings());
  const [newStoreTeaser, setNewStoreTeaser] = useState<NewStoreTeaserSettings>(() => getNewStoreTeaserSettings());

  useEffect(() => {
    const handlePromoUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail === 'object') {
        setPromotion(normalizeStorePromotion(detail));
      } else {
        setPromotion(getStorePromotionSettings());
      }
    };

    const handleNewStoreUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail === 'object') {
        setNewStoreTeaser(normalizeNewStoreTeaser(detail));
      } else {
        setNewStoreTeaser(getNewStoreTeaserSettings());
      }
    };

    const handleSettingsUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const heroSettings = detail?.heroSettings ?? detail;
      if (heroSettings?.storePromotion) {
        setPromotion(normalizeStorePromotion(heroSettings.storePromotion));
      } else {
        setPromotion(getStorePromotionSettings());
      }
      if (heroSettings?.newStoreTeaser) {
        setNewStoreTeaser(normalizeNewStoreTeaser(heroSettings.newStoreTeaser));
      } else {
        setNewStoreTeaser(getNewStoreTeaserSettings());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'oumar_store_settings') {
        setPromotion(getStorePromotionSettings());
        setNewStoreTeaser(getNewStoreTeaserSettings());
      }
    };

    window.addEventListener('oumar_promotion_updated', handlePromoUpdate);
    window.addEventListener('oumar_new_store_updated', handleNewStoreUpdate);
    window.addEventListener('oumar_hero_settings_updated', handleSettingsUpdate);
    window.addEventListener('oumar_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('oumar_promotion_updated', handlePromoUpdate);
      window.removeEventListener('oumar_new_store_updated', handleNewStoreUpdate);
      window.removeEventListener('oumar_hero_settings_updated', handleSettingsUpdate);
      window.removeEventListener('oumar_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return { promotion, newStoreTeaser };
}
