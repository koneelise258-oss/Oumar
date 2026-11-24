import { resolveVideoMimeType } from '../utils/security';

export interface VideoCompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
  resolvedMime: string;
  note?: string;
}

function pickSupportedRecorderMime(): { recorderMime: string; baseMime: 'video/mp4' | 'video/webm' } | null {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return null;
  }

  const candidates: Array<{ recorderMime: string; baseMime: 'video/mp4' | 'video/webm' }> = [
    { recorderMime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', baseMime: 'video/mp4' },
    { recorderMime: 'video/mp4', baseMime: 'video/mp4' },
    { recorderMime: 'video/webm;codecs=vp9,opus', baseMime: 'video/webm' },
    { recorderMime: 'video/webm;codecs=vp8,opus', baseMime: 'video/webm' },
    { recorderMime: 'video/webm', baseMime: 'video/webm' }
  ];

  for (const item of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(item.recorderMime)) {
        return item;
      }
    } catch {
      // Ignorer un codec non reconnu
    }
  }

  return null;
}

/**
 * Compresse légèrement et automatiquement une vidéo côté navigateur avant l'envoi :
 * - Redimensionne si > 1280 px sur le grand côté (conserve un rendu HD net sur smartphone & desktop)
 * - Ajuste le débit vidéo pour faire baisser nettement le poids en Mo tout en préservant l'audio
 * - Ne remplace le fichier que si la taille finale baisse réellement (>= 6% d'économie)
 */
export async function compressVideoFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<VideoCompressionResult> {
  const fallbackMime = resolveVideoMimeType(file);
  const fallbackResult: VideoCompressionResult = {
    file,
    originalSize: file.size,
    compressedSize: file.size,
    wasCompressed: false,
    resolvedMime: fallbackMime
  };

  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof MediaRecorder === 'undefined' ||
    typeof HTMLCanvasElement === 'undefined'
  ) {
    return fallbackResult;
  }

  // Ne pas recompresser un fichier déjà très léger (< 3 Mo)
  if (file.size <= 3 * 1024 * 1024) {
    return fallbackResult;
  }

  const codecChoice = pickSupportedRecorderMime();
  if (!codecChoice) {
    return fallbackResult;
  }

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  video.src = objectUrl;

  let audioCtx: AudioContext | null = null;
  let rafId = 0;
  let backupTimer = 0;
  let safetyTimeout = 0;

  try {
    // 1. Lire les métadonnées (dimensions & durée)
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('Délai métadonnées dépassé')), 10_000);
      video.onloadedmetadata = () => {
        window.clearTimeout(timeout);
        resolve();
      };
      video.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error('Lecture métadonnées vidéo impossible'));
      };
    });

    const duration = video.duration;
    const srcW = video.videoWidth;
    const srcH = video.videoHeight;

    // Ignorer si durée invalide ou vidéo très longue (> 4 minutes) pour ne pas bloquer le navigateur
    if (!Number.isFinite(duration) || duration <= 0.4 || duration > 240 || !srcW || !srcH) {
      return fallbackResult;
    }

    const origBitrate = (file.size * 8) / duration;
    // Si la vidéo est déjà optimisée (<= 1,8 Mbps et <= 1080px), inutile de la recompresser
    if (origBitrate > 0 && origBitrate <= 1_800_000 && Math.max(srcW, srcH) <= 1080) {
      return fallbackResult;
    }

    // 2. Calculer des dimensions paires (exigées par les encodeurs matériels H.264/VP9)
    const MAX_LONG_SIDE = 1280;
    const maxSrcSide = Math.max(srcW, srcH);
    const scale = maxSrcSide > MAX_LONG_SIDE ? MAX_LONG_SIDE / maxSrcSide : 1;
    const targetW = Math.max(2, Math.round(srcW * scale) & ~1);
    const targetH = Math.max(2, Math.round(srcH * scale) & ~1);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx || typeof canvas.captureStream !== 'function') {
      return fallbackResult;
    }

    // 3. Débit cible pour une compression légère mais efficace
    let targetVideoBps = Math.min(Math.max(Math.round(origBitrate * 0.48), 1_400_000), 2_800_000);
    if (file.size > 40 * 1024 * 1024) {
      const maxFor40Mb = Math.floor((40 * 1024 * 1024 * 8) / duration) - 128_000;
      if (maxFor40Mb >= 850_000) {
        targetVideoBps = Math.min(targetVideoBps, maxFor40Mb);
      }
    }

    const canvasStream = canvas.captureStream(30);
    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

    // Capturer l'audio silencieusement sans le diffuser dans les haut-parleurs
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume().catch(() => {});
        }
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        for (const audioTrack of dest.stream.getAudioTracks()) {
          tracks.push(audioTrack);
        }
        video.muted = false;
        video.volume = 1;
      } else {
        video.muted = true;
      }
    } catch {
      video.muted = true;
    }

    const combinedStream = new MediaStream(tracks);
    const chunks: BlobPart[] = [];

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: codecChoice.recorderMime,
      videoBitsPerSecond: targetVideoBps,
      audioBitsPerSecond: 128_000
    });

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        chunks.push(ev.data);
      }
    };

    const recordedBlob = await new Promise<Blob>((resolve, reject) => {
      let finished = false;

      const finish = () => {
        if (finished) return;
        finished = true;
        window.cancelAnimationFrame(rafId);
        window.clearInterval(backupTimer);
        window.clearTimeout(safetyTimeout);
        try {
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        } catch {
          // Ignore stop errors
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: codecChoice.baseMime });
        resolve(blob);
      };

      recorder.onerror = () => {
        if (!finished) {
          finished = true;
          window.cancelAnimationFrame(rafId);
          window.clearInterval(backupTimer);
          window.clearTimeout(safetyTimeout);
          reject(new Error('Erreur durant la compression vidéo'));
        }
      };

      const drawFrame = () => {
        if (finished) return;
        if (video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, targetW, targetH);
        }
        if (onProgress && duration > 0) {
          const pct = Math.min(99, Math.max(1, Math.round((video.currentTime / duration) * 100)));
          onProgress(pct);
        }
        if (video.ended || video.currentTime >= duration - 0.04) {
          finish();
          return;
        }
        rafId = window.requestAnimationFrame(drawFrame);
      };

      video.onended = finish;
      safetyTimeout = window.setTimeout(finish, Math.round(duration * 1000) + 12_000);
      backupTimer = window.setInterval(() => {
        if (!finished && video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, targetW, targetH);
        }
        if (!finished && (video.ended || video.currentTime >= duration - 0.04)) {
          finish();
        }
      }, 120);

      video.currentTime = 0;
      recorder.start(500);
      onProgress?.(2);

      video
        .play()
        .then(() => {
          rafId = window.requestAnimationFrame(drawFrame);
        })
        .catch(() => {
          // Si le navigateur bloque l'autoplay non muet, repasser en muet et réessayer
          video.muted = true;
          video
            .play()
            .then(() => {
              rafId = window.requestAnimationFrame(drawFrame);
            })
            .catch((err) => {
              finished = true;
              window.clearInterval(backupTimer);
              window.clearTimeout(safetyTimeout);
              reject(err);
            });
        });
    });

    onProgress?.(100);

    // Conserver le fichier compressé uniquement s'il est réellement plus léger (>= 6% d'économie)
    if (recordedBlob.size > 0 && recordedBlob.size < file.size * 0.94) {
      const baseName = (file.name || 'video').replace(/\.[^/.]+$/, '');
      const nextExt = codecChoice.baseMime === 'video/mp4' ? 'mp4' : 'webm';
      const compressedFile = new File([recordedBlob], `${baseName}.${nextExt}`, {
        type: codecChoice.baseMime
      });

      return {
        file: compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        wasCompressed: true,
        resolvedMime: codecChoice.baseMime
      };
    }

    return fallbackResult;
  } catch {
    return fallbackResult;
  } finally {
    window.cancelAnimationFrame(rafId);
    window.clearInterval(backupTimer);
    window.clearTimeout(safetyTimeout);
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
    if (audioCtx) {
      audioCtx.close().catch(() => {});
    }
  }
}
