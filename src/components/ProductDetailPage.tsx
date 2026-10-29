import React, { useState, useEffect } from 'react';
import { Product, ProductColor } from '../types';
import { 
  ArrowLeft, 
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
  Layers,
  ChevronRight,
  Share2,
  Tag
} from 'lucide-react';
import { WHATSAPP_URL } from '../data/products';
import { deduplicateColors } from '../services/storeService';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, storage: string, color: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBack,
  onAddToCart
}) => {
  const [selectedStorage, setSelectedStorage] = useState<string>(
    product.selectedStorage || product.storage[0] || 'Standard'
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    product.selectedColor || product.colors[0]?.name || 'Standard'
  );
  const [selectedCondition, setSelectedCondition] = useState<string>(
    product.condition || 'Neuf Scellé'
  );
  const [activeImage, setActiveImage] = useState<string>(product.image);
  const [added, setAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Synchronise les états par défaut si le produit change
  useEffect(() => {
    setSelectedStorage(product.selectedStorage || product.storage[0] || 'Standard');
    setSelectedColor(product.selectedColor || product.colors[0]?.name || 'Standard');
    setSelectedCondition(product.condition || 'Neuf Scellé');
    setActiveImage(product.image);
    setAdded(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  // Recherche d'une variante exacte dans public.store_product_variants (sans repli silencieux)
  const matchingVariant = product.variants?.find((v) => {
    if (v.published === false) return false;
    const matchColor = !v.color || v.color.toLowerCase() === selectedColor.toLowerCase();
    const matchStorage = !v.storage || v.storage.toLowerCase() === selectedStorage.toLowerCase();
    const matchCond = !v.condition || v.condition.toLowerCase() === selectedCondition.toLowerCase();
    return matchColor && matchStorage && matchCond;
  });

  // Détermination stricte du prix : si la variante existe et a un prix > 0, on l'utilise. Sinon null (« Prix à confirmer »).
  const currentPrice = matchingVariant && matchingVariant.price > 0 ? matchingVariant.price : null;

  // Image et stock associés à la variante
  const displayImage = (matchingVariant && matchingVariant.imageUrl)
    ? matchingVariant.imageUrl
    : activeImage;

  const isVariantInStock = matchingVariant
    ? (matchingVariant.inStock !== false)
    : product.inStock;

  // Liste des conditions à proposer si configurées
  const availableConditions = [
    'Neuf Scellé',
    'Neuf Original Apple',
    'Quasi Neuf',
    'Occasion',
    'Reconditionné A+'
  ];

  // Gestion du changement de couleur avec changement dynamique de la photo
  const handleColorSelect = (colorObj: ProductColor) => {
    setSelectedColor(colorObj.name);
    if (colorObj.image && colorObj.image.trim()) {
      setActiveImage(colorObj.image);
    } else {
      setActiveImage(product.image);
    }
  };

  // Liste des miniatures dans la galerie
  const galleryImages = [
    product.image,
    ...(product.gallery ? product.gallery.filter((img) => img !== product.image) : [])
  ];

  const handleAdd = () => {
    onAddToCart(product, selectedStorage, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const whatsappMessage = `Bonjour OUMAR IPHONE, je souhaite me renseigner depuis la fiche produit OUMAR IPHONE :

• Produit : ${product.name}
• Catégorie : ${product.category}
• Modèle : ${product.model}
• État sélectionné : ${selectedCondition}
• Capacité : ${selectedStorage}
• Finition : ${selectedColor}
• Prix enregistré : ${currentPrice !== null ? `${currentPrice.toLocaleString('fr-FR')} FCFA` : 'Prix à confirmer'}
${matchingVariant?.priceSource ? `• Source / Référence : ${matchingVariant.priceSource}` : ''}

Merci de me confirmer la disponibilité réelle et de m'indiquer les modalités de retrait en boutique à Abidjan !`;

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 transition-colors py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb & Back button */}
        <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>← Retour au catalogue</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">Accueil</span>
            <ChevronRight className="w-3.5 h-3.5 hidden sm:inline" />
            <span className="hidden sm:inline">{product.category}</span>
            <ChevronRight className="w-3.5 h-3.5 hidden sm:inline" />
            <span className="text-slate-900 dark:text-white font-semibold truncate max-w-[150px] sm:max-w-none">
              {product.name}
            </span>

            <button
              type="button"
              onClick={handleShare}
              className="ml-3 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Copier le lien direct de la fiche"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Main Product Layout */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 transition-colors">
          
          {/* Left Column: Visual Stage & Gallery (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-slate-100/70 dark:from-slate-900/80 dark:to-[#0b0f17] p-6 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800">
            
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs">
                {selectedCondition}
              </span>
              {product.isNew && (
                <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Nouveauté
                </span>
              )}
              {currentPrice !== null && product.originalPrice && product.originalPrice > currentPrice && (
                <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  -{(product.originalPrice - currentPrice).toLocaleString('fr-FR')} FCFA
                </span>
              )}
            </div>

            {/* Main Image View */}
            <div className="relative aspect-square w-full flex items-center justify-center my-auto py-6 flex-col">
              <img
                src={displayImage || product.image || undefined}
                alt={`${product.name} — Finition ${selectedColor}`}
                className="max-h-[88%] max-w-full object-contain drop-shadow-lg select-none transition-all duration-300"
                loading="eager"
              />
              
              <div className="mt-4 text-center space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 italic font-medium block">
                  Visuel de référence · Finition <strong className="font-bold text-slate-700 dark:text-slate-300">{selectedColor}</strong>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                  Chaque appareil est soigneusement contrôlé avant mise en boutique à Abidjan
                </span>
              </div>
            </div>

            {/* Thumbnails Strip */}
            {galleryImages.length > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-200/60 dark:border-slate-800">
                {galleryImages.map((thumb, idx) => (
                  <button
                    key={`detail-thumb-${idx}-${thumb}`}
                    type="button"
                    onClick={() => setActiveImage(thumb)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-1 bg-white dark:bg-slate-800 border-2 transition-all overflow-hidden cursor-pointer ${
                      activeImage === thumb 
                        ? 'border-slate-950 dark:border-white shadow-md scale-105' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <img src={thumb || undefined} alt={`Vue ${idx + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Reassurance seals */}
            <div className="mt-6 pt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Batterie : {product.batteryHealth}
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{product.warranty}</span>
            </div>

          </div>

          {/* Right Column: Specs, Variants, WhatsApp & Add to Cart (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            
            <div>
              {/* Header category & availability */}
              <div className="flex items-center justify-between gap-2 text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-2">
                <span>{product.category} · {product.model}</span>
                <span className={`inline-flex items-center gap-1.5 ${isVariantInStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {isVariantInStock ? 'Disponible en boutique Abidjan' : 'Sur commande'}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white font-['Outfit'] tracking-tight mb-3">
                {product.name}
              </h1>

              {/* Price Tag & Source Reference note */}
              <div className="flex flex-col mb-6 pb-6 border-b border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="flex items-baseline gap-3">
                  {currentPrice !== null ? (
                    <>
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white font-['Outfit'] tabular-nums tracking-tight">
                        {currentPrice.toLocaleString('fr-FR')} FCFA
                      </span>
                      {product.originalPrice && product.originalPrice > currentPrice && (
                        <span className="text-lg text-slate-400 dark:text-slate-500 line-through tabular-nums">
                          {product.originalPrice.toLocaleString('fr-FR')} FCFA
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-['Outfit'] tracking-tight">
                      Prix à confirmer
                    </span>
                  )}
                </div>

                {currentPrice === null && (
                  <span className="text-xs text-amber-700 dark:text-amber-300 font-medium pt-1">
                    Cette configuration exacte n'a pas de tarif confirmé. Contactez Oumar pour estimation.
                  </span>
                )}

                {matchingVariant?.priceSource && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span>Prix indicatif — à confirmer auprès d’Oumar ({matchingVariant.priceSource})</span>
                  </span>
                )}
              </div>

              {/* Detailed Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Description du modèle
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Product Condition Selector (État) */}
              <div className="mb-7">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  <span>Sélectionner l'état</span>
                  <span className="font-bold text-slate-950 dark:text-white">{selectedCondition}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableConditions.map((cond) => {
                    const isSelected = selectedCondition === cond;
                    return (
                      <button
                        key={`cond-${cond}`}
                        type="button"
                        onClick={() => setSelectedCondition(cond)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md ring-2 ring-slate-950 dark:ring-white ring-offset-2 dark:ring-offset-slate-900 scale-102'
                            : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Swatch Selection with Real Photo Update */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-7">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                    <span>Finition & Couleur</span>
                    <span className="font-bold text-slate-950 dark:text-white">{selectedColor}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {deduplicateColors(product.colors).map((colorObj, colIdx) => {
                      const isSelected = selectedColor.trim().toLowerCase() === colorObj.name.trim().toLowerCase();
                      return (
                        <button
                          key={`detail-color-${colorObj.name}-${colIdx}`}
                          type="button"
                          onClick={() => handleColorSelect(colorObj)}
                          aria-pressed={isSelected}
                          className={`group flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'border-slate-950 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md ring-2 ring-slate-950 dark:ring-white ring-offset-2 dark:ring-offset-slate-900 scale-105'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60'
                          }`}
                        >
                          <span 
                            className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs shrink-0" 
                            style={{ backgroundColor: colorObj.hex }}
                          />
                          <span>{colorObj.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Storage Capacity Selection */}
              {product.storage && product.storage.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                    <span>Capacité de stockage</span>
                    <span className="font-bold text-slate-950 dark:text-white">{selectedStorage}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {product.storage.map((cap, capIdx) => {
                      const isSelected = selectedStorage === cap;
                      const capPrice = product.storagePrices ? product.storagePrices[cap] : undefined;

                      return (
                        <button
                          key={`detail-storage-${cap}-${capIdx}`}
                          type="button"
                          onClick={() => setSelectedStorage(cap)}
                          className={`p-3 rounded-2xl text-xs font-semibold transition-all flex flex-col items-start cursor-pointer ${
                            isSelected
                              ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-md ring-2 ring-slate-950 dark:ring-white ring-offset-2 dark:ring-offset-slate-900'
                              : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="text-sm font-bold">{cap}</span>
                          {capPrice && (
                            <span className={`text-[11px] mt-1 font-medium ${isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>
                              {capPrice.toLocaleString('fr-FR')} FCFA
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Certified Specifications Grid */}
              {product.specs && (
                <div className="mb-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                    <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Caractéristiques techniques vérifiées</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    {product.specs.screen && (
                      <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                        <Smartphone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-slate-900 dark:text-white">Écran</span>
                          <span>{product.specs.screen}</span>
                        </div>
                      </div>
                    )}
                    {product.specs.chip && (
                      <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                        <Cpu className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-slate-900 dark:text-white">Puce & Performances</span>
                          <span>{product.specs.chip}</span>
                        </div>
                      </div>
                    )}
                    {product.specs.camera && (
                      <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                        <Camera className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-slate-900 dark:text-white">Appareil Photo</span>
                          <span>{product.specs.camera}</span>
                        </div>
                      </div>
                    )}
                    {product.specs.battery && (
                      <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                        <BatteryCharging className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-slate-900 dark:text-white">Autonomie</span>
                          <span>{product.specs.battery}</span>
                        </div>
                      </div>
                    )}
                    {product.specs.boxContents && (
                      <div className="sm:col-span-2 flex items-start gap-2.5 text-slate-700 dark:text-slate-300 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                        <Package className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-slate-900 dark:text-white">Contenu de la boîte</span>
                          <span>{product.specs.boxContents}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Commercial Reassurances bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-8">
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <Store className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Retrait direct en magasin à Abidjan</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Contrôle qualité rigoureux</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Contact direct sur WhatsApp</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions: WhatsApp Order & Add to Cart */}
            <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* WhatsApp Direct Order CTA */}
              <a
                href={WHATSAPP_URL(whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Se renseigner sur WhatsApp</span>
              </a>

              {/* Add to Cart CTA */}
              <button
                type="button"
                onClick={handleAdd}
                className={`py-4 px-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                  added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-md'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Ajouté au panier</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>Ajouter au panier</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
