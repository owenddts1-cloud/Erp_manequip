import React, { useState, useRef, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { usePreferences } from '../contexts/PreferencesContext';

// --- Types ---
interface Milestone {
  id: string;
  name: string;
  status: 'Concluído' | 'Em Execução' | 'Atrasado' | 'Pendente';
  date: string;
}

interface CostItem {
  id: string;
  phase: string;
  budget: number;
  actual: number;
  category: string;
  responsible: string;
}

interface MaterialItem {
  id: string;
  name: string;
  category: string;
  qtyBudget: number;
  qtyUsed: number;
  unit: string;
  supplier: string;
  responsible: string;
}

interface Project {
  id: string;
  name: string;
  location: string;
  previsto: number;
  faturado: number;
  desvios: number;
  progress: number;
  status: 'Em Execução' | 'Prazos Críticos' | 'Concluído';
  coordinator: string;
  team: string;
  milestones: Milestone[];
  costs: CostItem[];
  materials: MaterialItem[];
}

interface Supplier {
  id: string;
  name: string;
  rating: number;
  compliance: number;
  specialty: string;
  phone: string;
}

interface QuoteOption {
  supplierName: string;
  price: number;
  deliveryDays: number;
  rating: number;
  isBest?: boolean;
}

interface Requisition {
  id: string;
  projectId: string;
  material: string;
  qty: string;
  date: string;
  status: 'Em Cotação' | 'Aprovado' | 'Aguardando Entrega' | 'Entregue';
  options: QuoteOption[];
  approvedSupplier?: string;
  approvedPrice?: number;
}

interface WhiteboardNote {
  id: string;
  text: string;
  type: 'idea' | 'task' | 'blocker';
  columnId: string;
  projectId: string;
  converted?: boolean;
  x?: number; // relative positions inside the column or absolute coordinates
  y?: number;
}

interface WhiteboardColumn {
  id: string;
  name: string;
  projectId: string;
  color: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'info';
}

const getPortugueseMonthName = (monthNum: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[monthNum - 1] || '';
};

const getRelativeDate = (offsetMonths: number, day: number): string => {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return `${dayStr}/${month}/${year}`;
};

// --- Initial Mock Data ---
const initialProjects: Project[] = [
  {
    id: 'p1',
    name: 'Reforma Galpão Trafo',
    location: 'Galpão Sul, Setor Industrial',
    previsto: 450000,
    faturado: 310000,
    desvios: 0,
    progress: 75,
    status: 'Em Execução',
    coordinator: 'Eng. Daniel Silva',
    team: 'Hugo (Mestre de Obras) + 4 Pedreiros',
    milestones: [
      { id: 'm1', name: 'Terraplanagem', status: 'Concluído', date: getRelativeDate(-2, 10) },
      { id: 'm2', name: 'Fundação', status: 'Concluído', date: getRelativeDate(-2, 28) },
      { id: 'm3', name: 'Alvenaria/Estrutura', status: 'Em Execução', date: getRelativeDate(-1, 25) },
      { id: 'm4', name: 'Instalações Eletromecânicas', status: 'Pendente', date: getRelativeDate(0, 15) },
      { id: 'm5', name: 'Comissionamento/Entrega', status: 'Pendente', date: getRelativeDate(0, 30) },
    ],
    costs: [
      { id: 'c1', phase: 'Limpeza e Terraplanagem', budget: 50000, actual: 48000, category: 'Serviços Adicionais', responsible: 'Eng. Daniel Silva' },
      { id: 'c2', phase: 'Fundação e Bases de Concreto', budget: 120000, actual: 120000, category: 'Materiais', responsible: 'Eng. Daniel Silva' },
      { id: 'c3', phase: 'Estrutura de Aço e Cobertura', budget: 180000, actual: 142000, category: 'Materiais', responsible: 'Eng. Daniel Silva' },
      { id: 'c4', phase: 'Mão de Obra de Alvenaria', budget: 100000, actual: 0, category: 'Mão de Obra', responsible: 'Hugo (Mestre)' },
    ],
    materials: [
      { id: 'mat1', name: 'Concreto Usinado Fck30', category: 'Materiais', qtyBudget: 50, qtyUsed: 52, unit: 'm³', supplier: 'Concretart Ltda', responsible: 'Eng. Daniel Silva' },
      { id: 'mat2', name: 'Estrutura de Aço CA-50 10mm', category: 'Materiais', qtyBudget: 2500, qtyUsed: 1800, unit: 'kg', supplier: 'Gerdau Comercial', responsible: 'Hugo (Mestre)' },
      { id: 'mat3', name: 'Escavação Mecanizada', category: 'Serviços Adicionais', qtyBudget: 12, qtyUsed: 15, unit: 'dias', supplier: 'Locações Silva', responsible: 'Eng. Daniel Silva' },
      { id: 'mat4', name: 'Tijolos Cerâmicos (Lote)', category: 'Materiais', qtyBudget: 10, qtyUsed: 0, unit: 'un', supplier: 'A cotar', responsible: 'Hugo (Mestre)' },
    ],
  },
  {
    id: 'p2',
    name: 'Fundação Nova Área',
    location: 'Galpão Novo, Área Leste',
    previsto: 180000,
    faturado: 195000,
    desvios: 15000,
    progress: 95,
    status: 'Prazos Críticos',
    coordinator: 'Engª. Amanda Costa',
    team: 'Marcos (Mestre) + 6 Operários',
    milestones: [
      { id: 'm6', name: 'Sondagem de Solo', status: 'Concluído', date: getRelativeDate(-1, 1) },
      { id: 'm7', name: 'Escavação', status: 'Concluído', date: getRelativeDate(-1, 12) },
      { id: 'm8', name: 'Concretagem das Estacas', status: 'Concluído', date: getRelativeDate(-1, 20) },
      { id: 'm9', name: 'Acabamento/Nivelamento', status: 'Atrasado', date: getRelativeDate(-1, 28) },
    ],
    costs: [
      { id: 'c5', phase: 'Escavação do Solo', budget: 40000, actual: 55000, category: 'Serviços Adicionais', responsible: 'Engª. Amanda Costa' },
      { id: 'c6', phase: 'Armação de Aço', budget: 60000, actual: 60000, category: 'Materiais', responsible: 'Marcos (Mestre)' },
      { id: 'c7', phase: 'Lançamento de Concreto', budget: 80000, actual: 80000, category: 'Materiais', responsible: 'Engª. Amanda Costa' },
    ],
    materials: [
      { id: 'mat5', name: 'Cimento CP-II', category: 'Materiais', qtyBudget: 400, qtyUsed: 450, unit: 'sacos', supplier: 'Cimento Forte', responsible: 'Marcos (Mestre)' },
      { id: 'mat6', name: 'Concreto Usinado Fck30', category: 'Materiais', qtyBudget: 40, qtyUsed: 40, unit: 'm³', supplier: 'Concretart Ltda', responsible: 'Engª. Amanda Costa' },
      { id: 'mat7', name: 'Escavação Solo Mecanizada', category: 'Serviços Adicionais', qtyBudget: 5, qtyUsed: 8, unit: 'dias', supplier: 'Terrafort', responsible: 'Engª. Amanda Costa' },
    ],
  },
  {
    id: 'p3',
    name: 'Ampliação da Subestação',
    location: 'Setor Norte, Acesso B',
    previsto: 980000,
    faturado: 450000,
    desvios: 45000,
    progress: 40,
    status: 'Em Execução',
    coordinator: 'Eng. Rafael Ramos',
    team: 'Lucas (Mestre) + 8 Eletricistas',
    milestones: [
      { id: 'm10', name: 'Projeto Executivo aprovado', status: 'Concluído', date: getRelativeDate(-2, 15) },
      { id: 'm11', name: 'Cercamento e Segurança', status: 'Concluído', date: getRelativeDate(-2, 30) },
      { id: 'm12', name: 'Montagem Eletromecânica', status: 'Em Execução', date: getRelativeDate(-1, 15) },
      { id: 'm13', name: 'Comissionamento Técnico', status: 'Pendente', date: getRelativeDate(0, 25) },
    ],
    costs: [
      { id: 'c8', phase: 'Engenharia e Projetos', budget: 80000, actual: 80000, category: 'Serviços Adicionais', responsible: 'Eng. Rafael Ramos' },
      { id: 'c9', phase: 'Bases Civis para Transformadores', budget: 300000, actual: 345000, category: 'Materiais', responsible: 'Eng. Rafael Ramos' },
      { id: 'c10', phase: 'Equipamentos e Chaves', budget: 600000, actual: 25000, category: 'Materiais', responsible: 'Lucas (Mestre)' },
    ],
    materials: [
      { id: 'mat8', name: 'Aço CA-50 12mm', category: 'Materiais', qtyBudget: 5000, qtyUsed: 5100, unit: 'kg', supplier: 'Gerdau Comercial', responsible: 'Lucas (Mestre)' },
      { id: 'mat9', name: 'Concreto Autoadensável', category: 'Materiais', qtyBudget: 80, qtyUsed: 88, unit: 'm³', supplier: 'Massa Forte', responsible: 'Eng. Rafael Ramos' },
      { id: 'mat10', name: 'Cabos de Cobre de Média Tensão', category: 'Materiais', qtyBudget: 1200, qtyUsed: 400, unit: 'm', supplier: 'Megacabos Ltda', responsible: 'Lucas (Mestre)' },
    ],
  },
];

const initialRequisitions: Requisition[] = [
  {
    id: 'req1',
    projectId: 'p1',
    material: 'Tijolos Cerâmicos (Lote: 10.000 un)',
    qty: '1 Lote',
    date: getRelativeDate(-1, 28),
    status: 'Em Cotação',
    options: [
      { supplierName: 'Cerâmica Regional', price: 12000, deliveryDays: 5, rating: 4 },
      { supplierName: 'Depósito Central', price: 11500, deliveryDays: 2, rating: 5, isBest: true },
      { supplierName: 'Suprimentos Vale', price: 13200, deliveryDays: 1, rating: 3 },
    ],
  },
  {
    id: 'req2',
    projectId: 'p1',
    material: 'Aço CA-50 10mm (Lote: 3.000 kg)',
    qty: '3.000 kg',
    date: getRelativeDate(-1, 25),
    status: 'Aprovado',
    approvedSupplier: 'Gerdau Comercial',
    approvedPrice: 18000,
    options: [
      { supplierName: 'Gerdau Comercial', price: 18000, deliveryDays: 3, rating: 5, isBest: true },
      { supplierName: 'Ferro Forte', price: 19200, deliveryDays: 2, rating: 4 },
    ],
  },
  {
    id: 'req3',
    projectId: 'p2',
    material: 'Concreto Usinado fck 30 (Lote: 50 m³)',
    qty: '50 m³',
    date: getRelativeDate(-1, 20),
    status: 'Aguardando Entrega',
    approvedSupplier: 'Concretart Ltda',
    approvedPrice: 22000,
    options: [
      { supplierName: 'Concretart Ltda', price: 22000, deliveryDays: 1, rating: 4, isBest: true },
      { supplierName: 'Laje Rápida', price: 23500, deliveryDays: 2, rating: 4 },
    ],
  },
];

const initialSuppliers: Supplier[] = [
  { id: 'sup1', name: 'Concretart Ltda', rating: 4.8, compliance: 98, specialty: 'Concreto e Agregados', phone: '(11) 98765-4321' },
  { id: 'sup2', name: 'Gerdau Comercial', rating: 4.9, compliance: 99, specialty: 'Estruturas Metálicas e Aço', phone: '(11) 4004-9000' },
  { id: 'sup3', name: 'Depósito Central', rating: 4.5, compliance: 94, specialty: 'Materiais Básicos e Acabamento', phone: '(11) 99888-7766' },
  { id: 'sup4', name: 'Locações Silva', rating: 4.2, compliance: 90, specialty: 'Locação de Maquinários e Escavação', phone: '(11) 97766-5544' },
  { id: 'sup5', name: 'Megacabos Ltda', rating: 4.7, compliance: 96, specialty: 'Condutores Elétricos de Média/Alta Tensão', phone: '(11) 3300-8800' },
];

const initialWbColumns: WhiteboardColumn[] = [
  { id: 'briefing-p1', name: 'FASE 1: BRIEFING / IDEIAS', projectId: 'p1', color: 'cyan' },
  { id: 'quotes-p1', name: 'FASE 2: COMPRAS & COTAÇÃO', projectId: 'p1', color: 'amber' },
  { id: 'field-p1', name: 'FASE 3: APLICAÇÃO EM CAMPO', projectId: 'p1', color: 'rose' },
  
  { id: 'briefing-p2', name: 'FASE 1: BRIEFING / IDEIAS', projectId: 'p2', color: 'cyan' },
  { id: 'quotes-p2', name: 'FASE 2: COMPRAS & COTAÇÃO', projectId: 'p2', color: 'amber' },
  { id: 'field-p2', name: 'FASE 3: APLICAÇÃO EM CAMPO', projectId: 'p2', color: 'rose' },

  { id: 'briefing-p3', name: 'FASE 1: BRIEFING / IDEIAS', projectId: 'p3', color: 'cyan' },
  { id: 'quotes-p3', name: 'FASE 2: COMPRAS & COTAÇÃO', projectId: 'p3', color: 'amber' },
  { id: 'field-p3', name: 'FASE 3: APLICAÇÃO EM CAMPO', projectId: 'p3', color: 'rose' },
];

const initialWhiteboardNotes: WhiteboardNote[] = [
  // Project p1
  { id: 'wb1', text: 'Estudar viabilidade do solo no Galpão Novo', type: 'idea', columnId: 'briefing-p1', projectId: 'p1', x: 20, y: 80 },
  { id: 'wb2', text: 'Desenhar planta hidráulica da nova área de lavadores', type: 'idea', columnId: 'briefing-p1', projectId: 'p1', x: 20, y: 220 },
  { id: 'wb3', text: 'Cotar cimento com mais 3 fornecedores urgentes', type: 'task', columnId: 'quotes-p1', projectId: 'p1', x: 20, y: 80 },
  { id: 'wb4', text: 'Liberar verba para adiantamento do concreto usinado', type: 'task', columnId: 'quotes-p1', projectId: 'p1', x: 20, y: 220 },
  { id: 'wb5', text: 'Alocar equipe de pedreiros na concretagem da subestação', type: 'task', columnId: 'field-p1', projectId: 'p1', x: 20, y: 80 },
  { id: 'wb6', text: '⚠️ Escavação parada: Quebra da miniescavadeira', type: 'blocker', columnId: 'field-p1', projectId: 'p1', x: 20, y: 220 },

  // Project p2
  { id: 'wb7', text: 'Análise de solo e fundação da área leste', type: 'idea', columnId: 'briefing-p2', projectId: 'p2', x: 20, y: 80 },
  { id: 'wb8', text: 'Ajustar cronograma de concretagem', type: 'task', columnId: 'quotes-p2', projectId: 'p2', x: 20, y: 80 },

  // Project p3
  { id: 'wb9', text: 'Homologar cabos de cobre de média tensão', type: 'task', columnId: 'quotes-p3', projectId: 'p3', x: 20, y: 80 },
];

const CustomChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const title = label || payload[0].payload.name;
    return (
      <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-slate-200 text-xs p-3.5 rounded-xl shadow-2xl font-mono relative z-[9999] pointer-events-none">
        {title && (
          <p className="font-bold text-white border-b border-slate-800/80 pb-1.5 mb-1.5">{title}</p>
        )}
        <div className="space-y-1.5">
          {payload.map((p: any, idx: number) => {
            if (p.value === null || p.value === undefined) return null;
            const formattedValue = typeof p.value === 'number'
              ? p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              : p.value;
            return (
              <div key={idx} className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: p.color || p.fill }}></span>
                  {p.name || p.dataKey}:
                </span>
                <span className="font-bold text-cyan-400">
                  {formattedValue}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

interface SearchableCategorySelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  label: string;
}

const SearchableCategorySelect: React.FC<SearchableCategorySelectProps> = ({
  value,
  onChange,
  options,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && !options.includes(value)) {
      setIsCustom(true);
      setCustomValue(value);
    } else {
      setIsCustom(false);
      setCustomValue('');
    }
  }, [value, options]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}:</label>
      
      {!isCustom ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-[#0a0f1d]/90 border border-slate-800 text-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-[#00d2ff] transition-all flex items-center justify-between text-left cursor-pointer"
          >
            <span>{value || 'Selecione...'}</span>
            <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#111827] border border-slate-800 rounded-xl shadow-2xl z-[60] overflow-hidden p-2 space-y-2 max-h-[220px] flex flex-col backdrop-blur-xl">
              <div className="flex items-center gap-1.5 bg-[#0a0f1d] px-2 py-1 rounded-lg border border-slate-800 shrink-0">
                <span className="material-symbols-outlined text-[14px] text-slate-500">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar..."
                  className="bg-transparent text-xs text-slate-200 outline-none border-none w-full placeholder-slate-650"
                />
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-1 space-y-0.5 max-h-[140px]">
                {filteredOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full text-left text-xs px-2.5 py-2 rounded-lg transition-colors text-slate-355 hover:bg-[#00d2ff]/10 hover:text-white ${
                      value === opt ? 'bg-[#00d2ff]/20 text-[#00d2ff] font-bold' : ''
                    }`}
                  >
                    {opt}
                  </button>
                ))}
                
                {filteredOptions.length === 0 && (
                  <div className="text-center text-[10px] text-slate-500 py-2">
                    Nenhuma opção encontrada
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCustom(true);
                  onChange('');
                  setIsOpen(false);
                  setSearch('');
                }}
                className="w-full text-left text-xs px-2.5 py-2 rounded-lg transition-colors text-amber-400 hover:bg-amber-500/10 font-bold border-t border-slate-800/60 shrink-0 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                Outra (Especificar...)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="relative flex gap-2 items-center">
          <input
            type="text"
            value={customValue}
            onChange={(e) => {
              setCustomValue(e.target.value);
              onChange(e.target.value);
            }}
            placeholder="Digite a nova categoria..."
            className="w-full bg-[#0a0f1d]/90 border border-[#00d2ff]/40 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] transition-all"
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              setIsCustom(false);
              onChange(options[0] || '');
            }}
            className="p-2.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Voltar para lista"
          >
            <span className="material-symbols-outlined text-[16px] block">list</span>
          </button>
        </div>
      )}
    </div>
  );
};

const Projects: React.FC = () => {
  const { t, userProfile } = usePreferences();

  const canAccessProjects =
    userProfile?.role === 'Gestor' ||
    userProfile?.role === 'Gerente' ||
    userProfile?.role === 'Administrator' ||
    userProfile?.role === 'Admin' ||
    userProfile?.role === 'Supervisor';

  const [activeTab, setActiveTab] = useState<'visao-geral' | 'detalhes' | 'suprimentos' | 'quadro-branco'>('visao-geral');
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Projects state
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('manequip-projects-v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialProjects;
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string>('p1');

  const eapCategories = Array.from(
    new Set(
      projects.flatMap(p => p.costs.map(c => c.category)).concat(['Materiais', 'Mão de Obra', 'Serviços Adicionais'])
    )
  ).filter(Boolean);

  const materialCategories = Array.from(
    new Set(
      projects.flatMap(p => p.materials.map(m => m.category)).concat(['Materiais', 'Serviços Adicionais', 'Mão de Obra'])
    )
  ).filter(Boolean);

  // Filters for Portfólio Visão Geral
  const [periodFilter, setPeriodFilter] = useState<string>('mes_atual');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'execucao' | 'concluidos'>('todos');

  // Calendar filter state (independent year/month/day)
  const [calFilterOpen, setCalFilterOpen] = useState<boolean>(false);
  const [calFilterYear, setCalFilterYear] = useState<number | null>(null);
  const [calFilterMonth, setCalFilterMonth] = useState<number | null>(null); // 0-indexed
  const [calFilterDay, setCalFilterDay] = useState<number | null>(null);
  const calFilterRef = useRef<HTMLDivElement>(null);
  const [visaoGeralProjectFilter, setVisaoGeralProjectFilter] = useState<string>('todos');

  // Search and Category for Detalhes
  const [detailSearch, setDetailSearch] = useState<string>('');
  const [generalSearch, setGeneralSearch] = useState<string>('');
  const [materialSearch, setMaterialSearch] = useState<string>('');
  const [detailCategory, setDetailCategory] = useState<'todos' | 'desvios' | 'suprimentos' | 'mao-obra'>('todos');

  // Sorting states
  const [eapSortColumn, setEapSortColumn] = useState<'phase' | 'budget' | 'actual' | 'deviation' | 'responsible' | null>(null);
  const [eapSortDirection, setEapSortDirection] = useState<'asc' | 'desc'>('asc');
  const [matSortColumn, setMatSortColumn] = useState<'name' | 'qtyUsed' | 'qtyBudget' | 'supplier' | 'responsible' | null>(null);
  const [matSortDirection, setMatSortDirection] = useState<'asc' | 'desc'>('asc');

  // Quotes and Suppliers State
  const [requisitions, setRequisitions] = useState<Requisition[]>(() => {
    try {
      const saved = localStorage.getItem('manequip-requisitions-v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialRequisitions;
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem('manequip-suppliers-v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialSuppliers;
  });

  useEffect(() => {
    localStorage.setItem('manequip-suppliers-v1', JSON.stringify(suppliers));
  }, [suppliers]);

  // Spreadsheet import states
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<any[][]>([]);
  const [importCategory, setImportCategory] = useState<'EAP' | 'Materiais' | 'Suprimentos' | 'Fornecedores'>('EAP');
  const [importMappings, setImportMappings] = useState<Record<string, string>>({});
  const [importDestinationProjId, setImportDestinationProjId] = useState<string>('p1');
  const [isAnalyzingImport, setIsAnalyzingImport] = useState<boolean>(false);
  const [pastedText, setPastedText] = useState<string>('');

  // Whiteboard State
  const [notes, setNotes] = useState<WhiteboardNote[]>(() => {
    try {
      const saved = localStorage.getItem('manequip-wb-notes-v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialWhiteboardNotes;
  });
  
  const [wbColumns, setWbColumns] = useState<WhiteboardColumn[]>(() => {
    try {
      const saved = localStorage.getItem('manequip-wb-cols-v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialWbColumns;
  });

  const [selectedWbProjectId, setSelectedWbProjectId] = useState<string>('p1');

  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Modal for new post-it
  const [isWbModalOpen, setIsWbModalOpen] = useState<boolean>(false);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [newNoteType, setNewNoteType] = useState<'idea' | 'task' | 'blocker'>('idea');
  const [newNoteCol, setNewNoteCol] = useState<string>('');

  // Modal for editing post-it
  const [editingNote, setEditingNote] = useState<WhiteboardNote | null>(null);

  // Modal / States for new column / phase
  const [isNewColModalOpen, setIsNewColModalOpen] = useState<boolean>(false);
  const [newColName, setNewColName] = useState<string>('');
  const [newColColor, setNewColColor] = useState<string>('cyan');

  // Column renaming inline states
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState<string>('');

  // Milestone editing modal states
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [editMsName, setEditMsName] = useState<string>('');
  const [editMsDate, setEditMsDate] = useState<string>('');
  const [editMsStatus, setEditMsStatus] = useState<'Concluído' | 'Em Execução' | 'Atrasado' | 'Pendente'>('Pendente');
  const [isAddingMilestone, setIsAddingMilestone] = useState<boolean>(false);

  // Inline edit states for EAP cost rows
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [editCostPhase, setEditCostPhase] = useState<string>('');
  const [editCostBudget, setEditCostBudget] = useState<number>(0);
  const [editCostActual, setEditCostActual] = useState<number>(0);
  const [editCostResponsible, setEditCostResponsible] = useState<string>('');
  const [isAddingCost, setIsAddingCost] = useState<boolean>(false);
  const [editCostCategory, setEditCostCategory] = useState<string>('Materiais');

  // Inline edit states for Materials rows
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editMaterialName, setEditMaterialName] = useState<string>('');
  const [editMaterialQtyBudget, setEditMaterialQtyBudget] = useState<number>(0);
  const [editMaterialQtyUsed, setEditMaterialQtyUsed] = useState<number>(0);
  const [editMaterialUnit, setEditMaterialUnit] = useState<string>('');
  const [editMaterialSupplier, setEditMaterialSupplier] = useState<string>('');
  const [editMaterialResponsible, setEditMaterialResponsible] = useState<string>('');
  const [isAddingMaterial, setIsAddingMaterial] = useState<boolean>(false);
  const [editMaterialCategory, setEditMaterialCategory] = useState<string>('Materiais');

  // Inline edit states for Projects (in Visão Geral)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjName, setEditProjName] = useState<string>('');
  const [editProjLocation, setEditProjLocation] = useState<string>('');
  const [editProjPrevisto, setEditProjPrevisto] = useState<number>(0);
  const [editProjFaturado, setEditProjFaturado] = useState<number>(0);
  const [editProjProgress, setEditProjProgress] = useState<number>(0);
  const [editProjStatus, setEditProjStatus] = useState<'Em Execução' | 'Prazos Críticos' | 'Concluído'>('Em Execução');
  const [editProjCoordinator, setEditProjCoordinator] = useState<string>('');
  const [editProjTeam, setEditProjTeam] = useState<string>('');

  // States for new project
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [newProjName, setNewProjName] = useState<string>('');
  const [newProjLocation, setNewProjLocation] = useState<string>('');
  const [newProjPrevisto, setNewProjPrevisto] = useState<number>(0);
  const [newProjFaturado, setNewProjFaturado] = useState<number>(0);
  const [newProjProgress, setNewProjProgress] = useState<number>(0);
  const [newProjStatus, setNewProjStatus] = useState<'Em Execução' | 'Prazos Críticos' | 'Concluído'>('Em Execução');
  const [newProjCoordinator, setNewProjCoordinator] = useState<string>('');
  const [newProjTeam, setNewProjTeam] = useState<string>('');

  // States for Requisitions (Supplies) Form Modal
  const [isAddingReq, setIsAddingReq] = useState<boolean>(false);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [editReqMaterial, setEditReqMaterial] = useState<string>('');
  const [editReqQty, setEditReqQty] = useState<string>('');
  const [editReqStatus, setEditReqStatus] = useState<'Em Cotação' | 'Aprovado' | 'Aguardando Entrega' | 'Entregue'>('Em Cotação');
  const [editReqSupplier1, setEditReqSupplier1] = useState<string>('');
  const [editReqPrice1, setEditReqPrice1] = useState<number>(0);
  const [editReqDays1, setEditReqDays1] = useState<number>(0);
  const [editReqSupplier2, setEditReqSupplier2] = useState<string>('');
  const [editReqPrice2, setEditReqPrice2] = useState<number>(0);
  const [editReqDays2, setEditReqDays2] = useState<number>(0);
  const [editReqSupplier3, setEditReqSupplier3] = useState<string>('');
  const [editReqPrice3, setEditReqPrice3] = useState<number>(0);
  const [editReqDays3, setEditReqDays3] = useState<number>(0);

  // Supplier Add/Edit States
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [isAddingSupplier, setIsAddingSupplier] = useState<boolean>(false);
  const [editSupName, setEditSupName] = useState<string>('');
  const [editSupSpecialty, setEditSupSpecialty] = useState<string>('');
  const [editSupPhone, setEditSupPhone] = useState<string>('');
  const [editSupCompliance, setEditSupCompliance] = useState<number>(100);
  const [editSupRating, setEditSupRating] = useState<number>(5.0);

  // Toast System
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('manequip-projects-v1', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('manequip-requisitions-v1', JSON.stringify(requisitions));
  }, [requisitions]);

  useEffect(() => {
    localStorage.setItem('manequip-wb-notes-v1', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('manequip-wb-cols-v1', JSON.stringify(wbColumns));
  }, [wbColumns]);

  // Set default note column when selectedWbProjectId changes or columns change
  useEffect(() => {
    const activeCols = wbColumns.filter(c => c.projectId === selectedWbProjectId);
    if (activeCols.length > 0) {
      setNewNoteCol(activeCols[0].id);
    }
  }, [selectedWbProjectId, wbColumns]);

  // Close calendar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calFilterRef.current && !calFilterRef.current.contains(e.target as Node)) {
        setCalFilterOpen(false);
      }
    };
    if (calFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [calFilterOpen]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    if (isExportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExportDropdownOpen]);

  const addToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000); // 5 seconds
  };

  // Conditional permission rendering
  if (!userProfile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0f1d]">
        <span className="material-symbols-outlined text-[#00d2ff] animate-spin text-4xl">progress_activity</span>
      </div>
    );
  }

  if (!canAccessProjects) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0f1d] text-center p-6 select-none">
        <div className="size-16 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mb-4 animate-pulse">
          <span className="material-symbols-outlined text-[32px]">block</span>
        </div>
        <h2 className="text-xl font-bold text-white font-display">Acesso Restrito</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-sm">
          Você não possui privilégios suficientes para acessar a área de Gestão de Projetos. Entre em contato com seu administrador.
        </p>
      </div>
    );
  }

  // Find active project object
  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Financial Calculations based on selected filter
  const filteredProjects = projects.filter((p) => {
    if (statusFilter === 'execucao' && p.status === 'Concluído') return false;
    if (statusFilter === 'concluidos' && p.status !== 'Concluído') return false;
    if (visaoGeralProjectFilter !== 'todos' && p.id !== visaoGeralProjectFilter) return false;
    return true;
  });

  const getDeviationCategories = () => {
    let materials = 0;
    let maoDeObra = 0;
    let servicos = 0;
    
    filteredProjects.forEach((p) => {
      p.costs.forEach((c) => {
        const deviation = c.actual - c.budget;
        if (deviation > 0) {
          if (c.category === 'Materiais') materials += deviation;
          else if (c.category === 'Mão de Obra') maoDeObra += deviation;
          else if (c.category === 'Serviços Adicionais') servicos += deviation;
        }
      });
    });
    
    const total = materials + maoDeObra + servicos;
    if (total === 0) {
      return [
        { name: 'Materiais', value: 0, color: '#f97316' },
        { name: 'Mão de Obra', value: 0, color: '#e11d48' },
        { name: 'Serviços Adicionais', value: 0, color: '#06b6d4' },
      ];
    }
    
    return [
      { name: 'Materiais', value: materials, color: '#f97316' },
      { name: 'Mão de Obra', value: maoDeObra, color: '#e11d48' },
      { name: 'Serviços Adicionais', value: servicos, color: '#06b6d4' },
    ];
  };

  const deviationCategories = getDeviationCategories();
  const totalDesvios = deviationCategories.reduce((acc, c) => acc + c.value, 0);

  const totalPrevisto = filteredProjects.reduce((acc, p) => acc + p.previsto, 0);
  const totalFaturado = filteredProjects.reduce((acc, p) => acc + p.faturado, 0);
  const activeCount = filteredProjects.filter((p) => p.status !== 'Concluído').length;
  const criticalCount = filteredProjects.filter((p) => p.status === 'Prazos Críticos').length;

  // Chart Data: Previsto vs Realizado vs Faturado
  // Dynamically generated relative to current calendar month
  const getTrendData = () => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-indexed (5 for June)
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const overallPrevisto = 1610000;
    const scaleFactor = visaoGeralProjectFilter !== 'todos' ? totalPrevisto / overallPrevisto : 1;

    const defaultHistory = [
      { previsto: 180000, faturado: 120000, desvio: 0, tendencia: 125000 }, // Jan
      { previsto: 280000, faturado: 230000, desvio: 5000, tendencia: 235000 }, // Fev
      { previsto: 420000, faturado: 380000, desvio: 15000, tendencia: 395000 }, // Mar
      { previsto: 650000, faturado: 540000, desvio: 20000, tendencia: 570000 }, // Abr
      { previsto: 850000, faturado: 710000, desvio: 30000, tendencia: 740000 }, // Mai
      { previsto: 1100000, faturado: 920000, desvio: 40000, tendencia: 950000 }, // Jun
      { previsto: 1300000, faturado: 1100000, desvio: 45000, tendencia: 1120000 }, // Jul
      { previsto: 1500000, faturado: 1250000, desvio: 50000, tendencia: 1280000 }, // Ago
      { previsto: 1700000, faturado: 1400000, desvio: 55000, tendencia: 1430000 }, // Set
      { previsto: 1900000, faturado: 1550000, desvio: 60000, tendencia: 1580000 }, // Out
      { previsto: 2100000, faturado: 1700000, desvio: 65000, tendencia: 1730000 }, // Nov
      { previsto: 2300000, faturado: 1850000, desvio: 70000, tendencia: 1880000 }  // Dez
    ];

    const data = [];
    // 1. History before current month
    for (let i = 0; i < currentMonth; i++) {
      const hist = defaultHistory[i];
      data.push({
        name: monthNames[i],
        previsto: Math.round(hist.previsto * scaleFactor),
        faturado: Math.round(hist.faturado * scaleFactor),
        desvio: Math.round(hist.desvio * scaleFactor),
        tendencia: Math.round(hist.tendencia * scaleFactor),
      });
    }

    // 2. Current Month (uses calculated totals from database/filteredProjects)
    data.push({
      name: monthNames[currentMonth],
      previsto: totalPrevisto,
      faturado: totalFaturado,
      desvio: totalDesvios,
      tendencia: totalFaturado + Math.round(10000 * scaleFactor)
    });

    // 3. Projected Months (next 2 months)
    data.push({
      name: `${monthNames[(currentMonth + 1) % 12]} (Proj)`,
      previsto: totalPrevisto + Math.round(150000 * scaleFactor),
      faturado: null,
      desvio: null,
      tendencia: totalFaturado + Math.round(140000 * scaleFactor)
    });

    data.push({
      name: `${monthNames[(currentMonth + 2) % 12]} (Proj)`,
      previsto: totalPrevisto + Math.round(300000 * scaleFactor),
      faturado: null,
      desvio: null,
      tendencia: totalFaturado + Math.round(290000 * scaleFactor)
    });

    return data;
  };

  const trendData = getTrendData();

  // Pie Chart: Distribution of deviations (dynamic placeholder fallback)
  const dynamicDeviationCategories = deviationCategories;

  // Interactive Project Access (switches to Tab 2 and selects the project)
  const handleAccessProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab('detalhes');
    addToast(`Acessando detalhes de: ${projects.find((p) => p.id === projectId)?.name}`, 'info');
  };

  // Quotes Action: Approve supplier
  const handleApproveQuote = (reqId: string, supplierName: string, price: number) => {
    let targetProjectId = '';
    let materialName = '';
    let qtyStr = '';

    setRequisitions((prev) =>
      prev.map((req) => {
        if (req.id === reqId) {
          targetProjectId = req.projectId;
          materialName = req.material;
          qtyStr = req.qty;
          return {
            ...req,
            status: 'Aprovado',
            approvedSupplier: supplierName,
            approvedPrice: price,
          };
        }
        return req;
      })
    );

    if (targetProjectId) {
      setProjects((prevProjects) =>
        prevProjects.map((proj) => {
          if (proj.id === targetProjectId) {
            // Try to find if material exists
            const materialExists = proj.materials.some(
              (m) => m.name.toLowerCase().includes(materialName.toLowerCase()) || materialName.toLowerCase().includes(m.name.toLowerCase())
            );

            let updatedMaterials = [...proj.materials];
            if (materialExists) {
              updatedMaterials = proj.materials.map((m) => {
                if (m.name.toLowerCase().includes(materialName.toLowerCase()) || materialName.toLowerCase().includes(m.name.toLowerCase())) {
                  const numericQty = parseFloat(qtyStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 1;
                  return {
                    ...m,
                    supplier: supplierName,
                    qtyUsed: m.qtyUsed + numericQty,
                  };
                }
                return m;
              });
            } else {
              const numericQty = parseFloat(qtyStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 1;
              updatedMaterials.push({
                id: `mat-${Date.now()}`,
                name: materialName,
                category: 'Materiais',
                qtyBudget: numericQty,
                qtyUsed: numericQty,
                unit: qtyStr.replace(/[\d\s.,]/g, '') || 'un',
                supplier: supplierName,
                responsible: proj.coordinator || 'Coordenador',
              });
            }

            // Also, automatically update EAP actual cost under 'Materiais' category
            const updatedCosts = proj.costs.map((c) => {
              if (c.category === 'Materiais') {
                return {
                  ...c,
                  actual: c.actual + price,
                };
              }
              return c;
            });

            return {
              ...proj,
              materials: updatedMaterials,
              costs: updatedCosts,
            };
          }
          return proj;
        })
      );
    }

    addToast(`Fornecedor ${supplierName} aprovado para compra (R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Insumos e custos da EAP atualizados automaticamente.`, 'success');
  };

  // Whiteboard: drag events
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCol: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    const noteToMove = notes.find(n => n.id === id);
    if (!noteToMove) return;

    if (noteToMove.columnId !== targetCol) {
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? { ...note, columnId: targetCol } : note))
      );
      const colName = wbColumns.find(c => c.id === targetCol)?.name || targetCol;
      addToast(`Post-it movido para "${colName}"`, 'info');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Whiteboard Note management
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const newNote: WhiteboardNote = {
      id: `wb-${Date.now()}`,
      text: newNoteText,
      type: newNoteType,
      columnId: newNoteCol,
      projectId: selectedWbProjectId,
      x: 20,
      y: 60 + notes.filter(n => n.columnId === newNoteCol).length * 100
    };
    setNotes((prev) => [...prev, newNote]);
    setNewNoteText('');
    setIsWbModalOpen(false);
    addToast('Nova nota adicionada ao Quadro Branco!', 'success');
  };

  const handleSaveEditNote = () => {
    if (!editingNote || !editingNote.text.trim()) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === editingNote.id ? editingNote : n))
    );
    setEditingNote(null);
    addToast('Nota editada com sucesso.', 'success');
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setEditingNote(null);
    addToast('Nota removida do Quadro Branco.', 'warning');
  };

  const handleConvertToTask = (note: WhiteboardNote) => {
    // Visual feedback of conversion
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === note.id) {
          return { ...n, converted: true };
        }
        return n;
      })
    );

    // Simulate adding to project tasks (fundacao / EAP)
    addToast(`[Sucesso] Post-it "${note.text.substring(0, 20)}..." convertido oficialmente em tarefa no cronograma de engenharia.`, 'success');
  };

  // Canvas Pan (Drag Background)
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('canvas-container') || target.classList.contains('canvas-grid')) {
      setIsPanning(true);
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  const handleStartEditProject = (proj: Project) => {
    setEditingProjectId(proj.id);
    setEditProjName(proj.name);
    setEditProjLocation(proj.location);
    setEditProjPrevisto(proj.previsto);
    setEditProjFaturado(proj.faturado);
    setEditProjProgress(proj.progress);
    setEditProjStatus(proj.status);
    setEditProjCoordinator(proj.coordinator);
    setEditProjTeam(proj.team);
  };

  const handleSaveEditProject = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            name: editProjName,
            location: editProjLocation,
            previsto: editProjPrevisto,
            faturado: editProjFaturado,
            progress: editProjProgress,
            status: editProjStatus,
            coordinator: editProjCoordinator,
            team: editProjTeam,
          };
        }
        return p;
      })
    );
    setEditingProjectId(null);
    addToast('Projeto atualizado com sucesso!', 'success');
  };

  const handleCancelEditProject = () => {
    setEditingProjectId(null);
  };

  const handleStartEditMilestone = (ms: Milestone) => {
    setEditingMilestone(ms);
    setEditMsName(ms.name);
    setEditMsDate(ms.date);
    setEditMsStatus(ms.status);
  };

  const handleSaveEditMilestone = () => {
    if (!editingMilestone) return;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === selectedProjectId) {
          return {
            ...p,
            milestones: p.milestones.map((m) =>
              m.id === editingMilestone.id
                ? {
                    ...m,
                    name: editMsName,
                    date: editMsDate,
                    status: editMsStatus,
                  }
                : m
            ),
          };
        }
        return p;
      })
    );
    setEditingMilestone(null);
    addToast('Marco cronológico atualizado!', 'success');
  };

  const handleStartEditCost = (cost: CostItem) => {
    setEditingCostId(cost.id);
    setEditCostPhase(cost.phase);
    setEditCostBudget(cost.budget);
    setEditCostActual(cost.actual);
    setEditCostResponsible(cost.responsible);
    setEditCostCategory(cost.category);
  };

  const handleSaveEditCost = (costId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === selectedProjectId) {
          return {
            ...p,
            costs: p.costs.map((c) =>
              c.id === costId
                ? {
                    ...c,
                    phase: editCostPhase,
                    budget: editCostBudget,
                    actual: editCostActual,
                    responsible: editCostResponsible,
                    category: editCostCategory,
                  }
                : c
            ),
          };
        }
        return p;
      })
    );
    setEditingCostId(null);
    addToast('Fase da EAP atualizada com sucesso!', 'success');
  };

  const handleStartEditMaterial = (mat: MaterialItem) => {
    setEditingMaterialId(mat.id);
    setEditMaterialName(mat.name);
    setEditMaterialQtyBudget(mat.qtyBudget);
    setEditMaterialQtyUsed(mat.qtyUsed);
    setEditMaterialUnit(mat.unit);
    setEditMaterialSupplier(mat.supplier);
    setEditMaterialResponsible(mat.responsible);
    setEditMaterialCategory(mat.category);
  };

  const handleSaveEditMaterial = (matId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === selectedProjectId) {
          return {
            ...p,
            materials: p.materials.map((m) =>
              m.id === matId
                ? {
                    ...m,
                    name: editMaterialName,
                    qtyBudget: editMaterialQtyBudget,
                    qtyUsed: editMaterialQtyUsed,
                    unit: editMaterialUnit,
                    supplier: editMaterialSupplier,
                    responsible: editMaterialResponsible,
                    category: editMaterialCategory,
                  }
                : m
            ),
          };
        }
        return p;
      })
    );
    setEditingMaterialId(null);
    addToast('Insumo atualizado com sucesso!', 'success');
  };

  const handleAddNewCost = () => {
    if (!editCostPhase.trim()) {
      addToast('O nome da fase é obrigatório.', 'warning');
      return;
    }
    const newCostItem: CostItem = {
      id: `c-${Date.now()}`,
      phase: editCostPhase,
      budget: editCostBudget,
      actual: editCostActual,
      category: editCostCategory,
      responsible: editCostResponsible || 'Coordenador',
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === selectedProjectId) {
          return {
            ...p,
            costs: [...p.costs, newCostItem],
          };
        }
        return p;
      })
    );
    setIsAddingCost(false);
    setEditCostPhase('');
    setEditCostBudget(0);
    setEditCostActual(0);
    setEditCostResponsible('');
    addToast('Item adicionado à EAP!', 'success');
  };

  const handleDeleteCost = (costId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === selectedProjectId) {
          return {
            ...p,
            costs: p.costs.filter((c) => c.id !== costId),
          };
        }
        return p;
      })
    );
    setEditingCostId(null);
    addToast('Item removido da EAP.', 'warning');
  };

  const handleAddNewMaterial = () => {
    if (!editMaterialName.trim()) {
      addToast('O nome do insumo é obrigatório.', 'warning');
      return;
    }
    const newMaterialItem: MaterialItem = {
      id: `mat-${Date.now()}`,
      name: editMaterialName,
      qtyBudget: editMaterialQtyBudget,
      qtyUsed: editMaterialQtyUsed,
      unit: editMaterialUnit || 'un',
      supplier: editMaterialSupplier || 'A cotar',
      responsible: editMaterialResponsible || 'Hugo (Mestre)',
      category: editMaterialCategory,
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === selectedProjectId) {
          return {
            ...p,
            materials: [...p.materials, newMaterialItem],
          };
        }
        return p;
      })
    );
    setIsAddingMaterial(false);
    setEditMaterialName('');
    setEditMaterialQtyBudget(0);
    setEditMaterialQtyUsed(0);
    setEditMaterialUnit('');
    setEditMaterialSupplier('');
    setEditMaterialResponsible('');
    addToast('Insumo adicionado com sucesso!', 'success');
  };

  const handleDeleteMaterial = (matId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === selectedProjectId) {
          return {
            ...p,
            materials: p.materials.filter((m) => m.id !== matId),
          };
        }
        return p;
      })
    );
    setEditingMaterialId(null);
    addToast('Insumo removido com sucesso.', 'warning');
  };

  const handleSaveNewProject = () => {
    if (!newProjName.trim()) {
      addToast('O nome do projeto é obrigatório.', 'warning');
      return;
    }
    const newProjId = `p-${Date.now()}`;
    const newProject: Project = {
      id: newProjId,
      name: newProjName,
      location: newProjLocation || 'Sem localização',
      previsto: newProjPrevisto || 0,
      faturado: newProjFaturado || 0,
      desvios: 0,
      progress: newProjProgress || 0,
      status: newProjStatus,
      coordinator: newProjCoordinator || 'Não designado',
      team: newProjTeam || 'Não designada',
      milestones: [
        { id: `m-${Date.now()}-1`, name: 'Planejamento Inicial', status: 'Concluído', date: getRelativeDate(0, 1) },
        { id: `m-${Date.now()}-2`, name: 'Início dos Trabalhos', status: 'Em Execução', date: getRelativeDate(0, 15) },
        { id: `m-${Date.now()}-3`, name: 'Entrega Final', status: 'Pendente', date: getRelativeDate(1, 30) },
      ],
      costs: [
        { id: `c-${Date.now()}-1`, phase: 'Mobilização e Setup', budget: Math.round(newProjPrevisto * 0.1), actual: 0, category: 'Serviços Adicionais', responsible: newProjCoordinator || 'Daniel Silva' },
        { id: `c-${Date.now()}-2`, phase: 'Materiais Principais', budget: Math.round(newProjPrevisto * 0.6), actual: 0, category: 'Materiais', responsible: newProjCoordinator || 'Daniel Silva' },
        { id: `c-${Date.now()}-3`, phase: 'Mão de Obra Operacional', budget: Math.round(newProjPrevisto * 0.3), actual: 0, category: 'Mão de Obra', responsible: newProjCoordinator || 'Daniel Silva' },
      ],
      materials: [
        { id: `mat-${Date.now()}-1`, name: 'Insumos de Mobilização', category: 'Materiais', qtyBudget: 100, qtyUsed: 0, unit: 'un', supplier: 'A cotar', responsible: newProjCoordinator || 'Daniel Silva' },
      ],
    };

    setProjects((prev) => [...prev, newProject]);

    const newCols: WhiteboardColumn[] = [
      { id: `briefing-${newProjId}`, name: 'FASE 1: BRIEFING / IDEIAS', projectId: newProjId, color: 'cyan' },
      { id: `quotes-${newProjId}`, name: 'FASE 2: COMPRAS & COTAÇÃO', projectId: newProjId, color: 'amber' },
      { id: `field-${newProjId}`, name: 'FASE 3: APLICAÇÃO EM CAMPO', projectId: newProjId, color: 'rose' },
    ];
    setWbColumns((prev) => [...prev, ...newCols]);

    setSelectedProjectId(newProjId);
    setIsNewProjectModalOpen(false);
    addToast(`Projeto "${newProjName}" criado com sucesso!`, 'success');
  };

  const handleDeleteProject = (projId: string) => {
    if (projects.length <= 1) {
      addToast('O portfólio precisa conter pelo menos um projeto ativo.', 'warning');
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== projId));
    setEditingProjectId(null);
    const firstRemaining = projects.find((p) => p.id !== projId);
    if (firstRemaining) {
      setSelectedProjectId(firstRemaining.id);
    }
    addToast('Projeto removido do portfólio.', 'warning');
  };

  const handleAddNewMilestone = () => {
    if (!editMsName.trim()) {
      addToast('O nome do marco é obrigatório.', 'warning');
      return;
    }
    const newMs: Milestone = {
      id: `m-${Date.now()}`,
      name: editMsName,
      date: editMsDate || getRelativeDate(0, 1),
      status: editMsStatus,
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === selectedProjectId) {
          return {
            ...p,
            milestones: [...p.milestones, newMs],
          };
        }
        return p;
      })
    );
    setIsAddingMilestone(false);
    setEditMsName('');
    setEditMsDate('');
    setEditMsStatus('Pendente');
    addToast('Marco cronológico adicionado!', 'success');
  };

  const handleDeleteMilestone = (msId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === selectedProjectId) {
          return {
            ...p,
            milestones: p.milestones.filter((m) => m.id !== msId),
          };
        }
        return p;
      })
    );
    setEditingMilestone(null);
    addToast('Marco removido.', 'warning');
  };

  const clearReqForm = () => {
    setEditReqMaterial('');
    setEditReqQty('');
    setEditReqStatus('Em Cotação');
    setEditReqSupplier1('');
    setEditReqPrice1(0);
    setEditReqDays1(0);
    setEditReqSupplier2('');
    setEditReqPrice2(0);
    setEditReqDays2(0);
    setEditReqSupplier3('');
    setEditReqPrice3(0);
    setEditReqDays3(0);
  };

  const handleStartEditRequisition = (req: Requisition) => {
    setEditingReqId(req.id);
    setEditReqMaterial(req.material);
    setEditReqQty(req.qty);
    setEditReqStatus(req.status);

    if (req.options[0]) {
      setEditReqSupplier1(req.options[0].supplierName);
      setEditReqPrice1(req.options[0].price);
      setEditReqDays1(req.options[0].deliveryDays);
    }
    if (req.options[1]) {
      setEditReqSupplier2(req.options[1].supplierName);
      setEditReqPrice2(req.options[1].price);
      setEditReqDays2(req.options[1].deliveryDays);
    }
    if (req.options[2]) {
      setEditReqSupplier3(req.options[2].supplierName);
      setEditReqPrice3(req.options[2].price);
      setEditReqDays3(req.options[2].deliveryDays);
    }
    setIsAddingReq(true);
  };

  const handleSaveNewRequisition = () => {
    if (!editReqMaterial.trim() || !editReqQty.trim()) {
      addToast('Preencha o nome do material e a quantidade.', 'warning');
      return;
    }

    const options: QuoteOption[] = [];
    if (editReqSupplier1.trim()) {
      options.push({ supplierName: editReqSupplier1, price: editReqPrice1 || 0, deliveryDays: editReqDays1 || 0, rating: 4 });
    }
    if (editReqSupplier2.trim()) {
      options.push({ supplierName: editReqSupplier2, price: editReqPrice2 || 0, deliveryDays: editReqDays2 || 0, rating: 5 });
    }
    if (editReqSupplier3.trim()) {
      options.push({ supplierName: editReqSupplier3, price: editReqPrice3 || 0, deliveryDays: editReqDays3 || 0, rating: 3 });
    }

    if (options.length > 0) {
      let minPriceIndex = 0;
      for (let i = 1; i < options.length; i++) {
        if (options[i].price < options[minPriceIndex].price) {
          minPriceIndex = i;
        }
      }
      options[minPriceIndex].isBest = true;
    }

    if (editingReqId) {
      setRequisitions((prev) =>
        prev.map((req) =>
          req.id === editingReqId
            ? {
                ...req,
                material: editReqMaterial,
                qty: editReqQty,
                status: editReqStatus,
                options: options.length > 0 ? options : req.options,
                approvedSupplier: editReqStatus !== 'Em Cotação' ? (editReqStatus === 'Aprovado' || req.approvedSupplier ? req.approvedSupplier || options[0]?.supplierName : undefined) : undefined,
                approvedPrice: editReqStatus !== 'Em Cotação' ? (editReqStatus === 'Aprovado' || req.approvedPrice ? req.approvedPrice || options[0]?.price : undefined) : undefined,
              }
            : req
        )
      );
      addToast('Requisição de compra atualizada!', 'success');
    } else {
      const newReq: Requisition = {
        id: `req-${Date.now()}`,
        projectId: selectedProjectId,
        material: editReqMaterial,
        qty: editReqQty,
        date: getRelativeDate(0, 0),
        status: editReqStatus,
        options: options.length > 0 ? options : [
          { supplierName: 'Depósito Central', price: 1000, deliveryDays: 2, rating: 4, isBest: true },
          { supplierName: 'Suprimentos Vale', price: 1200, deliveryDays: 1, rating: 3 }
        ]
      };
      setRequisitions((prev) => [...prev, newReq]);
      addToast('Nova requisição enviada para cotação!', 'success');
    }

    setIsAddingReq(false);
    setEditingReqId(null);
    clearReqForm();
  };

  const loadXLSX = () => {
    return new Promise<any>((resolve, reject) => {
      if ((window as any).XLSX) {
        resolve((window as any).XLSX);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload = () => resolve((window as any).XLSX);
      script.onerror = () => reject(new Error('Falha ao carregar biblioteca SheetJS'));
      document.body.appendChild(script);
    });
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const parseMarkdownTable = (text: string): string[][] => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.startsWith('|') && l.endsWith('|'));
    if (lines.length < 2) return [];
    const rows = lines.map(line =>
      line.slice(1, -1).split('|').map(cell => cell.trim())
    );
    return rows.filter(row => !row.every(cell => cell.startsWith('-') || cell === ''));
  };

  const localAISuggestCategoryAndMapping = (headers: string[]) => {
    let scoreEAP = 0;
    let scoreMat = 0;
    let scoreReq = 0;
    let scoreSup = 0;
    const mapping: Record<string, string> = {};

    headers.forEach(h => {
      const term = h.toLowerCase();
      if (term.includes('fase') || term.includes('etapa') || term.includes('pacote') || term.includes('previsto') || term.includes('realizado') || term.includes('budget') || term.includes('actual') || term.includes('gasto') || term.includes('custo')) {
        scoreEAP += 2;
      }
      if (term.includes('insumo') || term.includes('material') || term.includes('consumo') || term.includes('qty') || term.includes('utilizado') || term.includes('unidade') || term.includes('unit')) {
        scoreMat += 2;
      }
      if (term.includes('requisi') || term.includes('compra') || term.includes('cota') || term.includes('lote') || term.includes('status')) {
        scoreReq += 2;
      }
      if (term.includes('fornece') || term.includes('cnpj') || term.includes('telefone') || term.includes('compliance') || term.includes('rating') || term.includes('nota')) {
        scoreSup += 2;
      }
    });

    let category: 'EAP' | 'Materiais' | 'Suprimentos' | 'Fornecedores' = 'EAP';
    const maxScore = Math.max(scoreEAP, scoreMat, scoreReq, scoreSup);
    if (maxScore === scoreMat) category = 'Materiais';
    else if (maxScore === scoreReq) category = 'Suprimentos';
    else if (maxScore === scoreSup) category = 'Fornecedores';

    headers.forEach(h => {
      const term = h.toLowerCase();
      if (category === 'EAP') {
        if (term.includes('fase') || term.includes('etapa') || term.includes('nome') || term.includes('descri') || term.includes('pacote') || term.includes('trabalho')) mapping[h] = 'phase';
        else if (term.includes('previsto') || term.includes('budget') || term.includes('orcamento') || term.includes('valor')) mapping[h] = 'budget';
        else if (term.includes('realizado') || term.includes('gasto') || term.includes('actual')) mapping[h] = 'actual';
        else if (term.includes('categ') || term.includes('tipo')) mapping[h] = 'category';
        else if (term.includes('resp') || term.includes('coord') || term.includes('aprovado')) mapping[h] = 'responsible';
      } else if (category === 'Materiais') {
        if (term.includes('insumo') || term.includes('material') || term.includes('nome') || term.includes('descri') || term.includes('serviço')) mapping[h] = 'name';
        else if (term.includes('categ') || term.includes('tipo')) mapping[h] = 'category';
        else if (term.includes('previsto') || term.includes('meta') || term.includes('budget') || term.includes('limite') || term.includes('quant')) mapping[h] = 'qtyBudget';
        else if (term.includes('utilizado') || term.includes('usado') || term.includes('real') || term.includes('consumo')) mapping[h] = 'qtyUsed';
        else if (term.includes('unid') || term.includes('unit') || term.includes('medida')) mapping[h] = 'unit';
        else if (term.includes('fornece') || term.includes('supplier')) mapping[h] = 'supplier';
        else if (term.includes('resp') || term.includes('coord') || term.includes('tecnico')) mapping[h] = 'responsible';
      } else if (category === 'Suprimentos') {
        if (term.includes('material') || term.includes('insumo') || term.includes('nome') || term.includes('descri')) mapping[h] = 'material';
        else if (term.includes('qtd') || term.includes('quant') || term.includes('lote') || term.includes('volume')) mapping[h] = 'qty';
        else if (term.includes('status') || term.includes('situa') || term.includes('fase') || term.includes('logistica')) mapping[h] = 'status';
      } else if (category === 'Fornecedores') {
        if (term.includes('fornece') || term.includes('nome') || term.includes('raz') || term.includes('empresa') || term.includes('parceiro')) mapping[h] = 'name';
        else if (term.includes('nota') || term.includes('aval') || term.includes('rating') || term.includes('estrela')) mapping[h] = 'rating';
        else if (term.includes('compl') || term.includes('atend') || term.includes('desemp')) mapping[h] = 'compliance';
        else if (term.includes('espe') || term.includes('serv') || term.includes('ramo') || term.includes('area')) mapping[h] = 'specialty';
        else if (term.includes('fone') || term.includes('tel') || term.includes('cel') || term.includes('contat')) mapping[h] = 'phone';
      }
    });

    return { category, mapping };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingImport(true);
    const reader = new FileReader();
    const fileType = file.name.split('.').pop()?.toLowerCase();

    reader.onload = async (event) => {
      try {
        let parsed: string[][] = [];

        if (fileType === 'xlsx' || fileType === 'xls') {
          const XLSX = await loadXLSX();
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          parsed = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
        } else {
          const text = event.target?.result as string;
          if (fileType === 'csv') {
            parsed = parseCSV(text);
          } else if (fileType === 'json') {
            const jsonVal = JSON.parse(text);
            if (Array.isArray(jsonVal)) {
              if (Array.isArray(jsonVal[0])) {
                parsed = jsonVal;
              } else if (typeof jsonVal[0] === 'object') {
                const keys = Object.keys(jsonVal[0]);
                parsed = [keys, ...jsonVal.map((obj: any) => keys.map(k => String(obj[k] ?? '')))];
              }
            }
          } else if (fileType === 'md' || fileType === 'markdown') {
            parsed = parseMarkdownTable(text);
          }
        }

        if (!parsed || parsed.length < 2) {
          addToast('Planilha vazia ou com dados insuficientes.', 'warning');
          setIsAnalyzingImport(false);
          return;
        }

        // Clean empty rows/columns
        const headers = parsed[0].map(h => String(h || '').trim()).filter(Boolean);
        const rows = parsed.slice(1).map(row => row.slice(0, headers.length)).filter(row => row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''));

        if (rows.length === 0) {
          addToast('Nenhuma linha de dados encontrada na planilha.', 'warning');
          setIsAnalyzingImport(false);
          return;
        }

        setImportHeaders(headers);
        setImportRows(rows);

        // Try AI mapping from Ollama local instance
        try {
          const sampleRows = rows.slice(0, 3);
          const aiResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama3',
              prompt: `Você é uma IA especializada em analisar e estruturar planilhas para o sistema de gestão de projetos.
Analise os cabeçalhos de coluna e decida a qual das 4 categorias a planilha pertence:
- 'EAP' (tabelas de etapas, fases, orçamento e despesa)
- 'Materiais' (tabelas de levantamento de insumos e consumo técnico)
- 'Suprimentos' (tabelas de requisições de compras e compras efetuadas)
- 'Fornecedores' (tabelas de fornecedores homologados e compliance)

Mapeie os cabeçalhos originais para as chaves correspondentes permitidas de cada categoria.

Chaves permitidas:
- EAP: phase, budget, actual, category, responsible
- Materiais: name, category, qtyBudget, qtyUsed, unit, supplier, responsible
- Suprimentos: material, qty, status
- Fornecedores: name, rating, compliance, specialty, phone

Cabeçalhos originais: ${JSON.stringify(headers)}
Amostra dos dados: ${JSON.stringify(sampleRows)}

Retorne APENAS um objeto JSON válido (sem comentários ou blocos markdown de texto) no seguinte formato:
{
  "categoria": "EAP" | "Materiais" | "Suprimentos" | "Fornecedores",
  "mapeamento": {
    "NOME_COLUNA_ORIGINAL": "chave_mapeada"
  }
}`,
              stream: false,
              options: { temperature: 0.1 }
            })
          });

          if (aiResponse.ok) {
            const resJson = await aiResponse.json();
            if (resJson && resJson.response) {
              const cleanResponse = resJson.response.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsedAi = JSON.parse(cleanResponse);
              if (parsedAi.categoria && parsedAi.mapeamento) {
                setImportCategory(parsedAi.categoria);
                setImportMappings(parsedAi.mapeamento);
                addToast(`Análise de IA (Llama3) concluída: ${parsedAi.categoria}`, 'success');
                setIsAnalyzingImport(false);
                return;
              }
            }
          }
          throw new Error('Falha no formato da IA');
        } catch (err) {
          // Fallback to local heuristic mapper
          const localAi = localAISuggestCategoryAndMapping(headers);
          setImportCategory(localAi.category);
          setImportMappings(localAi.mapping);
          addToast(`Mapeador Inteligente Local ativado: ${localAi.category}`, 'info');
        }

        setIsAnalyzingImport(false);
      } catch (err) {
        addToast('Erro ao ler ou processar planilha.', 'warning');
        setIsAnalyzingImport(false);
      }
    };

    if (fileType === 'xlsx' || fileType === 'xls') {
      const targetInput = e.target;
      reader.readAsArrayBuffer(file);
      targetInput.value = '';
    } else {
      const targetInput = e.target;
      reader.readAsText(file);
      targetInput.value = '';
    }
  };

  const handleImportSubmit = () => {
    if (importHeaders.length === 0 || importRows.length === 0) {
      addToast('Nenhum dado para importar.', 'warning');
      return;
    }

    const mappedItems = importRows.map((row, rIdx) => {
      const obj: any = {};
      importHeaders.forEach((h, colIdx) => {
        const key = importMappings[h];
        if (key) {
          let val = row[colIdx];
          if (key === 'budget' || key === 'actual' || key === 'qtyBudget' || key === 'qtyUsed' || key === 'rating' || key === 'compliance') {
            val = parseFloat(String(val || '0').replace(/[^\d.-]/g, '')) || 0;
          } else {
            val = String(val ?? '').trim();
          }
          obj[key] = val;
        }
      });
      obj.id = `imported-${Date.now()}-${rIdx}`;
      return obj;
    });

    if (importDestinationProjId === 'new') {
      const newProjId = `p-${Date.now()}`;
      
      let initialCosts: CostItem[] = [];
      let initialMaterials: MaterialItem[] = [];
      
      if (importCategory === 'EAP') {
        initialCosts = mappedItems.map(item => ({
          id: item.id,
          phase: item.phase || 'Nova Fase Importada',
          budget: item.budget || 0,
          actual: item.actual || 0,
          category: item.category || 'Materiais',
          responsible: item.responsible || 'Eng. Daniel Silva'
        }));
      } else {
        initialCosts = [
          { id: `c-${Date.now()}-1`, phase: 'Fase Inicial Civil', budget: 100000, actual: 0, category: 'Materiais', responsible: 'Daniel Silva' }
        ];
      }

      if (importCategory === 'Materiais') {
        initialMaterials = mappedItems.map(item => ({
          id: item.id,
          name: item.name || 'Insumo Importado',
          category: item.category || 'Materiais',
          qtyBudget: item.qtyBudget || 0,
          qtyUsed: item.qtyUsed || 0,
          unit: item.unit || 'un',
          supplier: item.supplier || 'A cotar',
          responsible: item.responsible || 'Hugo (Mestre)'
        }));
      } else {
        initialMaterials = [
          { id: `mat-${Date.now()}-1`, name: 'Insumo Setup', category: 'Materiais', qtyBudget: 100, qtyUsed: 0, unit: 'un', supplier: 'A cotar', responsible: 'Daniel Silva' }
        ];
      }

      const totalBudget = initialCosts.reduce((s, c) => s + c.budget, 0);
      const totalActual = initialCosts.reduce((s, c) => s + c.actual, 0);

      const newProj: Project = {
        id: newProjId,
        name: `Projeto Importado ${new Date().toLocaleDateString('pt-BR')}`,
        location: 'Localização Importada',
        previsto: totalBudget || 150000,
        faturado: totalActual || 0,
        desvios: 0,
        progress: 0,
        status: 'Em Execução',
        coordinator: userProfile?.name || 'Coordenador',
        team: 'Frente Importada',
        milestones: [
          { id: `m-${Date.now()}-1`, name: 'Planejamento Inicial', status: 'Concluído', date: getRelativeDate(0, 1) },
          { id: `m-${Date.now()}-2`, name: 'Início Obras', status: 'Em Execução', date: getRelativeDate(0, 15) },
        ],
        costs: initialCosts,
        materials: initialMaterials
      };

      setProjects(prev => [...prev, newProj]);
      setSelectedProjectId(newProjId);
      addToast(`Novo projeto criado com ${mappedItems.length} itens importados!`, 'success');
    } else {
      setProjects(prev => prev.map(p => {
        if (p.id === importDestinationProjId) {
          if (importCategory === 'EAP') {
            const addedCosts = mappedItems.map(item => ({
              id: item.id,
              phase: item.phase || 'Nova Fase Importada',
              budget: item.budget || 0,
              actual: item.actual || 0,
              category: item.category || 'Materiais',
              responsible: item.responsible || p.coordinator || 'Coordenador'
            }));
            const newBudget = p.previsto + addedCosts.reduce((s, c) => s + c.budget, 0);
            const newActual = p.faturado + addedCosts.reduce((s, c) => s + c.actual, 0);
            return {
              ...p,
              costs: [...p.costs, ...addedCosts],
              previsto: newBudget,
              faturado: newActual
            };
          } else if (importCategory === 'Materiais') {
            const addedMaterials = mappedItems.map(item => ({
              id: item.id,
              name: item.name || 'Insumo Importado',
              category: item.category || 'Materiais',
              qtyBudget: item.qtyBudget || 0,
              qtyUsed: item.qtyUsed || 0,
              unit: item.unit || 'un',
              supplier: item.supplier || 'A cotar',
              responsible: item.responsible || p.coordinator || 'Hugo (Mestre)'
            }));
            return {
              ...p,
              materials: [...p.materials, ...addedMaterials]
            };
          }
        }
        return p;
      }));

      if (importCategory === 'Suprimentos') {
        const addedReqs: Requisition[] = mappedItems.map(item => ({
          id: item.id,
          projectId: importDestinationProjId,
          material: item.material || 'Material Importado',
          qty: String(item.qty || '1 un'),
          date: getRelativeDate(0, 0),
          status: 'Em Cotação',
          options: [
            { supplierName: 'Depósito Central', price: 1000, deliveryDays: 2, rating: 4, isBest: true },
            { supplierName: 'Suprimentos Vale', price: 1200, deliveryDays: 1, rating: 3 }
          ]
        }));
        setRequisitions(prev => [...prev, ...addedReqs]);
      } else if (importCategory === 'Fornecedores') {
        const addedSuppliers: Supplier[] = mappedItems.map(item => ({
          id: item.id,
          name: item.name || 'Fornecedor Importado',
          rating: item.rating || 4.5,
          compliance: item.compliance || 90,
          specialty: item.specialty || 'Serviços Gerais',
          phone: item.phone || '(11) 99999-9999'
        }));
        setSuppliers(prev => [...prev, ...addedSuppliers]);
      }

      addToast(`${mappedItems.length} registros adicionados ao projeto selecionado!`, 'success');
    }

    setIsImportModalOpen(false);
  };

  const handleAnalyzePastedText = async () => {
    if (!pastedText.trim()) {
      addToast('Por favor, cole algum texto (CSV, JSON ou Tabela Markdown).', 'warning');
      return;
    }

    setIsAnalyzingImport(true);
    try {
      let parsed: string[][] = [];
      const text = pastedText.trim();
      
      if (text.startsWith('[') || text.startsWith('{')) {
        try {
          const jsonVal = JSON.parse(text);
          if (Array.isArray(jsonVal)) {
            if (Array.isArray(jsonVal[0])) {
              parsed = jsonVal;
            } else if (typeof jsonVal[0] === 'object') {
              const keys = Object.keys(jsonVal[0]);
              parsed = [keys, ...jsonVal.map((obj: any) => keys.map(k => String(obj[k] ?? '')))];
            }
          }
        } catch (e) {
          addToast('Erro ao analisar JSON. Verifique a sintaxe.', 'warning');
          setIsAnalyzingImport(false);
          return;
        }
      } else if (text.includes('|')) {
        parsed = parseMarkdownTable(text);
      } else {
        parsed = parseCSV(text);
      }

      if (!parsed || parsed.length < 2) {
        addToast('Formato não reconhecido ou dados insuficientes. Certifique-se de incluir cabeçalhos.', 'warning');
        setIsAnalyzingImport(false);
        return;
      }

      const headers = parsed[0].map(h => String(h || '').trim()).filter(Boolean);
      const rows = parsed.slice(1).map(row => row.slice(0, headers.length)).filter(row => row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''));

      if (rows.length === 0) {
        addToast('Nenhuma linha de dados encontrada no texto.', 'warning');
        setIsAnalyzingImport(false);
        return;
      }

      setImportHeaders(headers);
      setImportRows(rows);

      // Call Ollama local instance or local fallback
      try {
        const sampleRows = rows.slice(0, 3);
        const aiResponse = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3',
            prompt: `Você é uma IA especializada em analisar e estruturar planilhas para o sistema de gestão de projetos.
Analise os cabeçalhos de coluna e decida a qual das 4 categorias a planilha pertence:
- 'EAP' (tabelas de etapas, fases, orçamento e despesa)
- 'Materiais' (tabelas de levantamento de insumos e consumo técnico)
- 'Suprimentos' (tabelas de requisições de compras e compras efetuadas)
- 'Fornecedores' (tabelas de fornecedores homologados e compliance)

Mapeie os cabeçalhos originais para as chaves correspondentes permitidas de cada categoria.

Chaves permitidas:
- EAP: phase, budget, actual, category, responsible
- Materiais: name, category, qtyBudget, qtyUsed, unit, supplier, responsible
- Suprimentos: material, qty, status
- Fornecedores: name, rating, compliance, specialty, phone

Cabeçalhos originais: ${JSON.stringify(headers)}
Amostra dos dados: ${JSON.stringify(sampleRows)}

Retorne APENAS um objeto JSON válido (sem comentários ou blocos markdown de texto) no seguinte formato:
{
  "categoria": "EAP" | "Materiais" | "Suprimentos" | "Fornecedores",
  "mapeamento": {
    "NOME_COLUNA_ORIGINAL": "chave_mapeada"
  }
}`,
            stream: false,
            options: { temperature: 0.1 }
          })
        });

        if (aiResponse.ok) {
          const resJson = await aiResponse.json();
          if (resJson && resJson.response) {
            const cleanResponse = resJson.response.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedAi = JSON.parse(cleanResponse);
            if (parsedAi.categoria && parsedAi.mapeamento) {
              setImportCategory(parsedAi.categoria);
              setImportMappings(parsedAi.mapeamento);
              addToast(`Análise de IA concluída: ${parsedAi.categoria}`, 'success');
              setIsAnalyzingImport(false);
              return;
            }
          }
        }
      } catch (err) {
        // Fallback
        const localAi = localAISuggestCategoryAndMapping(headers);
        setImportCategory(localAi.category);
        setImportMappings(localAi.mapping);
        addToast(`Mapeador Inteligente Local ativado: ${localAi.category}`, 'info');
      }
    } catch (e) {
      addToast('Erro ao analisar o texto colado.', 'warning');
    }
    setIsAnalyzingImport(false);
  };

  const handleExportCSV = (data: any[], headers: string[], filename: string) => {
    // Semicolon separator with BOM is best for Excel (Portuguese Windows)
    const csvContent = "\uFEFF" + [
      headers.join(';'),
      ...data.map(row => row.map((val: any) => {
        // Escape quotes, convert line breaks to space
        const cleanVal = String(val ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
        return `"${cleanVal}"`;
      }).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    addToast('Arquivo CSV exportado com sucesso!', 'success');
    setIsExportDropdownOpen(false);
  };

  const handleExportXLS = (data: any[], headers: string[], filename: string) => {
    const colCount = headers.length;
    const getExcelColumnLetter = (colIdx: number): string => {
      let letter = '';
      let temp = colIdx;
      while (temp >= 0) {
        letter = String.fromCharCode((temp % 26) + 65) + letter;
        temp = Math.floor(temp / 26) - 1;
      }
      return letter;
    };

    // Calculate dynamic KPI card metrics
    const budgetIdx = headers.findIndex(h => h.includes('Previsto') || h.includes('Orçado') || h.includes('Custo'));
    const actualIdx = headers.findIndex(h => h.includes('Faturado') || h.includes('Realizado'));
    const deviationIdx = headers.findIndex(h => h.includes('Desvio'));

    const totalBudget = budgetIdx !== -1 ? data.reduce((sum, r) => sum + (parseFloat(String(r[budgetIdx] || '0').replace(/[^\d.-]/g, '')) || 0), 0) : 0;
    const totalActual = actualIdx !== -1 ? data.reduce((sum, r) => sum + (parseFloat(String(r[actualIdx] || '0').replace(/[^\d.-]/g, '')) || 0), 0) : 0;
    const totalDeviation = deviationIdx !== -1 ? data.reduce((sum, r) => sum + (parseFloat(String(r[deviationIdx] || '0').replace(/[^\d.-]/g, '')) || 0), 0) : 0;

    const cardSpan = Math.max(1, Math.floor((colCount - 2) / 3));
    const card3Span = colCount - 2 - (cardSpan * 2);

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Relatorio_BI</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11px; }
          
          /* Title Header Banner */
          .title-banner { background-color: #0f294a; color: #ffffff; font-size: 16px; font-weight: bold; padding: 12px; text-align: center; }
          .meta-banner { background-color: #1e3a8a; color: #e2e8f0; font-size: 10px; padding: 6px; text-align: center; }
          
          /* KPI Cards */
          .kpi-label { color: #64748b; font-size: 9px; font-weight: bold; text-transform: uppercase; }
          .kpi-value { color: #0f294a; font-size: 14px; font-weight: bold; }
          .kpi-card { border: 2px solid #e2e8f0; background-color: #f8fafc; padding: 10px; text-align: center; }
          
          /* Headers & Data Rows */
          th { background-color: #0f294a; color: #ffffff; font-weight: bold; border: 1px solid #334155; padding: 8px 12px; font-size: 11px; }
          td { border: 1px solid #cbd5e1; padding: 6px 12px; text-align: left; color: #334158; }
          tr:nth-child(even) td { background-color: #f8fafc; } /* Zebra striping */
          
          /* Aligns and Formats */
          .number { text-align: right; }
          
          /* Status Capsules */
          .status-concluido { background-color: #dcfce7; color: #16a34a; font-weight: bold; text-align: center; border-radius: 4px; }
          .status-execucao { background-color: #e0f2fe; color: #2563eb; font-weight: bold; text-align: center; border-radius: 4px; }
          .status-critico { background-color: #fee2e2; color: #b91c1c; font-weight: bold; text-align: center; border-radius: 4px; }
          
          /* Deviations Highlight */
          .deviation-alert { background-color: #fee2e2; color: #b91c1c; font-weight: bold; text-align: right; }
          
          /* Total Row */
          .total-row td { background-color: #e2e8f0; font-weight: bold; color: #0f294a; border-top: 2px solid #0f294a; border-bottom: 2px solid #0f294a; }
        </style>
      </head>
      <body>
        <table>
          <!-- 1. Title Banner Row -->
          <tr>
            <td colspan="${colCount}" class="title-banner">Manequip 360 - Relatório Operacional de Projetos</td>
          </tr>
          <!-- 2. Meta Info Row -->
          <tr>
            <td colspan="${colCount}" class="meta-banner">Gerado em: ${new Date().toLocaleString('pt-BR')} | Tipo de Relatório: ${filename.replace('.xls', '')}</td>
          </tr>
          <!-- 3. Spacing Row -->
          <tr><td colspan="${colCount}" style="border:none; height: 10px;"></td></tr>
          
          <!-- 4. KPI Cards Row (If relevant metrics are available) -->
          ${(budgetIdx !== -1 || actualIdx !== -1) ? `
          <tr>
            <td colspan="${cardSpan}" class="kpi-card">
              <span class="kpi-label">Orçamento Total</span><br/>
              <span class="kpi-value" style="mso-number-format:'\\R\\$\\ \\#\\,\\#\\#0\\.00'">R$ ${totalBudget.toFixed(2)}</span>
            </td>
            <td style="border:none;"></td>
            <td colspan="${cardSpan}" class="kpi-card">
              <span class="kpi-label">Faturado Total</span><br/>
              <span class="kpi-value" style="mso-number-format:'\\R\\$\\ \\#\\,\\#\\#0\\.00'">R$ ${totalActual.toFixed(2)}</span>
            </td>
            <td style="border:none;"></td>
            <td colspan="${card3Span}" class="kpi-card">
              <span class="kpi-label">Desvios Totais</span><br/>
              <span class="kpi-value" style="color: ${totalDeviation > 0 ? '#b91c1c' : '#16a34a'}; mso-number-format:'\\R\\$\\ \\#\\,\\#\\#0\\.00'">R$ ${totalDeviation.toFixed(2)}</span>
            </td>
          </tr>
          <!-- 5. Spacing Row -->
          <tr><td colspan="${colCount}" style="border:none; height: 15px;"></td></tr>
          ` : ''}

          <!-- 6. Table Header -->
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <!-- 7. Data Rows -->
            ${data.map(row => `
              <tr>
                ${row.map((val: any, colIdx: number) => {
                  const header = headers[colIdx];
                  const isNum = typeof val === 'number';
                  
                  // Check status
                  if (header.includes('Status')) {
                    if (val === 'Concluído') return `<td class="status-concluido">${val}</td>`;
                    if (val === 'Em Execução') return `<td class="status-execucao">${val}</td>`;
                    if (val === 'Prazos Críticos') return `<td class="status-critico">${val}</td>`;
                  }
                  
                  // Check deviations
                  if (header.includes('Desvio')) {
                    const numVal = parseFloat(String(val || '0').replace(/[^\d.-]/g, '')) || 0;
                    if (numVal > 0) {
                      return `<td class="deviation-alert" style="mso-number-format:'\\R\\$\\ \\#\\,\\#\\#0\\.00'">${val}</td>`;
                    }
                    return `<td class="number" style="mso-number-format:'\\R\\$\\ \\#\\,\\#\\#0\\.00'">${val}</td>`;
                  }
                  
                  // Currency columns
                  if (header.includes('Custo') || header.includes('Faturado') || header.includes('Orçado') || header.includes('Realizado') || header.includes('Valor')) {
                    return `<td class="number" style="mso-number-format:'\\R\\$\\ \\#\\,\\#\\#0\\.00'">${val}</td>`;
                  }

                  // Progress columns
                  if (header.includes('Progresso')) {
                    return `<td class="number" style="mso-number-format:'0%'">${val}</td>`;
                  }

                  // General Numbers
                  if (isNum) {
                    return `<td class="number">${val}</td>`;
                  }

                  return `<td>${val ?? ''}</td>`;
                }).join('')}
              </tr>
            `).join('')}

            <!-- 8. Totals Row with Live Excel Formulas -->
            <tr class="total-row">
              ${headers.map((h, colIdx) => {
                const letter = getExcelColumnLetter(colIdx);
                
                // Formulas for numeric rows start at row 7 if KPI is shown, or row 5 if not
                const kpiRowsOffset = (budgetIdx !== -1 || actualIdx !== -1) ? 6 : 4;
                const startRow = kpiRowsOffset + 1; // data starts after header
                const endRow = kpiRowsOffset + data.length;

                if (colIdx === 0) {
                  return `<td>TOTAL</td>`;
                }

                if (h.includes('Desvio') || h.includes('Custo') || h.includes('Faturado') || h.includes('Orçado') || h.includes('Realizado') || h.includes('Valor')) {
                  return `<td class="number" style="mso-number-format:'\\R\\$\\ \\#\\,\\#\\#0\\.00'">=SUM(${letter}${startRow}:${letter}${endRow})</td>`;
                }

                if (h.includes('Qtd') || h.includes('Quantidade')) {
                  return `<td class="number" style="mso-number-format:'#,##0'">=SUM(${letter}${startRow}:${letter}${endRow})</td>`;
                }

                return `<td>---</td>`;
              }).join('')}
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    addToast('Planilha Excel (.xls) exportada com sucesso!', 'success');
    setIsExportDropdownOpen(false);
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast('Janela de impressão bloqueada pelo navegador.', 'warning');
      return;
    }

    const dateStr = new Date().toLocaleString('pt-BR');
    let contentHtml = '';

    if (activeTab === 'visao-geral') {
      const activeProjName = visaoGeralProjectFilter === 'todos' ? 'Todos os Projetos (Consolidado)' : projects.find(p => p.id === visaoGeralProjectFilter)?.name;
      contentHtml = `
        <div class="report-wrapper">
          <div class="header">
            <h1>Manequip 360 - Relatório Consolidado do Portfólio</h1>
            <p class="meta-info">Gerado em: <strong>${dateStr}</strong> | Filtro de Visão: <strong>${activeProjName}</strong></p>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="card-label">Previsto Geral</div>
              <div class="card-value">R$ ${totalPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div class="card-subtext">Orçamento total alocado</div>
            </div>
            <div class="summary-card">
              <div class="card-label">Faturado Atual</div>
              <div class="card-value">R$ ${totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div class="card-subtext">${totalPrevisto > 0 ? ((totalFaturado / totalPrevisto) * 100).toFixed(1) : 0}% do total previsto</div>
            </div>
            <div class="summary-card">
              <div class="card-label">Desvios Totais</div>
              <div class="card-value text-danger">R$ ${totalDesvios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div class="card-subtext">Atenção necessária</div>
            </div>
            <div class="summary-card critical">
              <div class="card-label">Obras Ativas / Críticas</div>
              <div class="card-value">${activeCount} / <span class="text-danger">${criticalCount}</span></div>
              <div class="card-subtext">Status operacional</div>
            </div>
          </div>

          <h2>Distribuição de Desvios por Categoria</h2>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th class="text-right">Desvio Realizado (R$)</th>
                <th class="text-right">Percentual</th>
              </tr>
            </thead>
            <tbody>
              ${deviationCategories.map(cat => `
                <tr>
                  <td><strong>${cat.name}</strong></td>
                  <td class="text-right font-bold">R$ ${cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td class="text-right ${cat.value > 0 ? 'text-danger font-bold' : ''}">${totalDesvios > 0 ? ((cat.value / totalDesvios) * 100).toFixed(1) : 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>Relação de Obras e Cronogramas</h2>
          <table>
            <thead>
              <tr>
                <th>Nome do Projeto</th>
                <th>Localização</th>
                <th class="text-right">Previsto</th>
                <th class="text-right">Faturado</th>
                <th class="text-right">Desvios</th>
                <th class="text-center">Progresso</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProjects.map(p => {
                const pDesv = p.costs.reduce((sum, c) => sum + Math.max(0, c.actual - c.budget), 0);
                return `
                  <tr>
                    <td>
                      <div class="project-name">${p.name}</div>
                      <div class="project-coord">Coord: ${p.coordinator}</div>
                    </td>
                    <td>${p.location}</td>
                    <td class="text-right">R$ ${p.previsto.toLocaleString('pt-BR')}</td>
                    <td class="text-right">R$ ${p.faturado.toLocaleString('pt-BR')}</td>
                    <td class="text-right ${pDesv > 0 ? 'text-danger font-bold' : 'text-success'}">R$ ${pDesv.toLocaleString('pt-BR')}</td>
                    <td class="text-center">
                      <div class="progress-outer"><div class="progress-inner" style="width: ${p.progress}%;"></div></div>
                      <span class="progress-val">${p.progress}%</span>
                    </td>
                    <td class="text-center"><span class="badge ${p.status === 'Prazos Críticos' ? 'badge-critical' : p.status === 'Concluído' ? 'badge-success' : 'badge-execution'}">${p.status}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (activeTab === 'detalhes') {
      contentHtml = `
        <div class="report-wrapper">
          <div class="header">
            <h1>Manequip 360 - Relatório Operacional de Obra</h1>
            <p class="meta-info">Obra: <strong>${activeProject.name}</strong> | Gerado em: <strong>${dateStr}</strong></p>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="card-label">Coordenador</div>
              <div class="card-value" style="font-size: 11pt; font-weight: 600;">${activeProject.coordinator}</div>
              <div class="card-subtext">Gestão técnica</div>
            </div>
            <div class="summary-card">
              <div class="card-label">Equipe Técnica</div>
              <div class="card-value" style="font-size: 11pt; font-weight: 600;">${activeProject.team}</div>
              <div class="card-subtext">Frente de trabalho</div>
            </div>
            <div class="summary-card">
              <div class="card-label">Localização</div>
              <div class="card-value" style="font-size: 11pt; font-weight: 600;">${activeProject.location}</div>
              <div class="card-subtext">Instalações físicas</div>
            </div>
            <div class="summary-card">
              <div class="card-label">Cronograma / Status</div>
              <div class="card-value" style="font-size: 11pt; font-weight: 600;">${activeProject.progress}% (${activeProject.status})</div>
              <div class="card-subtext">Progresso físico</div>
            </div>
          </div>

          <h2>Marcos Cronológicos</h2>
          <table>
            <thead>
              <tr>
                <th>Marco do Cronograma</th>
                <th>Data Limite</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${activeProject.milestones.map(ms => `
                <tr>
                  <td class="font-bold">${ms.name}</td>
                  <td>${ms.date}</td>
                  <td class="text-center"><span class="badge ${ms.status === 'Concluído' ? 'badge-success' : ms.status === 'Em Execução' ? 'badge-execution' : ms.status === 'Atrasado' ? 'badge-critical' : 'badge-pending'}">${ms.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>EAP - Orçamentos vs Despesas Reais</h2>
          <table>
            <thead>
              <tr>
                <th>Fase / Trabalho</th>
                <th>Categoria</th>
                <th class="text-right">Previsto</th>
                <th class="text-right">Realizado</th>
                <th class="text-right">Desvio</th>
                <th>Aprovado Por</th>
              </tr>
            </thead>
            <tbody>
              ${sortedCosts.map(cost => {
                const desv = cost.actual - cost.budget;
                return `
                  <tr>
                    <td class="font-bold">${cost.phase}</td>
                    <td>${cost.category}</td>
                    <td class="text-right">R$ ${cost.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right">R$ ${cost.actual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td class="text-right ${desv > 0 ? 'text-danger font-bold' : 'text-success'}">R$ ${desv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td>${cost.responsible}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <h2>Levantamento de Materiais e Consumos</h2>
          <table>
            <thead>
              <tr>
                <th>Insumo / Serviço</th>
                <th>Categoria</th>
                <th class="text-center">Previsto vs Utilizado</th>
                <th>Fornecedor</th>
                <th>Responsável</th>
              </tr>
            </thead>
            <tbody>
              ${sortedMaterials.map(mat => {
                const exceeded = mat.qtyUsed > mat.qtyBudget;
                return `
                  <tr>
                    <td class="font-bold">${mat.name}</td>
                    <td>${mat.category}</td>
                    <td class="text-center ${exceeded ? 'text-danger font-bold' : ''}">${mat.qtyUsed} ${mat.unit} / ${mat.qtyBudget} ${mat.unit}</td>
                    <td>${mat.supplier}</td>
                    <td>${mat.responsible}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (activeTab === 'suprimentos') {
      const projRequisitions = requisitions.filter(r => r.projectId === selectedProjectId);
      const approvedRequisitions = projRequisitions.filter(r => r.status !== 'Em Cotação');
      const totalApprovedPurchases = approvedRequisitions.reduce((sum, r) => sum + (r.approvedPrice || 0), 0);
      const materialsEAPBudget = activeProject.costs.filter(c => c.category === 'Materiais').reduce((sum, c) => sum + c.budget, 0);

      contentHtml = `
        <div class="report-wrapper">
          <div class="header">
            <h1>Manequip 360 - Relatório de Suprimentos, Compras e Logística</h1>
            <p class="meta-info">Obra: <strong>${activeProject.name}</strong> | Gerado em: <strong>${dateStr}</strong></p>
          </div>

          <div class="summary-grid">
            <div class="summary-card success">
              <div class="card-label">Total Faturado em Compras</div>
              <div class="card-value">R$ ${totalApprovedPurchases.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div class="card-subtext">Insumos já faturados</div>
            </div>
            <div class="summary-card">
              <div class="card-label">Orçamento EAP (Materiais)</div>
              <div class="card-value">R$ ${materialsEAPBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div class="card-subtext">Teto de gastos da EAP</div>
            </div>
            <div class="summary-card">
              <div class="card-label">Saldo Disponível EAP</div>
              <div class="card-value">R$ ${(materialsEAPBudget - totalApprovedPurchases).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div class="card-subtext">Saldo disponível para compras</div>
            </div>
          </div>

          <h2>Histórico de Compras e Logística</h2>
          <table>
            <thead>
              <tr>
                <th>Material / Insumo</th>
                <th>Qtd</th>
                <th>Fornecedor</th>
                <th class="text-right">Valor Final</th>
                <th class="text-center">Status Logístico</th>
              </tr>
            </thead>
            <tbody>
              ${projRequisitions.filter(r => r.status !== 'Em Cotação').length === 0 ? `
                <tr>
                  <td colspan="5" class="text-center text-slate-500 py-4">Nenhuma compra faturada até o momento.</td>
                </tr>
              ` : projRequisitions.filter(r => r.status !== 'Em Cotação').map(req => `
                <tr>
                  <td class="font-bold">${req.material}</td>
                  <td>${req.qty}</td>
                  <td class="font-bold">${req.approvedSupplier}</td>
                  <td class="text-right font-bold">R$ ${req.approvedPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td class="text-center"><span class="badge ${req.status === 'Entregue' ? 'badge-success' : 'badge-execution'}">${req.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>Cotações e Mapas Comparativos de Preços</h2>
          <table>
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Opções Disponibilizadas</th>
              </tr>
            </thead>
            <tbody>
              ${projRequisitions.filter(r => r.status === 'Em Cotação').length === 0 ? `
                <tr>
                  <td colspan="2" class="text-center text-slate-500 py-4">Nenhuma cotação em aberto.</td>
                </tr>
              ` : projRequisitions.filter(r => r.status === 'Em Cotação').map(req => `
                <tr>
                  <td class="font-bold">${req.material}<span class="project-coord block">Lote: ${req.qty}</span></td>
                  <td>
                    <div class="quote-grid">
                      ${req.options.map(opt => `
                        <div class="quote-card ${opt.isBest ? 'best' : ''}">
                          <div class="quote-supplier">${opt.supplierName} ${opt.isBest ? '★' : ''}</div>
                          <div class="quote-price">R$ ${opt.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                          <div class="quote-meta">Prazo: ${opt.deliveryDays} dias | Nota: ${opt.rating}/5</div>
                        </div>
                      `).join('')}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>Fornecedores Homologados</h2>
          <table>
            <thead>
              <tr>
                <th>Razão Social</th>
                <th>Especialidade / Ramo</th>
                <th class="text-center">Compliance</th>
                <th>Telefone</th>
                <th class="text-center">Avaliação</th>
              </tr>
            </thead>
            <tbody>
              ${suppliers.map(sup => `
                <tr>
                  <td class="font-bold">${sup.name}</td>
                  <td>${sup.specialty}</td>
                  <td class="text-center font-bold text-success">${sup.compliance}%</td>
                  <td>${sup.phone}</td>
                  <td class="text-center font-bold text-warning">${sup.rating.toFixed(1)} / 5.0</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      contentHtml = `<p class="text-center py-10">Relatório indisponível para esta aba.</p>`;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Manequip 360 - Relatório Operacional</title>
          <style>
            /* Configurações Globais de Mídia Paged (A4) */
            @page {
              size: A4;
              margin: 20mm 15mm 20mm 15mm;
              background-color: #ffffff;
              
              @bottom-right {
                content: "Página " counter(page) " de " counter(pages);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 8pt;
                color: #64748b;
              }
              
              @bottom-left {
                content: "MANEQUIP 360 - INDUSTRIAL OS";
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 8pt;
                font-weight: 700;
                color: #0055aa;
              }
            }

            *, *::before, *::after {
              box-sizing: border-box;
            }

            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 0;
              font-size: 9.5pt;
              line-height: 1.6;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .report-wrapper {
              max-w: 100%;
            }

            /* Cabeçalho do Relatório */
            .header {
              border-bottom: 3px solid #0055aa;
              padding-bottom: 16px;
              margin-bottom: 24px;
              position: relative;
            }

            .header h1 {
              font-size: 18pt;
              color: #003366;
              margin: 0 0 6px 0;
              font-weight: 700;
              letter-spacing: -0.5px;
              text-transform: uppercase;
            }

            .meta-info {
              font-size: 8.5pt;
              color: #64748b;
              margin: 0;
            }

            .meta-info strong {
              color: #0f172a;
            }

            /* Grid do Resumo Executivo em layout de tabela para PDF */
            .summary-grid {
              display: table;
              width: 100%;
              margin-bottom: 24px;
              border-spacing: 12px 0;
              margin-left: -12px;
              margin-right: -12px;
            }

            .summary-card {
              display: table-cell;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-top: 4px solid #0055aa;
              padding: 12px 14px;
              width: 25%;
              vertical-align: top;
              border-radius: 6px;
            }

            .summary-card.critical {
              border-top-color: #e53e3e;
            }

            .summary-card.success {
              border-top-color: #38a169;
            }

            .card-label {
              font-size: 7.5pt;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 4px;
              font-weight: 700;
              letter-spacing: 0.5px;
            }

            .card-value {
              font-size: 13pt;
              font-weight: 700;
              color: #0f172a;
              line-height: 1.2;
            }

            .card-subtext {
              font-size: 7.5pt;
              color: #64748b;
              margin-top: 4px;
            }

            /* Títulos de Seção */
            h2 {
              font-size: 11pt;
              color: #003366;
              border-left: 4px solid #0055aa;
              padding-left: 10px;
              margin-top: 28px;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: 700;
              break-after: avoid;
              page-break-after: avoid;
            }

            /* Tabelas Formatadas */
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
              break-inside: auto;
              page-break-inside: auto;
            }

            tr {
              break-inside: avoid;
              page-break-inside: avoid;
              page-break-after: auto;
            }

            th {
              background-color: #f1f5f9;
              color: #003366;
              font-weight: 700;
              text-align: left;
              padding: 8px 12px;
              font-size: 8pt;
              border-bottom: 2px solid #cbd5e0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            td {
              padding: 8px 12px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 8.5pt;
              color: #334155;
              vertical-align: middle;
            }

            tr:nth-child(even) td {
              background-color: #f8fafc;
            }

            .text-left { text-align: left; }
            .text-right { 
              text-align: right; 
              font-variant-numeric: tabular-nums;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }

            /* Semântica e Cores */
            .text-danger { color: #b91c1c !important; }
            .text-success { color: #15803d !important; }
            .text-warning { color: #b45309 !important; }

            .project-name {
              font-weight: 700;
              color: #0f172a;
            }
            .project-coord {
              font-size: 7.5pt;
              color: #64748b;
              margin-top: 2px;
            }

            /* Badges de Status do Dashboard */
            .badge {
              display: inline-block;
              padding: 3px 8px;
              font-size: 7.5pt;
              font-weight: 700;
              border-radius: 9999px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              white-space: nowrap;
            }

            .badge-execution {
              background-color: #e0f2fe;
              color: #0369a1;
              border: 1px solid #bae6fd;
            }

            .badge-critical {
              background-color: #fee2e2;
              color: #b91c1c;
              border: 1px solid #fecaca;
            }

            .badge-success {
              background-color: #dcfce7;
              color: #15803d;
              border: 1px solid #bbf7d0;
            }

            .badge-pending {
              background-color: #f1f5f9;
              color: #475569;
              border: 1px solid #e2e8f0;
            }

            /* Barras de Progresso */
            .progress-outer {
              width: 60px;
              height: 6px;
              background-color: #e2e8f0;
              border-radius: 9999px;
              display: inline-block;
              vertical-align: middle;
              margin-right: 8px;
              overflow: hidden;
              border: 1px solid #cbd5e0;
            }

            .progress-inner {
              height: 100%;
              background-color: #0055aa;
              border-radius: 9999px;
            }

            .progress-inner.high {
              background-color: #16a34a;
            }

            .progress-val {
              font-size: 8pt;
              font-weight: 600;
              color: #475569;
              display: inline-block;
              vertical-align: middle;
            }

            /* Grid de Comparação de Cotações */
            .quote-grid {
              display: table;
              width: 100%;
              border-spacing: 8px 0;
              margin-left: -8px;
              margin-right: -8px;
            }

            .quote-card {
              display: table-cell;
              width: 33.3%;
              padding: 8px 12px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              font-size: 8pt;
            }

            .quote-card.best {
              background-color: #dcfce7;
              border-color: #bbf7d0;
              border-left: 3px solid #16a34a;
            }

            .quote-supplier {
              font-weight: 700;
              color: #0f172a;
            }

            .quote-price {
              font-size: 9pt;
              font-weight: 700;
              color: #0f172a;
              margin: 4px 0;
            }

            .quote-meta {
              color: #64748b;
            }

            /* Rodapé de logotipo institucional */
            .footer-logo-container {
              margin-top: 40px;
              padding-top: 16px;
              border-top: 1px dashed #cbd5e0;
              text-align: left;
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .footer-logo-text {
              font-size: 7.5pt;
              color: #94a3b8;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              font-weight: 700;
            }

            .no-print {
              margin-top: 30px;
              text-align: center;
            }

            @media print {
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body class="p-6 md:p-10">
          <div class="max-w-4xl mx-auto">
            ${contentHtml}

            <div class="footer-logo-container">
              <!-- 
                RESERVA PARA LOGOTIPO INSTITUCIONAL (Manequip 360 - INDUSTRIAL OS):
                Para injetar a logotipo da sua empresa no relatório impresso ou exportado para PDF:
                1. Descomente a tag <img> abaixo e insira o caminho do arquivo local, URL externa ou string Base64 no atributo src.
                2. Ajuste a largura e altura conforme a necessidade da sua marca.
              -->
              <!-- <img src="data:image/png;base64,..." alt="Logo Manequip 360" style="height: 24px; margin-bottom: 5px; display: block;" /> -->
              <div class="footer-logo-text">MANEQUIP 360 - INDUSTRIAL OS</div>
            </div>

            <div class="no-print">
              <button onclick="window.print()" style="padding: 10px 24px; background-color: #003366; color: #ffffff; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; text-transform: uppercase; font-size: 8.5pt; letter-spacing: 0.5px;">
                Imprimir Documento
              </button>
            </div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDeleteRequisition = (reqId: string) => {
    setRequisitions((prev) => prev.filter((r) => r.id !== reqId));
    setIsAddingReq(false);
    setEditingReqId(null);
    addToast('Requisição removida com sucesso.', 'warning');
  };

  const handleEditSupplier = (sup: Supplier) => {
    setEditingSupplierId(sup.id);
    setEditSupName(sup.name);
    setEditSupSpecialty(sup.specialty);
    setEditSupPhone(sup.phone);
    setEditSupCompliance(sup.compliance);
    setEditSupRating(sup.rating);
    setIsAddingSupplier(false);
  };

  const handleSaveEditSupplier = () => {
    if (!editSupName.trim()) {
      addToast('O nome do fornecedor é obrigatório.', 'warning');
      return;
    }
    setSuppliers((prev) =>
      prev.map((sup) =>
        sup.id === editingSupplierId
          ? {
              ...sup,
              name: editSupName,
              specialty: editSupSpecialty,
              phone: editSupPhone,
              compliance: editSupCompliance,
              rating: editSupRating,
            }
          : sup
      )
    );
    setEditingSupplierId(null);
    addToast('Fornecedor atualizado com sucesso!', 'success');
  };

  const handleAddNewSupplier = () => {
    if (!editSupName.trim()) {
      addToast('O nome do fornecedor é obrigatório.', 'warning');
      return;
    }
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: editSupName,
      specialty: editSupSpecialty,
      phone: editSupPhone,
      compliance: editSupCompliance,
      rating: editSupRating,
    };
    setSuppliers((prev) => [...prev, newSup]);
    setIsAddingSupplier(false);
    addToast('Novo fornecedor cadastrado com sucesso!', 'success');
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((sup) => sup.id !== id));
    setEditingSupplierId(null);
    setIsAddingSupplier(false);
    addToast('Fornecedor removido com sucesso.', 'warning');
  };

  const handleSortEAP = (column: 'phase' | 'budget' | 'actual' | 'deviation' | 'responsible') => {
    if (eapSortColumn === column) {
      setEapSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setEapSortColumn(column);
      setEapSortDirection('asc');
    }
  };

  const handleSortMaterials = (column: 'name' | 'qtyUsed' | 'qtyBudget' | 'supplier' | 'responsible') => {
    if (matSortColumn === column) {
      setMatSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setMatSortColumn(column);
      setMatSortDirection('asc');
    }
  };

  const handleAddNewColumn = () => {
    if (!newColName.trim()) return;
    const newCol: WhiteboardColumn = {
      id: `col-${Date.now()}`,
      name: newColName,
      projectId: selectedWbProjectId,
      color: newColColor,
    };
    setWbColumns((prev) => [...prev, newCol]);
    setNewColName('');
    setIsNewColModalOpen(false);
    addToast('Nova fase adicionada!', 'success');
  };

  const handleSaveEditColumn = () => {
    if (!editingColumnId || !editingColumnName.trim()) return;
    setWbColumns((prev) =>
      prev.map((c) => (c.id === editingColumnId ? { ...c, name: editingColumnName } : c))
    );
    setEditingColumnId(null);
    addToast('Fase renomeada com sucesso!', 'success');
  };

  const handleDeleteColumn = (colId: string) => {
    const projectCols = wbColumns.filter((c) => c.projectId === selectedWbProjectId);
    if (projectCols.length <= 1) {
      addToast('O projeto precisa ter pelo menos uma fase no quadro.', 'warning');
      return;
    }
    setWbColumns((prev) => prev.filter((c) => c.id !== colId));
    setNotes((prev) => prev.filter((n) => n.columnId !== colId));
    addToast('Fase e post-its associados removidos.', 'warning');
  };

  // EAP filtering and sorting
  const filteredCosts = activeProject.costs.filter((cost) => {
    const term = detailSearch.toLowerCase();
    return (
      cost.phase.toLowerCase().includes(term) ||
      cost.responsible.toLowerCase().includes(term) ||
      cost.category.toLowerCase().includes(term)
    );
  });

  const sortedCosts = [...filteredCosts].sort((a, b) => {
    if (!eapSortColumn) return 0;
    let valA: any = a[eapSortColumn];
    let valB: any = b[eapSortColumn];

    if (eapSortColumn === 'deviation') {
      valA = a.actual - a.budget;
      valB = b.actual - b.budget;
    }

    if (typeof valA === 'number' && typeof valB === 'number') {
      return eapSortDirection === 'asc' ? valA - valB : valB - valA;
    }
    return eapSortDirection === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  // Materials filtering and sorting
  const filteredMaterials = activeProject.materials.filter((mat) => {
    const term = materialSearch.toLowerCase();
    return (
      mat.name.toLowerCase().includes(term) ||
      mat.supplier.toLowerCase().includes(term) ||
      mat.responsible.toLowerCase().includes(term) ||
      mat.category.toLowerCase().includes(term)
    );
  });

  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    if (!matSortColumn) return 0;
    let valA: any = a[matSortColumn];
    let valB: any = b[matSortColumn];

    if (matSortColumn === 'qtyUsed') {
      valA = a.qtyUsed;
      valB = b.qtyUsed;
    } else if (matSortColumn === 'qtyBudget') {
      valA = a.qtyBudget;
      valB = b.qtyBudget;
    }

    if (typeof valA === 'number' && typeof valB === 'number') {
      return matSortDirection === 'asc' ? valA - valB : valB - valA;
    }
    return matSortDirection === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0f1d] relative z-10">

      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md transition-all duration-300 pointer-events-auto max-w-sm animate-fade-in ${toast.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/35 text-emerald-300'
                : toast.type === 'warning'
                  ? 'bg-rose-950/80 border-rose-500/35 text-rose-300'
                  : 'bg-cyan-950/80 border-cyan-500/35 text-cyan-300'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {toast.type === 'success' ? 'check_circle' : toast.type === 'warning' ? 'warning' : 'info'}
            </span>
            <span className="text-sm font-medium mr-2">{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-auto p-0.5 hover:bg-[#ffffff]/10 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] block">close</span>
            </button>
          </div>
        ))}
      </div>

      {/* Header and Top Tabs Navigation */}
      <div className="bg-[#111827]/60 border-b border-[#1f2937] px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0 relative z-20">
        <div>
          <h1 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00d2ff]">account_tree</span>
            Gestão de Projetos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Planejamento operacional, EAP, levantamento de insumos e cotações integradas do Manequip 360.
          </p>
        </div>

        {/* Navigation Tabs (Top) & Action */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <div className="flex bg-[#0f111a] p-1 rounded-lg border border-[#1f2937] overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('visao-geral')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold font-display transition-all shrink-0 ${activeTab === 'visao-geral'
                  ? 'bg-cyan-500/20 text-[#00d2ff] border border-cyan-500/25'
                  : 'text-slate-400 hover:text-white border border-transparent'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">dashboard</span>
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('detalhes')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold font-display transition-all shrink-0 ${activeTab === 'detalhes'
                  ? 'bg-cyan-500/20 text-[#00d2ff] border border-cyan-500/25'
                  : 'text-slate-400 hover:text-white border border-transparent'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">info</span>
              Detalhes do Projeto
            </button>
            <button
              onClick={() => setActiveTab('suprimentos')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold font-display transition-all shrink-0 ${activeTab === 'suprimentos'
                  ? 'bg-cyan-500/20 text-[#00d2ff] border border-cyan-500/25'
                  : 'text-slate-400 hover:text-white border border-transparent'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
              Suprimentos & Compras
            </button>
            <button
              onClick={() => setActiveTab('quadro-branco')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold font-display transition-all shrink-0 ${activeTab === 'quadro-branco'
                  ? 'bg-cyan-500/20 text-[#00d2ff] border border-cyan-500/25'
                  : 'text-slate-400 hover:text-white border border-transparent'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">gesture</span>
              Quadro Branco
            </button>
          </div>

          {activeTab !== 'quadro-branco' && (
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg shadow-md border border-slate-700/30 transition-all cursor-pointer shrink-0"
              title="Imprimir Relatório de Obra"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Relatório
            </button>
          )}
          <button
            onClick={() => {
              setImportHeaders([]);
              setImportRows([]);
              setPastedText('');
              setIsImportModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs rounded-lg shadow-md border border-teal-500/20 transition-all cursor-pointer shrink-0"
            title="Importar Planilha Excel, CSV, JSON ou MD"
          >
            <span className="material-symbols-outlined text-[16px]">publish</span>
            Importar Planilha
          </button>

          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-lg shadow-md border border-emerald-500/20 transition-all cursor-pointer shrink-0 animate-fade-in"
              title="Exportar dados da tela"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Exportar
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0c1222] border border-slate-800 rounded-xl shadow-2xl z-[100] p-2 space-y-2 max-h-[420px] overflow-y-auto backdrop-blur-xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-800/60 flex items-center justify-between">
                  <span>Exportar Planilha</span>
                  <span className="text-[9px] text-[#00d2ff] normal-case font-normal">Manequip 360</span>
                </div>
                
                {/* Portfolio Group */}
                <div className="space-y-0.5">
                  <div className="text-[9px] font-bold text-[#00d2ff] uppercase tracking-wider px-2 mt-1">
                    Portfólio de Projetos
                  </div>
                  <button
                    onClick={() => handleExportCSV(
                      projects.map(p => [p.id, p.name, p.location, p.previsto, p.faturado, p.desvios, p.progress + '%', p.status, p.coordinator, p.team]),
                      ['ID', 'Nome', 'Localização', 'Custo Previsto (R$)', 'Faturado Atual (R$)', 'Desvios (R$)', 'Progresso', 'Status', 'Coordenador', 'Equipe'],
                      `portfolio_projetos_${new Date().toISOString().slice(0, 10)}.csv`
                    )}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors text-slate-300 hover:bg-[#00d2ff]/10 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Projetos (CSV)</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded font-mono">CSV</span>
                  </button>
                  <button
                    onClick={() => handleExportXLS(
                      projects.map(p => [p.id, p.name, p.location, p.previsto, p.faturado, p.desvios, p.progress + '%', p.status, p.coordinator, p.team]),
                      ['ID', 'Nome', 'Localização', 'Custo Previsto (R$)', 'Faturado Atual (R$)', 'Desvios (R$)', 'Progresso', 'Status', 'Coordenador', 'Equipe'],
                      `portfolio_projetos_${new Date().toISOString().slice(0, 10)}.xls`
                    )}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors text-slate-300 hover:bg-[#00d2ff]/10 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Projetos (Excel)</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded font-mono">XLS</span>
                  </button>
                </div>

                {/* Projeto Ativo Group */}
                <div className="space-y-0.5 border-t border-slate-800/40 pt-1">
                  <div className="text-[9px] font-bold text-[#00d2ff] uppercase tracking-wider px-2">
                    Projeto Selecionado
                  </div>
                  
                  {/* Costs */}
                  <button
                    onClick={() => handleExportCSV(
                      (activeProject?.costs || []).map(c => [c.id, activeProject?.name || '', c.phase, c.category, c.budget, c.actual, c.actual - c.budget]),
                      ['ID', 'Projeto', 'Fase/Item', 'Categoria', 'Orçado (R$)', 'Realizado (R$)', 'Desvio (R$)'],
                      `eap_custos_${activeProject?.id}_${new Date().toISOString().slice(0, 10)}.csv`
                    )}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors text-slate-300 hover:bg-[#00d2ff]/10 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Orçamento EAP (CSV)</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded font-mono">CSV</span>
                  </button>
                  <button
                    onClick={() => handleExportXLS(
                      (activeProject?.costs || []).map(c => [c.id, activeProject?.name || '', c.phase, c.category, c.budget, c.actual, c.actual - c.budget]),
                      ['ID', 'Projeto', 'Fase/Item', 'Categoria', 'Orçado (R$)', 'Realizado (R$)', 'Desvio (R$)'],
                      `eap_custos_${activeProject?.id}_${new Date().toISOString().slice(0, 10)}.xls`
                    )}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors text-slate-300 hover:bg-[#00d2ff]/10 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Orçamento EAP (Excel)</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded font-mono">XLS</span>
                  </button>

                  {/* Materials */}
                  <button
                    onClick={() => handleExportCSV(
                      (activeProject?.materials || []).map(m => [m.id, activeProject?.name || '', m.name, m.category, m.qtyBudget, m.qtyUsed, m.unit, m.supplier, m.responsible]),
                      ['ID', 'Projeto', 'Nome do Material', 'Categoria', 'Qtd Orçada', 'Qtd Utilizada', 'Unidade', 'Fornecedor', 'Responsável'],
                      `materiais_${activeProject?.id}_${new Date().toISOString().slice(0, 10)}.csv`
                    )}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors text-slate-300 hover:bg-[#00d2ff]/10 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Materiais (CSV)</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded font-mono">CSV</span>
                  </button>
                  <button
                    onClick={() => handleExportXLS(
                      (activeProject?.materials || []).map(m => [m.id, activeProject?.name || '', m.name, m.category, m.qtyBudget, m.qtyUsed, m.unit, m.supplier, m.responsible]),
                      ['ID', 'Projeto', 'Nome do Material', 'Categoria', 'Qtd Orçada', 'Qtd Utilizada', 'Unidade', 'Fornecedor', 'Responsável'],
                      `materiais_${activeProject?.id}_${new Date().toISOString().slice(0, 10)}.xls`
                    )}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors text-slate-300 hover:bg-[#00d2ff]/10 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Materiais (Excel)</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded font-mono">XLS</span>
                  </button>
                </div>

                {/* Requisitions and Suppliers Group */}
                <div className="space-y-0.5 border-t border-slate-800/40 pt-1">
                  <div className="text-[9px] font-bold text-[#00d2ff] uppercase tracking-wider px-2">
                    Suprimentos & Compras
                  </div>
                  
                  {/* Requisitions */}
                  <button
                    onClick={() => handleExportCSV(
                      requisitions.map(r => {
                        const projName = projects.find(p => p.id === r.projectId)?.name || 'Desconhecido';
                        return [r.id, r.projectId, projName, r.material, r.qty, r.date, r.status, r.approvedSupplier || '---', r.approvedPrice || 0];
                      }),
                      ['ID', 'Projeto ID', 'Nome do Projeto', 'Material', 'Quantidade', 'Data', 'Status', 'Fornecedor Aprovado', 'Valor Aprovado'],
                      `requisicoes_compra_${new Date().toISOString().slice(0, 10)}.csv`
                    )}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors text-slate-300 hover:bg-[#00d2ff]/10 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Requisições (CSV)</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded font-mono">CSV</span>
                  </button>
                  <button
                    onClick={() => handleExportXLS(
                      requisitions.map(r => {
                        const projName = projects.find(p => p.id === r.projectId)?.name || 'Desconhecido';
                        return [r.id, r.projectId, projName, r.material, r.qty, r.date, r.status, r.approvedSupplier || '---', r.approvedPrice || 0];
                      }),
                      ['ID', 'Projeto ID', 'Nome do Projeto', 'Material', 'Quantidade', 'Data', 'Status', 'Fornecedor Aprovado', 'Valor Aprovado'],
                      `requisicoes_compra_${new Date().toISOString().slice(0, 10)}.xls`
                    )}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors text-slate-300 hover:bg-[#00d2ff]/10 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Requisições (Excel)</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded font-mono">XLS</span>
                  </button>

                  {/* Suppliers */}
                  <button
                    onClick={() => handleExportCSV(
                      suppliers.map(s => [s.id, s.name, s.rating, s.compliance + '%', s.specialty, s.phone]),
                      ['ID', 'Nome do Fornecedor', 'Avaliação', 'Compliance', 'Especialidade', 'Telefone'],
                      `fornecedores_${new Date().toISOString().slice(0, 10)}.csv`
                    )}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors text-slate-300 hover:bg-[#00d2ff]/10 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Fornecedores (CSV)</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded font-mono">CSV</span>
                  </button>
                  <button
                    onClick={() => handleExportXLS(
                      suppliers.map(s => [s.id, s.name, s.rating, s.compliance + '%', s.specialty, s.phone]),
                      ['ID', 'Nome do Fornecedor', 'Avaliação', 'Compliance', 'Especialidade', 'Telefone'],
                      `fornecedores_${new Date().toISOString().slice(0, 10)}.xls`
                    )}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors text-slate-300 hover:bg-[#00d2ff]/10 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Fornecedores (Excel)</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded font-mono">XLS</span>
                  </button>
                </div>

                {/* Whiteboard Notes Group */}
                <div className="space-y-0.5 border-t border-slate-800/40 pt-1">
                  <div className="text-[9px] font-bold text-[#00d2ff] uppercase tracking-wider px-2">
                    Quadro Branco
                  </div>
                  <button
                    onClick={() => handleExportCSV(
                      notes.filter(n => n.projectId === activeProject?.id).map(n => {
                        const colName = wbColumns.find(c => c.id === n.columnId)?.name || 'Desconhecido';
                        return [n.id, n.text, n.type, colName];
                      }),
                      ['ID', 'Texto da Nota', 'Tipo', 'Coluna / Fase'],
                      `quadro_branco_${activeProject?.id}_${new Date().toISOString().slice(0, 10)}.csv`
                    )}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors text-slate-300 hover:bg-[#00d2ff]/10 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Quadro Branco (CSV)</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded font-mono">CSV</span>
                  </button>
                  <button
                    onClick={() => handleExportXLS(
                      notes.filter(n => n.projectId === activeProject?.id).map(n => {
                        const colName = wbColumns.find(c => c.id === n.columnId)?.name || 'Desconhecido';
                        return [n.id, n.text, n.type, colName];
                      }),
                      ['ID', 'Texto da Nota', 'Tipo', 'Coluna / Fase'],
                      `quadro_branco_${activeProject?.id}_${new Date().toISOString().slice(0, 10)}.xls`
                    )}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors text-slate-300 hover:bg-[#00d2ff]/10 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>Quadro Branco (Excel)</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded font-mono">XLS</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setNewProjName('');
              setNewProjLocation('');
              setNewProjPrevisto(0);
              setNewProjFaturado(0);
              setNewProjProgress(0);
              setNewProjStatus('Em Execução');
              setNewProjCoordinator('');
              setNewProjTeam('');
              setIsNewProjectModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00d2ff] hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all cursor-pointer shrink-0"
            title="Adicionar Novo Projeto"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Novo Projeto
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative">

        {/* ========================================================================= */}
        {/* 1ª TAB: VISÃO GERAL (PORTFOLIO DASHBOARD) */}
        {/* ========================================================================= */}
        {activeTab === 'visao-geral' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Toolbar / Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-[#111827]/40 p-4 rounded-xl border border-[#1f2937]/75">
              <div className="text-sm font-semibold text-white">
                {visaoGeralProjectFilter === 'todos'
                  ? 'Consolidado Financeiro do Portfólio'
                  : `Dashboard - ${projects.find((p) => p.id === visaoGeralProjectFilter)?.name}`}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Project Filter */}
                <div className="flex items-center gap-1.5 bg-[#0a0f1d] px-2.5 py-1.5 rounded-lg border border-[#1f2937]">
                  <span className="material-symbols-outlined text-[14px] text-[#00d2ff]">folder</span>
                  <select
                    value={visaoGeralProjectFilter}
                    onChange={(e) => setVisaoGeralProjectFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-300 outline-none border-none cursor-pointer"
                  >
                    <option value="todos" className="bg-[#0f111a]">Visão: Todos os Projetos (Consolidado)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#0f111a]">
                        Visão: {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Calendar Period Filter */}
                <div className="relative" ref={calFilterRef}>
                  <button
                    onClick={() => setCalFilterOpen(!calFilterOpen)}
                    className={`flex items-center gap-1.5 bg-[#0a0f1d] px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      calFilterOpen || calFilterYear !== null || calFilterMonth !== null || calFilterDay !== null
                        ? 'border-[#00d2ff]/50 text-[#00d2ff]'
                        : 'border-[#1f2937] text-slate-300 hover:border-[#00d2ff]/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px] text-[#00d2ff]">calendar_today</span>
                    <span className="text-xs font-bold">
                      {calFilterYear !== null || calFilterMonth !== null || calFilterDay !== null
                        ? [
                            calFilterDay !== null ? String(calFilterDay).padStart(2, '0') : null,
                            calFilterMonth !== null ? getPortugueseMonthName(calFilterMonth + 1).substring(0, 3) : null,
                            calFilterYear !== null ? calFilterYear : null,
                          ].filter(Boolean).join(' / ')
                        : `Período: ${getPortugueseMonthName(new Date().getMonth() + 1)} ${new Date().getFullYear()}`
                      }
                    </span>
                    <span className="material-symbols-outlined text-[12px] text-slate-400 ml-0.5">expand_more</span>
                  </button>

                  {/* Calendar Dropdown Panel */}
                  {calFilterOpen && (
                    <div className="absolute top-full right-0 mt-2 w-[320px] bg-[#111827] border border-[#1f2937] rounded-xl shadow-2xl z-50 animate-fade-in overflow-hidden">
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-[#1f2937] flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Filtrar por Período</span>
                        {(calFilterYear !== null || calFilterMonth !== null || calFilterDay !== null) && (
                          <button
                            onClick={() => { setCalFilterYear(null); setCalFilterMonth(null); setCalFilterDay(null); }}
                            className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[12px]">restart_alt</span>
                            Limpar
                          </button>
                        )}
                      </div>

                      {/* Year Selector */}
                      <div className="px-4 py-3 border-b border-[#1f2937]/50">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ano</label>
                        <div className="flex flex-wrap gap-1.5">
                          {[new Date().getFullYear() - 2, new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((yr) => (
                            <button
                              key={yr}
                              onClick={() => setCalFilterYear(calFilterYear === yr ? null : yr)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                calFilterYear === yr
                                  ? 'bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/40'
                                  : 'bg-[#0a0f1d] text-slate-400 border border-[#1f2937] hover:border-[#00d2ff]/30 hover:text-slate-200'
                              }`}
                            >
                              {yr}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Month Selector */}
                      <div className="px-4 py-3 border-b border-[#1f2937]/50">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mês</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, idx) => (
                            <button
                              key={m}
                              onClick={() => setCalFilterMonth(calFilterMonth === idx ? null : idx)}
                              className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                calFilterMonth === idx
                                  ? 'bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/40'
                                  : idx === new Date().getMonth() && calFilterMonth === null
                                    ? 'bg-[#0a0f1d] text-slate-200 border border-[#1f2937] ring-1 ring-[#00d2ff]/20'
                                    : 'bg-[#0a0f1d] text-slate-400 border border-[#1f2937] hover:border-[#00d2ff]/30 hover:text-slate-200'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Day Selector */}
                      <div className="px-4 py-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Dia</label>
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                            <button
                              key={d}
                              onClick={() => setCalFilterDay(calFilterDay === d ? null : d)}
                              className={`w-full aspect-square flex items-center justify-center rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                calFilterDay === d
                                  ? 'bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/40'
                                  : d === new Date().getDate() && calFilterDay === null && calFilterMonth === null
                                    ? 'bg-[#0a0f1d] text-slate-200 border border-[#1f2937] ring-1 ring-[#00d2ff]/20'
                                    : 'bg-[#0a0f1d] text-slate-400 border border-[#1f2937] hover:border-[#00d2ff]/30 hover:text-slate-200'
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-3 border-t border-[#1f2937] bg-[#0f111a]/50 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          {calFilterYear === null && calFilterMonth === null && calFilterDay === null
                            ? 'Selecione ano, mês ou dia para filtrar'
                            : 'Filtro aplicado – clique novamente para desselecionar'}
                        </span>
                        <button
                          onClick={() => setCalFilterOpen(false)}
                          className="px-3 py-1 rounded-lg bg-[#00d2ff]/10 hover:bg-[#00d2ff]/25 border border-[#00d2ff]/20 text-[#00d2ff] text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 bg-[#0a0f1d] px-2.5 py-1.5 rounded-lg border border-[#1f2937]">
                  <span className="material-symbols-outlined text-[14px] text-[#00d2ff]">filter_list</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-transparent text-xs font-bold text-slate-300 outline-none border-none cursor-pointer"
                  >
                    <option value="todos" className="bg-[#0f111a]">Status: Todos</option>
                    <option value="execucao" className="bg-[#0f111a]">Em Execução</option>
                    <option value="concluidos" className="bg-[#0f111a]">Concluídos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* KPI Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Previsto */}
              <div className="bg-[#111827]/70 border border-[#1f2937] rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-[#00d2ff]/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-15 text-[#00d2ff]">
                  <span className="material-symbols-outlined text-[64px]">attach_money</span>
                </div>
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Previsto Escopo Geral</h3>
                <p className="text-2xl font-bold font-display text-[#00d2ff] mt-2">
                  R$ {totalPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                  <span className="material-symbols-outlined text-[12px] text-[#00d2ff]">info</span>
                  Soma total planejada para obras ativas
                </div>
              </div>

              {/* Card 2: Faturado */}
              <div className="bg-[#111827]/70 border border-[#1f2937] rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-15 text-emerald-500">
                  <span className="material-symbols-outlined text-[64px]">price_check</span>
                </div>
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Medições Faturadas</h3>
                <p className="text-2xl font-bold font-display text-emerald-400 mt-2">
                  R$ {totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-400 font-semibold">
                  <span className="material-symbols-outlined text-[12px]">trending_up</span>
                  {((totalFaturado / (totalPrevisto || 1)) * 100).toFixed(1)}% do total planejado liberado
                </div>
              </div>

              {/* Card 3: Desvios */}
              <div className="bg-[#111827]/70 border border-[#1f2937] rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-15 text-rose-500">
                  <span className="material-symbols-outlined text-[64px]">warning</span>
                </div>
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Desvios de Custo</h3>
                <p className="text-2xl font-bold font-display text-rose-400 mt-2">
                  R$ {totalDesvios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className={`flex items-center gap-1 mt-2 text-[10px] font-semibold ${totalDesvios > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                  <span className="material-symbols-outlined text-[12px]">{totalDesvios > 0 ? 'error' : 'check_circle'}</span>
                  {totalDesvios > 0 ? 'Custos extras não previstos identificados' : 'Nenhum estouro financeiro no período'}
                </div>
              </div>

              {/* Card 4: Prazos / Projetos */}
              <div className="bg-[#111827]/70 border border-[#1f2937] rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-15 text-cyan-400">
                  <span className="material-symbols-outlined text-[64px]">engineering</span>
                </div>
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Projetos Ativos / Críticos</h3>
                <p className="text-2xl font-bold font-display text-white mt-2">
                  {activeCount} <span className="text-slate-500 text-lg">/</span> <span className="text-rose-400">{criticalCount}</span>
                </p>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                  <span className="material-symbols-outlined text-[12px] text-rose-400 animate-pulse">alarm</span>
                  {criticalCount} obra em atraso ou prazo crítico
                </div>
              </div>
            </div>

            {/* Central BI Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trend Chart - Previsto vs Faturado vs Tendência */}
              <div className="lg:col-span-2 bg-[#111827]/70 border border-[#1f2937] rounded-xl p-5 shadow-md flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">Linha de Tendência de Margem e Faturamento</h3>
                  <p className="text-xs text-slate-400 mt-1">Evolução financeira e estimativa preditiva para os próximos meses.</p>
                </div>

                {/* Responsive Chart Container with explicit height to prevent collapses */}
                <div className="h-[280px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                      <defs>
                        <linearGradient id="colorFaturado" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v / 1000}k`} />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '10px' }} />

                      {/* Bar for Realized Faturamento */}
                      <Bar dataKey="faturado" name="Faturado Real" fill="url(#colorFaturado)" stroke="#10b981" strokeWidth={1} radius={[4, 4, 0, 0]} />

                      {/* Line for Previsto Base */}
                      <Line type="monotone" dataKey="previsto" name="Previsto Escopo" stroke="#00d2ff" strokeWidth={2} dot={{ r: 3 }} />

                      {/* Dashed Line for Trend projection */}
                      <Line type="monotone" dataKey="tendencia" name="Tendência (Velocidade Gastos)" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Rosca Chart: Deviations distribution */}
              <div className="bg-[#111827]/70 border border-[#1f2937] rounded-xl p-5 shadow-md flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">Desvios por Categoria</h3>
                  <p className="text-xs text-slate-400 mt-1">Detalhamento dos R$ {totalDesvios.toLocaleString('pt-BR')} em custos excedentes.</p>
                </div>

                <div className="h-[200px] w-full relative flex items-center justify-center mt-2">
                  <div className="absolute inset-0 z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviationCategories}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {deviationCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip />} position={{ y: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Total indicator inside donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Total Desvios</span>
                    <span className="text-lg font-extrabold text-rose-400 mt-0.5">
                      R$ {totalDesvios >= 1000 ? `${(totalDesvios / 1000).toFixed(0)}k` : totalDesvios}
                    </span>
                  </div>
                </div>

                {/* Legends list */}
                <div className="space-y-1.5 mt-2">
                  {deviationCategories.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="size-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                        {cat.name}
                      </div>
                      <span className="font-bold text-slate-100">
                        R$ {cat.value.toLocaleString('pt-BR')} ({totalDesvios > 0 ? ((cat.value / totalDesvios) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Portfolio Table - Project List */}
            <div className="bg-[#111827]/70 border border-[#1f2937] rounded-xl overflow-hidden shadow-md">
              <div className="px-5 py-4 border-b border-[#1f2937] flex items-center justify-between bg-[#111827]/30">
                <span className="text-sm font-semibold text-white">Status do Cronograma e Faturamento Geral</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-[#00d2ff] border border-cyan-500/20 uppercase">
                  {filteredProjects.length} Projetos Ativos
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1f2937] text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-[#0f111a]/40">
                      <th className="py-3 px-4">Projeto</th>
                      <th className="py-3 px-4">Localização</th>
                      <th className="py-3 px-4 text-right">Previsto</th>
                      <th className="py-3 px-4 text-right">Faturado Atual</th>
                      <th className="py-3 px-4 text-right">Margem / Desvio</th>
                      <th className="py-3 px-4">Cronograma</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f2937]/50 text-xs">
                    {filteredProjects.map((proj) => {
                      const projDesvios = proj.costs.reduce((sum, c) => sum + Math.max(0, c.actual - c.budget), 0);
                      const desvioRatio = projDesvios > 0 ? (projDesvios / proj.previsto) * 100 : 0;

                      return (
                        <tr key={proj.id} className="hover:bg-[#1f2937]/20 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-200">
                            {proj.name}
                            <span className="block text-[10px] text-slate-500 font-normal mt-0.5">Coord: {proj.coordinator}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 max-w-[150px] truncate">{proj.location}</td>
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-200">
                            R$ {proj.previsto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-200">
                            R$ {proj.faturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {projDesvios > 0 ? (
                              <span className="text-rose-400 font-bold">
                                +R$ {projDesvios.toLocaleString('pt-BR')} (+{desvioRatio.toFixed(0)}%)
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-medium">✓ Em conformidade</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {/* Custom progress bar */}
                              <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${proj.status === 'Prazos Críticos'
                                      ? 'bg-rose-500'
                                      : proj.status === 'Concluído'
                                        ? 'bg-emerald-500'
                                        : 'bg-[#00d2ff]'
                                    }`}
                                  style={{ width: `${proj.progress}%` }}
                                ></div>
                              </div>
                              <span className="font-bold text-[10px] text-slate-300">{proj.progress}%</span>

                              {/* Status Tag */}
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${proj.status === 'Prazos Críticos'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : proj.status === 'Concluído'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/20'
                                }`}>
                                {proj.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleAccessProject(proj.id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00d2ff]/10 hover:bg-[#00d2ff]/25 border border-[#00d2ff]/20 text-[#00d2ff] text-[10px] font-bold uppercase transition-all"
                              >
                                <span className="material-symbols-outlined text-[12px]">visibility</span>
                                Acessar
                              </button>
                              <button
                                onClick={() => handleStartEditProject(proj)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] font-bold uppercase transition-all animate-pulse"
                              >
                                <span className="material-symbols-outlined text-[12px]">edit</span>
                                Editar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2ª TAB: DETALHES DO PROJETO (VISÃO INDIVIDUAL) */}
        {/* ========================================================================= */}
        {activeTab === 'detalhes' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Selector Panel */}
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-[#111827]/40 p-4 rounded-xl border border-[#1f2937]/75 gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selecionar Obra:</span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-[#0f111a] text-xs font-bold text-[#00d2ff] outline-none border border-[#1f2937] px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#0f111a]">
                      {p.name} ({p.location.split(',')[0]})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleStartEditProject(activeProject)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[#00d2ff] hover:text-white rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                  title="Configurar / Editar este Projeto"
                >
                  <span className="material-symbols-outlined text-[16px]">settings</span>
                </button>
              </div>

              {/* Quick info row */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="text-slate-400">
                  <span className="font-bold text-slate-200">Coordenador:</span> {activeProject.coordinator}
                </div>
                <div className="size-1 bg-[#1f2937] rounded-full hidden sm:block"></div>
                <div className="text-slate-400">
                  <span className="font-bold text-slate-200">Frente/Equipe:</span> {activeProject.team}
                </div>
              </div>
            </div>

            {/* Milestones Gantt Timeline */}
            <div className="bg-[#111827]/70 border border-[#1f2937] rounded-xl p-5 shadow-md">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Cronograma de Marcos Críticos (Gantt Simplificado)</h3>

              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 mt-2">
                {/* Connecting Line (Desktop) */}
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-[#1f2937] -translate-y-1/2 hidden md:block z-0"></div>

                {activeProject.milestones.map((ms, index) => {
                  let badgeColor = 'bg-slate-800 text-slate-400 border border-slate-700';
                  let icon = 'schedule';

                  if (ms.status === 'Concluído') {
                    badgeColor = 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30';
                    icon = 'check_circle';
                  } else if (ms.status === 'Em Execução') {
                    badgeColor = 'bg-cyan-950/80 text-cyan-400 border border-[#00d2ff]/30 animate-pulse';
                    icon = 'pending';
                  } else if (ms.status === 'Atrasado') {
                    badgeColor = 'bg-rose-950/80 text-rose-400 border border-rose-500/30';
                    icon = 'error';
                  }

                  return (
                    <div
                      key={ms.id}
                      onClick={() => handleStartEditMilestone(ms)}
                      className="relative z-10 flex md:flex-col items-center gap-3 md:gap-2 flex-1 w-full md:w-auto cursor-pointer group hover:scale-105 transition-all"
                      title="Clique para editar marco"
                    >
                      {/* Step Circle */}
                      <div className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${badgeColor} group-hover:border-cyan-400/50`}>
                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                      </div>

                      {/* Text info */}
                      <div className="text-left md:text-center">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">{ms.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{ms.date} - <span className="font-semibold">{ms.status}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* EAP and Budget Details Panel */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* EAP Table */}
              <div className="bg-[#111827]/70 border border-[#1f2937] rounded-xl overflow-hidden shadow-md">
                <div className="px-5 py-4 border-b border-[#1f2937] flex flex-col sm:flex-row sm:items-center justify-between bg-[#111827]/30 gap-3">
                  <span className="text-sm font-semibold text-white">EAP - Orçamentos vs Despesas Reais por Fase</span>

                  <div className="flex items-center gap-3">
                    {/* EAP Search Bar */}
                    <div className="flex items-center gap-1.5 bg-[#0a0f1d] px-2.5 py-1 rounded-lg border border-[#1f2937]">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">search</span>
                      <input
                        type="text"
                        placeholder="Pesquisar fase..."
                        value={detailSearch}
                        onChange={(e) => setDetailSearch(e.target.value)}
                        className="bg-transparent text-xs text-slate-200 outline-none border-none w-28 sm:w-48 md:w-56 transition-all duration-300 focus:w-36 sm:focus:w-56 md:focus:w-64"
                      />
                    </div>
                    {/* Add Item Button */}
                    <button
                      onClick={() => {
                        setEditCostPhase('');
                        setEditCostBudget(0);
                        setEditCostActual(0);
                        setEditCostResponsible('');
                        setEditCostCategory('Materiais');
                        setIsAddingCost(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#00d2ff] hover:bg-cyan-400 text-slate-950 font-bold text-[10px] rounded uppercase shadow-sm transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      Adicionar Item
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1f2937] text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-[#0f111a]/40">
                        <th className="py-3 px-4 cursor-pointer hover:bg-slate-800/40 transition-colors" onClick={() => handleSortEAP('phase')}>
                          <div className="flex items-center gap-1">
                            Fase / Pacote de Trabalho
                            {eapSortColumn === 'phase' && (
                              <span className="material-symbols-outlined text-[12px]">{eapSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-800/40 transition-colors" onClick={() => handleSortEAP('budget')}>
                          <div className="flex items-center justify-end gap-1">
                            Previsto
                            {eapSortColumn === 'budget' && (
                              <span className="material-symbols-outlined text-[12px]">{eapSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-800/40 transition-colors" onClick={() => handleSortEAP('actual')}>
                          <div className="flex items-center justify-end gap-1">
                            Realizado
                            {eapSortColumn === 'actual' && (
                              <span className="material-symbols-outlined text-[12px]">{eapSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 text-right cursor-pointer hover:bg-slate-800/40 transition-colors" onClick={() => handleSortEAP('deviation')}>
                          <div className="flex items-center justify-end gap-1">
                            Desvio
                            {eapSortColumn === 'deviation' && (
                              <span className="material-symbols-outlined text-[12px]">{eapSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 cursor-pointer hover:bg-slate-800/40 transition-colors" onClick={() => handleSortEAP('responsible')}>
                          <div className="flex items-center gap-1">
                            Aprovado por
                            {eapSortColumn === 'responsible' && (
                              <span className="material-symbols-outlined text-[12px]">{eapSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f2937]/50 text-xs">
                      {sortedCosts.map((cost) => {
                        const desvio = cost.actual - cost.budget;

                        return (
                          <tr key={cost.id} className="hover:bg-[#1f2937]/20 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-200">{cost.phase}</td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-300">
                              R$ {cost.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-300">
                              R$ {cost.actual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {desvio > 0 ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-rose-400 font-bold">
                                    +R$ {desvio.toLocaleString('pt-BR')}
                                  </span>
                                  <span className="text-[8px] bg-rose-950/80 text-rose-400 px-1 py-0.5 rounded mt-0.5 font-extrabold uppercase border border-rose-500/20">
                                    Desvio de Escopo
                                  </span>
                                </div>
                              ) : (
                                <span className="text-emerald-400 font-medium">✓ Dentro da Meta</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-400 font-medium">{cost.responsible}</td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleStartEditCost(cost)}
                                className="p-1 hover:bg-[#ffffff]/10 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Editar Linha"
                              >
                                <span className="material-symbols-outlined text-[14px] block">edit</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Materials Consumption & Track */}
              <div className="bg-[#111827]/70 border border-[#1f2937] rounded-xl overflow-hidden shadow-md">
                <div className="px-5 py-4 border-b border-[#1f2937] flex flex-col sm:flex-row sm:items-center justify-between bg-[#111827]/30 gap-3">
                  <span className="text-sm font-semibold text-white">Levantamento de Materiais e Consumo</span>

                  <div className="flex items-center gap-3">
                    {/* Materials Search Bar */}
                    <div className="flex items-center gap-1.5 bg-[#0a0f1d] px-2.5 py-1 rounded-lg border border-[#1f2937]">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">search</span>
                      <input
                        type="text"
                        placeholder="Pesquisar insumo..."
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        className="bg-transparent text-xs text-slate-200 outline-none border-none w-28 sm:w-48 md:w-56 transition-all duration-300 focus:w-36 sm:focus:w-56 md:focus:w-64"
                      />
                    </div>
                    {/* Add Material Button */}
                    <button
                      onClick={() => {
                        setEditMaterialName('');
                        setEditMaterialQtyBudget(0);
                        setEditMaterialQtyUsed(0);
                        setEditMaterialUnit('');
                        setEditMaterialSupplier('');
                        setEditMaterialResponsible('');
                        setEditMaterialCategory('Materiais');
                        setIsAddingMaterial(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#00d2ff] hover:bg-cyan-400 text-slate-950 font-bold text-[10px] rounded uppercase shadow-sm transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      Adicionar Insumo
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1f2937] text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-[#0f111a]/40">
                        <th className="py-3 px-4 cursor-pointer hover:bg-slate-800/40 transition-colors" onClick={() => handleSortMaterials('name')}>
                          <div className="flex items-center gap-1">
                            Insumo / Serviço
                            {matSortColumn === 'name' && (
                              <span className="material-symbols-outlined text-[12px]">{matSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 text-center cursor-pointer hover:bg-slate-800/40 transition-colors" onClick={() => handleSortMaterials('qtyUsed')}>
                          <div className="flex items-center justify-center gap-1">
                            Previsto vs Utilizado
                            {matSortColumn === 'qtyUsed' && (
                              <span className="material-symbols-outlined text-[12px]">{matSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 cursor-pointer hover:bg-slate-800/40 transition-colors" onClick={() => handleSortMaterials('supplier')}>
                          <div className="flex items-center gap-1">
                            Fornecedor Atual
                            {matSortColumn === 'supplier' && (
                              <span className="material-symbols-outlined text-[12px]">{matSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 cursor-pointer hover:bg-slate-800/40 transition-colors" onClick={() => handleSortMaterials('responsible')}>
                          <div className="flex items-center gap-1">
                            Responsável Técnico
                            {matSortColumn === 'responsible' && (
                              <span className="material-symbols-outlined text-[12px]">{matSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f2937]/50 text-xs">
                      {sortedMaterials.map((mat) => {
                        const ratio = mat.qtyBudget > 0 ? (mat.qtyUsed / mat.qtyBudget) * 100 : 0;
                        const hasExceeded = ratio > 100;

                        return (
                          <tr key={mat.id} className="hover:bg-[#1f2937]/20 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-200">
                              {mat.name}
                              <span className="block text-[10px] text-slate-500 font-normal mt-0.5">{mat.category}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1 min-w-[120px]">
                                <div className="flex items-center justify-between font-semibold text-[10px]">
                                  <span className="text-slate-300">
                                    {mat.qtyUsed} {mat.unit}
                                  </span>
                                  <span className="text-slate-500">
                                    Meta: {mat.qtyBudget} {mat.unit}
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${hasExceeded ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min(ratio, 100)}%` }}
                                  ></div>
                                </div>
                                <span className={`text-[9px] font-bold ${hasExceeded ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {hasExceeded ? `⚠️ +${(ratio - 100).toFixed(0)}% de desvio` : '✓ Consumo normal'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 font-medium">{mat.supplier}</td>
                            <td className="py-3.5 px-4 text-slate-400">{mat.responsible}</td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => handleStartEditMaterial(mat)}
                                className="p-1 hover:bg-[#ffffff]/10 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Editar Insumo"
                              >
                                <span className="material-symbols-outlined text-[14px] block">edit</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3ª TAB: SUPRIMENTOS E COMPRAS (WORKFLOW DE COMPRAS) */}
        {/* ========================================================================= */}
        {activeTab === 'suprimentos' && (() => {
          const projRequisitions = requisitions.filter(r => r.projectId === selectedProjectId);
          const approvedRequisitions = projRequisitions.filter(r => r.status !== 'Em Cotação');
          const totalApprovedPurchases = approvedRequisitions.reduce((sum, r) => sum + (r.approvedPrice || 0), 0);
          
          const materialsEAPBudget = activeProject.costs
            .filter(c => c.category === 'Materiais')
            .reduce((sum, c) => sum + c.budget, 0);

          const pendingQuotesCount = projRequisitions.filter(r => r.status === 'Em Cotação').length;
          const deliveryAwaitingCount = projRequisitions.filter(r => r.status === 'Aguardando Entrega').length;
          const deliveredCount = projRequisitions.filter(r => r.status === 'Entregue').length;

          const uniquePartners = Array.from(new Set(approvedRequisitions.map(r => r.approvedSupplier).filter(Boolean)));

          return (
            <div className="space-y-6 animate-fade-in">
              {/* Project selector toolbar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-[#111827]/40 p-4 rounded-xl border border-[#1f2937]/75">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selecionar Projeto:</span>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="bg-[#0a0f1d] text-xs font-bold text-[#00d2ff] outline-none border border-[#1f2937] px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#0f111a]">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    clearReqForm();
                    setIsAddingReq(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00d2ff] hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                  Nova Requisição
                </button>
              </div>

              {/* Purchase BI Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111827]/70 border border-[#1f2937] rounded-xl p-5 shadow-lg relative overflow-hidden hover:border-[#00d2ff]/30 transition-all duration-300">
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Aprovado (Compras)</h3>
                  <p className="text-2xl font-bold font-display text-emerald-400 mt-2">
                    R$ {totalApprovedPurchases.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                    Comprado de {uniquePartners.length} parceiros homologados
                  </div>
                </div>

                <div className="bg-[#111827]/70 border border-[#1f2937] rounded-xl p-5 shadow-lg relative overflow-hidden hover:border-[#00d2ff]/30 transition-all duration-300">
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Teto Orçamentário EAP</h3>
                  <p className="text-2xl font-bold font-display text-[#00d2ff] mt-2">
                    R$ {materialsEAPBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className={`flex items-center gap-1 mt-2 text-[10px] font-semibold ${totalApprovedPurchases > materialsEAPBudget ? 'text-rose-400' : 'text-emerald-450'}`}>
                    {totalApprovedPurchases > materialsEAPBudget 
                      ? '⚠️ Orçamento de Materiais Excedido!' 
                      : `✓ Saldo disponível: R$ ${(materialsEAPBudget - totalApprovedPurchases).toLocaleString('pt-BR')}`
                    }
                  </div>
                </div>

                <div className="bg-[#111827]/70 border border-[#1f2937] rounded-xl p-5 shadow-lg relative overflow-hidden hover:border-[#00d2ff]/30 transition-all duration-300">
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Entregas Pendentes</h3>
                  <p className="text-2xl font-bold font-display text-amber-400 mt-2">
                    {deliveryAwaitingCount} <span className="text-xs text-slate-500 font-normal">aguardando transporte</span>
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                    {deliveredCount} lotes já recebidos em canteiro
                  </div>
                </div>

                <div className="bg-[#111827]/70 border border-[#1f2937] rounded-xl p-5 shadow-lg relative overflow-hidden hover:border-[#00d2ff]/30 transition-all duration-300">
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Cotações Ativas</h3>
                  <p className="text-2xl font-bold font-display text-cyan-400 mt-2">
                    {pendingQuotesCount} <span className="text-xs text-slate-500 font-normal">em andamento</span>
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                    Aguardando homologação de menor preço
                  </div>
                </div>
              </div>

              {/* Comparative quotes panel */}
              {projRequisitions.filter(r => r.status === 'Em Cotação').length > 0 && (
                <div className="bg-[#111827]/70 border border-[#1f2937] rounded-xl p-5 shadow-md">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 font-display">
                    <span className="material-symbols-outlined text-[#00d2ff]">compare_arrows</span>
                    Mapa de Cotações Competitivas de Fornecedores (Em Aberto)
                  </h3>

                  <div className="space-y-6">
                    {projRequisitions
                      .filter((r) => r.status === 'Em Cotação')
                      .map((req) => (
                        <div key={req.id} className="p-4 rounded-lg bg-[#0f111a] border border-[#1f2937]/60 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#1f2937] pb-3 gap-2">
                            <div>
                              <span className="text-[10px] text-cyan-400 font-extrabold uppercase bg-cyan-500/10 px-2 py-0.5 rounded border border-[#00d2ff]/20">
                                {req.status}
                              </span>
                              <h4 className="text-sm font-bold text-white mt-1.5">{req.material}</h4>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                ID: <span className="font-semibold text-slate-400">#{req.id.toUpperCase()}</span> | Qtd: {req.qty}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleStartEditRequisition(req)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-350 text-[10px] font-bold uppercase rounded border border-slate-700 transition-colors cursor-pointer"
                              >
                                Configurar Cotações
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {req.options.map((opt, oIdx) => {
                              const isRecommended = opt.isBest;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-4 rounded-lg border flex flex-col justify-between transition-all ${isRecommended
                                      ? 'bg-cyan-500/[0.04] border-[#00d2ff]/40 shadow-[0_0_12px_rgba(6,182,212,0.06)]'
                                      : 'bg-[#111827]/40 border-[#1f2937]'
                                    }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-200">{opt.supplierName}</span>
                                      {isRecommended && (
                                        <span className="text-[8px] bg-cyan-950/80 border border-cyan-500/35 text-cyan-300 px-1.5 py-0.5 rounded font-black uppercase">
                                          Melhor Opção ⭐
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-lg font-extrabold text-white mt-2">
                                      R$ {opt.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>

                                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[12px] text-slate-400">local_shipping</span>
                                      Prazo de Entrega: <span className="text-slate-200 font-bold">{opt.deliveryDays} dias</span>
                                    </div>

                                    <div className="flex items-center gap-0.5 mt-2">
                                      {[...Array(5)].map((_, i) => (
                                        <span
                                          key={i}
                                          className={`material-symbols-outlined text-[12px] ${i < opt.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                                            }`}
                                        >
                                          star
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleApproveQuote(req.id, opt.supplierName, opt.price)}
                                    className={`w-full mt-4 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${opt.isBest
                                        ? 'bg-[#00d2ff] hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(0,210,255,0.2)]'
                                        : 'bg-[#00d2ff]/20 hover:bg-[#00d2ff]/40 text-[#00d2ff] border border-[#00d2ff]/40'
                                      }`}
                                  >
                                    Aprovar e Faturar
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Delivery tracking & History */}
              <div className="bg-[#111827]/70 border border-[#1f2937] rounded-xl p-5 shadow-md">
                <h3 className="text-sm font-semibold text-white mb-4">Registro Geral de Insumos Comprados e Rastreamento</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1f2937] text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-[#0f111a]/40">
                        <th className="py-3 px-4">Material / Insumo</th>
                        <th className="py-3 px-4">Quantidade</th>
                        <th className="py-3 px-4">Fornecedor</th>
                        <th className="py-3 px-4 text-right">Valor Final</th>
                        <th className="py-3 px-4">Status de Logística</th>
                        <th className="py-3 px-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f2937]/50 text-xs text-slate-300">
                      {projRequisitions.filter(r => r.status !== 'Em Cotação').length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                            Nenhuma compra foi aprovada ou faturada para este projeto ainda.
                          </td>
                        </tr>
                      ) : (
                        projRequisitions
                          .filter((r) => r.status !== 'Em Cotação')
                          .map((req) => (
                            <tr key={req.id} className="hover:bg-[#1f2937]/20 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-slate-200">{req.material}</td>
                              <td className="py-3.5 px-4">{req.qty}</td>
                              <td className="py-3.5 px-4 font-medium text-slate-300">{req.approvedSupplier}</td>
                              <td className="py-3.5 px-4 text-right font-bold text-[#00d2ff]">
                                R$ {req.approvedPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3.5 px-4">
                                <select
                                  value={req.status}
                                  onChange={(e) => {
                                    const nextStatus = e.target.value as any;
                                    setRequisitions(prev =>
                                      prev.map(r => r.id === req.id ? { ...r, status: nextStatus } : r)
                                    );
                                    addToast(`Status da entrega para "${req.material}" atualizado para: ${nextStatus}`, 'success');
                                  }}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded bg-[#0a0f1d] border outline-none cursor-pointer ${
                                    req.status === 'Entregue' 
                                      ? 'text-emerald-450 border-emerald-500/30' 
                                      : 'text-amber-450 border-amber-500/30 animate-pulse'
                                  }`}
                                >
                                  <option value="Aprovado" className="bg-[#0f111a]">Aprovado</option>
                                  <option value="Aguardando Entrega" className="bg-[#0f111a]">Aguardando Entrega</option>
                                  <option value="Entregue" className="bg-[#0f111a]">Entregue</option>
                                </select>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => handleStartEditRequisition(req)}
                                  className="p-1 hover:bg-[#ffffff]/10 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[14px] block">edit</span>
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Homologated Suppliers Directory */}
              <div className="bg-[#111827]/70 border border-[#1f2937] rounded-xl p-5 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Portfólio de Fornecedores Homologados</h3>
                  <button
                    onClick={() => {
                      setIsAddingSupplier(true);
                      setEditingSupplierId(null);
                      setEditSupName('');
                      setEditSupSpecialty('');
                      setEditSupPhone('');
                      setEditSupCompliance(100);
                      setEditSupRating(5.0);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#00d2ff] hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg shadow active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Novo Fornecedor
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suppliers.map((sup) => (
                    <div key={sup.id} className="p-4 rounded-xl bg-[#0f111a] border border-[#1f2937]/50 flex flex-col justify-between hover:border-cyan-500/30 transition-all duration-300">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-100">{sup.name}</h4>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {sup.compliance}% Compl.
                            </span>
                            <button
                              onClick={() => handleEditSupplier(sup)}
                              className="p-1 bg-[#1f2937]/50 hover:bg-[#1f2937] hover:text-cyan-400 text-slate-400 rounded-md border border-[#1f2937] cursor-pointer transition-colors"
                              title="Editar Fornecedor"
                            >
                              <span className="material-symbols-outlined text-[14px] block">edit</span>
                            </button>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-400 mt-1">{sup.specialty}</div>
                        <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">phone</span>
                          {sup.phone}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#1f2937]/50">
                        <span className="text-[10px] text-slate-400 font-bold">Nota de Obras Passadas:</span>
                        <div className="flex items-center text-amber-400 text-[11px] font-bold">
                          <span className="material-symbols-outlined text-[12px] mr-0.5 fill-amber-400">star</span>
                          {sup.rating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* 4ª TAB: QUADRO BRANCO (WHITEBOARD) */}
        {/* ========================================================================= */}
        {activeTab === 'quadro-branco' && (
          <div className="flex flex-col h-[calc(100vh-210px)] min-h-[450px] bg-[#0c101d] rounded-xl border border-[#1f2937] overflow-hidden relative select-none animate-fade-in">
            {/* Whiteboard Controls Overlay */}
            <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2 pointer-events-auto">
              <button
                onClick={() => setIsWbModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00d2ff] hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Novo Post-it
              </button>

              <button
                onClick={() => setIsNewColModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827]/80 hover:bg-[#1f2937] border border-[#1f2937] text-slate-300 font-bold text-xs rounded-lg shadow-lg active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">playlist_add</span>
                Nova Fase
              </button>

              <div className="h-6 w-px bg-slate-800 my-auto"></div>

              {/* Project selector dropdown */}
              <div className="flex items-center gap-1.5 bg-[#111827] px-2 py-1 rounded-lg border border-[#1f2937] text-white">
                <span className="material-symbols-outlined text-[14px] text-[#00d2ff]">folder</span>
                <select
                  value={selectedWbProjectId}
                  onChange={(e) => setSelectedWbProjectId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-350 outline-none border-none cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#0f111a]">
                      Quadro: {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-6 w-px bg-slate-800 my-auto"></div>

              {/* Zoom Buttons */}
              <button
                onClick={() => setScale((s) => Math.max(s - 0.1, 0.5))}
                className="p-1.5 bg-[#111827]/80 hover:bg-[#1f2937] border border-[#1f2937] text-slate-300 rounded-lg active:scale-95 transition-all"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined text-[16px] block">zoom_out</span>
              </button>
              <span className="my-auto text-[10px] text-slate-400 font-bold px-1.5">
                {(scale * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(s + 0.1, 1.5))}
                className="p-1.5 bg-[#111827]/80 hover:bg-[#1f2937] border border-[#1f2937] text-slate-300 rounded-lg active:scale-95 transition-all"
                title="Zoom In"
              >
                <span className="material-symbols-outlined text-[16px] block">zoom_in</span>
              </button>
              <button
                onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }}
                className="px-2 py-1.5 bg-[#111827]/80 hover:bg-[#1f2937] border border-[#1f2937] text-slate-300 rounded-lg text-[10px] font-bold active:scale-95 transition-all"
              >
                Reset
              </button>
            </div>

            {/* Quick helper note */}
            <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-1.5 bg-[#0f111a]/95 px-3 py-1.5 rounded-lg border border-[#1f2937] text-[10px] text-slate-400">
              <span className="material-symbols-outlined text-[12px] text-cyan-400">info</span>
              Arraste notas entre raias. Clique duas vezes para editar/excluir. Arraste o fundo para navegar.
            </div>

            {/* Whiteboard Interactive Canvas Container */}
            <div
              className={`flex-1 w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing canvas-container`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
            >
              {/* Transform Canvas with Grid Background */}
              <div
                className="absolute inset-0 canvas-grid"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                  transformOrigin: '0 0',
                  width: '3000px',
                  height: '3000px',
                  backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px)',
                  backgroundSize: '36px 36px',
                  transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                }}
              >
                {/* Columns / Lanes (Dynamic mapping) */}
                <div className="w-max flex gap-20 px-12 pt-36 pb-8 h-full min-h-[800px] select-none pointer-events-none">

                  {wbColumns
                    .filter((col) => col.projectId === selectedWbProjectId)
                    .map((col) => {
                      const colNotes = notes.filter((n) => n.columnId === col.id);
                      const colorClass =
                        col.color === 'cyan' ? 'text-cyan-400' :
                        col.color === 'amber' ? 'text-amber-400' :
                        col.color === 'rose' ? 'text-rose-400' :
                        col.color === 'emerald' ? 'text-emerald-400' :
                        col.color === 'violet' ? 'text-violet-400' : 'text-slate-300';

                      return (
                        <div
                          key={col.id}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, col.id)}
                          className="w-[380px] bg-[#111827]/40 border border-[#1f2937]/50 rounded-xl p-5 flex flex-col pointer-events-auto h-[640px] relative"
                        >
                          {editingColumnId === col.id ? (
                            <div className="flex items-center gap-1.5 w-full shrink-0 border-b border-[#1f2937]/50 pb-2 mb-4">
                              <input
                                type="text"
                                value={editingColumnName}
                                onChange={(e) => setEditingColumnName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEditColumn();
                                  if (e.key === 'Escape') setEditingColumnId(null);
                                }}
                                className="bg-[#0a0f1d] border border-cyan-500/50 text-white text-xs px-2 py-1 rounded w-full outline-none font-bold"
                                autoFocus
                              />
                              <button
                                onClick={handleSaveEditColumn}
                                className="p-1 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 rounded"
                              >
                                <span className="material-symbols-outlined text-[14px] block">check</span>
                              </button>
                              <button
                                onClick={() => setEditingColumnId(null)}
                                className="p-1 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 rounded"
                              >
                                <span className="material-symbols-outlined text-[14px] block">close</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between border-b border-[#1f2937]/50 pb-2 mb-4 shrink-0 group/col">
                              <div className="flex items-center gap-1.5 max-w-[80%]">
                                <span className={`text-xs font-bold uppercase tracking-wider truncate ${colorClass}`}>
                                  {col.name}
                                </span>
                                <button
                                  onClick={() => { setEditingColumnId(col.id); setEditingColumnName(col.name); }}
                                  className="opacity-0 group-hover/col:opacity-100 p-0.5 hover:bg-[#ffffff]/10 rounded text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
                                  title="Renomear Fase"
                                >
                                  <span className="material-symbols-outlined text-[12px] block">edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteColumn(col.id)}
                                  className="opacity-0 group-hover/col:opacity-100 p-0.5 hover:bg-rose-500/10 rounded text-rose-400 hover:text-rose-350 transition-all cursor-pointer shrink-0"
                                  title="Excluir Fase"
                                >
                                  <span className="material-symbols-outlined text-[12px] block">delete</span>
                                </button>
                              </div>
                              <span className="text-[10px] bg-[#1f2937] text-slate-400 px-2 py-0.5 rounded-full shrink-0">
                                {colNotes.length}
                              </span>
                            </div>
                          )}

                          <div className="flex-1 relative overflow-y-auto custom-scrollbar space-y-10 py-2">
                            {colNotes.map((note) => (
                              <div
                                key={note.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, note.id)}
                                onDoubleClick={() => setEditingNote(note)}
                                className={`p-4 rounded-lg shadow-lg border relative transition-all group cursor-grab active:cursor-grabbing hover:scale-102 ${
                                  note.type === 'idea'
                                    ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-100 hover:border-cyan-400/50'
                                    : note.type === 'task'
                                      ? 'bg-amber-950/40 border-amber-500/30 text-amber-100 hover:border-amber-400/50'
                                      : 'bg-rose-950/40 border-rose-500/30 text-rose-100 hover:border-rose-400/50'
                                }`}
                              >
                                {/* Action overlay */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                  {!note.converted && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleConvertToTask(note); }}
                                      className="p-1 bg-[#0f111a] hover:bg-[#1f2937] rounded border border-[#1f2937] text-emerald-400 text-[10px]"
                                      title="Converter em Tarefa do Projeto"
                                    >
                                      <span className="material-symbols-outlined text-[12px] block">playlist_add_check</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditingNote(note); }}
                                    className="p-1 bg-[#0f111a] hover:bg-[#1f2937] rounded border border-[#1f2937] text-slate-300 text-[10px]"
                                  >
                                    <span className="material-symbols-outlined text-[12px] block">edit</span>
                                  </button>
                                </div>

                                <p className="text-xs leading-relaxed pr-6 font-medium break-words">{note.text}</p>

                                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#ffffff]/05 text-[9px] text-slate-400">
                                  <span className="uppercase font-bold tracking-wider">{note.type}</span>
                                  {note.converted && (
                                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                      <span className="material-symbols-outlined text-[10px]">task_alt</span>
                                      Convertido
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                </div>
              </div>
            </div>
          </div>
        )}

            {/* Modal - Add Post-it */}
            {isWbModalOpen && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300 animate-fade-in">
                <div className="bg-slate-900/95 border border-slate-800/80 backdrop-blur-xl p-6 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden animate-scale-up">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500"></div>
                  
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00d2ff]">note_add</span>
                      Adicionar Novo Post-it
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Anotação / Texto:</label>
                      <textarea
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Ex: Cotar cimento extra de fundação..."
                        className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs p-3 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-600 resize-none h-24 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Categoria / Tipo:</label>
                        <select
                          value={newNoteType}
                          onChange={(e) => setNewNoteType(e.target.value as any)}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 transition-all"
                        >
                          <option value="idea">Ciano (Ideia / Estudo)</option>
                          <option value="task">Amarelo (Tarefa / Ação)</option>
                          <option value="blocker">Vermelho (Impedimento)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Coluna / Fase:</label>
                        <select
                          value={newNoteCol}
                          onChange={(e) => setNewNoteCol(e.target.value)}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 transition-all"
                        >
                          {wbColumns
                            .filter((col) => col.projectId === selectedWbProjectId)
                            .map((col) => (
                              <option key={col.id} value={col.id}>
                                {col.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3.5 mt-6 pt-2 border-t border-slate-800/40">
                    <button
                      onClick={() => setIsWbModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddNote}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-98 transition-all"
                    >
                      Adicionar Nota
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal - Edit/Delete Post-it */}
            {editingNote && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300 animate-fade-in">
                <div className="bg-slate-900/95 border border-slate-800/80 backdrop-blur-xl p-6 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden animate-scale-up">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500"></div>

                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00d2ff]">edit_note</span>
                      Editar Post-it
                    </h3>
                    <button
                      onClick={() => handleDeleteNote(editingNote.id)}
                      className="flex items-center gap-1.5 text-xs text-rose-455 hover:text-rose-350 font-bold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Excluir
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Texto:</label>
                      <textarea
                        value={editingNote.text}
                        onChange={(e) => setEditingNote({ ...editingNote, text: e.target.value })}
                        className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs p-3 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-600 resize-none h-24 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Categoria / Tipo:</label>
                        <select
                          value={editingNote.type}
                          onChange={(e) => setEditingNote({ ...editingNote, type: e.target.value as any })}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 transition-all"
                        >
                          <option value="idea">Ciano (Ideia / Estudo)</option>
                          <option value="task">Amarelo (Tarefa / Ação)</option>
                          <option value="blocker">Vermelho (Impedimento)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Coluna / Fase:</label>
                        <select
                          value={editingNote.columnId}
                          onChange={(e) => setEditingNote({ ...editingNote, columnId: e.target.value })}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 transition-all"
                        >
                          {wbColumns
                            .filter((col) => col.projectId === editingNote.projectId)
                            .map((col) => (
                              <option key={col.id} value={col.id}>
                                {col.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3.5 mt-6 pt-2 border-t border-slate-800/40">
                    <button
                      onClick={() => setEditingNote(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEditNote}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-98 transition-all"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal - New Whiteboard Column */}
            {isNewColModalOpen && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300 animate-fade-in">
                <div className="bg-slate-900/95 border border-slate-800/80 backdrop-blur-xl p-6 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden animate-scale-up">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500"></div>
                  
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00d2ff]">playlist_add</span>
                      Adicionar Nova Fase (Coluna)
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome da Fase:</label>
                      <input
                        type="text"
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        placeholder="Ex: FASE 4: TESTES"
                        className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cor Temática:</label>
                      <select
                        value={newColColor}
                        onChange={(e) => setNewColColor(e.target.value)}
                        className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 transition-all"
                      >
                        <option value="cyan">Ciano (Cyan)</option>
                        <option value="amber">Amarelo (Amber)</option>
                        <option value="rose">Rosa (Rose)</option>
                        <option value="emerald">Verde (Emerald)</option>
                        <option value="violet">Lilás (Violet)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3.5 mt-6 pt-2 border-t border-slate-800/40">
                    <button
                      onClick={() => setIsNewColModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddNewColumn}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-98 transition-all"
                    >
                      Adicionar Fase
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal - Edit/Add Milestone */}
            {(editingMilestone || isAddingMilestone) && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300 animate-fade-in">
                <div className="bg-slate-900/95 border border-slate-800/80 backdrop-blur-xl p-6 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden animate-scale-up">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500"></div>

                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00d2ff]">event</span>
                      {isAddingMilestone ? 'Adicionar Marco Cronológico' : 'Editar Marco do Cronograma'}
                    </h3>
                    {!isAddingMilestone && (
                      <button
                        onClick={() => handleDeleteMilestone(editingMilestone!.id)}
                        className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-350 font-bold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        Excluir
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome do Marco:</label>
                      <input
                        type="text"
                        value={editMsName}
                        onChange={(e) => setEditMsName(e.target.value)}
                        className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        placeholder="Ex: Instalações Eletromecânicas"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Data Prevista:</label>
                        <input
                          type="text"
                          value={editMsDate}
                          onChange={(e) => setEditMsDate(e.target.value)}
                          placeholder="dd/mm/aaaa"
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status:</label>
                        <select
                          value={editMsStatus}
                          onChange={(e) => setEditMsStatus(e.target.value as any)}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 transition-all"
                        >
                          <option value="Concluído">Concluído</option>
                          <option value="Em Execução">Em Execução</option>
                          <option value="Atrasado">Atrasado</option>
                          <option value="Pendente">Pendente</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3.5 mt-6 pt-2 border-t border-slate-800/40">
                    <button
                      onClick={() => {
                        setEditingMilestone(null);
                        setIsAddingMilestone(false);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (isAddingMilestone) {
                          handleAddNewMilestone();
                        } else {
                          handleSaveEditMilestone();
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-98 transition-all"
                    >
                      {isAddingMilestone ? 'Adicionar' : 'Salvar Marco'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal - EAP Cost Add/Edit */}
            {(editingCostId || isAddingCost) && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300 animate-fade-in">
                <div className="bg-slate-900/95 border border-slate-800/80 backdrop-blur-xl p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-scale-up">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 rounded-t-2xl"></div>

                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00d2ff]">payments</span>
                      {isAddingCost ? 'Adicionar Item à EAP' : 'Editar Item da EAP'}
                    </h3>
                    {!isAddingCost && (
                      <button
                        onClick={() => handleDeleteCost(editingCostId!)}
                        className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-350 font-bold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        Excluir
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fase / Pacote de Trabalho:</label>
                      <input
                        type="text"
                        value={editCostPhase}
                        onChange={(e) => setEditCostPhase(e.target.value)}
                        className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        placeholder="Ex: Fundação e Bases de Concreto"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Orçamento Previsto (R$):</label>
                        <input
                          type="number"
                          value={editCostBudget}
                          onChange={(e) => setEditCostBudget(Number(e.target.value))}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Gasto Realizado (R$):</label>
                        <input
                          type="number"
                          value={editCostActual}
                          onChange={(e) => setEditCostActual(Number(e.target.value))}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Responsável Técnico:</label>
                        <input
                          type="text"
                          value={editCostResponsible}
                          onChange={(e) => setEditCostResponsible(e.target.value)}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                          placeholder="Ex: Eng. Daniel Silva"
                        />
                      </div>
                      <SearchableCategorySelect
                        value={editCostCategory}
                        onChange={setEditCostCategory}
                        options={eapCategories}
                        label="Categoria"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3.5 mt-6 pt-2 border-t border-slate-800/40">
                    <button
                      onClick={() => {
                        setEditingCostId(null);
                        setIsAddingCost(false);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (isAddingCost) {
                          handleAddNewCost();
                        } else {
                          handleSaveEditCost(editingCostId!);
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-98 transition-all"
                    >
                      {isAddingCost ? 'Adicionar Item' : 'Salvar Alterações'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal - Material Add/Edit */}
            {(editingMaterialId || isAddingMaterial) && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300 animate-fade-in">
                <div className="bg-slate-900/95 border border-slate-800/80 backdrop-blur-xl p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-scale-up">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 rounded-t-2xl"></div>

                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00d2ff]">inventory_2</span>
                      {isAddingMaterial ? 'Adicionar Insumo' : 'Editar Insumo'}
                    </h3>
                    {!isAddingMaterial && (
                      <button
                        onClick={() => handleDeleteMaterial(editingMaterialId!)}
                        className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-350 font-bold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        Excluir
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome do Insumo / Serviço:</label>
                      <input
                        type="text"
                        value={editMaterialName}
                        onChange={(e) => setEditMaterialName(e.target.value)}
                        className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        placeholder="Ex: Cimento CP-II"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Meta Prevista:</label>
                        <input
                          type="number"
                          value={editMaterialQtyBudget}
                          onChange={(e) => setEditMaterialQtyBudget(Number(e.target.value))}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Qtd Utilizada:</label>
                        <input
                          type="number"
                          value={editMaterialQtyUsed}
                          onChange={(e) => setEditMaterialQtyUsed(Number(e.target.value))}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Unidade (un):</label>
                        <input
                          type="text"
                          value={editMaterialUnit}
                          onChange={(e) => setEditMaterialUnit(e.target.value)}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                          placeholder="Ex: sacos, m³"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fornecedor Atual:</label>
                        <input
                          type="text"
                          value={editMaterialSupplier}
                          onChange={(e) => setEditMaterialSupplier(e.target.value)}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                          placeholder="Ex: Cimento Forte"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Responsável Técnico:</label>
                        <input
                          type="text"
                          value={editMaterialResponsible}
                          onChange={(e) => setEditMaterialResponsible(e.target.value)}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                          placeholder="Ex: Marcos (Mestre)"
                        />
                      </div>
                    </div>

                    <SearchableCategorySelect
                      value={editMaterialCategory}
                      onChange={setEditMaterialCategory}
                      options={materialCategories}
                      label="Categoria"
                    />
                  </div>

                  <div className="flex justify-end gap-3.5 mt-6 pt-2 border-t border-slate-800/40">
                    <button
                      onClick={() => {
                        setEditingMaterialId(null);
                        setIsAddingMaterial(false);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (isAddingMaterial) {
                          handleAddNewMaterial();
                        } else {
                          handleSaveEditMaterial(editingMaterialId!);
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-98 transition-all"
                    >
                      {isAddingMaterial ? 'Adicionar Insumo' : 'Salvar Alterações'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal - Edit Project */}
            {editingProjectId && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300 animate-fade-in">
                <div className="bg-slate-900/95 border border-slate-800/80 backdrop-blur-xl p-6 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden animate-scale-up">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500"></div>

                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00d2ff]">settings</span>
                      Editar Projeto
                    </h3>
                    <button
                      onClick={() => handleDeleteProject(editingProjectId)}
                      className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-350 font-bold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Excluir Projeto
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome do Projeto:</label>
                      <input
                        type="text"
                        value={editProjName}
                        onChange={(e) => setEditProjName(e.target.value)}
                        className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Localização:</label>
                      <input
                        type="text"
                        value={editProjLocation}
                        onChange={(e) => setEditProjLocation(e.target.value)}
                        className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Previsto (R$):</label>
                        <input
                          type="number"
                          value={editProjPrevisto}
                          onChange={(e) => setEditProjPrevisto(Number(e.target.value))}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Faturado Atual (R$):</label>
                        <input
                          type="number"
                          value={editProjFaturado}
                          onChange={(e) => setEditProjFaturado(Number(e.target.value))}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Progresso (%):</label>
                        <input
                          type="number"
                          value={editProjProgress}
                          onChange={(e) => setEditProjProgress(Number(e.target.value))}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status:</label>
                        <select
                          value={editProjStatus}
                          onChange={(e) => setEditProjStatus(e.target.value as any)}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 transition-all"
                        >
                          <option value="Em Execução">Em Execução</option>
                          <option value="Prazos Críticos">Prazos Críticos</option>
                          <option value="Concluído">Concluído</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Coordenador:</label>
                        <input
                          type="text"
                          value={editProjCoordinator}
                          onChange={(e) => setEditProjCoordinator(e.target.value)}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Equipe/Frente:</label>
                        <input
                          type="text"
                          value={editProjTeam}
                          onChange={(e) => setEditProjTeam(e.target.value)}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3.5 mt-6 pt-2 border-t border-slate-800/40">
                    <button
                      onClick={handleCancelEditProject}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveEditProject(editingProjectId)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-98 transition-all"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal - New Project */}
            {isNewProjectModalOpen && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300 animate-fade-in">
                <div className="bg-slate-900/95 border border-slate-800/80 backdrop-blur-xl p-6 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden animate-scale-up">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500"></div>

                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00d2ff]">create_new_folder</span>
                      Adicionar Novo Projeto
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome do Projeto:</label>
                      <input
                        type="text"
                        value={newProjName}
                        onChange={(e) => setNewProjName(e.target.value)}
                        placeholder="Ex: Reforma Galpão Almoxarifado"
                        className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Localização:</label>
                      <input
                        type="text"
                        value={newProjLocation}
                        onChange={(e) => setNewProjLocation(e.target.value)}
                        placeholder="Ex: Galpão Norte, Setor de Carga"
                        className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Previsto (R$):</label>
                        <input
                          type="number"
                          value={newProjPrevisto}
                          onChange={(e) => setNewProjPrevisto(Number(e.target.value))}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Faturado Inicial (R$):</label>
                        <input
                          type="number"
                          value={newProjFaturado}
                          onChange={(e) => setNewProjFaturado(Number(e.target.value))}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Progresso Inicial (%):</label>
                        <input
                          type="number"
                          value={newProjProgress}
                          onChange={(e) => setNewProjProgress(Number(e.target.value))}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status:</label>
                        <select
                          value={newProjStatus}
                          onChange={(e) => setNewProjStatus(e.target.value as any)}
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 transition-all"
                        >
                          <option value="Em Execução">Em Execução</option>
                          <option value="Prazos Críticos">Prazos Críticos</option>
                          <option value="Concluído">Concluído</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Coordenador:</label>
                        <input
                          type="text"
                          value={newProjCoordinator}
                          onChange={(e) => setNewProjCoordinator(e.target.value)}
                          placeholder="Ex: Eng. Rafael Ramos"
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Equipe/Frente:</label>
                        <input
                          type="text"
                          value={newProjTeam}
                          onChange={(e) => setNewProjTeam(e.target.value)}
                          placeholder="Ex: Marcos + 4 Pedreiros"
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3.5 mt-6 pt-2 border-t border-slate-800/40">
                    <button
                      onClick={() => setIsNewProjectModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveNewProject}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-98 transition-all"
                    >
                      Criar Projeto
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal - Requisition Add/Edit */}
            {(isAddingReq || editingReqId) && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300 animate-fade-in">
                <div className="bg-slate-900/95 border border-slate-800/80 backdrop-blur-xl p-6 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500"></div>

                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00d2ff]">shopping_cart</span>
                      {editingReqId ? 'Editar Requisição de Compra' : 'Nova Requisição de Compra'}
                    </h3>
                    {editingReqId && (
                      <button
                        onClick={() => handleDeleteRequisition(editingReqId)}
                        className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-350 font-bold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Insumo / Material:</label>
                        <input
                          type="text"
                          value={editReqMaterial}
                          onChange={(e) => setEditReqMaterial(e.target.value)}
                          placeholder="Ex: Tijolos Cerâmicos"
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Quantidade / Lote:</label>
                        <input
                          type="text"
                          value={editReqQty}
                          onChange={(e) => setEditReqQty(e.target.value)}
                          placeholder="Ex: 10.000 un ou 50 m³"
                          className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status:</label>
                      <select
                        value={editReqStatus}
                        onChange={(e) => setEditReqStatus(e.target.value as any)}
                        className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 transition-all"
                      >
                        <option value="Em Cotação">Em Cotação</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Aguardando Entrega">Aguardando Entrega</option>
                        <option value="Entregue">Entregue</option>
                      </select>
                    </div>

                    <div className="border-t border-slate-800/40 pt-4">
                      <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-cyan-400">request_quote</span>
                        Opções de Cotação de Fornecedores
                      </h4>

                      <div className="space-y-4">
                        {/* FORNECEDOR 1 */}
                        <div className="bg-[#0a0f1d]/90 p-4 rounded-xl border border-slate-800/95 space-y-3">
                          <div className="text-[10px] font-bold text-[#00d2ff] tracking-wider">FORNECEDOR 1</div>
                          <div className="grid grid-cols-3 gap-3.5">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nome:</label>
                              <input
                                type="text"
                                value={editReqSupplier1}
                                onChange={(e) => setEditReqSupplier1(e.target.value)}
                                placeholder="Depósito Central"
                                className="w-full bg-[#111827]/80 border border-slate-800/95 text-xs text-slate-200 p-2 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Preço Total (R$):</label>
                              <input
                                type="number"
                                value={editReqPrice1}
                                onChange={(e) => setEditReqPrice1(Number(e.target.value))}
                                className="w-full bg-[#111827]/80 border border-slate-800/95 text-xs text-slate-200 p-2 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Prazo (Dias):</label>
                              <input
                                type="number"
                                value={editReqDays1}
                                onChange={(e) => setEditReqDays1(Number(e.target.value))}
                                className="w-full bg-[#111827]/80 border border-slate-800/95 text-xs text-slate-200 p-2 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* FORNECEDOR 2 */}
                        <div className="bg-[#0a0f1d]/90 p-4 rounded-xl border border-slate-800/95 space-y-3">
                          <div className="text-[10px] font-bold text-[#00d2ff] tracking-wider">FORNECEDOR 2</div>
                          <div className="grid grid-cols-3 gap-3.5">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nome:</label>
                              <input
                                type="text"
                                value={editReqSupplier2}
                                onChange={(e) => setEditReqSupplier2(e.target.value)}
                                placeholder="Suprimentos Vale"
                                className="w-full bg-[#111827]/80 border border-slate-800/95 text-xs text-slate-200 p-2 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Preço Total (R$):</label>
                              <input
                                type="number"
                                value={editReqPrice2}
                                onChange={(e) => setEditReqPrice2(Number(e.target.value))}
                                className="w-full bg-[#111827]/80 border border-slate-800/95 text-xs text-slate-200 p-2 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Prazo (Dias):</label>
                              <input
                                type="number"
                                value={editReqDays2}
                                onChange={(e) => setEditReqDays2(Number(e.target.value))}
                                className="w-full bg-[#111827]/80 border border-slate-800/95 text-xs text-slate-200 p-2 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* FORNECEDOR 3 */}
                        <div className="bg-[#0a0f1d]/90 p-4 rounded-xl border border-slate-800/95 space-y-3">
                          <div className="text-[10px] font-bold text-[#00d2ff] tracking-wider">FORNECEDOR 3</div>
                          <div className="grid grid-cols-3 gap-3.5">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nome:</label>
                              <input
                                type="text"
                                value={editReqSupplier3}
                                onChange={(e) => setEditReqSupplier3(e.target.value)}
                                placeholder="Cerâmica Regional"
                                className="w-full bg-[#111827]/80 border border-slate-800/95 text-xs text-slate-200 p-2 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Preço Total (R$):</label>
                              <input
                                type="number"
                                value={editReqPrice3}
                                onChange={(e) => setEditReqPrice3(Number(e.target.value))}
                                className="w-full bg-[#111827]/80 border border-slate-800/95 text-xs text-slate-200 p-2 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Prazo (Dias):</label>
                              <input
                                type="number"
                                value={editReqDays3}
                                onChange={(e) => setEditReqDays3(Number(e.target.value))}
                                className="w-full bg-[#111827]/80 border border-slate-800/95 text-xs text-slate-200 p-2 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3.5 mt-6 pt-2 border-t border-slate-800/40">
                    <button
                      onClick={() => {
                        setIsAddingReq(false);
                        setEditingReqId(null);
                        clearReqForm();
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveNewRequisition}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-98 transition-all"
                    >
                      {editingReqId ? 'Salvar Alterações' : 'Criar Cotação'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* Modal - Spreadsheet Import */}
          {isImportModalOpen && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300 animate-fade-in">
              <div className="bg-slate-900/95 border border-slate-800/80 backdrop-blur-xl p-6 rounded-2xl w-full max-w-3xl shadow-2xl relative overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500"></div>

                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00d2ff]">publish</span>
                    Importador Inteligente de Planilhas (IA)
                  </h3>
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    className="p-1 hover:bg-[#ffffff]/10 rounded text-slate-400 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px] block">close</span>
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Method Selector: File Upload or Paste Raw Text */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* File Selection Zone */}
                    <div className="bg-[#0a0f1d]/90 p-4 rounded-xl border border-slate-800/95 flex flex-col justify-center items-center min-h-[140px] text-center relative group">
                      <span className="material-symbols-outlined text-[36px] text-teal-400 mb-2 group-hover:scale-110 transition-transform">cloud_upload</span>
                      <span className="text-xs font-semibold text-slate-200">Selecionar arquivo de planilha</span>
                      <span className="text-[10px] text-slate-500 mt-1">Formatos: .xlsx, .xls, .csv, .json, .md</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv,.json,.md,.markdown"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>

                    {/* Paste zone */}
                    <div className="bg-[#0a0f1d]/90 p-4 rounded-xl border border-slate-800/95 flex flex-col gap-2">
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Copiar & Colar Texto:</label>
                      <textarea
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Cole aqui a sua tabela Markdown, CSV ou JSON..."
                        className="w-full bg-[#111827]/80 border border-slate-800/95 text-slate-200 text-[11px] p-2 rounded-xl outline-none focus:border-[#00d2ff] placeholder-slate-650 h-[80px] resize-none font-mono"
                      />
                      <button
                        onClick={handleAnalyzePastedText}
                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                      >
                        Analisar Texto
                      </button>
                    </div>
                  </div>

                  {isAnalyzingImport && (
                    <div className="flex items-center justify-center gap-3 py-6 bg-[#0a0f1d]/50 rounded-xl border border-slate-800/40">
                      <span className="material-symbols-outlined text-[#00d2ff] animate-spin text-2xl">progress_activity</span>
                      <span className="text-xs font-semibold text-slate-300">IA analisando dados da planilha...</span>
                    </div>
                  )}

                  {importHeaders.length > 0 && !isAnalyzingImport && (
                    <div className="space-y-4 border-t border-slate-800/40 pt-4 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Select Category */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Categoria da Planilha (Sugestão de IA):</label>
                          <select
                            value={importCategory}
                            onChange={(e) => {
                              const cat = e.target.value as any;
                              setImportCategory(cat);
                              // Reset mappings to empty as fields change
                              setImportMappings({});
                            }}
                            className="w-full bg-[#0a0f1d] border border-slate-800 text-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-[#00d2ff] transition-all"
                          >
                            <option value="EAP">Estrutura Analítica de Projeto (EAP / Custos)</option>
                            <option value="Materiais">Levantamento de Materiais e Consumo</option>
                            <option value="Suprimentos">Suprimentos e Compras (Requisições)</option>
                            <option value="Fornecedores">Portfólio de Fornecedores Homologados</option>
                          </select>
                        </div>

                        {/* Target Project selection */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Projeto de Destino:</label>
                          <select
                            value={importDestinationProjId}
                            onChange={(e) => setImportDestinationProjId(e.target.value)}
                            className="w-full bg-[#0a0f1d] border border-slate-800 text-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-[#00d2ff] transition-all"
                          >
                            {projects.map(p => (
                              <option key={p.id} value={p.id}>Adicionar ao projeto: {p.name}</option>
                            ))}
                            {(importCategory === 'EAP' || importCategory === 'Materiais') && (
                              <option value="new">Criar Novo Projeto com estes dados</option>
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Column Mapping Section */}
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Mapeamento de Colunas (IA):</div>
                        <div className="bg-[#0a0f1d]/90 p-4 rounded-xl border border-slate-800/95 max-h-[160px] overflow-y-auto custom-scrollbar space-y-3">
                          {importHeaders.map((h) => {
                            const mappedKey = importMappings[h] || '';
                            return (
                              <div key={h} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center border-b border-slate-800/30 pb-2 last:border-none last:pb-0">
                                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono truncate">
                                  <span className="material-symbols-outlined text-[14px] text-teal-400 shrink-0">table_rows</span>
                                  {h}
                                </div>
                                <select
                                  value={mappedKey}
                                  onChange={(e) => setImportMappings(prev => ({ ...prev, [h]: e.target.value }))}
                                  className="bg-[#111827] border border-slate-800 text-slate-300 text-xs p-1.5 rounded-lg outline-none focus:border-[#00d2ff] cursor-pointer"
                                >
                                  <option value="">(Ignorar / Não importar)</option>
                                  {importCategory === 'EAP' && (
                                    <>
                                      <option value="phase">Fase / Pacote de Trabalho</option>
                                      <option value="budget">Orçamento Previsto (R$)</option>
                                      <option value="actual">Gasto Realizado (R$)</option>
                                      <option value="category">Categoria (Materiais, Mão de Obra, etc.)</option>
                                      <option value="responsible">Responsável Técnico</option>
                                    </>
                                  )}
                                  {importCategory === 'Materiais' && (
                                    <>
                                      <option value="name">Nome do Insumo / Serviço</option>
                                      <option value="category">Categoria</option>
                                      <option value="qtyBudget">Quantidade Prevista (Meta)</option>
                                      <option value="qtyUsed">Quantidade Utilizada</option>
                                      <option value="unit">Unidade (m³, kg, sacos, etc.)</option>
                                      <option value="supplier">Fornecedor Atual</option>
                                      <option value="responsible">Responsável Técnico</option>
                                    </>
                                  )}
                                  {importCategory === 'Suprimentos' && (
                                    <>
                                      <option value="material">Material / Insumo</option>
                                      <option value="qty">Quantidade / Lote</option>
                                      <option value="status">Status da Compra</option>
                                    </>
                                  )}
                                  {importCategory === 'Fornecedores' && (
                                    <>
                                      <option value="name">Razão Social / Nome</option>
                                      <option value="rating">Avaliação / Rating (0 a 5)</option>
                                      <option value="compliance">Compliance % (Ex: 95)</option>
                                      <option value="specialty">Especialidade / Ramo</option>
                                      <option value="phone">Telefone</option>
                                    </>
                                  )}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mapped Row Preview Grid */}
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Prévia dos Dados Mapeados (3 primeiras linhas):</div>
                        <div className="bg-[#0a0f1d] border border-slate-800 rounded-xl overflow-x-auto max-w-full">
                          <table className="w-full text-left text-[11px] border-collapse min-w-[500px]">
                            <thead>
                              <tr className="bg-[#111827] border-b border-slate-800 text-slate-400">
                                {importHeaders.map(h => (
                                  <th key={h} className="py-2 px-3 font-semibold font-mono truncate max-w-[150px]">
                                    {h}
                                    {importMappings[h] ? (
                                      <span className="block text-[8px] text-teal-400 font-bold uppercase">{importMappings[h]}</span>
                                    ) : (
                                      <span className="block text-[8px] text-slate-600 font-bold uppercase">IGNORADO</span>
                                    )}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-slate-300">
                              {importRows.slice(0, 3).map((row, rIdx) => (
                                <tr key={rIdx}>
                                  {importHeaders.map((_, colIdx) => (
                                    <td key={colIdx} className="py-2 px-3 truncate max-w-[150px]">{String(row[colIdx] ?? '')}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3.5 mt-6 pt-2 border-t border-slate-800/40">
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImportSubmit}
                    disabled={importHeaders.length === 0}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-lg transition-all ${
                      importHeaders.length === 0
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-98 cursor-pointer'
                    }`}
                  >
                    Confirmar Importação
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal - Supplier Add/Edit */}
          {(editingSupplierId || isAddingSupplier) && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300 animate-fade-in">
              <div className="bg-slate-900/95 border border-slate-800/80 backdrop-blur-xl p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-scale-up">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 rounded-t-2xl"></div>

                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00d2ff]">local_shipping</span>
                    {isAddingSupplier ? 'Adicionar Novo Fornecedor' : 'Editar Fornecedor'}
                  </h3>
                  {!isAddingSupplier && (
                    <button
                      onClick={() => handleDeleteSupplier(editingSupplierId!)}
                      className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-350 font-bold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Excluir
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Razão Social / Nome:</label>
                    <input
                      type="text"
                      value={editSupName}
                      onChange={(e) => setEditSupName(e.target.value)}
                      placeholder="Ex: Gerdau Comercial"
                      className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Especialidade / Ramo:</label>
                    <input
                      type="text"
                      value={editSupSpecialty}
                      onChange={(e) => setEditSupSpecialty(e.target.value)}
                      placeholder="Ex: Estruturas Metálicas e Aço"
                      className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Telefone:</label>
                    <input
                      type="text"
                      value={editSupPhone}
                      onChange={(e) => setEditSupPhone(e.target.value)}
                      placeholder="Ex: (11) 4004-9000"
                      className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Compliance (%):</label>
                      <input
                        type="number"
                        value={editSupCompliance}
                        onChange={(e) => setEditSupCompliance(Number(e.target.value))}
                        min="0"
                        max="100"
                        className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Avaliação / Rating (0-5):</label>
                      <input
                        type="number"
                        value={editSupRating}
                        onChange={(e) => setEditSupRating(Number(e.target.value))}
                        step="0.1"
                        min="0"
                        max="5"
                        className="w-full bg-[#0a0f1d]/90 border border-slate-800/95 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff]/20 placeholder-slate-650 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3.5 mt-6 pt-2 border-t border-slate-800/40">
                  <button
                    onClick={() => {
                      setEditingSupplierId(null);
                      setIsAddingSupplier(false);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (isAddingSupplier) {
                        handleAddNewSupplier();
                      } else {
                        handleSaveEditSupplier();
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-98 transition-all"
                  >
                    {isAddingSupplier ? 'Cadastrar' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          )}

      </div>
    </div>
  );
};

export default Projects;
