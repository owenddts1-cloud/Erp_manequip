export interface Asset {
  id: string;
  nome: string;
  tag_id: string;
  setor: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export interface MonthlyTask {
  id: string;
  ativo_id: string;
  titulo: string;
  descricao?: string;
  mes: number;
  ano: number;
  status: string;
  icone?: string;
  data_limite?: string;
  tecnico_responsavel?: string;
  tecnico_responsavel_2?: string;
  tecnico_responsavel_profile?: {
    full_name: string;
    email: string;
  };
  tecnico_responsavel_2_profile?: {
    full_name: string;
    email: string;
  };
  ativos?: {
    nome: string;
    tag_id: string;
    setor: string;
  };
  planejamento_id?: string;
  concluido_em?: string;
  chamado?: string;
  preventivas_planejamento?: {
    periodicidade: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface PlanningPlan {
  id: string;
  ativo_id: string;
  titulo: string;
  descricao?: string;
  periodicidade: string;
  meses_execucao: number[];
  icone?: string;
  ativos?: {
    nome: string;
    tag_id: string;
    setor: string;
  };
  created_at?: string;
  updated_at?: string;
}
