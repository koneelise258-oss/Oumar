import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
    // Attempt a lightweight query to store_products
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
