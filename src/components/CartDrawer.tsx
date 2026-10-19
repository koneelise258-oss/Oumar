import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Plus, Minus, Trash2, MessageCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { WHATSAPP_URL } from '../data/products';

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
  const [commune, setCommune] = useState('Cocody');
  const [customerName, setCustomerName] = useState('');
  const [orderSent, setOrderSent] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const deliveryFee = 2000; // 2,000 FCFA standard delivery in Abidjan
  const total = subtotal > 0 ? subtotal + deliveryFee : 0;

  const handleOrderWhatsApp = () => {
    if (items.length === 0) return;

    const itemListText = items
      .map(
        (it) =>
          `• ${it.product.name} (${it.chosenStorage}, ${it.chosenColor}) x${it.quantity} - ${(
            it.product.price * it.quantity
          ).toLocaleString('fr-FR')} FCFA`
      )
      .join('\n');

    const message = `Bonjour OUMAR IPHONE, je souhaite valider ma commande :\n\n${itemListText}\n\nSous-total : ${subtotal.toLocaleString(
      'fr-FR'
    )} FCFA\nLivraison (${commune}) : ${deliveryFee.toLocaleString(
      'fr-FR'
    )} FCFA\nTotal : ${total.toLocaleString(
      'fr-FR'
    )} FCFA\n\nNom du client : ${customerName || 'Client Abidjan'}\nLieu de livraison : ${commune}\nMode de règlement : Paiement à la livraison`;

    window.open(WHATSAPP_URL(message), '_blank');
    setOrderSent(true);
    setTimeout(() => {
      setOrderSent(false);
      onClearCart();
      onClose();
    }, 2500);
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
                  : `${items.length} modèle(s) sélectionné(s)`}
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
                  className="mt-4 text-xs font-semibold text-slate-900 dark:text-white hover:underline"
                >
                  Découvrir le catalogue
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
                    className="w-16 h-16 object-contain rounded-lg bg-white dark:bg-slate-800 p-1 border border-slate-100 dark:border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.chosenStorage} · {item.chosenColor}
                    </p>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                      {(item.product.price * item.quantity).toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => onRemoveItem(index)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      aria-label="Supprimer cet article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800">
                      <button
                        onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-semibold tabular-nums text-slate-800 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        aria-label="Augmenter la quantité"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Order Form */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 space-y-4">
              
              {/* Abidjan Commune Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Commune Abidjan
                  </label>
                  <select
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    className="w-full text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                  >
                    <option value="Cocody">Cocody (Angré, Riviera)</option>
                    <option value="Plateau">Plateau (Centre)</option>
                    <option value="Marcory">Marcory / Zone 4</option>
                    <option value="Treichville">Treichville</option>
                    <option value="Yopougon">Yopougon</option>
                    <option value="Koumassi">Koumassi</option>
                    <option value="Autre">Autre commune</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Votre Prénom
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Jean"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                  />
                </div>
              </div>

              {/* Price Calculation */}
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                    {subtotal.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Livraison express ({commune})</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                    {deliveryFee.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-950 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total à payer à réception</span>
                  <span className="tabular-nums">
                    {total.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              {/* WhatsApp Checkout Button */}
              <button
                onClick={handleOrderWhatsApp}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-md transition-all flex items-center justify-center gap-2"
              >
                {orderSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Commande transmise !</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    <span>Valider la commande sur WhatsApp</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                <span>Paiement en espèces ou Wave/Orange Money à la livraison</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
