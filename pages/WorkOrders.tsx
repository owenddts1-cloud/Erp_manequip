import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePreferences } from '../contexts/PreferencesContext';

const WorkOrders: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false); // For "Finish/Details"
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // For "New Ticket"
  const [tickets, setTickets] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [stats, setStats] = useState({ open: 0, progress: 0, waiting: 0, done: 0 });
  const [filter, setFilter] = useState('Todos');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  // New WO Form State
  const [newOrder, setNewOrder] = useState({
    display_id: '',
    ativo_id: '',
    tipo: 'Preventiva',
    descricao: '',
    prioridade: 'Baixa',
    data_limite: ''
  });

  const { userProfile } = usePreferences();
  const isAuthorized = userProfile?.role === 'Administrator' || userProfile?.role === 'Gestor';

  // Filter logic including Search
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      // Status Filter
      if (filter !== 'Todos') {
        if (filter === 'Urgente') {
          if (t.prioridade !== 'Alta') return false;
        } else {
          if (t.tipo !== filter) return false;
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
  }, [tickets, filter, searchQuery]);

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


  useEffect(() => {
    fetchOrders();
    fetchAssetsList();
    autoGenerateId();

    // Check for ?action=new
    if (searchParams.get('action') === 'new') {
      openCreateModal();
    }

    const subscription = supabase.channel('wo-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, fetchOrders)
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

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`*, ativos(nome)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);

      const s = { open: 0, progress: 0, waiting: 0, done: 0 };
      data?.forEach((t: any) => {
        const st = t.status?.toLowerCase() || '';
        if (st.includes('pendente') || st.includes('aberto')) s.open++;
        else if (st.includes('andamento') || st.includes('progresso')) s.progress++;
        else if (st.includes('aguardando')) s.waiting++;
        else if (st.includes('concluído') || st.includes('finalizado')) s.done++;
      });
      setStats(s);
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
      data_limite: ''
    });
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
      data_limite: ticket.data_limite ? new Date(ticket.data_limite).toISOString().split('T')[0] : ''
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newOrder.ativo_id || !newOrder.descricao || !newOrder.data_limite || !newOrder.display_id) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (editingId) {
        // UPDATE MODE
        const { error } = await supabase
          .from('work_orders')
          .update({
            ...newOrder,
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
    const { error } = await supabase.from('work_orders').delete().eq('id', id);
    if (error) alert("Erro ao excluir: " + error.message);
    else fetchOrders();
  };

  return (
    <div className="relative z-10 flex-1 overflow-y-auto p-8 scroll-smooth bg-[var(--bg-color)]">
      {/* ... stats row ... */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <WOCard icon="assignment" title="Abertos" value={stats.open.toString()} trend="--" trendColor="text-emerald-500" valueColor="text-primary" />
        <WOCard icon="engineering" title="Em Andamento" value={stats.progress.toString()} trend="--" trendColor="text-slate-500" valueColor="text-sky-400" />
        <WOCard icon="inventory" title="Aguardando Peça" value={stats.waiting.toString()} trend="--" trendColor="text-red-500" valueColor="text-amber-500" />
        <WOCard icon="check_circle" title="Concluídos" value={stats.done.toString()} trend="--" trendColor="text-emerald-500" valueColor="text-emerald-400" />
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 p-1 bg-[var(--surface-color)] rounded-lg border border-[var(--border-color)] shadow-sm self-start md:self-auto">
          {['Todos', 'Preventiva', 'Corretiva', 'Urgente'].map(f => (
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

          <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-sky-400 text-white shadow-neon text-sm font-bold transition-all whitespace-nowrap">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Novo Chamado
          </button>
        </div>

      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--surface-color)] shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-color)]/50 border-b border-[var(--border-color)]">
              <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">ID Chamado</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Ativo</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Tipo</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-center">Status</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Data</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {filteredTickets.map(ticket => (
              <tr key={ticket.id} className="hover:bg-[var(--bg-color)] transition-colors group">
                <td className="p-4"><span className="font-mono text-[var(--text-main)] font-bold">#{ticket.display_id || ticket.id.slice(0, 6).toUpperCase()}</span></td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-[var(--text-main)] font-medium">{ticket.ativos?.nome || 'Ativo Desconhecido'}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined ${ticket.tipo === 'Corretiva' ? 'text-red-500' : 'text-sky-500'} text-[18px]`}>
                      {ticket.tipo === 'Corretiva' ? 'warning' : 'calendar_month'}
                    </span>
                    <span className="text-slate-300 text-sm">{ticket.tipo}</span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${ticket.status === 'Concluída' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    ticket.status === 'Em Andamento' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="p-4 text-sm font-mono text-[var(--text-secondary)]">{new Date(ticket.created_at).toLocaleDateString()}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    {/* View Details */}
                    <button onClick={() => navigate(`/app/ticket/${ticket.id}`)} className="p-1.5 rounded hover:bg-[var(--bg-color)] text-[var(--text-secondary)] hover:text-primary transition-all" title="Ver Detalhes">
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </button>

                    {/* Edit Button - Added Next to View */}
                    {isAuthorized && ticket.status !== 'Concluída' && (
                      <button onClick={() => openEditModal(ticket)} className="p-1.5 rounded hover:bg-sky-500/10 text-sky-500 hover:text-sky-400 transition-all" title="Editar">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    )}

                    {/* Finish Button */}
                    {isAuthorized && ticket.status !== 'Concluída' && (
                      <button onClick={() => openFinishModal(ticket)} className="p-1.5 rounded hover:bg-emerald-500/10 text-emerald-500 hover:text-emerald-400 transition-all" title="Finalizar">
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      </button>
                    )}

                    {/* Delete Button */}
                    {isAuthorized && (
                      <button onClick={() => handleDeleteTicket(ticket.id)} className="p-1.5 rounded hover:bg-red-500/10 text-red-500/50 hover:text-red-500 transition-all" title="Excluir">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    )}
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Creation/Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">{editingId ? 'edit_note' : 'add_task'}</span>
                  {editingId ? 'Editar Chamado' : 'Abrir Novo Chamado'}
                </h2>
                <p className="text-[var(--text-secondary)] text-sm mt-1">{editingId ? 'Atualize os dados da ordem de serviço abaixo.' : 'Preencha os dados abaixo para registrar uma nova ordem de serviço.'}</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)}><span className="material-symbols-outlined text-[var(--text-secondary)] hover:text-[var(--text-main)]">close</span></button>
            </div>

            <form onSubmit={handleSaveTicket} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">tag</span>
                    ID do Chamado (Editável)
                  </label>
                  <input
                    type="text"
                    value={newOrder.display_id}
                    onChange={(e) => setNewOrder({ ...newOrder, display_id: e.target.value })}
                    placeholder="Ex: 1001"
                    className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg p-3 text-[var(--text-main)] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                    <span className="material-symbols-outlined text-[16px] text-sky-400">build</span>
                    Tipo de Manutenção
                  </label>
                  <select
                    value={newOrder.tipo}
                    onChange={(e) => setNewOrder({ ...newOrder, tipo: e.target.value })}
                    className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg p-3 text-[var(--text-main)] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="Corretiva">Corretiva</option>
                    <option value="Preventiva">Preventiva</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">precision_manufacturing</span>
                  Ativo Relacionado
                </label>
                <select
                  value={newOrder.ativo_id}
                  onChange={(e) => setNewOrder({ ...newOrder, ativo_id: e.target.value })}
                  className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg p-3 text-[var(--text-main)] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  required
                >
                  <option value="">Selecione um ativo...</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>


              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                  <span className="material-symbols-outlined text-[16px] text-violet-400">notes</span>
                  Descrição do Problema
                </label>
                <textarea
                  value={newOrder.descricao}
                  onChange={(e) => setNewOrder({ ...newOrder, descricao: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none h-32"
                  placeholder="Descreva o problema detalhadamente..."
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-3">
                    <span className="material-symbols-outlined text-[16px] text-amber-500">priority_high</span>
                    Prioridade
                  </label>
                  <div className="flex gap-2">
                    {['Alta', 'Média', 'Baixa'].map(prio => (
                      <button
                        key={prio}
                        type="button"
                        onClick={() => setNewOrder({ ...newOrder, prioridade: prio })}
                        className={`flex-1 py-2.5 px-3 rounded-lg border-2 font-bold text-sm transition-all ${newOrder.prioridade === prio
                          ? prio === 'Alta'
                            ? 'bg-red-500/20 border-red-500 text-red-500'
                            : prio === 'Média'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                              : 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                      >
                        {prio === 'Alta' && <span className="mr-1">🔴</span>}
                        {prio === 'Média' && <span className="mr-1">🟡</span>}
                        {prio === 'Baixa' && <span className="mr-1">🟢</span>}
                        {prio}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-3">
                    <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
                    Prazo Solicitado
                  </label>
                  <input
                    type="date"
                    value={newOrder.data_limite}
                    onChange={(e) => setNewOrder({ ...newOrder, data_limite: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] font-medium">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all">
                  <span className="material-symbols-outlined">{editingId ? 'save' : 'send'}</span>
                  {editingId ? 'Salvar Alterações' : 'Criar Chamado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal (Finish Ticket) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg transform overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] p-6 text-left align-middle shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold leading-6 text-[var(--text-main)] flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-500">task_alt</span>
                Finalizar Manutenção
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Ticket Summary */}
            <div className="mb-6 p-4 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] flex justify-between items-center">
              <div>
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Chamado</p>
                <p className="text-[var(--text-main)] font-mono font-medium">#{closingTicket?.display_id || '---'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-1">Ativo</p>
                <p className="text-[var(--text-main)] font-medium">{closingTicket?.ativos?.nome || '---'}</p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleFinishTicket(); }}>
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">Data de Execução</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--text-secondary)]"><span className="material-symbols-outlined text-[20px]">calendar_today</span></span>
                  <input
                    className="block w-full rounded-lg border-[var(--border-color)] bg-[var(--bg-color)] py-2.5 pl-10 pr-4 text-[var(--text-main)] focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm outline-none"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">Custo Total (Material + Mão de Obra)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--text-secondary)]">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    className="block w-full rounded-lg border-[var(--border-color)] bg-[var(--bg-color)] py-2.5 pl-10 pr-4 text-[var(--text-main)] focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm outline-none font-bold"
                    placeholder="0.00"
                    value={closingCost}
                    onChange={e => setClosingCost(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">Observações Técnicas</label>
                <textarea className="block w-full rounded-lg border-[var(--border-color)] bg-[var(--bg-color)] py-2 px-3 text-[var(--text-main)] placeholder-[var(--text-secondary)] focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm outline-none" placeholder="Descreva as atividades realizadas..." rows={3}></textarea>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-color)] transition-colors" type="button">Cancelar</button>
                <button type="submit" className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold text-white bg-sky-500 hover:bg-sky-400 shadow-neon transition-all hover:scale-105 active:scale-95 w-full sm:w-auto">
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