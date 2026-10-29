import { ProductVariant } from '../types';

/**
 * Grille de référence indicative des prix de marché (Sikili, DjokStore, IvoirShop)
 * RÈGLE ABSOLUE : published = false et inStock = false.
 * Ces prix ne sont jamais présentés comme les prix officiels d'OUMAR IPHONE.
 */
export const MARKET_INDICATIVE_VARIANTS: Omit<ProductVariant, 'id'>[] = [
  // iPhone 16 Pro Max
  {
    productId: 'iphone-16-pro-max',
    storage: '256 Go',
    condition: 'Neuf Scellé',
    color: 'Titane Naturel',
    price: 1150000,
    inStock: false,
    published: false,
    priceSource: 'DjokStore / IvoirShop CI',
    priceCheckedAt: '2026-10-29',
    sourceUrl: 'https://djokstore.ci/collections/iphone'
  },
  {
    productId: 'iphone-16-pro-max',
    storage: '512 Go',
    condition: 'Neuf Scellé',
    color: 'Titane Naturel',
    price: 1320000,
    inStock: false,
    published: false,
    priceSource: 'DjokStore / IvoirShop CI',
    priceCheckedAt: '2026-10-29',
    sourceUrl: 'https://djokstore.ci/collections/iphone'
  },
  {
    productId: 'iphone-16-pro-max',
    storage: '1 To',
    condition: 'Neuf Scellé',
    color: 'Titane Naturel',
    price: 1490000,
    inStock: false,
    published: false,
    priceSource: 'DjokStore / IvoirShop CI',
    priceCheckedAt: '2026-10-29',
    sourceUrl: 'https://djokstore.ci/collections/iphone'
  },

  // iPhone 16 Pro
  {
    productId: 'iphone-16-pro',
    storage: '128 Go',
    condition: 'Neuf Scellé',
    color: 'Titane Désert',
    price: 895000,
    inStock: false,
    published: false,
    priceSource: 'DjokStore CI',
    priceCheckedAt: '2026-10-29',
    sourceUrl: 'https://djokstore.ci/collections/iphone'
  },
  {
    productId: 'iphone-16-pro',
    storage: '256 Go',
    condition: 'Neuf Scellé',
    color: 'Titane Désert',
    price: 990000,
    inStock: false,
    published: false,
    priceSource: 'DjokStore CI',
    priceCheckedAt: '2026-10-29',
    sourceUrl: 'https://djokstore.ci/collections/iphone'
  },
  {
    productId: 'iphone-16-pro',
    storage: '512 Go',
    condition: 'Neuf Scellé',
    color: 'Titane Désert',
    price: 1160000,
    inStock: false,
    published: false,
    priceSource: 'DjokStore CI',
    priceCheckedAt: '2026-10-29',
    sourceUrl: 'https://djokstore.ci/collections/iphone'
  },

  // iPhone 15 Pro Max (Reconditionné A+)
  {
    productId: 'iphone-15-pro-max',
    storage: '256 Go',
    condition: 'Reconditionné A+',
    color: 'Titane Naturel',
    price: 795000,
    inStock: false,
    published: false,
    priceSource: 'Sikili Reconditionné 2026',
    priceCheckedAt: '2026-10-29',
    sourceUrl: 'https://sikili.io/blog/prix-iphone-reconditionne-fcfa-2026-par-modele'
  },
  {
    productId: 'iphone-15-pro-max',
    storage: '512 Go',
    condition: 'Reconditionné A+',
    color: 'Titane Naturel',
    price: 895000,
    inStock: false,
    published: false,
    priceSource: 'Sikili Reconditionné 2026',
    priceCheckedAt: '2026-10-29',
    sourceUrl: 'https://sikili.io/blog/prix-iphone-reconditionne-fcfa-2026-par-modele'
  }
];
