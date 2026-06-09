BEGIN;

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

COMMIT;