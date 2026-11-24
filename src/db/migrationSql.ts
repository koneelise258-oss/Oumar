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

-- 3. TABLE DES VIDÉOS IMMERSIVES (Média MP4, MOV, WebM & TikTok)
CREATE TABLE IF NOT EXISTS public.store_videos (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'html5' CHECK (type IN ('html5', 'tiktok')),
  title TEXT,
  description TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE public.store_videos ADD COLUMN IF NOT EXISTS description TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_store_videos_order ON public.store_videos (display_order ASC);
CREATE INDEX IF NOT EXISTS idx_store_videos_published ON public.store_videos (published);

-- 4. TABLE DES PARAMÈTRES BOUTIQUE ABIDJAN (Retrait boutique & WhatsApp normalisé — sans admin_pin)
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  store_name TEXT NOT NULL DEFAULT 'OUMAR IPHONE',
  whatsapp_phone TEXT NOT NULL DEFAULT '2250161443637',
  tagline TEXT DEFAULT 'Boutique Apple d’Excellence à Abidjan',
  city TEXT DEFAULT 'Abidjan, Côte d’Ivoire',
  addresses JSONB DEFAULT '[]'::jsonb,
  opening_hours TEXT DEFAULT 'Lundi au Samedi : 08h30 - 19h30 | Dimanche : Sur rendez-vous',
  warranty_text TEXT,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  hero_photo_custom TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suppression définitive de l'ancienne colonne admin_pin si elle existait
DO $$ BEGIN
  ALTER TABLE public.store_settings DROP COLUMN IF EXISTS admin_pin;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

INSERT INTO public.store_settings (
  id, store_name, whatsapp_phone, tagline, city, addresses, opening_hours, warranty_text, delivery_fee
)
VALUES (
  'default',
  'OUMAR IPHONE',
  '2250161443637',
  'Boutique Apple d’Excellence à Abidjan',
  'Abidjan, Côte d’Ivoire',
  '[
    {"name": "Boutique OUMAR IPHONE Abidjan", "location": "Abidjan, Côte d’Ivoire (Retrait en boutique)", "phone": "+225 01 61 44 36 37", "hours": "Lun - Sam : 08h30 - 19h30"}
  ]'::jsonb,
  'Lundi au Samedi : 08h30 - 19h30 | Dimanche : Sur rendez-vous',
  'Tous nos iPhone, iPad et MacBook sont vendus avec facture certifiée, numéro IMEI et garantie officielle.',
  0
)
ON CONFLICT (id) DO UPDATE SET
  whatsapp_phone = '2250161443637',
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
            WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL
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
            WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL
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
-- Comporte une sécurité stricte exigeant un compte superadministrateur actif pour toute modification.
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

  -- RLS stricte sur store_product_variants si présente
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'store_product_variants') THEN
    ALTER TABLE public.store_product_variants ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public can view published variants" ON public.store_product_variants;
    CREATE POLICY "Public can view published variants" ON public.store_product_variants FOR SELECT USING (published = true OR private.is_store_admin());
    DROP POLICY IF EXISTS "Admins can manage variants" ON public.store_product_variants;
    CREATE POLICY "Admins can manage variants" ON public.store_product_variants FOR ALL TO authenticated USING (private.is_store_admin()) WITH CHECK (private.is_store_admin());
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 11. PROTECTION ANTI-VERROUILLAGE SUPERADMIN & JOURNAL D'AUDIT DE SÉCURITÉ
CREATE OR REPLACE FUNCTION private.protect_last_superadmin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_remaining INT;
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.role = 'superadmin' AND OLD.is_active = true)
     OR (TG_OP = 'UPDATE' AND OLD.role = 'superadmin' AND OLD.is_active = true AND (NEW.role <> 'superadmin' OR NEW.is_active = false)) THEN
    SELECT COUNT(*) INTO v_remaining FROM public.store_admins WHERE role = 'superadmin' AND is_active = true AND id <> OLD.id;
    IF v_remaining = 0 THEN
      RAISE EXCEPTION 'Sécurité : impossible de supprimer ou désactiver le dernier superadministrateur actif.';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_last_superadmin ON public.store_admins;
CREATE TRIGGER trg_protect_last_superadmin
  BEFORE UPDATE OR DELETE ON public.store_admins
  FOR EACH ROW EXECUTE FUNCTION private.protect_last_superadmin();

CREATE TABLE IF NOT EXISTS public.store_security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID DEFAULT auth.uid(),
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.store_security_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can read audit logs" ON public.store_security_audit_logs;
  CREATE POLICY "Admins can read audit logs" ON public.store_security_audit_logs FOR SELECT TO authenticated USING (private.is_store_admin());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 12. SÉCURISATION SUPABASE STORAGE (store-products : images + vidéos MP4/MOV/WebM, 50 Mo max, blocage SVG, écriture admins uniquement)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'store-products') THEN
    UPDATE storage.buckets
    SET file_size_limit = 52428800, allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v']
    WHERE id = 'store-products';
  END IF;
  DROP POLICY IF EXISTS "Public read store-products" ON storage.objects;
  CREATE POLICY "Public read store-products" ON storage.objects FOR SELECT USING (bucket_id = 'store-products');
  DROP POLICY IF EXISTS "Admins upload store-products" ON storage.objects;
  CREATE POLICY "Admins upload store-products" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'store-products' AND private.is_store_admin());
  DROP POLICY IF EXISTS "Admins update store-products" ON storage.objects;
  CREATE POLICY "Admins update store-products" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'store-products' AND private.is_store_admin()) WITH CHECK (bucket_id = 'store-products' AND private.is_store_admin());
  DROP POLICY IF EXISTS "Admins delete store-products" ON storage.objects;
  CREATE POLICY "Admins delete store-products" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'store-products' AND private.is_store_admin());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 13. ANALYTICS & TRAFIC VISITEURS (Écriture via RPC validé, lecture/suppression strictement réservée aux admins)
CREATE TABLE IF NOT EXISTS public.store_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'page_view',
      'heartbeat',
      'product_click',
      'product_view',
      'add_to_cart',
      'whatsapp_click',
      'whatsapp_order'
    )
  ),
  product_id TEXT,
  product_name TEXT,
  product_image TEXT,
  variant_label TEXT,
  amount BIGINT DEFAULT 0,
  customer_label TEXT,
  device_type TEXT DEFAULT 'Mobile',
  viewport TEXT,
  page_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_analytics_created_at ON public.store_analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_analytics_event_type ON public.store_analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_store_analytics_visitor_id ON public.store_analytics_events (visitor_id);
CREATE INDEX IF NOT EXISTS idx_store_analytics_product_id ON public.store_analytics_events (product_id);

ALTER TABLE public.store_analytics_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can read analytics events" ON public.store_analytics_events;
  CREATE POLICY "Admins can read analytics events" ON public.store_analytics_events
    FOR SELECT TO authenticated USING (private.is_store_admin());
  DROP POLICY IF EXISTS "Admins can delete analytics events" ON public.store_analytics_events;
  CREATE POLICY "Admins can delete analytics events" ON public.store_analytics_events
    FOR DELETE TO authenticated USING (private.is_store_admin());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.log_store_analytics_event(
  p_visitor_id TEXT,
  p_session_id TEXT,
  p_event_type TEXT,
  p_product_id TEXT DEFAULT NULL,
  p_product_name TEXT DEFAULT NULL,
  p_product_image TEXT DEFAULT NULL,
  p_variant_label TEXT DEFAULT NULL,
  p_amount BIGINT DEFAULT 0,
  p_customer_label TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT 'Mobile',
  p_viewport TEXT DEFAULT NULL,
  p_page_path TEXT DEFAULT '/'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_visitor_id IS NULL OR LENGTH(TRIM(p_visitor_id)) < 4 THEN
    RETURN false;
  END IF;
  IF p_session_id IS NULL OR LENGTH(TRIM(p_session_id)) < 4 THEN
    RETURN false;
  END IF;
  IF p_event_type NOT IN (
    'page_view',
    'heartbeat',
    'product_click',
    'product_view',
    'add_to_cart',
    'whatsapp_click',
    'whatsapp_order'
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.store_analytics_events (
    visitor_id,
    session_id,
    event_type,
    product_id,
    product_name,
    product_image,
    variant_label,
    amount,
    customer_label,
    device_type,
    viewport,
    page_path
  ) VALUES (
    LEFT(TRIM(p_visitor_id), 80),
    LEFT(TRIM(p_session_id), 80),
    p_event_type,
    NULLIF(LEFT(TRIM(COALESCE(p_product_id, '')), 120), ''),
    NULLIF(LEFT(TRIM(COALESCE(p_product_name, '')), 160), ''),
    NULLIF(LEFT(TRIM(COALESCE(p_product_image, '')), 600), ''),
    NULLIF(LEFT(TRIM(COALESCE(p_variant_label, '')), 180), ''),
    GREATEST(0, COALESCE(p_amount, 0)),
    NULLIF(LEFT(TRIM(COALESCE(p_customer_label, '')), 120), ''),
    COALESCE(NULLIF(LEFT(TRIM(COALESCE(p_device_type, '')), 40), ''), 'Mobile'),
    NULLIF(LEFT(TRIM(COALESCE(p_viewport, '')), 40), ''),
    COALESCE(NULLIF(LEFT(TRIM(COALESCE(p_page_path, '')), 200), ''), '/')
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.log_store_analytics_event(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_store_analytics_event(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
`;
