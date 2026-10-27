-- ==============================================================================
-- MIGRATION SUPABASE : OUMAR IPHONE (Boutique E-commerce Abidjan)
-- Projet Supabase ID : orjbwpbyiqscbbvaukrz (Région : eu-west-1)
--
-- RÈGLE DE SÉCURITÉ ABSOLUE :
-- Ce script est strictement additif et préfixe toutes ses tables par "store_".
-- Il n'altère, ne supprime et n'interfère avec AUCUNE table existante
-- (notamment les tables de gestion scolaire présentes sur le projet).
-- ==============================================================================

-- 1. TABLE DES ADMINISTRATEURS AUTORISÉS (Supabase Auth RBAC)
CREATE TABLE IF NOT EXISTS public.store_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
CREATE INDEX IF NOT EXISTS idx_store_products_price ON public.store_products (price);

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

-- 4. TABLE DES PARAMÈTRES BOUTIQUE ABIDJAN
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  store_name TEXT NOT NULL DEFAULT 'OUMAR IPHONE',
  whatsapp_phone TEXT NOT NULL DEFAULT '2250700000000',
  tagline TEXT DEFAULT 'Boutique Apple d’Excellence à Abidjan',
  city TEXT DEFAULT 'Abidjan, Côte d’Ivoire',
  addresses JSONB DEFAULT '[]'::jsonb,
  opening_hours TEXT DEFAULT 'Lundi au Samedi : 08h30 - 19h30 | Dimanche : Sur rendez-vous',
  warranty_text TEXT,
  delivery_fee INTEGER NOT NULL DEFAULT 2000,
  admin_pin TEXT NOT NULL DEFAULT '2025',
  hero_photo_custom TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertion des paramètres par défaut si absents
INSERT INTO public.store_settings (
  id, store_name, whatsapp_phone, tagline, city, addresses, opening_hours, warranty_text, delivery_fee, admin_pin
)
VALUES (
  'default',
  'OUMAR IPHONE',
  '2250700000000',
  'Boutique Apple d’Excellence à Abidjan',
  'Abidjan, Côte d’Ivoire',
  '[
    {"name": "Boutique Cocody Angré", "location": "Angré 8ème Tranche, Carrefour Duncan, Abidjan", "phone": "+225 07 00 00 00 00", "hours": "Lun - Sam : 08h30 - 19h30"},
    {"name": "Showroom Plateau", "location": "Avenue Chardy, Proche Immeuble CCIA, Plateau, Abidjan", "phone": "+225 05 00 00 00 00", "hours": "Lun - Ven : 09h00 - 18h30"}
  ]'::jsonb,
  'Lundi au Samedi : 08h30 - 19h30 | Dimanche : Sur rendez-vous',
  'Tous nos iPhone, iPad et MacBook sont vendus avec une garantie officielle de 6 mois à 1 an, facture certifiée avec numéro IMEI et assistance technique dédiée à Abidjan.',
  2000,
  '2025'
)
ON CONFLICT (id) DO NOTHING;

-- 5. TABLE DES COMMANDES CLIENTS (Aucune donnée fictive)
CREATE TABLE IF NOT EXISTS public.store_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  commune TEXT NOT NULL,
  subtotal BIGINT NOT NULL DEFAULT 0,
  delivery_fee BIGINT NOT NULL DEFAULT 2000,
  total BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_delivery', 'delivered', 'cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'Paiement à la livraison',
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

-- ==============================================================================
-- 7. FONCTION DE SÉCURITÉ : VÉRIFICATION D'ADMINISTRATEUR (HELPER)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_store_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_admins
    WHERE user_id = auth.uid()
       OR LOWER(email) = LOWER(auth.jwt()->>'email')
  );
$$;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) RENFORCÉ ET AUDITÉ
-- ==============================================================================
ALTER TABLE public.store_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

-- Politiques pour store_admins :
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can view admins" ON public.store_admins;
  CREATE POLICY "Admins can view admins" ON public.store_admins
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt()->>'email') OR public.is_store_admin());

  DROP POLICY IF EXISTS "Superadmins can manage admins" ON public.store_admins;
  CREATE POLICY "Superadmins can manage admins" ON public.store_admins
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.store_admins WHERE user_id = auth.uid() AND role = 'superadmin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.store_admins WHERE user_id = auth.uid() AND role = 'superadmin'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Politiques pour store_products :
-- Lecture publique UNIQUEMENT des produits publiés (ou lecture intégrale pour admin)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view published products" ON public.store_products;
  CREATE POLICY "Public can view published products" ON public.store_products
    FOR SELECT
    USING (published = true OR public.is_store_admin());

  DROP POLICY IF EXISTS "Admins can manage products" ON public.store_products;
  CREATE POLICY "Admins can manage products" ON public.store_products
    FOR ALL TO authenticated
    USING (public.is_store_admin())
    WITH CHECK (public.is_store_admin());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Politiques pour store_videos :
-- Lecture publique UNIQUEMENT des vidéos publiées
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view published videos" ON public.store_videos;
  CREATE POLICY "Public can view published videos" ON public.store_videos
    FOR SELECT
    USING (published = true OR public.is_store_admin());

  DROP POLICY IF EXISTS "Admins can manage videos" ON public.store_videos;
  CREATE POLICY "Admins can manage videos" ON public.store_videos
    FOR ALL TO authenticated
    USING (public.is_store_admin())
    WITH CHECK (public.is_store_admin());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Politiques pour store_settings :
-- Lecture publique des paramètres
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
  CREATE POLICY "Public can view store settings" ON public.store_settings
    FOR SELECT
    USING (true);

  DROP POLICY IF EXISTS "Admins can update settings" ON public.store_settings;
  CREATE POLICY "Admins can update settings" ON public.store_settings
    FOR UPDATE TO authenticated
    USING (public.is_store_admin())
    WITH CHECK (public.is_store_admin());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Politiques pour store_orders & store_order_items :
-- AUCUNE LECTURE PUBLIQUE DES COMMANDES CLIENTS (Confidentialité stricte des coordonnées)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can insert orders" ON public.store_orders;
  CREATE POLICY "Public can insert orders" ON public.store_orders
    FOR INSERT
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Public can insert order items" ON public.store_order_items;
  CREATE POLICY "Public can insert order items" ON public.store_order_items
    FOR INSERT
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Admins can view orders" ON public.store_orders;
  CREATE POLICY "Admins can view orders" ON public.store_orders
    FOR SELECT TO authenticated
    USING (public.is_store_admin());

  DROP POLICY IF EXISTS "Admins can view order items" ON public.store_order_items;
  CREATE POLICY "Admins can view order items" ON public.store_order_items
    FOR SELECT TO authenticated
    USING (public.is_store_admin());

  DROP POLICY IF EXISTS "Admins can update orders" ON public.store_orders;
  CREATE POLICY "Admins can update orders" ON public.store_orders
    FOR UPDATE TO authenticated
    USING (public.is_store_admin())
    WITH CHECK (public.is_store_admin());

  DROP POLICY IF EXISTS "Admins can delete orders" ON public.store_orders;
  CREATE POLICY "Admins can delete orders" ON public.store_orders
    FOR DELETE TO authenticated
    USING (public.is_store_admin());

  DROP POLICY IF EXISTS "Admins can update order items" ON public.store_order_items;
  CREATE POLICY "Admins can update order items" ON public.store_order_items
    FOR UPDATE TO authenticated
    USING (public.is_store_admin())
    WITH CHECK (public.is_store_admin());

  DROP POLICY IF EXISTS "Admins can delete order items" ON public.store_order_items;
  CREATE POLICY "Admins can delete order items" ON public.store_order_items
    FOR DELETE TO authenticated
    USING (public.is_store_admin());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
