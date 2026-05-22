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

const Inventory: React.FC = () => {
  const { t, userProfile } = usePreferences();
  const role = userProfile?.role || 'Técnico';
  const isAuthorized = role === 'Administrator' || role === 'Gestor' || role === 'Técnico';


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<Peca[]>([]);
  const [filteredItems, setFilteredItems] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Peca | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  useEffect(() => {
    let result = items;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(i => (i.nome_peca?.toLowerCase().includes(lower)) || (i.sku?.toLowerCase().includes(lower)));
    }
    if (locationFilter) {
      result = result.filter(i => i.localizacao === locationFilter);
    }
    setFilteredItems(result);
    setCurrentPage(1);
  }, [searchTerm, locationFilter, items]);

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
                <th className="p-4 text-xs font-bold uppercase text-[var(--text-secondary)]">Item / SKU</th>
                <th className="p-4 text-xs font-bold uppercase text-[var(--text-secondary)] hidden sm:table-cell">Categoria</th>
                <th className="p-4 text-xs font-bold uppercase text-[var(--text-secondary)] hidden md:table-cell">Localização</th>
                <th className="p-4 text-xs font-bold uppercase text-[var(--text-secondary)] text-right">Estoque</th>
                <th className="p-4 text-xs font-bold uppercase text-[var(--text-secondary)] text-right hidden lg:table-cell">Preço</th>
                <th className="p-4 text-xs font-bold uppercase text-[var(--text-secondary)] text-center">Ações</th>
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)} className={`size-8 rounded font-bold text-xs ${currentPage === p ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{p}</button>
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