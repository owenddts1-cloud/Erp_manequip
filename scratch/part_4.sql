BEGIN;

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

COMMIT;