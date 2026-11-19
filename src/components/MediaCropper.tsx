import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Check,
  ArrowLeft,
  Sliders,
  Crop,
  RefreshCw,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { uploadSanitizedImageDataUrl } from '../services/imageService';
import { validateImageFile } from '../utils/security';

export interface MediaCropperProps {
  initialSrc: string;
  title: string;
  subtitle?: string;
  defaultAspectRatio?: AspectPresetKey;
  uploadFolder?: 'products' | 'hero' | 'media';
  onSave: (newUrl: string) => Promise<void> | void;
  onCancel: () => void;
}

export type AspectPresetKey = '1:1' | '4:3' | '4:5' | '3:4' | '16:9' | '9:16';

interface AspectPreset {
  key: AspectPresetKey;
  label: string;
  ratio: number; // width / height
  outputWidth: number;
  outputHeight: number;
}

const ASPECT_PRESETS: AspectPreset[] = [
  { key: '1:1', label: '1:1 Carré', ratio: 1, outputWidth: 1000, outputHeight: 1000 },
  { key: '4:3', label: '4:3 Produit', ratio: 4 / 3, outputWidth: 1200, outputHeight: 900 },
  { key: '4:5', label: '4:5 Hero', ratio: 4 / 5, outputWidth: 960, outputHeight: 1200 },
  { key: '3:4', label: '3:4 Portrait', ratio: 3 / 4, outputWidth: 900, outputHeight: 1200 },
  { key: '16:9', label: '16:9 Large', ratio: 16 / 9, outputWidth: 1280, outputHeight: 720 },
  { key: '9:16', label: '9:16 Mobile', ratio: 9 / 16, outputWidth: 720, outputHeight: 1280 }
];

type BgFill = 'transparent' | '#ffffff' | '#f1f5f9' | '#0b0f17';

export const MediaCropper: React.FC<MediaCropperProps> = ({
  initialSrc,
  title,
  subtitle,
  defaultAspectRatio = '4:3',
  uploadFolder = 'media',
  onSave,
  onCancel
}) => {
  const [sourceUrl, setSourceUrl] = useState<string>(initialSrc);
  const [aspectKey, setAspectKey] = useState<AspectPresetKey>(defaultAspectRatio);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [fineAngle, setFineAngle] = useState<number>(0); // -45 .. 45
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [bgFill, setBgFill] = useState<BgFill>('transparent');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [activeControlTab, setActiveControlTab] = useState<'crop' | 'adjust'>('crop');

  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [isImgLoading, setIsImgLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileReplaceInputRef = useRef<HTMLInputElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const preset = ASPECT_PRESETS.find((p) => p.key === aspectKey) || ASPECT_PRESETS[1];

  // Load image into memory (CORS anonymous for external URLs when allowed)
  useEffect(() => {
    if (!sourceUrl) {
      setIsImgLoading(false);
      setLoadError("Aucune image sélectionnée.");
      return;
    }

    let cancelled = false;
    setIsImgLoading(true);
    setLoadError(null);

    const img = new Image();
    if (!sourceUrl.startsWith('data:') && !sourceUrl.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      if (cancelled) return;
      setImgElement(img);
      setIsImgLoading(false);
    };

    img.onerror = () => {
      if (cancelled) return;
      // Retry without crossOrigin only for preview if needed (note: export may warn)
      setIsImgLoading(false);
      setLoadError(
        "Impossible de charger cette image distante pour le recadrage (restriction CORS). Importez le fichier localement avec le bouton ci-dessous."
      );
    };

    img.src = sourceUrl;

    return () => {
      cancelled = true;
    };
  }, [sourceUrl]);

  // Helper: Draw cropped/transformed image onto any canvas
  const renderToCanvas = useCallback(
    (canvas: HTMLCanvasElement, targetWidth: number, targetHeight: number, isPreview: boolean) => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !imgElement) return;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.clearRect(0, 0, targetWidth, targetHeight);

      if (bgFill !== 'transparent') {
        ctx.fillStyle = bgFill;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Apply subtle tonal adjustments
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

      // Base scale to nicely fit/cover image inside target frame
      const totalRad = ((rotation + fineAngle) * Math.PI) / 180;
      const isQuarterTurn = Math.abs(rotation % 180) === 90;
      const effW = isQuarterTurn ? imgElement.naturalHeight : imgElement.naturalWidth;
      const effH = isQuarterTurn ? imgElement.naturalWidth : imgElement.naturalHeight;

      // Fit image inside frame by default so nothing is accidentally cut off before user zooms
      const fitScale = Math.min(targetWidth / effW, targetHeight / effH);
      const scale = fitScale * zoom;

      // Translate center + user pan offset (normalized relative to preview size)
      const panScale = isPreview ? 1 : targetWidth / (previewCanvasRef.current?.clientWidth || targetWidth);
      ctx.translate(targetWidth / 2 + offset.x * panScale, targetHeight / 2 + offset.y * panScale);
      ctx.rotate(totalRad);
      ctx.scale(flipH ? -scale : scale, flipV ? -scale : scale);

      ctx.drawImage(
        imgElement,
        -imgElement.naturalWidth / 2,
        -imgElement.naturalHeight / 2,
        imgElement.naturalWidth,
        imgElement.naturalHeight
      );

      ctx.restore();
    },
    [imgElement, bgFill, brightness, contrast, saturation, rotation, fineAngle, zoom, offset, flipH, flipV]
  );

  // Redraw preview canvas whenever any transform changes
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !imgElement) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const maxPreviewW = 540;
    const maxPreviewH = 420;
    let pw = maxPreviewW;
    let ph = pw / preset.ratio;
    if (ph > maxPreviewH) {
      ph = maxPreviewH;
      pw = ph * preset.ratio;
    }
    canvas.style.width = `${Math.round(pw)}px`;
    canvas.style.height = `${Math.round(ph)}px`;
    renderToCanvas(canvas, Math.round(pw * dpr), Math.round(ph * dpr), false);
  }, [imgElement, preset.ratio, renderToCanvas]);

  // Pointer drag handlers (works smoothly with both mouse & touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset({
      x: dragStartRef.current.ox + dx,
      y: dragStartRef.current.oy + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleResetTransforms = () => {
    setZoom(1);
    setRotation(0);
    setFineAngle(0);
    setFlipH(false);
    setFlipV(false);
    setOffset({ x: 0, y: 0 });
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBgFill('transparent');
  };

  const handleFitCover = () => {
    if (!imgElement) return;
    const isQuarterTurn = Math.abs(rotation % 180) === 90;
    const effW = isQuarterTurn ? imgElement.naturalHeight : imgElement.naturalWidth;
    const effH = isQuarterTurn ? imgElement.naturalWidth : imgElement.naturalHeight;
    const imgRatio = effW / effH;
    const coverFactor = Math.max(preset.ratio / imgRatio, imgRatio / preset.ratio);
    setZoom(Math.min(3, Math.max(1, Number(coverFactor.toFixed(2)))));
    setOffset({ x: 0, y: 0 });
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = await validateImageFile(file);
    if (!check.valid) {
      setLoadError(check.error || 'Fichier image refusé.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setSourceUrl(result);
        handleResetTransforms();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirmSave = async () => {
    if (!imgElement || isSaving) return;
    setIsSaving(true);
    setLoadError(null);

    try {
      const exportCanvas = document.createElement('canvas');
      renderToCanvas(exportCanvas, preset.outputWidth, preset.outputHeight, false);

      let dataUrl: string;
      try {
        // Export WebP (supports transparency + ultra-lightweight for fast mobile loading)
        const webp = exportCanvas.toDataURL('image/webp', 0.88);
        if (webp.startsWith('data:image/webp')) {
          dataUrl = webp;
        } else {
          dataUrl = bgFill === 'transparent'
            ? exportCanvas.toDataURL('image/png')
            : exportCanvas.toDataURL('image/jpeg', 0.9);
        }
      } catch {
        throw new Error(
          "Cette image externe ne peut pas être exportée directement (CORS). Importez-la depuis votre appareil pour la recadrer."
        );
      }

      const uploaded = await uploadSanitizedImageDataUrl(dataUrl, uploadFolder);
      await onSave(uploaded.url);
    } catch (err: any) {
      setLoadError(err?.message || "Impossible d'enregistrer l'image recadrée.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Inline Page Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-950 dark:text-white font-['Outfit'] truncate">
              Studio Média & Recadrage — {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            ref={fileReplaceInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleReplaceFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileReplaceInputRef.current?.click()}
            className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Importer une photo</span>
          </button>

          <button
            type="button"
            onClick={handleConfirmSave}
            disabled={isSaving || !imgElement || !!loadError}
            className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Export WebP...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Appliquer & Publier</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Editor Workspace: Left Interactive Canvas Stage + Right Precision Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Interactive Canvas Preview */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
            <span>Glissez l’image pour repositionner · Format : <strong className="text-slate-900 dark:text-white">{preset.label}</strong></span>
            <span className="font-mono text-[11px] tabular-nums">
              {preset.outputWidth} × {preset.outputHeight} px
            </span>
          </div>

          {loadError ? (
            <div className="w-full min-h-[300px] rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 p-6 flex flex-col items-center justify-center text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
              <p className="text-xs font-medium text-rose-800 dark:text-rose-200 max-w-md">
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => fileReplaceInputRef.current?.click()}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Importer depuis mon appareil</span>
              </button>
            </div>
          ) : (
            <div
              className="relative flex items-center justify-center w-full min-h-[300px] sm:min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 p-4"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, rgba(148,163,184,0.14) 25%, transparent 25%), linear-gradient(-45deg, rgba(148,163,184,0.14) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(148,163,184,0.14) 75%), linear-gradient(-45deg, transparent 75%, rgba(148,163,184,0.14) 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}
            >
              {isImgLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 backdrop-blur-xs z-20">
                  <RefreshCw className="w-6 h-6 text-slate-900 dark:text-white animate-spin" />
                </div>
              )}

              <div className="relative shadow-2xl rounded-xl overflow-hidden ring-2 ring-slate-900/80 dark:ring-white/80">
                <canvas
                  ref={previewCanvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className={`block max-w-full touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                />

                {/* Rule-of-thirds overlay grid */}
                {showGrid && (
                  <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                    {Array.from({ length: 9 }).map((_, idx) => (
                      <div key={idx} className="border border-white/35 shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.2)]" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Bottom Canvas Bar */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleFitCover}
                className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
              >
                Remplir le cadre
              </button>
              <button
                type="button"
                onClick={() => setOffset({ x: 0, y: 0 })}
                className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
              >
                Recentrer
              </button>
              <button
                type="button"
                onClick={() => setShowGrid((g) => !g)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  showGrid
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Grille 3×3
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetTransforms}
              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>

        {/* Right Controls Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-5">
          {/* Sub-tabs: Recadrage vs Retouche */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActiveControlTab('crop')}
              className={`min-h-[40px] rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeControlTab === 'crop'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>Recadrage & Format</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveControlTab('adjust')}
              className={`min-h-[40px] rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeControlTab === 'adjust'
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Lumière & Couleurs</span>
            </button>
          </div>

          {activeControlTab === 'crop' ? (
            <div className="space-y-5 text-xs">
              {/* Aspect Ratio Presets */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Format de sortie
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ASPECT_PRESETS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setAspectKey(p.key)}
                      className={`min-h-[40px] px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        aspectKey === p.key
                          ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-transparent shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zoom Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Zoom</label>
                  <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
                    className="min-h-[38px] min-w-[38px] rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
                    aria-label="Dézoomer"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.02"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-slate-900 dark:accent-white cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
                    className="min-h-[38px] min-w-[38px] rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
                    aria-label="Zoomer"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rotate & Flip */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Orientation & Miroir
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                    className="min-h-[42px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1 font-semibold cursor-pointer"
                    title="Pivoter à gauche 90°"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>-90°</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="min-h-[42px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1 font-semibold cursor-pointer"
                    title="Pivoter à droite 90°"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>+90°</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipH((f) => !f)}
                    className={`min-h-[42px] rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                      flipH
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                    title="Miroir horizontal"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipV((f) => !f)}
                    className={`min-h-[42px] rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                      flipV
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                    title="Miroir vertical"
                  >
                    <FlipVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Fine Straighten Angle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Redressement fin</label>
                  <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {fineAngle > 0 ? `+${fineAngle}°` : `${fineAngle}°`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={fineAngle}
                  onChange={(e) => setFineAngle(parseInt(e.target.value, 10))}
                  className="w-full accent-slate-900 dark:accent-white cursor-pointer"
                />
              </div>

              {/* Background Fill */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Arrière-plan du cadre
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      { val: 'transparent', label: 'Transparent' },
                      { val: '#ffffff', label: 'Blanc pur' },
                      { val: '#f1f5f9', label: 'Studio gris' },
                      { val: '#0b0f17', label: 'Noir mat' }
                    ] as { val: BgFill; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setBgFill(opt.val)}
                      className={`min-h-[38px] px-2 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer transition-all ${
                        bgFill === opt.val
                          ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-transparent'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Luminosité</label>
                  <span className="font-mono text-slate-500 tabular-nums">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="130"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                  className="w-full accent-slate-900 dark:accent-white cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Contraste</label>
                  <span className="font-mono text-slate-500 tabular-nums">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="135"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value, 10))}
                  className="w-full accent-slate-900 dark:accent-white cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Saturation</label>
                  <span className="font-mono text-slate-500 tabular-nums">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="140"
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value, 10))}
                  className="w-full accent-slate-900 dark:accent-white cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                L’export optimise automatiquement l’image en format WebP haute netteté et supprime toutes les métadonnées EXIF/GPS avant publication.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
