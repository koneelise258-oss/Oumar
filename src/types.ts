export interface Product {
  id: string;
  name: string;
  model: string;
  condition: 'Neuf Scellé' | 'Reconditionné A+';
  storage: string[];
  selectedStorage: string;
  price: number; // in FCFA
  colors: { name: string; hex: string }[];
  selectedColor: string;
  image: string;
  batteryHealth: string;
  warranty: string;
  inStock: boolean;
  stockLocation: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  chosenStorage: string;
  chosenColor: string;
}
