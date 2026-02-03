-- =============================================================================
-- V16 DEFINITIVE FIX - SECURE & FUNCTIONAL ROPES
-- =============================================================================
-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- 2. CLEANUP (Remove Old Policies to prevent duplicates/conflicts)
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT policyname,
        tablename
    FROM pg_policies
    WHERE schemaname = 'public'
) LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
END LOOP;
END $$;
-- 3. TABLES (Idempotent Creation)
-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'Técnico',
    job_title TEXT,
    avatar_url TEXT,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Sectors
CREATE TABLE IF NOT EXISTS public.sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Assets (Ativos)
CREATE TABLE IF NOT EXISTS public.ativos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    modelo TEXT,
    numero_serie TEXT,
    setor TEXT,
    status TEXT DEFAULT 'Operacional',
    data_aquisicao DATE,
    valor DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Inventory (Inventario)
CREATE TABLE IF NOT EXISTS public.inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_peca TEXT NOT NULL,
    sku TEXT,
    categoria TEXT,
    localizacao TEXT,
    quantidade_estoque INTEGER DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 5,
    valor_unitario DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Work Orders
CREATE TABLE IF NOT EXISTS public.work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_id TEXT,
    title TEXT,
    tipo TEXT DEFAULT 'Preventiva',
    descricao TEXT,
    prioridade TEXT DEFAULT 'Baixa',
    status TEXT DEFAULT 'Pendente',
    data_limite DATE,
    custo_total DECIMAL(10, 2),
    ativo_id UUID REFERENCES public.ativos(id) ON DELETE
    SET NULL,
        created_by UUID REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        tecnico_responsavel UUID REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        last_edited_by UUID REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    sender_type TEXT CHECK (sender_type IN ('user', 'ai', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    category TEXT,
    is_top_secret BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 4. FUNCTIONS & TRIGGERS
-- Security Helper (Bypass RLS for Admin checks)
CREATE OR REPLACE FUNCTION public.is_admin_or_gestor() RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role IN ('Administrator', 'Gestor', 'admin')
    );
END;
$$;
-- Handle New User (Auto-Profile)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO public.profiles (id, email, full_name, role, is_approved)
VALUES (
        new.id,
        new.email,
        COALESCE(
            new.raw_user_meta_data->>'full_name',
            split_part(new.email, '@', 1)
        ),
        'Técnico',
        false
    ) ON CONFLICT (id) DO NOTHING;
RETURN new;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- 5. RLS POLICIES (STRICT & FUNCTIONAL)
-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles Read" ON public.profiles FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Profiles Update Self" ON public.profiles FOR
UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles Manage" ON public.profiles FOR ALL TO authenticated USING (public.is_admin_or_gestor());
-- SECTORS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sectors Read" ON public.sectors FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Sectors Manage" ON public.sectors FOR ALL TO authenticated USING (public.is_admin_or_gestor());
-- ATIVOS (Assets)
ALTER TABLE public.ativos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ativos Read" ON public.ativos FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Ativos Manage" ON public.ativos FOR ALL TO authenticated USING (public.is_admin_or_gestor());
-- INVENTARIO
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inventario Read" ON public.inventario FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Inventario Manage" ON public.inventario FOR ALL TO authenticated USING (public.is_admin_or_gestor());
-- WORK ORDERS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "WO Read" ON public.work_orders FOR
SELECT TO authenticated USING (true);
CREATE POLICY "WO Create" ON public.work_orders FOR
INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "WO Update" ON public.work_orders FOR
UPDATE TO authenticated USING (
        public.is_admin_or_gestor()
        OR (tecnico_responsavel = auth.uid())
    );
CREATE POLICY "WO Delete" ON public.work_orders FOR DELETE TO authenticated USING (public.is_admin_or_gestor());
-- NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notify Read" ON public.notifications FOR
SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Notify Insert System" ON public.notifications FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- System/Triggers often use service role, but for client-triggered notifs allows all. Refine if needed.
-- MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat Read" ON public.chat_messages FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Chat Send" ON public.chat_messages FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- SYSTEM SETTINGS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings Read" ON public.system_settings FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Settings Manage" ON public.system_settings FOR ALL TO authenticated USING (public.is_admin_or_gestor());
-- AUDIT LOGS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit View" ON public.audit_logs FOR
SELECT TO authenticated USING (public.is_admin_or_gestor());
CREATE POLICY "Audit Insert" ON public.audit_logs FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- 6. DATA SYNC (Ensure Admin is Admin)
INSERT INTO public.sectors (name)
VALUES ('Usinagem'),
    ('Montagem'),
    ('Logística'),
    ('Manutenção'),
    ('Utilidades') ON CONFLICT (name) DO NOTHING;
UPDATE public.profiles
SET role = 'Administrator',
    is_approved = true
WHERE email = 'admin@manequip.com';
SELECT '✅ V16 MIGRATION APPLIED SUCCESSFULLY' as status;