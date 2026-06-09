import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../services/supabase';
import { usePreferences } from '../contexts/PreferencesContext';
import { Asset, Profile, MonthlyTask, PlanningPlan } from '../types';

// Helper component for Searchable Asset Selector (Combobox)
const AssetSearchSelect: React.FC<{
  assets: Asset[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}> = ({ assets, value, onChange, placeholder = "Selecione um ativo..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedAsset = assets.find(a => a.id === value);

  const filtered = useMemo(() => {
    if (!search) return assets;
    const lower = search.toLowerCase();
    return assets.filter(a =>
      (a.nome || '').toLowerCase().includes(lower) ||
      (a.tag_id || '').toLowerCase().includes(lower) ||
      (a.setor || '').toLowerCase().includes(lower)
    );
  }, [assets, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full flex items-center justify-between text-left cursor-pointer transition-all hover:bg-slate-900"
      >
        <span className="truncate">
          {selectedAsset
            ? `[${selectedAsset.tag_id || 'SEM TAG'}] ${selectedAsset.nome} (${selectedAsset.setor || 'Sem setor'})`
            : placeholder}
        </span>
        <span className="material-symbols-outlined text-[18px] text-slate-400">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-50 flex flex-col max-h-60 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
          <div className="p-2 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
            <input
              type="text"
              placeholder="Buscar ativo por TAG, nome ou setor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-md px-2.5 py-2 focus:outline-none focus:border-primary placeholder-slate-600 font-sans"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1 py-1 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500 text-center">Nenhum ativo encontrado.</div>
            ) : (
              filtered.map(asset => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onChange(asset.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-800/80 transition-colors flex flex-col gap-0.5 ${
                    value === asset.id ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary' : 'text-slate-300'
                  }`}
                >
                  <span className="font-bold text-slate-100">[{asset.tag_id || 'SEM TAG'}] {asset.nome}</span>
                  <span className="text-[10px] text-slate-400">{asset.setor || 'Sem setor'}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Preventives: React.FC = () => {
  const { t, formatDate, userProfile } = usePreferences();
  const isAuthorized = userProfile?.role === 'Administrator' || userProfile?.role === 'Gestor' || userProfile?.role === 'Técnico' || userProfile?.role === 'Supervisor';

  // Tabs: 'month' (Execução Mensal) or 'planning' (Planejamento Anual)
  const [activeTab, setActiveTab] = useState<'month' | 'planning'>('month');

  // Common State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  // Month Tab State
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [monthlyTasks, setMonthlyTasks] = useState<MonthlyTask[]>([]);
  const [monthlySearch, setMonthlySearch] = useState('');
  const [monthlyStatusFilter, setMonthlyStatusFilter] = useState('Todos');
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);

  const [monthlySortKey, setMonthlySortKey] = useState<'equipamento' | 'titulo' | 'tecnico' | 'status' | 'prazo' | null>(null);
  const [monthlySortOrder, setMonthlySortOrder] = useState<'asc' | 'desc'>('asc');

  // Planning Tab State
  const [plans, setPlans] = useState<PlanningPlan[]>([]);
  const [planningSearch, setPlanningSearch] = useState('');
  const [colFilterEquipamento, setColFilterEquipamento] = useState('');
  const [colFilterTag, setColFilterTag] = useState('');
  const [colFilterPeriodicidade, setColFilterPeriodicidade] = useState('');
  const [planningPeriodicityFilter, setPlanningPeriodicityFilter] = useState('Todos');
  const [yearlyTasksMap, setYearlyTasksMap] = useState<Record<string, Record<number, { status: string, id: string }>>>({});
  const [planningSortKey, setPlanningSortKey] = useState<'equipamento' | 'tag' | 'periodicidade' | 'setor' | null>(null);
  const [planningSortOrder, setPlanningSortOrder] = useState<'asc' | 'desc'>('asc');
  const [monthFilters, setMonthFilters] = useState<Record<number, 'Todos' | 'P' | 'R' | '-'>>({
    1: 'Todos', 2: 'Todos', 3: 'Todos', 4: 'Todos', 5: 'Todos', 6: 'Todos',
    7: 'Todos', 8: 'Todos', 9: 'Todos', 10: 'Todos', 11: 'Todos', 12: 'Todos'
  });

  // Modals
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planFormData, setPlanFormData] = useState({
    ativo_id: '',
    titulo: '',
    descricao: '',
    periodicidade: 'Mensal',
    meses_execucao: [] as number[],
    icone: 'settings',
  });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskFormData, setTaskFormData] = useState({
    ativo_id: '',
    titulo: '',
    descricao: '',
    tecnico_responsavel: '',
    tecnico_responsavel_2: '',
    status: 'Em atendimento',
    data_limite: '',
    icone: 'settings',
  });

  // Unified Importer Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'planning' | 'distribution'>('distribution');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const monthsList = [
    { value: 1, name: 'Janeiro' },
    { value: 2, name: 'Fevereiro' },
    { value: 3, name: 'Março' },
    { value: 4, name: 'Abril' },
    { value: 5, name: 'Maio' },
    { value: 6, name: 'Junho' },
    { value: 7, name: 'Julho' },
    { value: 8, name: 'Agosto' },
    { value: 9, name: 'Setembro' },
    { value: 10, name: 'Outubro' },
    { value: 11, name: 'Novembro' },
    { value: 12, name: 'Dezembro' }
  ];

  const periodicities = ['Semanal', 'Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'];

  useEffect(() => {
    fetchAssets();
    fetchTechnicians();
  }, []);

  useEffect(() => {
    if (activeTab === 'month') {
      fetchMonthlyTasks();
    } else {
      fetchPlanningTemplates();
      fetchYearlyTasks();
    }
  }, [activeTab, selectedMonth, selectedYear]);

  // Realtime Subscriptions
  useEffect(() => {
    const plansChan = supabase.channel('plans-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'preventivas_planejamento' }, () => {
        fetchPlanningTemplates();
        fetchYearlyTasks();
      })
      .subscribe();

    const tasksChan = supabase.channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'preventivas_mensais' }, () => {
        fetchMonthlyTasks();
        fetchYearlyTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(plansChan);
      supabase.removeChannel(tasksChan);
    };
  }, [activeTab, selectedMonth, selectedYear]);

  const fetchAssets = async () => {
    const { data, error } = await supabase
      .from('ativos')
      .select('id, nome, tag_id, setor')
      .order('nome');
    if (data) setAssets(data);
    if (error) console.error('Erro ao buscar ativos:', error);
  };

  const fetchTechnicians = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('is_approved', true)
      .order('full_name');
    if (data) {
      setTechnicians(
        data
          .filter((tech: any) => tech.role === 'Técnico' || tech.full_name === 'Guilherme')
          .map((tech: any) => ({
            ...tech,
            role: tech.full_name === 'Guilherme' ? 'Analista' : tech.role
          }))
      );
    }
    if (error) console.error('Erro ao buscar técnicos:', error);
  };

  const fetchPlanningTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('preventivas_planejamento')
      .select('*, ativos(nome, tag_id, setor)')
      .order('created_at', { ascending: false });
    if (data) setPlans(data);
    if (error) console.error('Erro ao buscar templates:', error);
    setLoading(false);
  };

  const fetchMonthlyTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('preventivas_mensais')
      .select('*, ativos(nome, tag_id, setor), tecnico_responsavel_profile:tecnico_responsavel(full_name, email), tecnico_responsavel_2_profile:tecnico_responsavel_2(full_name, email)')
      .eq('mes', selectedMonth)
      .eq('ano', selectedYear)
      .order('created_at', { ascending: false });
    if (data) setMonthlyTasks(data);
    if (error) console.error('Erro ao buscar preventivas mensais:', error);
    setLoading(false);
  };

  const fetchYearlyTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('preventivas_mensais')
        .select('planejamento_id, mes, status, id')
        .eq('ano', selectedYear);
      if (error) throw error;
      if (data) {
        const map: Record<string, Record<number, { status: string, id: string }>> = {};
        data.forEach(item => {
          if (item.planejamento_id) {
            if (!map[item.planejamento_id]) {
              map[item.planejamento_id] = {};
            }
            map[item.planejamento_id][item.mes] = { status: item.status, id: item.id };
          }
        });
        setYearlyTasksMap(map);
      }
    } catch (err) {
      console.error('Erro ao buscar dados anuais de preventivas:', err);
    }
  };

  // Generate monthly tasks for all months of the selected year from planning templates
  const handleGenerateYearlyTasks = async () => {
    if (!isAuthorized) return alert('Sem permissão');
    setLoading(true);
    try {
      const { data: allPlans, error: plansErr } = await supabase
        .from('preventivas_planejamento')
        .select('*');

      if (plansErr) throw plansErr;

      if (!allPlans || allPlans.length === 0) {
        alert('Nenhum planejamento anual cadastrado.');
        setLoading(false);
        return;
      }

      const { data: existingTasks, error: tasksErr } = await supabase
        .from('preventivas_mensais')
        .select('planejamento_id, mes')
        .eq('ano', selectedYear);

      if (tasksErr) throw tasksErr;

      const existingKeys = new Set(
        (existingTasks || []).map(t => `${t.planejamento_id}-${t.mes}`)
      );

      const newTasks: any[] = [];

      allPlans.forEach(plan => {
        const executionMonths = plan.meses_execucao || [];
        executionMonths.forEach((mVal: number) => {
          const key = `${plan.id}-${mVal}`;
          if (!existingKeys.has(key)) {
            newTasks.push({
              planejamento_id: plan.id,
              ativo_id: plan.ativo_id,
              titulo: plan.titulo,
              descricao: plan.descricao,
              mes: mVal,
              ano: selectedYear,
              status: 'Em atendimento',
              icone: plan.icone || 'settings',
              data_limite: new Date(selectedYear, mVal, 0).toISOString().split('T')[0],
            });
          }
        });
      });

      if (newTasks.length === 0) {
        alert(`Todas as preventivas planejadas para o ano de ${selectedYear} já foram geradas!`);
        setLoading(false);
        return;
      }

      const { error: insertErr } = await supabase
        .from('preventivas_mensais')
        .insert(newTasks);

      if (insertErr) throw insertErr;

      alert(`${newTasks.length} ordens de preventiva geradas com sucesso para o ano de ${selectedYear}!`);
      fetchMonthlyTasks();
      fetchYearlyTasks();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao gerar preventivas: ' + err.message);
    }
    setLoading(false);
  };

  // Smart workload-balanced technician distribution
  const handleSmartDistribution = async () => {
    if (!isAuthorized) return alert('Sem permissão');
    if (monthlyTasks.length === 0) return alert('Gere ou cadastre preventivas antes de distribuir.');
    if (technicians.length === 0) return alert('Nenhum técnico aprovado disponível para atribuição.');

    setLoading(true);
    try {
      const unassigned = monthlyTasks.filter(t => !t.tecnico_responsavel);
      if (unassigned.length === 0) {
        alert('Todas as preventivas deste mês já possuem técnicos atribuídos!');
        setLoading(false);
        return;
      }

      const workloads: Record<string, number> = {};
      technicians.forEach(tech => {
        workloads[tech.id] = 0;
      });

      monthlyTasks.forEach(task => {
        if (task.tecnico_responsavel && workloads[task.tecnico_responsavel] !== undefined) {
          workloads[task.tecnico_responsavel]++;
        }
      });

      const updates = [];
      for (const task of unassigned) {
        let bestTechId = technicians[0].id;
        let minWorkload = Infinity;

        for (const tech of technicians) {
          if (workloads[tech.id] < minWorkload) {
            minWorkload = workloads[tech.id];
            bestTechId = tech.id;
          }
        }

        updates.push({
          id: task.id,
          tecnico_responsavel: bestTechId,
          updated_at: new Date().toISOString()
        });

        workloads[bestTechId]++;
      }

      const promises = updates.map(update =>
        supabase
          .from('preventivas_mensais')
          .update({ tecnico_responsavel: update.tecnico_responsavel, updated_at: update.updated_at })
          .eq('id', update.id)
      );

      await Promise.all(promises);

      alert(`Distribuição concluída! ${updates.length} preventivas foram atribuídas de maneira equilibrada.`);
      fetchMonthlyTasks();
    } catch (err: any) {
      console.error(err);
      alert('Erro na distribuição inteligente: ' + err.message);
    }
    setLoading(false);
  };

  const handleUpdateTechnician = async (taskId: string, techId: string | null, field: 'tecnico_responsavel' | 'tecnico_responsavel_2' = 'tecnico_responsavel') => {
    try {
      const { error } = await supabase
        .from('preventivas_mensais')
        .update({
          [field]: techId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);
      if (error) throw error;
      fetchMonthlyTasks();
    } catch (err: any) {
      alert('Erro ao atribuir técnico: ' + err.message);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    setSavingStatusId(taskId);
    try {
      const isCompleted = status === 'Concluído';
      const { error } = await supabase
        .from('preventivas_mensais')
        .update({
          status,
          concluido_em: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);
      if (error) throw error;
      fetchMonthlyTasks();
      fetchYearlyTasks();
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    } finally {
      setSavingStatusId(null);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este planejamento anual? Isso não apagará as preventivas mensais já geradas.')) return;
    try {
      const { error } = await supabase
        .from('preventivas_planejamento')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchPlanningTemplates();
      fetchYearlyTasks();
    } catch (err: any) {
      alert('Erro ao deletar planejamento: ' + err.message);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta preventiva do mês?')) return;
    try {
      const { error } = await supabase
        .from('preventivas_mensais')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchMonthlyTasks();
      fetchYearlyTasks();
    } catch (err: any) {
      alert('Erro ao deletar preventiva do mês: ' + err.message);
    }
  };

  // Click on month cell inside spreadsheet to cycle state: '-' -> 'P' (planned) -> 'R' (realized) -> '-'
  const toggleMonthInPlan = async (plan: any, monthVal: number) => {
    if (!isAuthorized) return alert('Sem permissão');

    const currentMonths = plan.meses_execucao || [];
    const isPlanned = currentMonths.includes(monthVal);
    const taskInfo = yearlyTasksMap[plan.id]?.[monthVal];
    const isRealized = taskInfo?.status === 'Concluído';

    let nextState: 'P' | 'R' | '-' = '-';
    let updatedMonths = [...currentMonths];

    if (!isPlanned && !isRealized) {
      // Transition from '-' to 'P'
      nextState = 'P';
      if (!updatedMonths.includes(monthVal)) {
        updatedMonths.push(monthVal);
        updatedMonths.sort((a, b) => a - b);
      }
    } else if (isPlanned && !isRealized) {
      // Transition from 'P' to 'R'
      nextState = 'R';
    } else {
      // Transition from 'R' to '-'
      nextState = '-';
      updatedMonths = updatedMonths.filter((m: number) => m !== monthVal);
    }

    // Optimistic UI Update for plan months
    setPlans(prevPlans =>
      prevPlans.map(p => (p.id === plan.id ? { ...p, meses_execucao: updatedMonths } : p))
    );

    // Optimistic UI Update for yearlyTasksMap
    setYearlyTasksMap(prevMap => {
      const newMap = { ...prevMap };
      if (!newMap[plan.id]) {
        newMap[plan.id] = {};
      }
      if (nextState === '-') {
        delete newMap[plan.id][monthVal];
      } else {
        newMap[plan.id][monthVal] = {
          status: nextState === 'R' ? 'Concluído' : 'Em atendimento',
          id: taskInfo?.id || 'temp-id'
        };
      }
      return newMap;
    });

    try {
      // 1. Update preventivas_planejamento
      const { error: planErr } = await supabase
        .from('preventivas_planejamento')
        .update({
          meses_execucao: updatedMonths,
          updated_at: new Date().toISOString()
        })
        .eq('id', plan.id);

      if (planErr) throw planErr;

      // 2. Sync to preventivas_mensais
      if (nextState === 'P') {
        const newTask = {
          planejamento_id: plan.id,
          ativo_id: plan.ativo_id,
          titulo: plan.titulo,
          descricao: plan.descricao,
          mes: monthVal,
          ano: selectedYear,
          status: 'Em atendimento',
          icone: plan.icone || 'settings',
          data_limite: new Date(selectedYear, monthVal, 0).toISOString().split('T')[0],
        };

        const { data: inserted, error: insErr } = await supabase
          .from('preventivas_mensais')
          .insert([newTask])
          .select('id')
          .single();

        if (insErr) throw insErr;
        
        if (inserted) {
          setYearlyTasksMap(prevMap => {
            const newMap = { ...prevMap };
            if (!newMap[plan.id]) newMap[plan.id] = {};
            newMap[plan.id][monthVal] = { status: 'Em atendimento', id: inserted.id };
            return newMap;
          });
        }
      } else if (nextState === 'R') {
        if (taskInfo && taskInfo.id !== 'temp-id') {
          const { error: updErr } = await supabase
            .from('preventivas_mensais')
            .update({
              status: 'Concluído',
              concluido_em: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', taskInfo.id);

          if (updErr) throw updErr;
        } else {
          const newTask = {
            planejamento_id: plan.id,
            ativo_id: plan.ativo_id,
            titulo: plan.titulo,
            descricao: plan.descricao,
            mes: monthVal,
            ano: selectedYear,
            status: 'Concluído',
            icone: plan.icone || 'settings',
            data_limite: new Date(selectedYear, monthVal, 0).toISOString().split('T')[0],
            concluido_em: new Date().toISOString()
          };

          const { data: inserted, error: insErr } = await supabase
            .from('preventivas_mensais')
            .insert([newTask])
            .select('id')
            .single();

          if (insErr) throw insErr;

          if (inserted) {
            setYearlyTasksMap(prevMap => {
              const newMap = { ...prevMap };
              if (!newMap[plan.id]) newMap[plan.id] = {};
              newMap[plan.id][monthVal] = { status: 'Concluído', id: inserted.id };
              return newMap;
            });
          }
        }
      } else if (nextState === '-') {
        if (taskInfo && taskInfo.id !== 'temp-id') {
          const { error: delErr } = await supabase
            .from('preventivas_mensais')
            .delete()
            .eq('id', taskInfo.id);

          if (delErr) throw delErr;
        }
      }

      fetchMonthlyTasks();
      fetchYearlyTasks();
    } catch (err: any) {
      console.error('Erro ao alternar estado do mês:', err);
      alert('Erro ao atualizar planejamento: ' + err.message);
      fetchPlanningTemplates();
      fetchYearlyTasks();
      fetchMonthlyTasks();
    }
  };

  // Plan Form handlers
  const handleOpenPlanModal = (plan: any = null) => {
    if (!isAuthorized) return alert('Sem permissão');
    if (plan) {
      setEditingPlan(plan);
      setPlanFormData({
        ativo_id: plan.ativo_id || '',
        titulo: plan.titulo || '',
        descricao: plan.descricao || '',
        periodicidade: plan.periodicidade || 'Mensal',
        meses_execucao: plan.meses_execucao || [],
        icone: plan.icone || 'precision_manufacturing',
      });
    } else {
      setEditingPlan(null);
      setPlanFormData({
        ativo_id: assets[0]?.id || '',
        titulo: '',
        descricao: '',
        periodicidade: 'Mensal',
        meses_execucao: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        icone: 'settings',
      });
    }
    setIsPlanModalOpen(true);
  };

  const syncPlanTasks = async (plan: any, year: number) => {
    try {
      const { data: existingTasks, error: fetchErr } = await supabase
        .from('preventivas_mensais')
        .select('*')
        .eq('planejamento_id', plan.id)
        .eq('ano', year);
        
      if (fetchErr) throw fetchErr;

      const existingMap = new Map((existingTasks || []).map(t => [t.mes, t]));
      const newMonths = plan.meses_execucao || [];
      
      const inserts: any[] = [];
      const deletes: string[] = [];
      
      newMonths.forEach((mVal: number) => {
        if (!existingMap.has(mVal)) {
          inserts.push({
            planejamento_id: plan.id,
            ativo_id: plan.ativo_id,
            titulo: plan.titulo,
            descricao: plan.descricao,
            mes: mVal,
            ano: year,
            status: 'Em atendimento',
            icone: plan.icone || 'settings',
            data_limite: new Date(year, mVal, 0).toISOString().split('T')[0],
          });
        }
      });
      
      existingMap.forEach((task, mVal) => {
        if (!newMonths.includes(mVal)) {
          deletes.push(task.id);
        }
      });
      
      if (inserts.length > 0) {
        const { error: insErr } = await supabase
          .from('preventivas_mensais')
          .insert(inserts);
        if (insErr) throw insErr;
      }
      if (deletes.length > 0) {
        const { error: delErr } = await supabase
          .from('preventivas_mensais')
          .delete()
          .in('id', deletes);
        if (delErr) throw delErr;
      }
    } catch (err) {
      console.error('Erro ao sincronizar tarefas do planejamento:', err);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (planFormData.meses_execucao.length === 0) {
      alert('Selecione pelo menos um mês para execução da preventiva.');
      return;
    }
    setLoading(true);
    try {
      let savedPlan = null;
      if (editingPlan) {
        const { data, error } = await supabase
          .from('preventivas_planejamento')
          .update({
            ...planFormData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPlan.id)
          .select();
        if (error) throw error;
        if (data && data[0]) savedPlan = data[0];
      } else {
        const { data, error } = await supabase
          .from('preventivas_planejamento')
          .insert([planFormData])
          .select();
        if (error) throw error;
        if (data && data[0]) savedPlan = data[0];
      }

      if (savedPlan) {
        await syncPlanTasks(savedPlan, selectedYear);
      }

      setIsPlanModalOpen(false);
      fetchPlanningTemplates();
      fetchYearlyTasks();
      fetchMonthlyTasks();
    } catch (err: any) {
      alert('Erro ao salvar planejamento: ' + err.message);
    }
    setLoading(false);
  };

  const toggleMonthSelection = (mVal: number) => {
    setPlanFormData(prev => {
      const exists = prev.meses_execucao.includes(mVal);
      return {
        ...prev,
        meses_execucao: exists
          ? prev.meses_execucao.filter(v => v !== mVal)
          : [...prev.meses_execucao, mVal].sort((a, b) => a - b)
      };
    });
  };

  // Task Form handlers
  const handleOpenTaskModal = (task: any = null) => {
    if (!isAuthorized) return alert('Sem permissão');
    if (task) {
      setEditingTask(task);
      setTaskFormData({
        ativo_id: task.ativo_id || '',
        titulo: task.titulo || '',
        descricao: task.descricao || '',
        tecnico_responsavel: task.tecnico_responsavel || '',
        tecnico_responsavel_2: task.tecnico_responsavel_2 || '',
        status: task.status || 'Em atendimento',
        data_limite: task.data_limite || '',
        icone: task.icone || 'precision_manufacturing',
      });
    } else {
      setEditingTask(null);
      setTaskFormData({
        ativo_id: assets[0]?.id || '',
        titulo: '',
        descricao: '',
        tecnico_responsavel: '',
        tecnico_responsavel_2: '',
        status: 'Em atendimento',
        data_limite: new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0],
        icone: 'settings',
      });
    }
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ativo_id: taskFormData.ativo_id,
        titulo: taskFormData.titulo,
        descricao: taskFormData.descricao,
        tecnico_responsavel: taskFormData.tecnico_responsavel || null,
        tecnico_responsavel_2: taskFormData.tecnico_responsavel_2 || null,
        status: taskFormData.status,
        data_limite: taskFormData.data_limite || null,
        icone: taskFormData.icone,
        concluido_em: taskFormData.status === 'Concluído' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      if (editingTask) {
        const { error } = await supabase
          .from('preventivas_mensais')
          .update(payload)
          .eq('id', editingTask.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('preventivas_mensais')
          .insert([{
            ...payload,
            mes: selectedMonth,
            ano: selectedYear
          }]);
        if (error) throw error;
      }
      setIsTaskModalOpen(false);
      fetchMonthlyTasks();
      fetchYearlyTasks();
    } catch (err: any) {
      alert('Erro ao salvar preventiva: ' + err.message);
    }
    setLoading(false);
  };

  // SheetJS Dynamic Loader
  const loadSheetJS = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).XLSX) {
        resolve((window as any).XLSX);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload = () => resolve((window as any).XLSX);
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  };

  const normalizeKey = (key: string): string => {
    return key
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .trim();
  };

  const resolveOrCreateAsset = async (tag: string, name: string): Promise<string> => {
    if (!tag) throw new Error("TAG do ativo é obrigatória.");
    const cleanTag = tag.trim();
    let asset = assets.find(a => a.tag_id?.toLowerCase() === cleanTag.toLowerCase());
    if (asset) return asset.id;

    const { data, error } = await supabase
      .from('ativos')
      .insert([{
        tag_id: cleanTag,
        nome: name ? name.trim() : `Equipamento ${cleanTag}`,
        status: 'Operacional',
        criticidade: 'Baixa',
        setor: 'Manutenção',
        saude: 100
      }])
      .select('id, nome, tag_id, setor')
      .single();

    if (error) throw new Error(`Erro ao criar ativo ${cleanTag}: ${error.message}`);
    
    setAssets(prev => [...prev, data]);
    return data.id;
  };

  const resolveTechnicianId = (techStr: string): string | null => {
    if (!techStr) return null;
    const lower = techStr.toLowerCase().trim();
    const matched = technicians.find(t =>
      t.full_name?.toLowerCase().includes(lower) ||
      t.email?.toLowerCase().includes(lower)
    );
    return matched ? matched.id : null;
  };

  const detectIcon = (title: string): string => {
    const lower = title.toLowerCase();
    const keywords = ['analise', 'análise', 'spda', 'inspecao', 'inspeção', 'relatório', 'relatorio', 'auditoria', 'sistema', 'sgi'];
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return 'assignment'; // Clipboard
      }
    }
    return 'settings'; // Gear (change from 'precision_manufacturing')
  };

  const extractMonthsFromRow = (row: any): number[] => {
    const normalizedRow: Record<string, any> = {};
    Object.keys(row).forEach(k => {
      normalizedRow[normalizeKey(k)] = row[k];
    });

    const mesesVal = normalizedRow['meses'] || normalizedRow['meses_execucao'];
    if (mesesVal !== undefined && mesesVal !== null) {
      if (typeof mesesVal === 'number') return [mesesVal];
      return String(mesesVal)
        .split(',')
        .map((m: string) => parseInt(m.trim(), 10))
        .filter((m: number) => !isNaN(m) && m >= 1 && m <= 12);
    }

    const months: number[] = [];
    const monthNames = [
      { num: 1, keys: ['jan', 'janeiro', 'january'] },
      { num: 2, keys: ['fev', 'fevereiro', 'february'] },
      { num: 3, keys: ['mar', 'marco', 'march'] },
      { num: 4, keys: ['abr', 'abril', 'april'] },
      { num: 5, keys: ['mai', 'maio', 'may'] },
      { num: 6, keys: ['jun', 'junho', 'june'] },
      { num: 7, keys: ['jul', 'julho', 'july'] },
      { num: 8, keys: ['ago', 'agosto', 'august'] },
      { num: 9, keys: ['set', 'setembro', 'september'] },
      { num: 10, keys: ['out', 'outubro', 'october'] },
      { num: 11, keys: ['nov', 'novembro', 'november'] },
      { num: 12, keys: ['dez', 'dezembro', 'december'] }
    ];

    for (const mn of monthNames) {
      for (const key of Object.keys(row)) {
        const norm = normalizeKey(key);
        if (mn.keys.some(k => norm === k || norm.startsWith(k + '_') || norm.endsWith('_' + k))) {
          const val = String(row[key] || '').trim();
          if (val && val !== '-' && val !== '0' && val.toLowerCase() !== 'false') {
            months.push(mn.num);
            break;
          }
        }
      }
    }

    return months.sort((a, b) => a - b);
  };

  // Handles Excel/CSV file upload parsing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportError('');
    setImportSuccess('');
    setParsedData([]);

    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    try {
      if (fileType === 'json') {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = JSON.parse(event.target?.result as string);
            const dataArray = Array.isArray(json) ? json : [json];
            setParsedData(dataArray);
          } catch (err: any) {
            setImportError('Erro ao decodificar arquivo JSON: ' + err.message);
          }
        };
        reader.readAsText(file);
      } else if (fileType === 'csv' || fileType === 'xls' || fileType === 'xlsx') {
        const XLSX = await loadSheetJS();
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const ab = event.target?.result;
            const wb = XLSX.read(ab, { type: 'array' });
            const firstSheet = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(firstSheet);
            setParsedData(json);
          } catch (err: any) {
            setImportError('Erro ao ler planilha: ' + err.message);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        setImportError('Formato de arquivo não suportado. Use JSON, CSV, XLS ou XLSX.');
      }
    } catch (err: any) {
      setImportError('Erro ao carregar a biblioteca de importação: ' + err.message);
    }
  };

  // Handles raw pasted CSV data
  const handleRawTextParse = () => {
    if (!importText.trim()) return setImportError('Insira dados CSV no campo de texto.');
    setImportError('');
    setImportSuccess('');

    try {
      const lines = importText.split('\n');
      if (lines.length === 0) throw new Error("O texto está vazio.");
      
      // Assume first row is header if contains letters, else map positional
      const headers = lines[0].split(';').map(h => normalizeKey(h));
      const list = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(';');
        const row: Record<string, any> = {};
        
        headers.forEach((h, idx) => {
          row[h] = cols[idx] || '';
        });

        // Add backup positional fields in case header wasn't standard
        if (cols[0]) row['tag'] = cols[0];
        if (cols[1]) row['equipamento'] = cols[1];
        if (cols[2]) row['atividade'] = cols[2];
        if (cols[3]) row['descricao'] = cols[3];
        if (cols[4]) row['periodicidade'] = cols[4];
        if (cols[5]) row['meses'] = cols[5];

        list.push(row);
      }
      setParsedData(list);
    } catch (err: any) {
      setImportError('Erro ao parsear dados colados: ' + err.message);
    }
  };

  const handleExecuteImport = async () => {
    let sourceData = parsedData;
    
    // Fallback to import text if parsedData is empty but importText is filled
    if (sourceData.length === 0 && importText.trim()) {
      handleRawTextParse();
      return; // Stop here to let state update or proceed if we do it synchronously
    }

    if (sourceData.length === 0) {
      // Try parsing synchronously
      if (importText.trim()) {
        try {
          const lines = importText.split('\n');
          const headers = lines[0].split(';').map(h => normalizeKey(h));
          const list = [];
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = line.split(';');
            const row: Record<string, any> = {};
            headers.forEach((h, idx) => { row[h] = cols[idx] || ''; });
            if (cols[0]) row['tag'] = cols[0];
            if (cols[1]) row['equipamento'] = cols[1];
            if (cols[2]) row['atividade'] = cols[2];
            if (cols[3]) row['descricao'] = cols[3];
            if (cols[4]) row['periodicidade'] = cols[4];
            if (cols[5]) row['meses'] = cols[5];
            list.push(row);
          }
          sourceData = list;
        } catch (e: any) {
          setImportError('Erro ao parsear dados CSV colados: ' + e.message);
          return;
        }
      }
    }

    if (sourceData.length === 0) {
      alert('Nenhum dado carregado para importação.');
      return;
    }

    setLoading(true);
    setImportError('');
    setImportSuccess('');
    
    let successCount = 0;
    
    try {
      if (importMode === 'planning') {
        const plansToInsert = [];
        
        for (let i = 0; i < sourceData.length; i++) {
          const row = sourceData[i];
          
          let tag = '';
          let name = '';
          let title = '';
          let desc = '';
          let periodicity = 'Mensal';
          
          Object.keys(row).forEach(k => {
            const norm = normalizeKey(k);
            if (norm === 'tag' || norm === 'equipamento_tag' || norm === 'ativo_tag' || norm === 'patrimonio') {
              tag = String(row[k]);
            } else if (norm === 'equipamento' || norm === 'nome' || norm === 'nome_equipamento' || norm === 'ativo') {
              name = String(row[k]);
            } else if (norm === 'atividade' || norm === 'titulo' || norm === 'procedimento' || norm === 'preventiva') {
              title = String(row[k]);
            } else if (norm === 'descricao' || norm === 'instrucoes' || norm === 'detalhes') {
              desc = String(row[k]);
            } else if (norm === 'periodicidade' || norm === 'frequencia' || norm === 'periodo') {
              const p = String(row[k]).trim();
              const cap = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
              if (periodicities.includes(cap)) {
                periodicity = cap;
              }
            }
          });
          
          if (!tag) continue;
          
          if (!title) {
            title = `Preventiva Recorrente - ${tag}`;
          }
          
          const months = extractMonthsFromRow(row);
          if (months.length === 0) {
            months.push(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
          }
          
          const assetId = await resolveOrCreateAsset(tag, name);
          const icon = detectIcon(title);
          
          plansToInsert.push({
            ativo_id: assetId,
            titulo: title,
            descricao: desc,
            periodicidade: periodicity,
            meses_execucao: months,
            icone: icon
          });
        }
        
        if (plansToInsert.length > 0) {
          const { error } = await supabase
            .from('preventivas_planejamento')
            .insert(plansToInsert);
          if (error) throw error;
          successCount = plansToInsert.length;
        }
        
        setImportSuccess(`Importação concluída! ${successCount} modelos de planejamento inseridos.`);
        
      } else {
        // mode === 'distribution'
        const tasksToInsert = [];
        
        for (let i = 0; i < sourceData.length; i++) {
          const row = sourceData[i];
          
          let tag = '';
          let name = '';
          let title = '';
          let desc = '';
          let techStr = '';
          let limitDate = '';
          let icon = '';
          
          Object.keys(row).forEach(k => {
            const norm = normalizeKey(k);
            if (norm === 'tag' || norm === 'equipamento_tag' || norm === 'ativo_tag' || norm === 'patrimonio') {
              tag = String(row[k]);
            } else if (norm === 'equipamento' || norm === 'nome' || norm === 'nome_equipamento' || norm === 'ativo') {
              name = String(row[k]);
            } else if (norm === 'atividade' || norm === 'titulo' || norm === 'procedimento' || norm === 'preventiva') {
              title = String(row[k]);
            } else if (norm === 'descricao' || norm === 'instrucoes' || norm === 'detalhes') {
              desc = String(row[k]);
            } else if (norm === 'tecnico' || norm === 'tecnico_responsavel' || norm === 'responsavel' || norm === 'operador') {
              techStr = String(row[k]);
            } else if (norm === 'prazo' || norm === 'data_limite' || norm === 'data') {
              limitDate = String(row[k]);
            } else if (norm === 'icone' || norm === 'icon') {
              icon = String(row[k]);
            }
          });
          
          if (!tag) continue;
          
          if (!title) {
            title = `Manutenção Preventiva - ${tag}`;
          }
          
          const assetId = await resolveOrCreateAsset(tag, name);
          const techId = resolveTechnicianId(techStr);
          
          if (!icon) {
            icon = detectIcon(title);
          }
          
          let parsedDate = '';
          if (limitDate) {
            const d = new Date(limitDate);
            if (!isNaN(d.getTime())) {
              parsedDate = d.toISOString().split('T')[0];
            }
          }
          if (!parsedDate) {
            parsedDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
          }
          
          tasksToInsert.push({
            ativo_id: assetId,
            titulo: title,
            descricao: desc,
            tecnico_responsavel: techId,
            mes: selectedMonth,
            ano: selectedYear,
            status: 'Em atendimento',
            icone: icon,
            data_limite: parsedDate
          });
        }
        
        if (tasksToInsert.length > 0) {
          const { error } = await supabase
            .from('preventivas_mensais')
            .insert(tasksToInsert);
          if (error) throw error;
          successCount = tasksToInsert.length;
        }
        
        setImportSuccess(`Importação concluída! ${successCount} preventivas adicionadas na execução de ${monthsList.find(m => m.value === selectedMonth)?.name}/${selectedYear}.`);
      }
      
      fetchAssets();
      if (activeTab === 'month') {
        fetchMonthlyTasks();
      } else {
        fetchPlanningTemplates();
      }
      fetchYearlyTasks();
      
      setTimeout(() => {
        setIsImportModalOpen(false);
        setParsedData([]);
        setImportText('');
        setImportSuccess('');
      }, 3000);
      
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || 'Erro durante a execução da importação.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanningSort = (key: 'equipamento' | 'tag' | 'periodicidade' | 'setor') => {
    if (planningSortKey === key) {
      if (planningSortOrder === 'asc') {
        setPlanningSortOrder('desc');
      } else {
        setPlanningSortKey(null);
      }
    } else {
      setPlanningSortKey(key);
      setPlanningSortOrder('asc');
    }
  };

  const handleMonthlySort = (key: 'equipamento' | 'titulo' | 'tecnico' | 'status' | 'prazo') => {
    if (monthlySortKey === key) {
      if (monthlySortOrder === 'asc') {
        setMonthlySortOrder('desc');
      } else {
        setMonthlySortKey(null);
      }
    } else {
      setMonthlySortKey(key);
      setMonthlySortOrder('asc');
    }
  };

  const handleMonthFilterChange = (month: number, value: 'Todos' | 'P' | 'R' | '-') => {
    setMonthFilters(prev => ({
      ...prev,
      [month]: value
    }));
  };

  // Filter & Search Logic
  const filteredPlans = useMemo(() => {
    const plansFiltered = plans.filter(p => {
      const matchesSearch =
        p.titulo.toLowerCase().includes(planningSearch.toLowerCase()) ||
        (p.descricao || '').toLowerCase().includes(planningSearch.toLowerCase()) ||
        (p.ativos?.nome || '').toLowerCase().includes(planningSearch.toLowerCase()) ||
        (p.ativos?.tag_id || '').toLowerCase().includes(planningSearch.toLowerCase());

      const matchesPeriodicity =
        planningPeriodicityFilter === 'Todos' || p.periodicidade === planningPeriodicityFilter;

      if (!matchesSearch || !matchesPeriodicity) return false;

      if (colFilterEquipamento && !(p.ativos?.nome || p.titulo || '').toLowerCase().includes(colFilterEquipamento.toLowerCase())) return false;
      if (colFilterTag && !(p.ativos?.tag_id || '').toLowerCase().includes(colFilterTag.toLowerCase())) return false;
      if (colFilterPeriodicidade && !(p.periodicidade || '').toLowerCase().includes(colFilterPeriodicidade.toLowerCase())) return false;

      // Apply month status filters
      for (const mStr of Object.keys(monthFilters)) {
        const mVal = parseInt(mStr, 10);
        const filter = monthFilters[mVal];
        if (filter !== 'Todos') {
          const isPlanned = p.meses_execucao?.includes(mVal);
          const taskInfo = yearlyTasksMap[p.id]?.[mVal];
          const isRealized = taskInfo?.status === 'Concluído';

          if (filter === 'P' && (!isPlanned || isRealized)) {
            return false;
          }
          if (filter === 'R' && !isRealized) {
            return false;
          }
          if (filter === '-' && (isPlanned || isRealized)) {
            return false;
          }
        }
      }

      return true;
    });

    if (planningSortKey) {
      plansFiltered.sort((a, b) => {
        let valA = '';
        let valB = '';
        if (planningSortKey === 'equipamento') {
          valA = a.ativos?.nome || '';
          valB = b.ativos?.nome || '';
        } else if (planningSortKey === 'tag') {
          valA = a.ativos?.tag_id || '';
          valB = b.ativos?.tag_id || '';
        } else if (planningSortKey === 'periodicidade') {
          valA = a.periodicidade || '';
          valB = b.periodicidade || '';
        } else if (planningSortKey === 'setor') {
          valA = a.ativos?.setor || '';
          valB = b.ativos?.setor || '';
        }

        return valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' }) * (planningSortOrder === 'asc' ? 1 : -1);
      });
    }

    return plansFiltered;
  }, [plans, planningSearch, planningPeriodicityFilter, monthFilters, yearlyTasksMap, planningSortKey, planningSortOrder, colFilterEquipamento, colFilterTag, colFilterPeriodicidade]);

  const filteredMonthlyTasks = useMemo(() => {
    const tasks = monthlyTasks.filter(t => {
      const matchesSearch =
        t.titulo.toLowerCase().includes(monthlySearch.toLowerCase()) ||
        (t.descricao || '').toLowerCase().includes(monthlySearch.toLowerCase()) ||
        (t.ativos?.nome || '').toLowerCase().includes(monthlySearch.toLowerCase()) ||
        (t.ativos?.tag_id || '').toLowerCase().includes(monthlySearch.toLowerCase()) ||
        (t.tecnico_responsavel_profile?.full_name || '').toLowerCase().includes(monthlySearch.toLowerCase()) ||
        (t.tecnico_responsavel_2_profile?.full_name || '').toLowerCase().includes(monthlySearch.toLowerCase());

      const matchesStatus =
        monthlyStatusFilter === 'Todos' || t.status === monthlyStatusFilter;

      return matchesSearch && matchesStatus;
    });

    if (monthlySortKey) {
      tasks.sort((a, b) => {
        let valA = '';
        let valB = '';
        if (monthlySortKey === 'equipamento') {
          valA = a.ativos?.nome || '';
          valB = b.ativos?.nome || '';
        } else if (monthlySortKey === 'titulo') {
          valA = a.titulo || '';
          valB = b.titulo || '';
        } else if (monthlySortKey === 'tecnico') {
          valA = a.tecnico_responsavel_profile?.full_name || '';
          valB = b.tecnico_responsavel_profile?.full_name || '';
        } else if (monthlySortKey === 'status') {
          valA = a.status || '';
          valB = b.status || '';
        } else if (monthlySortKey === 'prazo') {
          valA = a.data_limite || '';
          valB = b.data_limite || '';
        }

        if (monthlySortKey === 'prazo') {
          return valA.localeCompare(valB) * (monthlySortOrder === 'asc' ? 1 : -1);
        }
        return valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' }) * (monthlySortOrder === 'asc' ? 1 : -1);
      });
    }

    return tasks;
  }, [monthlyTasks, monthlySearch, monthlyStatusFilter, monthlySortKey, monthlySortOrder]);

  const monthStats = useMemo(() => {
    const total = monthlyTasks.length;
    const completed = monthlyTasks.filter(t => t.status === 'Concluído').length;
    const progress = monthlyTasks.filter(t => t.status === 'Em atendimento').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, progress, completionRate };
  }, [monthlyTasks]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-slate-950 p-6 md:p-8 text-slate-100 font-sans">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight gradient-text-white">
            Planos de Preventiva
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Cronograma anual recorrente e controle de execução mensal de preventivas industriais.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('month')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'month'
                ? 'bg-primary text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">task_alt</span>
            Execução Mensal
          </button>
          <button
            onClick={() => setActiveTab('planning')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'planning'
                ? 'bg-primary text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            Planejamento Anual
          </button>
        </div>
      </header>

      {/* Main Body */}
      {activeTab === 'month' ? (
        // ================= ABA 1: EXECUÇÃO MENSAL =================
        <div className="flex flex-col gap-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col relative overflow-hidden group">
              <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-primary">calendar_month</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
                <span className="text-xs text-slate-400 font-medium">Preventivas Programadas</span>
              </div>
              <span className="text-xl md:text-2xl font-bold font-display text-slate-200 mt-1">{monthStats.total}</span>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col relative overflow-hidden group">
              <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-sky-400">engineering</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-sky-400">engineering</span>
                <span className="text-xs text-slate-400 font-medium">Em Atendimento</span>
              </div>
              <span className="text-xl md:text-2xl font-bold font-display text-sky-400 mt-1">{monthStats.progress}</span>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col relative overflow-hidden group">
              <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-emerald-400">check_circle</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
                <span className="text-xs text-slate-400 font-medium">Concluídas</span>
              </div>
              <span className="text-xl md:text-2xl font-bold font-display text-emerald-400 mt-1">{monthStats.completed}</span>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col col-span-2 md:col-span-1 justify-between relative overflow-hidden group">
              <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-emerald-400">speed</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-400">speed</span>
                  <span>Taxa de Conclusão</span>
                </div>
                <span className="text-emerald-400 font-bold">{monthStats.completionRate}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${monthStats.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 flex flex-col gap-4">
            <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
                >
                  {monthsList.map(m => (
                    <option key={m.value} value={m.value}>{m.name}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
                >
                  {[selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                {loading && <span className="material-symbols-outlined text-slate-400 animate-spin text-[20px]">progress_activity</span>}
              </div>

              {isAuthorized && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleGenerateYearlyTasks}
                    className="flex items-center gap-2 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                    title="Gera preventivas de acordo com o planejamento de todos os meses do ano"
                  >
                    <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                    Gerar Preventivas do Ano
                  </button>

                  <button
                    onClick={handleSmartDistribution}
                    className="flex items-center gap-2 bg-violet-600/20 text-violet-400 border border-violet-500/30 hover:bg-violet-600/30 text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                    title="Distribui tarefas equilibradamente entre os técnicos disponíveis"
                  >
                    <span className="material-symbols-outlined text-[16px]">share</span>
                    Distribuição Inteligente
                  </button>

                  <button
                    onClick={() => {
                      setImportMode('distribution');
                      setIsImportModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                    title="Importar lista de preventivas por planilha ou arquivo"
                  >
                    <span className="material-symbols-outlined text-[16px]">publish</span>
                    Importar Distribuição
                  </button>

                  <button
                    onClick={() => handleOpenTaskModal()}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary to-blue-700 hover:from-primary/95 hover:to-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-lg shadow-primary/10 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Preventiva Avulsa
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <span className="material-symbols-outlined text-slate-500 absolute left-3 top-2.5 text-[20px]">search</span>
                <input
                  type="text"
                  placeholder="Buscar preventivas por título, descrição, TAG ou equipamento..."
                  value={monthlySearch}
                  onChange={(e) => setMonthlySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary placeholder-slate-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Status:</span>
                <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                  {['Todos', 'Em atendimento', 'Concluído'].map(st => (
                    <button
                      key={st}
                      onClick={() => setMonthlyStatusFilter(st)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        monthlyStatusFilter === st
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              {filteredMonthlyTasks.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center">
                  <span className="material-symbols-outlined text-slate-600 text-5xl mb-3">calendar_today</span>
                  <h3 className="text-slate-300 font-semibold text-lg">Sem preventivas para este mês</h3>
                  <p className="text-slate-500 text-sm max-w-md mt-1">
                    Gere as ordens com o botão acima ou cadastre preventivas avulsas para iniciar os atendimentos.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-400 text-[11px] font-bold uppercase tracking-wider bg-slate-900/60 sticky top-0 z-20">
                      <th
                        onClick={() => handleMonthlySort('equipamento')}
                        className="py-3.5 px-4 border-b-2 border-primary/40 cursor-pointer select-none hover:bg-slate-700/30 transition-colors min-w-[160px]"
                      >
                        <div className="flex items-center gap-1">
                          <span>Equipamento</span>
                          <span className="material-symbols-outlined text-[14px] text-slate-400">
                            {monthlySortKey === 'equipamento' ? (monthlySortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                          </span>
                        </div>
                      </th>
                      <th
                        onClick={() => handleMonthlySort('titulo')}
                        className="py-3.5 px-4 border-b-2 border-primary/40 cursor-pointer select-none hover:bg-slate-700/30 transition-colors min-w-[180px]"
                      >
                        <div className="flex items-center gap-1">
                          <span>Descrição da Atividade</span>
                          <span className="material-symbols-outlined text-[14px] text-slate-400">
                            {monthlySortKey === 'titulo' ? (monthlySortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                          </span>
                        </div>
                      </th>
                      <th
                        onClick={() => handleMonthlySort('tecnico')}
                        className="py-3.5 px-4 border-b-2 border-primary/40 cursor-pointer select-none hover:bg-slate-700/30 transition-colors min-w-[140px]"
                      >
                        <div className="flex items-center gap-1">
                          <span>Técnico Atribuído</span>
                          <span className="material-symbols-outlined text-[14px] text-slate-400">
                            {monthlySortKey === 'tecnico' ? (monthlySortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                          </span>
                        </div>
                      </th>
                      <th
                        onClick={() => handleMonthlySort('status')}
                        className="py-3.5 px-4 border-b-2 border-primary/40 cursor-pointer select-none hover:bg-slate-700/30 transition-colors min-w-[120px]"
                      >
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                          <span className="material-symbols-outlined text-[14px] text-slate-400">
                            {monthlySortKey === 'status' ? (monthlySortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                          </span>
                        </div>
                      </th>
                      <th
                        onClick={() => handleMonthlySort('prazo')}
                        className="py-3.5 px-4 border-b-2 border-primary/40 cursor-pointer select-none hover:bg-slate-700/30 transition-colors min-w-[100px]"
                      >
                        <div className="flex items-center gap-1">
                          <span>Prazo</span>
                          <span className="material-symbols-outlined text-[14px] text-slate-400">
                            {monthlySortKey === 'prazo' ? (monthlySortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                          </span>
                        </div>
                      </th>
                      <th className="py-3.5 px-4 border-b-2 border-primary/40 text-right w-[8%] min-w-[70px]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {filteredMonthlyTasks.map(task => (
                      <tr key={task.id} className="hover:bg-slate-900/30 transition duration-150">
                        {/* Equipment Info */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-amber-500">{task.icone || 'precision_manufacturing'}</span>
                              <span className="font-bold text-slate-200">{task.ativos?.nome || 'Geral'}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 pl-6">
                              {task.ativos?.tag_id && (
                                <span className="text-[10px] bg-slate-800 border border-slate-700/80 text-primary font-mono px-1.5 py-0.5 rounded font-bold">
                                  {task.ativos.tag_id}
                                </span>
                              )}
                              {task.ativos?.setor && (
                                <span className="text-[10px] text-slate-400">
                                  • {task.ativos.setor}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Task Title & Desc */}
                        <td className="py-4 px-6 max-w-xs">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-200 text-sm truncate" title={task.titulo}>
                              {task.titulo}
                            </span>
                            <span className="text-xs text-slate-400 mt-1 line-clamp-1" title={task.descricao}>
                              {task.descricao || 'Sem descrição.'}
                            </span>
                          </div>
                        </td>

                        {/* Technician Dropdown */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1.5 max-w-[180px]">
                            <select
                              value={task.tecnico_responsavel || ''}
                              onChange={(e) => handleUpdateTechnician(task.id, e.target.value, 'tecnico_responsavel')}
                              disabled={!isAuthorized}
                              className="bg-slate-950 border border-slate-800/80 text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <option value="">-- Técnico 1 --</option>
                              {technicians.map(tech => (
                                <option key={tech.id} value={tech.id}>
                                  {tech.full_name} ({tech.role})
                                </option>
                              ))}
                            </select>
                            <select
                              value={task.tecnico_responsavel_2 || ''}
                              onChange={(e) => handleUpdateTechnician(task.id, e.target.value, 'tecnico_responsavel_2')}
                              disabled={!isAuthorized}
                              className="bg-slate-950 border border-slate-800/80 text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <option value="">-- Técnico 2 --</option>
                              {technicians.map(tech => (
                                <option key={tech.id} value={tech.id}>
                                  {tech.full_name} ({tech.role})
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* Status badge selector */}
                        <td className="py-4 px-6">
                          <div className="relative inline-block w-40">
                            {savingStatusId === task.id ? (
                              <span className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                Salvando...
                              </span>
                            ) : (
                              <div className="relative flex items-center w-full">
                                <span className={`absolute left-3.5 h-1.5 w-1.5 rounded-full pointer-events-none ${
                                  task.status === 'Concluído' ? 'bg-emerald-400' : 'bg-sky-400 animate-pulse'
                                }`}></span>
                                <select
                                  value={task.status}
                                  onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                                  disabled={!isAuthorized}
                                  className={`text-xs font-bold rounded-full pl-7 pr-8 py-1 border w-full focus:outline-none cursor-pointer disabled:cursor-not-allowed appearance-none transition-all ${
                                    task.status === 'Concluído'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                  }`}
                                >
                                  <option value="Em atendimento" className="bg-slate-900 text-sky-400">Em atendimento</option>
                                  <option value="Concluído" className="bg-slate-900 text-emerald-400">Concluído</option>
                                </select>
                                <span className="absolute right-2.5 material-symbols-outlined text-[16px] pointer-events-none text-slate-400">arrow_drop_down</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Deadline */}
                        <td className="py-4 px-6 text-xs text-slate-300">
                          {task.data_limite ? new Date(task.data_limite + 'T00:00:00').toLocaleDateString('pt-BR') : '---'}
                          {task.concluido_em && (
                            <div className="text-[10px] text-emerald-400 font-medium mt-1 whitespace-nowrap">
                              Feito: {new Date(task.concluido_em).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          {isAuthorized && (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => {
                                  if (task.ativos?.url && task.ativos.url.trim()) {
                                    window.open(task.ativos.url.startsWith('http') ? task.ativos.url : `https://${task.ativos.url}`, '_blank', 'noopener,noreferrer');
                                  } else {
                                    alert('Nenhum link cadastrado para este equipamento. Edite o ativo para definir um link.');
                                  }
                                }} 
                                className={`p-1.5 rounded transition cursor-pointer flex items-center justify-center ${
                                  task.ativos?.url && task.ativos.url.trim() 
                                    ? 'text-primary hover:bg-slate-800 hover:text-sky-400' 
                                    : 'text-slate-600 hover:bg-transparent cursor-not-allowed'
                                }`}
                                title={task.ativos?.url && task.ativos.url.trim() ? "Acessar Link do Ativo" : "Sem link cadastrado"}
                              >
                                <span className="material-symbols-outlined text-[18px]">link</span>
                              </button>
                              <button
                                onClick={() => handleOpenTaskModal(task)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                                title="Editar"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition cursor-pointer"
                                title="Excluir"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        // ================= ABA 2: PLANEJAMENTO ANUAL (SPREADSHEET GRID) =================
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Filters and Actions */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 relative w-full">
              <span className="material-symbols-outlined text-slate-500 absolute left-3 top-2.5 text-[20px]">search</span>
              <input
                type="text"
                placeholder="Buscar planejamentos por título, TAG ou equipamento..."
                value={planningSearch}
                onChange={(e) => setPlanningSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-primary placeholder-slate-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Ano Planejado:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
                >
                  {[selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Periodicidade:</span>
                <select
                  value={planningPeriodicityFilter}
                  onChange={(e) => setPlanningPeriodicityFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Todos">Todas</option>
                  {periodicities.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {isAuthorized && (
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => {
                      setImportMode('planning');
                      setIsImportModalOpen(true);
                    }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                    title="Importar cronograma de preventivas da planilha"
                  >
                    <span className="material-symbols-outlined text-[16px]">publish</span>
                    Importar Planilha
                  </button>

                  <button
                    onClick={() => handleOpenPlanModal()}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-blue-700 hover:from-primary/95 hover:to-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-lg shadow-primary/10 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Novo Planejamento
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Spreadsheet Table */}
          <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              {plans.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center">
                  <span className="material-symbols-outlined text-slate-600 text-5xl mb-3">settings_suggest</span>
                  <h3 className="text-slate-300 font-semibold text-lg">Sem modelos cadastrados</h3>
                  <p className="text-slate-500 text-sm max-w-md mt-1">
                    Adicione cronogramas preventivos recorrentes ou importe planilhas para modelar a rotina anual.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse table-auto lg:min-w-0">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-800/90 text-slate-100 text-[11px] font-bold uppercase tracking-widest sticky top-0 z-20">
                      <th 
                        className="py-3.5 px-4 border-b-2 border-primary/40 text-left select-none hover:bg-slate-700/30 transition-colors w-[15%] min-w-[120px]"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 cursor-pointer" onClick={() => handlePlanningSort('equipamento')}>
                            <span>Equipamento</span>
                            <span className="material-symbols-outlined text-[14px] text-slate-400">
                              {planningSortKey === 'equipamento' ? (planningSortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                            </span>
                          </div>
                          <input type="text" placeholder="Filtrar..." value={colFilterEquipamento} onChange={(e) => setColFilterEquipamento(e.target.value)} onClick={e => e.stopPropagation()} className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-300 focus:border-cyan-500 outline-none text-[10px] placeholder:text-slate-600 font-normal" />
                        </div>
                      </th>
                      <th 
                        className="py-3.5 px-4 border-b-2 border-primary/40 text-center select-none hover:bg-slate-700/30 transition-colors w-[9%] min-w-[70px]"
                      >
                        <div className="flex flex-col gap-1 items-center">
                          <div className="flex items-center justify-center gap-1 cursor-pointer" onClick={() => handlePlanningSort('tag')}>
                            <span>TAG (Patrimônio)</span>
                            <span className="material-symbols-outlined text-[14px] text-slate-400">
                              {planningSortKey === 'tag' ? (planningSortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                            </span>
                          </div>
                          <input type="text" placeholder="Filtrar..." value={colFilterTag} onChange={(e) => setColFilterTag(e.target.value)} onClick={e => e.stopPropagation()} className="w-[100px] bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-300 focus:border-cyan-500 outline-none text-[10px] placeholder:text-slate-600 font-normal" />
                        </div>
                      </th>
                      <th 
                        className="py-3.5 px-4 border-b-2 border-primary/40 text-center select-none hover:bg-slate-700/30 transition-colors w-[9%] min-w-[75px]"
                      >
                        <div className="flex flex-col gap-1 items-center">
                          <div className="flex items-center justify-center gap-1 cursor-pointer" onClick={() => handlePlanningSort('periodicidade')}>
                            <span>Periodicidade</span>
                            <span className="material-symbols-outlined text-[14px] text-slate-400">
                              {planningSortKey === 'periodicidade' ? (planningSortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                            </span>
                          </div>
                          <input type="text" placeholder="Filtrar..." value={colFilterPeriodicidade} onChange={(e) => setColFilterPeriodicidade(e.target.value)} onClick={e => e.stopPropagation()} className="w-[100px] bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-300 focus:border-cyan-500 outline-none text-[10px] placeholder:text-slate-600 font-normal" />
                        </div>
                      </th>

                      <th 
                        onClick={() => handlePlanningSort('setor')}
                        className="py-3.5 px-4 border-b-2 border-primary/40 cursor-pointer select-none hover:bg-slate-700/30 transition-colors w-[11%] min-w-[90px]"
                      >
                        <div className="flex items-center gap-1">
                          <span>Setor</span>
                          <span className="material-symbols-outlined text-[14px] text-slate-400">
                            {planningSortKey === 'setor' ? (planningSortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                          </span>
                        </div>
                      </th>
                      {monthsList.map(m => (
                        <th key={m.value} className="py-2 px-0.5 border-b-2 border-primary/40 text-center w-[4%] min-w-[32px]" title={m.name}>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px]">{m.name.slice(0, 3).toUpperCase()}</span>
                            <select
                              value={monthFilters[m.value] || 'Todos'}
                              onChange={(e) => handleMonthFilterChange(m.value, e.target.value as any)}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-slate-950 border border-slate-800 text-slate-400 text-[8px] rounded px-0 py-0.5 focus:outline-none focus:border-primary cursor-pointer w-7 text-center font-normal"
                            >
                              <option value="Todos">Tudo</option>
                              <option value="P">P</option>
                              <option value="R">R</option>
                              <option value="-">-</option>
                            </select>
                          </div>
                        </th>
                      ))}
                      <th className="py-3.5 px-4 border-b-2 border-primary/40 text-right w-[8%] min-w-[70px]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px]">
                    {filteredPlans.length === 0 ? (
                      <tr>
                        <td colSpan={17} className="py-12 text-center text-slate-500 font-medium">
                          <span className="material-symbols-outlined text-slate-600 text-3xl block mb-2">filter_alt_off</span>
                          Nenhum planejamento corresponde aos filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredPlans.map((plan, idx) => (
                        <tr key={plan.id} className={`hover:bg-primary/5 transition-all duration-150 ${idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-900/10'}`}>
                         {/* Equipment Name — no icon */}
                         <td className="py-3 px-4 border-b border-slate-800/60 font-bold text-white max-w-[140px] xl:max-w-[180px] truncate w-[15%] min-w-[120px]" title={plan.ativos?.nome || 'Ativo Geral'}>
                           {plan.ativos?.nome || 'Ativo Geral'}
                         </td>

                         {/* Tag */}
                         <td className="py-3 px-4 border-b border-slate-800/60 font-mono text-primary text-center font-bold text-sm max-w-[85px] truncate w-[9%] min-w-[70px]">
                           {plan.ativos?.tag_id || '---'}
                         </td>

                         {/* Periodicity */}
                         <td className="py-3 px-4 border-b border-slate-800/60 text-center font-medium max-w-[90px] truncate w-[9%] min-w-[75px]">
                           {plan.periodicidade === 'Mensal' ? (
                             <span className="inline-block px-2 py-0.5 bg-emerald-500/15 border border-emerald-400/40 text-emerald-400 text-[10px] rounded-full font-bold uppercase">
                               Mensal
                             </span>
                           ) : plan.periodicidade === 'Trimestral' ? (
                             <span className="inline-block px-2 py-0.5 bg-sky-500/15 border border-sky-400/40 text-sky-400 text-[10px] rounded-full font-bold uppercase">
                               Trimestral
                             </span>
                           ) : plan.periodicidade === 'Semestral' ? (
                             <span className="inline-block px-2 py-0.5 bg-violet-500/15 border border-violet-400/40 text-violet-400 text-[10px] rounded-full font-bold uppercase">
                               Semestral
                             </span>
                           ) : plan.periodicidade === 'Anual' ? (
                             <span className="inline-block px-2 py-0.5 bg-amber-500/15 border border-amber-400/40 text-amber-400 text-[10px] rounded-full font-bold uppercase">
                               Anual
                             </span>
                           ) : (
                             <span className="inline-block px-2 py-0.5 bg-slate-700/50 border border-slate-600 text-slate-300 text-[10px] rounded-full font-bold uppercase">
                               {plan.periodicidade}
                             </span>
                           )}
                         </td>

                         {/* Sector */}
                         <td className="py-3 px-4 border-b border-slate-800/60 text-slate-300 max-w-[110px] truncate w-[11%] min-w-[90px]" title={plan.ativos?.setor || '---'}>
                           {plan.ativos?.setor || '---'}
                         </td>

                         {/* 12 Months interactive cells */}
                         {monthsList.map(m => {
                           const isPlanned = plan.meses_execucao?.includes(m.value);
                           const taskInfo = yearlyTasksMap[plan.id]?.[m.value];
                           const isRealized = taskInfo?.status === 'Concluído';
                           
                           return (
                             <td
                               key={m.value}
                               onClick={() => toggleMonthInPlan(plan, m.value)}
                               className="p-0.5 border-b border-slate-800/60 text-center cursor-pointer select-none transition-all hover:bg-slate-700/30 w-[4%] min-w-[32px]"
                               title={`${m.name}: ${isRealized ? 'Realizado (R)' : isPlanned ? 'Planejado (P)' : 'Clique para planejar'}`}
                             >
                               <div className={`h-6 w-6 mx-auto flex items-center justify-center rounded-md font-bold text-[10px] transition-all duration-150 ${
                                 isRealized
                                   ? 'bg-sky-500/30 text-sky-200 border border-sky-400/60 shadow-[0_0_12px_rgba(56,189,248,0.3)] scale-105 font-black'
                                   : isPlanned
                                     ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.3)] scale-105 font-black'
                                     : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/50 hover:scale-105 rounded'
                               }`}>
                                 {isRealized ? 'R' : isPlanned ? 'P' : '-'}
                               </div>
                            </td>
                          );
                        })}

                        {/* Actions */}
                        <td className="py-3 px-4 border-b border-slate-800/60 text-right whitespace-nowrap">
                          {isAuthorized && (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenPlanModal(plan)}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition cursor-pointer"
                                title="Editar"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeletePlan(plan.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                                title="Excluir"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {/* Legend info panel */}
            <div className="border-t border-slate-700/50 p-3.5 bg-slate-800/40 flex gap-6 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-emerald-500/25 text-emerald-200 border border-emerald-400/50 flex items-center justify-center font-bold text-[10px]">P</div>
                <span>Manutenção Planejada / Previsão</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-sky-500/25 text-sky-200 border border-sky-400/50 flex items-center justify-center font-bold text-[10px]">R</div>
                <span>Manutenção Executada / Realizada</span>
              </div>
              <div className="ml-auto text-[10px] text-slate-500 italic">
                * Dica: Clique em qualquer célula acima para agendar/cancelar preventivas
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CADASTRO/EDIÇÃO DE MODELO (PLANEJAMENTO) ================= */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-xl bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col animate-scale-up">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{editingPlan ? 'edit_note' : 'add_task'}</span>
                {editingPlan ? 'Editar Planejamento' : 'Novo Planejamento Preventivo'}
              </h3>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1 transition cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="grid grid-cols-2 gap-4 overflow-y-auto max-h-[75vh] pr-1">
              {/* Asset Select */}
              <div className="col-span-2 space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-primary">precision_manufacturing</span>
                  Equipamento (Ativo)
                </label>
                <AssetSearchSelect
                  assets={assets}
                  value={planFormData.ativo_id}
                  onChange={(val) => setPlanFormData(prev => ({ ...prev, ativo_id: val }))}
                  placeholder="Pesquise o ativo por TAG, nome ou setor..."
                />
              </div>

              {/* Title */}
              <div className="col-span-2 space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-sky-400">title</span>
                  Título do Procedimento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Troca de filtros e lubrificação semestral"
                  value={planFormData.titulo}
                  onChange={(e) => {
                    const title = e.target.value;
                    const icon = detectIcon(title);
                    setPlanFormData(prev => ({ ...prev, titulo: title, icone: icon }));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary placeholder-slate-655 text-sm"
                  required
                />
              </div>

              {/* Icon Picker */}
              <div className="col-span-1 space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-violet-400">palette</span>
                  Ícone da Preventiva
                </label>
                <div className="flex gap-2">
                  {[
                    { val: 'settings', icon: 'settings' },
                    { val: 'assignment', icon: 'assignment' },
                    { val: 'priority_high', icon: 'priority_high' }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setPlanFormData(prev => ({ ...prev, icone: item.val }))}
                      className={`flex-1 flex items-center justify-center py-3 px-2 rounded-lg border transition-all cursor-pointer ${
                        planFormData.icone === item.val
                          ? 'bg-primary/20 text-primary border-primary shadow-[0_0_12px_rgba(14,165,233,0.25)]'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-650'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Periodicity */}
              <div className="col-span-1 space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">event_repeat</span>
                  Frequência
                </label>
                <select
                  value={planFormData.periodicidade}
                  onChange={(e) => setPlanFormData(prev => ({ ...prev, periodicidade: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary cursor-pointer text-sm"
                  required
                >
                  {periodicities.map(p => (
                    <option key={p} value={p} className="bg-slate-900">{p}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="col-span-2 space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-amber-500">description</span>
                  Instruções / Descrição
                </label>
                <textarea
                  placeholder="Instruções de execução da preventiva..."
                  rows={3}
                  value={planFormData.descricao}
                  onChange={(e) => setPlanFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary placeholder-slate-655 text-sm"
                />
              </div>

              {/* Months Selector */}
              <div className="col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-teal-400">calendar_month</span>
                  Meses de Execução
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {monthsList.map(m => {
                    const isSelected = planFormData.meses_execucao.includes(m.value);
                    return (
                      <button
                        type="button"
                        key={m.value}
                        onClick={() => toggleMonthSelection(m.value)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition duration-155 cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-[0_0_12px_rgba(14,165,233,0.25)] font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-650'
                        }`}
                      >
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="col-span-2 pt-6 flex justify-end gap-3 mt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-500 font-bold hover:text-white transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary hover:bg-sky-400 text-white font-bold rounded-lg shadow-neon transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {loading && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CADASTRO/EDIÇÃO DE PREVENTIVA INDIVIDUAL/AVULSA MENSAL ================= */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-xl bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col animate-scale-up">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{editingTask ? 'edit_note' : 'add_task'}</span>
                {editingTask ? 'Editar Preventiva do Mês' : 'Adicionar Preventiva Avulsa'}
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1 transition cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="grid grid-cols-2 gap-4 overflow-y-auto max-h-[75vh] pr-1">
              {/* Asset Select */}
              <div className="col-span-2 space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-primary">precision_manufacturing</span>
                  Equipamento (Ativo)
                </label>
                <AssetSearchSelect
                  assets={assets}
                  value={taskFormData.ativo_id}
                  onChange={(val) => setTaskFormData(prev => ({ ...prev, ativo_id: val }))}
                  placeholder="Pesquise o ativo por TAG, nome ou setor..."
                />
              </div>

              {/* Title */}
              <div className="col-span-2 space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-sky-400">title</span>
                  Título do Procedimento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Lubrificação de engrenagens"
                  value={taskFormData.titulo}
                  onChange={(e) => {
                    const title = e.target.value;
                    const icon = detectIcon(title);
                    setTaskFormData(prev => ({ ...prev, titulo: title, icone: icon }));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary placeholder-slate-655 text-sm"
                  required
                />
              </div>

              {/* Icon Picker */}
              <div className="col-span-1 space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-violet-400">palette</span>
                  Ícone da Preventiva
                </label>
                <div className="flex gap-2">
                  {[
                    { val: 'settings', icon: 'settings' },
                    { val: 'assignment', icon: 'assignment' },
                    { val: 'priority_high', icon: 'priority_high' }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setTaskFormData(prev => ({ ...prev, icone: item.val }))}
                      className={`flex-1 flex items-center justify-center py-3 px-2 rounded-lg border transition-all cursor-pointer ${
                        taskFormData.icone === item.val
                          ? 'bg-primary/20 text-primary border-primary shadow-[0_0_12px_rgba(14,165,233,0.25)]'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-655'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="col-span-1 space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-emerald-405">rule</span>
                  Status de Atendimento
                </label>
                <select
                  value={taskFormData.status}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary cursor-pointer text-sm"
                  required
                >
                  <option value="Em atendimento" className="bg-slate-900 text-sky-400">Em atendimento</option>
                  <option value="Concluído" className="bg-slate-900 text-emerald-400">Concluído</option>
                </select>
              </div>

              {/* Technician 1 (Optional) */}
              <div className="col-span-1 space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-amber-500">person</span>
                  Técnico Responsável 1
                </label>
                <select
                  value={taskFormData.tecnico_responsavel}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, tecnico_responsavel: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary cursor-pointer text-sm"
                >
                  <option value="" className="bg-slate-900">-- Não atribuído --</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id} className="bg-slate-900">
                      {tech.full_name} ({tech.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Technician 2 (Optional) */}
              <div className="col-span-1 space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-amber-500">person</span>
                  Técnico Responsável 2
                </label>
                <select
                  value={taskFormData.tecnico_responsavel_2}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, tecnico_responsavel_2: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary cursor-pointer text-sm"
                >
                  <option value="" className="bg-slate-900">-- Não atribuído --</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id} className="bg-slate-900">
                      {tech.full_name} ({tech.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Deadline */}
              <div className="col-span-2 space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-teal-400">calendar_today</span>
                  Prazo de Execução
                </label>
                <input
                  type="date"
                  value={taskFormData.data_limite}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, data_limite: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary cursor-pointer text-sm"
                />
              </div>

              {/* Description */}
              <div className="col-span-2 space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">description</span>
                  Instruções / Descrição
                </label>
                <textarea
                  placeholder="Instruções de execução..."
                  rows={3}
                  value={taskFormData.descricao}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary placeholder-slate-655 text-sm"
                />
              </div>

              {/* Footer Actions */}
              <div className="col-span-2 pt-6 flex justify-end gap-3 mt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-500 font-bold hover:text-white transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary hover:bg-sky-400 text-white font-bold rounded-lg shadow-neon transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {loading && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: UNIFIED FILE/CSV IMPORTER ================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col animate-scale-up">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">publish</span>
                {importMode === 'planning' ? 'Importar Modelos de Planejamento Anual' : 'Importar Distribuição de Preventivas'}
              </h3>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedData([]);
                  setImportText('');
                  setImportError('');
                  setImportSuccess('');
                }}
                className="text-slate-400 hover:text-white rounded-lg p-1 transition cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[75vh] pr-1">
              {/* Import Mode Toggle inside Modal */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-primary">sync_alt</span>
                  Modo de Importação
                </label>
                <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setImportMode('distribution');
                      setParsedData([]);
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      importMode === 'distribution' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Distribuição Mensal (Ordens do Mês)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportMode('planning');
                      setParsedData([]);
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      importMode === 'planning' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Cronograma Anual (Matriz de Planejamento)
                  </button>
                </div>
              </div>

              {/* Upload instructions */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs text-slate-400 flex flex-col gap-1.5">
                <span className="font-bold text-slate-200">Formatos Aceitos: Excel (.xlsx, .xls), CSV (separado por ponto e vírgula `;`) ou JSON</span>
                {importMode === 'planning' ? (
                  <>
                    <p>Detecta colunas JAN-DEZ marcadas com `P` ou `R` (assim como seu modelo de planilha) para programar as preventivas nos respectivos meses.</p>
                    <p className="font-semibold text-slate-300 mt-1">Colunas sugeridas:</p>
                    <code className="text-primary bg-slate-950 px-2.5 py-1.5 rounded font-mono block select-all text-[11px] border border-slate-800">
                      PATRIMONIO / TAG; EQUIPAMENTO; ATIVIDADE / TITULO; DESCRICAO; PERIODICIDADE; JAN; FEV; MAR...
                    </code>
                  </>
                ) : (
                  <>
                    <p>Cria as ordens de preventiva diretamente para a execução do mês selecionado ({monthsList.find(m => m.value === selectedMonth)?.name}/{selectedYear}).</p>
                    <p className="font-semibold text-slate-300 mt-1">Colunas sugeridas:</p>
                    <code className="text-primary bg-slate-950 px-2.5 py-1.5 rounded font-mono block select-all text-[11px] border border-slate-800">
                      TAG; EQUIPAMENTO; ATIVIDADE; DESCRICAO; TECNICO; PRAZO; ICONE
                    </code>
                  </>
                )}
                <span className="text-[10px] text-slate-500 italic mt-1">* Se a TAG do equipamento não existir, o ativo será cadastrado automaticamente no sistema.</span>
              </div>

              {/* Drag and Drop Zone */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-sky-400">upload_file</span>
                  Carregar Arquivo
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-slate-700 hover:border-primary/50 rounded-xl p-6 bg-slate-900/50 hover:bg-slate-900/80 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
                >
                  <span className="material-symbols-outlined text-[32px] text-slate-500 group-hover:text-primary transition-colors">upload_file</span>
                  <span className="text-xs text-slate-300 font-medium">Clique para selecionar ou arraste o arquivo aqui</span>
                  <span className="text-[10px] text-slate-500 font-mono">JSON, CSV, XLS, XLSX até 10MB</span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    accept=".json,.csv,.xls,.xlsx" 
                    className="hidden" 
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-800 flex-1"></div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ou Cole Dados CSV</span>
                <div className="h-px bg-slate-800 flex-1"></div>
              </div>

              {/* Raw CSV Text Area */}
              <div className="space-y-1.5">
                <textarea
                  placeholder="Cole linhas de sua planilha copiadas com Ctrl+C aqui (separadas por ponto e vírgula)..."
                  rows={4}
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    if (parsedData.length > 0) setParsedData([]);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-mono rounded-lg p-3 focus:outline-none focus:border-primary placeholder-slate-600"
                />
              </div>

              {/* Status and feedback */}
              {importError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold p-3 rounded-lg flex items-center gap-2 animate-fade-in">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {importError}
                </div>
              )}

              {importSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold p-3 rounded-lg flex items-center gap-2 animate-fade-in">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {importSuccess}
                </div>
              )}

              {/* Preview data section */}
              {parsedData.length > 0 && (
                <div className="flex flex-col gap-2 bg-slate-900 border border-slate-700 rounded-lg p-3 max-h-44 overflow-y-auto">
                  <span className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Prévia dos Dados carregados ({parsedData.length} registros)</span>
                    <button 
                      type="button" 
                      onClick={() => setParsedData([])} 
                      className="text-[10px] text-slate-500 hover:text-rose-400 underline cursor-pointer"
                    >
                      Limpar
                    </button>
                  </span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px] font-mono text-slate-450">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-300">
                          {Object.keys(parsedData[0] || {}).slice(0, 5).map((k, idx) => (
                            <th key={idx} className="pb-1.5 pr-3">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-800/50 last:border-0">
                            {Object.values(row || {}).slice(0, 5).map((val: any, vidx) => (
                              <td key={vidx} className="py-1 pr-3 truncate max-w-[120px]">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setParsedData([]);
                    setImportText('');
                    setImportError('');
                    setImportSuccess('');
                  }}
                  className="px-4 py-2 text-sm text-slate-500 font-bold hover:text-white transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={loading || (!importText.trim() && parsedData.length === 0)}
                  className="px-6 py-2 bg-primary hover:bg-sky-400 text-white font-bold rounded-lg shadow-neon transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
                  Confirmar Importação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Preventives;
