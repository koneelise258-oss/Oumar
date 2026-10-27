import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { VideosSection } from './components/VideosSection';
import { Catalogue } from './components/Catalogue';
import { BoutiqueInfo } from './components/BoutiqueInfo';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { loadProducts } from './data/products';
import { loadVideos } from './data/videos';
import { isAdminAuthenticated } from './data/storeSettings';
import { CartItem, Product, VideoItem } from './types';
import { ThemeProvider } from './context/ThemeContext';

function StoreApp() {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [videos, setVideos] = useState<VideoItem[]>(loadVideos);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedSearchProduct, setSelectedSearchProduct] = useState<Product | null>(null);

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

  // Handle URL hashes (#admin, #videos, etc.)
  useEffect(() => {
    const handleLocation = () => {
      const hash = window.location.hash.replace('#', '');
      const path = window.location.pathname.replace('/', '');

      if (hash === 'admin' || path === 'admin') {
        handleTriggerAdmin();
        return;
      }

      const target = hash || (path === 'videos' ? 'videos' : '');
      if (target) {
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
  }, []);

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

  // Active section tracking as user scrolls past sections
  useEffect(() => {
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
  }, []);

  const handleNavigateSection = (sectionId: string) => {
    if (sectionId === 'home') {
      window.history.pushState(null, '', '/');
      setActiveSection('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.history.pushState(null, '', `#${sectionId}`);
      setActiveSection(sectionId);
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Safe Admin Access Trigger
  const handleTriggerAdmin = () => {
    if (isAdminAuthenticated()) {
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

  // Add to cart from Hero or Catalogue
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

  const handleSelectProductFromSearch = (product: Product) => {
    setSelectedSearchProduct(product);
    // Smooth scroll to catalogue section
    const el = document.getElementById('catalogue');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
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

      {/* Main Content: Continuous Homepage Layout */}
      <main className="flex-1">
        {/* 1. Hero OUMAR IPHONE */}
        <Hero
          featuredProduct={products[0]}
          onAddToCart={(product) => handleAddToCart(product)}
        />

        {/* 2. Espace Vidéos Immersif (au centre, entre Hero et Catalogue) */}
        <VideosSection
          id="videos"
          videos={videos}
        />

        {/* 3. Catalogue Apple Officiel avec filtres et fiches */}
        <Catalogue
          products={products}
          onAddToCart={handleAddToCart}
          onProductsUpdated={(newProducts) => setProducts(newProducts)}
          externalActiveProduct={selectedSearchProduct}
          onCloseExternalProduct={() => setSelectedSearchProduct(null)}
        />

        {/* 4. Informations boutique, SAV & garantie */}
        <BoutiqueInfo />
      </main>

      {/* Footer with discreet Admin Portal Trigger */}
      <Footer onOpenAdmin={handleTriggerAdmin} />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Global Real-Time Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onSelectProduct={handleSelectProductFromSearch}
      />

      {/* Secure Admin PIN/Password Gate Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Complete Unified Admin Dashboard */}
      <AdminDashboard
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
        products={products}
        onProductsUpdated={(updated) => setProducts(updated)}
        videos={videos}
        onVideosUpdated={(updated) => setVideos(updated)}
      />
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
