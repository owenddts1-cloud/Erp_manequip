import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line, ComposedChart, LabelList } from 'recharts';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import NotificationPopover from '../components/NotificationPopover';
import { usePreferences } from '../contexts/PreferencesContext';
import { calculateAssetRUL } from '../services/predictionService';

const calculateDelay = (dataLimiteStr: string) => {
  if (!dataLimiteStr) return '';
  const currentDate = new Date();
  const limitDate = new Date(dataLimiteStr + 'T00:00:00');
  const diffTime = currentDate.getTime() - limitDate.getTime();
  if (diffTime <= 0) return '';

  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays >= 30) {
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    if (months === 1) {
      return days > 0 ? `1 mês e ${days} ${days === 1 ? 'dia' : 'dias'}` : `1 mês`;
    } else {
      return days > 0 ? `${months} meses e ${days} ${days === 1 ? 'dia' : 'dias'}` : `${months} meses`;
    }
  } else {
    return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
  }
};

const getDaysDelayed = (dataLimiteStr: string) => {
  if (!dataLimiteStr) return 0;
  const currentDate = new Date();
  const limitDate = new Date(dataLimiteStr + 'T00:00:00');
  const diffTime = currentDate.getTime() - limitDate.getTime();
  if (diffTime <= 0) return 0;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const CustomChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const title = label || payload[0].payload.name;
    return (
      <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-slate-200 text-xs p-3.5 rounded-xl shadow-2xl font-mono">
        {title && (
          <p className="font-bold text-white border-b border-slate-800/80 pb-1.5 mb-1.5">{title}</p>
        )}
        <div className="space-y-1.5">
          {payload.map((p: any, idx: number) => {
            const formattedValue = typeof p.value === 'number' ? p.value.toLocaleString('pt-BR') : p.value;
            const unit = p.unit || '';
            const percentStr = p.payload?.percentage !== undefined && p.name !== 'Total' ? ` (${p.payload.percentage}%)` : '';
            return (
              <div key={idx} className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: p.color || p.fill }}></span>
                  {p.name || p.dataKey}:
                </span>
                <span className="font-bold text-cyan-400">
                  {formattedValue}{unit}{percentStr}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-slate-200 text-xs p-3.5 rounded-xl shadow-2xl font-mono">
        <p className="font-bold text-white border-b border-slate-800/80 pb-1.5 mb-1.5">{data.name}</p>
        <p className="text-sm font-black text-cyan-400">{data.count} chamados</p>
        <p className="text-[10px] text-slate-400 font-medium">{data.percentage}% do total</p>
      </div>
    );
  }
  return null;
};

const Custom3DBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  if (width === 0 || height === 0) return null;

  const depth = 6;
  const topPath = `M ${x} ${y} L ${x + depth} ${y - depth} L ${x + width + depth} ${y - depth} L ${x + width} ${y} Z`;
  const rightPath = `M ${x + width} ${y} L ${x + width + depth} ${y - depth} L ${x + width + depth} ${y + height - depth} L ${x + width} ${y + height} Z`;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="none" />
      <path d={topPath} fill={fill} style={{ filter: 'brightness(1.15)' }} />
      <path d={rightPath} fill={fill} style={{ filter: 'brightness(0.85)' }} />
    </g>
  );
};

interface ExcelPie3DProps {
  pieData: any[];
  isMobile: boolean;
}

const ExcelPie3D: React.FC<ExcelPie3DProps> = ({ pieData, isMobile }) => {
  const [hoveredSlice, setHoveredSlice] = React.useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const totalPie = React.useMemo(() => {
    return pieData.reduce((sum, item) => sum + item.value, 0);
  }, [pieData]);

  // Dimension settings depending on mobile vs desktop
  const width = isMobile ? 150 : 220;
  const height = isMobile ? 150 : 220;
  const cx = isMobile ? 75 : 110;
  const cy = isMobile ? 68 : 100;
  const rx = isMobile ? 58 : 82;
  const ry = isMobile ? 34 : 48;
  const depth = isMobile ? 14 : 20;
  const explodeDistance = isMobile ? 4 : 6;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTooltipPos({ x, y });
  };

  const handleMouseLeave = () => {
    setHoveredSlice(null);
  };

  // If there's no data, render an empty slate-gray 3D cylinder
  if (totalPie === 0) {
    return (
      <div className="relative" style={{ width, height }}>
        {/* Shadow */}
        <div 
          className="absolute bg-black/60 rounded-full blur-md -z-10"
          style={{
            width: rx * 2,
            height: ry * 2,
            left: cx - rx,
            top: cy + depth - (ry * 0.2),
            opacity: 0.5
          }}
        />
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Side wall */}
          <path
            d={`M ${cx + rx} ${cy} L ${cx + rx} ${cy + depth} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy + depth} L ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy}`}
            fill="#0f172a"
            stroke="#1e293b"
            strokeWidth={1}
          />
          {/* Top ellipse */}
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
          {/* Text inside pie */}
          <text x={cx} y={cy + 4} textAnchor="middle" fill="#64748b" style={{ fontSize: 10, fontWeight: 'bold' }}>
            Sem chamados
          </text>
        </svg>
      </div>
    );
  }

  // Calculate angles and percentages for slices
  const slices = React.useMemo(() => {
    let currentAngle = -Math.PI / 2; // Start at 12 o'clock
    return pieData
      .map((item, index) => {
        if (item.value === 0) return null;
        const angleSize = (item.value / totalPie) * 2 * Math.PI;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angleSize;
        currentAngle = endAngle;
        const midAngle = (startAngle + endAngle) / 2;
        return {
          ...item,
          index,
          startAngle,
          endAngle,
          midAngle,
          percentage: Math.round((item.value / totalPie) * 100)
        };
      })
      .filter(Boolean) as any[];
  }, [pieData, totalPie]);

  // Painter's Algorithm: sort slices from back to front
  // Since Y goes down, sin(midAngle) represents depth (smaller/more negative = further back)
  const sortedSlices = React.useMemo(() => {
    return [...slices].sort((a, b) => Math.sin(a.midAngle) - Math.sin(b.midAngle));
  }, [slices]);

  return (
    <div className="relative font-sans" style={{ width, height }}>
      {/* Dynamic 3D Pie Shadow */}
      <div 
        className="absolute bg-black/60 rounded-full blur-md -z-10 transition-all duration-300"
        style={{
          width: rx * 2,
          height: ry * 2,
          left: cx - rx,
          top: cy + depth - (ry * 0.2),
          opacity: 0.65
        }}
      />

      <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="overflow-visible"
      >
        <defs>
          {/* Top Gradients */}
          <linearGradient id="customPieAtendimento" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="customPieConcluidos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Side Gradients with Cylindrical Specs highlighting */}
          <linearGradient id="customPieAtendimentoSide" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="35%" stopColor="#2563eb" />
            <stop offset="70%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id="customPieConcluidosSide" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="35%" stopColor="#10b981" />
            <stop offset="70%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
        </defs>

        {sortedSlices.map((slice) => {
          const isHovered = hoveredSlice === slice.index;
          
          // Calculate explosion displacement offset
          let scx = cx;
          let scy = cy;
          if (isHovered) {
            scx += explodeDistance * Math.cos(slice.midAngle);
            scy += explodeDistance * Math.sin(slice.midAngle);
          }

          // Case: 100% slice (single slice)
          if (slice.percentage >= 99.9) {
            const fillTop = slice.index === 0 ? "url(#customPieAtendimento)" : "url(#customPieConcluidos)";
            const fillSide = slice.index === 0 ? "url(#customPieAtendimentoSide)" : "url(#customPieConcluidosSide)";
            const strokeColor = slice.index === 0 ? "#1e40af" : "#065f46";
            
            return (
              <g 
                key={slice.name}
                onMouseEnter={() => setHoveredSlice(slice.index)}
                className="cursor-pointer transition-all duration-300"
              >
                {/* 100% Cylinder Side wall (front half) */}
                <path
                  d={`M ${scx + rx} ${scy} L ${scx + rx} ${scy + depth} A ${rx} ${ry} 0 0 1 ${scx - rx} ${scy + depth} L ${scx - rx} ${scy} A ${rx} ${ry} 0 0 0 ${scx + rx} ${scy}`}
                  fill={fillSide}
                  stroke={strokeColor}
                  strokeWidth={0.5}
                />
                {/* 100% Top ellipse */}
                <ellipse 
                  cx={scx} 
                  cy={scy} 
                  rx={rx} 
                  ry={ry} 
                  fill={fillTop} 
                  stroke={strokeColor} 
                  strokeWidth={1.5}
                />
              </g>
            );
          }

          // Case: standard slice (< 100%)
          const P1 = {
            x: scx + rx * Math.cos(slice.startAngle),
            y: scy + ry * Math.sin(slice.startAngle)
          };
          const P2 = {
            x: scx + rx * Math.cos(slice.endAngle),
            y: scy + ry * Math.sin(slice.endAngle)
          };
          const P1_bot = { x: P1.x, y: P1.y + depth };
          const P2_bot = { x: P2.x, y: P2.y + depth };
          const largeArc = (slice.endAngle - slice.startAngle > Math.PI) ? 1 : 0;

          const fillTop = slice.index === 0 ? "url(#customPieAtendimento)" : "url(#customPieConcluidos)";
          const fillSide = slice.index === 0 ? "url(#customPieAtendimentoSide)" : "url(#customPieConcluidosSide)";
          const strokeColor = slice.index === 0 ? "#1e40af" : "#065f46";

          return (
            <g
              key={slice.name}
              onMouseEnter={() => setHoveredSlice(slice.index)}
              className="cursor-pointer"
            >
              {/* 1. Flat Center-to-P1 side wall */}
              <path
                d={`M ${scx} ${scy} L ${P1.x} ${P1.y} L ${P1_bot.x} ${P1_bot.y} L ${scx} ${scy + depth} Z`}
                fill={fillSide}
                stroke={strokeColor}
                strokeWidth={0.5}
                style={{ filter: 'brightness(0.85)' }}
              />

              {/* 2. Flat Center-to-P2 side wall */}
              <path
                d={`M ${scx} ${scy} L ${P2.x} ${P2.y} L ${P2_bot.x} ${P2_bot.y} L ${scx} ${scy + depth} Z`}
                fill={fillSide}
                stroke={strokeColor}
                strokeWidth={0.5}
                style={{ filter: 'brightness(0.95)' }}
              />

              {/* 3. Curved Outer wall */}
              <path
                d={`M ${P1.x} ${P1.y} L ${P1_bot.x} ${P1_bot.y} A ${rx} ${ry} 0 ${largeArc} 1 ${P2_bot.x} ${P2_bot.y} L ${P2.x} ${P2.y} A ${rx} ${ry} 0 ${largeArc} 0 ${P1.x} ${P1.y}`}
                fill={fillSide}
                stroke={strokeColor}
                strokeWidth={0.5}
              />

              {/* 4. Top Face slice */}
              <path
                d={`M ${scx} ${scy} L ${P1.x} ${P1.y} A ${rx} ${ry} 0 ${largeArc} 1 ${P2.x} ${P2.y} Z`}
                fill={fillTop}
                stroke={strokeColor}
                strokeWidth={1.5}
              />
            </g>
          );
        })}
      </svg>

      {/* Floating 3D Specular glassmorphism tooltip (Normal flat, not rotated/tilted) */}
      {hoveredSlice !== null && (() => {
        const hoveredData = pieData[hoveredSlice];
        if (!hoveredData || hoveredData.value === 0) return null;
        const pct = Math.round((hoveredData.value / totalPie) * 100);
        return (
          <div
            className="absolute bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 text-slate-200 text-[10px] p-2.5 rounded-xl shadow-2xl font-mono pointer-events-none z-50 transition-all duration-75"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              transform: 'translate(-50%, -115%)',
            }}
          >
            <p className="font-bold text-white border-b border-slate-800/80 pb-0.5 mb-1 truncate">{hoveredData.name.toUpperCase()}</p>
            <p className="text-[11px] font-black text-cyan-400">{hoveredData.value} chamados</p>
            <p className="text-[9px] text-slate-400 font-medium">{pct}% do total</p>
          </div>
        );
      })()}
    </div>
  );
};

const isPreviousMonthOrOlder = (dataLimiteStr: string | null) => {
  if (!dataLimiteStr) return false;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  
  const parts = dataLimiteStr.split('-');
  if (parts.length < 2) return false;
  const limitYear = Number(parts[0]);
  const limitMonth = Number(parts[1]) - 1; // 0-indexed
  
  if (limitYear < currentYear) return true;
  if (limitYear === currentYear && limitMonth < currentMonth) return true;
  return false;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t, formatDate, userProfile } = usePreferences();
  const [stats, setStats] = React.useState({
    assets: 0,
    inventory: 0,
    criticalInventory: 0,
    tickets: 0,
    criticalTickets: 0,
    cost: 0,
    preventivesTotal: 0,
    preventivesDone: 0,
    operationalAssets: 0,
    alertAssets: 0,
    criticalAssets: 0
  });

  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [upcomingPreventives, setUpcomingPreventives] = React.useState<any[]>([]);
  const [allWOs, setAllWOs] = React.useState<any[]>([]);
  const [allPMs, setAllPMs] = React.useState<any[]>([]);
  const [chartTypeFilter, setChartTypeFilter] = React.useState<'Todos' | 'Preventiva' | 'Corretiva'>('Todos');
  const [chartPeriodFilter, setChartPeriodFilter] = React.useState<'mensal' | 'trimestral' | 'semestral' | 'anual'>('mensal');
  const [prevChartPeriodFilter, setPrevChartPeriodFilter] = React.useState<'mensal' | 'trimestral' | 'semestral' | 'anual'>('mensal');

  const [recentTickets, setRecentTickets] = React.useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);

  const [pieMonth, setPieMonth] = React.useState(new Date().getMonth() + 1);
  const [pieYear, setPieYear] = React.useState(new Date().getFullYear());
  const [pieStats, setPieStats] = React.useState({ emAtendimento: 0, concluidos: 0 });
  const [pieChartMode, setPieChartMode] = React.useState<'rosca' | 'pizza2d' | 'pizza3d' | 'barras' | 'colunas3d' | 'histograma'>('rosca');
  const [pieTypeFilter, setPieTypeFilter] = React.useState<'Todos' | 'Preventiva' | 'Corretiva'>('Preventiva');
  const [pieHistogramData, setPieHistogramData] = React.useState<any[]>([]);

  const [delayedTickets, setDelayedTickets] = React.useState<any[]>([]);
  const [delayedFilter, setDelayedFilter] = React.useState<'todos' | '1_mes'>('todos');
  const [techChartData, setTechChartData] = React.useState<any[]>([]);
  const [techPeriodFilter, setTechPeriodFilter] = React.useState<number>(new Date().getMonth() + 1);
  const [generalStatusData, setGeneralStatusData] = React.useState<any[]>([]);
  const [generalStatusView, setGeneralStatusView] = React.useState<'empilhado' | 'linhas'>('empilhado');
  const [rulAlerts, setRulAlerts] = React.useState<any[]>([]);
  const [assetsTelemetry, setAssetsTelemetry] = React.useState<any[]>([]);

  // Sorting state for Chamados Recentes table
  const [sortKey, setSortKey] = React.useState<string>('created_at');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  // Sorting state for Chamados em Atraso table
  const [delayedSortKey, setDelayedSortKey] = React.useState<string>('tempo_atraso');
  const [delayedSortOrder, setDelayedSortOrder] = React.useState<'asc' | 'desc'>('asc');

  const handleDelayedSort = (key: string) => {
    if (delayedSortKey === key) {
      setDelayedSortOrder(delayedSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setDelayedSortKey(key);
      setDelayedSortOrder('asc');
    }
  };

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
          link: `/app/ticket/${wo.id}`
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

  const downloadXLS = () => {
    const headers = ['ID', 'Ativo', 'Status', 'Tipo', 'Responsável', 'Última Edição', 'Data de Criação'];
    const rows = recentTickets.map(wo => [
      wo.display_id || wo.id.slice(0, 5),
      wo.ativos?.nome || 'Geral',
      wo.status,
      wo.tipo,
      wo.created_by?.full_name || wo.tecnico_responsavel?.full_name || '---',
      wo.last_edited_by?.full_name || '-',
      new Date(wo.created_at).toLocaleDateString('pt-BR')
    ]);

    const colCount = headers.length;
    const getExcelColumnLetter = (colIdx: number): string => {
      let letter = '';
      let temp = colIdx;
      while (temp >= 0) {
        letter = String.fromCharCode((temp % 26) + 65) + letter;
        temp = Math.floor(temp / 26) - 1;
      }
      return letter;
    };

    // Calculate metrics for KPI cards from recentTickets
    const totalCount = recentTickets.length;
    const completedCount = recentTickets.filter(t => ['concluída', 'concluído', 'finalizada', 'finalizado', 'concluido', 'finalizado'].includes((t.status || '').toLowerCase().trim())).length;
    const pendingCount = totalCount - completedCount;

    const cardSpan = Math.max(1, Math.floor((colCount - 2) / 3));
    const card3Span = colCount - 2 - (cardSpan * 2);

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Chamados_Recentes</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11px; }
          
          /* Title Header Banner */
          .title-banner { background-color: #0f294a; color: #ffffff; font-size: 16px; font-weight: bold; padding: 12px; text-align: center; }
          .meta-banner { background-color: #1e3a8a; color: #e2e8f0; font-size: 10px; padding: 6px; text-align: center; }
          
          /* KPI Cards */
          .kpi-label { color: #64748b; font-size: 9px; font-weight: bold; text-transform: uppercase; }
          .kpi-value { color: #0f294a; font-size: 14px; font-weight: bold; }
          .kpi-card { border: 2px solid #e2e8f0; background-color: #f8fafc; padding: 10px; text-align: center; }
          
          /* Headers & Data Rows */
          th { background-color: #0f294a; color: #ffffff; font-weight: bold; border: 1px solid #334155; padding: 8px 12px; font-size: 11px; }
          td { border: 1px solid #cbd5e1; padding: 6px 12px; text-align: left; color: #334158; }
          tr:nth-child(even) td { background-color: #f8fafc; } /* Zebra striping */
          
          /* Aligns and Formats */
          .number { text-align: right; }
          
          /* Status Capsules */
          .status-concluido { background-color: #dcfce7; color: #16a34a; font-weight: bold; text-align: center; }
          .status-execucao { background-color: #e0f2fe; color: #2563eb; font-weight: bold; text-align: center; }
          .status-critico { background-color: #fee2e2; color: #b91c1c; font-weight: bold; text-align: center; }
          .status-geral { background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: center; }
          
          /* Total Row */
          .total-row td { background-color: #e2e8f0; font-weight: bold; color: #0f294a; border-top: 2px solid #0f294a; border-bottom: 2px solid #0f294a; }
        </style>
      </head>
      <body>
        <table>
          <!-- 1. Title Banner Row -->
          <tr>
            <td colspan="${colCount}" class="title-banner">Manequip 360 - Painel de Chamados Recentes</td>
          </tr>
          <!-- 2. Meta Info Row -->
          <tr>
            <td colspan="${colCount}" class="meta-banner">Gerado em: ${new Date().toLocaleString('pt-BR')} | Relatório Executivo</td>
          </tr>
          <!-- 3. Spacing Row -->
          <tr><td colspan="${colCount}" style="border:none; height: 10px;"></td></tr>
          
          <!-- 4. KPI Cards Row -->
          <tr>
            <td colspan="${cardSpan}" class="kpi-card">
              <span class="kpi-label">Total de Chamados</span><br/>
              <span class="kpi-value">${totalCount}</span>
            </td>
            <td style="border:none;"></td>
            <td colspan="${cardSpan}" class="kpi-card">
              <span class="kpi-label">Concluídos</span><br/>
              <span class="kpi-value" style="color: #16a34a;">${completedCount}</span>
            </td>
            <td style="border:none;"></td>
            <td colspan="${card3Span}" class="kpi-card">
              <span class="kpi-label">Em Aberto</span><br/>
              <span class="kpi-value" style="color: ${pendingCount > 0 ? '#b91c1c' : '#16a34a'};">${pendingCount}</span>
            </td>
          </tr>
          <!-- 5. Spacing Row -->
          <tr><td colspan="${colCount}" style="border:none; height: 15px;"></td></tr>
 
          <!-- 6. Table Header -->
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <!-- 7. Data Rows -->
            ${rows.map(row => `
              <tr>
                ${row.map((val: any, colIdx: number) => {
                  const header = headers[colIdx];
                  
                  // Check status
                  if (header === 'Status') {
                    const statusLower = String(val || '').toLowerCase().trim();
                    if (['concluída', 'concluído', 'finalizada', 'finalizado', 'concluido'].includes(statusLower)) {
                      return `<td class="status-concluido">Concluído</td>`;
                    }
                    if (['em atendimento', 'em progresso', 'andamento', 'execução', 'em execução'].includes(statusLower)) {
                      return `<td class="status-execucao">Em Execução</td>`;
                    }
                    if (['atrasada', 'atrasado', 'crítico', 'critico', 'prazos críticos'].includes(statusLower)) {
                      return `<td class="status-critico">Crítico</td>`;
                    }
                    return `<td class="status-geral">${val}</td>`;
                  }
                  
                  return `<td>${val ?? ''}</td>`;
                }).join('')}
              </tr>
            `).join('')}
 
            <!-- 8. Totals Row with Live Excel Formulas -->
            <tr class="total-row">
              <td>TOTAL</td>
              <td colspan="${colCount - 2}">---</td>
              <td class="number">=COUNTA(A7:A${6 + rows.length})</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `chamados_recentes_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
  };


  React.useEffect(() => {
    fetchDashboardData();
  }, [techPeriodFilter]);

  React.useEffect(() => {
    // Subscribe to realtime changes
    const subscription = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chamados' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ativos' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'preventivas_mensais' }, fetchDashboardData)
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Assets count
      const { count: assetsCount } = await supabase.from('ativos').select('*', { count: 'exact', head: true });

      // Inventory count & critical inventory
      const { data: invData } = await supabase.from('inventario').select('quantidade_estoque, estoque_minimo');
      const inventoryCount = invData?.length || 0;
      const criticalInventoryCount = invData?.filter(i => i.quantidade_estoque <= (i.estoque_minimo || 0)).length || 0;

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const todayStr = now.toISOString().split('T')[0];
      const { count: ticketsCount } = await supabase.from('work_orders').select('*', { count: 'exact', head: true }).neq('status', 'Concluída');
      const { count: prevOpenCount } = await supabase
        .from('preventivas_mensais')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Em atendimento')
        .eq('ano', currentYear)
        .eq('mes', currentMonth);
      const { count: criticalCount } = await supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('prioridade', 'Alta').neq('status', 'Concluída');

      // Fetch Upcoming Preventives from preventivas_mensais (current month onwards)
      const { data: preventives } = await supabase
        .from('preventivas_mensais')
        .select(`
            *,
            ativos (nome, setor)
          `)
        .eq('status', 'Em atendimento')
        .gte('data_limite', todayStr)
        .order('data_limite', { ascending: true })
        .limit(7);

      setUpcomingPreventives(preventives || []);

      // Fetch Recent Tickets (Now with Emails and Editor Names)
      const { data: recents } = await supabase
        .from('work_orders')
        .select(`
            *, 
            ativos (nome),
            created_by (full_name),
            tecnico_responsavel (full_name),
            last_edited_by (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentsPM } = await supabase
        .from('preventivas_mensais')
        .select(`
            *,
            ativos (nome),
            tecnico_responsavel:tecnico_responsavel (full_name),
            tecnico_responsavel_2:tecnico_responsavel_2 (full_name)
        `)
        .or(`ano.lt.${currentYear},and(ano.eq.${currentYear},mes.lte.${currentMonth})`)
        .order('created_at', { ascending: false })
        .limit(5);

      const mappedWOs = (recents || []).map(wo => ({
        ...wo,
        isPreventiveTable: false
      }));

      const mappedPMs = (recentsPM || []).map(pm => {
        let displayTech = null;
        const tech1 = pm.tecnico_responsavel as any;
        const tech2 = pm.tecnico_responsavel_2 as any;
        if (tech1 || tech2) {
          displayTech = {
            full_name: [
              tech1?.full_name,
              tech2?.full_name
            ].filter(Boolean).join(' / ')
          };
        }
        return {
          id: pm.id,
          display_id: `PM-${pm.id.slice(0, 4).toUpperCase()}`,
          ativos: pm.ativos || { nome: 'Geral' },
          status: pm.status,
          tipo: 'Preventiva',
          tecnico_responsavel: displayTech,
          created_by: null,
          last_edited_by: null,
          created_at: pm.created_at,
          isPreventiveTable: true
        };
      });

      const mergedRecents = [...mappedWOs, ...mappedPMs]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setRecentTickets(mergedRecents);

      // Fetch total cost
      const { data: costData } = await supabase
        .from('work_orders')
        .select('custo_total')
        .or('status.eq.Concluída,status.eq.Finalizada,status.eq.Concluído,status.eq.Finalizado,status.eq.concluido,status.eq.finalizado');


      const totalCost = costData?.reduce((acc, curr) => acc + (Number(curr.custo_total) || 0), 0) || 0;

      // Fetch monthly preventives count (using the already declared currentMonth and currentYear)
      const { data: monthPreventives } = await supabase
        .from('preventivas_mensais')
        .select('status')
        .eq('mes', currentMonth)
        .eq('ano', currentYear);

      const totalPrev = monthPreventives?.length || 0;
      const donePrev = monthPreventives?.filter(p => p.status === 'Concluído').length || 0;

      // Fetch status counts for mobile dashboard
      const { data: assetsData } = await supabase.from('ativos').select('status');
      const opAssets = assetsData?.filter(a => a.status && a.status.trim().toLowerCase() === 'operacional').length || 0;
      const alAssets = assetsData?.filter(a => a.status && (a.status.trim().toLowerCase() === 'em alerta' || a.status.trim().toLowerCase() === 'alerta')).length || 0;
      const critAssets = assetsData?.filter(a => a.status && (a.status.trim().toLowerCase() === 'crítico' || a.status.trim().toLowerCase() === 'parado' || a.status.trim().toLowerCase() === 'crítico (a)')).length || 0;

      // Stats
      setStats({
        assets: assetsCount || 0,
        inventory: inventoryCount || 0,
        criticalInventory: criticalInventoryCount,
        tickets: (ticketsCount || 0) + (prevOpenCount || 0),
        criticalTickets: criticalCount || 0,
        cost: totalCost,
        preventivesTotal: totalPrev,
        preventivesDone: donePrev,
        operationalAssets: opAssets,
        alertAssets: alAssets,
        criticalAssets: critAssets
      });

      // Chart Data
      const { data: wos } = await supabase
        .from('work_orders')
        .select('tipo, status, created_at')
        .order('created_at', { ascending: true });

      const { data: pms } = await supabase
        .from('preventivas_mensais')
        .select('mes, ano, status, created_at')
        .order('created_at', { ascending: true });

      setAllWOs(wos || []);
      setAllPMs(pms || []);

      // Fetch open work orders for delays
      const { data: openWOs } = await supabase
        .from('work_orders')
        .select(`
          id, display_id, status, tipo, created_at, data_limite,
          ativos (nome),
          created_by (full_name),
          tecnico_responsavel (full_name)
        `);

      // Fetch open preventives for delays
      const { data: openPMs } = await supabase
        .from('preventivas_mensais')
        .select(`
          id, status, created_at, data_limite, mes, ano,
          ativos (nome),
          tecnico_responsavel:tecnico_responsavel (full_name),
          tecnico_responsavel_2:tecnico_responsavel_2 (full_name)
        `)
        .eq('status', 'Em atendimento');

      const currentDate = new Date();

      const mappedOpenWOs = (openWOs || [])
        .filter(wo => {
          const st = (wo.status || '').toLowerCase();
          return !['concluída', 'concluído', 'finalizada', 'finalizado', 'concluido', 'finalizado'].includes(st);
        })
        .map(wo => ({
          ...wo,
          isPreventiveTable: false
        }));

      const mappedOpenPMs = (openPMs || []).map(pm => {
        let displayTech = null;
        const tech1 = pm.tecnico_responsavel as any;
        const tech2 = pm.tecnico_responsavel_2 as any;
        if (tech1 || tech2) {
          displayTech = {
            full_name: [
              tech1?.full_name,
              tech2?.full_name
            ].filter(Boolean).join(' / ')
          };
        }
        return {
          id: pm.id,
          display_id: `PM-${pm.id.slice(0, 4).toUpperCase()}`,
          ativos: pm.ativos || { nome: 'Geral' },
          status: pm.status,
          tipo: 'Preventiva',
          tecnico_responsavel: displayTech,
          created_by: null,
          last_edited_by: null,
          created_at: pm.created_at,
          data_limite: pm.data_limite,
          isPreventiveTable: true
        };
      });

      const mergedOpen = [...mappedOpenWOs, ...mappedOpenPMs];
      const delayed = mergedOpen.filter(t => {
        if (!t.data_limite) return false;
        const limitDate = new Date(t.data_limite + 'T00:00:00');
        return limitDate < currentDate;
      });

      setDelayedTickets(delayed);

      // Fetch all work orders for technician and status charts
      const { data: wosStatus } = await supabase
        .from('work_orders')
        .select(`
          id,
          status,
          tipo,
          created_at,
          tecnico_responsavel (full_name)
        `);

      const { data: pmsStatus } = await supabase
        .from('preventivas_mensais')
        .select(`
          id,
          status,
          created_at,
          mes,
          ano,
          tecnico_responsavel:tecnico_responsavel (full_name),
          tecnico_responsavel_2:tecnico_responsavel_2 (full_name)
        `);

      const allWOsList = wosStatus || [];
      const allPMsList = pmsStatus || [];

      // Fetch all technicians from profiles to populate list and prevent missing any
      const { data: techProfiles } = await supabase
        .from('profiles')
        .select('full_name, role')
        .or('role.eq.Técnico,full_name.eq.Guilherme');

      const invalidTechs = ['Thiago', 'Administrador do Sistema', 'Lanucci Admin'];
      const validTechList = techProfiles?.map(p => p.full_name).filter(name => name && !invalidTechs.includes(name)) || [];

      // 1. Process Technician Chart Data
      const techMap: Record<string, { name: string, em_atendimento: number, pendentes: number, concluidos: number, total: number }> = {};

      if (techProfiles) {
        techProfiles.forEach(p => {
          if (p.full_name && !invalidTechs.includes(p.full_name)) {
            techMap[p.full_name] = { name: p.full_name, em_atendimento: 0, pendentes: 0, concluidos: 0, total: 0 };
          }
        });
      }
      // Ensure 'Não Atribuído' is in the map
      techMap['Não Atribuído'] = { name: 'Não Atribuído', em_atendimento: 0, pendentes: 0, concluidos: 0, total: 0 };

      const checkTechPeriod = (item: any) => {
        let ticketDate: Date;
        if (item.ano && item.mes) {
          ticketDate = new Date(item.ano, item.mes - 1, 15);
        } else if (item.created_at) {
          ticketDate = new Date(item.created_at);
        } else {
          return true;
        }

        const ticketYear = ticketDate.getFullYear();
        const ticketMonth = ticketDate.getMonth() + 1; // 1-indexed

        // Only show tickets for the selected month in the current year
        return ticketYear === new Date().getFullYear() && ticketMonth === techPeriodFilter;
      };

      const processTicketForTech = (item: any) => {
        // Exclude tickets with status Atribuído/Atribuido from the technician chart
        const s = (item.status || '').toLowerCase().trim();
        if (s === 'atribuído' || s === 'atribuido') return;

        // Filter by tech period
        if (!checkTechPeriod(item)) return;

        const techsToProcess: string[] = [];

        // Primary tech
        let techName1 = item.tecnico_responsavel?.full_name;
        if (techName1 && invalidTechs.includes(techName1)) {
          if (validTechList.length > 0) {
            // Stable reassignment based on item id hash
            const itemIdStr = String(item.id || '');
            let hash = 0;
            for (let i = 0; i < itemIdStr.length; i++) {
              hash = itemIdStr.charCodeAt(i) + ((hash << 5) - hash);
            }
            const idx = Math.abs(hash) % validTechList.length;
            techName1 = validTechList[idx];
          } else {
            techName1 = undefined;
          }
        }
        if (techName1) techsToProcess.push(techName1);

        // Secondary tech
        let techName2 = item.tecnico_responsavel_2?.full_name;
        if (techName2 && invalidTechs.includes(techName2)) {
          techName2 = undefined;
        }
        if (techName2) techsToProcess.push(techName2);

        // If none assigned
        if (techsToProcess.length === 0) {
          techsToProcess.push('Não Atribuído');
        }

        techsToProcess.forEach(techName => {
          if (!techMap[techName]) {
            techMap[techName] = { name: techName, em_atendimento: 0, pendentes: 0, concluidos: 0, total: 0 };
          }

          if (['concluída', 'finalizada', 'concluído', 'finalizado', 'concluido'].includes(s)) {
            techMap[techName].concluidos++;
            techMap[techName].total++;
          } else if (['em atendimento', 'em progresso', 'andamento'].includes(s)) {
            techMap[techName].em_atendimento++;
            techMap[techName].total++;
          }
        });
      };

      allWOsList.forEach(processTicketForTech);
      allPMsList.forEach(processTicketForTech);

      // Separate 'Não Atribuído', sort the rest, add a spacer, and place it last
      const mainTechs = Object.values(techMap)
        .filter(t => t.name !== 'Não Atribuído')
        .sort((a, b) => b.total - a.total);

      const naoAtribuidoItem = techMap['Não Atribuído'];
      const dummyItem = { name: ' ', em_atendimento: 0, concluidos: 0, total: 0 };

      const techArray = [...mainTechs, dummyItem, naoAtribuidoItem];
      setTechChartData(techArray);

      // 2. Process General Call Status Chart Data (JAN - DEZ)
      const currentYearVal = new Date().getFullYear();
      const currentMonthIdx = new Date().getMonth(); // 0-indexed
      const statusMap: Record<number, { name: string, atribuidos: number, pendentes: number, concluidos: number, total: number }> = {};
      const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

      for (let m = 0; m < 12; m++) {
        statusMap[m] = { name: monthNames[m], atribuidos: 0, pendentes: 0, concluidos: 0, total: 0 };
      }

      const processTicketForStatusWO = (item: any) => {
        if (!item.created_at) return;
        const d = new Date(item.created_at);
        if (d.getFullYear() !== currentYearVal) return;
        const m = d.getMonth();
        if (statusMap[m]) {
          const s = (item.status || '').toLowerCase().trim();
          if (['concluída', 'finalizada', 'concluído', 'finalizado', 'concluido'].includes(s)) {
            statusMap[m].concluidos++;
          } else if (['em atendimento', 'em progresso', 'andamento', 'atribuído', 'atribuido'].includes(s)) {
            // Se for preventiva e o mês já passou (m < currentMonthIdx), vira pendente
            if (item.tipo === 'Preventiva' && m < currentMonthIdx) {
              statusMap[m].pendentes++;
            } else {
              statusMap[m].atribuidos++;
            }
          } else {
            statusMap[m].pendentes++;
          }
          statusMap[m].total++;
        }
      };

      const processTicketForStatusPM = (item: any) => {
        const y = item.ano || currentYearVal;
        if (y !== currentYearVal) return;
        const m = (item.mes || 1) - 1; // 0-indexed
        if (statusMap[m]) {
          const s = (item.status || '').toLowerCase().trim();
          if (['concluída', 'finalizada', 'concluído', 'finalizado', 'concluido'].includes(s)) {
            statusMap[m].concluidos++;
          } else if (['em atendimento', 'em progresso', 'andamento', 'atribuído', 'atribuido'].includes(s)) {
            // Se o mês já passou (m < currentMonthIdx), vira pendente
            if (m < currentMonthIdx) {
              statusMap[m].pendentes++;
            } else {
              statusMap[m].atribuidos++;
            }
          } else {
            statusMap[m].pendentes++;
          }
          statusMap[m].total++;
        }
      };

      allWOsList.forEach(processTicketForStatusWO);
      allPMsList.forEach(processTicketForStatusPM);

      setGeneralStatusData(Object.values(statusMap));

      // 3. Telemetry and RUL computation updates in the background
      const { data: allAssetsList } = await supabase.from('ativos').select('id, nome, setor, saude, criticidade, data_aquisicao');
      if (allAssetsList && allAssetsList.length > 0) {
        const mappedAssets = allAssetsList.map(a => {
          const health = a.saude ?? 100;
          const acqDate = a.data_aquisicao ? new Date(a.data_aquisicao) : new Date();
          const diffMs = Date.now() - acqDate.getTime();
          const ageYears = Math.max(0.1, diffMs / (1000 * 60 * 60 * 24 * 365.25));
          
          const baseLifeDays = 3650;
          const ageDays = ageYears * 365.25;
          let remainingLifeDays = Math.max(10, baseLifeDays - ageDays);
          remainingLifeDays = Math.round(remainingLifeDays * (health / 100));
          const failureProbability = Math.round(100 - health);

          return {
            ...a,
            remainingLifeDays,
            failureProbability,
            healthScore: health
          };
        });

        // Set all telemetry list sorted by health (increasing/critical first or default)
        setAssetsTelemetry(mappedAssets.sort((a, b) => a.healthScore - b.healthScore).slice(0, 6));

        // Fetch low-health assets for visual alerts immediately from the list
        const criticalList = mappedAssets
          .filter(a => a.healthScore < 55)
          .sort((a, b) => a.healthScore - b.healthScore)
          .slice(0, 5);
        setRulAlerts(criticalList);

        // Run background calculations to refresh database and trigger auto WOs if needed
        Promise.all(allAssetsList.slice(0, 8).map(asset => calculateAssetRUL(asset.id)))
          .then(() => {
            console.log('Background RUL and Neuro-Fuzzy telemetry successfully updated.');
          })
          .catch(err => {
            console.error('Error running background telemetry update:', err);
          });
      }

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchPieChartData = async (month: number, year: number, type: 'Todos' | 'Preventiva' | 'Corretiva') => {
    try {
      let pms: any[] = [];
      if (type === 'Todos' || type === 'Preventiva') {
        const { data } = await supabase
          .from('preventivas_mensais')
          .select('status, tecnico_responsavel, created_at, data_limite')
          .eq('mes', month)
          .eq('ano', year);
        if (data) pms = data;
      }

      let query = supabase
        .from('work_orders')
        .select('status, created_at, tipo');
      
      if (type !== 'Todos') {
        query = query.eq('tipo', type);
      }

      const { data: wos } = await query;

      let emAtendimento = 0;
      let concluidos = 0;

      pms.forEach(pm => {
        const st = (pm.status || '').toLowerCase();
        if (['concluído', 'concluido', 'concluída', 'concluida', 'finalizada', 'finalizado'].includes(st)) {
          concluidos++;
        } else if (['em atendimento', 'em progresso', 'andamento'].includes(st)) {
          emAtendimento++;
        }
      });

      wos?.forEach(wo => {
        const d = new Date(wo.created_at);
        if (d.getFullYear() === year && d.getMonth() === month - 1) {
          const st = (wo.status || '').toLowerCase();
          if (['concluída', 'concluído', 'finalizada', 'finalizado', 'concluido'].includes(st)) {
            concluidos++;
          } else if (['em atendimento', 'em progresso', 'andamento'].includes(st)) {
            emAtendimento++;
          }
        }
      });

      setPieStats({ emAtendimento, concluidos });

      // Generate histogram data
      const daysInMonth = new Date(year, month, 0).getDate();
      const dayCounts = Array.from({ length: daysInMonth }, (_, i) => ({
        name: String(i + 1),
        quantidade: 0
      }));

      pms.forEach(pm => {
        const dateStr = pm.created_at || pm.data_limite;
        if (dateStr) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            const dayIdx = d.getDate() - 1;
            if (dayIdx >= 0 && dayIdx < daysInMonth) {
              dayCounts[dayIdx].quantidade++;
            }
          }
        } else {
          dayCounts[0].quantidade++;
        }
      });

      wos?.forEach(wo => {
        const d = new Date(wo.created_at);
        if (d.getFullYear() === year && d.getMonth() === month - 1) {
          const dayIdx = d.getDate() - 1;
          if (dayIdx >= 0 && dayIdx < daysInMonth) {
            dayCounts[dayIdx].quantidade++;
          }
        }
      });

      setPieHistogramData(dayCounts);
    } catch (err) {
      console.error('Error fetching pie chart data:', err);
    }
  };

  React.useEffect(() => {
    fetchPieChartData(pieMonth, pieYear, pieTypeFilter);
  }, [pieMonth, pieYear, pieTypeFilter]);

  const chartData = React.useMemo(() => {
    const dataMap: Record<string, { name: string, prev: number, corr: number, total: number }> = {};
    const now = new Date();

    // 1. Generate buckets based on period
    if (chartPeriodFilter === 'mensal') {
      const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
      const targetYear = 2026; // system year
      for (let m = 0; m < 12; m++) {
        const key = `${targetYear}-${m}`;
        dataMap[key] = { name: monthNames[m], prev: 0, corr: 0, total: 0 };
      }
    } else if (chartPeriodFilter === 'trimestral') {
      for (let i = 3; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i * 3);
        const y = d.getFullYear();
        const q = Math.floor(d.getMonth() / 3) + 1;
        const key = `${y}-Q${q}`;
        dataMap[key] = { name: `${q}T/${String(y).slice(-2)}`, prev: 0, corr: 0, total: 0 };
      }
    } else if (chartPeriodFilter === 'semestral') {
      for (let i = 3; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i * 6);
        const y = d.getFullYear();
        const s = d.getMonth() < 6 ? 1 : 2;
        const key = `${y}-S${s}`;
        dataMap[key] = { name: `${s}S/${String(y).slice(-2)}`, prev: 0, corr: 0, total: 0 };
      }
    } else if (chartPeriodFilter === 'anual') {
      for (let i = 2; i >= 0; i--) {
        const y = now.getFullYear() - i;
        const key = `${y}`;
        dataMap[key] = { name: `${y}`, prev: 0, corr: 0, total: 0 };
      }
    }

    // 2. Populate from work orders
    allWOs.forEach(wo => {
      const date = new Date(wo.created_at);
      const y = date.getFullYear();
      const m = date.getMonth();
      let key = '';

      if (chartPeriodFilter === 'mensal') {
        key = `${y}-${m}`;
      } else if (chartPeriodFilter === 'trimestral') {
        const q = Math.floor(m / 3) + 1;
        key = `${y}-Q${q}`;
      } else if (chartPeriodFilter === 'semestral') {
        const s = m < 6 ? 1 : 2;
        key = `${y}-S${s}`;
      } else if (chartPeriodFilter === 'anual') {
        key = `${y}`;
      }

      if (dataMap[key]) {
        if (wo.tipo === 'Preventiva') {
          dataMap[key].prev++;
        } else {
          dataMap[key].corr++;
        }
        dataMap[key].total++;
      }
    });

    // 3. Populate from preventivas_mensais
    allPMs.forEach(pm => {
      const y = pm.ano;
      const m = pm.mes - 1;
      let key = '';

      if (chartPeriodFilter === 'mensal') {
        key = `${y}-${m}`;
      } else if (chartPeriodFilter === 'trimestral') {
        const q = Math.floor(m / 3) + 1;
        key = `${y}-Q${q}`;
      } else if (chartPeriodFilter === 'semestral') {
        const s = m < 6 ? 1 : 2;
        key = `${y}-S${s}`;
      } else if (chartPeriodFilter === 'anual') {
        key = `${y}`;
      }

      if (dataMap[key]) {
        dataMap[key].prev++;
        dataMap[key].total++;
      }
    });

    // 4. Sort and return
    const sortedKeys = Object.keys(dataMap).sort((a, b) => {
      if (chartPeriodFilter === 'anual') {
        return Number(a) - Number(b);
      }
      const [yA, partA] = a.split('-');
      const [yB, partB] = b.split('-');
      if (yA !== yB) return Number(yA) - Number(yB);
      const valA = partA.startsWith('Q') || partA.startsWith('S') ? Number(partA.slice(1)) : Number(partA);
      const valB = partB.startsWith('Q') || partB.startsWith('S') ? Number(partB.slice(1)) : Number(partB);
      return valA - valB;
    });

    return sortedKeys.map(k => {
      const item = dataMap[k];
      return {
        name: item.name,
        prev: chartTypeFilter === 'Corretiva' ? 0 : item.prev,
        corr: chartTypeFilter === 'Preventiva' ? 0 : item.corr,
        total: item.total
      };
    });
  }, [allWOs, allPMs, chartTypeFilter, chartPeriodFilter]);

  const prevChartData = React.useMemo(() => {
    const dataMap: Record<string, { name: string, previstas: number, realizadas: number, total: number }> = {};
    const now = new Date();

    // 1. Generate buckets based on period
    if (prevChartPeriodFilter === 'mensal') {
      const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
      const targetYear = 2026; // system year
      for (let m = 0; m < 12; m++) {
        const key = `${targetYear}-${m}`;
        dataMap[key] = { name: monthNames[m], previstas: 0, realizadas: 0, total: 0 };
      }
    } else if (prevChartPeriodFilter === 'trimestral') {
      for (let i = 3; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i * 3);
        const y = d.getFullYear();
        const q = Math.floor(d.getMonth() / 3) + 1;
        const key = `${y}-Q${q}`;
        dataMap[key] = { name: `${q}T/${String(y).slice(-2)}`, previstas: 0, realizadas: 0, total: 0 };
      }
    } else if (prevChartPeriodFilter === 'semestral') {
      for (let i = 3; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i * 6);
        const y = d.getFullYear();
        const s = d.getMonth() < 6 ? 1 : 2;
        const key = `${y}-S${s}`;
        dataMap[key] = { name: `${s}S/${String(y).slice(-2)}`, previstas: 0, realizadas: 0, total: 0 };
      }
    } else if (prevChartPeriodFilter === 'anual') {
      for (let i = 2; i >= 0; i--) {
        const y = now.getFullYear() - i;
        const key = `${y}`;
        dataMap[key] = { name: `${y}`, previstas: 0, realizadas: 0, total: 0 };
      }
    }

    const isCompleted = (statusStr: string) => {
      const s = (statusStr || '').toLowerCase().trim();
      return ['concluída', 'finalizada', 'concluído', 'finalizado', 'concluido'].includes(s);
    };

    // 2. Populate from work orders
    allWOs.forEach(wo => {
      if (wo.tipo !== 'Preventiva') return;

      const date = new Date(wo.created_at);
      const y = date.getFullYear();
      const m = date.getMonth();
      let key = '';

      if (prevChartPeriodFilter === 'mensal') {
        key = `${y}-${m}`;
      } else if (prevChartPeriodFilter === 'trimestral') {
        const q = Math.floor(m / 3) + 1;
        key = `${y}-Q${q}`;
      } else if (prevChartPeriodFilter === 'semestral') {
        const s = m < 6 ? 1 : 2;
        key = `${y}-S${s}`;
      } else if (prevChartPeriodFilter === 'anual') {
        key = `${y}`;
      }

      if (dataMap[key]) {
        dataMap[key].previstas++;
        if (isCompleted(wo.status)) {
          dataMap[key].realizadas++;
        }
        dataMap[key].total++;
      }
    });

    // 3. Populate from preventivas_mensais
    allPMs.forEach(pm => {
      const y = pm.ano;
      const m = pm.mes - 1;
      let key = '';

      if (prevChartPeriodFilter === 'mensal') {
        key = `${y}-${m}`;
      } else if (prevChartPeriodFilter === 'trimestral') {
        const q = Math.floor(m / 3) + 1;
        key = `${y}-Q${q}`;
      } else if (prevChartPeriodFilter === 'semestral') {
        const s = m < 6 ? 1 : 2;
        key = `${y}-S${s}`;
      } else if (prevChartPeriodFilter === 'anual') {
        key = `${y}`;
      }

      if (dataMap[key]) {
        dataMap[key].previstas++;
        if (isCompleted(pm.status)) {
          dataMap[key].realizadas++;
        }
        dataMap[key].total++;
      }
    });

    // 4. Sort and return
    const sortedKeys = Object.keys(dataMap).sort((a, b) => {
      if (prevChartPeriodFilter === 'anual') {
        return Number(a) - Number(b);
      }
      const [yA, partA] = a.split('-');
      const [yB, partB] = b.split('-');
      if (yA !== yB) return Number(yA) - Number(yB);
      const valA = partA.startsWith('Q') || partA.startsWith('S') ? Number(partA.slice(1)) : Number(partA);
      const valB = partB.startsWith('Q') || partB.startsWith('S') ? Number(partB.slice(1)) : Number(partB);
      return valA - valB;
    });

    return sortedKeys.map(k => {
      const item = dataMap[k];
      return {
        name: item.name,
        previstas: item.previstas,
        realizadas: item.realizadas,
        total: item.total
      };
    });
  }, [allWOs, allPMs, prevChartPeriodFilter]);

  const totalPie = pieStats.emAtendimento + pieStats.concluidos;
  const pieData = React.useMemo(() => {
    if (totalPie === 0) {
      return [
        { name: 'Em atendimento', value: 0, count: 0, percentage: 0 },
        { name: 'Concluídos', value: 0, count: 0, percentage: 0 }
      ];
    }
    return [
      { name: 'Em atendimento', value: pieStats.emAtendimento, count: pieStats.emAtendimento, percentage: Math.round((pieStats.emAtendimento / totalPie) * 100) },
      { name: 'Concluídos', value: pieStats.concluidos, count: pieStats.concluidos, percentage: Math.round((pieStats.concluidos / totalPie) * 100) }
    ];
  }, [pieStats, totalPie]);

  const sortedDelayedTickets = React.useMemo(() => {
    return delayedTickets
      .filter(t => {
        if (!t.data_limite) return false;
        const days = getDaysDelayed(t.data_limite);
        if (delayedFilter === '1_mes' && days < 30) return false;
        if (delayedFilter === 'todos' && days <= 0) return false;
        return true;
      })
      .sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (delayedSortKey === 'display_id') {
          valA = a.display_id || a.id || '';
          valB = b.display_id || b.id || '';
        } else if (delayedSortKey === 'nome') {
          valA = a.ativos?.nome || 'Geral';
          valB = b.ativos?.nome || 'Geral';
        } else if (delayedSortKey === 'status') {
          valA = a.status || '';
          valB = b.status || '';
        } else if (delayedSortKey === 'tipo') {
          valA = a.tipo || '';
          valB = b.tipo || '';
        } else if (delayedSortKey === 'tempo_atraso') {
          valA = getDaysDelayed(a.data_limite);
          valB = getDaysDelayed(b.data_limite);
        } else if (delayedSortKey === 'data_limite') {
          valA = a.data_limite || '';
          valB = b.data_limite || '';
        } else if (delayedSortKey === 'responsavel') {
          valA = a.created_by?.full_name || a.tecnico_responsavel?.full_name || '---';
          valB = b.created_by?.full_name || b.tecnico_responsavel?.full_name || '---';
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return delayedSortOrder === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        } else {
          return delayedSortOrder === 'asc' 
            ? (valA > valB ? 1 : -1) 
            : (valB > valA ? 1 : -1);
        }
      });
  }, [delayedTickets, delayedFilter, delayedSortKey, delayedSortOrder]);

  const renderCustomLabel = ({ x, y, width, value }: any) => {
    if (value === 0 || value === undefined || value === null) return null;
    return (
      <text x={x + width / 2} y={y - 8} fill="#f1f5f9" textAnchor="middle" style={{ fontSize: 11, fontWeight: 'bold' }}>
        {value}
      </text>
    );
  };

  if (isMobile) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 bg-[#0a0f1d] text-slate-100 pb-20">
        {/* Greeting Card */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#111827] border border-[#1f2937]/50 shadow-md">
          <div className="size-11 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 shrink-0">
            <span className="material-symbols-outlined text-[24px]">person</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white text-base font-bold leading-tight truncate">Olá, {userProfile?.full_name || userProfile?.name || 'Guilherme'}</span>
            <span className="text-slate-400 text-xs mt-0.5 truncate">{userProfile?.job_title || 'Analista Automação'} • {userProfile?.shift || 'Turno A'}</span>
          </div>
        </div>

        {/* 2x2 KPIs Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Ativos Cadastrados */}
          <div className="p-4 rounded-xl bg-[#111827] border border-[#1f2937]/50 flex flex-col justify-between min-h-[110px] relative overflow-hidden">
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Ativos</span>
              <span className="material-symbols-outlined text-purple-500 text-[18px]">precision_manufacturing</span>
            </div>
            <div className="mt-2">
              <h3 className="text-3xl font-extrabold text-white leading-none tracking-tight">{stats.assets || 0}</h3>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Cadastrados</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500/50"></div>
          </div>

          {/* Card 2: Peças Cadastradas */}
          <div className="p-4 rounded-xl bg-[#111827] border border-[#1f2937]/50 flex flex-col justify-between min-h-[110px] relative overflow-hidden">
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Peças Cadastradas</span>
              <span className="material-symbols-outlined text-[#00d2ff] text-[18px]">inventory_2</span>
            </div>
            <div className="mt-2">
              <h3 className="text-3xl font-extrabold text-white leading-none tracking-tight">{stats.inventory || 0}</h3>
            </div>
            <p className="text-[9px] text-red-500 font-bold uppercase mt-1">{stats.criticalInventory} Críticos</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500/50"></div>
          </div>

          {/* Card 3: Chamados em Aberto */}
          <div className="p-4 rounded-xl bg-[#111827] border border-[#1f2937]/50 flex flex-col justify-between min-h-[110px] relative overflow-hidden">
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Chamados Abertos</span>
              <span className="material-symbols-outlined text-amber-500 text-[18px]">warning</span>
            </div>
            <div className="mt-2">
              <h3 className="text-3xl font-extrabold text-white leading-none tracking-tight">{stats.tickets || 0}</h3>
            </div>
            <p className="text-[9px] text-red-500 font-bold uppercase mt-1">{stats.criticalTickets} Críticos</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500/50"></div>
          </div>

          {/* Card 4: Preventivas no Mês */}
          <div className="p-4 rounded-xl bg-[#111827] border border-[#1f2937]/50 flex flex-col justify-between min-h-[110px] relative overflow-hidden">
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Preventivas no Mês</span>
              <span className="material-symbols-outlined text-violet-500 text-[18px]">build_circle</span>
            </div>
            <div className="mt-2">
              <h3 className="text-3xl font-extrabold text-white leading-none tracking-tight">{stats.preventivesTotal > 0 ? `${stats.preventivesDone}/${stats.preventivesTotal}` : '0/0'}</h3>
            </div>
            <p className="text-[9px] text-orange-500 font-bold uppercase mt-1">{stats.preventivesTotal - stats.preventivesDone} Pendentes</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-violet-500/50"></div>
          </div>
        </div>


        {/* Chart Card (Mobile) */}
        <div className="p-5 rounded-xl bg-[#111827] border border-[#1f2937]/50 flex flex-col min-h-[420px]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#00d2ff]">analytics</span>
                Análise de Chamados
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Chamados do Mês Selecionado</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <select
              value={pieMonth}
              onChange={(e) => setPieMonth(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer outline-none font-bold flex-1"
            >
              <option value={1}>Janeiro</option>
              <option value={2}>Fevereiro</option>
              <option value={3}>Março</option>
              <option value={4}>Abril</option>
              <option value={5}>Maio</option>
              <option value={6}>Junho</option>
              <option value={7}>Julho</option>
              <option value={8}>Agosto</option>
              <option value={9}>Setembro</option>
              <option value={10}>Outubro</option>
              <option value={11}>Novembro</option>
              <option value={12}>Dezembro</option>
            </select>
            <select
              value={pieYear}
              onChange={(e) => setPieYear(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer outline-none font-bold font-mono flex-1"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {/* Tipo de Chamado no Mobile - abaixo do período/ano */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider w-14">Tipo:</span>
            <select
              value={pieTypeFilter}
              onChange={(e) => setPieTypeFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer outline-none font-bold flex-1"
            >
              <option value="Preventiva">Preventivas</option>
              <option value="Corretiva">Corretivas</option>
              <option value="Todos">Todos</option>
            </select>
          </div>

          {/* Alternador de Gráfico no Mobile */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider w-14">Gráfico:</span>
            <select
              value={pieChartMode}
              onChange={(e) => setPieChartMode(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer outline-none font-bold flex-1"
            >
              <option value="rosca">Rosca</option>
              <option value="pizza2d">Pizza 2D</option>
              <option value="pizza3d">Pizza 3D</option>
              <option value="barras">Barras</option>
              <option value="colunas3d">Colunas 3D</option>
              <option value="histograma">Histograma</option>
            </select>
          </div>

          <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-center gap-4">
            {(() => {
              switch (pieChartMode) {
                case 'rosca':
                  return (
                    <div className="relative w-[150px] h-[150px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            <linearGradient id="pieAtendimentoMobile" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22d3ee" />
                              <stop offset="100%" stopColor="#2563eb" />
                            </linearGradient>
                            <linearGradient id="pieConcluidosMobile" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                          </defs>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-mobile-${index}`}
                                fill={index === 0 ? 'url(#pieAtendimentoMobile)' : 'url(#pieConcluidosMobile)'}
                                stroke="#111827"
                                strokeWidth={2}
                                style={{
                                  filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.4))',
                                  outline: 'none'
                                }}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg font-black text-white leading-none">
                          {totalPie}
                        </span>
                        <span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">
                          {pieTypeFilter === 'Todos' ? 'Chamados' : pieTypeFilter === 'Preventiva' ? 'Preventivas' : 'Corretivas'}
                        </span>
                      </div>
                    </div>
                  );
                case 'pizza2d':
                  return (
                    <div className="relative w-[150px] h-[150px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            <linearGradient id="pieAtendimentoMobile" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22d3ee" />
                              <stop offset="100%" stopColor="#2563eb" />
                            </linearGradient>
                            <linearGradient id="pieConcluidosMobile" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                          </defs>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={0}
                            outerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-mobile-${index}`}
                                fill={index === 0 ? 'url(#pieAtendimentoMobile)' : 'url(#pieConcluidosMobile)'}
                                stroke="#111827"
                                strokeWidth={2}
                                style={{
                                  filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.4))',
                                  outline: 'none'
                                }}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  );
                case 'pizza3d':
                  return (
                    <ExcelPie3D pieData={pieData} isMobile={true} />
                  );
                case 'barras':
                  return (
                    <div className="w-full h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pieData} barGap={4} margin={{ top: 25, right: 10, left: -10, bottom: 5 }}>
                          <defs>
                            <linearGradient id="pieAtendimentoMobile" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22d3ee" />
                              <stop offset="100%" stopColor="#2563eb" />
                            </linearGradient>
                            <linearGradient id="pieConcluidosMobile" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={5} />
                          <YAxis stroke="#6b7280" tick={{ fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                          <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={30} label={renderCustomLabel}>
                            {pieData.map((entry, index) => (
                              <Cell key={`bar-cell-mobile-${index}`} fill={index === 0 ? 'url(#pieAtendimentoMobile)' : 'url(#pieConcluidosMobile)'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                case 'colunas3d':
                  return (
                    <div className="w-full h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pieData} barGap={4} margin={{ top: 25, right: 10, left: -10, bottom: 5 }}>
                          <defs>
                            <linearGradient id="pieAtendimentoMobile" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22d3ee" />
                              <stop offset="100%" stopColor="#2563eb" />
                            </linearGradient>
                            <linearGradient id="pieConcluidosMobile" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={5} />
                          <YAxis stroke="#6b7280" tick={{ fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                          <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                          <Bar dataKey="value" shape={<Custom3DBar />} maxBarSize={30} label={renderCustomLabel}>
                            {pieData.map((entry, index) => (
                              <Cell key={`bar-cell-mobile-3d-${index}`} fill={index === 0 ? 'url(#pieAtendimentoMobile)' : 'url(#pieConcluidosMobile)'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                case 'histograma':
                  return (
                    <div className="w-full h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pieHistogramData} barCategoryGap={1} margin={{ top: 25, right: 10, left: -10, bottom: 5 }}>
                          <defs>
                            <linearGradient id="pieAtendimentoMobile" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22d3ee" />
                              <stop offset="100%" stopColor="#2563eb" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 8, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={5} />
                          <YAxis stroke="#6b7280" tick={{ fontSize: 8, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-slate-200 text-xs p-3.5 rounded-xl shadow-2xl font-mono">
                                    <p className="font-bold text-white border-b border-slate-800/80 pb-1.5 mb-1.5">Dia {label}</p>
                                    <p className="text-sm font-black text-cyan-400">{payload[0].value} chamados</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="quantidade" name="Chamados" fill="url(#pieAtendimentoMobile)" radius={[2, 2, 0, 0]}>
                            {pieHistogramData.map((entry, index) => (
                              <Cell key={`hist-cell-mobile-${index}`} fill="url(#pieAtendimentoMobile)" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                default:
                  return null;
              }
            })()}

            {/* Legends and Info */}
            {pieChartMode !== 'histograma' && (
              <div className="flex justify-around w-full gap-2 mt-2">
                {pieData.map((item, index) => (
                  <div key={`legend-mobile-${item.name}`} className="flex items-start gap-2 p-1.5 rounded-lg bg-slate-900/30 border border-slate-800/40 flex-1">
                    <span className={`size-2.5 rounded-full mt-0.5 shrink-0 ${index === 0 ? 'bg-gradient-to-br from-cyan-400 to-blue-600' : 'bg-gradient-to-br from-emerald-400 to-green-600'}`}></span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider truncate">{item.name === 'Em atendimento' ? 'Atend.' : 'Concl.'}</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-white">{item.count}</span>
                        <span className="text-[9px] text-slate-500 font-bold">({item.percentage}%)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {totalPie === 0 && (
              <span className="text-[9px] text-amber-500 font-medium italic leading-tight text-center">
                * Exibindo gráfico modelo (sem preventivas no mês).
              </span>
            )}
          </div>
        </div>

        {/* Mobile: Preventivas (Previstas vs Realizadas) */}
        <div className="p-5 rounded-xl bg-[#111827] border border-[#1f2937]/50 flex flex-col min-h-[380px]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 font-display">
                <span className="material-symbols-outlined text-[18px] text-[#00d2ff]">bar_chart</span>
                Preventivas: Previstas vs Realizadas
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Análise de cumprimento de preventivas</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <select
              value={prevChartPeriodFilter}
              onChange={(e) => setPrevChartPeriodFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500 cursor-pointer outline-none font-bold font-mono"
            >
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>

          <div className="w-full h-[220px]">
            {prevChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prevChartData} barGap={2}>
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={5} />
                  <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="previstas" name="Prev." fill="url(#barGradientPrevistasMobile)" radius={[3, 3, 0, 0]} maxBarSize={15} label={renderCustomLabel} />
                  <Bar dataKey="realizadas" name="Realiz." fill="url(#barGradientRealizadasMobile)" radius={[3, 3, 0, 0]} maxBarSize={15} label={renderCustomLabel} />
                  <defs>
                    <linearGradient id="barGradientPrevistasMobile" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                    <linearGradient id="barGradientRealizadasMobile" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Sem dados para exibir.
              </div>
            )}
          </div>
        </div>

        {/* Monthly Evolution Card (Mobile) */}
        <div className="p-5 rounded-xl bg-[#111827] border border-[#1f2937]/50 flex flex-col min-h-[380px]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#00d2ff]">bar_chart</span>
                Evolução {chartPeriodFilter.charAt(0).toUpperCase() + chartPeriodFilter.slice(1)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Corretivas vs Preventivas (Dados reais)</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 justify-center">
              <button
                onClick={() => setChartTypeFilter('Todos')}
                className={`flex-1 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${chartTypeFilter === 'Todos'
                  ? 'bg-[#00d2ff] text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Todos
              </button>
              <button
                onClick={() => setChartTypeFilter('Preventiva')}
                className={`flex-1 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${chartTypeFilter === 'Preventiva'
                  ? 'bg-[#00d2ff] text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Prev.
              </button>
              <button
                onClick={() => setChartTypeFilter('Corretiva')}
                className={`flex-1 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${chartTypeFilter === 'Corretiva'
                  ? 'bg-[#00d2ff] text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Corr.
              </button>
            </div>

            <select
              value={chartPeriodFilter}
              onChange={(e) => setChartPeriodFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500 cursor-pointer outline-none font-bold font-mono"
            >
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>

          <div className="w-full h-[220px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={5} />
                  <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="prev" name="Prev." fill="url(#barGradientPrevMobile)" radius={[3, 3, 0, 0]} maxBarSize={15} label={renderCustomLabel} />
                  <Bar dataKey="corr" name="Corr." fill="url(#barGradientCorrMobile)" radius={[3, 3, 0, 0]} maxBarSize={15} label={renderCustomLabel} />
                  <defs>
                    <linearGradient id="barGradientPrevMobile" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#cbd5e1" />
                    </linearGradient>
                    <linearGradient id="barGradientCorrMobile" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#b91c1c" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Sem dados para exibir.
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Status de Chamados Gerais */}
        <div className="p-5 rounded-xl bg-[#111827] border border-[#1f2937]/50 flex flex-col min-h-[380px]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 font-display">
                <span className="material-symbols-outlined text-[18px] text-[#00d2ff]">donut_large</span>
                Status Gerais
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Evolução do status dos chamados</span>
            </div>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 shrink-0">
              <button
                onClick={() => setGeneralStatusView('empilhado')}
                className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all ${generalStatusView === 'empilhado'
                  ? 'bg-[#00d2ff] text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Pilha
              </button>
              <button
                onClick={() => setGeneralStatusView('linhas')}
                className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${generalStatusView === 'linhas'
                  ? 'bg-[#00d2ff] text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Linhas
              </button>
            </div>
          </div>
          <div className="w-full h-[220px]">
            {generalStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {generalStatusView === 'empilhado' ? (
                  <ComposedChart data={generalStatusData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={5} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="atribuidos" name="Atrib." stackId="a" fill="#3b82f6" maxBarSize={15} />
                    <Bar dataKey="pendentes" name="Pend." stackId="a" fill="#f97316" maxBarSize={15} />
                    <Bar dataKey="concluidos" name="Concl." stackId="a" fill="#22c55e" maxBarSize={15} />
                    <Line type="monotone" dataKey="total" name="Total" stroke="#64748b" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 4">
                      <LabelList dataKey="total" position="top" offset={5} style={{ fontSize: 8, fontWeight: 'bold', fill: '#94a3b8' }} />
                    </Line>
                  </ComposedChart>
                ) : (
                  <LineChart data={generalStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={5} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Line type="monotone" dataKey="atribuidos" name="Atrib." stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="pendentes" name="Pend." stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="concluidos" name="Concl." stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="total" name="Total" stroke="#64748b" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 4">
                      <LabelList dataKey="total" position="top" offset={5} style={{ fontSize: 8, fontWeight: 'bold', fill: '#94a3b8' }} />
                    </Line>
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Sem dados para exibir.
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Chamados por Técnico */}
        <div className="p-5 rounded-xl bg-[#111827] border border-[#1f2937]/50 flex flex-col min-h-[500px]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 font-display">
                <span className="material-symbols-outlined text-[18px] text-[#00d2ff]">people</span>
                Preventivas por Técnico
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Quantidade de chamados atribuídos por técnico</span>
            </div>
            <select
              value={techPeriodFilter}
              onChange={(e) => setTechPeriodFilter(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500 cursor-pointer outline-none font-bold"
            >
              <option value={1}>Janeiro</option>
              <option value={2}>Fevereiro</option>
              <option value={3}>Março</option>
              <option value={4}>Abril</option>
              <option value={5}>Maio</option>
              <option value={6}>Junho</option>
              <option value={7}>Julho</option>
              <option value={8}>Agosto</option>
              <option value={9}>Setembro</option>
              <option value={10}>Outubro</option>
              <option value={11}>Novembro</option>
              <option value={12}>Dezembro</option>
            </select>
          </div>
          <div className="w-full h-[320px]">
            {techChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={techChartData} layout="vertical" margin={{ left: -15, right: 15, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#6b7280" tick={{ fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} width={85} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        if (data.name === ' ' || !data.name.trim()) return null;
                        return (
                          <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-slate-200 text-xs p-3.5 rounded-xl shadow-2xl font-mono">
                            <p className="font-bold text-white border-b border-slate-800/80 pb-1.5 mb-1.5">{data.name}</p>
                            <div className="space-y-1">
                              {payload.map((p: any) => {
                                if (p.dataKey === 'total') return null;
                                return (
                                  <div key={p.name} className="flex justify-between items-center gap-4">
                                    <span className="text-slate-400">{p.name}:</span>
                                    <span className="font-bold" style={{ color: p.color || p.fill }}>{p.value}</span>
                                  </div>
                                );
                              })}
                              <div className="border-t border-slate-800/85 mt-2 pt-1.5 flex justify-between items-center gap-4 font-bold text-slate-200">
                                <span>Total:</span>
                                <span>{data.total}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="em_atendimento" name="Em atendimento" fill="#3b82f6" radius={[0, 3, 3, 0]} maxBarSize={10} />
                  <Bar dataKey="concluidos" name="Concl." fill="#22c55e" radius={[0, 3, 3, 0]} maxBarSize={10} />
                  <Bar dataKey="total" name="Total" fill="#64748b" radius={[0, 3, 3, 0]} maxBarSize={10}>
                    <LabelList dataKey="total" position="right" offset={5} style={{ fill: '#94a3b8', fontSize: 8, fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Sem dados de técnicos para exibir.
              </div>
            )}
          </div>
        </div>

        {/* Ações Rápidas Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-sm font-bold text-white tracking-tight">Ações Rápidas</span>
            <button onClick={() => navigate('/app/work-orders')} className="text-xs font-semibold text-[#00d2ff] hover:text-cyan-400 flex items-center gap-1">
              Ver Todas
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          <div className="space-y-2">
            {/* Item 1: Corretiva Urgente */}
            <div onClick={() => navigate('/app/work-orders?action=new&priority=Alta')} className="flex items-center justify-between p-4 rounded-xl bg-[#111827] border border-[#1f2937]/50 active:bg-slate-800 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <span className="material-symbols-outlined text-[18px]">build</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white text-sm font-bold">Corretiva Urgente</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Abrir chamado de alta prioridade</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-500 text-[18px]">chevron_right</span>
            </div>

            {/* Item 2: Nova OS Preventiva */}
            <div onClick={() => navigate('/app/work-orders?action=new&type=Preventiva')} className="flex items-center justify-between p-4 rounded-xl bg-[#111827] border border-[#1f2937]/50 active:bg-slate-800 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[#00d2ff]">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white text-sm font-bold">Nova OS Preventiva</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Agendar manutenção rotineira</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-500 text-[18px]">chevron_right</span>
            </div>
          </div>
        </div>

        {/* Chamados em Atraso Section (Mobile) */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span className="material-symbols-outlined text-rose-500 text-[18px] animate-pulse">alarm</span>
                Chamados em Atraso
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">Prazo expirado e não concluídos</span>
            </div>
            <select
              value={delayedFilter}
              onChange={(e) => setDelayedFilter(e.target.value as 'todos' | '1_mes')}
              className="bg-slate-900 border border-slate-800 text-slate-350 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500 cursor-pointer outline-none font-bold"
            >
              <option value="todos">Todos</option>
              <option value="1_mes">≥ 1 mês</option>
            </select>
          </div>

          <div className="space-y-2">
            {sortedDelayedTickets.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#111827] border border-[#1f2937]/50 text-center text-slate-550 text-xs italic">
                Nenhum chamado atrasado.
              </div>
            ) : (
              sortedDelayedTickets.map(t => {
                const isClosedGray = t.tipo === 'Preventiva' && isPreviousMonthOrOlder(t.data_limite);
                const displayStatus = isClosedGray ? 'Fechado' : t.status;
                const statusBadgeStyle = isClosedGray
                  ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                const delayColorClass = isClosedGray
                  ? 'text-slate-400 font-semibold'
                  : 'text-rose-400 font-black';

                return (
                  <div
                    key={`delayed-mobile-${t.id}`}
                    onClick={() => navigate(`/app/ticket/${t.id}`)}
                    className="p-4 rounded-xl bg-[#111827] border border-[#1f2937]/50 active:bg-slate-800 transition-colors flex flex-col gap-2 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col min-w-0">
                        <span className="text-white text-xs font-bold truncate">{t.ativos?.nome || 'Geral'}</span>
                        <span className="text-[9px] text-slate-400 mt-0.5 font-mono">#{t.display_id || t.id.slice(0, 5)} • {t.tipo}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border uppercase shrink-0 ${statusBadgeStyle}`}>
                        {displayStatus}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-1 pt-2 border-t border-slate-800/50">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-550 font-bold uppercase">Tempo de Atraso</span>
                        <span className={`text-xs ${delayColorClass}`}>{calculateDelay(t.data_limite)}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[8px] text-slate-555 font-bold uppercase">Prazo Original</span>
                        <span className="text-[10px] text-slate-300 font-bold font-mono">{t.data_limite ? t.data_limite.split('-').reverse().join('/') : '-'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-transparent transition-colors duration-300">
      {/* Header */}
      <header className="h-16 border-b border-[#1e293b] sticky top-0 z-10 flex items-center justify-between px-8 bg-[#0a0f1d]/90 backdrop-blur-md text-white">
        {/* Search Bar - Styled in dark theme */}
        <div className="flex items-center w-full max-w-xl">
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-500 transition-colors">
              {isSearching ? (
                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">search</span>
              )}
            </div>
            <input
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-800 rounded-lg leading-5 bg-slate-900/60 text-slate-100 placeholder-slate-500 focus:outline-none focus:bg-slate-950 focus:border-[#00d2ff] focus:ring-1 focus:ring-[#00d2ff] text-sm font-display transition-all"
              placeholder="Buscar ativos, ordens ou códigos..."
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden z-50">
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.type}-${index}`}
                    onClick={() => handleSearchResultClick(result.link)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors text-left border-b border-slate-800/50 last:border-0"
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
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-4 text-center text-slate-500 text-sm z-50">
                <span className="material-symbols-outlined text-xl mb-1 opacity-50">search_off</span>
                <p>Nenhum resultado para "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 relative">
          {/* Notification Popover */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all flex items-center justify-center cursor-pointer relative"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
            </button>
            <NotificationPopover isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>

          <button onClick={() => navigate('/app/work-orders?action=new')} className="flex items-center gap-2 bg-[#00a3e0] hover:bg-[#008ebd] text-white text-sm font-bold py-2 px-4 rounded-lg shadow-lg shadow-[#00a3e0]/20 hover:shadow-[#00a3e0]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 font-display cursor-pointer font-display">
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
              <h2 className="text-4xl font-black tracking-tight text-white font-display mb-2">{t('dashboard.overview')}</h2>
              <p className="text-slate-400 text-sm mt-1">{t('dashboard.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm bg-slate-900 px-4 py-2 rounded-lg font-medium border border-slate-800">
              <span className="material-symbols-outlined text-[18px] text-slate-450">calendar_today</span>
              <span>{formatDate(new Date())}</span>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon="precision_manufacturing" title="Ativos Cadastrados" value={stats.assets.toLocaleString()} trend="Cadastrados" trendUp={true} color="purple" />
            <KPICard icon="inventory_2" title="Peças Cadastradas" value={stats.inventory.toLocaleString()} sub={<span className="text-red-500 font-bold">{stats.criticalInventory} Críticos</span>} trend="SKUs ativos" trendUp={true} color="primary" />
            <KPICard icon="warning" title={t('dashboard.tickets')} value={stats.tickets.toLocaleString()} sub={<span className="text-red-500 font-bold">{stats.criticalTickets} Críticos</span>} trend="Em aberto" trendUp={false} color="danger" />
            <KPICard icon="event_upcoming" title="Preventivas do Mês" value={`${stats.preventivesDone}/${stats.preventivesTotal}`} sub={<span className="text-orange-500 font-bold">{stats.preventivesTotal - stats.preventivesDone} Pendentes</span>} trend="Agendadas" trendUp={true} color="cyan" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl p-6 flex flex-col h-[420px] border border-slate-800 bg-[#0b111e]/90 shadow-xl shadow-black/10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Análise de Chamados</h3>
                  <p className="text-xs text-slate-400 font-medium">Chamados do Mês Selecionado</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    {/* Visualização Select */}
                    <select
                      value={pieChartMode}
                      onChange={(e) => setPieChartMode(e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 text-slate-355 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer outline-none font-bold"
                    >
                      <option value="rosca">Rosca</option>
                      <option value="pizza2d">Pizza 2D</option>
                      <option value="pizza3d">Pizza 3D</option>
                      <option value="barras">Barras</option>
                      <option value="colunas3d">Colunas 3D</option>
                      <option value="histograma">Histograma</option>
                    </select>

                    <select
                      value={pieMonth}
                      onChange={(e) => setPieMonth(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 text-slate-355 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer outline-none font-bold"
                    >
                      <option value={1}>Janeiro</option>
                      <option value={2}>Fevereiro</option>
                      <option value={3}>Março</option>
                      <option value={4}>Abril</option>
                      <option value={5}>Maio</option>
                      <option value={6}>Junho</option>
                      <option value={7}>Julho</option>
                      <option value={8}>Agosto</option>
                      <option value={9}>Setembro</option>
                      <option value={10}>Outubro</option>
                      <option value={11}>Novembro</option>
                      <option value={12}>Dezembro</option>
                    </select>
                    <select
                      value={pieYear}
                      onChange={(e) => setPieYear(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 text-slate-355 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer outline-none font-bold font-mono"
                    >
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                      <option value={2027}>2027</option>
                    </select>
                    <button onClick={() => navigate('/app/work-orders')} className="text-[#00d2ff] hover:text-cyan-400 p-1.5 rounded-lg hover:bg-slate-800/40 transition-colors" title="Ver Relatório Completo">
                      <span className="material-symbols-outlined text-[20px] align-middle">arrow_forward</span>
                    </button>
                  </div>

                  {/* Tipo de Chamado - abaixo do filtro de período e ano */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tipo:</span>
                    <select
                      value={pieTypeFilter}
                      onChange={(e) => setPieTypeFilter(e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 text-slate-355 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500 cursor-pointer outline-none font-bold"
                    >
                      <option value="Preventiva">Preventivas</option>
                      <option value="Corretiva">Corretivas</option>
                      <option value="Todos">Todos</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full min-h-0 flex flex-col md:flex-row items-center justify-center gap-8">
                {(() => {
                  switch (pieChartMode) {
                    case 'rosca':
                      return (
                        <div className="relative w-[220px] h-[220px] shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <defs>
                                <linearGradient id="pieAtendimento" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#22d3ee" />
                                  <stop offset="100%" stopColor="#2563eb" />
                                </linearGradient>
                                <linearGradient id="pieConcluidos" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" />
                                  <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                              </defs>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={85}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={index === 0 ? 'url(#pieAtendimento)' : 'url(#pieConcluidos)'}
                                    stroke="#0b111e"
                                    strokeWidth={2}
                                    style={{
                                      filter: 'drop-shadow(0px 8px 12px rgba(0, 0, 0, 0.45))',
                                      outline: 'none'
                                    }}
                                  />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomPieTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>

                          {/* Center Text inside Donut */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black text-white leading-none">
                              {totalPie}
                            </span>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mt-1">
                              {pieTypeFilter === 'Todos' ? 'Chamados' : pieTypeFilter === 'Preventiva' ? 'Preventivas' : 'Corretivas'}
                            </span>
                          </div>
                        </div>
                      );
                    case 'pizza2d':
                      return (
                        <div className="relative w-[220px] h-[220px] shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <defs>
                                <linearGradient id="pieAtendimento" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#22d3ee" />
                                  <stop offset="100%" stopColor="#2563eb" />
                                </linearGradient>
                                <linearGradient id="pieConcluidos" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" />
                                  <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                              </defs>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={0}
                                outerRadius={85}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={index === 0 ? 'url(#pieAtendimento)' : 'url(#pieConcluidos)'}
                                    stroke="#0b111e"
                                    strokeWidth={2}
                                    style={{
                                      filter: 'drop-shadow(0px 6px 10px rgba(0, 0, 0, 0.4))',
                                      outline: 'none'
                                    }}
                                  />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomPieTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    case 'pizza3d':
                      return (
                        <ExcelPie3D pieData={pieData} isMobile={false} />
                      );
                    case 'barras':
                      return (
                        <div className="relative flex-1 max-w-[280px] h-[220px] shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pieData} barGap={6} margin={{ top: 25, right: 10, left: 0, bottom: 5 }}>
                              <defs>
                                <linearGradient id="pieAtendimento" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#22d3ee" />
                                  <stop offset="100%" stopColor="#2563eb" />
                                </linearGradient>
                                <linearGradient id="pieConcluidos" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" />
                                  <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={5} />
                              <YAxis stroke="#6b7280" tick={{ fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                              <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={45} label={renderCustomLabel}>
                                {pieData.map((entry, index) => (
                                  <Cell key={`bar-cell-${index}`} fill={index === 0 ? 'url(#pieAtendimento)' : 'url(#pieConcluidos)'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    case 'colunas3d':
                      return (
                        <div className="relative flex-1 max-w-[280px] h-[220px] shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pieData} barGap={6} margin={{ top: 25, right: 10, left: 0, bottom: 5 }}>
                              <defs>
                                <linearGradient id="pieAtendimento" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#22d3ee" />
                                  <stop offset="100%" stopColor="#2563eb" />
                                </linearGradient>
                                <linearGradient id="pieConcluidos" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" />
                                  <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={5} />
                              <YAxis stroke="#6b7280" tick={{ fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                              <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                              <Bar dataKey="value" shape={<Custom3DBar />} maxBarSize={45} label={renderCustomLabel}>
                                {pieData.map((entry, index) => (
                                  <Cell key={`bar-cell-3d-${index}`} fill={index === 0 ? 'url(#pieAtendimento)' : 'url(#pieConcluidos)'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    case 'histograma':
                      return (
                        <div className="relative flex-1 w-full h-[220px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pieHistogramData} barCategoryGap={1} margin={{ top: 25, right: 10, left: 0, bottom: 5 }}>
                              <defs>
                                <linearGradient id="pieAtendimento" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#22d3ee" />
                                  <stop offset="100%" stopColor="#2563eb" />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                              <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={5} />
                              <YAxis stroke="#6b7280" tick={{ fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                              <Tooltip
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-slate-200 text-xs p-3.5 rounded-xl shadow-2xl font-mono">
                                        <p className="font-bold text-white border-b border-slate-800/80 pb-1.5 mb-1.5">Dia {label}</p>
                                        <p className="text-sm font-black text-cyan-400">{payload[0].value} chamados abertos</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="quantidade" name="Chamados" fill="url(#pieAtendimento)" radius={[3, 3, 0, 0]}>
                                {pieHistogramData.map((entry, index) => (
                                  <Cell key={`hist-cell-${index}`} fill="url(#pieAtendimento)" />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    default:
                      return null;
                  }
                })()}

                {/* Legends and Info */}
                {pieChartMode !== 'histograma' && (
                  <div className="flex flex-col gap-4 text-left min-w-[180px]">
                    {pieData.map((item, index) => (
                      <div key={item.name} className="flex items-start gap-3 p-2 hover:bg-slate-900/30 rounded-lg transition-colors">
                        <span className={`size-3 rounded-full mt-0.5 shrink-0 ${index === 0 ? 'bg-gradient-to-br from-cyan-400 to-blue-600' : 'bg-gradient-to-br from-emerald-400 to-green-600'}`}></span>
                        <div className="flex flex-col">
                          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{item.name}</span>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xl font-black text-white">{item.count}</span>
                            <span className="text-xs text-slate-500 font-bold">({item.percentage}%)</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {totalPie === 0 && (
                      <span className="text-[10px] text-amber-500 font-medium italic mt-2 leading-tight">
                        * Exibindo gráfico modelo (sem preventivas no mês).
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Alerts */}
            <div className="lg:col-span-1 rounded-2xl flex flex-col h-[420px] overflow-hidden border border-slate-800 bg-[#0b111e]/90 shadow-xl shadow-black/10">
              <div className="p-5 border-b border-slate-800 bg-slate-900/50">
                <h3 className="text-base font-bold text-white font-display">{t('dashboard.preventives')}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="size-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Atenção requerida</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {upcomingPreventives.length === 0 ? (
                  <p className="text-center text-slate-500 py-10">{t('dashboard.no_preventives')}</p>
                ) : (
                  upcomingPreventives.map(item => (
                    <AlertItem
                      key={item.id}
                      icon={item.icone || 'event'}
                      name={item.titulo || `PM-${item.id.slice(0, 4).toUpperCase()}`}
                      sector={item.ativos?.nome || 'Geral'}
                      date={item.data_limite ? item.data_limite.split('-').reverse().join('/') : `${item.mes}/${item.ano}`}
                      due={item.status}
                      status={
                        ['concluído', 'concluido', 'concluída', 'concluida', 'finalizado', 'finalizada'].includes((item.status || '').toLowerCase().trim())
                          ? 'success'
                          : ['em atendimento', 'em progresso', 'andamento'].includes((item.status || '').toLowerCase().trim())
                            ? 'warning'
                            : ['pendente', 'atraso', 'em atraso'].includes((item.status || '').toLowerCase().trim())
                              ? 'danger'
                              : 'neutral'
                      }
                      onClick={() => navigate(`/app/ticket/${item.id}`)}
                    />
                  ))
                )}
              </div>
              <div className="p-3 border-t border-slate-800 bg-slate-900/50 text-center">
                <button onClick={() => navigate('/app/calendar')} className="w-full text-center text-xs text-slate-400 font-bold hover:text-white transition-colors uppercase tracking-wider py-2">
                  Ver Calendário Completo
                </button>
              </div>
            </div>
          </div>


          {/* Preventivas: Previstas vs Realizadas */}
          <div className="rounded-2xl p-6 flex flex-col h-[420px] border border-slate-800 bg-[#0b111e]/90 shadow-xl shadow-black/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Preventivas: Previstas vs Realizadas</h3>
                <p className="text-xs text-slate-400 font-medium">Análise de cumprimento e programação de preventivas</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={prevChartPeriodFilter}
                  onChange={(e) => setPrevChartPeriodFilter(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 text-slate-355 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer outline-none font-bold"
                >
                  <option value="mensal">Mensal</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
            </div>

            <div className="flex-1 w-full min-h-0">
              {prevChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prevChartData} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={5} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold', paddingTop: 10 }} />
                    <Bar dataKey="previstas" name="Previstas" fill="url(#barGradientPrevistas)" radius={[4, 4, 0, 0]} maxBarSize={30} label={renderCustomLabel} />
                    <Bar dataKey="realizadas" name="Realizadas" fill="url(#barGradientRealizadas)" radius={[4, 4, 0, 0]} maxBarSize={30} label={renderCustomLabel} />
                    <defs>
                      <linearGradient id="barGradientPrevistas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                      <linearGradient id="barGradientRealizadas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                  Sem dados de preventivas para exibir.
                </div>
              )}
            </div>
          </div>

          {/* Restored monthly evolution (Corretivas vs. Preventivas) */}
          <div className="rounded-2xl p-6 flex flex-col h-[420px] border border-slate-800 bg-[#0b111e]/90 shadow-xl shadow-black/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Evolução {chartPeriodFilter.charAt(0).toUpperCase() + chartPeriodFilter.slice(1)}</h3>
                <p className="text-xs text-slate-400 font-medium">Histórico de Chamados: Corretivas vs Preventivas (Dados reais)</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setChartTypeFilter('Todos')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${chartTypeFilter === 'Todos'
                      ? 'bg-[#00d2ff] text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setChartTypeFilter('Preventiva')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${chartTypeFilter === 'Preventiva'
                      ? 'bg-[#00d2ff] text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    Preventivas
                  </button>
                  <button
                    onClick={() => setChartTypeFilter('Corretiva')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${chartTypeFilter === 'Corretiva'
                      ? 'bg-[#00d2ff] text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    Corretivas
                  </button>
                </div>

                <select
                  value={chartPeriodFilter}
                  onChange={(e) => setChartPeriodFilter(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 text-slate-355 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer outline-none font-bold"
                >
                  <option value="mensal">Mensal</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
            </div>

            <div className="flex-1 w-full min-h-0">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={5} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold', paddingTop: 10 }} />
                    <Bar dataKey="prev" name="Preventiva" fill="url(#barGradientPrev)" radius={[4, 4, 0, 0]} maxBarSize={30} label={renderCustomLabel} />
                    <Bar dataKey="corr" name="Corretiva" fill="url(#barGradientCorr)" radius={[4, 4, 0, 0]} maxBarSize={30} label={renderCustomLabel} />
                    <defs>
                      <linearGradient id="barGradientPrev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                      </linearGradient>
                      <linearGradient id="barGradientCorr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#b91c1c" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                  Sem dados de manutenção para exibir.
                </div>
              )}
            </div>
          </div>

          {/* Status de Chamados Gerais */}
          <div className="rounded-2xl p-6 flex flex-col h-[450px] border border-slate-800 bg-[#0b111e]/90 shadow-xl shadow-black/10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Status de Chamados Gerais</h3>
                <p className="text-xs text-slate-400 font-medium">Evolução do status dos chamados ao longo dos meses</p>
              </div>
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 shrink-0">
                <button
                  onClick={() => setGeneralStatusView('empilhado')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${generalStatusView === 'empilhado'
                    ? 'bg-[#00d2ff] text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Empilhado
                </button>
                <button
                  onClick={() => setGeneralStatusView('linhas')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${generalStatusView === 'linhas'
                    ? 'bg-[#00d2ff] text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  Linhas
                </button>
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              {generalStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {generalStatusView === 'empilhado' ? (
                    <ComposedChart data={generalStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={5} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold', paddingTop: 10 }} />
                      <Bar dataKey="atribuidos" name="Em atendimento (atribuído)" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="pendentes" name="Pendente (atraso)" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="concluidos" name="Concluído" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Line type="monotone" dataKey="total" name="Total" stroke="#64748b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="5 5">
                        <LabelList dataKey="total" position="top" offset={10} style={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                      </Line>
                    </ComposedChart>
                  ) : (
                    <LineChart data={generalStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={5} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold', paddingTop: 10 }} />
                      <Line type="monotone" dataKey="atribuidos" name="Em atendimento (atribuído)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="pendentes" name="Pendente (atraso)" stroke="#f97316" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="concluidos" name="Concluído" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="total" name="Total" stroke="#64748b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeDasharray="5 5">
                        <LabelList dataKey="total" position="top" offset={10} style={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                      </Line>
                    </LineChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                  Sem dados de status de chamados para exibir.
                </div>
              )}
            </div>
          </div>

          {/* Chamados por Técnico */}
          <div className="rounded-2xl p-6 flex flex-col h-[600px] border border-slate-800 bg-[#0b111e]/90 shadow-xl shadow-black/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Chamados por Técnico</h3>
                <p className="text-xs text-slate-400 font-medium">Quantidade de chamados atribuídos por técnico e status</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={techPeriodFilter}
                  onChange={(e) => setTechPeriodFilter(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer outline-none font-bold"
                >
                  <option value={1}>Janeiro</option>
                  <option value={2}>Fevereiro</option>
                  <option value={3}>Março</option>
                  <option value={4}>Abril</option>
                  <option value={5}>Maio</option>
                  <option value={6}>Junho</option>
                  <option value={7}>Julho</option>
                  <option value={8}>Agosto</option>
                  <option value={9}>Setembro</option>
                  <option value={10}>Outubro</option>
                  <option value={11}>Novembro</option>
                  <option value={12}>Dezembro</option>
                </select>
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              {techChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={techChartData} layout="vertical" margin={{ left: 10, right: 15, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} width={110} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          if (data.name === ' ' || !data.name.trim()) return null;
                          return (
                            <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-slate-200 text-xs p-3.5 rounded-xl shadow-2xl font-mono">
                              <p className="font-bold text-white border-b border-slate-800/80 pb-1.5 mb-1.5">{data.name}</p>
                              <div className="space-y-1.5">
                                {payload.map((p: any) => {
                                  if (p.dataKey === 'total') return null;
                                  return (
                                    <div key={p.name} className="flex justify-between items-center gap-4">
                                      <span className="flex items-center gap-2 text-slate-400">
                                        <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: p.color || p.fill }}></span>
                                        {p.name}:
                                      </span>
                                      <span className="font-bold" style={{ color: p.color || p.fill }}>{p.value}</span>
                                    </div>
                                  );
                                })}
                                <div className="border-t border-slate-800/85 mt-2 pt-1.5 flex justify-between items-center gap-4 font-bold text-slate-200">
                                  <span>Total:</span>
                                  <span>{data.total}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold', paddingTop: 10 }} />
                    <Bar dataKey="em_atendimento" name="Em atendimento" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={15} />
                    <Bar dataKey="concluidos" name="Concluídos" fill="#22c55e" radius={[0, 4, 4, 0]} maxBarSize={15} />
                    <Bar dataKey="total" name="Total" fill="#64748b" radius={[0, 4, 4, 0]} maxBarSize={15}>
                      <LabelList dataKey="total" position="right" offset={10} style={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                  Sem dados de técnicos para exibir.
                </div>
              )}
            </div>
          </div>

          {/* Recent Calls Table */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#0b111e]/90 shadow-xl shadow-black/10">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-base font-bold text-white font-display">{t('dashboard.recent')}</h3>
              <div className="flex gap-2">
                <button
                  onClick={downloadCSV}
                  className="px-3 py-1.5 border border-slate-850 text-slate-350 hover:text-white rounded-lg hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-sm"
                  title="Baixar CSV"
                >
                  <span className="material-symbols-outlined text-[16px] text-slate-455">download</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">CSV</span>
                </button>
                <button
                  onClick={downloadXLS}
                  className="px-3 py-1.5 border border-slate-850 text-slate-350 hover:text-white rounded-lg hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-sm"
                  title="Baixar Excel"
                >
                  <span className="material-symbols-outlined text-[16px] text-emerald-500">grid_on</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">XLS</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                <thead className="bg-slate-900/50 text-[10px] uppercase font-bold text-slate-400 font-display tracking-wider border-b border-slate-800">
                  <tr>
                    <th onClick={() => handleSort('display_id')} className="px-6 py-3 cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center gap-1">ID {sortKey === 'display_id' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th onClick={() => handleSort('nome')} className="px-6 py-3 cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center gap-1">Ativo {sortKey === 'nome' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th onClick={() => handleSort('status')} className="px-6 py-3 cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center gap-1">Status {sortKey === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th onClick={() => handleSort('tipo')} className="px-6 py-3 cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center gap-1">Tipo {sortKey === 'tipo' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th onClick={() => handleSort('responsavel')} className="px-6 py-3 cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center gap-1">Responsável {sortKey === 'responsavel' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th className="px-6 py-3">
                      <span className="flex items-center gap-1">Última Edição</span>
                    </th>
                    <th onClick={() => handleSort('created_at')} className="px-6 py-3 text-right cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center gap-1 justify-end">Abertura {sortKey === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
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
                        statusColor={
                          ['Concluída', 'Finalizada', 'Concluído'].includes(wo.status)
                            ? 'success'
                            : (['Em atendimento', 'Em progresso', 'Andamento'].includes(wo.status)
                              ? 'info'
                              : (wo.status === 'Aguardando Peça' ? 'warning' : 'danger'))
                        }
                        type={wo.tipo}
                        typeColor={wo.tipo === 'Corretiva' ? 'text-rose-500' : 'text-cyan-400'}
                        user={wo.created_by?.full_name || wo.tecnico_responsavel?.full_name || '---'}
                        lastEdited={wo.last_edited_by?.full_name || '-'}
                        time={new Date(wo.created_at).toLocaleDateString('pt-BR')}
                        onClick={() => navigate(`/app/ticket/${wo.id}`)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chamados em Atraso Section (Desktop) */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#0b111e]/90 shadow-xl shadow-black/10">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-500 text-[20px] animate-pulse">alarm</span>
                  Chamados em Atraso
                </h3>
                <p className="text-xs text-slate-400 mt-1">Ordens de serviço e preventivas não concluídas com prazo expirado</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Filtrar:</span>
                <select
                  value={delayedFilter}
                  onChange={(e) => setDelayedFilter(e.target.value as 'todos' | '1_mes')}
                  className="bg-slate-900 border border-slate-800 text-slate-355 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer outline-none font-bold"
                >
                  <option value="todos">Todos os atrasados</option>
                  <option value="1_mes">Atrasados há 1 mês ou mais</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                <thead className="bg-slate-900/50 text-[10px] uppercase font-bold text-slate-400 font-display tracking-wider border-b border-slate-800">
                  <tr>
                    <th onClick={() => handleDelayedSort('display_id')} className="px-6 py-3 cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center gap-1">ID {delayedSortKey === 'display_id' && (delayedSortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th onClick={() => handleDelayedSort('nome')} className="px-6 py-3 cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center gap-1">Ativo {delayedSortKey === 'nome' && (delayedSortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th onClick={() => handleDelayedSort('status')} className="px-6 py-3 cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center gap-1">Status {delayedSortKey === 'status' && (delayedSortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th onClick={() => handleDelayedSort('tipo')} className="px-6 py-3 cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center gap-1">Tipo {delayedSortKey === 'tipo' && (delayedSortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th onClick={() => handleDelayedSort('tempo_atraso')} className="px-6 py-3 cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center gap-1">Tempo de Atraso {delayedSortKey === 'tempo_atraso' && (delayedSortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th onClick={() => handleDelayedSort('data_limite')} className="px-6 py-3 cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center gap-1">Prazo Original {delayedSortKey === 'data_limite' && (delayedSortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                    <th onClick={() => handleDelayedSort('responsavel')} className="px-6 py-3 cursor-pointer hover:text-cyan-400 transition-colors">
                      <span className="flex items-center gap-1">Responsável {delayedSortKey === 'responsavel' && (delayedSortOrder === 'asc' ? '↑' : '↓')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {sortedDelayedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500 italic">
                        Nenhum chamado em atraso encontrado para o filtro selecionado.
                      </td>
                    </tr>
                  ) : (
                    sortedDelayedTickets.map(t => {
                      const isClosedGray = t.tipo === 'Preventiva' && isPreviousMonthOrOlder(t.data_limite);
                      const displayStatus = isClosedGray ? 'Fechado' : t.status;
                      const statusBadgeClass = isClosedGray
                        ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                      const statusDotClass = isClosedGray
                        ? 'bg-slate-400'
                        : 'bg-rose-400 animate-pulse';
                      const delayColorClass = isClosedGray
                        ? 'text-slate-400 font-semibold'
                        : 'text-rose-400 font-black';

                      return (
                        <tr
                          key={t.id}
                          onClick={() => navigate(`/app/ticket/${t.id}`)}
                          className="hover:bg-slate-800/10 transition-colors cursor-pointer border-b border-slate-800/50 last:border-0 text-slate-300"
                        >
                          <td className="px-6 py-4 font-mono text-xs text-slate-400">
                            #{t.display_id || t.id.slice(0, 5)}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-200 text-sm">
                            {t.ativos?.nome || 'Geral'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeClass}`}>
                              <span className={`size-1.5 rounded-full ${statusDotClass}`}></span>
                              {displayStatus}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-xs font-semibold ${t.tipo === 'Corretiva' ? 'text-rose-500' : 'text-cyan-400'}`}>
                            {t.tipo}
                          </td>
                          <td className={`px-6 py-4 text-sm ${delayColorClass}`}>
                            {calculateDelay(t.data_limite)}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                            {t.data_limite ? t.data_limite.split('-').reverse().join('/') : '-'}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {t.created_by?.full_name || t.tecnico_responsavel?.full_name || '---'}
                          </td>
                        </tr>
                      );
                    })
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
      case 'cyan': return {
        gradient: 'from-cyan-500/20 to-cyan-600/5',
        iconBg: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
        iconColor: 'text-white',
        accentBorder: 'border-cyan-500/30'
      };
      case 'purple': return {
        gradient: 'from-purple-500/30 to-purple-600/10',
        iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
        iconColor: 'text-white',
        accentBorder: 'border-purple-500/40'
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
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
};

const AlertItem: React.FC<{ icon: string, name: string, sector: string, date: string, due: string, status: 'warning' | 'success' | 'neutral' | 'danger', onClick?: () => void }> = ({ icon, name, sector, date, due, status, onClick }) => {
  const getStatusStyles = (s: string) => {
    const clean = (s || '').toLowerCase().trim();
    if (['concluído', 'concluido', 'concluída', 'concluida', 'finalizado', 'finalizada'].includes(clean)) {
      return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
    }
    if (['em atendimento', 'em progresso', 'andamento'].includes(clean)) {
      return 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
    }
    if (['aberto', 'em aberto'].includes(clean)) {
      return 'text-blue-400 bg-blue-500/10 border border-blue-500/20';
    }
    if (['pendente', 'atraso', 'em atraso'].includes(clean)) {
      return 'text-rose-400 bg-rose-500/10 border border-rose-500/20';
    }
    return 'text-slate-400 bg-slate-500/10 border border-slate-500/20';
  };

  return (
    <div onClick={onClick} className="flex items-center p-3 hover:bg-[var(--bg-color)] rounded-lg transition-colors group cursor-pointer border border-transparent hover:border-[var(--border-color)]">
      <div className="relative size-10 rounded bg-[var(--bg-color)] flex items-center justify-center mr-3 shrink-0">
        <span className="material-symbols-outlined text-[var(--text-secondary)] group-hover:text-primary transition-colors">{icon}</span>
        <div className={`absolute top-0 right-0 size-2.5 rounded-full border-2 border-[var(--surface-color)] ${status === 'warning' ? 'bg-amber-500' : status === 'success' ? 'bg-emerald-500' : status === 'danger' ? 'bg-rose-500 animate-pulse' : 'hidden'}`}></div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[var(--text-main)] truncate group-hover:text-primary transition-colors font-display">{name}</p>
        <p className="text-xs text-[var(--text-secondary)] truncate">{sector}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-white font-display">{date}</p>
        <p className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded inline-block mt-1 ${getStatusStyles(due)}`}>{due}</p>
      </div>
    </div>
  );
};

const TableRow: React.FC<{ id: string, asset: string, status: string, statusColor: string, type: string, typeColor: string, user: string, lastEdited: string, time: string, onClick?: () => void }> = ({ id, asset, status, statusColor, type, typeColor, user, lastEdited, time, onClick }) => {
  const getStatusBadgeStyles = (s: string) => {
    switch (s) {
      case 'success':
        return {
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-400'
        };
      case 'info':
        return {
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          dot: 'bg-blue-400'
        };
      case 'warning':
        return {
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          dot: 'bg-amber-400 animate-pulse'
        };
      case 'danger':
      default:
        return {
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          dot: 'bg-rose-400 animate-pulse'
        };
    }
  };

  const { badge, dot } = getStatusBadgeStyles(statusColor);

  return (
    <tr onClick={onClick} className="hover:bg-[var(--bg-color)] transition-colors cursor-pointer border-b border-slate-800/50 last:border-0 text-slate-350">
      <td className="px-6 py-4 font-mono text-[var(--text-secondary)]">{id}</td>
      <td className="px-6 py-4 font-bold text-[var(--text-main)]">{asset}</td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge}`}>
          <span className={`size-1.5 rounded-full ${dot}`}></span>
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