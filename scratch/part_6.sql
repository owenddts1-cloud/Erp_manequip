BEGIN;

DO $$
DECLARE
    v_a_FILTRO_PRENSA_2_5000_L_H_86 uuid;
    v_p_FILTRO_PRENSA_2_5000_L_H_86 uuid;
BEGIN
    -- Get or create asset
    v_a_FILTRO_PRENSA_2_5000_L_H_86 := public.get_or_create_ativo('2327', 'FILTRO PRENSA 2 5000 L/H', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FILTRO_PRENSA_2_5000_L_H_86 := public.get_or_create_planejamento(
        v_a_FILTRO_PRENSA_2_5000_L_H_86,
        'Preventiva ' || 'FILTRO PRENSA 2 5000 L/H',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_FILTRO_PRENSA_3_6_500_L_H_87 uuid;
    v_p_FILTRO_PRENSA_3_6_500_L_H_87 uuid;
BEGIN
    -- Get or create asset
    v_a_FILTRO_PRENSA_3_6_500_L_H_87 := public.get_or_create_ativo('4237', 'FILTRO PRENSA 3 6.500 L/H', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FILTRO_PRENSA_3_6_500_L_H_87 := public.get_or_create_planejamento(
        v_a_FILTRO_PRENSA_3_6_500_L_H_87,
        'Preventiva ' || 'FILTRO PRENSA 3 6.500 L/H',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_FORMAS_EXPANS_VEIS_88 uuid;
    v_p_FORMAS_EXPANS_VEIS_88 uuid;
BEGIN
    -- Get or create asset
    v_a_FORMAS_EXPANS_VEIS_88 := public.get_or_create_ativo(NULL, 'FORMAS EXPANSÍVEIS', 'FÁBRICA GALPÃO TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FORMAS_EXPANS_VEIS_88 := public.get_or_create_planejamento(
        v_a_FORMAS_EXPANS_VEIS_88,
        'Preventiva ' || 'FORMAS EXPANSÍVEIS',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_FORNO___FORNAX_89 uuid;
    v_p_FORNO___FORNAX_89 uuid;
BEGIN
    -- Get or create asset
    v_a_FORNO___FORNAX_89 := public.get_or_create_ativo('9', 'FORNO - FORNAX', 'DESMANCHE', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FORNO___FORNAX_89 := public.get_or_create_planejamento(
        v_a_FORNO___FORNAX_89,
        'Preventiva ' || 'FORNO - FORNAX',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_FRESADORA_TUPIA_1_90 uuid;
    v_p_FRESADORA_TUPIA_1_90 uuid;
BEGIN
    -- Get or create asset
    v_a_FRESADORA_TUPIA_1_90 := public.get_or_create_ativo('2399', 'FRESADORA TUPIA 1', 'CARPINTARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FRESADORA_TUPIA_1_90 := public.get_or_create_planejamento(
        v_a_FRESADORA_TUPIA_1_90,
        'Preventiva ' || 'FRESADORA TUPIA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_BANCADA_1_91 uuid;
    v_p_FURADEIRA_DE_BANCADA_1_91 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_BANCADA_1_91 := public.get_or_create_ativo('8213', 'FURADEIRA DE BANCADA 1', 'EMBARALHAMENTO MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_BANCADA_1_91 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_BANCADA_1_91,
        'Preventiva ' || 'FURADEIRA DE BANCADA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_BANCADA_2_VONDER_92 uuid;
    v_p_FURADEIRA_DE_BANCADA_2_VONDER_92 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_BANCADA_2_VONDER_92 := public.get_or_create_ativo('5189', 'FURADEIRA DE BANCADA 2 VONDER', 'XL COILS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_BANCADA_2_VONDER_92 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_BANCADA_2_VONDER_92,
        'Preventiva ' || 'FURADEIRA DE BANCADA 2 VONDER',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_BANCADA_3_93 uuid;
    v_p_FURADEIRA_DE_BANCADA_3_93 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_BANCADA_3_93 := public.get_or_create_ativo('3682', 'FURADEIRA DE BANCADA 3', 'CARPINTARIA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_BANCADA_3_93 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_BANCADA_3_93,
        'Preventiva ' || 'FURADEIRA DE BANCADA 3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_BANCADA_4_94 uuid;
    v_p_FURADEIRA_DE_BANCADA_4_94 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_BANCADA_4_94 := public.get_or_create_ativo('2914', 'FURADEIRA DE BANCADA 4', 'COMUTADORES TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_BANCADA_4_94 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_BANCADA_4_94,
        'Preventiva ' || 'FURADEIRA DE BANCADA 4',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_BANCADA_5_95 uuid;
    v_p_FURADEIRA_DE_BANCADA_5_95 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_BANCADA_5_95 := public.get_or_create_ativo('3769', 'FURADEIRA DE BANCADA 5', 'COMUTADORES TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_BANCADA_5_95 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_BANCADA_5_95,
        'Preventiva ' || 'FURADEIRA DE BANCADA 5',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_BANCADA_7_96 uuid;
    v_p_FURADEIRA_DE_BANCADA_7_96 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_BANCADA_7_96 := public.get_or_create_ativo('2863', 'FURADEIRA DE BANCADA 7', 'MANUTENÇÃO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_BANCADA_7_96 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_BANCADA_7_96,
        'Preventiva ' || 'FURADEIRA DE BANCADA 7',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_COLUNA_1_97 uuid;
    v_p_FURADEIRA_DE_COLUNA_1_97 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_COLUNA_1_97 := public.get_or_create_ativo('4246', 'FURADEIRA DE COLUNA 1', 'PARTE ATIVA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_COLUNA_1_97 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_COLUNA_1_97,
        'Preventiva ' || 'FURADEIRA DE COLUNA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_COLUNA_2_98 uuid;
    v_p_FURADEIRA_DE_COLUNA_2_98 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_COLUNA_2_98 := public.get_or_create_ativo('6639', 'FURADEIRA DE COLUNA 2', 'CARPINTARIA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_COLUNA_2_98 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_COLUNA_2_98,
        'Preventiva ' || 'FURADEIRA DE COLUNA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_DE_COLUNA_3_99 uuid;
    v_p_FURADEIRA_DE_COLUNA_3_99 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_DE_COLUNA_3_99 := public.get_or_create_ativo('419', 'FURADEIRA DE COLUNA 3', 'COMUTADORES TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_DE_COLUNA_3_99 := public.get_or_create_planejamento(
        v_a_FURADEIRA_DE_COLUNA_3_99,
        'Preventiva ' || 'FURADEIRA DE COLUNA 3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_RADIAL_1_ROCCO_60_100 uuid;
    v_p_FURADEIRA_RADIAL_1_ROCCO_60_100 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_RADIAL_1_ROCCO_60_100 := public.get_or_create_ativo('4167', 'FURADEIRA RADIAL 1 ROCCO 60', 'CALDEIRARIA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_RADIAL_1_ROCCO_60_100 := public.get_or_create_planejamento(
        v_a_FURADEIRA_RADIAL_1_ROCCO_60_100,
        'Preventiva ' || 'FURADEIRA RADIAL 1 ROCCO 60',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_FURADEIRA_RADIAL_2_HOVAN_101 uuid;
    v_p_FURADEIRA_RADIAL_2_HOVAN_101 uuid;
BEGIN
    -- Get or create asset
    v_a_FURADEIRA_RADIAL_2_HOVAN_101 := public.get_or_create_ativo('306', 'FURADEIRA RADIAL 2 HOVAN', 'CALDEIRARIA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_FURADEIRA_RADIAL_2_HOVAN_101 := public.get_or_create_planejamento(
        v_a_FURADEIRA_RADIAL_2_HOVAN_101,
        'Preventiva ' || 'FURADEIRA RADIAL 2 HOVAN',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_GERADOR_1_GENERAC_750_KVA_102 uuid;
    v_p_GERADOR_1_GENERAC_750_KVA_102 uuid;
BEGIN
    -- Get or create asset
    v_a_GERADOR_1_GENERAC_750_KVA_102 := public.get_or_create_ativo('3683', 'GERADOR 1 GENERAC 750 KVA', 'ÁREA EXTERNA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_GERADOR_1_GENERAC_750_KVA_102 := public.get_or_create_planejamento(
        v_a_GERADOR_1_GENERAC_750_KVA_102,
        'Preventiva ' || 'GERADOR 1 GENERAC 750 KVA',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_GERADOR_2_HELMER_SILENT_150_KV_103 uuid;
    v_p_GERADOR_2_HELMER_SILENT_150_KV_103 uuid;
BEGIN
    -- Get or create asset
    v_a_GERADOR_2_HELMER_SILENT_150_KV_103 := public.get_or_create_ativo('7', 'GERADOR 2 HELMER SILENT 150 KVA', 'GALPÃO BOBINAS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_GERADOR_2_HELMER_SILENT_150_KV_103 := public.get_or_create_planejamento(
        v_a_GERADOR_2_HELMER_SILENT_150_KV_103,
        'Preventiva ' || 'GERADOR 2 HELMER SILENT 150 KVA',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_GERADOR_3_RODOAGRO_104 uuid;
    v_p_GERADOR_3_RODOAGRO_104 uuid;
BEGIN
    -- Get or create asset
    v_a_GERADOR_3_RODOAGRO_104 := public.get_or_create_ativo(NULL, 'GERADOR 3 RODOAGRO', 'GALPÃO BOBINAS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_GERADOR_3_RODOAGRO_104 := public.get_or_create_planejamento(
        v_a_GERADOR_3_RODOAGRO_104,
        'Preventiva ' || 'GERADOR 3 RODOAGRO',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_GUILHOTINA_1_105 uuid;
    v_p_GUILHOTINA_1_105 uuid;
BEGIN
    -- Get or create asset
    v_a_GUILHOTINA_1_105 := public.get_or_create_ativo(NULL, 'GUILHOTINA 1', 'CALDEIRARIA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_GUILHOTINA_1_105 := public.get_or_create_planejamento(
        v_a_GUILHOTINA_1_105,
        'Preventiva ' || 'GUILHOTINA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

COMMIT;