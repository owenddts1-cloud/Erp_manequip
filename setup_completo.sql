-- =============================================================================
-- FULL SCHEMA + RLS + ADMIN SETUP FOR MANEQUIP
-- COLE TUDO ISSO NO "SQL EDITOR" DO SUPABASE E CLIQUE EM "RUN"
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- 2. CLEANUP (Remove Old Policies)
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
) LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
END LOOP;
END $$;

-- 3. TABLES
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

CREATE TABLE IF NOT EXISTS public.sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ativos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_id TEXT,
    nome TEXT NOT NULL,
    modelo TEXT,
    setor TEXT,
    criticidade TEXT DEFAULT 'Baixa',
    status TEXT DEFAULT 'Operacional',
    data_aquisicao DATE,
    custo_aquisicao DECIMAL(10, 2),
    saude INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adjust table public.ativos dynamically if it already exists with legacy column names
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ativos' AND column_name='numero_serie') THEN
        ALTER TABLE public.ativos RENAME COLUMN numero_serie TO tag_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ativos' AND column_name='valor') THEN
        ALTER TABLE public.ativos RENAME COLUMN valor TO custo_aquisicao;
    END IF;
END $$;

-- Add new columns to ativos if not already present
ALTER TABLE public.ativos ADD COLUMN IF NOT EXISTS criticidade TEXT DEFAULT 'Baixa';
ALTER TABLE public.ativos ADD COLUMN IF NOT EXISTS saude INTEGER DEFAULT 100;
ALTER TABLE public.ativos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fill NULL criticalities and health values
UPDATE public.ativos SET saude = 100 WHERE saude IS NULL;
UPDATE public.ativos SET criticidade = 'Baixa' WHERE criticidade IS NULL;

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
    ativo_id UUID REFERENCES public.ativos(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tecnico_responsavel UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    last_edited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    sender_type TEXT CHECK (sender_type IN ('user', 'ai', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    category TEXT,
    is_top_secret BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    changes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 4. HELPER FUNCTIONS FOR RLS & TRIGGERS
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role = 'Administrator'
            AND is_approved = true
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_gestor() RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role IN ('Administrator', 'Gestor')
            AND is_approved = true
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_approved_user() RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND is_approved = true
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_user_approval_status(user_email text)
RETURNS TABLE (email_exists boolean, is_approved boolean)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT true, p.is_approved
    FROM public.profiles p
    WHERE LOWER(TRIM(p.email)) = LOWER(TRIM(user_email))
    LIMIT 1;
END;
$$;

-- 5. DB TRIGGERS
-- Trigger to handle automatically mapping user role and job_title on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE
    default_role TEXT := 'Técnico';
    default_approved BOOLEAN := false;
    meta_job TEXT;
BEGIN
    meta_job := COALESCE(new.raw_user_meta_data->>'job_title', '');
    
    IF new.email IN ('admin@manequip.com', 'data@manequip.com') THEN
        default_role := 'Administrator';
        default_approved := true;
    ELSIF meta_job IN ('gestor', 'engenheiro') THEN
        default_role := 'Gestor';
        default_approved := false;
    ELSE
        default_role := 'Técnico';
        default_approved := false;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, job_title, is_approved)
    VALUES (
        new.id,
        new.email,
        COALESCE(
            new.raw_user_meta_data->>'full_name',
            split_part(new.email, '@', 1)
        ),
        default_role,
        meta_job,
        default_approved
    ) ON CONFLICT (id) DO UPDATE
    SET role = EXCLUDED.role,
        is_approved = EXCLUDED.is_approved,
        job_title = EXCLUDED.job_title;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to auto-confirm user email in auth.users when approved
CREATE OR REPLACE FUNCTION public.confirm_approved_user_email() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_approved = true AND (TG_OP = 'INSERT' OR OLD.is_approved = false OR OLD.is_approved IS NULL) THEN
        UPDATE auth.users
        SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_approved ON public.profiles;
CREATE TRIGGER on_profile_approved
AFTER INSERT OR UPDATE OF is_approved ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.confirm_approved_user_email();

-- Trigger to prevent regular users from escalating their own roles/approvals
CREATE OR REPLACE FUNCTION public.preserve_profile_roles() RETURNS TRIGGER AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin_or_gestor() THEN
        NEW.role := OLD.role;
        NEW.is_approved := OLD.is_approved;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS before_profile_update ON public.profiles;
CREATE TRIGGER before_profile_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.preserve_profile_roles();

-- Audit log helper
CREATE OR REPLACE FUNCTION log_audit_event(
    action_type text,
    resource_name text,
    resource_id text DEFAULT NULL,
    changes jsonb DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, resource, resource_id, changes)
    VALUES (
        auth.uid(),
        action_type,
        resource_name,
        resource_id,
        changes
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin_or_gestor());
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor());
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin());

-- Sectors RLS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sectors_select" ON public.sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "sectors_insert" ON public.sectors FOR INSERT TO authenticated WITH CHECK (public.is_approved_user());
CREATE POLICY "sectors_update" ON public.sectors FOR UPDATE TO authenticated USING (public.is_approved_user());
CREATE POLICY "sectors_delete" ON public.sectors FOR DELETE TO authenticated USING (public.is_approved_user());

-- Ativos RLS
ALTER TABLE public.ativos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ativos_select" ON public.ativos FOR SELECT TO authenticated USING (true);
CREATE POLICY "ativos_insert" ON public.ativos FOR INSERT TO authenticated WITH CHECK (public.is_approved_user());
CREATE POLICY "ativos_update" ON public.ativos FOR UPDATE TO authenticated USING (public.is_approved_user());
CREATE POLICY "ativos_delete" ON public.ativos FOR DELETE TO authenticated USING (public.is_approved_user());

-- Inventario RLS
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventario_select" ON public.inventario FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventario_insert" ON public.inventario FOR INSERT TO authenticated WITH CHECK (public.is_approved_user());
CREATE POLICY "inventario_update" ON public.inventario FOR UPDATE TO authenticated USING (public.is_approved_user());
CREATE POLICY "inventario_delete" ON public.inventario FOR DELETE TO authenticated USING (public.is_approved_user());

-- Work Orders RLS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "work_orders_select" ON public.work_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "work_orders_insert" ON public.work_orders FOR INSERT TO authenticated WITH CHECK (public.is_approved_user());
CREATE POLICY "work_orders_update" ON public.work_orders FOR UPDATE TO authenticated USING (public.is_approved_user());
CREATE POLICY "work_orders_delete" ON public.work_orders FOR DELETE TO authenticated USING (public.is_admin_or_gestor());

-- Notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Messages RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_messages_select" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "chat_messages_insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- System Settings RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_settings_select" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "system_settings_insert" ON public.system_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor());
CREATE POLICY "system_settings_update" ON public.system_settings FOR UPDATE TO authenticated USING (public.is_admin_or_gestor());
CREATE POLICY "system_settings_delete" ON public.system_settings FOR DELETE TO authenticated USING (public.is_admin_or_gestor());

-- Audit Logs RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin_or_gestor());
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 7. DATA INITIALIZATION & ADMIN INJECTION
INSERT INTO public.sectors (name)
VALUES ('Usinagem'), ('Montagem'), ('Logística'), ('Manutenção'), ('Utilidades') 
ON CONFLICT (name) DO NOTHING;

-- Inject Admin User directly into auth.users
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@manequip.com',
    extensions.crypt('AdminPassword123!', extensions.gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Administrador Sistema","job_title":"Gestor Geral"}',
    current_timestamp,
    current_timestamp,
    '', '', '', ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@manequip.com'
);

-- Inject Data Admin User directly into auth.users
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'data@manequip.com',
    extensions.crypt('@data', extensions.gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Data Admin","job_title":"Data Administrator"}',
    current_timestamp,
    current_timestamp,
    '', '', '', ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'data@manequip.com'
);

-- Sync profiles for both admins
INSERT INTO public.profiles (id, email, full_name, role, is_approved)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'Admin'), 'Administrator', true
FROM auth.users
WHERE email IN ('admin@manequip.com', 'data@manequip.com')
ON CONFLICT (id) DO UPDATE
SET role = 'Administrator', is_approved = true;

-- 8. PREVENTIVE MAINTENANCE SCHEMAS
CREATE TABLE IF NOT EXISTS public.preventivas_planejamento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ativo_id UUID REFERENCES public.ativos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    periodicidade TEXT CHECK (periodicidade IN ('Semanal', 'Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual')),
    meses_execucao INTEGER[] NOT NULL, -- Array of months (e.g. [1, 7] for Jan and Jul)
    icone TEXT DEFAULT 'precision_manufacturing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.preventivas_mensais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    planejamento_id UUID REFERENCES public.preventivas_planejamento(id) ON DELETE SET NULL,
    ativo_id UUID REFERENCES public.ativos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    mes INTEGER CHECK (mes BETWEEN 1 AND 12),
    ano INTEGER NOT NULL,
    tecnico_responsavel UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tecnico_responsavel_2 UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Em aberto' CHECK (status IN ('Em aberto', 'Em atendimento', 'Concluído')),
    icone TEXT DEFAULT 'precision_manufacturing',
    data_limite DATE,
    concluido_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policies for preventivas_planejamento
ALTER TABLE public.preventivas_planejamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "preventivas_planejamento_select" ON public.preventivas_planejamento FOR SELECT TO authenticated USING (true);
CREATE POLICY "preventivas_planejamento_insert" ON public.preventivas_planejamento FOR INSERT TO authenticated WITH CHECK (public.is_approved_user());
CREATE POLICY "preventivas_planejamento_update" ON public.preventivas_planejamento FOR UPDATE TO authenticated USING (public.is_approved_user());
CREATE POLICY "preventivas_planejamento_delete" ON public.preventivas_planejamento FOR DELETE TO authenticated USING (public.is_approved_user());

-- Policies for preventivas_mensais
ALTER TABLE public.preventivas_mensais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "preventivas_mensais_select" ON public.preventivas_mensais FOR SELECT TO authenticated USING (true);
CREATE POLICY "preventivas_mensais_insert" ON public.preventivas_mensais FOR INSERT TO authenticated WITH CHECK (public.is_approved_user());
CREATE POLICY "preventivas_mensais_update" ON public.preventivas_mensais FOR UPDATE TO authenticated USING (public.is_approved_user());
CREATE POLICY "preventivas_mensais_delete" ON public.preventivas_mensais FOR DELETE TO authenticated USING (public.is_approved_user());

SELECT '✅ MANEQUIP MASTER SETUP COMPLETED SUCCESSFULLY' as status;
