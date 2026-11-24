import React, { useState, useEffect, useCallback } from 'react';
import { Product } from '../../types';
import { StoreOrder } from '../../data/orders';
import {
  AnalyticsPeriod,
  AnalyticsSummary,
  clearAllAnalyticsData,
  exportAnalyticsReportPng,
  fetchAnalyticsSummary,
  subscribeAdminLivePresence
} from '../../services/analyticsService';
import { WhatsAppLogo } from '../BrandIcons';
import {
  Users,
  Activity,
  MousePointerClick,
  ShoppingBag,
  RefreshCw,
  Camera,
  Smartphone,
  Tablet,
  Monitor,
  Trash2,
  Eye,
  Clock,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';

interface AdminAnalyticsPanelProps {
  products: Product[];
  orders: StoreOrder[];
  onNotify: (msg: string) => void;
}

const PERIOD_OPTIONS: { id: AnalyticsPeriod; label: string }[] = [
  { id: 'today', label: "Aujourd'hui" },
  { id: '7d', label: '7 derniers jours' },
  { id: '30d', label: '30 derniers jours' },
  { id: 'all', label: 'Tout' }
];

function formatRelativeTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return '—';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return "À l'instant";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderDeviceIcon(deviceType: string) {
  const lower = deviceType.toLowerCase();
  if (lower.includes('tablette')) return <Tablet className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  if (lower.includes('ordinateur')) return <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  return <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
}

export const AdminAnalyticsPanel: React.FC<AdminAnalyticsPanelProps> = ({
  products,
  orders,
  onNotify
}) => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [livePresenceCount, setLivePresenceCount] = useState<number>(0);
  const [hoveredBucketKey, setHoveredBucketKey] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAnalyticsSummary(period, products, orders, livePresenceCount);
      setSummary(res);
    } finally {
      setLoading(false);
    }
  }, [period, products, orders, livePresenceCount]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  // Listen to real-time Supabase presence + local storage updates
  useEffect(() => {
    const unsubPresence = subscribeAdminLivePresence((count) => {
      setLivePresenceCount(count);
    });
    const handleLocalUpdate = () => {
      void loadSummary();
    };
    window.addEventListener('omr_analytics_updated', handleLocalUpdate);

    // Periodic refresh every 30s while on Analytics tab
    const timer = window.setInterval(() => {
      void loadSummary();
    }, 30_000);

    return () => {
      unsubPresence();
      window.removeEventListener('omr_analytics_updated', handleLocalUpdate);
      window.clearInterval(timer);
    };
  }, [loadSummary]);

  const handleCaptureReportPng = () => {
    if (!summary) return;
    const ok = exportAnalyticsReportPng(summary);
    if (ok) {
      onNotify('Capture PNG du rapport analytique téléchargée !');
    } else {
      onNotify('Impossible de générer la capture PNG sur ce navigateur.');
    }
  };

  const handleResetHistory = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    await clearAllAnalyticsData();
    setConfirmReset(false);
    await loadSummary();
    onNotify('Historique des statistiques réinitialisé.');
  };

  const chartSeries = summary?.chartSeries || [];
  const maxChartY = Math.max(
    1,
    ...chartSeries.map((pt) => Math.max(pt.visitors, pt.productClicks, pt.whatsappAndCart))
  );
  const hoveredPoint =
    chartSeries.find((c) => c.key === hoveredBucketKey) ||
    (chartSeries.length > 0 ? chartSeries[chartSeries.length - 1] : null);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white font-['Outfit']">
            Audience & Activité de la Boutique
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi temps réel des visites, clics produits, paniers et contacts WhatsApp ({summary?.sourceMode === 'cloud+local' ? 'Synchronisé Cloud' : 'Mode local actif'}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Switcher */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  period === opt.id
                    ? 'bg-white dark:bg-slate-950 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void loadSummary()}
            disabled={loading}
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={handleCaptureReportPng}
            disabled={!summary}
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Capture PNG</span>
          </button>

          <button
            type="button"
            onClick={() => void handleResetHistory()}
            onBlur={() => setConfirmReset(false)}
            className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              confirmReset
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmReset ? 'Confirmer RAZ' : 'Réinitialiser'}</span>
          </button>
        </div>
      </div>

      {/* KPI Strip — 5 single-level bordered cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Passages sur le site</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-slate-950 dark:text-white tabular-nums">
            {(summary?.uniqueVisitors ?? 0).toLocaleString('fr-FR')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {(summary?.totalPageViews ?? 0).toLocaleString('fr-FR')} visite(s) · {(summary?.totalSessionsPassed ?? 0).toLocaleString('fr-FR')} session(s)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Personnes actives</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-emerald-600 dark:text-emerald-400 tabular-nums">
            {(summary?.activeVisitorsNow ?? 0).toLocaleString('fr-FR')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            En ligne ces 3 dernières min
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Clics sur produits</span>
            <MousePointerClick className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-slate-950 dark:text-white tabular-nums">
            {(summary?.productClickVisitors ?? 0).toLocaleString('fr-FR')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {(summary?.totalProductClicks ?? 0).toLocaleString('fr-FR')} ouverture(s) de fiche
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Ajouts au panier</span>
            <ShoppingBag className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-slate-950 dark:text-white tabular-nums">
            {(summary?.addToCartVisitors ?? 0).toLocaleString('fr-FR')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {(summary?.addToCartCount ?? 0).toLocaleString('fr-FR')} article(s) ajouté(s)
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>WhatsApp & Commandes</span>
            <WhatsAppLogo className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-slate-950 dark:text-white tabular-nums">
            {((summary?.whatsappClickCount ?? 0) + (summary?.whatsappOrderCount ?? 0)).toLocaleString('fr-FR')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {(summary?.whatsappOrderCount ?? 0).toLocaleString('fr-FR')} commande(s) · {(summary?.whatsappClickCount ?? 0).toLocaleString('fr-FR')} contact(s)
          </div>
        </div>
      </div>

      {/* Visitor Chart + Top Consulted Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Diagramme du nombre de visiteurs */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white font-['Outfit'] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Diagramme du nombre de visiteurs</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Visiteurs uniques vs clics fiches produits et intentions WhatsApp / Panier.
              </p>
            </div>

            {hoveredPoint && (
              <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px] tabular-nums">
                <span className="font-bold text-slate-900 dark:text-white mr-2">{hoveredPoint.label} :</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold mr-2">
                  {hoveredPoint.visitors} vis.
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold mr-2">
                  {hoveredPoint.productClicks} clics
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  {hoveredPoint.whatsappAndCart} paniers/WA
                </span>
              </div>
            )}
          </div>

          {/* Interactive SVG / CSS Bar Chart */}
          <div className="w-full overflow-x-auto pb-1">
            <div className="min-w-[420px]">
              <div className="relative h-56 flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 border-b border-slate-200 dark:border-slate-800">
                {/* Y-axis faint reference grid lines */}
                <div className="absolute inset-x-0 top-6 bottom-2 pointer-events-none flex flex-col justify-between">
                  {[maxChartY, Math.ceil(maxChartY / 2), 0].map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2 border-t border-dashed border-slate-200/70 dark:border-slate-800/80">
                      <span className="text-[10px] text-slate-400 tabular-nums -mt-4 bg-white dark:bg-slate-900 pr-1">
                        {val}
                      </span>
                    </div>
                  ))}
                </div>

                {chartSeries.map((pt) => {
                  const visitorH = Math.round((pt.visitors / maxChartY) * 100);
                  const clickH = Math.round((pt.productClicks / maxChartY) * 100);
                  const actionH = Math.round((pt.whatsappAndCart / maxChartY) * 100);
                  const isFocused = hoveredBucketKey === pt.key;

                  return (
                    <button
                      key={pt.key}
                      type="button"
                      onMouseEnter={() => setHoveredBucketKey(pt.key)}
                      onFocus={() => setHoveredBucketKey(pt.key)}
                      onClick={() => setHoveredBucketKey(pt.key)}
                      className={`relative z-10 flex-1 h-full flex items-end justify-center gap-[2px] px-0.5 rounded-lg transition-colors cursor-pointer ${
                        isFocused ? 'bg-slate-100/80 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                      title={`${pt.label} — ${pt.visitors} visiteur(s), ${pt.productClicks} clic(s), ${pt.whatsappAndCart} panier/WhatsApp`}
                    >
                      <span
                        className="w-2 sm:w-3 rounded-t bg-emerald-500 transition-all duration-300"
                        style={{ height: `${Math.max(pt.visitors > 0 ? 8 : 3, visitorH)}%` }}
                      />
                      <span
                        className="w-1.5 sm:w-2 rounded-t bg-indigo-500/85 transition-all duration-300"
                        style={{ height: `${Math.max(pt.productClicks > 0 ? 6 : 2, clickH)}%` }}
                      />
                      <span
                        className="w-1.5 sm:w-2 rounded-t bg-amber-500/85 transition-all duration-300"
                        style={{ height: `${Math.max(pt.whatsappAndCart > 0 ? 6 : 2, actionH)}%` }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* X-axis labels */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-2">
                {chartSeries.map((pt, idx) => {
                  const showEvery = chartSeries.length > 16 ? idx % 3 === 0 : chartSeries.length > 10 ? idx % 2 === 0 : true;
                  return (
                    <div
                      key={`x-${pt.key}`}
                      className="flex-1 text-center text-[10px] font-medium text-slate-400 tabular-nums truncate"
                    >
                      {showEvery ? pt.label : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>Visiteurs uniques</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
              <span>Clics sur produits</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span>Ajouts panier & WhatsApp</span>
            </span>
          </div>
        </div>

        {/* Produits les plus consultés */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white font-['Outfit'] flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-500" />
                <span>Produits les plus consultés</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Classement selon les clics, paniers et clics WhatsApp.
              </p>
            </div>
          </div>

          {!summary || summary.topProducts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Aucune consultation produit enregistrée sur cette période.
            </div>
          ) : (
            <div className="space-y-2.5">
              {summary.topProducts.slice(0, 6).map((prod, idx) => (
                <div
                  key={prod.productId}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-xs font-extrabold text-slate-400 tabular-nums shrink-0">
                      #{idx + 1}
                    </span>
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.productName}
                        className="w-10 h-10 rounded-lg object-contain bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 p-1 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-950 dark:text-white truncate">
                        {prod.productName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {prod.category} · {formatRelativeTime(prod.lastViewedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-bold tabular-nums shrink-0">
                    <span className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300" title="Consultations">
                      {prod.views} vues
                    </span>
                    <span className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300" title="Ajouts panier">
                      {prod.cartAdds} pan.
                    </span>
                    <span className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300" title="Clics WhatsApp">
                      {prod.whatsappClicks} WA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Activity Feeds: Panier + WhatsApp / Commandes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Personnes qui ont ajouté dans le panier */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white font-['Outfit'] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>Ajouts au panier ({summary?.recentCartAdditions.length ?? 0})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Visiteurs ayant ajouté un appareil dans leur panier et variante choisie.
              </p>
            </div>
          </div>

          {!summary || summary.recentCartAdditions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Aucun ajout au panier enregistré sur cette période.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto pr-1">
              {summary.recentCartAdditions.map((entry) => (
                <div key={entry.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {entry.productImage ? (
                      <img
                        src={entry.productImage}
                        alt={entry.productName}
                        className="w-10 h-10 rounded-lg object-contain bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 p-1 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-950 dark:text-white truncate">
                        {entry.visitorLabel} · {entry.productName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {entry.variantLabel}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          {renderDeviceIcon(entry.deviceType)}
                          <span>{entry.deviceType} ({entry.viewport})</span>
                        </span>
                        <span>·</span>
                        <span>{formatRelativeTime(entry.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-extrabold text-slate-950 dark:text-white tabular-nums shrink-0">
                    {entry.amount > 0 ? `${entry.amount.toLocaleString('fr-FR')} F` : 'Sur demande'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personnes qui ont commandé et appuyé sur WhatsApp */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white font-['Outfit'] flex items-center gap-2">
                <WhatsAppLogo className="w-4 h-4 text-emerald-500" />
                <span>Commandes & Clics WhatsApp ({summary?.recentWhatsappActions.length ?? 0})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Visiteurs ayant validé une commande ou cliqué sur contacter via WhatsApp.
              </p>
            </div>
          </div>

          {!summary || summary.recentWhatsappActions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Aucune action WhatsApp ou commande enregistrée sur cette période.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto pr-1">
              {summary.recentWhatsappActions.map((act) => (
                <div key={act.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-950 dark:text-white truncate">
                        {act.actorLabel}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          act.actionKind === 'order'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {act.actionKind === 'order' ? 'Commande Panier' : 'Contact WhatsApp'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                      {act.productName} · {act.variantLabel}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{act.deviceType}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(act.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-xs font-extrabold text-slate-950 dark:text-white tabular-nums shrink-0">
                    {act.amount > 0 ? `${act.amount.toLocaleString('fr-FR')} F` : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Aperçu Visuel des Parcours & Captures d'écran (Confidentialité & Sécurité) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white font-['Outfit'] flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <span>Aperçu Visuel des Visiteurs & Captures d'Écran</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Par respect des règles de sécurité et de confidentialité des navigateurs, la capture silencieuse de l’écran d’un client est techniquement impossible. Voici l’aperçu visuel en direct de chaque session (appareil, écran, modèle consulté) ainsi que la capture PNG de votre rapport.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCaptureReportPng}
            disabled={!summary}
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shrink-0 disabled:opacity-40"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Capturer ce rapport en PNG</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 text-[11px] text-emerald-900 dark:text-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Toutes les données collectées restent strictement anonymisées et protégées : aucune donnée personnelle privée n’est espionnée sur l’appareil des visiteurs.
          </span>
        </div>

        {!summary || summary.recentJourneys.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            Aucun parcours visiteur récent à afficher pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.recentJourneys.map((j) => (
              <div
                key={j.sessionId}
                className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3"
              >
                {j.lastProductImage ? (
                  <img
                    src={j.lastProductImage}
                    alt={j.lastProductName || 'Produit consulté'}
                    className="w-12 h-12 rounded-xl object-contain bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 p-1 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center shrink-0">
                    {renderDeviceIcon(j.deviceType)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-950 dark:text-white truncate">
                      {j.visitorLabel}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        j.isActiveNow
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {j.isActiveNow ? 'Actif' : 'Terminé'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-700 dark:text-slate-300 truncate mt-0.5">
                    {j.lastProductName ? `A consulté : ${j.lastProductName}` : `Page : ${j.pagePath}`}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      {renderDeviceIcon(j.deviceType)}
                      <span>{j.deviceType} · {j.viewport}</span>
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(j.lastSeenAt)}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
