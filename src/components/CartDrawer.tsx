import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Plus, Minus, Trash2, MessageCircle, ShieldCheck, CheckCircle2, Store, RefreshCw, AlertTriangle } from 'lucide-react';
import { getWhatsAppUrl } from '../data/storeSettings';
import { createOrderRemote } from '../services/storeService';

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

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (acc, item) => acc + (item.unitPrice || item.product.price) * item.quantity,
    0
  );

  // La boutique ne propose AUCUNE livraison : retrait gratuit en boutique
  const deliveryFee = 0;
  const total = subtotal;

  const handleOrderSubmitted = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!customerName.trim()) {
      setFormError('Veuillez renseigner votre Nom et Prénom pour la réservation.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      // 1. Transmettre la réservation au serveur Supabase et attendre la confirmation explicite (RPC)
      const confirmedOrder = await createOrderRemote({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        commune: 'Retrait en boutique OUMAR IPHONE',
        items: items.map((it) => ({
          productId: it.product.id,
          productName: it.product.name,
          productImage: it.product.image,
          chosenStorage: it.chosenStorage,
          chosenColor: it.chosenColor,
          quantity: it.quantity,
          unitPrice: it.unitPrice || it.product.price
        })),
        subtotal,
        deliveryFee: 0,
        total,
        status: 'pending',
        paymentMethod: 'Paiement au retrait en boutique',
        notes: 'Réservation passée en ligne pour retrait en boutique OUMAR IPHONE Abidjan'
      });

      // 2. Construire le message WhatsApp avec le numéro de commande et le total confirmés par le serveur
      const itemListText = items
        .map(
          (it) =>
            `• ${it.product.name} (${it.chosenStorage}, ${it.chosenColor}) x${it.quantity} - ${(
              (it.unitPrice || it.product.price) * it.quantity
            ).toLocaleString('fr-FR')} FCFA`
        )
        .join('\n');

      const whatsappMessage = `Bonjour OUMAR IPHONE, je souhaite valider la réservation de ma commande N° ${confirmedOrder.orderNumber} :\n\n${itemListText}\n\nTotal confirmé : ${confirmedOrder.total.toLocaleString(
        'fr-FR'
      )} FCFA\n\nClient : ${confirmedOrder.customerName}${confirmedOrder.customerPhone ? `\nTéléphone : ${confirmedOrder.customerPhone}` : ''}\nMode : Retrait en Boutique OUMAR IPHONE Abidjan\nRèglement : Paiement au retrait (Espèces / Wave / Orange Money)`;

      // 3. Ouvrir WhatsApp
      const whatsappUrl = getWhatsAppUrl(whatsappMessage);
      window.open(whatsappUrl, '_blank');

      setOrderSent(true);
      setTimeout(() => {
        setOrderSent(false);
        setIsSubmitting(false);
        onClearCart();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Échec de la réservation:', err);
      setFormError(err?.message || "Impossible d'enregistrer votre commande sur le serveur. Veuillez vérifier votre connexion et réessayer.");
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

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
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
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                  onClick={onClose}
                  className="mt-4 text-xs font-semibold text-slate-900 dark:text-white hover:underline cursor-pointer"
                >
                  Découvrir le catalogue Apple
                </button>
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={`${item.product.id}-${index}`}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex gap-3.5 items-center"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg bg-white dark:bg-slate-850 p-1 border border-slate-200/60 dark:border-slate-700/60"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.chosenStorage} · {item.chosenColor}
                    </p>
                    <p className="text-xs font-bold text-slate-950 dark:text-white mt-1">
                      {((item.unitPrice || item.product.price) * item.quantity).toLocaleString(
                        'fr-FR'
                      )}{' '}
                      FCFA
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-1 py-0.5">
                      <button
                        onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                        className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                        className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        aria-label="Augmenter la quantité"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => onRemoveItem(index)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                      aria-label="Supprimer du panier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Order Reservation Form */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 space-y-4">
              
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
                    placeholder="Ex: 07 78 02 42 85"
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
                <div className="flex justify-between">
                  <span>Sous-total articles</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                    {subtotal.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Frais de retrait en boutique</span>
                  <span className="tabular-nums font-bold">Gratuit (0 FCFA)</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-950 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total à régler au retrait</span>
                  <span className="tabular-nums text-base">
                    {total.toLocaleString('fr-FR')} FCFA
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
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enregistrement sécurisé...</span>
                  </>
                ) : orderSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Réservation transmise (Validation en cours)</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    <span>Réserver & Valider sur WhatsApp</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                <span>Paiement au retrait en boutique (Espèces, Wave, Orange Money)</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
