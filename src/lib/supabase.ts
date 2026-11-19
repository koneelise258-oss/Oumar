import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { purgeSensitiveClientStorage } from '../utils/security';

export const SUPABASE_PROJECT_ID = 'orjbwpbyiqscbbvaukrz';
export const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseUrl: string = (envUrl && envUrl.trim() !== '') ? envUrl.trim() : DEFAULT_SUPABASE_URL;
export const supabaseAnonKey: string = (envAnonKey && envAnonKey.trim() !== '' && !envAnonKey.includes('votre_cle')) ? envAnonKey.trim() : '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseAnonKey.length > 20
);

// Graceful singleton with PKCE auth flow and auto-refresh
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey || 'dummy-anon-key-prevent-init-crash',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce'
    }
  }
);

export interface SupabaseHealthResult {
  isConfigured: boolean;
  isConnected: boolean;
  tablesReady: boolean;
  message: string;
  projectId: string;
  url: string;
  productsCount?: number;
  videosCount?: number;
  adminsCount?: number;
  ordersCount?: number;
}

export async function testSupabaseHealth(): Promise<SupabaseHealthResult> {
  const result: SupabaseHealthResult = {
    isConfigured: isSupabaseConfigured,
    isConnected: false,
    tablesReady: false,
    message: '',
    projectId: SUPABASE_PROJECT_ID,
    url: supabaseUrl,
    productsCount: 0,
    videosCount: 0,
    adminsCount: 0,
    ordersCount: 0
  };

  if (!isSupabaseConfigured) {
    result.message = "La connexion au serveur distant n'est pas encore initialisée.";
    return result;
  }

  // Exiger un administrateur authentifié pour les diagnostics complets
  const adminCheck = await checkIsUserAdmin();
  if (!adminCheck.isAdmin) {
    result.message = "Accès au diagnostic réservé aux administrateurs authentifiés.";
    return result;
  }

  try {
    const [prodRes, vidRes, admRes, ordRes] = await Promise.all([
      supabase.from('store_products').select('id', { count: 'exact', head: true }),
      supabase.from('store_videos').select('id', { count: 'exact', head: true }),
      supabase.from('store_admins').select('id', { count: 'exact', head: true }),
      supabase.from('store_orders').select('id', { count: 'exact', head: true })
    ]);

    if (prodRes.error) {
      if (prodRes.error.code === '42P01' || prodRes.error.message.includes('does not exist') || prodRes.error.message.includes('store_products')) {
        result.isConnected = true;
        result.tablesReady = false;
        result.message = "Connexion établie avec le serveur. Initialisation des rubriques de la boutique requise.";
      } else {
        result.isConnected = false;
        result.message = "Vérification du catalogue interrompue par le serveur.";
      }
      return result;
    }

    result.isConnected = true;
    result.tablesReady = true;
    result.productsCount = prodRes.count ?? 0;
    result.videosCount = vidRes.count ?? 0;
    result.adminsCount = admRes.count ?? 0;
    result.ordersCount = ordRes.count ?? 0;

    result.message = `Serveur en ligne connecté : ${result.productsCount} modèle(s) au catalogue, ${result.videosCount} vidéo(s) et ${result.adminsCount} accès d'équipe configuré(s).`;
  } catch {
    result.isConnected = false;
    result.message = "Connexion au serveur momentanément inaccessible. Veuillez réessayer.";
  }

  return result;
}

// ==============================================================================
// SUPABASE AUTH & ADMIN AUTHORIZATION (RBAC) — FAIL-CLOSED & ANTI-ENUMERATION
// ==============================================================================
export interface StoreAdminRecord {
  id: string;
  user_id: string;
  email: string;
  role: 'superadmin' | 'admin' | 'manager';
  is_active?: boolean;
}

const GENERIC_AUTH_ERROR = "Identifiants invalides ou accès non autorisé.";

export async function checkIsUserAdmin(expectedUserId?: string): Promise<{
  isAdmin: boolean;
  record?: StoreAdminRecord;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return { isAdmin: false, error: 'Service momentanément indisponible.' };
  }

  try {
    // 1. Validation JWT côté serveur Supabase (jamais uniquement le cache local)
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return { isAdmin: false, error: 'Session expirée ou non authentifiée.' };
    }

    if (expectedUserId && expectedUserId !== user.id) {
      return { isAdmin: false, error: GENERIC_AUTH_ERROR };
    }

    // 2. Vérification stricte par user_id avec projection minimale de colonnes
    const { data: byUserId, error: errUserId } = await supabase
      .from('store_admins')
      .select('id, user_id, email, role, is_active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!errUserId && byUserId) {
      if (byUserId.is_active !== true) {
        return { isAdmin: false, error: GENERIC_AUTH_ERROR };
      }
      return { isAdmin: true, record: byUserId as StoreAdminRecord };
    }

    // 3. Repli par e-mail UNIQUEMENT si l'e-mail est vérifié/confirmé dans Supabase Auth
    if (user.email && user.email_confirmed_at) {
      const { data: byEmail, error: errEmail } = await supabase
        .from('store_admins')
        .select('id, user_id, email, role, is_active')
        .ilike('email', user.email.trim())
        .maybeSingle();

      if (!errEmail && byEmail) {
        if (byEmail.is_active !== true) {
          return { isAdmin: false, error: GENERIC_AUTH_ERROR };
        }
        // Associer user_id si manquant (protégé côté serveur par RLS)
        if (!byEmail.user_id) {
          try {
            await supabase
              .from('store_admins')
              .update({ user_id: user.id })
              .eq('id', byEmail.id)
              .is('user_id', null);
          } catch {
            // Ignorer si RLS restreint la mise à jour directe
          }
        }
        return { isAdmin: true, record: { ...byEmail, user_id: user.id } as StoreAdminRecord };
      }
    }
  } catch {
    // Fail-closed strict sur toute erreur réseau ou exception
    return { isAdmin: false, error: GENERIC_AUTH_ERROR };
  }

  return {
    isAdmin: false,
    error: GENERIC_AUTH_ERROR
  };
}

export async function signInAdminWithPassword(email: string, password: string): Promise<{
  user: User | null;
  isAdmin: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return {
      user: null,
      isAdmin: false,
      error: "Service d'authentification momentanément indisponible."
    };
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password || cleanEmail.length > 254 || password.length > 128) {
    return {
      user: null,
      isAdmin: false,
      error: GENERIC_AUTH_ERROR
    };
  }

  // Ne jamais modifier (trim) le mot de passe saisi par l'utilisateur
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password
  });

  if (error || !data.user) {
    // Message volontairement uniforme (protection anti-énumération de comptes)
    return {
      user: null,
      isAdmin: false,
      error: GENERIC_AUTH_ERROR
    };
  }

  // Vérification stricte des droits administrateur actifs dans store_admins
  const adminCheck = await checkIsUserAdmin(data.user.id);
  if (adminCheck.isAdmin && adminCheck.record) {
    return {
      user: data.user,
      isAdmin: true
    };
  }

  // Si non autorisé ou inactif, révoquer immédiatement la session et purger le stockage
  await supabase.auth.signOut().catch(() => {});
  purgeSensitiveClientStorage();

  return {
    user: null,
    isAdmin: false,
    error: GENERIC_AUTH_ERROR
  };
}

export async function signOutAdmin(): Promise<void> {
  purgeSensitiveClientStorage();
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore signout network errors; local tokens are cleared
    }
  }
}
