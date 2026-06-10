-- =============================================================================
-- PROJECTS SCHEMA + RLS + SEED DATA FOR MANEQUIP
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE FORNECEDORES
CREATE TABLE IF NOT EXISTS public.project_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 0,
    compliance INTEGER DEFAULT 100,
    specialty TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE PROJETOS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT,
    previsto DECIMAL(12, 2) DEFAULT 0,
    faturado DECIMAL(12, 2) DEFAULT 0,
    desvios DECIMAL(12, 2) DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    status TEXT DEFAULT 'Em Execução' CHECK (status IN ('Em Execução', 'Prazos Críticos', 'Concluído')),
    coordinator TEXT,
    team TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE CRONOGRAMA / MARCOS
CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Pendente' CHECK (status IN ('Concluído', 'Em Execução', 'Atrasado', 'Pendente')),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE ITENS DE CUSTO / EAP
CREATE TABLE IF NOT EXISTS public.project_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    phase TEXT NOT NULL,
    budget DECIMAL(12, 2) DEFAULT 0,
    actual DECIMAL(12, 2) DEFAULT 0,
    category TEXT NOT NULL,
    responsible TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE ITENS DE MATERIAIS
CREATE TABLE IF NOT EXISTS public.project_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    qty_budget DECIMAL(12, 2) DEFAULT 0,
    qty_used DECIMAL(12, 2) DEFAULT 0,
    unit TEXT,
    supplier TEXT,
    responsible TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE REQUISIÇÕES DE COMPRAS
CREATE TABLE IF NOT EXISTS public.project_requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    material TEXT NOT NULL,
    qty TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT DEFAULT 'Em Cotação' CHECK (status IN ('Em Cotação', 'Aprovado', 'Aguardando Entrega', 'Entregue')),
    approved_supplier TEXT,
    approved_price DECIMAL(12, 2),
    options JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.project_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_requisitions ENABLE ROW LEVEL SECURITY;

-- 8. CRIAR POLÍTICAS DE SEGURANÇA (RLS)
DROP POLICY IF EXISTS "suppliers_select" ON public.project_suppliers;
DROP POLICY IF EXISTS "suppliers_write" ON public.project_suppliers;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_write" ON public.projects;
DROP POLICY IF EXISTS "milestones_select" ON public.project_milestones;
DROP POLICY IF EXISTS "milestones_write" ON public.project_milestones;
DROP POLICY IF EXISTS "costs_select" ON public.project_costs;
DROP POLICY IF EXISTS "costs_write" ON public.project_costs;
DROP POLICY IF EXISTS "materials_select" ON public.project_materials;
DROP POLICY IF EXISTS "materials_write" ON public.project_materials;
DROP POLICY IF EXISTS "requisitions_select" ON public.project_requisitions;
DROP POLICY IF EXISTS "requisitions_write" ON public.project_requisitions;

CREATE POLICY "suppliers_select" ON public.project_suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "suppliers_write" ON public.project_suppliers FOR ALL TO authenticated USING (public.is_admin_or_gestor()) WITH CHECK (public.is_admin_or_gestor());

CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_write" ON public.projects FOR ALL TO authenticated USING (public.is_admin_or_gestor()) WITH CHECK (public.is_admin_or_gestor());

CREATE POLICY "milestones_select" ON public.project_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "milestones_write" ON public.project_milestones FOR ALL TO authenticated USING (public.is_admin_or_gestor()) WITH CHECK (public.is_admin_or_gestor());

CREATE POLICY "costs_select" ON public.project_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "costs_write" ON public.project_costs FOR ALL TO authenticated USING (public.is_admin_or_gestor()) WITH CHECK (public.is_admin_or_gestor());

CREATE POLICY "materials_select" ON public.project_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "materials_write" ON public.project_materials FOR ALL TO authenticated USING (public.is_admin_or_gestor()) WITH CHECK (public.is_admin_or_gestor());

CREATE POLICY "requisitions_select" ON public.project_requisitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "requisitions_write" ON public.project_requisitions FOR ALL TO authenticated USING (public.is_admin_or_gestor()) WITH CHECK (public.is_admin_or_gestor());

-- 9. INSERIR DADOS INICIAIS (SEEDING)

-- Fornecedores
INSERT INTO public.project_suppliers (id, name, rating, compliance, specialty, phone)
VALUES 
  ('7a1a111a-1111-1111-1111-111111111111', 'Concretart Ltda', 4.8, 98, 'Concreto e Agregados', '(11) 98765-4321'),
  ('7a2a222a-2222-2222-2222-222222222222', 'Gerdau Comercial', 4.9, 99, 'Estruturas Metálicas e Aço', '(11) 4004-9000'),
  ('7a3a333a-3333-3333-3333-333333333333', 'Depósito Central', 4.5, 94, 'Materiais Básicos e Acabamento', '(11) 99888-7766'),
  ('7a4a444a-4444-4444-4444-444444444444', 'Locações Silva', 4.2, 90, 'Locação de Maquinários e Escavação', '(11) 97766-5544'),
  ('7a5a555a-5555-5555-5555-555555555555', 'Megacabos Ltda', 4.7, 96, 'Condutores Elétricos de Média/Alta Tensão', '(11) 3300-8800')
ON CONFLICT (name) DO UPDATE 
SET rating = EXCLUDED.rating, compliance = EXCLUDED.compliance, specialty = EXCLUDED.specialty, phone = EXCLUDED.phone;

-- Projetos
INSERT INTO public.projects (id, name, location, previsto, faturado, desvios, progress, status, coordinator, team)
VALUES
  ('e1c1071d-5566-419b-a01c-6d73516599b1', 'Reforma Galpão Trafo', 'Galpão Sul, Setor Industrial', 450000, 310000, 0, 75, 'Em Execução', 'Eng. Daniel Silva', 'Hugo (Mestre de Obras) + 4 Pedreiros'),
  ('f2c2072d-6677-42ac-b02c-7d836275aa02', 'Fundação Nova Área', 'Galpão Novo, Área Leste', 180000, 195000, 15000, 95, 'Prazos Críticos', 'Engª. Amanda Costa', 'Marcos (Mestre) + 6 Operários'),
  ('03c3073d-7788-43ad-c03c-8d937385bb03', 'Ampliação da Subestação', 'Setor Norte, Acesso B', 980000, 450000, 45000, 40, 'Em Execução', 'Eng. Rafael Ramos', 'Lucas (Mestre) + 8 Eletricistas')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, location = EXCLUDED.location, previsto = EXCLUDED.previsto, faturado = EXCLUDED.faturado, desvios = EXCLUDED.desvios, progress = EXCLUDED.progress, status = EXCLUDED.status, coordinator = EXCLUDED.coordinator, team = EXCLUDED.team;

-- Marcos (Milestones)
DELETE FROM public.project_milestones;
INSERT INTO public.project_milestones (project_id, name, status, date)
VALUES
  ('e1c1071d-5566-419b-a01c-6d73516599b1', 'Terraplanagem', 'Concluído', CURRENT_DATE - INTERVAL '60 days'),
  ('e1c1071d-5566-419b-a01c-6d73516599b1', 'Fundação', 'Concluído', CURRENT_DATE - INTERVAL '42 days'),
  ('e1c1071d-5566-419b-a01c-6d73516599b1', 'Alvenaria/Estrutura', 'Em Execução', CURRENT_DATE - INTERVAL '15 days'),
  ('e1c1071d-5566-419b-a01c-6d73516599b1', 'Instalações Eletromecânicas', 'Pendente', CURRENT_DATE + INTERVAL '15 days'),
  ('e1c1071d-5566-419b-a01c-6d73516599b1', 'Comissionamento/Entrega', 'Pendente', CURRENT_DATE + INTERVAL '30 days'),
  
  ('f2c2072d-6677-42ac-b02c-7d836275aa02', 'Sondagem de Solo', 'Concluído', CURRENT_DATE - INTERVAL '30 days'),
  ('f2c2072d-6677-42ac-b02c-7d836275aa02', 'Escavação', 'Concluído', CURRENT_DATE - INTERVAL '18 days'),
  ('f2c2072d-6677-42ac-b02c-7d836275aa02', 'Concretagem das Estacas', 'Concluído', CURRENT_DATE - INTERVAL '10 days'),
  ('f2c2072d-6677-42ac-b02c-7d836275aa02', 'Acabamento/Nivelamento', 'Atrasado', CURRENT_DATE - INTERVAL '2 days'),
  
  ('03c3073d-7788-43ad-c03c-8d937385bb03', 'Projeto Executivo aprovado', 'Concluído', CURRENT_DATE - INTERVAL '45 days'),
  ('03c3073d-7788-43ad-c03c-8d937385bb03', 'Cercamento e Segurança', 'Concluído', CURRENT_DATE - INTERVAL '30 days'),
  ('03c3073d-7788-43ad-c03c-8d937385bb03', 'Montagem Eletromecânica', 'Em Execução', CURRENT_DATE - INTERVAL '15 days'),
  ('03c3073d-7788-43ad-c03c-8d937385bb03', 'Comissionamento Técnico', 'Pendente', CURRENT_DATE + INTERVAL '25 days');

-- Custos (Costs)
DELETE FROM public.project_costs;
INSERT INTO public.project_costs (project_id, phase, budget, actual, category, responsible)
VALUES
  ('e1c1071d-5566-419b-a01c-6d73516599b1', 'Limpeza e Terraplanagem', 50000, 48000, 'Serviços Adicionais', 'Eng. Daniel Silva'),
  ('e1c1071d-5566-419b-a01c-6d73516599b1', 'Fundação e Bases de Concreto', 120000, 120000, 'Materiais', 'Eng. Daniel Silva'),
  ('e1c1071d-5566-419b-a01c-6d73516599b1', 'Estrutura de Aço e Cobertura', 180000, 142000, 'Materiais', 'Eng. Daniel Silva'),
  ('e1c1071d-5566-419b-a01c-6d73516599b1', 'Mão de Obra de Alvenaria', 100000, 0, 'Mão de Obra', 'Hugo (Mestre)'),
  
  ('f2c2072d-6677-42ac-b02c-7d836275aa02', 'Escavação do Solo', 40000, 55000, 'Serviços Adicionais', 'Engª. Amanda Costa'),
  ('f2c2072d-6677-42ac-b02c-7d836275aa02', 'Armação de Aço', 60000, 60000, 'Materiais', 'Marcos (Mestre)'),
  ('f2c2072d-6677-42ac-b02c-7d836275aa02', 'Lançamento de Concreto', 80000, 80000, 'Materiais', 'Engª. Amanda Costa'),
  
  ('03c3073d-7788-43ad-c03c-8d937385bb03', 'Engenharia e Projetos', 80000, 80000, 'Serviços Adicionais', 'Eng. Rafael Ramos'),
  ('03c3073d-7788-43ad-c03c-8d937385bb03', 'Bases Civis para Transformadores', 300000, 345000, 'Materiais', 'Eng. Rafael Ramos'),
  ('03c3073d-7788-43ad-c03c-8d937385bb03', 'Equipamentos e Chaves', 600000, 25000, 'Materiais', 'Lucas (Mestre)');

-- Materiais
DELETE FROM public.project_materials;
INSERT INTO public.project_materials (project_id, name, category, qty_budget, qty_used, unit, supplier, responsible)
VALUES
  ('e1c1071d-5566-419b-a01c-6d73516599b1', 'Concreto Usinado Fck30', 'Materiais', 50, 52, 'm³', 'Concretart Ltda', 'Eng. Daniel Silva'),
  ('e1c1071d-5566-419b-a01c-6d73516599b1', 'Estrutura de Aço CA-50 10mm', 'Materiais', 2500, 1800, 'kg', 'Gerdau Comercial', 'Hugo (Mestre)'),
  ('e1c1071d-5566-419b-a01c-6d73516599b1', 'Escavação Mecanizada', 'Serviços Adicionais', 12, 15, 'dias', 'Locações Silva', 'Eng. Daniel Silva'),
  ('e1c1071d-5566-419b-a01c-6d73516599b1', 'Tijolos Cerâmicos (Lote)', 'Materiais', 10, 0, 'un', 'A cotar', 'Hugo (Mestre)'),
  
  ('f2c2072d-6677-42ac-b02c-7d836275aa02', 'Cimento CP-II', 'Materiais', 400, 450, 'sacos', 'Cimento Forte', 'Marcos (Mestre)'),
  ('f2c2072d-6677-42ac-b02c-7d836275aa02', 'Concreto Usinado Fck30', 'Materiais', 40, 40, 'm³', 'Concretart Ltda', 'Engª. Amanda Costa'),
  ('f2c2072d-6677-42ac-b02c-7d836275aa02', 'Escavação Solo Mecanizada', 'Serviços Adicionais', 5, 8, 'dias', 'Terrafort', 'Engª. Amanda Costa'),
  
  ('03c3073d-7788-43ad-c03c-8d937385bb03', 'Aço CA-50 12mm', 'Materiais', 5000, 5100, 'kg', 'Gerdau Comercial', 'Lucas (Mestre)'),
  ('03c3073d-7788-43ad-c03c-8d937385bb03', 'Concreto Autoadensável', 'Materiais', 80, 88, 'm³', 'Massa Forte', 'Eng. Rafael Ramos'),
  ('03c3073d-7788-43ad-c03c-8d937385bb03', 'Cabos de Cobre de Média Tensão', 'Materiais', 1200, 400, 'm', 'Megacabos Ltda', 'Lucas (Mestre)');

-- Requisições de Compra
DELETE FROM public.project_requisitions;
INSERT INTO public.project_requisitions (project_id, material, qty, date, status, approved_supplier, approved_price, options)
VALUES
  (
    'e1c1071d-5566-419b-a01c-6d73516599b1', 
    'Tijolos Cerâmicos (Lote: 10.000 un)', 
    '1 Lote', 
    CURRENT_DATE - INTERVAL '15 days', 
    'Em Cotação', 
    NULL, 
    NULL,
    '[
      {"supplierName": "Cerâmica Regional", "price": 12000, "deliveryDays": 5, "rating": 4},
      {"supplierName": "Depósito Central", "price": 11500, "deliveryDays": 2, "rating": 5, "isBest": true},
      {"supplierName": "Suprimentos Vale", "price": 13200, "deliveryDays": 1, "rating": 3}
    ]'::jsonb
  ),
  (
    'e1c1071d-5566-419b-a01c-6d73516599b1', 
    'Aço CA-50 10mm (Lote: 3.000 kg)', 
    '3.000 kg', 
    CURRENT_DATE - INTERVAL '12 days', 
    'Aprovado', 
    'Gerdau Comercial', 
    18000,
    '[
      {"supplierName": "Gerdau Comercial", "price": 18000, "deliveryDays": 3, "rating": 5, "isBest": true},
      {"supplierName": "Ferro Forte", "price": 19200, "deliveryDays": 2, "rating": 4}
    ]'::jsonb
  ),
  (
    'f2c2072d-6677-42ac-b02c-7d836275aa02', 
    'Concreto Usinado fck 30 (Lote: 50 m³)', 
    '50 m³', 
    CURRENT_DATE - INTERVAL '10 days', 
    'Aguardando Entrega', 
    'Concretart Ltda', 
    22000,
    '[
      {"supplierName": "Concretart Ltda", "price": 22000, "deliveryDays": 1, "rating": 4, "isBest": true},
      {"supplierName": "Laje Rápida", "price": 23500, "deliveryDays": 2, "rating": 4}
    ]'::jsonb
  );
