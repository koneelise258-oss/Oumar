/**
 * Module central de cybersécurité — OUMAR IPHONE
 * - Accès furtif au portail de direction (anti-découverte visiteurs & bots)
 * - Protection anti-brute force avec verrouillage exponentiel
 * - Validation stricte d'URLs (anti-XSS, anti-javascript:, anti-open redirect)
 * - Validation binaire (magic bytes) des fichiers uploadés (anti-SVG XSS, anti-polyglot)
 * - Nettoyage des entrées utilisateur (anti-BiDi spoofing, caractères de contrôle)
 */

// ==============================================================================
// 1. PORTAIL ADMIN FURTIF (STEALTH ACCESS — SANS VARIABLE D'ENVIRONNEMENT)
// ==============================================================================
// Code secret intégré par défaut (fonctionne immédiatement sans aucun fichier .env)
export const BUILTIN_PORTAL_KEY = 'omr-dir-7x9k4p';

const CUSTOM_PORTAL_HASH_STORAGE_KEY = 'omr_portal_hash_v1';
const SESSION_PORTAL_KEY_CACHE = 'omr_portal_active_key_session';
const PORTAL_HASH_SALT = 'omr_iphone_abidjan_portal_salt_v1::';

// Chemins classiques ciblés par les bots / scanners — renvoient strictement la page 404 personnalisée (zéro fuite d'information)
const DECOY_ADMIN_PATHS = new Set([
  '/admin',
  '/admin/',
  '/administrator',
  '/wp-admin',
  '/wp-login.php',
  '/login',
  '/signin',
  '/dashboard',
  '/panel',
  '/backoffice',
  '/cms',
  '/manage',
  '/gestion',
  '/console',
  '/staff',
  '/portail',
  '/portail/'
]);

const DECOY_ADMIN_HASHES = new Set([
  'admin',
  'login',
  'dashboard',
  'panel',
  'backoffice',
  'gestion'
]);

/**
 * Chemin masqué neutre affiché dans la barre d'adresse uniquement pendant une session admin active.
 * Si un visiteur tente d'ouvrir cette URL directement sans session admin JWT vérifiée, il reçoit la page 404.
 */
export const MASKED_ADMIN_PATH = '/espace-prive';

/**
 * Empreinte SHA-256 salée (Web Crypto API) pour vérifier un code secret personnalisé sans jamais stocker le code en clair dans localStorage.
 */
async function hashPortalSecret(key: string): Promise<string> {
  const payload = `${PORTAL_HASH_SALT}${key}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(payload);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback déterministe si Web Crypto indisponible dans un contexte non-HTTPS local
  let h1 = 0xdeadbeef ^ payload.length;
  let h2 = 0x41c6ce57 ^ payload.length;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

export function getStoredCustomPortalHash(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(CUSTOM_PORTAL_HASH_STORAGE_KEY)?.trim();
    return val && val.length >= 16 ? val : null;
  } catch {
    return null;
  }
}

export function hasCustomAdminPortalKey(): boolean {
  return Boolean(getStoredCustomPortalHash());
}

/**
 * Nettoie et valide un code d'accès secret (lettres, chiffres, tirets, 8 à 48 caractères).
 */
export function normalizePortalKeyInput(raw: string): string {
  return (raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/**
 * Génère un code secret aléatoire cryptographiquement sûr (ex: omr-7k4p-9x2m).
 */
export function generateRandomPortalKey(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += alphabet[bytes[i] % alphabet.length];
    part2 += alphabet[bytes[i + 4] % alphabet.length];
  }
  return `omr-${part1}-${part2}`;
}

/**
 * Enregistre un code secret personnalisé directement depuis le tableau de bord (stockage par empreinte SHA-256 uniquement).
 */
export async function setCustomAdminPortalKey(rawKey: string): Promise<{
  success: boolean;
  cleanKey?: string;
  error?: string;
}> {
  const cleanKey = normalizePortalKeyInput(rawKey);
  if (cleanKey.length < 8) {
    return {
      success: false,
      error: 'Le code secret doit contenir au moins 8 caractères (lettres, chiffres ou tirets).'
    };
  }
  const forbidden = new Set(['admin', 'administrator', 'login', 'dashboard', 'password', 'oumariphone']);
  if (forbidden.has(cleanKey)) {
    return {
      success: false,
      error: 'Ce code est trop prévisible. Utilisez une combinaison aléatoire.'
    };
  }

  try {
    const hashed = await hashPortalSecret(cleanKey);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CUSTOM_PORTAL_HASH_STORAGE_KEY, hashed);
      sessionStorage.setItem(SESSION_PORTAL_KEY_CACHE, cleanKey);
    }
    return { success: true, cleanKey };
  } catch {
    return { success: false, error: 'Impossible d’enregistrer le code sur cet appareil.' };
  }
}

/**
 * Rétablit le code secret intégré par défaut (omr-dir-7x9k4p).
 */
export function resetCustomAdminPortalKey(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CUSTOM_PORTAL_HASH_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_PORTAL_KEY_CACHE);
  } catch {
    // Ignore storage error
  }
}

/**
 * Retourne le code secret actuellement connu pour générer le lien de copie en session admin.
 */
export function getActivePortalKeyForCopy(overrideKey?: string): string | null {
  if (overrideKey) {
    const clean = normalizePortalKeyInput(overrideKey);
    if (clean.length >= 6) return clean;
  }
  if (typeof window !== 'undefined') {
    try {
      const cached = sessionStorage.getItem(SESSION_PORTAL_KEY_CACHE)?.trim();
      if (cached && cached.length >= 6) return cached;
    } catch {
      // Ignore
    }
  }
  return hasCustomAdminPortalKey() ? null : BUILTIN_PORTAL_KEY;
}

/**
 * Chemin d'entrée secret dédié (ex: /portail-omr-dir-7x9k4p).
 */
export function getSecretPortalPath(overrideKey?: string): string {
  const key = getActivePortalKeyForCopy(overrideKey) || BUILTIN_PORTAL_KEY;
  return `/portail-${key}`;
}

export function isDecoyAdminLocation(pathname: string, hash: string): boolean {
  const cleanPath = (pathname || '').toLowerCase().replace(/\/+$/, '') || '/';
  const cleanHash = (hash || '').replace(/^#\/?/, '').toLowerCase().trim();
  return (
    DECOY_ADMIN_PATHS.has(cleanPath) ||
    cleanPath.startsWith('/admin/') ||
    DECOY_ADMIN_HASHES.has(cleanHash)
  );
}

/**
 * Extrait un éventuel candidat de clé depuis /portail-<clé>, ?portail=<clé> ou #<clé>.
 */
function extractPortalCandidate(search: string, hash: string, pathname = ''): string | null {
  const cleanPath = (pathname || '').replace(/\/+$/, '');
  if (cleanPath.toLowerCase().startsWith('/portail-')) {
    const candidate = cleanPath.slice('/portail-'.length).trim();
    if (candidate) return candidate;
  }

  try {
    const params = new URLSearchParams(search || '');
    const queryKey = params.get('portail')?.trim();
    if (queryKey) return queryKey;
  } catch {
    // Ignore malformed query string
  }

  const cleanHash = (hash || '').replace(/^#\/?/, '').trim();
  if (cleanHash && cleanHash.length >= 6 && !cleanHash.includes('/')) {
    return cleanHash;
  }

  return null;
}

/**
 * Vérification synchrone (code intégré par défaut).
 */
export function isSecretAdminLocation(search: string, hash: string, pathname = ''): boolean {
  if (hasCustomAdminPortalKey()) return false;
  const candidate = extractPortalCandidate(search, hash, pathname);
  if (!candidate) return false;
  return constantTimeEqual(candidate, BUILTIN_PORTAL_KEY);
}

/**
 * Vérification complète (code personnalisé SHA-256 si configuré, sinon code intégré par défaut).
 */
export async function verifySecretAdminLocation(
  search: string,
  hash: string,
  pathname = ''
): Promise<boolean> {
  const candidate = extractPortalCandidate(search, hash, pathname);
  if (!candidate) return false;

  const customHash = getStoredCustomPortalHash();
  if (customHash) {
    const candidateHash = await hashPortalSecret(normalizePortalKeyInput(candidate));
    if (constantTimeEqual(candidateHash, customHash)) {
      try {
        sessionStorage.setItem(SESSION_PORTAL_KEY_CACHE, normalizePortalKeyInput(candidate));
      } catch {
        // Ignore
      }
      return true;
    }
    return false;
  }

  return constantTimeEqual(candidate, BUILTIN_PORTAL_KEY);
}

/**
 * Vérifie si un chemin correspond à une route publique connue du site.
 * Toute autre URL affichera la page 404 personnalisée.
 */
export function isKnownPublicPath(pathname: string): boolean {
  const cleanPath = (pathname || '/').replace(/\/+$/, '') || '/';
  if (cleanPath === '/' || cleanPath === '/index.html') return true;
  if (cleanPath === '/videos' || cleanPath === '/catalogue' || cleanPath === '/garantie' || cleanPath === '/boutique') {
    return true;
  }
  return false;
}

/**
 * Comparaison en temps constant pour éviter les attaques par canal auxiliaire temporel.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const maxLen = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < maxLen; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ca ^ cb;
  }
  return diff === 0;
}

/**
 * Efface immédiatement toute URL sensible de la barre d'adresse et de l'historique actif.
 */
export function clearUrlToRoot(): void {
  if (typeof window === 'undefined') return;
  try {
    window.history.replaceState(null, '', '/');
  } catch {
    // Ignore history API restrictions
  }
}

/**
 * Masque l'URL secrète de la barre d'adresse en la remplaçant par un chemin neutre (/espace-prive)
 * afin d'empêcher toute fuite via Referer, historique partagé ou capture d'écran.
 */
export function maskAdminUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    window.history.replaceState({ adminMasked: true }, '', MASKED_ADMIN_PATH);
  } catch {
    // Ignore history API restrictions
  }
}

export function getSecretPortalUrl(overrideKey?: string): string {
  const path = getSecretPortalPath(overrideKey);
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}

// ==============================================================================
// 2. PROTECTION ANTI-BRUTE FORCE (VERROUILLAGE EXPONENTIEL)
// ==============================================================================
const LOCKOUT_STORAGE_KEY = 'omr_sec_gate_v1';

interface LockoutRecord {
  attempts: number;
  lockedUntil: number;
  lastAttemptAt: number;
}

let inMemoryLockout: LockoutRecord = {
  attempts: 0,
  lockedUntil: 0,
  lastAttemptAt: 0
};

function readLockoutRecord(): LockoutRecord {
  const now = Date.now();
  let stored = { ...inMemoryLockout };

  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(LOCKOUT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed.attempts === 'number' &&
          typeof parsed.lockedUntil === 'number' &&
          typeof parsed.lastAttemptAt === 'number'
        ) {
          // Prendre le plus restrictif entre la mémoire et sessionStorage
          if (parsed.attempts > stored.attempts || parsed.lockedUntil > stored.lockedUntil) {
            stored = parsed;
          }
        }
      }
    } catch {
      // Ignore storage error
    }
  }

  // Réinitialisation automatique après 30 minutes sans aucune tentative
  if (stored.lastAttemptAt > 0 && now - stored.lastAttemptAt > 30 * 60 * 1000 && now >= stored.lockedUntil) {
    stored = { attempts: 0, lockedUntil: 0, lastAttemptAt: 0 };
  }

  inMemoryLockout = stored;
  return stored;
}

function writeLockoutRecord(record: LockoutRecord): void {
  inMemoryLockout = record;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Ignore storage error
    }
  }
}

export function getLoginLockState(): {
  isLocked: boolean;
  remainingSeconds: number;
  attempts: number;
} {
  const rec = readLockoutRecord();
  const now = Date.now();
  if (rec.lockedUntil > now) {
    return {
      isLocked: true,
      remainingSeconds: Math.ceil((rec.lockedUntil - now) / 1000),
      attempts: rec.attempts
    };
  }
  return {
    isLocked: false,
    remainingSeconds: 0,
    attempts: rec.attempts
  };
}

export function recordFailedLoginAttempt(): {
  isLocked: boolean;
  remainingSeconds: number;
  attempts: number;
} {
  const rec = readLockoutRecord();
  const nextAttempts = rec.attempts + 1;
  const now = Date.now();

  let lockDurationMs = 0;
  if (nextAttempts >= 10) {
    lockDurationMs = 15 * 60 * 1000; // 15 minutes
  } else if (nextAttempts >= 7) {
    lockDurationMs = 5 * 60 * 1000; // 5 minutes
  } else if (nextAttempts >= 5) {
    lockDurationMs = 60 * 1000; // 1 minute
  } else if (nextAttempts >= 3) {
    lockDurationMs = 15 * 1000; // 15 secondes
  }

  const nextRecord: LockoutRecord = {
    attempts: nextAttempts,
    lockedUntil: lockDurationMs > 0 ? now + lockDurationMs : 0,
    lastAttemptAt: now
  };

  writeLockoutRecord(nextRecord);
  return {
    isLocked: lockDurationMs > 0,
    remainingSeconds: Math.ceil(lockDurationMs / 1000),
    attempts: nextAttempts
  };
}

export function resetLoginAttempts(): void {
  const clean: LockoutRecord = { attempts: 0, lockedUntil: 0, lastAttemptAt: 0 };
  inMemoryLockout = clean;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(LOCKOUT_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

// ==============================================================================
// 3. NETTOYAGE D'ENTRÉES & VALIDATION D'URLS (ANTI-XSS / ANTI-INJECTION)
// ==============================================================================

/**
 * Supprime les caractères de contrôle invisibles et les séquences BiDi spoofing,
 * puis limite la longueur de la chaîne.
 */
export function sanitizeText(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return '';
  return value
    // Supprimer les caractères de contrôle sauf saut de ligne/tab
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    // Supprimer les caractères Unicode BiDi override utilisés pour falsifier les textes
    .replace(/[\u202A-\u202E\u2066-\u2069\u200E\u200F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Nettoie un numéro de téléphone en ne conservant que les caractères sûrs.
 */
export function sanitizePhone(value: unknown, maxLength = 25): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[^0-9+\s\-().]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Vérifie strictement qu'une URL externe utilise HTTPS (bloque javascript:, data:, vbscript:, file:).
 */
export function isSafeHttpUrl(rawUrl?: string | null): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') return true;
    if (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Valide strictement les URLs de médias (images ou vidéos).
 * Bloque explicitement les SVG en data URL (risque XSS stocké), les javascript:, et les traversées de chemin (..).
 */
export function isSafeMediaUrl(rawUrl?: string | null): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;

  // Autoriser les data URLs strictement raster (images sans SVG, ou vidéos MP4/WebM)
  if (trimmed.startsWith('data:')) {
    return /^data:(image\/(jpeg|jpg|png|webp|gif|avif)|video\/(mp4|webm));base64,[A-Za-z0-9+/=\s]+$/i.test(
      trimmed
    );
  }

  // Autoriser les URLs blob locales créées par le navigateur
  if (trimmed.startsWith('blob:')) {
    return trimmed.length < 256;
  }

  // Autoriser les chemins relatifs internes sécurisés sans path traversal
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    if (trimmed.includes('..') || /[\x00-\x1F\s<>'"]/.test(trimmed)) return false;
    return true;
  }

  // Autoriser uniquement HTTPS externe valide
  return isSafeHttpUrl(trimmed);
}

/**
 * Vérifie strictement qu'une URL pointe vers un domaine officiel TikTok.
 */
export function isSafeTikTokUrl(rawUrl?: string | null): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    return host === 'tiktok.com' || host.endsWith('.tiktok.com');
  } catch {
    return false;
  }
}

/**
 * Extrait de manière sécurisée un ID vidéo numérique TikTok (uniquement si domaine TikTok valide ou ID numérique pur).
 */
export function extractSafeTikTokId(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (/^\d{5,25}$/.test(trimmed)) {
    return trimmed;
  }
  if (!isSafeTikTokUrl(trimmed)) return null;
  const cleanUrl = trimmed.split('?')[0].split('#')[0];
  const match = cleanUrl.match(/(?:video|embed(?:\/v2)?|player\/v1)\/(\d{5,25})(?:\/|$)/i);
  return match && match[1] ? match[1] : null;
}

/**
 * Ouvre une URL externe validée (ex: WhatsApp) de manière sécurisée sans risque de Reverse Tabnabbing
 * et compatible avec les environnements sandbox/iframe.
 */
export function openSafeExternalUrl(url: string): boolean {
  if (!isSafeHttpUrl(url)) return false;
  if (typeof document === 'undefined') return false;
  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch {
    return false;
  }
}

// ==============================================================================
// 4. VALIDATION BINAIRE DES FICHIERS UPLOADÉS (MAGIC BYTES — ANTI-XSS / MALWARE)
// ==============================================================================

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_VIDEO_MIMES = new Set(['video/mp4', 'video/webm']);

async function readFileHeaderBytes(file: File, count = 12): Promise<Uint8Array> {
  const slice = file.slice(0, count);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Valide une image avant upload : taille <= 10 Mo, blocage SVG, vérification des magic bytes réels.
 */
export async function validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
  if (!file) return { valid: false, error: 'Aucun fichier sélectionné.' };

  if (file.size === 0) {
    return { valid: false, error: 'Le fichier image est vide.' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'L’image dépasse la limite de sécurité de 10 Mo.' };
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.svg') || lowerName.endsWith('.svgz') || file.type === 'image/svg+xml') {
    return {
      valid: false,
      error: 'Les fichiers SVG sont bloqués par sécurité (risque XSS). Utilisez JPG, PNG ou WebP.'
    };
  }

  if (!ALLOWED_IMAGE_MIMES.has(file.type)) {
    return {
      valid: false,
      error: 'Format non autorisé. Formats acceptés : JPG, PNG, WebP ou GIF.'
    };
  }

  try {
    const bytes = await readFileHeaderBytes(file, 12);
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isPng =
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const isGif =
      bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
    const isWebp =
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50;

    if (!isJpeg && !isPng && !isGif && !isWebp) {
      return {
        valid: false,
        error: 'Signature binaire invalide : le fichier ne correspond pas à une véritable image.'
      };
    }
  } catch {
    return { valid: false, error: 'Impossible de vérifier l’intégrité du fichier image.' };
  }

  return { valid: true };
}

/**
 * Valide une vidéo avant upload : taille <= 25 Mo, MP4/WebM uniquement, vérification des magic bytes.
 */
export async function validateVideoFile(file: File): Promise<{ valid: boolean; error?: string }> {
  if (!file) return { valid: false, error: 'Aucun fichier vidéo sélectionné.' };

  if (file.size === 0) {
    return { valid: false, error: 'Le fichier vidéo est vide.' };
  }

  if (file.size > 25 * 1024 * 1024) {
    return { valid: false, error: 'La vidéo dépasse la limite de sécurité de 25 Mo.' };
  }

  if (!ALLOWED_VIDEO_MIMES.has(file.type)) {
    return {
      valid: false,
      error: 'Format vidéo non autorisé. Utilisez MP4 ou WebM.'
    };
  }

  try {
    const bytes = await readFileHeaderBytes(file, 12);
    // MP4/MOV : 'ftyp' aux octets 4..7
    const isMp4 =
      bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
    // WebM/MKV : EBML header 0x1A 0x45 0xDF 0xA3
    const isWebm =
      bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;

    if (!isMp4 && !isWebm) {
      return {
        valid: false,
        error: 'Signature binaire invalide : le fichier ne correspond pas à une vidéo MP4 ou WebM valide.'
      };
    }
  } catch {
    return { valid: false, error: 'Impossible de vérifier l’intégrité du fichier vidéo.' };
  }

  return { valid: true };
}

// ==============================================================================
// 5. NETTOYAGE DES DONNÉES SENSIBLES CÔTÉ CLIENT
// ==============================================================================
export function purgeSensitiveClientStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    // Ne jamais laisser de données clients (PII commandes) dans localStorage
    localStorage.removeItem('oumar_store_orders');
    // Nettoyer les anciens marqueurs de session admin et le cache temporaire du lien portail
    sessionStorage.removeItem('oumar_admin_session');
    sessionStorage.removeItem('oumar_admin_email');
    sessionStorage.removeItem(SESSION_PORTAL_KEY_CACHE);
  } catch {
    // Ignore storage restrictions
  }
}
