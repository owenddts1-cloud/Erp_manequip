import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import NotificationPopover from '../components/NotificationPopover';
import { usePreferences } from '../contexts/PreferencesContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t, formatDate } = usePreferences();
  const [stats, setStats] = React.useState({
    assets: 0,
    tickets: 0,
    criticalTickets: 0,
    cost: 0
  });

  const [upcomingPreventives, setUpcomingPreventives] = React.useState<any[]>([]);
  const [chartData, setChartData] = React.useState<any[]>([]);

  const [recentTickets, setRecentTickets] = React.useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);

  // Sorting state for Chamados Recentes table
  const [sortKey, setSortKey] = React.useState<string>('created_at');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Search handler with debounce
  const handleSearch = React.useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(true);

    try {
      const results: any[] = [];

      // Search work orders
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select('id, display_id, descricao, tipo, ativos(nome)')
        .or(`display_id.ilike.%${query}%,descricao.ilike.%${query}%`)
        .limit(3);

      workOrders?.forEach(wo => {
        const ativos = wo.ativos as { nome?: string } | { nome?: string }[] | null;
        const ativoNome = Array.isArray(ativos) ? ativos[0]?.nome : ativos?.nome;
        results.push({
          type: 'chamado',
          icon: wo.tipo === 'Preventiva' ? 'calendar_month' : 'warning',
          color: wo.tipo === 'Preventiva' ? 'text-sky-500' : 'text-red-500',
          title: `Chamado #${wo.display_id || wo.id.slice(0, 5)}`,
          subtitle: ativoNome || wo.descricao?.slice(0, 30),
          link: `/app/work-orders/${wo.id}`
        });
      });

      // Search assets
      const { data: assets } = await supabase
        .from('ativos')
        .select('id, nome, setor, tipo')
        .or(`nome.ilike.%${query}%,setor.ilike.%${query}%,patrimonio.ilike.%${query}%`)
        .limit(3);

      assets?.forEach(asset => {
        results.push({
          type: 'ativo',
          icon: 'precision_manufacturing',
          color: 'text-emerald-500',
          title: asset.nome,
          subtitle: asset.setor || asset.tipo,
          link: `/app/assets/${asset.id}`
        });
      });

      // Search inventory
      const { data: inventory } = await supabase
        .from('inventario')
        .select('id, nome_peca, sku, categoria')
        .or(`nome_peca.ilike.%${query}%,sku.ilike.%${query}%`)
        .limit(3);

      inventory?.forEach(item => {
        results.push({
          type: 'peca',
          icon: 'inventory_2',
          color: 'text-violet-500',
          title: item.nome_peca,
          subtitle: item.sku || item.categoria,
          link: `/app/inventory`
        });
      });

      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchResultClick = (link: string) => {
    setShowSuggestions(false);
    setSearchQuery('');
    navigate(link);
  };

  // Sort and export functions
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedTickets = React.useMemo(() => {
    return [...recentTickets].sort((a, b) => {
      let valA = a[sortKey] || a.ativos?.[sortKey] || '';
      let valB = b[sortKey] || b.ativos?.[sortKey] || '';

      // Special handling for nested objects if sorting by fields inside them
      if (sortKey === 'responsavel') {
        valA = a.created_by?.email || a.tecnico_responsavel?.email || '';
        valB = b.created_by?.email || b.tecnico_responsavel?.email || '';
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [recentTickets, sortKey, sortOrder]);

  const downloadCSV = () => {
    const headers = ['ID', 'Ativo', 'Status', 'Tipo', 'Responsável (Email)', 'Última Edição', 'Data'];
    const rows = recentTickets.map(wo => [
      wo.display_id || wo.id.slice(0, 5),
      wo.ativos?.nome || 'Geral',
      wo.status,
      wo.tipo,
      wo.created_by?.email || wo.tecnico_responsavel?.email || '---',
      wo.last_edited_by?.full_name || '-',
      new Date(wo.created_at).toLocaleDateString('pt-BR')
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `chamados_recentes_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };


  React.useEffect(() => {
    fetchDashboardData();
    // Subscribe to realtime changes
    const subscription = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chamados' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ativos' }, fetchDashboardData)
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Assets count
      const { count: assetsCount } = await supabase.from('ativos').select('*', { count: 'exact', head: true });

      // Tickets count
      const { count: ticketsCount } = await supabase.from('work_orders').select('*', { count: 'exact', head: true }).neq('status', 'Concluída');
      const { count: criticalCount } = await supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('prioridade', 'Alta').neq('status', 'Concluída');

      // Fetch Upcoming Preventives
      const { data: preventives } = await supabase
        .from('work_orders')
        .select(`
            *,
            ativos (nome, setor)
          `)
        .eq('tipo', 'Preventiva')
        .neq('status', 'Concluída')
        .order('created_at', { ascending: true })
        .limit(7);

      setUpcomingPreventives(preventives || []);

      // Fetch Recent Tickets (Now with Emails and Editor Names)
      // Note: We use aliases for clarity if needed, or structured response
      const { data: recents } = await supabase
        .from('work_orders')
        .select(`
            *, 
            ativos (nome),
            created_by (email),
            tecnico_responsavel (email),
            last_edited_by (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentTickets(recents || []);

      // Fetch total cost
      const { data: costData } = await supabase
        .from('work_orders')
        .select('custo_total')
        .or('status.eq.Concluída,status.eq.Finalizada,status.eq.Concluído,status.eq.Finalizado,status.eq.concluido,status.eq.finalizado');


      const totalCost = costData?.reduce((acc, curr) => acc + (Number(curr.custo_total) || 0), 0) || 0;

      // Stats
      setStats({
        assets: assetsCount || 0,
        tickets: ticketsCount || 0,
        criticalTickets: criticalCount || 0,
        cost: totalCost
      });

      // Chart Data
      const { data: allWOs } = await supabase
        .from('work_orders')
        .select('tipo, created_at')
        .order('created_at', { ascending: true });

      if (allWOs && allWOs.length > 0) {
        const monthsMap: Record<string, { name: string, prev: number, corr: number }> = {};
        const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

        // Take last 6 months
        allWOs.forEach(wo => {
          const date = new Date(wo.created_at);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          if (!monthsMap[monthKey]) {
            monthsMap[monthKey] = { name: monthNames[date.getMonth()], prev: 0, corr: 0 };
          }
          if (wo.tipo === 'Preventiva') monthsMap[monthKey].prev++;
          else monthsMap[monthKey].corr++;
        });

        const sortedMonths = Object.keys(monthsMap)
          .sort()
          .slice(-6)
          .map(key => monthsMap[key]);

        setChartData(sortedMonths);
      } else {
        setChartData([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-transparent transition-colors duration-300">
      {/* ... Header ... */}
      <header className="h-16 border-b border-[var(--border-color)] sticky top-0 z-10 flex items-center justify-between px-8 bg-[var(--surface-color)]/90 backdrop-blur-md">
        {/* Search Bar - Keeping Unchanged */}
        <div className="flex items-center w-full max-w-md">
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
              {isSearching ? (
                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">search</span>
              )}
            </div>
            <input
              className="block w-full pl-10 pr-3 py-2 border border-border-dark rounded-lg leading-5 bg-surface-dark/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm font-display transition-all"
              placeholder="Buscar ativos, ordens ou códigos..."
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-dark border border-border-dark rounded-lg shadow-2xl overflow-hidden z-50">
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.type}-${index}`}
                    onClick={() => handleSearchResultClick(result.link)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors text-left border-b border-border-dark/50 last:border-0"
                  >
                    <span className={`material-symbols-outlined text-[20px] ${result.color}`}>{result.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{result.title}</p>
                      <p className="text-xs text-slate-400 truncate">{result.subtitle}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                      {result.type === 'chamado' ? 'OS' : result.type === 'ativo' ? 'Ativo' : 'Peça'}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {showSuggestions && searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-dark border border-border-dark rounded-lg shadow-2xl p-4 text-center text-slate-500 text-sm z-50">
                <span className="material-symbols-outlined text-xl mb-1 opacity-50">search_off</span>
                <p>Nenhum resultado para "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 relative">
          <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`relative p-2 rounded-lg transition-colors group ${isNotifOpen ? 'bg-primary/20 text-white' : 'text-text-secondary hover:text-white hover:bg-border-dark/50'}`}>
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-primary rounded-full ring-2 ring-surface-dark animate-pulse"></span>
          </button>
          <NotificationPopover isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />

          <button onClick={() => navigate('/app/work-orders?action=new')} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold py-2 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all font-display">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Novo Chamado
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-end justify-between mb-2">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-main)] font-display tracking-tight">{t('dashboard.overview')}</h2>
              <p className="text-[var(--text-secondary)] text-sm mt-1">{t('dashboard.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm bg-[var(--surface-color)]/50 px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              <span>{formatDate(new Date())}</span>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon="dns" title={t('dashboard.assets')} value={stats.assets.toLocaleString()} trend="+0%" trendUp={true} color="primary" />
            <KPICard icon="warning" title={t('dashboard.tickets')} value={stats.tickets.toLocaleString()} sub={`${stats.criticalTickets} Críticos`} trend="0%" trendUp={false} color="danger" />
            <KPICard icon="attach_money" title={t('dashboard.cost')} value={`R$ ${(stats.cost / 1000).toFixed(1)}k`} sub={`+ R$ ${(stats.tickets * (stats.cost / Math.max(stats.tickets + stats.criticalTickets, 1) || 500) / 1000).toFixed(1)}k Previsto`} trend="Executado" trendUp={true} color="warning" />
            <KPICard icon="timer_off" title={t('dashboard.downtime')} value="0h 00m" trend="Estável" trendUp={true} color="purple" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl p-6 flex flex-col h-[420px] border border-[var(--border-color)] bg-[var(--surface-color)] shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-main)] font-display">{t('dashboard.evolution')}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Corretivas vs Preventivas (Dados reais)</p>
                </div>
                <button onClick={() => navigate('/app/work-orders')} className="text-primary text-sm font-bold hover:text-primary-hover flex items-center gap-1">
                  Ver Relatório Completo
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
              <div className="flex-1 w-full min-h-0">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <Bar dataKey="prev" name="Preventiva" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="corr" name="Corretiva" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <p>Sem dados de manutenção para exibir.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Alerts */}
            <div className="lg:col-span-1 rounded-xl p-0 flex flex-col h-[420px] overflow-hidden border border-[var(--border-color)] bg-[var(--surface-color)] shadow-sm">
              <div className="p-5 border-b border-[var(--border-color)] bg-[var(--bg-color)]/30">
                <h3 className="text-lg font-bold text-[var(--text-main)] font-display">{t('dashboard.preventives')}</h3>
                <p className="text-sm text-[var(--text-secondary)]">Atenção requerida</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {upcomingPreventives.length === 0 ? (
                  <p className="text-center text-slate-500 py-10">{t('dashboard.no_preventives')}</p>
                ) : (
                  upcomingPreventives.map(item => (
                    <AlertItem
                      key={item.id}
                      icon={item.prioridade === 'Alta' ? 'bolt' : 'event'}
                      name={`Chamado #${item.display_id || item.id.slice(0, 5)}`}
                      sector={item.ativos?.nome || 'Geral'}
                      date={new Date(item.created_at).toLocaleDateString()}
                      due={item.status}
                      status={item.prioridade === 'Alta' ? 'warning' : 'neutral'}
                    />
                  ))
                )}

              </div>
              <div className="p-3 border-t border-border-dark bg-surface-dark/40 text-center">
                <button onClick={() => navigate('/app/calendar')} className="text-xs text-primary font-bold hover:text-white transition-colors uppercase tracking-wider py-1">Ver calendário completo</button>
              </div>
            </div>
          </div>

          {/* Recent Calls Table (UPDATED) */}
          <div className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--surface-color)] shadow-sm">
            <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-color)]/30 flex justify-between items-center">
              <h3 className="text-lg font-bold text-[var(--text-main)] font-display">{t('dashboard.recent')}</h3>
              <div className="flex gap-2">
                <button
                  onClick={downloadCSV}
                  className="p-2 text-text-secondary hover:text-white rounded-lg hover:bg-primary/20 transition-all flex items-center gap-1"
                  title="Baixar CSV"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span className="text-xs font-bold hidden sm:inline">CSV</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[var(--bg-color)]/50 text-xs uppercase font-bold text-[var(--text-secondary)] font-display tracking-wider">
                  <tr>
                    <th onClick={() => handleSort('display_id')} className="px-6 py-3 cursor-pointer hover:text-primary transition-colors">
                      <span className="flex items-center gap-1">ID {sortKey === 'display_id' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th onClick={() => handleSort('nome')} className="px-6 py-3 cursor-pointer hover:text-primary transition-colors">
                      <span className="flex items-center gap-1">Ativo {sortKey === 'nome' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th onClick={() => handleSort('status')} className="px-6 py-3 cursor-pointer hover:text-primary transition-colors">
                      <span className="flex items-center gap-1">Status {sortKey === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th onClick={() => handleSort('tipo')} className="px-6 py-3 cursor-pointer hover:text-primary transition-colors">
                      <span className="flex items-center gap-1">Tipo {sortKey === 'tipo' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th onClick={() => handleSort('responsavel')} className="px-6 py-3 cursor-pointer hover:text-primary transition-colors">
                      {/* Using "Responsável" as requested, but showing Created By Email */}
                      <span className="flex items-center gap-1">Responsável {sortKey === 'responsavel' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th className="px-6 py-3">
                      <span className="flex items-center gap-1">Última Edição</span>
                    </th>
                    <th onClick={() => handleSort('created_at')} className="px-6 py-3 text-right cursor-pointer hover:text-primary transition-colors">
                      <span className="flex items-center gap-1 justify-end">Abertura {sortKey === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {sortedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500 italic">
                        {t('dashboard.no_tickets')}
                      </td>
                    </tr>
                  ) : (
                    sortedTickets.map(wo => (
                      <TableRow
                        key={wo.id}
                        id={`#${wo.display_id || wo.id.slice(0, 5)}`}
                        asset={wo.ativos?.nome || 'Geral'}
                        status={wo.status}
                        statusColor={wo.status === 'Concluída' || wo.status === 'Finalizada' ? 'success' : 'warning'}
                        type={wo.tipo}
                        typeColor={wo.tipo === 'Corretiva' ? 'text-red-500' : 'text-primary'}
                        // Show Created By Email OR Assignee Email OR '-'
                        user={wo.created_by?.email || wo.tecnico_responsavel?.email || '---'}
                        // Show Last Edited Name OR '-'
                        lastEdited={wo.last_edited_by?.full_name || '-'}
                        time={new Date(wo.created_at).toLocaleDateString()}
                      />
                    ))
                  )}

                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard: React.FC<{ icon: string, title: string, value: string, sub?: string, trend: string, trendUp: boolean, color: string }> = ({ icon, title, value, sub, trend, trendUp, color }) => {
  const getColorStyles = (c: string) => {
    switch (c) {
      case 'primary': return {
        gradient: 'from-sky-500/20 to-sky-600/5',
        iconBg: 'bg-gradient-to-br from-sky-400 to-sky-600',
        iconColor: 'text-white',
        accentBorder: 'border-sky-500/30'
      };
      case 'danger': return {
        gradient: 'from-red-500/20 to-red-600/5',
        iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600',
        iconColor: 'text-white',
        accentBorder: 'border-amber-500/30'
      };
      case 'warning': return {
        gradient: 'from-emerald-500/20 to-emerald-600/5',
        iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
        iconColor: 'text-white',
        accentBorder: 'border-emerald-500/30'
      };
      case 'purple': return {
        gradient: 'from-cyan-500/20 to-cyan-600/5',
        iconBg: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
        iconColor: 'text-white',
        accentBorder: 'border-cyan-500/30'
      };
      default: return {
        gradient: 'from-sky-500/20 to-sky-600/5',
        iconBg: 'bg-gradient-to-br from-sky-400 to-sky-600',
        iconColor: 'text-white',
        accentBorder: 'border-sky-500/30'
      };
    }
  };

  const styles = getColorStyles(color);
  const trendIcon = trend.startsWith('+') || trendUp ? 'trending_up' : (trend.includes('%') && !trend.startsWith('+') && !trendUp ? 'trending_down' : 'check_circle');
  const trendBadgeStyle = trendUp ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30';

  return (
    <div className={`p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group border ${styles.accentBorder} bg-gradient-to-br ${styles.gradient} backdrop-blur-sm relative overflow-hidden`}>
      {/* Glow effect */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500"></div>

      <div className="flex justify-between items-start mb-4 relative">
        <div className={`p-2.5 rounded-xl shadow-lg ${styles.iconBg}`}>
          <span className={`material-symbols-outlined ${styles.iconColor}`}>{icon}</span>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${trendBadgeStyle}`}>
          <span className="material-symbols-outlined text-[14px]">{trendIcon}</span> {trend}
        </span>
      </div>
      <h3 className="text-slate-400 text-sm font-medium font-display">{title}</h3>
      <p className="text-3xl font-bold text-white mt-1 font-display tracking-tight">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
};

const AlertItem: React.FC<{ icon: string, name: string, sector: string, date: string, due: string, status: 'warning' | 'success' | 'neutral' }> = ({ icon, name, sector, date, due, status }) => {
  return (
    <div className="flex items-center p-3 hover:bg-[var(--bg-color)] rounded-lg transition-colors group cursor-pointer border border-transparent hover:border-[var(--border-color)]">
      <div className="relative size-10 rounded bg-[var(--bg-color)] flex items-center justify-center mr-3 shrink-0">
        <span className="material-symbols-outlined text-[var(--text-secondary)] group-hover:text-primary transition-colors">{icon}</span>
        <div className={`absolute top-0 right-0 size-2.5 rounded-full border-2 border-[var(--surface-color)] ${status === 'warning' ? 'bg-warning' : status === 'success' ? 'bg-success' : 'hidden'}`}></div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[var(--text-main)] truncate group-hover:text-primary transition-colors font-display">{name}</p>
        <p className="text-xs text-[var(--text-secondary)] truncate">{sector}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-white font-display">{date}</p>
        <p className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded inline-block mt-1 ${status === 'warning' ? 'text-warning bg-warning/10' : 'text-text-secondary bg-border-dark/50'}`}>{due}</p>
      </div>
    </div>
  );
};

const TableRow: React.FC<{ id: string, asset: string, status: string, statusColor: string, type: string, typeColor: string, user: string, lastEdited: string, time: string }> = ({ id, asset, status, statusColor, type, typeColor, user, lastEdited, time }) => {
  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'warning': return 'bg-warning/10 text-warning border-warning/20';
      case 'info': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'success': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-slate-700 text-slate-300';
    }
  }

  return (
    <tr className="hover:bg-[var(--bg-color)] transition-colors cursor-pointer">
      <td className="px-6 py-4 font-mono text-[var(--text-secondary)]">{id}</td>
      <td className="px-6 py-4 font-bold text-[var(--text-main)]">{asset}</td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusBadge(statusColor)}`}>
          <span className={`size-1.5 rounded-full ${statusColor === 'warning' ? 'bg-warning animate-pulse' : statusColor === 'info' ? 'bg-blue-400' : 'bg-success'}`}></span>
          {status}
        </span>
      </td>
      <td className={`px-6 py-4 font-medium ${typeColor}`}>{type}</td>
      {/* User Email */}
      <td className="px-6 py-4 text-text-secondary">{user}</td>
      {/* Last Edited Name */}
      <td className="px-6 py-4 text-text-secondary">{lastEdited}</td>
      <td className="px-6 py-4 text-right text-text-secondary">{time}</td>
    </tr>
  );
};

export default Dashboard;