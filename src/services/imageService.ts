import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { APPLE_ASSET_IMAGES } from '../data/products';
import { isSafeMediaUrl, validateImageFile, validateVideoFile } from '../utils/security';

export interface ImageUploadResult {
  url: string;
  isRemoteStorage: boolean;
  message?: string;
}

/**
 * Compresse et ré-encode une image côté client via Canvas.
 * Double avantage :
 * 1) Performance retina ultra-légère (~60 à 120 Ko)
 * 2) Sécurité : supprime automatiquement toutes les métadonnées EXIF/GPS et bloque les SVG/polyglots.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1000,
  quality = 0.85
): Promise<string> {
  const check = await validateImageFile(file);
  if (!check.valid) {
    throw new Error(check.error || 'Fichier image non autorisé.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier image.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        reject(new Error('Image corrompue ou illisible.'));
      };
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (!width || !height || width > 12000 || height > 12000) {
          reject(new Error('Dimensions d’image invalides ou excessives.'));
          return;
        }

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
          reject(new Error('Traitement graphique indisponible sur ce navigateur.'));
          return;
        }

        // Ré-encodage propre (supprime EXIF / GPS / scripts éventuels)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export WebP prioritaire, fallback JPEG
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {
          // Fallback JPEG
        }

        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+);base64/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Valide (MIME + magic bytes + blocage SVG), nettoie les métadonnées EXIF via ré-encodage Canvas,
 * puis envoie vers Supabase Storage (bucket store-products) ou retourne la version compressée sécurisée.
 */
export async function processAndUploadProductImage(file: File): Promise<ImageUploadResult> {
  // 1. Validation stricte de sécurité + ré-encodage anti-EXIF/XSS
  const sanitizedDataUrl = await compressImageFile(file, 1000, 0.85);

  // 2. Si Supabase est configuré, téléverser le fichier ré-encodé (sans EXIF/GPS) vers Supabase Storage
  if (isSupabaseConfigured) {
    try {
      const cleanBlob = dataUrlToBlob(sanitizedDataUrl);
      const cleanExt = cleanBlob.type === 'image/webp' ? 'webp' : 'jpg';
      const randomToken = typeof crypto !== 'undefined' && crypto.getRandomValues
        ? Array.from(crypto.getRandomValues(new Uint8Array(8)))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
        : Math.random().toString(36).substring(2, 10);
      const fileName = `products/${Date.now()}-${randomToken}.${cleanExt}`;

      const { data, error } = await supabase.storage
        .from('store-products')
        .upload(fileName, cleanBlob, {
          contentType: cleanBlob.type,
          cacheControl: '3600',
          upsert: false
        });

      if (!error && data?.path) {
        const { data: pubData } = supabase.storage
          .from('store-products')
          .getPublicUrl(data.path);

        if (pubData?.publicUrl && isSafeMediaUrl(pubData.publicUrl)) {
          return {
            url: pubData.publicUrl,
            isRemoteStorage: true,
            message: 'Image vérifiée, nettoyée (EXIF supprimés) et stockée sur Supabase Storage.'
          };
        }
      }
    } catch {
      // Bucket non initialisé : bascule sécurisée sur l'image déjà ré-encodée
    }
  }

  return {
    url: sanitizedDataUrl,
    isRemoteStorage: false,
    message: 'Image vérifiée, optimisée (sans EXIF) et prête à l’enregistrement.'
  };
}

/**
 * Enregistre une image déjà recadrée / retouchée depuis le Studio Média (Canvas WebP/JPEG sans EXIF)
 * vers Supabase Storage si disponible, sinon retourne la Data URL optimisée.
 */
export async function uploadSanitizedImageDataUrl(
  dataUrl: string,
  folder: 'products' | 'hero' | 'media' = 'media'
): Promise<ImageUploadResult> {
  if (!isSafeMediaUrl(dataUrl) || !dataUrl.startsWith('data:image/')) {
    throw new Error('Format de média recadré non autorisé.');
  }

  if (isSupabaseConfigured) {
    try {
      const cleanBlob = dataUrlToBlob(dataUrl);
      const cleanExt = cleanBlob.type === 'image/webp' ? 'webp' : cleanBlob.type === 'image/png' ? 'png' : 'jpg';
      const randomToken = typeof crypto !== 'undefined' && crypto.getRandomValues
        ? Array.from(crypto.getRandomValues(new Uint8Array(8)))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
        : Math.random().toString(36).substring(2, 10);
      const fileName = `${folder}/${Date.now()}-${randomToken}.${cleanExt}`;

      const { data, error } = await supabase.storage
        .from('store-products')
        .upload(fileName, cleanBlob, {
          contentType: cleanBlob.type,
          cacheControl: '31536000',
          upsert: false
        });

      if (!error && data?.path) {
        const { data: pubData } = supabase.storage
          .from('store-products')
          .getPublicUrl(data.path);

        if (pubData?.publicUrl && isSafeMediaUrl(pubData.publicUrl)) {
          return {
            url: pubData.publicUrl,
            isRemoteStorage: true,
            message: 'Média recadré, optimisé (EXIF supprimés) et publié sur le stockage en ligne.'
          };
        }
      }
    } catch {
      // Fallback sécurisé sur la Data URL compressée
    }
  }

  return {
    url: dataUrl,
    isRemoteStorage: false,
    message: 'Média recadré et optimisé avec succès.'
  };
}

/**
 * Valide et importe une vidéo MP4/WebM vers Supabase Storage si disponible,
 * sinon convertit en Data URL si la taille permet le stockage local.
 */
export async function uploadStoreVideoFile(file: File): Promise<ImageUploadResult> {
  const check = await validateVideoFile(file);
  if (!check.valid) {
    throw new Error(check.error || 'Fichier vidéo refusé par sécurité.');
  }

  if (isSupabaseConfigured) {
    try {
      const ext = file.type === 'video/webm' ? 'webm' : 'mp4';
      const randomToken =
        typeof crypto !== 'undefined' && crypto.getRandomValues
          ? Array.from(crypto.getRandomValues(new Uint8Array(8)))
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
          : Math.random().toString(36).substring(2, 10);
      const fileName = `videos/${Date.now()}-${randomToken}.${ext}`;

      const { data, error } = await supabase.storage
        .from('store-products')
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '31536000',
          upsert: false
        });

      if (!error && data?.path) {
        const { data: pubData } = supabase.storage
          .from('store-products')
          .getPublicUrl(data.path);

        if (pubData?.publicUrl && isSafeMediaUrl(pubData.publicUrl)) {
          return {
            url: pubData.publicUrl,
            isRemoteStorage: true,
            message: 'Vidéo vérifiée et publiée sur le stockage en ligne !'
          };
        }
      }
    } catch {
      // Fallback sur Data URL locale
    }
  }

  if (file.size > 3.5 * 1024 * 1024) {
    throw new Error(
      'Vidéo trop volumineuse pour le mode local (> 3,5 Mo). Utilisez un lien HTTPS MP4 ou un lien TikTok, ou activez le stockage en ligne.'
    );
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier vidéo.'));
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (!isSafeMediaUrl(res)) {
        reject(new Error('Format vidéo non autorisé.'));
        return;
      }
      resolve(res);
    };
    reader.readAsDataURL(file);
  });

  return {
    url: dataUrl,
    isRemoteStorage: false,
    message: 'Vidéo validée et importée avec succès.'
  };
}

/**
 * Valide strictement qu'une chaîne est une URL d'image sûre (bloque javascript:, SVG data URLs, path traversal).
 */
export function isValidImageUrl(url?: string | null): boolean {
  return isSafeMediaUrl(url);
}

export { APPLE_ASSET_IMAGES };
