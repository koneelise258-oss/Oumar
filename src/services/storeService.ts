import { supabase, isSupabaseConfigured, testSupabaseHealth } from '../lib/supabase';
export { testSupabaseHealth };
import { Product, VideoItem, ProductVariant } from '../types';
import { StoreOrder, OrderStatus, loadOrders, saveOrders } from '../data/orders';
import { StoreSettings, loadStoreSettings, saveStoreSettings, getHeroCustomPhoto, saveHeroCustomPhoto } from '../data/storeSettings';
import { loadProducts, saveProducts, DEFAULT_PRODUCTS } from '../data/products';
import { loadVideos, saveVideos } from '../data/videos';

// ==============================================================================
// PRODUCT & VARIANT MAPPERS (public.store_products & public.store_product_variants)
// ==============================================================================
export function rowToVariant(row: any): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    color: row.color,
    colorHex: row.color_hex || undefined,
    storage: row.storage,
    condition: row.condition,
    price: Number(row.price),
    imageUrl: row.image_url || undefined,
    inStock: row.in_stock !== false,
    published: row.published !== false,
    priceSource: row.price_source || undefined,
    priceCheckedAt: row.price_checked_at || undefined,
    sourceUrl: row.source_url || undefined
  };
}

export function variantToRow(v: ProductVariant): any {
  const row: any = {
    product_id: v.productId,
    color: v.color,
    color_hex: v.colorHex || null,
    storage: v.storage,
    condition: v.condition,
    price: Math.round(v.price),
    image_url: v.imageUrl || null,
    in_stock: v.inStock !== false,
    published: v.published !== false,
    price_source: v.priceSource || null,
    price_checked_at: v.priceCheckedAt || new Date().toISOString(),
    source_url: v.sourceUrl || null
  };
  if (v.id) row.id = v.id;
  return row;
}

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
    published: row.published !== false,
    variants: []
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
// STORE SERVICE: PRODUCTS & VARIANTS
// ==============================================================================
export async function fetchProductsRemote(): Promise<Product[]> {
  if (!isSupabaseConfigured) {
    return loadProducts();
  }

  try {
    const { data: prodsData, error: prodsErr } = await supabase
      .from('store_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (prodsErr) {
      console.warn('Supabase fetchProducts warning, using local cache:', prodsErr.message);
      return loadProducts();
    }

    // Query published variants from public.store_product_variants
    let variantsList: ProductVariant[] = [];
    try {
      const { data: varsData } = await supabase
        .from('store_product_variants')
        .select('*');

      if (varsData && Array.isArray(varsData)) {
        variantsList = varsData.map(rowToVariant);
      }
    } catch (vErr) {
      console.warn('store_product_variants table query note:', vErr);
    }

    if (prodsData) {
      const mapped = prodsData.map((row) => {
        const prod = rowToProduct(row);
        prod.variants = variantsList.filter((v) => v.productId === prod.id);
        return prod;
      });
      saveProducts(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Network error fetching products from Supabase:', err);
  }

  return loadProducts();
}

export async function fetchProductVariantsRemote(productId?: string): Promise<ProductVariant[]> {
  if (!isSupabaseConfigured) return [];
  try {
    let query = supabase.from('store_product_variants').select('*');
    if (productId) {
      query = query.eq('product_id', productId);
    }
    const { data, error } = await query;
    if (!error && data) {
      return data.map(rowToVariant);
    }
  } catch (e) {
    console.warn('Error fetching variants from Supabase:', e);
  }
  return [];
}

export async function upsertProductVariantRemote(variant: ProductVariant): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const row = variantToRow(variant);
    const { error } = await supabase
      .from('store_product_variants')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting variant to Supabase:', error);
      return { success: false, message: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Erreur réseau.' };
  }
}

export async function deleteProductVariantRemote(variantId: string): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const { error } = await supabase
      .from('store_product_variants')
      .delete()
      .eq('id', variantId);
    return { success: !error, message: error?.message };
  } catch (err: any) {
    return { success: false, message: err?.message };
  }
}

export async function upsertProductRemote(product: Product): Promise<{ success: boolean; message?: string }> {
  if (!product.name || !product.name.trim()) {
    return { success: false, message: 'Le nom du produit est obligatoire.' };
  }
  if (!product.image || !product.image.trim()) {
    return { success: false, message: 'L’image du produit est obligatoire.' };
  }
  if (typeof product.price !== 'number' || isNaN(product.price) || product.price < 0) {
    return { success: false, message: 'Le prix doit être un nombre positif.' };
  }

  if (!isSupabaseConfigured) {
    const localList = loadProducts();
    const existingIdx = localList.findIndex((p) => p.id === product.id);
    const updatedList = existingIdx >= 0
      ? localList.map((p) => (p.id === product.id ? product : p))
      : [product, ...localList];
    saveProducts(updatedList);
    return { success: true };
  }

  try {
    const row = productToRow(product);
    const { error } = await supabase
      .from('store_products')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting product to Supabase:', error);
      return { success: false, message: `Échec de l'enregistrement en ligne: ${error.message}` };
    }

    const localList = loadProducts();
    const existingIdx = localList.findIndex((p) => p.id === product.id);
    const updatedList = existingIdx >= 0
      ? localList.map((p) => (p.id === product.id ? product : p))
      : [product, ...localList];
    saveProducts(updatedList);
    return { success: true };
  } catch (err: any) {
    console.error('Network error during Supabase product upsert:', err);
    return { success: false, message: err?.message || 'Erreur réseau lors de l’enregistrement du produit.' };
  }
}

export async function deleteProductRemote(productId: string): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured) {
    const localList = loadProducts().filter((p) => p.id !== productId);
    saveProducts(localList);
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('store_products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product from Supabase:', error);
      return { success: false, message: `Échec de la suppression en ligne: ${error.message}` };
    }

    const localList = loadProducts().filter((p) => p.id !== productId);
    saveProducts(localList);
    return { success: true };
  } catch (err: any) {
    console.error('Network error during Supabase product deletion:', err);
    return { success: false, message: err?.message || 'Erreur réseau lors de la suppression.' };
  }
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

    if (data) {
      // Never present Google sample clips as official store content.
      const mapped = data
        .map(rowToVideo)
        .filter((video) => !video.url.includes('commondatastorage.googleapis.com/gtv-videos-bucket/sample/'));
      saveVideos(mapped); // Cache mapped array, including an empty array
      return mapped;
    }
  } catch (err) {
    console.warn('Network error fetching videos from Supabase:', err);
  }

  return loadVideos();
}

export async function syncVideosRemote(videos: VideoItem[]): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured) {
    saveVideos(videos);
    return { success: true };
  }

  try {
    const rows = videos.map(videoToRow);
    const { error } = await supabase
      .from('store_videos')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('Error syncing videos to Supabase:', error);
      return { success: false, message: `Échec de l'enregistrement en ligne: ${error.message}` };
    }

    saveVideos(videos);
    return { success: true };
  } catch (err: any) {
    console.error('Network error during Supabase videos sync:', err);
    return { success: false, message: err?.message || 'Erreur réseau lors de la mise à jour des vidéos.' };
  }
}

export async function deleteVideoRemote(videoId: string): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured) {
    const localList = loadVideos()
      .filter((v) => v.id !== videoId)
      .map((v, i) => ({ ...v, order: i + 1 }));
    saveVideos(localList);
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('store_videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      console.error('Error deleting video from Supabase:', error);
      return { success: false, message: `Échec de la suppression en ligne: ${error.message}` };
    }

    const localList = loadVideos()
      .filter((v) => v.id !== videoId)
      .map((v, i) => ({ ...v, order: i + 1 }));
    saveVideos(localList);
    return { success: true };
  } catch (err: any) {
    console.error('Network error deleting video from Supabase:', err);
    return { success: false, message: err?.message || 'Erreur réseau lors de la suppression de la vidéo.' };
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
        deliveryFee: data.delivery_fee
      };

      // Si Supabase contient une photo personnalisée pour le Hero, la synchroniser localement
      if (data.hero_photo_custom !== undefined) {
        saveHeroCustomPhoto(data.hero_photo_custom);
      }

      saveStoreSettings(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Network error fetching store settings from Supabase:', err);
  }

  return loadStoreSettings();
}

export async function saveStoreSettingsRemote(settings: StoreSettings): Promise<{ success: boolean; message?: string }> {
  const currentHeroPhoto = getHeroCustomPhoto();

  if (!isSupabaseConfigured) {
    saveStoreSettings(settings);
    return { success: true };
  }

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
      hero_photo_custom: currentHeroPhoto,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('store_settings')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Error saving store settings to Supabase:', error);
      return { success: false, message: `Échec de l'enregistrement en ligne: ${error.message}` };
    }

    saveStoreSettings(settings);
    return { success: true };
  } catch (err: any) {
    console.error('Network error saving store settings to Supabase:', err);
    return { success: false, message: err?.message || 'Erreur réseau lors de l’enregistrement des paramètres.' };
  }
}

export async function syncHeroPhotoRemote(photoDataUrl: string | null): Promise<boolean> {
  saveHeroCustomPhoto(photoDataUrl);
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from('store_settings')
      .update({
        hero_photo_custom: photoDataUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'default');

    if (error) {
      console.warn('Impossible de synchroniser la photo hero en ligne:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Erreur réseau sync hero photo:', e);
    return false;
  }
}

/**
 * Initialise le catalogue officiel Apple (les 6 modèles réels avec caractéristiques certifiées)
 * directement dans la boutique en ligne sans aucune donnée fictive.
 */
export async function seedOfficialAppleProductsRemote(): Promise<{
  success: boolean;
  message: string;
  count: number;
}> {
  if (!isSupabaseConfigured) {
    saveProducts(DEFAULT_PRODUCTS);
    return {
      success: true,
      message: 'Catalogue officiel Apple restauré dans la mémoire locale.',
      count: DEFAULT_PRODUCTS.length
    };
  }

  try {
    const rows = DEFAULT_PRODUCTS.map(productToRow);
    const { error } = await supabase
      .from('store_products')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      return {
        success: false,
        message: `Erreur lors du chargement du catalogue officiel : ${error.message}`,
        count: 0
      };
    }

    saveProducts(DEFAULT_PRODUCTS);
    return {
      success: true,
      message: `${DEFAULT_PRODUCTS.length} produits certifiés Apple (iPhone, iPad, MacBook, AirPods) chargés avec succès !`,
      count: DEFAULT_PRODUCTS.length
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Erreur réseau.',
      count: 0
    };
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
  if (!isSupabaseConfigured) {
    throw new Error("Supabase n'est pas configuré. Impossible d'enregistrer la réservation sur le serveur.");
  }

  const rpcPayload = {
    p_customer_name: orderData.customerName,
    p_customer_phone: orderData.customerPhone || null,
    p_notes: orderData.notes || null,
    p_items: orderData.items.map((it) => ({
      product_id: it.productId,
      chosen_storage: it.chosenStorage,
      chosen_color: it.chosenColor,
      quantity: it.quantity
    }))
  };

  const { data: rpcData, error: rpcError } = await supabase.rpc('create_store_order', rpcPayload);

  if (rpcError) {
    console.error('Erreur lors de l’appel de la fonction RPC create_store_order:', rpcError);
    throw new Error(rpcError.message || "Échec de l'enregistrement de la réservation sur le serveur.");
  }

  if (!rpcData || !rpcData.success) {
    const errorMsg = rpcData?.message || "La réservation n'a pas pu être confirmée par la base de données.";
    throw new Error(errorMsg);
  }

  // Construction de l'objet de commande à partir des données confirmées par le serveur (numéro OMR-xxxx et total réel)
  const confirmedOrder: StoreOrder = {
    id: rpcData.order_id,
    orderNumber: rpcData.order_number,
    createdAt: Date.now(),
    customerName: orderData.customerName,
    customerPhone: orderData.customerPhone,
    commune: 'Retrait en boutique OUMAR IPHONE',
    subtotal: Number(rpcData.total),
    deliveryFee: 0,
    total: Number(rpcData.total),
    status: 'pending',
    paymentMethod: 'Paiement au retrait en boutique',
    notes: orderData.notes,
    items: orderData.items
  };

  // Sauvegarde locale uniquement après confirmation serveur officielle
  const currentOrders = loadOrders();
  saveOrders([confirmedOrder, ...currentOrders]);

  return confirmedOrder;
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
      message: 'Le serveur en ligne n’est pas configuré. Veuillez contacter l’administrateur.'
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
      updated_at: new Date().toISOString()
    };

    const { error: settingsError } = await supabase
      .from('store_settings')
      .upsert(settingsRow, { onConflict: 'id' });

    if (settingsError) {
      if (settingsError.code === '42P01' || settingsError.message.includes('store_settings')) {
        return {
          success: false,
          message: 'Les rubriques de la boutique ne sont pas encore créées sur le serveur. Veuillez exécuter le script d’initialisation.'
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
      message: `Mise à jour réussie ! ${products.length} produit(s) et ${videos.length} vidéo(s) enregistrés sur la boutique en ligne.`,
      details: {
        productsCount: products.length,
        videosCount: videos.length,
        settingsSynced: true
      }
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Erreur lors de la synchronisation avec le serveur distant.'
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
    const { data, error } = await supabase.rpc('add_store_admin_by_email', {
      p_email: newAdmin.email.trim().toLowerCase(),
      p_role: newAdmin.role,
      p_phone: newAdmin.phone?.trim() || null
    });

    if (error) {
      return { success: false, message: `Erreur de traitement: ${error.message}` };
    }

    if (data && typeof data === 'object' && 'success' in data) {
      if (!data.success) {
        return { success: false, message: data.message || 'L’utilisateur n’a pas pu être ajouté.' };
      }
      return { success: true, message: data.message || `Administrateur ${newAdmin.email} associé avec succès.` };
    }

    return { success: true, message: `Administrateur ${newAdmin.email} traité avec succès.` };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Erreur inconnue lors de l’ajout.' };
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

