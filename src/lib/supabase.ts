import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

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

// Graceful singleton: if not configured, client is created with empty dummy key to prevent crash,
// but all operations check isSupabaseConfigured first.
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey || 'dummy-anon-key-prevent-init-crash',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
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
    result.message = "Supabase non configuré : VITE_SUPABASE_ANON_KEY manquant ou vide dans les variables d'environnement.";
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
        result.message = "Connexion Supabase réussie, mais les tables 'store_*' ne sont pas encore créées. Veuillez exécuter le script SQL de migration.";
      } else {
        result.isConnected = false;
        result.message = `Erreur de connexion Supabase: ${prodRes.error.message}`;
      }
      return result;
    }

    result.isConnected = true;
    result.tablesReady = true;
    result.productsCount = prodRes.count ?? 0;
    result.videosCount = vidRes.count ?? 0;
    result.adminsCount = admRes.count ?? 0;
    result.ordersCount = ordRes.count ?? 0;

    result.message = `Connecté à Supabase (${SUPABASE_PROJECT_ID}) : ${result.productsCount} produit(s), ${result.videosCount} vidéo(s), ${result.adminsCount} admin(s) configuré(s).`;
  } catch (err: any) {
    result.isConnected = false;
    result.message = `Échec de connexion réseau Supabase: ${err?.message || 'Erreur inconnue'}`;
  }

  return result;
}

// ==============================================================================
// SUPABASE AUTH & ADMIN AUTHORIZATION (RBAC)
// ==============================================================================
export interface StoreAdminRecord {
  id: string;
  user_id: string;
  email: string;
  role: 'superadmin' | 'admin' | 'manager';
  is_active?: boolean;
}

export async function checkIsUserAdmin(expectedUserId?: string): Promise<{
  isAdmin: boolean;
  record?: StoreAdminRecord;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return { isAdmin: false, error: 'Supabase non configuré' };
  }

  try {
    // 1. Obtenir l'utilisateur authentifié réel auprès de Supabase Auth
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return { isAdmin: false, error: 'Non authentifié sur Supabase Auth.' };
    }

    if (expectedUserId && expectedUserId !== user.id) {
      return { isAdmin: false, error: 'Identifiant utilisateur non correspondant.' };
    }

    // 2. Vérification par user_id
    const { data: byUserId, error: errUserId } = await supabase
      .from('store_admins')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!errUserId && byUserId) {
      if (!byUserId.is_active) {
        return { 
          isAdmin: false, 
          error: 'Accès désactivé : Votre compte administrateur a été suspendu ou désactivé par la direction.' 
        };
      }
      return { isAdmin: true, record: byUserId as StoreAdminRecord };
    }

    // 3. Si non trouvé par user_id, vérifier par email pour associer user_id
    if (user.email) {
      const { data: byEmail, error: errEmail } = await supabase
        .from('store_admins')
        .select('*')
        .ilike('email', user.email.trim())
        .maybeSingle();

      if (!errEmail && byEmail) {
        if (!byEmail.is_active) {
          return { 
            isAdmin: false, 
            error: 'Accès désactivé : Votre compte administrateur a été suspendu ou désactivé par la direction.' 
          };
        }
        // Associer user_id si ce n'était pas encore fait
        if (!byEmail.user_id) {
          try {
            await supabase
              .from('store_admins')
              .update({ user_id: user.id })
              .eq('id', byEmail.id);
          } catch {
            // Ignorer si RLS restreint la mise à jour directe
          }
        }
        return { isAdmin: true, record: { ...byEmail, user_id: user.id } as StoreAdminRecord };
      }
    }
  } catch (e: any) {
    console.warn('Erreur lors de la vérification des droits administrateur:', e?.message);
  }

  return { 
    isAdmin: false, 
    error: 'Accès refusé : Votre compte existe dans Supabase Auth, mais il n’est pas enregistré comme administrateur actif dans la table "store_admins".' 
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
      error: "Supabase n'est pas encore configuré avec VITE_SUPABASE_ANON_KEY dans le fichier .env."
    };
  }

  const cleanEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: password.trim()
  });

  if (error || !data.user) {
    const errorMsg = error?.message || '';
    if (errorMsg.includes('Invalid login credentials')) {
      return {
        user: null,
        isAdmin: false,
        error: "Identifiants Supabase incorrects. Assurez-vous d'avoir créé l'utilisateur dans Supabase (Authentication > Users) et vérifiez le mot de passe."
      };
    }
    return {
      user: null,
      isAdmin: false,
      error: errorMsg || "Identifiants Supabase Auth invalides."
    };
  }

  // Vérification stricte des droits administrateur dans store_admins (aucun bootstrap automatique)
  const adminCheck = await checkIsUserAdmin(data.user.id);
  if (adminCheck.isAdmin) {
    return {
      user: data.user,
      isAdmin: true
    };
  }

  // Si non autorisé ou inactif, déconnecter immédiatement la session Supabase Auth
  await supabase.auth.signOut();
  return {
    user: null,
    isAdmin: false,
    error: adminCheck.error || `Accès refusé : Le compte "${data.user.email}" n'est pas configuré comme administrateur actif dans store_admins.`
  };
}

export async function signOutAdmin(): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Erreur lors de la déconnexion Supabase:', e);
    }
  }
}
