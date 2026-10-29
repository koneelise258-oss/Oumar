// Exact SQL Migration Script for Supabase Project: orjbwpbyiqscbbvaukrz (eu-west-1)
export const SUPABASE_MIGRATION_SQL = `-- ==============================================================================
-- MIGRATION SÉCURISÉE SUPABASE : OUMAR IPHONE (Boutique E-commerce Abidjan)
-- Projet Supabase ID : orjbwpbyiqscbbvaukrz (Région : eu-west-1)
--
-- RÈGLE ABSOLUE D'ISOLATION :
-- Ce script est strictement additif et préfixe toutes ses tables par "store_".
-- Il n'altère, ne supprime et n'interfère avec AUCUNE table existante
-- (notamment les tables de gestion scolaire ou "profiles" présentes sur le projet).
-- ==============================================================================

-- 1. TABLE DES ADMINISTRATEURS AUTORISÉS (Supabase Auth RBAC)
CREATE TABLE IF NOT EXISTS public.store_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'manager')),
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.store_admins ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE public.store_admins ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_store_admins_user_id ON public.store_admins (user_id);
CREATE INDEX IF NOT EXISTS idx_store_admins_email ON public.store_admins (email);

-- 2. TABLE DES PRODUITS (Catalogue Apple, Variantes, Stocks & Prix)
CREATE TABLE IF NOT EXISTS public.store_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('iPhone', 'iPad', 'MacBook', 'Accessoires')),
  condition TEXT NOT NULL DEFAULT 'Neuf Scellé',
  storage JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_storage TEXT,
  price BIGINT NOT NULL CHECK (price >= 0),
  original_price BIGINT,
  storage_prices JSONB DEFAULT '{}'::jsonb,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_color TEXT,
  image TEXT NOT NULL,
  gallery JSONB DEFAULT '[]'::jsonb,
  battery_health TEXT DEFAULT '100% Neuf',
  warranty TEXT DEFAULT 'Garantie Apple 1 an',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  stock_location TEXT DEFAULT 'Boutique Cocody & Plateau',
  featured BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  specs JSONB DEFAULT '{}'::jsonb,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_products_category ON public.store_products (category);
CREATE INDEX IF NOT EXISTS idx_store_products_published ON public.store_products (published);
CREATE INDEX IF NOT EXISTS idx_store_products_in_stock ON public.store_products (in_stock);

-- 3. TABLE DES VIDÉOS IMMERSIVES (Média MP4, WebM & TikTok)
CREATE TABLE IF NOT EXISTS public.store_videos (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'html5' CHECK (type IN ('html5', 'tiktok')),
  title TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_videos_order ON public.store_videos (display_order ASC);
CREATE INDEX IF NOT EXISTS idx_store_videos_published ON public.store_videos (published);

-- 4. TABLE DES PARAMÈTRES BOUTIQUE ABIDJAN (Retrait boutique & WhatsApp normalisé)
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  store_name TEXT NOT NULL DEFAULT 'OUMAR IPHONE',
  whatsapp_phone TEXT NOT NULL DEFAULT '2250778024285',
  tagline TEXT DEFAULT 'Boutique Apple d’Excellence à Abidjan',
  city TEXT DEFAULT 'Abidjan, Côte d’Ivoire',
  addresses JSONB DEFAULT '[]'::jsonb,
  opening_hours TEXT DEFAULT 'Lundi au Samedi : 08h30 - 19h30 | Dimanche : Sur rendez-vous',
  warranty_text TEXT,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  admin_pin TEXT NOT NULL DEFAULT '2025',
  hero_photo_custom TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.store_settings (
  id, store_name, whatsapp_phone, tagline, city, addresses, opening_hours, warranty_text, delivery_fee, admin_pin
)
VALUES (
  'default',
  'OUMAR IPHONE',
  '2250778024285',
  'Boutique Apple d’Excellence à Abidjan',
  'Abidjan, Côte d’Ivoire',
  '[
    {"name": "Boutique OUMAR IPHONE Abidjan", "location": "Abidjan, Côte d’Ivoire (Retrait en boutique)", "phone": "+225 07 78 02 42 85", "hours": "Lun - Sam : 08h30 - 19h30"}
  ]'::jsonb,
  'Lundi au Samedi : 08h30 - 19h30 | Dimanche : Sur rendez-vous',
  'Tous nos iPhone, iPad et MacBook sont vendus avec facture certifiée, numéro IMEI et garantie officielle.',
  0,
  '2025'
)
ON CONFLICT (id) DO UPDATE SET
  whatsapp_phone = '2250778024285',
  delivery_fee = 0;

-- 5. TABLE DES COMMANDES CLIENTS (Aucune donnée fictive)
CREATE TABLE IF NOT EXISTS public.store_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  commune TEXT NOT NULL DEFAULT 'Retrait en boutique OUMAR IPHONE',
  subtotal BIGINT NOT NULL DEFAULT 0,
  delivery_fee BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_delivery', 'delivered', 'cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'Paiement au retrait en boutique',
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_store_orders_created_at ON public.store_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON public.store_orders (status);

-- 6. TABLE DES LIGNES DE COMMANDE
CREATE TABLE IF NOT EXISTS public.store_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  product_image TEXT,
  chosen_storage TEXT,
  chosen_color TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price BIGINT NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_order_items_order_id ON public.store_order_items (order_id);

-- 7. SCHÉMA PRIVATE ET FONCTIONS SÉCURISÉES DE CONTRÔLE DE RÔLE (RBAC)
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_store_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, private, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_admins
    WHERE auth.uid() IS NOT NULL
      AND (
        user_id = auth.uid()
        OR (user_id IS NULL AND LOWER(email) = LOWER(auth.jwt()->>'email'))
      )
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION private.is_store_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, private, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_admins
    WHERE auth.uid() IS NOT NULL
      AND (
        user_id = auth.uid()
        OR (user_id IS NULL AND LOWER(email) = LOWER(auth.jwt()->>'email'))
      )
      AND role = 'superadmin'
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_store_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT private.is_store_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_store_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT private.is_store_superadmin();
$$;

-- 8. FONCTION RPC SÉCURISÉE DE CRÉATION DE COMMANDE (TRANSACTION ATOMIQUE)
CREATE OR REPLACE FUNCTION public.create_store_order(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_notes TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id TEXT;
  v_order_number TEXT;
  v_next_val BIGINT;
  v_subtotal BIGINT := 0;
  v_total BIGINT := 0;
  v_item JSONB;
  v_prod RECORD;
  v_unit_price BIGINT;
  v_qty INT;
BEGIN
  -- Verrou applicatif transactionnel pour éviter toute collision sur le numéro de commande
  PERFORM pg_advisory_xact_lock(17923679);

  IF p_customer_name IS NULL OR TRIM(p_customer_name) = '' THEN
    RAISE EXCEPTION 'Le nom du client est obligatoire pour le retrait en boutique.';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Le panier est vide.';
  END IF;

  v_order_id := 'ord-' || floor(extract(epoch from clock_timestamp()) * 1000)::TEXT;
  
  SELECT COALESCE(MAX(NULLIF(regexp_replace(order_number, '\D', '', 'g'), '')::BIGINT), 0) + 1
  INTO v_next_val
  FROM public.store_orders;
  
  v_order_number := 'OMR-' || LPAD(v_next_val::TEXT, 4, '0');

  INSERT INTO public.store_orders (
    id,
    order_number,
    customer_name,
    customer_phone,
    commune,
    subtotal,
    delivery_fee,
    total,
    status,
    payment_method,
    notes,
    created_at
  ) VALUES (
    v_order_id,
    v_order_number,
    TRIM(p_customer_name),
    NULLIF(TRIM(p_customer_phone), ''),
    'Retrait en boutique OUMAR IPHONE',
    0,
    0,
    0,
    'pending',
    'Paiement au retrait en boutique',
    p_notes,
    NOW()
  );

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := COALESCE((v_item->>'quantity')::INT, 1);
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantité invalide pour un article.';
    END IF;

    SELECT * INTO v_prod
    FROM public.store_products
    WHERE id = (v_item->>'product_id') AND published = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produit introuvable ou indisponible : %', (v_item->>'product_id');
    END IF;

    IF v_prod.in_stock = false THEN
      RAISE EXCEPTION 'Le produit "%" est actuellement en rupture de stock.', v_prod.name;
    END IF;

    v_unit_price := v_prod.price;
    IF v_item->>'chosen_storage' IS NOT NULL AND v_prod.storage_prices ? (v_item->>'chosen_storage') THEN
      v_unit_price := (v_prod.storage_prices->>(v_item->>'chosen_storage'))::BIGINT;
    END IF;

    v_subtotal := v_subtotal + (v_unit_price * v_qty);

    INSERT INTO public.store_order_items (
      order_id,
      product_id,
      product_name,
      product_image,
      chosen_storage,
      chosen_color,
      quantity,
      unit_price
    ) VALUES (
      v_order_id,
      v_prod.id,
      v_prod.name,
      v_prod.image,
      v_item->>'chosen_storage',
      v_item->>'chosen_color',
      v_qty,
      v_unit_price
    );
  END LOOP;

  v_total := v_subtotal;

  UPDATE public.store_orders
  SET subtotal = v_subtotal, total = v_total
  WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total', v_total
  );
END;
$$;

-- Révocation de tout accès public/anonyme sur create_store_order (Réservation WhatsApp exclusive)
REVOKE ALL ON FUNCTION public.create_store_order(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon;

-- 9. FONCTION PRIVILÉGIÉE : add_store_admin_by_email
-- Permet à un superadministrateur d'ajouter un membre d'équipe en validant son rôle et son compte Auth.
-- Comporte une sécurité anti-élévation de privilèges et un mécanisme d'auto-initialisation
-- sécurisé uniquement lorsque la table store_admins ne contient encore aucun administrateur actif.
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
  v_admin_count INT;
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

  -- 4. Contrôle d'autorisation & protection contre l'élévation de privilèges
  SELECT COUNT(*) INTO v_admin_count FROM public.store_admins WHERE is_active = true;

  IF v_admin_count > 0 THEN
    -- Au moins un administrateur actif existe : seul un superadministrateur actif peut créer ou modifier un compte
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
  ELSE
    -- CAS D'INITIALISATION : La table store_admins ne compte aucun administrateur actif.
    -- L'utilisateur connecté peut s'initialiser lui-même en tant que premier superadministrateur
    -- à condition que l'e-mail renseigné corresponde à son propre compte de session Auth.
    IF NOT EXISTS (
      SELECT 1 FROM auth.users WHERE id = v_caller_uid AND LOWER(email) = v_clean_email
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Initialisation : Vous ne pouvez vous enregistrer comme premier superadministrateur qu’avec l’adresse e-mail de votre propre compte connecté.'
      );
    END IF;
    v_clean_role := 'superadmin';
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

REVOKE ALL ON FUNCTION public.add_store_admin_by_email(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_store_admin_by_email(TEXT, TEXT, TEXT) TO authenticated;

-- 10. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.store_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can view admins" ON public.store_admins;
  CREATE POLICY "Admins can view admins" ON public.store_admins FOR SELECT TO authenticated USING (private.is_store_admin());

  DROP POLICY IF EXISTS "Superadmins can manage admins" ON public.store_admins;
  CREATE POLICY "Superadmins can manage admins" ON public.store_admins FOR ALL TO authenticated USING (private.is_store_superadmin()) WITH CHECK (private.is_store_superadmin());

  DROP POLICY IF EXISTS "Public can view published products" ON public.store_products;
  CREATE POLICY "Public can view published products" ON public.store_products FOR SELECT USING (published = true OR private.is_store_admin());
  DROP POLICY IF EXISTS "Admins can manage products" ON public.store_products;
  CREATE POLICY "Admins can manage products" ON public.store_products FOR ALL TO authenticated USING (private.is_store_admin()) WITH CHECK (private.is_store_admin());

  DROP POLICY IF EXISTS "Public can view published videos" ON public.store_videos;
  CREATE POLICY "Public can view published videos" ON public.store_videos FOR SELECT USING (published = true OR private.is_store_admin());
  DROP POLICY IF EXISTS "Admins can manage videos" ON public.store_videos;
  CREATE POLICY "Admins can manage videos" ON public.store_videos FOR ALL TO authenticated USING (private.is_store_admin()) WITH CHECK (private.is_store_admin());

  DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
  CREATE POLICY "Public can view store settings" ON public.store_settings FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Admins can update settings" ON public.store_settings;
  CREATE POLICY "Admins can update settings" ON public.store_settings FOR UPDATE TO authenticated USING (private.is_store_admin()) WITH CHECK (private.is_store_admin());

  -- Orders & Items RLS: AUCUNE INSERTION DIRECTE NI LECTURE PUBLIQUE (Passage obligatoire par RPC create_store_order)
  DROP POLICY IF EXISTS "Public can insert orders" ON public.store_orders;
  DROP POLICY IF EXISTS "Public can insert order items" ON public.store_order_items;

  DROP POLICY IF EXISTS "Admins can view orders" ON public.store_orders;
  CREATE POLICY "Admins can view orders" ON public.store_orders FOR SELECT TO authenticated USING (private.is_store_admin());
  DROP POLICY IF EXISTS "Admins can view order items" ON public.store_order_items;
  CREATE POLICY "Admins can view order items" ON public.store_order_items FOR SELECT TO authenticated USING (private.is_store_admin());

  DROP POLICY IF EXISTS "Admins can update orders" ON public.store_orders;
  CREATE POLICY "Admins can update orders" ON public.store_orders FOR UPDATE TO authenticated USING (private.is_store_admin()) WITH CHECK (private.is_store_admin());
  DROP POLICY IF EXISTS "Admins can delete orders" ON public.store_orders;
  CREATE POLICY "Admins can delete orders" ON public.store_orders FOR DELETE TO authenticated USING (private.is_store_admin());

  DROP POLICY IF EXISTS "Admins can update order items" ON public.store_order_items;
  CREATE POLICY "Admins can update order items" ON public.store_order_items FOR UPDATE TO authenticated USING (private.is_store_admin()) WITH CHECK (private.is_store_admin());
  DROP POLICY IF EXISTS "Admins can delete order items" ON public.store_order_items;
  CREATE POLICY "Admins can delete order items" ON public.store_order_items FOR DELETE TO authenticated USING (private.is_store_admin());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
`;
