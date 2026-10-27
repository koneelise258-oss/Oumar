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
  adminPin: string; // Stored securely in localStorage
}

export const DEFAULT_SETTINGS: StoreSettings = {
  whatsappPhone: '2250700000000', // Standard Côte d'Ivoire WhatsApp format (+225)
  storeName: 'OUMAR IPHONE',
  tagline: 'Boutique Apple d’Excellence à Abidjan',
  city: 'Abidjan, Côte d’Ivoire',
  addresses: [
    {
      name: 'Boutique Cocody Angré',
      location: 'Angré 8ème Tranche, Carrefour Duncan, Abidjan',
      phone: '+225 07 00 00 00 00',
      hours: 'Lun - Sam : 08h30 - 19h30'
    },
    {
      name: 'Showroom Plateau',
      location: 'Avenue Chardy, Proche Immeuble CCIA, Plateau, Abidjan',
      phone: '+225 05 00 00 00 00',
      hours: 'Lun - Ven : 09h00 - 18h30'
    }
  ],
  openingHours: 'Lundi au Samedi : 08h30 - 19h30 | Dimanche : Sur rendez-vous',
  warrantyText: 'Tous nos iPhone, iPad et MacBook sont vendus avec une garantie officielle de 6 mois à 1 an, facture certifiée avec numéro IMEI et assistance technique dédiée à Abidjan.',
  deliveryFee: 2000,
  adminPin: '2025' // Default PIN for OUMAR IPHONE administrator
};

export const SETTINGS_STORAGE_KEY = 'oumar_store_settings';
export const ADMIN_AUTH_STORAGE_KEY = 'oumar_admin_session';

export function loadStoreSettings(): StoreSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.error('Error loading store settings', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoreSettings(settings: StoreSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('oumar_settings_updated', { detail: settings }));
  } catch (err) {
    console.error('Error saving store settings', err);
  }
}

export function getWhatsAppPhone(): string {
  const settings = loadStoreSettings();
  return settings.whatsappPhone.replace(/[^0-9]/g, '') || '2250700000000';
}

export function getWhatsAppUrl(message: string): string {
  const phone = getWhatsAppPhone();
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function verifyAdminPin(enteredPin: string): boolean {
  const settings = loadStoreSettings();
  const currentPin = settings.adminPin || '2025';
  return enteredPin.trim() === currentPin.trim();
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
