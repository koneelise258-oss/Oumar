export type ProductCategory = 'iPhone' | 'iPad' | 'MacBook' | 'Accessoires';

export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
}

export interface ProductSpec {
  screen?: string;
  chip?: string;
  camera?: string;
  battery?: string;
  ports?: string;
  boxContents?: string;
}

export interface Product {
  id: string;
  name: string;
  model: string;
  category: ProductCategory;
  condition: 'Neuf Scellé' | 'Reconditionné A+' | 'Reconditionné Certifié';
  storage: string[];
  selectedStorage: string;
  price: number; // in FCFA
  originalPrice?: number; // original price for discounts
  storagePrices?: Record<string, number>; // exact price per capacity
  colors: ProductColor[];
  selectedColor: string;
  image: string;
  gallery?: string[];
  batteryHealth: string;
  warranty: string;
  inStock: boolean;
  stockLocation: string;
  featured?: boolean;
  isNew?: boolean;
  description?: string;
  specs?: ProductSpec;
  published?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  chosenStorage: string;
  chosenColor: string;
  unitPrice: number;
}

export interface VideoItem {
  id: string;
  url: string; // Direct MP4/WebM URL, Data URL, or TikTok link
  type: 'html5' | 'tiktok';
  title?: string; // Internal admin reference label
  published: boolean;
  order: number;
  createdAt: number;
}
