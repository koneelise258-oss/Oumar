import { resolveVideoMimeType } from '../utils/security';

export interface VideoCompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
  resolvedMime: string;
  note?: string;
}

function pickSupportedRecorderMime(
  inputMime: string
): { recorderMime: string; baseMime: 'video/mp4' | 'video/webm' } | null {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return null;
  }

  // Toujours privilégier MP4 (H.264/AAC) pour garantir la lecture fluide sur iPhone Safari, Android & Desktop.
  // Ne jamais convertir un MP4/MOV en WebM (WebM produit par MediaRecorder casse le seek/durée et iOS Safari).
  const mp4Candidates: Array<{ recorderMime: string; baseMime: 'video/mp4' }> = [
    { recorderMime: 'video/mp4;codecs=avc1.4d401f,mp4a.40.2', baseMime: 'video/mp4' },
    { recorderMime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', baseMime: 'video/mp4' },
    { recorderMime: 'video/mp4', baseMime: 'video/mp4' }
  ];

  for (const item of mp4Candidates) {
    try {
      if (MediaRecorder.isTypeSupported(item.recorderMime)) {
        return item;
      }
    } catch {
      // Ignorer un codec non reconnu
    }
  }

  // Uniquement autoriser WebM si la source importée est déjà au format WebM
  if (inputMime === 'video/webm') {
    const webmCandidates: Array<{ recorderMime: string; baseMime: 'video/webm' }> = [
      { recorderMime: 'video/webm;codecs=vp9,opus', baseMime: 'video/webm' },
      { recorderMime: 'video/webm;codecs=vp8,opus', baseMime: 'video/webm' },
      { recorderMime: 'video/webm', baseMime: 'video/webm' }
    ];
    for (const item of webmCandidates) {
      try {
        if (MediaRecorder.isTypeSupported(item.recorderMime)) {
          return item;
        }
      } catch {
        // Ignorer un codec non reconnu
      }
    }
  }

  return null;
}

/**
 * Compresse légèrement et proprement une vidéo lourde côté navigateur avant l'envoi :
 * - Laisse passer directement les MP4/MOV déjà légers et fluides (<= 8 Mo & <= 1280px, ou <= 2,6 Mbps)
 *   pour éviter tout ré-encodage inutile et préserver la fluidité matérielle d'origine.
 * - Synchronise la capture image par image via `requestVideoFrameCallback` (+ `requestFrame()` si dispo)
 *   afin d'éliminer les saccades et sauts d'images.
 * - Ne remplace jamais un MP4/MOV par du WebM (compatibilité iPhone / Safari).
 * - N'applique le fichier compressé que si le gain réel est d'au moins 12 %.
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

  // Fichier déjà léger (< 4 Mo) : envoi direct ultra-rapide sans perte ni latence
  if (file.size <= 4 * 1024 * 1024) {
    return fallbackResult;
  }

  const codecChoice = pickSupportedRecorderMime(fallbackMime);
  if (!codecChoice) {
    return fallbackResult;
  }

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.playsInline = true;
  video.preload = 'metadata';
  video.crossOrigin = 'anonymous';
  video.src = objectUrl;

  let audioCtx: AudioContext | null = null;
  let rafId = 0;
  let rvfcId = 0;
  let stallWatchdog = 0;
  let safetyTimeout = 0;

  try {
    // 1. Lire rapidement les métadonnées (dimensions & durée)
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

    // Ignorer si durée invalide ou vidéo très longue (> 4 minutes) pour ne pas bloquer l'interface
    if (!Number.isFinite(duration) || duration <= 0.4 || duration > 240 || !srcW || !srcH) {
      return fallbackResult;
    }

    const maxSrcSide = Math.max(srcW, srcH);
    const origBitrate = (file.size * 8) / duration;

    // Préserver les vidéos déjà propres pour un import instantané sans aucune saccade
    const isAlreadyCompactMp4 =
      fallbackMime === 'video/mp4' && file.size <= 8 * 1024 * 1024 && maxSrcSide <= 1280;
    const isAlreadyOptimizedBitrate =
      origBitrate > 0 && origBitrate <= 2_600_000 && maxSrcSide <= 1280;

    if (isAlreadyCompactMp4 || isAlreadyOptimizedBitrate) {
      return fallbackResult;
    }

    // Charger complètement les données locales uniquement si une compression est nécessaire
    video.preload = 'auto';

    // 2. Calculer des dimensions paires (exigées par les encodeurs matériels H.264/VP9)
    const MAX_LONG_SIDE = 1280;
    const scale = maxSrcSide > MAX_LONG_SIDE ? MAX_LONG_SIDE / maxSrcSide : 1;
    const targetW = Math.max(2, Math.round(srcW * scale) & ~1);
    const targetH = Math.max(2, Math.round(srcH * scale) & ~1);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx || typeof canvas.captureStream !== 'function') {
      return fallbackResult;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 3. Débit cible pour une compression légère mais fluide (2.0 à 3.0 Mbps selon source)
    let targetVideoBps = Math.min(Math.max(Math.round(origBitrate * 0.55), 1_600_000), 3_000_000);
    if (file.size > 40 * 1024 * 1024) {
      const maxFor38Mb = Math.floor((38 * 1024 * 1024 * 8) / duration) - 128_000;
      if (maxFor38Mb >= 1_100_000) {
        targetVideoBps = Math.min(targetVideoBps, maxFor38Mb);
      }
    }

    const supportsRvfc = typeof (video as any).requestVideoFrameCallback === 'function';
    // Mode capture manuelle image par image si requestFrame() + requestVideoFrameCallback disponibles
    const probeStream = canvas.captureStream(0);
    const probeTrack = probeStream.getVideoTracks()[0] as
      | (MediaStreamTrack & { requestFrame?: () => void })
      | undefined;
    const useManualFrameSync = supportsRvfc && typeof probeTrack?.requestFrame === 'function';

    let canvasStream: MediaStream;
    let manualVideoTrack: (MediaStreamTrack & { requestFrame?: () => void }) | undefined;

    if (useManualFrameSync) {
      canvasStream = probeStream;
      manualVideoTrack = probeTrack;
    } else {
      probeStream.getTracks().forEach((t) => t.stop());
      canvasStream = canvas.captureStream(30);
    }

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
      let lastDrawnMediaTime = -1;
      let lastProgressPct = 0;
      let lastProgressTs = 0;

      const reportProgress = (mediaTime: number) => {
        if (!onProgress || duration <= 0) return;
        const now = performance.now();
        const pct = Math.min(99, Math.max(1, Math.round((mediaTime / duration) * 100)));
        if (pct - lastProgressPct >= 2 || now - lastProgressTs >= 250) {
          lastProgressPct = pct;
          lastProgressTs = now;
          onProgress(pct);
        }
      };

      const finish = () => {
        if (finished) return;
        finished = true;
        window.cancelAnimationFrame(rafId);
        if (rvfcId && typeof (video as any).cancelVideoFrameCallback === 'function') {
          try {
            (video as any).cancelVideoFrameCallback(rvfcId);
          } catch {
            // Ignore cancel errors
          }
        }
        window.clearInterval(stallWatchdog);
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
          window.clearInterval(stallWatchdog);
          window.clearTimeout(safetyTimeout);
          reject(new Error('Erreur durant la compression vidéo'));
        }
      };

      const paintFrame = (mediaTime: number) => {
        if (finished) return;
        ctx.drawImage(video, 0, 0, targetW, targetH);
        if (manualVideoTrack?.requestFrame) {
          manualVideoTrack.requestFrame();
        }
        lastDrawnMediaTime = mediaTime;
        reportProgress(mediaTime);
      };

      const scheduleNextFrame = () => {
        if (finished) return;

        if (supportsRvfc) {
          rvfcId = (video as any).requestVideoFrameCallback((_now: number, metadata: any) => {
            if (finished) return;
            const mediaTime = typeof metadata?.mediaTime === 'number' ? metadata.mediaTime : video.currentTime;
            if (mediaTime !== lastDrawnMediaTime && video.readyState >= 2) {
              paintFrame(mediaTime);
            }
            if (video.ended || video.currentTime >= duration - 0.03) {
              finish();
              return;
            }
            scheduleNextFrame();
          });
          return;
        }

        rafId = window.requestAnimationFrame(() => {
          if (finished) return;
          if (video.readyState >= 2 && Math.abs(video.currentTime - lastDrawnMediaTime) >= 0.008) {
            paintFrame(video.currentTime);
          }
          if (video.ended || video.currentTime >= duration - 0.03) {
            finish();
            return;
          }
          scheduleNextFrame();
        });
      };

      video.onended = finish;
      safetyTimeout = window.setTimeout(finish, Math.round(duration * 1000) + 12_000);
      // Watchdog léger uniquement en fin de lecture si l'événement `ended` tarde
      stallWatchdog = window.setInterval(() => {
        if (!finished && (video.ended || video.currentTime >= duration - 0.03)) {
          finish();
        }
      }, 300);

      video.currentTime = 0;
      recorder.start(500);
      onProgress?.(2);

      video
        .play()
        .then(() => {
          if (video.readyState >= 2) {
            paintFrame(video.currentTime);
          }
          scheduleNextFrame();
        })
        .catch(() => {
          // Si le navigateur bloque l'autoplay non muet, repasser en muet et réessayer
          video.muted = true;
          video
            .play()
            .then(() => {
              if (video.readyState >= 2) {
                paintFrame(video.currentTime);
              }
              scheduleNextFrame();
            })
            .catch((err) => {
              finished = true;
              window.clearInterval(stallWatchdog);
              window.clearTimeout(safetyTimeout);
              reject(err);
            });
        });
    });

    onProgress?.(100);

    // Conserver le fichier compressé uniquement s'il apporte une vraie baisse de poids (>= 12%)
    if (recordedBlob.size > 0 && recordedBlob.size < file.size * 0.88) {
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
    if (rvfcId && typeof (video as any).cancelVideoFrameCallback === 'function') {
      try {
        (video as any).cancelVideoFrameCallback(rvfcId);
      } catch {
        // Ignore cancel errors
      }
    }
    window.clearInterval(stallWatchdog);
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
