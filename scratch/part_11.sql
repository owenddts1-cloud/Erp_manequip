BEGIN;

DO $$
DECLARE
    v_a_SECADOR_4_186 uuid;
    v_p_SECADOR_4_186 uuid;
BEGIN
    -- Get or create asset
    v_a_SECADOR_4_186 := public.get_or_create_ativo(NULL, 'SECADOR 4', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SECADOR_4_186 := public.get_or_create_planejamento(
        v_a_SECADOR_4_186,
        'Preventiva ' || 'SECADOR 4',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_SECADOR_SUPER_SECO_1_187 uuid;
    v_p_SECADOR_SUPER_SECO_1_187 uuid;
BEGIN
    -- Get or create asset
    v_a_SECADOR_SUPER_SECO_1_187 := public.get_or_create_ativo(NULL, 'SECADOR SUPER SECO 1', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SECADOR_SUPER_SECO_1_187 := public.get_or_create_planejamento(
        v_a_SECADOR_SUPER_SECO_1_187,
        'Preventiva ' || 'SECADOR SUPER SECO 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_SERRA_FITA_1_RONEMAK_188 uuid;
    v_p_SERRA_FITA_1_RONEMAK_188 uuid;
BEGIN
    -- Get or create asset
    v_a_SERRA_FITA_1_RONEMAK_188 := public.get_or_create_ativo('4828', 'SERRA FITA 1 RONEMAK', 'CARPINTARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SERRA_FITA_1_RONEMAK_188 := public.get_or_create_planejamento(
        v_a_SERRA_FITA_1_RONEMAK_188,
        'Preventiva ' || 'SERRA FITA 1 RONEMAK',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_SERRA_FITA_2_189 uuid;
    v_p_SERRA_FITA_2_189 uuid;
BEGIN
    -- Get or create asset
    v_a_SERRA_FITA_2_189 := public.get_or_create_ativo(NULL, 'SERRA FITA 2', 'CARPINTARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SERRA_FITA_2_189 := public.get_or_create_planejamento(
        v_a_SERRA_FITA_2_189,
        'Preventiva ' || 'SERRA FITA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_SERRA_FITA_3_190 uuid;
    v_p_SERRA_FITA_3_190 uuid;
BEGIN
    -- Get or create asset
    v_a_SERRA_FITA_3_190 := public.get_or_create_ativo('468', 'SERRA FITA 3', 'CARPINTARIA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SERRA_FITA_3_190 := public.get_or_create_planejamento(
        v_a_SERRA_FITA_3_190,
        'Preventiva ' || 'SERRA FITA 3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_SERRA_FITA_4_FRANHO_191 uuid;
    v_p_SERRA_FITA_4_FRANHO_191 uuid;
BEGIN
    -- Get or create asset
    v_a_SERRA_FITA_4_FRANHO_191 := public.get_or_create_ativo('2645', 'SERRA FITA 4 FRANHO', 'CALDEIRARIA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SERRA_FITA_4_FRANHO_191 := public.get_or_create_planejamento(
        v_a_SERRA_FITA_4_FRANHO_191,
        'Preventiva ' || 'SERRA FITA 4 FRANHO',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_SISTEMA_RESSONANTE__DESATIVADO_192 uuid;
    v_p_SISTEMA_RESSONANTE__DESATIVADO_192 uuid;
BEGIN
    -- Get or create asset
    v_a_SISTEMA_RESSONANTE__DESATIVADO_192 := public.get_or_create_ativo(NULL, 'SISTEMA RESSONANTE (DESATIVADO  TEMPORARIAMENTE)', 'SALA DE TESTE (GALPÃO NOVO)', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SISTEMA_RESSONANTE__DESATIVADO_192 := public.get_or_create_planejamento(
        v_a_SISTEMA_RESSONANTE__DESATIVADO_192,
        'Preventiva ' || 'SISTEMA RESSONANTE (DESATIVADO  TEMPORARIAMENTE)',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        '{}'::integer[]
    );
END $$;

DO $$
DECLARE
    v_a_SOPRADOR_T_RMICO_1_193 uuid;
    v_p_SOPRADOR_T_RMICO_1_193 uuid;
BEGIN
    -- Get or create asset
    v_a_SOPRADOR_T_RMICO_1_193 := public.get_or_create_ativo('3122', 'SOPRADOR TÉRMICO 1', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SOPRADOR_T_RMICO_1_193 := public.get_or_create_planejamento(
        v_a_SOPRADOR_T_RMICO_1_193,
        'Preventiva ' || 'SOPRADOR TÉRMICO 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TALHA_1___4T_194 uuid;
    v_p_TALHA_1___4T_194 uuid;
BEGIN
    -- Get or create asset
    v_a_TALHA_1___4T_194 := public.get_or_create_ativo(NULL, 'TALHA 1 - 4T', 'GALPÃO MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TALHA_1___4T_194 := public.get_or_create_planejamento(
        v_a_TALHA_1___4T_194,
        'Preventiva ' || 'TALHA 1 - 4T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_TALHA_2___10T_195 uuid;
    v_p_TALHA_2___10T_195 uuid;
BEGIN
    -- Get or create asset
    v_a_TALHA_2___10T_195 := public.get_or_create_ativo(NULL, 'TALHA 2 - 10T', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TALHA_2___10T_195 := public.get_or_create_planejamento(
        v_a_TALHA_2___10T_195,
        'Preventiva ' || 'TALHA 2 - 10T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_TERMOV_CUO_1___4000_l_h_196 uuid;
    v_p_TERMOV_CUO_1___4000_l_h_196 uuid;
BEGIN
    -- Get or create asset
    v_a_TERMOV_CUO_1___4000_l_h_196 := public.get_or_create_ativo('22', 'TERMOVÁCUO 1 - 4000 l/h', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TERMOV_CUO_1___4000_l_h_196 := public.get_or_create_planejamento(
        v_a_TERMOV_CUO_1___4000_l_h_196,
        'Preventiva ' || 'TERMOVÁCUO 1 - 4000 l/h',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TERMOV_CUO_2___1300_l_h_197 uuid;
    v_p_TERMOV_CUO_2___1300_l_h_197 uuid;
BEGIN
    -- Get or create asset
    v_a_TERMOV_CUO_2___1300_l_h_197 := public.get_or_create_ativo('2330', 'TERMOVÁCUO 2 - 1300 l/h', 'XL COILS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TERMOV_CUO_2___1300_l_h_197 := public.get_or_create_planejamento(
        v_a_TERMOV_CUO_2___1300_l_h_197,
        'Preventiva ' || 'TERMOVÁCUO 2 - 1300 l/h',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TERMOV_CUO_3___3000_l_h_198 uuid;
    v_p_TERMOV_CUO_3___3000_l_h_198 uuid;
BEGIN
    -- Get or create asset
    v_a_TERMOV_CUO_3___3000_l_h_198 := public.get_or_create_ativo('2331', 'TERMOVÁCUO 3 - 3000 l/h', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TERMOV_CUO_3___3000_l_h_198 := public.get_or_create_planejamento(
        v_a_TERMOV_CUO_3___3000_l_h_198,
        'Preventiva ' || 'TERMOVÁCUO 3 - 3000 l/h',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TERMOV_CUO_4___5000_l_h_199 uuid;
    v_p_TERMOV_CUO_4___5000_l_h_199 uuid;
BEGIN
    -- Get or create asset
    v_a_TERMOV_CUO_4___5000_l_h_199 := public.get_or_create_ativo('3750', 'TERMOVÁCUO 4 - 5000 l/h', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TERMOV_CUO_4___5000_l_h_199 := public.get_or_create_planejamento(
        v_a_TERMOV_CUO_4___5000_l_h_199,
        'Preventiva ' || 'TERMOVÁCUO 4 - 5000 l/h',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TERMOV_CUO_5___10000L_H_200 uuid;
    v_p_TERMOV_CUO_5___10000L_H_200 uuid;
BEGIN
    -- Get or create asset
    v_a_TERMOV_CUO_5___10000L_H_200 := public.get_or_create_ativo('28', 'TERMOVÁCUO 5 - 10000L/H', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TERMOV_CUO_5___10000L_H_200 := public.get_or_create_planejamento(
        v_a_TERMOV_CUO_5___10000L_H_200,
        'Preventiva ' || 'TERMOVÁCUO 5 - 10000L/H',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_TERMOV_CUO_6_DDSL3_14000_201 uuid;
    v_p_TERMOV_CUO_6_DDSL3_14000_201 uuid;
BEGIN
    -- Get or create asset
    v_a_TERMOV_CUO_6_DDSL3_14000_201 := public.get_or_create_ativo('29', 'TERMOVÁCUO 6 DDSL3 14000', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TERMOV_CUO_6_DDSL3_14000_201 := public.get_or_create_planejamento(
        v_a_TERMOV_CUO_6_DDSL3_14000_201,
        'Preventiva ' || 'TERMOVÁCUO 6 DDSL3 14000',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TORNO_1_NARDINI_AM_650_VS_202 uuid;
    v_p_TORNO_1_NARDINI_AM_650_VS_202 uuid;
BEGIN
    -- Get or create asset
    v_a_TORNO_1_NARDINI_AM_650_VS_202 := public.get_or_create_ativo(NULL, 'TORNO 1 NARDINI AM 650 VS', 'USINAGEM', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TORNO_1_NARDINI_AM_650_VS_202 := public.get_or_create_planejamento(
        v_a_TORNO_1_NARDINI_AM_650_VS_202,
        'Preventiva ' || 'TORNO 1 NARDINI AM 650 VS',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TORNO_2_ROMI___S20A_203 uuid;
    v_p_TORNO_2_ROMI___S20A_203 uuid;
BEGIN
    -- Get or create asset
    v_a_TORNO_2_ROMI___S20A_203 := public.get_or_create_ativo('2313', 'TORNO 2 ROMI - S20A', 'USINAGEM', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TORNO_2_ROMI___S20A_203 := public.get_or_create_planejamento(
        v_a_TORNO_2_ROMI___S20A_203,
        'Preventiva ' || 'TORNO 2 ROMI - S20A',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TORNO_3_TORMAX_30B_204 uuid;
    v_p_TORNO_3_TORMAX_30B_204 uuid;
BEGIN
    -- Get or create asset
    v_a_TORNO_3_TORMAX_30B_204 := public.get_or_create_ativo('4024', 'TORNO 3 TORMAX 30B', 'USINAGEM', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TORNO_3_TORMAX_30B_204 := public.get_or_create_planejamento(
        v_a_TORNO_3_TORMAX_30B_204,
        'Preventiva ' || 'TORNO 3 TORMAX 30B',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_TORNO_4_TORMAX_30B___LOCADO_205 uuid;
    v_p_TORNO_4_TORMAX_30B___LOCADO_205 uuid;
BEGIN
    -- Get or create asset
    v_a_TORNO_4_TORMAX_30B___LOCADO_205 := public.get_or_create_ativo('LOCADO', 'TORNO 4 TORMAX 30B - LOCADO', 'USINAGEM', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_TORNO_4_TORMAX_30B___LOCADO_205 := public.get_or_create_planejamento(
        v_a_TORNO_4_TORMAX_30B___LOCADO_205,
        'Preventiva ' || 'TORNO 4 TORMAX 30B - LOCADO',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

COMMIT;