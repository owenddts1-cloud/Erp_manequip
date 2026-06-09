BEGIN;

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

COMMIT;