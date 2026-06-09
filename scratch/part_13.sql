BEGIN;

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

COMMIT;