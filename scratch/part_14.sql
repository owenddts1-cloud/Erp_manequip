BEGIN;

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

COMMIT;