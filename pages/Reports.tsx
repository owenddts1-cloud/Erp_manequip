import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { usePreferences } from '../contexts/PreferencesContext';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const Reports: React.FC = () => {
  const { t, userProfile } = usePreferences();
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);

  // Filters
  const [sectorFilter, setSectorFilter] = useState('Todos');
  const [timeFilter, setTimeFilter] = useState('6'); // Default 6 months

  const [loading, setLoading] = useState(true);

  // Constants
  const isAdmin = userProfile?.role === 'Administrator' || userProfile?.role === 'Gestor';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: woData } = await supabase
        .from('work_orders')
        .select('*, ativos(nome, setor, modelo)')
        .order('created_at', { ascending: true });

      const { data: assetsData } = await supabase.from('ativos').select('*');

      if (woData) setWorkOrders(woData);
      if (assetsData) setAssets(assetsData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Calculations ---

  // 1. Filter Logic
  const monthsToSubtract = parseInt(timeFilter);
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsToSubtract);

  const filteredWOs = workOrders.filter(wo => {
    // Sector Filter
    if (sectorFilter !== 'Todos' && wo.ativos?.setor !== sectorFilter) return false;
    // Time Filter
    const woDate = new Date(wo.created_at);
    return woDate >= cutoffDate;
  });

  // 2. Metric: Preventive Analysis
  const preventives = filteredWOs.filter(wo => wo.tipo === 'Preventiva');
  const finishedPreventives = preventives.filter(wo => ['Concluída', 'Finalizada', 'Concluído'].includes(wo.status));
  const preventiveCompliance = preventives.length > 0
    ? Math.round((finishedPreventives.length / preventives.length) * 100)
    : 100;

  // 3. Metric: Financial Analysis
  const totalCost = filteredWOs.reduce((acc, wo) => acc + (Number(wo.custo_total) || 0), 0);
  const closedWOs = filteredWOs.filter(wo => ['Concluída', 'Finalizada', 'Concluído'].includes(wo.status));
  const avgCostPerWO = closedWOs.length > 0 ? totalCost / closedWOs.length : 0;

  // 4. Metric: Work Order Volume (Replaces Asset Health)
  const totalOrders = filteredWOs.length;

  // 5. Chart Data: Monthly Evolution (Financial & Volume)
  const processChartData = () => {
    const dataMap: any = {};

    // Create buckets for the selected period
    for (let i = 0; i < monthsToSubtract; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7); // YYYY-MM
      dataMap[key] = { name: key, custo: 0, preventiva: 0, corretiva: 0 };
    }

    filteredWOs.forEach(wo => {
      const dateKey = (wo.data_conclusao || wo.created_at || '').slice(0, 7);
      if (dataMap[dateKey]) {
        dataMap[dateKey].custo += (Number(wo.custo_total) || 0);
        if (wo.tipo === 'Preventiva') dataMap[dateKey].preventiva += 1;
        else if (wo.tipo === 'Corretiva') dataMap[dateKey].corretiva += 1;
        else {
          // Fallback for others or null types, treat as Corretiva
          // wo.tipo might be null or something else
        }
      }
    });

    return Object.values(dataMap)
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
      .map((m: any) => ({
        ...m,
        name: formatMonth(m.name)
      }));
  };

  const formatMonth = (isoMonth: string) => {
    const [y, m] = isoMonth.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
  };

  const chartData = processChartData();

  // 6. Lists
  const topExpenses = [...filteredWOs]
    .sort((a, b) => (b.custo_total || 0) - (a.custo_total || 0))
    .slice(0, 4); // Limit to 4 to fit UI

  const recentCalls = [...filteredWOs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-background-dark text-white print:bg-white print:text-black print:p-0">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:hidden">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
              <span className="material-symbols-outlined text-[14px]">query_stats</span> Business Intelligence
            </div>
            <h1 className="text-4xl font-black tracking-tight">Análise de Custos & Performance</h1>
            <p className="text-slate-400 max-w-xl">
              Visão consolidada de gastos operacionais e eficiência.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">

            {/* Sector Filter */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">factory</span>
              <select
                value={sectorFilter}
                onChange={e => setSectorFilter(e.target.value)}
                className="pl-10 pr-4 py-2 bg-surface-dark border border-border-dark rounded-lg text-sm outline-none focus:border-primary shadow-sm appearance-none cursor-pointer"
              >
                <option value="Todos">Todos os Setores</option>
                {Array.from(new Set(assets.map(a => a.setor).filter(Boolean))).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Time Filter */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">calendar_month</span>
              <select
                value={timeFilter}
                onChange={e => setTimeFilter(e.target.value)}
                className="pl-10 pr-4 py-2 bg-surface-dark border border-border-dark rounded-lg text-sm outline-none focus:border-primary shadow-sm appearance-none cursor-pointer"
              >
                <option value="3">Últ.: 3 Meses</option>
                <option value="6">Últ.: 6 Meses</option>
                <option value="12">Últ.: 1 Ano</option>
              </select>
            </div>

            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-sky-400 text-white font-bold rounded-lg shadow-neon transition-all active:scale-95 ml-2">
              <span className="material-symbols-outlined text-[20px]">print</span> Exportar
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Conformidade Preventiva"
            value={`${preventiveCompliance}%`}
            sub={`${finishedPreventives.length} / ${preventives.length} Ordens`}
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
            sub="Ordens no Período"
            icon="list_alt"
            color="text-purple-400"
            progress={100}
            isGood={true}
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Charts */}
          <div className="lg:col-span-2 space-y-8">

            {/* Chart 1: Cost Evolution */}
            <div className="glass-panel p-6 border border-border-dark rounded-xl bg-surface-dark/30 shadow-xl backdrop-blur-sm h-[26rem] flex flex-col">
              <h3 className="font-bold mb-6 flex items-center gap-2 text-lg">
                <span className="material-symbols-outlined text-primary">trending_up</span> Evolução de Custos
              </h3>
              <div className="flex-1 w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Custo']}
                    />
                    <Area type="monotone" dataKey="custo" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorCusto)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Work Order Distribution */}
            <div className="glass-panel p-6 border border-border-dark rounded-xl bg-surface-dark/30 shadow-xl backdrop-blur-sm h-[26rem] flex flex-col">
              <h3 className="font-bold mb-6 flex items-center gap-2 text-lg">
                <span className="material-symbols-outlined text-purple-400">bar_chart</span> Distribuição de Chamados
              </h3>
              <div className="flex-1 w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend iconType="circle" />
                    {/* Colors Matched to Dashboard.tsx: Prev=Blue(#0ea5e9), Corr=Red(#ef4444) */}
                    <Bar dataKey="preventiva" name="Preventiva" stackId="a" fill="#0ea5e9" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="corretiva" name="Corretiva" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Right Column: Lists */}
          <div className="space-y-8">

            {/* Top Expenses List - Fixed alignment height */}
            <div className="glass-panel p-6 border border-border-dark rounded-xl bg-surface-dark/30 shadow-xl backdrop-blur-sm h-[26rem] flex flex-col">
              <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-amber-500">
                <span className="material-symbols-outlined">warning</span> Maiores Gastos
              </h3>
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                {topExpenses.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-slate-500 italic">Nenhum custo registrado.</p>
                  </div>
                ) : (
                  topExpenses.map((wo, i) => (
                    <div key={wo.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-dark border border-border-dark/50 hover:border-primary/50 transition-colors">
                      <div className="font-black text-slate-500 w-6">#{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white truncate">{wo.ativos?.nome || 'Ativo Desconhecido'}</div>
                        <div className="text-xs text-slate-400 truncate">{wo.descricao}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-400">R$ {Number(wo.custo_total).toLocaleString('pt-BR')}</div>
                        <div className="text-[10px] uppercase text-slate-500">{wo.tipo}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Calls List - Fixed alignment height */}
            <div className="glass-panel p-6 border border-border-dark rounded-xl bg-surface-dark/30 shadow-xl backdrop-blur-sm h-[26rem] flex flex-col">
              <h3 className="font-bold mb-6 flex items-center gap-2 text-lg text-sky-400">
                <span className="material-symbols-outlined">history</span> Recentes
              </h3>
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                {recentCalls.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-slate-500 italic">Nenhum chamado.</p>
                  </div>
                ) : (
                  recentCalls.map((wo) => (
                    <div key={wo.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-dark border border-border-dark/50 hover:border-sky-500/50 transition-colors">
                      <div className={`w-2 h-2 rounded-full ${wo.status === 'Aberto' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white truncate text-sm">{wo.descricao}</div>
                        <div className="text-xs text-slate-400 flex gap-2">
                          <span>{new Date(wo.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{wo.tipo}</span>
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
    </div>
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
}> = ({ title, value, sub, icon, color, progress, isGood, onEdit }) => (
  <div className="glass-panel p-5 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group hover:border-primary/50 transition-all">
    {onEdit && (
      <button onClick={onEdit} className="absolute top-3 right-3 p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
        <span className="material-symbols-outlined text-[16px]">edit</span>
      </button>
    )}

    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-lg bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
        <span className={`material-symbols-outlined text-2xl ${color}`}>{icon}</span>
      </div>
      <div className={`text-xs font-bold px-2 py-1 rounded-full ${isGood ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
        {isGood ? 'BOM' : 'ATENÇÃO'}
      </div>
    </div>

    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{title}</h3>
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>

    {/* Progress Bar */}
    <div className="mt-4 h-1 w-full bg-slate-700/50 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${isGood ? 'bg-emerald-500' : color.replace('text-', 'bg-')}`}
        style={{ width: `${Math.min(progress, 100)}%` }}
      ></div>
    </div>
  </div>
);

export default Reports;