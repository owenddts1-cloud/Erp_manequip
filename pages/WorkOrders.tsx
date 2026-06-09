import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePreferences } from '../contexts/PreferencesContext';

const getMonthName = (monthNum: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[monthNum - 1] || '';
};

const isFuturePreventive = (t: any): boolean => {
  if (!t.isPreventiveTable) return false;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-indexed (June = 6)
  return t.ano > currentYear || (t.ano === currentYear && t.mes > currentMonth);
};

const WorkOrders: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false); // For "Finish/Details"
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // For "New Ticket"
  const [tickets, setTickets] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [filter, setFilter] = useState('Todos');
  const [periodFilter, setPeriodFilter] = useState('mes_atual');
  const [rowsLimit, setRowsLimit] = useState<string>('30');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const stats = useMemo(() => {
    const s = { open: 0, progress: 0, waiting: 0, done: 0 };
    tickets.forEach((t: any) => {
      // 1. Exclude future preventives from stats calculation
      if (isFuturePreventive(t)) return;

      // 2. Apply Period Filter to stats so they represent the selected period
      if (periodFilter !== 'todos') {
        const ticketDate = t.isPreventiveTable ? new Date(t.ano, t.mes - 1, 15) : new Date(t.created_at);
        const ticketYear = ticketDate.getFullYear();
        const ticketMonth = ticketDate.getMonth(); // 0-indexed

        const currentMonthIdx = new Date().getMonth(); // 0-indexed
        const currentYearVal = new Date().getFullYear();

        if (periodFilter === 'mes_atual') {
          if (ticketMonth !== currentMonthIdx || ticketYear !== currentYearVal) return;
        } else if (periodFilter === '3_meses') {
          const limit = new Date();
          limit.setMonth(limit.getMonth() - 3);
          if (ticketDate < limit) return;
        } else if (periodFilter === '6_meses') {
          const limit = new Date();
          limit.setMonth(limit.getMonth() - 6);
          if (ticketDate < limit) return;
        } else if (periodFilter === 'ano_atual') {
          if (ticketYear !== currentYearVal) return;
        }
      }

      const st = t.status?.toLowerCase() || '';
      if (st.includes('pendente') || st === 'aberto' || st === 'em aberto') s.open++;
      else if (st.includes('andamento') || st.includes('progresso') || st === 'em atendimento') s.progress++;
      else if (st.includes('aguardando')) s.waiting++;
      else if (st.includes('concluído') || st.includes('concluída') || st.includes('finalizado')) s.done++;
    });
    return s;
  }, [tickets, periodFilter]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, periodFilter, searchQuery, rowsLimit]);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  // New WO Form State
  const [newOrder, setNewOrder] = useState({
    display_id: '',
    ativo_id: '',
    tipo: 'Preventiva',
    descricao: '',
    prioridade: 'Baixa',
    data_limite: '',
    status: 'Aberto',
    peca_solicitada: '',
    peca_inventario_id: ''
  });

  const [inventory, setInventory] = useState<any[]>([]);
  const [isCustomPart, setIsCustomPart] = useState(false);
  const [customPartName, setCustomPartName] = useState('');

  const [isCustomAsset, setIsCustomAsset] = useState(false);
  const [customAssetName, setCustomAssetName] = useState('');
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);

  const { userProfile } = usePreferences();
  const isAuthorized = userProfile?.role === 'Administrator' || userProfile?.role === 'Gestor' || userProfile?.role === 'Técnico' || userProfile?.role === 'Supervisor';
  const canDelete = userProfile?.role === 'Administrator' || userProfile?.role === 'Gestor' || userProfile?.role === 'Supervisor';

  // Sorting State
  const [sortKey, setSortKey] = useState<'display_id' | 'ativo' | 'tipo' | 'status' | 'created_at' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: 'display_id' | 'ativo' | 'tipo' | 'status' | 'created_at') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Filter logic including Search and Sorting
  const filteredTickets = useMemo(() => {
    let result = tickets.filter(t => {
      const isFuture = isFuturePreventive(t);

      // Status/Type/Futuros Filter
      if (filter === 'Futuros') {
        if (!isFuture) return false;
      } else {
        if (isFuture) return false;

        if (filter !== 'Todos') {
          if (filter === 'Urgente') {
            if (t.prioridade !== 'Alta') return false;
          } else {
            if (t.tipo !== filter) return false;
          }
        }
      }

      // Period Filter (ignored for Futuros tab as they are all future)
      if (filter !== 'Futuros' && periodFilter !== 'todos') {
        const ticketDate = t.isPreventiveTable ? new Date(t.ano, t.mes - 1, 15) : new Date(t.created_at);
        const ticketYear = ticketDate.getFullYear();
        const ticketMonth = ticketDate.getMonth(); // 0-indexed

        const currentMonthIdx = new Date().getMonth(); // 0-indexed
        const currentYearVal = new Date().getFullYear();

        if (periodFilter === 'mes_atual') {
          if (ticketMonth !== currentMonthIdx || ticketYear !== currentYearVal) return false;
        } else if (periodFilter === '3_meses') {
          const limit = new Date();
          limit.setMonth(limit.getMonth() - 3);
          if (ticketDate < limit) return false;
        } else if (periodFilter === '6_meses') {
          const limit = new Date();
          limit.setMonth(limit.getMonth() - 6);
          if (ticketDate < limit) return false;
        } else if (periodFilter === 'ano_atual') {
          if (ticketYear !== currentYearVal) return false;
        }
      }

      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const displayIdMatch = (t.display_id || '').toLowerCase().includes(query);
        const assetMatch = (t.ativos?.nome || '').toLowerCase().includes(query);
        const descMatch = (t.descricao || '').toLowerCase().includes(query);
        if (!displayIdMatch && !assetMatch && !descMatch) return false;
      }

      return true;
    });

    if (sortKey) {
      result.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (sortKey === 'ativo') {
          valA = a.ativos?.nome || '';
          valB = b.ativos?.nome || '';
        }

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB as string).toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [tickets, filter, periodFilter, searchQuery, sortKey, sortOrder]);

  const paginatedTickets = useMemo(() => {
    if (rowsLimit === 'todos') return filteredTickets;
    const limit = Number(rowsLimit);
    const startIndex = (currentPage - 1) * limit;
    return filteredTickets.slice(startIndex, startIndex + limit);
  }, [filteredTickets, currentPage, rowsLimit]);

  const totalPages = useMemo(() => {
    if (rowsLimit === 'todos') return 1;
    return Math.max(1, Math.ceil(filteredTickets.length / Number(rowsLimit)));
  }, [filteredTickets, rowsLimit]);

  // Suggestions logic
  const searchSuggestions = useMemo(() => {
    if (!searchQuery) return [];
    const lowerQuery = searchQuery.toLowerCase();
    const suggestions = new Set<string>();

    tickets.forEach(t => {
      if (t.ativos?.nome?.toLowerCase().includes(lowerQuery)) suggestions.add(t.ativos.nome);
      if (t.display_id?.toLowerCase().includes(lowerQuery)) suggestions.add(`#${t.display_id}`);
    });

    return Array.from(suggestions).slice(0, 5);
  }, [searchQuery, tickets]);

  const filteredAssetsList = useMemo(() => {
    if (!assetSearchQuery) return assets;
    const lower = assetSearchQuery.toLowerCase();
    return assets.filter(a => a.nome?.toLowerCase().includes(lower));
  }, [assets, assetSearchQuery]);


  useEffect(() => {
    fetchOrders();
    fetchAssetsList();
    fetchInventory();
    autoGenerateId();

    // Check for ?action=new
    if (searchParams.get('action') === 'new') {
      openCreateModal();
    }

    const subscription = supabase.channel('wo-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, fetchOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'preventivas_mensais' }, fetchOrders)
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, [searchParams]);

  const autoGenerateId = async () => {
    const { data: lastWO } = await supabase
      .from('work_orders')
      .select('display_id')
      .order('display_id', { ascending: false })
      .limit(1);

    let nextId = "1001";
    if (lastWO && lastWO[0]?.display_id) {
      const lastNum = parseInt(lastWO[0].display_id.replace(/\D/g, ''));
      if (!isNaN(lastNum)) nextId = (lastNum + 1).toString();
    }
    setNewOrder(prev => ({ ...prev, display_id: nextId }));
  };

  const fetchAssetsList = async () => {
    const { data } = await supabase.from('ativos').select('id, nome').order('nome');
    if (data) setAssets(data);
  };

  const fetchInventory = async () => {
    const { data } = await supabase.from('inventario').select('id, nome_peca, sku').order('nome_peca');
    if (data) setInventory(data);
  };

  const fetchOrders = async () => {
    try {
      // Fetch normal work orders
      const { data: woData, error: woError } = await supabase
        .from('work_orders')
        .select(`*, ativos(nome, tag_id, setor)`)
        .order('created_at', { ascending: false });

      if (woError) throw woError;

      // Fetch monthly preventives (active and completed)
      const { data: prevData, error: prevError } = await supabase
        .from('preventivas_mensais')
        .select(`*, ativos(nome, tag_id, setor)`)
        .in('status', ['Em atendimento', 'Concluído'])
        .order('created_at', { ascending: false });

      if (prevError) throw prevError;

      const mappedWOs = (woData || []).map(wo => ({
        ...wo,
        isPreventiveTable: false
      }));

      const mappedPrevs = (prevData || []).map(prev => ({
        ...prev,
        display_id: `PM-${prev.id.slice(0, 4).toUpperCase()}`,
        tipo: 'Preventiva',
        prioridade: 'Baixa',
        isPreventiveTable: true,
        ativos: prev.ativos || { nome: 'Ativo Desconhecido' }
      }));

      const merged = [...mappedPrevs, ...mappedWOs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTickets(merged);
    } catch (err) {
      console.error("Error fetching work orders:", err);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setNewOrder({
      display_id: '',
      ativo_id: '',
      tipo: 'Preventiva',
      descricao: '',
      prioridade: 'Baixa',
      data_limite: '',
      status: 'Aberto',
      peca_solicitada: '',
      peca_inventario_id: ''
    });
    setIsCustomPart(false);
    setCustomPartName('');
    setIsCustomAsset(false);
    setCustomAssetName('');
    setAssetSearchQuery('');
    setIsAssetDropdownOpen(false);
    autoGenerateId();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (ticket: any) => {
    setEditingId(ticket.id);
    setNewOrder({
      display_id: ticket.display_id || '',
      ativo_id: ticket.ativo_id || '',
      tipo: ticket.tipo || 'Preventiva',
      descricao: ticket.descricao || '',
      prioridade: ticket.prioridade || 'Baixa',
      // Ensure date format YYYY-MM-DD
      data_limite: ticket.data_limite ? new Date(ticket.data_limite).toISOString().split('T')[0] : '',
      status: ticket.status || 'Aberto',
      peca_solicitada: ticket.peca_solicitada || '',
      peca_inventario_id: ticket.peca_inventario_id || ''
    });
    if (ticket.status === 'Aguardando Peça') {
      if (ticket.peca_solicitada && !ticket.peca_inventario_id) {
        setIsCustomPart(true);
        setCustomPartName(ticket.peca_solicitada);
      } else {
        setIsCustomPart(false);
        setCustomPartName('');
      }
    } else {
      setIsCustomPart(false);
      setCustomPartName('');
    }
    setIsCustomAsset(false);
    setCustomAssetName('');
    setAssetSearchQuery('');
    setIsAssetDropdownOpen(false);
    setIsCreateModalOpen(true);
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newOrder.ativo_id || !newOrder.descricao || !newOrder.data_limite || !newOrder.display_id) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (isCustomAsset && !customAssetName.trim()) {
      alert("Por favor, digite o nome do novo ativo/equipamento.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      let finalAtivoId = newOrder.ativo_id;
      if (isCustomAsset) {
        const { data: newAsset, error: assetError } = await supabase
          .from('ativos')
          .insert([{
            nome: customAssetName.trim(),
            status: 'Operacional',
            criticidade: 'Baixa',
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (assetError) throw assetError;
        if (!newAsset) throw new Error("Não foi possível cadastrar o novo ativo.");
        finalAtivoId = newAsset.id;
        await fetchAssetsList();
      }

      if (editingId) {
        // UPDATE MODE
        const { error } = await supabase
          .from('work_orders')
          .update({
            ...newOrder,
            ativo_id: finalAtivoId,
            peca_inventario_id: newOrder.peca_inventario_id || null,
            data_limite: newOrder.data_limite,
            last_edited_by: user?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
        alert("Chamado atualizado com sucesso!");

      } else {
        // CREATE MODE
        // Check ID Uniqueness
        const { data: existing } = await supabase
          .from('work_orders')
          .select('id')
          .eq('display_id', newOrder.display_id)
          .single();

        if (existing) {
          alert("Este ID de Chamado já está em uso. Por favor, escolha outro.");
          return;
        }

        const { error } = await supabase
          .from('work_orders')
          .insert([{
            ...newOrder,
            ativo_id: finalAtivoId,
            peca_inventario_id: newOrder.peca_inventario_id || null,
            data_limite: newOrder.data_limite,
            tecnico_responsavel: user?.id,
            created_by: user?.id,
            status: 'Aberto',
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
        alert("Chamado criado com sucesso!");
      }

      setIsCreateModalOpen(false);
      fetchOrders();
      if (!editingId) autoGenerateId(); // Only regen ID if created
    } catch (err: any) {
      alert(`Erro ao salvar chamado: ${err.message}`);
    }
  };

  // --- Finish Ticket Logic ---
  const [closingTicket, setClosingTicket] = useState<any>(null);
  const [closingCost, setClosingCost] = useState(0);

  const openFinishModal = (ticket: any) => {
    setClosingTicket(ticket);
    setClosingCost(0);
    setIsModalOpen(true);
  };

  const handleFinishTicket = async () => {
    if (!closingTicket) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (closingTicket.isPreventiveTable) {
        const { error } = await supabase
          .from('preventivas_mensais')
          .update({
            status: 'Concluído',
            concluido_em: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', closingTicket.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('work_orders')
          .update({
            status: 'Concluída',
            custo_total: closingCost,
            updated_at: new Date().toISOString(),
            last_edited_by: user?.id
          })
          .eq('id', closingTicket.id);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchOrders();
      alert("Chamado concluído com sucesso!");
    } catch (err: any) {
      alert("Erro ao concluir chamado: " + err.message);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!userProfile || (userProfile.role !== 'Administrator' && userProfile.role !== 'Gestor')) return alert("Não autorizado");
    if (!confirm("Tem certeza que deseja excluir este chamado?")) return;
    
    const ticket = tickets.find(t => t.id === id);
    if (ticket?.isPreventiveTable) {
      const { error } = await supabase.from('preventivas_mensais').delete().eq('id', id);
      if (error) alert("Erro ao excluir preventiva: " + error.message);
      else fetchOrders();
    } else {
      const { error } = await supabase.from('work_orders').delete().eq('id', id);
      if (error) alert("Erro ao excluir chamado: " + error.message);
      else fetchOrders();
    }
  };

  return (
    <div className="relative z-10 flex-1 min-h-0 overflow-y-auto p-8 scroll-smooth bg-transparent flex flex-col gap-6 font-display">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none z-0"></div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between flex-shrink-0 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[var(--text-secondary)] text-sm">home</span>
            <span className="text-[var(--text-secondary)] text-sm">/</span>
            <span className="text-[var(--text-secondary)] text-sm">Manutenção</span>
            <span className="text-[var(--text-secondary)] text-sm">/</span>
            <span className="text-primary text-sm font-medium">Ordens de Serviço</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-[var(--text-main)] mb-2">Ordens de Serviço</h2>
          <p className="text-[var(--text-secondary)] max-w-2xl text-lg">Controle, agende e acompanhe as ordens de serviço corretivas e preventivas para manter a eficiência da planta.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <WOCard icon="assignment" title="Abertos" value={stats.open.toString()} trend="--" trendColor="text-emerald-500" valueColor="text-primary" />
        <WOCard icon="engineering" title="Em Andamento" value={stats.progress.toString()} trend="--" trendColor="text-slate-500" valueColor="text-sky-400" />
        <WOCard icon="inventory" title="Aguardando Peça" value={stats.waiting.toString()} trend="--" trendColor="text-red-500" valueColor="text-amber-500" />
        <WOCard icon="check_circle" title="Concluídos" value={stats.done.toString()} trend="--" trendColor="text-emerald-500" valueColor="text-emerald-400" />
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 p-1 bg-[var(--surface-color)] rounded-lg border border-[var(--border-color)] shadow-sm self-start md:self-auto">
          {['Todos', 'Preventiva', 'Corretiva', 'Urgente', 'Futuros'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f
                ? 'bg-primary text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-primary hover:bg-[var(--bg-color)]'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] py-2.5 px-3 text-xs md:text-sm text-[var(--text-main)] outline-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary transition-all w-full md:w-48"
          >
            <option value="mes_atual">Mês Atual - {getMonthName(new Date().getMonth() + 1)}</option>
            <option value="3_meses">Últimos 3 Meses</option>
            <option value="6_meses">Últimos 6 Meses</option>
            <option value="ano_atual">Ano Atual - {new Date().getFullYear()}</option>
            <option value="todos">Todos os Períodos</option>
          </select>

          {/* Rows Limit Filter */}
          <select
            value={rowsLimit}
            onChange={(e) => setRowsLimit(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] py-2.5 px-3 text-xs md:text-sm text-[var(--text-main)] outline-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary transition-all w-full md:w-36"
          >
            <option value="10">10 linhas</option>
            <option value="30">30 linhas (Padrão)</option>
            <option value="50">50 linhas</option>
            <option value="100">100 linhas</option>
            <option value="todos">Ver Todos</option>
          </select>

          {/* Search Bar */}
          <div className="relative flex-1 md:w-64 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-[18px] text-[var(--text-secondary)]">search</span>
            </div>
            <input
              type="text"
              placeholder="Buscar chamados..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => setShowSuggestions(true)}
              className="w-full pl-9 pr-3 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {/* Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-lg shadow-xl z-50 overflow-hidden">
                {searchSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 hover:bg-[var(--bg-color)] cursor-pointer text-sm text-[var(--text-secondary)] hover:text-primary transition-colors flex items-center gap-2"
                    onClick={() => { setSearchQuery(suggestion.replace('#', '')); setShowSuggestions(false); }}
                  >
                    <span className="material-symbols-outlined text-[14px]">history</span>
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-9 w-px bg-[var(--border-color)] mx-1 hidden md:block"></div>

          <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00a3e0] hover:bg-[#008ebd] text-white shadow-lg shadow-[#00a3e0]/20 hover:shadow-[#00a3e0]/30 text-sm font-bold transition-all hover:-translate-y-0.5 active:translate-y-0 duration-200 whitespace-nowrap cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Novo Chamado
          </button>
        </div>

      </div>

      {/* Table */}
      <div className="rounded-xl overflow-x-auto border border-slate-800 bg-slate-950/60 backdrop-blur-md shadow-2xl relative z-10 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-800 font-display">
              <th onClick={() => handleSort('display_id')} className="py-2.5 px-4 text-xs font-bold text-slate-200 uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors">
                <div className="flex items-center gap-1">
                  <span>ID Chamado</span>
                  {sortKey === 'display_id' && (sortOrder === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th onClick={() => handleSort('ativo')} className="py-2.5 px-4 text-xs font-bold text-slate-200 uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors">
                <div className="flex items-center gap-1">
                  <span>Ativo</span>
                  {sortKey === 'ativo' && (sortOrder === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th onClick={() => handleSort('tipo')} className="py-2.5 px-4 text-xs font-bold text-slate-200 uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors">
                <div className="flex items-center gap-1">
                  <span>Tipo</span>
                  {sortKey === 'tipo' && (sortOrder === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th onClick={() => handleSort('status')} className="py-2.5 px-4 text-xs font-bold text-slate-200 uppercase tracking-wider text-center cursor-pointer select-none hover:text-white transition-colors">
                <div className="flex items-center justify-center gap-1">
                  <span>Status</span>
                  {sortKey === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th onClick={() => handleSort('created_at')} className="py-2.5 px-4 text-xs font-bold text-slate-200 uppercase tracking-wider cursor-pointer select-none hover:text-white transition-colors">
                <div className="flex items-center gap-1">
                  <span>Data de Abertura</span>
                  {sortKey === 'created_at' && (sortOrder === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th className="py-2.5 px-4 text-xs font-bold text-slate-200 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {paginatedTickets.map(ticket => (
              <tr 
                key={ticket.id} 
                className={`hover:bg-slate-900/40 transition-all duration-200 group border-l-4 ${
                  ticket.isPreventiveTable
                    ? 'border-l-sky-500 bg-sky-950/5'
                    : ticket.tipo === 'Corretiva'
                      ? 'border-l-rose-500 bg-rose-950/5'
                      : 'border-l-primary bg-slate-900/10'
                }`}
              >
                <td className="py-2.5 px-4 align-middle">
                  <span className={`inline-flex items-center px-3 py-1 rounded-md font-mono text-xs font-bold transition-all border ${
                    ticket.isPreventiveTable 
                      ? 'bg-sky-500/10 text-sky-400 border-sky-500/25 shadow-[0_0_15px_rgba(56,189,248,0.1)]' 
                      : ticket.tipo === 'Corretiva'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/25 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                        : 'bg-primary/10 text-primary border-primary/25 shadow-[0_0_15px_rgba(14,165,233,0.1)]'
                  }`}>
                    {ticket.isPreventiveTable ? ticket.display_id : `#${ticket.display_id || ticket.id.slice(0, 6).toUpperCase()}`}
                  </span>
                </td>
                <td className="py-2.5 px-4 align-middle">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${ticket.isPreventiveTable ? 'bg-sky-500/10 text-sky-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      <span className="material-symbols-outlined text-[18px] block">
                        {ticket.isPreventiveTable ? 'assignment_turned_in' : 'precision_manufacturing'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-100 font-bold text-sm tracking-wide group-hover:text-primary transition-colors">{ticket.ativos?.nome || 'Ativo Desconhecido'}</span>
                      {ticket.ativos?.tag_id && (
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                          TAG: <span className="text-slate-300 font-bold">{ticket.ativos.tag_id}</span> {ticket.ativos.setor ? `• ${ticket.ativos.setor}` : ''}
                        </span>
                      )}
                      {ticket.status === 'Aguardando Peça' && ticket.peca_solicitada && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold mt-1.5 bg-amber-500/5 border border-amber-500/10 rounded px-1.5 py-0.5 w-fit">
                          <span className="material-symbols-outlined text-[12px]">inventory</span>
                          Aguardando: {ticket.peca_solicitada}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-4 align-middle">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-bold border ${
                      ticket.isPreventiveTable || ticket.tipo === 'Preventiva'
                        ? 'bg-violet-500/10 text-violet-400 border-violet-500/25'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                    }`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {ticket.isPreventiveTable || ticket.tipo === 'Preventiva' ? 'calendar_month' : 'warning'}
                      </span>
                      {ticket.isPreventiveTable ? `Preventiva (${getMonthName(ticket.mes)})` : ticket.tipo}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-4 align-middle text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all ${
                    ticket.status === 'Concluída' || ticket.status === 'Concluído'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : ticket.status === 'Em Andamento' || ticket.status === 'Em atendimento'
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        : ticket.status === 'Aguardando Peça'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      ticket.status === 'Concluída' || ticket.status === 'Concluído'
                        ? 'bg-emerald-400'
                        : ticket.status === 'Em Andamento' || ticket.status === 'Em atendimento'
                          ? 'bg-sky-400 animate-pulse'
                          : ticket.status === 'Aguardando Peça'
                            ? 'bg-amber-400'
                            : 'bg-rose-400 animate-pulse'
                    }`}></span>
                    {ticket.status}
                  </span>
                </td>
                <td className="py-2.5 px-4 align-middle text-sm font-mono text-slate-300">{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="py-2.5 px-4 align-middle text-right">
                  <div className="flex justify-end gap-2">
                    {/* View Details */}
                    <button 
                      onClick={() => {
                        navigate(`/app/ticket/${ticket.id}`);
                      }} 
                      className="p-2 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-all duration-150" 
                      title="Ver Detalhes"
                    >
                      <span className="material-symbols-outlined text-[20px] block">visibility</span>
                    </button>
 
                    {/* Edit Button */}
                    {isAuthorized && !ticket.isPreventiveTable && (
                      <button onClick={() => openEditModal(ticket)} className="p-2 rounded-lg hover:bg-sky-500/10 text-sky-500 hover:text-sky-400 transition-all duration-150" title="Editar Chamado">
                        <span className="material-symbols-outlined text-[20px] block">edit</span>
                      </button>
                    )}
 
                    {/* Finish Button */}
                    {isAuthorized && (ticket.status !== 'Concluída' && ticket.status !== 'Concluído') && (
                      <button onClick={() => openFinishModal(ticket)} className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-500 hover:text-emerald-400 transition-all duration-150" title="Finalizar">
                        <span className="material-symbols-outlined text-[20px] block">check_circle</span>
                      </button>
                    )}
 
                    {/* Delete Button */}
                    {canDelete && (
                      <button onClick={() => handleDeleteTicket(ticket.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 transition-all duration-150" title="Excluir">
                        <span className="material-symbols-outlined text-[20px] block">delete</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredTickets.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 text-xs md:text-sm text-slate-400 relative z-10">
          <div>
            {rowsLimit === 'todos' ? (
              <span>Exibindo todos os {filteredTickets.length} chamados</span>
            ) : (
              <span>
                Exibindo {Math.min(filteredTickets.length, (currentPage - 1) * Number(rowsLimit) + 1)}-
                {Math.min(filteredTickets.length, currentPage * Number(rowsLimit))} de {filteredTickets.length} chamados
              </span>
            )}
          </div>
          
          {rowsLimit !== 'todos' && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Página Anterior"
              >
                <span className="material-symbols-outlined text-[16px] block">chevron_left</span>
              </button>
              
              <span className="font-semibold text-slate-300 px-3">
                Página {currentPage} de {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Próxima Página"
              >
                <span className="material-symbols-outlined text-[16px] block">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Creation/Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col animate-scale-up">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{editingId ? 'edit_note' : 'add_task'}</span>
                {editingId ? 'Editar Chamado' : 'Abrir Novo Chamado'}
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="text-slate-400 hover:text-white rounded-lg p-1 transition cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-y-auto max-h-[70vh] pr-1">
              <form id="wo-form" onSubmit={handleSaveTicket} className="grid grid-cols-2 gap-4">
                <div className="col-span-1 space-y-1">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                    <span className="material-symbols-outlined text-[14px] text-primary">tag</span>
                    ID do Chamado (Editável)
                  </label>
                  <input
                    type="text"
                    value={newOrder.display_id}
                    onChange={(e) => setNewOrder({ ...newOrder, display_id: e.target.value })}
                    placeholder="Ex: 1001"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary placeholder-slate-600 text-sm font-mono"
                    required
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                    <span className="material-symbols-outlined text-[14px] text-sky-400">build</span>
                    Tipo de Manutenção
                  </label>
                  <select
                    value={newOrder.tipo}
                    onChange={(e) => setNewOrder({ ...newOrder, tipo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary cursor-pointer text-sm"
                    required
                  >
                    <option value="Corretiva" className="bg-slate-900 text-slate-200">Corretiva</option>
                    <option value="Preventiva" className="bg-slate-900 text-slate-200">Preventiva</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1 relative">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                    <span className="material-symbols-outlined text-[14px] text-emerald-400">precision_manufacturing</span>
                    Ativo Relacionado
                  </label>
                  
                  {/* Backdrop overlay to close dropdown when clicking outside */}
                  {isAssetDropdownOpen && (
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setIsAssetDropdownOpen(false)}
                    />
                  )}

                  {/* Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                    className="w-full flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary text-left relative z-10"
                  >
                    <span className={newOrder.ativo_id ? "text-white" : "text-slate-550"}>
                      {isCustomAsset 
                        ? "Outro" 
                        : assets.find(a => a.id === newOrder.ativo_id)?.nome || "Selecione um ativo..."
                      }
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">
                      {isAssetDropdownOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                    </span>
                  </button>

                  {/* Dropdown Options Panel */}
                  {isAssetDropdownOpen && (
                    <div className="absolute z-55 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-2 max-h-60 overflow-y-auto flex flex-col gap-1">
                      {/* Search Input inside the dropdown */}
                      <div className="relative mb-2 shrink-0">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[14px] material-symbols-outlined">
                          search
                        </span>
                        <input
                          type="text"
                          placeholder="Buscar ativo..."
                          value={assetSearchQuery}
                          onChange={(e) => setAssetSearchQuery(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-md py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                        />
                      </div>

                      {/* Options List */}
                      <div className="overflow-y-auto max-h-40 flex flex-col gap-0.5 custom-scrollbar pr-1">
                        {filteredAssetsList.length === 0 ? (
                          <div className="px-2 py-1.5 text-xs text-slate-500 italic">
                            Nenhum ativo encontrado
                          </div>
                        ) : (
                          filteredAssetsList.map((a: any) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => {
                                setIsCustomAsset(false);
                                setNewOrder(prev => ({ ...prev, ativo_id: a.id }));
                                setIsAssetDropdownOpen(false);
                                setAssetSearchQuery('');
                              }}
                              className={`w-full text-left px-2.5 py-2 rounded text-xs transition-colors cursor-pointer ${
                                newOrder.ativo_id === a.id && !isCustomAsset
                                  ? 'bg-primary text-white font-bold'
                                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              {a.nome}
                            </button>
                          ))
                        )}

                        <div className="h-px bg-slate-800 my-1"></div>

                        {/* "Outro" Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomAsset(true);
                            setNewOrder(prev => ({ ...prev, ativo_id: 'custom' }));
                            setIsAssetDropdownOpen(false);
                            setAssetSearchQuery('');
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded text-xs transition-colors cursor-pointer font-bold ${
                            isCustomAsset
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'text-amber-400 hover:bg-slate-800'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">add_circle</span>
                            Outro (Cadastrar novo ativo/equipamento)
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isCustomAsset && (
                  <div className="col-span-2 space-y-1 animate-fade-in">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase">
                      <span className="material-symbols-outlined text-[14px]">edit_note</span>
                      Nome do Novo Ativo / Equipamento
                    </label>
                    <input
                      type="text"
                      required
                      value={customAssetName}
                      onChange={(e) => setCustomAssetName(e.target.value)}
                      placeholder="Digite o nome do ativo/equipamento..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500 text-sm"
                    />
                  </div>
                )}

                <div className="col-span-2 space-y-1">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                    <span className="material-symbols-outlined text-[14px] text-violet-400">notes</span>
                    Descrição do Problema
                  </label>
                  <textarea
                    value={newOrder.descricao}
                    onChange={(e) => setNewOrder({ ...newOrder, descricao: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none h-28 placeholder-slate-600 text-sm"
                    placeholder="Descreva o problema detalhadamente..."
                    required
                  ></textarea>
                </div>

                <div className="col-span-1 space-y-1">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase mb-2">
                    <span className="material-symbols-outlined text-[14px] text-amber-500">priority_high</span>
                    Prioridade
                  </label>
                  <div className="flex gap-2">
                    {['Alta', 'Média', 'Baixa'].map(prio => (
                      <button
                        key={prio}
                        type="button"
                        onClick={() => setNewOrder({ ...newOrder, prioridade: prio })}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          newOrder.prioridade === prio
                            ? prio === 'Alta'
                              ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                              : prio === 'Média'
                                ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                                : 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {prio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-1 space-y-1">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                    <span className="material-symbols-outlined text-[14px] text-primary">calendar_month</span>
                    Prazo Solicitado
                  </label>
                  <input
                    type="date"
                    value={newOrder.data_limite}
                    onChange={(e) => setNewOrder({ ...newOrder, data_limite: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none text-sm"
                    required
                  />
                </div>

                {editingId && (
                  <div className="col-span-2 space-y-1">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                      <span className="material-symbols-outlined text-[14px] text-primary">rule</span>
                      Status do Chamado
                    </label>
                    <select
                      value={newOrder.status}
                      onChange={(e) => {
                        const nextStatus = e.target.value;
                        setNewOrder({ ...newOrder, status: nextStatus });
                        if (nextStatus !== 'Aguardando Peça') {
                          setIsCustomPart(false);
                          setCustomPartName('');
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary cursor-pointer text-sm"
                    >
                      <option value="Aberto" className="bg-slate-900 text-slate-200">Aberto</option>
                      <option value="Em atendimento" className="bg-slate-900 text-slate-200">Em atendimento</option>
                      <option value="Aguardando Peça" className="bg-slate-900 text-slate-200">Aguardando Peça</option>
                      <option value="Concluída" className="bg-slate-900 text-slate-200">Concluída</option>
                    </select>
                  </div>
                )}

                {newOrder.status === 'Aguardando Peça' && (
                  <div className="col-span-2 space-y-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                        <span className="material-symbols-outlined text-[14px] text-amber-500">inventory</span>
                        Peça Necessária
                      </label>
                      <select
                        value={isCustomPart ? 'custom' : newOrder.peca_inventario_id}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'custom') {
                            setIsCustomPart(true);
                            setNewOrder({ ...newOrder, peca_inventario_id: '', peca_solicitada: customPartName });
                          } else {
                            setIsCustomPart(false);
                            const selectedItem = inventory.find(i => i.id === val);
                            setNewOrder({
                              ...newOrder,
                              peca_inventario_id: val,
                              peca_solicitada: selectedItem ? selectedItem.nome_peca : ''
                            });
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary cursor-pointer text-sm"
                      >
                        <option value="" className="bg-slate-900 text-slate-400">Selecione uma peça do inventário...</option>
                        {inventory.map(item => (
                          <option key={item.id} value={item.id} className="bg-slate-900 text-slate-200">
                            {item.nome_peca} {item.sku ? `(${item.sku})` : ''}
                          </option>
                        ))}
                        <option value="custom" className="bg-slate-900 text-amber-400 font-bold">Outra (Especificar peça não cadastrada)</option>
                      </select>
                    </div>

                    {isCustomPart && (
                      <div className="space-y-1 animate-fade-in">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase">
                          <span className="material-symbols-outlined text-[14px]">edit_note</span>
                          Especificar Peça ("Outra")
                        </label>
                        <input
                          type="text"
                          required
                          value={customPartName}
                          onChange={(e) => {
                            setCustomPartName(e.target.value);
                            setNewOrder({ ...newOrder, peca_solicitada: e.target.value, peca_inventario_id: '' });
                          }}
                          placeholder="Digite o nome/modelo da peça..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500 text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-800 mt-6">
              <button 
                type="button" 
                onClick={() => setIsCreateModalOpen(false)} 
                className="px-4 py-2 text-sm text-slate-500 font-bold hover:text-white transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                form="wo-form"
                type="submit" 
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-neon hover:bg-sky-400 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">{editingId ? 'save' : 'send'}</span>
                {editingId ? 'Salvar Alterações' : 'Criar Chamado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal (Finish Ticket) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col animate-scale-up">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">task_alt</span>
                Finalizar Manutenção
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white rounded-lg p-1 transition cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Ticket Summary */}
            <div className="mb-6 p-4 rounded-lg bg-slate-900 border border-slate-700 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Chamado</p>
                <p className="text-white font-mono font-medium">#{closingTicket?.display_id || '---'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Ativo</p>
                <p className="text-white font-medium">{closingTicket?.ativos?.nome || '---'}</p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleFinishTicket(); }}>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">calendar_today</span>
                  Data de Execução
                </label>
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none text-sm"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">payments</span>
                  Custo Total (Material + Mão de Obra)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 text-sm">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-emerald-500 outline-none text-sm font-bold"
                    placeholder="0.00"
                    value={closingCost}
                    onChange={e => setClosingCost(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">notes</span>
                  Observações Técnicas
                </label>
                <textarea 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none h-24 placeholder-slate-600 text-sm" 
                  placeholder="Descreva as atividades realizadas..." 
                  rows={3}
                ></textarea>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-sm text-slate-500 font-bold hover:text-white transition-all cursor-pointer" 
                  type="button"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-400 shadow-neon transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  Concluir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Keeping WOCard and WORow (if used) components although WORow seems unused in main render as we map directly 
const WOCard: React.FC<{ icon: string, title: string, value: string, trend: string, trendColor: string, valueColor: string }> = ({ icon, title, value, trend, trendColor, valueColor }) => (
  <div className="bg-[var(--surface-color)] p-5 rounded-xl border border-[var(--border-color)] relative overflow-hidden group shadow-sm transition-all hover:shadow-md">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <span className={`material-symbols-outlined text-6xl ${valueColor}`}>{icon}</span>
    </div>
    <p className="text-[var(--text-secondary)] text-sm font-medium">{title}</p>
    <div className="flex items-end gap-3 mt-2">
      <h3 className={`text-3xl font-bold ${valueColor}`}>{value}</h3>
    </div>
  </div>
);

export default WorkOrders;