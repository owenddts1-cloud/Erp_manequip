BEGIN;

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

COMMIT;