import { supabase, isSupabaseConfigured, testSupabaseHealth } from '../lib/supabase';
export { testSupabaseHealth };
import { Product, VideoItem } from '../types';
import { StoreOrder, OrderStatus, loadOrders, saveOrders } from '../data/orders';
import { StoreSettings, loadStoreSettings, saveStoreSettings } from '../data/storeSettings';
import { loadProducts, saveProducts } from '../data/products';
import { loadVideos, saveVideos } from '../data/videos';

// ==============================================================================
// PRODUCT MAPPERS
// ==============================================================================
export function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    model: row.model,
    category: row.category,
    condition: row.condition,
    storage: Array.isArray(row.storage) ? row.storage : [],
    selectedStorage: row.selected_storage || (Array.isArray(row.storage) ? row.storage[0] : ''),
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    storagePrices: row.storage_prices || {},
    colors: Array.isArray(row.colors) ? row.colors : [],
    selectedColor: row.selected_color || (Array.isArray(row.colors) && row.colors[0]?.name ? row.colors[0].name : ''),
    image: row.image,
    gallery: Array.isArray(row.gallery) && row.gallery.length > 0 ? row.gallery : [row.image],
    batteryHealth: row.battery_health || '100% Neuf',
    warranty: row.warranty || 'Garantie Apple 1 an',
    inStock: Boolean(row.in_stock),
    stockLocation: row.stock_location || 'Boutique Cocody & Plateau',
    featured: Boolean(row.featured),
    isNew: Boolean(row.is_new),
    description: row.description || '',
    specs: row.specs || {},
    published: row.published !== false
  };
}

export function productToRow(prod: Product): any {
  return {
    id: prod.id,
    name: prod.name,
    model: prod.model,
    category: prod.category,
    condition: prod.condition,
    storage: prod.storage,
    selected_storage: prod.selectedStorage,
    price: Math.round(prod.price),
    original_price: prod.originalPrice ? Math.round(prod.originalPrice) : null,
    storage_prices: prod.storagePrices || {},
    colors: prod.colors,
    selected_color: prod.selectedColor,
    image: prod.image,
    gallery: prod.gallery || [prod.image],
    battery_health: prod.batteryHealth,
    warranty: prod.warranty,
    in_stock: prod.inStock,
    stock_location: prod.stockLocation,
    featured: Boolean(prod.featured),
    is_new: Boolean(prod.isNew),
    description: prod.description || '',
    specs: prod.specs || {},
    published: prod.published !== false,
    updated_at: new Date().toISOString()
  };
}

// ==============================================================================
// VIDEO MAPPERS
// ==============================================================================
export function rowToVideo(row: any): VideoItem {
  return {
    id: row.id,
    url: row.url,
    type: row.type || 'html5',
    title: row.title || undefined,
    published: row.published !== false,
    order: row.display_order ?? 1,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
  };
}

export function videoToRow(v: VideoItem): any {
  return {
    id: v.id,
    url: v.url,
    type: v.type,
    title: v.title || null,
    published: v.published,
    display_order: v.order,
    created_at: new Date(v.createdAt).toISOString()
  };
}

// ==============================================================================
// STORE SERVICE: PRODUCTS
// ==============================================================================
export async function fetchProductsRemote(): Promise<Product[]> {
  if (!isSupabaseConfigured) {
    return loadProducts();
  }

  try {
    const { data, error } = await supabase
      .from('store_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchProducts warning, using local cache:', error.message);
      return loadProducts();
    }

    if (data && data.length > 0) {
      const mapped = data.map(rowToProduct);
      saveProducts(mapped); // Cache locally for offline reliability
      return mapped;
    }
  } catch (err) {
    console.warn('Network error fetching products from Supabase:', err);
  }

  return loadProducts();
}

export async function upsertProductRemote(product: Product): Promise<void> {
  // Update local store immediately for instant UI response
  const localList = loadProducts();
  const existingIdx = localList.findIndex((p) => p.id === product.id);
  const updatedList = existingIdx >= 0
    ? localList.map((p) => (p.id === product.id ? product : p))
    : [product, ...localList];
  saveProducts(updatedList);

  if (!isSupabaseConfigured) return;

  try {
    const row = productToRow(product);
    const { error } = await supabase
      .from('store_products')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting product to Supabase:', error);
    }
  } catch (err) {
    console.error('Network error during Supabase product upsert:', err);
  }
}

export async function deleteProductRemote(productId: string): Promise<void> {
  const localList = loadProducts();
  const updatedList = localList.filter((p) => p.id !== productId);
  saveProducts(updatedList);

  if (!isSupabaseConfigured) return;

  try {
    const { error } = await supabase
      .from('store_products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product from Supabase:', error);
    }
  } catch (err) {
    console.error('Network error during Supabase product deletion:', err);
  }
}

// ==============================================================================
// STORE SERVICE: VIDEOS
// ==============================================================================
export async function fetchVideosRemote(): Promise<VideoItem[]> {
  if (!isSupabaseConfigured) {
    return loadVideos();
  }

  try {
    const { data, error } = await supabase
      .from('store_videos')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.warn('Supabase fetchVideos warning, using local cache:', error.message);
      return loadVideos();
    }

    if (data && data.length > 0) {
      const mapped = data.map(rowToVideo);
      saveVideos(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Network error fetching videos from Supabase:', err);
  }

  return loadVideos();
}

export async function syncVideosRemote(videos: VideoItem[]): Promise<void> {
  saveVideos(videos);

  if (!isSupabaseConfigured) return;

  try {
    const rows = videos.map(videoToRow);
    const { error } = await supabase
      .from('store_videos')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('Error syncing videos to Supabase:', error);
    }
  } catch (err) {
    console.error('Network error during Supabase videos sync:', err);
  }
}

export async function deleteVideoRemote(videoId: string): Promise<void> {
  const localList = loadVideos();
  const updatedList = localList
    .filter((v) => v.id !== videoId)
    .map((v, i) => ({ ...v, order: i + 1 }));
  saveVideos(updatedList);

  if (!isSupabaseConfigured) return;

  try {
    const { error } = await supabase
      .from('store_videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      console.error('Error deleting video from Supabase:', error);
    }
  } catch (err) {
    console.error('Network error deleting video from Supabase:', err);
  }
}

// ==============================================================================
// STORE SERVICE: SETTINGS
// ==============================================================================
export async function fetchStoreSettingsRemote(): Promise<StoreSettings> {
  if (!isSupabaseConfigured) {
    return loadStoreSettings();
  }

  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetchStoreSettings warning, using local cache:', error.message);
      return loadStoreSettings();
    }

    if (data) {
      const mapped: StoreSettings = {
        whatsappPhone: data.whatsapp_phone,
        storeName: data.store_name,
        tagline: data.tagline,
        city: data.city,
        addresses: Array.isArray(data.addresses) ? data.addresses : [],
        openingHours: data.opening_hours,
        warrantyText: data.warranty_text,
        deliveryFee: data.delivery_fee,
        adminPin: data.admin_pin || '2025'
      };
      saveStoreSettings(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Network error fetching store settings from Supabase:', err);
  }

  return loadStoreSettings();
}

export async function saveStoreSettingsRemote(settings: StoreSettings): Promise<void> {
  saveStoreSettings(settings);

  if (!isSupabaseConfigured) return;

  try {
    const row = {
      id: 'default',
      store_name: settings.storeName,
      whatsapp_phone: settings.whatsappPhone,
      tagline: settings.tagline,
      city: settings.city,
      addresses: settings.addresses,
      opening_hours: settings.openingHours,
      warranty_text: settings.warrantyText,
      delivery_fee: settings.deliveryFee,
      admin_pin: settings.adminPin,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('store_settings')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Error saving store settings to Supabase:', error);
    }
  } catch (err) {
    console.error('Network error saving store settings to Supabase:', err);
  }
}

// ==============================================================================
// STORE SERVICE: ORDERS & CHECKOUT
// ==============================================================================
export async function fetchOrdersRemote(): Promise<StoreOrder[]> {
  if (!isSupabaseConfigured) {
    return loadOrders();
  }

  try {
    const { data: ordersData, error: ordersErr } = await supabase
      .from('store_orders')
      .select(`
        id,
        order_number,
        created_at,
        customer_name,
        customer_phone,
        commune,
        subtotal,
        delivery_fee,
        total,
        status,
        payment_method,
        notes,
        store_order_items (
          product_id,
          product_name,
          product_image,
          chosen_storage,
          chosen_color,
          quantity,
          unit_price
        )
      `)
      .order('created_at', { ascending: false });

    if (ordersErr) {
      console.warn('Supabase fetchOrders error, falling back to local orders:', ordersErr.message);
      return loadOrders();
    }

    if (ordersData && ordersData.length > 0) {
      const mappedOrders: StoreOrder[] = ordersData.map((row: any) => ({
        id: row.id,
        orderNumber: row.order_number,
        createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        customerName: row.customer_name,
        customerPhone: row.customer_phone || undefined,
        commune: row.commune,
        subtotal: Number(row.subtotal),
        deliveryFee: Number(row.delivery_fee),
        total: Number(row.total),
        status: row.status as OrderStatus,
        paymentMethod: row.payment_method,
        notes: row.notes || undefined,
        items: Array.isArray(row.store_order_items)
          ? row.store_order_items.map((it: any) => ({
              productId: it.product_id,
              productName: it.product_name,
              productImage: it.product_image || '',
              chosenStorage: it.chosen_storage || '',
              chosenColor: it.chosen_color || '',
              quantity: Number(it.quantity),
              unitPrice: Number(it.unit_price)
            }))
          : []
      }));

      saveOrders(mappedOrders);
      return mappedOrders;
    }
  } catch (err) {
    console.warn('Network error fetching orders from Supabase:', err);
  }

  return loadOrders();
}

export async function createOrderRemote(orderData: Omit<StoreOrder, 'id' | 'orderNumber' | 'createdAt'>): Promise<StoreOrder> {
  const currentOrders = loadOrders();
  const nextNum = currentOrders.length + 1;
  const tempId = `ord-${Date.now()}`;
  const tempOrderNumber = `OMR-${String(nextNum).padStart(4, '0')}`;

  let finalOrder: StoreOrder = {
    ...orderData,
    id: tempId,
    orderNumber: tempOrderNumber,
    createdAt: Date.now(),
    deliveryFee: 0,
    commune: orderData.commune || 'Retrait en boutique OUMAR IPHONE',
    paymentMethod: 'Paiement au retrait en boutique',
    total: orderData.subtotal // Retrait boutique sans frais
  };

  // 1. If Supabase configured, execute secure atomic server-side RPC validation
  if (isSupabaseConfigured) {
    try {
      const rpcPayload = {
        p_customer_name: finalOrder.customerName,
        p_customer_phone: finalOrder.customerPhone || null,
        p_notes: finalOrder.notes || null,
        p_items: finalOrder.items.map((it) => ({
          product_id: it.productId,
          chosen_storage: it.chosenStorage,
          chosen_color: it.chosenColor,
          quantity: it.quantity
        }))
      };

      const { data: rpcData, error: rpcError } = await supabase.rpc('create_store_order', rpcPayload);

      if (!rpcError && rpcData && rpcData.success) {
        finalOrder = {
          ...finalOrder,
          id: rpcData.order_id,
          orderNumber: rpcData.order_number,
          total: Number(rpcData.total)
        };
      } else {
        // Fallback to direct insertion if RPC function is not yet created in Supabase
        const orderRow = {
          id: finalOrder.id,
          order_number: finalOrder.orderNumber,
          customer_name: finalOrder.customerName,
          customer_phone: finalOrder.customerPhone || null,
          commune: finalOrder.commune,
          subtotal: finalOrder.subtotal,
          delivery_fee: 0,
          total: finalOrder.total,
          status: 'pending',
          payment_method: 'Paiement au retrait en boutique',
          notes: finalOrder.notes || null,
          created_at: new Date(finalOrder.createdAt).toISOString()
        };

        const { error: orderError } = await supabase
          .from('store_orders')
          .insert(orderRow);

        if (!orderError && finalOrder.items.length > 0) {
          const itemRows = finalOrder.items.map((it) => ({
            order_id: finalOrder.id,
            product_id: it.productId,
            product_name: it.productName,
            product_image: it.productImage,
            chosen_storage: it.chosenStorage,
            chosen_color: it.chosenColor,
            quantity: it.quantity,
            unit_price: it.unitPrice
          }));

          await supabase.from('store_order_items').insert(itemRows);
        }
      }
    } catch (err) {
      console.error('Network error during Supabase order creation:', err);
    }
  }

  // 2. Save locally immediately for fast UI feedback
  const updatedOrders = [finalOrder, ...currentOrders];
  saveOrders(updatedOrders);

  return finalOrder;
}

export async function updateOrderStatusRemote(orderId: string, status: OrderStatus): Promise<void> {
  const currentOrders = loadOrders();
  const updated = currentOrders.map((ord) =>
    ord.id === orderId ? { ...ord, status } : ord
  );
  saveOrders(updated);

  if (!isSupabaseConfigured) return;

  try {
    const { error } = await supabase
      .from('store_orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status in Supabase:', error);
    }
  } catch (err) {
    console.error('Network error updating order status in Supabase:', err);
  }
}

export async function deleteOrderRemote(orderId: string): Promise<void> {
  const currentOrders = loadOrders();
  const updated = currentOrders.filter((ord) => ord.id !== orderId);
  saveOrders(updated);

  if (!isSupabaseConfigured) return;

  try {
    const { error } = await supabase
      .from('store_orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('Error deleting order from Supabase:', error);
    }
  } catch (err) {
    console.error('Network error deleting order from Supabase:', err);
  }
}

// ==============================================================================
// INITIAL SYNC & MIGRATION TOOL: PUSH LOCAL DATA TO SUPABASE
// ==============================================================================
export interface SyncMigrationResult {
  success: boolean;
  message: string;
  details?: {
    productsCount: number;
    videosCount: number;
    settingsSynced: boolean;
  };
}

export async function syncLocalDataToSupabase(
  products: Product[],
  videos: VideoItem[],
  settings: StoreSettings
): Promise<SyncMigrationResult> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: 'Supabase n’est pas configuré. Veuillez renseigner VITE_SUPABASE_ANON_KEY dans votre fichier .env.'
    };
  }

  try {
    // 1. Sync Settings
    const settingsRow = {
      id: 'default',
      store_name: settings.storeName,
      whatsapp_phone: settings.whatsappPhone,
      tagline: settings.tagline,
      city: settings.city,
      addresses: settings.addresses,
      opening_hours: settings.openingHours,
      warranty_text: settings.warrantyText,
      delivery_fee: settings.deliveryFee,
      admin_pin: settings.adminPin,
      updated_at: new Date().toISOString()
    };

    const { error: settingsError } = await supabase
      .from('store_settings')
      .upsert(settingsRow, { onConflict: 'id' });

    if (settingsError) {
      if (settingsError.code === '42P01' || settingsError.message.includes('store_settings')) {
        return {
          success: false,
          message: 'Les tables "store_*" n’existent pas encore dans Supabase. Veuillez d’abord exécuter la migration SQL.'
        };
      }
      throw new Error(`Erreur sync paramètres: ${settingsError.message}`);
    }

    // 2. Sync Products
    const productRows = products.map(productToRow);
    const { error: productsError } = await supabase
      .from('store_products')
      .upsert(productRows, { onConflict: 'id' });

    if (productsError) {
      throw new Error(`Erreur sync produits: ${productsError.message}`);
    }

    // 3. Sync Videos
    const videoRows = videos.map(videoToRow);
    const { error: videosError } = await supabase
      .from('store_videos')
      .upsert(videoRows, { onConflict: 'id' });

    if (videosError) {
      throw new Error(`Erreur sync vidéos: ${videosError.message}`);
    }

    return {
      success: true,
      message: `Synchronisation réussie ! ${products.length} produit(s) et ${videos.length} vidéo(s) enregistrés dans Supabase.`,
      details: {
        productsCount: products.length,
        videosCount: videos.length,
        settingsSynced: true
      }
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Erreur inconnue lors de la synchronisation Supabase.'
    };
  }
}

// ==============================================================================
// STORE ADMINS MANAGEMENT (RBAC: Superadmin)
// ==============================================================================
export interface StoreAdminUser {
  id: string;
  user_id?: string;
  email: string;
  role: 'superadmin' | 'admin' | 'manager';
  phone?: string;
  is_active: boolean;
  created_at?: string;
}

export async function fetchStoreAdminsRemote(): Promise<StoreAdminUser[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('store_admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as StoreAdminUser[];
    }
  } catch (e) {
    console.warn('Error fetching store_admins:', e);
  }
  return [];
}

export async function addStoreAdminRemote(newAdmin: {
  email: string;
  role: 'superadmin' | 'admin' | 'manager';
  phone?: string;
}): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Supabase n’est pas configuré.' };
  }

  try {
    const { error } = await supabase
      .from('store_admins')
      .insert({
        email: newAdmin.email.trim().toLowerCase(),
        role: newAdmin.role,
        phone: newAdmin.phone?.trim() || null,
        is_active: true
      });

    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: `Administrateur ${newAdmin.email} ajouté avec succès.` };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Erreur inconnue.' };
  }
}

export async function toggleStoreAdminActiveRemote(adminId: string, isActive: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('store_admins')
      .update({ is_active: isActive })
      .eq('id', adminId);

    return !error;
  } catch {
    return false;
  }
}

export async function deleteStoreAdminRemote(adminId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('store_admins')
      .delete()
      .eq('id', adminId);

    return !error;
  } catch {
    return false;
  }
}

