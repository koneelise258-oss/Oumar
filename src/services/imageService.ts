import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { APPLE_ASSET_IMAGES } from '../data/products';
import { isSafeMediaUrl, validateImageFile, validateVideoFile } from '../utils/security';
import { compressVideoFile } from './videoCompressionService';

export interface ImageUploadResult {
  url: string;
  isRemoteStorage: boolean;
  message?: string;
  originalSize?: number;
  finalSize?: number;
  wasCompressed?: boolean;
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
 * Encode une chaîne UTF-8 en Base64 standard pour les métadonnées TUS.
 */
function encodeTusMetadataValue(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Téléversement fragmenté TUS (par tranches de 6 Mo) compatible Supabase Storage
 * pour les vidéos haute définition très lourdes sans timeout ni saturation mémoire.
 */
async function uploadVideoViaTus(
  bucketName: string,
  fileName: string,
  file: File,
  resolvedMime: string,
  accessToken: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const { supabaseUrl, supabaseAnonKey } = await import('../lib/supabase');
  const tusEndpoint = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/upload/resumable`;
  const metadata = [
    `bucketName ${encodeTusMetadataValue(bucketName)}`,
    `objectName ${encodeTusMetadataValue(fileName)}`,
    `contentType ${encodeTusMetadataValue(resolvedMime)}`,
    `cacheControl ${encodeTusMetadataValue('31536000')}`
  ].join(',');

  const createRes = await fetch(tusEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      'x-upsert': 'false',
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(file.size),
      'Upload-Metadata': metadata
    }
  });

  if (!createRes.ok) {
    let reason = `HTTP ${createRes.status}`;
    try {
      const txt = await createRes.text();
      if (txt) {
        try {
          const parsed = JSON.parse(txt);
          reason = parsed?.message || parsed?.error || txt;
        } catch {
          reason = txt;
        }
      }
    } catch {
      // Ignore body read error
    }
    throw new Error(reason);
  }

  const rawLocation = createRes.headers.get('Location') || createRes.headers.get('location');
  if (!rawLocation) {
    throw new Error('En-tête Location TUS manquant dans la réponse Supabase Storage.');
  }

  const uploadUrl = rawLocation.startsWith('http')
    ? rawLocation
    : `${supabaseUrl.replace(/\/+$/, '')}${rawLocation.startsWith('/') ? '' : '/'}${rawLocation}`;

  const CHUNK_SIZE = 6 * 1024 * 1024; // 6 Mo par tranche (recommandation Supabase TUS)
  let offset = 0;

  while (offset < file.size) {
    const end = Math.min(offset + CHUNK_SIZE, file.size);
    const chunk = file.slice(offset, end);

    let chunkSuccess = false;
    let lastChunkError = 'Erreur réseau lors du transfert par tranches.';

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const patchRes = await fetch(uploadUrl, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: supabaseAnonKey,
            'Tus-Resumable': '1.0.0',
            'Upload-Offset': String(offset),
            'Content-Type': 'application/offset+octet-stream'
          },
          body: chunk
        });

        if (patchRes.ok) {
          const nextOffsetHeader =
            patchRes.headers.get('Upload-Offset') || patchRes.headers.get('upload-offset');
          const parsedOffset = nextOffsetHeader ? Number(nextOffsetHeader) : end;
          offset = Number.isFinite(parsedOffset) && parsedOffset > offset ? parsedOffset : end;
          chunkSuccess = true;
          break;
        }

        const errTxt = await patchRes.text().catch(() => '');
        lastChunkError = errTxt || `HTTP ${patchRes.status}`;
        if (patchRes.status === 413 || patchRes.status === 401 || patchRes.status === 403 || patchRes.status === 415) {
          break; // Erreur non transitoire : inutile de retenter
        }
      } catch (err: any) {
        lastChunkError = err?.message || lastChunkError;
      }

      await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
    }

    if (!chunkSuccess) {
      throw new Error(lastChunkError);
    }

    if (onProgress) {
      const pct = Math.min(99, Math.max(1, Math.round((offset / file.size) * 100)));
      onProgress(pct);
    }
  }

  const { data: pubData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  if (!pubData?.publicUrl || !isSafeMediaUrl(pubData.publicUrl)) {
    throw new Error('URL publique vidéo invalide après téléversement.');
  }

  onProgress?.(100);
  return pubData.publicUrl;
}

export interface VideoUploadOptions {
  autoCompress?: boolean;
  onStatus?: (stage: 'compressing' | 'uploading', percent: number) => void;
}

/**
 * Valide, compresse légèrement et automatiquement si activé, puis importe une vidéo
 * vers Supabase Storage (envoi fragmenté TUS si > 6 Mo, standard sinon).
 */
export async function uploadStoreVideoFile(
  file: File,
  progressOrOptions?: ((percent: number) => void) | VideoUploadOptions
): Promise<ImageUploadResult> {
  const options: VideoUploadOptions =
    typeof progressOrOptions === 'function'
      ? { autoCompress: true, onStatus: (_stage, pct) => progressOrOptions(pct) }
      : progressOrOptions || {};

  const autoCompress = options.autoCompress !== false;
  const onStatus = options.onStatus;

  const check = await validateVideoFile(file);
  if (!check.valid) {
    throw new Error(check.error || 'Fichier vidéo refusé par sécurité.');
  }

  let workingFile = file;
  let resolvedMime = check.resolvedMime || 'video/mp4';
  let wasCompressed = false;
  const originalSize = file.size;

  if (autoCompress) {
    onStatus?.('compressing', 1);
    const compressedRes = await compressVideoFile(file, (pct) => {
      onStatus?.('compressing', pct);
    });
    workingFile = compressedRes.file;
    resolvedMime = compressedRes.resolvedMime || resolvedMime;
    wasCompressed = compressedRes.wasCompressed;
  }

  const finalSize = workingFile.size;
  const savedPct =
    wasCompressed && originalSize > 0
      ? Math.max(1, Math.round((1 - finalSize / originalSize) * 100))
      : 0;
  const compressionSummary = wasCompressed
    ? ` (${(originalSize / (1024 * 1024)).toFixed(1)} Mo → ${(finalSize / (1024 * 1024)).toFixed(1)} Mo, -${savedPct}%)`
    : '';

  const ext =
    resolvedMime === 'video/webm'
      ? 'webm'
      : resolvedMime === 'video/quicktime'
      ? 'mov'
      : resolvedMime === 'video/x-m4v'
      ? 'm4v'
      : resolvedMime === 'video/x-matroska'
      ? 'mkv'
      : resolvedMime === 'video/3gpp'
      ? '3gp'
      : 'mp4';

  let remoteFailureReason = '';

  if (isSupabaseConfigured) {
    const randomToken =
      typeof crypto !== 'undefined' && crypto.getRandomValues
        ? Array.from(crypto.getRandomValues(new Uint8Array(8)))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
        : Math.random().toString(36).substring(2, 10);
    const fileName = `videos/${Date.now()}-${randomToken}.${ext}`;
    const TUS_THRESHOLD_BYTES = 6 * 1024 * 1024;

    const { data: sessionData } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    const accessToken = sessionData?.session?.access_token;

    for (const bucketName of ['store-videos', 'store-products']) {
      // 1) Pour les vidéos > 6 Mo avec session admin active : protocole TUS par tranches de 6 Mo
      if (workingFile.size > TUS_THRESHOLD_BYTES && accessToken) {
        try {
          onStatus?.('uploading', 2);
          const publicUrl = await uploadVideoViaTus(
            bucketName,
            fileName,
            workingFile,
            resolvedMime,
            accessToken,
            (pct) => onStatus?.('uploading', pct)
          );
          return {
            url: publicUrl,
            isRemoteStorage: true,
            originalSize,
            finalSize,
            wasCompressed,
            message: wasCompressed
              ? `Vidéo compressée${compressionSummary} et publiée sur Supabase Storage.`
              : `Vidéo de ${(finalSize / (1024 * 1024)).toFixed(1)} Mo importée et publiée sur Supabase Storage.`
          };
        } catch (tusErr: any) {
          remoteFailureReason = tusErr?.message || 'Erreur lors du transfert fragmenté Supabase Storage';
          if (workingFile.size > 45 * 1024 * 1024) {
            continue;
          }
        }
      }

      // 2) Envoi direct standard (<= 6 Mo, ou repli <= 45 Mo si TUS indisponible)
      try {
        onStatus?.('uploading', 15);
        const typedBlob = new Blob([workingFile], { type: resolvedMime });
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, typedBlob, {
            contentType: resolvedMime,
            cacheControl: '31536000',
            upsert: false
          });

        if (!error && data?.path) {
          const { data: pubData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(data.path);

          if (pubData?.publicUrl && isSafeMediaUrl(pubData.publicUrl)) {
            onStatus?.('uploading', 100);
            return {
              url: pubData.publicUrl,
              isRemoteStorage: true,
              originalSize,
              finalSize,
              wasCompressed,
              message: wasCompressed
                ? `Vidéo compressée${compressionSummary} et publiée sur le stockage en ligne.`
                : 'Vidéo vérifiée et publiée sur le stockage en ligne.'
            };
          }
        } else if (error?.message) {
          remoteFailureReason = error.message;
        }
      } catch (err: any) {
        remoteFailureReason = err?.message || 'Erreur réseau Supabase Storage';
      }
    }
  }

  if (workingFile.size > 2.0 * 1024 * 1024) {
    const sizeLabel = `${(workingFile.size / (1024 * 1024)).toFixed(1)} Mo`;
    const storageHint = remoteFailureReason
      ? ` Détail serveur : ${remoteFailureReason}. Exécutez le script SQL de déblocage Storage (Paramètres → Script SQL) et vérifiez la limite globale dans Supabase → Storage → Settings.`
      : ' Vérifiez votre connexion administrateur Supabase Storage pour téléverser les vidéos lourdes en ligne.';
    throw new Error(
      `Impossible d’enregistrer cette vidéo de ${sizeLabel}${compressionSummary} sans le stockage cloud Supabase.${storageHint}`
    );
  }

  // Toujours créer un Blob typé explicitement pour éviter "data:application/octet-stream" sur mobile
  const safeVideoBlob = new Blob([workingFile], { type: resolvedMime });

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier vidéo.'));
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (!isSafeMediaUrl(res)) {
        reject(new Error('Format vidéo non autorisé après encodage.'));
        return;
      }
      resolve(res);
    };
    reader.readAsDataURL(safeVideoBlob);
  });

  onStatus?.('uploading', 100);
  return {
    url: dataUrl,
    isRemoteStorage: false,
    originalSize,
    finalSize,
    wasCompressed,
    message: remoteFailureReason
      ? `Vidéo compressée${compressionSummary} importée localement (le stockage cloud a refusé le transfert, pensez à exécuter le script SQL Storage).`
      : wasCompressed
      ? `Vidéo compressée${compressionSummary} et importée avec succès.`
      : 'Vidéo validée et importée avec succès.'
  };
}

/**
 * Valide strictement qu'une chaîne est une URL d'image sûre (bloque javascript:, SVG data URLs, path traversal).
 */
export function isValidImageUrl(url?: string | null): boolean {
  return isSafeMediaUrl(url);
}

export { APPLE_ASSET_IMAGES };
