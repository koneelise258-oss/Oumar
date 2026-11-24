import React, { useState, useEffect } from 'react';
import { Product, ProductColor } from '../types';
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Store,
  Check,
  Cpu,
  Camera,
  BatteryCharging,
  Package,
  Layers,
  ChevronRight,
  Share2,
  Tag,
  FileText,
  Cable
} from 'lucide-react';
import { WHATSAPP_URL } from '../data/products';
import { deduplicateColors } from '../services/storeService';
import { AppleProductImageViewer } from './AppleProductImageViewer';
import { WhatsAppLogo, IPhoneIcon } from './BrandIcons';
import { useMediaStyle } from '../hooks/useMediaStyle';
import { useStorePromotion } from '../hooks/useStorePromotion';
import {
  applyStorePromotion,
  formatProductPrice,
  formatWhatsAppPrice,
  getCombinationPrice,
  normalizeConditionName,
  STANDARD_CONDITIONS
} from '../utils/pricingUtils';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, storage: string, color: string, condition?: string, unitPrice?: number | null) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBack,
  onAddToCart
}) => {
  const mediaStyle = useMediaStyle();
  const { promotion } = useStorePromotion();
  const [selectedStorage, setSelectedStorage] = useState<string>(
    product.selectedStorage || product.storage[0] || 'Standard'
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    product.selectedColor || product.colors[0]?.name || 'Standard'
  );
  const [selectedCondition, setSelectedCondition] = useState<string>(
    normalizeConditionName(product.condition)
  );
  const [activeImage, setActiveImage] = useState<string>(product.image);
  const [added, setAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Synchronise les états par défaut si le produit change
  useEffect(() => {
    const initColor = product.selectedColor || product.colors[0]?.name || 'Standard';
    const initColorObj = product.colors?.find((c) => c.name === initColor) || product.colors[0];
    setSelectedStorage(product.selectedStorage || product.storage[0] || 'Standard');
    setSelectedColor(initColor);
    setSelectedCondition(normalizeConditionName(product.condition));
    setActiveImage(initColorObj?.image || product.image);
    setAdded(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  // Détermination stricte du prix indépendant selon la combinaison (Stockage, État, Couleur) + promotion globale
  const priceResult = getCombinationPrice(product, selectedStorage, selectedCondition, selectedColor);
  const promoResult = applyStorePromotion(priceResult.price, product.id, promotion);
  const currentPrice: number | null = promoResult.finalPrice;
  const crossedPrice =
    promoResult.isDiscounted && promoResult.originalBasePrice
      ? promoResult.originalBasePrice
      : (typeof currentPrice === 'number' && currentPrice > 0 && product.originalPrice && product.originalPrice > currentPrice
          ? product.originalPrice
          : null);
  const matchingVariant = priceResult.matchedVariant;

  // Image et stock associés à la variante
  const displayImage = (matchingVariant && matchingVariant.imageUrl)
    ? matchingVariant.imageUrl
    : activeImage;

  const isVariantInStock = matchingVariant
    ? (matchingVariant.inStock !== false)
    : product.inStock;

  // 3 états standards
  const availableConditions = STANDARD_CONDITIONS;

  // Couleur actuellement sélectionnée
  const uniqueColors = deduplicateColors(product.colors || []);
  const currentColorObj = uniqueColors.find(
    (c) => c.name.toLowerCase().trim() === selectedColor.toLowerCase().trim()
  );

  // Liste de toutes les images des finitions pour le préchargement fluide
  const allColorImages = (product.colors || [])
    .map((c) => c.image)
    .filter((img): img is string => Boolean(img && typeof img === 'string' && img.trim()));

  // Changement de couleur avec mise à jour fluide de la photo
  const handleColorSelect = (colorObj: ProductColor) => {
    setSelectedColor(colorObj.name);
    if (colorObj.image && colorObj.image.trim()) {
      setActiveImage(colorObj.image);
    } else {
      setActiveImage(product.image);
    }
  };

  // Miniatures de galerie pour la vue sélectionnée
  const galleryImages = [
    currentColorObj?.image || product.image,
    ...(currentColorObj?.gallery ? currentColorObj.gallery : []),
    ...(product.gallery ? product.gallery.filter((img) => img !== product.image) : [])
  ].filter((img, idx, arr) => img && arr.indexOf(img) === idx);

  const handleAdd = () => {
    onAddToCart(product, selectedStorage, selectedColor, selectedCondition, currentPrice);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} — OUMAR IPHONE`,
          text: `${product.name} (${selectedCondition}, ${selectedStorage}, ${selectedColor})`,
          url: shareUrl
        });
        return;
      } catch {
        // Fallback clipboard
      }
    }
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch {
        // Ignore clipboard permission errors
      }
    }
  };

  // Fermeture par la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const whatsappMessage = `Bonjour OUMAR IPHONE, je souhaite commander depuis la fiche produit OUMAR IPHONE :

• Produit : ${product.name}
• Catégorie : ${product.category}
• Modèle : ${product.model}
• État sélectionné : ${selectedCondition}
• Capacité : ${selectedStorage}
• Finition : ${selectedColor}
• Prix affiché : ${formatWhatsAppPrice(currentPrice)}
${matchingVariant?.priceSource ? `• Référence : ${matchingVariant.priceSource}` : ''}

Merci de me confirmer la disponibilité réelle et de m'indiquer les modalités de retrait en boutique à Abidjan !`;

  const hasSpecs = Boolean(
    product.specs &&
      (product.specs.screen ||
        product.specs.chip ||
        product.specs.camera ||
        product.specs.battery ||
        product.specs.ports ||
        product.specs.boxContents)
  );

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 transition-colors py-3 sm:py-5 lg:py-7 animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">

        {/* Barre de navigation compacte : Retour + Fil d'Ariane + Partager */}
        <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-5 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs active:scale-[0.98] whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Retour</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 min-w-0">
            <span className="hidden sm:inline shrink-0">{product.category}</span>
            <ChevronRight className="w-3.5 h-3.5 hidden sm:inline shrink-0" />
            <span className="text-slate-900 dark:text-white font-semibold truncate">
              {product.name}
            </span>

            <button
              type="button"
              onClick={handleShare}
              className="ml-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title="Copier le lien direct de la fiche"
              aria-label="Partager la fiche produit"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Vue principale condensée : Tout l'essentiel tient d'un seul coup d'œil sur Tablette verticale (md) & Ordinateur (lg) */}
        <div
          className="bg-white dark:bg-[#0f172a] overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 transition-colors"
          style={{ borderRadius: `${Math.max(12, Math.round(mediaStyle.productRadius * 1.15))}px` }}
        >

          {/* Colonne Gauche : Visuel produit épuré + vignettes (5 cols dès md / tablette verticale) */}
          <div className="md:col-span-5 bg-gradient-to-b from-slate-50 to-slate-100/70 dark:from-slate-900/80 dark:to-[#0b0f17] p-4 sm:p-5 lg:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800">

            {/* Ligne de métadonnées sobres sans pilules superposées */}
            <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-slate-950 dark:text-white">{selectedCondition}</span>
                {product.isNew && (
                  <>
                    <span aria-hidden="true" className="text-slate-400">·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Nouveauté</span>
                  </>
                )}
              </div>

              {promoResult.isDiscounted ? (
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-extrabold tabular-nums shrink-0">
                  -{promoResult.discountPercent}%
                </span>
              ) : currentPrice !== null && product.originalPrice && product.originalPrice > currentPrice && (
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 tabular-nums shrink-0">
                  -{(product.originalPrice - currentPrice).toLocaleString('fr-FR')} FCFA
                </span>
              )}
            </div>

            {/* Scène image principale optimisée pour Mobile, Tablette verticale et Desktop */}
            <AppleProductImageViewer
              key={`detail-${product.id}`}
              src={displayImage || product.image || ''}
              alt={`${product.name} — Finition ${selectedColor}`}
              allImagesToPreload={allColorImages}
              fallbackImage={product.image}
              priority={true}
              accentHex={currentColorObj?.hex}
              colorKey={selectedColor}
              imageRoundedPx={mediaStyle.productRadius}
              className="max-h-full max-w-full object-contain drop-shadow-xl select-none"
              containerClassName="relative h-[215px] sm:h-[250px] md:h-[310px] lg:h-[390px] w-full flex items-center justify-center my-auto py-2 overflow-hidden"
            />

            {/* Miniatures uniquement s'il y a plusieurs angles */}
            {galleryImages.length > 1 && (
              <div className="flex items-center justify-center gap-2.5 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                {galleryImages.map((thumb, idx) => {
                  const thumbRadius = Math.min(16, Math.round(mediaStyle.productRadius * 0.65));
                  return (
                    <button
                      key={`detail-thumb-${idx}-${thumb}`}
                      type="button"
                      onClick={() => setActiveImage(thumb)}
                      className={`w-11 h-11 sm:w-12 sm:h-12 p-1 bg-white dark:bg-slate-800 border-2 transition-all overflow-hidden cursor-pointer ${
                        activeImage === thumb
                          ? 'border-slate-950 dark:border-white shadow-sm scale-105'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                      style={{ borderRadius: `${thumbRadius}px` }}
                    >
                      <img
                        src={thumb || undefined}
                        alt={`Vue ${idx + 1}`}
                        className="w-full h-full object-contain"
                        style={{ borderRadius: `${Math.max(0, thumbRadius - 3)}px` }}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Rappel confiance discret sur une ligne */}
            <div className="mt-3 pt-2.5 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center gap-1.5 font-medium truncate">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Batterie · {product.batteryHealth}</span>
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{product.warranty}</span>
            </div>
          </div>

          {/* Colonne Droite : Configurateur complet visible d'un seul coup d'œil (7 cols dès md / tablette) */}
          <div className="md:col-span-7 p-4 sm:p-6 lg:p-8 flex flex-col justify-between gap-4">

            <div className="space-y-4">
              {/* Catégorie, disponibilité & Titre + Prix immédiat */}
              <div className="pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <span className="truncate">{product.category} · {product.model}</span>
                  <span className={`shrink-0 font-bold ${isVariantInStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {isVariantInStock ? 'En boutique Abidjan' : 'Sur commande'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 dark:text-white font-['Outfit'] tracking-tight leading-tight">
                  {product.name}
                </h1>

                {/* Prix immédiat bien visible */}
                <div className="flex items-baseline gap-2.5 flex-wrap mt-2">
                  <span
                    key={`price-${selectedCondition}-${selectedStorage}-${selectedColor}-${currentPrice}`}
                    className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold font-['Outfit'] tabular-nums tracking-tight animate-color-label ${
                      currentPrice === null || currentPrice === 0
                        ? 'text-amber-600 dark:text-amber-400 font-bold'
                        : 'text-slate-950 dark:text-white'
                    }`}
                  >
                    {formatProductPrice(currentPrice)}
                  </span>
                  {crossedPrice && (
                    <span className="text-sm sm:text-base text-slate-400 dark:text-slate-500 line-through tabular-nums">
                      {crossedPrice.toLocaleString('fr-FR')} FCFA
                    </span>
                  )}
                  {promoResult.isDiscounted && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-extrabold tabular-nums">
                      -{promoResult.discountPercent}%
                    </span>
                  )}
                </div>

                {matchingVariant?.priceSource && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                    <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Référence tarifaire : {matchingVariant.priceSource}</span>
                  </div>
                )}
              </div>

              {/* 1. FINITION / COULEUR UNIQUE & NON-INTRUSIVE (à côté de l'image, un seul endroit) */}
              {uniqueColors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      Finition
                    </span>
                    <span
                      key={`detail-head-color-${selectedColor}`}
                      className="font-bold text-slate-950 dark:text-white animate-color-label"
                    >
                      {selectedColor}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {uniqueColors.map((colorObj, colIdx) => {
                      const isSelected = selectedColor.trim().toLowerCase() === colorObj.name.trim().toLowerCase();
                      return (
                        <button
                          key={`detail-color-${colorObj.name}-${colIdx}`}
                          type="button"
                          onClick={() => handleColorSelect(colorObj)}
                          aria-pressed={isSelected}
                          aria-label={`Choisir la finition ${colorObj.name}`}
                          title={colorObj.name}
                          className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 cursor-pointer ${
                            isSelected
                              ? 'border-slate-950 dark:border-white bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-400 text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/50'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full border border-black/20 dark:border-white/25 shrink-0 transition-transform duration-300 ${
                              isSelected ? 'scale-110 ring-1 ring-white/40 dark:ring-black/20' : 'group-hover:scale-105'
                            }`}
                            style={{ backgroundColor: colorObj.hex }}
                          />
                          <span className="whitespace-nowrap">{colorObj.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. ÉTAT (Neuf scellé / Quasi neuf / Occasion — met à jour le prix en direct) */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">État</span>
                  <span className="font-bold text-slate-950 dark:text-white">{selectedCondition}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {availableConditions.map((cond) => {
                    const isSelected = selectedCondition === cond;
                    return (
                      <button
                        key={`cond-${cond}`}
                        type="button"
                        onClick={() => setSelectedCondition(cond)}
                        className={`min-h-[40px] px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap truncate ${
                          isSelected
                            ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-sm ring-1 ring-slate-950 dark:ring-white'
                            : 'bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. CAPACITÉ DE STOCKAGE (avec prix dynamique par capacité) */}
              {product.storage && product.storage.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Stockage</span>
                    <span className="font-bold text-slate-950 dark:text-white">{selectedStorage}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {product.storage.map((cap, capIdx) => {
                      const isSelected = selectedStorage === cap;
                      const capPriceResult = getCombinationPrice(product, cap, selectedCondition, selectedColor);
                      const capPrice = applyStorePromotion(capPriceResult.price, product.id, promotion).finalPrice;

                      return (
                        <button
                          key={`detail-storage-${cap}-${capIdx}`}
                          type="button"
                          onClick={() => setSelectedStorage(cap)}
                          className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex flex-col items-start cursor-pointer ${
                            isSelected
                              ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-sm ring-1 ring-slate-950 dark:ring-white'
                              : 'bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-bold leading-tight">{cap}</span>
                          <span className={`text-[11px] mt-0.5 font-medium tabular-nums ${
                            isSelected
                              ? 'text-slate-300 dark:text-slate-500'
                              : (capPrice ? 'text-slate-500 dark:text-slate-400' : 'text-amber-600 dark:text-amber-400')
                          }`}>
                            {formatProductPrice(capPrice)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 4. ACTIONS PRINCIPALES (immédiatement visibles dans le champ sur tablette & ordinateur) */}
            <div className="pt-3.5 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={handleAdd}
                className={`flex-1 min-h-[46px] py-3 px-5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                  added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-md'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Ajouté au panier</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>Ajouter au panier</span>
                  </>
                )}
              </button>

              <a
                href={WHATSAPP_URL(whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                data-analytics-product-id={product.id}
                data-analytics-product-name={product.name}
                data-analytics-product-image={displayImage || product.image || ''}
                data-analytics-variant={`${selectedCondition} · ${selectedStorage} · ${selectedColor}`}
                data-analytics-price={String(currentPrice ?? 0)}
                className="flex-1 min-h-[46px] py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                <WhatsAppLogo className="w-4 h-4 shrink-0" />
                <span>Se renseigner sur WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* SECTION INFÉRIEURE COMPLÈTE (TOUT AFFICHÉ DIRECTEMENT POUR LECTURE COMPLÈTE SANS MASQUAGE) */}
        <div className="mt-6 space-y-5">
          {/* 1. Description totale du modèle et de la marque */}
          <div
            className="bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-7"
            style={{ borderRadius: `${Math.max(12, Math.round(mediaStyle.productRadius * 0.9))}px` }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 mb-4 border-b border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white font-['Outfit']">
                    Présentation & Description complète — {product.name}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Apple · Gamme {product.category} · {product.model}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {product.stockLocation || 'Boutique Abidjan'}
              </span>
            </div>

            {product.description ? (
              <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {product.name} ({product.model}) disponible en boutique OUMAR IPHONE à Abidjan avec contrôle qualité complet et garantie boutique incluse.
              </p>
            )}

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-medium text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                <Store className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Retrait direct en magasin ({product.stockLocation || 'Abidjan'})</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Batterie vérifiée {product.batteryHealth} · {product.warranty}</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                <WhatsAppLogo className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Accompagnement & transfert iCloud en boutique</span>
              </div>
            </div>
          </div>

          {/* 2. Fiche Technique & Caractéristiques Complètes (100 % visibles) */}
          {hasSpecs && product.specs && (
            <div
              className="bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-7"
              style={{ borderRadius: `${Math.max(12, Math.round(mediaStyle.productRadius * 0.9))}px` }}
            >
              <div className="flex items-center gap-2.5 pb-3.5 mb-5 border-b border-slate-200/70 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white font-['Outfit']">
                    Fiche Technique & Caractéristiques Détaillées
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Spécifications officielles certifiées pour {product.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                {product.specs.screen && (
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3 text-slate-700 dark:text-slate-300">
                    <IPhoneIcon className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-950 dark:text-white mb-1">Écran & Affichage</span>
                      <span className="leading-relaxed">{product.specs.screen}</span>
                    </div>
                  </div>
                )}
                {product.specs.chip && (
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3 text-slate-700 dark:text-slate-300">
                    <Cpu className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-950 dark:text-white mb-1">Puce & Performances</span>
                      <span className="leading-relaxed">{product.specs.chip}</span>
                    </div>
                  </div>
                )}
                {product.specs.camera && (
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3 text-slate-700 dark:text-slate-300">
                    <Camera className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-950 dark:text-white mb-1">Appareil Photo & Vidéo</span>
                      <span className="leading-relaxed">{product.specs.camera}</span>
                    </div>
                  </div>
                )}
                {product.specs.battery && (
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3 text-slate-700 dark:text-slate-300">
                    <BatteryCharging className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-950 dark:text-white mb-1">Batterie & Autonomie</span>
                      <span className="leading-relaxed">{product.specs.battery}</span>
                    </div>
                  </div>
                )}
                {product.specs.ports && (
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3 text-slate-700 dark:text-slate-300">
                    <Cable className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-950 dark:text-white mb-1">Connectivité, Ports & Réseau</span>
                      <span className="leading-relaxed">{product.specs.ports}</span>
                    </div>
                  </div>
                )}
                {product.specs.boxContents && (
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3 text-slate-700 dark:text-slate-300">
                    <Package className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-950 dark:text-white mb-1">Contenu de la boîte</span>
                      <span className="leading-relaxed">{product.specs.boxContents}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
