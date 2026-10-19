import { Product } from '../types';

import imgTitanium from '../assets/images/hero_iphone_titanium_1792367905192.jpg';
import img16ProMax from '../assets/images/product_iphone16promax_1792367905798.jpg';
import img15Pro from '../assets/images/product_iphone15pro_1792367905765.jpg';
import imgIpadPro from '../assets/images/product_ipad_pro_m4_1792434382801.jpg';
import imgMacBookPro from '../assets/images/product_macbook_pro_m3_1792434368716.jpg';
import imgAirPodsPro from '../assets/images/product_airpods_pro_2_1792434397170.jpg';

import { getWhatsAppPhone, getWhatsAppUrl } from './storeSettings';

export const WHATSAPP_PHONE = getWhatsAppPhone();
export const WHATSAPP_URL = (message: string) => getWhatsAppUrl(message);

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    model: 'Flagship Apple Titane A18 Pro',
    category: 'iPhone',
    condition: 'Neuf Scellé',
    storage: ['256 Go', '512 Go', '1 To'],
    selectedStorage: '256 Go',
    price: 1150000,
    originalPrice: 1220000,
    storagePrices: {
      '256 Go': 1150000,
      '512 Go': 1320000,
      '1 To': 1490000
    },
    colors: [
      { name: 'Titane Naturel', hex: '#BEB8AE' },
      { name: 'Titane Désert', hex: '#D4C4B5' },
      { name: 'Titane Blanc', hex: '#F2F1ED' },
      { name: 'Titane Noir', hex: '#3C3B37' }
    ],
    selectedColor: 'Titane Naturel',
    image: img16ProMax,
    gallery: [img16ProMax, imgTitanium],
    batteryHealth: '100% Neuf',
    warranty: 'Garantie Apple 1 an',
    inStock: true,
    stockLocation: 'Boutique Cocody & Plateau',
    featured: true,
    isNew: true,
    description: 'Le summum de la technologie mobile Apple. Châssis en titane de grade 5, écran Super Retina XDR 6,9 pouces avec bordures ultra-fines, puce A18 Pro révolutionnaire et nouvelle commande de l’appareil photo.',
    specs: {
      screen: 'Super Retina XDR 6,9" OLED ProMotion 120Hz Always-On',
      chip: 'Puce Apple A18 Pro (Gravure 3nm de 2e génération)',
      camera: 'Système photo Pro Fusion 48 Mpx, Ultra grand-angle 48 Mpx, Téléobjectif 5x',
      battery: 'Jusqu’à 33 heures de lecture vidéo, recharge rapide MagSafe 25W',
      ports: 'USB-C avec débits USB 3 jusqu’à 10 Gb/s',
      boxContents: 'iPhone avec iOS 18, Câble de charge USB-C tissé (1 m), Documentation'
    },
    published: true
  },
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    model: 'Pro Series Titane 6,3"',
    category: 'iPhone',
    condition: 'Neuf Scellé',
    storage: ['128 Go', '256 Go', '512 Go'],
    selectedStorage: '256 Go',
    price: 990000,
    originalPrice: 1050000,
    storagePrices: {
      '128 Go': 895000,
      '256 Go': 990000,
      '512 Go': 1160000
    },
    colors: [
      { name: 'Titane Naturel', hex: '#BEB8AE' },
      { name: 'Titane Désert', hex: '#D4C4B5' },
      { name: 'Titane Noir', hex: '#3C3B37' },
      { name: 'Titane Blanc', hex: '#F2F1ED' }
    ],
    selectedColor: 'Titane Désert',
    image: imgTitanium,
    gallery: [imgTitanium, img16ProMax],
    batteryHealth: '100% Neuf',
    warranty: 'Garantie Apple 1 an',
    inStock: true,
    stockLocation: 'Boutique Cocody',
    featured: true,
    isNew: true,
    description: 'Toute la puissance Pro dans un format compact et maniable de 6,3 pouces. Téléobjectif tétraprisme 5x, autonomie record et bouton Commande de l’appareil photo.',
    specs: {
      screen: 'Super Retina XDR 6,3" OLED ProMotion 120Hz',
      chip: 'Puce Apple A18 Pro avec Neural Engine 16 cœurs',
      camera: 'Triple capteur Pro 48 Mpx + 48 Mpx + 12 Mpx (Zoom optique 5x)',
      battery: 'Jusqu’à 27 heures de lecture vidéo',
      ports: 'USB-C compatible USB 3',
      boxContents: 'iPhone 16 Pro, Câble USB-C tressé, Notice'
    },
    published: true
  },
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    model: 'Titane Grade A+ Certifié',
    category: 'iPhone',
    condition: 'Reconditionné A+',
    storage: ['256 Go', '512 Go'],
    selectedStorage: '256 Go',
    price: 795000,
    originalPrice: 850000,
    storagePrices: {
      '256 Go': 795000,
      '512 Go': 895000
    },
    colors: [
      { name: 'Titane Naturel', hex: '#BEB8AE' },
      { name: 'Titane Noir', hex: '#3C3B37' },
      { name: 'Titane Bleu', hex: '#2B3545' }
    ],
    selectedColor: 'Titane Naturel',
    image: img15Pro,
    gallery: [img15Pro, imgTitanium],
    batteryHealth: '100% Certifiée',
    warranty: 'Garantie Oumar 6 mois',
    inStock: true,
    stockLocation: 'Boutique Plateau',
    featured: false,
    description: 'Le premier iPhone en titane aérospatial avec le téléobjectif optique 5x et le bouton Action programmable. Rigoureusement inspecté par Oumar sur 35 points de contrôle.',
    specs: {
      screen: 'Super Retina XDR 6,7" OLED ProMotion 120Hz',
      chip: 'Puce A17 Pro avec GPU 6 cœurs et Ray Tracing matériel',
      camera: 'Objectif principal 48 Mpx, Téléobjectif 5x 120 mm',
      battery: 'Batterie certifiée 100% santé avec cycles vérifiés',
      ports: 'USB-C (USB 3 jusqu’à 10 Gb/s)',
      boxContents: 'iPhone 15 Pro Max boîte reconditionnée avec chargeur et câble'
    },
    published: true
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    model: 'Puce A17 Pro Titane 6,1"',
    category: 'iPhone',
    condition: 'Reconditionné A+',
    storage: ['128 Go', '256 Go'],
    selectedStorage: '128 Go',
    price: 640000,
    originalPrice: 690000,
    storagePrices: {
      '128 Go': 640000,
      '256 Go': 710000
    },
    colors: [
      { name: 'Titane Noir', hex: '#3C3B37' },
      { name: 'Titane Naturel', hex: '#BEB8AE' },
      { name: 'Titane Blanc', hex: '#F2F1ED' }
    ],
    selectedColor: 'Titane Noir',
    image: img15Pro,
    gallery: [img15Pro],
    batteryHealth: '98% Certifiée',
    warranty: 'Garantie Oumar 6 mois',
    inStock: true,
    stockLocation: 'Boutique Cocody',
    featured: false,
    description: 'Élégant, ultra-léger et puissant. Puce A17 Pro pour le jeu mobile de niveau console et format idéal pour une utilisation à une main.',
    specs: {
      screen: 'Super Retina XDR 6,1" avec Dynamic Island',
      chip: 'Puce A17 Pro',
      camera: '48 Mpx avec mode Portrait nouvelle génération',
      battery: 'Excellente autonomie avec santé batterie certifiée',
      ports: 'USB-C universel',
      boxContents: 'iPhone 15 Pro, Câble de charge et chargeur 20W inclus'
    },
    published: true
  },
  {
    id: 'ipad-pro-13-m4',
    name: 'iPad Pro 13" M4',
    model: 'Ultra Retina Tandem OLED Puce M4',
    category: 'iPad',
    condition: 'Neuf Scellé',
    storage: ['256 Go', '512 Go'],
    selectedStorage: '256 Go',
    price: 1090000,
    originalPrice: 1150000,
    storagePrices: {
      '256 Go': 1090000,
      '512 Go': 1250000
    },
    colors: [
      { name: 'Noir Sidéral', hex: '#26282A' },
      { name: 'Argent', hex: '#E3E4E5' }
    ],
    selectedColor: 'Noir Sidéral',
    image: imgIpadPro,
    gallery: [imgIpadPro],
    batteryHealth: '100% Neuf',
    warranty: 'Garantie Apple 1 an',
    inStock: true,
    stockLocation: 'Boutique Cocody & Plateau',
    featured: true,
    isNew: true,
    description: 'Le produit Apple le plus fin jamais conçu. Écran Ultra Retina XDR révolutionnaire à technologie tandem OLED, propulsé par la surpuissante puce M4 pour les créateurs et professionnels.',
    specs: {
      screen: '13 pouces Ultra Retina XDR Tandem OLED, luminosité 1000 nits',
      chip: 'Puce Apple M4 avec Neural Engine 38 TOPS',
      camera: 'Caméra arrière 12 Mpx LiDAR + Caméra avant paysage 12 Mpx',
      battery: 'Jusqu’à 10 heures d’autonomie en navigation web Wi-Fi',
      ports: 'Thunderbolt / USB 4 avec recharge rapide',
      boxContents: 'iPad Pro 13", Câble de charge USB-C tressé, Adaptateur secteur 20W'
    },
    published: true
  },
  {
    id: 'macbook-pro-14-m3',
    name: 'MacBook Pro 14" M3 Pro',
    model: 'Apple Silicon 18 Go RAM / 512 Go SSD',
    category: 'MacBook',
    condition: 'Neuf Scellé',
    storage: ['512 Go SSD', '1 To SSD'],
    selectedStorage: '512 Go SSD',
    price: 1650000,
    originalPrice: 1750000,
    storagePrices: {
      '512 Go SSD': 1650000,
      '1 To SSD': 1890000
    },
    colors: [
      { name: 'Noir Sidéral', hex: '#242527' },
      { name: 'Argent', hex: '#E3E4E6' }
    ],
    selectedColor: 'Noir Sidéral',
    image: imgMacBookPro,
    gallery: [imgMacBookPro],
    batteryHealth: '100% Neuf',
    warranty: 'Garantie Apple 1 an',
    inStock: true,
    stockLocation: 'Boutique Cocody',
    featured: true,
    isNew: false,
    description: 'La station de travail portable ultime. Boîtier en aluminium anodisé Noir Sidéral anti-traces, écran Liquid Retina XDR à 120 Hz et jusqu’à 18 heures d’autonomie sur batterie.',
    specs: {
      screen: 'Liquid Retina XDR 14,2" 3024 x 1964 pixels avec ProMotion 120Hz',
      chip: 'Puce Apple M3 Pro (CPU 11 cœurs, GPU 14 cœurs)',
      camera: 'Caméra FaceTime HD 1080p avec système audio 6 haut-parleurs',
      battery: 'Batterie 70 Wh avec jusqu’à 18h de lecture vidéo',
      ports: '3 ports Thunderbolt 4, HDMI, Lecteur de carte SDXC, MagSafe 3',
      boxContents: 'MacBook Pro 14", Adaptateur secteur USB-C 70W, Câble MagSafe 3'
    },
    published: true
  },
  {
    id: 'airpods-pro-2-usbc',
    name: 'AirPods Pro 2 (USB-C)',
    model: 'Boîtier MagSafe avec haut-parleur et dragonne',
    category: 'Accessoires',
    condition: 'Neuf Scellé',
    storage: ['Standard'],
    selectedStorage: 'Standard',
    price: 195000,
    originalPrice: 220000,
    storagePrices: {
      'Standard': 195000
    },
    colors: [
      { name: 'Blanc Pur', hex: '#FFFFFF' }
    ],
    selectedColor: 'Blanc Pur',
    image: imgAirPodsPro,
    gallery: [imgAirPodsPro],
    batteryHealth: '100% Neuf',
    warranty: 'Garantie Apple 1 an',
    inStock: true,
    stockLocation: 'En stock dans toutes les boutiques',
    featured: false,
    isNew: false,
    description: 'Réduction active du bruit jusqu’à 2x plus efficace. Puce H2 pour un son plus immersif et boîtier MagSafe résistant à la poussière et à l’eau avec port USB-C.',
    specs: {
      screen: 'Non applicable',
      chip: 'Puce Apple H2 pour écouteurs + Puce U1 dans le boîtier MagSafe',
      camera: 'Audio spatial personnalisé avec suivi dynamique des mouvements',
      battery: 'Jusqu’à 6h d’écoute continue, 30h au total avec le boîtier',
      ports: 'Connecteur USB-C, recharge sans fil MagSafe et Qi',
      boxContents: 'AirPods Pro 2, Boîtier de charge MagSafe (USB-C), 4 paires d’embouts, Câble'
    },
    published: true
  }
];

export const PRODUCTS: Product[] = DEFAULT_PRODUCTS;

const STORAGE_KEY = 'oumar_products_catalog';

// Safe loader that synchronizes with localStorage
export const loadProducts = (): Product[] => {
  if (typeof window === 'undefined') return DEFAULT_PRODUCTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRODUCTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load products from localStorage, falling back to defaults', err);
  }
  return DEFAULT_PRODUCTS;
};

// Save products to localStorage with event broadcast
export const saveProducts = (products: Product[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent('oumar_products_updated', { detail: products }));
  } catch (err) {
    console.error('Failed to save products to localStorage', err);
  }
};

// Reset products to initial defaults
export const resetProducts = (): Product[] => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('oumar_products_updated', { detail: DEFAULT_PRODUCTS }));
    } catch {
      // Ignore
    }
  }
  return DEFAULT_PRODUCTS;
};
