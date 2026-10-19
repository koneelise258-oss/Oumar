import { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Catalogue } from './components/Catalogue';
import { BoutiqueInfo } from './components/BoutiqueInfo';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { PRODUCTS } from './data/products';
import { CartItem, Product } from './types';
import { ThemeProvider } from './context/ThemeContext';

function StoreApp() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Add to cart from Hero or Catalogue
  const handleAddToCart = (product: Product, storage?: string, color?: string) => {
    const chosenStorage = storage || product.selectedStorage || product.storage[0];
    const chosenColor = color || product.selectedColor || product.colors[0].name;

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
            chosenColor
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
      {/* Top Bar Header with Dark Mode Toggle */}
      <Header
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Hero Section — The Modern Liquid Glass Experience */}
      <main className="flex-1">
        <Hero
          featuredProduct={PRODUCTS[0]}
          onAddToCart={(product) => handleAddToCart(product)}
        />

        {/* Catalog Section */}
        <Catalogue
          products={PRODUCTS}
          onAddToCart={handleAddToCart}
        />

        {/* Boutique & SAV Details in Abidjan */}
        <BoutiqueInfo />
      </main>

      {/* Footer */}
      <Footer />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
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
