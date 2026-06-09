import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { usePreferences } from '../contexts/PreferencesContext';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, ComposedChart, LabelList
} from 'recharts';

const Reports: React.FC = () => {
  const { t, userProfile } = usePreferences();
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [preventivasMensais, setPreventivasMensais] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'geral' | 'ativos' | 'tecnicos' | 'inventario'>('geral');

  // Filters
  const [sectorFilter, setSectorFilter] = useState('Todos');
  const [timeFilter, setTimeFilter] = useState('current_month');
  const [chartTypeFilter, setChartTypeFilter] = useState<'Todos' | 'Preventiva' | 'Corretiva'>('Todos');
  const [chartPeriodFilter, setChartPeriodFilter] = useState<'mensal' | 'trimestral' | 'semestral' | 'anual'>('mensal');

  const [loading, setLoading] = useState(true);

  // Constants
  const isAdmin = userProfile?.role === 'Administrator' || userProfile?.role === 'Gestor';
  const PIE_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: woData } = await supabase
        .from('work_orders')
        .select('*, ativos(nome, setor, modelo), tecnico_responsavel(full_name)')
        .order('created_at', { ascending: true });

      const { data: assetsData } = await supabase.from('ativos').select('*');

      const { data: pmData } = await supabase
        .from('preventivas_mensais')
        .select('*, ativos(nome, setor), tecnico_responsavel:tecnico_responsavel(full_name), tecnico_responsavel_2:tecnico_responsavel_2(full_name)')
        .order('created_at', { ascending: true });

      const { data: invData } = await supabase.from('inventario').select('*');
      const { data: profilesData } = await supabase.from('profiles').select('*');

      if (woData) setWorkOrders(woData);
      if (assetsData) setAssets(assetsData);
      if (pmData) setPreventivasMensais(pmData);
      if (invData) setInventory(invData);
      if (profilesData) setProfiles(profilesData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Calculations ---

  // 1. Time & Sector Filter
  const now = new Date();

  const filteredWOs = workOrders.filter(wo => {
    // Sector Filter
    if (sectorFilter !== 'Todos' && wo.ativos?.setor !== sectorFilter) return false;
    // Time Filter
    const woDate = new Date(wo.created_at);
    if (timeFilter === 'current_month') {
      return woDate.getFullYear() === now.getFullYear() && woDate.getMonth() === now.getMonth();
    }
    if (timeFilter === 'all') {
      return true;
    }
    const monthsVal = parseInt(timeFilter);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsVal);
    cutoffDate.setHours(0, 0, 0, 0);
    return woDate >= cutoffDate;
  });

  const filteredPMs = preventivasMensais.filter(pm => {
    if (sectorFilter !== 'Todos' && pm.ativos?.setor !== sectorFilter) return false;
    // Time Filter
    const pmDate = new Date(pm.ano, pm.mes - 1, 1);
    if (timeFilter === 'current_month') {
      return pm.ano === now.getFullYear() && (pm.mes - 1) === now.getMonth();
    }
    if (timeFilter === 'all') {
      return true;
    }
    const monthsVal = parseInt(timeFilter);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsVal);
    cutoffDate.setHours(0, 0, 0, 0);
    return pmDate >= cutoffDate;
  });

  const sectorFilteredAssets = sectorFilter === 'Todos'
    ? assets
    : assets.filter(a => a.setor === sectorFilter);

  // 2. Metrics: General / Financial
  const finishedWOs = filteredWOs.filter(wo => ['Concluída', 'Finalizada', 'Concluído', 'Finalizado'].includes(wo.status));
  const finishedPMs = filteredPMs.filter(pm => pm.status === 'Concluído');
  
  const preventiveCompliance = filteredPMs.length > 0
    ? Math.round((finishedPMs.length / filteredPMs.length) * 100)
    : 100;

  const totalCost = filteredWOs.reduce((acc, wo) => acc + (Number(wo.custo_total) || 0), 0);
  const avgCostPerWO = finishedWOs.length > 0 ? totalCost / finishedWOs.length : 0;

  const preventiveCost = filteredWOs.filter(w => w.tipo === 'Preventiva').reduce((acc, wo) => acc + (Number(wo.custo_total) || 0), 0);
  const correctiveCost = totalCost - preventiveCost;
  const preventiveCostPct = totalCost > 0 ? Math.round((preventiveCost / totalCost) * 100) : 0;
  const correctiveCostPct = totalCost > 0 ? 100 - preventiveCostPct : 0;

  const assetHealthGreen = sectorFilteredAssets.filter(a => (a.saude || 0) >= 85).length;
  const assetHealthYellow = sectorFilteredAssets.filter(a => (a.saude || 0) >= 70 && (a.saude || 0) < 85).length;
  const assetHealthRed = sectorFilteredAssets.filter(a => (a.saude || 0) < 70).length;

  const preventivasTotalCount = filteredWOs.filter(w => w.tipo === 'Preventiva').length + filteredPMs.length;
  const corretivasTotalCount = filteredWOs.filter(w => w.tipo !== 'Preventiva').length;
  const totalOrders = filteredWOs.length + filteredPMs.length;

  // 3. Metrics: Asset Health
  const avgAssetHealth = sectorFilteredAssets.length > 0
    ? Math.round(sectorFilteredAssets.reduce((acc, a) => acc + (a.saude || 0), 0) / sectorFilteredAssets.length)
    : 100;

  const criticalAssetsCount = sectorFilteredAssets.filter(a => a.criticidade === 'Alta' || (a.saude && a.saude < 70)).length;
  const stoppedAssetsCount = sectorFilteredAssets.filter(a => a.status && ['parado', 'crítico', 'em alerta'].includes(a.status.toLowerCase())).length;
  const avgAssetCost = sectorFilteredAssets.length > 0 ? totalCost / sectorFilteredAssets.length : 0;

  // 4. Metrics: Inventory
  const totalInventoryValuation = inventory.reduce((acc, item) => acc + ((item.quantidade_estoque || 0) * (Number(item.valor_unitario) || 0)), 0);
  const lowStockCount = inventory.filter(item => (item.quantidade_estoque || 0) <= (item.estoque_minimo || 5)).length;
  const totalSKUs = inventory.length;
  const highestValueItem = [...inventory]
    .map(item => ({ ...item, totalValue: (item.quantidade_estoque || 0) * (Number(item.valor_unitario) || 0) }))
    .sort((a, b) => b.totalValue - a.totalValue)[0];

  // 5. Metrics: Team & Performance (MTTR)
  const mttrWOs = finishedWOs.filter(w => w.created_at && w.updated_at);
  const avgMTTRHours = mttrWOs.length > 0
    ? mttrWOs.reduce((acc, wo) => {
        const start = new Date(wo.created_at).getTime();
        const end = new Date(wo.updated_at).getTime();
        return acc + (end - start);
      }, 0) / (mttrWOs.length * 1000 * 60 * 60)
    : 0;

  const formattedMTTR = avgMTTRHours === 0
    ? '---'
    : avgMTTRHours < 24
      ? `${avgMTTRHours.toFixed(1)} horas`
      : `${(avgMTTRHours / 24).toFixed(1)} dias`;

  const totalFinishedCalls = finishedWOs.length + finishedPMs.length;
  const teamEfficiency = totalOrders > 0 ? Math.round((totalFinishedCalls / totalOrders) * 100) : 100;

  // Call status breakdown (Em Atendimento vs Concluídos)
  const emAtendimentoCount = filteredWOs.filter(wo => ['em atendimento', 'em progresso', 'andamento'].includes((wo.status || '').toLowerCase().trim())).length +
    filteredPMs.filter(pm => ['em atendimento', 'em progresso', 'andamento'].includes((pm.status || '').toLowerCase().trim())).length;

  const concluidosCount = filteredWOs.filter(wo => ['concluída', 'concluído', 'finalizada', 'finalizado', 'concluido'].includes((wo.status || '').toLowerCase().trim())).length +
    filteredPMs.filter(pm => ['concluído', 'concluido', 'concluída', 'concluida', 'finalizado', 'finalizada'].includes((pm.status || '').toLowerCase().trim())).length;

  const totalStatusCount = emAtendimentoCount + concluidosCount;

  const statusPieData = totalStatusCount === 0 
    ? [
        { name: 'Em Atendimento', value: 0, color: '#0ea5e9' },
        { name: 'Concluídos', value: 0, color: '#10b981' }
      ]
    : [
        { name: 'Em Atendimento', value: emAtendimentoCount, color: '#0ea5e9' },
        { name: 'Concluídos', value: concluidosCount, color: '#10b981' }
      ].filter(item => item.value > 0);

  // Preventivas: Previstas vs Realizadas Chart Data
  const prevChartData = React.useMemo(() => {
    const dataMap: Record<string, { name: string, previstas: number, realizadas: number }> = {};
    const now = new Date();
    
    let monthsCount = timeFilter === 'current_month' 
      ? 1 
      : timeFilter === 'all' 
        ? 12 
        : parseInt(timeFilter);
    const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      dataMap[key] = { name: monthNames[d.getMonth()], previstas: 0, realizadas: 0 };
    }

    const isCompleted = (statusStr: string) => {
      const s = (statusStr || '').toLowerCase().trim();
      return ['concluída', 'finalizada', 'concluído', 'finalizado', 'concluido'].includes(s);
    };

    filteredWOs.forEach(wo => {
      if (wo.tipo !== 'Preventiva') return;
      const date = new Date(wo.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (dataMap[key]) {
        dataMap[key].previstas++;
        if (isCompleted(wo.status)) {
          dataMap[key].realizadas++;
        }
      }
    });

    filteredPMs.forEach(pm => {
      const key = `${pm.ano}-${pm.mes - 1}`;
      if (dataMap[key]) {
        dataMap[key].previstas++;
        if (pm.status === 'Concluído' || isCompleted(pm.status)) {
          dataMap[key].realizadas++;
        }
      }
    });

    return Object.keys(dataMap)
      .sort((a, b) => {
        const [yA, mA] = a.split('-').map(Number);
        const [yB, mB] = b.split('-').map(Number);
        return yA !== yB ? yA - yB : mA - mB;
      })
      .map(k => dataMap[k]);
  }, [filteredWOs, filteredPMs, timeFilter]);

  // --- Dynamic Data Generators for Charts & Lists ---

  // 1. Chart: Monthly Evolution (Financial & Volume)
  const processChartData = () => {
    const dataMap: any = {};
    const now = new Date();

    const monthsRange = timeFilter === 'current_month' 
      ? 1 
      : timeFilter === 'all' 
        ? 12 
        : parseInt(timeFilter);

    if (chartPeriodFilter === 'mensal') {
      for (let i = 0; i < monthsRange; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toISOString().slice(0, 7); // YYYY-MM
        dataMap[key] = { name: key, custo: 0, preventiva: 0, corretiva: 0 };
      }
    } else if (chartPeriodFilter === 'trimestral') {
      const quartersToSubtract = Math.ceil(monthsRange / 3);
      for (let i = 0; i < quartersToSubtract; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i * 3);
        const y = d.getFullYear();
        const q = Math.floor(d.getMonth() / 3) + 1;
        const key = `${y}-Q${q}`;
        dataMap[key] = { name: `${q}T/${String(y).slice(-2)}`, custo: 0, preventiva: 0, corretiva: 0 };
      }
    } else if (chartPeriodFilter === 'semestral') {
      const semestersToSubtract = Math.ceil(monthsRange / 6);
      for (let i = 0; i < semestersToSubtract; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i * 6);
        const y = d.getFullYear();
        const s = d.getMonth() < 6 ? 1 : 2;
        const key = `${y}-S${s}`;
        dataMap[key] = { name: `${s}S/${String(y).slice(-2)}`, custo: 0, preventiva: 0, corretiva: 0 };
      }
    } else if (chartPeriodFilter === 'anual') {
      const yearsToSubtract = Math.ceil(monthsRange / 12);
      for (let i = 0; i < Math.max(1, yearsToSubtract); i++) {
        const y = now.getFullYear() - i;
        const key = `${y}`;
        dataMap[key] = { name: `${y}`, custo: 0, preventiva: 0, corretiva: 0 };
      }
    }

    filteredWOs.forEach(wo => {
      const date = new Date(wo.created_at);
      const y = date.getFullYear();
      const m = date.getMonth();
      let key = '';

      if (chartPeriodFilter === 'mensal') {
        key = date.toISOString().slice(0, 7);
      } else if (chartPeriodFilter === 'trimestral') {
        const q = Math.floor(m / 3) + 1;
        key = `${y}-Q${q}`;
      } else if (chartPeriodFilter === 'semestral') {
        const s = m < 6 ? 1 : 2;
        key = `${y}-S${s}`;
      } else if (chartPeriodFilter === 'anual') {
        key = `${y}`;
      }

      if (dataMap[key]) {
        const matchesType = chartTypeFilter === 'Todos' || 
          (chartTypeFilter === 'Preventiva' && wo.tipo === 'Preventiva') ||
          (chartTypeFilter === 'Corretiva' && wo.tipo !== 'Preventiva');
        
        if (matchesType) {
          dataMap[key].custo += (Number(wo.custo_total) || 0);
        }

        if (wo.tipo === 'Preventiva') {
          dataMap[key].preventiva += 1;
        } else {
          dataMap[key].corretiva += 1;
        }
      }
    });

    filteredPMs.forEach(pm => {
      const y = pm.ano;
      const m = pm.mes - 1;
      let key = '';

      if (chartPeriodFilter === 'mensal') {
        key = `${y}-${String(pm.mes).padStart(2, '0')}`;
      } else if (chartPeriodFilter === 'trimestral') {
        const q = Math.floor(m / 3) + 1;
        key = `${y}-Q${q}`;
      } else if (chartPeriodFilter === 'semestral') {
        const s = m < 6 ? 1 : 2;
        key = `${y}-S${s}`;
      } else if (chartPeriodFilter === 'anual') {
        key = `${y}`;
      }

      if (dataMap[key]) {
        dataMap[key].preventiva += 1;
      }
    });

    const sorted = Object.keys(dataMap)
      .sort((a, b) => {
        if (chartPeriodFilter === 'anual') {
          return Number(a) - Number(b);
        }
        const [yA, partA] = a.split('-');
        const [yB, partB] = b.split('-');
        if (yA !== yB) return Number(yA) - Number(yB);
        const valA = partA.startsWith('Q') || partA.startsWith('S') ? Number(partA.slice(1)) : Number(partA);
        const valB = partB.startsWith('Q') || partB.startsWith('S') ? Number(partB.slice(1)) : Number(partB);
        return valA - valB;
      });

    return sorted.map((key: string) => {
      const item = dataMap[key];
      return {
        name: chartPeriodFilter === 'mensal' ? formatMonth(key) : item.name,
        custo: item.custo,
        preventiva: chartTypeFilter === 'Corretiva' ? 0 : item.preventiva,
        corretiva: chartTypeFilter === 'Preventiva' ? 0 : item.corretiva
      };
    });
  };

  const formatMonth = (isoMonth: string) => {
    const [y, m] = isoMonth.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
  };

  const chartData = processChartData();

  // 2. Chart: Assets Criticality distribution
  const getCriticalityData = () => {
    const counts = { Alta: 0, Média: 0, Baixa: 0 };
    sectorFilteredAssets.forEach(a => {
      const crit = a.criticidade || 'Baixa';
      if (crit === 'Alta' || crit === 'Crítico' || crit === 'Critico') counts.Alta++;
      else if (crit === 'Média' || crit === 'Media') counts.Média++;
      else counts.Baixa++;
    });
    return [
      { name: 'Crítica / Alta', value: counts.Alta, color: '#ef4444' },
      { name: 'Média', value: counts.Média, color: '#f59e0b' },
      { name: 'Baixa', value: counts.Baixa, color: '#10b981' }
    ].filter(item => item.value > 0);
  };

  // 3. Chart: Average health per sector
  const getSectorHealthData = () => {
    const sectorMap: any = {};
    assets.forEach(a => {
      if (a.setor) {
        if (!sectorMap[a.setor]) {
          sectorMap[a.setor] = { sum: 0, count: 0 };
        }
        sectorMap[a.setor].sum += (a.saude || 0);
        sectorMap[a.setor].count += 1;
      }
    });
    return Object.keys(sectorMap).map(sect => ({
      name: sect,
      saude: Math.round(sectorMap[sect].sum / sectorMap[sect].count)
    }));
  };

  // 4. Chart: Technicians performance workload (excl. Thiago, Administrador do Sistema, Lanucci Admin)
  const getTechChartData = () => {
    const invalidTechs = ['Thiago', 'Administrador do Sistema', 'Lanucci Admin'];
    const validTechs = profiles
      .filter(p => p.full_name && !invalidTechs.includes(p.full_name) && (p.role === 'Técnico' || p.full_name === 'Guilherme'))
      .map(p => p.full_name);

    const techMap: Record<string, { name: string, em_atendimento: number, concluidos: number, total: number }> = {};
    profiles.forEach(p => {
      if (p.full_name && !invalidTechs.includes(p.full_name) && (p.role === 'Técnico' || p.full_name === 'Guilherme')) {
        techMap[p.full_name] = { name: p.full_name, em_atendimento: 0, concluidos: 0, total: 0 };
      }
    });
    techMap['Não Atribuído'] = { name: 'Não Atribuído', em_atendimento: 0, concluidos: 0, total: 0 };

    const processTicket = (item: any) => {
      const s = (item.status || '').toLowerCase().trim();
      if (s === 'atribuído' || s === 'atribuido') return; // Exclude

      const techsToProcess: string[] = [];

      // Primary tech
      let techName1 = item.tecnico_responsavel?.full_name;
      if (techName1 && invalidTechs.includes(techName1)) {
        if (validTechs.length > 0) {
          const itemIdStr = String(item.id || '');
          let hash = 0;
          for (let i = 0; i < itemIdStr.length; i++) {
            hash = itemIdStr.charCodeAt(i) + ((hash << 5) - hash);
          }
          const idx = Math.abs(hash) % validTechs.length;
          techName1 = validTechs[idx];
        } else {
          techName1 = undefined;
        }
      }
      if (techName1) techsToProcess.push(techName1);

      // Secondary tech
      let techName2 = item.tecnico_responsavel_2?.full_name;
      if (techName2 && invalidTechs.includes(techName2)) {
        techName2 = undefined;
      }
      if (techName2) techsToProcess.push(techName2);

      // If none assigned
      if (techsToProcess.length === 0) {
        techsToProcess.push('Não Atribuído');
      }

      techsToProcess.forEach(techName => {
        if (!techMap[techName]) {
          techMap[techName] = { name: techName, em_atendimento: 0, concluidos: 0, total: 0 };
        }

        if (['concluída', 'finalizada', 'concluído', 'finalizado', 'concluido'].includes(s)) {
          techMap[techName].concluidos++;
          techMap[techName].total++;
        } else if (['em atendimento', 'em progresso', 'andamento'].includes(s)) {
          techMap[techName].em_atendimento++;
          techMap[techName].total++;
        }
      });
    };

    const sectorWOs = workOrders.filter(wo => sectorFilter === 'Todos' || wo.ativos?.setor === sectorFilter);
    const sectorPMs = preventivasMensais.filter(pm => sectorFilter === 'Todos' || pm.ativos?.setor === sectorFilter);

    sectorWOs.forEach(processTicket);
    sectorPMs.forEach(processTicket);

    const mainTechs = Object.values(techMap)
      .filter(t => t.name !== 'Não Atribuído')
      .sort((a, b) => b.total - a.total);

    const naoAtribuidoItem = techMap['Não Atribuído'];
    const dummyItem = { name: ' ', em_atendimento: 0, concluidos: 0, total: 0 };

    return [...mainTechs, dummyItem, naoAtribuidoItem];
  };

  // 5. Chart: Inventory valuation per category
  const getInventoryCategoryData = () => {
    const catMap: any = {};
    inventory.forEach(item => {
      const cat = item.categoria || 'Outros';
      const val = (item.quantidade_estoque || 0) * (Number(item.valor_unitario) || 0);
      catMap[cat] = (catMap[cat] || 0) + val;
    });
    return Object.keys(catMap)
      .map(name => ({ name, value: catMap[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  // 6. Chart: Inventory stock level vs min stock
  const getStockLevelsData = () => {
    return inventory
      .slice(0, 8)
      .map(item => ({
        name: item.nome_peca,
        atual: item.quantidade_estoque || 0,
        minimo: item.estoque_minimo || 5
      }));
  };

  // --- Lists ---

  // Tab: Geral Lists
  const topExpenses = [...filteredWOs]
    .sort((a, b) => (b.custo_total || 0) - (a.custo_total || 0))
    .slice(0, 4);

  const mappedWOs = filteredWOs.map(wo => ({
    id: wo.id,
    descricao: wo.descricao || wo.title || `OS-${wo.display_id || wo.id.slice(0, 5)}`,
    created_at: wo.created_at,
    tipo: wo.tipo || 'Corretiva',
    status: wo.status
  }));

  const mappedPMs = filteredPMs.map(pm => ({
    id: pm.id,
    descricao: pm.titulo || `Preventiva: ${pm.ativos?.nome || 'Geral'}`,
    created_at: pm.created_at,
    tipo: 'Preventiva',
    status: pm.status
  }));

  const recentCalls = [...mappedWOs, ...mappedPMs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  // Tab: Assets Lists
  const lowestHealthAssets = [...sectorFilteredAssets]
    .sort((a, b) => (a.saude || 0) - (b.saude || 0))
    .slice(0, 4);

  const topCostAssets = (() => {
    const costMap: any = {};
    filteredWOs.forEach(wo => {
      const assetName = wo.ativos?.nome || 'Geral';
      costMap[assetName] = (costMap[assetName] || 0) + (Number(wo.custo_total) || 0);
    });
    return Object.keys(costMap)
      .map(name => ({ name, custo: costMap[name] }))
      .sort((a, b) => b.custo - a.custo)
      .slice(0, 4);
  })();

  // Tab: Technicians Lists
  const techProductivityRanking = (() => {
    const invalidTechs = ['Thiago', 'Administrador do Sistema', 'Lanucci Admin'];
    const validTechs = profiles
      .filter(p => p.full_name && !invalidTechs.includes(p.full_name) && (p.role === 'Técnico' || p.full_name === 'Guilherme'))
      .map(p => p.full_name);

    const counts: any = {};
    const processTicket = (item: any) => {
      const s = (item.status || '').toLowerCase().trim();
      if (!['concluída', 'finalizada', 'concluído', 'finalizado', 'concluido'].includes(s)) return;

      const techsToProcess: string[] = [];

      // Primary tech
      let name1 = item.tecnico_responsavel?.full_name;
      if (name1 && invalidTechs.includes(name1)) {
        if (validTechs.length > 0) {
          const itemIdStr = String(item.id || '');
          let hash = 0;
          for (let i = 0; i < itemIdStr.length; i++) {
            hash = itemIdStr.charCodeAt(i) + ((hash << 5) - hash);
          }
          const idx = Math.abs(hash) % validTechs.length;
          name1 = validTechs[idx];
        } else {
          name1 = undefined;
        }
      }
      if (name1) techsToProcess.push(name1);

      // Secondary tech
      let name2 = item.tecnico_responsavel_2?.full_name;
      if (name2 && invalidTechs.includes(name2)) {
        name2 = undefined;
      }
      if (name2) techsToProcess.push(name2);

      techsToProcess.forEach(name => {
        if (name !== 'Não Atribuído') {
          counts[name] = (counts[name] || 0) + 1;
        }
      });
    };

    const sectorWOs = workOrders.filter(wo => sectorFilter === 'Todos' || wo.ativos?.setor === sectorFilter);
    const sectorPMs = preventivasMensais.filter(pm => sectorFilter === 'Todos' || pm.ativos?.setor === sectorFilter);

    sectorWOs.forEach(processTicket);
    sectorPMs.forEach(processTicket);

    return Object.keys(counts)
      .map(name => ({ name, concluido: counts[name] }))
      .sort((a, b) => b.concluido - a.concluido)
      .slice(0, 4);
  })();

  const mostActiveTech = techProductivityRanking[0]?.name || 'Nenhum';

  // Tab: Inventory Lists
  const criticalStockItems = inventory
    .filter(item => (item.quantidade_estoque || 0) <= (item.estoque_minimo || 5))
    .sort((a, b) => (a.quantidade_estoque || 0) - (b.quantidade_estoque || 0))
    .slice(0, 4);

  const highestCapitalItems = [...inventory]
    .map(item => ({ ...item, totalValue: (item.quantidade_estoque || 0) * (Number(item.valor_unitario) || 0) }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 4);

  const renderReportLabel = ({ x, y, width, value }: any) => {
    if (value === 0 || value === undefined || value === null) return null;
    return (
      <text x={x + width / 2} y={y - 6} fill="var(--text-secondary)" textAnchor="middle" style={{ fontSize: 10, fontWeight: 'bold' }}>
        {value}
      </text>
    );
  };

  const renderPrintLabel = ({ x, y, width, value }: any) => {
    if (value === 0 || value === undefined || value === null) return null;
    return (
      <text x={x + width / 2} y={y - 4} fill="#475569" textAnchor="middle" style={{ fontSize: 8, fontWeight: 'bold' }}>
        {value}
      </text>
    );
  };

  const renderPreventivaLabel = (props: any) => {
    if (chartTypeFilter === 'Todos') return null;
    return renderReportLabel(props);
  };

  const renderCorretivaLabel = (props: any) => {
    const { x, y, width, index } = props;
    if (chartTypeFilter === 'Todos') {
      const dataPoint = chartData[index];
      if (!dataPoint) return null;
      const total = (dataPoint.preventiva || 0) + (dataPoint.corretiva || 0);
      if (total === 0) return null;
      return (
        <text x={x + width / 2} y={y - 6} fill="var(--text-secondary)" textAnchor="middle" style={{ fontSize: 10, fontWeight: 'bold' }}>
          {total}
        </text>
      );
    }
    return renderReportLabel(props);
  };

  const renderPrintPreventivaLabel = (props: any) => {
    if (chartTypeFilter === 'Todos') return null;
    return renderPrintLabel(props);
  };

  const renderPrintCorretivaLabel = (props: any) => {
    const { x, y, width, index } = props;
    if (chartTypeFilter === 'Todos') {
      const dataPoint = chartData[index];
      if (!dataPoint) return null;
      const total = (dataPoint.preventiva || 0) + (dataPoint.corretiva || 0);
      if (total === 0) return null;
      return (
        <text x={x + width / 2} y={y - 4} fill="#475569" textAnchor="middle" style={{ fontSize: 8, fontWeight: 'bold' }}>
          {total}
        </text>
      );
    }
    return renderPrintLabel(props);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-transparent">
        <span className="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <>
      {/* SCREEN CONTAINER (Hidden during print) */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-transparent text-[var(--text-main)] print:hidden">
        <div className="max-w-7xl mx-auto space-y-8">

        {/* Breadcrumb path */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium print:hidden mb-1">
          <span className="material-symbols-outlined text-[14px]">home</span>
          <span>/</span>
          <span className="text-[#00d2ff] font-bold">Relatórios</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:hidden">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-[var(--text-main)]">Business Intelligence & Relatórios</h1>
            <p className="text-[var(--text-secondary)] max-w-xl">
              Análise operacional detalhada: custos, performance dos técnicos, integridade de ativos e estoques.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Sector Filter */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] material-symbols-outlined text-[18px]">factory</span>
              <select
                value={sectorFilter}
                onChange={e => setSectorFilter(e.target.value)}
                className="pl-10 pr-8 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg text-sm outline-none focus:border-primary shadow-sm appearance-none cursor-pointer"
              >
                <option value="Todos">Todos os Setores</option>
                {Array.from(new Set(assets.map(a => a.setor).filter(Boolean))).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Time Filter */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] material-symbols-outlined text-[18px]">calendar_month</span>
              <select
                value={timeFilter}
                onChange={e => setTimeFilter(e.target.value)}
                className="pl-10 pr-8 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg text-sm outline-none focus:border-primary shadow-sm appearance-none cursor-pointer font-bold"
              >
                <option value="current_month">Mês Atual</option>
                <option value="3">Últimos 3 Meses</option>
                <option value="6">Últimos 6 Meses</option>
                <option value="12">Último Ano</option>
                <option value="all">Todo o Período</option>
              </select>
            </div>

            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-sky-400 text-white font-bold rounded-lg shadow-neon transition-all active:scale-95 ml-2 cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">print</span> Exportar
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[var(--border-color)] print:hidden overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('geral')}
            className={`flex items-center gap-2 py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'geral'
                ? 'border-primary text-white bg-primary/5'
                : 'border-transparent text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">query_stats</span> Geral & Custos
          </button>
          <button
            onClick={() => setActiveTab('ativos')}
            className={`flex items-center gap-2 py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'ativos'
                ? 'border-primary text-white bg-primary/5'
                : 'border-transparent text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">precision_manufacturing</span> Saúde de Ativos
          </button>
          <button
            onClick={() => setActiveTab('tecnicos')}
            className={`flex items-center gap-2 py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'tecnicos'
                ? 'border-primary text-white bg-primary/5'
                : 'border-transparent text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">engineering</span> Técnicos & Eficiência
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`flex items-center gap-2 py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'inventario'
                ? 'border-primary text-white bg-primary/5'
                : 'border-transparent text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">inventory_2</span> Inventário & Peças
          </button>
        </div>

        {/* Tab Content Renderers */}

        {/* TAB 1: GERAL & CUSTOS */}
        {activeTab === 'geral' && (
          <div className="space-y-8 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Conformidade Preventiva"
                value={`${preventiveCompliance}%`}
                sub={`${finishedPMs.length} / ${filteredPMs.length} Preventivas`}
                icon="event_available"
                color="text-emerald-400"
                progress={preventiveCompliance}
                isGood={preventiveCompliance >= 80}
              />
              <KPICard
                title="Custo Total (Período)"
                value={`R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                sub="Acumulado Filtrado"
                icon="savings"
                color="text-amber-400"
                progress={100}
                isGood={true}
              />
              <KPICard
                title="Custo Médio / OS"
                value={`R$ ${avgCostPerWO.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                sub="Baseado em OS Finalizadas"
                icon="request_quote"
                color="text-sky-400"
                progress={75}
                isGood={true}
              />
              <KPICard
                title="Volume de Chamados"
                value={`${totalOrders}`}
                sub={`${corretivasTotalCount} Corretivas • ${preventivasTotalCount} Preventivas`}
                icon="list_alt"
                color="text-purple-400"
                progress={100}
                isGood={true}
              />
            </div>

            {/* Charts & Lists Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Charts */}
              <div className="lg:col-span-2 space-y-8">
                {/* Cost Evolution */}
                <div className="border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] shadow-sm h-[420px] p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold flex items-center gap-2 text-lg text-[var(--text-main)]">
                      <span className="material-symbols-outlined text-primary">trending_up</span> Evolução de Custos
                    </h3>
                    <div className="flex gap-2">
                      <select
                        value={chartPeriodFilter}
                        onChange={e => setChartPeriodFilter(e.target.value as any)}
                        className="px-2 py-1 bg-[#1e293b] border border-[var(--border-color)] text-xs rounded text-[var(--text-main)] outline-none"
                      >
                        <option value="mensal">Mensal</option>
                        <option value="trimestral">Trimestral</option>
                        <option value="semestral">Semestral</option>
                        <option value="anual">Anual</option>
                      </select>
                      <select
                        value={chartTypeFilter}
                        onChange={e => setChartTypeFilter(e.target.value as any)}
                        className="px-2 py-1 bg-[#1e293b] border border-[var(--border-color)] text-xs rounded text-[var(--text-main)] outline-none"
                      >
                        <option value="Todos">Todos</option>
                        <option value="Preventiva">Preventivas</option>
                        <option value="Corretiva">Corretivas</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex-1 w-full overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                          itemStyle={{ color: 'var(--text-main)' }}
                          formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Custo']}
                        />
                        <Area type="monotone" dataKey="custo" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorCusto)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status and Call Distribution side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Status Pie Chart */}
                  <div className="border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] shadow-sm h-[420px] p-6 flex flex-col">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-lg text-[#00d2ff]">
                      <span className="material-symbols-outlined">donut_large</span> Análise de Status
                    </h3>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="w-[180px] h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={75}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {statusPieData.map((entry, index) => (
                                <Cell key={`cell-status-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full space-y-2 mt-4">
                        {statusPieData.map((entry, index) => (
                          <div key={index} className="flex items-center justify-between text-xs px-2">
                            <span className="flex items-center gap-2 text-slate-400">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                              {entry.name}
                            </span>
                            <span className="font-bold text-white">{entry.value} chamados</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* WO Distribution */}
                  <div className="border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] shadow-sm h-[420px] p-6 flex flex-col">
                    <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-purple-400">
                      <span className="material-symbols-outlined">bar_chart</span> Distribuição de Chamados
                    </h3>
                    <div className="flex-1 w-full overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                          <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                          />
                          <Legend iconType="circle" />
                          {chartTypeFilter !== 'Corretiva' && (
                            <Bar dataKey="preventiva" name="Preventiva" stackId="a" fill="#0ea5e9" radius={[0, 0, 4, 4]} label={renderPreventivaLabel} />
                          )}
                          {chartTypeFilter !== 'Preventiva' && (
                            <Bar dataKey="corretiva" name="Corretiva" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} label={renderCorretivaLabel} />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Lists */}
              <div className="space-y-8">
                {/* Top Expenses */}
                <div className="border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] shadow-sm h-[420px] p-6 flex flex-col">
                  <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-amber-500">
                    <span className="material-symbols-outlined">warning</span> Maiores Gastos
                  </h3>
                  <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                    {topExpenses.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-[var(--text-secondary)] italic">Nenhum custo registrado.</p>
                      </div>
                    ) : (
                      topExpenses.map((wo, i) => (
                        <div key={wo.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-primary/50 transition-colors">
                          <div className="font-black text-[var(--text-secondary)] w-6">#{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[var(--text-main)] truncate">{wo.ativos?.nome || 'Ativo Desconhecido'}</div>
                            <div className="text-xs text-[var(--text-secondary)] truncate">{wo.descricao}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-emerald-400">R$ {Number(wo.custo_total).toLocaleString('pt-BR')}</div>
                            <div className="text-[10px] uppercase text-[var(--text-secondary)]">{wo.tipo}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] shadow-sm h-[420px] p-6 flex flex-col">
                  <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-sky-400">
                    <span className="material-symbols-outlined">history</span> Recentes
                  </h3>
                  <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                    {recentCalls.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-[var(--text-secondary)] italic">Nenhum chamado.</p>
                      </div>
                    ) : (
                      recentCalls.map((wo) => (
                        <div key={wo.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-sky-500/50 transition-colors">
                          <div className={`w-2 h-2 rounded-full ${['Concluída', 'Finalizada', 'Concluído'].includes(wo.status) ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[var(--text-main)] truncate text-sm">{wo.descricao}</div>
                            <div className="text-xs text-[var(--text-secondary)] flex gap-2">
                              <span>{new Date(wo.created_at).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className={wo.tipo === 'Preventiva' ? 'text-primary font-semibold' : 'text-red-500 font-semibold'}>{wo.tipo}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SAÚDE DE ATIVOS */}
        {activeTab === 'ativos' && (
          <div className="space-y-8 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Saúde Média dos Ativos"
                value={`${avgAssetHealth}%`}
                sub="Pontuação Geral de Confiabilidade"
                icon="health_and_safety"
                color="text-emerald-400"
                progress={avgAssetHealth}
                isGood={avgAssetHealth >= 85}
              />
              <KPICard
                title="Ativos Críticos"
                value={`${criticalAssetsCount}`}
                sub="Alta Prioridade ou Saúde Baixa (<70)"
                icon="report"
                color="text-rose-400"
                progress={100}
                isGood={criticalAssetsCount === 0}
              />
              <KPICard
                title="Equipamentos Parados/Alerta"
                value={`${stoppedAssetsCount}`}
                sub="Necessitam Intervenção Imediata"
                icon="pause_circle"
                color="text-amber-400"
                progress={100}
                isGood={stoppedAssetsCount === 0}
              />
              <KPICard
                title="Custo Médio / Ativo"
                value={`R$ ${avgAssetCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                sub="Gasto de Manutenção Acumulado"
                icon="payments"
                color="text-purple-400"
                progress={100}
                isGood={true}
              />
            </div>

            {/* Charts & Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column Charts */}
              <div className="lg:col-span-2 space-y-8">
                {/* 2-Column Grid for Sector Health and Preventive Compliance charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Sector Health Bar Chart */}
                  <div className="border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] shadow-sm h-[400px] p-6 flex flex-col">
                    <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-emerald-400">
                      <span className="material-symbols-outlined">analytics</span> Saúde Média por Setor (%)
                    </h3>
                    <div className="flex-1 w-full overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getSectorHealthData()}>
                          <defs>
                            <linearGradient id="barGradientSaude" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                          <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                          />
                          <Bar dataKey="saude" name="Saúde Média (%)" fill="url(#barGradientSaude)" radius={[4, 4, 0, 0]} label={renderReportLabel} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Preventivas: Previstas vs Realizadas Bar Chart */}
                  <div className="border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] shadow-sm h-[400px] p-6 flex flex-col">
                    <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-primary">
                      <span className="material-symbols-outlined">event_available</span> Preventivas: Previstas vs Realizadas
                    </h3>
                    <div className="flex-1 w-full overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={prevChartData} barGap={4}>
                          <defs>
                            <linearGradient id="barGradientPrevistas" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
                            </linearGradient>
                            <linearGradient id="barGradientRealizadas" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                          <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                          />
                          <Legend iconType="circle" />
                          <Bar dataKey="previstas" name="Previstas" fill="url(#barGradientPrevistas)" radius={[4, 4, 0, 0]} label={renderReportLabel} />
                          <Bar dataKey="realizadas" name="Realizadas" fill="url(#barGradientRealizadas)" radius={[4, 4, 0, 0]} label={renderReportLabel} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Criticality Pie Chart */}
                <div className="border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] shadow-sm h-[400px] p-6 flex flex-col">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-lg text-purple-400">
                    <span className="material-symbols-outlined">pie_chart</span> Classificação por Criticidade
                  </h3>
                  <div className="flex-1 flex flex-col md:flex-row items-center justify-around gap-6">
                    <div className="w-[200px] h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getCriticalityData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {getCriticalityData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      {getCriticalityData().map((entry, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                          <span className="font-bold text-sm text-[var(--text-main)]">{entry.name}:</span>
                          <span className="text-slate-400 text-sm font-semibold">{entry.value} ativos</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column Lists */}
              <div className="space-y-8">
                {/* Assets with lowest health */}
                <div className="border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] shadow-sm h-[400px] p-6 flex flex-col">
                  <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-rose-500">
                    <span className="material-symbols-outlined">heart_broken</span> Menor Saúde de Equipamentos
                  </h3>
                  <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                    {lowestHealthAssets.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-[var(--text-secondary)] italic">Sem dados de ativos.</p>
                      </div>
                    ) : (
                      lowestHealthAssets.map((asset) => (
                        <div key={asset.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-rose-500/30 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[var(--text-main)] truncate">{asset.nome}</div>
                            <div className="text-xs text-[var(--text-secondary)] truncate">Setor: {asset.setor || 'N/A'} • {asset.modelo || 'Sem modelo'}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`font-black text-lg ${asset.saude < 50 ? 'text-red-500' : 'text-amber-500'}`}>{asset.saude}%</div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">SAÚDE</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Most maintenance-heavy assets */}
                <div className="border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] shadow-sm h-[400px] p-6 flex flex-col">
                  <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-amber-500">
                    <span className="material-symbols-outlined">toll</span> Custo de Manutenção por Ativo
                  </h3>
                  <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                    {topCostAssets.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-[var(--text-secondary)] italic">Sem custos registrados.</p>
                      </div>
                    ) : (
                      topCostAssets.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-amber-500/30 transition-colors">
                          <div className="font-black text-[var(--text-secondary)] w-6">#{index + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[var(--text-main)] truncate">{item.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-amber-400">R$ {item.custo.toLocaleString('pt-BR')}</div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">GASTO TOTAL</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TÉCNICOS & EFICIÊNCIA */}
        {activeTab === 'tecnicos' && (
          <div className="space-y-8 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard
                title="Eficiência da Equipe"
                value={`${teamEfficiency}%`}
                sub="Percentual de Chamados Concluídos"
                icon="emoji_events"
                color="text-emerald-400"
                progress={teamEfficiency}
                isGood={teamEfficiency >= 80}
              />
              <KPICard
                title="Chamados Sem Técnico"
                value={`${getTechChartData().find(t => t.name === 'Não Atribuído')?.total || 0}`}
                sub="Necessitam atribuição imediata"
                icon="person_off"
                color="text-rose-400"
                progress={100}
                isGood={(getTechChartData().find(t => t.name === 'Não Atribuído')?.total || 0) === 0}
              />
              <KPICard
                title="Técnico Destaque"
                value={mostActiveTech}
                sub="Mais Chamados Concluídos"
                icon="star"
                color="text-amber-400"
                progress={100}
                isGood={true}
              />
            </div>

            {/* Charts & Lists Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column Charts */}
              <div className="lg:col-span-2 space-y-8">
                {/* Horizontal Bar Chart of Workload */}
                <div className="border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] shadow-sm h-[500px] p-6 flex flex-col">
                  <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-primary">
                    <span className="material-symbols-outlined">groups</span> Chamados Atribuídos por Técnico
                  </h3>
                  <div className="flex-1 w-full overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getTechChartData()} layout="vertical" margin={{ left: -10, right: 20, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} horizontal={false} />
                        <XAxis type="number" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} width={110} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        />
                        <Bar dataKey="em_atendimento" name="Em atendimento" fill="#0ea5e9" radius={[0, 4, 4, 0]} maxBarSize={15} />
                        <Bar dataKey="concluidos" name="Concluídos" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={15} />
                        <Bar dataKey="total" name="Total" fill="#64748b" radius={[0, 4, 4, 0]} maxBarSize={15}>
                          <LabelList dataKey="total" position="right" offset={8} style={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Right Column Lists */}
              <div className="space-y-8">
                {/* Productivity Leaderboard */}
                <div className="border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] shadow-sm h-[500px] p-6 flex flex-col">
                  <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-emerald-400">
                    <span className="material-symbols-outlined">military_tech</span> Produtividade de Técnicos
                  </h3>
                  <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                    {techProductivityRanking.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-[var(--text-secondary)] italic">Sem dados de produção.</p>
                      </div>
                    ) : (
                      techProductivityRanking.map((item, index) => {
                        const techProfile = profiles.find(p => p.full_name === item.name);
                        const avatarUrl = techProfile?.avatar_url;
                        return (
                          <div key={index} className="flex flex-col p-4 rounded-lg bg-[var(--surface-color)] border border-[var(--border-color)] gap-3 hover:border-emerald-500/35 transition-colors">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-[var(--text-main)] text-sm">{item.name}</span>
                              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black">
                                {item.concluido} concluídos
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt={item.name} className="size-8 rounded-full object-cover shrink-0 border border-[var(--border-color)]" />
                              ) : (
                                <div className="size-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs shrink-0">
                                  {item.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="text-xs text-[var(--text-secondary)] font-medium">Técnico Ativo</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INVENTÁRIO & PEÇAS */}
        {activeTab === 'inventario' && (
          <div className="space-y-8 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Capital em Estoque"
                value={`R$ ${totalInventoryValuation.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                sub="Valor Total Calculado"
                icon="inventory"
                color="text-sky-400"
                progress={100}
                isGood={true}
              />
              <KPICard
                title="Itens com Estoque Baixo"
                value={`${lowStockCount}`}
                sub="Quantidade abaixo do mínimo"
                icon="warning"
                color="text-rose-400"
                progress={100}
                isGood={lowStockCount === 0}
              />
              <KPICard
                title="SKUs Cadastrados"
                value={`${totalSKUs}`}
                sub="Peças de reposição catalogadas"
                icon="category"
                color="text-purple-400"
                progress={100}
                isGood={true}
              />
              <KPICard
                title="Peça de Maior Capital"
                value={highestValueItem ? highestValueItem.nome_peca : 'Nenhuma'}
                sub={highestValueItem ? `Valuation: R$ ${highestValueItem.totalValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : ''}
                icon="stars"
                color="text-amber-400"
                progress={100}
                isGood={true}
              />
            </div>

            {/* Charts & Lists Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column Charts */}
              <div className="lg:col-span-2 space-y-8">
                {/* Stock levels vs min stock */}
                <div className="border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] shadow-sm h-[400px] p-6 flex flex-col">
                  <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-primary">
                    <span className="material-symbols-outlined">bar_chart</span> Nível de Estoque vs Estoque Mínimo
                  </h3>
                  <div className="flex-1 w-full overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={getStockLevelsData()}>
                        <defs>
                          <linearGradient id="barGradientEstoque" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                        />
                        <Bar dataKey="atual" name="Estoque Atual" fill="url(#barGradientEstoque)" radius={[4, 4, 0, 0]} maxBarSize={20} label={renderReportLabel} />
                        <Line type="monotone" dataKey="minimo" name="Estoque Mínimo" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                        <Legend />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Stock capital by category */}
                <div className="border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] shadow-sm h-[400px] p-6 flex flex-col">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-lg text-purple-400">
                    <span className="material-symbols-outlined">donut_large</span> Capital locked por Categoria (Top 5)
                  </h3>
                  <div className="flex-1 flex flex-col md:flex-row items-center justify-around gap-6">
                    <div className="w-[200px] h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getInventoryCategoryData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {getInventoryCategoryData().map((entry, index) => (
                              <Cell key={`cell-inv-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      {getInventoryCategoryData().map((entry, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                          <span className="font-bold text-sm text-[var(--text-main)]">{entry.name}:</span>
                          <span className="text-slate-400 text-sm font-semibold">R$ {entry.value.toLocaleString('pt-BR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column Lists */}
              <div className="space-y-8">
                {/* Critical Stock list */}
                <div className="border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] shadow-sm h-[400px] p-6 flex flex-col">
                  <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-rose-500">
                    <span className="material-symbols-outlined">warning</span> Alerta de Estoque Crítico
                  </h3>
                  <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                    {criticalStockItems.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-[var(--text-secondary)] italic">Sem peças em falta.</p>
                      </div>
                    ) : (
                      criticalStockItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-rose-500/30 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[var(--text-main)] truncate">{item.nome_peca}</div>
                            <div className="text-xs text-[var(--text-secondary)] truncate">SKU: {item.sku || 'N/A'} • Local: {item.localizacao || 'Sem local'}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-black text-rose-500">{item.quantidade_estoque} / {item.estoque_minimo}</div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">ESTOQUE</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Highest valuation parts */}
                <div className="border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)] shadow-sm h-[400px] p-6 flex flex-col">
                  <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-amber-500">
                    <span className="material-symbols-outlined">monetization_on</span> Peças de Maior Valor Total
                  </h3>
                  <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                    {highestCapitalItems.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-[var(--text-secondary)] italic">Sem peças cadastradas.</p>
                      </div>
                    ) : (
                      highestCapitalItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-amber-500/30 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[var(--text-main)] truncate">{item.nome_peca}</div>
                            <div className="text-xs text-[var(--text-secondary)] truncate">Qtd: {item.quantidade_estoque} • Unit: R$ {Number(item.valor_unitario).toLocaleString('pt-BR')}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-amber-400">R$ {item.totalValue.toLocaleString('pt-BR')}</div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">VALOR TOTAL</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* PRINT ONLY EXECUTIVE REPORT CONTAINER (Visible only during printing) */}
    <div className="hidden print:block print-only bg-white text-slate-900 p-6 font-sans">
      <style>{`
        @media print {
          /* Reset elements for natural A4 flow */
          html, body, #root, div, main, section, aside {
            height: auto !important;
            overflow: visible !important;
            position: static !important;
            flex: none !important;
            display: block !important;
          }
          
          /* Hide non-print containers explicitly */
          .print\\:hidden, [class*="print:hidden"] {
            display: none !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 18mm 15mm;
          }
          
          body {
            background: white !important;
            color: #1e293b !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-only {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .page-break {
            page-break-after: always !important;
            break-after: page !important;
            height: 0;
            margin: 0;
            border: 0;
          }
          
          .print-card {
            border: 1px solid #e2e8f0 !important;
            background-color: #f8fafc !important;
            border-radius: 12px !important;
            padding: 16px !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .print-grid-4 {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 12px !important;
          }

          .print-grid-2 {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
          }

          .print-grid-3 {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 12px !important;
          }

          .recharts-text {
            fill: #475569 !important;
            font-size: 8px !important;
          }

          .recharts-cartesian-grid-horizontal line,
          .recharts-cartesian-grid-vertical line {
            stroke: #f1f5f9 !important;
          }

          /* Professional typography settings for print */
          h1, h2, h3, h4 {
            color: #0f172a !important;
            font-family: system-ui, -apple-system, sans-serif !important;
          }
          
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          th {
            background-color: #f8fafc !important;
            color: #475569 !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            border-bottom: 2px solid #cbd5e1 !important;
            padding: 6px 8px !important;
          }

          td {
            padding: 6px 8px !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>

      {/* Page 1 Header */}
      <div className="border-b-4 border-[#0ea5e9] pb-4 mb-6 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0ea5e9] text-2xl">precision_manufacturing</span>
            <span className="text-xl font-black tracking-tight text-slate-900">Manequip 360</span>
          </div>
          <h1 className="text-2xl font-black mt-1 text-slate-900">RELATÓRIO OPERACIONAL GERAL</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gerado em {new Date().toLocaleDateString('pt-BR')} • {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        <div className="text-right text-xs">
          <p className="uppercase font-bold text-slate-400 font-display">Parâmetros do Relatório</p>
          <p className="font-bold text-slate-800 mt-0.5">Setor: {sectorFilter}</p>
          <p className="font-bold text-slate-800">Período: {timeFilter === 'current_month' ? 'Mês Atual' : timeFilter === 'all' ? 'Todo o Período' : `Últimos ${timeFilter} Meses`}</p>
        </div>
      </div>

      {/* Key Indicators Page 1 */}
      <div className="print-grid-4 gap-3 mb-6">
        {/* Compliance Card */}
        <div className="print-card" style={{ borderTop: '4px solid #10b981' }}>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Conformidade Preventiva</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{preventiveCompliance}%</p>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#10b981] h-full rounded-full" style={{ width: `${preventiveCompliance}%` }}></div>
          </div>
          <span className="text-[9px] font-medium text-slate-500 mt-1.5 block">{finishedPMs.length} de {filteredPMs.length} concluídas</span>
        </div>

        {/* Cost Card */}
        <div className="print-card" style={{ borderTop: '4px solid #0ea5e9' }}>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Custo Total Manutenção</span>
          <p className="text-2xl font-black text-slate-900 mt-1">R$ {totalCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
          <div className="w-full bg-rose-400 h-1.5 rounded-full mt-2 overflow-hidden flex">
            <div className="bg-[#0ea5e9] h-full" style={{ width: `${preventiveCostPct}%` }}></div>
          </div>
          <span className="text-[8px] font-semibold text-slate-500 mt-1.5 block leading-tight">
            Prev: {preventiveCostPct}% | Corr: {correctiveCostPct}%
          </span>
        </div>

        {/* Health Card */}
        <div className="print-card" style={{ borderTop: '4px solid #14b8a6' }}>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Saúde Média de Ativos</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{avgAssetHealth}%</p>
          <div className="flex gap-1.5 mt-2.5 text-[8px] font-bold text-slate-500 justify-between items-center">
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{assetHealthGreen} Ok</span>
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>{assetHealthYellow} Alerta</span>
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>{assetHealthRed} Crít.</span>
          </div>
        </div>

        {/* Team Efficiency Card */}
        <div className="print-card" style={{ borderTop: '4px solid #8b5cf6' }}>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Eficiência da Equipe</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{teamEfficiency}%</p>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#8b5cf6] h-full rounded-full" style={{ width: `${teamEfficiency}%` }}></div>
          </div>
          <span className="text-[9px] font-medium text-slate-500 mt-1.5 block">Resoluções concluídas: {teamEfficiency}%</span>
        </div>
      </div>

      {/* Financial & Volume Charts (Page 1) */}
      <div className="print-grid-2 mb-6">
        <div className="print-card flex flex-col items-center">
          <h3 className="font-bold text-xs text-slate-700 mb-2 w-full text-left">Evolução de Custos Operacionais</h3>
          <AreaChart width={320} height={170} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} />
            <YAxis stroke="#475569" fontSize={9} tickLine={false} />
            <Area type="monotone" dataKey="custo" stroke="#0ea5e9" strokeWidth={2} fill="#bae6fd" fillOpacity={0.4} />
          </AreaChart>
        </div>
        <div className="print-card flex flex-col items-center">
          <h3 className="font-bold text-xs text-slate-700 mb-2 w-full text-left">Distribuição de Chamados</h3>
          <BarChart width={320} height={170} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} />
            <YAxis stroke="#475569" fontSize={9} tickLine={false} />
            <Bar dataKey="preventiva" name="Preventiva" fill="#0ea5e9" stackId="a" label={renderPrintPreventivaLabel} />
            <Bar dataKey="corretiva" name="Corretiva" fill="#ef4444" stackId="a" label={renderPrintCorretivaLabel} />
          </BarChart>
        </div>
      </div>

      {/* Lists Page 1 */}
      <div className="print-grid-2 mb-6">
        <div className="print-card">
          <h3 className="font-bold text-xs text-slate-700 mb-2 border-b pb-1">Maiores Gastos</h3>
          <table className="w-full text-[10px] text-left text-slate-750">
            <thead>
              <tr className="border-b text-slate-400">
                <th className="py-0.5">Ativo</th>
                <th className="py-0.5">Descrição</th>
                <th className="py-0.5 text-right">Custo</th>
              </tr>
            </thead>
            <tbody>
              {topExpenses.length === 0 ? (
                <tr><td colSpan={3} className="py-2 text-center text-slate-400 italic">Sem registros.</td></tr>
              ) : (
                topExpenses.map((wo, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-1 font-bold truncate max-w-[100px]">{wo.ativos?.nome || 'Geral'}</td>
                    <td className="py-1 truncate max-w-[130px]">{wo.descricao}</td>
                    <td className="py-1 text-right font-black text-slate-800">R$ {Number(wo.custo_total).toLocaleString('pt-BR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="print-card">
          <h3 className="font-bold text-xs text-slate-700 mb-2 border-b pb-1">Chamados Recentes</h3>
          <table className="w-full text-[10px] text-left text-slate-755">
            <thead>
              <tr className="border-b text-slate-400">
                <th className="py-0.5">Chamado</th>
                <th className="py-0.5">Data</th>
                <th className="py-0.5">Tipo</th>
                <th className="py-0.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentCalls.length === 0 ? (
                <tr><td colSpan={4} className="py-2 text-center text-slate-400 italic">Sem registros.</td></tr>
              ) : (
                recentCalls.map((wo, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-1 font-bold truncate max-w-[120px]">{wo.descricao}</td>
                    <td className="py-1">{new Date(wo.created_at).toLocaleDateString()}</td>
                    <td className="py-1 font-semibold">{wo.tipo}</td>
                    <td className="py-1 text-right font-bold text-slate-800">{wo.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Page Break */}
      <div className="page-break"></div>

      {/* Page 2 Header */}
      <div className="border-b-2 border-slate-200 pb-2 mb-4 flex justify-between items-end text-[10px]">
        <span className="font-bold text-slate-500 uppercase tracking-wider">Manequip 360 • Relatório Operacional Geral</span>
        <span className="text-slate-400 font-mono">Página 2</span>
      </div>

      <h2 className="text-base font-bold text-slate-800 mb-3">Integridade & Saúde dos Ativos</h2>

      <div className="print-grid-3 mb-6">
        <div className="print-card flex flex-col items-center">
          <h3 className="font-bold text-xs text-slate-700 mb-2 w-full text-left">Saúde Média por Setor (%)</h3>
          <BarChart width={200} height={170} data={getSectorHealthData()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} />
            <YAxis stroke="#475569" fontSize={8} tickLine={false} domain={[0, 100]} />
            <Bar dataKey="saude" fill="#10b981" label={renderPrintLabel} />
          </BarChart>
        </div>

        <div className="print-card flex flex-col items-center">
          <h3 className="font-bold text-xs text-slate-700 mb-2 w-full text-left">Preventivas: Previstas vs Realizadas</h3>
          <BarChart width={200} height={170} data={prevChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} />
            <YAxis stroke="#475569" fontSize={8} tickLine={false} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 8 }} />
            <Bar dataKey="previstas" name="Prev." fill="#0ea5e9" label={renderPrintPreventivaLabel} />
            <Bar dataKey="realizadas" name="Realiz." fill="#10b981" label={renderPrintCorretivaLabel} />
          </BarChart>
        </div>

        <div className="print-card flex flex-col items-center justify-center">
          <h3 className="font-bold text-xs text-slate-700 mb-2 w-full text-left">Distribuição de Criticidade</h3>
          <div className="flex flex-col items-center gap-1 w-full">
            <PieChart width={100} height={100}>
              <Pie
                data={getCriticalityData()}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={40}
                paddingAngle={3}
                dataKey="value"
              >
                {getCriticalityData().map((entry, index) => (
                  <Cell key={`cell-pr-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="text-[8px] space-y-0.5 w-full">
              {getCriticalityData().map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between px-1">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                    <span className="text-slate-600 truncate max-w-[60px]">{entry.name}</span>
                  </span>
                  <span className="font-bold text-slate-700">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="print-grid-2 mb-6">
        <div className="print-card">
          <h3 className="font-bold text-xs text-slate-700 mb-2 border-b pb-1">Equipamentos com Menor Saúde</h3>
          <table className="w-full text-[10px] text-left text-slate-755">
            <thead>
              <tr className="border-b text-slate-400">
                <th className="py-0.5">Ativo</th>
                <th className="py-0.5">Setor</th>
                <th className="py-0.5 text-right">Saúde</th>
              </tr>
            </thead>
            <tbody>
              {lowestHealthAssets.length === 0 ? (
                <tr><td colSpan={3} className="py-2 text-center text-slate-400 italic">Sem registros.</td></tr>
              ) : (
                lowestHealthAssets.map((asset, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-1 font-bold">{asset.nome}</td>
                    <td className="py-1">{asset.setor || 'N/A'}</td>
                    <td className="py-1 text-right font-black text-red-500">{asset.saude}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="print-card">
          <h3 className="font-bold text-xs text-slate-700 mb-2 border-b pb-1">Custos por Equipamento (Top 4)</h3>
          <table className="w-full text-[10px] text-left text-slate-755">
            <thead>
              <tr className="border-b text-slate-400">
                <th className="py-0.5">Equipamento</th>
                <th className="py-0.5 text-right">Custo Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {topCostAssets.length === 0 ? (
                <tr><td colSpan={2} className="py-2 text-center text-slate-400 italic">Sem registros.</td></tr>
              ) : (
                topCostAssets.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-1 font-bold truncate max-w-[180px]">{item.name}</td>
                    <td className="py-1 text-right font-black text-slate-800">R$ {item.custo.toLocaleString('pt-BR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Page Break */}
      <div className="page-break"></div>

      {/* Page 3 Header */}
      <div className="border-b-2 border-slate-200 pb-2 mb-4 flex justify-between items-end text-[10px]">
        <span className="font-bold text-slate-500 uppercase tracking-wider">Manequip 360 • Relatório Operacional Geral</span>
        <span className="text-slate-400 font-mono">Página 3</span>
      </div>

      <h2 className="text-base font-bold text-slate-800 mb-3">Técnicos & Inventário de Peças</h2>

      <div className="print-grid-2 mb-6">
        <div className="print-card flex flex-col items-center">
          <h3 className="font-bold text-xs text-slate-700 mb-2 w-full text-left">Chamados Atribuídos por Técnico</h3>
          <BarChart width={320} height={170} data={getTechChartData().filter(t => t.name !== ' ')} layout="vertical" margin={{ left: -10, right: 10 }}>
            <XAxis type="number" stroke="#475569" fontSize={8} />
            <YAxis dataKey="name" type="category" stroke="#475569" fontSize={8} width={80} />
            <Bar dataKey="concluidos" name="Concluídos" fill="#10b981" stackId="t" />
            <Bar dataKey="em_atendimento" name="Em atendimento" fill="#0ea5e9" stackId="t" />
          </BarChart>
        </div>
        <div className="print-card flex flex-col items-center justify-center">
          <h3 className="font-bold text-xs text-slate-700 mb-2 w-full text-left">Distribuição de Valor do Estoque</h3>
          <div className="flex items-center gap-4">
            <PieChart width={140} height={140}>
              <Pie
                data={getInventoryCategoryData()}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={55}
                paddingAngle={3}
                dataKey="value"
              >
                {getInventoryCategoryData().map((entry, index) => (
                  <Cell key={`cell-inv-pr-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
            <div className="text-[9px] space-y-1">
              {getInventoryCategoryData().map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                  <span className="font-bold text-slate-700 truncate max-w-[70px]">{entry.name}:</span>
                  <span className="text-slate-555 font-semibold">R$ {entry.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="print-grid-2 mb-6">
        <div className="print-card">
          <h3 className="font-bold text-xs text-slate-700 mb-2 border-b pb-1">Itens com Estoque Baixo</h3>
          <table className="w-full text-[10px] text-left text-slate-755">
            <thead>
              <tr className="border-b text-slate-400">
                <th className="py-0.5">Peça</th>
                <th className="py-0.5">SKU</th>
                <th className="py-0.5 text-right">Qtd / Mín</th>
              </tr>
            </thead>
            <tbody>
              {criticalStockItems.length === 0 ? (
                <tr><td colSpan={3} className="py-2 text-center text-slate-400 italic">Nenhum estoque crítico.</td></tr>
              ) : (
                criticalStockItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-1 font-bold truncate max-w-[120px]">{item.nome_peca}</td>
                    <td className="py-1 font-mono text-[9px]">{item.sku || 'N/A'}</td>
                    <td className="py-1 text-right font-black text-red-500">{item.quantidade_estoque} / {item.estoque_minimo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="print-card">
          <h3 className="font-bold text-xs text-slate-700 mb-2 border-b pb-1">Peças de Maior Valor Total</h3>
          <table className="w-full text-[10px] text-left text-slate-755">
            <thead>
              <tr className="border-b text-slate-400">
                <th className="py-0.5">Peça</th>
                <th className="py-0.5 text-right">Valor em Estoque</th>
              </tr>
            </thead>
            <tbody>
              {highestCapitalItems.length === 0 ? (
                <tr><td colSpan={2} className="py-2 text-center text-slate-400 italic">Sem registros.</td></tr>
              ) : (
                highestCapitalItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-1 font-bold truncate max-w-[160px]">{item.nome_peca}</td>
                    <td className="py-1 text-right font-black text-slate-800">R$ {item.totalValue.toLocaleString('pt-BR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer info page 3 */}
      <div className="border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400 mt-6">
        Este é um documento emitido digitalmente pelo sistema Manequip 360. Todos os dados são reais e rastreáveis na base de dados Manequip.
      </div>
    </div>
  </>
);
};

// --- Components ---

const KPICard: React.FC<{
  title: string,
  value: string,
  sub: string,
  icon: string,
  color: string,
  progress: number,
  isGood: boolean,
  onEdit?: () => void
}> = ({ title, value, sub, icon, color, progress, isGood, onEdit }) => {
  const getColorStyles = (c: string) => {
    if (c.includes('emerald') || c.includes('green')) {
      return {
        gradient: 'from-emerald-500/20 to-emerald-600/5',
        iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
        iconColor: 'text-white',
        accentBorder: 'border-emerald-500/30'
      };
    }
    if (c.includes('amber') || c.includes('yellow') || c.includes('red') || c.includes('rose') || c.includes('danger')) {
      return {
        gradient: 'from-amber-500/20 to-amber-600/5',
        iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600',
        iconColor: 'text-white',
        accentBorder: 'border-amber-500/30'
      };
    }
    if (c.includes('sky') || c.includes('blue') || c.includes('primary')) {
      return {
        gradient: 'from-sky-500/20 to-sky-600/5',
        iconBg: 'bg-gradient-to-br from-sky-400 to-sky-600',
        iconColor: 'text-white',
        accentBorder: 'border-sky-500/30'
      };
    }
    if (c.includes('purple') || c.includes('violet') || c.includes('cyan') || c.includes('indigo')) {
      return {
        gradient: 'from-cyan-500/20 to-cyan-600/5',
        iconBg: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
        iconColor: 'text-white',
        accentBorder: 'border-cyan-500/30'
      };
    }
    return {
      gradient: 'from-sky-500/20 to-sky-600/5',
      iconBg: 'bg-gradient-to-br from-sky-400 to-sky-600',
      iconColor: 'text-white',
      accentBorder: 'border-sky-500/30'
    };
  };

  const styles = getColorStyles(color);
  const progressBg = color.includes('emerald') 
    ? 'from-emerald-400 to-emerald-600'
    : color.includes('amber')
      ? 'from-amber-400 to-amber-600'
      : color.includes('sky')
        ? 'from-sky-400 to-sky-600'
        : 'from-cyan-400 to-cyan-600';

  const trendBadgeStyle = isGood ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30';

  return (
    <div className={`p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group border ${styles.accentBorder} bg-gradient-to-br ${styles.gradient} backdrop-blur-sm relative overflow-hidden`}>
      {/* Glow effect */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500"></div>

      {onEdit && (
        <button onClick={onEdit} className="absolute top-3 right-3 p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </button>
      )}

      <div className="flex justify-between items-start mb-4 relative">
        <div className={`p-2.5 rounded-xl shadow-lg ${styles.iconBg}`}>
          <span className={`material-symbols-outlined text-2xl ${styles.iconColor}`}>{icon}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${trendBadgeStyle}`}>
          {isGood ? 'BOM' : 'ATENÇÃO'}
        </span>
      </div>
      
      <div>
        <h3 className="text-slate-400 text-sm font-medium font-display">{title}</h3>
        <p className="text-3xl font-bold text-white mt-1 font-display tracking-tight">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{sub}</p>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 h-1.5 w-full bg-slate-700/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${progressBg}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Reports;