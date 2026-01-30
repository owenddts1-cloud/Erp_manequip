-- =============================================================================
-- V15 ULTIMATE - O SCRIPT DEFINITIVO DE "TURO" (REPAROS + FUTURO)
-- Este script:
-- 1. Conserta toda a base (V14)
-- 2. Adiciona tabelas de Comunicação (Chat) e Notificações (Futuro)
-- 3. Cria Gatilhos (Triggers) para AUTOMATIZAR cadastro de usuários
-- =============================================================================
-- EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- =============================================================================
-- PARTE 1: INFRAESTRUTURA & REPAROS (BASE V14)
-- =============================================================================
-- Desativa RLS para evitar bloqueios durante a manutenção
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sectors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ativos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.work_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
-- Limpeza de políticas obsoletas
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
-- -----------------------------------------------------------------------------
-- TABELAS PRINCIPAIS (Cria se não existir)
-- -----------------------------------------------------------------------------
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
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    category TEXT,
    is_top_secret BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- -----------------------------------------------------------------------------
-- PARTE 2: NOVAS FUNCIONALIDADES (COMUNICAÇÃO & MELHORIAS)
-- -----------------------------------------------------------------------------
-- 2.1 CHAT (Mensagens do Assistente/Equipe)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    sender_type TEXT CHECK (sender_type IN ('user', 'ai', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2.2 NOTIFICAÇÕES (Sistema de Avisos Persistente)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    -- info, success, warning, error
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2.3 AUDITORIA (Logs de quem fez o que - Segurança)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    -- 'create_asset', 'delete_user', etc.
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- -----------------------------------------------------------------------------
-- PARTE 3: AUTOMAÇÃO (TRIGGERS) - O "PULO DO GATO"
-- -----------------------------------------------------------------------------
-- Trigger 1: Auto-Criar Perfil ao se Cadastrar (Fim do erro de usuário sumido!)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (id, email, full_name, role, is_approved)
VALUES (
        new.id,
        new.email,
        COALESCE(
            new.raw_user_meta_data->>'full_name',
            split_part(new.email, '@', 1)
        ),
        'Técnico',
        -- Padrão seguro
        false
    ) ON CONFLICT (id) DO NOTHING;
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Remove anterior se existir para evitar duplicação bugada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- Função Auxiliar de Permissão
CREATE OR REPLACE FUNCTION public.is_admin_or_gestor() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role IN ('Administrator', 'Gestor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Sincronização Manual (Garantia para usuários antigos)
INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        is_approved,
        created_at
    )
SELECT id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', email),
    CASE
        WHEN email = 'admin@manequip.com' THEN 'Administrator'
        ELSE 'Técnico'
    END,
    CASE
        WHEN email = 'admin@manequip.com' THEN true
        ELSE false
    END,
    created_at
FROM auth.users ON CONFLICT (id) DO
UPDATE
SET role = CASE
        WHEN EXCLUDED.email = 'admin@manequip.com' THEN 'Administrator'
        ELSE public.profiles.role
    END;
-- -----------------------------------------------------------------------------
-- PARTE 4: SEGURANÇA FINAL (RLS)
-- -----------------------------------------------------------------------------
-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read Profiles" ON public.profiles FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Manage Profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin_or_gestor());
-- ATIVOS & INVENTARIO & SECTORES & SETTINGS
ALTER TABLE public.ativos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read Ativos" ON public.ativos FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Manage Ativos" ON public.ativos FOR ALL TO authenticated USING (public.is_admin_or_gestor());
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read Inventario" ON public.inventario FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Manage Inventario" ON public.inventario FOR ALL TO authenticated USING (public.is_admin_or_gestor());
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read Sectors" ON public.sectors FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Manage Sectors" ON public.sectors FOR ALL TO authenticated USING (public.is_admin_or_gestor());
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read Settings" ON public.system_settings FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Manage Settings" ON public.system_settings FOR ALL TO authenticated USING (public.is_admin_or_gestor());
-- WORK ORDERS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read WO" ON public.work_orders FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Create WO" ON public.work_orders FOR
INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Manage WO" ON public.work_orders FOR
UPDATE TO authenticated USING (public.is_admin_or_gestor());
CREATE POLICY "Delete WO" ON public.work_orders FOR DELETE TO authenticated USING (public.is_admin_or_gestor());
-- CHAT (Novo)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read Chat" ON public.chat_messages FOR
SELECT TO authenticated USING (true);
-- Todos veem (Chat Geral)
CREATE POLICY "Send Chat" ON public.chat_messages FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- NOTIFICATIONS (Novo)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read Own Notifs" ON public.notifications FOR
SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System Send Notifs" ON public.notifications FOR
INSERT TO authenticated WITH CHECK (true);
-- Sistema/Triggers criam
-- -----------------------------------------------------------------------------
-- PARTE 5: DADOS PADRÃO
-- -----------------------------------------------------------------------------
INSERT INTO public.sectors (name)
VALUES ('Usinagem'),
    ('Montagem'),
    ('Logística'),
    ('Utilidades') ON CONFLICT (name) DO NOTHING;
SELECT '✅ V15 ULTIMATE APLICADO COM SUCESSO! Sistema Blindado e Atualizado.' as status;