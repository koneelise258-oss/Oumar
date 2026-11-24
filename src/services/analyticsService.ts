import { Product } from '../types';
import { StoreOrder } from '../data/orders';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { sanitizeText } from '../utils/security';

export type AnalyticsEventType =
  | 'page_view'
  | 'heartbeat'
  | 'product_click'
  | 'product_view'
  | 'add_to_cart'
  | 'whatsapp_click'
  | 'whatsapp_order';

export type AnalyticsPeriod = 'today' | '7d' | '30d' | 'all';

export interface AnalyticsEventRecord {
  id: string;
  visitorId: string;
  sessionId: string;
  eventType: AnalyticsEventType;
  productId?: string;
  productName?: string;
  productImage?: string;
  variantLabel?: string;
  amount?: number;
  customerLabel?: string;
  deviceType: string;
  viewport: string;
  pagePath: string;
  createdAt: string;
}

export interface AnalyticsTopProduct {
  productId: string;
  productName: string;
  category: string;
  image: string;
  views: number;
  cartAdds: number;
  whatsappClicks: number;
  lastViewedAt: string;
}

export interface AnalyticsChartPoint {
  key: string;
  label: string;
  visitors: number;
  productClicks: number;
  whatsappAndCart: number;
}

export interface AnalyticsCartLogItem {
  id: string;
  visitorLabel: string;
  deviceType: string;
  viewport: string;
  productId?: string;
  productName: string;
  productImage?: string;
  variantLabel: string;
  amount: number;
  createdAt: string;
}

export interface AnalyticsWhatsappLogItem {
  id: string;
  actorLabel: string;
  actionKind: 'order' | 'contact';
  productName: string;
  variantLabel: string;
  amount: number;
  deviceType: string;
  createdAt: string;
}

export interface AnalyticsJourneySnapshot {
  sessionId: string;
  visitorLabel: string;
  deviceType: string;
  viewport: string;
  pagePath: string;
  isActiveNow: boolean;
  lastSeenAt: string;
  actionsCount: number;
  lastProductId?: string;
  lastProductName?: string;
  lastProductImage?: string;
  lastEventType: AnalyticsEventType;
}

export interface AnalyticsSummary {
  period: AnalyticsPeriod;
  periodLabel: string;
  totalPageViews: number;
  uniqueVisitors: number;
  totalSessionsPassed: number;
  activeVisitorsNow: number;
  productClickVisitors: number;
  totalProductClicks: number;
  addToCartCount: number;
  addToCartVisitors: number;
  whatsappClickCount: number;
  whatsappOrderCount: number;
  whatsappUniqueVisitors: number;
  chartSeries: AnalyticsChartPoint[];
  topProducts: AnalyticsTopProduct[];
  recentCartAdditions: AnalyticsCartLogItem[];
  recentWhatsappActions: AnalyticsWhatsappLogItem[];
  recentJourneys: AnalyticsJourneySnapshot[];
  sourceMode: 'cloud+local' | 'local';
}

const ANALYTICS_STORAGE_KEY = 'omr_analytics_events_v1';
const VISITOR_ID_KEY = 'omr_visitor_uid_v1';
const SESSION_ID_KEY = 'omr_session_uid_v1';
const SESSION_PAGEVIEW_FLAG = 'omr_session_pv_logged_v1';
const MAX_LOCAL_EVENTS = 1500;
const ACTIVE_WINDOW_MS = 3 * 60 * 1000; // 3 minutes

let lastHeartbeatAtMs = 0;

function generateSafeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isAdminContextPath(): boolean {
  if (typeof window === 'undefined') return false;
  const p = (window.location.pathname || '').toLowerCase();
  return p.startsWith('/espace-prive') || p.startsWith('/portail-');
}

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'vis-ssr';
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing && existing.length >= 8) return existing;
    const created = generateSafeId('vis');
    localStorage.setItem(VISITOR_ID_KEY, created);
    return created;
  } catch {
    return generateSafeId('vis');
  }
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'ses-ssr';
  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing && existing.length >= 8) return existing;
    const created = generateSafeId('ses');
    sessionStorage.setItem(SESSION_ID_KEY, created);
    return created;
  } catch {
    return generateSafeId('ses');
  }
}

export function formatVisitorAlias(visitorId: string): string {
  const clean = visitorId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const suffix = clean.slice(-4) || '0001';
  return `Visiteur #${suffix}`;
}

export function detectDeviceContext(): { deviceType: string; viewport: string } {
  if (typeof window === 'undefined') {
    return { deviceType: 'Ordinateur', viewport: '1280x800' };
  }
  const w = window.innerWidth || 390;
  const h = window.innerHeight || 844;
  const ua = (navigator.userAgent || '').toLowerCase();

  let deviceType = 'Ordinateur';
  if (/ipad|tablet/.test(ua) || (w >= 640 && w < 1024 && 'ontouchstart' in window)) {
    deviceType = 'Tablette';
  } else if (/iphone|android|mobile|ipod/.test(ua) || w < 640) {
    deviceType = /iphone|ipad/.test(ua) ? 'iPhone / iOS' : 'Mobile';
  }

  return {
    deviceType,
    viewport: `${w}×${h}`
  };
}

function loadLocalEvents(): AnalyticsEventRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (ev) =>
        ev &&
        typeof ev === 'object' &&
        typeof ev.id === 'string' &&
        typeof ev.visitorId === 'string' &&
        typeof ev.eventType === 'string' &&
        typeof ev.createdAt === 'string'
    );
  } catch {
    return [];
  }
}

function saveLocalEvents(events: AnalyticsEventRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = events.slice(-MAX_LOCAL_EVENTS);
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent('omr_analytics_updated'));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export interface TrackEventPayload {
  productId?: string;
  productName?: string;
  productImage?: string;
  variantLabel?: string;
  amount?: number;
  customerLabel?: string;
  forceTrackInAdmin?: boolean;
}

export function trackAnalyticsEvent(
  eventType: AnalyticsEventType,
  payload: TrackEventPayload = {}
): void {
  if (typeof window === 'undefined') return;
  if (!payload.forceTrackInAdmin && isAdminContextPath()) return;

  const nowMs = Date.now();
  if (eventType === 'heartbeat' && nowMs - lastHeartbeatAtMs < 20_000) {
    return;
  }
  if (eventType === 'heartbeat') {
    lastHeartbeatAtMs = nowMs;
  }

  const visitorId = getOrCreateVisitorId();
  const sessionId = getOrCreateSessionId();
  const { deviceType, viewport } = detectDeviceContext();
  const pagePath = sanitizeText(window.location.pathname || '/', 180) || '/';

  const record: AnalyticsEventRecord = {
    id: generateSafeId('evt'),
    visitorId,
    sessionId,
    eventType,
    productId: payload.productId ? sanitizeText(payload.productId, 120) : undefined,
    productName: payload.productName ? sanitizeText(payload.productName, 160) : undefined,
    productImage:
      payload.productImage && !payload.productImage.startsWith('data:')
        ? sanitizeText(payload.productImage, 500)
        : undefined,
    variantLabel: payload.variantLabel ? sanitizeText(payload.variantLabel, 160) : undefined,
    amount:
      typeof payload.amount === 'number' && Number.isFinite(payload.amount) && payload.amount >= 0
        ? Math.round(payload.amount)
        : 0,
    customerLabel: payload.customerLabel ? sanitizeText(payload.customerLabel, 120) : undefined,
    deviceType,
    viewport,
    pagePath,
    createdAt: new Date(nowMs).toISOString()
  };

  // Update local rolling log
  const existing = loadLocalEvents();
  if (eventType === 'heartbeat') {
    // Keep only the latest heartbeat per session locally to keep storage clean
    const filtered = existing.filter(
      (ev) => !(ev.eventType === 'heartbeat' && ev.sessionId === sessionId)
    );
    filtered.push(record);
    saveLocalEvents(filtered);
  } else {
    existing.push(record);
    saveLocalEvents(existing);
  }

  // Non-blocking remote RPC logging on Supabase
  if (isSupabaseConfigured) {
    void Promise.resolve(
      supabase.rpc('log_store_analytics_event', {
        p_visitor_id: record.visitorId,
        p_session_id: record.sessionId,
        p_event_type: record.eventType,
        p_product_id: record.productId ?? null,
        p_product_name: record.productName ?? null,
        p_product_image: record.productImage ?? null,
        p_variant_label: record.variantLabel ?? null,
        p_amount: record.amount ?? 0,
        p_customer_label: record.customerLabel ?? null,
        p_device_type: record.deviceType,
        p_viewport: record.viewport,
        p_page_path: record.pagePath
      })
    ).catch(() => {});
  }
}

/**
 * Starts session page_view tracking, 30s heartbeat, and optional Supabase Realtime Presence
 * Returns a cleanup callback + live count listener.
 */
export function startVisitorPresenceTracking(
  isAdminActive: boolean,
  onPresenceCountChange?: (count: number) => void
): () => void {
  if (typeof window === 'undefined' || isAdminActive || isAdminContextPath()) {
    return () => {};
  }

  const sessionId = getOrCreateSessionId();

  // Log initial page view once per browser tab session
  try {
    if (!sessionStorage.getItem(SESSION_PAGEVIEW_FLAG)) {
      sessionStorage.setItem(SESSION_PAGEVIEW_FLAG, '1');
      trackAnalyticsEvent('page_view');
    } else {
      trackAnalyticsEvent('heartbeat');
    }
  } catch {
    trackAnalyticsEvent('page_view');
  }

  const heartbeatInterval = window.setInterval(() => {
    if (document.visibilityState === 'visible' && !isAdminContextPath()) {
      trackAnalyticsEvent('heartbeat');
    }
  }, 30_000);

  const handleVisibility = () => {
    if (document.visibilityState === 'visible' && !isAdminContextPath()) {
      trackAnalyticsEvent('heartbeat');
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);

  let presenceChannel: ReturnType<typeof supabase.channel> | null = null;
  if (isSupabaseConfigured) {
    try {
      presenceChannel = supabase.channel('omr-live-presence', {
        config: { presence: { key: sessionId } }
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          if (!presenceChannel) return;
          const state = presenceChannel.presenceState();
          const count = Object.keys(state).length;
          onPresenceCountChange?.(count);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && presenceChannel) {
            await presenceChannel.track({
              sessionId,
              onlineAt: new Date().toISOString()
            });
          }
        });
    } catch {
      presenceChannel = null;
    }
  }

  return () => {
    window.clearInterval(heartbeatInterval);
    document.removeEventListener('visibilitychange', handleVisibility);
    if (presenceChannel) {
      try {
        supabase.removeChannel(presenceChannel);
      } catch {
        // Ignore cleanup errors
      }
    }
  };
}

/**
 * Allows the Admin Dashboard to observe live visitor presence without registering as a shopper.
 */
export function subscribeAdminLivePresence(
  onPresenceCountChange: (count: number) => void
): () => void {
  if (typeof window === 'undefined' || !isSupabaseConfigured) {
    return () => {};
  }

  let channel: ReturnType<typeof supabase.channel> | null = null;
  try {
    channel = supabase.channel('omr-live-presence');
    channel
      .on('presence', { event: 'sync' }, () => {
        if (!channel) return;
        const state = channel.presenceState();
        onPresenceCountChange(Object.keys(state).length);
      })
      .subscribe();
  } catch {
    channel = null;
  }

  return () => {
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch {
        // Ignore cleanup errors
      }
    }
  };
}

async function fetchRemoteAnalyticsEvents(sinceIso?: string): Promise<{
  events: AnalyticsEventRecord[];
  remoteAvailable: boolean;
}> {
  if (!isSupabaseConfigured) {
    return { events: [], remoteAvailable: false };
  }

  try {
    let query = supabase
      .from('store_analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2000);

    if (sinceIso) {
      query = query.gte('created_at', sinceIso);
    }

    const { data, error } = await query;
    if (error || !Array.isArray(data)) {
      return { events: [], remoteAvailable: false };
    }

    const mapped: AnalyticsEventRecord[] = data.map((row: any) => ({
      id: String(row.id),
      visitorId: String(row.visitor_id || ''),
      sessionId: String(row.session_id || ''),
      eventType: row.event_type as AnalyticsEventType,
      productId: row.product_id || undefined,
      productName: row.product_name || undefined,
      productImage: row.product_image || undefined,
      variantLabel: row.variant_label || undefined,
      amount: typeof row.amount === 'number' ? row.amount : Number(row.amount) || 0,
      customerLabel: row.customer_label || undefined,
      deviceType: row.device_type || 'Mobile',
      viewport: row.viewport || '390×844',
      pagePath: row.page_path || '/',
      createdAt: row.created_at
    }));

    return { events: mapped, remoteAvailable: true };
  } catch {
    return { events: [], remoteAvailable: false };
  }
}

function getPeriodCutoffDate(period: AnalyticsPeriod): Date | null {
  const now = new Date();
  if (period === 'today') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === '7d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === '30d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
}

function getPeriodLabel(period: AnalyticsPeriod): string {
  switch (period) {
    case 'today':
      return "Aujourd'hui";
    case '7d':
      return '7 derniers jours';
    case '30d':
      return '30 derniers jours';
    default:
      return 'Historique complet';
  }
}

function buildChartSeries(
  period: AnalyticsPeriod,
  events: AnalyticsEventRecord[]
): AnalyticsChartPoint[] {
  const buckets = new Map<
    string,
    { label: string; visitors: Set<string>; productClicks: number; whatsappAndCart: number }
  >();

  const now = new Date();

  if (period === 'today') {
    // Hourly buckets from 00h to current hour (or 23h in 2h steps for readability -> 12 buckets or 24h)
    for (let h = 0; h <= 23; h++) {
      const key = String(h).padStart(2, '0');
      buckets.set(key, {
        label: `${key}h`,
        visitors: new Set(),
        productClicks: 0,
        whatsappAndCart: 0
      });
    }
    for (const ev of events) {
      const d = new Date(ev.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = String(d.getHours()).padStart(2, '0');
      const b = buckets.get(key);
      if (!b) continue;
      b.visitors.add(ev.visitorId);
      if (ev.eventType === 'product_click' || ev.eventType === 'product_view') {
        b.productClicks += 1;
      } else if (
        ev.eventType === 'add_to_cart' ||
        ev.eventType === 'whatsapp_click' ||
        ev.eventType === 'whatsapp_order'
      ) {
        b.whatsappAndCart += 1;
      }
    }
  } else {
    const daysCount = period === '7d' ? 7 : period === '30d' ? 30 : 14;
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: daysCount > 10 ? '2-digit' : 'short'
      });
      buckets.set(isoDay, {
        label,
        visitors: new Set(),
        productClicks: 0,
        whatsappAndCart: 0
      });
    }

    for (const ev of events) {
      const d = new Date(ev.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const isoDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      let b = buckets.get(isoDay);
      if (!b && period === 'all') {
        const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        b = { label, visitors: new Set(), productClicks: 0, whatsappAndCart: 0 };
        buckets.set(isoDay, b);
      }
      if (!b) continue;
      b.visitors.add(ev.visitorId);
      if (ev.eventType === 'product_click' || ev.eventType === 'product_view') {
        b.productClicks += 1;
      } else if (
        ev.eventType === 'add_to_cart' ||
        ev.eventType === 'whatsapp_click' ||
        ev.eventType === 'whatsapp_order'
      ) {
        b.whatsappAndCart += 1;
      }
    }
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, b]) => ({
      key,
      label: b.label,
      visitors: b.visitors.size,
      productClicks: b.productClicks,
      whatsappAndCart: b.whatsappAndCart
    }));
}

export async function fetchAnalyticsSummary(
  period: AnalyticsPeriod,
  products: Product[],
  orders: StoreOrder[],
  livePresenceCount?: number
): Promise<AnalyticsSummary> {
  const cutoff = getPeriodCutoffDate(period);
  const cutoffMs = cutoff ? cutoff.getTime() : 0;

  const localEvents = loadLocalEvents();
  const remoteResult = await fetchRemoteAnalyticsEvents();

  // Merge remote + local without double-counting exact events (prefer remote when available, supplement recent unpushed local events)
  const mergedMap = new Map<string, AnalyticsEventRecord>();
  for (const ev of remoteResult.events) {
    mergedMap.set(ev.id, ev);
  }
  for (const ev of localEvents) {
    const dedupKey = `${ev.sessionId}-${ev.eventType}-${ev.productId || ''}-${ev.createdAt.slice(0, 17)}`;
    if (!mergedMap.has(ev.id)) {
      const alreadyRemote = remoteResult.events.some(
        (r) => `${r.sessionId}-${r.eventType}-${r.productId || ''}-${r.createdAt.slice(0, 17)}` === dedupKey
      );
      if (!alreadyRemote) {
        mergedMap.set(ev.id, ev);
      }
    }
  }

  const allEvents = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Active visitors right now (last 3 minutes across all events + Supabase Realtime Presence)
  const nowMs = Date.now();
  const activeSessionsSet = new Set<string>();
  for (const ev of allEvents) {
    const ts = new Date(ev.createdAt).getTime();
    if (nowMs - ts <= ACTIVE_WINDOW_MS) {
      activeSessionsSet.add(ev.sessionId);
    }
  }
  const activeVisitorsNow = Math.max(activeSessionsSet.size, livePresenceCount || 0);

  // Filter events by chosen period
  const events = cutoffMs > 0
    ? allEvents.filter((ev) => new Date(ev.createdAt).getTime() >= cutoffMs)
    : allEvents;

  const filteredOrders = cutoffMs > 0
    ? orders.filter((o) => new Date(o.createdAt).getTime() >= cutoffMs)
    : orders;

  const uniqueVisitorsSet = new Set<string>();
  const uniqueSessionsSet = new Set<string>();
  const productClickVisitorsSet = new Set<string>();
  const cartVisitorsSet = new Set<string>();
  const whatsappVisitorsSet = new Set<string>();

  let totalPageViews = 0;
  let totalProductClicks = 0;
  let addToCartCount = 0;
  let whatsappClickCount = 0;
  let whatsappOrderCount = 0;

  const productStatsMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      category: string;
      image: string;
      views: number;
      cartAdds: number;
      whatsappClicks: number;
      lastViewedAt: string;
    }
  >();

  const ensureProductBucket = (
    prodId: string | undefined,
    prodName: string | undefined,
    prodImg: string | undefined,
    createdAt: string
  ) => {
    const catalogMatch = products.find(
      (p) =>
        (prodId && p.id === prodId) ||
        (prodName && p.name.toLowerCase() === prodName.toLowerCase())
    );
    const key = catalogMatch?.id || prodId || prodName || 'general';
    const existing = productStatsMap.get(key);
    if (existing) {
      if (new Date(createdAt).getTime() > new Date(existing.lastViewedAt).getTime()) {
        existing.lastViewedAt = createdAt;
      }
      return existing;
    }
    const created = {
      productId: key,
      productName: catalogMatch?.name || prodName || 'Produit Apple',
      category: catalogMatch?.category || 'Apple',
      image: catalogMatch?.image || prodImg || '',
      views: 0,
      cartAdds: 0,
      whatsappClicks: 0,
      lastViewedAt: createdAt
    };
    productStatsMap.set(key, created);
    return created;
  };

  const recentCartAdditions: AnalyticsCartLogItem[] = [];
  const recentWhatsappActions: AnalyticsWhatsappLogItem[] = [];
  const sessionsMap = new Map<string, AnalyticsJourneySnapshot>();

  for (const ev of events) {
    uniqueVisitorsSet.add(ev.visitorId);
    uniqueSessionsSet.add(ev.sessionId);

    const catalogMatch = ev.productId
      ? products.find((p) => p.id === ev.productId)
      : ev.productName
      ? products.find((p) => p.name.toLowerCase() === ev.productName?.toLowerCase())
      : undefined;

    // Session journey snapshots
    const existingSess = sessionsMap.get(ev.sessionId);
    const isActiveNow = nowMs - new Date(ev.createdAt).getTime() <= ACTIVE_WINDOW_MS;
    if (!existingSess) {
      sessionsMap.set(ev.sessionId, {
        sessionId: ev.sessionId,
        visitorLabel: ev.customerLabel || formatVisitorAlias(ev.visitorId),
        deviceType: ev.deviceType || 'Mobile',
        viewport: ev.viewport || '390×844',
        pagePath: ev.pagePath || '/',
        isActiveNow,
        lastSeenAt: ev.createdAt,
        actionsCount: 1,
        lastProductId: catalogMatch?.id || ev.productId,
        lastProductName: catalogMatch?.name || ev.productName,
        lastProductImage: catalogMatch?.image || ev.productImage,
        lastEventType: ev.eventType
      });
    } else {
      existingSess.actionsCount += 1;
      if (ev.customerLabel && existingSess.visitorLabel.startsWith('Visiteur #')) {
        existingSess.visitorLabel = ev.customerLabel;
      }
      if (!existingSess.lastProductName && (catalogMatch?.name || ev.productName)) {
        existingSess.lastProductId = catalogMatch?.id || ev.productId;
        existingSess.lastProductName = catalogMatch?.name || ev.productName;
        existingSess.lastProductImage = catalogMatch?.image || ev.productImage;
      }
    }

    if (ev.eventType === 'page_view') {
      totalPageViews += 1;
    } else if (ev.eventType === 'product_click' || ev.eventType === 'product_view') {
      totalProductClicks += 1;
      productClickVisitorsSet.add(ev.visitorId);
      if (ev.productId || ev.productName) {
        const b = ensureProductBucket(ev.productId, ev.productName, ev.productImage, ev.createdAt);
        b.views += 1;
      }
    } else if (ev.eventType === 'add_to_cart') {
      addToCartCount += 1;
      cartVisitorsSet.add(ev.visitorId);
      if (ev.productId || ev.productName) {
        const b = ensureProductBucket(ev.productId, ev.productName, ev.productImage, ev.createdAt);
        b.cartAdds += 1;
      }
      recentCartAdditions.push({
        id: ev.id,
        visitorLabel: ev.customerLabel || formatVisitorAlias(ev.visitorId),
        deviceType: ev.deviceType || 'Mobile',
        viewport: ev.viewport || '390×844',
        productId: catalogMatch?.id || ev.productId,
        productName: catalogMatch?.name || ev.productName || 'Produit Apple',
        productImage: catalogMatch?.image || ev.productImage,
        variantLabel: ev.variantLabel || 'Configuration standard',
        amount: ev.amount || 0,
        createdAt: ev.createdAt
      });
    } else if (ev.eventType === 'whatsapp_click' || ev.eventType === 'whatsapp_order') {
      whatsappVisitorsSet.add(ev.visitorId);
      if (ev.eventType === 'whatsapp_order') {
        whatsappOrderCount += 1;
      } else {
        whatsappClickCount += 1;
      }

      if (ev.productId || ev.productName) {
        const b = ensureProductBucket(ev.productId, ev.productName, ev.productImage, ev.createdAt);
        b.whatsappClicks += 1;
      }

      recentWhatsappActions.push({
        id: ev.id,
        actorLabel: ev.customerLabel || formatVisitorAlias(ev.visitorId),
        actionKind: ev.eventType === 'whatsapp_order' ? 'order' : 'contact',
        productName: catalogMatch?.name || ev.productName || 'Renseignement Boutique',
        variantLabel: ev.variantLabel || 'Contact direct WhatsApp',
        amount: ev.amount || 0,
        deviceType: ev.deviceType || 'Mobile',
        createdAt: ev.createdAt
      });
    }
  }

  // Include persisted StoreOrders that might predate analytics events
  for (const ord of filteredOrders) {
    const alreadyLogged = recentWhatsappActions.some(
      (a) =>
        a.actionKind === 'order' &&
        a.actorLabel.toLowerCase() === (ord.customerName || '').toLowerCase() &&
        Math.abs(new Date(a.createdAt).getTime() - new Date(ord.createdAt).getTime()) < 60_000
    );
    if (!alreadyLogged) {
      whatsappOrderCount += 1;
      const firstItem = ord.items?.[0];
      recentWhatsappActions.push({
        id: `ord-${ord.id}`,
        actorLabel: ord.customerName || `Client ${ord.orderNumber}`,
        actionKind: 'order',
        productName:
          ord.items && ord.items.length > 1
            ? `${firstItem?.productName || 'iPhone'} (+${ord.items.length - 1})`
            : firstItem?.productName || `Commande ${ord.orderNumber}`,
        variantLabel: [firstItem?.chosenStorage, firstItem?.chosenColor].filter(Boolean).join(' · ') || ord.orderNumber,
        amount: ord.total || 0,
        deviceType: 'Boutique',
        createdAt:
          typeof ord.createdAt === 'number'
            ? new Date(ord.createdAt).toISOString()
            : String(ord.createdAt || new Date().toISOString())
      });
    }
  }

  recentWhatsappActions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const topProducts = Array.from(productStatsMap.values())
    .sort((a, b) => {
      const scoreA = a.views * 2 + a.cartAdds * 3 + a.whatsappClicks * 4;
      const scoreB = b.views * 2 + b.cartAdds * 3 + b.whatsappClicks * 4;
      return scoreB - scoreA;
    })
    .slice(0, 10);

  const recentJourneys = Array.from(sessionsMap.values())
    .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime())
    .slice(0, 12);

  return {
    period,
    periodLabel: getPeriodLabel(period),
    totalPageViews: Math.max(totalPageViews, uniqueSessionsSet.size),
    uniqueVisitors: uniqueVisitorsSet.size,
    totalSessionsPassed: uniqueSessionsSet.size,
    activeVisitorsNow,
    productClickVisitors: productClickVisitorsSet.size,
    totalProductClicks,
    addToCartCount,
    addToCartVisitors: cartVisitorsSet.size,
    whatsappClickCount,
    whatsappOrderCount,
    whatsappUniqueVisitors: Math.max(whatsappVisitorsSet.size, filteredOrders.length > 0 ? 1 : 0),
    chartSeries: buildChartSeries(period, events),
    topProducts,
    recentCartAdditions: recentCartAdditions.slice(0, 25),
    recentWhatsappActions: recentWhatsappActions.slice(0, 25),
    recentJourneys,
    sourceMode: remoteResult.remoteAvailable ? 'cloud+local' : 'local'
  };
}

export async function clearAllAnalyticsData(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(ANALYTICS_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('omr_analytics_updated'));
    } catch {
      // Ignore
    }
  }
  if (isSupabaseConfigured) {
    try {
      await supabase.from('store_analytics_events').delete().neq('event_type', '_never_');
    } catch {
      // Ignore RLS/network errors silently
    }
  }
}

/**
 * Generates a crisp downloadable PNG report screenshot via HTML5 Canvas
 * so the store owner gets an authentic instant capture of dashboard metrics.
 */
export function exportAnalyticsReportPng(summary: AnalyticsSummary): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const width = 1200;
    const height = 740;
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    ctx.scale(2, 2);

    // Background
    ctx.fillStyle = '#0b0f17';
    ctx.fillRect(0, 0, width, height);

    // Top header bar
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.fillText('OUMAR IPHONE — Capture Rapport Analytique', 44, 58);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 14px system-ui, -apple-system, sans-serif';
    const dateStamp = new Date().toLocaleString('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    ctx.fillText(`Période : ${summary.periodLabel} · Généré le ${dateStamp}`, 44, 84);

    // KPI Cards Row
    const kpis = [
      { label: 'Visiteurs passés', value: summary.uniqueVisitors.toLocaleString('fr-FR'), sub: `${summary.totalPageViews} visites` },
      { label: 'Actifs en direct', value: summary.activeVisitorsNow.toLocaleString('fr-FR'), sub: 'En ligne (3 min)' },
      { label: 'Clics produits', value: summary.totalProductClicks.toLocaleString('fr-FR'), sub: `${summary.productClickVisitors} visiteurs` },
      { label: 'Ajouts au panier', value: summary.addToCartCount.toLocaleString('fr-FR'), sub: `${summary.addToCartVisitors} acheteurs` },
      { label: 'WhatsApp & Commandes', value: (summary.whatsappClickCount + summary.whatsappOrderCount).toLocaleString('fr-FR'), sub: `${summary.whatsappOrderCount} commandes` }
    ];

    const cardW = 210;
    const gap = 16;
    kpis.forEach((k, idx) => {
      const x = 44 + idx * (cardW + gap);
      const y = 114;
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, 108, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 12px system-ui, -apple-system, sans-serif';
      ctx.fillText(k.label, x + 16, y + 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
      ctx.fillText(k.value, x + 16, y + 68);

      ctx.fillStyle = '#10b981';
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(k.sub, x + 16, y + 92);
    });

    // Visitor Diagram Panel
    const chartX = 44;
    const chartY = 246;
    const chartW = 700;
    const chartH = 446;
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(chartX, chartY, chartW, chartH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText('Diagramme du nombre de visiteurs', chartX + 24, chartY + 34);

    const series = summary.chartSeries.slice(-14);
    const maxVal = Math.max(1, ...series.map((s) => Math.max(s.visitors, s.productClicks)));
    const plotX = chartX + 36;
    const plotY = chartY + 72;
    const plotW = chartW - 64;
    const plotH = chartH - 120;

    // Horizontal grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const gy = plotY + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(plotX, gy);
      ctx.lineTo(plotX + plotW, gy);
      ctx.stroke();
    }

    if (series.length > 0) {
      const slotW = plotW / series.length;
      const barW = Math.min(28, Math.max(8, slotW * 0.52));
      series.forEach((pt, idx) => {
        const bx = plotX + idx * slotW + (slotW - barW) / 2;
        const barH = Math.max(4, (pt.visitors / maxVal) * plotH);
        const by = plotY + plotH - barH;

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(bx, by, barW, barH, 6);
        ctx.fill();

        if (series.length <= 14 || idx % 2 === 0) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '500 10px system-ui, -apple-system, sans-serif';
          ctx.fillText(pt.label, bx - 4, plotY + plotH + 20);
        }
      });
    }

    // Top Consulted Products Panel
    const topX = 764;
    const topY = 246;
    const topW = 392;
    const topH = 446;
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(topX, topY, topW, topH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText('Produits les plus consultés', topX + 24, topY + 34);

    if (summary.topProducts.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '500 13px system-ui, -apple-system, sans-serif';
      ctx.fillText('Aucune consultation enregistrée sur la période.', topX + 24, topY + 86);
    } else {
      summary.topProducts.slice(0, 6).forEach((prod, idx) => {
        const ry = topY + 66 + idx * 60;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(topX + 20, ry, topW - 40, 50, 10);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${idx + 1}. ${prod.productName.slice(0, 28)}`, topX + 34, ry + 22);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 11px system-ui, -apple-system, sans-serif';
        ctx.fillText(
          `${prod.views} vues · ${prod.cartAdds} panier · ${prod.whatsappClicks} WhatsApp`,
          topX + 34,
          ry + 40
        );
      });
    }

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `oumar-iphone-analytics-${summary.period}-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch {
    return false;
  }
}
