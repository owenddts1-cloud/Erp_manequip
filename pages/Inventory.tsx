import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

// Helper for currency formatting
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// Types
interface Peca {
  id: string;
  nome_peca: string;
  sku: string;
  categoria: string;
  localizacao: string;
  quantidade_estoque: number;
  estoque_minimo: number;
  valor_unitario: number;
  status?: string;
  created_at: string;
}

const getPageNumbers = (current: number, total: number) => {
  const pages: (number | string)[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', total);
    } else if (current >= total - 3) {
      pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
  }
  return pages;
};

const Inventory: React.FC = () => {
  const { t, userProfile } = usePreferences();
  const role = userProfile?.role || 'Técnico';
  const isAuthorized = role === 'Administrator' || role === 'Gestor' || role === 'Técnico' || role === 'Supervisor';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [items, setItems] = useState<Peca[]>([]);
  const [filteredItems, setFilteredItems] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Peca | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Critico' | 'Baixo' | 'Estavel'>('Todos');
  const [sortKey, setSortKey] = useState<'nome_peca' | 'categoria' | 'localizacao' | 'quantidade_estoque' | 'valor_unitario' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Column specific filters
  const [colFilterNome, setColFilterNome] = useState('');
  const [colFilterCategoria, setColFilterCategoria] = useState('');
  const [colFilterLocalizacao, setColFilterLocalizacao] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);

  // Form State
  const [formData, setFormData] = useState({
    nome_peca: '',
    sku: '',
    categoria: '',
    localizacao: '',
    quantidade_estoque: 0,
    estoque_minimo: 5,
    valor_unitario: 0
  });


  useEffect(() => {
    fetchItems();
    const channel = supabase
      .channel('inventario-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, () => fetchItems())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('inventario').select('*').order('nome_peca', { ascending: true });
    if (error) console.error(error);
    if (data) {
      setItems(data);
      setFilteredItems(data);
    }
    setLoading(false);
  };

  const handleSort = (key: 'nome_peca' | 'categoria' | 'localizacao' | 'quantidade_estoque' | 'valor_unitario') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  useEffect(() => {
    let result = [...items];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(i => (i.nome_peca?.toLowerCase().includes(lower)) || (i.sku?.toLowerCase().includes(lower)));
    }
    if (colFilterNome) {
      const lower = colFilterNome.toLowerCase();
      result = result.filter(i => (i.nome_peca?.toLowerCase().includes(lower)) || (i.sku?.toLowerCase().includes(lower)));
    }
    if (colFilterCategoria) {
      const lower = colFilterCategoria.toLowerCase();
      result = result.filter(i => i.categoria?.toLowerCase().includes(lower));
    }
    if (colFilterLocalizacao) {
      const lower = colFilterLocalizacao.toLowerCase();
      result = result.filter(i => i.localizacao?.toLowerCase().includes(lower));
    }
    if (locationFilter) {
      result = result.filter(i => i.localizacao === locationFilter);
    }
    if (statusFilter !== 'Todos') {
      result = result.filter(i => {
        const min = i.estoque_minimo || 0;
        if (statusFilter === 'Critico') {
          return i.quantidade_estoque <= min;
        }
        if (statusFilter === 'Baixo') {
          return i.quantidade_estoque > min && i.quantidade_estoque <= min * 1.5;
        }
        if (statusFilter === 'Estavel') {
          return i.quantidade_estoque > min * 1.5;
        }
        return true;
      });
    }
    if (sortKey) {
      result.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];
        
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
    setFilteredItems(result);
    setCurrentPage(1);
  }, [searchTerm, locationFilter, statusFilter, sortKey, sortOrder, items, colFilterNome, colFilterCategoria, colFilterLocalizacao]);

  const handleOpenModal = (item: Peca | null = null) => {
    if (!isAuthorized) {
      alert("Acesso Negado: Você não possui permissão para editar o inventário.");
      return;
    }
    if (item) {
      setEditingItem(item);
      setFormData({
        nome_peca: item.nome_peca,
        sku: item.sku,
        categoria: item.categoria || '',
        localizacao: item.localizacao || '',
        quantidade_estoque: item.quantidade_estoque,
        estoque_minimo: item.estoque_minimo || 0,
        valor_unitario: item.valor_unitario || 0
      });
    } else {
      setEditingItem(null);
      setFormData({
        nome_peca: '',
        sku: '',
        categoria: '',
        localizacao: '',
        quantidade_estoque: 0,
        estoque_minimo: 5,
        valor_unitario: 0
      });

    }
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) return;
    if (!formData.nome_peca || !formData.sku) return alert('Preencha os campos obrigatórios (Nome e SKU)');

    try {
      let error;
      if (editingItem) {
        const { error: err } = await supabase.from('inventario').update(formData).eq('id', editingItem.id);
        error = err;
      } else {
        const { error: err } = await supabase.from('inventario').insert([formData]);
        error = err;
      }

      if (error) throw error;
      setIsModalOpen(false);
      fetchItems();
    } catch (err: any) {
      alert('Erro ao salvar item: ' + err.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!isAuthorized) return;
    if (!confirm("Tem certeza que deseja excluir esta peça?")) return;
    const { error } = await supabase.from('inventario').delete().eq('id', id);
    if (error) alert("Erro ao excluir: " + error.message);
    else fetchItems();
  };

  const getStockStatus = (item: Peca) => {
    const min = item.estoque_minimo || 0;
    if (item.quantidade_estoque <= 0) return { text: 'Sem Estoque', color: 'text-red-500', isCritical: true };
    if (item.quantidade_estoque <= min) return { text: 'Crítico', color: 'text-red-500', isCritical: true };
    if (item.quantidade_estoque <= min * 1.5) return { text: 'Baixo', color: 'text-amber-500', isCritical: false };
    return { text: 'Estável', color: 'text-emerald-500', isCritical: false };
  };

  // KPIs
  const totalSKUs = items.length;
  const totalValue = items.reduce((acc, curr) => acc + (curr.quantidade_estoque * curr.valor_unitario), 0);
  const itemsCritical = items.filter(i => i.quantidade_estoque <= i.estoque_minimo).length;
  const healthPercent = totalSKUs > 0 ? Math.round(((totalSKUs - itemsCritical) / totalSKUs) * 100) : 100;

  const displayedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const locations = Array.from(new Set(items.map(i => i.localizacao).filter(Boolean)));

  if (isMobile) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-[#0a0f1d] text-slate-100 pb-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
          <span>Almoxarifado</span>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-[#00d2ff] font-bold font-display">Inventário de Peças</span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight font-display">Estoque de Manutenção</h1>
        </div>

        {/* Vertical KPIs Stack */}
        <div className="space-y-3">
          {/* Card 1: Peças Cadastradas */}
          <div className="p-4 rounded-xl bg-[#111827] border-b-2 border-b-[#00d2ff] border border-slate-800/60 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px] text-[#00d2ff]">inventory_2</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Peças Cadastradas</span>
            </div>
            <h3 className="text-3xl font-extrabold text-white leading-none tracking-tight font-display">{totalSKUs}</h3>
            <p className="text-[10px] text-slate-450 font-bold uppercase mt-2">SKUs ativos</p>
          </div>

          {/* Card 2: Valor Patrimonial */}
          <div className="p-4 rounded-xl bg-[#111827] border-b-2 border-b-amber-500 border border-slate-800/60 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px] text-amber-500">payments</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Valor Patrimonial</span>
            </div>
            <h3 className="text-3xl font-extrabold text-white leading-none tracking-tight font-display">{formatCurrency(totalValue)}</h3>
            <p className="text-[10px] text-slate-455 font-bold uppercase mt-2">Total avaliado</p>
          </div>

          {/* Card 3: Nível Crítico */}
          <div className="p-4 rounded-xl bg-[#111827] border-b-2 border-b-rose-500 border border-slate-800/60 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px] text-rose-500">warning</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Nível Crítico</span>
            </div>
            <h3 className="text-3xl font-extrabold text-white leading-none tracking-tight font-display">{itemsCritical}</h3>
            <p className="text-[10px] text-rose-450 font-bold uppercase mt-2">{healthPercent}% em conformidade</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3 bg-[#111827]/40 p-4 rounded-xl border border-slate-800/80">
          {/* Search bar */}
          <div className="relative w-full group">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 flex items-center">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#111827] py-3 pl-11 pr-4 text-xs text-white placeholder-slate-500 focus:border-[#00d2ff] focus:outline-none transition-all"
              placeholder="Buscar por nome ou SKU..."
              type="text"
            />
          </div>

          {/* Dropdown selects */}
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="appearance-none w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-3 pr-6 text-[10px] font-semibold text-slate-300 outline-none cursor-pointer"
              >
                <option value="">Localizações</option>
                {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
              <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 flex items-center">
                <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
              </span>
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="appearance-none w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-3 pr-6 text-[10px] font-semibold text-slate-300 outline-none cursor-pointer"
              >
                <option value="Todos">Status</option>
                <option value="Critico">Crítico (≤ Mín)</option>
                <option value="Baixo">Baixo (≤ 1.5x Mín)</option>
                <option value="Estavel">Estável</option>
              </select>
              <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 flex items-center">
                <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
              </span>
            </div>

            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-3 pr-6 text-[10px] font-semibold text-slate-300 outline-none cursor-pointer"
              >
                <option value={10}>10 Linhas</option>
                <option value={30}>30 Linhas</option>
                <option value={50}>50 Linhas</option>
                <option value={100}>100 Linhas</option>
                <option value={1000}>1000 Linhas</option>
              </select>
              <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 flex items-center">
                <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
              </span>
            </div>
          </div>

          {/* Action Button */}
          {isAuthorized && (
            <button 
              onClick={() => handleOpenModal()} 
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs tracking-wide shadow-lg active:scale-95 transition-all mt-1"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nova Peça
            </button>
          )}
        </div>

        {/* Parts Card List */}
        <div className="space-y-4">
          {displayedItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 italic text-xs bg-[#111827]/40 rounded-xl border border-slate-800">
              Vazio.
            </div>
          ) : (
            displayedItems.map((item) => {
              const status = getStockStatus(item);
              return (
                <div key={item.id} className="p-5 rounded-xl bg-[#111827] border border-slate-800 relative flex flex-col justify-between shadow-md">
                  {/* Top line with title and edit button */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-white tracking-tight truncate font-display">{item.nome_peca}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">SKU: {item.sku}</p>
                    </div>
                    {isAuthorized && (
                      <button 
                        onClick={() => handleOpenModal(item)}
                        className="size-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-white hover:bg-slate-800 active:scale-95 transition-all shrink-0 animate-in fade-in"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                    )}
                  </div>

                  {/* Grid details */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-5 pt-4 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Categoria</span>
                      <span className="text-slate-200 font-semibold mt-0.5 block truncate">{item.categoria || '-'}</span>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Localização</span>
                      <span className="text-slate-200 font-semibold mt-0.5 flex items-center gap-1 truncate">
                        <span className="material-symbols-outlined text-[14px] text-amber-500">location_on</span>
                        {item.localizacao || '-'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Estoque</span>
                      <span className={`font-bold mt-0.5 block ${status.isCritical ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
                        {item.quantidade_estoque} un
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">MÍN: {item.estoque_minimo}</span>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Preço Unit.</span>
                      <span className="text-slate-200 font-semibold mt-0.5 block font-mono">{formatCurrency(item.valor_unitario)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 flex items-center justify-between bg-[#111827] rounded-xl border border-slate-800 text-xs text-slate-400 border-t border-slate-800/80">
              <span>
                Mostrando {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredItems.length)} de {filteredItems.length} peças
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
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:px-8 md:py-8 max-w-[1600px] mx-auto w-full gap-6 overflow-y-auto bg-transparent">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] font-medium mb-1">
            <span>Almoxarifado</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-primary font-bold">Inventário de Peças</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--text-main)] tracking-tight">Estoque de Manutenção</h1>
        </div>
        <button onClick={() => fetchItems()} className="p-2 text-[var(--text-secondary)] hover:text-primary transition-colors">
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon="inventory_2" title="Peças Cadastradas" value={totalSKUs.toString()} trend="SKUs ativos" color="text-primary" progressColor="bg-primary" />
        <StatCard icon="payments" title="Valor Patrimonial" value={formatCurrency(totalValue)} trend="Total avaliado" color="text-emerald-500" progressColor="bg-emerald-500" />
        <StatCard icon="warning" title="Nível Crítico" value={itemsCritical.toString()} trend={`${healthPercent}% em conformidade`} color="text-red-500" progressColor="bg-red-500" isWarning={itemsCritical > 0} progressValue={healthPercent} />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-[var(--surface-color)] p-4 rounded-xl border border-[var(--border-color)]">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)]/50 py-2.5 px-4 text-sm text-[var(--text-main)] placeholder-[var(--text-secondary)] outline-none focus:ring-1 focus:ring-primary"
            placeholder="Buscar por nome ou SKU..."
          />
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full sm:w-48 rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)]/50 py-2.5 px-4 text-sm text-[var(--text-main)] outline-none cursor-pointer"
          >
            <option value="">Todas Localizações</option>
            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-48 rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)]/50 py-2.5 px-4 text-sm text-[var(--text-main)] outline-none cursor-pointer"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Critico">Crítico (≤ Mín)</option>
            <option value="Baixo">Baixo (≤ 1.5x Mín)</option>
            <option value="Estavel">Estável</option>
          </select>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-full sm:w-36 rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)]/50 py-2.5 px-4 text-sm text-[var(--text-main)] outline-none cursor-pointer"
          >
            <option value={10}>10 Linhas</option>
            <option value={30}>30 Linhas</option>
            <option value={50}>50 Linhas</option>
            <option value={100}>100 Linhas</option>
            <option value={1000}>1000 Linhas</option>
          </select>
        </div>
        {isAuthorized && (
          <button onClick={() => handleOpenModal()} className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-sky-400 text-white font-bold shadow-neon transition-all">
            <span className="material-symbols-outlined">add</span> Nova Peça
          </button>
        )}
      </div>

      <div className="w-full overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] flex flex-col min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-color)]/50">
                <th onClick={() => handleSort('nome_peca')} className="p-4 text-xs font-bold uppercase text-[var(--text-secondary)] cursor-pointer select-none hover:text-white transition-colors">
                  <div className="flex items-center gap-1">
                    <span>Item / SKU</span>
                    <span className="material-symbols-outlined text-[16px] transition-all">
                      {sortKey === 'nome_peca' ? (sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                    </span>
                  </div>
                </th>
                <th onClick={() => handleSort('categoria')} className="p-4 text-xs font-bold uppercase text-[var(--text-secondary)] hidden sm:table-cell cursor-pointer select-none hover:text-white transition-colors">
                  <div className="flex items-center gap-1">
                    <span>Categoria</span>
                    <span className="material-symbols-outlined text-[16px] transition-all">
                      {sortKey === 'categoria' ? (sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                    </span>
                  </div>
                </th>
                <th onClick={() => handleSort('localizacao')} className="p-4 text-xs font-bold uppercase text-[var(--text-secondary)] hidden md:table-cell cursor-pointer select-none hover:text-white transition-colors">
                  <div className="flex items-center gap-1">
                    <span>Localização</span>
                    <span className="material-symbols-outlined text-[16px] transition-all">
                      {sortKey === 'localizacao' ? (sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                    </span>
                  </div>
                </th>
                <th onClick={() => handleSort('quantidade_estoque')} className="p-4 text-xs font-bold uppercase text-[var(--text-secondary)] text-right cursor-pointer select-none hover:text-white transition-colors">
                  <div className="flex items-center justify-end gap-1">
                    <span>Estoque</span>
                    <span className="material-symbols-outlined text-[16px] transition-all">
                      {sortKey === 'quantidade_estoque' ? (sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                    </span>
                  </div>
                </th>
                <th onClick={() => handleSort('valor_unitario')} className="p-4 text-xs font-bold uppercase text-[var(--text-secondary)] text-right hidden lg:table-cell cursor-pointer select-none hover:text-white transition-colors">
                  <div className="flex items-center justify-end gap-1">
                    <span>Preço</span>
                    <span className="material-symbols-outlined text-[16px] transition-all">
                      {sortKey === 'valor_unitario' ? (sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                    </span>
                  </div>
                </th>
                <th className="p-4 text-xs font-bold uppercase text-[var(--text-secondary)] text-center">Ações</th>
              </tr>
              {/* Column Filter Row */}
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-color)]/25">
                <td className="p-2.5">
                  <input
                    value={colFilterNome}
                    onChange={(e) => setColFilterNome(e.target.value)}
                    placeholder="Filtrar por nome/SKU..."
                    className="w-full bg-[var(--bg-color)]/30 border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] placeholder-slate-650 outline-none focus:border-primary transition-all"
                  />
                </td>
                <td className="p-2.5 hidden sm:table-cell">
                  <input
                    value={colFilterCategoria}
                    onChange={(e) => setColFilterCategoria(e.target.value)}
                    placeholder="Filtrar categoria..."
                    className="w-full bg-[var(--bg-color)]/30 border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] placeholder-slate-655 outline-none focus:border-primary transition-all"
                  />
                </td>
                <td className="p-2.5 hidden md:table-cell">
                  <input
                    value={colFilterLocalizacao}
                    onChange={(e) => setColFilterLocalizacao(e.target.value)}
                    placeholder="Filtrar localização..."
                    className="w-full bg-[var(--bg-color)]/30 border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] placeholder-slate-655 outline-none focus:border-primary transition-all"
                  />
                </td>
                <td className="p-2.5"></td>
                <td className="p-2.5 hidden lg:table-cell"></td>
                <td className="p-2.5"></td>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500 italic">Sincronizando...</td></tr>
              ) : displayedItems.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500 italic">Vazio.</td></tr>
              ) : (
                displayedItems.map(item => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-[var(--bg-color)]/50 transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-[var(--text-main)] truncate max-w-[200px]">{item.nome_peca}</div>
                        <div className="text-[10px] text-primary font-mono font-bold">{item.sku}</div>
                      </td>
                      <td className="p-4 hidden sm:table-cell text-slate-400 text-xs">{item.categoria}</td>
                      <td className="p-4 hidden md:table-cell text-slate-400 text-xs">{item.localizacao}</td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                          <div className={`font-bold transition-colors ${status.isCritical ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
                            {item.quantidade_estoque} un
                          </div>
                          <div className="flex items-center gap-1">
                            {status.isCritical && (
                              <span className="material-symbols-outlined text-[14px] text-red-500 font-bold">priority_high</span>
                            )}
                            <span className={`text-[10px] font-bold uppercase ${status.isCritical ? 'text-red-500' : 'text-slate-500'}`}>
                              Mín: {item.estoque_minimo}
                            </span>
                          </div>
                        </div>
                      </td>


                      <td className="p-4 text-right font-mono text-slate-400 text-xs hidden lg:table-cell">{formatCurrency(item.valor_unitario)}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-1">
                          {isAuthorized ? (
                            <>
                              <button onClick={() => handleOpenModal(item)} className="p-1.5 rounded hover:bg-primary/10 text-slate-500 hover:text-primary transition-all">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-600 text-[10px] italic">Apenas leitura</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border-color)] flex justify-center gap-2 mt-auto">
            {getPageNumbers(currentPage, totalPages).map((p, idx) => (
              p === '...' ? (
                <span key={`dots-${idx}`} className="px-2 text-slate-500 font-bold text-xs self-center">...</span>
              ) : (
                <button
                  key={`page-${p}`}
                  onClick={() => setCurrentPage(p as number)}
                  className={`size-8 rounded font-bold text-xs ${currentPage === p ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {p}
                </button>
              )
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">{editingItem ? 'edit' : 'add_box'}</span>
              {editingItem ? 'Editar Peça' : 'Cadastrar Nova Peça'}
            </h3>
            <form onSubmit={handleSaveItem} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-primary">inventory_2</span>
                  Nome da Peça
                </label>
                <input
                  required
                  value={formData.nome_peca}
                  onChange={e => setFormData({ ...formData, nome_peca: e.target.value })}
                  placeholder="Ex: Rolamento SKF 6205"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary placeholder-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-sky-400">qr_code_2</span>
                  Código SKU
                </label>
                <input
                  required
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Ex: ROL-6205-SKF"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono outline-none focus:border-primary placeholder-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-amber-400">location_on</span>
                  Localização
                </label>
                <input
                  value={formData.localizacao}
                  onChange={e => setFormData({ ...formData, localizacao: e.target.value })}
                  placeholder="Ex: Prateleira A3"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary placeholder-slate-600"
                />
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase">
                    <span className="material-symbols-outlined text-[14px]">stacked_bar_chart</span>
                    Quantidade Atual
                  </label>
                  <input
                    type="number"
                    value={formData.quantidade_estoque}
                    onChange={e => setFormData({ ...formData, quantidade_estoque: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-emerald-500 font-bold text-lg placeholder-slate-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] animate-pulse">error</span>
                    Estoque Mínimo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-red-500 material-symbols-outlined text-[20px]">warning</span>
                    <input
                      type="number"
                      value={formData.estoque_minimo}
                      onChange={e => setFormData({ ...formData, estoque_minimo: Number(e.target.value) })}
                      placeholder="5"
                      className="w-full bg-red-950/20 border border-red-500/30 rounded-lg p-3 pl-10 text-red-500 outline-none focus:border-red-500 font-bold text-lg placeholder-red-800"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-violet-400">category</span>
                  Categoria
                </label>
                <input
                  value={formData.categoria}
                  onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Ex: Rolamentos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-primary placeholder-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">payments</span>
                  Preço Unitário (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valor_unitario}
                  onChange={e => setFormData({ ...formData, valor_unitario: Number(e.target.value) })}
                  placeholder="Ex: 45.90"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono outline-none focus:border-primary placeholder-slate-600"
                />
              </div>

              <div className="col-span-2 pt-6 flex justify-end gap-3 mt-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-500 font-bold hover:text-white transition-all">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-primary hover:bg-sky-400 text-white font-bold rounded-lg shadow-neon transition-all">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: string, title: string, value: string, trend: string, color: string, progressColor: string, isWarning?: boolean, progressValue?: number }> = ({ icon, title, value, trend, color, progressColor, isWarning, progressValue = 75 }) => (
  <div className={`relative overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-5 group`}>
    <div className="flex flex-col gap-1 relative z-10">
      <div className="flex items-center gap-2 mb-1">
        <span className={`material-symbols-outlined text-[20px] ${color}`}>{icon}</span>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      </div>
      <h3 className="text-2xl font-black text-white">{value}</h3>
      <p className={`text-[10px] font-bold ${color} uppercase`}>{trend}</p>
    </div>
    <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${progressColor} transition-all duration-1000 shadow-[0_0_8px_rgba(10,160,235,0.4)]`} style={{ width: `${progressValue}%` }}></div>
    </div>
  </div>
);

export default Inventory;