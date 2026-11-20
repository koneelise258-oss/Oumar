import { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Catalogue } from './components/Catalogue';
import { Footer } from './components/Footer';
import { NotFoundPage } from './components/NotFoundPage';
import { loadProducts } from './data/products';
import { loadVideos } from './data/videos';
import { fetchProductsRemote, fetchVideosRemote, fetchStoreSettingsRemote } from './services/storeService';
import { checkIsUserAdmin, supabase, isSupabaseConfigured } from './lib/supabase';
import { CartItem, Product, VideoItem } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getCombinationPrice, normalizeConditionName } from './utils/pricingUtils';
import {
  MASKED_ADMIN_PATH,
  isDecoyAdminLocation,
  verifySecretAdminLocation,
  isKnownPublicPath,
  clearUrlToRoot,
  maskAdminUrl,
  purgeSensitiveClientStorage
} from './utils/security';
import { ArrowUp, CheckCircle2, ShoppingBag, X } from 'lucide-react';

const CART_STORAGE_KEY = 'omr_cart_v1';
const DEFAULT_PAGE_TITLE = 'OUMAR IPHONE | Boutique Apple Abidjan';

function loadPersistedCart(catalog: Product[]): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const hydrated: CartItem[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') continue;
      const productId = entry.productId || entry.product?.id;
      const matched = catalog.find((p) => p.id === productId && p.published !== false);
      if (!matched) continue;
      const chosenStorage = typeof entry.chosenStorage === 'string' && entry.chosenStorage
        ? entry.chosenStorage
        : matched.selectedStorage || matched.storage?.[0] || 'Standard';
      const chosenColor = typeof entry.chosenColor === 'string' && entry.chosenColor
        ? entry.chosenColor
        : matched.selectedColor || matched.colors?.[0]?.name || 'Standard';
      const chosenCondition = normalizeConditionName(entry.chosenCondition || matched.condition);
      const qty = Math.min(20, Math.max(1, Math.floor(Number(entry.quantity) || 1)));
      const livePrice = getCombinationPrice(matched, chosenStorage, chosenCondition, chosenColor).price;
      hydrated.push({
        product: matched,
        quantity: qty,
        chosenStorage,
        chosenColor,
        chosenCondition,
        unitPrice: typeof livePrice === 'number' && livePrice > 0 ? livePrice : 0
      });
    }
    return hydrated;
  } catch {
    return [];
  }
}

// Chargement différé des composants secondaires et pages dédiées
const VideosSection = lazy(() => import('./components/VideosSection').then(m => ({ default: m.VideosSection })));
const SocialSection = lazy(() => import('./components/SocialSection').then(m => ({ default: m.SocialSection })));
const BoutiqueInfo = lazy(() => import('./components/BoutiqueInfo').then(m => ({ default: m.BoutiqueInfo })));
const ProductDetailPage = lazy(() => import('./components/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartDrawer = lazy(() => import('./components/CartDrawer').then(m => ({ default: m.CartDrawer })));
const GlobalSearchModal = lazy(() => import('./components/GlobalSearchModal').then(m => ({ default: m.GlobalSearchModal })));
const AdminAuthModal = lazy(() => import('./components/AdminAuthModal').then(m => ({ default: m.AdminAuthModal })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

type AdminViewState = null | 'login' | 'dashboard';

interface CartToastState {
  id: number;
  productName: string;
  variantLabel: string;
}

function StoreApp() {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [videos, setVideos] = useState<VideoItem[]>(loadVideos);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadPersistedCart(loadProducts()));
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Page 404 personnalisée (routes inexistantes, leurres /admin, /login, /espace-prive non authentifié)
  const [isNotFound, setIsNotFound] = useState(false);
  const [notFoundPath, setNotFoundPath] = useState<string>('');

  // Mémoire de la position exacte du défilement dans le catalogue
  const savedCatalogScrollYRef = useRef<number>(0);

  // Dedicated Product Detail Page State
  const [activeDetailProduct, setActiveDetailProduct] = useState<Product | null>(null);

  // Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Page Admin dédiée (plein écran, SANS pop-up)
  const [adminView, setAdminView] = useState<AdminViewState>(null);
  const adminViewRef = useRef<AdminViewState>(null);
  adminViewRef.current = adminView;

  // Interactivité : Barre de progression GPU + bouton retour en haut + toast panier
  const scrollProgressRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [cartToast, setCartToast] = useState<CartToastState | null>(null);
  const cartToastTimerRef = useRef<number | null>(null);
  const lastRemoteSyncAtRef = useRef<number>(0);

  // Nettoyage de sécurité au démarrage : ne jamais conserver de données clients (commandes PII) en localStorage public
  useEffect(() => {
    try {
      localStorage.removeItem('oumar_store_orders');
    } catch {
      // Ignore storage access errors
    }
  }, []);

  // Sauvegarde automatique du panier dans localStorage (sans aucune PII client)
  useEffect(() => {
    try {
      const compact = cartItems.map((it) => ({
        productId: it.product.id,
        quantity: it.quantity,
        chosenStorage: it.chosenStorage,
        chosenColor: it.chosenColor,
        chosenCondition: it.chosenCondition
      }));
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(compact));
    } catch {
      // Ignore storage quota restrictions
    }
  }, [cartItems]);

  // Réconciliation automatique du panier + fiche active quand le catalogue se met à jour
  useEffect(() => {
    if (!products || products.length === 0) return;

    setCartItems((prev) => {
      if (prev.length === 0) return prev;
      let changed = false;
      const next: CartItem[] = [];
      for (const item of prev) {
        const fresh = products.find((p) => p.id === item.product.id && p.published !== false);
        if (!fresh) {
          changed = true;
          continue;
        }
        const cond = normalizeConditionName(item.chosenCondition || fresh.condition);
        const livePrice = getCombinationPrice(fresh, item.chosenStorage, cond, item.chosenColor).price;
        const resolvedUnitPrice = typeof livePrice === 'number' && livePrice > 0 ? livePrice : 0;
        if (fresh !== item.product || resolvedUnitPrice !== (item.unitPrice || 0)) {
          changed = true;
          next.push({
            ...item,
            product: fresh,
            chosenCondition: cond,
            unitPrice: resolvedUnitPrice
          });
        } else {
          next.push(item);
        }
      }
      return changed ? next : prev;
    });

    setActiveDetailProduct((current) => {
      if (!current) return null;
      const updated = products.find((p) => p.id === current.id);
      return updated && updated !== current ? updated : current;
    });
  }, [products]);

  // Mise à jour automatique du titre de la page (SEO & onglet navigateur)
  useEffect(() => {
    if (adminView !== null) return; // AdminAuthModal / AdminDashboard gèrent leur propre titre
    if (isNotFound) {
      document.title = 'Page introuvable (404) — OUMAR IPHONE';
    } else if (activeDetailProduct) {
      document.title = `${activeDetailProduct.name} — OUMAR IPHONE Abidjan`;
    } else {
      document.title = DEFAULT_PAGE_TITLE;
    }
  }, [activeDetailProduct, isNotFound, adminView]);

  // Synchronisation automatique en arrière-plan (démarrage différé, retour d'onglet, reconnexion réseau)
  const syncRemoteData = useCallback((force = false) => {
    const now = Date.now();
    if (!force && now - lastRemoteSyncAtRef.current < 120_000) return;
    lastRemoteSyncAtRef.current = now;

    fetchProductsRemote(force)
      .then((remoteProds) => {
        if (Array.isArray(remoteProds) && remoteProds.length > 0) {
          setProducts(remoteProds);
        }
      })
      .catch(() => {});

    fetchVideosRemote()
      .then((remoteVideos) => {
        if (Array.isArray(remoteVideos)) {
          setVideos(remoteVideos);
        }
      })
      .catch(() => {});

    fetchStoreSettingsRemote().catch(() => {});
  }, []);

  useEffect(() => {
    let cancelIdle: (() => void) | undefined;
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(() => syncRemoteData(true), { timeout: 1500 });
      cancelIdle = () => (window as any).cancelIdleCallback(id);
    } else {
      const timer = setTimeout(() => syncRemoteData(true), 250);
      cancelIdle = () => clearTimeout(timer);
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncRemoteData(false);
      }
    };
    const handleOnline = () => syncRemoteData(true);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);

    return () => {
      cancelIdle?.();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, [syncRemoteData]);

  // Synchronisation automatique inter-onglets (produits, vidéos, panier)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'oumar_store_products') {
        setProducts(loadProducts());
      } else if (e.key === 'oumar_store_videos') {
        setVideos(loadVideos());
      } else if (e.key === CART_STORAGE_KEY) {
        setCartItems(loadPersistedCart(loadProducts()));
      } else if (e.key === 'oumar_store_settings') {
        window.dispatchEvent(new CustomEvent('oumar_settings_updated'));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Déclenchement sécurisé de la page Admin dédiée (Fail-Closed + masquage d'URL vers /espace-prive)
  const handleTriggerAdmin = useCallback(async () => {
    maskAdminUrl();
    setIsNotFound(false);
    setActiveDetailProduct(null);
    document.body.style.overflow = '';
    window.scrollTo({ top: 0, behavior: 'auto' });

    try {
      const adminCheck = await checkIsUserAdmin();
      if (adminCheck.isAdmin && adminCheck.record) {
        setAdminView('dashboard');
      } else {
        setAdminView('login');
      }
    } catch {
      setAdminView('login');
    }
  }, []);

  const handleAuthSuccess = useCallback(() => {
    maskAdminUrl();
    setIsNotFound(false);
    setAdminView('dashboard');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const handleExitAdmin = useCallback(() => {
    setAdminView(null);
    setIsNotFound(false);
    setActiveSection('home');
    clearUrlToRoot();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // Surveillance en temps réel de l'état de session Supabase (fermeture immédiate si déconnexion ou expiration)
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (adminViewRef.current === 'dashboard') {
          setAdminView(null);
          clearUrlToRoot();
        }
        purgeSensitiveClientStorage();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Sync products across tabs and admin updates
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setProducts(e.detail);
      }
    };
    window.addEventListener('oumar_products_updated', handleUpdate);
    return () => window.removeEventListener('oumar_products_updated', handleUpdate);
  }, []);

  // Sync videos across tabs and admin updates
  useEffect(() => {
    const handleVideosUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setVideos(e.detail);
      }
    };
    window.addEventListener('oumar_videos_updated', handleVideosUpdate);
    return () => window.removeEventListener('oumar_videos_updated', handleVideosUpdate);
  }, []);

  // Router & Stealth Admin Detection + Page 404 personnalisée :
  // - /portail-<clé> ou ?portail=<clé> ou #<clé> : ouvre la page admin dédiée et masque l'URL en /espace-prive
  // - /espace-prive sans session admin active : affiche la page 404 personnalisée (zéro fuite)
  // - /admin, /login, /wp-admin, /dashboard, #admin : affiche la page 404 personnalisée
  // - Toute URL inconnue ou /produit/<slug-introuvable> : affiche la page 404 personnalisée
  useEffect(() => {
    let cancelled = false;

    const handleLocation = async () => {
      const path = window.location.pathname || '/';
      const cleanPath = path.replace(/\/+$/, '') || '/';
      const hash = window.location.hash.replace('#', '');
      const search = window.location.search;

      // 1. Portail furtif privé (code intégré ou code personnalisé SHA-256) : masque l'URL vers /espace-prive et ouvre la page dédiée Admin
      const isSecret = await verifySecretAdminLocation(search, window.location.hash, path);
      if (cancelled) return;
      if (isSecret) {
        handleTriggerAdmin();
        return;
      }

      // 2. Chemin masqué /espace-prive :
      //    - Si déjà dans la page admin (connexion ou dashboard), ne rien perturber lors des mises à jour produits
      //    - Sinon (accès direct ou rechargement), vérifier la session JWT admin -> si non autorisé, 404
      if (cleanPath === MASKED_ADMIN_PATH) {
        if (adminViewRef.current !== null) {
          return;
        }
        checkIsUserAdmin()
          .then((check) => {
            if (cancelled) return;
            if (check.isAdmin && check.record) {
              setIsNotFound(false);
              setAdminView('dashboard');
            } else {
              setAdminView(null);
              setIsNotFound(true);
              setNotFoundPath(cleanPath);
            }
          })
          .catch(() => {
            if (cancelled) return;
            setAdminView(null);
            setIsNotFound(true);
            setNotFoundPath(cleanPath);
          });
        return;
      }

      // Si l'utilisateur quitte /espace-prive via le bouton Précédent du navigateur
      if (adminViewRef.current !== null) {
        setAdminView(null);
      }

      // 3. Dissimulation totale : routes classiques /admin, /login, /wp-admin, #admin -> page 404 neutre
      if (isDecoyAdminLocation(path, window.location.hash)) {
        setActiveDetailProduct(null);
        document.body.style.overflow = '';
        setIsNotFound(true);
        setNotFoundPath(cleanPath !== '/' ? cleanPath : `/#${hash}`);
        return;
      }

      // 4. Fiche produit dédiée /produit/:id ou #produit/:id
      if (path.startsWith('/produit/') || hash.startsWith('produit/')) {
        const slug = path.startsWith('/produit/')
          ? decodeURIComponent(path.replace('/produit/', '').trim())
          : decodeURIComponent(hash.replace('produit/', '').trim());

        if (slug) {
          const matched = products.find(
            (p) =>
              p.id === slug ||
              p.id.toLowerCase() === slug.toLowerCase() ||
              p.name.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
          );

          if (matched) {
            setIsNotFound(false);
            setActiveDetailProduct(matched);
            return;
          }
        }

        // Produit introuvable -> Page 404 personnalisée
        if (products.length > 0) {
          setActiveDetailProduct(null);
          document.body.style.overflow = '';
          setIsNotFound(true);
          setNotFoundPath(cleanPath !== '/' ? cleanPath : `/#${hash}`);
          return;
        }
      }

      // 5. Toute autre route inconnue -> Page 404 personnalisée
      if (!isKnownPublicPath(cleanPath)) {
        setActiveDetailProduct(null);
        document.body.style.overflow = '';
        setIsNotFound(true);
        setNotFoundPath(cleanPath);
        return;
      }

      // 6. Route publique valide
      setIsNotFound(false);

      if (activeDetailProduct) {
        setActiveDetailProduct(null);
        document.body.style.overflow = '';
        requestAnimationFrame(() => {
          window.scrollTo(0, savedCatalogScrollYRef.current);
        });
      }

      const pathSection = cleanPath !== '/' && cleanPath !== '/index.html' ? cleanPath.replace(/^\//, '') : '';
      const target = hash || pathSection;
      if (target && target !== 'home') {
        setActiveSection(target);
        setTimeout(() => {
          const el = document.getElementById(target);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 120);
      } else {
        setActiveSection('home');
      }
    };

    handleLocation();
    window.addEventListener('popstate', handleLocation);
    return () => {
      cancelled = true;
      window.removeEventListener('popstate', handleLocation);
    };
  }, [products, handleTriggerAdmin]);

  // Global Keyboard Shortcuts:
  // - Ctrl+K / Cmd+K : Recherche catalogue
  // - Ctrl+Alt+Shift+O : Accès furtif direction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = ((e.target as HTMLElement)?.tagName || '').toUpperCase();
      const isEditable = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
        if (adminViewRef.current !== null) return;
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (
        (e.ctrlKey || e.metaKey) &&
        e.altKey &&
        e.shiftKey &&
        e.key.toLowerCase() === 'o' &&
        !isEditable
      ) {
        e.preventDefault();
        handleTriggerAdmin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTriggerAdmin]);

  // Scroll tracking léger (GPU progress bar + section active + bouton retour en haut)
  useEffect(() => {
    if (activeDetailProduct || adminView !== null || isNotFound) {
      setShowBackToTop(false);
      return;
    }

    const sectionIds = ['videos', 'catalogue', 'garantie'];
    let rafId: number | null = null;

    const updateOnScroll = () => {
      rafId = null;
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (scrollProgressRef.current) {
        const ratio = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;
        scrollProgressRef.current.style.transform = `scaleX(${ratio})`;
      }

      setShowBackToTop((prev) => {
        const next = scrollY > 560;
        return prev === next ? prev : next;
      });

      if (scrollY < 360) {
        setActiveSection((prev) => (prev === 'home' ? prev : 'home'));
        return;
      }

      const scrollPos = scrollY + 220;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el && scrollPos >= el.offsetTop) {
          setActiveSection((prev) => (prev === id ? prev : id));
          return;
        }
      }
    };

    const handleScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateOnScroll);
      }
    };

    updateOnScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [activeDetailProduct, adminView, isNotFound]);

  const handleNavigateSection = (sectionId: string) => {
    if (isNotFound) {
      setIsNotFound(false);
    }
    if (activeDetailProduct) {
      setActiveDetailProduct(null);
      document.body.style.overflow = '';
    }

    if (sectionId === 'home') {
      window.history.pushState(null, '', '/');
      setActiveSection('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.history.pushState(null, '', `/#${sectionId}`);
      setActiveSection(sectionId);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, isNotFound ? 80 : 0);
    }
  };

  // Select Product & Route to Dedicated Full-Viewport Overlay Sheet
  const handleSelectProduct = (product: Product) => {
    savedCatalogScrollYRef.current = window.scrollY;
    setIsNotFound(false);
    setActiveDetailProduct(product);
    document.body.style.overflow = 'hidden';
    window.history.pushState({ isProductDetail: true }, '', `/produit/${product.id}`);
  };

  const handleBackToCatalog = () => {
    setActiveDetailProduct(null);
    document.body.style.overflow = '';
    window.history.pushState(null, '', '/#catalogue');
    requestAnimationFrame(() => {
      window.scrollTo(0, savedCatalogScrollYRef.current);
    });
  };

  // Add to cart with independent combination pricing + interactive confirmation toast
  const handleAddToCart = (
    product: Product,
    storage?: string,
    color?: string,
    condition?: string,
    customPrice?: number | null
  ) => {
    const chosenStorage = storage || product.selectedStorage || (Array.isArray(product.storage) ? product.storage[0] : '') || 'Standard';
    const chosenColor = color || product.selectedColor || (product.colors && product.colors[0]?.name) || 'Standard';
    const chosenCondition = condition || normalizeConditionName(product.condition);

    const resolvedPrice = typeof customPrice === 'number' && customPrice >= 0
      ? customPrice
      : (getCombinationPrice(product, chosenStorage, chosenCondition, chosenColor).price || 0);

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (it) =>
          it.product.id === product.id &&
          it.chosenStorage === chosenStorage &&
          it.chosenColor === chosenColor &&
          (it.chosenCondition || '') === (chosenCondition || '')
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(20, updated[existingIndex].quantity + 1)
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            chosenStorage,
            chosenColor,
            chosenCondition,
            unitPrice: resolvedPrice
          }
        ];
      }
    });

    // Notification discrète et interactive
    if (cartToastTimerRef.current !== null) {
      window.clearTimeout(cartToastTimerRef.current);
    }
    setCartToast({
      id: Date.now(),
      productName: product.name,
      variantLabel: [chosenStorage, chosenColor].filter(Boolean).join(' · ')
    });
    cartToastTimerRef.current = window.setTimeout(() => {
      setCartToast(null);
      cartToastTimerRef.current = null;
    }, 3400);
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    const safeQty = Math.floor(Number(newQty));
    if (!Number.isFinite(safeQty) || safeQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const cappedQty = Math.min(20, safeQty);
    setCartItems((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], quantity: cappedQty };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // =========================================================================
  // PAGE ADMIN DÉDIÉE (PLEIN ÉCRAN — ZÉRO POP-UP, ZÉRO BOUTIQUE EN ARRIÈRE-PLAN)
  // =========================================================================
  if (adminView === 'login') {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#fafbfc] dark:bg-[#0b0f17] flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <AdminAuthModal
          isOpen={true}
          onClose={handleExitAdmin}
          onSuccess={handleAuthSuccess}
        />
      </Suspense>
    );
  }

  if (adminView === 'dashboard') {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#080c14] flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <AdminDashboard
          isOpen={true}
          onClose={handleExitAdmin}
          products={products}
          onProductsUpdated={(updated) => setProducts(updated)}
          videos={videos}
          onVideosUpdated={(updated) => setVideos(updated)}
        />
      </Suspense>
    );
  }

  // =========================================================================
  // STOREFRONT PUBLIC + PAGE 404 PERSONNALISÉE
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc] dark:bg-[#0b0f17] text-[#0f172a] dark:text-[#f8fafc] transition-colors duration-300">
      {/* Fine barre de progression de lecture (GPU transform only) */}
      {!isNotFound && !activeDetailProduct && (
        <div
          aria-hidden="true"
          className="fixed top-0 left-0 right-0 h-[2.5px] z-[60] pointer-events-none bg-transparent"
        >
          <div
            ref={scrollProgressRef}
            className="h-full w-full origin-left bg-gradient-to-r from-slate-900 via-amber-500 to-emerald-500 dark:from-white dark:via-amber-400 dark:to-emerald-400 will-change-transform"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      )}

      {/* Top Bar Header with Dark Mode Toggle, Search & Navigation */}
      <Header
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        activeSection={isNotFound ? '' : activeSection}
        onNavigateSection={handleNavigateSection}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isNotFound ? (
          <NotFoundPage
            requestedPath={notFoundPath}
            onGoHome={() => handleNavigateSection('home')}
            onGoCatalogue={() => handleNavigateSection('catalogue')}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        ) : (
          <Suspense fallback={
            <div className="min-h-[300px] flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            {/* 1. Hero section */}
            <Hero
              featuredProduct={products[0]}
              onAddToCart={(product) => handleAddToCart(product)}
            />

            {/* 2. Section des Vidéos */}
            <VideosSection
              id="videos"
              videos={videos}
            />

            {/* 3. Catalogue Apple Officiel avec filtres et fiches */}
            <Catalogue
              products={products}
              onAddToCart={handleAddToCart}
              onProductsUpdated={(newProducts) => setProducts(newProducts)}
              onSelectProduct={handleSelectProduct}
            />

            {/* 4. Nos Réseaux Sociaux (TikTok & WhatsApp) */}
            <SocialSection />

            {/* 5. Informations boutique, SAV & garantie */}
            <BoutiqueInfo />

            {/* Full-screen Product Detail Overlay Sheet */}
            {activeDetailProduct && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-[#fafbfc] dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]">
                <ProductDetailPage
                  product={activeDetailProduct}
                  onBack={handleBackToCatalog}
                  onAddToCart={handleAddToCart}
                />
              </div>
            )}
          </Suspense>
        )}
      </main>

      {/* Footer (aucun lien admin visible pour les visiteurs) */}
      <Footer onSecretAccess={handleTriggerAdmin} />

      {/* Bouton flottant Retour en haut (ergonomique 48x48px sur mobile) */}
      {showBackToTop && !isCartOpen && !isSearchOpen && !activeDetailProduct && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Remonter en haut de la page"
          title="Remonter en haut"
          className="fixed bottom-5 right-4 sm:bottom-7 sm:right-6 z-40 w-12 h-12 rounded-2xl bg-slate-950/90 dark:bg-white/95 text-white dark:text-slate-950 shadow-lg border border-white/15 dark:border-slate-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Toast interactif d'ajout au panier */}
      {cartToast && !isCartOpen && (
        <div
          key={cartToast.id}
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-4 right-20 sm:left-auto sm:right-20 sm:w-[340px] z-50 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-2xl shadow-2xl border border-slate-800 dark:border-slate-200 px-3.5 py-3 flex items-center justify-between gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 dark:text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">{cartToast.productName}</div>
              <div className="text-[11px] text-slate-300 dark:text-slate-600 truncate">
                Ajouté · {cartToast.variantLabel}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setCartToast(null);
                setIsCartOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/15 dark:bg-slate-900 text-white text-[11px] font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Panier</span>
            </button>
            <button
              type="button"
              onClick={() => setCartToast(null)}
              aria-label="Fermer la notification"
              className="p-1.5 text-slate-400 hover:text-white dark:hover:text-slate-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tiroir Panier & Modale Recherche */}
      <Suspense fallback={null}>
        {isCartOpen && (
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
          />
        )}

        {isSearchOpen && (
          <GlobalSearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            products={products}
            onSelectProduct={(p) => {
              setIsSearchOpen(false);
              handleSelectProduct(p);
            }}
          />
        )}
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <StoreApp />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
