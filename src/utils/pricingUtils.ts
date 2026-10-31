import { Product, ProductVariant } from '../types';

export type StandardCondition = 'Neuf' | 'Quasi-occasion' | 'Reconditionné';

export const STANDARD_CONDITIONS: StandardCondition[] = [
  'Neuf',
  'Quasi-occasion',
  'Reconditionné'
];

/**
 * Normalise n'importe quel libellé d'état (ancien ou nouveau) vers les 3 états standards retenus :
 * - "Neuf"
 * - "Quasi-occasion"
 * - "Reconditionné"
 */
export function normalizeConditionName(raw?: string | null): StandardCondition {
  if (!raw || typeof raw !== 'string') return 'Neuf';
  const clean = raw.trim().toLowerCase();

  // Détection de Quasi-occasion / Occasion / Quasi neuf
  if (clean.includes('quasi') || clean.includes('occasion')) {
    return 'Quasi-occasion';
  }

  // Détection de Reconditionné
  if (clean.includes('reconditionn')) {
    return 'Reconditionné';
  }

  // Neuf (Neuf scellé, Neuf original Apple, etc.)
  return 'Neuf';
}

/**
 * Recherche et calcule le prix strictement indépendant pour une combinaison :
 * Produit + Capacité + État + Finition (optionnelle).
 *
 * RÈGLES CRITIQUES :
 * 1. Ne recopie jamais automatiquement les prix d'un autre état.
 * 2. N'invente aucun prix.
 * 3. Si aucun prix n'est défini pour cet état/stockage, renvoie null (affiché "Prix sur demande").
 */
export function getCombinationPrice(
  product: Product,
  storage?: string | null,
  condition?: string | null,
  color?: string | null
): { price: number | null; isVariantExact: boolean; priceSource?: string; matchedVariant?: ProductVariant } {
  if (!product) {
    return { price: null, isVariantExact: false };
  }

  const targetStorage = (storage || product.selectedStorage || (Array.isArray(product.storage) ? product.storage[0] : '') || '').trim().toLowerCase();
  const targetCondition = normalizeConditionName(condition || product.condition);
  const targetColor = (color || product.selectedColor || (product.colors && product.colors[0]?.name) || '').trim().toLowerCase();

  // 1. Recherche prioritaire dans les variantes enregistrées (ex: table store_product_variants)
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const matchingVariant = product.variants.find((v: ProductVariant) => {
      if (v.published === false) return false;
      const vStorage = (v.storage || '').trim().toLowerCase();
      const vCond = normalizeConditionName(v.condition);
      const vColor = (v.color || '').trim().toLowerCase();

      const matchStorage = !targetStorage || !vStorage || vStorage === targetStorage;
      const matchCond = vCond === targetCondition;
      const matchColor = !targetColor || !vColor || vColor === targetColor;

      return matchStorage && matchCond && matchColor;
    });

    if (matchingVariant && typeof matchingVariant.price === 'number' && matchingVariant.price > 0) {
      return {
        price: matchingVariant.price,
        isVariantExact: true,
        priceSource: matchingVariant.priceSource,
        matchedVariant: matchingVariant
      };
    }
  }

  // 2. Si l'état sélectionné correspond à l'état de référence de la fiche produit
  const baseProductCond = normalizeConditionName(product.condition);
  if (targetCondition === baseProductCond) {
    // Vérifier si un prix spécifique à la capacité existe
    if (product.storagePrices && targetStorage) {
      // Trouver la clé correspondante insensible à la casse
      const matchedKey = Object.keys(product.storagePrices).find(
        (k) => k.trim().toLowerCase() === targetStorage
      );
      if (matchedKey && typeof product.storagePrices[matchedKey] === 'number' && product.storagePrices[matchedKey] > 0) {
        return {
          price: product.storagePrices[matchedKey],
          isVariantExact: false
        };
      }
    }

    // Prix de base du produit pour son état d'origine
    if (typeof product.price === 'number' && product.price > 0) {
      return {
        price: product.price,
        isVariantExact: false
      };
    }
  }

  // 3. Aucun prix n'est enregistré pour cette combinaison spécifique -> PRIX SUR DEMANDE
  return {
    price: null,
    isVariantExact: false
  };
}

/**
 * Formate un prix pour l'affichage :
 * - Si le prix est renseigné et > 0 : "X FCFA"
 * - Si le prix est manquant ou nul : "Prix sur demande"
 */
export function formatProductPrice(price: number | null | undefined): string {
  if (typeof price === 'number' && !isNaN(price) && price > 0) {
    return `${price.toLocaleString('fr-FR')} FCFA`;
  }
  return 'Prix sur demande';
}

/**
 * Formate le texte du prix pour les messages de commande WhatsApp
 */
export function formatWhatsAppPrice(price: number | null | undefined): string {
  if (typeof price === 'number' && !isNaN(price) && price > 0) {
    return `${price.toLocaleString('fr-FR')} FCFA`;
  }
  return 'Prix sur demande (à confirmer en boutique)';
}
