BEGIN;

DO $$
DECLARE
    v_a_M_QUINA_BANDAGEM_2_126 uuid;
    v_p_M_QUINA_BANDAGEM_2_126 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_BANDAGEM_2_126 := public.get_or_create_ativo('5292', 'MÁQUINA BANDAGEM 2', 'MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_BANDAGEM_2_126 := public.get_or_create_planejamento(
        v_a_M_QUINA_BANDAGEM_2_126,
        'Preventiva ' || 'MÁQUINA BANDAGEM 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_AR_SECO_1_FARGON_127 uuid;
    v_p_M_QUINA_DE_AR_SECO_1_FARGON_127 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_AR_SECO_1_FARGON_127 := public.get_or_create_ativo('4289', 'MÁQUINA DE AR SECO 1 FARGON', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_AR_SECO_1_FARGON_127 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_AR_SECO_1_FARGON_127,
        'Preventiva ' || 'MÁQUINA DE AR SECO 1 FARGON',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_AR_SECO_2_ENIPLAN_128 uuid;
    v_p_M_QUINA_DE_AR_SECO_2_ENIPLAN_128 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_AR_SECO_2_ENIPLAN_128 := public.get_or_create_ativo(NULL, 'MÁQUINA DE AR SECO 2 ENIPLAN', 'FECHAMENTO - TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_AR_SECO_2_ENIPLAN_128 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_AR_SECO_2_ENIPLAN_128,
        'Preventiva ' || 'MÁQUINA DE AR SECO 2 ENIPLAN',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_AR_SECO_3_14000___6_129 uuid;
    v_p_M_QUINA_DE_AR_SECO_3_14000___6_129 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_AR_SECO_3_14000___6_129 := public.get_or_create_ativo('31', 'MÁQUINA DE AR SECO 3 14000 - 601', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_AR_SECO_3_14000___6_129 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_AR_SECO_3_14000___6_129,
        'Preventiva ' || 'MÁQUINA DE AR SECO 3 14000 - 601',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_AR_SECO_4_DSL9_130 uuid;
    v_p_M_QUINA_DE_AR_SECO_4_DSL9_130 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_AR_SECO_4_DSL9_130 := public.get_or_create_ativo('27', 'MÁQUINA DE AR SECO 4 DSL9', 'CAMPO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_AR_SECO_4_DSL9_130 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_AR_SECO_4_DSL9_130,
        'Preventiva ' || 'MÁQUINA DE AR SECO 4 DSL9',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_CONSOLIDAR_1___ZCN_131 uuid;
    v_p_M_QUINA_DE_CONSOLIDAR_1___ZCN_131 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_CONSOLIDAR_1___ZCN_131 := public.get_or_create_ativo('13496', 'MÁQUINA DE CONSOLIDAR 1 - ZCN', 'FÁBRICA DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_CONSOLIDAR_1___ZCN_131 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_CONSOLIDAR_1___ZCN_131,
        'Preventiva ' || 'MÁQUINA DE CONSOLIDAR 1 - ZCN',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_CONSOLIDAR_2___ZCN_132 uuid;
    v_p_M_QUINA_DE_CONSOLIDAR_2___ZCN_132 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_CONSOLIDAR_2___ZCN_132 := public.get_or_create_ativo(NULL, 'MÁQUINA DE CONSOLIDAR 2 - ZCN', 'FÁBRICA DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_CONSOLIDAR_2___ZCN_132 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_CONSOLIDAR_2___ZCN_132,
        'Preventiva ' || 'MÁQUINA DE CONSOLIDAR 2 - ZCN',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_LAVAR_1_KARCHER_133 uuid;
    v_p_M_QUINA_DE_LAVAR_1_KARCHER_133 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_LAVAR_1_KARCHER_133 := public.get_or_create_ativo('11875', 'MÁQUINA DE LAVAR 1 KARCHER', 'LAVADOR MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_LAVAR_1_KARCHER_133 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_LAVAR_1_KARCHER_133,
        'Preventiva ' || 'MÁQUINA DE LAVAR 1 KARCHER',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_LAVAR_2_KARCHER_134 uuid;
    v_p_M_QUINA_DE_LAVAR_2_KARCHER_134 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_LAVAR_2_KARCHER_134 := public.get_or_create_ativo('10304', 'MÁQUINA DE LAVAR 2 KARCHER', 'LAVADOR TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_LAVAR_2_KARCHER_134 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_LAVAR_2_KARCHER_134,
        'Preventiva ' || 'MÁQUINA DE LAVAR 2 KARCHER',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_LAVAR_3_KARCHER_135 uuid;
    v_p_M_QUINA_DE_LAVAR_3_KARCHER_135 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_LAVAR_3_KARCHER_135 := public.get_or_create_ativo(NULL, 'MÁQUINA DE LAVAR 3 KARCHER', 'LAVADOR TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_LAVAR_3_KARCHER_135 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_LAVAR_3_KARCHER_135,
        'Preventiva ' || 'MÁQUINA DE LAVAR 3 KARCHER',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_MODELAR_2_GRANDE_136 uuid;
    v_p_M_QUINA_DE_MODELAR_2_GRANDE_136 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_MODELAR_2_GRANDE_136 := public.get_or_create_ativo('17', 'MÁQUINA DE MODELAR 2 GRANDE', 'ISOLAMENTO DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_MODELAR_2_GRANDE_136 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_MODELAR_2_GRANDE_136,
        'Preventiva ' || 'MÁQUINA DE MODELAR 2 GRANDE',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 5, 9]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_MODELAR_3_137 uuid;
    v_p_M_QUINA_DE_MODELAR_3_137 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_MODELAR_3_137 := public.get_or_create_ativo('5085', 'MÁQUINA DE MODELAR 3', 'ISOLAMENTO DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_MODELAR_3_137 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_MODELAR_3_137,
        'Preventiva ' || 'MÁQUINA DE MODELAR 3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[3, 6, 9, 12]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DE_PASSAR_CADAR_O_1____138 uuid;
    v_p_M_QUINA_DE_PASSAR_CADAR_O_1____138 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DE_PASSAR_CADAR_O_1____138 := public.get_or_create_ativo('13497', 'MÁQUINA DE PASSAR CADARÇO 1 - ZCN', 'ISOLAMENTO DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DE_PASSAR_CADAR_O_1____138 := public.get_or_create_planejamento(
        v_a_M_QUINA_DE_PASSAR_CADAR_O_1____138,
        'Preventiva ' || 'MÁQUINA DE PASSAR CADARÇO 1 - ZCN',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Trimestral',
        ARRAY[1, 4, 7, 10]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DECAPAGEM_DE_FIO_01_139 uuid;
    v_p_M_QUINA_DECAPAGEM_DE_FIO_01_139 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DECAPAGEM_DE_FIO_01_139 := public.get_or_create_ativo('2264', 'MÁQUINA DECAPAGEM DE FIO 01', 'ISOLAMENTO DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DECAPAGEM_DE_FIO_01_139 := public.get_or_create_planejamento(
        v_a_M_QUINA_DECAPAGEM_DE_FIO_01_139,
        'Preventiva ' || 'MÁQUINA DECAPAGEM DE FIO 01',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[1, 7]
    );
END $$;

DO $$
DECLARE
    v_a_M_QUINA_DECAPAGEM_DE_FIO_02_140 uuid;
    v_p_M_QUINA_DECAPAGEM_DE_FIO_02_140 uuid;
BEGIN
    -- Get or create asset
    v_a_M_QUINA_DECAPAGEM_DE_FIO_02_140 := public.get_or_create_ativo('5084', 'MÁQUINA DECAPAGEM DE FIO 02', 'ISOLAMENTO DE BOBINAS - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_M_QUINA_DECAPAGEM_DE_FIO_02_140 := public.get_or_create_planejamento(
        v_a_M_QUINA_DECAPAGEM_DE_FIO_02_140,
        'Preventiva ' || 'MÁQUINA DECAPAGEM DE FIO 02',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[1, 7]
    );
END $$;

DO $$
DECLARE
    v_a_NOBREAK_1_CPD_ADM_141 uuid;
    v_p_NOBREAK_1_CPD_ADM_141 uuid;
BEGIN
    -- Get or create asset
    v_a_NOBREAK_1_CPD_ADM_141 := public.get_or_create_ativo(NULL, 'NOBREAK 1 CPD ADM', 'CPD ADM', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_NOBREAK_1_CPD_ADM_141 := public.get_or_create_planejamento(
        v_a_NOBREAK_1_CPD_ADM_141,
        'Preventiva ' || 'NOBREAK 1 CPD ADM',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_NOBREAK_2_CPD_MOTOR_142 uuid;
    v_p_NOBREAK_2_CPD_MOTOR_142 uuid;
BEGIN
    -- Get or create asset
    v_a_NOBREAK_2_CPD_MOTOR_142 := public.get_or_create_ativo(NULL, 'NOBREAK 2 CPD MOTOR', 'CPD MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_NOBREAK_2_CPD_MOTOR_142 := public.get_or_create_planejamento(
        v_a_NOBREAK_2_CPD_MOTOR_142,
        'Preventiva ' || 'NOBREAK 2 CPD MOTOR',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_NOBREAK_3_CPD_TRAFO_143 uuid;
    v_p_NOBREAK_3_CPD_TRAFO_143 uuid;
BEGIN
    -- Get or create asset
    v_a_NOBREAK_3_CPD_TRAFO_143 := public.get_or_create_ativo(NULL, 'NOBREAK 3 CPD TRAFO', 'CPD TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_NOBREAK_3_CPD_TRAFO_143 := public.get_or_create_planejamento(
        v_a_NOBREAK_3_CPD_TRAFO_143,
        'Preventiva ' || 'NOBREAK 3 CPD TRAFO',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Mensal',
        ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    );
END $$;

DO $$
DECLARE
    v_a_PAIN_IS_EL_TRICOS_COMUTA__O_CC_144 uuid;
    v_p_PAIN_IS_EL_TRICOS_COMUTA__O_CC_144 uuid;
BEGIN
    -- Get or create asset
    v_a_PAIN_IS_EL_TRICOS_COMUTA__O_CC_144 := public.get_or_create_ativo(NULL, 'PAINÉIS ELÉTRICOS COMUTAÇÃO CC', 'FÁBRICA TRAFO (SALA DE TESTES)', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PAIN_IS_EL_TRICOS_COMUTA__O_CC_144 := public.get_or_create_planejamento(
        v_a_PAIN_IS_EL_TRICOS_COMUTA__O_CC_144,
        'Preventiva ' || 'PAINÉIS ELÉTRICOS COMUTAÇÃO CC',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PALETEIRA_EL_TRICA_1_145 uuid;
    v_p_PALETEIRA_EL_TRICA_1_145 uuid;
BEGIN
    -- Get or create asset
    v_a_PALETEIRA_EL_TRICA_1_145 := public.get_or_create_ativo(NULL, 'PALETEIRA ELÉTRICA 1', 'FÁBRICA DE BOBINAS MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PALETEIRA_EL_TRICA_1_145 := public.get_or_create_planejamento(
        v_a_PALETEIRA_EL_TRICA_1_145,
        'Preventiva ' || 'PALETEIRA ELÉTRICA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[1, 7]
    );
END $$;

COMMIT;