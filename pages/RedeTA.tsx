import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../services/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

interface IPAddress {
  id: string;
  ip_address: string;
  subnet: string;
  status: string;
  nome_equipamento: string;
  tipo_equipamento: string;
  descricao: string;
  ativo_id: string | null;
  ping_status?: 'online' | 'offline' | 'testing' | 'idle';
}

interface CADNode {
  id: string;
  label: string;
  type: string; // 'CPD', 'Rack', 'PLC', 'IHM', 'Multimedidor', 'Gateway', 'PC Station', 'Ponto'
  ip_id: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  map_x: number | null;
  map_y: number | null;
  rede_ips?: IPAddress;
}

interface CADLink {
  id: string;
  source_id: string;
  target_id: string;
  type: string; // 'Cabo de Rede', 'Fibra'
}

const subnetRanges = [
  { key: 'Principal', label: 'Faixa Principal (192.168.100.x)', prefix: '192.168.100.' },
  { key: 'VPI', label: 'Faixa VPI (192.168.144.x)', prefix: '192.168.144.' },
  { key: 'VPD', label: 'Faixa VPD (192.168.14.x)', prefix: '192.168.14.' }
];

const nodeTypes = [
  { key: 'CPD', label: 'CPD (Mezanino/Sala)', color: 'bg-sky-500/20 text-sky-400 border-sky-500/50', strokeColor: '#0ea5e9' },
  { key: 'Rack', label: 'Rack de Distribuição', color: 'bg-rose-500/20 text-rose-400 border-rose-500/50', strokeColor: '#f43f5e' },
  { key: 'PLC', label: 'Controlador (CLP)', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50', strokeColor: '#10b981' },
  { key: 'IHM', label: 'Interface IHM', color: 'bg-amber-500/20 text-amber-400 border-amber-500/50', strokeColor: '#f59e0b' },
  { key: 'Multimedidor', label: 'Multimedidor Elétrico', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50', strokeColor: '#f97316' },
  { key: 'Gateway', label: 'Gateway / Modbus', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50', strokeColor: '#06b6d4' },
  { key: 'PC Station', label: 'Computador / Supervisório', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50', strokeColor: '#6366f1' },
  { key: 'Ponto', label: 'Ponto de Rede / Tomada', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', strokeColor: '#eab308' }
];

const RedeTA: React.FC = () => {
  const { userProfile } = usePreferences();
  const isAuthorized = userProfile?.role === 'Administrator' || userProfile?.role === 'Gestor' || userProfile?.role === 'Supervisor';

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'diagram' | 'map' | 'ips'>('diagram');

  // DB States
  const [ips, setIps] = useState<IPAddress[]>([]);
  const [nodes, setNodes] = useState<CADNode[]>([]);
  const [links, setLinks] = useState<CADLink[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Tab 3 IP States
  const [selectedSubnet, setSelectedSubnet] = useState<'Principal' | 'VPI' | 'VPD'>('Principal');
  const [ipSearch, setIpSearch] = useState('');
  const [editingIp, setEditingIp] = useState<IPAddress | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterLinked, setFilterLinked] = useState<string>('All');
  const [sortOrderIp, setSortOrderIp] = useState<'asc' | 'desc'>('asc');

  // Tab 1 CAD States
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [linkCreator, setLinkCreator] = useState<{ source_id: string; target_id: string; type: string } | null>(null);
  
  // Tab 2 Map States
  const [draggedMapNodeId, setDraggedMapNodeId] = useState<string | null>(null);

  const canvasRef = useRef<SVGSVGElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const [cadTheme, setCadTheme] = useState<'light' | 'dark'>('dark');

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const centerFlowchart = (currentNodes: CADNode[] = nodes) => {
    if (!currentNodes || currentNodes.length === 0) return;
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    currentNodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.x + n.width > maxX) maxX = n.x + n.width;
      if (n.y < minY) minY = n.y;
      if (n.y + n.height > maxY) maxY = n.y + n.height;
    });
    
    const padding = 120;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    
    const canvasWidth = canvasRef.current?.clientWidth || 1100;
    const canvasHeight = canvasRef.current?.clientHeight || 650;
    
    const zoomX = canvasWidth / width;
    const zoomY = canvasHeight / height;
    
    // Zoom always slightly reduced to fit comfortably
    const newZoom = Math.max(0.35, Math.min(0.85, Math.min(zoomX, zoomY) * 0.95)); 
    
    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;
    
    setZoom(newZoom);
    setPan({
      x: canvasWidth / 2 - centerX * newZoom,
      y: canvasHeight / 2 - centerY * newZoom
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch IPs
      const { data: ipData, error: ipErr } = await supabase
        .from('rede_ips')
        .select('*')
        .order('ip_address');
      if (ipErr) throw ipErr;
      setIps(ipData || []);

      // Fetch Nodes
      const { data: nodeData, error: nodeErr } = await supabase
        .from('rede_cad_nodes')
        .select('*, rede_ips:ip_id(*)');
      if (nodeErr) throw nodeErr;
      
      const nodesList = nodeData || [];
      setNodes(nodesList);

      // Fetch Links
      const { data: linkData, error: linkErr } = await supabase
        .from('rede_cad_links')
        .select('*');
      if (linkErr) throw linkErr;
      setLinks(linkData || []);

      // Fetch Assets
      const { data: assetData } = await supabase
        .from('ativos')
        .select('id, nome, tag_id')
        .order('nome');
      setAssets(assetData || []);

      // Auto-center after a slight delay for DOM measurement
      setTimeout(() => centerFlowchart(nodesList), 100);
    } catch (err: any) {
      console.error('Erro ao buscar dados da rede:', err);
    }
    setLoading(false);
  };

  // Helper: Snap to Grid (20px)
  const snapToGrid = (val: number) => Math.round(val / 20) * 20;

  // Helper: split text into lines
  const wrapText = (text: string, maxChars: number = 18): string[] => {
    if (!text) return [];
    if (text.length <= maxChars) return [text];

    // Try splitting on " - " first as it separates prefix and name
    if (text.includes(' - ')) {
      const parts = text.split(' - ');
      const first = parts[0];
      const second = parts.slice(1).join(' - ');
      if (first.length <= maxChars && second.length <= maxChars) {
        return [first, second];
      }
    }

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxChars) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Browser-side IP Communication Test (Intranet Fetch/Ping trick)
  const testIP = async (ip: string) => {
    setIps(prev => prev.map(item => item.ip_address === ip ? { ...item, ping_status: 'testing' } : item));
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 1200);

    try {
      // Fetch common HTTP port. Response/CORS issue means host is alive!
      await fetch(`http://${ip}`, { mode: 'no-cors', signal: controller.signal });
      clearTimeout(id);
      setIps(prev => prev.map(item => item.ip_address === ip ? { ...item, ping_status: 'online' } : item));
    } catch (err: any) {
      clearTimeout(id);
      if (err.name === 'AbortError') {
        setIps(prev => prev.map(item => item.ip_address === ip ? { ...item, ping_status: 'offline' } : item));
      } else {
        // Any connection response (even CORS or Connection Refused) means host is alive on network
        setIps(prev => prev.map(item => item.ip_address === ip ? { ...item, ping_status: 'online' } : item));
      }
    }
  };

  const testAllIps = async () => {
    const occupiedIps = ips.filter(item => item.subnet === selectedSubnet && (item.status === 'Ocupado' || item.status === 'Reservado'));
    for (const item of occupiedIps) {
      testIP(item.ip_address);
      await new Promise(r => setTimeout(r, 100)); // stagger tests
    }
  };

  // Tab 3: IP CRUD & Updates
  const handleSaveIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIp) return;

    try {
      const { error } = await supabase
        .from('rede_ips')
        .update({
          status: editingIp.status,
          nome_equipamento: editingIp.nome_equipamento,
          tipo_equipamento: editingIp.tipo_equipamento,
          descricao: editingIp.descricao,
          ativo_id: editingIp.ativo_id
        })
        .eq('id', editingIp.id);

      if (error) throw error;
      setEditingIp(null);
      fetchData();
    } catch (err: any) {
      alert('Erro ao salvar IP: ' + err.message);
    }
  };

  // Tab 1: Node Drag & Drop Logic
  const handleNodeMouseDown = (e: React.MouseEvent, node: CADNode) => {
    if (!isAuthorized) return;
    e.stopPropagation();
    setSelectedNodeId(node.id);

    // Calculate mouse position relative to node top-left
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const clientX = (e.clientX - rect.left - pan.x) / zoom;
      const clientY = (e.clientY - rect.top - pan.y) / zoom;
      setDragOffset({
        x: clientX - node.x,
        y: clientY - node.y
      });
      setDraggedNodeId(node.id);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId && isAuthorized) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const clientX = (e.clientX - rect.left - pan.x) / zoom;
        const clientY = (e.clientY - rect.top - pan.y) / zoom;
        const newX = snapToGrid(clientX - dragOffset.x);
        const newY = snapToGrid(clientY - dragOffset.y);

        setNodes(prev => prev.map(n => n.id === draggedNodeId ? { ...n, x: Math.max(0, newX), y: Math.max(0, newY) } : n));
      }
    }
  };

  const handleCanvasMouseUp = async () => {
    if (draggedNodeId && isAuthorized) {
      const node = nodes.find(n => n.id === draggedNodeId);
      if (node) {
        await supabase
          .from('rede_cad_nodes')
          .update({ x: node.x, y: node.y })
          .eq('id', node.id);
      }
      setDraggedNodeId(null);
    }
  };

  // Tab 1: Node/Link Database Mutations
  const handleAddNode = async () => {
    if (!isAuthorized) return;
    try {
      const { data, error } = await supabase
        .from('rede_cad_nodes')
        .insert({
          label: 'Novo Bloco',
          type: 'Ponto',
          x: 100 + snapToGrid(Math.random() * 200),
          y: 100 + snapToGrid(Math.random() * 200),
          width: 120,
          height: 60
        })
        .select();

      if (error) throw error;
      if (data && data[0]) {
        fetchData();
        setSelectedNodeId(data[0].id);
      }
    } catch (err: any) {
      alert('Erro ao criar bloco: ' + err.message);
    }
  };

  const handleUpdateNode = async (field: keyof CADNode, val: any) => {
    if (!selectedNodeId || !isAuthorized) return;

    setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, [field]: val } : n));

    await supabase
      .from('rede_cad_nodes')
      .update({ [field]: val })
      .eq('id', selectedNodeId);

    if (field === 'ip_id') {
      fetchData(); // refresh relation
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNodeId || !isAuthorized) return;
    if (!window.confirm('Deseja realmente excluir este bloco do diagrama?')) return;

    try {
      const { error } = await supabase
        .from('rede_cad_nodes')
        .delete()
        .eq('id', selectedNodeId);

      if (error) throw error;
      setSelectedNodeId(null);
      fetchData();
    } catch (err: any) {
      alert('Erro ao deletar bloco: ' + err.message);
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCreator || !isAuthorized) return;

    try {
      const { error } = await supabase
        .from('rede_cad_links')
        .insert({
          source_id: linkCreator.source_id,
          target_id: linkCreator.target_id,
          type: linkCreator.type
        });

      if (error) throw error;
      setLinkCreator(null);
      fetchData();
    } catch (err: any) {
      alert('Erro ao ligar blocos: ' + err.message);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!isAuthorized) return;
    if (!window.confirm('Excluir esta conexão?')) return;

    try {
      const { error } = await supabase
        .from('rede_cad_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Erro ao remover conexão: ' + err.message);
    }
  };

  // Tab 2: Map marker drag
  const handleMapMarkerMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (!isAuthorized) return;
    e.stopPropagation();
    setDraggedMapNodeId(nodeId);
  };

  const handleMapMouseMove = (e: React.MouseEvent, mapContainer: HTMLDivElement | null) => {
    if (draggedMapNodeId && mapContainer && isAuthorized) {
      const rect = mapContainer.getBoundingClientRect();
      // Calculate percentage coordinates
      const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));

      setNodes(prev => prev.map(n => n.id === draggedMapNodeId ? { ...n, map_x: Math.round(x), map_y: Math.round(y) } : n));
    }
  };

  const handleMapMouseUp = async () => {
    if (draggedMapNodeId && isAuthorized) {
      const node = nodes.find(n => n.id === draggedMapNodeId);
      if (node && node.map_x !== null && node.map_y !== null) {
        await supabase
          .from('rede_cad_nodes')
          .update({ map_x: node.map_x, map_y: node.map_y })
          .eq('id', node.id);
      }
      setDraggedMapNodeId(null);
    }
  };

  // Unplaced nodes list for Map
  const unplacedMapNodes = useMemo(() => {
    return nodes.filter(n => n.map_x === null || n.map_y === null);
  }, [nodes]);

  // CAD Nodes Map helpers
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Subnet lists filtering
  const filteredIps = useMemo(() => {
    let list = ips.filter(item => item.subnet === selectedSubnet);
    
    if (ipSearch) {
      const search = ipSearch.toLowerCase();
      list = list.filter(item => 
        item.ip_address.includes(search) || 
        item.nome_equipamento.toLowerCase().includes(search) || 
        item.descricao.toLowerCase().includes(search)
      );
    }

    if (filterStatus !== 'All') {
      list = list.filter(item => item.status === filterStatus);
    }

    if (filterType !== 'All') {
      list = list.filter(item => item.tipo_equipamento === filterType);
    }

    if (filterLinked === 'Linked') {
      list = list.filter(item => item.ativo_id !== null);
    } else if (filterLinked === 'Unlinked') {
      list = list.filter(item => item.ativo_id === null);
    }

    list.sort((a, b) => {
      const octetA = parseInt(a.ip_address.split('.').pop() || '0', 10);
      const octetB = parseInt(b.ip_address.split('.').pop() || '0', 10);
      return sortOrderIp === 'asc' ? octetA - octetB : octetB - octetA;
    });

    return list;
  }, [ips, selectedSubnet, ipSearch, filterStatus, filterType, filterLinked, sortOrderIp]);

  const isLight = cadTheme === 'light';
  const nodeBoxFill = isLight ? '#ffffff' : '#0f172a';
  const nodeTextFill = isLight ? '#0f172a' : '#f8fafc';

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0f1d] overflow-hidden text-slate-100 relative">
      
      {/* Header Panel */}
      <div className="p-4 bg-[#111827] border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md shadow-cyan-500/25">
            <span className="material-symbols-outlined text-white text-[22px]">lan</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">Rede T.A. (Automação Industrial)</h1>
            <p className="text-[10px] text-slate-400">Diagramação AutoCAD 2D, traçado de fibra e gestão de IPs</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1.5 p-1 bg-slate-900/60 rounded-lg border border-slate-800/80">
          <button 
            onClick={() => setActiveTab('diagram')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'diagram' 
                ? 'bg-cyan-500/25 text-cyan-400 border border-cyan-500/30' 
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">draw</span>
            Diagrama CAD 2D
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'map' 
                ? 'bg-cyan-500/25 text-cyan-400 border border-cyan-500/30' 
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">polyline</span>
            Mapa de Traçado (Planta)
          </button>
          <button 
            onClick={() => setActiveTab('ips')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ips' 
                ? 'bg-cyan-500/25 text-cyan-400 border border-cyan-500/30' 
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">dns</span>
            Lista de IPs
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        
        {/* Tab 1: Diagrama CAD 2D */}
        {activeTab === 'diagram' && (
          <div className="h-full w-full flex overflow-hidden">
            {/* Left Tools Palette */}
            <div className="w-56 bg-[#111827] border-r border-slate-800 p-3 flex flex-col gap-4 overflow-y-auto select-none">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Paleta CAD</h2>
              
              {isAuthorized && (
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={handleAddNode}
                    className="w-full py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white text-xs font-bold rounded shadow flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_box</span>
                    Novo Bloco
                  </button>
                  <button 
                    onClick={() => setLinkCreator({ source_id: '', target_id: '', type: 'Cabo de Rede' })}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded border border-slate-700 flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">link</span>
                    Criar Conexão
                  </button>
                  <button 
                    onClick={() => centerFlowchart()}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded border border-slate-700 flex items-center justify-center gap-1 transition cursor-pointer"
                    title="Centralizar fluxograma"
                  >
                    <span className="material-symbols-outlined text-[16px]">center_focus_strong</span>
                    Centralizar CAD
                  </button>
                  <button 
                    onClick={() => setCadTheme(t => t === 'light' ? 'dark' : 'light')}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded border border-slate-700 flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {cadTheme === 'light' ? 'dark_mode' : 'light_mode'}
                    </span>
                    {cadTheme === 'light' ? 'Tema Escuro' : 'Tema Claro (AutoCAD)'}
                  </button>
                </div>
              )}

              {/* Legend panel */}
              <div className="flex flex-col gap-2.5 mt-2 border-t border-slate-800 pt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nodos</span>
                {nodeTypes.map(t => (
                  <div key={t.key} className="flex items-center gap-2 text-xs">
                    <span className="h-3 w-5 rounded border border-slate-600/50" style={{ backgroundColor: t.strokeColor + '30', borderColor: t.strokeColor }} />
                    <span className="text-slate-300">{t.label}</span>
                  </div>
                ))}
              </div>

              {/* Connections legend */}
              <div className="flex flex-col gap-2.5 mt-2 border-t border-slate-800 pt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cablagem</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-1.5 w-6 bg-cyan-400 rounded" />
                  <span className="text-slate-300">Cabo de Rede (Ciano)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-1.5 w-6 bg-pink-500 rounded" />
                  <span className="text-slate-300">Fibra Óptica (Rosa)</span>
                </div>
              </div>

              {/* Canvas Navigation Panel */}
              <div className="mt-auto border-t border-slate-800 pt-4 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navegação</span>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Zoom: {Math.round(zoom * 100)}%</span>
                  <div className="flex gap-1">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="size-6 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center cursor-pointer">-</button>
                    <button onClick={() => setZoom(z => Math.min(2.0, z + 0.1))} className="size-6 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center cursor-pointer">+</button>
                    <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="size-6 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center cursor-pointer" title="Reset">R</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas Area */}
            <div className={`flex-1 relative overflow-hidden h-full transition-colors duration-300 ${cadTheme === 'light' ? 'bg-white' : 'bg-[#070b15]'}`}>
              
              {/* AutoCAD Grid Background */}
              <svg 
                ref={canvasRef}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseDown={(e) => {
                  // Pan logic on canvas background click OR middle-click (button === 1)
                  if (e.target === canvasRef.current || e.button === 1) {
                    e.preventDefault();
                    const startX = e.clientX - pan.x;
                    const startY = e.clientY - pan.y;
                    const onPanMove = (moveEv: MouseEvent) => {
                      setPan({
                        x: moveEv.clientX - startX,
                        y: moveEv.clientY - startY
                      });
                    };
                    const onPanUp = () => {
                      window.removeEventListener('mousemove', onPanMove);
                      window.removeEventListener('mouseup', onPanUp);
                    };
                    window.addEventListener('mousemove', onPanMove);
                    window.addEventListener('mouseup', onPanUp);
                  }
                }}
                onWheel={(e) => {
                  e.preventDefault();
                  const zoomFactor = 1.15;
                  const rect = canvasRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const mouseX = e.clientX - rect.left;
                  const mouseY = e.clientY - rect.top;
                  
                  // Position of mouse cursor in diagram coordinates before zoom
                  const beforeZoomX = (mouseX - pan.x) / zoom;
                  const beforeZoomY = (mouseY - pan.y) / zoom;
                  
                  // Calculate next zoom
                  const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
                  const clampedZoom = Math.max(0.15, Math.min(3.0, nextZoom));
                  
                  setZoom(clampedZoom);
                  setPan({
                    x: mouseX - beforeZoomX * clampedZoom,
                    y: mouseY - beforeZoomY * clampedZoom
                  });
                }}
              >
                {/* SVG Definitions */}
                <defs>
                  {/* AutoCAD Grid pattern with minor and major lines */}
                  <pattern id="cadGrid" width="100" height="100" patternUnits="userSpaceOnUse">
                    {/* Minor grid lines (every 20px) */}
                    <path 
                      d="M 20 0 L 20 100 M 40 0 L 40 100 M 60 0 L 60 100 M 80 0 L 80 100 M 0 20 L 100 20 M 0 40 L 100 40 M 0 60 L 100 60 M 0 80 L 100 80" 
                      fill="none" 
                      stroke={cadTheme === 'light' ? '#f1f5f9' : '#162235'} 
                      strokeWidth="0.5" 
                    />
                    {/* Major grid lines (every 100px) */}
                    <path 
                      d="M 100 0 L 0 0 0 100" 
                      fill="none" 
                      stroke={cadTheme === 'light' ? '#cbd5e1' : '#2e3e56'} 
                      strokeWidth="1.0" 
                    />
                  </pattern>

                  {/* Glow filter for connections in dark mode */}
                  <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Grid */}
                <rect width="100%" height="100%" fill="url(#cadGrid)" />

                {/* Diagram viewport group (applying pan and zoom) */}
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  
                  {/* 1. Connection Lines */}
                  {links.map(l => {
                    const s = nodes.find(n => n.id === l.source_id);
                    const t = nodes.find(n => n.id === l.target_id);
                    if (!s || !t) return null;

                    // Support dynamic node size adjusting inside lines rendering
                    const sLines = wrapText(s.label, 18);
                    const tLines = wrapText(t.label, 18);
                    const sWidth = s.label.length > 20 ? Math.max(s.width, 160) : s.width;
                    const sHeight = sLines.length > 1 ? Math.max(s.height, 65) : s.height;
                    const tWidth = t.label.length > 20 ? Math.max(t.width, 160) : t.width;
                    const tHeight = tLines.length > 1 ? Math.max(t.height, 65) : t.height;

                    // Calculate center points
                    const sx = s.x + sWidth / 2;
                    const sy = s.y + sHeight / 2;
                    const tx = t.x + tWidth / 2;
                    const ty = t.y + tHeight / 2;

                    const lineColor = l.type === 'Fibra' 
                      ? (isLight ? '#c026d3' : '#ec4899') 
                      : (isLight ? '#0284c7' : '#00d2ff');
                    const linkLabel = l.type === 'Fibra' ? 'FIBRA' : 'REDE';
                    const lineFilter = isLight ? undefined : 'url(#lineGlow)';

                    return (
                      <g key={l.id} className="group">
                        <line 
                          x1={sx} 
                          y1={sy} 
                          x2={tx} 
                          y2={ty} 
                          stroke={lineColor} 
                          strokeWidth={l.type === 'Fibra' ? 3.5 : 2.5} 
                          filter={lineFilter}
                          className="transition-all duration-200"
                        />
                        {/* Hover helper wide line */}
                        <line 
                          x1={sx} 
                          y1={sy} 
                          x2={tx} 
                          y2={ty} 
                          stroke="transparent" 
                          strokeWidth={15} 
                          className="cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); handleDeleteLink(l.id); }}
                          title="Clique para excluir linha de conexão"
                        />
                        {/* Tag */}
                        <rect x={(sx+tx)/2 - 18} y={(sy+ty)/2 - 6} width="36" height="12" rx="3" fill={nodeBoxFill} stroke={lineColor} strokeWidth="1" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        <text x={(sx+tx)/2} y={(sy+ty)/2 + 3} fill={lineColor} fontSize="7" fontWeight="bold" textAnchor="middle" className="select-none opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{linkLabel}</text>
                      </g>
                    );
                  })}

                  {/* 2. Drag-and-drop Nodes */}
                  {nodes.map(n => {
                    const typeConfig = nodeTypes.find(t => t.key === n.type) || nodeTypes[nodeTypes.length - 1];
                    const isSelected = selectedNodeId === n.id;
                    const ipLabel = n.rede_ips?.ip_address || 'Sem IP';

                    // Dynamic text wrapping and sizing
                    const labelLines = wrapText(n.label, 18);
                    const nodeWidth = n.label.length > 20 ? Math.max(n.width, 160) : n.width;
                    const nodeHeight = labelLines.length > 1 ? Math.max(n.height, 65) : n.height;

                    return (
                      <g 
                        key={n.id} 
                        transform={`translate(${n.x}, ${n.y})`}
                        onMouseDown={(e) => handleNodeMouseDown(e, n)}
                        className="cursor-grab active:cursor-grabbing group"
                      >
                        {/* Selection border (Static cyan border instead of spinning animation) */}
                        {isSelected && (
                          <rect 
                            x="-4" 
                            y="-4" 
                            width={nodeWidth + 8} 
                            height={nodeHeight + 8} 
                            rx="8" 
                            fill="none" 
                            stroke="#0ea5e9" 
                            strokeWidth="2" 
                          />
                        )}

                        {/* Node box */}
                        <rect 
                          width={nodeWidth} 
                          height={nodeHeight} 
                          rx="6" 
                          fill={nodeBoxFill} 
                          stroke={typeConfig.strokeColor} 
                          strokeWidth={isSelected ? 2.5 : 1.5} 
                          className={`transition-all group-hover:stroke-cyan-400 ${
                            isLight ? 'shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'shadow-[0_0_15px_rgba(15,23,42,0.8)]'
                          }`}
                        />

                        {/* Top Indicator bar */}
                        <rect 
                          width={nodeWidth} 
                          height="4" 
                          rx="2"
                          fill={typeConfig.strokeColor}
                        />

                        {/* Title text */}
                        <text 
                          x={nodeWidth / 2} 
                          y={labelLines.length > 1 ? 16 : 22} 
                          fill={nodeTextFill} 
                          fontSize="9.5" 
                          fontWeight="bold" 
                          textAnchor="middle" 
                          className="select-none font-sans"
                        >
                          {labelLines.map((line, idx) => (
                            <tspan key={idx} x={nodeWidth / 2} dy={idx > 0 ? 11 : 0}>
                              {line}
                            </tspan>
                          ))}
                        </text>

                        {/* Subtext: IP Address */}
                        <text 
                          x={nodeWidth / 2} 
                          y={labelLines.length > 1 ? 46 : 38} 
                          fill={n.rede_ips ? (isLight ? '#1e293b' : typeConfig.strokeColor) : (isLight ? '#64748b' : '#475569')} 
                          fontSize="9" 
                          fontWeight="bold" 
                          fontFamily="monospace"
                          textAnchor="middle" 
                          className="select-none"
                        >
                          {ipLabel}
                        </text>

                        {/* Node Type Tiny Tag */}
                        <rect 
                          x="5" 
                          y={nodeHeight - 13} 
                          width="35" 
                          height="8" 
                          rx="2" 
                          fill={isLight ? typeConfig.strokeColor + '15' : typeConfig.strokeColor + '20'}
                        />
                        <text 
                          x="7" 
                          y={nodeHeight - 7} 
                          fill={isLight ? '#475569' : typeConfig.strokeColor} 
                          fontSize="6" 
                          fontWeight="bold" 
                          className="select-none"
                        >
                          {n.type}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Connection creator Modal */}
              {linkCreator && (
                <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center p-4">
                  <form onSubmit={handleCreateLink} className="w-80 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">Criar Conexão</h3>
                      <p className="text-[10px] text-slate-400">Ligue dois blocos de rede no diagrama</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Origem</label>
                        <select 
                          value={linkCreator.source_id} 
                          onChange={(e) => setLinkCreator(prev => prev ? { ...prev, source_id: e.target.value } : null)}
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="">Selecione...</option>
                          {nodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.type})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Destino</label>
                        <select 
                          value={linkCreator.target_id} 
                          onChange={(e) => setLinkCreator(prev => prev ? { ...prev, target_id: e.target.value } : null)}
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="">Selecione...</option>
                          {nodes.filter(n => n.id !== linkCreator.source_id).map(n => <option key={n.id} value={n.id}>{n.label} ({n.type})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo de Fiação</label>
                        <select 
                          value={linkCreator.type} 
                          onChange={(e) => setLinkCreator(prev => prev ? { ...prev, type: e.target.value } : null)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="Cabo de Rede">Cabo de Rede (Ciano)</option>
                          <option value="Fibra">Fibra Óptica (Rosa)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end mt-2">
                      <button 
                        type="button" 
                        onClick={() => setLinkCreator(null)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded text-slate-300 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-xs font-bold rounded text-white cursor-pointer"
                      >
                        Ligar Blocos
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Right Configuration Sidebar */}
            <div className="w-80 bg-[#111827] border-l border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto">
              <div>
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Configurações do Bloco</h2>
                <p className="text-[10px] text-slate-500">Selecione um bloco no diagrama para editar</p>
              </div>

              {selectedNode ? (
                <div className="flex flex-col gap-4">
                  {/* Label */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nome / Etiqueta</label>
                    <input 
                      type="text" 
                      value={selectedNode.label}
                      onChange={(e) => handleUpdateNode('label', e.target.value)}
                      disabled={!isAuthorized}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tipo de Equipamento</label>
                    <select 
                      value={selectedNode.type}
                      onChange={(e) => handleUpdateNode('type', e.target.value)}
                      disabled={!isAuthorized}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                    >
                      {nodeTypes.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                  </div>

                  {/* IP ID association */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">IP Vinculado</label>
                    <select 
                      value={selectedNode.ip_id || ''}
                      onChange={(e) => handleUpdateNode('ip_id', e.target.value || null)}
                      disabled={!isAuthorized}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                    >
                      <option value="">Sem IP associado</option>
                      {ips
                        .filter(ip => ip.status === 'Ocupado' || ip.status === 'Reservado' || ip.id === selectedNode.ip_id)
                        .map(ip => (
                          <option key={ip.id} value={ip.id}>
                            {ip.ip_address} - {ip.nome_equipamento || 'Expansão'}
                          </option>
                        ))
                      }
                    </select>
                    <p className="text-[9px] text-slate-500 mt-1 leading-snug">Nota: Apenas IPs marcados como "Ocupado" ou "Reservado" na lista de IPs estão disponíveis para vinculação.</p>
                  </div>

                  {/* Dimensions Sizing */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Largura</label>
                      <input 
                        type="number" 
                        value={selectedNode.width}
                        onChange={(e) => handleUpdateNode('width', Number(e.target.value))}
                        disabled={!isAuthorized}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Altura</label>
                      <input 
                        type="number" 
                        value={selectedNode.height}
                        onChange={(e) => handleUpdateNode('height', Number(e.target.value))}
                        disabled={!isAuthorized}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Coordinates position */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Posição X</label>
                      <input 
                        type="number" 
                        value={selectedNode.x}
                        onChange={(e) => handleUpdateNode('x', snapToGrid(Number(e.target.value)))}
                        disabled={!isAuthorized}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Posição Y</label>
                      <input 
                        type="number" 
                        value={selectedNode.y}
                        onChange={(e) => handleUpdateNode('y', snapToGrid(Number(e.target.value)))}
                        disabled={!isAuthorized}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Delete button */}
                  {isAuthorized && (
                    <button 
                      onClick={handleDeleteNode}
                      className="w-full py-2 bg-rose-900/40 hover:bg-rose-900/60 text-rose-400 text-xs font-semibold rounded border border-rose-500/25 transition mt-4 cursor-pointer"
                    >
                      Remover Bloco
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  <span className="material-symbols-outlined text-slate-600 text-3xl block mb-2">click_to_select</span>
                  Clique em um bloco do diagrama para configurá-lo.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Mapa de Traçado (Planta Baixa) */}
        {activeTab === 'map' && (
          <div className="h-full w-full flex overflow-hidden">
            {/* Left Toolbar for Plant Map */}
            <div className="w-64 bg-[#111827] border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto select-none shrink-0">
              <div>
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ajuste de Planta</h2>
                <p className="text-[10px] text-slate-500">Posicione os blocos no mapa da fábrica</p>
              </div>

              {/* Unplaced elements list */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Equipamentos Pendentes</span>
                
                {unplacedMapNodes.length === 0 ? (
                  <p className="text-slate-500 text-[11px] italic">Todos os blocos do unifilar estão posicionados no mapa.</p>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
                    {unplacedMapNodes.map(node => (
                      <button
                        key={node.id}
                        onClick={async () => {
                          if (!isAuthorized) return;
                          await supabase
                            .from('rede_cad_nodes')
                            .update({ map_x: 50, map_y: 50 })
                            .eq('id', node.id);
                          fetchData();
                        }}
                        className="w-full text-left p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-200 hover:border-cyan-500 transition flex items-center justify-between group cursor-pointer"
                      >
                        <span className="truncate">{node.label}</span>
                        <span className="material-symbols-outlined text-slate-500 group-hover:text-cyan-400 text-[14px]">pin_drop</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-auto bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                <h4 className="font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">help</span>
                  Instruções:
                </h4>
                Arrastando os blocos no mapa, você define a localização exata deles na fábrica. As conexões unifilares de fibra óptica (rosa) e cabo de rede (ciano) serão geradas automaticamente sobre a planta!
              </div>
            </div>

            {/* Map Canvas */}
            <div 
              ref={mapContainerRef}
              onMouseMove={(e) => handleMapMouseMove(e, mapContainerRef.current)}
              onMouseUp={handleMapMouseUp}
              className="flex-1 bg-[#090d19] relative overflow-hidden flex items-center justify-center p-6 h-full select-none"
            >
              {/* Floor Plan Interactive SVG Wrapper */}
              <div className="relative w-[85%] aspect-[1.6] bg-[#0c1322] border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
                
                {/* SVG Blueprint of the Factory */}
                <svg viewBox="0 0 1000 600" className="w-full h-full">
                  
                  {/* Grid background */}
                  <rect width="100%" height="100%" fill="#0a0f1d" />

                  {/* Structural Masonry Walls (Simulated AutoCAD Blueprint) */}
                  <g stroke="#1e293b" strokeWidth="1" fill="none" opacity="0.3">
                    <line x1="0" y1="100" x2="1000" y2="100" />
                    <line x1="0" y1="200" x2="1000" y2="200" />
                    <line x1="0" y1="300" x2="1000" y2="300" />
                    <line x1="0" y1="400" x2="1000" y2="400" />
                    <line x1="0" y1="500" x2="1000" y2="500" />
                    <line x1="200" y1="0" x2="200" y2="600" />
                    <line x1="400" y1="0" x2="400" y2="600" />
                    <line x1="600" y1="0" x2="600" y2="600" />
                    <line x1="800" y1="0" x2="800" y2="600" />
                  </g>

                  {/* Factory Wall Polygons */}
                  <g fill="rgba(30, 41, 59, 0.25)" stroke="#334155" strokeWidth="2">
                    {/* Fábrica Antiga */}
                    <polygon points="50,150 250,150 250,550 50,550" />
                    {/* Carpintaria / Pintura */}
                    <polygon points="50,30 250,30 250,130 50,130" />
                    {/* Fábrica Nova */}
                    <polygon points="500,50 780,50 780,430 500,430" />
                    {/* Carpintaria / Trafo */}
                    <polygon points="400,30 490,30 490,180 400,180" />
                    {/* Administrativo */}
                    <polygon points="280,200 480,200 480,420 280,420" />
                    {/* Refeitório */}
                    <polygon points="280,450 480,450 480,550 280,550" />
                    {/* Manutenção */}
                    <polygon points="800,150 970,150 970,300 800,300" />
                    {/* Serviço de Campo */}
                    <polygon points="800,320 970,320 970,450 800,450" />
                    {/* Portaria Principal */}
                    <polygon points="500,450 650,450 650,550 500,550" />
                    {/* Galpão Ilha Ecológica */}
                    <polygon points="800,30 970,30 970,130 800,130" />
                  </g>

                  {/* Outer Wall Boundary */}
                  <polygon points="20,10 980,10 980,580 20,580" fill="none" stroke="#475569" strokeWidth="3" />

                  {/* Sector Labels */}
                  <g fill="#475569" fontSize="12" fontWeight="bold" textAnchor="middle" opacity="0.8">
                    <text x="150" y="320">FÁBRICA ANTIGA</text>
                    <text x="150" y="80">PINTURA / CARPINTARIA</text>
                    <text x="640" y="220">FÁBRICA NOVA</text>
                    <text x="380" y="310">ADMINISTRATIVO</text>
                    <text x="380" y="505">REFEITÓRIO</text>
                    <text x="885" y="225">MANUTENÇÃO</text>
                    <text x="885" y="390">SERVIÇO DE CAMPO</text>
                    <text x="575" y="505">PORTARIA PRINCIPAL</text>
                    <text x="885" y="80">ILHA ECOLÓGICA</text>
                  </g>

                  {/* 1. Map Connection Paths */}
                  {links.map(l => {
                    const s = nodes.find(n => n.id === l.source_id);
                    const t = nodes.find(n => n.id === l.target_id);
                    if (!s || !t || s.map_x === null || s.map_y === null || t.map_x === null || t.map_y === null) return null;

                    const mx1 = (s.map_x / 100) * 1000;
                    const my1 = (s.map_y / 100) * 600;
                    const mx2 = (t.map_x / 100) * 1000;
                    const my2 = (t.map_y / 100) * 600;

                    const lineColor = l.type === 'Fibra' ? '#ec4899' : '#00d2ff';
                    return (
                      <line 
                        key={l.id} 
                        x1={mx1} 
                        y1={my1} 
                        x2={mx2} 
                        y2={my2} 
                        stroke={lineColor} 
                        strokeWidth={l.type === 'Fibra' ? 3 : 2} 
                        strokeDasharray={l.type === 'Fibra' ? 'none' : '4, 4'}
                      />
                    );
                  })}

                  {/* 2. Map Nodes/Markers */}
                  {nodes.map(n => {
                    if (n.map_x === null || n.map_y === null) return null;
                    const mx = (n.map_x / 100) * 1000;
                    const my = (n.map_y / 100) * 600;
                    const typeConfig = nodeTypes.find(t => t.key === n.type) || nodeTypes[nodeTypes.length - 1];

                    return (
                      <g 
                        key={n.id} 
                        transform={`translate(${mx}, ${my})`}
                        onMouseDown={(e) => handleMapMarkerMouseDown(e, n.id)}
                        className="cursor-grab active:cursor-grabbing group"
                      >
                        <circle r="16" fill="#0f172a" stroke={typeConfig.strokeColor} strokeWidth="2" className="group-hover:fill-slate-900 group-hover:scale-110 transition-all" />
                        {n.type === 'CPD' ? (
                          <rect x="-6" y="-6" width="12" height="12" fill={typeConfig.strokeColor} rx="2" />
                        ) : n.type === 'Rack' ? (
                          <polygon points="0,-7 -7,6 7,6" fill={typeConfig.strokeColor} />
                        ) : n.type === 'Ponto' ? (
                          <polygon points="0,7 -7,-6 7,-6" fill={typeConfig.strokeColor} />
                        ) : (
                          <circle r="5" fill={typeConfig.strokeColor} />
                        )}
                        
                        {/* Label overlay popup on hover */}
                        <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          <rect x="-60" y="-38" width="120" height="16" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                          <text x="0" y="-27" fill="#f8fafc" fontSize="8" fontWeight="bold" textAnchor="middle">{n.label}</text>
                        </g>
                      </g>
                    );
                  })}
                </svg>

              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Lista de IPs */}
        {activeTab === 'ips' && (
          <div className="h-full w-full flex flex-col p-4 overflow-hidden">
            {/* Control Bar */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
              {/* Subnet Tabs */}
              <div className="flex gap-1.5 p-1 bg-slate-900/60 rounded-lg border border-slate-800">
                {subnetRanges.map(range => (
                  <button
                    key={range.key}
                    onClick={() => setSelectedSubnet(range.key as any)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      selectedSubnet === range.key
                        ? 'bg-slate-800 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              {/* Actions & Search */}
              <div className="flex gap-2 w-full sm:w-auto">
                <input 
                  type="text" 
                  placeholder="Buscar IP ou Equipamento..."
                  value={ipSearch}
                  onChange={(e) => setIpSearch(e.target.value)}
                  className="flex-1 sm:w-60 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button 
                  onClick={testAllIps}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded flex items-center gap-1 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  Testar Faixa
                </button>
              </div>
            </div>

            {/* IPs Grid Table */}
            <div className="flex-1 overflow-y-auto border border-slate-800/80 rounded-xl bg-slate-900/40">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800/80 sticky top-0 z-10">
                    <th className="py-2.5 px-4 font-bold text-slate-400 uppercase tracking-wider w-[15%]">
                      <div className="flex items-center gap-1">
                        <span>Endereço IP</span>
                        <button 
                          onClick={() => setSortOrderIp(prev => prev === 'asc' ? 'desc' : 'asc')}
                          className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition cursor-pointer"
                          title="Ordenar por IP"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {sortOrderIp === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        </button>
                      </div>
                    </th>
                    <th className="py-2.5 px-4 font-bold text-slate-400 uppercase tracking-wider w-[15%]">
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        <select 
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="bg-[#0f172a] text-[10px] text-slate-400 border border-slate-800 rounded px-1 py-0.5 max-w-[80px] focus:outline-none focus:border-cyan-500 font-semibold cursor-pointer"
                        >
                          <option value="All">Todos</option>
                          <option value="Disponível">Disponível</option>
                          <option value="Ocupado">Ocupado</option>
                          <option value="Reservado">Reservado</option>
                        </select>
                      </div>
                    </th>
                    <th className="py-2.5 px-4 font-bold text-slate-400 uppercase tracking-wider w-[22%]">Equipamento</th>
                    <th className="py-2.5 px-4 font-bold text-slate-400 uppercase tracking-wider w-[18%]">
                      <div className="flex items-center gap-1.5">
                        <span>Tipo</span>
                        <select 
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="bg-[#0f172a] text-[10px] text-slate-400 border border-slate-800 rounded px-1 py-0.5 max-w-[90px] focus:outline-none focus:border-cyan-500 font-semibold cursor-pointer"
                        >
                          <option value="All">Todos</option>
                          {nodeTypes.map(t => <option key={t.key} value={t.key}>{t.key}</option>)}
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </th>
                    <th className="py-2.5 px-4 font-bold text-slate-400 uppercase tracking-wider w-[15%]">
                      <div className="flex items-center gap-1.5">
                        <span>Vínculo</span>
                        <select 
                          value={filterLinked}
                          onChange={(e) => setFilterLinked(e.target.value)}
                          className="bg-[#0f172a] text-[10px] text-slate-400 border border-slate-800 rounded px-1 py-0.5 max-w-[90px] focus:outline-none focus:border-cyan-500 font-semibold cursor-pointer"
                        >
                          <option value="All">Todos</option>
                          <option value="Linked">Vinculado</option>
                          <option value="Unlinked">Não Vinc.</option>
                        </select>
                      </div>
                    </th>
                    <th className="py-2.5 px-4 font-bold text-slate-400 uppercase tracking-wider w-[15%] text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredIps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 italic">Nenhum IP encontrado correspondente à pesquisa.</td>
                    </tr>
                  ) : (
                    filteredIps.map(ip => {
                      const isOccupied = ip.status === 'Ocupado';
                      const isReserved = ip.status === 'Reservado';

                      return (
                        <tr key={ip.id} className="hover:bg-slate-800/20 transition">
                          <td className="py-2 px-4 font-mono font-bold text-white">{ip.ip_address}</td>
                          <td className="py-2 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isOccupied
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : isReserved
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {ip.status}
                            </span>
                          </td>
                          <td className="py-2 px-4 font-semibold text-slate-200">
                            {ip.nome_equipamento || <span className="text-slate-600 font-normal">---</span>}
                          </td>
                          <td className="py-2 px-4 text-slate-400">{ip.tipo_equipamento}</td>
                          <td className="py-2 px-4">
                            {ip.ativo_id ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-[10px] text-sky-400 font-bold font-mono">
                                TAG: {assets.find(a => a.id === ip.ativo_id)?.tag_id || 'N/A'}
                              </span>
                            ) : (
                              <span className="text-slate-600">---</span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              {/* Ping test status */}
                              {ip.ping_status === 'testing' ? (
                                <span className="material-symbols-outlined text-cyan-400 text-[16px] animate-spin">sync</span>
                              ) : ip.ping_status === 'online' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">🟢 Online</span>
                              ) : ip.ping_status === 'offline' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 rounded px-1.5 py-0.5">🔴 Offline</span>
                              ) : null}

                              {(isOccupied || isReserved) && !ip.ping_status && (
                                <button 
                                  onClick={() => testIP(ip.ip_address)}
                                  className="p-1 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 rounded transition cursor-pointer"
                                  title="Testar Conexão"
                                >
                                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                                </button>
                              )}

                              <button 
                                onClick={() => setEditingIp(ip)}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                                title="Editar IP"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* IP Edit Modal */}
            {editingIp && (
              <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center p-4">
                <form onSubmit={handleSaveIp} className="w-96 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Configurar Endereço IP</h3>
                    <p className="text-[10px] text-slate-400">Configure o endereço {editingIp.ip_address}</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Status */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status do IP</label>
                      <select 
                        value={editingIp.status}
                        onChange={(e) => setEditingIp(prev => prev ? { ...prev, status: e.target.value } : null)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="Disponível">🟢 Disponível (Livre)</option>
                        <option value="Ocupado">🔴 Ocupado (Equipamento)</option>
                        <option value="Reservado">🟡 Reservado (Expansão)</option>
                      </select>
                    </div>

                    {/* Equipment name */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nome do Equipamento</label>
                      <input 
                        type="text"
                        value={editingIp.nome_equipamento}
                        onChange={(e) => setEditingIp(prev => prev ? { ...prev, nome_equipamento: e.target.value } : null)}
                        placeholder="Ex: CLP Estufa 2"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* Equipment Type */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tipo de Dispositivo</label>
                      <select 
                        value={editingIp.tipo_equipamento}
                        onChange={(e) => setEditingIp(prev => prev ? { ...prev, tipo_equipamento: e.target.value } : null)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                      >
                        {nodeTypes.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                        <option value="Outro">Outro / Dispositivo</option>
                      </select>
                    </div>

                    {/* Asset linked */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vincular Ativo Físico</label>
                      <select 
                        value={editingIp.ativo_id || ''}
                        onChange={(e) => setEditingIp(prev => prev ? { ...prev, ativo_id: e.target.value || null } : null)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">Nenhum ativo físico</option>
                        {assets.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.nome} {a.tag_id ? `(${a.tag_id})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Descrição / Notas</label>
                      <textarea 
                        value={editingIp.descricao}
                        onChange={(e) => setEditingIp(prev => prev ? { ...prev, descricao: e.target.value } : null)}
                        rows={3}
                        placeholder="Notas adicionais sobre o ponto..."
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end mt-2 font-bold">
                    <button 
                      type="button" 
                      onClick={() => setEditingIp(null)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded text-slate-300 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-xs rounded text-white cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default RedeTA;
