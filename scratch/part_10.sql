BEGIN;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_17_GH_4T_166 uuid;
    v_p_PONTE_ROLANTE_17_GH_4T_166 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_17_GH_4T_166 := public.get_or_create_ativo('PR 17', 'PONTE ROLANTE 17 GH 4T', 'SALA DE TESTE (GALPÃO NOVO)', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_17_GH_4T_166 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_17_GH_4T_166,
        'Preventiva ' || 'PONTE ROLANTE 17 GH 4T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_18_GH_4T_167 uuid;
    v_p_PONTE_ROLANTE_18_GH_4T_167 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_18_GH_4T_167 := public.get_or_create_ativo('PR 18', 'PONTE ROLANTE 18 GH 4T', 'SALA DE TESTE (GALPÃO NOVO)', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_18_GH_4T_167 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_18_GH_4T_167,
        'Preventiva ' || 'PONTE ROLANTE 18 GH 4T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_PRENSA_1_300T_168 uuid;
    v_p_PRENSA_1_300T_168 uuid;
BEGIN
    -- Get or create asset
    v_a_PRENSA_1_300T_168 := public.get_or_create_ativo('4220', 'PRENSA 1 300T', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PRENSA_1_300T_168 := public.get_or_create_planejamento(
        v_a_PRENSA_1_300T_168,
        'Preventiva ' || 'PRENSA 1 300T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_PRENSA_2_200T_169 uuid;
    v_p_PRENSA_2_200T_169 uuid;
BEGIN
    -- Get or create asset
    v_a_PRENSA_2_200T_169 := public.get_or_create_ativo('5083', 'PRENSA 2 200T', 'BOBINAS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PRENSA_2_200T_169 := public.get_or_create_planejamento(
        v_a_PRENSA_2_200T_169,
        'Preventiva ' || 'PRENSA 2 200T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[1, 7]
    );
END $$;

DO $$
DECLARE
    v_a_PRENSA_4_PAPEL_O_170 uuid;
    v_p_PRENSA_4_PAPEL_O_170 uuid;
BEGIN
    -- Get or create asset
    v_a_PRENSA_4_PAPEL_O_170 := public.get_or_create_ativo('4955', 'PRENSA 4 PAPELÃO', 'GALPÃO DE BOBINAS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PRENSA_4_PAPEL_O_170 := public.get_or_create_planejamento(
        v_a_PRENSA_4_PAPEL_O_170,
        'Preventiva ' || 'PRENSA 4 PAPELÃO',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_P_RTICO_1___1T_171 uuid;
    v_p_P_RTICO_1___1T_171 uuid;
BEGIN
    -- Get or create asset
    v_a_P_RTICO_1___1T_171 := public.get_or_create_ativo('490', 'PÓRTICO 1 - 1T', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_P_RTICO_1___1T_171 := public.get_or_create_planejamento(
        v_a_P_RTICO_1___1T_171,
        'Preventiva ' || 'PÓRTICO 1 - 1T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_P_RTICO_2___1_5T_172 uuid;
    v_p_P_RTICO_2___1_5T_172 uuid;
BEGIN
    -- Get or create asset
    v_a_P_RTICO_2___1_5T_172 := public.get_or_create_ativo('784', 'PÓRTICO 2 - 1,5T', 'PÓLO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_P_RTICO_2___1_5T_172 := public.get_or_create_planejamento(
        v_a_P_RTICO_2___1_5T_172,
        'Preventiva ' || 'PÓRTICO 2 - 1,5T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_P_RTICO_3___1_5T_173 uuid;
    v_p_P_RTICO_3___1_5T_173 uuid;
BEGIN
    -- Get or create asset
    v_a_P_RTICO_3___1_5T_173 := public.get_or_create_ativo('783', 'PÓRTICO 3 - 1,5T', 'COMUTADORES TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_P_RTICO_3___1_5T_173 := public.get_or_create_planejamento(
        v_a_P_RTICO_3___1_5T_173,
        'Preventiva ' || 'PÓRTICO 3 - 1,5T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_P_RTICO_4___2T_174 uuid;
    v_p_P_RTICO_4___2T_174 uuid;
BEGIN
    -- Get or create asset
    v_a_P_RTICO_4___2T_174 := public.get_or_create_ativo(NULL, 'PÓRTICO 4 - 2T', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_P_RTICO_4___2T_174 := public.get_or_create_planejamento(
        v_a_P_RTICO_4___2T_174,
        'Preventiva ' || 'PÓRTICO 4 - 2T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_P_RTICO_5___2T_175 uuid;
    v_p_P_RTICO_5___2T_175 uuid;
BEGIN
    -- Get or create asset
    v_a_P_RTICO_5___2T_175 := public.get_or_create_ativo(NULL, 'PÓRTICO 5 - 2T', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_P_RTICO_5___2T_175 := public.get_or_create_planejamento(
        v_a_P_RTICO_5___2T_175,
        'Preventiva ' || 'PÓRTICO 5 - 2T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_P_RTICO_6___6_3T_176 uuid;
    v_p_P_RTICO_6___6_3T_176 uuid;
BEGIN
    -- Get or create asset
    v_a_P_RTICO_6___6_3T_176 := public.get_or_create_ativo('4238', 'PÓRTICO 6 - 6,3T', 'BOBINAS MAGNÉTICAS XL COILS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_P_RTICO_6___6_3T_176 := public.get_or_create_planejamento(
        v_a_P_RTICO_6___6_3T_176,
        'Preventiva ' || 'PÓRTICO 6 - 6,3T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_QUEIMADOR_TENGE_177 uuid;
    v_p_QUEIMADOR_TENGE_177 uuid;
BEGIN
    -- Get or create asset
    v_a_QUEIMADOR_TENGE_177 := public.get_or_create_ativo(NULL, 'QUEIMADOR TENGE', 'GALPÃO NOVO - ÁREA EXTERNA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_QUEIMADOR_TENGE_177 := public.get_or_create_planejamento(
        v_a_QUEIMADOR_TENGE_177,
        'Preventiva ' || 'QUEIMADOR TENGE',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[2, 5, 8, 11]
    );
END $$;

DO $$
DECLARE
    v_a_REATOR_1_178 uuid;
    v_p_REATOR_1_178 uuid;
BEGIN
    -- Get or create asset
    v_a_REATOR_1_178 := public.get_or_create_ativo('2373', 'REATOR 1', 'SALA DE TESTE TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_REATOR_1_178 := public.get_or_create_planejamento(
        v_a_REATOR_1_178,
        'Preventiva ' || 'REATOR 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Anual',
        ARRAY[8]
    );
END $$;

DO $$
DECLARE
    v_a_REBAIXADORA_DE_MICA_1_179 uuid;
    v_p_REBAIXADORA_DE_MICA_1_179 uuid;
BEGIN
    -- Get or create asset
    v_a_REBAIXADORA_DE_MICA_1_179 := public.get_or_create_ativo(NULL, 'REBAIXADORA DE MICA 1', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_REBAIXADORA_DE_MICA_1_179 := public.get_or_create_planejamento(
        v_a_REBAIXADORA_DE_MICA_1_179,
        'Preventiva ' || 'REBAIXADORA DE MICA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_ROSQUEADEIRA_1_180 uuid;
    v_p_ROSQUEADEIRA_1_180 uuid;
BEGIN
    -- Get or create asset
    v_a_ROSQUEADEIRA_1_180 := public.get_or_create_ativo(NULL, 'ROSQUEADEIRA 1', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ROSQUEADEIRA_1_180 := public.get_or_create_planejamento(
        v_a_ROSQUEADEIRA_1_180,
        'Preventiva ' || 'ROSQUEADEIRA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_SACA_POLIA_1_181 uuid;
    v_p_SACA_POLIA_1_181 uuid;
BEGIN
    -- Get or create asset
    v_a_SACA_POLIA_1_181 := public.get_or_create_ativo(NULL, 'SACA POLIA 1', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SACA_POLIA_1_181 := public.get_or_create_planejamento(
        v_a_SACA_POLIA_1_181,
        'Preventiva ' || 'SACA POLIA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 5, 10]
    );
END $$;

DO $$
DECLARE
    v_a_SACA_POLIA_2_182 uuid;
    v_p_SACA_POLIA_2_182 uuid;
BEGIN
    -- Get or create asset
    v_a_SACA_POLIA_2_182 := public.get_or_create_ativo(NULL, 'SACA POLIA 2', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SACA_POLIA_2_182 := public.get_or_create_planejamento(
        v_a_SACA_POLIA_2_182,
        'Preventiva ' || 'SACA POLIA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 5, 10]
    );
END $$;

DO $$
DECLARE
    v_a_SECADOR_1_183 uuid;
    v_p_SECADOR_1_183 uuid;
BEGIN
    -- Get or create asset
    v_a_SECADOR_1_183 := public.get_or_create_ativo(NULL, 'SECADOR 1', 'ÁREA DE COMPRESSORES - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SECADOR_1_183 := public.get_or_create_planejamento(
        v_a_SECADOR_1_183,
        'Preventiva ' || 'SECADOR 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_SECADOR_2_184 uuid;
    v_p_SECADOR_2_184 uuid;
BEGIN
    -- Get or create asset
    v_a_SECADOR_2_184 := public.get_or_create_ativo(NULL, 'SECADOR 2', 'ÁREA DE COMPRESSORES - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SECADOR_2_184 := public.get_or_create_planejamento(
        v_a_SECADOR_2_184,
        'Preventiva ' || 'SECADOR 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_SECADOR_3_185 uuid;
    v_p_SECADOR_3_185 uuid;
BEGIN
    -- Get or create asset
    v_a_SECADOR_3_185 := public.get_or_create_ativo(NULL, 'SECADOR 3', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_SECADOR_3_185 := public.get_or_create_planejamento(
        v_a_SECADOR_3_185,
        'Preventiva ' || 'SECADOR 3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

COMMIT;