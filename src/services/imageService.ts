import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { APPLE_ASSET_IMAGES } from '../data/products';

export interface ImageUploadResult {
  url: string;
  isRemoteStorage: boolean;
  message?: string;
}

/**
 * Compresse une image côté client pour garantir une résolution retina tout en maintenant
 * un poids plume (~60 à 120 Ko) adapté au stockage en base de données et sans blocage réseau.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1000,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Si c'est un SVG, lire directement en texte/data-url
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        // En cas d'erreur de décodage, renvoyer le dataUrl brut
        resolve(event.target?.result as string);
      };
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Amélioration du lissage
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Tentative d'export en WebP, avec fallback JPEG
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {
          // Fallback jpeg
        }

        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Tente d'envoyer l'image vers Supabase Storage (bucket store-products).
 * Si le bucket n'existe pas encore ou n'est pas accessible, compresse l'image
 * et renvoie une URL optimisée prête pour l'enregistrement persistant.
 */
export async function processAndUploadProductImage(file: File): Promise<ImageUploadResult> {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Le fichier est trop volumineux (maximum 20 Mo).');
  }

  // 1. Si Supabase est configuré, tenter un envoi vers Supabase Storage
  if (isSupabaseConfigured) {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
      const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;

      const { data, error } = await supabase.storage
        .from('store-products')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (!error && data?.path) {
        const { data: pubData } = supabase.storage
          .from('store-products')
          .getPublicUrl(data.path);

        if (pubData?.publicUrl) {
          return {
            url: pubData.publicUrl,
            isRemoteStorage: true,
            message: 'Image stockée sur Supabase Storage avec succès.'
          };
        }
      }
    } catch {
      // Bucket non initialisé, bascule transparente sur l'optimiseur
    }
  }

  // 2. Traitement et compression haute performance pour stockage direct
  const compressed = await compressImageFile(file, 1000, 0.85);
  return {
    url: compressed,
    isRemoteStorage: false,
    message: 'Image optimisée et prête à l’enregistrement.'
  };
}

/**
 * Valide si une chaîne est une URL ou un chemin d'image valide
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./')
  );
}

export { APPLE_ASSET_IMAGES };
