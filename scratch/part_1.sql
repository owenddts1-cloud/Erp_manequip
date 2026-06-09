BEGIN;

-- ==========================================================
-- AUTOMATICALLY GENERATED PREVENTIVE MAINTENANCE DATA IMPORT
-- ==========================================================


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

COMMIT;