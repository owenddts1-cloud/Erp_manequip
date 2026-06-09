BEGIN;

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

COMMIT;