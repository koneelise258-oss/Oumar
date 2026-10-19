import { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    model: 'Flagship Apple',
    condition: 'Neuf Scellé',
    storage: ['256 Go', '512 Go', '1 To'],
    selectedStorage: '256 Go',
    price: 1150000,
    colors: [
      { name: 'Titane Naturel', hex: '#BEB8AE' },
      { name: 'Titane Désert', hex: '#D4C4B5' },
      { name: 'Titane Blanc', hex: '#F2F1ED' },
      { name: 'Titane Noir', hex: '#3C3B37' }
    ],
    selectedColor: 'Titane Naturel',
    image: '/src/assets/images/hero_iphone_titanium_1792367905192.jpg',
    batteryHealth: '100% Neuf',
    warranty: 'Garantie Apple 1 an',
    inStock: true,
    stockLocation: 'Boutique Cocody & Plateau'
  },
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    model: 'Pro Series',
    condition: 'Neuf Scellé',
    storage: ['128 Go', '256 Go', '512 Go'],
    selectedStorage: '256 Go',
    price: 990000,
    colors: [
      { name: 'Titane Naturel', hex: '#BEB8AE' },
      { name: 'Titane Désert', hex: '#D4C4B5' },
      { name: 'Titane Noir', hex: '#3C3B37' }
    ],
    selectedColor: 'Titane Désert',
    image: '/src/assets/images/product_iphone16promax_1792367905798.jpg',
    batteryHealth: '100% Neuf',
    warranty: 'Garantie Apple 1 an',
    inStock: true,
    stockLocation: 'Boutique Cocody'
  },
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    model: 'Titane Grade A+',
    condition: 'Reconditionné A+',
    storage: ['256 Go', '512 Go'],
    selectedStorage: '256 Go',
    price: 795000,
    colors: [
      { name: 'Titane Naturel', hex: '#BEB8AE' },
      { name: 'Titane Noir', hex: '#3C3B37' }
    ],
    selectedColor: 'Titane Noir',
    image: '/src/assets/images/product_iphone15pro_1792367905765.jpg',
    batteryHealth: '100% Certifiée',
    warranty: 'Garantie Oumar 6 mois',
    inStock: true,
    stockLocation: 'Boutique Plateau'
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    model: 'Puce A17 Pro',
    condition: 'Reconditionné A+',
    storage: ['128 Go', '256 Go'],
    selectedStorage: '128 Go',
    price: 640000,
    colors: [
      { name: 'Titane Noir', hex: '#3C3B37' },
      { name: 'Titane Naturel', hex: '#BEB8AE' }
    ],
    selectedColor: 'Titane Noir',
    image: '/src/assets/images/product_iphone15pro_1792367905765.jpg',
    batteryHealth: '98% Certifiée',
    warranty: 'Garantie Oumar 6 mois',
    inStock: true,
    stockLocation: 'Boutique Cocody'
  }
];

export const WHATSAPP_PHONE = '2250700000000'; // Standard Ivory Coast format
export const WHATSAPP_URL = (message: string) =>
  `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
