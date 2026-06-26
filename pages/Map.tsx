import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../contexts/PreferencesContext';

/* ────────────────────────────────────────────────────────────────────────────
   TYPES
   ──────────────────────────────────────────────────────────────────────────── */
interface Hotspot {
  id: string;
  name: string;
  dbSector: string;
  description: string;
  x: number;
  y: number;
  mapView: string;
  icon?: string;
}

const AVAILABLE_ICONS = [
  { name: 'construction', label: 'Usinagem' },
  { name: 'precision_manufacturing', label: 'Montagem' },
  { name: 'local_shipping', label: 'Logística' },
  { name: 'build', label: 'Oficina' },
  { name: 'bolt', label: 'Utilidades' },
  { name: 'sensors', label: 'Sensores' },
  { name: 'radar', label: 'Radar' },
  { name: 'factory', label: 'Fábrica' },
  { name: 'engineering', label: 'Engenharia' },
  { name: 'location_on', label: 'Padrão' },
];

/* ────────────────────────────────────────────────────────────────────────────
   DEFAULT HOTSPOTS
   ──────────────────────────────────────────────────────────────────────────── */
const DEFAULT_HOTSPOTS: Hotspot[] = [
  // 3D View
  { id: 'h1_3d', name: 'Galpão Motor Principal', dbSector: 'Usinagem', description: 'Área dedicada a usinagem pesada e fabricação de eixos de rotores.', x: 48, y: 50, mapView: '3d' },
  { id: 'h2_3d', name: 'Linha de Montagem', dbSector: 'Montagem', description: 'Esteiras de montagem final dos equipamentos e testes eletromecânicos rápidos.', x: 58, y: 30, mapView: '3d' },
  { id: 'h3_3d', name: 'Pátio Logístico e Cargas', dbSector: 'Logística', description: 'Recebimento de matérias-primas e expedição de equipamentos finalizados.', x: 28, y: 55, mapView: '3d' },
  { id: 'h4_3d', name: 'Oficina de Manutenção', dbSector: 'Manutenção', description: 'Bancadas de calibração, reparo de painéis eletromecânicos e ferramentas auxiliares.', x: 62, y: 52, mapView: '3d' },
  { id: 'h5_3d', name: 'Subestação e Utilidades', dbSector: 'Utilidades', description: 'Sala de transformadores, chiller de refrigeração e gerador de backup da planta.', x: 76, y: 58, mapView: '3d' },

  // Lote A
  { id: 'h1_lote_a', name: 'Galpão Motor Principal', dbSector: 'Usinagem', description: 'Área dedicada a usinagem pesada e fabricação de eixos de rotores.', x: 45, y: 42, mapView: 'lote_a' },
  { id: 'h2_lote_a', name: 'Linha de Montagem', dbSector: 'Montagem', description: 'Esteiras de montagem final dos equipamentos e testes eletromecânicos rápidos.', x: 52, y: 30, mapView: 'lote_a' },
  { id: 'h3_lote_a', name: 'Pátio Logístico e Cargas', dbSector: 'Logística', description: 'Recebimento de matérias-primas e expedição de equipamentos finalizados.', x: 70, y: 55, mapView: 'lote_a' },
  { id: 'h4_lote_a', name: 'Oficina de Manutenção', dbSector: 'Manutenção', description: 'Bancadas de calibração, reparo de painéis eletromecânicos e ferramentas auxiliares.', x: 60, y: 70, mapView: 'lote_a' },
  { id: 'h5_lote_a', name: 'Subestação e Utilidades', dbSector: 'Utilidades', description: 'Sala de transformadores, chiller de refrigeração e gerador de backup da planta.', x: 80, y: 78, mapView: 'lote_a' },

  // Lote B
  { id: 'h1_lote_b', name: 'Galpão Motor Principal', dbSector: 'Usinagem', description: 'Área dedicada a usinagem pesada e fabricação de eixos de rotores.', x: 55, y: 40, mapView: 'lote_b' },
  { id: 'h2_lote_b', name: 'Linha de Montagem', dbSector: 'Montagem', description: 'Esteiras de montagem final dos equipamentos e testes eletromecânicos rápidos.', x: 45, y: 35, mapView: 'lote_b' },
  { id: 'h3_lote_b', name: 'Pátio Logístico e Cargas', dbSector: 'Logística', description: 'Recebimento de matérias-primas e expedição de equipamentos finalizados.', x: 48, y: 50, mapView: 'lote_b' },
  { id: 'h4_lote_b', name: 'Oficina de Manutenção', dbSector: 'Manutenção', description: 'Bancadas de calibração, reparo de painéis eletromecânicos e ferramentas auxiliares.', x: 60, y: 65, mapView: 'lote_b' },
  { id: 'h5_lote_b', name: 'Subestação e Utilidades', dbSector: 'Utilidades', description: 'Sala de transformadores, chiller de refrigeração e gerador de backup da planta.', x: 72, y: 72, mapView: 'lote_b' },

  // Lote C
  { id: 'h1_lote_c', name: 'Galpão Motor Principal', dbSector: 'Usinagem', description: 'Área dedicada a usinagem pesada e fabricação de eixos de rotores.', x: 48, y: 45, mapView: 'lote_c' },
  { id: 'h2_lote_c', name: 'Linha de Montagem', dbSector: 'Montagem', description: 'Esteiras de montagem final dos equipamentos e testes eletromecânicos rápidos.', x: 42, y: 35, mapView: 'lote_c' },
  { id: 'h3_lote_c', name: 'Pátio Logístico e Cargas', dbSector: 'Logística', description: 'Recebimento de matérias-primas e expedição de equipamentos finalizados.', x: 60, y: 55, mapView: 'lote_c' },
  { id: 'h4_lote_c', name: 'Oficina de Manutenção', dbSector: 'Manutenção', description: 'Bancadas de calibração, reparo de painéis eletromecânicos e ferramentas auxiliares.', x: 55, y: 65, mapView: 'lote_c' },
  { id: 'h5_lote_c', name: 'Subestação e Utilidades', dbSector: 'Utilidades', description: 'Sala de transformadores, chiller de refrigeração e gerador de backup da planta.', x: 70, y: 75, mapView: 'lote_c' }
];

const mockProjects = [
  { id: 'p1', name: 'Reforma Galpão Trafo', dbSector: 'Utilidades', progress: 75, coordinator: 'Eng. Daniel Silva', status: 'Em Execução', faturado: 310000, previsto: 450000 },
  { id: 'p2', name: 'Fundação Nova Área', dbSector: 'Usinagem', progress: 95, coordinator: 'Engª. Amanda Costa', status: 'Prazos Críticos', faturado: 195000, previsto: 180000 },
  { id: 'p3', name: 'Ampliação da Subestação', dbSector: 'Utilidades', progress: 40, coordinator: 'Eng. Rafael Ramos', status: 'Em Execução', faturado: 450000, previsto: 980000 },
];

/* ────────────────────────────────────────────────────────────────────────────
   MAP IMAGE CONFIG
   ──────────────────────────────────────────────────────────────────────────── */
const MAP_IMAGES: Record<string, string> = {
  '3d': '/assets/mapa_360.webp',
  '2d_outlines': '/assets/map_overhead_outlines.jpg',
  '2d_clean': '/assets/map_overhead_clean.jpg',
  'lote_a': '/assets/PRINCIPAL.webp',
  'lote_b': '/assets/FIOS_novo.webp',
  'lote_c': '/assets/map_lote_c.jpg',
};

/* ────────────────────────────────────────────────────────────────────────────
   STORAGE HELPERS
   ──────────────────────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'manequip-map-hotspots-v5';

function loadHotspots(): Hotspot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return DEFAULT_HOTSPOTS;
}

function saveHotspots(hotspots: Hotspot[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hotspots));
}

/* ════════════════════════════════════════════════════════════════════════════
   MAP COMPONENT
   ════════════════════════════════════════════════════════════════════════════ */
const Map: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = usePreferences();

  const isAdmin =
    userProfile?.role === 'Administrator' ||
    userProfile?.role === 'Admin';

  // ── View Mode ──
  type ViewMode = '3d' | '2d_outlines' | '2d_clean' | 'lote_a' | 'lote_b' | 'lote_c';
  const [viewMode, setViewMode] = useState<ViewMode>('3d');

  // ── Selection ──
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  // ── Admin Edit Mode ──
  const [editMode, setEditMode] = useState(false);
  const [hotspots, setHotspots] = useState<Hotspot[]>(loadHotspots);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  // ── Admin Drag for hotspots ──
  const [draggingHotspotId, setDraggingHotspotId] = useState<string | null>(null);

  // ── The img element ref — used to calculate hotspot percentage positions ──
  const imgRef = useRef<HTMLImageElement>(null);

  // ── Real-time telemetry ──
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [preventives, setPreventives] = useState<any[]>([]);
  const [lowestHealthAssets, setLowestHealthAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Adding hotspot flow ──
  const [isAddingHotspot, setIsAddingHotspot] = useState(false);
  const [newHotspotName, setNewHotspotName] = useState('');
  const [newHotspotSector, setNewHotspotSector] = useState('');
  const [newHotspotDesc, setNewHotspotDesc] = useState('');
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null);

  // ── Sectors loading and searching ──
  const [sectors, setSectors] = useState<string[]>(['Usinagem', 'Montagem', 'Logística', 'Manutenção', 'Utilidades']);
  const [sectorSearch, setSectorSearch] = useState('');
  const [showSectorDropdown, setShowSectorDropdown] = useState(false);
  const [showAddSectorDropdown, setShowAddSectorDropdown] = useState(false);

  // ── Tracked image overlay rect — reactive via ResizeObserver ──
  const [imgRect, setImgRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Intro Video Stage ──
  const [introStage, setIntroStage] = useState<'video' | 'fadeout' | 'none'>('video');

  // ── Sidebar internal states ──
  const [sidebarTab, setSidebarTab] = useState<'todos' | 'corretivas' | 'preventivas'>('todos');
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);

  // Recalculate the overlay rect whenever the image or container resizes
  // Using the cover layout calculations so hotspots map to exact image coordinates
  const recalcImgRect = useCallback(() => {
    if (!imgRef.current || !containerRef.current) { setImgRect(null); return; }
    const cRect = containerRef.current.getBoundingClientRect();
    const { naturalWidth, naturalHeight } = imgRef.current;

    if (!naturalWidth || !naturalHeight) {
      setImgRect({
        left: 0,
        top: 0,
        width: cRect.width,
        height: cRect.height,
      });
      return;
    }

    const cRatio = cRect.width / cRect.height;
    const imgRatio = naturalWidth / naturalHeight;

    let width = cRect.width;
    let height = cRect.height;
    let left = 0;
    let top = 0;

    if (cRatio > imgRatio) {
      width = cRect.width;
      height = cRect.width / imgRatio;
      top = (cRect.height - height) / 2;
    } else {
      height = cRect.height;
      width = cRect.height * imgRatio;
      left = (cRect.width - width) / 2;
    }

    setImgRect({ left, top, width, height });
  }, []);

  // ResizeObserver on both image and container to keep the overlay in sync
  useEffect(() => {
    const targets = [imgRef.current, containerRef.current].filter(Boolean) as Element[];
    if (targets.length === 0) return;
    const ro = new ResizeObserver(() => recalcImgRect());
    targets.forEach((t) => ro.observe(t));
    return () => ro.disconnect();
  }, [recalcImgRect, viewMode]);

  // Also recalc on window resize (e.g. sidebar collapse)
  useEffect(() => {
    const handler = () => recalcImgRect();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [recalcImgRect]);

  // Video Intro timeout fallback (starts cross-fade at 8 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIntroStage('fadeout');
      setTimeout(() => setIntroStage('none'), 1000);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  /* ── Data Fetch ────────────────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      const [{ data: woData }, { data: pmData }, { data: healthData }] = await Promise.all([
        supabase.from('work_orders').select('*, ativos(*)'),
        supabase.from('preventivas_mensais').select('*, ativos(*)'),
        supabase.from('ativos').select('id, nome, setor, saude').order('saude', { ascending: true }).limit(5),
      ]);
      setWorkOrders(woData || []);
      setPreventives(pmData || []);
      setLowestHealthAssets(healthData || []);
    } catch (err) {
      console.error('Map telemetry fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const sub = supabase
      .channel('map-telemetry')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'preventivas_mensais' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ativos' }, fetchData)
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [fetchData]);

  // Load Sectors from Database
  useEffect(() => {
    async function loadSectors() {
      try {
        const { data } = await supabase.from('sectors').select('name');
        if (data && data.length > 0) {
          setSectors(data.map(s => s.name));
        }
      } catch (err) {
        console.error('Error loading sectors:', err);
      }
    }
    loadSectors();
  }, []);

  // Load Hotspots from Supabase on Mount
  useEffect(() => {
    async function loadDbHotspots() {
      try {
        const { data, error } = await supabase
          .from('map_hotspots')
          .select('*');
        if (error) {
          console.error('Error fetching hotspots from Supabase:', error);
          return;
        }
        if (data && data.length > 0) {
          const mapped: Hotspot[] = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            dbSector: row.db_sector,
            description: row.description || '',
            x: row.x,
            y: row.y,
            mapView: row.map_view,
            icon: row.icon || undefined
          }));
          setHotspots(mapped);
          saveHotspots(mapped); // sync local storage cache
        }
      } catch (err) {
        console.error('Failed to load hotspots from database:', err);
      }
    }
    loadDbHotspots();
  }, []);

  /* ── Persist hotspots on change ──────────────────────────────────────── */
  useEffect(() => {
    saveHotspots(hotspots);
  }, [hotspots]);

  // Native image load event listener and complete status checker to prevent pin offset shifts when cached
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const handleLoad = () => {
      recalcImgRect();
    };

    if (img.complete) {
      handleLoad();
    }

    img.addEventListener('load', handleLoad);
    return () => {
      img.removeEventListener('load', handleLoad);
    };
  }, [viewMode, recalcImgRect]);

  /* ── Sector Icon Mapping ─────────────────────────────────────────────── */
  const getSectorIcon = (dbSector: string) => {
    switch (dbSector) {
      case 'Usinagem': return 'construction';
      case 'Montagem': return 'precision_manufacturing';
      case 'Logística': return 'local_shipping';
      case 'Manutenção': return 'build';
      case 'Utilidades': return 'bolt';
      default: return 'location_on';
    }
  };

  /* ── Global Stats Calculator ─────────────────────────────────────────── */
  const getGlobalStats = () => {
    const activeWOs = workOrders.filter(
      (wo) => wo.status !== 'Concluída' && wo.status !== 'Finalizada'
    );
    const activePMs = preventives.filter(
      (pm) => pm.status !== 'Concluído'
    );

    const now = new Date();
    const currentMonthNum = now.getMonth() + 1;
    const currentYearNum = now.getFullYear();

    const corretivas = activeWOs.filter((wo) => wo.tipo === 'Corretiva').length;

    const preventivas = activeWOs.filter((wo) => {
      if (wo.tipo !== 'Preventiva') return false;
      const woDate = wo.created_at ? new Date(wo.created_at) : null;
      return woDate && (woDate.getMonth() + 1) === currentMonthNum && woDate.getFullYear() === currentYearNum;
    }).length + activePMs.filter((pm) => pm.mes === currentMonthNum && pm.ano === currentYearNum).length;

    const projects = mockProjects.length;

    return { corretivas, preventivas, projects };
  };

  const hasCriticalWOs = workOrders.some(
    (wo) => wo.status !== 'Concluída' && wo.status !== 'Finalizada' && wo.tipo === 'Corretiva' && (wo.prioridade === 'Alta' || wo.prioridade === 'Crítica')
  );

  const globalStats = getGlobalStats();

  const getSectorWorkOrdersCount = (sectorName: string) => {
    const osCount = workOrders.filter(
      (wo) => wo.ativos?.setor === sectorName && wo.status !== 'Concluída' && wo.status !== 'Finalizada'
    ).length;
    const pmCount = preventives.filter(
      (pm) => pm.ativos?.setor === sectorName && pm.status !== 'Concluído'
    ).length;
    return osCount + pmCount;
  };

  /* ── Stats Calculator ─────────────────────────────────────────────────── */
  const getStats = (dbSector: string) => {
    const now = new Date();
    const currentMonthNum = now.getMonth() + 1;
    const currentYearNum = now.getFullYear();

    const sectorWOs = workOrders.filter(
      (wo) => wo.ativos?.setor === dbSector && wo.status !== 'Concluída' && wo.status !== 'Finalizada'
    );
    const sectorPMs = preventives.filter(
      (pm) =>
        pm.ativos?.setor === dbSector &&
        pm.status !== 'Concluído' &&
        (pm.ano < currentYearNum || (pm.ano === currentYearNum && pm.mes <= currentMonthNum))
    );

    const corretivasCount = sectorWOs.filter((wo) => wo.tipo === 'Corretiva').length;
    const preventivasCount = sectorWOs.filter((wo) => wo.tipo === 'Preventiva').length + sectorPMs.length;
    const projectsCount = mockProjects.filter((p) => p.dbSector === dbSector).length;
    const totalCount = corretivasCount + preventivasCount + projectsCount;

    let dotColor: string;
    let pulseColor: string;
    let glowShadow: string;

    if (corretivasCount > 0) {
      const hasCritical = sectorWOs.some(
        (wo) => wo.tipo === 'Corretiva' && (wo.prioridade === 'Alta' || wo.prioridade === 'Crítica')
      );
      if (hasCritical || corretivasCount >= 2) {
        dotColor = 'bg-rose-500';
        pulseColor = 'ring-rose-500/60';
        glowShadow = '0 0 18px 4px rgba(244,63,94,0.55)';
      } else {
        dotColor = 'bg-amber-500';
        pulseColor = 'ring-amber-500/50';
        glowShadow = '0 0 14px 3px rgba(245,158,11,0.45)';
      }
    } else if (preventivasCount > 0) {
      dotColor = 'bg-cyan-500';
      pulseColor = 'ring-cyan-500/40';
      glowShadow = '0 0 14px 3px rgba(6,182,212,0.4)';
    } else {
      dotColor = 'bg-emerald-500';
      pulseColor = 'ring-emerald-500/30';
      glowShadow = '0 0 10px 3px rgba(16,185,129,0.35)';
    }

    return {
      corretivasCount, preventivasCount, projectsCount, totalCount,
      dotColor, pulseColor, glowShadow,
      activeWOs: sectorWOs, activePMs: sectorPMs,
    };
  };

  /* ────────────────────────────────────────────────────────────────────────
     ADMIN: DRAG HOTSPOT TO REPOSITION
     Uses the actual rendered image rect so hotspots stay correctly placed
     ──────────────────────────────────────────────────────────────────────── */
  const handleHotspotDrag = useCallback((clientX: number, clientY: number) => {
    if (!draggingHotspotId || !containerRef.current || !imgRect) return;
    const cRect = containerRef.current.getBoundingClientRect();

    const xCursor = clientX - cRect.left;
    const yCursor = clientY - cRect.top;

    const xImage = xCursor - imgRect.left;
    const yImage = yCursor - imgRect.top;

    const relX = (xImage / imgRect.width) * 100;
    const relY = (yImage / imgRect.height) * 100;

    const clampedX = Math.max(0.5, Math.min(99.5, relX));
    const clampedY = Math.max(0.5, Math.min(99.5, relY));

    setHotspots((prev) =>
      prev.map((h) => {
        if (h.id !== draggingHotspotId) return h;
        return {
          ...h,
          x: clampedX,
          y: clampedY,
        };
      })
    );
  }, [draggingHotspotId, imgRect]);

  // Global mouse/touch move and up for dragging
  useEffect(() => {
    if (!draggingHotspotId) return;

    const onMove = (e: MouseEvent) => { e.preventDefault(); handleHotspotDrag(e.clientX, e.clientY); };
    const onTouchMove = (e: TouchEvent) => { if (e.touches.length === 1) { e.preventDefault(); handleHotspotDrag(e.touches[0].clientX, e.touches[0].clientY); } };
    const onUp = () => {
      setDraggingHotspotId((draggedId) => {
        if (draggedId) {
          setHotspots((latest) => {
            const dragged = latest.find((h) => h.id === draggedId);
            if (dragged) {
              supabase
                .from('map_hotspots')
                .upsert({
                  id: dragged.id,
                  name: dragged.name,
                  db_sector: dragged.dbSector,
                  description: dragged.description,
                  x: dragged.x,
                  y: dragged.y,
                  map_view: dragged.mapView,
                  icon: dragged.icon || null,
                })
                .then(({ error }) => {
                  if (error) console.error('Error saving dragged hotspot to Supabase:', error);
                });
            }
            saveHotspots(latest);
            return latest;
          });
        }
        return null;
      });
      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 2000);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [draggingHotspotId, handleHotspotDrag]);

  /* ── Add / Remove hotspot ──────────────────────────────────────────── */
  const handleAddHotspot = async () => {
    if (!newHotspotName.trim() || !newHotspotSector.trim()) return;
    const newId = `h_${Date.now()}`;
    const newHotspot: Hotspot = {
      id: newId,
      name: newHotspotName.trim(),
      dbSector: newHotspotSector.trim(),
      description: newHotspotDesc.trim() || `Setor ${newHotspotSector.trim()}`,
      x: 50,
      y: 50,
      mapView: viewMode,
    };

    try {
      const { error } = await supabase
        .from('map_hotspots')
        .insert({
          id: newHotspot.id,
          name: newHotspot.name,
          db_sector: newHotspot.dbSector,
          description: newHotspot.description,
          x: newHotspot.x,
          y: newHotspot.y,
          map_view: newHotspot.mapView,
          icon: newHotspot.icon || null,
        });
      if (error) console.error('Error inserting new hotspot to Supabase:', error);
    } catch (err) {
      console.error('Failed to save new hotspot to Supabase:', err);
    }

    setHotspots((prev) => [...prev, newHotspot]);
    setNewHotspotName(''); setNewHotspotSector(''); setNewHotspotDesc('');
    setIsAddingHotspot(false);
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  const handleRemoveHotspot = async (id: string) => {
    try {
      const { error } = await supabase
        .from('map_hotspots')
        .delete()
        .eq('id', id);
      if (error) console.error('Error deleting hotspot from Supabase:', error);
    } catch (err) {
      console.error('Failed to delete hotspot from Supabase:', err);
    }
    setHotspots((prev) => prev.filter((h) => h.id !== id));
    if (selectedHotspot?.id === id) setSelectedHotspot(null);
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  const skipIntro = () => {
    setIntroStage('fadeout');
    setTimeout(() => setIntroStage('none'), 1000);
  };

  const showUi = introStage === 'none' || introStage === 'fadeout';

  return (
    <div className="relative w-full h-full bg-[#050811] flex flex-row overflow-hidden text-slate-100 font-sans">
      {/* Intro Video Overlay */}
      {introStage !== 'none' && (
        <div
          className={`absolute inset-0 bg-[#02040a] z-50 flex flex-col items-center justify-center transition-opacity duration-1000 ${introStage === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >
          {/* Background Drone Video */}
          <video
            src="/assets/Transicao_Principal.mp4"
            autoPlay
            muted
            playsInline
            onEnded={() => {
              setIntroStage('fadeout');
              setTimeout(() => setIntroStage('none'), 1000);
            }}
            className="absolute inset-0 w-full h-full object-cover opacity-75 z-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-transparent to-[#02040a]/80 z-10" />

          <div className="relative z-20 flex flex-col items-center gap-4 text-center max-w-md px-6 pointer-events-none">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-[#00d2ff] text-5xl animate-pulse">radar</span>
              <div className="text-left">
                <h1 className="text-2xl font-black text-white uppercase tracking-wider font-display drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Manequip 360</h1>
                <p className="text-[9px] text-[#00d2ff] font-mono tracking-[0.2em] uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Digital Twin Industrial OS</p>
              </div>
            </div>
            <div className="w-48 h-1 bg-slate-950/80 rounded-full overflow-hidden border border-slate-900/60">
              <div className="h-full bg-gradient-to-r from-[#00d2ff] to-cyan-500 rounded-full animate-[loading_8s_ease-in-out]"></div>
            </div>
            <p className="text-[10px] text-slate-300 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Conectando telemetria em tempo real, mapeando ativos físicos de Sarzedo...</p>
          </div>
          <button
            onClick={skipIntro}
            className="absolute bottom-10 px-6 py-2 bg-slate-900/80 border border-slate-800 rounded-full text-xs font-mono uppercase tracking-widest text-[#00d2ff] hover:bg-[#00d2ff]/10 hover:border-[#00d2ff]/40 transition-all z-30 cursor-pointer shadow-lg"
          >
            Pular Introdução
          </button>
        </div>
      )}

      <div className="flex-1 h-full relative flex flex-col overflow-hidden">
        <div className="absolute top-3 left-3 right-3 z-30 flex flex-col md:flex-row md:items-center justify-between gap-3 pointer-events-none">
          {/* Perspective Selector (Pill style) */}
          <div className="bg-[#0b1120]/80 backdrop-blur-xl border border-slate-800/80 p-1.5 rounded-full shadow-2xl flex items-center gap-1 pointer-events-auto">
            {[
              { key: '3d', label: 'MAPA 360', icon: 'radar' },
              { key: 'lote_a', label: 'LOTES/RAIAS', icon: 'grid_view' },
            ].map(({ key, label, icon }) => {
              const active =
                key === '3d' ? viewMode === '3d' :
                  viewMode.startsWith('lote_');
              return (
                <button
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewMode(key as ViewMode);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${active
                    ? 'bg-[#00d2ff]/15 text-[#00d2ff] border border-[#00d2ff]/30 shadow-sm'
                    : 'text-slate-400 hover:text-white border border-transparent'
                    }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Plant-wide Counter Badges */}
          <div className="bg-[#0b1120]/80 backdrop-blur-xl border border-slate-800/80 p-1.5 rounded-full shadow-2xl flex items-center gap-2 pointer-events-auto overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 px-3 border-r border-slate-800/60 shrink-0">
              <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest whitespace-nowrap">STATUS GERAL:</span>
            </div>
            {/* Corretivas */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[9px] font-black shrink-0 shadow-lg">
              <span className="size-1.5 rounded-full bg-amber-500"></span>
              <span className="text-[8px] text-amber-300 font-bold uppercase tracking-wider">CORRETIVA:</span>
              <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full font-mono">
                {globalStats.corretivas || 0}
              </span>
            </div>
            {/* Preventivas */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-[9px] font-black shrink-0 shadow-lg">
              <span className="size-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
              <span className="text-[8px] text-cyan-300 font-bold uppercase tracking-wider">
                PREVENTIVAS ({new Date().toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()}):
              </span>
              <span className="text-xs font-black text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-full font-mono">
                {globalStats.preventivas || 0}
              </span>
            </div>
            {/* Projetos */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-400 text-[9px] font-black shrink-0 shadow-lg">
              <span className="size-1.5 rounded-full bg-violet-500"></span>
              <span className="text-[8px] text-violet-300 font-bold uppercase tracking-wider">PROJETOS:</span>
              <span className="text-xs font-black text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded-full font-mono">
                {globalStats.projects || 0}
              </span>
            </div>
          </div>
        </div>

        {/* ══ FLOATING LEFT CONTROLS (HUD) ═══════════════════════════════════════ */}
        <div className="absolute top-16 left-3 z-30 flex flex-col gap-2.5 max-w-[260px] pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          {/* Sub-selectors (Lotes specific) */}
          {viewMode.startsWith('lote_') && (
            <div className="bg-[#0b1120]/80 backdrop-blur-xl border border-slate-800/80 p-3 rounded-xl shadow-2xl space-y-2">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-violet-400 uppercase tracking-widest">Lotes / Raias</span>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { key: 'lote_a', label: 'PRINCIPAL' },
                    { key: 'lote_b', label: 'FIOS' },
                    { key: 'lote_c', label: 'METZ' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setViewMode(key as ViewMode)}
                      className={`py-1 px-1.5 rounded text-[8px] font-bold uppercase border transition-all ${viewMode === key
                        ? 'bg-violet-500/20 text-white border-violet-500/40'
                        : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:text-slate-300'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Legend Card */}
          <div className="bg-[#0b1120]/80 backdrop-blur-xl border border-slate-800/80 p-3 rounded-xl shadow-2xl w-[145px] space-y-2 pointer-events-auto">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-900 block">Legenda</span>
            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2 text-[8px] font-bold text-slate-300"><span className="size-2 rounded-full bg-rose-500"></span>Crítico</span>
              <span className="flex items-center gap-2 text-[8px] font-bold text-slate-300"><span className="size-2 rounded-full bg-amber-500"></span>Corretivas</span>
              <span className="flex items-center gap-2 text-[8px] font-bold text-slate-300"><span className="size-2 rounded-full bg-cyan-500"></span>Preventivas</span>
              <span className="flex items-center gap-2 text-[8px] font-bold text-slate-300"><span className="size-2 rounded-full bg-emerald-500"></span>Limpo</span>
            </div>
          </div>

          {/* Admin Edit Controls */}
          {isAdmin && (
            <button
              onClick={() => {
                const nextMode = !editMode;
                setEditMode(nextMode);
                setDraggingHotspotId(null);
                setEditingHotspot(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${editMode
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/70 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-800 dark:hover:text-white'
                }`}
            >
              <span className="material-symbols-outlined text-[14px]">{editMode ? 'edit_off' : 'edit'}</span>
              {editMode ? 'Sair do Modo Edição' : 'Editar Mapa (Admin)'}
            </button>
          )}

          {/* Saved feedback toast */}
          {showSavedFeedback && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-emerald-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-bounce shadow-lg">
              <span className="material-symbols-outlined text-[12px]">done</span>
              Alterações salvas!
            </div>
          )}

          {/* Admin Add/Edit Hotspot Panel */}
          {isAdmin && editMode && (
            <div className="bg-[#0b1120]/95 backdrop-blur-xl border border-amber-500/30 p-3.5 rounded-xl shadow-2xl space-y-2">
              {editingHotspot ? (
                // EDITING MODE FORM
                <div className="space-y-2.5">
                  <h4 className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">edit_location</span>
                    Editar Indicador
                  </h4>
                  <div className="space-y-1.5">
                    <div>
                      <label className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Nome do Local</label>
                      <input
                        value={editingHotspot.name}
                        onChange={(e) => setEditingHotspot(prev => prev ? { ...prev, name: e.target.value } : null)}
                        placeholder="Nome do local"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-white focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>
                    <div className="relative">
                      <label className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Setor Associado (Banco de Dados)</label>
                      <div
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-white flex justify-between items-center cursor-pointer"
                        onClick={() => setShowSectorDropdown(!showSectorDropdown)}
                      >
                        <span>{editingHotspot.dbSector || 'Selecione um setor...'}</span>
                        <span className="material-symbols-outlined text-[12px] text-slate-500">arrow_drop_down</span>
                      </div>

                      {showSectorDropdown && (
                        <div className="absolute left-0 right-0 mt-1 bg-slate-950 border border-slate-850 rounded-lg shadow-xl max-h-32 overflow-y-auto z-50 p-1 space-y-0.5">
                          <input
                            type="text"
                            placeholder="Buscar setor..."
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setSectorSearch(e.target.value)}
                            value={sectorSearch}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[9px] text-white mb-1 focus:outline-none focus:border-amber-500/50"
                          />
                          {sectors
                            .filter(s => s.toLowerCase().includes(sectorSearch.toLowerCase()))
                            .map(s => {
                              const count = getSectorWorkOrdersCount(s);
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => {
                                    setEditingHotspot(prev => prev ? { ...prev, dbSector: s } : null);
                                    setShowSectorDropdown(false);
                                    setSectorSearch('');
                                  }}
                                  className="w-full text-left px-2 py-1 text-[9px] hover:bg-slate-900 rounded text-slate-300 hover:text-white transition-colors flex justify-between items-center"
                                >
                                  <span>{s}</span>
                                  <span className="text-[8px] font-bold text-slate-500 bg-slate-950/60 px-1.5 py-0.5 rounded-full font-mono border border-slate-800">
                                    {count} chamado{count !== 1 ? 's' : ''}
                                  </span>
                                </button>
                              );
                            })
                          }
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Descrição</label>
                      <input
                        value={editingHotspot.description}
                        onChange={(e) => setEditingHotspot(prev => prev ? { ...prev, description: e.target.value } : null)}
                        placeholder="Descrição do local"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-white focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>

                    {/* Icon Selection Grid */}
                    <div>
                      <label className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Ícone do Local</label>
                      <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1.5 rounded border border-slate-900">
                        {AVAILABLE_ICONS.map((item) => {
                          const active = editingHotspot.icon === item.name || (!editingHotspot.icon && getSectorIcon(editingHotspot.dbSector) === item.name);
                          return (
                            <button
                              key={item.name}
                              type="button"
                              title={item.label}
                              onClick={() => setEditingHotspot(prev => prev ? { ...prev, icon: item.name } : null)}
                              className={`p-1 rounded flex items-center justify-center border transition-all cursor-pointer ${active
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                                : 'bg-slate-900/50 text-slate-500 border-slate-900 hover:text-slate-300'
                                }`}
                            >
                              <span className="material-symbols-outlined text-[15px]">{item.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={async () => {
                          if (!editingHotspot) return;
                          try {
                            const { error } = await supabase
                              .from('map_hotspots')
                              .upsert({
                                id: editingHotspot.id,
                                name: editingHotspot.name,
                                db_sector: editingHotspot.dbSector,
                                description: editingHotspot.description,
                                x: editingHotspot.x,
                                y: editingHotspot.y,
                                map_view: editingHotspot.mapView,
                                icon: editingHotspot.icon || null,
                              });
                            if (error) console.error('Error updating hotspot in Supabase:', error);
                          } catch (err) {
                            console.error('Failed to update hotspot in Supabase:', err);
                          }
                          setHotspots(prev => prev.map(h => h.id === editingHotspot.id ? editingHotspot : h));
                          setEditingHotspot(null);
                          setShowSavedFeedback(true);
                          setTimeout(() => setShowSavedFeedback(false), 2000);
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-[9px] font-bold border border-amber-500/30 hover:bg-amber-500/30 transition-all cursor-pointer"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingHotspot(null)}
                        className="flex-1 py-1.5 rounded-lg bg-slate-900 text-slate-400 text-[9px] font-bold border border-slate-800 hover:text-white transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // ADD / MANAGE MODE
                <>
                  <h4 className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">add_location_alt</span>
                    Gerenciar Indicadores
                  </h4>
                  <p className="text-[8px] text-slate-500 leading-relaxed font-bold">
                    Arraste os badges diretamente no mapa para reposicionar. Clique no indicador para editá-lo ou no × para remover.
                  </p>
                  {!isAddingHotspot ? (
                    <button
                      onClick={() => setIsAddingHotspot(true)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/25 text-[9px] font-bold uppercase hover:bg-amber-500/20 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">add_circle</span>
                      Adicionar Indicador
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <input value={newHotspotName} onChange={(e) => setNewHotspotName(e.target.value)} placeholder="Nome do local" className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-white placeholder-slate-600 focus:border-amber-500/50 focus:outline-none" />

                      <div className="relative">
                        <div
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-white flex justify-between items-center cursor-pointer"
                          onClick={() => setShowAddSectorDropdown(!showAddSectorDropdown)}
                        >
                          <span>{newHotspotSector || 'Selecionar Setor...'}</span>
                          <span className="material-symbols-outlined text-[12px] text-slate-500">arrow_drop_down</span>
                        </div>

                        {showAddSectorDropdown && (
                          <div className="absolute left-0 right-0 mt-1 bg-slate-950 border border-slate-850 rounded-lg shadow-xl max-h-32 overflow-y-auto z-50 p-1 space-y-0.5">
                            <input
                              type="text"
                              placeholder="Buscar setor..."
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setSectorSearch(e.target.value)}
                              value={sectorSearch}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[9px] text-white mb-1 focus:outline-none focus:border-amber-500/50"
                            />
                            {sectors
                              .filter(s => s.toLowerCase().includes(sectorSearch.toLowerCase()))
                              .map(s => {
                                const count = getSectorWorkOrdersCount(s);
                                return (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => {
                                      setNewHotspotSector(s);
                                      setShowAddSectorDropdown(false);
                                      setSectorSearch('');
                                    }}
                                    className="w-full text-left px-2 py-1 text-[9px] hover:bg-slate-900 rounded text-slate-300 hover:text-white transition-colors flex justify-between items-center"
                                  >
                                    <span>{s}</span>
                                    <span className="text-[8px] font-bold text-slate-500 bg-slate-950/60 px-1.5 py-0.5 rounded-full font-mono border border-slate-800">
                                      {count} chamado{count !== 1 ? 's' : ''}
                                    </span>
                                  </button>
                                );
                              })
                            }
                          </div>
                        )}
                      </div>

                      <input value={newHotspotDesc} onChange={(e) => setNewHotspotDesc(e.target.value)} placeholder="Descrição (opcional)" className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-white placeholder-slate-600 focus:border-amber-500/50 focus:outline-none" />
                      <div className="flex gap-1">
                        <button onClick={handleAddHotspot} className="flex-1 py-1 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold border border-amber-500/30 hover:bg-amber-500/30 transition-all cursor-pointer">Criar</button>
                        <button onClick={() => setIsAddingHotspot(false)} className="flex-1 py-1 rounded bg-slate-900 text-slate-400 text-[9px] font-bold border border-slate-800 hover:text-white transition-all cursor-pointer">Cancelar</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>

        {/* ══ TOP RIGHT HUD: RECENT WORK ORDERS ═════════════════════════════════ */}
        <div className="absolute top-16 right-3 bg-[#0b1120]/75 backdrop-blur-md border border-slate-800/80 p-3 rounded-xl shadow-2xl w-[320px] max-h-[300px] overflow-hidden flex flex-col z-30 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Ordens de Serviço Recentes</span>
            <span className="text-[7px] font-mono text-slate-500">LIVE FEED</span>
          </div>

          <div className="overflow-y-auto no-scrollbar flex-1">
            <table className="w-full text-left text-[8px] font-mono border-collapse">
              <thead>
                <tr className="text-slate-500 uppercase font-black border-b border-slate-900">
                  <th className="pb-1 font-bold">ID</th>
                  <th className="pb-1 font-bold">Tipo</th>
                  <th className="pb-1 font-bold">Local</th>
                  <th className="pb-1 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {(() => {
                  // Merge and sort real database records from work_orders (OS) and preventivas_mensais (PM)
                  const recentWOs = workOrders.map((wo) => {
                    const isHigh = wo.prioridade === 'Alta' || wo.prioridade === 'Crítica';
                    const isConcluida = ['concluída', 'concluído', 'concluido', 'finalizada', 'finalizado'].includes((wo.status || '').toLowerCase());
                    return {
                      id: wo.id,
                      display_id: wo.display_id || `OS${wo.id.slice(0, 4).toUpperCase()}`,
                      tipo: 'OS',
                      local: wo.ativos?.nome || wo.ativos?.setor || 'Planta',
                      status: isConcluida ? 'OK' : (isHigh ? 'Crítico' : 'Aberto'),
                      created_at: wo.created_at,
                    };
                  });

                  const recentPMs = preventives.map((pm) => {
                    const isConcluido = ['concluído', 'concluido', 'concluída', 'concluida', 'finalizada', 'finalizado'].includes((pm.status || '').toLowerCase());
                    return {
                      id: pm.id,
                      display_id: `PM${String(pm.id).slice(0, 4).toUpperCase()}`,
                      tipo: 'PM',
                      local: pm.ativos?.nome || pm.ativos?.setor || 'Planta',
                      status: isConcluido ? 'OK' : 'Preventiva',
                      created_at: pm.created_at,
                    };
                  });

                  const mergedList = [...recentWOs, ...recentPMs]
                    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
                    .slice(0, 8);

                  if (mergedList.length === 0) {
                    return (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-500 italic text-[7px]">
                          Sem ordens de serviço recentes.
                        </td>
                      </tr>
                    );
                  }

                  return mergedList.map((wo) => (
                    <tr key={wo.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-1 text-slate-300 font-bold">#{wo.display_id}</td>
                      <td className="py-1 text-slate-400">{wo.tipo}</td>
                      <td className="py-1 text-slate-400 truncate max-w-[120px]" title={wo.local}>{wo.local}</td>
                      <td className="py-1 text-right">
                        <span className={`px-1 py-0.5 rounded-[3px] text-[7px] font-black uppercase tracking-wide ${wo.status === 'Crítico' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' :
                          wo.status === 'Preventiva' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                          }`}>
                          {wo.status}
                        </span>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>


        {/* ══ MAP VIEWPORT (Fixed image inside container with grid) ════════════════ */}
        <div
          className="flex-1 h-full w-full relative overflow-hidden flex items-center justify-center bg-[#050811]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(6, 182, 212, 0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(6, 182, 212, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '35px 35px',
          }}
        >
          <style>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-[#00d2ff] text-5xl animate-spin">progress_activity</span>
              <span className="text-slate-500 text-xs font-mono uppercase tracking-widest">Carregando telemetria...</span>
            </div>
          ) : (
            <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
              {/* Ambient Glow behind the map image based on active state */}
              {(() => {
                const getGlowColor = () => {
                  if (hasCriticalWOs) return 'rgba(244, 63, 94, 0.15)';
                  if (globalStats.corretivas > 0) return 'rgba(245, 158, 11, 0.12)';
                  if (globalStats.preventivas > 0) return 'rgba(6, 182, 212, 0.1)';
                  return 'rgba(16, 185, 129, 0.08)';
                };
                return (
                  <div
                    className="absolute w-3/4 h-3/4 rounded-full blur-3xl opacity-30 pointer-events-none select-none transition-all duration-1000"
                    style={{
                      background: `radial-gradient(circle, ${getGlowColor()} 0%, transparent 70%)`,
                    }}
                  />
                );
              })()}

              {/* Full bleed image covering container */}
              <img
                ref={imgRef}
                key={viewMode}
                src={MAP_IMAGES[viewMode] || MAP_IMAGES['3d']}
                alt="Planta Manequip"
                draggable={false}
                onLoad={() => recalcImgRect()}
                className="w-full h-full select-none pointer-events-none z-10"
                style={{
                  objectFit: 'cover',
                  imageRendering: 'auto',
                  filter: 'brightness(0.97) contrast(1.02) saturate(1.04)',
                }}
              />



              {/* ── Hotspot Overlay (Positioned exactly over image bounds) ── */}
              {imgRect && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${imgRect.left}px`,
                    top: `${imgRect.top}px`,
                    width: `${imgRect.width}px`,
                    height: `${imgRect.height}px`,
                  }}
                >
                  {/* Decorative Asset Tags */}
                  {(() => {
                    const DECORATIVE_TAGS = [
                      { x: 34, y: 52, label: '#OS01113', color: 'text-emerald-400' },
                      { x: 44, y: 46, label: 'MGDH1', color: 'text-slate-400' },
                      { x: 50, y: 54, label: '#OS0111E', color: 'text-[#00d2ff]' },
                      { x: 65, y: 48, label: 'AC5610', color: 'text-slate-400' },
                      { x: 74, y: 54, label: '#MTR001', color: 'text-amber-400' },
                      { x: 60, y: 32, label: '#CRN002', color: 'text-rose-400' },
                    ];

                    return DECORATIVE_TAGS.map((tag, idx) => (
                      <div
                        key={`tag-${idx}`}
                        className={`absolute z-0 select-none pointer-events-none font-mono text-[7px] font-black tracking-wider ${tag.color} bg-slate-950/40 px-1 py-0.5 rounded border border-slate-800/50 backdrop-blur-[1px]`}
                        style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                      >
                        {tag.label}
                      </div>
                    ));
                  })()}

                  {hotspots.filter(h => h.mapView === viewMode).map((hotspot) => {
                    const pos = { x: hotspot.x, y: hotspot.y };
                    const stats = getStats(hotspot.dbSector);
                    const activeProjects = mockProjects.filter((p) => p.dbSector === hotspot.dbSector);
                    const isSelected = selectedHotspot?.id === hotspot.id;
                    const isBeingDragged = draggingHotspotId === hotspot.id;

                    return (
                      <div
                        key={hotspot.id}
                        className={`absolute z-10 pointer-events-auto transition-all ${isBeingDragged ? 'duration-0' : 'duration-300'
                          } ease-out`}
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            if (editMode && isAdmin) { e.preventDefault(); setDraggingHotspotId(hotspot.id); }
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            if (editMode && isAdmin) { setDraggingHotspotId(hotspot.id); }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!editMode) {
                              setSelectedHotspot(hotspot);
                            } else if (isAdmin) {
                              setEditingHotspot(hotspot);
                              setIsAddingHotspot(false);
                            }
                          }}
                          className={`relative flex items-center gap-2 group ${editMode && isAdmin ? 'cursor-move' : 'cursor-pointer'
                            }`}
                        >
                          {/* Larger Pulsing neon indicators */}
                          <span className={`absolute rounded-full animate-ping ${stats.dotColor} opacity-40`} style={{ width: '42px', height: '42px', left: '-7px', top: '-7px' }}></span>
                          <span className={`absolute rounded-full ring-2 ${stats.pulseColor}`} style={{ width: '34px', height: '34px', left: '-3px', top: '-3px' }}></span>

                          {/* Sector thematic icon */}
                          <div
                            className={`relative flex items-center justify-center rounded-full border-2 border-white/20 ${stats.dotColor} z-10 transition-all duration-200 ${isSelected ? 'scale-[1.2] ring-2 ring-white/70 shadow-lg' : isBeingDragged ? 'scale-[1.3] ring-2 ring-amber-400 shadow-xl' : 'group-hover:scale-105'
                              }`}
                            style={{ width: '28px', height: '28px', boxShadow: stats.glowShadow }}
                          >
                            <span className="material-symbols-outlined text-white text-[13px] leading-none select-none">
                              {hotspot.icon || getSectorIcon(hotspot.dbSector)}
                            </span>
                            {/* Counter badge directly on the pin */}
                            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-0.5 rounded-full bg-slate-950 border border-white/20 text-[7px] font-black text-white font-mono z-20">
                              {stats.totalCount}
                            </span>
                          </div>

                          {/* Horizontal Glass Card (Visible only on hover) */}
                          <div
                            className={`absolute left-full ml-2 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100 transition-all duration-200 z-30 bg-[#0b1120]/55 backdrop-blur-md border ${isSelected ? 'border-[#00d2ff]/80 shadow-[0_0_15px_rgba(0,210,255,0.25)]' : 'border-slate-800/80 shadow-2xl'
                              } px-3 py-1.5 rounded-lg text-left min-w-[160px]`}
                          >
                            {/* Title Row */}
                            <div className="text-[9px] font-black text-white uppercase tracking-wide leading-tight mb-1 flex items-center justify-between gap-2">
                              <span className="truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{hotspot.name.split(' (')[0]}</span>
                            </div>

                            {/* Content Row */}
                            <div className="mt-1 flex flex-col gap-0.5">
                              {stats.totalCount === 0 ? (
                                <div className="text-emerald-400 text-[8px] font-bold flex items-center gap-1">
                                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span>Operacional</span>
                                </div>
                              ) : (() => {
                                const criticalWOs = stats.activeWOs.filter(
                                  (wo) => wo.tipo === 'Corretiva' && (wo.prioridade === 'Alta' || wo.prioridade === 'Crítica')
                                ).length;
                                const normalCorretivas = stats.corretivasCount - criticalWOs;
                                const preventivas = stats.preventivasCount;
                                const projects = activeProjects.length;

                                return (
                                  <div className="flex flex-col gap-1">
                                    <div className="text-[8.5px] font-bold text-slate-400 font-sans">
                                      OS Totais: <span className="text-white font-black">{stats.totalCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {criticalWOs > 0 && (
                                        <span className="size-4 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-400 flex items-center justify-center text-[7px] font-black font-mono shadow-sm" title={`${criticalWOs} Críticas`}>
                                          {criticalWOs}
                                        </span>
                                      )}
                                      {normalCorretivas > 0 && (
                                        <span className="size-4 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-400 flex items-center justify-center text-[7px] font-black font-mono shadow-sm" title={`${normalCorretivas} Corretivas`}>
                                          {normalCorretivas}
                                        </span>
                                      )}
                                      {preventivas > 0 && (
                                        <span className="size-4 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 flex items-center justify-center text-[7px] font-black font-mono shadow-sm" title={`${preventivas} Preventivas`}>
                                          {preventivas}
                                        </span>
                                      )}
                                      {projects > 0 && (
                                        <span className="size-4 rounded-full bg-violet-950/80 border border-violet-500/50 text-violet-400 flex items-center justify-center text-[7px] font-black font-mono shadow-sm" title={`${projects} Projetos`}>
                                          {projects}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>


                          {/* Admin remove button */}
                          {editMode && isAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveHotspot(hotspot.id); }}
                              className="absolute -top-2 -right-2 size-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center border border-rose-400 shadow-lg hover:scale-110 transition-transform z-30 cursor-pointer"
                              title="Remover indicador"
                            >×</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ SLIDE-OVER DETAIL SIDEBAR (Absolute positioned to keep map image fixed) ═══════ */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-0 right-0 h-full w-full md:w-[380px] border-l border-slate-800/80 bg-[#080d1a]/92 backdrop-blur-xl p-5 flex flex-col z-40 shadow-[0_0_40px_rgba(0,0,0,0.8)] transition-all duration-300 transform ${selectedHotspot && !editMode ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
            }`}
        >
          {selectedHotspot && (() => {
            const stats = getStats(selectedHotspot.dbSector);
            const activeProjects = mockProjects.filter((p) => p.dbSector === selectedHotspot.dbSector);

            // Filter tickets inside sidebar by category tabs
            const filteredWOs = stats.activeWOs.filter((wo) => {
              if (sidebarTab === 'todos') return true;
              if (sidebarTab === 'corretivas') return wo.tipo === 'Corretiva';
              if (sidebarTab === 'preventivas') return wo.tipo === 'Preventiva';
              return true;
            });

            const filteredPMs = stats.activePMs.filter(() => {
              if (sidebarTab === 'todos' || sidebarTab === 'preventivas') return true;
              return false;
            });

            return (
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[7px] text-[#00d2ff] font-black font-mono tracking-[0.2em] uppercase block">Telemetria de Setor</span>
                    <h3 className="text-white font-display font-extrabold text-sm leading-snug truncate">{selectedHotspot.name}</h3>
                    <span className="inline-block text-[8px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-mono tracking-wider">
                      {selectedHotspot.dbSector.toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedHotspot(null)}
                    className="p-1 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] block">close</span>
                  </button>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-900/30 p-3 rounded-lg border border-slate-850">
                  "{selectedHotspot.description}"
                </p>

                {/* KPIs grid */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Corretivas', value: stats.corretivasCount, color: 'rose' },
                    { label: 'Preventivas', value: stats.preventivasCount, color: 'cyan' },
                    { label: 'Projetos', value: stats.projectsCount, color: 'violet' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`p-2.5 rounded-xl bg-${color}-950/20 border border-${color}-500/20 text-center`}>
                      <span className={`text-[7px] font-black text-${color}-500/80 uppercase tracking-widest block font-mono`}>{label}</span>
                      <p className={`text-base font-black text-${color}-400 mt-0.5 font-mono`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Split bar showing mix percentage of corretivas vs preventivas */}
                {stats.totalCount > 0 && (
                  <div className="space-y-1 bg-slate-900/40 p-2.5 rounded-xl border border-slate-850">
                    <div className="flex justify-between text-[7px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>Mix de Chamados</span>
                      <span className="font-mono text-slate-400">
                        {stats.corretivasCount} Corretivas / {stats.preventivasCount} Preventivas
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900 flex">
                      {stats.corretivasCount > 0 && (
                        <div
                          className="h-full bg-rose-500"
                          style={{ width: `${(stats.corretivasCount / (stats.corretivasCount + stats.preventivasCount || 1)) * 100}%` }}
                          title="Corretivas"
                        ></div>
                      )}
                      {stats.preventivasCount > 0 && (
                        <div
                          className="h-full bg-cyan-500"
                          style={{ width: `${(stats.preventivasCount / (stats.corretivasCount + stats.preventivasCount || 1)) * 100}%` }}
                          title="Preventivas"
                        ></div>
                      )}
                    </div>
                  </div>
                )}

                {/* Custom internal tabs for list filtering */}
                <div className="space-y-2 flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-cyan-400">build_circle</span>
                      Chamados ({filteredWOs.length + filteredPMs.length})
                    </h4>
                  </div>

                  <div className="flex bg-slate-950/60 border border-slate-800/80 rounded-lg p-0.5">
                    {(['todos', 'corretivas', 'preventivas'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSidebarTab(tab)}
                        className={`flex-1 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${sidebarTab === tab
                          ? 'bg-[#00d2ff]/15 text-[#00d2ff] border border-[#00d2ff]/20 shadow-sm'
                          : 'text-slate-500 hover:text-white'
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Scrollable list */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-850">
                    {filteredWOs.length === 0 && filteredPMs.length === 0 ? (
                      <p className="text-slate-600 text-[10px] italic font-mono text-center py-6">Nenhum chamado aberto nesta categoria.</p>
                    ) : (
                      <>
                        {filteredWOs.map((wo) => (
                          <div
                            key={wo.id}
                            onClick={() => navigate(`/app/ticket/${wo.id}`)}
                            className="p-3 rounded-lg bg-slate-900/30 border border-slate-850 hover:border-[#00d2ff]/30 transition-all flex justify-between items-center cursor-pointer group"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[10px] font-bold text-slate-200 group-hover:text-[#00d2ff] transition-colors truncate block max-w-[170px]">
                                  {wo.title || wo.descricao}
                                </span>
                                {wo.status && (
                                  <span className={`text-[6px] font-black px-1 py-0.5 rounded uppercase tracking-wide shrink-0 ${wo.status === 'Aberta' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    wo.status === 'Em Andamento' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                      wo.status === 'Pendente' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                    {wo.status}
                                  </span>
                                )}
                              </div>
                              <span className="text-[8px] text-slate-500 font-mono block">
                                #{wo.display_id || wo.id.slice(0, 5)} • {wo.tipo}
                              </span>
                            </div>
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase border ${wo.prioridade === 'Alta' || wo.prioridade === 'Crítica'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/25 animate-pulse'
                              : 'bg-slate-900 text-slate-400 border-slate-850'
                              }`}>
                              {wo.prioridade}
                            </span>
                          </div>
                        ))}

                        {filteredPMs.map((pm) => (
                          <div
                            key={pm.id}
                            onClick={() => navigate(`/app/ticket/${pm.id}`)}
                            className="p-3 rounded-lg bg-slate-900/30 border border-slate-850 hover:border-cyan-500/30 transition-all flex justify-between items-center cursor-pointer group"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[10px] font-bold text-slate-200 group-hover:text-cyan-400 transition-colors truncate block max-w-[170px]">
                                  {pm.titulo}
                                </span>
                                {pm.status && (
                                  <span className={`text-[6px] font-black px-1 py-0.5 rounded uppercase tracking-wide shrink-0 ${pm.status === 'Em Aberto' || pm.status === 'Pendente' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    pm.status === 'Em Execução' || pm.status === 'Em Andamento' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                    {pm.status}
                                  </span>
                                )}
                              </div>
                              <span className="text-[8px] text-slate-500 font-mono block">
                                #{pm.id.slice(0, 4).toUpperCase()} • Preventiva
                              </span>
                            </div>
                            <span className="text-[7px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-1.5 py-0.5 rounded uppercase">
                              {pm.status}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Collapsible Projects Accordion */}
                <div className="space-y-2 shrink-0 border-t border-slate-900 pt-3">
                  <button
                    onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                    className="w-full flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-violet-400">account_tree</span>
                      <span>Obras em Andamento ({activeProjects.length})</span>
                    </div>
                    <span
                      className="material-symbols-outlined text-[16px] transition-transform duration-200"
                      style={{ transform: isAccordionOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      keyboard_arrow_down
                    </span>
                  </button>

                  {isAccordionOpen && (
                    <div className="space-y-2 pt-1 transition-all duration-200">
                      {activeProjects.length === 0 ? (
                        <p className="text-slate-600 text-[10px] italic font-mono text-center py-2">Nenhum projeto neste setor.</p>
                      ) : (
                        activeProjects.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => navigate('/app/projects')}
                            className="p-3 rounded-xl bg-slate-900/30 border border-slate-850 hover:border-violet-500/30 transition-all cursor-pointer group"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <span className="text-[11px] font-black text-slate-200 group-hover:text-violet-400 transition-colors block truncate">{p.name}</span>
                                <span className="text-[8px] text-slate-500 font-mono">{p.coordinator}</span>
                              </div>
                              <span className={`shrink-0 text-[7px] font-black px-1.5 py-0.5 rounded border uppercase ${p.status === 'Prazos Críticos'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/25 animate-pulse'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                }`}>
                                {p.status}
                              </span>
                            </div>
                            <div className="mt-2.5">
                              <div className="flex justify-between text-[8px] text-slate-500 font-bold mb-1">
                                <span>Progresso</span>
                                <span>{p.progress}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                                <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400" style={{ width: `${p.progress}%` }}></div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Map;
