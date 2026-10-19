export type OrderStatus = 'pending' | 'confirmed' | 'in_delivery' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  chosenStorage: string;
  chosenColor: string;
  quantity: number;
  unitPrice: number;
}

export interface StoreOrder {
  id: string;
  orderNumber: string; // e.g. OMR-2026-0042
  createdAt: number;
  customerName: string;
  customerPhone?: string;
  commune: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  notes?: string;
}

export const ORDERS_STORAGE_KEY = 'oumar_store_orders';

// Initial realistic orders for boutique demonstration
export const INITIAL_ORDERS: StoreOrder[] = [
  {
    id: 'ord-101',
    orderNumber: 'OMR-101',
    createdAt: Date.now() - 1000 * 60 * 45, // 45 mins ago
    customerName: 'Kouassi Marc',
    customerPhone: '+225 07 48 92 11',
    commune: 'Cocody Riviera 3',
    items: [
      {
        productId: 'iphone-16-pro-max',
        productName: 'iPhone 16 Pro Max',
        productImage: '/src/assets/images/product_iphone16promax_1792367905798.jpg',
        chosenStorage: '256 Go',
        chosenColor: 'Titane Naturel',
        quantity: 1,
        unitPrice: 1150000
      }
    ],
    subtotal: 1150000,
    deliveryFee: 2000,
    total: 1152000,
    status: 'in_delivery',
    paymentMethod: 'Paiement à la livraison (Wave)',
    notes: 'Livraison en fin d’après-midi proche Pharmacie Ste Agathe'
  },
  {
    id: 'ord-102',
    orderNumber: 'OMR-102',
    createdAt: Date.now() - 1000 * 60 * 180, // 3h ago
    customerName: 'Aïcha Traoré',
    customerPhone: '+225 05 77 12 40',
    commune: 'Plateau',
    items: [
      {
        productId: 'iphone-15-pro',
        productName: 'iPhone 15 Pro',
        productImage: '/src/assets/images/product_iphone15pro_1792367905765.jpg',
        chosenStorage: '128 Go',
        chosenColor: 'Titane Bleu',
        quantity: 1,
        unitPrice: 690000
      },
      {
        productId: 'airpods-pro-2',
        productName: 'AirPods Pro 2',
        productImage: '/src/assets/images/product_airpods_pro_2_1792434397170.jpg',
        chosenStorage: 'Boîtier MagSafe USB-C',
        chosenColor: 'Blanc Brillant',
        quantity: 1,
        unitPrice: 165000
      }
    ],
    subtotal: 855000,
    deliveryFee: 2000,
    total: 857000,
    status: 'confirmed',
    paymentMethod: 'Espèces à la livraison',
    notes: 'Bureau CCIA 4e étage, appeler à l’arrivée'
  },
  {
    id: 'ord-103',
    orderNumber: 'OMR-103',
    createdAt: Date.now() - 1000 * 60 * 60 * 26, // 1 day ago
    customerName: 'Yao Bérenger',
    customerPhone: '+225 01 02 44 88',
    commune: 'Marcory Zone 4',
    items: [
      {
        productId: 'macbook-pro-14-m3',
        productName: 'MacBook Pro 14" M3',
        productImage: '/src/assets/images/product_macbook_pro_m3_1792434368716.jpg',
        chosenStorage: '512 Go SSD',
        chosenColor: 'Noir Sidéral',
        quantity: 1,
        unitPrice: 1350000
      }
    ],
    subtotal: 1350000,
    deliveryFee: 2000,
    total: 1352000,
    status: 'delivered',
    paymentMethod: 'Orange Money',
    notes: 'Livré et certifié avec facture avec garantie 1 an'
  }
];

export function loadOrders(): StoreOrder[] {
  if (typeof window === 'undefined') return INITIAL_ORDERS;
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => b.createdAt - a.createdAt);
      }
    }
  } catch (err) {
    console.error('Error loading orders', err);
  }
  return INITIAL_ORDERS;
}

export function saveOrders(orders: StoreOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    const sorted = [...orders].sort((a, b) => b.createdAt - a.createdAt);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(sorted));
    window.dispatchEvent(new CustomEvent('oumar_orders_updated', { detail: sorted }));
  } catch (err) {
    console.error('Error saving orders', err);
  }
}

export function recordNewOrder(orderData: Omit<StoreOrder, 'id' | 'orderNumber' | 'createdAt'>): StoreOrder {
  const currentOrders = loadOrders();
  const nextNum = currentOrders.length + 104;
  const newOrder: StoreOrder = {
    ...orderData,
    id: `ord-${Date.now()}`,
    orderNumber: `OMR-${nextNum}`,
    createdAt: Date.now()
  };

  const updated = [newOrder, ...currentOrders];
  saveOrders(updated);
  return newOrder;
}

export function updateOrderStatus(orderId: string, newStatus: OrderStatus): void {
  const currentOrders = loadOrders();
  const updated = currentOrders.map((ord) =>
    ord.id === orderId ? { ...ord, status: newStatus } : ord
  );
  saveOrders(updated);
}

export function deleteOrder(orderId: string): void {
  const currentOrders = loadOrders();
  const updated = currentOrders.filter((ord) => ord.id !== orderId);
  saveOrders(updated);
}

export function resetOrders(): StoreOrder[] {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('oumar_orders_updated', { detail: INITIAL_ORDERS }));
  }
  return INITIAL_ORDERS;
}
