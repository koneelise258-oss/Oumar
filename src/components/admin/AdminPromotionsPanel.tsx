import React, { useMemo, useState } from 'react';
import { Product } from '../../types';
import { StorePromotionSettings } from '../../data/storeSettings';
import { applyStorePromotion, formatProductPrice } from '../../utils/pricingUtils';
import { Percent, Gift, Search, Check, CheckSquare, Square, Save, RefreshCw, Tag, Eye, EyeOff } from 'lucide-react';

interface AdminPromotionsPanelProps {
  products: Product[];
  promoForm: StorePromotionSettings;
  onChangePromo: (next: StorePromotionSettings) => void;
  onSavePromo: (overridePromo?: StorePromotionSettings) => Promise<void> | void;
  savingPromo: boolean;
  showDecemberBannerConfig?: boolean;
}

const CATEGORY_TABS = ['Tous', 'iPhone', 'iPad', 'iPhone Duo', 'MacBook', 'Accessoires'] as const;

export const AdminPromotionsPanel: React.FC<AdminPromotionsPanelProps> = ({
  products,
  promoForm,
  onChangePromo,
  onSavePromo,
  savingPromo,
  showDecemberBannerConfig = true,
}) => {
  const [catFilter, setCatFilter] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (catFilter !== 'Tous' && p.category !== catFilter) return false;
      if (q) {
        return (
          p.name.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, catFilter, searchQuery]);

  const includedCount = useMemo(
    () => products.filter((p) => !promoForm.excludedProductIds.includes(p.id)).length,
    [products, promoForm.excludedProductIds]
  );

  const toggleProductExcluded = (productId: string) => {
    const isCurrentlyExcluded = promoForm.excludedProductIds.includes(productId);
    const nextExcluded = isCurrentlyExcluded
      ? promoForm.excludedProductIds.filter((id) => id !== productId)
      : [...promoForm.excludedProductIds, productId];
    onChangePromo({ ...promoForm, excludedProductIds: nextExcluded });
  };

  const handleBulkCategoryAction = (exclude: boolean) => {
    const targetIds = new Set(filteredProducts.map((p) => p.id));
    if (targetIds.size === 0) return;

    const currentSet = new Set(promoForm.excludedProductIds);
    if (exclude) {
      targetIds.forEach((id) => currentSet.add(id));
    } else {
      targetIds.forEach((id) => currentSet.delete(id));
    }

    onChangePromo({
      ...promoForm,
      excludedProductIds: Array.from(currentSet),
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. RÉDUCTION GLOBALE & PAR CATÉGORIE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-950 dark:text-white font-['Outfit'] flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-500" />
              <span>Réduction Globale sur le Catalogue (-{promoForm.discountPercent}%)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Appliquez un pourcentage de remise automatique et sélectionnez librement les produits inclus ou exclus par catégorie. Synchronisé en direct dans le catalogue, le panier et WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const toggled = { ...promoForm, enabled: !promoForm.enabled };
                onChangePromo(toggled);
              }}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-2 ${
                promoForm.enabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  promoForm.enabled ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              <span>{promoForm.enabled ? 'Réduction active' : 'Réduction désactivée'}</span>
            </button>

            <button
              type="button"
              onClick={() => onSavePromo(promoForm)}
              disabled={savingPromo}
              className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {savingPromo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savingPromo ? 'Enregistrement...' : 'Appliquer la promo'}</span>
            </button>
          </div>
        </div>

        {/* Discount Rate & Label Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Pourcentage de réduction (%)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={promoForm.discountPercent}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onChangePromo({
                      ...promoForm,
                      discountPercent: Number.isFinite(val) ? Math.min(90, Math.max(0, val)) : 0,
                    });
                  }}
                  className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3.5 pr-9 py-2 text-sm font-extrabold text-slate-950 dark:text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">
                  %
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Libellé de l’opération
            </label>
            <input
              type="text"
              value={promoForm.label}
              onChange={(e) => onChangePromo({ ...promoForm, label: e.target.value })}
              placeholder="Promotion de Décembre"
              maxLength={80}
              className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="md:col-span-4 space-y-1.5">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Préréglages rapides
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[5, 10, 15, 20, 25, 30].map((pct) => {
                const active = promoForm.discountPercent === pct;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => onChangePromo({ ...promoForm, discountPercent: pct })}
                    className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer tabular-nums ${
                      active
                        ? 'bg-emerald-600 text-white border-transparent shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    -{pct}%
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Tag className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              <strong>{includedCount}</strong> produit(s) éligible(s) à la remise ·{' '}
              <strong>{promoForm.excludedProductIds.length}</strong> exclu(s).
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Les articles marqués « Prix sur demande » conservent toujours leur statut sans prix inventé.
          </span>
        </div>

        {/* Category Filter Tabs + Search + Bulk Actions */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              {CATEGORY_TABS.map((cat) => {
                const count =
                  cat === 'Tous'
                    ? products.length
                    : products.filter((p) => p.category === cat).length;
                const active = catFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatFilter(cat)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      active
                        ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md tabular-nums ${
                        active
                          ? 'bg-white/20 dark:bg-slate-900/15'
                          : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un modèle..."
                  className="w-full min-h-[36px] pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => handleBulkCategoryAction(false)}
                className="min-h-[36px] px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Tout inclure</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkCategoryAction(true)}
                className="min-h-[36px] px-3 py-1.5 rounded-xl text-[11px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Tout exclure</span>
              </button>
            </div>
          </div>

          {/* Product Inclusion / Exclusion List */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden bg-slate-50/40 dark:bg-slate-900/50">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const isExcluded = promoForm.excludedProductIds.includes(p.id);
                const preview = applyStorePromotion(p.price, p.id, {
                  ...promoForm,
                  enabled: true,
                });

                return (
                  <div
                    key={`promo-prod-${p.id}`}
                    className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isExcluded
                        ? 'bg-slate-50/70 dark:bg-slate-900/40 opacity-75'
                        : 'bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 p-1.5 shrink-0 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center">
                        <img
                          src={p.image || undefined}
                          alt={p.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {p.category}
                          </span>
                          <span className="text-xs font-bold text-slate-950 dark:text-white truncate">
                            {p.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-2 tabular-nums">
                          {p.price > 0 ? (
                            <>
                              <span>Base : {formatProductPrice(p.price)}</span>
                              {!isExcluded && promoForm.discountPercent > 0 && preview.finalPrice !== null && (
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  → Après -{promoForm.discountPercent}% : {formatProductPrice(preview.finalPrice)}
                                </span>
                              )}
                            </>
                          ) : (
                            <span>Prix sur demande (inchangé)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleProductExcluded(p.id)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 ${
                        !isExcluded
                          ? 'bg-emerald-600 text-white border-transparent shadow-xs hover:bg-emerald-700'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {!isExcluded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Inclus (-{promoForm.discountPercent}%)</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                          <span>Exclu de la promo</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Aucun produit dans cette catégorie pour votre recherche.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. BANDEROLE DÉFILANTE PROMOTION DE DÉCEMBRE */}
      {showDecemberBannerConfig && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-white font-['Outfit'] flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                <span>Banderole Défilante — Promotion de Décembre</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Affichée juste avant la section Vidéos avec guirlandes lumineuses de fin d’année et défilement fluide continu.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  onChangePromo({ ...promoForm, bannerEnabled: !promoForm.bannerEnabled })
                }
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-2 ${
                  promoForm.bannerEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {promoForm.bannerEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{promoForm.bannerEnabled ? 'Banderole visible' : 'Banderole masquée'}</span>
              </button>

              <button
                type="button"
                onClick={() => onSavePromo(promoForm)}
                disabled={savingPromo}
                className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Message principal de la banderole
              </label>
              <input
                type="text"
                value={promoForm.bannerHeadline}
                onChange={(e) => onChangePromo({ ...promoForm, bannerHeadline: e.target.value })}
                maxLength={140}
                placeholder="PROMOTION DE DÉCEMBRE — OUMAR IPHONE ABIDJAN"
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Texte secondaire défilant
              </label>
              <input
                type="text"
                value={promoForm.bannerSubline}
                onChange={(e) => onChangePromo({ ...promoForm, bannerSubline: e.target.value })}
                maxLength={180}
                placeholder="FÊTES DE FIN D’ANNÉE · SÉLECTION APPLE CERTIFIÉE · GARANTIE 12 MOIS"
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
