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
}

export async function testSupabaseHealth(): Promise<SupabaseHealthResult> {
  const result: SupabaseHealthResult = {
    isConfigured: isSupabaseConfigured,
    isConnected: false,
    tablesReady: false,
    message: '',
    projectId: SUPABASE_PROJECT_ID,
    url: supabaseUrl
  };

  if (!isSupabaseConfigured) {
    result.message = "Supabase non configuré : VITE_SUPABASE_ANON_KEY manquant ou vide dans les variables d'environnement.";
    return result;
  }

  try {
    const { error, count } = await supabase
      .from('store_products')
      .select('id', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('store_products')) {
        result.isConnected = true;
        result.tablesReady = false;
        result.message = "Connexion Supabase réussie, mais les tables 'store_*' ne sont pas encore créées. Veuillez exécuter le script SQL de migration.";
      } else {
        result.isConnected = false;
        result.message = `Erreur de connexion Supabase: ${error.message}`;
      }
    } else {
      result.isConnected = true;
      result.tablesReady = true;
      result.message = `Connecté avec succès à Supabase ! (${count ?? 0} produit(s) en base)`;
    }
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
    // 1. Obtenir l'utilisateur authentifié réel directement auprès du serveur Supabase Auth
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return { isAdmin: false, error: 'Non authentifié sur Supabase Auth' };
    }

    if (expectedUserId && expectedUserId !== user.id) {
      return { isAdmin: false, error: 'Identifiant utilisateur non correspondant' };
    }

    // 2. Vérifier strictement l'existence d'une ligne active liée à ce user_id dans store_admins
    const { data, error } = await supabase
      .from('store_admins')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!error && data) {
      return { isAdmin: true, record: data as StoreAdminRecord };
    }
  } catch (e: any) {
    console.warn('Erreur lors de la vérification des droits administrateur:', e?.message);
  }

  return { isAdmin: false, error: 'Accès refusé : Ce compte ne possède pas de droits administrateur actifs dans store_admins.' };
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim()
  });

  if (error || !data.user) {
    return {
      user: null,
      isAdmin: false,
      error: error?.message || "Identifiants Supabase Auth invalides."
    };
  }

  // Vérifier la présence stricte de l'utilisateur actif par user_id dans store_admins
  const adminCheck = await checkIsUserAdmin(data.user.id);
  if (!adminCheck.isAdmin) {
    await supabase.auth.signOut();
    return {
      user: null,
      isAdmin: false,
      error: `Accès refusé : Le compte "${data.user.email}" n'est pas configuré avec un accès administrateur actif (user_id) dans store_admins.`
    };
  }

  return {
    user: data.user,
    isAdmin: true
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
