BEGIN;

DO $$
DECLARE
    v_a_PLATAFORMA_ELEVAT_RIA_1_146 uuid;
    v_p_PLATAFORMA_ELEVAT_RIA_1_146 uuid;
BEGIN
    -- Get or create asset
    v_a_PLATAFORMA_ELEVAT_RIA_1_146 := public.get_or_create_ativo(NULL, 'PLATAFORMA ELEVATÓRIA 1', 'COMUTAÇÃO TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PLATAFORMA_ELEVAT_RIA_1_146 := public.get_or_create_planejamento(
        v_a_PLATAFORMA_ELEVAT_RIA_1_146,
        'Preventiva ' || 'PLATAFORMA ELEVATÓRIA 1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[1, 7]
    );
END $$;

DO $$
DECLARE
    v_a_PLATAFORMA_ELEVAT_RIA_2_147 uuid;
    v_p_PLATAFORMA_ELEVAT_RIA_2_147 uuid;
BEGIN
    -- Get or create asset
    v_a_PLATAFORMA_ELEVAT_RIA_2_147 := public.get_or_create_ativo(NULL, 'PLATAFORMA ELEVATÓRIA 2', 'COMUTAÇÃO TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PLATAFORMA_ELEVAT_RIA_2_147 := public.get_or_create_planejamento(
        v_a_PLATAFORMA_ELEVAT_RIA_2_147,
        'Preventiva ' || 'PLATAFORMA ELEVATÓRIA 2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[1, 7]
    );
END $$;

DO $$
DECLARE
    v_a_POLICORTE__1_148 uuid;
    v_p_POLICORTE__1_148 uuid;
BEGIN
    -- Get or create asset
    v_a_POLICORTE__1_148 := public.get_or_create_ativo(NULL, 'POLICORTE  1', 'CALDEIRARIA MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_POLICORTE__1_148 := public.get_or_create_planejamento(
        v_a_POLICORTE__1_148,
        'Preventiva ' || 'POLICORTE  1',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_POLICORTE__2_149 uuid;
    v_p_POLICORTE__2_149 uuid;
BEGIN
    -- Get or create asset
    v_a_POLICORTE__2_149 := public.get_or_create_ativo(NULL, 'POLICORTE  2', 'MANUTENÇÃO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_POLICORTE__2_149 := public.get_or_create_planejamento(
        v_a_POLICORTE__2_149,
        'Preventiva ' || 'POLICORTE  2',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_POLICORTE__3_150 uuid;
    v_p_POLICORTE__3_150 uuid;
BEGIN
    -- Get or create asset
    v_a_POLICORTE__3_150 := public.get_or_create_ativo(NULL, 'POLICORTE  3', 'CALDEIRARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_POLICORTE__3_150 := public.get_or_create_planejamento(
        v_a_POLICORTE__3_150,
        'Preventiva ' || 'POLICORTE  3',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[5, 11]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_1_10T_151 uuid;
    v_p_PONTE_ROLANTE_1_10T_151 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_1_10T_151 := public.get_or_create_ativo('PR 01', 'PONTE ROLANTE 1 10T', 'GALPÃO BOBINAS - TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_1_10T_151 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_1_10T_151,
        'Preventiva ' || 'PONTE ROLANTE 1 10T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_2_10T_152 uuid;
    v_p_PONTE_ROLANTE_2_10T_152 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_2_10T_152 := public.get_or_create_ativo('PR 02', 'PONTE ROLANTE 2 10T', 'GALPÃO BOBINAS - TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_2_10T_152 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_2_10T_152,
        'Preventiva ' || 'PONTE ROLANTE 2 10T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_4_10T_153 uuid;
    v_p_PONTE_ROLANTE_4_10T_153 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_4_10T_153 := public.get_or_create_ativo('PR 04', 'PONTE ROLANTE 4 10T', 'EXPEDIÇÃO - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_4_10T_153 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_4_10T_153,
        'Preventiva ' || 'PONTE ROLANTE 4 10T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 5, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_5_15T_154 uuid;
    v_p_PONTE_ROLANTE_5_15T_154 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_5_15T_154 := public.get_or_create_ativo('PR 05', 'PONTE ROLANTE 5 15T', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_5_15T_154 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_5_15T_154,
        'Preventiva ' || 'PONTE ROLANTE 5 15T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 5, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_6_10T_155 uuid;
    v_p_PONTE_ROLANTE_6_10T_155 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_6_10T_155 := public.get_or_create_ativo('PR 06', 'PONTE ROLANTE 6 10T', 'EMBARALHAMENTO - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_6_10T_155 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_6_10T_155,
        'Preventiva ' || 'PONTE ROLANTE 6 10T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_7_10T_156 uuid;
    v_p_PONTE_ROLANTE_7_10T_156 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_7_10T_156 := public.get_or_create_ativo('PR 07', 'PONTE ROLANTE 7 10T', 'MECÂNICA - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_7_10T_156 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_7_10T_156,
        'Preventiva ' || 'PONTE ROLANTE 7 10T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 5, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_8_8T_157 uuid;
    v_p_PONTE_ROLANTE_8_8T_157 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_8_8T_157 := public.get_or_create_ativo('PR 08', 'PONTE ROLANTE 8 8T', 'USINAGEM - MOTOR', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_8_8T_157 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_8_8T_157,
        'Preventiva ' || 'PONTE ROLANTE 8 8T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_9_25T_158 uuid;
    v_p_PONTE_ROLANTE_9_25T_158 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_9_25T_158 := public.get_or_create_ativo('PR 09', 'PONTE ROLANTE 9 25T', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_9_25T_158 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_9_25T_158,
        'Preventiva ' || 'PONTE ROLANTE 9 25T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_10_25T_159 uuid;
    v_p_PONTE_ROLANTE_10_25T_159 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_10_25T_159 := public.get_or_create_ativo('PR 10', 'PONTE ROLANTE 10 25T', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_10_25T_159 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_10_25T_159,
        'Preventiva ' || 'PONTE ROLANTE 10 25T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_11_25T_160 uuid;
    v_p_PONTE_ROLANTE_11_25T_160 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_11_25T_160 := public.get_or_create_ativo('PR 11', 'PONTE ROLANTE 11 25T', 'TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_11_25T_160 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_11_25T_160,
        'Preventiva ' || 'PONTE ROLANTE 11 25T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_12_5T_161 uuid;
    v_p_PONTE_ROLANTE_12_5T_161 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_12_5T_161 := public.get_or_create_ativo('PR 12', 'PONTE ROLANTE 12 5T', 'CALDEIRARIA TRAFO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_12_5T_161 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_12_5T_161,
        'Preventiva ' || 'PONTE ROLANTE 12 5T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[4, 10]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_13_GH_32T_162 uuid;
    v_p_PONTE_ROLANTE_13_GH_32T_162 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_13_GH_32T_162 := public.get_or_create_ativo('PR 13', 'PONTE ROLANTE 13 GH 32T', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_13_GH_32T_162 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_13_GH_32T_162,
        'Preventiva ' || 'PONTE ROLANTE 13 GH 32T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 3, 9]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_14_GH_80T_163 uuid;
    v_p_PONTE_ROLANTE_14_GH_80T_163 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_14_GH_80T_163 := public.get_or_create_ativo('PR 14', 'PONTE ROLANTE 14 GH 80T', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_14_GH_80T_163 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_14_GH_80T_163,
        'Preventiva ' || 'PONTE ROLANTE 14 GH 80T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 6, 12]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_15_GH_80T_164 uuid;
    v_p_PONTE_ROLANTE_15_GH_80T_164 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_15_GH_80T_164 := public.get_or_create_ativo('PR 15', 'PONTE ROLANTE 15 GH 80T', 'GALPÃO NOVO', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_15_GH_80T_164 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_15_GH_80T_164,
        'Preventiva ' || 'PONTE ROLANTE 15 GH 80T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 7]
    );
END $$;

DO $$
DECLARE
    v_a_PONTE_ROLANTE_16_GH_10T_165 uuid;
    v_p_PONTE_ROLANTE_16_GH_10T_165 uuid;
BEGIN
    -- Get or create asset
    v_a_PONTE_ROLANTE_16_GH_10T_165 := public.get_or_create_ativo('PR 16', 'PONTE ROLANTE 16 GH 10T', 'BOBINAS PARREIRA', 'Média', 'Operacional');
    
    -- Get or create planning template
    v_p_PONTE_ROLANTE_16_GH_10T_165 := public.get_or_create_planejamento(
        v_a_PONTE_ROLANTE_16_GH_10T_165,
        'Preventiva ' || 'PONTE ROLANTE 16 GH 10T',
        'Realizar manutenção preventiva periódica conforme plano FO-SGI-032.',
        'Semestral',
        ARRAY[2, 8]
    );
END $$;

COMMIT;