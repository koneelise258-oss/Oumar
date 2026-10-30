import React, { useState, useRef, useEffect } from 'react';
import { 
  Product, 
  ProductCategory, 
  ProductColor,
  VideoItem 
} from '../types';
import { 
  StoreOrder, 
  OrderStatus, 
  loadOrders, 
  saveOrders, 
  updateOrderStatus, 
  deleteOrder, 
  resetOrders 
} from '../data/orders';
import { 
  StoreSettings, 
  loadStoreSettings, 
  saveStoreSettings, 
  setAdminAuthenticated,
  getAdminEmail,
  getWhatsAppUrl,
  getHeroCustomPhoto,
  saveHeroCustomPhoto,
  getHeroSettings,
  saveHeroSettings,
  HeroSettings,
  DEFAULT_HERO_SETTINGS
} from '../data/storeSettings';
import heroTitaniumSample from '../assets/images/hero_iphone_titanium_1792367905192.jpg';
import { loadProducts, saveProducts, resetProducts } from '../data/products';
import { processAndUploadProductImage, APPLE_ASSET_IMAGES } from '../services/imageService';
import { saveVideos, resetVideos } from '../data/videos';
import {
  upsertProductRemote,
  deleteProductRemote,
  syncVideosRemote,
  deleteVideoRemote,
  saveStoreSettingsRemote,
  syncHeroPhotoRemote,
  seedOfficialAppleProductsRemote,
  updateOrderStatusRemote,
  deleteOrderRemote,
  fetchOrdersRemote,
  syncLocalDataToSupabase,
  testSupabaseHealth,
  SyncMigrationResult,
  fetchStoreAdminsRemote,
  addStoreAdminRemote,
  toggleStoreAdminActiveRemote,
  deleteStoreAdminRemote,
  StoreAdminUser
} from '../services/storeService';
import { SUPABASE_PROJECT_ID, isSupabaseConfigured, supabaseUrl, signOutAdmin, checkIsUserAdmin, StoreAdminRecord } from '../lib/supabase';
import { SUPABASE_MIGRATION_SQL } from '../db/migrationSql';
import {
  X,
  Package,
  Video,
  ShoppingBag,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Upload,
  Check,
  RotateCcw,
  Search,
  MessageCircle,
  Clock,
  MapPin,
  ShieldCheck,
  DollarSign,
  Phone,
  Lock,
  LogOut,
  ExternalLink,
  ChevronDown,
  AlertTriangle,
  Sparkles,
  Smartphone,
  Database,
  Cloud,
  RefreshCw,
  FileCode,
  CheckCheck,
  Server,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Palette,
  Image as ImageIcon,
  Monitor,
  Save
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductsUpdated: (products: Product[]) => void;
  videos: VideoItem[];
  onVideosUpdated: (videos: VideoItem[]) => void;
}

type AdminTab = 'products' | 'videos' | 'orders' | 'hero' | 'settings' | 'admins';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  products,
  onProductsUpdated,
  videos,
  onVideosUpdated
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [orders, setOrders] = useState<StoreOrder[]>(loadOrders);
  const [settings, setSettings] = useState<StoreSettings>(loadStoreSettings);

  // Success / notification message
  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Sync orders & settings from events
  useEffect(() => {
    const handleOrdersUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setOrders(e.detail);
    };
    const handleSettingsUpdate = (e: any) => {
      if (e.detail) setSettings(e.detail);
    };
    window.addEventListener('oumar_orders_updated', handleOrdersUpdate);
    window.addEventListener('oumar_settings_updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('oumar_orders_updated', handleOrdersUpdate);
      window.removeEventListener('oumar_settings_updated', handleSettingsUpdate);
    };
  }, []);

  // Supabase Cloud Integration States
  const [supabaseStatus, setSupabaseStatus] = useState<{
    tested: boolean;
    loading: boolean;
    connected: boolean;
    tablesReady: boolean;
    message: string;
  }>({
    tested: false,
    loading: false,
    connected: isSupabaseConfigured,
    tablesReady: false,
    message: isSupabaseConfigured
      ? 'Connexion configurée. Cliquez sur "Tester la connexion en ligne" pour vérifier la boutique.'
      : 'Boutique active en mode autonome (catalogue et données enregistrés localement).'
  });
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncMigrationResult | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const [currentAdminRecord, setCurrentAdminRecord] = useState<StoreAdminRecord | null>(null);
  const [isSessionValidating, setIsSessionValidating] = useState<boolean>(true);

  // Background fetch remote orders and verify active admin session when dashboard opens
  useEffect(() => {
    if (isOpen) {
      setIsSessionValidating(true);
      checkIsUserAdmin().then((res) => {
        setIsSessionValidating(false);
        if (!res.isAdmin || !res.record) {
          handleLogout();
          alert(res.error || "Session administrateur expirée ou compte non autorisé.");
          return;
        }
        setCurrentAdminRecord(res.record);
      }).catch(() => {
        setIsSessionValidating(false);
      });

      fetchOrdersRemote()
        .then((remoteOrders) => {
          if (remoteOrders && remoteOrders.length > 0) {
            setOrders(remoteOrders);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleTestSupabase = async () => {
    setSupabaseStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await testSupabaseHealth();
      setSupabaseStatus({
        tested: true,
        loading: false,
        connected: res.isConnected,
        tablesReady: res.tablesReady,
        message: res.message
      });
      triggerNotification(res.tablesReady ? 'Connexion au serveur opérationnelle !' : 'Vérification de la connexion terminée');
    } catch (e: any) {
      setSupabaseStatus({
        tested: true,
        loading: false,
        connected: false,
        tablesReady: false,
        message: `Erreur: ${e?.message || 'Échec du test'}`
      });
    }
  };

  const handleSyncToSupabase = async () => {
    if (!isSupabaseConfigured) {
      alert("La configuration du serveur distant n'est pas finalisée. Veuillez contacter l'administrateur.");
      return;
    }

    if (!window.confirm("Voulez-vous synchroniser les données de la boutique (catalogue, vidéos et paramètres) avec le serveur en ligne ?")) {
      return;
    }

    setIsSyncingSupabase(true);
    setSyncResult(null);

    try {
      const res = await syncLocalDataToSupabase(products, videos, settings);
      setSyncResult(res);
      if (res.success) {
        triggerNotification('Données de la boutique synchronisées en ligne !');
      }
    } catch (e: any) {
      setSyncResult({
        success: false,
        message: `Erreur de synchronisation: ${e?.message || 'Inconnue'}`
      });
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL);
      setCopiedSql(true);
      triggerNotification('Script d’initialisation copié dans le presse-papier !');
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      // Fallback
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  const [isSeedingCatalog, setIsSeedingCatalog] = useState(false);

  const handleSeedOfficialCatalog = async () => {
    if (!window.confirm("Restaurer les 6 modèles officiels Apple certifiés dans le catalogue ?")) {
      return;
    }
    setIsSeedingCatalog(true);
    try {
      const res = await seedOfficialAppleProductsRemote();
      if (res.success) {
        onProductsUpdated(loadProducts());
        triggerNotification(res.message);
        handleTestSupabase();
      } else {
        triggerNotification(`Erreur d'initialisation : ${res.message}`);
      }
    } catch (e: any) {
      triggerNotification(`Erreur : ${e?.message || 'Échec du peuplement'}`);
    } finally {
      setIsSeedingCatalog(false);
    }
  };

  // ==========================================
  // TAB 1: PRODUCT MANAGEMENT STATES
  // ==========================================
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState<string>('Tous');
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'inStock' | 'outOfStock'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productDeleteConfirmId, setProductDeleteConfirmId] = useState<string | null>(null);
  const productImageInputRef = useRef<HTMLInputElement>(null);

  // Product Form Working State
  const [formProduct, setFormProduct] = useState<Partial<Product>>({});
  const [newStorageInput, setNewStorageInput] = useState('');
  const [newStoragePriceInput, setNewStoragePriceInput] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#232528');

  const openNewProductForm = () => {
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: '',
      model: '',
      category: 'iPhone',
      condition: 'Neuf scellé',
      storage: ['128 Go', '256 Go', '512 Go'],
      selectedStorage: '256 Go',
      price: 0,
      originalPrice: undefined,
      storagePrices: {},
      colors: [
        { name: 'Titane Noir', hex: '#232528' },
        { name: 'Titane Naturel', hex: '#BEB8AE' }
      ],
      selectedColor: 'Titane Noir',
      image: APPLE_ASSET_IMAGES.iphone16ProMax,
      gallery: [],
      batteryHealth: '100%',
      warranty: 'Garantie Apple 1 an',
      inStock: true,
      stockLocation: 'Boutique Cocody & Plateau',
      featured: false,
      isNew: true,
      description: 'Appareil Apple authentique sous blister d’origine avec facture certifiée et garantie 1 an.',
      specs: {
        screen: 'Super Retina XDR OLED',
        chip: 'Puce Apple silicon',
        camera: 'Système photo Apple pro',
        battery: 'Autonomie longue durée',
        ports: 'USB-C',
        boxContents: 'Appareil avec câble USB-C tissé, documentation'
      },
      published: true
    };
    setFormProduct(newProd);
    setIsCreatingProduct(true);
    setEditingProduct(null);
  };

  const openEditProductForm = (prod: Product) => {
    setFormProduct({ ...prod });
    setEditingProduct(prod);
    setIsCreatingProduct(false);
  };

  const handleSaveProductForm = async () => {
    if (!formProduct.name || !formProduct.price) {
      alert('Veuillez renseigner au moins le nom et le prix du produit.');
      return;
    }

    const completeProduct = formProduct as Product;
    const res = await upsertProductRemote(completeProduct);

    if (res.success) {
      const updated = isCreatingProduct
        ? [completeProduct, ...products]
        : products.map((p) => (p.id === completeProduct.id ? completeProduct : p));
      onProductsUpdated(updated);
      triggerNotification(`Produit "${completeProduct.name}" enregistré avec succès !`);
      setEditingProduct(null);
      setIsCreatingProduct(false);
    } else {
      triggerNotification(`Échec de l'enregistrement : ${res.message || 'Erreur inconnue'}`);
    }
  };

  const handleDuplicateProduct = async (p: Product) => {
    const clone: Product = {
      ...p,
      id: `prod-copy-${Date.now()}`,
      name: `${p.name} (Copie)`,
      featured: false
    };
    const res = await upsertProductRemote(clone);
    if (res.success) {
      const updated = [clone, ...products];
      onProductsUpdated(updated);
      triggerNotification(`Copie créée pour "${p.name}"`);
    } else {
      triggerNotification(`Échec de la duplication : ${res.message}`);
    }
  };

  const handleToggleProductPublish = async (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const updatedProd = { ...target, published: target.published !== false ? false : true };
    const res = await upsertProductRemote(updatedProd);
    if (res.success) {
      const updated = products.map((p) => (p.id === id ? updatedProd : p));
      onProductsUpdated(updated);
    } else {
      triggerNotification(`Impossible de modifier la visibilité : ${res.message}`);
    }
  };

  const handleToggleProductStock = async (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const updatedProd = { ...target, inStock: !target.inStock };
    const res = await upsertProductRemote(updatedProd);
    if (res.success) {
      const updated = products.map((p) => (p.id === id ? updatedProd : p));
      onProductsUpdated(updated);
      triggerNotification('Statut de stock modifié');
    } else {
      triggerNotification(`Impossible d'actualiser le stock : ${res.message}`);
    }
  };

  const handleMoveProduct = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= products.length) return;
    const clone = [...products];
    const [moved] = clone.splice(index, 1);
    clone.splice(targetIndex, 0, moved);
    onProductsUpdated(clone);
    saveProducts(clone);
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await deleteProductRemote(id);
    if (res.success) {
      const updated = products.filter((p) => p.id !== id);
      onProductsUpdated(updated);
      setProductDeleteConfirmId(null);
      triggerNotification('Produit supprimé du catalogue');
    } else {
      triggerNotification(`Échec de la suppression : ${res.message}`);
    }
  };

  const handleResetCatalog = () => {
    if (isSupabaseConfigured) {
      triggerNotification('Réinitialisation groupée désactivée : supprimez les modèles individuellement pour préserver le catalogue.');
      return;
    }
    if (window.confirm('Voulez-vous vraiment vider le catalogue local ?')) {
      const emptyCatalog = resetProducts();
      onProductsUpdated(emptyCatalog);
      triggerNotification('Catalogue local vidé');
    }
  };

  const handleUploadProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        triggerNotification('Optimisation de l’image en cours...');
        const res = await processAndUploadProductImage(file);
        setFormProduct((prev) => ({
          ...prev,
          image: res.url,
          gallery: prev?.gallery ? [res.url, ...prev.gallery.filter((g) => g !== res.url)] : [res.url]
        }));
        triggerNotification(res.message || 'Image ajoutée au produit !');
      } catch (err: any) {
        triggerNotification(`Erreur d’image : ${err?.message || 'Échec du traitement'}`);
      }
    }
  };

  // Add capacity to form
  const handleAddCapacity = () => {
    if (!newStorageInput.trim()) return;
    const cap = newStorageInput.trim();
    const price = parseInt(newStoragePriceInput, 10) || formProduct.price || 0;

    const currentStorage = formProduct.storage || [];
    if (!currentStorage.includes(cap)) {
      setFormProduct((prev) => ({
        ...prev,
        storage: [...currentStorage, cap],
        storagePrices: {
          ...(prev?.storagePrices || {}),
          [cap]: price
        }
      }));
    }
    setNewStorageInput('');
    setNewStoragePriceInput('');
  };

  const handleRemoveCapacity = (cap: string) => {
    setFormProduct((prev) => {
      const newStorage = (prev?.storage || []).filter((s) => s !== cap);
      const newPrices = { ...(prev?.storagePrices || {}) };
      delete newPrices[cap];
      return {
        ...prev,
        storage: newStorage,
        storagePrices: newPrices,
        selectedStorage: prev?.selectedStorage === cap ? newStorage[0] || '' : prev?.selectedStorage
      };
    });
  };

  // Presets de finitions certifiées Apple pour sélection rapide
  const APPLE_COLOR_PRESETS: { name: string; hex: string; image: string }[] = [
    { name: 'Titane Naturel', hex: '#BEB8AE', image: APPLE_ASSET_IMAGES.titaniumNatural },
    { name: 'Titane Désert', hex: '#D4C4B5', image: APPLE_ASSET_IMAGES.titaniumDesert },
    { name: 'Titane Noir', hex: '#3C3B37', image: APPLE_ASSET_IMAGES.titaniumBlack },
    { name: 'Titane Blanc', hex: '#F2F1ED', image: APPLE_ASSET_IMAGES.titaniumWhite },
    { name: 'Titane Bleu', hex: '#2B3545', image: APPLE_ASSET_IMAGES.titaniumBlue },
    { name: 'Rouge (Product RED)', hex: '#D62828', image: APPLE_ASSET_IMAGES.colorRed },
    { name: 'Vert Alpin', hex: '#3B5340', image: APPLE_ASSET_IMAGES.colorGreen },
  ];

  const [newColorImage, setNewColorImage] = useState<string>('');
  const colorFileInputRef = useRef<HTMLInputElement>(null);
  const [activeColorImageUploadIdx, setActiveColorImageUploadIdx] = useState<number | null>(null);

  // Add color to form
  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    const colorObj: ProductColor = { 
      name: newColorName.trim(), 
      hex: newColorHex,
      image: newColorImage.trim() || undefined,
      active: true
    };
    setFormProduct((prev) => ({
      ...prev,
      colors: [...(prev?.colors || []), colorObj]
    }));
    setNewColorName('');
    setNewColorImage('');
  };

  const handleApplyColorPreset = (preset: { name: string; hex: string; image: string }) => {
    setNewColorName(preset.name);
    setNewColorHex(preset.hex);
    setNewColorImage(preset.image);
  };

  const handleUpdateColor = (index: number, updatedFields: Partial<ProductColor>) => {
    setFormProduct((prev) => {
      const clone = [...(prev?.colors || [])];
      if (clone[index]) {
        clone[index] = { ...clone[index], ...updatedFields };
      }
      return { ...prev, colors: clone };
    });
  };

  const handleToggleColorActive = (index: number) => {
    setFormProduct((prev) => {
      const clone = [...(prev?.colors || [])];
      if (clone[index]) {
        const isCurrentlyActive = clone[index].active !== false;
        clone[index] = { ...clone[index], active: !isCurrentlyActive };
      }
      return { ...prev, colors: clone };
    });
  };

  const handleMoveColor = (index: number, direction: 'up' | 'down') => {
    setFormProduct((prev) => {
      const clone = [...(prev?.colors || [])];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= clone.length) return prev;
      const [moved] = clone.splice(index, 1);
      clone.splice(targetIdx, 0, moved);
      return { ...prev, colors: clone };
    });
  };

  const handleRemoveColor = (index: number) => {
    setFormProduct((prev) => ({
      ...prev,
      colors: (prev?.colors || []).filter((_, i) => i !== index)
    }));
  };

  const handleColorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await processAndUploadProductImage(file);
      if (activeColorImageUploadIdx !== null && activeColorImageUploadIdx >= 0) {
        handleUpdateColor(activeColorImageUploadIdx, { image: res.url });
        triggerNotification('Photo de la finition mise à jour avec succès.');
      } else {
        setNewColorImage(res.url);
        triggerNotification('Photo prête pour la nouvelle couleur.');
      }
    } catch (err: any) {
      triggerNotification(`Erreur d'import : ${err?.message || 'Échec de traitement'}`);
    } finally {
      setActiveColorImageUploadIdx(null);
      if (e.target) e.target.value = '';
    }
  };

  // Filtered products in admin
  const filteredProducts = products.filter((p) => {
    if (productCatFilter !== 'Tous' && p.category !== productCatFilter) return false;
    if (productStockFilter === 'inStock' && !p.inStock) return false;
    if (productStockFilter === 'outOfStock' && p.inStock) return false;
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.storage.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // ==========================================
  // TAB 2: VIDEOS MANAGEMENT STATES
  // ==========================================
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoTitleInput, setVideoTitleInput] = useState('');
  const [videoTypeInput, setVideoTypeInput] = useState<'html5' | 'tiktok'>('html5');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [videoDeleteConfirmId, setVideoDeleteConfirmId] = useState<string | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveVideo = async () => {
    if (!videoUrlInput.trim()) return;
    const detectedType = videoUrlInput.includes('tiktok.com') ? 'tiktok' : videoTypeInput;
    const newVid: VideoItem = {
      id: `vid-${Date.now()}`,
      url: videoUrlInput.trim(),
      type: detectedType,
      title: videoTitleInput.trim() || `Vidéo OUMAR IPHONE #${videos.length + 1}`,
      published: true,
      order: videos.length + 1,
      createdAt: Date.now()
    };
    const updated = [newVid, ...videos];
    const res = await syncVideosRemote(updated);
    if (res.success) {
      onVideosUpdated(updated);
      setVideoUrlInput('');
      setVideoTitleInput('');
      setIsAddingVideo(false);
      triggerNotification('Nouvelle vidéo ajoutée');
    } else {
      triggerNotification(`Impossible d'ajouter la vidéo : ${res.message}`);
    }
  };

  const handleToggleVideoPublish = async (id: string) => {
    const updated = videos.map((v) =>
      v.id === id ? { ...v, published: !v.published } : v
    );
    const res = await syncVideosRemote(updated);
    if (res.success) {
      onVideosUpdated(updated);
    } else {
      triggerNotification(`Impossible de modifier la vidéo : ${res.message}`);
    }
  };

  const handleMoveVideo = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= videos.length) return;
    const clone = [...videos];
    const [moved] = clone.splice(index, 1);
    clone.splice(targetIndex, 0, moved);
    const reordered = clone.map((v, i) => ({ ...v, order: i + 1 }));
    const res = await syncVideosRemote(reordered);
    if (res.success) {
      onVideosUpdated(reordered);
    } else {
      triggerNotification(`Impossible de réorganiser les vidéos : ${res.message}`);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    const res = await deleteVideoRemote(id);
    if (res.success) {
      const updated = videos
        .filter((v) => v.id !== id)
        .map((v, i) => ({ ...v, order: i + 1 }));
      onVideosUpdated(updated);
      setVideoDeleteConfirmId(null);
      triggerNotification('Vidéo supprimée');
    } else {
      triggerNotification(`Impossible de supprimer la vidéo : ${res.message}`);
    }
  };

  const handleResetVideos = () => {
    if (isSupabaseConfigured) {
      triggerNotification('Réinitialisation groupée désactivée : supprimez les vidéos individuellement pour préserver vos contenus.');
      return;
    }
    if (window.confirm('Voulez-vous vraiment vider la liste des vidéos locales ?')) {
      const emptyVideos = resetVideos();
      onVideosUpdated(emptyVideos);
      triggerNotification('Liste locale des vidéos vidée');
    }
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setVideoUrlInput(dataUrl);
        setVideoTypeInput('html5');
        if (!videoTitleInput) {
          setVideoTitleInput(file.name.replace(/\.[^/.]+$/, ''));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ==========================================
  // TAB 3: ORDERS MANAGEMENT
  // ==========================================
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const filteredOrders = orders.filter((ord) => {
    if (orderStatusFilter === 'all') return true;
    return ord.status === orderStatusFilter;
  });

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, o) => acc + o.total, 0);

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const inDeliveryCount = orders.filter((o) => o.status === 'in_delivery').length;

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
    updateOrderStatusRemote(orderId, status);
    triggerNotification('Statut de la commande actualisé');
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm('Supprimer cette commande de l’historique ?')) {
      deleteOrder(orderId);
      deleteOrderRemote(orderId);
      triggerNotification('Commande supprimée');
    }
  };

  // ==========================================
  // TAB 4: STORE SETTINGS & HERO PHOTO
  // ==========================================
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);

  // Hero Section Photo State
  const [heroPhotoSrc, setHeroPhotoSrc] = useState<string | null>(getHeroCustomPhoto);
  const [heroPhotoUrlInput, setHeroPhotoUrlInput] = useState('');
  const [heroPhotoPreview, setHeroPhotoPreview] = useState<string | null>(getHeroCustomPhoto);
  const heroPhotoInputRef = useRef<HTMLInputElement>(null);

  // Sync heroPhotoSrc on external update
  useEffect(() => {
    const handlePhotoUpdated = (e: any) => {
      setHeroPhotoSrc(e.detail || null);
      setHeroPhotoPreview(e.detail || null);
    };
    window.addEventListener('oumar_hero_photo_updated', handlePhotoUpdated);
    return () => window.removeEventListener('oumar_hero_photo_updated', handlePhotoUpdated);
  }, []);

  const handleHeroPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        triggerNotification("L'image sélectionnée est trop volumineuse (max 10 Mo).");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setHeroPhotoPreview(dataUrl);
          saveHeroCustomPhoto(dataUrl);
          syncHeroPhotoRemote(dataUrl);
          setHeroPhotoSrc(dataUrl);
          triggerNotification("Photo de la section Hero mise à jour et synchronisée avec succès !");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyHeroPhotoUrl = () => {
    const trimmed = heroPhotoUrlInput.trim();
    if (!trimmed) return;
    setHeroPhotoPreview(trimmed);
    saveHeroCustomPhoto(trimmed);
    syncHeroPhotoRemote(trimmed);
    setHeroPhotoSrc(trimmed);
    setHeroPhotoUrlInput('');
    triggerNotification("Photo de la section Hero mise à jour et synchronisée avec succès !");
  };

  const handleResetHeroPhoto = () => {
    saveHeroCustomPhoto(null);
    syncHeroPhotoRemote(null);
    setHeroPhotoSrc(null);
    setHeroPhotoPreview(null);
    triggerNotification("Photo de l'Hero réinitialisée et synchronisée.");
  };

  const handleSaveStoreSettings = async () => {
    const res = await saveStoreSettingsRemote(settingsForm);
    if (res.success) {
      triggerNotification('Paramètres de la boutique enregistrés !');
    } else {
      triggerNotification(`Échec de l'enregistrement : ${res.message}`);
    }
  };

  // ==========================================
  // TAB: PERSONNALISATION DU SITE → HERO SECTION
  // ==========================================
  const [heroForm, setHeroForm] = useState<HeroSettings>(getHeroSettings);
  const [heroFormSnapshot, setHeroFormSnapshot] = useState<HeroSettings>(getHeroSettings);
  const [heroPreviewMode, setHeroPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroSaveSuccess, setHeroSaveSuccess] = useState(false);

  useEffect(() => {
    const current = getHeroSettings();
    setHeroForm(current);
    setHeroFormSnapshot(current);
  }, [isOpen]);

  const handleSaveHeroSettings = async () => {
    setHeroSaving(true);
    setHeroSaveSuccess(false);
    try {
      saveHeroSettings(heroForm);
      setHeroFormSnapshot(heroForm);
      await saveStoreSettingsRemote({
        ...settingsForm,
        heroSettings: heroForm
      });
      setHeroSaveSuccess(true);
      triggerNotification('Hero Section mise à jour et publiée avec succès !');
      setTimeout(() => setHeroSaveSuccess(false), 5000);
    } catch (err: any) {
      triggerNotification(`Erreur lors de l'enregistrement : ${err?.message || 'Erreur'}`);
    } finally {
      setHeroSaving(false);
    }
  };

  const handleCancelHeroSettings = () => {
    setHeroForm(heroFormSnapshot);
    triggerNotification('Modifications non enregistrées annulées.');
  };

  const handleResetHeroSettingsToDefault = () => {
    if (window.confirm("Rétablir tous les textes d'origine de la Hero Section ?")) {
      setHeroForm({ ...DEFAULT_HERO_SETTINGS });
      triggerNotification("Textes d'origine de la Hero Section restaurés.");
    }
  };


  // ==========================================
  // TAB 5: TEAM & ADMINISTRATORS (SUPABASE AUTH RBAC)
  // ==========================================
  const [adminsList, setAdminsList] = useState<StoreAdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'superadmin' | 'admin' | 'manager'>('admin');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [adminActionError, setAdminActionError] = useState<string | null>(null);

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    setAdminActionError(null);
    try {
      const list = await fetchStoreAdminsRemote();
      setAdminsList(list);
    } catch (err: any) {
      console.warn('Could not fetch admins', err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAdmins();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'admins') {
      loadAdmins();
    }
  }, [activeTab]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      setAdminActionError('Veuillez renseigner une adresse email valide.');
      return;
    }
    setLoadingAdmins(true);
    setAdminActionError(null);
    try {
      const res = await addStoreAdminRemote({
        email: newAdminEmail.trim(),
        role: newAdminRole,
        phone: newAdminPhone.trim()
      });
      if (res.success) {
        triggerNotification(`Administrateur ${newAdminEmail} ajouté avec succès !`);
        setNewAdminEmail('');
        setNewAdminPhone('');
        setIsAddAdminModalOpen(false);
        await loadAdmins();
      } else {
        setAdminActionError(res.message || "Impossible d'ajouter l'administrateur.");
      }
    } catch (err: any) {
      setAdminActionError(err?.message || "Erreur lors de l'ajout.");
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleToggleAdminStatus = async (adminId: string, currentStatus: boolean, email: string) => {
    const nextStatus = !currentStatus;
    const confirmMsg = nextStatus 
      ? `Réactiver l'accès pour ${email} ?`
      : `Désactiver l'accès pour ${email} ? Ce collaborateur ne pourra plus accéder à l'espace de gestion.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const success = await toggleStoreAdminActiveRemote(adminId, nextStatus);
      if (success) {
        triggerNotification(`Statut de ${email} mis à jour`);
        await loadAdmins();
      } else {
        alert('Erreur lors du changement de statut');
      }
    } catch (err: any) {
      alert(`Erreur: ${err?.message || 'Action impossible'}`);
    }
  };

  const handleDeleteAdminItem = async (adminId: string, email: string) => {
    if (!window.confirm(`Supprimer définitivement l'administrateur ${email} ?`)) return;
    try {
      const success = await deleteStoreAdminRemote(adminId);
      if (success) {
        triggerNotification(`Administrateur ${email} retiré.`);
        await loadAdmins();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (err: any) {
      alert(`Erreur: ${err?.message || 'Action impossible'}`);
    }
  };

  const handleLogout = async () => {
    await signOutAdmin();
    setAdminAuthenticated(false);
    onClose();
  };

  const currentAdminEmail = getAdminEmail();
  const isCurrentSuperAdmin = currentAdminRecord?.role === 'superadmin';

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-2 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Main Admin Box */}
      <div className="relative w-full max-w-7xl h-[95vh] bg-white dark:bg-[#0b0f17] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-900 dark:text-white transition-colors">
        
        {/* Top Header Bar */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-bold text-sm shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white font-['Outfit']">
                  Espace Direction & Gestion
                </h2>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  OUMAR IPHONE
                </span>
                {currentAdminEmail && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {currentAdminEmail}
                  </span>
                )}
                {currentAdminRecord?.role && (
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    currentAdminRecord.role === 'superadmin'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                      : currentAdminRecord.role === 'admin'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}>
                    {currentAdminRecord.role}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Administration sécurisée · Catalogue, Stocks, Vidéos, Commandes & Paramètres Abidjan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Se déconnecter de l'administration"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Fermer l'administration"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Notification Toast */}
        {notification && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="px-5 py-2.5 bg-slate-100/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Catalogue & Stocks ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'videos'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Vidéos Immersives ({videos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap relative ${
              activeTab === 'orders'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Commandes & Clients ({orders.length})</span>
            {pendingOrdersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('hero')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'hero'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Personnalisation du site → Hero Section</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Boutique & Serveur Supabase</span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'admins'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Équipe & Admins ({adminsList.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f8fafc] dark:bg-[#080d1a]">
          
          {/* ========================================================= */}
          {/* TAB 1: CATALOGUE & STOCKS */}
          {/* ========================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              
              {/* Actions Header Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Filtrer un modèle, capacité..."
                      className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={productCatFilter}
                    onChange={(e) => setProductCatFilter(e.target.value)}
                    className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Tous">Toutes Catégories</option>
                    <option value="iPhone">iPhone</option>
                    <option value="iPad">iPad</option>
                    <option value="iPhone Duo">iPhone Duo</option>
                    <option value="MacBook">MacBook</option>
                    <option value="Accessoires">Accessoires</option>
                  </select>

                  {/* Stock Filter */}
                  <select
                    value={productStockFilter}
                    onChange={(e) => setProductStockFilter(e.target.value as any)}
                    className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tous les stocks</option>
                    <option value="inStock">En stock seulement</option>
                    <option value="outOfStock">Ruptures de stock</option>
                  </select>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleSeedOfficialCatalog}
                    disabled={isSeedingCatalog}
                    className="px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Restaurer la sélection officielle des 6 modèles certifiés Apple"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isSeedingCatalog ? 'animate-spin' : ''}`} />
                    <span>{isSeedingCatalog ? 'Chargement...' : 'Catalogue officiel Apple'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetCatalog}
                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Restaurer le catalogue d'origine Apple"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Réinitialiser</span>
                  </button>

                  <button
                    type="button"
                    onClick={openNewProductForm}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-950 rounded-xl hover:opacity-90 active:scale-[0.98] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nouveau Produit</span>
                  </button>
                </div>
              </div>

              {/* Products Table / Cards */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p, idx) => (
                    <div 
                      key={`admin-prod-${p.id || idx}-${idx}`}
                      className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Product identity */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 p-1.5 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700">
                          <img
                            src={p.image || undefined}
                            alt={p.name}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        {/* Title & Badges */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                              {p.category}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              {p.condition}
                            </span>
                            {p.featured && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                Vedette
                              </span>
                            )}
                            {p.published === false && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                Masqué
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {p.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {p.model} · {p.storage.join(', ')}
                          </p>
                        </div>
                      </div>

                      {/* Pricing & Stock location */}
                      <div className="flex items-center gap-4 text-left md:text-right shrink-0">
                        <div>
                          <div className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                            {p.price.toLocaleString('fr-FR')} FCFA
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {p.stockLocation}
                          </div>
                        </div>

                        {/* Stock Quick Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleProductStock(p.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            p.inStock
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                          title="Cliquez pour basculer le stock"
                        >
                          <span className={`w-2 h-2 rounded-full ${p.inStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{p.inStock ? 'En stock' : 'Rupture'}</span>
                        </button>
                      </div>

                      {/* Management Actions */}
                      <div className="flex items-center gap-1 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                        {/* Publish toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleProductPublish(p.id)}
                          className={`p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                            p.published !== false
                              ? 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                              : 'text-amber-500 bg-amber-50 dark:bg-amber-950'
                          }`}
                          title={p.published !== false ? 'Masquer du catalogue public' : 'Publier dans le catalogue'}
                        >
                          {p.published !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveProduct(idx, 'up')}
                          className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 rounded-xl transition-colors cursor-pointer"
                          title="Monter dans le catalogue"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={idx === products.length - 1}
                          onClick={() => handleMoveProduct(idx, 'down')}
                          className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 rounded-xl transition-colors cursor-pointer"
                          title="Descendre dans le catalogue"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>

                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={() => handleDuplicateProduct(p)}
                          className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
                          title="Dupliquer ce produit"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => openEditProductForm(p)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Modifier la fiche complète"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        {productDeleteConfirmId === p.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id)}
                              className="px-2 py-1 text-[11px] font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                            >
                              Confirmer
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductDeleteConfirmId(null)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setProductDeleteConfirmId(p.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                            title="Supprimer ce produit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    Aucun produit trouvé selon les critères de recherche.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: VIDÉOS IMMERSIVES */}
          {/* ========================================================= */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              
              {/* Header Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Vidéos du mur immersif ({videos.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Les vidéos sont jouées en boucle muette sur la page d’accueil, entre le Hero et le Catalogue.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetVideos}
                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Réinitialiser</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddingVideo(!isAddingVideo)}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-950 rounded-xl hover:opacity-90 active:scale-[0.98] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter une vidéo</span>
                  </button>
                </div>
              </div>

              {/* Add Video Form Drawer/Box */}
              {isAddingVideo && (
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Nouvelle vidéo de démonstration
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Titre / Référence interne
                      </label>
                      <input
                        type="text"
                        value={videoTitleInput}
                        onChange={(e) => setVideoTitleInput(e.target.value)}
                        placeholder="Ex: Déballage iPhone 16 Pro Max Titane"
                        className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Format vidéo
                      </label>
                      <select
                        value={videoTypeInput}
                        onChange={(e) => setVideoTypeInput(e.target.value as any)}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none"
                      >
                        <option value="html5">Fichier Vidéo direct (MP4, WebM)</option>
                        <option value="tiktok">Lien Vidéo TikTok (@oumariphone)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        URL de la vidéo ou lien TikTok
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={videoUrlInput}
                          onChange={(e) => setVideoUrlInput(e.target.value)}
                          placeholder="https://.../video.mp4 ou https://www.tiktok.com/@oumariphone/video/..."
                          className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => videoFileInputRef.current?.click()}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Importer MP4</span>
                        </button>
                        <input
                          ref={videoFileInputRef}
                          type="file"
                          accept="video/mp4,video/webm"
                          onChange={handleVideoFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingVideo(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveVideo}
                      disabled={!videoUrlInput.trim()}
                      className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-950 rounded-xl hover:opacity-90 disabled:opacity-40"
                    >
                      Enregistrer la vidéo
                    </button>
                  </div>
                </div>
              )}

              {/* Videos List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((vid, idx) => (
                  <div
                    key={`admin-vid-${vid.id || idx}-${idx}`}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between p-3.5"
                  >
                    {/* Video Player Preview */}
                    <div className="relative aspect-9/16 sm:aspect-4/3 w-full rounded-xl overflow-hidden bg-black mb-3">
                      {vid.type === 'tiktok' || vid.url.includes('tiktok.com') ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/70 p-4 text-center">
                          <Video className="w-8 h-8 mb-2 text-rose-500" />
                          <span className="text-xs font-semibold">Lien TikTok</span>
                          <span className="text-[11px] text-white/50 truncate max-w-full">{vid.url}</span>
                        </div>
                      ) : (
                        <video
                          src={vid.url || undefined}
                          muted
                          playsInline
                          controls
                          className="w-full h-full object-cover"
                        />
                      )}

                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-black/70 text-white backdrop-blur-xs">
                          #{idx + 1}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-xs ${
                          vid.published
                            ? 'bg-emerald-500/80 text-white'
                            : 'bg-rose-500/80 text-white'
                        }`}>
                          {vid.published ? 'Visible' : 'Masquée'}
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mb-2">
                        {vid.title || 'Vidéo de présentation'}
                      </h4>

                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveVideo(idx, 'up')}
                            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 rounded-lg"
                            title="Déplacer vers la gauche / haut"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === videos.length - 1}
                            onClick={() => handleMoveVideo(idx, 'down')}
                            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 rounded-lg"
                            title="Déplacer vers la droite / bas"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleVideoPublish(vid.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg"
                            title={vid.published ? 'Masquer' : 'Publier'}
                          >
                            {vid.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-rose-500" />}
                          </button>
                        </div>

                        {videoDeleteConfirmId === vid.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteVideo(vid.id)}
                              className="px-2 py-1 text-[10px] font-bold bg-rose-600 text-white rounded-md"
                            >
                              Supprimer
                            </button>
                            <button
                              type="button"
                              onClick={() => setVideoDeleteConfirmId(null)}
                              className="p-1 text-slate-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setVideoDeleteConfirmId(vid.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                            title="Supprimer la vidéo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: COMMANDES & CLIENTS */}
          {/* ========================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              
              {/* Order Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500">Total Commandes</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
                    {orders.length}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">En attente</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                    {pendingOrdersCount}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">En livraison</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                    {inDeliveryCount}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Chiffre d’Affaires</span>
                  <div className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums truncate">
                    {totalRevenue.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
              </div>

              {/* Status Filter Bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-slate-400 font-semibold uppercase mr-2 hidden sm:inline">Statut :</span>
                  {(['all', 'pending', 'confirmed', 'in_delivery', 'delivered', 'cancelled'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                        orderStatusFilter === st
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {st === 'all' && 'Toutes'}
                      {st === 'pending' && 'En attente'}
                      {st === 'confirmed' && 'Confirmées'}
                      {st === 'in_delivery' && 'En cours de livraison'}
                      {st === 'delivered' && 'Livrées'}
                      {st === 'cancelled' && 'Annulées'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Réinitialiser l’historique des commandes avec des exemples ?')) {
                      resetOrders();
                    }
                  }}
                  className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Réinitialiser
                </button>
              </div>

              {/* Orders List */}
              <div className="space-y-3">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((ord) => {
                    const clientWhatsAppMsg = `Bonjour ${ord.customerName}, ici la direction OUMAR IPHONE concernant votre commande ${ord.orderNumber}. Votre livraison à ${ord.commune} est bien prise en charge.`;

                    return (
                      <div
                        key={ord.id}
                        className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                                {ord.orderNumber}
                              </span>
                              <span className="text-xs text-slate-400">·</span>
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                {ord.customerName}
                              </span>
                              <span className="text-xs text-slate-400">({ord.commune})</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {new Date(ord.createdAt).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                            {/* Status Selector */}
                            <select
                              value={ord.status}
                              onChange={(e) => handleUpdateStatus(ord.id, e.target.value as OrderStatus)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${
                                ord.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                                  : ord.status === 'confirmed'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                                  : ord.status === 'in_delivery'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800'
                                  : ord.status === 'delivered'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                              }`}
                            >
                              <option value="pending">En attente</option>
                              <option value="confirmed">Confirmée</option>
                              <option value="in_delivery">En livraison</option>
                              <option value="delivered">Livrée</option>
                              <option value="cancelled">Annulée</option>
                            </select>

                            {/* Direct WhatsApp Message to Client */}
                            <a
                              href={getWhatsAppUrl(clientWhatsAppMsg)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                              title="Contacter le client sur WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>

                            {/* Delete order */}
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(ord.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"
                              title="Supprimer la commande"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {item.productName}
                                </span>
                                <span className="text-slate-500">
                                  ({item.chosenStorage}, {item.chosenColor}) x{item.quantity}
                                </span>
                              </div>
                              <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                                {(item.unitPrice * item.quantity).toLocaleString('fr-FR')} FCFA
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer & Total */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <span className="text-slate-500">{ord.paymentMethod}</span>
                          <div className="text-sm font-extrabold text-slate-950 dark:text-white tabular-nums">
                            Total : {ord.total.toLocaleString('fr-FR')} FCFA
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    Aucune commande enregistrée pour ce statut.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: PERSONNALISATION DU SITE → HERO SECTION */}
          {/* ========================================================= */}
          {activeTab === 'hero' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Header Bar with Breadcrumb and Actions */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                    <span>Administration</span>
                    <span>→</span>
                    <span>Personnalisation du site</span>
                    <span>→</span>
                    <span className="bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">Hero Section</span>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white font-['Outfit']">
                    Édition Complète de la Hero Section
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Modifiez chaque texte, bouton, badge de réassurance et visuel avec aperçu interactif en temps réel.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleResetHeroSettingsToDefault}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Rétablir les textes d'origine Apple"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rétablir d'origine</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelHeroSettings}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveHeroSettings}
                    disabled={heroSaving}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className={`w-3.5 h-3.5 ${heroSaving ? 'animate-spin' : ''}`} />
                    <span>{heroSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
                  </button>
                </div>
              </div>

              {/* Success Notification Alert */}
              {heroSaveSuccess && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-900 dark:text-emerald-200 text-xs font-semibold animate-in fade-in duration-300">
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    Vos modifications de la Hero Section ont été enregistrées avec succès et sont publiées en direct sur le site !
                  </span>
                </div>
              )}

              {/* Grid: Editor Inputs (Left) & Live Preview (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN: Input Fields */}
                <div className="lg:col-span-6 space-y-5">
                  
                  {/* Card 1: Kicker & Badges */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>1. Accroche supérieure & Localisation</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Nom de Marque / Kicker
                        </label>
                        <input
                          type="text"
                          value={heroForm.kickerBrand}
                          onChange={(e) => setHeroForm({ ...heroForm, kickerBrand: e.target.value })}
                          placeholder="OUMAR IPHONE"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Badge de Localisation
                        </label>
                        <input
                          type="text"
                          value={heroForm.kickerLocation}
                          onChange={(e) => setHeroForm({ ...heroForm, kickerLocation: e.target.value })}
                          placeholder="BOUTIQUE OFFICIELLE · ABIDJAN"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Main Titles & Description */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                      <Edit3 className="w-4 h-4 text-amber-500" />
                      <span>2. Titres d'impact & Description</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Titre Principal — Première ligne
                        </label>
                        <input
                          type="text"
                          value={heroForm.titleLine1}
                          onChange={(e) => setHeroForm({ ...heroForm, titleLine1: e.target.value })}
                          placeholder="L'art du titane."
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Titre Principal — Deuxième ligne (Effet dégradé titane)
                        </label>
                        <input
                          type="text"
                          value={heroForm.titleLine2}
                          onChange={(e) => setHeroForm({ ...heroForm, titleLine2: e.target.value })}
                          placeholder="La pureté du verre."
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Sous-titre / Paragraphe de présentation
                        </label>
                        <textarea
                          rows={4}
                          value={heroForm.description}
                          onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
                          placeholder="La référence des iPhone neufs scellés et reconditionnés certifiés en Côte d'Ivoire..."
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Call to Action Buttons */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                      <ShoppingBag className="w-4 h-4 text-amber-500" />
                      <span>3. Boutons d'Action (Call To Action)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Bouton Principal (Catalogue)
                        </label>
                        <input
                          type="text"
                          value={heroForm.primaryButtonText}
                          onChange={(e) => setHeroForm({ ...heroForm, primaryButtonText: e.target.value })}
                          placeholder="EXPLORER LE CATALOGUE"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Bouton Secondaire (WhatsApp)
                        </label>
                        <input
                          type="text"
                          value={heroForm.secondaryButtonText}
                          onChange={(e) => setHeroForm({ ...heroForm, secondaryButtonText: e.target.value })}
                          placeholder="CONTACTER SUR WHATSAPP"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Proof & Trust Badges */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>4. Badges de Réassurance & Preuves de Confiance</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Badge 1 — Garantie & Authenticité
                        </label>
                        <input
                          type="text"
                          value={heroForm.badgeProof1}
                          onChange={(e) => setHeroForm({ ...heroForm, badgeProof1: e.target.value })}
                          placeholder="Garantie 12 Mois Oumar"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Badge 2 — Retrait physique & Essai
                        </label>
                        <input
                          type="text"
                          value={heroForm.badgeProof2}
                          onChange={(e) => setHeroForm({ ...heroForm, badgeProof2: e.target.value })}
                          placeholder="Test & Retrait en Boutique"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Badge 3 — Contact direct & Réactivité
                        </label>
                        <input
                          type="text"
                          value={heroForm.badgeProof3}
                          onChange={(e) => setHeroForm({ ...heroForm, badgeProof3: e.target.value })}
                          placeholder="Échange Direct WhatsApp"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Photo & Accessibility */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                      <ImageIcon className="w-4 h-4 text-indigo-500" />
                      <span>5. Visuel Principal & Accessibilité</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Texte alternatif de l'image (Balise Alt pour le référencement)
                        </label>
                        <input
                          type="text"
                          value={heroForm.photoAltText}
                          onChange={(e) => setHeroForm({ ...heroForm, photoAltText: e.target.value })}
                          placeholder="Oumar — Fondateur OUMAR IPHONE Abidjan"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={heroPhotoPreview || heroPhotoSrc || heroTitaniumSample}
                            alt="Aperçu miniature"
                            className="w-12 h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs"
                          />
                          <div>
                            <span className="font-semibold block text-slate-900 dark:text-white">Photo d'Oumar actuelle</span>
                            <span className="text-[11px] text-slate-400">Gère automatiquement l'ambiance lumineuse</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => heroPhotoInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-slate-800 dark:text-white transition-colors"
                          >
                            Remplacer
                          </button>
                          {heroPhotoSrc && (
                            <button
                              type="button"
                              onClick={handleResetHeroPhoto}
                              className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold transition-colors"
                            >
                              Réinitialiser
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: Live Interactive Preview */}
                <div className="lg:col-span-6 lg:sticky lg:top-4 space-y-3">
                  
                  {/* Preview Toolbar */}
                  <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span>Aperçu en direct (Simulation client)</span>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl text-[11px]">
                      <button
                        type="button"
                        onClick={() => setHeroPreviewMode('desktop')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                          heroPreviewMode === 'desktop'
                            ? 'bg-white text-slate-950 shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Monitor className="w-3 h-3" />
                        <span>Ordinateur</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHeroPreviewMode('mobile')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                          heroPreviewMode === 'mobile'
                            ? 'bg-white text-slate-950 shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>Mobile</span>
                      </button>
                    </div>
                  </div>

                  {/* Frame Container */}
                  <div className={`mx-auto transition-all duration-300 ${
                    heroPreviewMode === 'mobile' ? 'max-w-[340px]' : 'w-full'
                  }`}>
                    <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-[#06080F] text-white p-5 shadow-2xl">
                      
                      {/* Background Atmospheric Glow */}
                      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                      {/* Content inside simulated hero */}
                      <div className="relative z-10 space-y-4">
                        
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            {heroForm.kickerBrand || 'OUMAR IPHONE'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                            <MapPin className="w-2.5 h-2.5 text-amber-400" />
                            {heroForm.kickerLocation || 'BOUTIQUE OFFICIELLE · ABIDJAN'}
                          </span>
                        </div>

                        {/* Titles */}
                        <div>
                          <h1 className="text-xl sm:text-2xl font-bold font-['Outfit'] tracking-tight leading-tight text-white">
                            {heroForm.titleLine1 || "L'art du titane."}
                          </h1>
                          <h2 className="text-xl sm:text-2xl font-bold font-['Outfit'] tracking-tight leading-tight bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 bg-clip-text text-transparent">
                            {heroForm.titleLine2 || 'La pureté du verre.'}
                          </h2>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-300/90 leading-relaxed">
                          {heroForm.description || "La référence des iPhone neufs scellés et reconditionnés..."}
                        </p>

                        {/* Simulated Photo */}
                        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 bg-slate-900 group">
                          <img
                            src={heroPhotoPreview || heroPhotoSrc || heroTitaniumSample}
                            alt={heroForm.photoAltText || 'Oumar'}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                            <span className="text-[10px] text-amber-300 font-semibold tracking-wide">
                              {heroForm.photoAltText}
                            </span>
                          </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <div className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 text-center text-xs font-bold shadow-md cursor-pointer">
                            {heroForm.primaryButtonText || 'EXPLORER LE CATALOGUE'}
                          </div>
                          <div className="flex-1 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-center text-xs font-semibold cursor-pointer">
                            {heroForm.secondaryButtonText || 'CONTACTER SUR WHATSAPP'}
                          </div>
                        </div>

                        {/* Proof Badges */}
                        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/10 text-[9px] text-center text-slate-300">
                          <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                            <ShieldCheck className="w-3 h-3 text-emerald-400 mx-auto mb-0.5" />
                            <span className="line-clamp-2">{heroForm.badgeProof1}</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                            <MapPin className="w-3 h-3 text-amber-400 mx-auto mb-0.5" />
                            <span className="line-clamp-2">{heroForm.badgeProof2}</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                            <MessageCircle className="w-3 h-3 text-emerald-400 mx-auto mb-0.5" />
                            <span className="line-clamp-2">{heroForm.badgeProof3}</span>
                          </div>
                        </div>

                      </div>

                    </div>
                    <p className="text-[11px] text-center text-slate-400 mt-2">
                      Cet aperçu réagit en temps réel à chaque frappe dans le formulaire.
                    </p>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: BOUTIQUE & SÉCURITÉ */}
          {/* ========================================================= */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Card 1: Hero Section Photo & Brand Visual Management */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Photo de l'Hero Section & Image de Marque (Oumar)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Cette photo est le visuel d'accueil officiel. Elle pilote automatiquement le halo d'ambiance chromatique, les reflets et l'arrière-plan de toute la page d'accueil.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      heroPhotoSrc 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60' 
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${heroPhotoSrc ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{heroPhotoSrc ? 'Photo personnalisée active' : 'Photo officielle par défaut'}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Photo Preview Column */}
                  <div className="md:col-span-4 flex flex-col items-center">
                    <div className="relative w-full max-w-[220px] aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-md group">
                      <img
                        src={heroPhotoPreview || heroPhotoSrc || heroTitaniumSample || undefined}
                        alt="Aperçu photo Hero"
                        className="w-full h-full object-cover object-top select-none transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3 pointer-events-none">
                        <span className="text-[11px] text-white font-semibold font-['Outfit'] tracking-wide">
                          Aperçu en direct
                        </span>
                      </div>
                    </div>
                    {heroPhotoSrc && (
                      <button
                        type="button"
                        onClick={handleResetHeroPhoto}
                        className="mt-3 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Rétablir la photo d'origine</span>
                      </button>
                    )}
                  </div>

                  {/* Upload & Configuration Controls */}
                  <div className="md:col-span-8 space-y-4 text-xs">
                    {/* File Upload Trigger */}
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        Importer une photo depuis vos fichiers
                      </label>
                      <input
                        ref={heroPhotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleHeroPhotoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => heroPhotoInputRef.current?.click()}
                        className="w-full py-5 px-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-900 dark:hover:border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-2.5 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer group shadow-xs"
                      >
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 group-hover:scale-110 transition-transform">
                          <Upload className="w-4 h-4 text-slate-900 dark:text-white" />
                        </div>
                        <div className="text-center">
                          <span className="font-bold text-slate-900 dark:text-white block text-sm">
                            Sélectionner une photo d'Oumar
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Prend en charge PNG, JPG, WebP (Max 10 Mo)
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* URL Input option */}
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        Ou saisir l'URL directe d'une image web
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={heroPhotoUrlInput}
                          onChange={(e) => setHeroPhotoUrlInput(e.target.value)}
                          placeholder="https://.../photo-oumar.jpg"
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleApplyHeroPhotoUrl}
                          disabled={!heroPhotoUrlInput.trim()}
                          className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer shrink-0"
                        >
                          Appliquer
                        </button>
                      </div>
                    </div>

                    {/* Information Box */}
                    <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2.5 leading-relaxed">
                      <Sparkles className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <span>
                        Cette modification est immédiatement sauvegardée et transmise à la page d'accueil publique en temps réel.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Parameters Form */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-500" />
                  <span>Coordonnées Commerciales OUMAR IPHONE</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Numéro WhatsApp Commercial (+225 ...)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.whatsappPhone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsappPhone: e.target.value })}
                      placeholder="2250700000000"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tous les boutons WhatsApp du site renvoient directement vers ce numéro.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Frais de livraison (FCFA) — <span className="text-emerald-600 dark:text-emerald-400 font-bold">Retrait en boutique</span>
                    </label>
                    <input
                      type="number"
                      value={0}
                      disabled
                      className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-500 dark:text-slate-400 focus:outline-none cursor-not-allowed font-medium"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      OUMAR IPHONE opère exclusivement en retrait direct en boutique. Les frais sont fixés à 0 FCFA.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Horaires d’ouverture
                    </label>
                    <input
                      type="text"
                      value={settingsForm.openingHours}
                      onChange={(e) => setSettingsForm({ ...settingsForm, openingHours: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Texte d’engagement Garantie & Authenticité
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.warrantyText}
                      onChange={(e) => setSettingsForm({ ...settingsForm, warrantyText: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveStoreSettings}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-slate-950 dark:bg-white dark:text-slate-950 rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                  >
                    Enregistrer les paramètres
                  </button>
                </div>
              </div>

              {/* Admin Security Information Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Sécurité & Contrôle d'accès</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  L’accès administrateur est entièrement protégé par un système d’authentification chiffré et une gestion stricte des privilèges par collaborateur. Seuls les comptes autorisés par la direction peuvent modifier le catalogue et traiter les commandes de la boutique OUMAR IPHONE.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-semibold text-slate-950 dark:text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-500" /> Gestion des accès de l'équipe :
                  </p>
                  <p>
                    Pour ajouter ou modifier un collaborateur, utilisez l’onglet <strong>"Équipe"</strong> ci-dessus. Seuls les comptes autorisés avec une adresse professionnelle enregistrée et active disposent des privilèges de modification et de suivi des commandes.
                  </p>
                </div>
              </div>

              {/* Card 4: Cloud Server & Data Synchronization */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                        <span>Serveur & Synchronisation Cloud</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-normal">
                          Boutique en ligne · Connectée
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sauvegarde et synchronisation en temps réel du catalogue, des vidéos et des commandes avec protection des données de la boutique.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      supabaseStatus.tablesReady
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                        : isSupabaseConfigured
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        supabaseStatus.tablesReady
                          ? 'bg-emerald-500 animate-pulse'
                          : isSupabaseConfigured
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`} />
                      <span>
                        {supabaseStatus.tablesReady
                          ? 'Catalogue en ligne opérationnel'
                          : isSupabaseConfigured
                          ? 'Serveur configuré (Non testé)'
                          : 'Mode boutique autonome actif'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Cloud Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Identifiant de la boutique</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{SUPABASE_PROJECT_ID}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Hébergement distant</span>
                    <span className="font-semibold text-slate-900 dark:text-white">eu-west-1 (Europe Ouest)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Confidentialité des données</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Espace marchand sécurisé</span>
                  </div>
                </div>

                {/* Status Message or Warning */}
                {supabaseStatus.message && (
                  <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                    supabaseStatus.tablesReady
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60'
                      : supabaseStatus.connected
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    <Cloud className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">{supabaseStatus.message}</span>
                    </div>
                  </div>
                )}

                {/* Sync Result Report */}
                {syncResult && (
                  <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                    syncResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60'
                  }`}>
                    {syncResult.success ? (
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    )}
                    <div>
                      <p className="font-semibold">{syncResult.message}</p>
                      {syncResult.details && (
                        <p className="text-[11px] opacity-80 mt-1">
                          Produits synchronisés : {syncResult.details.productsCount} · Vidéos synchronisées : {syncResult.details.videosCount} · Paramètres : Synchronisés
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestSupabase}
                    disabled={supabaseStatus.loading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${supabaseStatus.loading ? 'animate-spin' : ''}`} />
                    <span>{supabaseStatus.loading ? 'Vérification...' : 'Tester la connexion en ligne'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncToSupabase}
                    disabled={isSyncingSupabase}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Cloud className={`w-3.5 h-3.5 ${isSyncingSupabase ? 'animate-bounce' : ''}`} />
                    <span>{isSyncingSupabase ? 'Synchronisation en cours...' : 'Mettre à jour le catalogue en ligne'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSeedOfficialCatalog}
                    disabled={isSeedingCatalog}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isSeedingCatalog ? 'animate-spin' : ''}`} />
                    <span>{isSeedingCatalog ? 'Chargement...' : 'Charger le catalogue officiel Apple (6 modèles)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSqlModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
                  >
                    <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Afficher le guide d'initialisation technique</span>
                  </button>
                </div>

                {/* Help instructions for environment setup */}
                {!isSupabaseConfigured && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Comment raccorder votre boutique au serveur en ligne ({SUPABASE_PROJECT_ID}) ?</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1">
                      <li>
                        Ouvrez la console de gestion du serveur distant.
                      </li>
                      <li>
                        Dans les paramètres d'accès de la boutique, récupérez la clé d'authentification publique.
                      </li>
                      <li>
                        Renseignez la configuration sur votre serveur de déploiement (Vercel ou variables d'environnement).
                      </li>
                      <li>
                        Le catalogue et les comptes d'équipe seront automatiquement synchronisés en temps réel.
                      </li>
                    </ol>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: TEAM & ADMINISTRATORS */}
          {/* ========================================================= */}
          {activeTab === 'admins' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white flex items-center gap-2 font-['Outfit']">
                    <Users className="w-5 h-5 text-indigo-500" />
                    <span>Direction & Équipe de Gestion</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Gestion des droits d'accès et des responsabilités de l'équipe OUMAR IPHONE.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={loadAdmins}
                    disabled={loadingAdmins}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Actualiser la liste des administrateurs"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingAdmins ? 'animate-spin text-indigo-500' : ''}`} />
                  </button>

                  {isCurrentSuperAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAdminActionError(null);
                        setIsAddAdminModalOpen(true);
                      }}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Ajouter un Administrateur</span>
                    </button>
                  ) : (
                    <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Gestion de l'équipe réservée à la direction</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Architecture Info Banner */}
              <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-800/40 rounded-2xl text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Sécurité et gestion des droits d'accès</span>
                </div>
                <p className="text-[11px] leading-relaxed text-indigo-900/80 dark:text-indigo-200/80">
                  L'accès à ce tableau de bord est strictement contrôlé. Seuls les comptes collaborateurs enregistrés ci-dessous avec le statut <strong>Actif</strong> peuvent visualiser les commandes des clients, modifier le catalogue ou ajuster les disponibilités.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-100/80 dark:bg-indigo-900/50 font-semibold text-indigo-800 dark:text-indigo-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Direction (Accès Total & Gestion Équipe)
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-100/80 dark:bg-indigo-900/50 font-semibold text-indigo-800 dark:text-indigo-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Administrateur (Catalogue, Stocks & Commandes)
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-100/80 dark:bg-indigo-900/50 font-semibold text-indigo-800 dark:text-indigo-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Responsable (Traitement des Commandes)
                  </span>
                </div>
              </div>

              {/* Admins Table Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                
                {loadingAdmins && adminsList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                    <p className="text-xs">Chargement des comptes administrateurs...</p>
                  </div>
                ) : adminsList.length === 0 ? (
                  <div className="p-10 text-center space-y-3">
                    <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                      Aucun compte administrateur listé
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                      Seuls les administrateurs de la direction sont autorisés à inviter ou gérer les membres de l'équipe OUMAR IPHONE.
                    </p>
                    {isCurrentSuperAdmin && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddAdminModalOpen(true)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Ajouter un Administrateur</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Administrateur</th>
                          <th className="py-3 px-4">Niveau d'accès</th>
                          <th className="py-3 px-4">Téléphone</th>
                          <th className="py-3 px-4">Statut</th>
                          <th className="py-3 px-4">Créé le</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                        {adminsList.map((adm) => {
                          const isCurrent = adm.email.toLowerCase() === (currentAdminEmail || '').toLowerCase();
                          return (
                            <tr key={adm.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                              
                              {/* Admin email & identity */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                    adm.role === 'superadmin'
                                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                      : adm.role === 'admin'
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  }`}>
                                    {adm.email.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900 dark:text-white">
                                        {adm.email}
                                      </span>
                                      {isCurrent && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                          Vous
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                      Réf: #{adm.id.slice(0, 6)}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Role Badge */}
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  adm.role === 'superadmin'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
                                    : adm.role === 'admin'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                }`}>
                                  <ShieldCheck className="w-3 h-3" />
                                  <span className="capitalize">{adm.role}</span>
                                </span>
                              </td>

                              {/* Phone */}
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">
                                {adm.phone || '—'}
                              </td>

                              {/* Status Toggle */}
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                  adm.is_active
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${adm.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                  <span>{adm.is_active ? 'Actif' : 'Désactivé'}</span>
                                </span>
                              </td>

                              {/* Created At */}
                              <td className="py-3 px-4 text-slate-400 text-[11px]">
                                {adm.created_at ? new Date(adm.created_at).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                }) : '—'}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right">
                                {isCurrentSuperAdmin ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Toggle Active Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleAdminStatus(adm.id, adm.is_active, adm.email)}
                                      disabled={isCurrent && adm.role === 'superadmin'}
                                      className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                        adm.is_active
                                          ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                          : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                      } ${isCurrent && adm.role === 'superadmin' ? 'opacity-40 cursor-not-allowed' : ''}`}
                                      title={adm.is_active ? "Désactiver l'accès" : "Réactiver l'accès"}
                                    >
                                      {adm.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAdminItem(adm.id, adm.email)}
                                      disabled={isCurrent}
                                      className={`p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer ${
                                        isCurrent ? 'opacity-40 cursor-not-allowed' : ''
                                      }`}
                                      title={isCurrent ? "Vous ne pouvez pas supprimer votre propre compte" : "Retirer cet administrateur"}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">—</span>
                                )}
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* ========================================================= */}
        {/* ADD STORE ADMIN MODAL */}
        {/* ========================================================= */}
        {isAddAdminModalOpen && (
          <div className="fixed inset-0 z-70 bg-black/75 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6 overflow-y-auto">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col text-slate-900 dark:text-white animate-in zoom-in-95">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-['Outfit']">
                      Ajouter un Administrateur
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Autoriser un membre de l'équipe OUMAR IPHONE
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddAdminModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-4 pt-4 text-xs">
                {/* Email */}
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Adresse Email Professionnelle *
                  </label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="direction@oumar-iphone.ci"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Le collaborateur utilisera cette adresse email pour se connecter à l'espace de gestion.
                  </p>
                </div>

                {/* Role */}
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Niveau d'accès & Privilèges *
                  </label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="superadmin">Direction — Accès total & gestion de l'équipe</option>
                    <option value="admin">Administrateur — Gestion complète (catalogue, vidéos, commandes)</option>
                    <option value="manager">Responsable — Traitement et validation des commandes</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Numéro WhatsApp / Téléphone (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={newAdminPhone}
                    onChange={(e) => setNewAdminPhone(e.target.value)}
                    placeholder="+225 07 78 02 42 85"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {adminActionError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-900/50">
                    {adminActionError}
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddAdminModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loadingAdmins}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {loadingAdmins ? 'Ajout en cours...' : 'Confirmer l’autorisation'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SQL MIGRATION MODAL */}
        {/* ========================================================= */}
        {isSqlModalOpen && (
          <div className="fixed inset-0 z-70 bg-black/75 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6 overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[90vh] flex flex-col text-slate-900 dark:text-white animate-in zoom-in-95">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-['Outfit']">
                      Script d'initialisation du serveur en ligne
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Configuration sécurisée des données de la boutique OUMAR IPHONE ({SUPABASE_PROJECT_ID})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                  >
                    {copiedSql ? (
                      <>
                        <CheckCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                        <span>Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copier le script d'initialisation</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSqlModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Guide bar */}
              <div className="p-3 my-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900/50 text-xs flex items-center justify-between">
                <span>
                  Collez ce script dans l'éditeur de votre console serveur pour initialiser les rubriques de la boutique.
                </span>
                <a
                  href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 ml-2"
                >
                  <span>Accéder à la console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Code viewer */}
              <div className="flex-1 overflow-y-auto bg-slate-950 text-emerald-400 font-mono text-[11px] p-4 rounded-2xl border border-slate-800 shadow-inner select-all">
                <pre className="whitespace-pre-wrap leading-relaxed">{SUPABASE_MIGRATION_SQL}</pre>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Fichier également disponible dans : <code className="font-semibold text-slate-700 dark:text-slate-300">/supabase/migrations/20261027_store_schema.sql</code>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Fermer
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PRODUCT FORM MODAL (CREATE OR EDIT) */}
        {/* ========================================================= */}
        {(isCreatingProduct || editingProduct) && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6 overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[90vh] overflow-y-auto space-y-6 text-slate-900 dark:text-white animate-in zoom-in-95">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold font-['Outfit']">
                  {isCreatingProduct ? 'Ajouter un nouveau produit Apple' : `Modifier "${formProduct.name}"`}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingProduct(false);
                    setEditingProduct(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Name */}
                <div>
                  <label className="block font-semibold mb-1">Nom commercial</label>
                  <input
                    type="text"
                    value={formProduct.name || ''}
                    onChange={(e) => setFormProduct({ ...formProduct, name: e.target.value })}
                    placeholder="Ex: iPhone 16 Pro Max"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block font-semibold mb-1">Modèle / Sous-titre</label>
                  <input
                    type="text"
                    value={formProduct.model || ''}
                    onChange={(e) => setFormProduct({ ...formProduct, model: e.target.value })}
                    placeholder="Ex: Flagship Apple Titane A18 Pro"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-semibold mb-1">Catégorie</label>
                  <select
                    value={formProduct.category || 'iPhone'}
                    onChange={(e) => setFormProduct({ ...formProduct, category: e.target.value as ProductCategory })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="iPhone">iPhone</option>
                    <option value="iPad">iPad</option>
                    <option value="iPhone Duo">iPhone Duo</option>
                    <option value="MacBook">MacBook</option>
                    <option value="Accessoires">Accessoires</option>
                  </select>
                </div>

                {/* Condition */}
                <div>
                  <label className="block font-semibold mb-1">État du produit</label>
                  <select
                    value={formProduct.condition || 'Neuf scellé'}
                    onChange={(e) => setFormProduct({ ...formProduct, condition: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Neuf scellé">Neuf scellé</option>
                    <option value="Quasi neuf">Quasi neuf</option>
                    <option value="Occasion">Occasion</option>
                    <option value="Reconditionné">Reconditionné</option>
                  </select>
                </div>

                {/* Base Price in FCFA */}
                <div>
                  <label className="block font-semibold mb-1">Prix de base affiché (FCFA)</label>
                  <input
                    type="number"
                    value={formProduct.price || 0}
                    onChange={(e) => setFormProduct({ ...formProduct, price: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Original Price (for promo strikethrough) */}
                <div>
                  <label className="block font-semibold mb-1">Prix barré / Promo (Optionnel FCFA)</label>
                  <input
                    type="number"
                    value={formProduct.originalPrice || ''}
                    onChange={(e) => setFormProduct({ ...formProduct, originalPrice: parseInt(e.target.value, 10) || undefined })}
                    placeholder="Ex: 1200000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Battery Health */}
                <div>
                  <label className="block font-semibold mb-1">État Batterie</label>
                  <input
                    type="text"
                    value={formProduct.batteryHealth || ''}
                    onChange={(e) => setFormProduct({ ...formProduct, batteryHealth: e.target.value })}
                    placeholder="100% ou 92% Optimale"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Warranty */}
                <div>
                  <label className="block font-semibold mb-1">Garantie</label>
                  <input
                    type="text"
                    value={formProduct.warranty || ''}
                    onChange={(e) => setFormProduct({ ...formProduct, warranty: e.target.value })}
                    placeholder="Garantie Apple 1 an"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Stock location in Abidjan */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Disponibilité à Abidjan</label>
                  <input
                    type="text"
                    value={formProduct.stockLocation || ''}
                    onChange={(e) => setFormProduct({ ...formProduct, stockLocation: e.target.value })}
                    placeholder="Boutique Cocody Angré & Showroom Plateau"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Image Upload / URL & Presets */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block font-semibold">Image principale du produit</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formProduct.image || ''}
                      onChange={(e) => setFormProduct({ ...formProduct, image: e.target.value })}
                      placeholder="URL de l'image ou import de fichier"
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => productImageInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Importer image</span>
                    </button>
                    <input
                      ref={productImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadProductImage}
                      className="hidden"
                    />
                  </div>

                  {/* Preset photo selector */}
                  <div className="pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                      Sélecteur rapide d'images certifiées Apple :
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setFormProduct({ ...formProduct, image: APPLE_ASSET_IMAGES.iphone16ProMax })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          formProduct.image === APPLE_ASSET_IMAGES.iphone16ProMax
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        iPhone 16 Pro Max
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormProduct({ ...formProduct, image: APPLE_ASSET_IMAGES.iphone16Pro })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          formProduct.image === APPLE_ASSET_IMAGES.iphone16Pro
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        iPhone 16 Pro
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormProduct({ ...formProduct, image: APPLE_ASSET_IMAGES.iphone15Pro })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          formProduct.image === APPLE_ASSET_IMAGES.iphone15Pro
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        iPhone 15 Pro
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormProduct({ ...formProduct, image: APPLE_ASSET_IMAGES.ipadProM4 })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          formProduct.image === APPLE_ASSET_IMAGES.ipadProM4
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        iPad Pro M4
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormProduct({ ...formProduct, image: APPLE_ASSET_IMAGES.macbookProM3 })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          formProduct.image === APPLE_ASSET_IMAGES.macbookProM3
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        MacBook Pro M3
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormProduct({ ...formProduct, image: APPLE_ASSET_IMAGES.airpodsPro2 })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          formProduct.image === APPLE_ASSET_IMAGES.airpodsPro2
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        AirPods Pro 2
                      </button>
                    </div>
                  </div>
                </div>

                {/* Storage Capacities Management */}
                <div className="sm:col-span-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Capacités de stockage & Prix spécifiques
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {(formProduct.storage || []).map((cap) => (
                      <span
                        key={cap}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                      >
                        <span>{cap}</span>
                        {formProduct.storagePrices?.[cap] && (
                          <span className="text-slate-400 font-normal">
                            ({formProduct.storagePrices[cap].toLocaleString('fr-FR')} F)
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveCapacity(cap)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={newStorageInput}
                      onChange={(e) => setNewStorageInput(e.target.value)}
                      placeholder="Capacité (ex: 256 Go)"
                      className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white"
                    />
                    <input
                      type="number"
                      value={newStoragePriceInput}
                      onChange={(e) => setNewStoragePriceInput(e.target.value)}
                      placeholder="Prix FCFA (ex: 990000)"
                      className="w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddCapacity}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Hidden file input for color image upload */}
                <input
                  ref={colorFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleColorImageUpload}
                  className="hidden"
                />

                {/* Colors Management — Advanced Apple Color Manager */}
                <div className="sm:col-span-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                        <Palette className="w-4 h-4 text-amber-500" />
                        <span>Finitions & Couleurs Interactives de l'iPhone</span>
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Chaque finition dispose de sa pastille visuelle, de sa photo Apple dédiée et de son statut actif/masqué.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                      {(formProduct.colors || []).length} finition(s) configurée(s)
                    </span>
                  </div>

                  {/* Quick Presets Apple Finishes */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                      Finitions Apple certifiées (cliquez pour pré-remplir l'ajout) :
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {APPLE_COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleApplyColorPreset(preset)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                        >
                          <span className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: preset.hex }} />
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Configured Colors List */}
                  <div className="space-y-2 pt-1">
                    {(formProduct.colors || []).length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 bg-white dark:bg-slate-800/80 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        Aucune couleur configurée. Ajoutez au moins une couleur pour activer le sélecteur interactif.
                      </div>
                    ) : (
                      (formProduct.colors || []).map((col, idx) => {
                        const isActive = col.active !== false;
                        const hasImg = Boolean(col.image);
                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border transition-all flex flex-wrap sm:flex-nowrap items-center gap-2.5 ${
                              isActive
                                ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700'
                                : 'bg-slate-100/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75'
                            }`}
                          >
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveColor(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                                title="Monter cette couleur"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveColor(idx, 'down')}
                                disabled={idx === (formProduct.colors || []).length - 1}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                                title="Descendre cette couleur"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Color Picker Swatch */}
                            <div className="relative shrink-0" title="Changer la nuance de couleur">
                              <input
                                type="color"
                                value={col.hex}
                                onChange={(e) => handleUpdateColor(idx, { hex: e.target.value })}
                                className="w-8 h-8 rounded-full border border-black/20 cursor-pointer p-0 bg-transparent"
                              />
                            </div>

                            {/* Color Name Input */}
                            <input
                              type="text"
                              value={col.name}
                              onChange={(e) => handleUpdateColor(idx, { name: e.target.value })}
                              placeholder="Nom de la couleur"
                              className="flex-1 min-w-[120px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />

                            {/* Dedicated Color Image Thumbnail & Replace Button */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {hasImg ? (
                                <img
                                  src={col.image}
                                  alt={col.name}
                                  className="w-8 h-8 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                                  title="Photo authentique associée à cette finition"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] text-slate-400 text-center font-bold shrink-0">
                                  Défaut
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveColorImageUploadIdx(idx);
                                  colorFileInputRef.current?.click();
                                }}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Changer la photo pour cette finition"
                              >
                                <Upload className="w-3 h-3" />
                                <span className="hidden sm:inline">Photo</span>
                              </button>
                            </div>

                            {/* Active / Inactive Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleColorActive(idx)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                              title={isActive ? 'Couleur active et visible en boutique' : 'Couleur masquée sur le site public'}
                            >
                              {isActive ? (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>Active</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>Masquée</span>
                                </>
                              )}
                            </button>

                            {/* Delete Color Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Supprimer cette finition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add New Color Row */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Ajouter une nouvelle finition :
                    </span>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                      <input
                        type="color"
                        value={newColorHex}
                        onChange={(e) => setNewColorHex(e.target.value)}
                        className="w-9 h-8 p-0 bg-transparent border-0 cursor-pointer rounded-lg shrink-0"
                        title="Choisir la teinte HEX"
                      />
                      <input
                        type="text"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        placeholder="Nom de la finition (ex: Titane Désert)"
                        className="flex-1 min-w-[140px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      
                      {/* Optional Photo Attachment */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveColorImageUploadIdx(-1);
                          colorFileInputRef.current?.click();
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          newColorImage
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                        title="Attacher une photo pour cette nouvelle couleur"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{newColorImage ? 'Photo prête' : 'Ajouter photo'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAddColor}
                        disabled={!newColorName.trim()}
                        className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Description produit</label>
                  <textarea
                    rows={3}
                    value={formProduct.description || ''}
                    onChange={(e) => setFormProduct({ ...formProduct, description: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Switches: In Stock, Featured, New, Published */}
                <div className="sm:col-span-2 flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formProduct.inStock !== false}
                      onChange={(e) => setFormProduct({ ...formProduct, inStock: e.target.checked })}
                      className="rounded"
                    />
                    <span className="font-semibold">Disponible en Stock</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formProduct.featured}
                      onChange={(e) => setFormProduct({ ...formProduct, featured: e.target.checked })}
                      className="rounded"
                    />
                    <span className="font-semibold">Mettre en Vedette</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formProduct.isNew}
                      onChange={(e) => setFormProduct({ ...formProduct, isNew: e.target.checked })}
                      className="rounded"
                    />
                    <span className="font-semibold">Badge Nouveauté</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formProduct.published !== false}
                      onChange={(e) => setFormProduct({ ...formProduct, published: e.target.checked })}
                      className="rounded"
                    />
                    <span className="font-semibold">Publié en ligne</span>
                  </label>
                </div>

              </div>

              {/* Form Actions Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingProduct(false);
                    setEditingProduct(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveProductForm}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90 active:scale-[0.98] shadow-md transition-all cursor-pointer"
                >
                  Enregistrer le produit
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
