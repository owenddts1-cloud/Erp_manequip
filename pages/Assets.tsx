import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

const Assets: React.FC = () => {
  const { t } = usePreferences();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [displayedAssets, setDisplayedAssets] = useState<any[]>([]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sectors State
  const [sectors, setSectors] = useState<string[]>([]);
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('Todos');
  const [filterCriticality, setFilterCriticality] = useState('Todas');
  
  // Sorting State
  const [sortKey, setSortKey] = useState<'tag_id' | 'nome' | 'setor' | 'modelo' | 'criticidade' | 'status' | null>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: 'tag_id' | 'nome' | 'setor' | 'modelo' | 'criticidade' | 'status') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Form State
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [formData, setFormData] = useState({
    tag_id: '',
    nome: '',
    setor: '', // Will default to first available sector
    modelo: '',
    criticidade: 'Baixa',
    status: 'Operacional',
    custo_aquisicao: 0,
    data_aquisicao: new Date().toISOString().split('T')[0],
    saude: 100,
    url: ''
  });

  const { userProfile } = usePreferences();
  const isAuthorized = userProfile?.role === 'Administrator' || userProfile?.role === 'Gestor' || userProfile?.role === 'Técnico' || userProfile?.role === 'Supervisor';

  // Expanded Filters State
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Qualquer Status');
  const [filterModel, setFilterModel] = useState('Todos');
  const [filterDate, setFilterDate] = useState('');

  React.useEffect(() => {
    fetchAssets();
    fetchSectors();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('table-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ativos' }, (payload) => {
        fetchAssets();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAssets = async () => {
    const { data, error } = await supabase
      .from('ativos')
      .select('*')
      .order('nome', { ascending: true });

    if (error) console.error('Error fetching assets:', error);
    if (data) {
      setAllAssets(data);
      setDisplayedAssets(data);
    }
  };

  const fetchSectors = async () => {
    const { data, error } = await supabase
      .from('sectors')
      .select('name')
      .order('name');

    if (data && data.length > 0) {
      setSectors(data.map(s => s.name));
    } else {
      // Fallback
      setSectors(['Usinagem', 'Montagem', 'Logística', 'Utilidades']);
    }
  };

  const handleOpenModal = (asset: any = null) => {
    if (!isAuthorized) {
      alert("Acesso Negado: Você não possui permissão para editar ativos.");
      return;
    }
    const defaultSector = sectors.length > 0 ? sectors[0] : 'Usinagem';

    if (asset) {
      setEditingAsset(asset);
      setFormData({
        tag_id: asset.tag_id || '',
        nome: asset.nome || '',
        setor: asset.setor || defaultSector,
        modelo: asset.modelo || '',
        criticidade: asset.criticidade || 'Baixa',
        status: asset.status || 'Operacional',
        custo_aquisicao: asset.custo_aquisicao || 0,
        data_aquisicao: asset.data_aquisicao || new Date().toISOString().split('T')[0],
        saude: asset.saude || 100,
        url: asset.url || ''
      });

    } else {
      setEditingAsset(null);
      setFormData({
        tag_id: '',
        nome: '',
        setor: defaultSector,
        modelo: '',
        criticidade: 'Baixa',
        status: 'Operacional',
        custo_aquisicao: 0,
        data_aquisicao: new Date().toISOString().split('T')[0],
        saude: 100,
        url: ''
      });

    }
    setIsModalOpen(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) return alert("Não autorizado");

    const assetData = {
      ...formData,
      updated_at: new Date().toISOString()
    };

    try {
      let error;
      if (editingAsset) {
        const { error: err } = await supabase
          .from('ativos')
          .update(assetData)
          .eq('id', editingAsset.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('ativos')
          .insert([assetData]);
        error = err;
      }

      if (error) throw error;
      setIsModalOpen(false);
      fetchAssets();
    } catch (err: any) {
      alert(`Erro ao salvar ativo: ${err.message}`);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!isAuthorized) return alert("Não autorizado");
    if (!confirm("Tem certeza que deseja excluir este ativo?")) return;

    try {
      const { error } = await supabase
        .from('ativos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAssets();
    } catch (err: any) {
      alert(`Erro ao excluir ativo: ${err.message}`);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    if (!isAuthorized) {
      alert("Acesso Negado: Você não possui permissão para alterar o status do ativo.");
      return;
    }
    const newStatus = currentStatus === 'Operacional' ? 'Parado' : 'Operacional';
    try {
      const { error } = await supabase
        .from('ativos')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      fetchAssets();
    } catch (err: any) {
      alert(`Erro ao alterar status: ${err.message}`);
    }
  };

  // Filter Logic
  React.useEffect(() => {
    let filtered = [...allAssets];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        (a.nome && a.nome.toLowerCase().includes(lower)) ||
        (a.tag_id && a.tag_id.toLowerCase().includes(lower)) ||
        (a.modelo && a.modelo.toLowerCase().includes(lower))
      );
    }

    if (filterSector !== 'Todos') {
      filtered = filtered.filter(a => a.setor === filterSector);
    }

    if (filterCriticality !== 'Todas') {
      filtered = filtered.filter(a => a.criticidade === filterCriticality);
    }

    // Expanded filters
    if (filterStatus !== 'Qualquer Status') {
      filtered = filtered.filter(a => a.status === filterStatus);
    }

    if (filterModel !== 'Todos') {
      filtered = filtered.filter(a => a.modelo === filterModel);
    }

    if (filterDate) {
      filtered = filtered.filter(a => a.data_aquisicao === filterDate);
    }

    // Apply sorting
    if (sortKey) {
      filtered.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (sortKey === 'criticidade') {
          const priority: Record<string, number> = { 'Alta': 3, 'Média': 2, 'Baixa': 1 };
          const pA = priority[valA as string] || 0;
          const pB = priority[valB as string] || 0;
          return sortOrder === 'asc' ? pA - pB : pB - pA;
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

    setDisplayedAssets(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterSector, filterCriticality, filterStatus, filterModel, filterDate, sortKey, sortOrder, allAssets]);

  const totalAssets = allAssets.length;
  const operational = allAssets.filter(a => a.status && a.status.toLowerCase() === 'operacional').length;
  const inAlert = allAssets.filter(a => a.status && (a.status.toLowerCase() === 'em alerta' || a.status.toLowerCase() === 'alerta')).length;
  const critical = allAssets.filter(a => a.criticidade && a.criticidade.toLowerCase().includes('alta')).length;

  if (isMobile) {
    const paginatedAssets = displayedAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(displayedAssets.length / itemsPerPage);

    return (
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-[#0a0f1d] text-slate-100 pb-24 relative">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span className="material-symbols-outlined text-[14px]">home</span>
          <span>/</span>
          <span>Inventário</span>
          <span>/</span>
          <span className="text-[#00d2ff] font-bold">Gestão de Ativos</span>
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white font-display">Gestão de Ativos</h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed font-display">
            Gerencie o ciclo de vida, localização e status operacional dos equipamentos industriais.
          </p>
        </div>

        {/* KPIs (2x2 Grid) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Operacionais */}
          <div className="p-3.5 rounded-xl bg-[#111827] border border-[#1f2937]/55 flex flex-col justify-between min-h-[90px] relative overflow-hidden">
            <div className="flex justify-between items-center w-full">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Operacionais</span>
              <span className="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-extrabold text-white leading-none tracking-tight">{operational}</h3>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-500/50"></div>
          </div>

          {/* Card 2: Em Alerta */}
          <div className="p-3.5 rounded-xl bg-[#111827] border border-[#1f2937]/55 flex flex-col justify-between min-h-[90px] relative overflow-hidden">
            <div className="flex justify-between items-center w-full">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Em Alerta</span>
              <span className="material-symbols-outlined text-amber-500 text-[16px]">warning</span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-extrabold text-white leading-none tracking-tight">{inAlert}</h3>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-amber-500/50"></div>
          </div>

          {/* Card 3: Críticos (A) */}
          <div className="p-3.5 rounded-xl bg-[#111827] border border-[#1f2937]/55 flex flex-col justify-between min-h-[90px] relative overflow-hidden">
            <div className="flex justify-between items-center w-full">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Críticos (A)</span>
              <span className="material-symbols-outlined text-rose-500 text-[16px]">info</span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-extrabold text-white leading-none tracking-tight">{critical}</h3>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-rose-500/50"></div>
          </div>

          {/* Card 4: Total Ativos */}
          <div className="p-3.5 rounded-xl bg-[#111827] border border-[#1f2937]/55 flex flex-col justify-between min-h-[90px] relative overflow-hidden">
            <div className="flex justify-between items-center w-full">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Ativos</span>
              <span className="material-symbols-outlined text-slate-400 text-[16px]">inventory_2</span>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-extrabold text-white leading-none tracking-tight">{totalAssets}</h3>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-500/50"></div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative w-full group">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 flex items-center">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#111827] py-3 pl-11 pr-4 text-xs text-white placeholder-slate-500 focus:border-[#00d2ff] focus:outline-none transition-all"
              placeholder="Buscar por nome, tag ou código..."
              type="text"
            />
          </div>

          {/* Filters buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
            {/* Sector select styled as pill button */}
            <div className="relative shrink-0">
              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-800 rounded-full px-4 py-2 pr-8 text-[11px] font-semibold text-slate-350 outline-none cursor-pointer"
              >
                <option value="Todos">SETOR: Todos</option>
                {sectors.map(sec => <option key={sec} value={sec}>SETOR: {sec}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 flex items-center">
                <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
              </span>
            </div>

            {/* Criticality select styled as pill button */}
            <div className="relative shrink-0">
              <select
                value={filterCriticality}
                onChange={(e) => setFilterCriticality(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-800 rounded-full px-4 py-2 pr-8 text-[11px] font-semibold text-slate-355 outline-none cursor-pointer"
              >
                <option value="Todas">CRITICIDADE: Todas</option>
                <option value="Alta">CRITICIDADE: Alta</option>
                <option value="Média">CRITICIDADE: Média</option>
                <option value="Baixa">CRITICIDADE: Baixa</option>
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-505 flex items-center">
                <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
              </span>
            </div>

            {/* More filters button */}
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className={`flex items-center gap-1.5 rounded-full border ${showMoreFilters ? 'border-[#00d2ff] text-[#00d2ff]' : 'border-slate-800 text-slate-400'} bg-slate-900 px-4 py-2 text-[11px] font-semibold shrink-0`}
            >
              <span className="material-symbols-outlined text-[14px]">tune</span>
              <span>Mais Filtros</span>
            </button>
          </div>

          {/* More filters panel on mobile */}
          {showMoreFilters && (
            <div className="p-4 rounded-xl border border-slate-800 bg-[#111827]/80 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Status Operacional</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none cursor-pointer"
                >
                  <option>Qualquer Status</option>
                  <option>Operacional</option>
                  <option>Parado</option>
                  <option>Em Manutenção</option>
                  <option>Em Alerta</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Fabricante / Modelo</label>
                <select
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none cursor-pointer"
                >
                  <option>Todos</option>
                  {Array.from(new Set(allAssets.map(a => a.modelo).filter(Boolean))).map(m => (
                    <option key={m as string} value={m as string}>{m as string}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Data de Aquisição</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none [color-scheme:dark]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Asset Card List Container */}
        <div className="rounded-xl border border-slate-850 bg-[#111827]/50 divide-y divide-slate-800/60 overflow-hidden shadow-lg mb-6">
          {paginatedAssets.length === 0 ? (
            <div className="p-8 text-center text-slate-500 italic text-xs">
              Nenhum ativo encontrado.
            </div>
          ) : (
            paginatedAssets.map((asset) => (
              <div key={asset.id} className="p-4 flex flex-col relative group hover:bg-slate-800/20 transition-all">
                {/* Top bar info */}
                <div className="flex justify-between items-center w-full">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">{asset.tag_id || 'N/A'}</span>
                  {isAuthorized && (
                    <button 
                      onClick={() => handleOpenModal(asset)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                  )}
                </div>

                {/* Main Asset details */}
                <div className="mt-1">
                  <h4 className="text-sm font-bold text-white tracking-tight">{asset.nome}</h4>
                  <p className="text-[10px] text-slate-450 font-semibold uppercase tracking-wider mt-0.5">{asset.setor || 'Geral'}</p>
                </div>

                {/* Sub info row */}
                <div className="flex items-center gap-3 mt-3">
                  {/* Criticidade pill */}
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase border ${
                    asset.criticidade?.includes('Alta') 
                      ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                      : asset.criticidade?.includes('Média') 
                        ? 'bg-amber-500/10 text-amber-405 border-amber-500/20' 
                        : 'bg-sky-500/10 text-[#00d2ff] border-sky-500/20'
                  }`}>
                    {asset.criticidade || 'Baixa'}
                  </span>

                  {/* Status dot indicator */}
                  <div className="flex items-center gap-1.5">
                    <span className={`size-1.5 rounded-full ${
                      asset.status === 'Operacional'
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse'
                        : asset.status === 'Em Alerta'
                          ? 'bg-amber-400'
                          : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse'
                    }`}></span>
                    <span className="text-[10px] font-semibold text-slate-300">{asset.status || 'Operacional'}</span>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Mobile Pagination */}
          {displayedAssets.length > 0 && (
            <div className="p-4 flex items-center justify-between bg-[#111827] text-xs text-slate-400 border-t border-slate-800/80">
              <span>
                Mostrando {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, displayedAssets.length)} de {displayedAssets.length} ativos
              </span>
              <div className="flex items-center gap-3">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-45 hover:text-white active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px] block">chevron_left</span>
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-45 hover:text-white active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px] block">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        {isAuthorized && (
          <button 
            onClick={() => handleOpenModal()} 
            className="fixed bottom-20 right-4 size-12 rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-purple-600 hover:from-cyan-300 hover:to-purple-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 active:scale-95 transition-all z-40"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative z-10 flex-1 min-h-0 overflow-y-auto p-8 scroll-smooth bg-transparent flex flex-col gap-6 font-display">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none z-0"></div>

      {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[var(--text-secondary)] text-sm">home</span>
              <span className="text-[var(--text-secondary)] text-sm">/</span>
              <span className="text-[var(--text-secondary)] text-sm">{t('nav_inventory')}</span>
              <span className="text-[var(--text-secondary)] text-sm">/</span>
              <span className="text-primary text-sm font-medium">Gestão de Ativos</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-[var(--text-main)] mb-2">Gestão de Ativos</h2>
            <p className="text-[var(--text-secondary)] max-w-2xl text-lg">Gerencie o ciclo de vida, localização e status operacional dos equipamentos industriais.</p>
          </div>
          {isAuthorized && (
            <button onClick={() => handleOpenModal()} className="group flex items-center gap-2 rounded-lg bg-[#00a3e0] hover:bg-[#008ebd] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#00a3e0]/20 hover:shadow-[#00a3e0]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer">
              <span className="material-symbols-outlined">add_circle</span>
              Novo Ativo
            </button>
          )}
        </div>


        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
          <StatCard icon="check_circle" label="Operacionais" value={operational.toString()} color="text-emerald-400" bg="bg-emerald-500/10" />
          <StatCard icon="warning" label="Em Alerta" value={inAlert.toString()} color="text-amber-400" bg="bg-amber-500/10" />
          <StatCard icon="error" label="Críticos (A)" value={critical.toString()} color="text-red-400" bg="bg-red-500/10" />
          <StatCard icon="inventory_2" label="Total Ativos" value={totalAssets.toString()} color="text-primary" bg="bg-primary/10" />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 flex-shrink-0">
          <div className="flex flex-col gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)]/80 p-4 backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined">search</span>
              </span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)]/50 py-2.5 pl-10 pr-4 text-sm text-[var(--text-main)] placeholder-[var(--text-secondary)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                placeholder="Buscar por nome, tag ou código..."
                type="text"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="Setor"
                current={filterSector}
                options={['Todos', ...sectors]}
                onChange={setFilterSector}
              />
              <FilterSelect
                label="Criticidade"
                current={filterCriticality}
                options={['Todas', 'Alta', 'Média', 'Baixa']}
                onChange={setFilterCriticality}
              />
              <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden lg:block"></div>
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className={`flex items-center gap-2 rounded-lg border ${showMoreFilters ? 'border-primary text-primary' : 'border-[var(--border-color)] text-[var(--text-secondary)]'} bg-[var(--bg-color)]/50 px-4 py-2.5 text-sm font-medium hover:border-primary hover:text-primary transition-colors`}
              >
                <span className="material-symbols-outlined text-[20px]">tune</span>
                <span>Mais Filtros</span>
              </button>
            </div>
          </div>

          {/* Expanded Filters Panel */}
          {showMoreFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)]/60 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 block">Status Operacional</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded p-2 text-sm text-[var(--text-main)] outline-none"
                >
                  <option>Qualquer Status</option>
                  <option>Operacional</option>
                  <option>Parado</option>
                  <option>Em Manutenção</option>
                  <option>Em Alerta</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 block">Fabricante / Modelo</label>
                <select
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value)}
                  className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded p-2 text-sm text-[var(--text-main)] outline-none"
                >
                  <option>Todos</option>
                  {Array.from(new Set(allAssets.map(a => a.modelo).filter(Boolean))).map(m => (
                    <option key={m as string} value={m as string}>{m as string}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 block">Data de Aquisição</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded p-2 text-sm text-[var(--text-main)] outline-none [color-scheme:dark]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)]/60 shadow-xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[850px]">
              <thead className="bg-[var(--surface-color)] text-xs uppercase font-semibold text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                <tr>
                  <th onClick={() => handleSort('tag_id')} className="py-2.5 px-4 align-middle tracking-wider cursor-pointer select-none hover:text-white transition-colors">
                    <div className="flex items-center gap-1">
                      <span>Tag ID</span>
                      {sortKey === 'tag_id' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('nome')} className="py-2.5 px-4 align-middle tracking-wider cursor-pointer select-none hover:text-white transition-colors">
                    <div className="flex items-center gap-1">
                      <span>Nome do Ativo</span>
                      {sortKey === 'nome' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('setor')} className="py-2.5 px-4 align-middle tracking-wider cursor-pointer select-none hover:text-white transition-colors">
                    <div className="flex items-center gap-1">
                      <span>Setor</span>
                      {sortKey === 'setor' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('modelo')} className="py-2.5 px-4 align-middle tracking-wider cursor-pointer select-none hover:text-white transition-colors">
                    <div className="flex items-center gap-1">
                      <span>Modelo / Fab.</span>
                      {sortKey === 'modelo' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('criticidade')} className="py-2.5 px-4 align-middle tracking-wider text-center cursor-pointer select-none hover:text-white transition-colors">
                    <div className="flex items-center justify-center gap-1">
                      <span>Criticidade</span>
                      {sortKey === 'criticidade' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('status')} className="py-2.5 px-4 align-middle tracking-wider cursor-pointer select-none hover:text-white transition-colors">
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      {sortKey === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                  <th className="py-2.5 px-4 align-middle tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
                {displayedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-[var(--text-secondary)] italic">
                      Nenhum ativo encontrado.
                    </td>
                  </tr>
                ) : (
                  displayedAssets.map((asset) => (
                    <TableRow
                      key={asset.id}
                      id={asset.id}
                      tag={asset.tag_id || 'N/A'}
                      name={asset.nome}
                      sector={asset.setor || 'Geral'}
                      model={asset.modelo || '-'}
                      criticality={asset.criticidade || 'Baixa'}
                      status={asset.status || 'Parado'}
                      statusColor={asset.status === 'Operacional' ? 'text-emerald-500' : asset.status === 'Em Alerta' ? 'text-amber-500' : 'text-[var(--text-secondary)]'}
                      url={asset.url}
                      onEdit={() => handleOpenModal(asset)}
                      onDelete={() => handleDeleteAsset(asset.id)}
                      isAuthorized={isAuthorized}
                      onUpdateUrl={async (newUrl) => {
                        const { error } = await supabase
                          .from('ativos')
                          .update({ url: newUrl })
                          .eq('id', asset.id);
                        if (error) {
                          alert('Erro ao atualizar URL: ' + error.message);
                        } else {
                          fetchAssets();
                        }
                      }}
                    />
                  ))
                )}

              </tbody>
            </table>
          </div>
        </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col animate-scale-up">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{editingAsset ? 'edit' : 'add_circle'}</span>
                {editingAsset ? 'Editar Ativo' : 'Cadastro de Ativo'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white rounded-lg p-1 transition cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-y-auto max-h-[70vh] pr-1">
              <form id="asset-form" onSubmit={handleSaveAsset} className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <InputGroup
                    label="Patrimônio / Tag"
                    placeholder="TAG-000"
                    icon="qr_code_2"
                    iconColor="text-sky-400"
                    value={formData.tag_id}
                    onChange={(v) => setFormData({ ...formData, tag_id: v })}
                  />
                </div>
                <div className="col-span-1">
                  <SelectGroup
                    label="Status Inicial"
                    icon="toggle_on"
                    iconColor="text-amber-400"
                    options={['Operacional', 'Parado', 'Em Manutenção', 'Em Alerta']}
                    value={formData.status}
                    onChange={(v) => setFormData({ ...formData, status: v })}
                  />
                </div>
                <div className="col-span-2">
                  <InputGroup
                    label="Nome do Ativo"
                    placeholder="Ex: Motor Elétrico Trifásico"
                    icon="precision_manufacturing"
                    iconColor="text-primary"
                    value={formData.nome}
                    onChange={(v) => setFormData({ ...formData, nome: v })}
                  />
                </div>
                <div className="col-span-2">
                  <InputGroup
                    label="Modelo / Fabricante"
                    placeholder="Ex: WEG W22 Premium"
                    icon="extension"
                    iconColor="text-violet-400"
                    value={formData.modelo}
                    onChange={(v) => setFormData({ ...formData, modelo: v })}
                    required={false}
                  />
                </div>
                <div className="col-span-1">
                  <SelectGroup
                    label="Setor"
                    icon="factory"
                    iconColor="text-emerald-400"
                    options={sectors}
                    value={formData.setor}
                    onChange={(v) => setFormData({ ...formData, setor: v })}
                    onAction={isAuthorized ? () => setIsSectorModalOpen(true) : undefined}
                  />
                </div>
                <div className="col-span-1">
                  <SelectGroup
                    label="Criticidade"
                    icon="priority_high"
                    iconColor="text-rose-400"
                    options={['Alta', 'Média', 'Baixa']}
                    value={formData.criticidade}
                    onChange={(v) => setFormData({ ...formData, criticidade: v })}
                  />
                </div>
                
                {/* Cost & Health Sub-card */}
                <div className="col-span-2 grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div>
                    <InputGroup
                      label="Custo de Aquisição (R$)"
                      placeholder="0.00"
                      icon="payments"
                      iconColor="text-emerald-500"
                      value={formData.custo_aquisicao.toString()}
                      onChange={(v) => setFormData({ ...formData, custo_aquisicao: parseFloat(v) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                      <span className="material-symbols-outlined text-[14px] text-teal-400">health_and_safety</span>
                      Saúde do Ativo ({formData.saude}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.saude}
                      onChange={(e) => setFormData({ ...formData, saude: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary mt-3"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <InputGroup
                    label="Data de Aquisição"
                    icon="calendar_month"
                    iconColor="text-amber-500"
                    type="date"
                    value={formData.data_aquisicao}
                    onChange={(v) => setFormData({ ...formData, data_aquisicao: v })}
                  />
                </div>
                <div className="col-span-2">
                  <InputGroup
                    label="Link URL do Ativo"
                    placeholder="https://exemplo.com/detalhes-ativo"
                    icon="link"
                    iconColor="text-primary"
                    value={formData.url || ''}
                    onChange={(v) => setFormData({ ...formData, url: v })}
                    required={false}
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-4 py-2 text-sm text-slate-500 font-bold hover:text-white transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                form="asset-form" 
                type="submit" 
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-neon hover:bg-sky-400 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">save</span>
                {editingAsset ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sector Manager Modal */}
      {isSectorModalOpen && (
        <SectorManagerModal
          isOpen={isSectorModalOpen}
          initialSectors={sectors}
          onClose={() => {
            setIsSectorModalOpen(false);
            fetchSectors();
          }}
        />
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: string, label: string, value: string, color: string, bg: string }> = ({ icon, label, value, color, bg }) => (
  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)]/50 p-4 backdrop-blur-sm hover:border-primary/50 transition-colors">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${bg} ${color}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-[var(--text-secondary)] text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-[var(--text-main)]">{value}</p>
      </div>
    </div>
  </div>
);

const FilterSelect: React.FC<{ label: string, current: string, options: string[], onChange: (val: string) => void }> = ({ label, current, options, onChange }) => (
  <div className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)]/50 px-3 py-2 text-sm font-medium text-[var(--text-main)] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary hover:bg-[var(--surface-color)]/30 transition-all min-w-[140px]">
    <span className="text-[var(--text-secondary)] text-[10px] font-bold uppercase whitespace-nowrap">{label}:</span>
    <div className="relative flex-1 flex items-center">
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full bg-transparent pr-7 py-0.5 text-sm font-semibold text-[var(--text-main)] focus:outline-none cursor-pointer"
      >
        {options.map(opt => <option key={opt} className="bg-[var(--surface-color)] text-[var(--text-main)]">{opt}</option>)}
      </select>
      <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] flex items-center">
        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
      </span>
    </div>
  </div>
);

const TableRow: React.FC<{ id: string, tag: string, name: string, sector: string, model: string, criticality: string, status: string, statusColor: string, url?: string, onEdit: () => void, onDelete: () => void, isAuthorized: boolean, onUpdateUrl: (newUrl: string) => Promise<void> }> = ({ id, tag, name, sector, model, criticality, status, statusColor, url, onEdit, onDelete, isAuthorized, onUpdateUrl }) => (
  <tr className="group hover:bg-[var(--bg-color)]/40 transition-colors">
    <td className="whitespace-nowrap py-2.5 px-4 align-middle font-mono text-[var(--text-secondary)] group-hover:text-[var(--text-main)]">{tag}</td>
    <td className="py-2.5 px-4 align-middle font-medium text-[var(--text-main)]">
      <span className="truncate max-w-[200px] sm:max-w-[260px] block" title={name}>{name}</span>
    </td>
    <td className="py-2.5 px-4 align-middle text-[var(--text-secondary)] group-hover:text-[var(--text-main)] truncate max-w-[150px]" title={sector}>{sector}</td>
    <td className="py-2.5 px-4 align-middle text-[var(--text-secondary)] group-hover:text-[var(--text-main)] truncate max-w-[150px]" title={model}>{model}</td>
    <td className="whitespace-nowrap py-2.5 px-4 align-middle text-center">
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset ${criticality.includes('Alta') ? 'bg-red-500/10 text-red-500 ring-red-500/20' : criticality.includes('Média') ? 'bg-amber-500/10 text-amber-500 ring-amber-500/20' : 'bg-primary/10 text-primary ring-primary/30'}`}>
        {criticality}
      </span>
    </td>
    <td className="whitespace-nowrap py-2.5 px-4 align-middle">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all ${
        status === 'Operacional'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : status === 'Em Alerta'
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      }`}>
        <span className={`h-1.5 w-1.5 rounded-full ${
          status === 'Operacional'
            ? 'bg-emerald-400 animate-pulse'
            : status === 'Em Alerta'
              ? 'bg-amber-400'
              : 'bg-rose-400 animate-pulse'
        }`}></span>
        {status}
      </span>
    </td>
    <td className="whitespace-nowrap py-2.5 px-4 align-middle text-right">
      <button 
        onClick={async () => {
          if (url && url.trim()) {
            const choice = window.confirm(`Deseja abrir o link cadastrado?\n\nClique em [OK] para abrir:\n${url}\n\nClique em [Cancelar] para EDITAR / ALTERAR o link.`);
            if (choice) {
              window.open(url.startsWith('http') ? url : `https://${url}`, '_blank', 'noopener,noreferrer');
            } else {
              const newUrl = window.prompt("Editar Link URL do Ativo:", url);
              if (newUrl !== null) {
                await onUpdateUrl(newUrl.trim());
              }
            }
          } else {
            const newUrl = window.prompt("Adicionar Link URL para este Ativo:");
            if (newUrl !== null) {
              await onUpdateUrl(newUrl.trim());
            }
          }
        }} 
        className={`rounded p-1 transition-colors mr-1 inline-flex items-center justify-center cursor-pointer ${
          url && url.trim() 
            ? 'text-white hover:bg-[var(--bg-color)] hover:text-sky-400' 
            : 'text-slate-600/50 hover:bg-transparent'
        }`}
        title={url && url.trim() ? "Acessar ou Editar Link do Ativo" : "Cadastrar Link do Ativo"}
      >
        <span className="material-symbols-outlined text-[20px]">link</span>
      </button>
      {isAuthorized && (
        <>
          <button onClick={onEdit} className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-color)] hover:text-[var(--text-main)] transition-colors">
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
          <button onClick={onDelete} className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-color)] hover:text-red-500 transition-colors ml-1">
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </>
      )}
    </td>
  </tr>
);


const InputGroup: React.FC<{ 
  label: string;
  placeholder?: string;
  icon?: string;
  iconColor?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}> = ({ label, placeholder, icon, iconColor = "text-primary", value, onChange, required = true, type = "text" }) => (
  <div className="space-y-1">
    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
      {icon && (
        <span className={`material-symbols-outlined text-[14px] ${iconColor}`}>
          {icon}
        </span>
      )}
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary placeholder-slate-600 text-sm transition-all"
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    />
  </div>
);

const SelectGroup: React.FC<{ 
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  icon?: string;
  iconColor?: string;
  onAction?: () => void;
  required?: boolean;
}> = ({ label, options, value, onChange, icon, iconColor = "text-primary", onAction, required = true }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
        {icon && (
          <span className={`material-symbols-outlined text-[14px] ${iconColor}`}>
            {icon}
          </span>
        )}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {onAction && (
        <button type="button" onClick={onAction} className="text-primary hover:text-sky-400 p-0.5 rounded transition-colors" title="Gerenciar Setores">
          <span className="material-symbols-outlined text-[14px]">edit</span>
        </button>
      )}
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary cursor-pointer text-sm transition-all"
      required={required}
    >
      {options.map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
    </select>
  </div>
);

// Sector Manager Modal Component
const SectorManagerModal: React.FC<{ isOpen: boolean; initialSectors: string[]; onClose: () => void }> = ({ isOpen, initialSectors, onClose }) => {
  const [sectorName, setSectorName] = useState('');
  const [sectors, setSectors] = useState<{ id: string; name: string }[]>([]);
  const [editingSector, setEditingSector] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    const { data } = await supabase.from('sectors').select('id, name').order('name');
    if (data) setSectors(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = sectorName.trim();
    if (!trimmedName) return;

    const { error } = await supabase.from('sectors').insert([{ name: trimmedName }]);
    if (error) {
      alert('Erro ao salvar setor: ' + error.message);
    } else {
      setSectorName('');
      fetchSectors();
    }
  };

  const handleUpdate = async (id: string, oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (trimmed === oldName) {
      setEditingSector(null);
      return;
    }

    try {
      // 1. Update sectors table
      const { error: sectorErr } = await supabase
        .from('sectors')
        .update({ name: trimmed })
        .eq('id', id);

      if (sectorErr) throw sectorErr;

      // 2. Update ativos table (propagate sector change)
      const { error: assetsErr } = await supabase
        .from('ativos')
        .update({ setor: trimmed })
        .eq('setor', oldName);

      if (assetsErr) throw assetsErr;

      // 3. Update map_hotspots table (propagate sector change)
      const { error: hotspotsErr } = await supabase
        .from('map_hotspots')
        .update({ db_sector: trimmed })
        .eq('db_sector', oldName);

      if (hotspotsErr) throw hotspotsErr;

      setEditingSector(null);
      setEditName('');
      fetchSectors();
    } catch (err: any) {
      alert('Erro ao atualizar setor: ' + err.message);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Excluir o setor "${name}"? Os ativos deste setor ficarão sem setor definido.`)) return;

    try {
      // 1. Delete from sectors table
      const { error: sectorErr } = await supabase
        .from('sectors')
        .delete()
        .eq('name', name);

      if (sectorErr) throw sectorErr;

      // 2. Propagate to ativos table by clearing the sector
      const { error: assetsErr } = await supabase
        .from('ativos')
        .update({ setor: '' })
        .eq('setor', name);

      if (assetsErr) throw assetsErr;

      // 3. Propagate to map_hotspots by clearing db_sector
      const { error: hotspotsErr } = await supabase
        .from('map_hotspots')
        .update({ db_sector: '' })
        .eq('db_sector', name);

      if (hotspotsErr) throw hotspotsErr;

      fetchSectors();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col animate-scale-up">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">domain</span>
            Gerenciar Setores
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1 transition cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary placeholder-slate-600"
            placeholder="Novo Setor..."
            value={sectorName}
            onChange={e => setSectorName(e.target.value)}
          />
          <button type="submit" className="bg-primary hover:bg-sky-400 text-white rounded-lg px-4 py-2.5 font-bold text-sm shadow-neon flex items-center justify-center transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        </form>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {sectors.length === 0 && <p className="text-xs text-slate-500 text-center italic">Nenhum setor cadastrado.</p>}
          {sectors.map(s => {
            const isEditing = editingSector && editingSector.id === s.id;
            return (
              <div key={s.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-900 border border-slate-850">
                {isEditing ? (
                  <input
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-primary mr-2"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <span className="text-sm font-semibold text-slate-200">{s.name}</span>
                )}
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleUpdate(s.id, s.name, editName)}
                        className="text-emerald-500 hover:text-emerald-400 p-1 rounded-lg hover:bg-emerald-500/10 transition-all cursor-pointer"
                        title="Salvar"
                      >
                        <span className="material-symbols-outlined text-[18px] block">check</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingSector(null);
                          setEditName('');
                        }}
                        className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-700/10 transition-all cursor-pointer"
                        title="Cancelar"
                      >
                        <span className="material-symbols-outlined text-[18px] block">close</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingSector(s);
                          setEditName(s.name);
                        }}
                        className="text-slate-500 hover:text-primary p-1 rounded-lg hover:bg-sky-500/10 transition-all cursor-pointer mr-1"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-[16px] block">edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(s.name)} 
                        className="text-slate-500 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Excluir"
                      >
                        <span className="material-symbols-outlined text-[16px] block">delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Assets;