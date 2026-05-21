-- Script atualizado para ser à prova de falhas (Idempotente)
-- Ele verifica se a coluna existe antes de tentar alterá-la!

DO $$
BEGIN
    -- 1. Tenta renomear numero_serie para tag_id (se numero_serie existir)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ativos' AND column_name='numero_serie') THEN
        ALTER TABLE public.ativos RENAME COLUMN numero_serie TO tag_id;
    END IF;

    -- 2. Tenta renomear valor para custo_aquisicao (se valor existir)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ativos' AND column_name='valor') THEN
        ALTER TABLE public.ativos RENAME COLUMN valor TO custo_aquisicao;
    END IF;
END $$;

-- 3. Adicionar as novas colunas caso elas não existam (o IF NOT EXISTS previne erros)
ALTER TABLE public.ativos ADD COLUMN IF NOT EXISTS criticidade TEXT DEFAULT 'Baixa';
ALTER TABLE public.ativos ADD COLUMN IF NOT EXISTS saude INTEGER DEFAULT 100;
ALTER TABLE public.ativos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Atualizar os dados antigos que possam ter saude Nula para 100
UPDATE public.ativos SET saude = 100 WHERE saude IS NULL;
UPDATE public.ativos SET criticidade = 'Baixa' WHERE criticidade IS NULL;

-- 5. Garantir que as colunas apareçam corretamente
SELECT id, nome, tag_id, criticidade, custo_aquisicao, saude, updated_at FROM public.ativos LIMIT 5;
