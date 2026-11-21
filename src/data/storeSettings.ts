import { isSafeMediaUrl, purgeSensitiveClientStorage } from '../utils/security';

export interface MediaStyleSettings {
  heroRadius: number;    // 0 .. 48 px
  productRadius: number; // 0 .. 40 px
  videoRadius: number;   // 0 .. 44 px
}

export const DEFAULT_MEDIA_STYLE: MediaStyleSettings = {
  heroRadius: 0,
  productRadius: 20,
  videoRadius: 24,
};

export interface StorePromotionSettings {
  enabled: boolean;
  discountPercent: number; // 0 .. 90
  label: string;
  excludedProductIds: string[];
  bannerEnabled: boolean;
  bannerHeadline: string;
  bannerSubline: string;
}

export const DEFAULT_STORE_PROMOTION: StorePromotionSettings = {
  enabled: false,
  discountPercent: 15,
  label: 'Promotion de Décembre',
  excludedProductIds: [],
  bannerEnabled: true,
  bannerHeadline: 'PROMOTION DE DÉCEMBRE — OUMAR IPHONE ABIDJAN',
  bannerSubline: 'FÊTES DE FIN D’ANNÉE · SÉLECTION APPLE CERTIFIÉE · RETRAIT EN BOUTIQUE · GARANTIE 12 MOIS',
};

export interface NewStoreTeaserSettings {
  enabled: boolean;
  badgeLabel: string;
  title: string;
  subtitle: string;
  progressPercent: number; // 0 .. 100
  videoUrl: string;
  videoType: 'html5' | 'tiktok';
}

export const DEFAULT_NEW_STORE_TEASER: NewStoreTeaserSettings = {
  enabled: true,
  badgeLabel: 'OUVERTURE PROCHAINE',
  title: 'Nouveau Magasin en Construction',
  subtitle:
    'Un nouvel espace OUMAR IPHONE est actuellement en construction à Abidjan pour vous accueillir dans un showroom Apple encore plus moderne.',
  progressPercent: 72,
  videoUrl: '',
  videoType: 'html5',
};

export interface HeroSettings {
  kickerBrand: string;
  kickerLocation: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  badgeProof1: string;
  badgeProof2: string;
  badgeProof3: string;
  photoAltText: string;
  mediaStyle?: MediaStyleSettings;
  storePromotion?: StorePromotionSettings;
  newStoreTeaser?: NewStoreTeaserSettings;
}

export const DEFAULT_HERO_SETTINGS: HeroSettings = {
  kickerBrand: 'OUMAR IPHONE',
  kickerLocation: 'BOUTIQUE OFFICIELLE · ABIDJAN',
  titleLine1: "L'art du titane.",
  titleLine2: 'La pureté du verre.',
  description: "La référence des iPhone neufs scellés et reconditionnés certifiés en Côte d'Ivoire. Sous la direction d'Oumar, profitez d'une sélection rigoureusement inspectée, garantie 12 mois et disponible en boutique à Abidjan.",
  primaryButtonText: 'EXPLORER LE CATALOGUE',
  secondaryButtonText: 'CONTACTER SUR WHATSAPP',
  badgeProof1: 'Garantie 12 Mois Oumar',
  badgeProof2: 'Test & Retrait en Boutique',
  badgeProof3: 'Échange Direct WhatsApp',
  photoAltText: 'Oumar — Fondateur OUMAR IPHONE Abidjan',
  mediaStyle: DEFAULT_MEDIA_STYLE,
  storePromotion: DEFAULT_STORE_PROMOTION,
  newStoreTeaser: DEFAULT_NEW_STORE_TEASER,
};

export function clampMediaStyle(input?: Partial<MediaStyleSettings> | null): MediaStyleSettings {
  const clamp = (val: unknown, min: number, max: number, fallback: number): number => {
    const num = typeof val === 'number' ? val : Number(val);
    if (!Number.isFinite(num)) return fallback;
    return Math.min(max, Math.max(min, Math.round(num)));
  };
  return {
    heroRadius: clamp(input?.heroRadius, 0, 48, DEFAULT_MEDIA_STYLE.heroRadius),
    productRadius: clamp(input?.productRadius, 0, 40, DEFAULT_MEDIA_STYLE.productRadius),
    videoRadius: clamp(input?.videoRadius, 0, 44, DEFAULT_MEDIA_STYLE.videoRadius),
  };
}

export function normalizeStorePromotion(input?: Partial<StorePromotionSettings> | null): StorePromotionSettings {
  const rawPct = typeof input?.discountPercent === 'number' ? input.discountPercent : Number(input?.discountPercent);
  const discountPercent = Number.isFinite(rawPct)
    ? Math.min(90, Math.max(0, Math.round(rawPct)))
    : DEFAULT_STORE_PROMOTION.discountPercent;

  const excludedProductIds = Array.isArray(input?.excludedProductIds)
    ? Array.from(new Set(input.excludedProductIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)))
    : [];

  return {
    enabled: Boolean(input?.enabled),
    discountPercent,
    label: typeof input?.label === 'string' && input.label.trim() ? input.label.trim().slice(0, 80) : DEFAULT_STORE_PROMOTION.label,
    excludedProductIds,
    bannerEnabled: input?.bannerEnabled !== false,
    bannerHeadline:
      typeof input?.bannerHeadline === 'string' && input.bannerHeadline.trim()
        ? input.bannerHeadline.trim().slice(0, 140)
        : DEFAULT_STORE_PROMOTION.bannerHeadline,
    bannerSubline:
      typeof input?.bannerSubline === 'string' && input.bannerSubline.trim()
        ? input.bannerSubline.trim().slice(0, 180)
        : DEFAULT_STORE_PROMOTION.bannerSubline,
  };
}

export function normalizeNewStoreTeaser(input?: Partial<NewStoreTeaserSettings> | null): NewStoreTeaserSettings {
  const rawProgress = typeof input?.progressPercent === 'number' ? input.progressPercent : Number(input?.progressPercent);
  const progressPercent = Number.isFinite(rawProgress)
    ? Math.min(100, Math.max(0, Math.round(rawProgress)))
    : DEFAULT_NEW_STORE_TEASER.progressPercent;

  const rawVideoUrl = typeof input?.videoUrl === 'string' ? input.videoUrl.trim() : '';
  const safeVideoUrl = rawVideoUrl && (isSafeMediaUrl(rawVideoUrl) || rawVideoUrl.includes('tiktok.com')) ? rawVideoUrl : '';
  const detectedType: 'html5' | 'tiktok' =
    input?.videoType === 'tiktok' || safeVideoUrl.toLowerCase().includes('tiktok.com') ? 'tiktok' : 'html5';

  return {
    enabled: input?.enabled !== false,
    badgeLabel:
      typeof input?.badgeLabel === 'string' && input.badgeLabel.trim()
        ? input.badgeLabel.trim().slice(0, 60)
        : DEFAULT_NEW_STORE_TEASER.badgeLabel,
    title:
      typeof input?.title === 'string' && input.title.trim()
        ? input.title.trim().slice(0, 100)
        : DEFAULT_NEW_STORE_TEASER.title,
    subtitle:
      typeof input?.subtitle === 'string' && input.subtitle.trim()
        ? input.subtitle.trim().slice(0, 260)
        : DEFAULT_NEW_STORE_TEASER.subtitle,
    progressPercent,
    videoUrl: safeVideoUrl,
    videoType: detectedType,
  };
}

export interface StoreSettings {
  whatsappPhone: string;
  storeName: string;
  tagline: string;
  city: string;
  addresses: {
    name: string;
    location: string;
    phone: string;
    hours: string;
  }[];
  openingHours: string;
  warrantyText: string;
  deliveryFee: number;
  heroSettings?: HeroSettings;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  whatsappPhone: '2250161443637', // Numéro officiel OUMAR IPHONE (+225 01 61 44 36 37)
  storeName: 'OUMAR IPHONE',
  tagline: 'Boutique Apple d’Excellence à Abidjan',
  city: 'Abidjan, Côte d’Ivoire',
  addresses: [
    {
      name: 'Boutique OUMAR IPHONE Abidjan',
      location: 'Abidjan, Côte d’Ivoire (Retrait en boutique)',
      phone: '+225 01 61 44 36 37',
      hours: 'Lun - Sam : 08h30 - 19h30'
    }
  ],
  openingHours: 'Lundi au Samedi : 08h30 - 19h30 | Dimanche : Sur rendez-vous',
  warrantyText: 'Tous nos iPhone, iPad et MacBook sont vendus avec facture certifiée, numéro IMEI et garantie officielle.',
  deliveryFee: 0, // Aucune livraison : retrait gratuit en boutique
  heroSettings: DEFAULT_HERO_SETTINGS
};

export const SETTINGS_STORAGE_KEY = 'oumar_store_settings';
export const ADMIN_AUTH_STORAGE_KEY = 'oumar_admin_session';

export function loadStoreSettings(): StoreSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      delete parsed.adminPin; // Remove legacy PIN if cached in browser
      // Enforce official updated WhatsApp number: 0161443637 (+225 01 61 44 36 37)
      if (!parsed.whatsappPhone || parsed.whatsappPhone.includes('0778024285') || parsed.whatsappPhone.includes('0700000000')) {
        parsed.whatsappPhone = '2250161443637';
      }
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        heroSettings: {
          ...DEFAULT_HERO_SETTINGS,
          ...(parsed.heroSettings || {}),
          mediaStyle: clampMediaStyle(parsed.heroSettings?.mediaStyle),
          storePromotion: normalizeStorePromotion(parsed.heroSettings?.storePromotion),
          newStoreTeaser: normalizeNewStoreTeaser(parsed.heroSettings?.newStoreTeaser),
        }
      };
    }
  } catch (err) {
    console.error('Error loading store settings', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoreSettings(settings: StoreSettings): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanSettings = { ...settings };
    delete (cleanSettings as any).adminPin;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(cleanSettings));
    window.dispatchEvent(new CustomEvent('oumar_settings_updated', { detail: cleanSettings }));
  } catch (err) {
    console.error('Error saving store settings', err);
  }
}

export function getHeroSettings(): HeroSettings {
  const settings = loadStoreSettings();
  return {
    ...DEFAULT_HERO_SETTINGS,
    ...(settings.heroSettings || {}),
    mediaStyle: clampMediaStyle(settings.heroSettings?.mediaStyle),
    storePromotion: normalizeStorePromotion(settings.heroSettings?.storePromotion),
    newStoreTeaser: normalizeNewStoreTeaser(settings.heroSettings?.newStoreTeaser),
  };
}

export function saveHeroSettings(hero: HeroSettings): void {
  const current = loadStoreSettings();
  const normalizedHero: HeroSettings = {
    ...hero,
    mediaStyle: clampMediaStyle(hero.mediaStyle ?? current.heroSettings?.mediaStyle),
    storePromotion: normalizeStorePromotion(hero.storePromotion ?? current.heroSettings?.storePromotion),
    newStoreTeaser: normalizeNewStoreTeaser(hero.newStoreTeaser ?? current.heroSettings?.newStoreTeaser),
  };
  const updated: StoreSettings = {
    ...current,
    heroSettings: normalizedHero
  };
  saveStoreSettings(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('oumar_hero_settings_updated', { detail: normalizedHero }));
    window.dispatchEvent(new CustomEvent('oumar_media_style_updated', { detail: normalizedHero.mediaStyle }));
    window.dispatchEvent(new CustomEvent('oumar_promotion_updated', { detail: normalizedHero.storePromotion }));
    window.dispatchEvent(new CustomEvent('oumar_new_store_updated', { detail: normalizedHero.newStoreTeaser }));
  }
}

export function getMediaStyleSettings(): MediaStyleSettings {
  return clampMediaStyle(getHeroSettings().mediaStyle);
}

export function saveMediaStyleSettings(mediaStyle: MediaStyleSettings): StoreSettings {
  const current = loadStoreSettings();
  const normalized = clampMediaStyle(mediaStyle);
  const nextHero: HeroSettings = {
    ...DEFAULT_HERO_SETTINGS,
    ...(current.heroSettings || {}),
    mediaStyle: normalized,
    storePromotion: normalizeStorePromotion(current.heroSettings?.storePromotion),
    newStoreTeaser: normalizeNewStoreTeaser(current.heroSettings?.newStoreTeaser),
  };
  const updated: StoreSettings = {
    ...current,
    heroSettings: nextHero
  };
  saveStoreSettings(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('oumar_hero_settings_updated', { detail: nextHero }));
    window.dispatchEvent(new CustomEvent('oumar_media_style_updated', { detail: normalized }));
  }
  return updated;
}

export function getStorePromotionSettings(): StorePromotionSettings {
  return normalizeStorePromotion(getHeroSettings().storePromotion);
}

export function saveStorePromotionSettings(promo: StorePromotionSettings): StoreSettings {
  const current = loadStoreSettings();
  const normalized = normalizeStorePromotion(promo);
  const nextHero: HeroSettings = {
    ...DEFAULT_HERO_SETTINGS,
    ...(current.heroSettings || {}),
    mediaStyle: clampMediaStyle(current.heroSettings?.mediaStyle),
    storePromotion: normalized,
    newStoreTeaser: normalizeNewStoreTeaser(current.heroSettings?.newStoreTeaser),
  };
  const updated: StoreSettings = {
    ...current,
    heroSettings: nextHero
  };
  saveStoreSettings(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('oumar_hero_settings_updated', { detail: nextHero }));
    window.dispatchEvent(new CustomEvent('oumar_promotion_updated', { detail: normalized }));
  }
  return updated;
}

export function getNewStoreTeaserSettings(): NewStoreTeaserSettings {
  return normalizeNewStoreTeaser(getHeroSettings().newStoreTeaser);
}

export function saveNewStoreTeaserSettings(teaser: NewStoreTeaserSettings): StoreSettings {
  const current = loadStoreSettings();
  const normalized = normalizeNewStoreTeaser(teaser);
  const nextHero: HeroSettings = {
    ...DEFAULT_HERO_SETTINGS,
    ...(current.heroSettings || {}),
    mediaStyle: clampMediaStyle(current.heroSettings?.mediaStyle),
    storePromotion: normalizeStorePromotion(current.heroSettings?.storePromotion),
    newStoreTeaser: normalized,
  };
  const updated: StoreSettings = {
    ...current,
    heroSettings: nextHero
  };
  saveStoreSettings(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('oumar_hero_settings_updated', { detail: nextHero }));
    window.dispatchEvent(new CustomEvent('oumar_new_store_updated', { detail: normalized }));
  }
  return updated;
}

export function getWhatsAppPhone(): string {
  const settings = loadStoreSettings();
  const digits = settings.whatsappPhone.replace(/[^0-9]/g, '');
  if (!digits || digits.includes('0778024285')) {
    return '2250161443637';
  }
  return digits;
}

export function getWhatsAppUrl(message: string): string {
  const phone = getWhatsAppPhone();
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export const ADMIN_EMAIL_STORAGE_KEY = 'oumar_admin_email';

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'authenticated';
  } catch {
    return false;
  }
}

export function getAdminEmail(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(ADMIN_EMAIL_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAdminAuthenticated(auth: boolean, email?: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (auth) {
      sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'authenticated');
      if (email) {
        sessionStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, email);
      }
    } else {
      purgeSensitiveClientStorage();
    }
    window.dispatchEvent(new CustomEvent('oumar_admin_auth_changed', { detail: auth }));
  } catch {
    // Ignore storage errors
  }
}

export const HERO_PHOTO_STORAGE_KEY = 'oumar_photo_custom';

export function getHeroCustomPhoto(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(HERO_PHOTO_STORAGE_KEY);
    if (stored && isSafeMediaUrl(stored)) {
      return stored;
    }
    if (stored) {
      // Supprimer toute URL invalide ou potentiellement malveillante
      localStorage.removeItem(HERO_PHOTO_STORAGE_KEY);
    }
    return null;
  } catch {
    return null;
  }
}

export function saveHeroCustomPhoto(dataUrl: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (dataUrl) {
      if (!isSafeMediaUrl(dataUrl)) return;
      localStorage.setItem(HERO_PHOTO_STORAGE_KEY, dataUrl);
    } else {
      localStorage.removeItem(HERO_PHOTO_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent('oumar_hero_photo_updated', { detail: dataUrl }));
  } catch (err) {
    console.error('Error saving hero photo', err);
  }
}
