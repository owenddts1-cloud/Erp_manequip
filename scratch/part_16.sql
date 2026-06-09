BEGIN;

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