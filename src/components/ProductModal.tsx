import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { 
  X, 
  MessageCircle, 
  ShoppingBag, 
  ShieldCheck, 
  Zap, 
  Store, 
  Check, 
  Sparkles,
  Cpu,
  Smartphone,
  Camera,
  BatteryCharging,
  Package,
  Layers
} from 'lucide-react';
import { WHATSAPP_URL } from '../data/products';
import { deduplicateColors } from '../services/storeService';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, storage: string, color: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart
}) => {
  const [selectedStorage, setSelectedStorage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [activeImage, setActiveImage] = useState<string>('');
  const [added, setAdded] = useState(false);

  // Initialize or reset variants when product changes
  useEffect(() => {
    if (product) {
      setSelectedStorage(product.selectedStorage || product.storage[0] || 'Standard');
      setSelectedColor(product.selectedColor || product.colors[0]?.name || 'Standard');
      setActiveImage(product.image);
      setAdded(false);
    }
  }, [product]);

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

  if (!isOpen || !product) return null;

  // Calculate current price based on selected storage
  const currentPrice = (product.storagePrices && product.storagePrices[selectedStorage])
    ? product.storagePrices[selectedStorage]
    : product.price;

  // Build gallery images array
  const galleryImages = [
    product.image,
    ...(product.gallery ? product.gallery.filter(img => img !== product.image) : [])
  ];

  const handleAdd = () => {
    onAddToCart(product, selectedStorage, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const whatsappMessage = `Bonjour OUMAR IPHONE, je souhaite me renseigner depuis votre catalogue OUMAR IPHONE :

• Produit : ${product.name}
• Modèle : ${product.model}
• Capacité : ${selectedStorage}
• Finition : ${selectedColor}
• État : ${product.condition}
• Prix affiché : ${currentPrice.toLocaleString('fr-FR')} FCFA

Pourriez-vous me confirmer la disponibilité et les modalités de retrait en boutique à Abidjan ? Merci !`;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog" 
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Container */}
      <div className="min-h-full flex items-center justify-center p-3 sm:p-4 lg:p-6 text-center">
        <div 
          className="w-full max-w-4xl bg-white dark:bg-[#0f172a] rounded-3xl text-left overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 relative z-10 transition-colors animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
            aria-label="Fermer la fiche produit"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[88vh] overflow-y-auto">
            
            {/* Left Column: Visual Gallery (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-slate-100/70 dark:from-slate-900/80 dark:to-[#0b0f17] p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800">
              
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs">
                  {product.condition}
                </span>
                {product.isNew && (
                  <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Nouveauté
                  </span>
                )}
                {product.originalPrice && product.originalPrice > currentPrice && (
                  <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    -{(product.originalPrice - currentPrice).toLocaleString('fr-FR')} FCFA
                  </span>
                )}
              </div>

              {/* Main Image Stage */}
              <div className="relative aspect-square w-full flex items-center justify-center my-auto py-4 flex-col">
                <img
                  src={activeImage || product.image || undefined}
                  alt={`${product.name} — ${selectedColor}`}
                  className="max-h-[85%] max-w-full object-contain drop-shadow-md select-none transition-all duration-300"
                  loading="eager"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block text-center mt-2.5 font-medium">
                  Appareil inspecté en boutique OUMAR IPHONE
                </span>
              </div>

              {/* Thumbnails strip (if multiple gallery photos available) */}
              {galleryImages.length > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-800">
                  {galleryImages.map((thumb, idx) => (
                    <button
                      key={`modal-thumb-${idx}-${thumb}`}
                      type="button"
                      onClick={() => setActiveImage(thumb)}
                      className={`w-14 h-14 rounded-xl p-1 bg-white dark:bg-slate-800 border-2 transition-all overflow-hidden ${
                        activeImage === thumb 
                          ? 'border-slate-900 dark:border-white shadow-sm scale-105' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                      aria-label={`Afficher la vue ${idx + 1}`}
                    >
                      <img src={thumb || undefined} alt={`Miniature ${idx + 1}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              {/* Battery / Inspection seal */}
              <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Batterie vérifiée · {product.batteryHealth}
                </span>
                <span className="text-slate-400 dark:text-slate-600">·</span>
                <span>{product.warranty}</span>
              </div>
            </div>

            {/* Right Column: Details, Options, Specs & Actions (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              
              <div>
                {/* Header Category & Stock */}
                <div className="flex items-center justify-between gap-2 text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-2">
                  <span>{product.category} · {product.model}</span>
                  <span className={`inline-flex items-center gap-1.5 ${product.inStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {product.inStock ? 'En stock à Abidjan' : 'Sur commande'}
                  </span>
                </div>

                {/* Title */}
                <h2 id="product-modal-title" className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white font-['Outfit'] mb-3">
                  {product.name}
                </h2>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 mb-6 pb-5 border-b border-slate-200/70 dark:border-slate-800">
                  <span className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white font-['Outfit'] tabular-nums tracking-tight">
                    {currentPrice.toLocaleString('fr-FR')} FCFA
                  </span>
                  {product.originalPrice && product.originalPrice > currentPrice && (
                    <span className="text-sm sm:text-base text-slate-400 dark:text-slate-500 line-through tabular-nums">
                      {product.originalPrice.toLocaleString('fr-FR')} FCFA
                    </span>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    {product.description}
                  </p>
                )}

                {/* Capacity Options */}
                {product.storage && product.storage.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      <span>Capacité de stockage</span>
                      <span className="text-slate-400 font-normal lowercase">{selectedStorage}</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {product.storage.map((cap, capIdx) => {
                        const isSelected = selectedStorage === cap;
                        const capPrice = product.storagePrices ? product.storagePrices[cap] : undefined;

                        return (
                          <button
                            key={`modal-storage-${cap}-${capIdx}`}
                            type="button"
                            onClick={() => setSelectedStorage(cap)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-start ${
                              isSelected
                                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-sm ring-2 ring-slate-950 dark:ring-white ring-offset-2 dark:ring-offset-slate-900'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span>{cap}</span>
                            {capPrice && (
                              <span className={`text-[10px] font-normal ${isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>
                                {capPrice.toLocaleString('fr-FR')} FCFA
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Color Swatches */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-7">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Finition : <span className="font-normal text-slate-900 dark:text-white capitalize">{selectedColor}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {deduplicateColors(product.colors).map((color, colIdx) => {
                        const isSelected = selectedColor.trim().toLowerCase() === color.name.trim().toLowerCase();
                        return (
                          <button
                            key={`modal-color-${color.name || 'col'}-${colIdx}`}
                            type="button"
                            onClick={() => {
                              setSelectedColor(color.name);
                              if (color.image && color.image.trim()) {
                                setActiveImage(color.image);
                              } else {
                                setActiveImage(product.image);
                              }
                            }}
                            aria-pressed={isSelected}
                            className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                              isSelected
                                ? 'border-slate-950 dark:border-white bg-slate-50 dark:bg-slate-800/80 font-semibold text-slate-950 dark:text-white shadow-xs'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <span 
                              className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs" 
                              style={{ backgroundColor: color.hex }}
                            />
                            <span>{color.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Technical Specifications Accordion / Cards */}
                {product.specs && (
                  <div className="mb-7 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                      <Layers className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span>Fiche technique certifiée</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {product.specs.screen && (
                        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                          <Smartphone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block text-slate-900 dark:text-white">Écran</span>
                            <span>{product.specs.screen}</span>
                          </div>
                        </div>
                      )}
                      {product.specs.chip && (
                        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                          <Cpu className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block text-slate-900 dark:text-white">Processeur</span>
                            <span>{product.specs.chip}</span>
                          </div>
                        </div>
                      )}
                      {product.specs.camera && (
                        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                          <Camera className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block text-slate-900 dark:text-white">Photo & Vidéo</span>
                            <span>{product.specs.camera}</span>
                          </div>
                        </div>
                      )}
                      {product.specs.battery && (
                        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                          <BatteryCharging className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block text-slate-900 dark:text-white">Autonomie</span>
                            <span>{product.specs.battery}</span>
                          </div>
                        </div>
                      )}
                      {product.specs.boxContents && (
                        <div className="sm:col-span-2 flex items-start gap-2 text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                          <Package className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block text-slate-900 dark:text-white">Dans le coffret</span>
                            <span>{product.specs.boxContents}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Abidjan Commercial Reassurances */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-8">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
                    <Store className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Retrait direct en magasin à Abidjan</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Contrôle qualité en boutique</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
                    <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Contact direct sur WhatsApp</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action CTAs */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Primary CTA: WhatsApp direct order */}
                <a
                  href={WHATSAPP_URL(whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Commander sur WhatsApp</span>
                </a>

                {/* Secondary CTA: Add to cart */}
                <button
                  type="button"
                  onClick={handleAdd}
                  className={`py-3.5 px-6 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                    added
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-md'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Ajouté au panier</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Ajouter au panier</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
