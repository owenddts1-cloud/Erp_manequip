-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: Ativos (Assets)
CREATE TABLE IF NOT EXISTS ativos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_id VARCHAR(50) UNIQUE NOT NULL, -- ex: TAG-TR-001
    nome VARCHAR(255) NOT NULL,
    setor VARCHAR(100),
    modelo VARCHAR(100),
    criticidade VARCHAR(20) CHECK (criticidade IN ('Alta', 'Média', 'Baixa')),
    status VARCHAR(20) DEFAULT 'Operacional' CHECK (status IN ('Operacional', 'Em Alerta', 'Parado', 'Manutenção')),
    imagem_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table: Inventario (Inventory)
CREATE TABLE IF NOT EXISTS inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_peca VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    categoria VARCHAR(50), -- Mecânica, Elétrica, etc
    localizacao VARCHAR(100),
    quantidade_estoque INTEGER DEFAULT 0,
    valor_unitario DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table: Chamados (Work Orders)
CREATE TABLE IF NOT EXISTS chamados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_chamado VARCHAR(20) UNIQUE NOT NULL, -- #8492
    descricao TEXT NOT NULL,
    tecnico_id UUID REFERENCES auth.users(id), -- Link to Supabase Auth User
    ativo_id UUID REFERENCES ativos(id), -- Optional: Link to asset
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_limite TIMESTAMP WITH TIME ZONE,
    prioridade VARCHAR(20) CHECK (prioridade IN ('Alta', 'Média', 'Baixa')),
    status VARCHAR(20) DEFAULT 'Em Progresso' CHECK (status IN ('Em Progresso', 'Concluído', 'Pendente')),
    custo_pecas DECIMAL(10, 2) DEFAULT 0.00,
    tempo_parada INTERVAL, -- Stored as interval type or string
    observacoes_finais TEXT
);

-- 4. Table: Historico Manutencao (Maintenance History)
CREATE TABLE IF NOT EXISTS historico_manutencao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamado_id UUID REFERENCES chamados(id),
    tecnico_id UUID REFERENCES auth.users(id),
    ativo_id UUID REFERENCES ativos(id),
    data_conclusao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo_manutencao VARCHAR(50), -- Preventiva, Corretiva
    descricao_servico TEXT,
    pecas_utilizadas JSONB -- Store array of used parts/quantities e.g. [{"sku": "123", "qty": 2}]
);

-- Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE ativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_manutencao ENABLE ROW LEVEL SECURITY;

-- Simple Policy: Authenticated users see detailed info.
-- In a real multi-tenant app, we would filter by organization_id.
-- For now, we allow authenticated users full access to demonstrate functionality.

CREATE POLICY "Enable read access for all users" ON ativos FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON ativos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON ativos FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON inventario FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON inventario FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON chamados FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON chamados FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON historico_manutencao FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON historico_manutencao FOR ALL USING (auth.role() = 'authenticated');
