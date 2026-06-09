BEGIN;

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

COMMIT;