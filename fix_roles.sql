-- Script para corrigir permanentemente as Roles e as Políticas de Segurança (RLS)

-- 1. Restaurar e Garantir a Hierarquia de Master Admins
UPDATE public.profiles 
SET role = 'Administrator', is_approved = true 
WHERE email IN ('admin@manequip.com', 'data@manequip.com');

-- 2. Limpar todas as políticas antigas que podem estar bloqueando os Técnicos
DO $$
DECLARE r RECORD;
BEGIN 
    FOR r IN (
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename IN ('ativos', 'work_orders', 'inventario', 'sectors', 'profiles')
    ) LOOP 
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;

-- 3. Habilitar RLS novamente para segurança
ALTER TABLE public.ativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- 4. PERMISSÕES DE LEITURA (SELECT) - TODOS PODEM VER TUDO!
-- ==========================================================
CREATE POLICY "ativos_select" ON public.ativos FOR SELECT TO authenticated USING (true);
CREATE POLICY "work_orders_select" ON public.work_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventario_select" ON public.inventario FOR SELECT TO authenticated USING (true);
CREATE POLICY "sectors_select" ON public.sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);

-- ==========================================================
-- 5. PERMISSÕES DE ESCRITA BASEADAS EM ROLE (HIERARQUIA)
-- ==========================================================

-- ATIVOS
-- Admin e Gestor: Inserir, Atualizar, Deletar. Técnico: Nenhum acesso de escrita.
CREATE POLICY "ativos_insert" ON public.ativos FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Administrator', 'Gestor')));

CREATE POLICY "ativos_update" ON public.ativos FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Administrator', 'Gestor')));

CREATE POLICY "ativos_delete" ON public.ativos FOR DELETE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Administrator', 'Gestor')));


-- INVENTARIO
-- Admin e Gestor: Inserir, Atualizar, Deletar. Técnico: Nenhum acesso de escrita.
CREATE POLICY "inventario_insert" ON public.inventario FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Administrator', 'Gestor')));

CREATE POLICY "inventario_update" ON public.inventario FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Administrator', 'Gestor')));

CREATE POLICY "inventario_delete" ON public.inventario FOR DELETE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Administrator', 'Gestor')));


-- SETORES (SECTORS)
-- Admin e Gestor: Gerenciar. Técnico: Somente Leitura.
CREATE POLICY "sectors_insert" ON public.sectors FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Administrator', 'Gestor')));

CREATE POLICY "sectors_update" ON public.sectors FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Administrator', 'Gestor')));

CREATE POLICY "sectors_delete" ON public.sectors FOR DELETE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Administrator', 'Gestor')));


-- ORDENS DE SERVIÇO (WORK ORDERS)
-- TODOS (incluindo Técnico) podem Inserir e Atualizar.
-- SOMENTE Admin e Gestor podem Deletar.
CREATE POLICY "work_orders_insert" ON public.work_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "work_orders_update" ON public.work_orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "work_orders_delete" ON public.work_orders FOR DELETE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Administrator', 'Gestor')));


-- PERFIS (PROFILES)
-- O Próprio Usuário pode atualizar suas informações básicas (não o nível de acesso).
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Admin e Gestor podem Inserir e Atualizar outros perfis (aprovar usuários, etc.)
CREATE POLICY "profiles_update_admin_gestor" ON public.profiles FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role IN ('Administrator', 'Gestor')));

CREATE POLICY "profiles_insert_admin_gestor" ON public.profiles FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role IN ('Administrator', 'Gestor')));

-- SOMENTE Administrador pode DELETAR perfis
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'Administrator'));
