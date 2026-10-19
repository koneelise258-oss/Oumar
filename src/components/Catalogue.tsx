import React, { useState } from 'react';
import { Product } from '../types';
import { ShoppingBag, MessageCircle, ShieldCheck, Check } from 'lucide-react';
import { WHATSAPP_URL } from '../data/products';

interface CatalogueProps {
  products: Product[];
  onAddToCart: (product: Product, storage: string, color: string) => void;
}

export const Catalogue: React.FC<CatalogueProps> = ({ products, onAddToCart }) => {
  const [selectedStorages, setSelectedStorages] = useState<Record<string, string>>({});
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({});
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const handleStorageChange = (productId: string, storage: string) => {
    setSelectedStorages((prev) => ({ ...prev, [productId]: storage }));
  };

  const handleColorChange = (productId: string, color: string) => {
    setSelectedColors((prev) => ({ ...prev, [productId]: color }));
  };

  const handleAdd = (product: Product) => {
    const storage = selectedStorages[product.id] || product.storage[0];
    const color = selectedColors[product.id] || product.colors[0].name;
    onAddToCart(product, storage, color);

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  return (
    <section id="catalogue" className="py-20 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-2">
              DISPONIBLE À ABIDJAN
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 dark:text-white font-['Outfit']">
              Catalogue Apple Certifié
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
            Tous nos iPhone sont testés sur 35 points de contrôle. Remis en main propre ou livrés partout à Abidjan avec reçu officiel.
          </p>
        </div>

        {/* 3-Column Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => {
            const currentStorage = selectedStorages[product.id] || product.storage[0];
            const currentColor = selectedColors[product.id] || product.colors[0].name;
            const isAdded = addedIds[product.id];

            return (
              <div
                key={product.id}
                className="liquid-glass-card rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                {/* Product Image Stage */}
                <div className="relative aspect-[4/3] bg-gradient-to-b from-white to-slate-100/60 dark:from-slate-800/80 dark:to-slate-900/90 p-6 flex items-center justify-center overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    width="380"
                    height="285"
                  />
                  <div className="absolute top-3 left-3 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200/60 dark:border-slate-700">
                    {product.condition}
                  </div>
                  <div className="absolute top-3 right-3 text-[11px] font-medium text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded bg-white/80 dark:bg-slate-800/80 border border-slate-200/40 dark:border-slate-700/50">
                    {product.batteryHealth}
                  </div>
                </div>

                {/* Product Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h3 className="text-xl font-bold text-slate-950 dark:text-white font-['Outfit']">
                        {product.name}
                      </h3>
                      <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                        {product.price.toLocaleString('fr-FR')} FCFA
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                      <span>{product.warranty} · {product.stockLocation}</span>
                    </p>

                    {/* Storage Options */}
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Capacité
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.storage.map((cap) => (
                          <button
                            key={cap}
                            type="button"
                            onClick={() => handleStorageChange(product.id, cap)}
                            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                              currentStorage === cap
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {cap}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Swatches */}
                    <div className="mb-6">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Finition : <span className="font-normal text-slate-700 dark:text-slate-300">{currentColor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {product.colors.map((color) => (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => handleColorChange(product.id, color.name)}
                            className={`w-5 h-5 rounded-full border-2 transition-transform ${
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
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-200/60 dark:border-slate-800">
                    <button
                      onClick={() => handleAdd(product)}
                      className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 shadow-xs'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Ajouté</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Au panier</span>
                        </>
                      )}
                    </button>

                    <a
                      href={WHATSAPP_URL(
                        `Bonjour Oumar iPhone, je souhaite commander : ${product.name} (${currentStorage}, ${currentColor}) au prix de ${product.price.toLocaleString('fr-FR')} FCFA.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
