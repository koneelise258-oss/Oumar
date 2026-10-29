import React, { useState, useMemo } from 'react';
import { Product, ProductCategory } from '../types';
import { 
  ShoppingBag, 
  MessageCircle, 
  ShieldCheck, 
  Check, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  X, 
  Eye, 
  RotateCcw,
  Sparkles,
  Settings,
  ChevronDown
} from 'lucide-react';
import { WHATSAPP_URL } from '../data/products';
import { ProductModal } from './ProductModal';
interface CatalogueProps {
  products: Product[];
  onAddToCart: (product: Product, storage: string, color: string) => void;
  onProductsUpdated?: (products: Product[]) => void;
  onSelectProduct?: (product: Product) => void;
  externalActiveProduct?: Product | null;
  onCloseExternalProduct?: () => void;
}

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'name';

export const Catalogue: React.FC<CatalogueProps> = ({ 
  products, 
  onAddToCart,
  onProductsUpdated,
  onSelectProduct,
  externalActiveProduct,
  onCloseExternalProduct
}) => {
  // Selected category tab
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [selectedCondition, setSelectedCondition] = useState<string>('Tous');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [selectedStorageFilter, setSelectedStorageFilter] = useState<string>('Tous');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  // Interactive card state (per-card selected capacity & color)
  const [cardStorages, setCardStorages] = useState<Record<string, string>>({});
  const [cardColors, setCardColors] = useState<Record<string, string>>({});
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Product modal state
  const [internalModalProduct, setInternalModalProduct] = useState<Product | null>(null);
  const activeModalProduct = externalActiveProduct !== undefined ? externalActiveProduct : internalModalProduct;
  const setActiveModalProduct = (p: Product | null) => {
    setInternalModalProduct(p);
    if (!p && onCloseExternalProduct) {
      onCloseExternalProduct();
    }
  };

  // Available categories with count
  const categories = useMemo(() => {
    const list: string[] = ['Tous', 'iPhone', 'iPad', 'iPhone Duo', 'MacBook', 'Accessoires'];
    return list;
  }, []);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.published !== false)
      .filter((p) => {
        // Category filter
        if (selectedCategory !== 'Tous' && p.category !== selectedCategory) {
          return false;
        }

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchModel = p.model.toLowerCase().includes(q);
          const matchDesc = p.description?.toLowerCase().includes(q) || false;
          const matchStorage = p.storage.some((s) => s.toLowerCase().includes(q));
          const matchColor = p.colors.some((c) => c.name.toLowerCase().includes(q));
          if (!matchName && !matchModel && !matchDesc && !matchStorage && !matchColor) {
            return false;
          }
        }

        // Condition filter
        if (selectedCondition !== 'Tous' && p.condition !== selectedCondition) {
          return false;
        }

        // Stock filter
        if (onlyInStock && !p.inStock) {
          return false;
        }

        // Storage filter
        if (selectedStorageFilter !== 'Tous' && !p.storage.includes(selectedStorageFilter)) {
          return false;
        }

        // Price range filter
        if (priceRange === 'under-500k' && p.price >= 500000) return false;
        if (priceRange === '500k-1m' && (p.price < 500000 || p.price > 1000000)) return false;
        if (priceRange === 'over-1m' && p.price <= 1000000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        // Default: featured first, then original order
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
  }, [
    products,
    selectedCategory,
    searchQuery,
    selectedCondition,
    onlyInStock,
    selectedStorageFilter,
    priceRange,
    sortBy
  ]);

  // Check if any filter is active
  const hasActiveFilters = 
    selectedCategory !== 'Tous' ||
    searchQuery.trim() !== '' ||
    selectedCondition !== 'Tous' ||
    onlyInStock ||
    selectedStorageFilter !== 'Tous' ||
    priceRange !== 'all';

  const resetAllFilters = () => {
    setSelectedCategory('Tous');
    setSearchQuery('');
    setSelectedCondition('Tous');
    setOnlyInStock(false);
    setSelectedStorageFilter('Tous');
    setPriceRange('all');
    setSortBy('featured');
  };

  const handleCardStorageChange = (e: React.MouseEvent, productId: string, storage: string) => {
    e.stopPropagation();
    setCardStorages((prev) => ({ ...prev, [productId]: storage }));
  };

  const handleCardColorChange = (e: React.MouseEvent, productId: string, color: string) => {
    e.stopPropagation();
    setCardColors((prev) => ({ ...prev, [productId]: color }));
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const storage = cardStorages[product.id] || product.storage[0] || 'Standard';
    const color = cardColors[product.id] || product.colors[0]?.name || 'Standard';
    onAddToCart(product, storage, color);

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  return (
    <section id="catalogue" className="py-16 sm:py-24 bg-[#fafbfc] dark:bg-[#0b0f17] border-t border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>DISPONIBLE À ABIDJAN · STOCK EN TEMPS RÉEL</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white font-['Outfit']">
              Catalogue Apple Officiel
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md hidden lg:block">
              Sélection inspectée sur 35 points de contrôle. Livraison express 2h à Abidjan ou retrait immédiat en boutique.
            </p>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = cat === 'Tous' 
              ? products.filter(p => p.published !== false).length 
              : products.filter(p => p.published !== false && p.category === cat).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md ring-1 ring-slate-950/10'
                    : 'bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected 
                    ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-950' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Filter Toggle & Sort Controls */}
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 mb-8 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un modèle, couleur, capacité (ex: Titane Naturel, 256 Go, M4)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                isFilterOpen || hasActiveFilters
                  ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtres</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full sm:w-auto appearance-none pl-3 pr-8 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white cursor-pointer"
              >
                <option value="featured">Mis en avant (Oumar)</option>
                <option value="price-asc">Prix : Moins cher d'abord</option>
                <option value="price-desc">Prix : Plus cher d'abord</option>
                <option value="newest">Nouveautés d'abord</option>
                <option value="name">Nom du modèle (A - Z)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

          </div>

          {/* Expandable Filter Drawer */}
          {isFilterOpen && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
              
              {/* Condition Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  État du produit
                </label>
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="w-full text-xs rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="Tous">Tous les états</option>
                  <option value="Neuf Scellé">Neuf Scellé</option>
                  <option value="Reconditionné A+">Reconditionné A+</option>
                  <option value="Reconditionné Certifié">Reconditionné Certifié</option>
                </select>
              </div>

              {/* Storage Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Capacité
                </label>
                <select
                  value={selectedStorageFilter}
                  onChange={(e) => setSelectedStorageFilter(e.target.value)}
                  className="w-full text-xs rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="Tous">Toutes les capacités</option>
                  <option value="128 Go">128 Go</option>
                  <option value="256 Go">256 Go</option>
                  <option value="512 Go">512 Go</option>
                  <option value="1 To">1 To</option>
                  <option value="512 Go SSD">512 Go SSD (MacBook)</option>
                  <option value="1 To SSD">1 To SSD (MacBook)</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Fourchette de prix
                </label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full text-xs rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Tous les prix</option>
                  <option value="under-500k">Moins de 500 000 FCFA</option>
                  <option value="500k-1m">500 000 à 1 000 000 FCFA</option>
                  <option value="over-1m">Plus de 1 000 000 FCFA</option>
                </select>
              </div>

              {/* Stock Toggle Filter */}
              <div className="flex flex-col justify-end">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200 py-2">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                  />
                  <span>Afficher uniquement les articles en stock</span>
                </label>
              </div>

            </div>
          )}

          {/* Active Filter Pills Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Filtres actifs :</span>

              {selectedCategory !== 'Tous' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory('Tous')}><X className="w-3 h-3" /></button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')}><X className="w-3 h-3" /></button>
                </span>
              )}

              {selectedCondition !== 'Tous' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {selectedCondition}
                  <button onClick={() => setSelectedCondition('Tous')}><X className="w-3 h-3" /></button>
                </span>
              )}

              {onlyInStock && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  En Stock
                  <button onClick={() => setOnlyInStock(false)}><X className="w-3 h-3" /></button>
                </span>
              )}

              {selectedStorageFilter !== 'Tous' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {selectedStorageFilter}
                  <button onClick={() => setSelectedStorageFilter('Tous')}><X className="w-3 h-3" /></button>
                </span>
              )}

              {priceRange !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {priceRange === 'under-500k' ? '< 500k' : priceRange === '500k-1m' ? '500k - 1M' : '> 1M'}
                  <button onClick={() => setPriceRange('all')}><X className="w-3 h-3" /></button>
                </span>
              )}

              <button
                type="button"
                onClick={resetAllFilters}
                className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold hover:underline ml-1 cursor-pointer"
              >
                Réinitialiser tout
              </button>
            </div>
          )}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {filteredProducts.map((product, pIndex) => {
              const currentStorage = cardStorages[product.id] || product.storage[0] || 'Standard';
              const currentColor = cardColors[product.id] || product.colors[0]?.name || 'Standard';
              const isAdded = addedIds[product.id];

              // Price adjustment based on chosen capacity
              const currentPrice = (product.storagePrices && product.storagePrices[currentStorage])
                ? product.storagePrices[currentStorage]
                : product.price;

              return (
                <div
                  key={`${product.id || 'prod'}-${pIndex}`}
                  onClick={() => onSelectProduct ? onSelectProduct(product) : setActiveModalProduct(product)}
                  className="bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col group border border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer min-w-0"
                >
                  {/* Product Visual Stage */}
                  <div className="relative aspect-[4/3] bg-gradient-to-b from-slate-50 to-slate-100/70 dark:from-slate-900/80 dark:to-[#0b0f17] p-2.5 sm:p-5 flex items-center justify-center overflow-hidden">
                    <img
                      src={product.image || undefined}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 select-none"
                      loading="lazy"
                      width="380"
                      height="285"
                    />

                    {/* Condition badge */}
                    <div className="absolute top-2 left-2 sm:top-3.5 sm:left-3.5 text-[9px] sm:text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs">
                      {product.condition}
                    </div>

                    {/* Battery or Warranty badge */}
                    <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 text-[9px] sm:text-[11px] font-medium text-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-slate-200/60 dark:border-slate-700 shadow-xs truncate max-w-[85px] sm:max-w-none">
                      {product.batteryHealth}
                    </div>

                    {/* Official Apple reference visual badge */}
                    <div className="absolute bottom-1.5 left-1.5 text-[8px] sm:text-[9px] font-medium text-slate-500 dark:text-slate-400 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xs px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-800 hidden xs:block">
                      Visuel de référence
                    </div>

                    {/* Quick view button overlay */}
                    <div className="absolute inset-x-0 bottom-3 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:flex">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 dark:bg-white/90 text-white dark:text-slate-950 text-xs font-semibold backdrop-blur-sm shadow-md">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Fiche détaillée</span>
                      </span>
                    </div>
                  </div>

                  {/* Product Info & Actions */}
                  <div className="p-3 sm:p-6 flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      {/* Name & Live Price */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-2 mb-1.5 min-w-0">
                        <h3 className="text-xs sm:text-lg font-bold text-slate-950 dark:text-white font-['Outfit'] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                          {product.name}
                        </h3>
                        <div className="text-left sm:text-right shrink-0">
                          <div className="text-xs sm:text-lg font-extrabold text-slate-950 dark:text-white font-['Outfit'] tabular-nums tracking-tight">
                            {currentPrice.toLocaleString('fr-FR')} FCFA
                          </div>
                          {product.originalPrice && product.originalPrice > currentPrice && (
                            <div className="text-[10px] sm:text-xs text-slate-400 line-through tabular-nums">
                              {product.originalPrice.toLocaleString('fr-FR')} FCFA
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Model & Reassurance */}
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-2 sm:mb-4 flex items-center gap-1 min-w-0 truncate">
                        <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">{product.warranty}</span>
                      </p>

                      {/* Storage Capacity Selector */}
                      {product.storage && product.storage.length > 1 && (
                        <div className="mb-2 sm:mb-4">
                          <div className="text-[9px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Capacité
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {product.storage.map((cap, cIdx) => (
                              <button
                                key={`${product.id}-storage-${cap}-${cIdx}`}
                                type="button"
                                onClick={(e) => handleCardStorageChange(e, product.id, cap)}
                                className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-md sm:rounded-lg font-semibold transition-all cursor-pointer ${
                                  currentStorage === cap
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {cap}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Color Swatches */}
                      {product.colors && product.colors.length > 0 && (
                        <div className="mb-2 sm:mb-5">
                          <div className="text-[9px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 truncate">
                            <span className="hidden sm:inline">Finition : </span><span className="font-normal text-slate-800 dark:text-slate-200">{currentColor}</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            {product.colors.map((color, colorIdx) => (
                              <button
                                key={`${product.id}-color-${color.name || 'col'}-${colorIdx}`}
                                type="button"
                                onClick={(e) => handleCardColorChange(e, product.id, color.name)}
                                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border transition-transform cursor-pointer ${
                                  currentColor === color.name
                                    ? 'border-slate-950 dark:border-white scale-110 shadow-xs'
                                    : 'border-transparent hover:scale-105'
                                }`}
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                                aria-label={color.name}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Card Actions: Cart + WhatsApp */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 pt-2.5 sm:pt-4 border-t border-slate-100 dark:border-slate-800/80">
                      {/* Add to cart */}
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, product)}
                        className={`w-full py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 shadow-xs'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>Ajouté</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>Panier</span>
                          </>
                        )}
                      </button>

                      {/* WhatsApp Order */}
                      <a
                        href={WHATSAPP_URL(
                          `Bonjour Oumar iPhone, je souhaite commander : ${product.name} (${currentStorage}, ${currentColor}) au prix de ${currentPrice.toLocaleString('fr-FR')} FCFA.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Search & Filter State */
          <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 max-w-xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white font-['Outfit'] mb-2">
              Aucun modèle ne correspond à votre recherche
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
              Essayez de modifier vos critères de filtrage ou contactez directement Oumar sur WhatsApp pour une commande sur-mesure.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser les filtres</span>
            </button>
          </div>
        )}

      </div>

      {/* Detailed Product Sheet Modal */}
      <ProductModal
        product={activeModalProduct}
        isOpen={!!activeModalProduct}
        onClose={() => setActiveModalProduct(null)}
        onAddToCart={onAddToCart}
      />
    </section>
  );
};
