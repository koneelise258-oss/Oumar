import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product } from '../types';
import { 
  Search, 
  X, 
  ArrowRight, 
  Check, 
  Smartphone, 
  Sparkles, 
  MessageCircle, 
  ShieldCheck,
  Tag,
  Clock
} from 'lucide-react';
import { getWhatsAppUrl } from '../data/storeSettings';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setSelectedCategory('Tous');
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Categories list
  const categories = ['Tous', 'iPhone', 'iPad', 'MacBook', 'Accessoires'];

  // Search filter
  const results = useMemo(() => {
    const published = products.filter((p) => p.published !== false);
    const q = query.trim().toLowerCase();

    return published.filter((p) => {
      // Category filter
      if (selectedCategory !== 'Tous' && p.category !== selectedCategory) {
        return false;
      }

      if (!q) return true; // Show all / suggestions if empty

      const matchName = p.name.toLowerCase().includes(q);
      const matchModel = p.model.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q) || false;
      const matchCondition = p.condition.toLowerCase().includes(q);
      const matchStorage = p.storage.some((s) => s.toLowerCase().includes(q));
      const matchColors = p.colors.some((c) => c.name.toLowerCase().includes(q));
      const matchSpecs = p.specs ? Object.values(p.specs).some((val) => val?.toLowerCase().includes(q)) : false;
      const matchPrice = p.price.toString().includes(q);

      return (
        matchName ||
        matchModel ||
        matchCategory ||
        matchDesc ||
        matchCondition ||
        matchStorage ||
        matchColors ||
        matchSpecs ||
        matchPrice
      );
    });
  }, [products, query, selectedCategory]);

  if (!isOpen) return null;

  const handleProductClick = (product: Product) => {
    onSelectProduct(product);
    onClose();
  };

  const whatsappInquiryMessage = `Bonjour OUMAR IPHONE, je recherche le modèle "${query || 'un smartphone spécifique'}" sur votre boutique. Pouvez-vous m'indiquer la disponibilité et le tarif à Abidjan ? Merci !`;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-12 flex items-start justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Recherche globale"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Search Modal Box */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white transition-all my-auto sm:my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400">
            <Search className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un iPhone 16 Pro, 256 Go, MacBook, Titane..."
            className="w-full bg-transparent text-sm sm:text-base font-medium placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white focus:outline-none"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Quick Filter Category Chips */}
        <div className="px-4 py-2.5 bg-slate-50/60 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Filtre :
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-400 shrink-0">
            {results.length} résultat{results.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-2">
          {results.length > 0 ? (
            results.map((product, sIdx) => (
              <div
                key={`search-${product.id || sIdx}-${sIdx}`}
                onClick={() => handleProductClick(product)}
                className="group p-3 sm:p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex items-center gap-3 sm:gap-4 cursor-pointer"
              >
                {/* Product Thumbnail */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 dark:bg-slate-800 p-1.5 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
                  <img
                    src={product.image || undefined}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                      {product.condition}
                    </span>
                    {product.inStock ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        En stock Abidjan
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-rose-500">
                        Sur commande
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {product.name}
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {product.model} · {product.storage.join(' · ')}
                  </p>
                </div>

                {/* Price & Action Arrow */}
                <div className="text-right shrink-0">
                  <div className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white tabular-nums">
                    {product.price.toLocaleString('fr-FR')} FCFA
                  </div>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="text-[11px] text-slate-400 line-through tabular-nums">
                      {product.originalPrice.toLocaleString('fr-FR')} FCFA
                    </div>
                  )}
                  <div className="hidden sm:flex items-center justify-end gap-1 text-[11px] font-semibold text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors mt-0.5">
                    <span>Voir la fiche</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Empty state friendly to Abidjan clients with WhatsApp assistant */
            <div className="py-12 px-6 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Aucun produit ne correspond à « {query} »
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                Le modèle ou la capacité que vous cherchez est peut-être disponible en boutique à Cocody ou au Plateau sur arrivage non encore répertorié.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={getWhatsAppUrl(whatsappInquiryMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Demander la disponibilité sur WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSelectedCategory('Tous');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Réinitialiser la recherche
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tous nos appareils sont vérifiés sur 35 points de contrôle Apple</span>
          </div>
          <span className="hidden sm:inline">OUMAR IPHONE · Abidjan</span>
        </div>

      </div>
    </div>
  );
};
