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
  photoAltText: 'Oumar — Fondateur OUMAR IPHONE Abidjan'
};

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
          ...(parsed.heroSettings || {})
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
    ...(settings.heroSettings || {})
  };
}

export function saveHeroSettings(hero: HeroSettings): void {
  const current = loadStoreSettings();
  const updated: StoreSettings = {
    ...current,
    heroSettings: hero
  };
  saveStoreSettings(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('oumar_hero_settings_updated', { detail: hero }));
  }
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
      sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
      sessionStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY);
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
    return localStorage.getItem(HERO_PHOTO_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveHeroCustomPhoto(dataUrl: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (dataUrl) {
      localStorage.setItem(HERO_PHOTO_STORAGE_KEY, dataUrl);
    } else {
      localStorage.removeItem(HERO_PHOTO_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent('oumar_hero_photo_updated', { detail: dataUrl }));
  } catch (err) {
    console.error('Error saving hero photo', err);
  }
}
