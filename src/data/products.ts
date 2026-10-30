import { Product } from '../types';

import imgTitanium from '../assets/images/hero_iphone_titanium_1792367905192.jpg';
import img16ProMax from '../assets/images/product_iphone16promax_1792367905798.jpg';
import img15Pro from '../assets/images/product_iphone15pro_1792367905765.jpg';
import imgIpadPro from '../assets/images/product_ipad_pro_m4_1792434382801.jpg';
import imgMacBookPro from '../assets/images/product_macbook_pro_m3_1792434368716.jpg';
import imgAirPodsPro from '../assets/images/product_airpods_pro_2_1792434397170.jpg';

import { getWhatsAppPhone, getWhatsAppUrl } from './storeSettings';

export const APPLE_ASSET_IMAGES = {
  iphone16ProMax: img16ProMax,
  iphone16Pro: imgTitanium,
  iphone15Pro: img15Pro,
  ipadProM4: imgIpadPro,
  macbookProM3: imgMacBookPro,
  airpodsPro2: imgAirPodsPro
};

export const WHATSAPP_PHONE = getWhatsAppPhone();
export const WHATSAPP_URL = (message: string) => getWhatsAppUrl(message);

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    model: 'Flagship Apple Titane A18 Pro',
    category: 'iPhone',
    condition: 'Neuf scellé',
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
      { name: 'Titane Naturel', hex: '#BEB8AE', image: img16ProMax },
      { name: 'Titane Désert', hex: '#D4C4B5', image: imgTitanium },
      { name: 'Titane Blanc', hex: '#F2F1ED', image: img16ProMax },
      { name: 'Titane Noir', hex: '#3C3B37', image: imgTitanium }
    ],
    selectedColor: 'Titane Naturel',
    image: img16ProMax,
    gallery: [img16ProMax, imgTitanium],
    batteryHealth: '100%',
    warranty: 'Garantie boutique OUMAR IPHONE',
    inStock: true,
    stockLocation: 'Boutique Cocody & Plateau',
    featured: true,
    isNew: true,
    description: 'Le summum de la technologie mobile. Châssis en titane de grade 5, écran Super Retina XDR 6,9 pouces avec bordures ultra-fines, puce A18 Pro et nouvelle commande de l’appareil photo.',
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
    condition: 'Neuf scellé',
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
      { name: 'Titane Désert', hex: '#D4C4B5', image: imgTitanium },
      { name: 'Titane Naturel', hex: '#BEB8AE', image: imgTitanium },
      { name: 'Titane Noir', hex: '#3C3B37', image: img16ProMax },
      { name: 'Titane Blanc', hex: '#F2F1ED', image: img16ProMax }
    ],
    selectedColor: 'Titane Désert',
    image: imgTitanium,
    gallery: [imgTitanium, img16ProMax],
    batteryHealth: '100%',
    warranty: 'Garantie boutique OUMAR IPHONE',
    inStock: true,
    stockLocation: 'Boutique Cocody',
    featured: true,
    isNew: true,
    description: 'Toute la puissance Pro dans un format compact et maniable de 6,3 pouces. Téléobjectif tétraprisme 5x, autonomie accrue et bouton Commande de l’appareil photo.',
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
    id: 'iphone-duo-pack-pro',
    name: 'iPhone Duo (Pack 2 iPhones)',
    model: 'Offre Spéciale Duo Abidjan',
    category: 'iPhone Duo',
    condition: 'Neuf scellé',
    storage: ['256 Go + 128 Go', '512 Go + 256 Go'],
    selectedStorage: '256 Go + 128 Go',
    price: 1390000,
    originalPrice: 1480000,
    storagePrices: {
      '256 Go + 128 Go': 1390000,
      '512 Go + 256 Go': 1590000
    },
    colors: [
      { name: 'Titane Naturel & Noir', hex: '#BEB8AE', image: img16ProMax },
      { name: 'Titane Désert & Blanc', hex: '#D4C4B5', image: imgTitanium }
    ],
    selectedColor: 'Titane Naturel & Noir',
    image: img16ProMax,
    gallery: [img16ProMax, imgTitanium],
    batteryHealth: '100%',
    warranty: 'Garantie boutique OUMAR IPHONE',
    inStock: true,
    stockLocation: 'Boutique Cocody & Plateau',
    featured: true,
    isNew: true,
    description: 'Offre exclusive Duo OUMAR IPHONE : pack de deux iPhones neufs scellés avec garantie boutique. Idéal pour couples, associés ou cadeaux d’exception à Abidjan.',
    specs: {
      screen: 'Écrans Super Retina XDR OLED ProMotion 120Hz',
      chip: 'Puces Apple Silicon A18 / A17 Pro haute efficacité',
      camera: 'Système photo Pro 48 Mpx avec enregistrement vidéo 4K Dolby Vision',
      battery: 'Batteries scellées d’origine Apple avec autonomie maximale',
      ports: 'USB-C haute vitesse',
      boxContents: 'Deux coffrets neufs scellés individuels avec câbles de charge tressés'
    },
    published: true
  },
  {
    id: 'ipad-pro-13-m4',
    name: 'iPad Pro 13" M4',
    model: 'Ultra Retina Tandem OLED Puce M4',
    category: 'iPad',
    condition: 'Neuf scellé',
    storage: ['256 Go', '512 Go', '1 To'],
    selectedStorage: '256 Go',
    price: 1090000,
    originalPrice: 1150000,
    storagePrices: {
      '256 Go': 1090000,
      '512 Go': 1250000,
      '1 To': 1450000
    },
    colors: [
      { name: 'Noir Sidéral', hex: '#26282A', image: imgIpadPro },
      { name: 'Argent', hex: '#E3E4E5', image: imgIpadPro }
    ],
    selectedColor: 'Noir Sidéral',
    image: imgIpadPro,
    gallery: [imgIpadPro],
    batteryHealth: '100%',
    warranty: 'Garantie boutique OUMAR IPHONE',
    inStock: true,
    stockLocation: 'Boutique Cocody & Plateau',
    featured: true,
    isNew: true,
    description: 'Design ultra-fin d’exception. Écran Ultra Retina XDR à technologie tandem OLED, propulsé par la puce M4 pour les créateurs et professionnels.',
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
    id: 'ipad-air-11-m2',
    name: 'iPad Air 11" M2',
    model: 'Puce Apple M2 Liquid Retina',
    category: 'iPad',
    condition: 'Neuf scellé',
    storage: ['128 Go', '256 Go', '512 Go'],
    selectedStorage: '128 Go',
    price: 590000,
    originalPrice: 630000,
    storagePrices: {
      '128 Go': 590000,
      '256 Go': 690000,
      '512 Go': 850000
    },
    colors: [
      { name: 'Gris Sidéral', hex: '#53555B', image: imgIpadPro },
      { name: 'Lumière Stellaire', hex: '#E2D8CE', image: imgIpadPro },
      { name: 'Bleu', hex: '#A3B9C9', image: imgIpadPro },
      { name: 'Mauve', hex: '#C2B6D1', image: imgIpadPro }
    ],
    selectedColor: 'Gris Sidéral',
    image: imgIpadPro,
    gallery: [imgIpadPro],
    batteryHealth: '100%',
    warranty: 'Garantie boutique OUMAR IPHONE',
    inStock: true,
    stockLocation: 'Boutique Cocody',
    featured: false,
    isNew: true,
    description: 'Performances M2 impressionnantes dans un design ultra-léger et coloré. Écran Liquid Retina 11 pouces avec couleur large P3.',
    specs: {
      screen: '11 pouces Liquid Retina True Tone P3',
      chip: 'Puce Apple M2 avec GPU 10 cœurs',
      camera: 'Caméra 12 Mpx grand-angle + Caméra avant paysage 12 Mpx Ultra grand-angle',
      battery: 'Jusqu’à 10 heures d’autonomie',
      ports: 'USB-C haute vitesse',
      boxContents: 'iPad Air 11", Câble de charge USB-C, Adaptateur secteur'
    },
    published: true
  },
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    model: 'Titane Grade A+',
    category: 'iPhone',
    condition: 'Reconditionné',
    storage: ['256 Go', '512 Go'],
    selectedStorage: '256 Go',
    price: 795000,
    originalPrice: 850000,
    storagePrices: {
      '256 Go': 795000,
      '512 Go': 895000
    },
    colors: [
      { name: 'Titane Naturel', hex: '#BEB8AE', image: img15Pro },
      { name: 'Titane Noir', hex: '#3C3B37', image: img15Pro },
      { name: 'Titane Bleu', hex: '#2B3545', image: img15Pro }
    ],
    selectedColor: 'Titane Naturel',
    image: img15Pro,
    gallery: [img15Pro, imgTitanium],
    batteryHealth: '100%',
    warranty: 'Garantie Oumar 6 mois',
    inStock: true,
    stockLocation: 'Boutique Plateau',
    featured: false,
    description: 'Le premier iPhone en titane aérospatial avec le téléobjectif optique 5x et le bouton Action programmable. Rigoureusement inspecté par l’équipe Oumar iPhone.',
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
    id: 'macbook-pro-14-m3',
    name: 'MacBook Pro 14" M3 Pro',
    model: 'Apple Silicon 18 Go RAM / 512 Go SSD',
    category: 'MacBook',
    condition: 'Neuf scellé',
    storage: ['512 Go SSD', '1 To SSD'],
    selectedStorage: '512 Go SSD',
    price: 1650000,
    originalPrice: 1750000,
    storagePrices: {
      '512 Go SSD': 1650000,
      '1 To SSD': 1890000
    },
    colors: [
      { name: 'Noir Sidéral', hex: '#242527', image: imgMacBookPro },
      { name: 'Argent', hex: '#E3E4E6', image: imgMacBookPro }
    ],
    selectedColor: 'Noir Sidéral',
    image: imgMacBookPro,
    gallery: [imgMacBookPro],
    batteryHealth: '100%',
    warranty: 'Garantie boutique OUMAR IPHONE',
    inStock: true,
    stockLocation: 'Boutique Cocody',
    featured: true,
    isNew: false,
    description: 'La station de travail portable ultime. Boîtier en aluminium anodisé Noir Sidéral anti-traces, écran Liquid Retina XDR à 120 Hz.',
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
    condition: 'Neuf scellé',
    storage: ['Standard'],
    selectedStorage: 'Standard',
    price: 195000,
    originalPrice: 220000,
    storagePrices: {
      'Standard': 195000
    },
    colors: [
      { name: 'Blanc Pur', hex: '#FFFFFF', image: imgAirPodsPro }
    ],
    selectedColor: 'Blanc Pur',
    image: imgAirPodsPro,
    gallery: [imgAirPodsPro],
    batteryHealth: '100%',
    warranty: 'Garantie boutique OUMAR IPHONE',
    inStock: true,
    stockLocation: 'En stock dans toutes les boutiques',
    featured: false,
    isNew: false,
    description: 'Réduction active du bruit jusqu’à 2x plus efficace. Puce H2 pour un son plus immersif et boîtier MagSafe avec port USB-C.',
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

// Safe loader that synchronizes with localStorage and cleans legacy states
export const loadProducts = (): Product[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => {
          let cond = p.condition;
          if (cond === 'Neuf Original Apple' || cond === 'Neuf Scellé' || cond === 'Neuf') cond = 'Neuf scellé';
          else if (cond === 'Quasi Neuf') cond = 'Quasi neuf';
          else if (cond === 'Reconditionné A+' || cond === 'Reconditionné Certifié') cond = 'Reconditionné';
          else if (!cond) cond = 'Neuf scellé';

          let battery = p.batteryHealth;
          if (battery === '100% Neuf' || battery === '100% Certifiée') battery = '100%';

          return {
            ...p,
            condition: cond,
            batteryHealth: battery || '100%'
          };
        });
      }
    }
  } catch (err) {
    console.warn('Failed to load products from localStorage', err);
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

// Reset the local catalogue to official default catalog.
export const resetProducts = (): Product[] => {
  saveProducts(DEFAULT_PRODUCTS);
  return DEFAULT_PRODUCTS;
};
