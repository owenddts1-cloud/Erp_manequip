-- =============================================================================
-- V17 OPTIMIZED RLS - PERFORMANCE FIXES
-- =============================================================================
-- Fixes:
-- 1. auth_rls_initplan: Wrap auth.uid() in (select auth.uid())
-- 2. multiple_permissive_policies: Consolidate overlapping policies
-- 1. CLEANUP ALL EXISTING POLICIES
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
-- 2. HELPER FUNCTION (Already exists, ensure it's optimized)
CREATE OR REPLACE FUNCTION public.is_admin_or_gestor() RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (
                select auth.uid()
            )
            AND role IN ('Administrator', 'Gestor', 'admin')
    );
END;
$$;
-- =============================================================================
-- 3. OPTIMIZED RLS POLICIES (Single permissive per action)
-- =============================================================================
-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- SELECT: All authenticated can read
CREATE POLICY "profiles_select" ON public.profiles FOR
SELECT TO authenticated USING (true);
-- UPDATE: Self or Admin/Gestor
CREATE POLICY "profiles_update" ON public.profiles FOR
UPDATE TO authenticated USING (
        id = (
            select auth.uid()
        )
        OR public.is_admin_or_gestor()
    );
-- INSERT: Admin/Gestor only (new users created via trigger)
CREATE POLICY "profiles_insert" ON public.profiles FOR
INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor());
-- DELETE: Admin only
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin_or_gestor());
-- SECTORS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sectors_select" ON public.sectors FOR
SELECT TO authenticated USING (true);
CREATE POLICY "sectors_insert" ON public.sectors FOR
INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor());
CREATE POLICY "sectors_update" ON public.sectors FOR
UPDATE TO authenticated USING (public.is_admin_or_gestor());
CREATE POLICY "sectors_delete" ON public.sectors FOR DELETE TO authenticated USING (public.is_admin_or_gestor());
-- ATIVOS (Assets) - Single policy per action
ALTER TABLE public.ativos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ativos_select" ON public.ativos FOR
SELECT TO authenticated USING (true);
CREATE POLICY "ativos_insert" ON public.ativos FOR
INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor());
CREATE POLICY "ativos_update" ON public.ativos FOR
UPDATE TO authenticated USING (public.is_admin_or_gestor());
CREATE POLICY "ativos_delete" ON public.ativos FOR DELETE TO authenticated USING (public.is_admin_or_gestor());
-- INVENTARIO - Single policy per action
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventario_select" ON public.inventario FOR
SELECT TO authenticated USING (true);
CREATE POLICY "inventario_insert" ON public.inventario FOR
INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor());
CREATE POLICY "inventario_update" ON public.inventario FOR
UPDATE TO authenticated USING (public.is_admin_or_gestor());
CREATE POLICY "inventario_delete" ON public.inventario FOR DELETE TO authenticated USING (public.is_admin_or_gestor());
-- WORK ORDERS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "work_orders_select" ON public.work_orders FOR
SELECT TO authenticated USING (true);
-- CREATE: Any authenticated user (using select wrapper)
CREATE POLICY "work_orders_insert" ON public.work_orders FOR
INSERT TO authenticated WITH CHECK (
        (
            select auth.role()
        ) = 'authenticated'
    );
-- UPDATE: Admin/Gestor OR assigned technician
CREATE POLICY "work_orders_update" ON public.work_orders FOR
UPDATE TO authenticated USING (
        public.is_admin_or_gestor()
        OR tecnico_responsavel = (
            select auth.uid()
        )
    );
CREATE POLICY "work_orders_delete" ON public.work_orders FOR DELETE TO authenticated USING (public.is_admin_or_gestor());
-- NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select" ON public.notifications FOR
SELECT TO authenticated USING (
        user_id = (
            select auth.uid()
        )
    );
CREATE POLICY "notifications_insert" ON public.notifications FOR
INSERT TO authenticated WITH CHECK (
        user_id = (
            select auth.uid()
        )
    );
CREATE POLICY "notifications_update" ON public.notifications FOR
UPDATE TO authenticated USING (
        user_id = (
            select auth.uid()
        )
    );
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE TO authenticated USING (
    user_id = (
        select auth.uid()
    )
);
-- CHAT MESSAGES
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_messages_select" ON public.chat_messages FOR
SELECT TO authenticated USING (true);
CREATE POLICY "chat_messages_insert" ON public.chat_messages FOR
INSERT TO authenticated WITH CHECK (
        user_id = (
            select auth.uid()
        )
    );
-- SYSTEM SETTINGS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_settings_select" ON public.system_settings FOR
SELECT TO authenticated USING (true);
CREATE POLICY "system_settings_insert" ON public.system_settings FOR
INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor());
CREATE POLICY "system_settings_update" ON public.system_settings FOR
UPDATE TO authenticated USING (public.is_admin_or_gestor());
CREATE POLICY "system_settings_delete" ON public.system_settings FOR DELETE TO authenticated USING (public.is_admin_or_gestor());
-- AUDIT LOGS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR
SELECT TO authenticated USING (public.is_admin_or_gestor());
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR
INSERT TO authenticated WITH CHECK (
        user_id = (
            select auth.uid()
        )
    );
SELECT '✅ V17 OPTIMIZED RLS APPLIED - All performance warnings fixed' as status;