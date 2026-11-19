-- ==============================================================================
-- MIGRATION DE DURCISSEMENT CYBERSÉCURITÉ SUPABASE — OUMAR IPHONE
-- Projet Supabase ID : orjbwpbyiqscbbvaukrz (eu-west-1)
-- Date : 2026-11-19
--
-- RÈGLE D'ISOLATION : Strictement additif/correctif sur les tables préfixées "store_".
-- ==============================================================================

-- 1. SUPPRESSION DÉFINITIVE DE LA COLONNE HÉRITÉE admin_pin (Prévention fuite publique)
DO $$ BEGIN
  ALTER TABLE public.store_settings DROP COLUMN IF EXISTS admin_pin;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. DURCISSEMENT DES FONCTIONS RBAC SECURITY DEFINER
--    - Ajout strict de SET search_path = public, private, pg_temp (corrige function_search_path_mutable)
--    - Exige un e-mail vérifié (email_confirmed_at / email_verified) pour tout rattachement par e-mail
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_store_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, private, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_admins
    WHERE auth.uid() IS NOT NULL
      AND is_active = true
      AND (
        user_id = auth.uid()
        OR (
          user_id IS NULL
          AND LOWER(email) = LOWER(COALESCE(auth.jwt()->>'email', ''))
          AND EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
              AND u.email_confirmed_at IS NOT NULL
          )
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION private.is_store_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, private, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_admins
    WHERE auth.uid() IS NOT NULL
      AND role = 'superadmin'
      AND is_active = true
      AND (
        user_id = auth.uid()
        OR (
          user_id IS NULL
          AND LOWER(email) = LOWER(COALESCE(auth.jwt()->>'email', ''))
          AND EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
              AND u.email_confirmed_at IS NOT NULL
          )
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_store_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, private, pg_temp
AS $$
  SELECT private.is_store_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_store_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, private, pg_temp
AS $$
  SELECT private.is_store_superadmin();
$$;

REVOKE ALL ON FUNCTION private.is_store_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_store_superadmin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_store_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_store_superadmin() TO authenticated;

-- 3. PROTECTION CONTRE LA SUPPRESSION OU DÉSACTIVATION DU DERNIER SUPERADMIN ACTIF
CREATE OR REPLACE FUNCTION private.protect_last_superadmin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_remaining_superadmins INT;
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.role = 'superadmin' AND OLD.is_active = true)
     OR (TG_OP = 'UPDATE' AND OLD.role = 'superadmin' AND OLD.is_active = true AND (NEW.role <> 'superadmin' OR NEW.is_active = false)) THEN
    SELECT COUNT(*) INTO v_remaining_superadmins
    FROM public.store_admins
    WHERE role = 'superadmin'
      AND is_active = true
      AND id <> OLD.id;

    IF v_remaining_superadmins = 0 THEN
      RAISE EXCEPTION 'Sécurité : impossible de supprimer ou désactiver le dernier superadministrateur actif.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_last_superadmin ON public.store_admins;
CREATE TRIGGER trg_protect_last_superadmin
  BEFORE UPDATE OR DELETE ON public.store_admins
  FOR EACH ROW
  EXECUTE FUNCTION private.protect_last_superadmin();

-- 4. RLS STRICTE SUR public.store_product_variants (Si la table existe)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'store_product_variants'
  ) THEN
    ALTER TABLE public.store_product_variants ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public can view published variants" ON public.store_product_variants;
    CREATE POLICY "Public can view published variants" ON public.store_product_variants
      FOR SELECT
      USING (published = true OR private.is_store_admin());

    DROP POLICY IF EXISTS "Admins can manage variants" ON public.store_product_variants;
    CREATE POLICY "Admins can manage variants" ON public.store_product_variants
      FOR ALL TO authenticated
      USING (private.is_store_admin())
      WITH CHECK (private.is_store_admin());
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 5. JOURNAL D'AUDIT DE SÉCURITÉ (TRAÇABILITÉ DES CHANGEMENTS ADMIN)
CREATE TABLE IF NOT EXISTS public.store_security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID DEFAULT auth.uid(),
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_audit_logs_created_at
  ON public.store_security_audit_logs (created_at DESC);

ALTER TABLE public.store_security_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can read audit logs" ON public.store_security_audit_logs;
  CREATE POLICY "Admins can read audit logs" ON public.store_security_audit_logs
    FOR SELECT TO authenticated
    USING (private.is_store_admin());

  -- Aucune modification ou suppression des logs d'audit (immuabilité)
  DROP POLICY IF EXISTS "No direct writes to audit logs" ON public.store_security_audit_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION private.log_store_admin_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
BEGIN
  INSERT INTO public.store_security_audit_logs (actor_user_id, action, target_table, target_id, metadata)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    jsonb_build_object(
      'email', COALESCE(NEW.email, OLD.email),
      'role', COALESCE(NEW.role, OLD.role),
      'is_active', COALESCE(NEW.is_active, OLD.is_active)
    )
  );
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_store_admins ON public.store_admins;
CREATE TRIGGER trg_audit_store_admins
  AFTER INSERT OR UPDATE OR DELETE ON public.store_admins
  FOR EACH ROW
  EXECUTE FUNCTION private.log_store_admin_change();

-- 6. DURCISSEMENT SUPABASE STORAGE (BUCKET store-products)
--    Lecture publique des images produits, écriture/suppression réservée aux admins authentifiés uniquement
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'store-products') THEN
    UPDATE storage.buckets
    SET
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    WHERE id = 'store-products';
  END IF;

  DROP POLICY IF EXISTS "Public read store-products" ON storage.objects;
  CREATE POLICY "Public read store-products" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'store-products');

  DROP POLICY IF EXISTS "Admins upload store-products" ON storage.objects;
  CREATE POLICY "Admins upload store-products" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'store-products' AND private.is_store_admin());

  DROP POLICY IF EXISTS "Admins update store-products" ON storage.objects;
  CREATE POLICY "Admins update store-products" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'store-products' AND private.is_store_admin())
    WITH CHECK (bucket_id = 'store-products' AND private.is_store_admin());

  DROP POLICY IF EXISTS "Admins delete store-products" ON storage.objects;
  CREATE POLICY "Admins delete store-products" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'store-products' AND private.is_store_admin());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
