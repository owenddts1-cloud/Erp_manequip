BEGIN;

DO $$
DECLARE
    v_a_GUILHOTINA_2_106 uuid;
    v_p_GUILHOTINA_2_106 uuid;
BEGIN
    -- Get or create asset
    v_a_GUILHOTINA_2_106 := public.get_or_create_ativo(NULL, 'GUILHOTINA 2', 'CALDEIRARIA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_GUILHOTINA_2_106 := public.get_or_create_planejamento(
        v_a_GUILHOTINA_2_106,
        'Preventiva ' || 'GUILHOTINA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_GUILHOTINA_3_PAPEL_O_107 uuid;
    v_p_GUILHOTINA_3_PAPEL_O_107 uuid;
BEGIN
    -- Get or create asset
    v_a_GUILHOTINA_3_PAPEL_O_107 := public.get_or_create_ativo('2414', 'GUILHOTINA 3 PAPELÃO', 'GALPÃO DE BOBINAS', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_GUILHOTINA_3_PAPEL_O_107 := public.get_or_create_planejamento(
        v_a_GUILHOTINA_3_PAPEL_O_107,
        'Preventiva ' || 'GUILHOTINA 3 PAPELÃO',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_GUILHOTINA_4_NOMEX_108 uuid;
    v_p_GUILHOTINA_4_NOMEX_108 uuid;
BEGIN
    -- Get or create asset
    v_a_GUILHOTINA_4_NOMEX_108 := public.get_or_create_ativo(NULL, 'GUILHOTINA 4 NOMEX', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_GUILHOTINA_4_NOMEX_108 := public.get_or_create_planejamento(
        v_a_GUILHOTINA_4_NOMEX_108,
        'Preventiva ' || 'GUILHOTINA 4 NOMEX',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_GUILHOTINA_5_109 uuid;
    v_p_GUILHOTINA_5_109 uuid;
BEGIN
    -- Get or create asset
    v_a_GUILHOTINA_5_109 := public.get_or_create_ativo(NULL, 'GUILHOTINA 5', 'CARPINTARIA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_GUILHOTINA_5_109 := public.get_or_create_planejamento(
        v_a_GUILHOTINA_5_109,
        'Preventiva ' || 'GUILHOTINA 5',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[2, 5, 8, 11]
    );
END $$;

DO $$
DECLARE
    v_a_HYPOT_110 uuid;
    v_p_HYPOT_110 uuid;
BEGIN
    -- Get or create asset
    v_a_HYPOT_110 := public.get_or_create_ativo(NULL, 'HYPOT', 'SALA DE TESTE TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_HYPOT_110 := public.get_or_create_planejamento(
        v_a_HYPOT_110,
        'Preventiva ' || 'HYPOT',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Anual',
        ARRAY[8]
    );
END $$;

DO $$
DECLARE
    v_a_ISOLADORA_DE_BOBINA_1_CAM_111 uuid;
    v_p_ISOLADORA_DE_BOBINA_1_CAM_111 uuid;
BEGIN
    -- Get or create asset
    v_a_ISOLADORA_DE_BOBINA_1_CAM_111 := public.get_or_create_ativo('5', 'ISOLADORA DE BOBINA 1 CAM', 'ISOLAMENTO DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ISOLADORA_DE_BOBINA_1_CAM_111 := public.get_or_create_planejamento(
        v_a_ISOLADORA_DE_BOBINA_1_CAM_111,
        'Preventiva ' || 'ISOLADORA DE BOBINA 1 CAM',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_ISOLADORA_DE_BOBINA_3_MESA_112 uuid;
    v_p_ISOLADORA_DE_BOBINA_3_MESA_112 uuid;
BEGIN
    -- Get or create asset
    v_a_ISOLADORA_DE_BOBINA_3_MESA_112 := public.get_or_create_ativo('5087', 'ISOLADORA DE BOBINA 3 MESA', 'ISOLAMENTO DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_ISOLADORA_DE_BOBINA_3_MESA_112 := public.get_or_create_planejamento(
        v_a_ISOLADORA_DE_BOBINA_3_MESA_112,
        'Preventiva ' || 'ISOLADORA DE BOBINA 3 MESA',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_KBK_1_500KG_113 uuid;
    v_p_KBK_1_500KG_113 uuid;
BEGIN
    -- Get or create asset
    v_a_KBK_1_500KG_113 := public.get_or_create_ativo(NULL, 'KBK 1 500KG', 'FÁBRICA DE BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_KBK_1_500KG_113 := public.get_or_create_planejamento(
        v_a_KBK_1_500KG_113,
        'Preventiva ' || 'KBK 1 500KG',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_KBK_2_1600_KG_114 uuid;
    v_p_KBK_2_1600_KG_114 uuid;
BEGIN
    -- Get or create asset
    v_a_KBK_2_1600_KG_114 := public.get_or_create_ativo(NULL, 'KBK 2 1600 KG', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_KBK_2_1600_KG_114 := public.get_or_create_planejamento(
        v_a_KBK_2_1600_KG_114,
        'Preventiva ' || 'KBK 2 1600 KG',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_KBK_3_2T_115 uuid;
    v_p_KBK_3_2T_115 uuid;
BEGIN
    -- Get or create asset
    v_a_KBK_3_2T_115 := public.get_or_create_ativo(NULL, 'KBK 3 2T', 'PREPARAÇÃO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_KBK_3_2T_115 := public.get_or_create_planejamento(
        v_a_KBK_3_2T_115,
        'Preventiva ' || 'KBK 3 2T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_LIXADEIRA_DE_FITA_1_116 uuid;
    v_p_LIXADEIRA_DE_FITA_1_116 uuid;
BEGIN
    -- Get or create asset
    v_a_LIXADEIRA_DE_FITA_1_116 := public.get_or_create_ativo('7505', 'LIXADEIRA DE FITA 1', 'CARPINTARIA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_LIXADEIRA_DE_FITA_1_116 := public.get_or_create_planejamento(
        v_a_LIXADEIRA_DE_FITA_1_116,
        'Preventiva ' || 'LIXADEIRA DE FITA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_LIXADEIRA_DE_FITA_2_117 uuid;
    v_p_LIXADEIRA_DE_FITA_2_117 uuid;
BEGIN
    -- Get or create asset
    v_a_LIXADEIRA_DE_FITA_2_117 := public.get_or_create_ativo('2398', 'LIXADEIRA DE FITA 2', 'CARPINTARIA - TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_LIXADEIRA_DE_FITA_2_117 := public.get_or_create_planejamento(
        v_a_LIXADEIRA_DE_FITA_2_117,
        'Preventiva ' || 'LIXADEIRA DE FITA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_LIXADEIRA_DE_FITA_3_BALDAN_118 uuid;
    v_p_LIXADEIRA_DE_FITA_3_BALDAN_118 uuid;
BEGIN
    -- Get or create asset
    v_a_LIXADEIRA_DE_FITA_3_BALDAN_118 := public.get_or_create_ativo('6604', 'LIXADEIRA DE FITA 3 BALDAN', 'CARPINTARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_LIXADEIRA_DE_FITA_3_BALDAN_118 := public.get_or_create_planejamento(
        v_a_LIXADEIRA_DE_FITA_3_BALDAN_118,
        'Preventiva ' || 'LIXADEIRA DE FITA 3 BALDAN',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_LIXADEIRA_DE_FITA_4_119 uuid;
    v_p_LIXADEIRA_DE_FITA_4_119 uuid;
BEGIN
    -- Get or create asset
    v_a_LIXADEIRA_DE_FITA_4_119 := public.get_or_create_ativo('4519', 'LIXADEIRA DE FITA 4', 'FÁBRICA BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_LIXADEIRA_DE_FITA_4_119 := public.get_or_create_planejamento(
        v_a_LIXADEIRA_DE_FITA_4_119,
        'Preventiva ' || 'LIXADEIRA DE FITA 4',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_MANDRILHADORA_1_120 uuid;
    v_p_MANDRILHADORA_1_120 uuid;
BEGIN
    -- Get or create asset
    v_a_MANDRILHADORA_1_120 := public.get_or_create_ativo('5602', 'MANDRILHADORA 1', 'USINAGEM', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_MANDRILHADORA_1_120 := public.get_or_create_planejamento(
        v_a_MANDRILHADORA_1_120,
        'Preventiva ' || 'MANDRILHADORA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_MAQUINA_TAQUINHO_1_FT_TK2000_121 uuid;
    v_p_MAQUINA_TAQUINHO_1_FT_TK2000_121 uuid;
BEGIN
    -- Get or create asset
    v_a_MAQUINA_TAQUINHO_1_FT_TK2000_121 := public.get_or_create_ativo(NULL, 'MAQUINA TAQUINHO 1 FT-TK2000', 'CARPINTARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_MAQUINA_TAQUINHO_1_FT_TK2000_121 := public.get_or_create_planejamento(
        v_a_MAQUINA_TAQUINHO_1_FT_TK2000_121,
        'Preventiva ' || 'MAQUINA TAQUINHO 1 FT-TK2000',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

DO $$
DECLARE
    v_a_MODELADORA_DE_BARRA_1_122 uuid;
    v_p_MODELADORA_DE_BARRA_1_122 uuid;
BEGIN
    -- Get or create asset
    v_a_MODELADORA_DE_BARRA_1_122 := public.get_or_create_ativo('8085', 'MODELADORA DE BARRA 1', 'BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_MODELADORA_DE_BARRA_1_122 := public.get_or_create_planejamento(
        v_a_MODELADORA_DE_BARRA_1_122,
        'Preventiva ' || 'MODELADORA DE BARRA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_MODELADOR_DE_BARRA_2_123 uuid;
    v_p_MODELADOR_DE_BARRA_2_123 uuid;
BEGIN
    -- Get or create asset
    v_a_MODELADOR_DE_BARRA_2_123 := public.get_or_create_ativo(NULL, 'MODELADOR DE BARRA 2', 'FÁBRICA BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_MODELADOR_DE_BARRA_2_123 := public.get_or_create_planejamento(
        v_a_MODELADOR_DE_BARRA_2_123,
        'Preventiva ' || 'MODELADOR DE BARRA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_MODELADOR_DE_LOOP_1_124 uuid;
    v_p_MODELADOR_DE_LOOP_1_124 uuid;
BEGIN
    -- Get or create asset
    v_a_MODELADOR_DE_LOOP_1_124 := public.get_or_create_ativo('5092', 'MODELADOR DE LOOP 1', 'FÁBRICA DE BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_MODELADOR_DE_LOOP_1_124 := public.get_or_create_planejamento(
        v_a_MODELADOR_DE_LOOP_1_124,
        'Preventiva ' || 'MODELADOR DE LOOP 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_BANDAGEM_1_125 uuid;
    v_p_M_QUINA_BANDAGEM_1_125 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_BANDAGEM_1_125 := public.get_or_create_ativo('593', 'MÁQUINA BANDAGEM 1', 'ARMADURA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_BANDAGEM_1_125 := public.get_or_create_planejamento(
        v_a_M_QUINA_BANDAGEM_1_125,
        'Preventiva ' || 'MÁQUINA BANDAGEM 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

COMMIT;