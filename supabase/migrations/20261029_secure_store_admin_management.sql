-- ==============================================================================
-- MIGRATION SÉCURISÉE SUPABASE : GESTION DES ADMINISTRATEURS (RBAC) & SÉCURISATION
-- Projet Supabase ID : orjbwpbyiqscbbvaukrz (Oumar iPhone)
-- ==============================================================================

-- 1. Confirmation de la révocation des droits publics sur create_store_order (Réservation WhatsApp exclusive)
REVOKE EXECUTE ON FUNCTION public.create_store_order(TEXT, TEXT, TEXT, JSONB) FROM anon, authenticated;

-- 2. FONCTION PRIVILÉGIÉE AUDITÉE : add_store_admin_by_email
-- Permet à un superadministrateur d'ajouter un membre d'équipe en validant son rôle et son compte Auth.
-- Exige un superadministrateur actif authentifié pour toute modification.
CREATE OR REPLACE FUNCTION public.add_store_admin_by_email(
  p_email TEXT,
  p_role TEXT DEFAULT 'admin',
  p_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_uid UUID;
  v_caller_is_superadmin BOOLEAN;
  v_target_user_id UUID;
  v_clean_email TEXT;
  v_clean_role TEXT;
BEGIN
  -- 1. Récupération de l'identité de l'appelant authentifié
  v_caller_uid := auth.uid();
  IF v_caller_uid IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Non authentifié. Vous devez être connecté sur Supabase Auth.'
    );
  END IF;

  -- 2. Nettoyage et validation stricte du format de l'e-mail
  v_clean_email := LOWER(TRIM(p_email));
  IF v_clean_email IS NULL OR v_clean_email = '' OR v_clean_email NOT LIKE '%_@__%.__%' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Adresse e-mail invalide.'
    );
  END IF;

  -- 3. Validation stricte du rôle
  v_clean_role := LOWER(TRIM(COALESCE(p_role, 'admin')));
  IF v_clean_role NOT IN ('superadmin', 'admin', 'manager') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Rôle invalide. Les rôles autorisés sont : superadmin, admin, manager.'
    );
  END IF;

  -- 4. Contrôle d'autorisation strict : Seul un superadministrateur actif peut ajouter ou modifier des membres
  SELECT EXISTS (
    SELECT 1 FROM public.store_admins
    WHERE user_id = v_caller_uid
      AND role = 'superadmin'
      AND is_active = true
  ) INTO v_caller_is_superadmin;

  IF NOT v_caller_is_superadmin THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Accès refusé : Seul un superadministrateur actif peut ajouter ou modifier des membres de l’équipe.'
    );
  END IF;

  -- 5. Recherche de l'utilisateur dans auth.users
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE LOWER(email) = v_clean_email;

  IF v_target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Aucun compte Supabase Auth trouvé pour cet e-mail. L’utilisateur doit d’abord créer son compte (Authentication > Users) avant d’être associé dans store_admins.'
    );
  END IF;

  -- 6. Insertion ou mise à jour sécurisée dans store_admins
  INSERT INTO public.store_admins (
    user_id,
    email,
    role,
    phone,
    is_active,
    created_at
  ) VALUES (
    v_target_user_id,
    v_clean_email,
    v_clean_role,
    NULLIF(TRIM(p_phone), ''),
    true,
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    role = EXCLUDED.role,
    phone = COALESCE(EXCLUDED.phone, public.store_admins.phone),
    is_active = true;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Administrateur ' || v_clean_email || ' (' || v_clean_role || ') configuré avec succès.'
  );
END;
$$;

-- Révocation de tout accès public/anonyme et attribution stricte au rôle authenticated
REVOKE ALL ON FUNCTION public.add_store_admin_by_email(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_store_admin_by_email(TEXT, TEXT, TEXT) TO authenticated;
