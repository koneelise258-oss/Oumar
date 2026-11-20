import React, { useState, useEffect } from 'react';
import { CartItem } from '../types';
import { X, Plus, Minus, Trash2, ShieldCheck, CheckCircle2, Store, AlertTriangle, RefreshCw } from 'lucide-react';
import { getWhatsAppUrl, loadStoreSettings } from '../data/storeSettings';
import { formatProductPrice, normalizeConditionName } from '../utils/pricingUtils';
import { sanitizeText, sanitizePhone, openSafeExternalUrl } from '../utils/security';
import { WhatsAppLogo } from './BrandIcons';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [storePhone, setStorePhone] = useState<string>(
    () => loadStoreSettings().whatsappPhone || '+225 01 61 44 36 37'
  );

  // Fermeture par touche Échap + synchronisation automatique du téléphone boutique
  useEffect(() => {
    if (!isOpen) return;
    setStorePhone(loadStoreSettings().whatsappPhone || '+225 01 61 44 36 37');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Seuls les articles ayant un prix défini (> 0) contribuent au sous-total numérique
  // (ne jamais recopier le prix de base d'un produit si la combinaison choisie est "Prix sur demande")
  const subtotal = items.reduce((acc, item) => {
    const price = typeof item.unitPrice === 'number' && item.unitPrice > 0 ? item.unitPrice : 0;
    return acc + price * item.quantity;
  }, 0);

  const hasItemsOnDemand = items.some(
    (item) => typeof item.unitPrice !== 'number' || item.unitPrice <= 0
  );

  const total = subtotal;

  const formattedSubtotal =
    total > 0
      ? `${subtotal.toLocaleString('fr-FR')} FCFA${hasItemsOnDemand ? ' (+ sur demande)' : ''}`
      : 'Prix sur demande';

  const formattedTotal =
    total > 0
      ? `${total.toLocaleString('fr-FR')} FCFA${hasItemsOnDemand ? ' (+ sur demande)' : ''}`
      : 'Prix sur demande';

  const handleOrderSubmitted = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanName = sanitizeText(customerName, 80);
    const cleanPhone = sanitizePhone(customerPhone, 25);

    if (cleanName.length < 2) {
      setFormError('Veuillez renseigner votre Nom et Prénom (minimum 2 caractères) pour la réservation.');
      return;
    }

    if (cleanPhone && cleanPhone.replace(/[^0-9]/g, '').length < 8) {
      setFormError('Veuillez saisir un numéro de téléphone valide (au moins 8 chiffres) ou laisser le champ vide.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      // Construction du message WhatsApp direct avec les détails précis (état, stockage, couleur, prix)
      const itemListText = items
        .map((it) => {
          const cond = normalizeConditionName(it.chosenCondition || it.product.condition);
          const priceLabel =
            typeof it.unitPrice === 'number' && it.unitPrice > 0
              ? `${(it.unitPrice * it.quantity).toLocaleString('fr-FR')} FCFA`
              : 'Prix sur demande';
          return `• ${sanitizeText(it.product.name, 100)} [État: ${cond}] (${sanitizeText(it.chosenStorage, 30)}, ${sanitizeText(it.chosenColor, 40)}) x${it.quantity} — ${priceLabel}`;
        })
        .join('\n');

      const totalSummary =
        total > 0
          ? `${total.toLocaleString('fr-FR')} FCFA${hasItemsOnDemand ? ' (+ articles sur demande)' : ''}`
          : 'Prix sur demande';

      const whatsappMessage = `Bonjour OUMAR IPHONE, je souhaite me renseigner pour réserver et acheter en magasin :\n\n${itemListText}\n\nTotal estimé : ${totalSummary}\n\nNom du client : ${cleanName}${cleanPhone ? `\nTéléphone de contact : ${cleanPhone}` : ''}\nMode de retrait : En boutique OUMAR IPHONE (Abidjan)\n\nMerci de me confirmer la disponibilité des articles en boutique.`;

      // Ouvrir WhatsApp via lien sécurisé avec rel="noopener noreferrer" (protection anti-tabnabbing)
      const whatsappUrl = getWhatsAppUrl(whatsappMessage);
      openSafeExternalUrl(whatsappUrl);

      setOrderSent(true);
      setTimeout(() => {
        setOrderSent(false);
        setIsSubmitting(false);
        onClearCart();
        onClose();
      }, 2000);
    } catch {
      setFormError('Impossible d’ouvrir WhatsApp. Veuillez vérifier votre navigateur ou l’application WhatsApp.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transition-colors">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white font-['Outfit']">
                Votre Panier Apple
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {items.length === 0
                  ? 'Aucun article pour le moment'
                  : `${items.length} modèle(s) sélectionné(s) · Retrait en boutique`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fermer le panier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Item List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                <p className="text-sm">Votre panier est vide.</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 text-xs font-semibold text-slate-900 dark:text-white hover:underline cursor-pointer"
                >
                  Découvrir le catalogue Apple
                </button>
              </div>
            ) : (
              items.map((item, index) => {
                const chosenColorObj = item.product.colors?.find(
                  (c) =>
                    c.name &&
                    item.chosenColor &&
                    c.name.trim().toLowerCase() === item.chosenColor.trim().toLowerCase()
                );
                const thumbnailSrc = chosenColorObj?.image || item.product.image || undefined;

                return (
                  <div
                    key={`cart-${item.product?.id || index}-${item.chosenStorage}-${item.chosenColor}-${index}`}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex gap-3.5 items-center"
                  >
                    <img
                      src={thumbnailSrc}
                      alt={`${item.product.name} — ${item.chosenColor}`}
                      className="w-16 h-16 object-contain rounded-lg bg-white dark:bg-slate-800 p-1.5 border border-slate-200/60 dark:border-slate-700/60 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.product.name}
                        </h3>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                          {normalizeConditionName(item.chosenCondition || item.product.condition)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {item.chosenStorage} · {item.chosenColor}
                      </p>
                      <p
                        className={`text-xs font-bold mt-1 tabular-nums ${
                          !item.unitPrice || item.unitPrice <= 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-950 dark:text-white'
                        }`}
                      >
                        {formatProductPrice(
                          typeof item.unitPrice === 'number' && item.unitPrice > 0
                            ? item.unitPrice * item.quantity
                            : null
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-1 py-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                          className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          aria-label="Diminuer la quantité"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                          className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          aria-label="Augmenter la quantité"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(index)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        aria-label="Supprimer du panier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Order Reservation Form */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/95 space-y-4">
              
              {/* Pickup Mode Notice */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-2.5">
                <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-[11px] text-emerald-900 dark:text-emerald-200">
                  <span className="font-bold">Retrait exclusif en boutique OUMAR IPHONE :</span> Vos appareils sont préparés et testés directement sur place à Abidjan.
                </div>
              </div>

              {/* Customer Identity Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Votre Nom & Prénom <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    autoComplete="name"
                    placeholder="Ex: Jean Kouassi"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    className="w-full text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Numéro de contact / WhatsApp
                  </label>
                  <input
                    type="tel"
                    maxLength={25}
                    autoComplete="tel"
                    placeholder="Ex: 01 61 44 36 37"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                  />
                </div>
              </div>

              {/* Form Error Display */}
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Price Calculation (No Delivery Fee) */}
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between gap-2">
                  <span>Sous-total articles</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white text-right">
                    {formattedSubtotal}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Frais de retrait en boutique</span>
                  <span className="tabular-nums font-bold">Gratuit (0 FCFA)</span>
                </div>
                <div className="flex justify-between gap-2 text-sm font-bold text-slate-950 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total à régler au retrait</span>
                  <span className={`tabular-nums text-right ${total > 0 ? 'text-base' : 'text-sm text-amber-600 dark:text-amber-400'}`}>
                    {formattedTotal}
                  </span>
                </div>
              </div>

              {/* WhatsApp Checkout Button */}
              <button
                type="button"
                onClick={handleOrderSubmitted}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Préparation du message WhatsApp...</span>
                  </>
                ) : orderSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Demande préparée sur WhatsApp !</span>
                  </>
                ) : (
                  <>
                    <WhatsAppLogo className="w-4 h-4 shrink-0" />
                    <span>Réserver & Valider sur WhatsApp</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                <span>Contact direct & échanges sur WhatsApp ({storePhone})</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
