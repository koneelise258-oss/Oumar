import { ProductColor } from '../types';

/**
 * Répertoire des finitions et nuances certifiées Apple avec leurs codes HEX exacts.
 */
export const APPLE_COLOR_MAP: Record<string, string> = {
  // Noirs & Sombres
  'noir': '#1F2022',
  'noir sidéral': '#242527',
  'sidéral': '#242527',
  'space black': '#242527',
  'space gray': '#535150',
  'gris sidéral': '#535150',
  'titane noir': '#3C3B37',
  'black titanium': '#3C3B37',
  'minuit': '#1F2022',
  'midnight': '#1F2022',
  'graphite': '#424244',

  // Blancs & Argents
  'blanc': '#F2F1ED',
  'blanc stellaire': '#F2F1ED',
  'starlight': '#E2D8CE',
  'lumière stellaire': '#E2D8CE',
  'titane blanc': '#F2F1ED',
  'white titanium': '#F2F1ED',
  'argent': '#E3E4E5',
  'silver': '#E3E4E5',

  // Titane Spécialisé iPhone
  'titane naturel': '#BEB8AE',
  'natural titanium': '#BEB8AE',
  'naturel': '#BEB8AE',
  'titane désert': '#D4C4B5',
  'desert titanium': '#D4C4B5',
  'désert': '#D4C4B5',
  'sable': '#D4C4B5',
  'titane bleu': '#2B3545',
  'blue titanium': '#2B3545',

  // Bleus
  'bleu': '#2B3545',
  'bleu pacifique': '#2E4756',
  'bleu sierra': '#698996',
  'bleu nuit': '#1D2A44',
  'bleu ciel': '#7FA9C6',
  'outremer': '#2E3A59',

  // Rouges & Roses
  'rouge': '#D62828',
  'rouge (product red)': '#D62828',
  'product red': '#D62828',
  '(product)red': '#D62828',
  'rose': '#FAD2D8',
  'pink': '#FAD2D8',

  // Verts
  'vert': '#3B5340',
  'vert alpin': '#3B5340',
  'vert minuit': '#39443D',
  'alpine green': '#3B5340',
  'sarcelle': '#3E6B6D',

  // Or & Jaunes
  'or': '#E5D0A1',
  'gold': '#E5D0A1',
  'jaune': '#FFE082',
  'yellow': '#FFE082',

  // Violets & Mauves
  'violet': '#594F63',
  'mauve': '#C2B6D1',
  'purple': '#594F63',
  'deep purple': '#4C3B51'
};

/**
 * Obtient le code couleur HEX à partir du nom commercial d'une couleur.
 * Ne remplace jamais le nom de la couleur originale.
 */
export function getColorHexByName(colorName: string): string {
  if (!colorName || typeof colorName !== 'string') return '#64748B';
  const clean = colorName.trim().toLowerCase();
  
  // Correspondance exacte
  if (APPLE_COLOR_MAP[clean]) {
    return APPLE_COLOR_MAP[clean];
  }

  // Correspondance partielle (ex: "iPhone Titane Désert 256 Go" -> "#D4C4B5")
  for (const [key, hex] of Object.entries(APPLE_COLOR_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return hex;
    }
  }

  // Teinte neutre élégante de repli
  return '#64748B';
}

/**
 * Convertit en toute sécurité un élément de couleur issu de Supabase ou du cache local
 * qu'il s'agisse d'une chaîne brute ("Noir") ou d'un objet enrichi ({ name, hex, imageUrl }).
 */
export function normalizeColorItem(raw: any): ProductColor | null {
  if (!raw) return null;

  // Cas 1 : chaîne de caractères simple ("Noir", "Vert", "Titane Désert")
  if (typeof raw === 'string') {
    const name = raw.trim();
    if (!name) return null;
    return {
      name,
      hex: getColorHexByName(name),
      image: undefined,
      gallery: undefined,
      active: true,
      inStock: true
    };
  }

  // Cas 2 : objet enrichi
  if (typeof raw === 'object') {
    const rawName = raw.name || raw.color || raw.label || '';
    if (!rawName || typeof rawName !== 'string') return null;
    const name = rawName.trim();
    if (!name) return null;

    const hex = (raw.hex && typeof raw.hex === 'string' && raw.hex.startsWith('#'))
      ? raw.hex.trim()
      : (raw.colorHex || raw.color_hex || getColorHexByName(name));

    // Support des clés hétérogènes : image, imageUrl, image_url
    const image = (raw.image && typeof raw.image === 'string' && raw.image.trim())
      ? raw.image.trim()
      : (raw.imageUrl && typeof raw.imageUrl === 'string' && raw.imageUrl.trim())
      ? raw.imageUrl.trim()
      : (raw.image_url && typeof raw.image_url === 'string' && raw.image_url.trim())
      ? raw.image_url.trim()
      : undefined;

    const gallery = Array.isArray(raw.gallery) && raw.gallery.length > 0
      ? raw.gallery.filter((g: any) => typeof g === 'string' && g.trim())
      : (image ? [image] : undefined);

    const active = raw.active !== false;
    const inStock = raw.inStock !== false && raw.in_stock !== false;

    return {
      name,
      hex,
      image,
      gallery,
      active,
      inStock
    };
  }

  return null;
}

/**
 * Convertit et fusionne sans doublons une liste de couleurs hétérogènes.
 * Préserve les photos réelles si déjà configurées.
 */
export function normalizeColors(colors: any[]): ProductColor[] {
  if (!Array.isArray(colors)) return [];
  const colorMap = new Map<string, ProductColor>();

  for (const raw of colors) {
    const parsed = normalizeColorItem(raw);
    if (!parsed) continue;

    const key = parsed.name.toLowerCase().trim();
    const existing = colorMap.get(key);

    if (!existing) {
      colorMap.set(key, parsed);
    } else {
      // Merge : conserver l'image et la configuration la plus riche
      colorMap.set(key, {
        name: existing.name, // conserve la casse d'affichage originale
        hex: (existing.hex.startsWith('#') && existing.hex !== '#64748B') ? existing.hex : parsed.hex,
        image: existing.image || parsed.image,
        gallery: existing.gallery || parsed.gallery,
        active: existing.active && parsed.active,
        inStock: existing.inStock && parsed.inStock
      });
    }
  }

  return Array.from(colorMap.values());
}

/**
 * Renvoie les couleurs actives dédupliquées pour l'affichage public du catalogue et fiches produit.
 */
export function deduplicateColors(colors: any[]): ProductColor[] {
  return normalizeColors(colors).filter((c) => c.active !== false);
}

/**
 * Détermine si une couleur dispose d'une photo réelle et vérifiée pour cette finition.
 */
export function hasVerifiedFinishImage(colorObj?: ProductColor | null): boolean {
  if (!colorObj || !colorObj.image) return false;
  const img = colorObj.image.trim();
  return Boolean(
    img && 
    (img.startsWith('http') || img.startsWith('data:') || img.startsWith('/') || img.startsWith('./'))
  );
}
