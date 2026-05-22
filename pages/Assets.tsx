import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

const Assets: React.FC = () => {
  const { t } = usePreferences();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [displayedAssets, setDisplayedAssets] = useState<any[]>([]);

  // Sectors State
  const [sectors, setSectors] = useState<string[]>([]);
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('Todos');
  const [filterCriticality, setFilterCriticality] = useState('Todas');

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
    saude: 100
  });

  const { userProfile } = usePreferences();
  const isAuthorized = userProfile?.role === 'Administrator' || userProfile?.role === 'Gestor' || userProfile?.role === 'Técnico';

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
      .order('created_at', { ascending: false });

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
        saude: asset.saude || 100
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
        saude: 100
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

    setDisplayedAssets(filtered);
  }, [searchTerm, filterSector, filterCriticality, filterStatus, filterModel, filterDate, allAssets]);

  const totalAssets = allAssets.length;
  const operational = allAssets.filter(a => a.status && a.status.toLowerCase() === 'operacional').length;
  const inAlert = allAssets.filter(a => a.status && (a.status.toLowerCase() === 'em alerta' || a.status.toLowerCase() === 'alerta')).length;
  const critical = allAssets.filter(a => a.criticidade && a.criticidade.toLowerCase().includes('alta')).length;

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative bg-transparent">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none z-0"></div>
      <div className="mx-auto max-w-7xl relative z-10 flex flex-col gap-8 h-full">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
            <button onClick={() => handleOpenModal()} className="group flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all hover:bg-primary-hover hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] hover:translate-y-[-1px]">
              <span className="material-symbols-outlined">add_circle</span>
              Novo Ativo
            </button>
          )}
        </div>


        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon="check_circle" label="Operacionais" value={operational.toString()} color="text-emerald-400" bg="bg-emerald-500/10" />
          <StatCard icon="warning" label="Em Alerta" value={inAlert.toString()} color="text-amber-400" bg="bg-amber-500/10" />
          <StatCard icon="error" label="Críticos (A)" value={critical.toString()} color="text-red-400" bg="bg-red-500/10" />
          <StatCard icon="inventory_2" label="Total Ativos" value={totalAssets.toString()} color="text-primary" bg="bg-primary/10" />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4">
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
        <div className="flex-1 overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)]/60 shadow-xl backdrop-blur-sm flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-color)] text-xs uppercase font-semibold text-[var(--text-secondary)]">
                <tr>
                  <th className="px-6 py-4 tracking-wider">Tag ID</th>
                  <th className="px-6 py-4 tracking-wider">Nome do Ativo</th>
                  <th className="px-6 py-4 tracking-wider">Setor</th>
                  <th className="px-6 py-4 tracking-wider">Modelo / Fab.</th>
                  <th className="px-6 py-4 tracking-wider text-center">Criticidade</th>
                  <th className="px-6 py-4 tracking-wider">Status</th>
                  <th className="px-6 py-4 tracking-wider text-right">Ações</th>
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
                      tag={asset.tag_id || 'N/A'}
                      name={asset.nome}
                      icon="settings_power"
                      sector={asset.setor || 'Geral'}
                      model={asset.modelo || '-'}
                      criticality={asset.criticidade || 'Baixa'}
                      status={asset.status || 'Parado'}
                      statusColor={asset.status === 'Operacional' ? 'text-emerald-500' : asset.status === 'Em Alerta' ? 'text-amber-500' : 'text-[var(--text-secondary)]'}
                      onEdit={() => handleOpenModal(asset)}
                      onDelete={() => handleDeleteAsset(asset.id)}
                      isAuthorized={isAuthorized}
                    />
                  ))
                )}

              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] shadow-2xl transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4">
              <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                Cadastro de Ativo
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-color)] hover:text-[var(--text-main)] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-6 py-6">
              <form id="asset-form" onSubmit={handleSaveAsset} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <InputGroup
                    label="Patrimônio / Tag"
                    placeholder="TAG-000"
                    icon="qr_code_2"
                    value={formData.tag_id}
                    onChange={(v) => setFormData({ ...formData, tag_id: v })}
                  />
                  <SelectGroup
                    label="Status Inicial"
                    icon="toggle_on"
                    options={['Operacional', 'Parado', 'Em Manutenção', 'Em Alerta']}
                    value={formData.status}
                    onChange={(v) => setFormData({ ...formData, status: v })}
                  />
                </div>
                <InputGroup
                  label="Nome do Ativo"
                  placeholder="Ex: Motor Elétrico Trifásico"
                  icon="precision_manufacturing"
                  value={formData.nome}
                  onChange={(v) => setFormData({ ...formData, nome: v })}
                />
                <InputGroup
                  label="Modelo / Fabricante"
                  placeholder="Ex: WEG W22 Premium"
                  icon="extension"
                  value={formData.modelo}
                  onChange={(v) => setFormData({ ...formData, modelo: v })}
                  required={false}
                />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <SelectGroup
                    label="Setor"
                    icon="factory"
                    options={sectors}
                    value={formData.setor}
                    onChange={(v) => setFormData({ ...formData, setor: v })}
                    onAction={isAuthorized ? () => setIsSectorModalOpen(true) : undefined}
                  />
                  <SelectGroup
                    label="Criticidade"
                    icon="priority_high"
                    options={['Alta', 'Média', 'Baixa']}
                    value={formData.criticidade}
                    onChange={(v) => setFormData({ ...formData, criticidade: v })}
                  />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <InputGroup
                    label="Custo de Aquisição (R$)"
                    placeholder="0.00"
                    icon="payments"
                    value={formData.custo_aquisicao.toString()}
                    onChange={(v) => setFormData({ ...formData, custo_aquisicao: parseFloat(v) || 0 })}
                  />
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">health_and_safety</span>
                      Saúde do Ativo (%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.saude}
                      onChange={(e) => setFormData({ ...formData, saude: parseInt(e.target.value) })}
                      className="mt-2 w-full h-1.5 bg-[var(--border-color)] rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs mt-1 font-bold text-primary">
                      <span>{formData.saude}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                    Data de Aquisição
                  </label>
                  <input
                    type="date"
                    value={formData.data_aquisicao}
                    onChange={(e) => setFormData({ ...formData, data_aquisicao: e.target.value })}
                    className="mt-1.5 block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] py-2.5 px-3 text-sm text-[var(--text-main)] focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none [color-scheme:dark]"
                  />
                </div>
              </form>

            </div>


            <div className="flex items-center justify-end gap-3 border-t border-[var(--border-color)] bg-[var(--surface-color)]/50 px-6 py-4 backdrop-blur-sm">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-color)] hover:text-[var(--text-main)] transition-all">Cancelar</button>
              <button form="asset-form" type="submit" className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white shadow-neon hover:bg-primary-hover transition-all transform hover:scale-[1.02]">
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
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xs font-semibold uppercase">{label}:</div>
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)]/50 py-2.5 pl-14 to-pl-4 pr-10 text-sm font-medium text-[var(--text-main)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary hover:bg-[var(--surface-color)] transition-colors cursor-pointer w-full min-w-[140px]"
    >
      {options.map(opt => <option key={opt}>{opt}</option>)}
    </select>
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
      <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
    </span>
  </div>
);

const TableRow: React.FC<{ tag: string, name: string, icon: string, sector: string, model: string, criticality: string, status: string, statusColor: string, onEdit: () => void, onDelete: () => void, isAuthorized: boolean }> = ({ tag, name, icon, sector, model, criticality, status, statusColor, onEdit, onDelete, isAuthorized }) => (
  <tr className="group hover:bg-[var(--bg-color)]/40 transition-colors">
    <td className="whitespace-nowrap px-6 py-4 font-mono text-[var(--text-secondary)] group-hover:text-[var(--text-main)]">{tag}</td>
    <td className="whitespace-nowrap px-6 py-4 font-medium text-[var(--text-main)]">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded bg-[var(--bg-color)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)]">
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        {name}
      </div>
    </td>
    <td className="whitespace-nowrap px-6 py-4 text-[var(--text-secondary)] group-hover:text-[var(--text-main)]">{sector}</td>
    <td className="whitespace-nowrap px-6 py-4 text-[var(--text-secondary)] group-hover:text-[var(--text-main)]">{model}</td>
    <td className="whitespace-nowrap px-6 py-4 text-center">
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset ${criticality.includes('Alta') ? 'bg-red-500/10 text-red-500 ring-red-500/20' : criticality.includes('Média') ? 'bg-amber-500/10 text-amber-500 ring-amber-500/20' : 'bg-primary/10 text-primary ring-primary/30'}`}>
        {criticality}
      </span>
    </td>
    <td className="whitespace-nowrap px-6 py-4">
      <div className="flex items-center gap-2">
        <span className={`relative flex h-2.5 w-2.5 ${status === 'Operacional' ? '' : 'rounded-full'} ${status === 'Parado' ? 'bg-slate-500' : ''} ${status === 'Em Alerta' ? 'bg-amber-500' : ''}`}>
          {status === 'Operacional' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
          {status === 'Operacional' && <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>}
        </span>
        <span className={statusColor}>{status}</span>
      </div>
    </td>
    <td className="whitespace-nowrap px-6 py-4 text-right">
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


const InputGroup: React.FC<{ label: string, placeholder?: string, icon?: string, value: string, onChange: (v: string) => void, required?: boolean }> = ({ label, placeholder, icon, value, onChange, required = true }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative group">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-primary transition-colors">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
      )}
      <input
        className={`block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] py-2.5 ${icon ? 'pl-10' : 'px-3'} pr-3 text-sm text-[var(--text-main)] placeholder-[var(--text-secondary)] focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none`}
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  </div>
);

const SelectGroup: React.FC<{ label: string, options: string[], value: string, onChange: (v: string) => void, icon?: string, onAction?: () => void }> = ({ label, options, value, onChange, icon, onAction }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] flex items-center gap-2">
        {icon && <span className="material-symbols-outlined text-[16px]">{icon}</span>}
        {label} <span className="text-red-500">*</span>
      </label>
      {onAction && (
        <button type="button" onClick={onAction} className="text-primary hover:text-primary-hover p-0.5 rounded transition-colors" title="Gerenciar Setores">
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </button>
      )}
    </div>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full appearance-none rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] py-2.5 pl-3 pr-10 text-sm text-[var(--text-main)] focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer outline-none"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
        <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
      </span>
    </div>
  </div>
);

// Sector Manager Modal Component
const SectorManagerModal: React.FC<{ isOpen: boolean; initialSectors: string[]; onClose: () => void }> = ({ isOpen, initialSectors, onClose }) => {
  const [sectorName, setSectorName] = useState('');
  const [sectors, setSectors] = useState(initialSectors);

  useEffect(() => {
    // Refresh list locally when opening (though parent manages it, we want instant feedback here)
    const fetch = async () => {
      const { data } = await supabase.from('sectors').select('name, id').order('name');
      if (data) setSectors(data.map(d => d.name));
    };
    fetch();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectorName.trim()) return;

    // Optimistic
    setSectors([...sectors, sectorName]);

    const { error } = await supabase.from('sectors').insert([{ name: sectorName }]);
    if (error) {
      alert('Erro ao salvar setor: ' + error.message);
    } else {
      setSectorName('');
      // Fetch again to ensure sync
      const { data } = await supabase.from('sectors').select('name').order('name');
      if (data) setSectors(data.map(d => d.name));
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Excluir o setor "${name}"?`)) return;

    // Get ID first? Or delete by name (unique)
    const { error } = await supabase.from('sectors').delete().eq('name', name);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      setSectors(sectors.filter(s => s !== name));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[var(--text-main)]">Gerenciar Setores</h3>
          <button onClick={onClose}><span className="material-symbols-outlined text-[var(--text-secondary)]">close</span></button>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input
            className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] px-3 py-2 text-sm text-[var(--text-main)] outline-none focus:border-primary"
            placeholder="Novo Setor..."
            value={sectorName}
            onChange={e => setSectorName(e.target.value)}
          />
          <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 font-bold text-sm shadow-neon hover:bg-primary-hover">
            <span className="material-symbols-outlined">add</span>
          </button>
        </form>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {sectors.length === 0 && <p className="text-sm text-[var(--text-secondary)] text-center italic">Nenhum setor cadastrado.</p>}
          {sectors.map(s => (
            <div key={s} className="flex justify-between items-center p-2 rounded bg-[var(--bg-color)] border border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-main)]">{s}</span>
              <button onClick={() => handleDelete(s)} className="text-red-500 hover:text-red-400 p-1">
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Assets;