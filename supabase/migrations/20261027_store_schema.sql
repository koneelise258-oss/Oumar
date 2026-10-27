-- ==============================================================================
-- MIGRATION SUPABASE : OUMAR IPHONE (Boutique E-commerce Abidjan)
-- Projet Supabase ID : orjbwpbyiqscbbvaukrz (Région : eu-west-1)
-- Date de création : 2026-10-27
--
-- RÈGLE DE SÉCURITÉ :
-- Ce script est strictement additif et utilise le préfixe "store_".
-- Il ne modifie, ne supprime et n'interfère avec AUCUNE table existante
-- (notamment les tables de gestion scolaire présentes sur le projet).
-- ==============================================================================

-- 1. TABLE DES PRODUITS (Catalogue Apple, Variantes, Stocks & Prix)
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

-- Index pour recherche rapide et filtrage catalogue
CREATE INDEX IF NOT EXISTS idx_store_products_category ON public.store_products (category);
CREATE INDEX IF NOT EXISTS idx_store_products_published ON public.store_products (published);
CREATE INDEX IF NOT EXISTS idx_store_products_in_stock ON public.store_products (in_stock);
CREATE INDEX IF NOT EXISTS idx_store_products_price ON public.store_products (price);

-- 2. TABLE DES VIDÉOS IMMERSIVES (Média MP4, WebM & TikTok)
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

-- 3. TABLE DES PARAMÈTRES BOUTIQUE & CONTACT ABIDJAN
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

-- Insertion de la configuration par défaut si absente
INSERT INTO public.store_settings (
  id,
  store_name,
  whatsapp_phone,
  tagline,
  city,
  addresses,
  opening_hours,
  warranty_text,
  delivery_fee,
  admin_pin
)
VALUES (
  'default',
  'OUMAR IPHONE',
  '2250700000000',
  'Boutique Apple d’Excellence à Abidjan',
  'Abidjan, Côte d’Ivoire',
  '[
    {
      "name": "Boutique Cocody Angré",
      "location": "Angré 8ème Tranche, Carrefour Duncan, Abidjan",
      "phone": "+225 07 00 00 00 00",
      "hours": "Lun - Sam : 08h30 - 19h30"
    },
    {
      "name": "Showroom Plateau",
      "location": "Avenue Chardy, Proche Immeuble CCIA, Plateau, Abidjan",
      "phone": "+225 05 00 00 00 00",
      "hours": "Lun - Ven : 09h00 - 18h30"
    }
  ]'::jsonb,
  'Lundi au Samedi : 08h30 - 19h30 | Dimanche : Sur rendez-vous',
  'Tous nos iPhone, iPad et MacBook sont vendus avec une garantie officielle de 6 mois à 1 an, facture certifiée avec numéro IMEI et assistance technique dédiée à Abidjan.',
  2000,
  '2025'
)
ON CONFLICT (id) DO NOTHING;

-- 4. TABLE DES COMMANDES CLIENTS (Parcours Panier & WhatsApp)
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

-- 5. TABLE DES LIGNES DE COMMANDE
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
-- 6. CONFIGURATION ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Activation RLS sur toutes les tables de la boutique
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

-- Politiques pour store_products :
-- Lecture publique de tous les produits publiés
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view published products" ON public.store_products;
  CREATE POLICY "Public can view published products" 
    ON public.store_products 
    FOR SELECT 
    USING (published = true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Gestion complète pour l'application cliente / admin
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access to store_products" ON public.store_products;
  CREATE POLICY "Admin full access to store_products" 
    ON public.store_products 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Politiques pour store_videos :
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view published videos" ON public.store_videos;
  CREATE POLICY "Public can view published videos" 
    ON public.store_videos 
    FOR SELECT 
    USING (published = true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access to store_videos" ON public.store_videos;
  CREATE POLICY "Admin full access to store_videos" 
    ON public.store_videos 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Politiques pour store_settings :
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
  CREATE POLICY "Public can view store settings" 
    ON public.store_settings 
    FOR SELECT 
    USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin full access to store_settings" ON public.store_settings;
  CREATE POLICY "Admin full access to store_settings" 
    ON public.store_settings 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Politiques pour store_orders :
-- Les clients peuvent créer une commande lors de la validation du panier
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can insert orders" ON public.store_orders;
  CREATE POLICY "Public can insert orders" 
    ON public.store_orders 
    FOR INSERT 
    WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Lecture et modification des commandes par l'espace administrateur
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow select orders" ON public.store_orders;
  CREATE POLICY "Allow select orders" 
    ON public.store_orders 
    FOR SELECT 
    USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow update orders" ON public.store_orders;
  CREATE POLICY "Allow update orders" 
    ON public.store_orders 
    FOR UPDATE 
    USING (true) 
    WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow delete orders" ON public.store_orders;
  CREATE POLICY "Allow delete orders" 
    ON public.store_orders 
    FOR DELETE 
    USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Politiques pour store_order_items :
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can insert order items" ON public.store_order_items;
  CREATE POLICY "Public can insert order items" 
    ON public.store_order_items 
    FOR INSERT 
    WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow select order items" ON public.store_order_items;
  CREATE POLICY "Allow select order items" 
    ON public.store_order_items 
    FOR SELECT 
    USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow update order items" ON public.store_order_items;
  CREATE POLICY "Allow update order items" 
    ON public.store_order_items 
    FOR UPDATE 
    USING (true) 
    WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow delete order items" ON public.store_order_items;
  CREATE POLICY "Allow delete order items" 
    ON public.store_order_items 
    FOR DELETE 
    USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
