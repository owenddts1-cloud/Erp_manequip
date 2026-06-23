import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { usePreferences } from '../contexts/PreferencesContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface TechnicianRank {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  completedCount: number;
  assignedCount: number;
}

interface CriticalItem {
  id: string;
  nome_peca: string;
  quantidade_estoque: number;
  estoque_minimo: number;
}

interface CustomAnnouncement {
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  icon: string;
}

type VisualTheme = 'cyberpunk' | 'professional' | 'industrial' | 'safety';
type TransitionEffect = 'fade' | 'slide' | 'zoom';

const Announcements: React.FC = () => {
  const { t } = usePreferences();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [delay, setDelay] = useState(10); // Time per slide in seconds
  const [timeLeft, setTimeLeft] = useState(10);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Styling & Theme Configuration States
  const [theme, setTheme] = useState<VisualTheme>('safety');
  const [transitionEffect, setTransitionEffect] = useState<TransitionEffect>('fade');
  const [safetyBgUrl, setSafetyBgUrl] = useState('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=1200');

  // Database metrics states
  const [loading, setLoading] = useState(true);
  const [preventivesTotal, setPreventivesTotal] = useState(0);
  const [preventivesCompleted, setPreventivesCompleted] = useState(0);
  const [preventivesInAttendance, setPreventivesInAttendance] = useState(0);
  const [preventivesOpen, setPreventivesOpen] = useState(0);
  
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalInventoryItems, setTotalInventoryItems] = useState(0);
  const [criticalItems, setCriticalItems] = useState<CriticalItem[]>([]);
  const [technicianRanking, setTechnicianRanking] = useState<TechnicianRank[]>([]);
  const [inAttendanceList, setInAttendanceList] = useState<any[]>([]);
  
  // Chart states for Slide 1
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);

  // Slide config states
  const [customTitle, setCustomTitle] = useState('');
  const [activeSlides, setActiveSlides] = useState({
    summary: true,
    inAttendance: true,
    assets: true,
    ranking: true,
    custom: true,
  });
  const [customAnnouncement, setCustomAnnouncement] = useState<CustomAnnouncement>({
    title: 'Atenção à Segurança Individual',
    content: 'O uso de Equipamentos de Proteção Individual (EPIs) é obrigatório em todas as áreas de manutenção. Cuide de si e da sua equipe! O descumprimento poderá acarretar sanções.',
    type: 'warning',
    icon: 'engineering',
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Month tracking
  const now = new Date();
  const currentMonthNum = now.getMonth() + 1;
  const currentYearNum = now.getFullYear();
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const currentMonthName = monthNames[now.getMonth()];
  const displayTitle = customTitle || `Comunicados de ${currentMonthName}`;

  // List of active slides based on config
  const enabledSlides = useMemo(() => {
    const list = [];
    if (activeSlides.summary) list.push('summary');
    if (activeSlides.inAttendance) list.push('inAttendance');
    if (activeSlides.assets) list.push('assets');
    if (activeSlides.ranking) list.push('ranking');
    if (activeSlides.custom) list.push('custom');
    return list;
  }, [activeSlides.summary, activeSlides.inAttendance, activeSlides.assets, activeSlides.ranking, activeSlides.custom]);

  // Fullscreen Management
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error entering full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Fetch metrics from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch preventives metrics for current month
      const { data: pms, error: pmsError } = await supabase
        .from('preventivas_mensais')
        .select(`
          id,
          titulo,
          status,
          mes,
          ano,
          tecnico_responsavel:tecnico_responsavel (id, full_name, avatar_url, role),
          tecnico_responsavel_2:tecnico_responsavel_2 (id, full_name, avatar_url, role),
          ativos:ativo_id (id, nome)
        `);

      if (pmsError) throw pmsError;

      // Current month filter
      const currentMonthPMs = (pms || []).filter(p => p.mes === currentMonthNum && p.ano === currentYearNum);
      const total = currentMonthPMs.length;
      const completed = currentMonthPMs.filter(p => p.status === 'Concluído').length;
      const inAttendance = currentMonthPMs.filter(p => p.status === 'Em atendimento').length;
      const open = currentMonthPMs.filter(p => p.status === 'Em aberto').length;

      setPreventivesTotal(total);
      setPreventivesCompleted(completed);
      setPreventivesInAttendance(inAttendance);
      setPreventivesOpen(open);

      // Populate in attendance list (active preventives in progress)
      const inAttendanceOS = currentMonthPMs.filter(p => p.status === 'Em atendimento');
      setInAttendanceList(inAttendanceOS);

      // Calculate Jan-Dec chart data for current year
      const chartMap: Record<number, { name: string, concluidas: number, total: number }> = {};
      const shortMonths = ['Jan', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      for (let m = 0; m < 12; m++) {
        chartMap[m + 1] = { name: shortMonths[m], concluidas: 0, total: 0 };
      }

      pms?.forEach(pm => {
        if (pm.ano === currentYearNum && chartMap[pm.mes]) {
          chartMap[pm.mes].total++;
          if (pm.status === 'Concluído') {
            chartMap[pm.mes].concluidas++;
          }
        }
      });
      setMonthlyChartData(Object.values(chartMap));

      // 2. Fetch assets total
      const { count: assetsCount, error: assetsError } = await supabase
        .from('ativos')
        .select('*', { count: 'exact', head: true });

      if (assetsError) throw assetsError;
      setTotalAssets(assetsCount || 0);

      // 3. Fetch inventory metrics
      const { data: inv, error: invError } = await supabase
        .from('inventario')
        .select('id, nome_peca, quantidade_estoque, estoque_minimo');

      if (invError) throw invError;
      setTotalInventoryItems(inv?.length || 0);

      // Inventory items in critical stock
      const critical = (inv || [])
        .filter(item => item.quantidade_estoque <= (item.estoque_minimo || 0))
        .map(item => ({
          id: item.id,
          nome_peca: item.nome_peca,
          quantidade_estoque: item.quantidade_estoque,
          estoque_minimo: item.estoque_minimo || 0
        }));
      setCriticalItems(critical);

      // 4. Calculate technician ranking for the month
      const techMap: Record<string, TechnicianRank> = {};

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .eq('is_approved', true);

      profiles?.forEach(profile => {
        techMap[profile.id] = {
          id: profile.id,
          name: profile.full_name || 'Desconhecido',
          avatarUrl: profile.avatar_url || null,
          role: profile.role || 'Técnico',
          completedCount: 0,
          assignedCount: 0
        };
      });

      currentMonthPMs.forEach(pm => {
        if (pm.tecnico_responsavel?.id && techMap[pm.tecnico_responsavel.id]) {
          techMap[pm.tecnico_responsavel.id].assignedCount++;
          if (pm.status === 'Concluído') {
            techMap[pm.tecnico_responsavel.id].completedCount++;
          }
        }
        if (pm.tecnico_responsavel_2?.id && techMap[pm.tecnico_responsavel_2.id]) {
          techMap[pm.tecnico_responsavel_2.id].assignedCount++;
          if (pm.status === 'Concluído') {
            techMap[pm.tecnico_responsavel_2.id].completedCount++;
          }
        }
      });

      const ranking = Object.values(techMap)
        .filter(t => t.assignedCount > 0)
        .sort((a, b) => {
          const rateA = a.completedCount / a.assignedCount;
          const rateB = b.completedCount / b.assignedCount;
          if (rateB !== rateA) {
            return rateB - rateA;
          }
          return b.completedCount - a.completedCount;
        });

      setTechnicianRanking(ranking);
    } catch (err) {
      console.error('Error fetching announcements data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('announcements-premium')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'preventivas_mensais' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ativos' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Timer loop for slides rotation
  useEffect(() => {
    if (!isPlaying || enabledSlides.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCurrentSlide(curr => (curr + 1) % enabledSlides.length);
          return delay;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, enabledSlides, delay]);

  // Sync timeLeft when slide manually changes or delay updates
  useEffect(() => {
    setTimeLeft(delay);
  }, [currentSlide, delay]);

  const handleNext = () => {
    if (enabledSlides.length > 0) {
      setCurrentSlide(prev => (prev + 1) % enabledSlides.length);
    }
  };

  const handlePrev = () => {
    if (enabledSlides.length > 0) {
      setCurrentSlide(prev => (prev - 1 + enabledSlides.length) % enabledSlides.length);
    }
  };

  // Theme Styling Properties
  const isLightCard = theme === 'industrial';
  const tColor = isLightCard ? 'text-slate-900' : 'text-white';
  const mColor = isLightCard ? 'text-slate-500' : 'text-slate-400';
  const bgCardClass = isLightCard 
    ? 'bg-white border-slate-200 shadow-md text-slate-800' 
    : 'bg-[#161f30]/85 border-[#28354c]/70 text-slate-200';
  const containerBgClass = isLightCard 
    ? 'bg-[#f1f5f9] text-slate-800' 
    : theme === 'cyberpunk' 
      ? 'bg-[#060a13]' 
      : 'bg-[#0b1329]';

  // Specific theme color palettes
  const getThemeColor = () => {
    switch (theme) {
      case 'cyberpunk': return '#00d2ff';
      case 'professional': return '#0ea5e9';
      case 'industrial': return '#f59e0b';
      case 'safety': return '#eab308';
    }
  };
  const themeAccentHex = getThemeColor();

  const alertStyles = {
    info: { bg: isLightCard ? 'bg-blue-50' : 'bg-cyan-500/10', border: isLightCard ? 'border-blue-200' : 'border-cyan-500/30', text: 'text-cyan-400', glow: 'shadow-cyan-500/5' },
    success: { bg: isLightCard ? 'bg-emerald-50' : 'bg-emerald-500/10', border: isLightCard ? 'border-emerald-200' : 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-emerald-500/5' },
    warning: { bg: isLightCard ? 'bg-amber-50' : 'bg-amber-500/10', border: isLightCard ? 'border-amber-200' : 'border-amber-500/30', text: 'text-amber-400', glow: 'shadow-amber-500/5' },
    danger: { bg: isLightCard ? 'bg-rose-50' : 'bg-rose-500/10', border: isLightCard ? 'border-rose-200' : 'border-rose-500/30', text: 'text-rose-400', glow: 'shadow-rose-500/5' },
  };

  const currentAlertStyle = alertStyles[customAnnouncement.type] || alertStyles.info;

  // Transition animations mapping
  const getTransitionClass = () => {
    switch (transitionEffect) {
      case 'fade': return 'animate-fade-in duration-500';
      case 'slide': return 'animate-slide-in duration-500';
      case 'zoom': return 'animate-zoom-in duration-500';
    }
  };

  const completionRate = preventivesTotal > 0 ? Math.round((preventivesCompleted / preventivesTotal) * 100) : 0;

  // Circular timer progress parameters
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / delay) * circumference;

  const isCustomSlide = enabledSlides[currentSlide] === 'custom';

  return (
    <div className={`flex-1 flex flex-col overflow-hidden h-full relative p-6 select-none ${containerBgClass} transition-colors duration-500`}>
      
      {/* Styles for transition animations and fonts */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes zoomIn {
          from { transform: scale(0.97); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes goldShine {
          0%, 100% { 
            border-color: rgba(245, 158, 11, 0.35); 
            box-shadow: 0 0 12px rgba(245, 158, 11, 0.1), inset 0 0 12px rgba(245, 158, 11, 0.05); 
          }
          50% { 
            border-color: rgba(245, 158, 11, 0.7); 
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.25), inset 0 0 20px rgba(245, 158, 11, 0.1); 
          }
        }
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-up { 
          opacity: 0;
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
        .animate-slide-in { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-zoom-in { animation: zoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-gold-shine { animation: goldShine 3s infinite ease-in-out; }
        .animate-first-place {
          opacity: 0;
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards, goldShine 3s infinite ease-in-out;
        }
        
        .custom-glass {
          background: rgba(22, 31, 48, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(40, 53, 76, 0.7);
        }
        .custom-glass-light {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .blue-blueprint-grid {
          background-size: 32px 32px;
          background-image: 
            linear-gradient(to right, rgba(14, 165, 233, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(14, 165, 233, 0.05) 1px, transparent 1px);
        }
      `}</style>

      {/* Cyberpunk Grid Overlay */}
      {theme === 'cyberpunk' && (
        <div className="absolute inset-0 bg-grid-pattern-dark opacity-30 pointer-events-none z-0"></div>
      )}

      {/* Full layout flexbox wrapper */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 z-10 overflow-hidden">
        
        {/* Slide Display Container */}
        <div 
          ref={containerRef}
          className={`flex-1 flex flex-col justify-between rounded-2xl relative overflow-hidden shadow-2xl transition-all duration-500 ${
            isFullscreen ? 'p-12 bg-[#090e1a]' : 'p-6'
          } ${
            theme === 'safety' || isCustomSlide
              ? 'bg-[#090e1a]' 
              : isLightCard 
                ? 'custom-glass-light border-slate-200' 
                : 'custom-glass border-slate-800'
          }`}
          style={
            theme === 'safety' || isCustomSlide
              ? {
                  backgroundImage: `linear-gradient(rgba(9, 14, 26, 0.85), rgba(9, 14, 26, 0.85)), url(${
                    isCustomSlide ? '/assets/safety_gear_background.png' : safetyBgUrl
                  })`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {}
          }
        >
          
          {/* Slide Header */}
          <div className={`flex items-center justify-between border-b ${isLightCard && !isCustomSlide ? 'border-slate-200' : 'border-slate-800/80'} pb-4 shrink-0`}>
            <div className="flex items-center gap-3">
              <div 
                className="size-11 rounded-xl flex items-center justify-center shadow-lg transition-colors"
                style={{ 
                  background: isCustomSlide 
                    ? 'linear-gradient(135deg, #eab308, #ca8a04)' 
                    : `linear-gradient(135deg, ${themeAccentHex}, ${themeAccentHex}dd)`, 
                  boxShadow: `0 8px 16px -4px ${isCustomSlide ? '#eab308' : themeAccentHex}50`
                }}
              >
                <span className="material-symbols-outlined text-white text-[24px]">
                  {isCustomSlide ? 'shield' : 'campaign'}
                </span>
              </div>
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${isCustomSlide ? 'text-white' : tColor}`}>{displayTitle}</h2>
                <p className={`text-xs font-mono uppercase tracking-wider mt-0.5 ${isCustomSlide ? 'text-slate-400' : mColor}`}>
                  {isCustomSlide || theme === 'safety' ? 'Safety Compliance Notice' : 'Manequip 360 Industrial OS'}
                </p>
              </div>
            </div>

            {/* Actions / Controls */}
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`size-9 rounded-lg flex items-center justify-center border transition-all active:scale-95 ${
                  isCustomSlide
                    ? 'bg-transparent border-[#eab308]/50 text-[#eab308] hover:bg-[#eab308]/15 font-bold tracking-wide transition-all'
                    : isLightCard 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' 
                      : 'bg-slate-850 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                }`}
                title={isPlaying ? 'Pausar' : 'Play'}
              >
                <span className="material-symbols-outlined text-[20px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
              </button>

              {/* Fullscreen Button */}
              <button 
                onClick={toggleFullscreen}
                className={`size-9 rounded-lg flex items-center justify-center border transition-all active:scale-95 ${
                  isCustomSlide
                    ? 'bg-transparent border-[#eab308]/50 text-[#eab308] hover:bg-[#eab308]/15 font-bold tracking-wide transition-all'
                    : isLightCard 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' 
                      : 'bg-slate-850 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                }`}
                title="Tela Cheia"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                </span>
              </button>

              {/* Stopwatch timer */}
              {isPlaying && enabledSlides.length > 0 && (
                <div className="relative size-10 flex items-center justify-center ml-1 group scale-110">
                  <div className={`absolute -top-[3.5px] w-2.5 h-1.5 rounded-sm transition-colors z-20 ${
                    isCustomSlide ? 'bg-[#eab308]' : 'bg-slate-400 group-hover:bg-slate-350'
                  }`}></div>
                  <div className={`absolute -top-[1.5px] -left-[1.5px] w-1.5 h-1.5 rounded-sm rotate-45 z-10 ${
                    isCustomSlide ? 'bg-[#eab308]/80' : 'bg-slate-500'
                  }`}></div>
                  <div className={`absolute -top-[1.5px] -right-[1.5px] w-1.5 h-1.5 rounded-sm -rotate-45 z-10 ${
                    isCustomSlide ? 'bg-[#eab308]/80' : 'bg-slate-500'
                  }`}></div>
                  <svg className="size-10 rotate-270 relative z-10">
                    <circle
                      cx="20"
                      cy="20"
                      r={radius}
                      className={`fill-none ${
                        isCustomSlide 
                          ? 'stroke-[#eab308]/20' 
                          : isLightCard ? 'stroke-slate-200' : 'stroke-slate-800/80'
                      }`}
                      strokeWidth="2.5"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r={radius}
                      className="fill-none transition-all duration-1000 ease-linear"
                      style={{ stroke: isCustomSlide ? '#eab308' : themeAccentHex }}
                      strokeWidth="2.5"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-mono font-bold z-10" style={{ color: isCustomSlide ? '#eab308' : themeAccentHex }}>{timeLeft}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Slide Presentation Area */}
          <div className="flex-1 flex items-center justify-center py-6 overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-cyan-500 text-4xl animate-spin">progress_activity</span>
                <span className="text-sm text-slate-400 font-mono tracking-widest uppercase">Processando base de dados...</span>
              </div>
            ) : enabledSlides.length === 0 ? (
              <div className={`text-center p-8 border border-dashed rounded-2xl max-w-md ${isLightCard ? 'border-slate-300 bg-slate-50' : 'border-slate-800 bg-slate-900/30'}`}>
                <span className="material-symbols-outlined text-slate-500 text-5xl">visibility_off</span>
                <h3 className={`text-lg font-bold mt-3 ${tColor}`}>Nenhum slide selecionado</h3>
                <p className={`text-sm mt-2 ${mColor}`}>Marque os slides desejados no painel de configurações na lateral.</p>
              </div>
            ) : (
              <div className={`w-full h-full flex flex-col justify-center ${getTransitionClass()}`}>
                
                {/* SLIDE 1: Maintenance Summary (Gestão de Preventivas) */}
                {enabledSlides[currentSlide] === 'summary' && (
                  <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
                    
                    {/* Left stats cards */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="border-l-4 pl-4" style={{ borderColor: themeAccentHex }}>
                        <h3 className={`text-2xl font-bold ${tColor}`}>Gestão de Preventivas</h3>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className={`p-6 border rounded-2xl relative overflow-hidden transition-all duration-300 shadow-lg hover:scale-[1.02] ${
                          isLightCard 
                            ? 'bg-white border-slate-200 shadow-slate-200/50 shadow-md' 
                            : 'bg-[#161f30]/90 border-cyan-500/25 shadow-cyan-500/5 hover:border-cyan-500/40'
                        }`}>
                          <div className="absolute top-4 right-4 size-10 rounded-full flex items-center justify-center bg-cyan-500/10 text-cyan-400">
                            <span className="material-symbols-outlined text-[20px] animate-pulse">engineering</span>
                          </div>
                          <div className="text-5xl font-black text-white tracking-tight drop-shadow-[0_0_8px_rgba(14,165,233,0.35)]">{preventivesInAttendance}</div>
                          <div className={`text-sm font-bold mt-2 ${tColor}`}>Em Atendimento</div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-normal">Ordens de serviço atualmente sendo executadas em campo.</p>
                        </div>
                        
                        <div className={`p-6 border rounded-2xl relative overflow-hidden transition-all duration-300 shadow-lg hover:scale-[1.02] ${
                          isLightCard 
                            ? 'bg-white border-slate-200 shadow-slate-200/50 shadow-md' 
                            : 'bg-[#161f30]/90 border-emerald-500/25 shadow-emerald-500/5 hover:border-emerald-500/40'
                        }`}>
                          <div className="absolute top-4 right-4 size-10 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-400">
                            <span className="material-symbols-outlined text-[20px]">task_alt</span>
                          </div>
                          <div className="text-5xl font-black text-white tracking-tight drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]">{preventivesCompleted}</div>
                          <div className={`text-sm font-bold mt-2 ${tColor}`}>Concluídas</div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-normal">Ordens de serviço finalizadas e validadas no mês.</p>
                        </div>
                      </div>
                    </div>

                    {/* Right circular progress & Bar chart container */}
                    <div className={`lg:col-span-7 h-full flex flex-col p-6 border rounded-2xl gap-6 shadow-xl ${bgCardClass}`}>
                      
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6 flex-1 min-h-0">
                        {/* Circular Gauge */}
                        <div className="flex flex-col items-center justify-center shrink-0">
                          <div className="relative size-36 flex items-center justify-center">
                            <svg className="size-36 rotate-270">
                              <circle
                                cx="72"
                                cy="72"
                                r="58"
                                className={`fill-none ${isLightCard ? 'stroke-slate-200' : 'stroke-slate-800'}`}
                                strokeWidth="8.5"
                              />
                              <circle
                                cx="72"
                                cy="72"
                                r="58"
                                className="fill-none transition-all duration-1000"
                                style={{ stroke: themeAccentHex }}
                                strokeWidth="8.5"
                                strokeDasharray={2 * Math.PI * 58}
                                strokeDashoffset={2 * Math.PI * 58 - (completionRate / 100) * 2 * Math.PI * 58}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute text-center">
                              <span className={`text-3xl font-black ${tColor}`}>{completionRate}%</span>
                              <p className={`text-[10px] uppercase font-bold tracking-wider mt-0.5 ${mColor}`}>Concluído</p>
                            </div>
                          </div>
                          <span className={`text-xs mt-3 font-bold ${tColor}`}>{completionRate}% Concluído</span>
                        </div>

                        {/* Recharts Bar Chart */}
                        <div className="flex-1 w-full h-[200px] flex flex-col justify-between min-w-0">
                          <div className="flex justify-between items-center text-[10px] font-mono tracking-wider uppercase mb-2 text-slate-400">
                            <span>Histograma Anual</span>
                            <span>{currentYearNum}</span>
                          </div>
                          <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={monthlyChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                  cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                                  contentStyle={isLightCard 
                                    ? { backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '11px' }
                                    : { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px', fontSize: '11px' }
                                  }
                                />
                                <Bar dataKey="total" fill="#0ea5e9" radius={[2, 2, 0, 0]} barSize={8} />
                                <Bar dataKey="concluidas" fill="#10b981" radius={[2, 2, 0, 0]} barSize={8} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* Completion bar at the bottom */}
                      <div className={`pt-4 border-t ${isLightCard ? 'border-slate-200' : 'border-slate-800/80'} shrink-0`}>
                        <span className={`text-[11px] uppercase font-bold tracking-wider ${mColor}`}>Taxa de Conclusão</span>
                        <div className={`w-full h-2 rounded-full mt-2 overflow-hidden ${isLightCard ? 'bg-slate-200' : 'bg-slate-900'}`}>
                          <div 
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ 
                              width: `${completionRate}%`,
                              backgroundColor: themeAccentHex,
                              boxShadow: `0 0 8px ${themeAccentHex}aa`
                            }}
                          ></div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* SLIDE: Preventivas em Atendimento */}
                {enabledSlides[currentSlide] === 'inAttendance' && (
                  <div className="w-full flex flex-col gap-6 h-full justify-center">
                    <div className="border-l-4 pl-4 shrink-0" style={{ borderColor: themeAccentHex }}>
                      <h3 className={`text-2xl font-bold ${tColor}`}>Preventivas em Atendimento</h3>
                      <p className={`text-xs mt-1 ${mColor}`}>Atividades em execução de manutenção preventiva para o mês de {currentMonthName}.</p>
                    </div>

                    <div className={`flex-1 border rounded-2xl overflow-hidden min-h-0 shadow-2xl ${bgCardClass}`}>
                      <div className="h-full overflow-y-auto pr-1">
                        {inAttendanceList.length > 0 ? (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className={`border-b ${isLightCard ? 'border-slate-200 text-slate-500 bg-slate-50/50' : 'border-slate-800 text-slate-400 bg-slate-900/30'} text-xs font-bold uppercase tracking-wider`}>
                                <th className="py-4 px-6">Equipamento</th>
                                <th className="py-4 px-6">Atividade / Título</th>
                                <th className="py-4 px-6">Responsáveis</th>
                                <th className="py-4 px-6 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inAttendanceList.map((pm, index) => {
                                const tech1 = pm.tecnico_responsavel;
                                const tech2 = pm.tecnico_responsavel_2;
                                return (
                                  <tr 
                                    key={pm.id} 
                                    className={`border-b ${
                                      isLightCard ? 'border-slate-100' : 'border-slate-800/50'
                                    } hover:bg-slate-800/10 transition-colors text-sm animate-fade-in-up`}
                                    style={{ animationDelay: `${index * 80}ms` }}
                                  >
                                    {/* Asset Name */}
                                    <td className="py-4 px-6 font-extrabold">
                                      <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-cyan-400">precision_manufacturing</span>
                                        <span className={tColor}>{pm.ativos?.nome || 'Sem Ativo'}</span>
                                      </div>
                                    </td>

                                    {/* Title */}
                                    <td className={`py-4 px-6 font-semibold ${tColor}`}>
                                      {pm.titulo}
                                    </td>

                                    {/* Technicians */}
                                    <td className="py-4 px-6 font-semibold">
                                      <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2 overflow-hidden">
                                          {tech1 && (
                                            <div className="inline-block size-8 rounded-full ring-2 ring-slate-950 overflow-hidden border border-slate-700 bg-slate-900" title={tech1.full_name}>
                                              {tech1.avatar_url ? (
                                                <img src={tech1.avatar_url} alt={tech1.full_name} className="w-full h-full object-cover" />
                                              ) : (
                                                <span className="material-symbols-outlined text-slate-400 text-xs flex items-center justify-center h-full">person</span>
                                              )}
                                            </div>
                                          )}
                                          {tech2 && (
                                            <div className="inline-block size-8 rounded-full ring-2 ring-slate-950 overflow-hidden border border-slate-700 bg-slate-900" title={tech2.full_name}>
                                              {tech2.avatar_url ? (
                                                <img src={tech2.avatar_url} alt={tech2.full_name} className="w-full h-full object-cover" />
                                              ) : (
                                                <span className="material-symbols-outlined text-slate-400 text-xs flex items-center justify-center h-full">person</span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <span className={`text-xs ${mColor}`}>
                                          {[tech1?.full_name, tech2?.full_name].filter(Boolean).join(' & ') || 'Nenhum'}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Pulsing Badge */}
                                    <td className="py-4 px-6 text-right">
                                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm animate-pulse">
                                        <span className="size-2 rounded-full bg-amber-400"></span>
                                        Em Atendimento
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[220px]">
                            <span className="material-symbols-outlined text-emerald-500 text-5xl">check_circle</span>
                            <h4 className={`text-base font-bold mt-3 ${tColor}`}>Sem Preventivas em Atendimento</h4>
                            <p className={`text-xs mt-1 max-w-xs ${mColor}`}>Todas as manutenções preventivas abertas para este período já foram concluídas ou aguardam início.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE 2: Inventory & Assets (Controle de Estoque) */}
                {enabledSlides[currentSlide] === 'assets' && (
                  <div className="w-full flex flex-col gap-6 h-full justify-center relative">
                    {/* Blueprint Grid Overlay for blueprint feel */}
                    {!isLightCard && (
                      <div className="absolute inset-0 blue-blueprint-grid opacity-30 pointer-events-none -m-6 rounded-2xl z-0"></div>
                    )}
                    
                    <div className="border-l-4 pl-4 shrink-0 z-10" style={{ borderColor: themeAccentHex }}>
                      <h3 className={`text-2xl font-bold ${tColor}`}>Inventory Control Dashboard</h3>
                      <p className={`text-[13px] font-medium mt-1 ${mColor}`}>Painel profissional de monitoramento de ativos e peças de reposição.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 z-10">
                      {/* Metric 1 */}
                      <div className={`p-5 rounded-2xl relative overflow-hidden group transition-all duration-300 border shadow-lg ${bgCardClass}`}>
                        <span className={`text-[11px] font-bold uppercase tracking-wider block ${mColor}`}>Ativos Cadastrados</span>
                        <div className={`text-4xl font-extrabold mt-2 tracking-tight ${tColor}`}>{totalAssets}</div>
                        <p className={`text-xs font-semibold mt-2 ${mColor}`}>Máquinas e equipamentos monitorados.</p>
                      </div>

                      {/* Metric 3 */}
                      <div className={`p-5 rounded-2xl relative overflow-hidden flex items-center justify-between group transition-all duration-300 border shadow-lg ${bgCardClass}`}>
                        <div>
                          <span className={`text-[11px] font-bold uppercase tracking-wider block ${mColor}`}>Estoque Crítico</span>
                          <div className="text-4xl font-extrabold mt-2 text-rose-500 tracking-tight">{criticalItems.length}</div>
                          <p className={`text-xs font-semibold mt-2 ${mColor}`}>Peças abaixo do estoque mínimo.</p>
                        </div>
                        <span className="material-symbols-outlined text-amber-500 text-5xl shrink-0 animate-pulse">warning</span>
                      </div>
                    </div>

                    {/* Critical parts section */}
                    <div className={`flex-1 rounded-2xl p-6 shadow-xl flex flex-col min-h-0 z-10 border ${bgCardClass}`}>
                      <div className={`flex items-center gap-2 text-[11px] font-bold font-mono uppercase tracking-wider mb-4 border-b pb-3 ${
                        isLightCard ? 'border-slate-100' : 'border-slate-800/80'
                      }`}>
                        <span className="material-symbols-outlined text-[18px] text-amber-500">warning</span>
                        <span className={tColor}>Estoque Crítico de Peças</span>
                      </div>
                      
                      {criticalItems.length > 0 ? (
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                          {criticalItems.map((item) => {
                            const minVal = item.estoque_minimo || 1;
                            const curVal = Math.max(0, item.quantidade_estoque);
                            const ratio = Math.min(100, (curVal / minVal) * 100);
                            const isCritical = item.quantidade_estoque <= 0;
                            
                            return (
                              <div key={item.id} className={`flex flex-col md:flex-row md:items-center justify-between p-3.5 border rounded-xl text-xs gap-4 transition-colors shadow-sm ${
                                isLightCard 
                                  ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-850' 
                                  : 'bg-[#0f172a]/60 border-slate-800/70 hover:bg-[#0f172a]/90 text-slate-200'
                              }`}>
                                <span className={`font-extrabold w-32 md:w-44 truncate ${tColor}`}>{item.nome_peca}</span>
                                <span className={`text-[13px] font-bold font-mono w-44 truncate ${tColor}`}>
                                  SN-{item.id.slice(0, 5).toUpperCase()}
                                </span>
                                
                                <div className={`flex-1 h-3.5 rounded-full overflow-hidden relative mx-2 ${
                                  isLightCard ? 'bg-slate-200' : 'bg-slate-800'
                                }`}>
                                  <div 
                                    className="h-full bg-[#f59e0b] rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(100, Math.max(10, ratio))}%`, boxShadow: '0 0 8px rgba(245, 158, 11, 0.4)' }}
                                  ></div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0 font-semibold text-[11px]">
                                  <span className={`text-[12px] ${mColor}`}>Mínimo: <strong className={`text-[13px] ${tColor}`}>{item.estoque_minimo}</strong></span>
                                  <span className={`px-3 py-1 rounded-md font-extrabold text-[12px] ${
                                    isCritical 
                                      ? 'bg-red-500/10 border border-red-500/30 text-red-400' 
                                      : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                                  }`}>
                                    Qtd: {item.quantidade_estoque}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={`flex-1 border border-dashed rounded-xl flex items-center justify-center text-center p-6 ${
                          isLightCard ? 'border-slate-200 bg-emerald-50/20' : 'border-slate-850/50 bg-emerald-500/5'
                        }`}>
                          <div className="flex items-center gap-2 text-emerald-500 text-xs font-mono uppercase tracking-wider font-semibold">
                            <span className="material-symbols-outlined text-[18px]">verified</span>
                            Todos os Níveis de Estoque Estão Estáveis
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* SLIDE 3: Technician Performance Leaderboard (Ranking de Técnicos) */}
                {enabledSlides[currentSlide] === 'ranking' && (
                  <div className="w-full flex flex-col gap-6 h-full justify-center">
                    
                    <div className="text-center shrink-0 mb-4 animate-fade-in">
                      <h3 className={`text-4xl font-extrabold tracking-tight ${tColor}`}>Technician Performance Report</h3>
                      <p className={`text-sm mt-2 ${mColor}`}>Colaboradores classificados por taxa de conclusão e rendimento no período.</p>
                    </div>

                    <div className={`flex-1 border rounded-2xl overflow-hidden min-h-0 shadow-2xl ${bgCardClass}`}>
                      <div className="h-full overflow-y-auto pr-1">
                        {technicianRanking.length > 0 ? (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className={`border-b ${isLightCard ? 'border-slate-200 text-slate-500 bg-slate-50/50' : 'border-slate-800 text-slate-400 bg-slate-900/30'} text-xs font-bold uppercase tracking-wider`}>
                                <th className="py-4 px-6 w-28 text-center">Posição</th>
                                <th className="py-4 px-6">Técnico</th>
                                <th className="py-4 px-6">Cargo</th>
                                <th className="py-4 px-6 text-right">Rendimento / Conclusão</th>
                              </tr>
                            </thead>
                            <tbody>
                              {technicianRanking.slice(0, 10).map((tech, index) => {
                                const isFirst = index === 0;
                                const isSecond = index === 1;
                                const isThird = index === 2;

                                return (
                                  <tr 
                                    key={tech.id} 
                                    className={`border-b ${
                                      isLightCard ? 'border-slate-100' : 'border-slate-800/50'
                                    } transition-all duration-500 text-sm ${
                                      isFirst 
                                        ? isLightCard 
                                          ? 'bg-amber-500/5 border-amber-200 shadow-sm shadow-amber-500/5 animate-first-place' 
                                          : 'bg-amber-500/5 border-amber-500/30 shadow-lg shadow-amber-500/5 animate-first-place' 
                                        : 'animate-fade-in-up'
                                    }`}
                                    style={{ animationDelay: `${index * 120}ms` }}
                                  >
                                    
                                    {/* Position Badge */}
                                    <td className="py-4 px-6 text-center font-black">
                                      {isFirst ? (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <span className="text-[#f59e0b] text-xl font-black drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">1</span>
                                          <span className="text-amber-400 animate-bounce text-sm">👑</span>
                                        </div>
                                      ) : isSecond ? (
                                        <span className="text-slate-350 text-lg font-bold">2</span>
                                      ) : isThird ? (
                                        <span className="text-amber-700 text-lg font-bold">3</span>
                                      ) : (
                                        <span className="text-slate-500 text-sm">{index + 1}</span>
                                      )}
                                    </td>

                                    {/* Avatar & Name */}
                                    <td className="py-4 px-6 font-extrabold">
                                      <div className="flex items-center gap-4">
                                        <div className="relative shrink-0">
                                          <div className={`size-12 rounded-full overflow-hidden border bg-slate-950 flex items-center justify-center shadow-lg ${
                                            isFirst ? 'border-amber-400 ring-4 ring-amber-400/30' : 'border-slate-700'
                                          }`}>
                                            {tech.avatarUrl ? (
                                              <img src={tech.avatarUrl} alt={tech.name} className="w-full h-full object-cover" />
                                            ) : (
                                              <span className="material-symbols-outlined text-slate-500 text-base">person</span>
                                            )}
                                          </div>
                                          {isFirst && (
                                            <div className="absolute -top-3.5 -right-1 text-xl animate-bounce drop-shadow-[0_2px_5px_rgba(245,158,11,0.65)] z-20">
                                              🏆
                                            </div>
                                          )}
                                        </div>
                                        <span className={`text-base tracking-tight ${isFirst ? 'text-amber-400' : tColor}`}>{tech.name}</span>
                                      </div>
                                    </td>

                                    {/* Job Role */}
                                    <td className={`py-4 px-6 font-semibold ${mColor}`}>{tech.role}</td>

                                    {/* Score pill & Progress ratio */}
                                    <td className="py-4 px-6 text-right font-semibold">
                                      <div className="flex flex-col items-end gap-1">
                                        <div className={`px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wide border shadow-sm ${
                                          isFirst 
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/10'
                                            : isLightCard 
                                              ? 'bg-slate-100 border-slate-200 text-slate-700' 
                                              : 'bg-slate-800/40 border-slate-700/30 text-slate-300'
                                        }`}>
                                          {tech.completedCount} de {tech.assignedCount} Concluídas
                                        </div>
                                        <div className={`w-28 h-1.5 rounded-full overflow-hidden ${isLightCard ? 'bg-slate-200' : 'bg-slate-800/80'}`}>
                                          <div 
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{ 
                                              width: `${tech.assignedCount > 0 ? Math.round((tech.completedCount / tech.assignedCount) * 100) : 0}%`,
                                              backgroundColor: isFirst ? '#f59e0b' : themeAccentHex
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                    </td>

                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[180px]">
                            <span className="material-symbols-outlined text-slate-500 text-4xl">military_tech</span>
                            <h4 className={`text-sm font-bold mt-2 ${tColor}`}>Sem preventivas concluídas neste período</h4>
                            <p className={`text-xs mt-1 max-w-xs ${mColor}`}>A lista será atualizada automaticamente conforme ordens sejam executadas pelos técnicos.</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* SLIDE 4: Custom Message & Safety Alert (Segurança Individual) */}
                {enabledSlides[currentSlide] === 'custom' && (
                  <div className="w-full flex flex-col items-center justify-center text-center h-full max-w-3xl mx-auto px-4 z-10 animate-fade-in">
                    
                    {/* Golden Shield Hardhat Logo */}
                    <div className="mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.45)]">
                      <svg className="size-24 text-[#eab308] mx-auto" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M50 12 L78 22 C78 48 65 72 50 85 C35 72 22 48 22 22 Z" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(234,179,8,0.05)" />
                        <path d="M36 56 C36 40 42 34 50 34 C58 34 64 40 64 56 C64 58 36 58 36 56 Z" fill="#eab308" />
                        <path d="M31 56 C31 56 50 59 69 56 L71 59 C71 59 50 62 29 59 Z" fill="#eab308" />
                        <rect x="48.5" y="28" width="3" height="15" rx="1.5" fill="#eab308" />
                      </svg>
                    </div>

                    <h3 className="text-4xl font-extrabold text-white tracking-tight leading-tight max-w-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {customAnnouncement.title}
                    </h3>
                    
                    <p className="text-lg text-slate-100 font-medium leading-relaxed mt-6 max-w-2xl mx-auto drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                      {customAnnouncement.content}
                    </p>

                    <div className="mt-12 flex items-center justify-center gap-2.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em] border-t border-slate-700/40 pt-5 w-64 mx-auto drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      <span className="size-2 rounded-full bg-[#eab308] animate-pulse"></span>
                      COMUNICADO OFICIAL DA EQUIPE
                    </div>

                  </div>
                )}

              </div>
            )}
          </div>

          {/* Nav pagination dots and controls at the bottom */}
          {enabledSlides.length > 0 && (
            <div className={`flex items-center justify-between border-t ${isLightCard && !isCustomSlide ? 'border-slate-200' : 'border-slate-800/80'} pt-4 shrink-0 z-10`}>
              <button 
                onClick={handlePrev}
                disabled={enabledSlides.length <= 1}
                className={
                  isCustomSlide
                    ? 'rounded-full px-6 py-2 bg-transparent border border-[#eab308] text-[#eab308] hover:bg-[#eab308]/15 font-bold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none'
                    : `rounded-full px-6 py-2 bg-[#0ea5e9] text-white hover:bg-[#0284c7] font-bold tracking-wide transition-all duration-300 shadow-md shadow-[#0ea5e9]/20 disabled:opacity-40 disabled:pointer-events-none`
                }
              >
                Voltar
              </button>

              {/* Navigation dots with chevron navigation arrows */}
              <div className="flex items-center gap-3">
                <span 
                  className={`material-symbols-outlined text-sm cursor-pointer select-none transition-colors ${
                    isCustomSlide ? 'text-[#eab308]/60 hover:text-[#eab308]' : 'text-slate-500 hover:text-slate-355'
                  }`} 
                  onClick={handlePrev}
                >
                  chevron_left
                </span>
                
                <div className="flex gap-2">
                  {enabledSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className="size-2 rounded-full transition-all duration-300"
                      style={{
                        width: currentSlide === idx ? '20px' : '8px',
                        backgroundColor: currentSlide === idx 
                          ? (isCustomSlide ? '#eab308' : themeAccentHex) 
                          : isLightCard && !isCustomSlide ? '#cbd5e1' : '#475569',
                        boxShadow: currentSlide === idx 
                          ? `0 0 8px ${isCustomSlide ? '#eab308' : themeAccentHex}70` 
                          : 'none'
                      }}
                    />
                  ))}
                </div>

                <span 
                  className={`material-symbols-outlined text-sm cursor-pointer select-none transition-colors ${
                    isCustomSlide ? 'text-[#eab308]/60 hover:text-[#eab308]' : 'text-slate-500 hover:text-slate-355'
                  }`} 
                  onClick={handleNext}
                >
                  chevron_right
                </span>
              </div>

              <button 
                onClick={handleNext}
                disabled={enabledSlides.length <= 1}
                className={
                  isCustomSlide
                    ? 'rounded-full px-6 py-2 bg-transparent border border-[#eab308] text-[#eab308] hover:bg-[#eab308]/15 font-bold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none'
                    : `rounded-full px-6 py-2 bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800/40 font-bold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none`
                }
              >
                Avançar
              </button>
            </div>
          )}

        </div>

        {/* Configuration Drawer Panel */}
        <div className={`w-full lg:w-80 border rounded-2xl p-5 flex flex-col gap-5 shadow-xl shrink-0 ${
          isLightCard ? 'custom-glass-light border-slate-200' : 'custom-glass border-slate-800'
        }`}>
          
          <div className={`flex items-center gap-2 border-b ${isLightCard ? 'border-slate-200' : 'border-slate-850'} pb-3 shrink-0`}>
            <span className="material-symbols-outlined text-slate-400">settings</span>
            <h3 className={`font-bold text-sm ${tColor}`}>Painel de Configuração</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
            
            {/* Theme Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tema Visual</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as VisualTheme)}
                className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/50 ${
                  isLightCard ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}
              >
                <option value="cyberpunk">Cyberpunk (Neon / Glow)</option>
                <option value="professional">Professional Steel (Navy)</option>
                <option value="industrial">Industrial Light (White / Glass)</option>
                <option value="safety">Safety Alert (Background Photo)</option>
              </select>
            </div>

            {/* General Configurations */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Configurações Gerais</label>
              
              <div>
                <label className={`block mb-1 ${mColor}`}>Título Customizado</label>
                <input 
                  type="text" 
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={`Ex: Comunicados de ${currentMonthName}`}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 ${
                    isLightCard ? 'bg-white border-slate-350 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 ${mColor}`}>Tempo por Slide ({delay}s)</label>
                <input 
                  type="range" 
                  min="5" 
                  max="30" 
                  step="5"
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>5s</span>
                  <span>15s</span>
                  <span>30s</span>
                </div>
              </div>

              <div>
                <label className={`block mb-1 ${mColor}`}>Efeito de Transição</label>
                <select
                  value={transitionEffect}
                  onChange={(e) => setTransitionEffect(e.target.value as TransitionEffect)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 ${
                    isLightCard ? 'bg-white border-slate-350 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                >
                  <option value="fade">Esmaecer (Fade)</option>
                  <option value="slide">Deslizar (Slide)</option>
                  <option value="zoom">Zoom (Foco)</option>
                </select>
              </div>

              {theme === 'safety' && (
                <div>
                  <label className={`block mb-1 ${mColor}`}>URL Imagem de Fundo (Safety)</label>
                  <input 
                    type="text" 
                    value={safetyBgUrl}
                    onChange={(e) => setSafetyBgUrl(e.target.value)}
                    placeholder="URL da imagem..."
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 text-[10px] ${
                      isLightCard ? 'bg-white border-slate-350 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Slides Toggle switches */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ativar/Desativar Slides</label>
              <div className="space-y-1.5">
                {Object.entries({
                  summary: '1. Resumo de Preventivas',
                  inAttendance: '2. Preventivas em Atendimento',
                  assets: '3. Equipamentos & Estoque',
                  ranking: '4. Ranking de Técnicos',
                  custom: '5. Comunicado Customizado'
                }).map(([key, label]) => (
                  <label key={key} className={`flex items-center justify-between p-2.5 border rounded-lg hover:border-slate-500/40 transition-colors cursor-pointer select-none ${
                    isLightCard ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/30 border-slate-800/80'
                  }`}>
                    <span className={tColor}>{label}</span>
                    <input 
                      type="checkbox" 
                      checked={activeSlides[key as keyof typeof activeSlides]}
                      onChange={(e) => {
                        const next = { ...activeSlides, [key]: e.target.checked };
                        setActiveSlides(next);
                        setCurrentSlide(0);
                      }}
                      className="size-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/50"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Safety Slide editor */}
            {activeSlides.custom && (
              <div className={`space-y-3 pt-3 border-t ${isLightCard ? 'border-slate-200' : 'border-slate-850'}`}>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Customizar Comunicado</label>
                
                <div>
                  <label className={`block mb-1 ${mColor}`}>Título do Alerta</label>
                  <input 
                    type="text" 
                    value={customAnnouncement.title}
                    onChange={(e) => setCustomAnnouncement({ ...customAnnouncement, title: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 ${
                      isLightCard ? 'bg-white border-slate-350 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-1 ${mColor}`}>Texto do Comunicado</label>
                  <textarea 
                    rows={3}
                    value={customAnnouncement.content}
                    onChange={(e) => setCustomAnnouncement({ ...customAnnouncement, content: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 resize-none ${
                      isLightCard ? 'bg-white border-slate-350 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block mb-1 ${mColor}`}>Tipo Alerta</label>
                    <select
                      value={customAnnouncement.type}
                      onChange={(e) => setCustomAnnouncement({ ...customAnnouncement, type: e.target.value as any })}
                      className={`w-full px-2 py-1.5 border rounded-lg focus:outline-none ${
                        isLightCard ? 'bg-white border-slate-350 text-slate-850' : 'bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    >
                      <option value="info">Informação (Azul)</option>
                      <option value="success">Sucesso (Verde)</option>
                      <option value="warning">Alerta (Amarelo)</option>
                      <option value="danger">Perigo (Vermelho)</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block mb-1 ${mColor}`}>Ícone Alerta</label>
                    <select
                      value={customAnnouncement.icon}
                      onChange={(e) => setCustomAnnouncement({ ...customAnnouncement, icon: e.target.value })}
                      className={`w-full px-2 py-1.5 border rounded-lg focus:outline-none ${
                        isLightCard ? 'bg-white border-slate-350 text-slate-850' : 'bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    >
                      <option value="engineering">Capacete/Engenharia</option>
                      <option value="warning">Triângulo Alerta</option>
                      <option value="verified">Selo Verificado</option>
                      <option value="info">Info Circular</option>
                      <option value="local_fire_department">Fogo / Calor</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

          </div>

          <button 
            onClick={fetchData}
            className={`w-full py-2.5 font-black border rounded-lg transition-all flex items-center justify-center gap-2 shrink-0 ${
              isLightCard 
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900' 
                : 'bg-slate-800 hover:bg-slate-750 border-slate-700/60 text-slate-200 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
            Sincronizar Banco de Dados
          </button>
        </div>

      </div>
    </div>
  );
};

export default Announcements;
