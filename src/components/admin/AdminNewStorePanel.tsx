import React, { useRef, useState } from 'react';
import { NewStoreTeaserSettings } from '../../data/storeSettings';
import { uploadStoreVideoFile } from '../../services/imageService';
import { isSafeMediaUrl, isSafeTikTokUrl } from '../../utils/security';
import { Building2, HardHat, Upload, Trash2, Save, RefreshCw, Eye, EyeOff, Video } from 'lucide-react';

interface AdminNewStorePanelProps {
  form: NewStoreTeaserSettings;
  onChange: (next: NewStoreTeaserSettings) => void;
  onSave: (overrideForm?: NewStoreTeaserSettings) => Promise<void> | void;
  saving: boolean;
  onNotify: (msg: string) => void;
}

export const AdminNewStorePanel: React.FC<AdminNewStorePanelProps> = ({
  form,
  onChange,
  onSave,
  saving,
  onNotify,
}) => {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const res = await uploadStoreVideoFile(file);
      onChange({
        ...form,
        videoUrl: res.url,
        videoType: 'html5',
      });
      onNotify(res.message || 'Vidéo du chantier ajoutée avec succès !');
    } catch (err: any) {
      onNotify(err?.message || 'Impossible de charger cette vidéo.');
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleVideoUrlChange = (val: string) => {
    const lower = val.trim().toLowerCase();
    const detectedType: 'html5' | 'tiktok' = lower.includes('tiktok.com') ? 'tiktok' : 'html5';
    onChange({
      ...form,
      videoUrl: val,
      videoType: detectedType,
    });
  };

  const handleValidateAndSave = () => {
    const trimmedUrl = form.videoUrl.trim();
    if (trimmedUrl) {
      const ok =
        form.videoType === 'tiktok' || trimmedUrl.includes('tiktok.com')
          ? isSafeTikTokUrl(trimmedUrl)
          : isSafeMediaUrl(trimmedUrl);
      if (!ok) {
        onNotify('URL vidéo refusée : saisissez un lien HTTPS (MP4/WebM) ou TikTok valide.');
        return;
      }
    }
    onSave(form);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-950 dark:text-white font-['Outfit'] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span>Section « Nouveau Magasin en Construction »</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gérez l’annonce du futur showroom OUMAR IPHONE avec barre d’avancement et vidéo d’aperçu des travaux.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onChange({ ...form, enabled: !form.enabled })}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-2 ${
              form.enabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {form.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{form.enabled ? 'Section affichée' : 'Section masquée'}</span>
          </button>

          <button
            type="button"
            onClick={handleValidateAndSave}
            disabled={saving || uploadingVideo}
            className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Text & Progress Controls */}
        <div className="lg:col-span-7 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Badge supérieur
              </label>
              <input
                type="text"
                value={form.badgeLabel}
                onChange={(e) => onChange({ ...form, badgeLabel: e.target.value })}
                maxLength={60}
                placeholder="OUVERTURE PROCHAINE"
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Titre de la section
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => onChange({ ...form, title: e.target.value })}
                maxLength={100}
                placeholder="Nouveau Magasin en Construction"
                className="w-full min-h-[42px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Description courte
            </label>
            <textarea
              rows={3}
              value={form.subtitle}
              onChange={(e) => onChange({ ...form, subtitle: e.target.value })}
              maxLength={260}
              placeholder="Un nouvel espace OUMAR IPHONE est actuellement en construction..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white leading-relaxed focus:outline-none"
            />
          </div>

          {/* Progress Slider */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <HardHat className="w-4 h-4 text-amber-500" />
                <span>Avancement des travaux</span>
              </span>
              <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {form.progressPercent}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={form.progressPercent}
              onChange={(e) => onChange({ ...form, progressPercent: parseInt(e.target.value, 10) || 0 })}
              className="w-full accent-emerald-600 cursor-pointer"
              aria-label="Pourcentage d'avancement du chantier"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              {[25, 50, 75, 90, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChange({ ...form, progressPercent: val })}
                  className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Video Upload or URL */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Vidéo du chantier (MP4/WebM ou lien TikTok)
            </label>
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <input
                type="text"
                value={form.videoUrl}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                placeholder="https://.../chantier.mp4 ou lien TikTok..."
                className="flex-1 min-w-[180px] min-h-[42px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploadingVideo}
                className="min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white inline-flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
              >
                {uploadingVideo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{uploadingVideo ? 'Envoi...' : 'Importer vidéo'}</span>
              </button>
              {form.videoUrl && (
                <button
                  type="button"
                  onClick={() => onChange({ ...form, videoUrl: '', videoType: 'html5' })}
                  className="min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 inline-flex items-center gap-1 cursor-pointer shrink-0"
                  title="Retirer la vidéo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm"
              onChange={handleVideoFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Right: Video Preview */}
        <div className="lg:col-span-5">
          <div className="p-4 rounded-2xl bg-slate-950 text-white border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-white/70">
              <span className="font-bold uppercase tracking-wider">Aperçu Vidéo Chantier</span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 font-mono">
                {form.videoUrl ? (form.videoType === 'tiktok' ? 'TikTok' : 'MP4 / Boucle') : 'Mode Maquette'}
              </span>
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center">
              {form.videoUrl ? (
                form.videoType === 'tiktok' || form.videoUrl.includes('tiktok.com') ? (
                  <div className="p-4 text-center space-y-1.5">
                    <Video className="w-7 h-7 text-amber-400 mx-auto" />
                    <p className="text-xs font-bold">Vidéo TikTok associée</p>
                    <p className="text-[10px] text-white/50 truncate max-w-[240px] mx-auto">
                      {form.videoUrl}
                    </p>
                  </div>
                ) : (
                  <video
                    src={form.videoUrl}
                    muted
                    autoPlay
                    loop
                    playsInline
                    controls
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="p-6 text-center space-y-1.5 text-white/60">
                  <Building2 className="w-8 h-8 mx-auto text-emerald-400/80" />
                  <p className="text-xs font-semibold text-white">Aucune vidéo importée</p>
                  <p className="text-[11px]">
                    L’animation architecturale du futur showroom est affichée par défaut.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
