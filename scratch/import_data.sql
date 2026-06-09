-- ==========================================================
-- AUTOMATICALLY GENERATED PREVENTIVE MAINTENANCE DATA IMPORT
-- ==========================================================
BEGIN;

CREATE OR REPLACE FUNCTION public.get_or_create_ativo(
    p_tag_id text,
    p_nome text,
    p_setor text,
    p_criticidade text,
    p_status text
) RETURNS uuid AS $$
DECLARE
    v_id uuid;
BEGIN
    -- Try to find by tag_id if not null
    IF p_tag_id IS NOT NULL AND p_tag_id <> '' THEN
        SELECT id INTO v_id FROM public.ativos WHERE tag_id = p_tag_id LIMIT 1;
    ELSE
        -- If tag_id is null, find by name and sector
        SELECT id INTO v_id FROM public.ativos WHERE nome = p_nome AND (setor = p_setor OR (setor IS NULL AND p_setor IS NULL)) LIMIT 1;
    END IF;

    -- If not found, insert
    IF v_id IS NULL THEN
        INSERT INTO public.ativos (tag_id, nome, setor, criticidade, status)
        VALUES (p_tag_id, p_nome, p_setor, p_criticidade, p_status)
        RETURNING id INTO v_id;
    END IF;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_or_create_planejamento(
    p_ativo_id uuid,
    p_titulo text,
    p_descricao text,
    p_periodicidade text,
    p_meses_execucao integer[]
) RETURNS uuid AS $$
DECLARE
    v_id uuid;
BEGIN
    SELECT id INTO v_id 
    FROM public.preventivas_planejamento 
    WHERE ativo_id = p_ativo_id AND titulo = p_titulo AND periodicidade = p_periodicidade 
    LIMIT 1;

    IF v_id IS NULL THEN
        INSERT INTO public.preventivas_planejamento (ativo_id, titulo, descricao, periodicidade, meses_execucao)
        VALUES (p_ativo_id, p_titulo, p_descricao, p_periodicidade, p_meses_execucao)
        RETURNING id INTO v_id;
    ELSE
        -- Update months if it exists
        UPDATE public.preventivas_planejamento
        SET meses_execucao = p_meses_execucao,
            descricao = COALESCE(p_descricao, descricao)
        WHERE id = v_id;
    END IF;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.upsert_preventiva_mensal(
    p_planejamento_id uuid,
    p_ativo_id uuid,
    p_titulo text,
    p_descricao text,
    p_mes integer,
    p_ano integer,
    p_tecnico_email text,
    p_status text,
    p_dia_execucao integer
) RETURNS uuid AS $$
DECLARE
    v_tecnico_id uuid;
    v_id uuid;
    v_concluido_em timestamp with time zone := null;
    v_data_limite date;
BEGIN
    -- Resolve technician id
    IF p_tecnico_email IS NOT NULL THEN
        SELECT id INTO v_tecnico_id FROM public.profiles WHERE LOWER(email) = LOWER(p_tecnico_email) LIMIT 1;
    END IF;

    -- Calculate data_limite
    IF p_dia_execucao IS NOT NULL THEN
        v_data_limite := make_date(p_ano, p_mes, p_dia_execucao);
    ELSE
        v_data_limite := (date_trunc('month', make_date(p_ano, p_mes, 1)) + interval '1 month' - interval '1 day')::date;
    END IF;

    -- Set concluido_em if completed
    IF p_status = 'Concluído' THEN
        IF p_dia_execucao IS NOT NULL THEN
            v_concluido_em := make_timestamptz(p_ano, p_mes, p_dia_execucao, 12, 0, 0);
        ELSE
            v_concluido_em := NOW();
        END IF;
    END IF;

    -- Check if already exists for this month/year/asset
    SELECT id INTO v_id 
    FROM public.preventivas_mensais 
    WHERE ativo_id = p_ativo_id AND mes = p_mes AND ano = p_ano AND titulo = p_titulo
    LIMIT 1;

    IF v_id IS NULL THEN
        INSERT INTO public.preventivas_mensais (planejamento_id, ativo_id, titulo, descricao, mes, ano, tecnico_responsavel, status, data_limite, concluido_em)
        VALUES (p_planejamento_id, p_ativo_id, p_titulo, p_descricao, p_mes, p_ano, v_tecnico_id, p_status, v_data_limite, v_concluido_em)
        RETURNING id INTO v_id;
    ELSE
        UPDATE public.preventivas_mensais
        SET status = p_status,
            tecnico_responsavel = v_tecnico_id,
            concluido_em = v_concluido_em,
            data_limite = v_data_limite,
            descricao = COALESCE(p_descricao, descricao)
        WHERE id = v_id;
    END IF;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. Seeding Technicians in Auth and Profiles

-- Tech: ALDEMAR
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    'fed76823-60ca-451c-83b6-bbe6770003e7',
    'authenticated',
    'authenticated',
    'aldemar@manequip.com',
    extensions.crypt('Manequip123!', extensions.gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Aldemar Técnico","job_title":"Técnico de Manutenção"}',
    current_timestamp,
    current_timestamp,
    '', '', '', ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'aldemar@manequip.com'
);

INSERT INTO public.profiles (id, email, full_name, role, is_approved)
SELECT id, email, 'Aldemar Técnico', 'Técnico', true
FROM auth.users
WHERE email = 'aldemar@manequip.com'
ON CONFLICT (id) DO UPDATE
SET role = 'Técnico', is_approved = true, full_name = EXCLUDED.full_name;


-- Tech: DANIEL
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    '99b65e28-5289-4ef7-b4bb-13ae51b15c53',
    'authenticated',
    'authenticated',
    'daniel@manequip.com',
    extensions.crypt('Manequip123!', extensions.gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Daniel Técnico","job_title":"Técnico de Manutenção"}',
    current_timestamp,
    current_timestamp,
    '', '', '', ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'daniel@manequip.com'
);

INSERT INTO public.profiles (id, email, full_name, role, is_approved)
SELECT id, email, 'Daniel Técnico', 'Técnico', true
FROM auth.users
WHERE email = 'daniel@manequip.com'
ON CONFLICT (id) DO UPDATE
SET role = 'Técnico', is_approved = true, full_name = EXCLUDED.full_name;


-- Tech: GENILSON
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    'c8ef49c0-9f70-47cf-88d0-76123b8df761',
    'authenticated',
    'authenticated',
    'genilson@manequip.com',
    extensions.crypt('Manequip123!', extensions.gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Genilson Técnico","job_title":"Técnico de Manutenção"}',
    current_timestamp,
    current_timestamp,
    '', '', '', ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'genilson@manequip.com'
);

INSERT INTO public.profiles (id, email, full_name, role, is_approved)
SELECT id, email, 'Genilson Técnico', 'Técnico', true
FROM auth.users
WHERE email = 'genilson@manequip.com'
ON CONFLICT (id) DO UPDATE
SET role = 'Técnico', is_approved = true, full_name = EXCLUDED.full_name;


-- Tech: HUGO
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    '376cf3c2-aa52-4ae1-8038-ed6f0d86a207',
    'authenticated',
    'authenticated',
    'hugo@manequip.com',
    extensions.crypt('Manequip123!', extensions.gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Hugo Técnico","job_title":"Técnico de Manutenção"}',
    current_timestamp,
    current_timestamp,
    '', '', '', ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'hugo@manequip.com'
);

INSERT INTO public.profiles (id, email, full_name, role, is_approved)
SELECT id, email, 'Hugo Técnico', 'Técnico', true
FROM auth.users
WHERE email = 'hugo@manequip.com'
ON CONFLICT (id) DO UPDATE
SET role = 'Técnico', is_approved = true, full_name = EXCLUDED.full_name;


-- Tech: LUAN
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    '0c62ff2e-52e2-4d82-a214-bfe851f05f1b',
    'authenticated',
    'authenticated',
    'luan@manequip.com',
    extensions.crypt('Manequip123!', extensions.gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Luan Técnico","job_title":"Técnico de Manutenção"}',
    current_timestamp,
    current_timestamp,
    '', '', '', ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'luan@manequip.com'
);

INSERT INTO public.profiles (id, email, full_name, role, is_approved)
SELECT id, email, 'Luan Técnico', 'Técnico', true
FROM auth.users
WHERE email = 'luan@manequip.com'
ON CONFLICT (id) DO UPDATE
SET role = 'Técnico', is_approved = true, full_name = EXCLUDED.full_name;


-- Tech: MAIKE
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    'a4796557-91c4-4dbd-8a78-dbb9a8a16564',
    'authenticated',
    'authenticated',
    'maike@manequip.com',
    extensions.crypt('Manequip123!', extensions.gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Maike Técnico","job_title":"Técnico de Manutenção"}',
    current_timestamp,
    current_timestamp,
    '', '', '', ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'maike@manequip.com'
);

INSERT INTO public.profiles (id, email, full_name, role, is_approved)
SELECT id, email, 'Maike Técnico', 'Técnico', true
FROM auth.users
WHERE email = 'maike@manequip.com'
ON CONFLICT (id) DO UPDATE
SET role = 'Técnico', is_approved = true, full_name = EXCLUDED.full_name;


-- Tech: SAMIR
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    'e240de9a-cc20-475b-bf1d-a89d00aaa90e',
    'authenticated',
    'authenticated',
    'samir@manequip.com',
    extensions.crypt('Manequip123!', extensions.gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Samir Técnico","job_title":"Técnico de Manutenção"}',
    current_timestamp,
    current_timestamp,
    '', '', '', ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'samir@manequip.com'
);

INSERT INTO public.profiles (id, email, full_name, role, is_approved)
SELECT id, email, 'Samir Técnico', 'Técnico', true
FROM auth.users
WHERE email = 'samir@manequip.com'
ON CONFLICT (id) DO UPDATE
SET role = 'Técnico', is_approved = true, full_name = EXCLUDED.full_name;


-- Tech: VINICIUS
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    '710f26f3-4a6d-4fed-bf32-4659a9757330',
    'authenticated',
    'authenticated',
    'vinicius@manequip.com',
    extensions.crypt('Manequip123!', extensions.gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Vinícius Técnico","job_title":"Técnico de Manutenção"}',
    current_timestamp,
    current_timestamp,
    '', '', '', ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'vinicius@manequip.com'
);

INSERT INTO public.profiles (id, email, full_name, role, is_approved)
SELECT id, email, 'Vinícius Técnico', 'Técnico', true
FROM auth.users
WHERE email = 'vinicius@manequip.com'
ON CONFLICT (id) DO UPDATE
SET role = 'Técnico', is_approved = true, full_name = EXCLUDED.full_name;


-- Tech: VINÍCIUS
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    '1f1b8bcb-9c51-4e6c-9ef8-f8afe6e9b482',
    'authenticated',
    'authenticated',
    'vinicius@manequip.com',
    extensions.crypt('Manequip123!', extensions.gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Vinícius Técnico","job_title":"Técnico de Manutenção"}',
    current_timestamp,
    current_timestamp,
    '', '', '', ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'vinicius@manequip.com'
);

INSERT INTO public.profiles (id, email, full_name, role, is_approved)
SELECT id, email, 'Vinícius Técnico', 'Técnico', true
FROM auth.users
WHERE email = 'vinicius@manequip.com'
ON CONFLICT (id) DO UPDATE
SET role = 'Técnico', is_approved = true, full_name = EXCLUDED.full_name;


-- Tech: WENDEL
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    'a988ed99-a6f6-414c-b52e-d674428eb77f',
    'authenticated',
    'authenticated',
    'wendel@manequip.com',
    extensions.crypt('Manequip123!', extensions.gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Wendel Técnico","job_title":"Técnico de Manutenção"}',
    current_timestamp,
    current_timestamp,
    '', '', '', ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'wendel@manequip.com'
);

INSERT INTO public.profiles (id, email, full_name, role, is_approved)
SELECT id, email, 'Wendel Técnico', 'Técnico', true
FROM auth.users
WHERE email = 'wendel@manequip.com'
ON CONFLICT (id) DO UPDATE
SET role = 'Técnico', is_approved = true, full_name = EXCLUDED.full_name;


-- Tech: GUILHERME / LUAN
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    'd05e20d2-9d40-4f5e-a8e9-f04d858d7f76',
    'authenticated',
    'authenticated',
    'luan@manequip.com',
    extensions.crypt('Manequip123!', extensions.gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Luan Técnico","job_title":"Técnico de Manutenção"}',
    current_timestamp,
    current_timestamp,
    '', '', '', ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'luan@manequip.com'
);

INSERT INTO public.profiles (id, email, full_name, role, is_approved)
SELECT id, email, 'Luan Técnico', 'Técnico', true
FROM auth.users
WHERE email = 'luan@manequip.com'
ON CONFLICT (id) DO UPDATE
SET role = 'Técnico', is_approved = true, full_name = EXCLUDED.full_name;


-- Tech: GUILHERME
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT 
    '00000000-0000-0000-0000-000000000000',
    'e3bb27d5-1c9a-43a0-aca2-4484bd77c232',
    'authenticated',
    'authenticated',
    'guilherme@manequip.com',
    extensions.crypt('Manequip123!', extensions.gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Guilherme Técnico","job_title":"Técnico de Manutenção"}',
    current_timestamp,
    current_timestamp,
    '', '', '', ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'guilherme@manequip.com'
);

INSERT INTO public.profiles (id, email, full_name, role, is_approved)
SELECT id, email, 'Guilherme Técnico', 'Técnico', true
FROM auth.users
WHERE email = 'guilherme@manequip.com'
ON CONFLICT (id) DO UPDATE
SET role = 'Técnico', is_approved = true, full_name = EXCLUDED.full_name;


-- 2. Seeding Assets and Annual Planning Templates (218 rows)

DO $$
DECLARE
    v_a_AN_LISE_DE__LEO_TRANSFORMADOR__6 uuid;
    v_p_AN_LISE_DE__LEO_TRANSFORMADOR__6 uuid;
BEGIN
    -- Get or create asset
    v_a_AN_LISE_DE__LEO_TRANSFORMADOR__6 := public.get_or_create_ativo(NULL, 'ANÁLISE DE ÓLEO TRANSFORMADOR  (UTILIDADES)', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_AN_LISE_DE__LEO_TRANSFORMADOR__6 := public.get_or_create_planejamento(
        v_a_AN_LISE_DE__LEO_TRANSFORMADOR__6,
        'Preventiva ' || 'ANÁLISE DE ÓLEO TRANSFORMADOR  (UTILIDADES)',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Anual',
        ARRAY[8]
    );
END $$;

DO $$
DECLARE
    v_a_AN_LISE_DE__LEO_TRANSFORMADOR__7 uuid;
    v_p_AN_LISE_DE__LEO_TRANSFORMADOR__7 uuid;
BEGIN
    -- Get or create asset
    v_a_AN_LISE_DE__LEO_TRANSFORMADOR__7 := public.get_or_create_ativo(NULL, 'ANÁLISE DE ÓLEO TRANSFORMADOR (MET)', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_AN_LISE_DE__LEO_TRANSFORMADOR__7 := public.get_or_create_planejamento(
        v_a_AN_LISE_DE__LEO_TRANSFORMADOR__7,
        'Preventiva ' || 'ANÁLISE DE ÓLEO TRANSFORMADOR (MET)',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Anual',
        ARRAY[8]
    );
END $$;

DO $$
DECLARE
    v_a_AN_LISE_DE__LEO_TRANSFORMADOR__8 uuid;
    v_p_AN_LISE_DE__LEO_TRANSFORMADOR__8 uuid;
BEGIN
    -- Get or create asset
    v_a_AN_LISE_DE__LEO_TRANSFORMADOR__8 := public.get_or_create_ativo(NULL, 'ANÁLISE DE ÓLEO TRANSFORMADOR (SUBESTAÇÃO FABRICA NOVA)', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_AN_LISE_DE__LEO_TRANSFORMADOR__8 := public.get_or_create_planejamento(
        v_a_AN_LISE_DE__LEO_TRANSFORMADOR__8,
        'Preventiva ' || 'ANÁLISE DE ÓLEO TRANSFORMADOR (SUBESTAÇÃO FABRICA NOVA)',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Anual',
        ARRAY[8]
    );
END $$;

DO $$
DECLARE
    v_a_AN_LISE_DE__LEO_TRANSFORMADOR__9 uuid;
    v_p_AN_LISE_DE__LEO_TRANSFORMADOR__9 uuid;
BEGIN
    -- Get or create asset
    v_a_AN_LISE_DE__LEO_TRANSFORMADOR__9 := public.get_or_create_ativo(NULL, 'ANÁLISE DE ÓLEO TRANSFORMADOR (SUT)', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_AN_LISE_DE__LEO_TRANSFORMADOR__9 := public.get_or_create_planejamento(
        v_a_AN_LISE_DE__LEO_TRANSFORMADOR__9,
        'Preventiva ' || 'ANÁLISE DE ÓLEO TRANSFORMADOR (SUT)',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Anual',
        ARRAY[8]
    );
END $$;

DO $$
DECLARE
    v_a_BALANCEADORA_2_10T_10 uuid;
    v_p_BALANCEADORA_2_10T_10 uuid;
BEGIN
    -- Get or create asset
    v_a_BALANCEADORA_2_10T_10 := public.get_or_create_ativo(NULL, 'BALANCEADORA 2 10T', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BALANCEADORA_2_10T_10 := public.get_or_create_planejamento(
        v_a_BALANCEADORA_2_10T_10,
        'Preventiva ' || 'BALANCEADORA 2 10T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 3, 8]
    );
END $$;

DO $$
DECLARE
    v_a_BANCOS_DE_CAPACITORES_11 uuid;
    v_p_BANCOS_DE_CAPACITORES_11 uuid;
BEGIN
    -- Get or create asset
    v_a_BANCOS_DE_CAPACITORES_11 := public.get_or_create_ativo(NULL, 'BANCOS DE CAPACITORES', 'SALA DE TESTE   (GALPÃO NOVO)', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BANCOS_DE_CAPACITORES_11 := public.get_or_create_planejamento(
        v_a_BANCOS_DE_CAPACITORES_11,
        'Preventiva ' || 'BANCOS DE CAPACITORES',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_1_12 uuid;
    v_p_BOBINADEIRA_1_12 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_1_12 := public.get_or_create_ativo('4226', 'BOBINADEIRA 1', 'BOBINAS TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_1_12 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_1_12,
        'Preventiva ' || 'BOBINADEIRA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_2_13 uuid;
    v_p_BOBINADEIRA_2_13 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_2_13 := public.get_or_create_ativo('4222', 'BOBINADEIRA 2', 'BOBINAS TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_2_13 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_2_13,
        'Preventiva ' || 'BOBINADEIRA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_3_14 uuid;
    v_p_BOBINADEIRA_3_14 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_3_14 := public.get_or_create_ativo('4223', 'BOBINADEIRA 3', 'BOBINAS TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_3_14 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_3_14,
        'Preventiva ' || 'BOBINADEIRA 3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_4_15 uuid;
    v_p_BOBINADEIRA_4_15 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_4_15 := public.get_or_create_ativo('4225', 'BOBINADEIRA 4', 'BOBINAS TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_4_15 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_4_15,
        'Preventiva ' || 'BOBINADEIRA 4',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_5_16 uuid;
    v_p_BOBINADEIRA_5_16 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_5_16 := public.get_or_create_ativo('4227', 'BOBINADEIRA 5', 'BOBINAS TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_5_16 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_5_16,
        'Preventiva ' || 'BOBINADEIRA 5',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_6_17 uuid;
    v_p_BOBINADEIRA_6_17 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_6_17 := public.get_or_create_ativo('743', 'BOBINADEIRA 6', 'BOBINAS TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_6_17 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_6_17,
        'Preventiva ' || 'BOBINADEIRA 6',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_7_18 uuid;
    v_p_BOBINADEIRA_7_18 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_7_18 := public.get_or_create_ativo('749', 'BOBINADEIRA 7', 'BOBINAS TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_7_18 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_7_18,
        'Preventiva ' || 'BOBINADEIRA 7',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_8_CHINESA_1_19 uuid;
    v_p_BOBINADEIRA_8_CHINESA_1_19 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_8_CHINESA_1_19 := public.get_or_create_ativo('2455', 'BOBINADEIRA 8 CHINESA 1', 'BOBINAS TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_8_CHINESA_1_19 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_8_CHINESA_1_19,
        'Preventiva ' || 'BOBINADEIRA 8 CHINESA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_9_CHINESA_2_20 uuid;
    v_p_BOBINADEIRA_9_CHINESA_2_20 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_9_CHINESA_2_20 := public.get_or_create_ativo('4229', 'BOBINADEIRA 9 CHINESA 2', 'BOBINAS TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_9_CHINESA_2_20 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_9_CHINESA_2_20,
        'Preventiva ' || 'BOBINADEIRA 9 CHINESA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_10_21 uuid;
    v_p_BOBINADEIRA_10_21 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_10_21 := public.get_or_create_ativo('4133', 'BOBINADEIRA 10', 'BOBINAS TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_10_21 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_10_21,
        'Preventiva ' || 'BOBINADEIRA 10',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_11_22 uuid;
    v_p_BOBINADEIRA_11_22 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_11_22 := public.get_or_create_ativo(NULL, 'BOBINADEIRA 11', 'XL COILS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_11_22 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_11_22,
        'Preventiva ' || 'BOBINADEIRA 11',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_12_23 uuid;
    v_p_BOBINADEIRA_12_23 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_12_23 := public.get_or_create_ativo('2142', 'BOBINADEIRA 12', 'XL COILS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_12_23 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_12_23,
        'Preventiva ' || 'BOBINADEIRA 12',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_13_24 uuid;
    v_p_BOBINADEIRA_13_24 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_13_24 := public.get_or_create_ativo('2142', 'BOBINADEIRA 13', 'BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_13_24 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_13_24,
        'Preventiva ' || 'BOBINADEIRA 13',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_14_25 uuid;
    v_p_BOBINADEIRA_14_25 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_14_25 := public.get_or_create_ativo('4218', 'BOBINADEIRA 14', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_14_25 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_14_25,
        'Preventiva ' || 'BOBINADEIRA 14',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[3, 9]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_15_26 uuid;
    v_p_BOBINADEIRA_15_26 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_15_26 := public.get_or_create_ativo('2649', 'BOBINADEIRA 15', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_15_26 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_15_26,
        'Preventiva ' || 'BOBINADEIRA 15',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[3, 9]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_16_27 uuid;
    v_p_BOBINADEIRA_16_27 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_16_27 := public.get_or_create_ativo(NULL, 'BOBINADEIRA 16', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_16_27 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_16_27,
        'Preventiva ' || 'BOBINADEIRA 16',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[3, 9]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_18_28 uuid;
    v_p_BOBINADEIRA_18_28 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_18_28 := public.get_or_create_ativo('8079', 'BOBINADEIRA 18', 'BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_18_28 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_18_28,
        'Preventiva ' || 'BOBINADEIRA 18',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_19_29 uuid;
    v_p_BOBINADEIRA_19_29 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_19_29 := public.get_or_create_ativo('4166', 'BOBINADEIRA 19', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_19_29 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_19_29,
        'Preventiva ' || 'BOBINADEIRA 19',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_BOBINADEIRA_20_HORIZONTAL_30 uuid;
    v_p_BOBINADEIRA_20_HORIZONTAL_30 uuid;
BEGIN
    -- Get or create asset
    v_a_BOBINADEIRA_20_HORIZONTAL_30 := public.get_or_create_ativo('4165', 'BOBINADEIRA 20 HORIZONTAL', 'PÓLO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOBINADEIRA_20_HORIZONTAL_30 := public.get_or_create_planejamento(
        v_a_BOBINADEIRA_20_HORIZONTAL_30,
        'Preventiva ' || 'BOBINADEIRA 20 HORIZONTAL',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_BOMBA_DE_V_CUO_1_14000_201_31 uuid;
    v_p_BOMBA_DE_V_CUO_1_14000_201_31 uuid;
BEGIN
    -- Get or create asset
    v_a_BOMBA_DE_V_CUO_1_14000_201_31 := public.get_or_create_ativo('33', 'BOMBA DE VÁCUO 1 14000-201', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOMBA_DE_V_CUO_1_14000_201_31 := public.get_or_create_planejamento(
        v_a_BOMBA_DE_V_CUO_1_14000_201_31,
        'Preventiva ' || 'BOMBA DE VÁCUO 1 14000-201',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_BOMBA_DE_VACUO_2_EDWARDS_32 uuid;
    v_p_BOMBA_DE_VACUO_2_EDWARDS_32 uuid;
BEGIN
    -- Get or create asset
    v_a_BOMBA_DE_VACUO_2_EDWARDS_32 := public.get_or_create_ativo('32/42', 'BOMBA DE VACUO 2 EDWARDS', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOMBA_DE_VACUO_2_EDWARDS_32 := public.get_or_create_planejamento(
        v_a_BOMBA_DE_VACUO_2_EDWARDS_32,
        'Preventiva ' || 'BOMBA DE VACUO 2 EDWARDS',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_BOMBA_DE_V_CUO_3_33 uuid;
    v_p_BOMBA_DE_V_CUO_3_33 uuid;
BEGIN
    -- Get or create asset
    v_a_BOMBA_DE_V_CUO_3_33 := public.get_or_create_ativo('7758 / 4232', 'BOMBA DE VÁCUO 3', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOMBA_DE_V_CUO_3_33 := public.get_or_create_planejamento(
        v_a_BOMBA_DE_V_CUO_3_33,
        'Preventiva ' || 'BOMBA DE VÁCUO 3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_BOMBA_DE_V_CUO_4_EDWARDS_34 uuid;
    v_p_BOMBA_DE_V_CUO_4_EDWARDS_34 uuid;
BEGIN
    -- Get or create asset
    v_a_BOMBA_DE_V_CUO_4_EDWARDS_34 := public.get_or_create_ativo('4351', 'BOMBA DE VÁCUO 4 EDWARDS', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOMBA_DE_V_CUO_4_EDWARDS_34 := public.get_or_create_planejamento(
        v_a_BOMBA_DE_V_CUO_4_EDWARDS_34,
        'Preventiva ' || 'BOMBA DE VÁCUO 4 EDWARDS',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_BOMBA_DE_VACUO_5_35 uuid;
    v_p_BOMBA_DE_VACUO_5_35 uuid;
BEGIN
    -- Get or create asset
    v_a_BOMBA_DE_VACUO_5_35 := public.get_or_create_ativo('2389', 'BOMBA DE VACUO 5', 'GALPÃO TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOMBA_DE_VACUO_5_35 := public.get_or_create_planejamento(
        v_a_BOMBA_DE_VACUO_5_35,
        'Preventiva ' || 'BOMBA DE VACUO 5',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_BOMBA_DE_V_CUO_6_36 uuid;
    v_p_BOMBA_DE_V_CUO_6_36 uuid;
BEGIN
    -- Get or create asset
    v_a_BOMBA_DE_V_CUO_6_36 := public.get_or_create_ativo('4235', 'BOMBA DE VÁCUO 6', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOMBA_DE_V_CUO_6_36 := public.get_or_create_planejamento(
        v_a_BOMBA_DE_V_CUO_6_36,
        'Preventiva ' || 'BOMBA DE VÁCUO 6',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_BOMBA_DE_V_CUO_7___LEYBOLD_37 uuid;
    v_p_BOMBA_DE_V_CUO_7___LEYBOLD_37 uuid;
BEGIN
    -- Get or create asset
    v_a_BOMBA_DE_V_CUO_7___LEYBOLD_37 := public.get_or_create_ativo('13703', 'BOMBA DE VÁCUO 7 - LEYBOLD', 'FÁBRICA GALPÃO TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_BOMBA_DE_V_CUO_7___LEYBOLD_37 := public.get_or_create_planejamento(
        v_a_BOMBA_DE_V_CUO_7___LEYBOLD_37,
        'Preventiva ' || 'BOMBA DE VÁCUO 7 - LEYBOLD',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_CABINE_DE_JATO_1_PREPARA__O_38 uuid;
    v_p_CABINE_DE_JATO_1_PREPARA__O_38 uuid;
BEGIN
    -- Get or create asset
    v_a_CABINE_DE_JATO_1_PREPARA__O_38 := public.get_or_create_ativo('3393', 'CABINE DE JATO 1 PREPARAÇÃO', 'PREPARAÇÃO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CABINE_DE_JATO_1_PREPARA__O_38 := public.get_or_create_planejamento(
        v_a_CABINE_DE_JATO_1_PREPARA__O_38,
        'Preventiva ' || 'CABINE DE JATO 1 PREPARAÇÃO',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_CABINE_DE_JATO_2_EXTERNO_39 uuid;
    v_p_CABINE_DE_JATO_2_EXTERNO_39 uuid;
BEGIN
    -- Get or create asset
    v_a_CABINE_DE_JATO_2_EXTERNO_39 := public.get_or_create_ativo('463', 'CABINE DE JATO 2 EXTERNO', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CABINE_DE_JATO_2_EXTERNO_39 := public.get_or_create_planejamento(
        v_a_CABINE_DE_JATO_2_EXTERNO_39,
        'Preventiva ' || 'CABINE DE JATO 2 EXTERNO',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_CABINE_DE_JATO_3___GRANDE__40 uuid;
    v_p_CABINE_DE_JATO_3___GRANDE__40 uuid;
BEGIN
    -- Get or create asset
    v_a_CABINE_DE_JATO_3___GRANDE__40 := public.get_or_create_ativo('2607', 'CABINE DE JATO 3  (GRANDE)', 'DESMANCHE', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CABINE_DE_JATO_3___GRANDE__40 := public.get_or_create_planejamento(
        v_a_CABINE_DE_JATO_3___GRANDE__40,
        'Preventiva ' || 'CABINE DE JATO 3  (GRANDE)',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_CABINE_DE_PINTURA_1_41 uuid;
    v_p_CABINE_DE_PINTURA_1_41 uuid;
BEGIN
    -- Get or create asset
    v_a_CABINE_DE_PINTURA_1_41 := public.get_or_create_ativo('463', 'CABINE DE PINTURA 1', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CABINE_DE_PINTURA_1_41 := public.get_or_create_planejamento(
        v_a_CABINE_DE_PINTURA_1_41,
        'Preventiva ' || 'CABINE DE PINTURA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 2, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_CABINE_DE_PINTURA_2_42 uuid;
    v_p_CABINE_DE_PINTURA_2_42 uuid;
BEGIN
    -- Get or create asset
    v_a_CABINE_DE_PINTURA_2_42 := public.get_or_create_ativo(NULL, 'CABINE DE PINTURA 2', 'PREPARAÇÃO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CABINE_DE_PINTURA_2_42 := public.get_or_create_planejamento(
        v_a_CABINE_DE_PINTURA_2_42,
        'Preventiva ' || 'CABINE DE PINTURA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_CABINE_DE_PINTURA_3_43 uuid;
    v_p_CABINE_DE_PINTURA_3_43 uuid;
BEGIN
    -- Get or create asset
    v_a_CABINE_DE_PINTURA_3_43 := public.get_or_create_ativo(NULL, 'CABINE DE PINTURA 3', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CABINE_DE_PINTURA_3_43 := public.get_or_create_planejamento(
        v_a_CABINE_DE_PINTURA_3_43,
        'Preventiva ' || 'CABINE DE PINTURA 3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 2, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_CABINE_LAVADOR_1_44 uuid;
    v_p_CABINE_LAVADOR_1_44 uuid;
BEGIN
    -- Get or create asset
    v_a_CABINE_LAVADOR_1_44 := public.get_or_create_ativo(NULL, 'CABINE LAVADOR 1', 'FÁBRICA GALPÃO TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CABINE_LAVADOR_1_44 := public.get_or_create_planejamento(
        v_a_CABINE_LAVADOR_1_44,
        'Preventiva ' || 'CABINE LAVADOR 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_CALANDRA_1_45 uuid;
    v_p_CALANDRA_1_45 uuid;
BEGIN
    -- Get or create asset
    v_a_CALANDRA_1_45 := public.get_or_create_ativo('2415', 'CALANDRA 1', 'GALPÃO BOBINAS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CALANDRA_1_45 := public.get_or_create_planejamento(
        v_a_CALANDRA_1_45,
        'Preventiva ' || 'CALANDRA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[3, 9]
    );
END $$;

DO $$
DECLARE
    v_a_CALANDRA_2_46 uuid;
    v_p_CALANDRA_2_46 uuid;
BEGIN
    -- Get or create asset
    v_a_CALANDRA_2_46 := public.get_or_create_ativo('2420', 'CALANDRA 2', 'GALPÃO BOBINAS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CALANDRA_2_46 := public.get_or_create_planejamento(
        v_a_CALANDRA_2_46,
        'Preventiva ' || 'CALANDRA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[3, 9]
    );
END $$;

DO $$
DECLARE
    v_a_CALANDRA_3_47 uuid;
    v_p_CALANDRA_3_47 uuid;
BEGIN
    -- Get or create asset
    v_a_CALANDRA_3_47 := public.get_or_create_ativo('4164', 'CALANDRA 3', 'CALDEIRARIA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CALANDRA_3_47 := public.get_or_create_planejamento(
        v_a_CALANDRA_3_47,
        'Preventiva ' || 'CALANDRA 3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_CALANDRA_4_FRESADEIRA_48 uuid;
    v_p_CALANDRA_4_FRESADEIRA_48 uuid;
BEGIN
    -- Get or create asset
    v_a_CALANDRA_4_FRESADEIRA_48 := public.get_or_create_ativo('2464', 'CALANDRA 4 FRESADEIRA', 'XL COILS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CALANDRA_4_FRESADEIRA_48 := public.get_or_create_planejamento(
        v_a_CALANDRA_4_FRESADEIRA_48,
        'Preventiva ' || 'CALANDRA 4 FRESADEIRA',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_CHANFRADEIRA_1_49 uuid;
    v_p_CHANFRADEIRA_1_49 uuid;
BEGIN
    -- Get or create asset
    v_a_CHANFRADEIRA_1_49 := public.get_or_create_ativo(NULL, 'CHANFRADEIRA 1', 'GALPÃO NOVO - CARPINTARIA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CHANFRADEIRA_1_49 := public.get_or_create_planejamento(
        v_a_CHANFRADEIRA_1_49,
        'Preventiva ' || 'CHANFRADEIRA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[3, 9]
    );
END $$;

DO $$
DECLARE
    v_a_COLCH_O_DE_AR_1_LPT_200_50 uuid;
    v_p_COLCH_O_DE_AR_1_LPT_200_50 uuid;
BEGIN
    -- Get or create asset
    v_a_COLCH_O_DE_AR_1_LPT_200_50 := public.get_or_create_ativo(NULL, 'COLCHÃO DE AR 1 LPT-200', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_COLCH_O_DE_AR_1_LPT_200_50 := public.get_or_create_planejamento(
        v_a_COLCH_O_DE_AR_1_LPT_200_50,
        'Preventiva ' || 'COLCHÃO DE AR 1 LPT-200',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_COLCH_O_DE_AR_2_LPT_15_51 uuid;
    v_p_COLCH_O_DE_AR_2_LPT_15_51 uuid;
BEGIN
    -- Get or create asset
    v_a_COLCH_O_DE_AR_2_LPT_15_51 := public.get_or_create_ativo('12089', 'COLCHÃO DE AR 2 LPT-15', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_COLCH_O_DE_AR_2_LPT_15_51 := public.get_or_create_planejamento(
        v_a_COLCH_O_DE_AR_2_LPT_15_51,
        'Preventiva ' || 'COLCHÃO DE AR 2 LPT-15',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_COLCH_O_DE_AR_3__SALA_DE_TESTE_52 uuid;
    v_p_COLCH_O_DE_AR_3__SALA_DE_TESTE_52 uuid;
BEGIN
    -- Get or create asset
    v_a_COLCH_O_DE_AR_3__SALA_DE_TESTE_52 := public.get_or_create_ativo(NULL, 'COLCHÃO DE AR 3 (SALA DE TESTE)', 'SALA DE TESTE (GALPÃO NOVO)', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_COLCH_O_DE_AR_3__SALA_DE_TESTE_52 := public.get_or_create_planejamento(
        v_a_COLCH_O_DE_AR_3__SALA_DE_TESTE_52,
        'Preventiva ' || 'COLCHÃO DE AR 3 (SALA DE TESTE)',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_COMPRESSOR_1_RESERVA_53 uuid;
    v_p_COMPRESSOR_1_RESERVA_53 uuid;
BEGIN
    -- Get or create asset
    v_a_COMPRESSOR_1_RESERVA_53 := public.get_or_create_ativo('8764', 'COMPRESSOR 1 RESERVA', 'ÁREA DE COMPRESSORES MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_COMPRESSOR_1_RESERVA_53 := public.get_or_create_planejamento(
        v_a_COMPRESSOR_1_RESERVA_53,
        'Preventiva ' || 'COMPRESSOR 1 RESERVA',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_COMPRESSOR_2_PRINCIPAL_54 uuid;
    v_p_COMPRESSOR_2_PRINCIPAL_54 uuid;
BEGIN
    -- Get or create asset
    v_a_COMPRESSOR_2_PRINCIPAL_54 := public.get_or_create_ativo('3168', 'COMPRESSOR 2 PRINCIPAL', 'ÁREA DE COMPRESSORES MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_COMPRESSOR_2_PRINCIPAL_54 := public.get_or_create_planejamento(
        v_a_COMPRESSOR_2_PRINCIPAL_54,
        'Preventiva ' || 'COMPRESSOR 2 PRINCIPAL',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_COMPRESSOR_3_55 uuid;
    v_p_COMPRESSOR_3_55 uuid;
BEGIN
    -- Get or create asset
    v_a_COMPRESSOR_3_55 := public.get_or_create_ativo('6650', 'COMPRESSOR 3', 'CALDEIRARIA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_COMPRESSOR_3_55 := public.get_or_create_planejamento(
        v_a_COMPRESSOR_3_55,
        'Preventiva ' || 'COMPRESSOR 3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_COMPRESSOR_4__JATO__56 uuid;
    v_p_COMPRESSOR_4__JATO__56 uuid;
BEGIN
    -- Get or create asset
    v_a_COMPRESSOR_4__JATO__56 := public.get_or_create_ativo(NULL, 'COMPRESSOR 4 (JATO)', 'ÁREA DE COMPRESSORES MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_COMPRESSOR_4__JATO__56 := public.get_or_create_planejamento(
        v_a_COMPRESSOR_4__JATO__56,
        'Preventiva ' || 'COMPRESSOR 4 (JATO)',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_COMPRESSOR_6_57 uuid;
    v_p_COMPRESSOR_6_57 uuid;
BEGIN
    -- Get or create asset
    v_a_COMPRESSOR_6_57 := public.get_or_create_ativo('5222', 'COMPRESSOR 6', 'GALPÃO DE BOBINAS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_COMPRESSOR_6_57 := public.get_or_create_planejamento(
        v_a_COMPRESSOR_6_57,
        'Preventiva ' || 'COMPRESSOR 6',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_COMPRESSOR_7_58 uuid;
    v_p_COMPRESSOR_7_58 uuid;
BEGIN
    -- Get or create asset
    v_a_COMPRESSOR_7_58 := public.get_or_create_ativo(NULL, 'COMPRESSOR 7', 'CALDEIRARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_COMPRESSOR_7_58 := public.get_or_create_planejamento(
        v_a_COMPRESSOR_7_58,
        'Preventiva ' || 'COMPRESSOR 7',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[2, 5, 8, 11]
    );
END $$;

DO $$
DECLARE
    v_a_COMPRESSOR_8_59 uuid;
    v_p_COMPRESSOR_8_59 uuid;
BEGIN
    -- Get or create asset
    v_a_COMPRESSOR_8_59 := public.get_or_create_ativo('5069', 'COMPRESSOR 8', 'CALDEIRARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_COMPRESSOR_8_59 := public.get_or_create_planejamento(
        v_a_COMPRESSOR_8_59,
        'Preventiva ' || 'COMPRESSOR 8',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[2, 5, 8, 11]
    );
END $$;

DO $$
DECLARE
    v_a_COMPRESSOR_9_60 uuid;
    v_p_COMPRESSOR_9_60 uuid;
BEGIN
    -- Get or create asset
    v_a_COMPRESSOR_9_60 := public.get_or_create_ativo(NULL, 'COMPRESSOR 9', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_COMPRESSOR_9_60 := public.get_or_create_planejamento(
        v_a_COMPRESSOR_9_60,
        'Preventiva ' || 'COMPRESSOR 9',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_COMPRESSOR_10_61 uuid;
    v_p_COMPRESSOR_10_61 uuid;
BEGIN
    -- Get or create asset
    v_a_COMPRESSOR_10_61 := public.get_or_create_ativo(NULL, 'COMPRESSOR 10', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_COMPRESSOR_10_61 := public.get_or_create_planejamento(
        v_a_COMPRESSOR_10_61,
        'Preventiva ' || 'COMPRESSOR 10',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_CONJUNTO_DE_GERADORES__G1__G2__62 uuid;
    v_p_CONJUNTO_DE_GERADORES__G1__G2__62 uuid;
BEGIN
    -- Get or create asset
    v_a_CONJUNTO_DE_GERADORES__G1__G2__62 := public.get_or_create_ativo(NULL, 'CONJUNTO DE GERADORES (G1, G2 E G3)', 'SALA DE TESTE MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CONJUNTO_DE_GERADORES__G1__G2__62 := public.get_or_create_planejamento(
        v_a_CONJUNTO_DE_GERADORES__G1__G2__62,
        'Preventiva ' || 'CONJUNTO DE GERADORES (G1, G2 E G3)',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Anual',
        ARRAY[8]
    );
END $$;

DO $$
DECLARE
    v_a_CONJUNTO_DE_TP_s_E_TC_s__PAINE_63 uuid;
    v_p_CONJUNTO_DE_TP_s_E_TC_s__PAINE_63 uuid;
BEGIN
    -- Get or create asset
    v_a_CONJUNTO_DE_TP_s_E_TC_s__PAINE_63 := public.get_or_create_ativo(NULL, 'CONJUNTO DE TP´s E TC´s (PAINEL G3)', 'SALA DE TESTE  MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CONJUNTO_DE_TP_s_E_TC_s__PAINE_63 := public.get_or_create_planejamento(
        v_a_CONJUNTO_DE_TP_s_E_TC_s__PAINE_63,
        'Preventiva ' || 'CONJUNTO DE TP´s E TC´s (PAINEL G3)',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Anual',
        ARRAY[8]
    );
END $$;

DO $$
DECLARE
    v_a_CONVERSOR_DE_CORRENTE_CONT_NUA_64 uuid;
    v_p_CONVERSOR_DE_CORRENTE_CONT_NUA_64 uuid;
BEGIN
    -- Get or create asset
    v_a_CONVERSOR_DE_CORRENTE_CONT_NUA_64 := public.get_or_create_ativo(NULL, 'CONVERSOR DE CORRENTE CONTÍNUA', 'SALA DE TESTE MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CONVERSOR_DE_CORRENTE_CONT_NUA_64 := public.get_or_create_planejamento(
        v_a_CONVERSOR_DE_CORRENTE_CONT_NUA_64,
        'Preventiva ' || 'CONVERSOR DE CORRENTE CONTÍNUA',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Anual',
        ARRAY[8]
    );
END $$;

DO $$
DECLARE
    v_a_CORTA_DISCO_1_65 uuid;
    v_p_CORTA_DISCO_1_65 uuid;
BEGIN
    -- Get or create asset
    v_a_CORTA_DISCO_1_65 := public.get_or_create_ativo('438', 'CORTA DISCO 1', 'GALPÃO BOBINAS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CORTA_DISCO_1_65 := public.get_or_create_planejamento(
        v_a_CORTA_DISCO_1_65,
        'Preventiva ' || 'CORTA DISCO 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_CORTA_DISCO_3_FRANHO_66 uuid;
    v_p_CORTA_DISCO_3_FRANHO_66 uuid;
BEGIN
    -- Get or create asset
    v_a_CORTA_DISCO_3_FRANHO_66 := public.get_or_create_ativo('4134', 'CORTA DISCO 3 FRANHO', 'CALDEIRARIA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_CORTA_DISCO_3_FRANHO_66 := public.get_or_create_planejamento(
        v_a_CORTA_DISCO_3_FRANHO_66,
        'Preventiva ' || 'CORTA DISCO 3 FRANHO',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_DESENGROSSADEIRA_1_67 uuid;
    v_p_DESENGROSSADEIRA_1_67 uuid;
BEGIN
    -- Get or create asset
    v_a_DESENGROSSADEIRA_1_67 := public.get_or_create_ativo('5608', 'DESENGROSSADEIRA 1', 'CARPINTARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_DESENGROSSADEIRA_1_67 := public.get_or_create_planejamento(
        v_a_DESENGROSSADEIRA_1_67,
        'Preventiva ' || 'DESENGROSSADEIRA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[2, 5, 8, 11]
    );
END $$;

DO $$
DECLARE
    v_a_DINAM_METRO_1_68 uuid;
    v_p_DINAM_METRO_1_68 uuid;
BEGIN
    -- Get or create asset
    v_a_DINAM_METRO_1_68 := public.get_or_create_ativo(NULL, 'DINAMÔMETRO 1', 'SALA DE TESTE MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_DINAM_METRO_1_68 := public.get_or_create_planejamento(
        v_a_DINAM_METRO_1_68,
        'Preventiva ' || 'DINAMÔMETRO 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_DISJUNTORES___CONTATORES___SEC_69 uuid;
    v_p_DISJUNTORES___CONTATORES___SEC_69 uuid;
BEGIN
    -- Get or create asset
    v_a_DISJUNTORES___CONTATORES___SEC_69 := public.get_or_create_ativo(NULL, 'DISJUNTORES / CONTATORES / SECCIONADORAS', 'SALA DE TESTE TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_DISJUNTORES___CONTATORES___SEC_69 := public.get_or_create_planejamento(
        v_a_DISJUNTORES___CONTATORES___SEC_69,
        'Preventiva ' || 'DISJUNTORES / CONTATORES / SECCIONADORAS',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Anual',
        ARRAY[8]
    );
END $$;

DO $$
DECLARE
    v_a_DOBRADEIRA_MANUAL_1_70 uuid;
    v_p_DOBRADEIRA_MANUAL_1_70 uuid;
BEGIN
    -- Get or create asset
    v_a_DOBRADEIRA_MANUAL_1_70 := public.get_or_create_ativo('6007', 'DOBRADEIRA MANUAL 1', 'BOBINAS TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_DOBRADEIRA_MANUAL_1_70 := public.get_or_create_planejamento(
        v_a_DOBRADEIRA_MANUAL_1_70,
        'Preventiva ' || 'DOBRADEIRA MANUAL 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_ELEVADOR_DE_CARGAS_1_71 uuid;
    v_p_ELEVADOR_DE_CARGAS_1_71 uuid;
BEGIN
    -- Get or create asset
    v_a_ELEVADOR_DE_CARGAS_1_71 := public.get_or_create_ativo('4236', 'ELEVADOR DE CARGAS 1', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ELEVADOR_DE_CARGAS_1_71 := public.get_or_create_planejamento(
        v_a_ELEVADOR_DE_CARGAS_1_71,
        'Preventiva ' || 'ELEVADOR DE CARGAS 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_ESQUADREJADEIRA_1_CALFRAN_72 uuid;
    v_p_ESQUADREJADEIRA_1_CALFRAN_72 uuid;
BEGIN
    -- Get or create asset
    v_a_ESQUADREJADEIRA_1_CALFRAN_72 := public.get_or_create_ativo('2392', 'ESQUADREJADEIRA 1 CALFRAN', 'CARPINTARIA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ESQUADREJADEIRA_1_CALFRAN_72 := public.get_or_create_planejamento(
        v_a_ESQUADREJADEIRA_1_CALFRAN_72,
        'Preventiva ' || 'ESQUADREJADEIRA 1 CALFRAN',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Anual',
        ARRAY[1]
    );
END $$;

DO $$
DECLARE
    v_a_ESQUADREJADEIRA_2_73 uuid;
    v_p_ESQUADREJADEIRA_2_73 uuid;
BEGIN
    -- Get or create asset
    v_a_ESQUADREJADEIRA_2_73 := public.get_or_create_ativo('467', 'ESQUADREJADEIRA 2', 'CARPINTARIA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ESQUADREJADEIRA_2_73 := public.get_or_create_planejamento(
        v_a_ESQUADREJADEIRA_2_73,
        'Preventiva ' || 'ESQUADREJADEIRA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Anual',
        ARRAY[1]
    );
END $$;

DO $$
DECLARE
    v_a_ESQUADREJADEIRA_3_SEC_3I___BAL_74 uuid;
    v_p_ESQUADREJADEIRA_3_SEC_3I___BAL_74 uuid;
BEGIN
    -- Get or create asset
    v_a_ESQUADREJADEIRA_3_SEC_3I___BAL_74 := public.get_or_create_ativo('7660', 'ESQUADREJADEIRA 3 SEC 3I - BALDAN', 'CARPINTARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ESQUADREJADEIRA_3_SEC_3I___BAL_74 := public.get_or_create_planejamento(
        v_a_ESQUADREJADEIRA_3_SEC_3I___BAL_74,
        'Preventiva ' || 'ESQUADREJADEIRA 3 SEC 3I - BALDAN',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_ESQUADREJADEIRA_4_RAZI_75 uuid;
    v_p_ESQUADREJADEIRA_4_RAZI_75 uuid;
BEGIN
    -- Get or create asset
    v_a_ESQUADREJADEIRA_4_RAZI_75 := public.get_or_create_ativo(NULL, 'ESQUADREJADEIRA 4 RAZI', 'CARPINTARIA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ESQUADREJADEIRA_4_RAZI_75 := public.get_or_create_planejamento(
        v_a_ESQUADREJADEIRA_4_RAZI_75,
        'Preventiva ' || 'ESQUADREJADEIRA 4 RAZI',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_ESQUADREJADEIRA_5_BALDAN_76 uuid;
    v_p_ESQUADREJADEIRA_5_BALDAN_76 uuid;
BEGIN
    -- Get or create asset
    v_a_ESQUADREJADEIRA_5_BALDAN_76 := public.get_or_create_ativo('2737', 'ESQUADREJADEIRA 5 BALDAN', 'CARPINTARIA TRAFO (AO LADO DA MANUTENÇÃO)', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ESQUADREJADEIRA_5_BALDAN_76 := public.get_or_create_planejamento(
        v_a_ESQUADREJADEIRA_5_BALDAN_76,
        'Preventiva ' || 'ESQUADREJADEIRA 5 BALDAN',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_ESTUFA_MT01_77 uuid;
    v_p_ESTUFA_MT01_77 uuid;
BEGIN
    -- Get or create asset
    v_a_ESTUFA_MT01_77 := public.get_or_create_ativo('1312', 'ESTUFA MT01', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ESTUFA_MT01_77 := public.get_or_create_planejamento(
        v_a_ESTUFA_MT01_77,
        'Preventiva ' || 'ESTUFA MT01',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    );
END $$;

DO $$
DECLARE
    v_a_ESTUFA_MT02_78 uuid;
    v_p_ESTUFA_MT02_78 uuid;
BEGIN
    -- Get or create asset
    v_a_ESTUFA_MT02_78 := public.get_or_create_ativo('3318', 'ESTUFA MT02', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ESTUFA_MT02_78 := public.get_or_create_planejamento(
        v_a_ESTUFA_MT02_78,
        'Preventiva ' || 'ESTUFA MT02',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    );
END $$;

DO $$
DECLARE
    v_a_ESTUFA_TRF01_79 uuid;
    v_p_ESTUFA_TRF01_79 uuid;
BEGIN
    -- Get or create asset
    v_a_ESTUFA_TRF01_79 := public.get_or_create_ativo('3377', 'ESTUFA TRF01', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ESTUFA_TRF01_79 := public.get_or_create_planejamento(
        v_a_ESTUFA_TRF01_79,
        'Preventiva ' || 'ESTUFA TRF01',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    );
END $$;

DO $$
DECLARE
    v_a_ESTUFA_TRF02_80 uuid;
    v_p_ESTUFA_TRF02_80 uuid;
BEGIN
    -- Get or create asset
    v_a_ESTUFA_TRF02_80 := public.get_or_create_ativo('4775', 'ESTUFA TRF02', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ESTUFA_TRF02_80 := public.get_or_create_planejamento(
        v_a_ESTUFA_TRF02_80,
        'Preventiva ' || 'ESTUFA TRF02',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    );
END $$;

DO $$
DECLARE
    v_a_ESTUFA_TRF03_81 uuid;
    v_p_ESTUFA_TRF03_81 uuid;
BEGIN
    -- Get or create asset
    v_a_ESTUFA_TRF03_81 := public.get_or_create_ativo(NULL, 'ESTUFA TRF03', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ESTUFA_TRF03_81 := public.get_or_create_planejamento(
        v_a_ESTUFA_TRF03_81,
        'Preventiva ' || 'ESTUFA TRF03',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    );
END $$;

DO $$
DECLARE
    v_a_ESTUFA_TRF04_82 uuid;
    v_p_ESTUFA_TRF04_82 uuid;
BEGIN
    -- Get or create asset
    v_a_ESTUFA_TRF04_82 := public.get_or_create_ativo('6138', 'ESTUFA TRF04', 'CARPINTARIA BOBINAS TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ESTUFA_TRF04_82 := public.get_or_create_planejamento(
        v_a_ESTUFA_TRF04_82,
        'Preventiva ' || 'ESTUFA TRF04',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    );
END $$;

DO $$
DECLARE
    v_a_EXAUSTOR_DE_P__1_83 uuid;
    v_p_EXAUSTOR_DE_P__1_83 uuid;
BEGIN
    -- Get or create asset
    v_a_EXAUSTOR_DE_P__1_83 := public.get_or_create_ativo('4957', 'EXAUSTOR DE PÓ 1', 'CARPINTARIA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_EXAUSTOR_DE_P__1_83 := public.get_or_create_planejamento(
        v_a_EXAUSTOR_DE_P__1_83,
        'Preventiva ' || 'EXAUSTOR DE PÓ 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_EXAUSTOR_DE_P__2_84 uuid;
    v_p_EXAUSTOR_DE_P__2_84 uuid;
BEGIN
    -- Get or create asset
    v_a_EXAUSTOR_DE_P__2_84 := public.get_or_create_ativo(NULL, 'EXAUSTOR DE PÓ 2', 'CARPINTARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_EXAUSTOR_DE_P__2_84 := public.get_or_create_planejamento(
        v_a_EXAUSTOR_DE_P__2_84,
        'Preventiva ' || 'EXAUSTOR DE PÓ 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_FILTRO_PRENSA_1_3_000_L_H_85 uuid;
    v_p_FILTRO_PRENSA_1_3_000_L_H_85 uuid;
BEGIN
    -- Get or create asset
    v_a_FILTRO_PRENSA_1_3_000_L_H_85 := public.get_or_create_ativo('2326', 'FILTRO PRENSA 1 3.000 L/H', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FILTRO_PRENSA_1_3_000_L_H_85 := public.get_or_create_planejamento(
        v_a_FILTRO_PRENSA_1_3_000_L_H_85,
        'Preventiva ' || 'FILTRO PRENSA 1 3.000 L/H',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_FILTRO_PRENSA_2_5000_L_H_86 uuid;
    v_p_FILTRO_PRENSA_2_5000_L_H_86 uuid;
BEGIN
    -- Get or create asset
    v_a_FILTRO_PRENSA_2_5000_L_H_86 := public.get_or_create_ativo('2327', 'FILTRO PRENSA 2 5000 L/H', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FILTRO_PRENSA_2_5000_L_H_86 := public.get_or_create_planejamento(
        v_a_FILTRO_PRENSA_2_5000_L_H_86,
        'Preventiva ' || 'FILTRO PRENSA 2 5000 L/H',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_FILTRO_PRENSA_3_6_500_L_H_87 uuid;
    v_p_FILTRO_PRENSA_3_6_500_L_H_87 uuid;
BEGIN
    -- Get or create asset
    v_a_FILTRO_PRENSA_3_6_500_L_H_87 := public.get_or_create_ativo('4237', 'FILTRO PRENSA 3 6.500 L/H', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FILTRO_PRENSA_3_6_500_L_H_87 := public.get_or_create_planejamento(
        v_a_FILTRO_PRENSA_3_6_500_L_H_87,
        'Preventiva ' || 'FILTRO PRENSA 3 6.500 L/H',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_FORMAS_EXPANS_VEIS_88 uuid;
    v_p_FORMAS_EXPANS_VEIS_88 uuid;
BEGIN
    -- Get or create asset
    v_a_FORMAS_EXPANS_VEIS_88 := public.get_or_create_ativo(NULL, 'FORMAS EXPANSÍVEIS', 'FÁBRICA GALPÃO TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FORMAS_EXPANS_VEIS_88 := public.get_or_create_planejamento(
        v_a_FORMAS_EXPANS_VEIS_88,
        'Preventiva ' || 'FORMAS EXPANSÍVEIS',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_FORNO___FORNAX_89 uuid;
    v_p_FORNO___FORNAX_89 uuid;
BEGIN
    -- Get or create asset
    v_a_FORNO___FORNAX_89 := public.get_or_create_ativo('9', 'FORNO - FORNAX', 'DESMANCHE', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FORNO___FORNAX_89 := public.get_or_create_planejamento(
        v_a_FORNO___FORNAX_89,
        'Preventiva ' || 'FORNO - FORNAX',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_FRESADORA_TUPIA_1_90 uuid;
    v_p_FRESADORA_TUPIA_1_90 uuid;
BEGIN
    -- Get or create asset
    v_a_FRESADORA_TUPIA_1_90 := public.get_or_create_ativo('2399', 'FRESADORA TUPIA 1', 'CARPINTARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FRESADORA_TUPIA_1_90 := public.get_or_create_planejamento(
        v_a_FRESADORA_TUPIA_1_90,
        'Preventiva ' || 'FRESADORA TUPIA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_BANCADA_1_91 uuid;
    v_p_FURADEIRA_DE_BANCADA_1_91 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_BANCADA_1_91 := public.get_or_create_ativo('8213', 'FURADEIRA DE BANCADA 1', 'EMBARALHAMENTO MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_BANCADA_1_91 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_BANCADA_1_91,
        'Preventiva ' || 'FURADEIRA DE BANCADA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_BANCADA_2_VONDER_92 uuid;
    v_p_FURADEIRA_DE_BANCADA_2_VONDER_92 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_BANCADA_2_VONDER_92 := public.get_or_create_ativo('5189', 'FURADEIRA DE BANCADA 2 VONDER', 'XL COILS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_BANCADA_2_VONDER_92 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_BANCADA_2_VONDER_92,
        'Preventiva ' || 'FURADEIRA DE BANCADA 2 VONDER',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_BANCADA_3_93 uuid;
    v_p_FURADEIRA_DE_BANCADA_3_93 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_BANCADA_3_93 := public.get_or_create_ativo('3682', 'FURADEIRA DE BANCADA 3', 'CARPINTARIA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_BANCADA_3_93 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_BANCADA_3_93,
        'Preventiva ' || 'FURADEIRA DE BANCADA 3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_BANCADA_4_94 uuid;
    v_p_FURADEIRA_DE_BANCADA_4_94 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_BANCADA_4_94 := public.get_or_create_ativo('2914', 'FURADEIRA DE BANCADA 4', 'COMUTADORES TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_BANCADA_4_94 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_BANCADA_4_94,
        'Preventiva ' || 'FURADEIRA DE BANCADA 4',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_BANCADA_5_95 uuid;
    v_p_FURADEIRA_DE_BANCADA_5_95 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_BANCADA_5_95 := public.get_or_create_ativo('3769', 'FURADEIRA DE BANCADA 5', 'COMUTADORES TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_BANCADA_5_95 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_BANCADA_5_95,
        'Preventiva ' || 'FURADEIRA DE BANCADA 5',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_BANCADA_7_96 uuid;
    v_p_FURADEIRA_DE_BANCADA_7_96 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_BANCADA_7_96 := public.get_or_create_ativo('2863', 'FURADEIRA DE BANCADA 7', 'MANUTENÇÃO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_BANCADA_7_96 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_BANCADA_7_96,
        'Preventiva ' || 'FURADEIRA DE BANCADA 7',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_COLUNA_1_97 uuid;
    v_p_FURADEIRA_DE_COLUNA_1_97 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_COLUNA_1_97 := public.get_or_create_ativo('4246', 'FURADEIRA DE COLUNA 1', 'PARTE ATIVA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_COLUNA_1_97 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_COLUNA_1_97,
        'Preventiva ' || 'FURADEIRA DE COLUNA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_COLUNA_2_98 uuid;
    v_p_FURADEIRA_DE_COLUNA_2_98 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_COLUNA_2_98 := public.get_or_create_ativo('6639', 'FURADEIRA DE COLUNA 2', 'CARPINTARIA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_COLUNA_2_98 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_COLUNA_2_98,
        'Preventiva ' || 'FURADEIRA DE COLUNA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_COLUNA_3_99 uuid;
    v_p_FURADEIRA_DE_COLUNA_3_99 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_COLUNA_3_99 := public.get_or_create_ativo('419', 'FURADEIRA DE COLUNA 3', 'COMUTADORES TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_COLUNA_3_99 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_COLUNA_3_99,
        'Preventiva ' || 'FURADEIRA DE COLUNA 3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_RADIAL_1_ROCCO_60_100 uuid;
    v_p_FURADEIRA_RADIAL_1_ROCCO_60_100 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_RADIAL_1_ROCCO_60_100 := public.get_or_create_ativo('4167', 'FURADEIRA RADIAL 1 ROCCO 60', 'CALDEIRARIA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_RADIAL_1_ROCCO_60_100 := public.get_or_create_planejamento(
        v_a_FURADEIRA_RADIAL_1_ROCCO_60_100,
        'Preventiva ' || 'FURADEIRA RADIAL 1 ROCCO 60',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_RADIAL_2_HOVAN_101 uuid;
    v_p_FURADEIRA_RADIAL_2_HOVAN_101 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_RADIAL_2_HOVAN_101 := public.get_or_create_ativo('306', 'FURADEIRA RADIAL 2 HOVAN', 'CALDEIRARIA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_RADIAL_2_HOVAN_101 := public.get_or_create_planejamento(
        v_a_FURADEIRA_RADIAL_2_HOVAN_101,
        'Preventiva ' || 'FURADEIRA RADIAL 2 HOVAN',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_GERADOR_1_GENERAC_750_KVA_102 uuid;
    v_p_GERADOR_1_GENERAC_750_KVA_102 uuid;
BEGIN
    -- Get or create asset
    v_a_GERADOR_1_GENERAC_750_KVA_102 := public.get_or_create_ativo('3683', 'GERADOR 1 GENERAC 750 KVA', 'ÁREA EXTERNA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_GERADOR_1_GENERAC_750_KVA_102 := public.get_or_create_planejamento(
        v_a_GERADOR_1_GENERAC_750_KVA_102,
        'Preventiva ' || 'GERADOR 1 GENERAC 750 KVA',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_GERADOR_2_HELMER_SILENT_150_KV_103 uuid;
    v_p_GERADOR_2_HELMER_SILENT_150_KV_103 uuid;
BEGIN
    -- Get or create asset
    v_a_GERADOR_2_HELMER_SILENT_150_KV_103 := public.get_or_create_ativo('7', 'GERADOR 2 HELMER SILENT 150 KVA', 'GALPÃO BOBINAS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_GERADOR_2_HELMER_SILENT_150_KV_103 := public.get_or_create_planejamento(
        v_a_GERADOR_2_HELMER_SILENT_150_KV_103,
        'Preventiva ' || 'GERADOR 2 HELMER SILENT 150 KVA',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_GERADOR_3_RODOAGRO_104 uuid;
    v_p_GERADOR_3_RODOAGRO_104 uuid;
BEGIN
    -- Get or create asset
    v_a_GERADOR_3_RODOAGRO_104 := public.get_or_create_ativo(NULL, 'GERADOR 3 RODOAGRO', 'GALPÃO BOBINAS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_GERADOR_3_RODOAGRO_104 := public.get_or_create_planejamento(
        v_a_GERADOR_3_RODOAGRO_104,
        'Preventiva ' || 'GERADOR 3 RODOAGRO',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_GUILHOTINA_1_105 uuid;
    v_p_GUILHOTINA_1_105 uuid;
BEGIN
    -- Get or create asset
    v_a_GUILHOTINA_1_105 := public.get_or_create_ativo(NULL, 'GUILHOTINA 1', 'CALDEIRARIA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_GUILHOTINA_1_105 := public.get_or_create_planejamento(
        v_a_GUILHOTINA_1_105,
        'Preventiva ' || 'GUILHOTINA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_GUILHOTINA_2_106 uuid;
    v_p_GUILHOTINA_2_106 uuid;
BEGIN
    -- Get or create asset
    v_a_GUILHOTINA_2_106 := public.get_or_create_ativo(NULL, 'GUILHOTINA 2', 'CALDEIRARIA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_GUILHOTINA_2_106 := public.get_or_create_planejamento(
        v_a_GUILHOTINA_2_106,
        'Preventiva ' || 'GUILHOTINA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_GUILHOTINA_3_PAPEL_O_107 uuid;
    v_p_GUILHOTINA_3_PAPEL_O_107 uuid;
BEGIN
    -- Get or create asset
    v_a_GUILHOTINA_3_PAPEL_O_107 := public.get_or_create_ativo('2414', 'GUILHOTINA 3 PAPELÃO', 'GALPÃO DE BOBINAS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_GUILHOTINA_3_PAPEL_O_107 := public.get_or_create_planejamento(
        v_a_GUILHOTINA_3_PAPEL_O_107,
        'Preventiva ' || 'GUILHOTINA 3 PAPELÃO',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_GUILHOTINA_4_NOMEX_108 uuid;
    v_p_GUILHOTINA_4_NOMEX_108 uuid;
BEGIN
    -- Get or create asset
    v_a_GUILHOTINA_4_NOMEX_108 := public.get_or_create_ativo(NULL, 'GUILHOTINA 4 NOMEX', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_GUILHOTINA_4_NOMEX_108 := public.get_or_create_planejamento(
        v_a_GUILHOTINA_4_NOMEX_108,
        'Preventiva ' || 'GUILHOTINA 4 NOMEX',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_GUILHOTINA_5_109 uuid;
    v_p_GUILHOTINA_5_109 uuid;
BEGIN
    -- Get or create asset
    v_a_GUILHOTINA_5_109 := public.get_or_create_ativo(NULL, 'GUILHOTINA 5', 'CARPINTARIA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_GUILHOTINA_5_109 := public.get_or_create_planejamento(
        v_a_GUILHOTINA_5_109,
        'Preventiva ' || 'GUILHOTINA 5',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[2, 5, 8, 11]
    );
END $$;

DO $$
DECLARE
    v_a_HYPOT_110 uuid;
    v_p_HYPOT_110 uuid;
BEGIN
    -- Get or create asset
    v_a_HYPOT_110 := public.get_or_create_ativo(NULL, 'HYPOT', 'SALA DE TESTE TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_HYPOT_110 := public.get_or_create_planejamento(
        v_a_HYPOT_110,
        'Preventiva ' || 'HYPOT',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Anual',
        ARRAY[8]
    );
END $$;

DO $$
DECLARE
    v_a_ISOLADORA_DE_BOBINA_1_CAM_111 uuid;
    v_p_ISOLADORA_DE_BOBINA_1_CAM_111 uuid;
BEGIN
    -- Get or create asset
    v_a_ISOLADORA_DE_BOBINA_1_CAM_111 := public.get_or_create_ativo('5', 'ISOLADORA DE BOBINA 1 CAM', 'ISOLAMENTO DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ISOLADORA_DE_BOBINA_1_CAM_111 := public.get_or_create_planejamento(
        v_a_ISOLADORA_DE_BOBINA_1_CAM_111,
        'Preventiva ' || 'ISOLADORA DE BOBINA 1 CAM',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_ISOLADORA_DE_BOBINA_3_MESA_112 uuid;
    v_p_ISOLADORA_DE_BOBINA_3_MESA_112 uuid;
BEGIN
    -- Get or create asset
    v_a_ISOLADORA_DE_BOBINA_3_MESA_112 := public.get_or_create_ativo('5087', 'ISOLADORA DE BOBINA 3 MESA', 'ISOLAMENTO DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ISOLADORA_DE_BOBINA_3_MESA_112 := public.get_or_create_planejamento(
        v_a_ISOLADORA_DE_BOBINA_3_MESA_112,
        'Preventiva ' || 'ISOLADORA DE BOBINA 3 MESA',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_KBK_1_500KG_113 uuid;
    v_p_KBK_1_500KG_113 uuid;
BEGIN
    -- Get or create asset
    v_a_KBK_1_500KG_113 := public.get_or_create_ativo(NULL, 'KBK 1 500KG', 'FÁBRICA DE BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_KBK_1_500KG_113 := public.get_or_create_planejamento(
        v_a_KBK_1_500KG_113,
        'Preventiva ' || 'KBK 1 500KG',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_KBK_2_1600_KG_114 uuid;
    v_p_KBK_2_1600_KG_114 uuid;
BEGIN
    -- Get or create asset
    v_a_KBK_2_1600_KG_114 := public.get_or_create_ativo(NULL, 'KBK 2 1600 KG', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_KBK_2_1600_KG_114 := public.get_or_create_planejamento(
        v_a_KBK_2_1600_KG_114,
        'Preventiva ' || 'KBK 2 1600 KG',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_KBK_3_2T_115 uuid;
    v_p_KBK_3_2T_115 uuid;
BEGIN
    -- Get or create asset
    v_a_KBK_3_2T_115 := public.get_or_create_ativo(NULL, 'KBK 3 2T', 'PREPARAÇÃO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_KBK_3_2T_115 := public.get_or_create_planejamento(
        v_a_KBK_3_2T_115,
        'Preventiva ' || 'KBK 3 2T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_LIXADEIRA_DE_FITA_1_116 uuid;
    v_p_LIXADEIRA_DE_FITA_1_116 uuid;
BEGIN
    -- Get or create asset
    v_a_LIXADEIRA_DE_FITA_1_116 := public.get_or_create_ativo('7505', 'LIXADEIRA DE FITA 1', 'CARPINTARIA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_LIXADEIRA_DE_FITA_1_116 := public.get_or_create_planejamento(
        v_a_LIXADEIRA_DE_FITA_1_116,
        'Preventiva ' || 'LIXADEIRA DE FITA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_LIXADEIRA_DE_FITA_2_117 uuid;
    v_p_LIXADEIRA_DE_FITA_2_117 uuid;
BEGIN
    -- Get or create asset
    v_a_LIXADEIRA_DE_FITA_2_117 := public.get_or_create_ativo('2398', 'LIXADEIRA DE FITA 2', 'CARPINTARIA - TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_LIXADEIRA_DE_FITA_2_117 := public.get_or_create_planejamento(
        v_a_LIXADEIRA_DE_FITA_2_117,
        'Preventiva ' || 'LIXADEIRA DE FITA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_LIXADEIRA_DE_FITA_3_BALDAN_118 uuid;
    v_p_LIXADEIRA_DE_FITA_3_BALDAN_118 uuid;
BEGIN
    -- Get or create asset
    v_a_LIXADEIRA_DE_FITA_3_BALDAN_118 := public.get_or_create_ativo('6604', 'LIXADEIRA DE FITA 3 BALDAN', 'CARPINTARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_LIXADEIRA_DE_FITA_3_BALDAN_118 := public.get_or_create_planejamento(
        v_a_LIXADEIRA_DE_FITA_3_BALDAN_118,
        'Preventiva ' || 'LIXADEIRA DE FITA 3 BALDAN',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_LIXADEIRA_DE_FITA_4_119 uuid;
    v_p_LIXADEIRA_DE_FITA_4_119 uuid;
BEGIN
    -- Get or create asset
    v_a_LIXADEIRA_DE_FITA_4_119 := public.get_or_create_ativo('4519', 'LIXADEIRA DE FITA 4', 'FÁBRICA BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_LIXADEIRA_DE_FITA_4_119 := public.get_or_create_planejamento(
        v_a_LIXADEIRA_DE_FITA_4_119,
        'Preventiva ' || 'LIXADEIRA DE FITA 4',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_MANDRILHADORA_1_120 uuid;
    v_p_MANDRILHADORA_1_120 uuid;
BEGIN
    -- Get or create asset
    v_a_MANDRILHADORA_1_120 := public.get_or_create_ativo('5602', 'MANDRILHADORA 1', 'USINAGEM', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_MANDRILHADORA_1_120 := public.get_or_create_planejamento(
        v_a_MANDRILHADORA_1_120,
        'Preventiva ' || 'MANDRILHADORA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_MAQUINA_TAQUINHO_1_FT_TK2000_121 uuid;
    v_p_MAQUINA_TAQUINHO_1_FT_TK2000_121 uuid;
BEGIN
    -- Get or create asset
    v_a_MAQUINA_TAQUINHO_1_FT_TK2000_121 := public.get_or_create_ativo(NULL, 'MAQUINA TAQUINHO 1 FT-TK2000', 'CARPINTARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_MAQUINA_TAQUINHO_1_FT_TK2000_121 := public.get_or_create_planejamento(
        v_a_MAQUINA_TAQUINHO_1_FT_TK2000_121,
        'Preventiva ' || 'MAQUINA TAQUINHO 1 FT-TK2000',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_MODELADORA_DE_BARRA_1_122 uuid;
    v_p_MODELADORA_DE_BARRA_1_122 uuid;
BEGIN
    -- Get or create asset
    v_a_MODELADORA_DE_BARRA_1_122 := public.get_or_create_ativo('8085', 'MODELADORA DE BARRA 1', 'BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_MODELADORA_DE_BARRA_1_122 := public.get_or_create_planejamento(
        v_a_MODELADORA_DE_BARRA_1_122,
        'Preventiva ' || 'MODELADORA DE BARRA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_MODELADOR_DE_BARRA_2_123 uuid;
    v_p_MODELADOR_DE_BARRA_2_123 uuid;
BEGIN
    -- Get or create asset
    v_a_MODELADOR_DE_BARRA_2_123 := public.get_or_create_ativo(NULL, 'MODELADOR DE BARRA 2', 'FÁBRICA BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_MODELADOR_DE_BARRA_2_123 := public.get_or_create_planejamento(
        v_a_MODELADOR_DE_BARRA_2_123,
        'Preventiva ' || 'MODELADOR DE BARRA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_MODELADOR_DE_LOOP_1_124 uuid;
    v_p_MODELADOR_DE_LOOP_1_124 uuid;
BEGIN
    -- Get or create asset
    v_a_MODELADOR_DE_LOOP_1_124 := public.get_or_create_ativo('5092', 'MODELADOR DE LOOP 1', 'FÁBRICA DE BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_MODELADOR_DE_LOOP_1_124 := public.get_or_create_planejamento(
        v_a_MODELADOR_DE_LOOP_1_124,
        'Preventiva ' || 'MODELADOR DE LOOP 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_BANDAGEM_1_125 uuid;
    v_p_M_QUINA_BANDAGEM_1_125 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_BANDAGEM_1_125 := public.get_or_create_ativo('593', 'MÁQUINA BANDAGEM 1', 'ARMADURA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_BANDAGEM_1_125 := public.get_or_create_planejamento(
        v_a_M_QUINA_BANDAGEM_1_125,
        'Preventiva ' || 'MÁQUINA BANDAGEM 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_BANDAGEM_2_126 uuid;
    v_p_M_QUINA_BANDAGEM_2_126 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_BANDAGEM_2_126 := public.get_or_create_ativo('5292', 'MÁQUINA BANDAGEM 2', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_BANDAGEM_2_126 := public.get_or_create_planejamento(
        v_a_M_QUINA_BANDAGEM_2_126,
        'Preventiva ' || 'MÁQUINA BANDAGEM 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_AR_SECO_1_FARGON_127 uuid;
    v_p_M_QUINA_DE_AR_SECO_1_FARGON_127 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_AR_SECO_1_FARGON_127 := public.get_or_create_ativo('4289', 'MÁQUINA DE AR SECO 1 FARGON', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_AR_SECO_1_FARGON_127 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_AR_SECO_1_FARGON_127,
        'Preventiva ' || 'MÁQUINA DE AR SECO 1 FARGON',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_AR_SECO_2_ENIPLAN_128 uuid;
    v_p_M_QUINA_DE_AR_SECO_2_ENIPLAN_128 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_AR_SECO_2_ENIPLAN_128 := public.get_or_create_ativo(NULL, 'MÁQUINA DE AR SECO 2 ENIPLAN', 'FECHAMENTO - TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_AR_SECO_2_ENIPLAN_128 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_AR_SECO_2_ENIPLAN_128,
        'Preventiva ' || 'MÁQUINA DE AR SECO 2 ENIPLAN',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_AR_SECO_3_14000___6_129 uuid;
    v_p_M_QUINA_DE_AR_SECO_3_14000___6_129 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_AR_SECO_3_14000___6_129 := public.get_or_create_ativo('31', 'MÁQUINA DE AR SECO 3 14000 - 601', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_AR_SECO_3_14000___6_129 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_AR_SECO_3_14000___6_129,
        'Preventiva ' || 'MÁQUINA DE AR SECO 3 14000 - 601',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_AR_SECO_4_DSL9_130 uuid;
    v_p_M_QUINA_DE_AR_SECO_4_DSL9_130 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_AR_SECO_4_DSL9_130 := public.get_or_create_ativo('27', 'MÁQUINA DE AR SECO 4 DSL9', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_AR_SECO_4_DSL9_130 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_AR_SECO_4_DSL9_130,
        'Preventiva ' || 'MÁQUINA DE AR SECO 4 DSL9',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_CONSOLIDAR_1___ZCN_131 uuid;
    v_p_M_QUINA_DE_CONSOLIDAR_1___ZCN_131 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_CONSOLIDAR_1___ZCN_131 := public.get_or_create_ativo('13496', 'MÁQUINA DE CONSOLIDAR 1 - ZCN', 'FÁBRICA DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_CONSOLIDAR_1___ZCN_131 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_CONSOLIDAR_1___ZCN_131,
        'Preventiva ' || 'MÁQUINA DE CONSOLIDAR 1 - ZCN',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_CONSOLIDAR_2___ZCN_132 uuid;
    v_p_M_QUINA_DE_CONSOLIDAR_2___ZCN_132 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_CONSOLIDAR_2___ZCN_132 := public.get_or_create_ativo(NULL, 'MÁQUINA DE CONSOLIDAR 2 - ZCN', 'FÁBRICA DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_CONSOLIDAR_2___ZCN_132 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_CONSOLIDAR_2___ZCN_132,
        'Preventiva ' || 'MÁQUINA DE CONSOLIDAR 2 - ZCN',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_LAVAR_1_KARCHER_133 uuid;
    v_p_M_QUINA_DE_LAVAR_1_KARCHER_133 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_LAVAR_1_KARCHER_133 := public.get_or_create_ativo('11875', 'MÁQUINA DE LAVAR 1 KARCHER', 'LAVADOR MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_LAVAR_1_KARCHER_133 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_LAVAR_1_KARCHER_133,
        'Preventiva ' || 'MÁQUINA DE LAVAR 1 KARCHER',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_LAVAR_2_KARCHER_134 uuid;
    v_p_M_QUINA_DE_LAVAR_2_KARCHER_134 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_LAVAR_2_KARCHER_134 := public.get_or_create_ativo('10304', 'MÁQUINA DE LAVAR 2 KARCHER', 'LAVADOR TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_LAVAR_2_KARCHER_134 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_LAVAR_2_KARCHER_134,
        'Preventiva ' || 'MÁQUINA DE LAVAR 2 KARCHER',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_LAVAR_3_KARCHER_135 uuid;
    v_p_M_QUINA_DE_LAVAR_3_KARCHER_135 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_LAVAR_3_KARCHER_135 := public.get_or_create_ativo(NULL, 'MÁQUINA DE LAVAR 3 KARCHER', 'LAVADOR TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_LAVAR_3_KARCHER_135 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_LAVAR_3_KARCHER_135,
        'Preventiva ' || 'MÁQUINA DE LAVAR 3 KARCHER',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_MODELAR_2_GRANDE_136 uuid;
    v_p_M_QUINA_DE_MODELAR_2_GRANDE_136 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_MODELAR_2_GRANDE_136 := public.get_or_create_ativo('17', 'MÁQUINA DE MODELAR 2 GRANDE', 'ISOLAMENTO DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_MODELAR_2_GRANDE_136 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_MODELAR_2_GRANDE_136,
        'Preventiva ' || 'MÁQUINA DE MODELAR 2 GRANDE',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 5, 9]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_MODELAR_3_137 uuid;
    v_p_M_QUINA_DE_MODELAR_3_137 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_MODELAR_3_137 := public.get_or_create_ativo('5085', 'MÁQUINA DE MODELAR 3', 'ISOLAMENTO DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_MODELAR_3_137 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_MODELAR_3_137,
        'Preventiva ' || 'MÁQUINA DE MODELAR 3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_PASSAR_CADAR_O_1____138 uuid;
    v_p_M_QUINA_DE_PASSAR_CADAR_O_1____138 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_PASSAR_CADAR_O_1____138 := public.get_or_create_ativo('13497', 'MÁQUINA DE PASSAR CADARÇO 1 - ZCN', 'ISOLAMENTO DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_PASSAR_CADAR_O_1____138 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_PASSAR_CADAR_O_1____138,
        'Preventiva ' || 'MÁQUINA DE PASSAR CADARÇO 1 - ZCN',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DECAPAGEM_DE_FIO_01_139 uuid;
    v_p_M_QUINA_DECAPAGEM_DE_FIO_01_139 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DECAPAGEM_DE_FIO_01_139 := public.get_or_create_ativo('2264', 'MÁQUINA DECAPAGEM DE FIO 01', 'ISOLAMENTO DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DECAPAGEM_DE_FIO_01_139 := public.get_or_create_planejamento(
        v_a_M_QUINA_DECAPAGEM_DE_FIO_01_139,
        'Preventiva ' || 'MÁQUINA DECAPAGEM DE FIO 01',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[1, 7]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DECAPAGEM_DE_FIO_02_140 uuid;
    v_p_M_QUINA_DECAPAGEM_DE_FIO_02_140 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DECAPAGEM_DE_FIO_02_140 := public.get_or_create_ativo('5084', 'MÁQUINA DECAPAGEM DE FIO 02', 'ISOLAMENTO DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DECAPAGEM_DE_FIO_02_140 := public.get_or_create_planejamento(
        v_a_M_QUINA_DECAPAGEM_DE_FIO_02_140,
        'Preventiva ' || 'MÁQUINA DECAPAGEM DE FIO 02',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[1, 7]
    );
END $$;

DO $$
DECLARE
    v_a_NOBREAK_1_CPD_ADM_141 uuid;
    v_p_NOBREAK_1_CPD_ADM_141 uuid;
BEGIN
    -- Get or create asset
    v_a_NOBREAK_1_CPD_ADM_141 := public.get_or_create_ativo(NULL, 'NOBREAK 1 CPD ADM', 'CPD ADM', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_NOBREAK_1_CPD_ADM_141 := public.get_or_create_planejamento(
        v_a_NOBREAK_1_CPD_ADM_141,
        'Preventiva ' || 'NOBREAK 1 CPD ADM',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_NOBREAK_2_CPD_MOTOR_142 uuid;
    v_p_NOBREAK_2_CPD_MOTOR_142 uuid;
BEGIN
    -- Get or create asset
    v_a_NOBREAK_2_CPD_MOTOR_142 := public.get_or_create_ativo(NULL, 'NOBREAK 2 CPD MOTOR', 'CPD MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_NOBREAK_2_CPD_MOTOR_142 := public.get_or_create_planejamento(
        v_a_NOBREAK_2_CPD_MOTOR_142,
        'Preventiva ' || 'NOBREAK 2 CPD MOTOR',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_NOBREAK_3_CPD_TRAFO_143 uuid;
    v_p_NOBREAK_3_CPD_TRAFO_143 uuid;
BEGIN
    -- Get or create asset
    v_a_NOBREAK_3_CPD_TRAFO_143 := public.get_or_create_ativo(NULL, 'NOBREAK 3 CPD TRAFO', 'CPD TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_NOBREAK_3_CPD_TRAFO_143 := public.get_or_create_planejamento(
        v_a_NOBREAK_3_CPD_TRAFO_143,
        'Preventiva ' || 'NOBREAK 3 CPD TRAFO',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_PAIN_IS_EL_TRICOS_COMUTA__O_CC_144 uuid;
    v_p_PAIN_IS_EL_TRICOS_COMUTA__O_CC_144 uuid;
BEGIN
    -- Get or create asset
    v_a_PAIN_IS_EL_TRICOS_COMUTA__O_CC_144 := public.get_or_create_ativo(NULL, 'PAINÉIS ELÉTRICOS COMUTAÇÃO CC', 'FÁBRICA TRAFO (SALA DE TESTES)', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PAIN_IS_EL_TRICOS_COMUTA__O_CC_144 := public.get_or_create_planejamento(
        v_a_PAIN_IS_EL_TRICOS_COMUTA__O_CC_144,
        'Preventiva ' || 'PAINÉIS ELÉTRICOS COMUTAÇÃO CC',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PALETEIRA_EL_TRICA_1_145 uuid;
    v_p_PALETEIRA_EL_TRICA_1_145 uuid;
BEGIN
    -- Get or create asset
    v_a_PALETEIRA_EL_TRICA_1_145 := public.get_or_create_ativo(NULL, 'PALETEIRA ELÉTRICA 1', 'FÁBRICA DE BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PALETEIRA_EL_TRICA_1_145 := public.get_or_create_planejamento(
        v_a_PALETEIRA_EL_TRICA_1_145,
        'Preventiva ' || 'PALETEIRA ELÉTRICA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[1, 7]
    );
END $$;

DO $$
DECLARE
    v_a_PLATAFORMA_ELEVAT_RIA_1_146 uuid;
    v_p_PLATAFORMA_ELEVAT_RIA_1_146 uuid;
BEGIN
    -- Get or create asset
    v_a_PLATAFORMA_ELEVAT_RIA_1_146 := public.get_or_create_ativo(NULL, 'PLATAFORMA ELEVATÓRIA 1', 'COMUTAÇÃO TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PLATAFORMA_ELEVAT_RIA_1_146 := public.get_or_create_planejamento(
        v_a_PLATAFORMA_ELEVAT_RIA_1_146,
        'Preventiva ' || 'PLATAFORMA ELEVATÓRIA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[1, 7]
    );
END $$;

DO $$
DECLARE
    v_a_PLATAFORMA_ELEVAT_RIA_2_147 uuid;
    v_p_PLATAFORMA_ELEVAT_RIA_2_147 uuid;
BEGIN
    -- Get or create asset
    v_a_PLATAFORMA_ELEVAT_RIA_2_147 := public.get_or_create_ativo(NULL, 'PLATAFORMA ELEVATÓRIA 2', 'COMUTAÇÃO TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PLATAFORMA_ELEVAT_RIA_2_147 := public.get_or_create_planejamento(
        v_a_PLATAFORMA_ELEVAT_RIA_2_147,
        'Preventiva ' || 'PLATAFORMA ELEVATÓRIA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[1, 7]
    );
END $$;

DO $$
DECLARE
    v_a_POLICORTE__1_148 uuid;
    v_p_POLICORTE__1_148 uuid;
BEGIN
    -- Get or create asset
    v_a_POLICORTE__1_148 := public.get_or_create_ativo(NULL, 'POLICORTE  1', 'CALDEIRARIA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_POLICORTE__1_148 := public.get_or_create_planejamento(
        v_a_POLICORTE__1_148,
        'Preventiva ' || 'POLICORTE  1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_POLICORTE__2_149 uuid;
    v_p_POLICORTE__2_149 uuid;
BEGIN
    -- Get or create asset
    v_a_POLICORTE__2_149 := public.get_or_create_ativo(NULL, 'POLICORTE  2', 'MANUTENÇÃO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_POLICORTE__2_149 := public.get_or_create_planejamento(
        v_a_POLICORTE__2_149,
        'Preventiva ' || 'POLICORTE  2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_POLICORTE__3_150 uuid;
    v_p_POLICORTE__3_150 uuid;
BEGIN
    -- Get or create asset
    v_a_POLICORTE__3_150 := public.get_or_create_ativo(NULL, 'POLICORTE  3', 'CALDEIRARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_POLICORTE__3_150 := public.get_or_create_planejamento(
        v_a_POLICORTE__3_150,
        'Preventiva ' || 'POLICORTE  3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_1_10T_151 uuid;
    v_p_PONTE_ROLANTE_1_10T_151 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_1_10T_151 := public.get_or_create_ativo('PR 01', 'PONTE ROLANTE 1 10T', 'GALPÃO BOBINAS - TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_1_10T_151 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_1_10T_151,
        'Preventiva ' || 'PONTE ROLANTE 1 10T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_2_10T_152 uuid;
    v_p_PONTE_ROLANTE_2_10T_152 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_2_10T_152 := public.get_or_create_ativo('PR 02', 'PONTE ROLANTE 2 10T', 'GALPÃO BOBINAS - TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_2_10T_152 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_2_10T_152,
        'Preventiva ' || 'PONTE ROLANTE 2 10T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_4_10T_153 uuid;
    v_p_PONTE_ROLANTE_4_10T_153 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_4_10T_153 := public.get_or_create_ativo('PR 04', 'PONTE ROLANTE 4 10T', 'EXPEDIÇÃO - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_4_10T_153 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_4_10T_153,
        'Preventiva ' || 'PONTE ROLANTE 4 10T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 5, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_5_15T_154 uuid;
    v_p_PONTE_ROLANTE_5_15T_154 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_5_15T_154 := public.get_or_create_ativo('PR 05', 'PONTE ROLANTE 5 15T', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_5_15T_154 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_5_15T_154,
        'Preventiva ' || 'PONTE ROLANTE 5 15T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 5, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_6_10T_155 uuid;
    v_p_PONTE_ROLANTE_6_10T_155 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_6_10T_155 := public.get_or_create_ativo('PR 06', 'PONTE ROLANTE 6 10T', 'EMBARALHAMENTO - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_6_10T_155 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_6_10T_155,
        'Preventiva ' || 'PONTE ROLANTE 6 10T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_7_10T_156 uuid;
    v_p_PONTE_ROLANTE_7_10T_156 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_7_10T_156 := public.get_or_create_ativo('PR 07', 'PONTE ROLANTE 7 10T', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_7_10T_156 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_7_10T_156,
        'Preventiva ' || 'PONTE ROLANTE 7 10T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 5, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_8_8T_157 uuid;
    v_p_PONTE_ROLANTE_8_8T_157 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_8_8T_157 := public.get_or_create_ativo('PR 08', 'PONTE ROLANTE 8 8T', 'USINAGEM - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_8_8T_157 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_8_8T_157,
        'Preventiva ' || 'PONTE ROLANTE 8 8T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_9_25T_158 uuid;
    v_p_PONTE_ROLANTE_9_25T_158 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_9_25T_158 := public.get_or_create_ativo('PR 09', 'PONTE ROLANTE 9 25T', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_9_25T_158 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_9_25T_158,
        'Preventiva ' || 'PONTE ROLANTE 9 25T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_10_25T_159 uuid;
    v_p_PONTE_ROLANTE_10_25T_159 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_10_25T_159 := public.get_or_create_ativo('PR 10', 'PONTE ROLANTE 10 25T', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_10_25T_159 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_10_25T_159,
        'Preventiva ' || 'PONTE ROLANTE 10 25T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_11_25T_160 uuid;
    v_p_PONTE_ROLANTE_11_25T_160 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_11_25T_160 := public.get_or_create_ativo('PR 11', 'PONTE ROLANTE 11 25T', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_11_25T_160 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_11_25T_160,
        'Preventiva ' || 'PONTE ROLANTE 11 25T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_12_5T_161 uuid;
    v_p_PONTE_ROLANTE_12_5T_161 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_12_5T_161 := public.get_or_create_ativo('PR 12', 'PONTE ROLANTE 12 5T', 'CALDEIRARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_12_5T_161 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_12_5T_161,
        'Preventiva ' || 'PONTE ROLANTE 12 5T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_13_GH_32T_162 uuid;
    v_p_PONTE_ROLANTE_13_GH_32T_162 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_13_GH_32T_162 := public.get_or_create_ativo('PR 13', 'PONTE ROLANTE 13 GH 32T', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_13_GH_32T_162 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_13_GH_32T_162,
        'Preventiva ' || 'PONTE ROLANTE 13 GH 32T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 3, 9]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_14_GH_80T_163 uuid;
    v_p_PONTE_ROLANTE_14_GH_80T_163 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_14_GH_80T_163 := public.get_or_create_ativo('PR 14', 'PONTE ROLANTE 14 GH 80T', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_14_GH_80T_163 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_14_GH_80T_163,
        'Preventiva ' || 'PONTE ROLANTE 14 GH 80T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_15_GH_80T_164 uuid;
    v_p_PONTE_ROLANTE_15_GH_80T_164 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_15_GH_80T_164 := public.get_or_create_ativo('PR 15', 'PONTE ROLANTE 15 GH 80T', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_15_GH_80T_164 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_15_GH_80T_164,
        'Preventiva ' || 'PONTE ROLANTE 15 GH 80T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 7]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_16_GH_10T_165 uuid;
    v_p_PONTE_ROLANTE_16_GH_10T_165 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_16_GH_10T_165 := public.get_or_create_ativo('PR 16', 'PONTE ROLANTE 16 GH 10T', 'BOBINAS PARREIRA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_16_GH_10T_165 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_16_GH_10T_165,
        'Preventiva ' || 'PONTE ROLANTE 16 GH 10T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_17_GH_4T_166 uuid;
    v_p_PONTE_ROLANTE_17_GH_4T_166 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_17_GH_4T_166 := public.get_or_create_ativo('PR 17', 'PONTE ROLANTE 17 GH 4T', 'SALA DE TESTE (GALPÃO NOVO)', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_17_GH_4T_166 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_17_GH_4T_166,
        'Preventiva ' || 'PONTE ROLANTE 17 GH 4T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_18_GH_4T_167 uuid;
    v_p_PONTE_ROLANTE_18_GH_4T_167 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_18_GH_4T_167 := public.get_or_create_ativo('PR 18', 'PONTE ROLANTE 18 GH 4T', 'SALA DE TESTE (GALPÃO NOVO)', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_18_GH_4T_167 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_18_GH_4T_167,
        'Preventiva ' || 'PONTE ROLANTE 18 GH 4T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_PRENSA_1_300T_168 uuid;
    v_p_PRENSA_1_300T_168 uuid;
BEGIN
    -- Get or create asset
    v_a_PRENSA_1_300T_168 := public.get_or_create_ativo('4220', 'PRENSA 1 300T', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PRENSA_1_300T_168 := public.get_or_create_planejamento(
        v_a_PRENSA_1_300T_168,
        'Preventiva ' || 'PRENSA 1 300T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_PRENSA_2_200T_169 uuid;
    v_p_PRENSA_2_200T_169 uuid;
BEGIN
    -- Get or create asset
    v_a_PRENSA_2_200T_169 := public.get_or_create_ativo('5083', 'PRENSA 2 200T', 'BOBINAS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PRENSA_2_200T_169 := public.get_or_create_planejamento(
        v_a_PRENSA_2_200T_169,
        'Preventiva ' || 'PRENSA 2 200T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[1, 7]
    );
END $$;

DO $$
DECLARE
    v_a_PRENSA_4_PAPEL_O_170 uuid;
    v_p_PRENSA_4_PAPEL_O_170 uuid;
BEGIN
    -- Get or create asset
    v_a_PRENSA_4_PAPEL_O_170 := public.get_or_create_ativo('4955', 'PRENSA 4 PAPELÃO', 'GALPÃO DE BOBINAS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PRENSA_4_PAPEL_O_170 := public.get_or_create_planejamento(
        v_a_PRENSA_4_PAPEL_O_170,
        'Preventiva ' || 'PRENSA 4 PAPELÃO',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_P_RTICO_1___1T_171 uuid;
    v_p_P_RTICO_1___1T_171 uuid;
BEGIN
    -- Get or create asset
    v_a_P_RTICO_1___1T_171 := public.get_or_create_ativo('490', 'PÓRTICO 1 - 1T', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_P_RTICO_1___1T_171 := public.get_or_create_planejamento(
        v_a_P_RTICO_1___1T_171,
        'Preventiva ' || 'PÓRTICO 1 - 1T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_P_RTICO_2___1_5T_172 uuid;
    v_p_P_RTICO_2___1_5T_172 uuid;
BEGIN
    -- Get or create asset
    v_a_P_RTICO_2___1_5T_172 := public.get_or_create_ativo('784', 'PÓRTICO 2 - 1,5T', 'PÓLO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_P_RTICO_2___1_5T_172 := public.get_or_create_planejamento(
        v_a_P_RTICO_2___1_5T_172,
        'Preventiva ' || 'PÓRTICO 2 - 1,5T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_P_RTICO_3___1_5T_173 uuid;
    v_p_P_RTICO_3___1_5T_173 uuid;
BEGIN
    -- Get or create asset
    v_a_P_RTICO_3___1_5T_173 := public.get_or_create_ativo('783', 'PÓRTICO 3 - 1,5T', 'COMUTADORES TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_P_RTICO_3___1_5T_173 := public.get_or_create_planejamento(
        v_a_P_RTICO_3___1_5T_173,
        'Preventiva ' || 'PÓRTICO 3 - 1,5T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_P_RTICO_4___2T_174 uuid;
    v_p_P_RTICO_4___2T_174 uuid;
BEGIN
    -- Get or create asset
    v_a_P_RTICO_4___2T_174 := public.get_or_create_ativo(NULL, 'PÓRTICO 4 - 2T', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_P_RTICO_4___2T_174 := public.get_or_create_planejamento(
        v_a_P_RTICO_4___2T_174,
        'Preventiva ' || 'PÓRTICO 4 - 2T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_P_RTICO_5___2T_175 uuid;
    v_p_P_RTICO_5___2T_175 uuid;
BEGIN
    -- Get or create asset
    v_a_P_RTICO_5___2T_175 := public.get_or_create_ativo(NULL, 'PÓRTICO 5 - 2T', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_P_RTICO_5___2T_175 := public.get_or_create_planejamento(
        v_a_P_RTICO_5___2T_175,
        'Preventiva ' || 'PÓRTICO 5 - 2T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_P_RTICO_6___6_3T_176 uuid;
    v_p_P_RTICO_6___6_3T_176 uuid;
BEGIN
    -- Get or create asset
    v_a_P_RTICO_6___6_3T_176 := public.get_or_create_ativo('4238', 'PÓRTICO 6 - 6,3T', 'BOBINAS MAGNÉTICAS XL COILS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_P_RTICO_6___6_3T_176 := public.get_or_create_planejamento(
        v_a_P_RTICO_6___6_3T_176,
        'Preventiva ' || 'PÓRTICO 6 - 6,3T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_QUEIMADOR_TENGE_177 uuid;
    v_p_QUEIMADOR_TENGE_177 uuid;
BEGIN
    -- Get or create asset
    v_a_QUEIMADOR_TENGE_177 := public.get_or_create_ativo(NULL, 'QUEIMADOR TENGE', 'GALPÃO NOVO - ÁREA EXTERNA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_QUEIMADOR_TENGE_177 := public.get_or_create_planejamento(
        v_a_QUEIMADOR_TENGE_177,
        'Preventiva ' || 'QUEIMADOR TENGE',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[2, 5, 8, 11]
    );
END $$;

DO $$
DECLARE
    v_a_REATOR_1_178 uuid;
    v_p_REATOR_1_178 uuid;
BEGIN
    -- Get or create asset
    v_a_REATOR_1_178 := public.get_or_create_ativo('2373', 'REATOR 1', 'SALA DE TESTE TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_REATOR_1_178 := public.get_or_create_planejamento(
        v_a_REATOR_1_178,
        'Preventiva ' || 'REATOR 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Anual',
        ARRAY[8]
    );
END $$;

DO $$
DECLARE
    v_a_REBAIXADORA_DE_MICA_1_179 uuid;
    v_p_REBAIXADORA_DE_MICA_1_179 uuid;
BEGIN
    -- Get or create asset
    v_a_REBAIXADORA_DE_MICA_1_179 := public.get_or_create_ativo(NULL, 'REBAIXADORA DE MICA 1', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_REBAIXADORA_DE_MICA_1_179 := public.get_or_create_planejamento(
        v_a_REBAIXADORA_DE_MICA_1_179,
        'Preventiva ' || 'REBAIXADORA DE MICA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_ROSQUEADEIRA_1_180 uuid;
    v_p_ROSQUEADEIRA_1_180 uuid;
BEGIN
    -- Get or create asset
    v_a_ROSQUEADEIRA_1_180 := public.get_or_create_ativo(NULL, 'ROSQUEADEIRA 1', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ROSQUEADEIRA_1_180 := public.get_or_create_planejamento(
        v_a_ROSQUEADEIRA_1_180,
        'Preventiva ' || 'ROSQUEADEIRA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_SACA_POLIA_1_181 uuid;
    v_p_SACA_POLIA_1_181 uuid;
BEGIN
    -- Get or create asset
    v_a_SACA_POLIA_1_181 := public.get_or_create_ativo(NULL, 'SACA POLIA 1', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SACA_POLIA_1_181 := public.get_or_create_planejamento(
        v_a_SACA_POLIA_1_181,
        'Preventiva ' || 'SACA POLIA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 5, 10]
    );
END $$;

DO $$
DECLARE
    v_a_SACA_POLIA_2_182 uuid;
    v_p_SACA_POLIA_2_182 uuid;
BEGIN
    -- Get or create asset
    v_a_SACA_POLIA_2_182 := public.get_or_create_ativo(NULL, 'SACA POLIA 2', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SACA_POLIA_2_182 := public.get_or_create_planejamento(
        v_a_SACA_POLIA_2_182,
        'Preventiva ' || 'SACA POLIA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 5, 10]
    );
END $$;

DO $$
DECLARE
    v_a_SECADOR_1_183 uuid;
    v_p_SECADOR_1_183 uuid;
BEGIN
    -- Get or create asset
    v_a_SECADOR_1_183 := public.get_or_create_ativo(NULL, 'SECADOR 1', 'ÁREA DE COMPRESSORES - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SECADOR_1_183 := public.get_or_create_planejamento(
        v_a_SECADOR_1_183,
        'Preventiva ' || 'SECADOR 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_SECADOR_2_184 uuid;
    v_p_SECADOR_2_184 uuid;
BEGIN
    -- Get or create asset
    v_a_SECADOR_2_184 := public.get_or_create_ativo(NULL, 'SECADOR 2', 'ÁREA DE COMPRESSORES - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SECADOR_2_184 := public.get_or_create_planejamento(
        v_a_SECADOR_2_184,
        'Preventiva ' || 'SECADOR 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_SECADOR_3_185 uuid;
    v_p_SECADOR_3_185 uuid;
BEGIN
    -- Get or create asset
    v_a_SECADOR_3_185 := public.get_or_create_ativo(NULL, 'SECADOR 3', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SECADOR_3_185 := public.get_or_create_planejamento(
        v_a_SECADOR_3_185,
        'Preventiva ' || 'SECADOR 3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_SECADOR_4_186 uuid;
    v_p_SECADOR_4_186 uuid;
BEGIN
    -- Get or create asset
    v_a_SECADOR_4_186 := public.get_or_create_ativo(NULL, 'SECADOR 4', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SECADOR_4_186 := public.get_or_create_planejamento(
        v_a_SECADOR_4_186,
        'Preventiva ' || 'SECADOR 4',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_SECADOR_SUPER_SECO_1_187 uuid;
    v_p_SECADOR_SUPER_SECO_1_187 uuid;
BEGIN
    -- Get or create asset
    v_a_SECADOR_SUPER_SECO_1_187 := public.get_or_create_ativo(NULL, 'SECADOR SUPER SECO 1', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SECADOR_SUPER_SECO_1_187 := public.get_or_create_planejamento(
        v_a_SECADOR_SUPER_SECO_1_187,
        'Preventiva ' || 'SECADOR SUPER SECO 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_SERRA_FITA_1_RONEMAK_188 uuid;
    v_p_SERRA_FITA_1_RONEMAK_188 uuid;
BEGIN
    -- Get or create asset
    v_a_SERRA_FITA_1_RONEMAK_188 := public.get_or_create_ativo('4828', 'SERRA FITA 1 RONEMAK', 'CARPINTARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SERRA_FITA_1_RONEMAK_188 := public.get_or_create_planejamento(
        v_a_SERRA_FITA_1_RONEMAK_188,
        'Preventiva ' || 'SERRA FITA 1 RONEMAK',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_SERRA_FITA_2_189 uuid;
    v_p_SERRA_FITA_2_189 uuid;
BEGIN
    -- Get or create asset
    v_a_SERRA_FITA_2_189 := public.get_or_create_ativo(NULL, 'SERRA FITA 2', 'CARPINTARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SERRA_FITA_2_189 := public.get_or_create_planejamento(
        v_a_SERRA_FITA_2_189,
        'Preventiva ' || 'SERRA FITA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_SERRA_FITA_3_190 uuid;
    v_p_SERRA_FITA_3_190 uuid;
BEGIN
    -- Get or create asset
    v_a_SERRA_FITA_3_190 := public.get_or_create_ativo('468', 'SERRA FITA 3', 'CARPINTARIA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SERRA_FITA_3_190 := public.get_or_create_planejamento(
        v_a_SERRA_FITA_3_190,
        'Preventiva ' || 'SERRA FITA 3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_SERRA_FITA_4_FRANHO_191 uuid;
    v_p_SERRA_FITA_4_FRANHO_191 uuid;
BEGIN
    -- Get or create asset
    v_a_SERRA_FITA_4_FRANHO_191 := public.get_or_create_ativo('2645', 'SERRA FITA 4 FRANHO', 'CALDEIRARIA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SERRA_FITA_4_FRANHO_191 := public.get_or_create_planejamento(
        v_a_SERRA_FITA_4_FRANHO_191,
        'Preventiva ' || 'SERRA FITA 4 FRANHO',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_SISTEMA_RESSONANTE__DESATIVADO_192 uuid;
    v_p_SISTEMA_RESSONANTE__DESATIVADO_192 uuid;
BEGIN
    -- Get or create asset
    v_a_SISTEMA_RESSONANTE__DESATIVADO_192 := public.get_or_create_ativo(NULL, 'SISTEMA RESSONANTE (DESATIVADO  TEMPORARIAMENTE)', 'SALA DE TESTE (GALPÃO NOVO)', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SISTEMA_RESSONANTE__DESATIVADO_192 := public.get_or_create_planejamento(
        v_a_SISTEMA_RESSONANTE__DESATIVADO_192,
        'Preventiva ' || 'SISTEMA RESSONANTE (DESATIVADO  TEMPORARIAMENTE)',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        '{}'::integer[]
    );
END $$;

DO $$
DECLARE
    v_a_SOPRADOR_T_RMICO_1_193 uuid;
    v_p_SOPRADOR_T_RMICO_1_193 uuid;
BEGIN
    -- Get or create asset
    v_a_SOPRADOR_T_RMICO_1_193 := public.get_or_create_ativo('3122', 'SOPRADOR TÉRMICO 1', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SOPRADOR_T_RMICO_1_193 := public.get_or_create_planejamento(
        v_a_SOPRADOR_T_RMICO_1_193,
        'Preventiva ' || 'SOPRADOR TÉRMICO 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TALHA_1___4T_194 uuid;
    v_p_TALHA_1___4T_194 uuid;
BEGIN
    -- Get or create asset
    v_a_TALHA_1___4T_194 := public.get_or_create_ativo(NULL, 'TALHA 1 - 4T', 'GALPÃO MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TALHA_1___4T_194 := public.get_or_create_planejamento(
        v_a_TALHA_1___4T_194,
        'Preventiva ' || 'TALHA 1 - 4T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_TALHA_2___10T_195 uuid;
    v_p_TALHA_2___10T_195 uuid;
BEGIN
    -- Get or create asset
    v_a_TALHA_2___10T_195 := public.get_or_create_ativo(NULL, 'TALHA 2 - 10T', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TALHA_2___10T_195 := public.get_or_create_planejamento(
        v_a_TALHA_2___10T_195,
        'Preventiva ' || 'TALHA 2 - 10T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_TERMOV_CUO_1___4000_l_h_196 uuid;
    v_p_TERMOV_CUO_1___4000_l_h_196 uuid;
BEGIN
    -- Get or create asset
    v_a_TERMOV_CUO_1___4000_l_h_196 := public.get_or_create_ativo('22', 'TERMOVÁCUO 1 - 4000 l/h', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TERMOV_CUO_1___4000_l_h_196 := public.get_or_create_planejamento(
        v_a_TERMOV_CUO_1___4000_l_h_196,
        'Preventiva ' || 'TERMOVÁCUO 1 - 4000 l/h',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TERMOV_CUO_2___1300_l_h_197 uuid;
    v_p_TERMOV_CUO_2___1300_l_h_197 uuid;
BEGIN
    -- Get or create asset
    v_a_TERMOV_CUO_2___1300_l_h_197 := public.get_or_create_ativo('2330', 'TERMOVÁCUO 2 - 1300 l/h', 'XL COILS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TERMOV_CUO_2___1300_l_h_197 := public.get_or_create_planejamento(
        v_a_TERMOV_CUO_2___1300_l_h_197,
        'Preventiva ' || 'TERMOVÁCUO 2 - 1300 l/h',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TERMOV_CUO_3___3000_l_h_198 uuid;
    v_p_TERMOV_CUO_3___3000_l_h_198 uuid;
BEGIN
    -- Get or create asset
    v_a_TERMOV_CUO_3___3000_l_h_198 := public.get_or_create_ativo('2331', 'TERMOVÁCUO 3 - 3000 l/h', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TERMOV_CUO_3___3000_l_h_198 := public.get_or_create_planejamento(
        v_a_TERMOV_CUO_3___3000_l_h_198,
        'Preventiva ' || 'TERMOVÁCUO 3 - 3000 l/h',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TERMOV_CUO_4___5000_l_h_199 uuid;
    v_p_TERMOV_CUO_4___5000_l_h_199 uuid;
BEGIN
    -- Get or create asset
    v_a_TERMOV_CUO_4___5000_l_h_199 := public.get_or_create_ativo('3750', 'TERMOVÁCUO 4 - 5000 l/h', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TERMOV_CUO_4___5000_l_h_199 := public.get_or_create_planejamento(
        v_a_TERMOV_CUO_4___5000_l_h_199,
        'Preventiva ' || 'TERMOVÁCUO 4 - 5000 l/h',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TERMOV_CUO_5___10000L_H_200 uuid;
    v_p_TERMOV_CUO_5___10000L_H_200 uuid;
BEGIN
    -- Get or create asset
    v_a_TERMOV_CUO_5___10000L_H_200 := public.get_or_create_ativo('28', 'TERMOVÁCUO 5 - 10000L/H', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TERMOV_CUO_5___10000L_H_200 := public.get_or_create_planejamento(
        v_a_TERMOV_CUO_5___10000L_H_200,
        'Preventiva ' || 'TERMOVÁCUO 5 - 10000L/H',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_TERMOV_CUO_6_DDSL3_14000_201 uuid;
    v_p_TERMOV_CUO_6_DDSL3_14000_201 uuid;
BEGIN
    -- Get or create asset
    v_a_TERMOV_CUO_6_DDSL3_14000_201 := public.get_or_create_ativo('29', 'TERMOVÁCUO 6 DDSL3 14000', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TERMOV_CUO_6_DDSL3_14000_201 := public.get_or_create_planejamento(
        v_a_TERMOV_CUO_6_DDSL3_14000_201,
        'Preventiva ' || 'TERMOVÁCUO 6 DDSL3 14000',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TORNO_1_NARDINI_AM_650_VS_202 uuid;
    v_p_TORNO_1_NARDINI_AM_650_VS_202 uuid;
BEGIN
    -- Get or create asset
    v_a_TORNO_1_NARDINI_AM_650_VS_202 := public.get_or_create_ativo(NULL, 'TORNO 1 NARDINI AM 650 VS', 'USINAGEM', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TORNO_1_NARDINI_AM_650_VS_202 := public.get_or_create_planejamento(
        v_a_TORNO_1_NARDINI_AM_650_VS_202,
        'Preventiva ' || 'TORNO 1 NARDINI AM 650 VS',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TORNO_2_ROMI___S20A_203 uuid;
    v_p_TORNO_2_ROMI___S20A_203 uuid;
BEGIN
    -- Get or create asset
    v_a_TORNO_2_ROMI___S20A_203 := public.get_or_create_ativo('2313', 'TORNO 2 ROMI - S20A', 'USINAGEM', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TORNO_2_ROMI___S20A_203 := public.get_or_create_planejamento(
        v_a_TORNO_2_ROMI___S20A_203,
        'Preventiva ' || 'TORNO 2 ROMI - S20A',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TORNO_3_TORMAX_30B_204 uuid;
    v_p_TORNO_3_TORMAX_30B_204 uuid;
BEGIN
    -- Get or create asset
    v_a_TORNO_3_TORMAX_30B_204 := public.get_or_create_ativo('4024', 'TORNO 3 TORMAX 30B', 'USINAGEM', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TORNO_3_TORMAX_30B_204 := public.get_or_create_planejamento(
        v_a_TORNO_3_TORMAX_30B_204,
        'Preventiva ' || 'TORNO 3 TORMAX 30B',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TORNO_4_TORMAX_30B___LOCADO_205 uuid;
    v_p_TORNO_4_TORMAX_30B___LOCADO_205 uuid;
BEGIN
    -- Get or create asset
    v_a_TORNO_4_TORMAX_30B___LOCADO_205 := public.get_or_create_ativo('LOCADO', 'TORNO 4 TORMAX 30B - LOCADO', 'USINAGEM', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TORNO_4_TORMAX_30B___LOCADO_205 := public.get_or_create_planejamento(
        v_a_TORNO_4_TORMAX_30B___LOCADO_205,
        'Preventiva ' || 'TORNO 4 TORMAX 30B - LOCADO',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TORNO_5_ROMI___ES40B_206 uuid;
    v_p_TORNO_5_ROMI___ES40B_206 uuid;
BEGIN
    -- Get or create asset
    v_a_TORNO_5_ROMI___ES40B_206 := public.get_or_create_ativo(NULL, 'TORNO 5 ROMI - ES40B', 'USINAGEM', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TORNO_5_ROMI___ES40B_206 := public.get_or_create_planejamento(
        v_a_TORNO_5_ROMI___ES40B_206,
        'Preventiva ' || 'TORNO 5 ROMI - ES40B',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TORRE_DE_RESFRIAMENTO_1___REA__207 uuid;
    v_p_TORRE_DE_RESFRIAMENTO_1___REA__207 uuid;
BEGIN
    -- Get or create asset
    v_a_TORRE_DE_RESFRIAMENTO_1___REA__207 := public.get_or_create_ativo('10496', 'TORRE DE RESFRIAMENTO 1 (ÁREA EXTERNA -TRANSFORMADORES)', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TORRE_DE_RESFRIAMENTO_1___REA__207 := public.get_or_create_planejamento(
        v_a_TORRE_DE_RESFRIAMENTO_1___REA__207,
        'Preventiva ' || 'TORRE DE RESFRIAMENTO 1 (ÁREA EXTERNA -TRANSFORMADORES)',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[2, 5, 8, 11]
    );
END $$;

DO $$
DECLARE
    v_a_TORRE_DE_RESFRIAMENTO_3_208 uuid;
    v_p_TORRE_DE_RESFRIAMENTO_3_208 uuid;
BEGIN
    -- Get or create asset
    v_a_TORRE_DE_RESFRIAMENTO_3_208 := public.get_or_create_ativo('3349', 'TORRE DE RESFRIAMENTO 3', 'TRAFO FÁBRICA ANTIGA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TORRE_DE_RESFRIAMENTO_3_208 := public.get_or_create_planejamento(
        v_a_TORRE_DE_RESFRIAMENTO_3_208,
        'Preventiva ' || 'TORRE DE RESFRIAMENTO 3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TRANSFORMADOR_1_440_380_220V_L_209 uuid;
    v_p_TRANSFORMADOR_1_440_380_220V_L_209 uuid;
BEGIN
    -- Get or create asset
    v_a_TRANSFORMADOR_1_440_380_220V_L_209 := public.get_or_create_ativo('7759', 'TRANSFORMADOR 1 440/380/220V LARANJA (COM PAINEL)', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TRANSFORMADOR_1_440_380_220V_L_209 := public.get_or_create_planejamento(
        v_a_TRANSFORMADOR_1_440_380_220V_L_209,
        'Preventiva ' || 'TRANSFORMADOR 1 440/380/220V LARANJA (COM PAINEL)',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TRANSFORMADOR_2_440_380_220V_L_210 uuid;
    v_p_TRANSFORMADOR_2_440_380_220V_L_210 uuid;
BEGIN
    -- Get or create asset
    v_a_TRANSFORMADOR_2_440_380_220V_L_210 := public.get_or_create_ativo('7959', 'TRANSFORMADOR 2 440/380/220V LARANJA (SEM PAINEL)', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TRANSFORMADOR_2_440_380_220V_L_210 := public.get_or_create_planejamento(
        v_a_TRANSFORMADOR_2_440_380_220V_L_210,
        'Preventiva ' || 'TRANSFORMADOR 2 440/380/220V LARANJA (SEM PAINEL)',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TRANSFORMADOR_3_440_380_220V_C_211 uuid;
    v_p_TRANSFORMADOR_3_440_380_220V_C_211 uuid;
BEGIN
    -- Get or create asset
    v_a_TRANSFORMADOR_3_440_380_220V_C_211 := public.get_or_create_ativo('7970', 'TRANSFORMADOR 3 440/380/220V CINZA', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TRANSFORMADOR_3_440_380_220V_C_211 := public.get_or_create_planejamento(
        v_a_TRANSFORMADOR_3_440_380_220V_C_211,
        'Preventiva ' || 'TRANSFORMADOR 3 440/380/220V CINZA',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TRANSFORMADOR_1_PRINCIPAL_DO_T_212 uuid;
    v_p_TRANSFORMADOR_1_PRINCIPAL_DO_T_212 uuid;
BEGIN
    -- Get or create asset
    v_a_TRANSFORMADOR_1_PRINCIPAL_DO_T_212 := public.get_or_create_ativo(NULL, 'TRANSFORMADOR 1 PRINCIPAL DO TESTE', 'SALA DE TESTE TRANSFORMADOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TRANSFORMADOR_1_PRINCIPAL_DO_T_212 := public.get_or_create_planejamento(
        v_a_TRANSFORMADOR_1_PRINCIPAL_DO_T_212,
        'Preventiva ' || 'TRANSFORMADOR 1 PRINCIPAL DO TESTE',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Anual',
        ARRAY[8]
    );
END $$;

DO $$
DECLARE
    v_a_TRANSFORMADOR_2_PRINCIPAL_DA_F_213 uuid;
    v_p_TRANSFORMADOR_2_PRINCIPAL_DA_F_213 uuid;
BEGIN
    -- Get or create asset
    v_a_TRANSFORMADOR_2_PRINCIPAL_DA_F_213 := public.get_or_create_ativo(NULL, 'TRANSFORMADOR 2 PRINCIPAL DA FÁBRICA ANTIGA', 'FÁBRICA ANTIGA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TRANSFORMADOR_2_PRINCIPAL_DA_F_213 := public.get_or_create_planejamento(
        v_a_TRANSFORMADOR_2_PRINCIPAL_DA_F_213,
        'Preventiva ' || 'TRANSFORMADOR 2 PRINCIPAL DA FÁBRICA ANTIGA',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Anual',
        ARRAY[8]
    );
END $$;

DO $$
DECLARE
    v_a_VENTILADOR__1_214 uuid;
    v_p_VENTILADOR__1_214 uuid;
BEGIN
    -- Get or create asset
    v_a_VENTILADOR__1_214 := public.get_or_create_ativo(NULL, 'VENTILADOR  1', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_VENTILADOR__1_214 := public.get_or_create_planejamento(
        v_a_VENTILADOR__1_214,
        'Preventiva ' || 'VENTILADOR  1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_VENTILADOR__2_215 uuid;
    v_p_VENTILADOR__2_215 uuid;
BEGIN
    -- Get or create asset
    v_a_VENTILADOR__2_215 := public.get_or_create_ativo(NULL, 'VENTILADOR  2', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_VENTILADOR__2_215 := public.get_or_create_planejamento(
        v_a_VENTILADOR__2_215,
        'Preventiva ' || 'VENTILADOR  2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_VENTILADOR__3_216 uuid;
    v_p_VENTILADOR__3_216 uuid;
BEGIN
    -- Get or create asset
    v_a_VENTILADOR__3_216 := public.get_or_create_ativo(NULL, 'VENTILADOR  3', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_VENTILADOR__3_216 := public.get_or_create_planejamento(
        v_a_VENTILADOR__3_216,
        'Preventiva ' || 'VENTILADOR  3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 3, 8]
    );
END $$;

DO $$
DECLARE
    v_a_VENTILADOR__4_217 uuid;
    v_p_VENTILADOR__4_217 uuid;
BEGIN
    -- Get or create asset
    v_a_VENTILADOR__4_217 := public.get_or_create_ativo(NULL, 'VENTILADOR  4', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_VENTILADOR__4_217 := public.get_or_create_planejamento(
        v_a_VENTILADOR__4_217,
        'Preventiva ' || 'VENTILADOR  4',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_VENTILADOR__5_218 uuid;
    v_p_VENTILADOR__5_218 uuid;
BEGIN
    -- Get or create asset
    v_a_VENTILADOR__5_218 := public.get_or_create_ativo(NULL, 'VENTILADOR  5', 'GALPÃO NOVO-CARPINTARIA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_VENTILADOR__5_218 := public.get_or_create_planejamento(
        v_a_VENTILADOR__5_218,
        'Preventiva ' || 'VENTILADOR  5',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_VERIFICA__O_SISTEMA_SPDA_DATA_219 uuid;
    v_p_VERIFICA__O_SISTEMA_SPDA_DATA_219 uuid;
BEGIN
    -- Get or create asset
    v_a_VERIFICA__O_SISTEMA_SPDA_DATA_219 := public.get_or_create_ativo(NULL, 'VERIFICAÇÃO SISTEMA SPDA DATA', 'EDIFICAÇÕES DATA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_VERIFICA__O_SISTEMA_SPDA_DATA_219 := public.get_or_create_planejamento(
        v_a_VERIFICA__O_SISTEMA_SPDA_DATA_219,
        'Preventiva ' || 'VERIFICAÇÃO SISTEMA SPDA DATA',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_VPD_HEDRICH_220 uuid;
    v_p_VPD_HEDRICH_220 uuid;
BEGIN
    -- Get or create asset
    v_a_VPD_HEDRICH_220 := public.get_or_create_ativo(NULL, 'VPD HEDRICH', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_VPD_HEDRICH_220 := public.get_or_create_planejamento(
        v_a_VPD_HEDRICH_220,
        'Preventiva ' || 'VPD HEDRICH',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_VPI_221 uuid;
    v_p_VPI_221 uuid;
BEGIN
    -- Get or create asset
    v_a_VPI_221 := public.get_or_create_ativo('681', 'VPI', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_VPI_221 := public.get_or_create_planejamento(
        v_a_VPI_221,
        'Preventiva ' || 'VPI',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_ANALISADO_POR__Ludmila_Henriqu_506 uuid;
    v_p_ANALISADO_POR__Ludmila_Henriqu_506 uuid;
BEGIN
    -- Get or create asset
    v_a_ANALISADO_POR__Ludmila_Henriqu_506 := public.get_or_create_ativo(NULL, 'ANALISADO POR: Ludmila Henriques', NULL, 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ANALISADO_POR__Ludmila_Henriqu_506 := public.get_or_create_planejamento(
        v_a_ANALISADO_POR__Ludmila_Henriqu_506,
        'Preventiva ' || 'ANALISADO POR: Ludmila Henriques',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        '{}'::integer[]
    );
END $$;

DO $$
DECLARE
    v_a_DATA__25_07_2025_507 uuid;
    v_p_DATA__25_07_2025_507 uuid;
BEGIN
    -- Get or create asset
    v_a_DATA__25_07_2025_507 := public.get_or_create_ativo(NULL, 'DATA: 25/07/2025', NULL, 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_DATA__25_07_2025_507 := public.get_or_create_planejamento(
        v_a_DATA__25_07_2025_507,
        'Preventiva ' || 'DATA: 25/07/2025',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        '{}'::integer[]
    );
END $$;

-- 3. Seeding Monthly Execution Tasks for April 2026 (55 rows)

DO $$
DECLARE
    v_a_ex_BOBINADEIRA_19_2 uuid;
    v_p_ex_BOBINADEIRA_19_2 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_BOBINADEIRA_19_2 := public.get_or_create_ativo('4166', 'BOBINADEIRA 19', 'MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_BOBINADEIRA_19_2
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_BOBINADEIRA_19_2 AND titulo = 'Preventiva ' || 'BOBINADEIRA 19'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_BOBINADEIRA_19_2 IS NULL THEN
        v_p_ex_BOBINADEIRA_19_2 := public.get_or_create_planejamento(
            v_a_ex_BOBINADEIRA_19_2,
            'Preventiva ' || 'BOBINADEIRA 19',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_BOBINADEIRA_19_2,
        v_a_ex_BOBINADEIRA_19_2,
        'Preventiva ' || 'BOBINADEIRA 19',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'genilson@manequip.com',
        'Em aberto',
        18
    );
END $$;

DO $$
DECLARE
    v_a_ex_COMPRESSOR_7_3 uuid;
    v_p_ex_COMPRESSOR_7_3 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_COMPRESSOR_7_3 := public.get_or_create_ativo(NULL, 'COMPRESSOR 7', 'CALDEIRARIA TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_COMPRESSOR_7_3
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_COMPRESSOR_7_3 AND titulo = 'Preventiva ' || 'COMPRESSOR 7'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_COMPRESSOR_7_3 IS NULL THEN
        v_p_ex_COMPRESSOR_7_3 := public.get_or_create_planejamento(
            v_a_ex_COMPRESSOR_7_3,
            'Preventiva ' || 'COMPRESSOR 7',
            'Realizar manutenção preventiva periódica.',
            'Trimestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_COMPRESSOR_7_3,
        v_a_ex_COMPRESSOR_7_3,
        'Preventiva ' || 'COMPRESSOR 7',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'aldemar@manequip.com',
        'Em aberto',
        20
    );
END $$;

DO $$
DECLARE
    v_a_ex_COMPRESSOR_8_4 uuid;
    v_p_ex_COMPRESSOR_8_4 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_COMPRESSOR_8_4 := public.get_or_create_ativo('5069', 'COMPRESSOR 8', 'CALDEIRARIA TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_COMPRESSOR_8_4
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_COMPRESSOR_8_4 AND titulo = 'Preventiva ' || 'COMPRESSOR 8'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_COMPRESSOR_8_4 IS NULL THEN
        v_p_ex_COMPRESSOR_8_4 := public.get_or_create_planejamento(
            v_a_ex_COMPRESSOR_8_4,
            'Preventiva ' || 'COMPRESSOR 8',
            'Realizar manutenção preventiva periódica.',
            'Trimestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_COMPRESSOR_8_4,
        v_a_ex_COMPRESSOR_8_4,
        'Preventiva ' || 'COMPRESSOR 8',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'aldemar@manequip.com',
        'Em aberto',
        20
    );
END $$;

DO $$
DECLARE
    v_a_ex_DESENGROSSADEIRA_1_5 uuid;
    v_p_ex_DESENGROSSADEIRA_1_5 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_DESENGROSSADEIRA_1_5 := public.get_or_create_ativo('5608', 'DESENGROSSADEIRA 1', 'CARPINTARIA TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_DESENGROSSADEIRA_1_5
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_DESENGROSSADEIRA_1_5 AND titulo = 'Preventiva ' || 'DESENGROSSADEIRA 1'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_DESENGROSSADEIRA_1_5 IS NULL THEN
        v_p_ex_DESENGROSSADEIRA_1_5 := public.get_or_create_planejamento(
            v_a_ex_DESENGROSSADEIRA_1_5,
            'Preventiva ' || 'DESENGROSSADEIRA 1',
            'Realizar manutenção preventiva periódica.',
            'Trimestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_DESENGROSSADEIRA_1_5,
        v_a_ex_DESENGROSSADEIRA_1_5,
        'Preventiva ' || 'DESENGROSSADEIRA 1',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'luan@manequip.com',
        'Concluído',
        15
    );
END $$;

DO $$
DECLARE
    v_a_ex_DOBRADEIRA_MANUAL_1_6 uuid;
    v_p_ex_DOBRADEIRA_MANUAL_1_6 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_DOBRADEIRA_MANUAL_1_6 := public.get_or_create_ativo('6007', 'DOBRADEIRA MANUAL 1', 'BOBINAS TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_DOBRADEIRA_MANUAL_1_6
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_DOBRADEIRA_MANUAL_1_6 AND titulo = 'Preventiva ' || 'DOBRADEIRA MANUAL 1'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_DOBRADEIRA_MANUAL_1_6 IS NULL THEN
        v_p_ex_DOBRADEIRA_MANUAL_1_6 := public.get_or_create_planejamento(
            v_a_ex_DOBRADEIRA_MANUAL_1_6,
            'Preventiva ' || 'DOBRADEIRA MANUAL 1',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_DOBRADEIRA_MANUAL_1_6,
        v_a_ex_DOBRADEIRA_MANUAL_1_6,
        'Preventiva ' || 'DOBRADEIRA MANUAL 1',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'luan@manequip.com',
        'Em atendimento',
        19
    );
END $$;

DO $$
DECLARE
    v_a_ex_ESTUFA_MT01_7 uuid;
    v_p_ex_ESTUFA_MT01_7 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_ESTUFA_MT01_7 := public.get_or_create_ativo('1312', 'ESTUFA MT01', 'MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_ESTUFA_MT01_7
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_ESTUFA_MT01_7 AND titulo = 'Preventiva ' || 'ESTUFA MT01'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_ESTUFA_MT01_7 IS NULL THEN
        v_p_ex_ESTUFA_MT01_7 := public.get_or_create_planejamento(
            v_a_ex_ESTUFA_MT01_7,
            'Preventiva ' || 'ESTUFA MT01',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_ESTUFA_MT01_7,
        v_a_ex_ESTUFA_MT01_7,
        'Preventiva ' || 'ESTUFA MT01',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'wendel@manequip.com',
        'Em aberto',
        20
    );
END $$;

DO $$
DECLARE
    v_a_ex_ESTUFA_MT02_8 uuid;
    v_p_ex_ESTUFA_MT02_8 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_ESTUFA_MT02_8 := public.get_or_create_ativo('3318', 'ESTUFA MT02', 'MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_ESTUFA_MT02_8
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_ESTUFA_MT02_8 AND titulo = 'Preventiva ' || 'ESTUFA MT02'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_ESTUFA_MT02_8 IS NULL THEN
        v_p_ex_ESTUFA_MT02_8 := public.get_or_create_planejamento(
            v_a_ex_ESTUFA_MT02_8,
            'Preventiva ' || 'ESTUFA MT02',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_ESTUFA_MT02_8,
        v_a_ex_ESTUFA_MT02_8,
        'Preventiva ' || 'ESTUFA MT02',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'wendel@manequip.com',
        'Em aberto',
        25
    );
END $$;

DO $$
DECLARE
    v_a_ex_ESTUFA_TRF01_9 uuid;
    v_p_ex_ESTUFA_TRF01_9 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_ESTUFA_TRF01_9 := public.get_or_create_ativo('3377', 'ESTUFA TRF01', 'TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_ESTUFA_TRF01_9
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_ESTUFA_TRF01_9 AND titulo = 'Preventiva ' || 'ESTUFA TRF01'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_ESTUFA_TRF01_9 IS NULL THEN
        v_p_ex_ESTUFA_TRF01_9 := public.get_or_create_planejamento(
            v_a_ex_ESTUFA_TRF01_9,
            'Preventiva ' || 'ESTUFA TRF01',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_ESTUFA_TRF01_9,
        v_a_ex_ESTUFA_TRF01_9,
        'Preventiva ' || 'ESTUFA TRF01',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'wendel@manequip.com',
        'Concluído',
        15
    );
END $$;

DO $$
DECLARE
    v_a_ex_ESTUFA_TRF02_10 uuid;
    v_p_ex_ESTUFA_TRF02_10 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_ESTUFA_TRF02_10 := public.get_or_create_ativo('4775', 'ESTUFA TRF02', 'TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_ESTUFA_TRF02_10
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_ESTUFA_TRF02_10 AND titulo = 'Preventiva ' || 'ESTUFA TRF02'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_ESTUFA_TRF02_10 IS NULL THEN
        v_p_ex_ESTUFA_TRF02_10 := public.get_or_create_planejamento(
            v_a_ex_ESTUFA_TRF02_10,
            'Preventiva ' || 'ESTUFA TRF02',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_ESTUFA_TRF02_10,
        v_a_ex_ESTUFA_TRF02_10,
        'Preventiva ' || 'ESTUFA TRF02',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'wendel@manequip.com',
        'Em atendimento',
        25
    );
END $$;

DO $$
DECLARE
    v_a_ex_ESTUFA_TRF03_11 uuid;
    v_p_ex_ESTUFA_TRF03_11 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_ESTUFA_TRF03_11 := public.get_or_create_ativo(NULL, 'ESTUFA TRF03', 'TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_ESTUFA_TRF03_11
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_ESTUFA_TRF03_11 AND titulo = 'Preventiva ' || 'ESTUFA TRF03'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_ESTUFA_TRF03_11 IS NULL THEN
        v_p_ex_ESTUFA_TRF03_11 := public.get_or_create_planejamento(
            v_a_ex_ESTUFA_TRF03_11,
            'Preventiva ' || 'ESTUFA TRF03',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_ESTUFA_TRF03_11,
        v_a_ex_ESTUFA_TRF03_11,
        'Preventiva ' || 'ESTUFA TRF03',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'daniel@manequip.com',
        'Em aberto',
        21
    );
END $$;

DO $$
DECLARE
    v_a_ex_ESTUFA_TRF04_12 uuid;
    v_p_ex_ESTUFA_TRF04_12 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_ESTUFA_TRF04_12 := public.get_or_create_ativo('6138', 'ESTUFA TRF04', 'CARPINTARIA BOBINAS TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_ESTUFA_TRF04_12
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_ESTUFA_TRF04_12 AND titulo = 'Preventiva ' || 'ESTUFA TRF04'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_ESTUFA_TRF04_12 IS NULL THEN
        v_p_ex_ESTUFA_TRF04_12 := public.get_or_create_planejamento(
            v_a_ex_ESTUFA_TRF04_12,
            'Preventiva ' || 'ESTUFA TRF04',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_ESTUFA_TRF04_12,
        v_a_ex_ESTUFA_TRF04_12,
        'Preventiva ' || 'ESTUFA TRF04',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'daniel@manequip.com',
        'Em aberto',
        22
    );
END $$;

DO $$
DECLARE
    v_a_ex_FURADEIRA_DE_BANCADA_4_13 uuid;
    v_p_ex_FURADEIRA_DE_BANCADA_4_13 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_FURADEIRA_DE_BANCADA_4_13 := public.get_or_create_ativo('2914', 'FURADEIRA DE BANCADA 4', 'COMUTADORES TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_FURADEIRA_DE_BANCADA_4_13
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_FURADEIRA_DE_BANCADA_4_13 AND titulo = 'Preventiva ' || 'FURADEIRA DE BANCADA 4'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_FURADEIRA_DE_BANCADA_4_13 IS NULL THEN
        v_p_ex_FURADEIRA_DE_BANCADA_4_13 := public.get_or_create_planejamento(
            v_a_ex_FURADEIRA_DE_BANCADA_4_13,
            'Preventiva ' || 'FURADEIRA DE BANCADA 4',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_FURADEIRA_DE_BANCADA_4_13,
        v_a_ex_FURADEIRA_DE_BANCADA_4_13,
        'Preventiva ' || 'FURADEIRA DE BANCADA 4',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'luan@manequip.com',
        'Concluído',
        15
    );
END $$;

DO $$
DECLARE
    v_a_ex_FURADEIRA_DE_BANCADA_5_14 uuid;
    v_p_ex_FURADEIRA_DE_BANCADA_5_14 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_FURADEIRA_DE_BANCADA_5_14 := public.get_or_create_ativo('3769', 'FURADEIRA DE BANCADA 5', 'COMUTADORES TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_FURADEIRA_DE_BANCADA_5_14
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_FURADEIRA_DE_BANCADA_5_14 AND titulo = 'Preventiva ' || 'FURADEIRA DE BANCADA 5'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_FURADEIRA_DE_BANCADA_5_14 IS NULL THEN
        v_p_ex_FURADEIRA_DE_BANCADA_5_14 := public.get_or_create_planejamento(
            v_a_ex_FURADEIRA_DE_BANCADA_5_14,
            'Preventiva ' || 'FURADEIRA DE BANCADA 5',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_FURADEIRA_DE_BANCADA_5_14,
        v_a_ex_FURADEIRA_DE_BANCADA_5_14,
        'Preventiva ' || 'FURADEIRA DE BANCADA 5',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'luan@manequip.com',
        'Concluído',
        15
    );
END $$;

DO $$
DECLARE
    v_a_ex_FURADEIRA_DE_COLUNA_3_15 uuid;
    v_p_ex_FURADEIRA_DE_COLUNA_3_15 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_FURADEIRA_DE_COLUNA_3_15 := public.get_or_create_ativo('419', 'FURADEIRA DE COLUNA 3', 'COMUTADORES TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_FURADEIRA_DE_COLUNA_3_15
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_FURADEIRA_DE_COLUNA_3_15 AND titulo = 'Preventiva ' || 'FURADEIRA DE COLUNA 3'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_FURADEIRA_DE_COLUNA_3_15 IS NULL THEN
        v_p_ex_FURADEIRA_DE_COLUNA_3_15 := public.get_or_create_planejamento(
            v_a_ex_FURADEIRA_DE_COLUNA_3_15,
            'Preventiva ' || 'FURADEIRA DE COLUNA 3',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_FURADEIRA_DE_COLUNA_3_15,
        v_a_ex_FURADEIRA_DE_COLUNA_3_15,
        'Preventiva ' || 'FURADEIRA DE COLUNA 3',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'luan@manequip.com',
        'Em atendimento',
        19
    );
END $$;

DO $$
DECLARE
    v_a_ex_GUILHOTINA_5_16 uuid;
    v_p_ex_GUILHOTINA_5_16 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_GUILHOTINA_5_16 := public.get_or_create_ativo(NULL, 'GUILHOTINA 5', 'CARPINTARIA MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_GUILHOTINA_5_16
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_GUILHOTINA_5_16 AND titulo = 'Preventiva ' || 'GUILHOTINA 5'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_GUILHOTINA_5_16 IS NULL THEN
        v_p_ex_GUILHOTINA_5_16 := public.get_or_create_planejamento(
            v_a_ex_GUILHOTINA_5_16,
            'Preventiva ' || 'GUILHOTINA 5',
            'Realizar manutenção preventiva periódica.',
            'Trimestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_GUILHOTINA_5_16,
        v_a_ex_GUILHOTINA_5_16,
        'Preventiva ' || 'GUILHOTINA 5',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'genilson@manequip.com',
        'Em aberto',
        19
    );
END $$;

DO $$
DECLARE
    v_a_ex_KBK_1_500KG_17 uuid;
    v_p_ex_KBK_1_500KG_17 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_KBK_1_500KG_17 := public.get_or_create_ativo(NULL, 'KBK 1 500KG', 'FÁBRICA DE BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_KBK_1_500KG_17
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_KBK_1_500KG_17 AND titulo = 'Preventiva ' || 'KBK 1 500KG'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_KBK_1_500KG_17 IS NULL THEN
        v_p_ex_KBK_1_500KG_17 := public.get_or_create_planejamento(
            v_a_ex_KBK_1_500KG_17,
            'Preventiva ' || 'KBK 1 500KG',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_KBK_1_500KG_17,
        v_a_ex_KBK_1_500KG_17,
        'Preventiva ' || 'KBK 1 500KG',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'aldemar@manequip.com',
        'Em aberto',
        19
    );
END $$;

DO $$
DECLARE
    v_a_ex_KBK_2_1600_KG_18 uuid;
    v_p_ex_KBK_2_1600_KG_18 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_KBK_2_1600_KG_18 := public.get_or_create_ativo(NULL, 'KBK 2 1600 KG', 'MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_KBK_2_1600_KG_18
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_KBK_2_1600_KG_18 AND titulo = 'Preventiva ' || 'KBK 2 1600 KG'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_KBK_2_1600_KG_18 IS NULL THEN
        v_p_ex_KBK_2_1600_KG_18 := public.get_or_create_planejamento(
            v_a_ex_KBK_2_1600_KG_18,
            'Preventiva ' || 'KBK 2 1600 KG',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_KBK_2_1600_KG_18,
        v_a_ex_KBK_2_1600_KG_18,
        'Preventiva ' || 'KBK 2 1600 KG',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'hugo@manequip.com',
        'Em aberto',
        19
    );
END $$;

DO $$
DECLARE
    v_a_ex_MANDRILHADORA_1_19 uuid;
    v_p_ex_MANDRILHADORA_1_19 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_MANDRILHADORA_1_19 := public.get_or_create_ativo('5602', 'MANDRILHADORA 1', 'USINAGEM', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_MANDRILHADORA_1_19
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_MANDRILHADORA_1_19 AND titulo = 'Preventiva ' || 'MANDRILHADORA 1'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_MANDRILHADORA_1_19 IS NULL THEN
        v_p_ex_MANDRILHADORA_1_19 := public.get_or_create_planejamento(
            v_a_ex_MANDRILHADORA_1_19,
            'Preventiva ' || 'MANDRILHADORA 1',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_MANDRILHADORA_1_19,
        v_a_ex_MANDRILHADORA_1_19,
        'Preventiva ' || 'MANDRILHADORA 1',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'hugo@manequip.com',
        'Em aberto',
        22
    );
END $$;

DO $$
DECLARE
    v_a_ex_MODELADORA_DE_BARRA_1_20 uuid;
    v_p_ex_MODELADORA_DE_BARRA_1_20 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_MODELADORA_DE_BARRA_1_20 := public.get_or_create_ativo('8085', 'MODELADORA DE BARRA 1', 'BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_MODELADORA_DE_BARRA_1_20
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_MODELADORA_DE_BARRA_1_20 AND titulo = 'Preventiva ' || 'MODELADORA DE BARRA 1'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_MODELADORA_DE_BARRA_1_20 IS NULL THEN
        v_p_ex_MODELADORA_DE_BARRA_1_20 := public.get_or_create_planejamento(
            v_a_ex_MODELADORA_DE_BARRA_1_20,
            'Preventiva ' || 'MODELADORA DE BARRA 1',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_MODELADORA_DE_BARRA_1_20,
        v_a_ex_MODELADORA_DE_BARRA_1_20,
        'Preventiva ' || 'MODELADORA DE BARRA 1',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'maike@manequip.com',
        'Em aberto',
        20
    );
END $$;

DO $$
DECLARE
    v_a_ex_MODELADOR_DE_BARRA_2_21 uuid;
    v_p_ex_MODELADOR_DE_BARRA_2_21 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_MODELADOR_DE_BARRA_2_21 := public.get_or_create_ativo(NULL, 'MODELADOR DE BARRA 2', 'FÁBRICA BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_MODELADOR_DE_BARRA_2_21
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_MODELADOR_DE_BARRA_2_21 AND titulo = 'Preventiva ' || 'MODELADOR DE BARRA 2'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_MODELADOR_DE_BARRA_2_21 IS NULL THEN
        v_p_ex_MODELADOR_DE_BARRA_2_21 := public.get_or_create_planejamento(
            v_a_ex_MODELADOR_DE_BARRA_2_21,
            'Preventiva ' || 'MODELADOR DE BARRA 2',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_MODELADOR_DE_BARRA_2_21,
        v_a_ex_MODELADOR_DE_BARRA_2_21,
        'Preventiva ' || 'MODELADOR DE BARRA 2',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'samir@manequip.com',
        'Em aberto',
        25
    );
END $$;

DO $$
DECLARE
    v_a_ex_MODELADOR_DE_LOOP_1_22 uuid;
    v_p_ex_MODELADOR_DE_LOOP_1_22 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_MODELADOR_DE_LOOP_1_22 := public.get_or_create_ativo('5092', 'MODELADOR DE LOOP 1', 'FÁBRICA DE BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_MODELADOR_DE_LOOP_1_22
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_MODELADOR_DE_LOOP_1_22 AND titulo = 'Preventiva ' || 'MODELADOR DE LOOP 1'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_MODELADOR_DE_LOOP_1_22 IS NULL THEN
        v_p_ex_MODELADOR_DE_LOOP_1_22 := public.get_or_create_planejamento(
            v_a_ex_MODELADOR_DE_LOOP_1_22,
            'Preventiva ' || 'MODELADOR DE LOOP 1',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_MODELADOR_DE_LOOP_1_22,
        v_a_ex_MODELADOR_DE_LOOP_1_22,
        'Preventiva ' || 'MODELADOR DE LOOP 1',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'daniel@manequip.com',
        'Em aberto',
        25
    );
END $$;

DO $$
DECLARE
    v_a_ex_M_QUINA_DE_LAVAR_1_KARCHER_23 uuid;
    v_p_ex_M_QUINA_DE_LAVAR_1_KARCHER_23 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_M_QUINA_DE_LAVAR_1_KARCHER_23 := public.get_or_create_ativo('11875', 'MÁQUINA DE LAVAR 1 KARCHER', 'LAVADOR MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_M_QUINA_DE_LAVAR_1_KARCHER_23
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_M_QUINA_DE_LAVAR_1_KARCHER_23 AND titulo = 'Preventiva ' || 'MÁQUINA DE LAVAR 1 KARCHER'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_M_QUINA_DE_LAVAR_1_KARCHER_23 IS NULL THEN
        v_p_ex_M_QUINA_DE_LAVAR_1_KARCHER_23 := public.get_or_create_planejamento(
            v_a_ex_M_QUINA_DE_LAVAR_1_KARCHER_23,
            'Preventiva ' || 'MÁQUINA DE LAVAR 1 KARCHER',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_M_QUINA_DE_LAVAR_1_KARCHER_23,
        v_a_ex_M_QUINA_DE_LAVAR_1_KARCHER_23,
        'Preventiva ' || 'MÁQUINA DE LAVAR 1 KARCHER',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'samir@manequip.com',
        'Em aberto',
        20
    );
END $$;

DO $$
DECLARE
    v_a_ex_M_QUINA_DE_LAVAR_2_KARCHER_24 uuid;
    v_p_ex_M_QUINA_DE_LAVAR_2_KARCHER_24 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_M_QUINA_DE_LAVAR_2_KARCHER_24 := public.get_or_create_ativo('10304', 'MÁQUINA DE LAVAR 2 KARCHER', 'LAVADOR TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_M_QUINA_DE_LAVAR_2_KARCHER_24
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_M_QUINA_DE_LAVAR_2_KARCHER_24 AND titulo = 'Preventiva ' || 'MÁQUINA DE LAVAR 2 KARCHER'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_M_QUINA_DE_LAVAR_2_KARCHER_24 IS NULL THEN
        v_p_ex_M_QUINA_DE_LAVAR_2_KARCHER_24 := public.get_or_create_planejamento(
            v_a_ex_M_QUINA_DE_LAVAR_2_KARCHER_24,
            'Preventiva ' || 'MÁQUINA DE LAVAR 2 KARCHER',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_M_QUINA_DE_LAVAR_2_KARCHER_24,
        v_a_ex_M_QUINA_DE_LAVAR_2_KARCHER_24,
        'Preventiva ' || 'MÁQUINA DE LAVAR 2 KARCHER',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'wendel@manequip.com',
        'Em aberto',
        22
    );
END $$;

DO $$
DECLARE
    v_a_ex_M_QUINA_DE_LAVAR_3_KARCHER_25 uuid;
    v_p_ex_M_QUINA_DE_LAVAR_3_KARCHER_25 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_M_QUINA_DE_LAVAR_3_KARCHER_25 := public.get_or_create_ativo(NULL, 'MÁQUINA DE LAVAR 3 KARCHER', 'LAVADOR TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_M_QUINA_DE_LAVAR_3_KARCHER_25
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_M_QUINA_DE_LAVAR_3_KARCHER_25 AND titulo = 'Preventiva ' || 'MÁQUINA DE LAVAR 3 KARCHER'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_M_QUINA_DE_LAVAR_3_KARCHER_25 IS NULL THEN
        v_p_ex_M_QUINA_DE_LAVAR_3_KARCHER_25 := public.get_or_create_planejamento(
            v_a_ex_M_QUINA_DE_LAVAR_3_KARCHER_25,
            'Preventiva ' || 'MÁQUINA DE LAVAR 3 KARCHER',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_M_QUINA_DE_LAVAR_3_KARCHER_25,
        v_a_ex_M_QUINA_DE_LAVAR_3_KARCHER_25,
        'Preventiva ' || 'MÁQUINA DE LAVAR 3 KARCHER',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'genilson@manequip.com',
        'Em aberto',
        21
    );
END $$;

DO $$
DECLARE
    v_a_ex_M_QUINA_DE_MODELAR_2_GRANDE_26 uuid;
    v_p_ex_M_QUINA_DE_MODELAR_2_GRANDE_26 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_M_QUINA_DE_MODELAR_2_GRANDE_26 := public.get_or_create_ativo('17', 'MÁQUINA DE MODELAR 2 GRANDE', 'ISOLAMENTO DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_M_QUINA_DE_MODELAR_2_GRANDE_26
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_M_QUINA_DE_MODELAR_2_GRANDE_26 AND titulo = 'Preventiva ' || 'MÁQUINA DE MODELAR 2 GRANDE'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_M_QUINA_DE_MODELAR_2_GRANDE_26 IS NULL THEN
        v_p_ex_M_QUINA_DE_MODELAR_2_GRANDE_26 := public.get_or_create_planejamento(
            v_a_ex_M_QUINA_DE_MODELAR_2_GRANDE_26,
            'Preventiva ' || 'MÁQUINA DE MODELAR 2 GRANDE',
            'Realizar manutenção preventiva periódica.',
            'Trimestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_M_QUINA_DE_MODELAR_2_GRANDE_26,
        v_a_ex_M_QUINA_DE_MODELAR_2_GRANDE_26,
        'Preventiva ' || 'MÁQUINA DE MODELAR 2 GRANDE',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'maike@manequip.com',
        'Em aberto',
        20
    );
END $$;

DO $$
DECLARE
    v_a_ex_NOBREAK_1_CPD_ADM_27 uuid;
    v_p_ex_NOBREAK_1_CPD_ADM_27 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_NOBREAK_1_CPD_ADM_27 := public.get_or_create_ativo(NULL, 'NOBREAK 1 CPD ADM', 'CPD ADM', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_NOBREAK_1_CPD_ADM_27
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_NOBREAK_1_CPD_ADM_27 AND titulo = 'Preventiva ' || 'NOBREAK 1 CPD ADM'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_NOBREAK_1_CPD_ADM_27 IS NULL THEN
        v_p_ex_NOBREAK_1_CPD_ADM_27 := public.get_or_create_planejamento(
            v_a_ex_NOBREAK_1_CPD_ADM_27,
            'Preventiva ' || 'NOBREAK 1 CPD ADM',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_NOBREAK_1_CPD_ADM_27,
        v_a_ex_NOBREAK_1_CPD_ADM_27,
        'Preventiva ' || 'NOBREAK 1 CPD ADM',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'maike@manequip.com',
        'Em aberto',
        22
    );
END $$;

DO $$
DECLARE
    v_a_ex_NOBREAK_2_CPD_MOTOR_28 uuid;
    v_p_ex_NOBREAK_2_CPD_MOTOR_28 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_NOBREAK_2_CPD_MOTOR_28 := public.get_or_create_ativo(NULL, 'NOBREAK 2 CPD MOTOR', 'CPD MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_NOBREAK_2_CPD_MOTOR_28
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_NOBREAK_2_CPD_MOTOR_28 AND titulo = 'Preventiva ' || 'NOBREAK 2 CPD MOTOR'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_NOBREAK_2_CPD_MOTOR_28 IS NULL THEN
        v_p_ex_NOBREAK_2_CPD_MOTOR_28 := public.get_or_create_planejamento(
            v_a_ex_NOBREAK_2_CPD_MOTOR_28,
            'Preventiva ' || 'NOBREAK 2 CPD MOTOR',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_NOBREAK_2_CPD_MOTOR_28,
        v_a_ex_NOBREAK_2_CPD_MOTOR_28,
        'Preventiva ' || 'NOBREAK 2 CPD MOTOR',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'wendel@manequip.com',
        'Em aberto',
        20
    );
END $$;

DO $$
DECLARE
    v_a_ex_NOBREAK_3_CPD_TRAFO_29 uuid;
    v_p_ex_NOBREAK_3_CPD_TRAFO_29 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_NOBREAK_3_CPD_TRAFO_29 := public.get_or_create_ativo(NULL, 'NOBREAK 3 CPD TRAFO', 'CPD TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_NOBREAK_3_CPD_TRAFO_29
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_NOBREAK_3_CPD_TRAFO_29 AND titulo = 'Preventiva ' || 'NOBREAK 3 CPD TRAFO'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_NOBREAK_3_CPD_TRAFO_29 IS NULL THEN
        v_p_ex_NOBREAK_3_CPD_TRAFO_29 := public.get_or_create_planejamento(
            v_a_ex_NOBREAK_3_CPD_TRAFO_29,
            'Preventiva ' || 'NOBREAK 3 CPD TRAFO',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_NOBREAK_3_CPD_TRAFO_29,
        v_a_ex_NOBREAK_3_CPD_TRAFO_29,
        'Preventiva ' || 'NOBREAK 3 CPD TRAFO',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'luan@manequip.com',
        'Em aberto',
        21
    );
END $$;

DO $$
DECLARE
    v_a_ex_POLICORTE__1_30 uuid;
    v_p_ex_POLICORTE__1_30 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_POLICORTE__1_30 := public.get_or_create_ativo(NULL, 'POLICORTE  1', 'CALDEIRARIA MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_POLICORTE__1_30
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_POLICORTE__1_30 AND titulo = 'Preventiva ' || 'POLICORTE  1'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_POLICORTE__1_30 IS NULL THEN
        v_p_ex_POLICORTE__1_30 := public.get_or_create_planejamento(
            v_a_ex_POLICORTE__1_30,
            'Preventiva ' || 'POLICORTE  1',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_POLICORTE__1_30,
        v_a_ex_POLICORTE__1_30,
        'Preventiva ' || 'POLICORTE  1',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'aldemar@manequip.com',
        'Em aberto',
        25
    );
END $$;

DO $$
DECLARE
    v_a_ex_POLICORTE__2_31 uuid;
    v_p_ex_POLICORTE__2_31 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_POLICORTE__2_31 := public.get_or_create_ativo(NULL, 'POLICORTE  2', 'MANUTENÇÃO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_POLICORTE__2_31
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_POLICORTE__2_31 AND titulo = 'Preventiva ' || 'POLICORTE  2'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_POLICORTE__2_31 IS NULL THEN
        v_p_ex_POLICORTE__2_31 := public.get_or_create_planejamento(
            v_a_ex_POLICORTE__2_31,
            'Preventiva ' || 'POLICORTE  2',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_POLICORTE__2_31,
        v_a_ex_POLICORTE__2_31,
        'Preventiva ' || 'POLICORTE  2',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'genilson@manequip.com',
        'Em aberto',
        22
    );
END $$;

DO $$
DECLARE
    v_a_ex_POLICORTE__3_32 uuid;
    v_p_ex_POLICORTE__3_32 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_POLICORTE__3_32 := public.get_or_create_ativo(NULL, 'POLICORTE  3', 'CALDEIRARIA TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_POLICORTE__3_32
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_POLICORTE__3_32 AND titulo = 'Preventiva ' || 'POLICORTE  3'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_POLICORTE__3_32 IS NULL THEN
        v_p_ex_POLICORTE__3_32 := public.get_or_create_planejamento(
            v_a_ex_POLICORTE__3_32,
            'Preventiva ' || 'POLICORTE  3',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_POLICORTE__3_32,
        v_a_ex_POLICORTE__3_32,
        'Preventiva ' || 'POLICORTE  3',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'genilson@manequip.com',
        'Em aberto',
        25
    );
END $$;

DO $$
DECLARE
    v_a_ex_PONTE_ROLANTE_4_10T_33 uuid;
    v_p_ex_PONTE_ROLANTE_4_10T_33 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_PONTE_ROLANTE_4_10T_33 := public.get_or_create_ativo('PR 04', 'PONTE ROLANTE 4 10T', 'EXPEDIÇÃO - MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_PONTE_ROLANTE_4_10T_33
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_PONTE_ROLANTE_4_10T_33 AND titulo = 'Preventiva ' || 'PONTE ROLANTE 4 10T'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_PONTE_ROLANTE_4_10T_33 IS NULL THEN
        v_p_ex_PONTE_ROLANTE_4_10T_33 := public.get_or_create_planejamento(
            v_a_ex_PONTE_ROLANTE_4_10T_33,
            'Preventiva ' || 'PONTE ROLANTE 4 10T',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_PONTE_ROLANTE_4_10T_33,
        v_a_ex_PONTE_ROLANTE_4_10T_33,
        'Preventiva ' || 'PONTE ROLANTE 4 10T',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'vinicius@manequip.com',
        'Em aberto',
        21
    );
END $$;

DO $$
DECLARE
    v_a_ex_PONTE_ROLANTE_5_15T_34 uuid;
    v_p_ex_PONTE_ROLANTE_5_15T_34 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_PONTE_ROLANTE_5_15T_34 := public.get_or_create_ativo('PR 05', 'PONTE ROLANTE 5 15T', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_PONTE_ROLANTE_5_15T_34
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_PONTE_ROLANTE_5_15T_34 AND titulo = 'Preventiva ' || 'PONTE ROLANTE 5 15T'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_PONTE_ROLANTE_5_15T_34 IS NULL THEN
        v_p_ex_PONTE_ROLANTE_5_15T_34 := public.get_or_create_planejamento(
            v_a_ex_PONTE_ROLANTE_5_15T_34,
            'Preventiva ' || 'PONTE ROLANTE 5 15T',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_PONTE_ROLANTE_5_15T_34,
        v_a_ex_PONTE_ROLANTE_5_15T_34,
        'Preventiva ' || 'PONTE ROLANTE 5 15T',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'vinicius@manequip.com',
        'Em aberto',
        25
    );
END $$;

DO $$
DECLARE
    v_a_ex_PONTE_ROLANTE_7_10T_35 uuid;
    v_p_ex_PONTE_ROLANTE_7_10T_35 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_PONTE_ROLANTE_7_10T_35 := public.get_or_create_ativo('PR 07', 'PONTE ROLANTE 7 10T', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_PONTE_ROLANTE_7_10T_35
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_PONTE_ROLANTE_7_10T_35 AND titulo = 'Preventiva ' || 'PONTE ROLANTE 7 10T'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_PONTE_ROLANTE_7_10T_35 IS NULL THEN
        v_p_ex_PONTE_ROLANTE_7_10T_35 := public.get_or_create_planejamento(
            v_a_ex_PONTE_ROLANTE_7_10T_35,
            'Preventiva ' || 'PONTE ROLANTE 7 10T',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_PONTE_ROLANTE_7_10T_35,
        v_a_ex_PONTE_ROLANTE_7_10T_35,
        'Preventiva ' || 'PONTE ROLANTE 7 10T',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'vinicius@manequip.com',
        'Em aberto',
        27
    );
END $$;

DO $$
DECLARE
    v_a_ex_P_RTICO_1___1T_36 uuid;
    v_p_ex_P_RTICO_1___1T_36 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_P_RTICO_1___1T_36 := public.get_or_create_ativo('490', 'PÓRTICO 1 - 1T', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_P_RTICO_1___1T_36
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_P_RTICO_1___1T_36 AND titulo = 'Preventiva ' || 'PÓRTICO 1 - 1T'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_P_RTICO_1___1T_36 IS NULL THEN
        v_p_ex_P_RTICO_1___1T_36 := public.get_or_create_planejamento(
            v_a_ex_P_RTICO_1___1T_36,
            'Preventiva ' || 'PÓRTICO 1 - 1T',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_P_RTICO_1___1T_36,
        v_a_ex_P_RTICO_1___1T_36,
        'Preventiva ' || 'PÓRTICO 1 - 1T',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'daniel@manequip.com',
        'Em aberto',
        19
    );
END $$;

DO $$
DECLARE
    v_a_ex_P_RTICO_2___1_5T_37 uuid;
    v_p_ex_P_RTICO_2___1_5T_37 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_P_RTICO_2___1_5T_37 := public.get_or_create_ativo('784', 'PÓRTICO 2 - 1,5T', 'PÓLO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_P_RTICO_2___1_5T_37
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_P_RTICO_2___1_5T_37 AND titulo = 'Preventiva ' || 'PÓRTICO 2 - 1,5T'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_P_RTICO_2___1_5T_37 IS NULL THEN
        v_p_ex_P_RTICO_2___1_5T_37 := public.get_or_create_planejamento(
            v_a_ex_P_RTICO_2___1_5T_37,
            'Preventiva ' || 'PÓRTICO 2 - 1,5T',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_P_RTICO_2___1_5T_37,
        v_a_ex_P_RTICO_2___1_5T_37,
        'Preventiva ' || 'PÓRTICO 2 - 1,5T',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'daniel@manequip.com',
        'Em aberto',
        20
    );
END $$;

DO $$
DECLARE
    v_a_ex_P_RTICO_3___1_5T_38 uuid;
    v_p_ex_P_RTICO_3___1_5T_38 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_P_RTICO_3___1_5T_38 := public.get_or_create_ativo('783', 'PÓRTICO 3 - 1,5T', 'COMUTADORES TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_P_RTICO_3___1_5T_38
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_P_RTICO_3___1_5T_38 AND titulo = 'Preventiva ' || 'PÓRTICO 3 - 1,5T'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_P_RTICO_3___1_5T_38 IS NULL THEN
        v_p_ex_P_RTICO_3___1_5T_38 := public.get_or_create_planejamento(
            v_a_ex_P_RTICO_3___1_5T_38,
            'Preventiva ' || 'PÓRTICO 3 - 1,5T',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_P_RTICO_3___1_5T_38,
        v_a_ex_P_RTICO_3___1_5T_38,
        'Preventiva ' || 'PÓRTICO 3 - 1,5T',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'genilson@manequip.com',
        'Em aberto',
        20
    );
END $$;

DO $$
DECLARE
    v_a_ex_P_RTICO_4___2T_39 uuid;
    v_p_ex_P_RTICO_4___2T_39 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_P_RTICO_4___2T_39 := public.get_or_create_ativo(NULL, 'PÓRTICO 4 - 2T', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_P_RTICO_4___2T_39
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_P_RTICO_4___2T_39 AND titulo = 'Preventiva ' || 'PÓRTICO 4 - 2T'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_P_RTICO_4___2T_39 IS NULL THEN
        v_p_ex_P_RTICO_4___2T_39 := public.get_or_create_planejamento(
            v_a_ex_P_RTICO_4___2T_39,
            'Preventiva ' || 'PÓRTICO 4 - 2T',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_P_RTICO_4___2T_39,
        v_a_ex_P_RTICO_4___2T_39,
        'Preventiva ' || 'PÓRTICO 4 - 2T',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'aldemar@manequip.com',
        'Em aberto',
        22
    );
END $$;

DO $$
DECLARE
    v_a_ex_P_RTICO_5___2T_40 uuid;
    v_p_ex_P_RTICO_5___2T_40 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_P_RTICO_5___2T_40 := public.get_or_create_ativo(NULL, 'PÓRTICO 5 - 2T', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_P_RTICO_5___2T_40
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_P_RTICO_5___2T_40 AND titulo = 'Preventiva ' || 'PÓRTICO 5 - 2T'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_P_RTICO_5___2T_40 IS NULL THEN
        v_p_ex_P_RTICO_5___2T_40 := public.get_or_create_planejamento(
            v_a_ex_P_RTICO_5___2T_40,
            'Preventiva ' || 'PÓRTICO 5 - 2T',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_P_RTICO_5___2T_40,
        v_a_ex_P_RTICO_5___2T_40,
        'Preventiva ' || 'PÓRTICO 5 - 2T',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'aldemar@manequip.com',
        'Em aberto',
        21
    );
END $$;

DO $$
DECLARE
    v_a_ex_P_RTICO_6___6_3T_41 uuid;
    v_p_ex_P_RTICO_6___6_3T_41 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_P_RTICO_6___6_3T_41 := public.get_or_create_ativo('4238', 'PÓRTICO 6 - 6,3T', 'BOBINAS MAGNÉTICAS XL COILS', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_P_RTICO_6___6_3T_41
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_P_RTICO_6___6_3T_41 AND titulo = 'Preventiva ' || 'PÓRTICO 6 - 6,3T'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_P_RTICO_6___6_3T_41 IS NULL THEN
        v_p_ex_P_RTICO_6___6_3T_41 := public.get_or_create_planejamento(
            v_a_ex_P_RTICO_6___6_3T_41,
            'Preventiva ' || 'PÓRTICO 6 - 6,3T',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_P_RTICO_6___6_3T_41,
        v_a_ex_P_RTICO_6___6_3T_41,
        'Preventiva ' || 'PÓRTICO 6 - 6,3T',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'hugo@manequip.com',
        'Em aberto',
        25
    );
END $$;

DO $$
DECLARE
    v_a_ex_QUEIMADOR_TENGE_42 uuid;
    v_p_ex_QUEIMADOR_TENGE_42 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_QUEIMADOR_TENGE_42 := public.get_or_create_ativo(NULL, 'QUEIMADOR TENGE', 'GALPÃO NOVO - ÁREA EXTERNA', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_QUEIMADOR_TENGE_42
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_QUEIMADOR_TENGE_42 AND titulo = 'Preventiva ' || 'QUEIMADOR TENGE'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_QUEIMADOR_TENGE_42 IS NULL THEN
        v_p_ex_QUEIMADOR_TENGE_42 := public.get_or_create_planejamento(
            v_a_ex_QUEIMADOR_TENGE_42,
            'Preventiva ' || 'QUEIMADOR TENGE',
            'Realizar manutenção preventiva periódica.',
            'Trimestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_QUEIMADOR_TENGE_42,
        v_a_ex_QUEIMADOR_TENGE_42,
        'Preventiva ' || 'QUEIMADOR TENGE',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'hugo@manequip.com',
        'Em atendimento',
        18
    );
END $$;

DO $$
DECLARE
    v_a_ex_REBAIXADORA_DE_MICA_1_43 uuid;
    v_p_ex_REBAIXADORA_DE_MICA_1_43 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_REBAIXADORA_DE_MICA_1_43 := public.get_or_create_ativo(NULL, 'REBAIXADORA DE MICA 1', 'MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_REBAIXADORA_DE_MICA_1_43
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_REBAIXADORA_DE_MICA_1_43 AND titulo = 'Preventiva ' || 'REBAIXADORA DE MICA 1'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_REBAIXADORA_DE_MICA_1_43 IS NULL THEN
        v_p_ex_REBAIXADORA_DE_MICA_1_43 := public.get_or_create_planejamento(
            v_a_ex_REBAIXADORA_DE_MICA_1_43,
            'Preventiva ' || 'REBAIXADORA DE MICA 1',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_REBAIXADORA_DE_MICA_1_43,
        v_a_ex_REBAIXADORA_DE_MICA_1_43,
        'Preventiva ' || 'REBAIXADORA DE MICA 1',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'vinicius@manequip.com',
        'Em aberto',
        22
    );
END $$;

DO $$
DECLARE
    v_a_ex_ROSQUEADEIRA_1_44 uuid;
    v_p_ex_ROSQUEADEIRA_1_44 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_ROSQUEADEIRA_1_44 := public.get_or_create_ativo(NULL, 'ROSQUEADEIRA 1', 'TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_ROSQUEADEIRA_1_44
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_ROSQUEADEIRA_1_44 AND titulo = 'Preventiva ' || 'ROSQUEADEIRA 1'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_ROSQUEADEIRA_1_44 IS NULL THEN
        v_p_ex_ROSQUEADEIRA_1_44 := public.get_or_create_planejamento(
            v_a_ex_ROSQUEADEIRA_1_44,
            'Preventiva ' || 'ROSQUEADEIRA 1',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_ROSQUEADEIRA_1_44,
        v_a_ex_ROSQUEADEIRA_1_44,
        'Preventiva ' || 'ROSQUEADEIRA 1',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'genilson@manequip.com',
        'Em aberto',
        25
    );
END $$;

DO $$
DECLARE
    v_a_ex_SACA_POLIA_1_45 uuid;
    v_p_ex_SACA_POLIA_1_45 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_SACA_POLIA_1_45 := public.get_or_create_ativo(NULL, 'SACA POLIA 1', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_SACA_POLIA_1_45
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_SACA_POLIA_1_45 AND titulo = 'Preventiva ' || 'SACA POLIA 1'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_SACA_POLIA_1_45 IS NULL THEN
        v_p_ex_SACA_POLIA_1_45 := public.get_or_create_planejamento(
            v_a_ex_SACA_POLIA_1_45,
            'Preventiva ' || 'SACA POLIA 1',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_SACA_POLIA_1_45,
        v_a_ex_SACA_POLIA_1_45,
        'Preventiva ' || 'SACA POLIA 1',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'genilson@manequip.com',
        'Em aberto',
        26
    );
END $$;

DO $$
DECLARE
    v_a_ex_SACA_POLIA_2_46 uuid;
    v_p_ex_SACA_POLIA_2_46 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_SACA_POLIA_2_46 := public.get_or_create_ativo(NULL, 'SACA POLIA 2', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_SACA_POLIA_2_46
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_SACA_POLIA_2_46 AND titulo = 'Preventiva ' || 'SACA POLIA 2'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_SACA_POLIA_2_46 IS NULL THEN
        v_p_ex_SACA_POLIA_2_46 := public.get_or_create_planejamento(
            v_a_ex_SACA_POLIA_2_46,
            'Preventiva ' || 'SACA POLIA 2',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_SACA_POLIA_2_46,
        v_a_ex_SACA_POLIA_2_46,
        'Preventiva ' || 'SACA POLIA 2',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'genilson@manequip.com',
        'Em aberto',
        26
    );
END $$;

DO $$
DECLARE
    v_a_ex_TALHA_1___4T_47 uuid;
    v_p_ex_TALHA_1___4T_47 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_TALHA_1___4T_47 := public.get_or_create_ativo(NULL, 'TALHA 1 - 4T', 'GALPÃO MOTOR', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_TALHA_1___4T_47
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_TALHA_1___4T_47 AND titulo = 'Preventiva ' || 'TALHA 1 - 4T'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_TALHA_1___4T_47 IS NULL THEN
        v_p_ex_TALHA_1___4T_47 := public.get_or_create_planejamento(
            v_a_ex_TALHA_1___4T_47,
            'Preventiva ' || 'TALHA 1 - 4T',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_TALHA_1___4T_47,
        v_a_ex_TALHA_1___4T_47,
        'Preventiva ' || 'TALHA 1 - 4T',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'samir@manequip.com',
        'Em aberto',
        22
    );
END $$;

DO $$
DECLARE
    v_a_ex_TALHA_2___10T_48 uuid;
    v_p_ex_TALHA_2___10T_48 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_TALHA_2___10T_48 := public.get_or_create_ativo(NULL, 'TALHA 2 - 10T', 'TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_TALHA_2___10T_48
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_TALHA_2___10T_48 AND titulo = 'Preventiva ' || 'TALHA 2 - 10T'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_TALHA_2___10T_48 IS NULL THEN
        v_p_ex_TALHA_2___10T_48 := public.get_or_create_planejamento(
            v_a_ex_TALHA_2___10T_48,
            'Preventiva ' || 'TALHA 2 - 10T',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_TALHA_2___10T_48,
        v_a_ex_TALHA_2___10T_48,
        'Preventiva ' || 'TALHA 2 - 10T',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'aldemar@manequip.com',
        'Em aberto',
        25
    );
END $$;

DO $$
DECLARE
    v_a_ex_TERMOV_CUO_5___10000L_H_49 uuid;
    v_p_ex_TERMOV_CUO_5___10000L_H_49 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_TERMOV_CUO_5___10000L_H_49 := public.get_or_create_ativo('28', 'TERMOVÁCUO 5 - 10000L/H', 'TRAFO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_TERMOV_CUO_5___10000L_H_49
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_TERMOV_CUO_5___10000L_H_49 AND titulo = 'Preventiva ' || 'TERMOVÁCUO 5 - 10000L/H'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_TERMOV_CUO_5___10000L_H_49 IS NULL THEN
        v_p_ex_TERMOV_CUO_5___10000L_H_49 := public.get_or_create_planejamento(
            v_a_ex_TERMOV_CUO_5___10000L_H_49,
            'Preventiva ' || 'TERMOVÁCUO 5 - 10000L/H',
            'Realizar manutenção preventiva periódica.',
            'Semestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_TERMOV_CUO_5___10000L_H_49,
        v_a_ex_TERMOV_CUO_5___10000L_H_49,
        'Preventiva ' || 'TERMOVÁCUO 5 - 10000L/H',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'wendel@manequip.com',
        'Em aberto',
        26
    );
END $$;

DO $$
DECLARE
    v_a_ex_TORNO_1_NARDINI_AM_650_VS_50 uuid;
    v_p_ex_TORNO_1_NARDINI_AM_650_VS_50 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_TORNO_1_NARDINI_AM_650_VS_50 := public.get_or_create_ativo(NULL, 'TORNO 1 NARDINI AM 650 VS', 'USINAGEM', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_TORNO_1_NARDINI_AM_650_VS_50
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_TORNO_1_NARDINI_AM_650_VS_50 AND titulo = 'Preventiva ' || 'TORNO 1 NARDINI AM 650 VS'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_TORNO_1_NARDINI_AM_650_VS_50 IS NULL THEN
        v_p_ex_TORNO_1_NARDINI_AM_650_VS_50 := public.get_or_create_planejamento(
            v_a_ex_TORNO_1_NARDINI_AM_650_VS_50,
            'Preventiva ' || 'TORNO 1 NARDINI AM 650 VS',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_TORNO_1_NARDINI_AM_650_VS_50,
        v_a_ex_TORNO_1_NARDINI_AM_650_VS_50,
        'Preventiva ' || 'TORNO 1 NARDINI AM 650 VS',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'wendel@manequip.com',
        'Em aberto',
        22
    );
END $$;

DO $$
DECLARE
    v_a_ex_TORNO_2_ROMI___S20A_51 uuid;
    v_p_ex_TORNO_2_ROMI___S20A_51 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_TORNO_2_ROMI___S20A_51 := public.get_or_create_ativo('2313', 'TORNO 2 ROMI - S20A', 'USINAGEM', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_TORNO_2_ROMI___S20A_51
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_TORNO_2_ROMI___S20A_51 AND titulo = 'Preventiva ' || 'TORNO 2 ROMI - S20A'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_TORNO_2_ROMI___S20A_51 IS NULL THEN
        v_p_ex_TORNO_2_ROMI___S20A_51 := public.get_or_create_planejamento(
            v_a_ex_TORNO_2_ROMI___S20A_51,
            'Preventiva ' || 'TORNO 2 ROMI - S20A',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_TORNO_2_ROMI___S20A_51,
        v_a_ex_TORNO_2_ROMI___S20A_51,
        'Preventiva ' || 'TORNO 2 ROMI - S20A',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'vinicius@manequip.com',
        'Em aberto',
        20
    );
END $$;

DO $$
DECLARE
    v_a_ex_TORNO_3_TORMAX_30B_52 uuid;
    v_p_ex_TORNO_3_TORMAX_30B_52 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_TORNO_3_TORMAX_30B_52 := public.get_or_create_ativo('4024', 'TORNO 3 TORMAX 30B', 'USINAGEM', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_TORNO_3_TORMAX_30B_52
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_TORNO_3_TORMAX_30B_52 AND titulo = 'Preventiva ' || 'TORNO 3 TORMAX 30B'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_TORNO_3_TORMAX_30B_52 IS NULL THEN
        v_p_ex_TORNO_3_TORMAX_30B_52 := public.get_or_create_planejamento(
            v_a_ex_TORNO_3_TORMAX_30B_52,
            'Preventiva ' || 'TORNO 3 TORMAX 30B',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_TORNO_3_TORMAX_30B_52,
        v_a_ex_TORNO_3_TORMAX_30B_52,
        'Preventiva ' || 'TORNO 3 TORMAX 30B',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'hugo@manequip.com',
        'Em aberto',
        21
    );
END $$;

DO $$
DECLARE
    v_a_ex_TORNO_4_TORMAX_30B___LOCADO_53 uuid;
    v_p_ex_TORNO_4_TORMAX_30B___LOCADO_53 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_TORNO_4_TORMAX_30B___LOCADO_53 := public.get_or_create_ativo('LOCADO', 'TORNO 4 TORMAX 30B - LOCADO', 'USINAGEM', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_TORNO_4_TORMAX_30B___LOCADO_53
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_TORNO_4_TORMAX_30B___LOCADO_53 AND titulo = 'Preventiva ' || 'TORNO 4 TORMAX 30B - LOCADO'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_TORNO_4_TORMAX_30B___LOCADO_53 IS NULL THEN
        v_p_ex_TORNO_4_TORMAX_30B___LOCADO_53 := public.get_or_create_planejamento(
            v_a_ex_TORNO_4_TORMAX_30B___LOCADO_53,
            'Preventiva ' || 'TORNO 4 TORMAX 30B - LOCADO',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_TORNO_4_TORMAX_30B___LOCADO_53,
        v_a_ex_TORNO_4_TORMAX_30B___LOCADO_53,
        'Preventiva ' || 'TORNO 4 TORMAX 30B - LOCADO',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'samir@manequip.com',
        'Em aberto',
        26
    );
END $$;

DO $$
DECLARE
    v_a_ex_TORNO_5_ROMI___ES40B_54 uuid;
    v_p_ex_TORNO_5_ROMI___ES40B_54 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_TORNO_5_ROMI___ES40B_54 := public.get_or_create_ativo(NULL, 'TORNO 5 ROMI - ES40B', 'USINAGEM', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_TORNO_5_ROMI___ES40B_54
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_TORNO_5_ROMI___ES40B_54 AND titulo = 'Preventiva ' || 'TORNO 5 ROMI - ES40B'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_TORNO_5_ROMI___ES40B_54 IS NULL THEN
        v_p_ex_TORNO_5_ROMI___ES40B_54 := public.get_or_create_planejamento(
            v_a_ex_TORNO_5_ROMI___ES40B_54,
            'Preventiva ' || 'TORNO 5 ROMI - ES40B',
            'Realizar manutenção preventiva periódica.',
            'Mensal',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_TORNO_5_ROMI___ES40B_54,
        v_a_ex_TORNO_5_ROMI___ES40B_54,
        'Preventiva ' || 'TORNO 5 ROMI - ES40B',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'samir@manequip.com',
        'Em aberto',
        22
    );
END $$;

DO $$
DECLARE
    v_a_ex_TORRE_DE_RESFRIAMENTO_1___REA__55 uuid;
    v_p_ex_TORRE_DE_RESFRIAMENTO_1___REA__55 uuid;
BEGIN
    -- Get or create asset
    v_a_ex_TORRE_DE_RESFRIAMENTO_1___REA__55 := public.get_or_create_ativo('10496', 'TORRE DE RESFRIAMENTO 1 (ÁREA EXTERNA -TRANSFORMADORES)', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Try to find planning template by asset id and title
    SELECT id INTO v_p_ex_TORRE_DE_RESFRIAMENTO_1___REA__55
    FROM public.preventivas_planejamento
    WHERE ativo_id = v_a_ex_TORRE_DE_RESFRIAMENTO_1___REA__55 AND titulo = 'Preventiva ' || 'TORRE DE RESFRIAMENTO 1 (ÁREA EXTERNA -TRANSFORMADORES)'
    LIMIT 1;
    
    -- If planning doesn't exist, create a default template
    IF v_p_ex_TORRE_DE_RESFRIAMENTO_1___REA__55 IS NULL THEN
        v_p_ex_TORRE_DE_RESFRIAMENTO_1___REA__55 := public.get_or_create_planejamento(
            v_a_ex_TORRE_DE_RESFRIAMENTO_1___REA__55,
            'Preventiva ' || 'TORRE DE RESFRIAMENTO 1 (ÁREA EXTERNA -TRANSFORMADORES)',
            'Realizar manutenção preventiva periódica.',
            'Trimestral',
            ARRAY[4] -- default execution in April
        );
    END IF;
    
    -- Upsert the monthly execution task
    PERFORM public.upsert_preventiva_mensal(
        v_p_ex_TORRE_DE_RESFRIAMENTO_1___REA__55,
        v_a_ex_TORRE_DE_RESFRIAMENTO_1___REA__55,
        'Preventiva ' || 'TORRE DE RESFRIAMENTO 1 (ÁREA EXTERNA -TRANSFORMADORES)',
        'Realizar manutenção preventiva periódica conforme plano de manutenção FO-SGI-032.',
        4, -- April
        2026, -- Year 2026
        'luan@manequip.com',
        'Concluído',
        15
    );
END $$;

COMMIT;

-- Cleanup helper functions to keep schema clean
DROP FUNCTION IF EXISTS public.get_or_create_ativo(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.get_or_create_planejamento(uuid, text, text, text, integer[]);
DROP FUNCTION IF EXISTS public.upsert_preventiva_mensal(uuid, uuid, text, text, integer, integer, text, text, integer);