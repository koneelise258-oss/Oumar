import React, { useState, useRef, useEffect } from 'react';
import { 
  Product, 
  ProductCategory, 
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
  saveHeroCustomPhoto
} from '../data/storeSettings';
import heroTitaniumSample from '../assets/images/hero_iphone_titanium_1792367905192.jpg';
import { saveProducts, resetProducts } from '../data/products';
import { saveVideos, resetVideos } from '../data/videos';
import {
  upsertProductRemote,
  deleteProductRemote,
  syncVideosRemote,
  deleteVideoRemote,
  saveStoreSettingsRemote,
  updateOrderStatusRemote,
  deleteOrderRemote,
  fetchOrdersRemote,
  syncLocalDataToSupabase,
  testSupabaseHealth,
  SyncMigrationResult
} from '../services/storeService';
import { SUPABASE_PROJECT_ID, isSupabaseConfigured, supabaseUrl, signOutAdmin } from '../lib/supabase';
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
  Server
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductsUpdated: (products: Product[]) => void;
  videos: VideoItem[];
  onVideosUpdated: (videos: VideoItem[]) => void;
}

type AdminTab = 'products' | 'videos' | 'orders' | 'settings';

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
      ? 'Variables Supabase détectées. Cliquez sur "Tester la connexion" pour vérifier l’état des tables.'
      : 'Supabase fonctionne en mode local sécurisé (en attente de VITE_SUPABASE_ANON_KEY dans .env).'
  });
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncMigrationResult | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Background fetch remote orders when dashboard opens
  useEffect(() => {
    if (isOpen) {
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
      triggerNotification(res.tablesReady ? 'Connexion Supabase opérationnelle !' : 'Test Supabase terminé');
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
      alert("Veuillez d’abord renseigner VITE_SUPABASE_ANON_KEY dans le fichier .env avant d’initialiser les données dans Supabase.");
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir synchroniser tout le catalogue, les vidéos et les paramètres locaux vers Supabase ? Cette action mettra à jour la base de données distante.")) {
      return;
    }

    setIsSyncingSupabase(true);
    setSyncResult(null);

    try {
      const res = await syncLocalDataToSupabase(products, videos, settings);
      setSyncResult(res);
      if (res.success) {
        triggerNotification('Données synchronisées avec succès sur Supabase !');
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
      triggerNotification('Script SQL copié dans le presse-papier !');
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      // Fallback
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
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
      name: 'iPhone 16 Pro',
      model: 'Édition Titane A18 Pro',
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
        { name: 'Titane Noir', hex: '#3C3B37' }
      ],
      selectedColor: 'Titane Naturel',
      image: '/src/assets/images/hero_iphone_titanium_1792367905192.jpg',
      gallery: [],
      batteryHealth: '100% Neuf',
      warranty: 'Garantie Apple 1 an',
      inStock: true,
      stockLocation: 'Boutique Cocody & Plateau',
      featured: false,
      isNew: true,
      description: 'Appareil Apple authentique sous blister d’origine avec facture certifiée et garantie 1 an.',
      specs: {
        screen: 'Super Retina XDR OLED ProMotion 120Hz',
        chip: 'Puce Apple A18 Pro 3nm',
        camera: 'Triple objectif 48 Mpx avec zoom 5x',
        battery: 'Autonomie toute la journée',
        ports: 'USB-C haute vitesse',
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

  const handleSaveProductForm = () => {
    if (!formProduct.name || !formProduct.price) {
      alert('Veuillez renseigner au moins le nom et le prix du produit.');
      return;
    }

    const completeProduct = formProduct as Product;

    if (isCreatingProduct) {
      const updated = [completeProduct, ...products];
      onProductsUpdated(updated);
      saveProducts(updated);
      upsertProductRemote(completeProduct);
      triggerNotification(`Produit "${completeProduct.name}" créé avec succès !`);
    } else {
      const updated = products.map((p) =>
        p.id === completeProduct.id ? completeProduct : p
      );
      onProductsUpdated(updated);
      saveProducts(updated);
      upsertProductRemote(completeProduct);
      triggerNotification(`Produit "${completeProduct.name}" mis à jour !`);
    }

    setEditingProduct(null);
    setIsCreatingProduct(false);
  };

  const handleDuplicateProduct = (p: Product) => {
    const clone: Product = {
      ...p,
      id: `prod-copy-${Date.now()}`,
      name: `${p.name} (Copie)`,
      featured: false
    };
    const updated = [clone, ...products];
    onProductsUpdated(updated);
    saveProducts(updated);
    upsertProductRemote(clone);
    triggerNotification(`Copie créée pour "${p.name}"`);
  };

  const handleToggleProductPublish = (id: string) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, published: p.published !== false ? false : true } : p
    );
    onProductsUpdated(updated);
    saveProducts(updated);
    const target = updated.find((p) => p.id === id);
    if (target) upsertProductRemote(target);
  };

  const handleToggleProductStock = (id: string) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, inStock: !p.inStock } : p
    );
    onProductsUpdated(updated);
    saveProducts(updated);
    const target = updated.find((p) => p.id === id);
    if (target) upsertProductRemote(target);
    triggerNotification('Statut de stock modifié');
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

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    onProductsUpdated(updated);
    saveProducts(updated);
    deleteProductRemote(id);
    setProductDeleteConfirmId(null);
    triggerNotification('Produit supprimé du catalogue');
  };

  const handleResetCatalog = () => {
    if (window.confirm('Voulez-vous vraiment réinitialiser tout le catalogue aux produits officiels Apple d’origine ?')) {
      const def = resetProducts();
      onProductsUpdated(def);
      triggerNotification('Catalogue réinitialisé avec succès');
    }
  };

  const handleUploadProductImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setFormProduct((prev) => ({
          ...prev,
          image: dataUrl,
          gallery: prev?.gallery ? [dataUrl, ...prev.gallery.filter((g) => g !== dataUrl)] : [dataUrl]
        }));
      };
      reader.readAsDataURL(file);
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

  // Add color to form
  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    const colorObj = { name: newColorName.trim(), hex: newColorHex };
    setFormProduct((prev) => ({
      ...prev,
      colors: [...(prev?.colors || []), colorObj]
    }));
    setNewColorName('');
  };

  const handleRemoveColor = (index: number) => {
    setFormProduct((prev) => ({
      ...prev,
      colors: (prev?.colors || []).filter((_, i) => i !== index)
    }));
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

  const handleSaveVideo = () => {
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
    onVideosUpdated(updated);
    saveVideos(updated);
    syncVideosRemote(updated);
    setVideoUrlInput('');
    setVideoTitleInput('');
    setIsAddingVideo(false);
    triggerNotification('Nouvelle vidéo ajoutée');
  };

  const handleToggleVideoPublish = (id: string) => {
    const updated = videos.map((v) =>
      v.id === id ? { ...v, published: !v.published } : v
    );
    onVideosUpdated(updated);
    saveVideos(updated);
    syncVideosRemote(updated);
  };

  const handleMoveVideo = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= videos.length) return;
    const clone = [...videos];
    const [moved] = clone.splice(index, 1);
    clone.splice(targetIndex, 0, moved);
    const reordered = clone.map((v, i) => ({ ...v, order: i + 1 }));
    onVideosUpdated(reordered);
    saveVideos(reordered);
    syncVideosRemote(reordered);
  };

  const handleDeleteVideo = (id: string) => {
    const updated = videos
      .filter((v) => v.id !== id)
      .map((v, i) => ({ ...v, order: i + 1 }));
    onVideosUpdated(updated);
    saveVideos(updated);
    deleteVideoRemote(id);
    setVideoDeleteConfirmId(null);
    triggerNotification('Vidéo supprimée');
  };

  const handleResetVideos = () => {
    if (window.confirm('Réinitialiser la liste des vidéos aux vidéos par défaut ?')) {
      const def = resetVideos();
      onVideosUpdated(def);
      triggerNotification('Vidéos réinitialisées');
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
  // TAB 4: STORE SETTINGS, HERO PHOTO & PIN
  // ==========================================
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);
  const [pinChangeCurrent, setPinChangeCurrent] = useState('');
  const [pinChangeNew, setPinChangeNew] = useState('');
  const [pinChangeConfirm, setPinChangeConfirm] = useState('');
  const [pinMessage, setPinMessage] = useState<{ text: string; error: boolean } | null>(null);

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
          setHeroPhotoSrc(dataUrl);
          triggerNotification("Photo de la section Hero mise à jour et publiée avec succès !");
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
    setHeroPhotoSrc(trimmed);
    setHeroPhotoUrlInput('');
    triggerNotification("Photo de la section Hero mise à jour avec succès !");
  };

  const handleResetHeroPhoto = () => {
    saveHeroCustomPhoto(null);
    setHeroPhotoSrc(null);
    setHeroPhotoPreview(null);
    triggerNotification("Photo de l'Hero réinitialisée à l'image officielle.");
  };

  const handleSaveStoreSettings = () => {
    saveStoreSettings(settingsForm);
    saveStoreSettingsRemote(settingsForm);
    triggerNotification('Paramètres de la boutique enregistrés !');
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinChangeCurrent !== settings.adminPin) {
      setPinMessage({ text: 'Le code PIN actuel est incorrect.', error: true });
      return;
    }
    if (pinChangeNew.length < 4) {
      setPinMessage({ text: 'Le nouveau code doit contenir au moins 4 caractères.', error: true });
      return;
    }
    if (pinChangeNew !== pinChangeConfirm) {
      setPinMessage({ text: 'La confirmation ne correspond pas au nouveau code.', error: true });
      return;
    }

    const updated = { ...settingsForm, adminPin: pinChangeNew };
    setSettingsForm(updated);
    saveStoreSettings(updated);
    setPinChangeCurrent('');
    setPinChangeNew('');
    setPinChangeConfirm('');
    setPinMessage({ text: 'Code PIN administrateur modifié avec succès !', error: false });
    setTimeout(() => setPinMessage(null), 4000);
  };

  const handleLogout = async () => {
    await signOutAdmin();
    setAdminAuthenticated(false);
    onClose();
  };

  const currentAdminEmail = getAdminEmail();

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
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Visuels Hero, Boutique & Sécurité</span>
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
                      key={p.id}
                      className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Product identity */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 p-1.5 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700">
                          <img
                            src={p.image}
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
                    key={vid.id}
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
                          src={vid.url}
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
                        src={heroPhotoPreview || heroPhotoSrc || heroTitaniumSample}
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
                      Frais de livraison standard Abidjan (FCFA)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.deliveryFee}
                      onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFee: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                    />
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

              {/* Admin Security PIN Change Form */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>Sécurité & Code Secret Administrateur</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Modifiez le code PIN requis pour déverrouiller l’espace administrateur sur ce navigateur.
                </p>

                <form onSubmit={handleUpdatePin} className="space-y-3 max-w-md text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Code PIN actuel
                    </label>
                    <input
                      type="password"
                      value={pinChangeCurrent}
                      onChange={(e) => setPinChangeCurrent(e.target.value)}
                      placeholder="••••"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nouveau code PIN
                    </label>
                    <input
                      type="password"
                      value={pinChangeNew}
                      onChange={(e) => setPinChangeNew(e.target.value)}
                      placeholder="Nouveau code"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirmer le nouveau code
                    </label>
                    <input
                      type="password"
                      value={pinChangeConfirm}
                      onChange={(e) => setPinChangeConfirm(e.target.value)}
                      placeholder="Confirmer"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none font-mono"
                    />
                  </div>

                  {pinMessage && (
                    <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                      pinMessage.error
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {pinMessage.text}
                    </div>
                  )}

                </form>
              </div>

              {/* Card 4: Supabase Cloud Database & Data Synchronization */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                        <span>Base de Données Cloud Supabase</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-normal">
                          {SUPABASE_PROJECT_ID} (eu-west-1)
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Persistance temps réel multi-appareils (catalogue, vidéos, commandes) avec isolation stricte des tables du magasin (<code className="text-emerald-600 dark:text-emerald-400">store_*</code>).
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
                          ? 'Base Cloud Opérationnelle'
                          : isSupabaseConfigured
                          ? 'Clés détectées (Non testé)'
                          : 'Mode Local Sécurisé (Cache actif)'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Cloud Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">ID Projet Supabase</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{SUPABASE_PROJECT_ID}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Région Cloud</span>
                    <span className="font-semibold text-slate-900 dark:text-white">eu-west-1 (Europe Ouest)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Isolation Données</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Strictement préfixé store_*</span>
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
                    <span>{supabaseStatus.loading ? 'Test en cours...' : 'Tester la connexion Supabase'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncToSupabase}
                    disabled={isSyncingSupabase}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Cloud className={`w-3.5 h-3.5 ${isSyncingSupabase ? 'animate-bounce' : ''}`} />
                    <span>{isSyncingSupabase ? 'Synchronisation en cours...' : 'Synchroniser le catalogue local vers Supabase'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSqlModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
                  >
                    <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Afficher le script SQL de migration</span>
                  </button>
                </div>

                {/* Help instructions for environment setup */}
                {!isSupabaseConfigured && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Comment activer la connexion à votre projet Supabase ({SUPABASE_PROJECT_ID}) ?</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1">
                      <li>
                        Ouvrez le tableau de bord Supabase : <a href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">Projet Oumar iPhone (eu-west-1)</a>
                      </li>
                      <li>
                        Dans <strong>Project Settings &gt; API</strong>, copiez la clé <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px]">anon public</code>.
                      </li>
                      <li>
                        Renseignez la variable <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px]">VITE_SUPABASE_ANON_KEY="..."</code> dans le fichier <code className="font-semibold">.env</code> du projet.
                      </li>
                      <li>
                        Exécutez le script SQL fourni dans l'éditeur SQL de Supabase (bouton ci-dessus) pour créer les tables <code className="text-emerald-600 dark:text-emerald-400">store_*</code> en toute sécurité.
                      </li>
                    </ol>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

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
                      Script SQL de Migration Supabase
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Projet : {SUPABASE_PROJECT_ID} (eu-west-1) · Tables <code className="text-emerald-600 dark:text-emerald-400">store_*</code> · Respect strict des tables scolaires
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
                        <span>Copier le script SQL</span>
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
                  Ouvrez l'éditeur SQL de votre console Supabase, collez ce script et cliquez sur <strong>Run</strong>.
                </span>
                <a
                  href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 ml-2"
                >
                  <span>Aller sur l'éditeur SQL Supabase</span>
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
                    <option value="MacBook">MacBook</option>
                    <option value="Accessoires">Accessoires</option>
                  </select>
                </div>

                {/* Condition */}
                <div>
                  <label className="block font-semibold mb-1">État du produit</label>
                  <select
                    value={formProduct.condition || 'Neuf Scellé'}
                    onChange={(e) => setFormProduct({ ...formProduct, condition: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Neuf Scellé">Neuf Scellé</option>
                    <option value="Reconditionné A+">Reconditionné A+</option>
                    <option value="Reconditionné Certifié">Reconditionné Certifié</option>
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
                    placeholder="100% Neuf ou 92% Optimale"
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

                {/* Image Upload / URL */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Image principale</label>
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

                {/* Colors Management */}
                <div className="sm:col-span-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Finitions & Couleurs
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {(formProduct.colors || []).map((col, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                      >
                        <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: col.hex }} />
                        <span>{col.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(idx)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2 items-center">
                    <input
                      type="text"
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      placeholder="Nom de la couleur (ex: Titane Désert)"
                      className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white"
                    />
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-10 h-8 p-0 bg-transparent border-0 cursor-pointer rounded-lg"
                      title="Choisir le code couleur HEX"
                    />
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    >
                      Ajouter
                    </button>
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
