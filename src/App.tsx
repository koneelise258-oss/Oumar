import { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Catalogue } from './components/Catalogue';
import { Footer } from './components/Footer';
import { loadProducts } from './data/products';
import { loadVideos } from './data/videos';
import { fetchProductsRemote, fetchVideosRemote, fetchStoreSettingsRemote } from './services/storeService';
import { checkIsUserAdmin } from './lib/supabase';
import { CartItem, Product, VideoItem } from './types';
import { ThemeProvider } from './context/ThemeContext';

// Chargement différé des composants secondaires et modales lourdes
const VideosSection = lazy(() => import('./components/VideosSection').then(m => ({ default: m.VideosSection })));
const SocialSection = lazy(() => import('./components/SocialSection').then(m => ({ default: m.SocialSection })));
const BoutiqueInfo = lazy(() => import('./components/BoutiqueInfo').then(m => ({ default: m.BoutiqueInfo })));
const ProductDetailPage = lazy(() => import('./components/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartDrawer = lazy(() => import('./components/CartDrawer').then(m => ({ default: m.CartDrawer })));
const GlobalSearchModal = lazy(() => import('./components/GlobalSearchModal').then(m => ({ default: m.GlobalSearchModal })));
const AdminAuthModal = lazy(() => import('./components/AdminAuthModal').then(m => ({ default: m.AdminAuthModal })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

function StoreApp() {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [videos, setVideos] = useState<VideoItem[]>(loadVideos);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Dedicated Product Detail Page State
  const [activeDetailProduct, setActiveDetailProduct] = useState<Product | null>(null);

  // Synchronisation en arrière-plan différée pour libérer le fil principal au démarrage
  useEffect(() => {
    const syncRemoteData = () => {
      fetchProductsRemote().then((remoteProds) => {
        if (Array.isArray(remoteProds) && remoteProds.length > 0) {
          setProducts(remoteProds);
        }
      }).catch(() => {});

      fetchVideosRemote().then((remoteVideos) => {
        if (Array.isArray(remoteVideos)) {
          setVideos(remoteVideos);
        }
      }).catch(() => {});

      fetchStoreSettingsRemote().catch(() => {});
    };

    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(syncRemoteData, { timeout: 1500 });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const timer = setTimeout(syncRemoteData, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  // Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Admin Space States
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

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

  // Dedicated Product Page Router: Handles /produit/:id and #produit/:id URLs & Browser Back/Forward
  useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname;
      const hash = window.location.hash.replace('#', '');

      if (hash === 'admin' || path === '/admin') {
        handleTriggerAdmin();
        return;
      }

      // Check if URL points to a product detail page /produit/:id or #produit/:id
      if (path.startsWith('/produit/') || hash.startsWith('produit/')) {
        const slug = path.startsWith('/produit/') 
          ? path.replace('/produit/', '').trim() 
          : hash.replace('produit/', '').trim();

        if (slug) {
          const matched = products.find(
            (p) =>
              p.id === slug ||
              p.id.toLowerCase() === slug.toLowerCase() ||
              p.name.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
          );

          if (matched) {
            setActiveDetailProduct(matched);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
        }
      }

      // Default: Return to main homepage continuous layout
      setActiveDetailProduct(null);

      const target = hash || (path === '/videos' ? 'videos' : '');
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
    return () => window.removeEventListener('popstate', handleLocation);
  }, [products]);

  // Global Keyboard Shortcuts (Ctrl+K for search, Shift+A for admin)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.shiftKey && e.key.toUpperCase() === 'A' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        handleTriggerAdmin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Active section tracking as user scrolls past sections on homepage
  useEffect(() => {
    if (activeDetailProduct) return;
    const sectionIds = ['videos', 'catalogue', 'garantie'];
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY < 380) {
        setActiveSection('home');
        return;
      }
      const scrollPos = scrollY + 220;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el && scrollPos >= el.offsetTop) {
          setActiveSection(id);
          return;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeDetailProduct]);

  const handleNavigateSection = (sectionId: string) => {
    if (activeDetailProduct) {
      setActiveDetailProduct(null);
    }

    if (sectionId === 'home') {
      window.history.pushState(null, '', '/');
      setActiveSection('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.history.pushState(null, '', `/#${sectionId}`);
      setActiveSection(sectionId);
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Select Product & Route to Dedicated Product Page
  const handleSelectProduct = (product: Product) => {
    setActiveDetailProduct(product);
    window.history.pushState(null, '', `/produit/${product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCatalog = () => {
    setActiveDetailProduct(null);
    window.history.pushState(null, '', '/#catalogue');
    setTimeout(() => {
      const el = document.getElementById('catalogue');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  // Safe Admin Access Trigger
  const handleTriggerAdmin = async () => {
    const adminCheck = await checkIsUserAdmin();
    if (adminCheck.isAdmin) {
      setIsAdminDashboardOpen(true);
      setIsAdminAuthOpen(false);
    } else {
      setIsAdminAuthOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAdminAuthOpen(false);
    setIsAdminDashboardOpen(true);
  };

  // Add to cart
  const handleAddToCart = (product: Product, storage?: string, color?: string) => {
    const chosenStorage = storage || product.selectedStorage || product.storage[0] || 'Standard';
    const chosenColor = color || product.selectedColor || product.colors[0]?.name || 'Standard';
    const unitPrice = (product.storagePrices && product.storagePrices[chosenStorage])
      ? product.storagePrices[chosenStorage]
      : product.price;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (it) =>
          it.product.id === product.id &&
          it.chosenStorage === chosenStorage &&
          it.chosenColor === chosenColor
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            chosenStorage,
            chosenColor,
            unitPrice
          }
        ];
      }
    });
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setCartItems((prev) => {
      const updated = [...prev];
      updated[index].quantity = newQty;
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

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc] dark:bg-[#0b0f17] text-[#0f172a] dark:text-[#f8fafc] transition-colors duration-300">
      {/* Top Bar Header with Dark Mode Toggle, Search & Navigation */}
      <Header
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        activeSection={activeSection}
        onNavigateSection={handleNavigateSection}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAdmin={handleTriggerAdmin}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        <Suspense fallback={
          <div className="min-h-[300px] flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          {activeDetailProduct ? (
            /* Real Standalone Product Detail Page View */
            <ProductDetailPage
              product={activeDetailProduct}
              onBack={handleBackToCatalog}
              onAddToCart={handleAddToCart}
            />
          ) : (
            /* Continuous Homepage Layout (Hero -> Videos -> Catalogue -> Socials -> BoutiqueInfo) */
            <>
              {/* 1. Hero OUMAR IPHONE */}
              <Hero
                featuredProduct={products[0]}
                onAddToCart={(product) => handleAddToCart(product)}
              />

              {/* 2. Section des Vidéos (immédiatement après la Hero, avant le catalogue) */}
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

              {/* 4. Nos Réseaux Sociaux (TikTok & WhatsApp - après le catalogue) */}
              <SocialSection />

              {/* 5. Informations boutique, SAV & garantie */}
              <BoutiqueInfo />
            </>
          )}
        </Suspense>
      </main>

      {/* Footer with discreet Admin Portal Trigger */}
      <Footer onOpenAdmin={handleTriggerAdmin} />

      {/* Modales & Tiroir de Panier avec Suspense */}
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

        {isAdminAuthOpen && (
          <AdminAuthModal
            isOpen={isAdminAuthOpen}
            onClose={() => setIsAdminAuthOpen(false)}
            onSuccess={handleAuthSuccess}
          />
        )}

        {isAdminDashboardOpen && (
          <AdminDashboard
            isOpen={isAdminDashboardOpen}
            onClose={() => setIsAdminDashboardOpen(false)}
            products={products}
            onProductsUpdated={(updated) => setProducts(updated)}
            videos={videos}
            onVideosUpdated={(updated) => setVideos(updated)}
          />
        )}
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <StoreApp />
    </ThemeProvider>
  );
}
