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

// Aucune donnée fictive ou commande commerciale inventée : le tableau démarre strictement vide.
// Sécurité vie privée (PII) : les commandes contenant noms & téléphones clients ne sont JAMAIS
// persistées dans localStorage public — elles restent exclusivement en mémoire pendant la session admin.
export const INITIAL_ORDERS: StoreOrder[] = [];

let memoryOrdersCache: StoreOrder[] = [];

function clearLegacyOrdersStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
  } catch {
    // Ignore storage access errors
  }
}

export function loadOrders(): StoreOrder[] {
  clearLegacyOrdersStorage();
  return [...memoryOrdersCache].sort((a, b) => b.createdAt - a.createdAt);
}

export function saveOrders(orders: StoreOrder[]): void {
  clearLegacyOrdersStorage();
  const sorted = [...orders].sort((a, b) => b.createdAt - a.createdAt);
  memoryOrdersCache = sorted;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('oumar_orders_updated', { detail: sorted }));
  }
}

export function recordNewOrder(orderData: Omit<StoreOrder, 'id' | 'orderNumber' | 'createdAt'>): StoreOrder {
  const currentOrders = loadOrders();
  const nextNum = currentOrders.length + 1;
  const newOrder: StoreOrder = {
    ...orderData,
    id: `ord-${Date.now()}`,
    orderNumber: `OMR-${String(nextNum).padStart(4, '0')}`,
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
  memoryOrdersCache = [];
  clearLegacyOrdersStorage();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('oumar_orders_updated', { detail: INITIAL_ORDERS }));
  }
  return INITIAL_ORDERS;
}
