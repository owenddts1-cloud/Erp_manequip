import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { usePreferences } from '../contexts/PreferencesContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

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

interface BirthdaysInfo {
  name: string;
  day: number;
  month: number;
  section: string;
}

interface ImprovementItem {
  id: string;
  collaboratorName: string;
  role: string;
  title: string;
  description: string;
  impact: string;
  date: string;
}

type VisualTheme = 'cyberpunk' | 'professional' | 'industrial' | 'safety';
type TransitionEffect = 'fade' | 'slide' | 'zoom';

const birthdayList: BirthdaysInfo[] = [
  { name: 'Samir Matheus Reis da Silva', day: 5, month: 1, section: 'MANUTENÇÃO INDUSTRIAL MANEQUIP' },
  { name: 'Fabio Flores da Silva', day: 20, month: 2, section: 'MANUTENÇÃO PREDIAL' },
  { name: 'Wellinton Fernando da Silva', day: 1, month: 3, section: 'MANUTENÇÃO INDUSTRIAL MANEQUIP' },
  { name: 'Vinicius Loures Pereira', day: 14, month: 3, section: 'MANUTENÇÃO INDUSTRIAL MANEQUIP' },
  { name: 'Adriel Quenaa Almeida Damasceno', day: 22, month: 3, section: 'MANUTENÇÃO PREDIAL' },
  { name: 'Wendel Diogo Goncalves Rodrigues', day: 5, month: 4, section: 'MANUTENÇÃO INDUSTRIAL MANEQUIP' },
  { name: 'Flavia Cristina Delfino da Cunha', day: 12, month: 4, section: 'MANUTENÇÃO PREDIAL' },
  { name: 'Reinaldo Maximo de Carvalho', day: 12, month: 5, section: 'MANUTENÇÃO PREDIAL' },
  { name: 'Luan Deivson Aquino Duarte', day: 29, month: 5, section: 'MANUTENÇÃO INDUSTRIAL MANEQUIP' },
  { name: 'Thiago Luiz da Silva', day: 5, month: 6, section: 'MANUTENÇÃO INDUSTRIAL MANEQUIP' },
  { name: 'Guilherme Lanucci Oliveira Silva', day: 11, month: 6, section: 'MANUTENÇÃO INDUSTRIAL MANEQUIP' },
  { name: 'Danielle Cristina Silva Pinto', day: 17, month: 6, section: 'MANUTENÇÃO PREDIAL' },
  { name: 'Malcoln Roberts Fernandes', day: 5, month: 8, section: 'MANUTENÇÃO INDUSTRIAL MANEQUIP' },
  { name: 'Daniel Carvalho da Silveira', day: 4, month: 10, section: 'MANUTENÇÃO INDUSTRIAL MANEQUIP' },
  { name: 'Adilson Gomes Ferreira', day: 6, month: 10, section: 'MANUTENÇÃO PREDIAL' },
  { name: 'Hugo Leonardo Gomes da Silva', day: 15, month: 10, section: 'MANUTENÇÃO INDUSTRIAL MANEQUIP' },
  { name: 'Maike Martins Gomes', day: 8, month: 11, section: 'MANUTENÇÃO INDUSTRIAL MANEQUIP' },
  { name: 'Genilson Rodrigues da Silva', day: 9, month: 11, section: 'MANUTENÇÃO INDUSTRIAL MANEQUIP' },
  { name: 'Aldemar Alves Moreira', day: 23, month: 11, section: 'MANUTENÇÃO INDUSTRIAL MANEQUIP' },
  { name: 'Leandro Rezende Amorim', day: 23, month: 12, section: 'MANUTENÇÃO PREDIAL' },
];

const defaultImprovements: ImprovementItem[] = [
  {
    id: 'imp-1',
    collaboratorName: 'Samir Matheus Reis da Silva',
    role: 'MANUTENÇÃO INDUSTRIAL MANEQUIP',
    title: 'Dispositivo de Alinhamento Rápido da Ponte Rolante',
    description: 'Desenvolveu um gabarito físico magnético para alinhar as rodas da ponte rolante durante as corretivas, reduzindo o tempo de alinhamento em 40%.',
    impact: 'Redução de 2 horas de downtime por intervenção',
    date: '2026-06-12',
  },
  {
    id: 'imp-2',
    collaboratorName: 'Daniel Carvalho da Silveira',
    role: 'MANUTENÇÃO INDUSTRIAL MANEQUIP',
    title: 'Otimização de Lubrificação Automática',
    description: 'Reprogramou o ciclo dos dosadores automáticos de graxa nas pontes rolantes, reduzindo o desgaste prematuro de rolamentos e o consumo de graxa em 15%.',
    impact: 'Aumento de 25% na vida útil dos rolamentos',
    date: '2026-06-18',
  },
  {
    id: 'imp-3',
    collaboratorName: 'Guilherme Lanucci Oliveira Silva',
    role: 'MANUTENÇÃO INDUSTRIAL MANEQUIP',
    title: 'Suporte de Sensores da Calandra',
    description: 'Desenvolveu e soldou uma chapa de proteção em aço inox para os sensores indutivos da calandra, evitando quebras por colisão mecânica e vibração.',
    impact: 'Eliminação total de chamados corretivos por quebra de sensor',
    date: '2026-06-22',
  },
];

const Announcements: React.FC = () => {
  const { t } = usePreferences();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [delay, setDelay] = useState(10);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Styling & Theme
  const [theme, setTheme] = useState<VisualTheme>('safety');
  const [transitionEffect, setTransitionEffect] = useState<TransitionEffect>('fade');
  const [safetyBgUrl, setSafetyBgUrl] = useState('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=1200');

  // Database metrics
  const [loading, setLoading] = useState(true);
  const [preventivesTotal, setPreventivesTotal] = useState(0);
  const [preventivesCompleted, setPreventivesCompleted] = useState(0);
  const [preventivesInAttendance, setPreventivesInAttendance] = useState(0);
  const [preventivesOpen, setPreventivesOpen] = useState(0);
  const [correctivesTotal, setCorrectivesTotal] = useState(0);
  const [correctivesCompleted, setCorrectivesCompleted] = useState(0);
  const [correctivesOpen, setCorrectivesOpen] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalInventoryItems, setTotalInventoryItems] = useState(0);
  const [criticalItems, setCriticalItems] = useState<CriticalItem[]>([]);
  const [technicianRanking, setTechnicianRanking] = useState<TechnicianRank[]>([]);
  const [correctiveTechRanking, setCorrectiveTechRanking] = useState<TechnicianRank[]>([]);
  const [inAttendanceList, setInAttendanceList] = useState<any[]>([]);
  const [openCorrectivesList, setOpenCorrectivesList] = useState<any[]>([]);
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [correctivesMonthlyChartData, setCorrectivesMonthlyChartData] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  // Slide config with localStorage
  const [customTitle, setCustomTitle] = useState('');
  const [activeSlides, setActiveSlides] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('manequip_active_slides');
    return saved ? JSON.parse(saved) : {
      summaryPreventives: true, summaryCorrectives: true, inAttendance: true, openCorrectives: true,
      ranking: true, rankingCorrective: true, assets: true, improvements: true, birthdays: true, custom: true,
    };
  });
  const [slideOrder, setSlideOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('manequip_slide_order');
    return saved ? JSON.parse(saved) : [
      'summaryPreventives', 'summaryCorrectives', 'inAttendance', 'openCorrectives',
      'ranking', 'rankingCorrective', 'assets', 'improvements', 'birthdays', 'custom',
    ];
  });
  const [slideCustomTitles, setSlideCustomTitles] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('manequip_slide_custom_titles');
    return saved ? JSON.parse(saved) : {};
  });
  const [slideCustomSubtitles, setSlideCustomSubtitles] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('manequip_slide_custom_subtitles');
    return saved ? JSON.parse(saved) : {};
  });
  const [slideCustomAccents, setSlideCustomAccents] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('manequip_slide_custom_accents');
    return saved ? JSON.parse(saved) : {};
  });
  const [slideCustomBgs, setSlideCustomBgs] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('manequip_slide_custom_bgs');
    return saved ? JSON.parse(saved) : {};
  });
  const [customBirthdays, setCustomBirthdays] = useState<BirthdaysInfo[]>(() => {
    const saved = localStorage.getItem('manequip_birthdays_data');
    return saved ? JSON.parse(saved) : birthdayList;
  });
  const [customImprovements, setCustomImprovements] = useState<ImprovementItem[]>(() => {
    const saved = localStorage.getItem('manequip_improvements_data');
    return saved ? JSON.parse(saved) : defaultImprovements;
  });
  const [editingSlideKey, setEditingSlideKey] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newOrder = [...slideOrder];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setSlideOrder(newOrder);
    setDraggedIndex(index);
    setCurrentSlide(0);
  };
  const handleDragEnd = () => { setDraggedIndex(null); };

  const [customAnnouncement, setCustomAnnouncement] = useState<CustomAnnouncement>(() => {
    const saved = localStorage.getItem('manequip_custom_announcement');
    return saved ? JSON.parse(saved) : {
      title: 'Atenção à Segurança Individual',
      content: 'O uso de Equipamentos de Proteção Individual (EPIs) é obrigatório em todas as áreas de manutenção. Cuide de si e da sua equipe! O descumprimento poderá acarretar sanções.',
      type: 'warning',
      icon: 'engineering',
    };
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Month tracking
  const now = new Date();
  const currentMonthNum = now.getMonth() + 1;
  const currentYearNum = now.getFullYear();
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const currentMonthName = monthNames[now.getMonth()];
  const displayTitle = customTitle || `Comunicados de ${currentMonthName}`;
  const todayDay = now.getDate();

  // Calendar helpers
  const daysInMonth = useMemo(() => new Date(currentYearNum, currentMonthNum, 0).getDate(), [currentYearNum, currentMonthNum]);
  const firstDayOfWeek = useMemo(() => new Date(currentYearNum, currentMonthNum - 1, 1).getDay(), [currentYearNum, currentMonthNum]);
  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [firstDayOfWeek, daysInMonth]);

  const currentMonthBirthdays = useMemo(() => customBirthdays.filter(b => b.month === currentMonthNum), [customBirthdays, currentMonthNum]);
  const todaysBirthdays = useMemo(() => currentMonthBirthdays.filter(b => b.day === todayDay), [currentMonthBirthdays, todayDay]);
  const nextBirthday = useMemo(() => {
    const sorted = [...customBirthdays].sort((a, b) => a.month !== b.month ? a.month - b.month : a.day - b.day);
    let next = sorted.find(b => b.month > currentMonthNum || (b.month === currentMonthNum && b.day > todayDay));
    if (!next) next = sorted[0];
    return next;
  }, [customBirthdays, currentMonthNum, todayDay]);

  const getAvatarForBirthday = (name: string) => {
    const matched = allProfiles.find(p => p.full_name?.toLowerCase().trim() === name.toLowerCase().trim()
      || p.full_name?.toLowerCase().includes(name.split(' ')[0].toLowerCase()));
    return matched?.avatar_url || null;
  };

  const getSlideTitle = (key: string, fallback: string) => slideCustomTitles[key] || fallback;
  const getSlideSubtitle = (key: string, fallback: string) => slideCustomSubtitles[key] || fallback;
  const getSlideAccent = (key: string, fallback: string) => slideCustomAccents[key] || fallback;

  // localStorage sync
  useEffect(() => { localStorage.setItem('manequip_active_slides', JSON.stringify(activeSlides)); }, [activeSlides]);
  useEffect(() => { localStorage.setItem('manequip_slide_order', JSON.stringify(slideOrder)); }, [slideOrder]);
  useEffect(() => { localStorage.setItem('manequip_custom_announcement', JSON.stringify(customAnnouncement)); }, [customAnnouncement]);
  useEffect(() => { localStorage.setItem('manequip_slide_custom_titles', JSON.stringify(slideCustomTitles)); }, [slideCustomTitles]);
  useEffect(() => { localStorage.setItem('manequip_slide_custom_subtitles', JSON.stringify(slideCustomSubtitles)); }, [slideCustomSubtitles]);
  useEffect(() => { localStorage.setItem('manequip_slide_custom_accents', JSON.stringify(slideCustomAccents)); }, [slideCustomAccents]);
  useEffect(() => { localStorage.setItem('manequip_slide_custom_bgs', JSON.stringify(slideCustomBgs)); }, [slideCustomBgs]);
  useEffect(() => { localStorage.setItem('manequip_birthdays_data', JSON.stringify(customBirthdays)); }, [customBirthdays]);
  useEffect(() => { localStorage.setItem('manequip_improvements_data', JSON.stringify(customImprovements)); }, [customImprovements]);

  const enabledSlides = useMemo(() => slideOrder.filter(key => activeSlides[key]), [slideOrder, activeSlides]);

  // Fullscreen
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(`Error entering full-screen mode: ${err.message}`));
    } else {
      document.exitFullscreen();
    }
  };

  // Fetch metrics from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch preventives
      const { data: pmsData, error: pmsError } = await supabase
        .from('preventivas_mensais')
        .select(`
          id, titulo, status, mes, ano,
          tecnico_responsavel:tecnico_responsavel (id, full_name, avatar_url, role),
          tecnico_responsavel_2:tecnico_responsavel_2 (id, full_name, avatar_url, role),
          ativos:ativo_id (id, nome)
        `) as any;
      if (pmsError) throw pmsError;
      const pms = pmsData as any[];

      const currentMonthPMs = (pms || []).filter(p => p.mes === currentMonthNum && p.ano === currentYearNum);
      const total = currentMonthPMs.length;
      const completed = currentMonthPMs.filter(p => p.status === 'Concluído').length;
      const inAttendance = currentMonthPMs.filter(p => p.status === 'Em atendimento').length;
      const open = currentMonthPMs.filter(p => p.status === 'Em aberto').length;
      setPreventivesTotal(total);
      setPreventivesCompleted(completed);
      setPreventivesInAttendance(inAttendance);
      setPreventivesOpen(open);
      setInAttendanceList(currentMonthPMs.filter(p => p.status === 'Em atendimento'));

      // Preventives chart
      const chartMap: Record<number, { name: string; concluidas: number; total: number }> = {};
      const shortMonths = ['Jan', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      for (let m = 0; m < 12; m++) chartMap[m + 1] = { name: shortMonths[m], concluidas: 0, total: 0 };
      pms?.forEach(pm => { if (pm.ano === currentYearNum && chartMap[pm.mes]) { chartMap[pm.mes].total++; if (pm.status === 'Concluído') chartMap[pm.mes].concluidas++; } });
      setMonthlyChartData(Object.values(chartMap));

      // 2. Fetch correctives from work_orders
      const yearStart = `${currentYearNum}-01-01T00:00:00.000Z`;
      const yearEnd = `${currentYearNum}-12-31T23:59:59.999Z`;
      const { data: woData, error: woError } = await supabase
        .from('work_orders')
        .select(`id, status, tipo, created_at, tecnico_responsavel:tecnico_responsavel (id, full_name, avatar_url, role)`)
        .eq('tipo', 'Corretiva')
        .gte('created_at', yearStart)
        .lte('created_at', yearEnd) as any;
      if (woError) throw woError;
      const allCorrectives = woData as any[];

      const currentMonthCorrectives = allCorrectives.filter(n => {
        if (!n.created_at) return false;
        const d = new Date(n.created_at);
        return d.getMonth() + 1 === currentMonthNum && d.getFullYear() === currentYearNum;
      });
      const corrTotal = currentMonthCorrectives.length;
      const corrCompleted = currentMonthCorrectives.filter(n => ['Concluída', 'Concluído'].includes(n.status)).length;
      setCorrectivesTotal(corrTotal);
      setCorrectivesCompleted(corrCompleted);
      setCorrectivesOpen(corrTotal - corrCompleted);

      // Correctives chart
      const corrChartMap: Record<number, { name: string; concluidas: number; total: number }> = {};
      for (let m = 0; m < 12; m++) corrChartMap[m + 1] = { name: shortMonths[m], concluidas: 0, total: 0 };
      allCorrectives.forEach(n => {
        if (n.created_at) {
          const d = new Date(n.created_at);
          const m = d.getMonth() + 1;
          if (d.getFullYear() === currentYearNum && corrChartMap[m]) {
            corrChartMap[m].total++;
            if (['Concluída', 'Concluído'].includes(n.status)) corrChartMap[m].concluidas++;
          }
        }
      });
      setCorrectivesMonthlyChartData(Object.values(corrChartMap));

      // 3. Assets count
      const { count: assetsCount, error: assetsError } = await supabase.from('ativos').select('*', { count: 'exact', head: true });
      if (assetsError) throw assetsError;
      setTotalAssets(assetsCount || 0);

      // 4. Open correctives list
      const { data: openCorrData, error: openCorrError } = await supabase
        .from('work_orders')
        .select(`id, display_id, title, descricao, status, tecnico_responsavel:tecnico_responsavel (id, full_name, avatar_url, role), ativos:ativo_id (id, nome)`)
        .eq('tipo', 'Corretiva')
        .neq('status', 'Concluída')
        .order('created_at', { ascending: false }) as any;
      if (openCorrError) throw openCorrError;
      setOpenCorrectivesList(openCorrData || []);

      // 5. Inventory
      const { data: inv, error: invError } = await supabase.from('inventario').select('id, nome_peca, quantidade_estoque, estoque_minimo');
      if (invError) throw invError;
      setTotalInventoryItems(inv?.length || 0);
      const critical = (inv || []).filter(item => item.quantidade_estoque <= (item.estoque_minimo || 0)).map(item => ({
        id: item.id, nome_peca: item.nome_peca, quantidade_estoque: item.quantidade_estoque, estoque_minimo: item.estoque_minimo || 0,
      }));
      setCriticalItems(critical);

      // 6. Profiles & technician rankings
      const techMap: Record<string, TechnicianRank> = {};
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url, role').eq('is_approved', true);
      if (profiles) setAllProfiles(profiles);
      profiles?.forEach(profile => {
        techMap[profile.id] = { id: profile.id, name: profile.full_name || 'Desconhecido', avatarUrl: profile.avatar_url || null, role: profile.role || 'Técnico', completedCount: 0, assignedCount: 0 };
      });
      currentMonthPMs.forEach(pm => {
        if (pm.tecnico_responsavel?.id && techMap[pm.tecnico_responsavel.id]) {
          techMap[pm.tecnico_responsavel.id].assignedCount++;
          if (pm.status === 'Concluído') techMap[pm.tecnico_responsavel.id].completedCount++;
        }
        if (pm.tecnico_responsavel_2?.id && techMap[pm.tecnico_responsavel_2.id]) {
          techMap[pm.tecnico_responsavel_2.id].assignedCount++;
          if (pm.status === 'Concluído') techMap[pm.tecnico_responsavel_2.id].completedCount++;
        }
      });
      const ranking = Object.values(techMap).filter(t => t.assignedCount > 0).sort((a, b) => {
        const rateA = a.completedCount / a.assignedCount;
        const rateB = b.completedCount / b.assignedCount;
        if (rateB !== rateA) return rateB - rateA;
        return b.completedCount - a.completedCount;
      });
      setTechnicianRanking(ranking);

      // 7. Corrective technician ranking
      const techCorrMap: Record<string, TechnicianRank> = {};
      profiles?.forEach(profile => {
        techCorrMap[profile.id] = { id: profile.id, name: profile.full_name || 'Desconhecido', avatarUrl: profile.avatar_url || null, role: profile.role || 'Técnico', completedCount: 0, assignedCount: 0 };
      });
      currentMonthCorrectives.forEach(n => {
        const isDone = ['Concluída', 'Concluído'].includes(n.status);
        if (n.tecnico_responsavel?.id && techCorrMap[n.tecnico_responsavel.id]) {
          techCorrMap[n.tecnico_responsavel.id].assignedCount++;
          if (isDone) techCorrMap[n.tecnico_responsavel.id].completedCount++;
        }
      });
      const corrRanking = Object.values(techCorrMap).filter(t => t.assignedCount > 0).sort((a, b) => {
        const rateA = a.completedCount / a.assignedCount;
        const rateB = b.completedCount / b.assignedCount;
        if (rateB !== rateA) return rateB - rateA;
        return b.completedCount - a.completedCount;
      });
      setCorrectiveTechRanking(corrRanking);

    } catch (err) {
      console.error('Error fetching announcements data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const subscription = supabase
      .channel('announcements-premium')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'preventivas_mensais' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ativos' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData)
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, []);

  // Timer
  useEffect(() => {
    if (!isPlaying || enabledSlides.length === 0) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { setCurrentSlide(curr => (curr + 1) % enabledSlides.length); return delay; } return prev - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, enabledSlides, delay]);

  useEffect(() => { setTimeLeft(delay); }, [currentSlide, delay]);

  const handleNext = () => { if (enabledSlides.length > 0) setCurrentSlide(prev => (prev + 1) % enabledSlides.length); };
  const handlePrev = () => { if (enabledSlides.length > 0) setCurrentSlide(prev => (prev - 1 + enabledSlides.length) % enabledSlides.length); };

  // Theme
  const isLightCard = theme === 'industrial';
  const tColor = isLightCard ? 'text-slate-900' : 'text-white';
  const mColor = isLightCard ? 'text-slate-500' : 'text-slate-400';
  const bgCardClass = isLightCard ? 'bg-white border-slate-200 shadow-md text-slate-800' : 'bg-[#161f30]/85 border-[#28354c]/70 text-slate-200';
  const containerBgClass = isLightCard ? 'bg-[#f1f5f9] text-slate-800' : theme === 'cyberpunk' ? 'bg-[#060a13]' : 'bg-[#0b1329]';
  const getThemeColor = () => { switch (theme) { case 'cyberpunk': return '#00d2ff'; case 'professional': return '#0ea5e9'; case 'industrial': return '#f59e0b'; case 'safety': return '#eab308'; } };
  const themeAccentHex = getThemeColor();
  const currentSlideKey = enabledSlides[currentSlide] || '';
  const slideAccentHex = getSlideAccent(currentSlideKey, themeAccentHex);

  const getTransitionClass = () => { switch (transitionEffect) { case 'fade': return 'animate-fade-in duration-500'; case 'slide': return 'animate-slide-in duration-500'; case 'zoom': return 'animate-zoom-in duration-500'; } };

  const completionRate = preventivesTotal > 0 ? Math.round((preventivesCompleted / preventivesTotal) * 100) : 0;
  const correctiveCompletionRate = correctivesTotal > 0 ? Math.round((correctivesCompleted / correctivesTotal) * 100) : 0;

  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / delay) * circumference;

  const isCustomSlide = enabledSlides[currentSlide] === 'custom';

  // Slide name map for config panel
  const slideNameMap: Record<string, string> = {
    summaryPreventives: 'Gestão de Preventivas', summaryCorrectives: 'Gestão de Corretivas',
    inAttendance: 'Preventivas em Andamento', openCorrectives: 'Corretivas em Aberto',
    assets: 'Painel de Controle de Estoque', ranking: 'Desempenho dos Técnicos - Preventivas',
    rankingCorrective: 'Desempenho dos Técnicos - Corretivas', improvements: 'Melhoria Contínua',
    birthdays: 'Aniversariantes do Mês', custom: 'Comunicado Customizado',
  };

  // Render technician table for ranking slides
  const renderRankingTable = (data: TechnicianRank[], emptyMsg: string, accentColor: string) => (
    <div className={`flex-1 border rounded-2xl overflow-hidden min-h-0 shadow-2xl ${bgCardClass}`}>
      <div className="h-full overflow-y-auto pr-1">
        {data.length > 0 ? (
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
              {data.slice(0, 10).map((tech, index) => {
                const isFirst = index === 0;
                return (
                  <tr key={tech.id} className={`border-b ${isLightCard ? 'border-slate-100' : 'border-slate-800/50'} transition-all duration-500 text-sm ${isFirst ? isLightCard ? 'bg-amber-500/5 border-amber-200 animate-first-place' : 'bg-amber-500/5 border-amber-500/30 shadow-lg shadow-amber-500/5 animate-first-place' : 'animate-fade-in-up'}`} style={{ animationDelay: `${index * 120}ms` }}>
                    <td className="py-4 px-6 text-center font-black">
                      {isFirst ? (<div className="flex items-center justify-center gap-1.5"><span className="text-[#f59e0b] text-xl font-black drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">1</span><span className="text-amber-400 animate-bounce text-sm">👑</span></div>) : index === 1 ? (<span className="text-slate-350 text-lg font-bold">2</span>) : index === 2 ? (<span className="text-amber-700 text-lg font-bold">3</span>) : (<span className="text-slate-500 text-sm">{index + 1}</span>)}
                    </td>
                    <td className="py-4 px-6 font-extrabold">
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <div className={`size-12 rounded-full overflow-hidden border bg-slate-950 flex items-center justify-center shadow-lg ${isFirst ? 'border-amber-400 ring-4 ring-amber-400/30' : 'border-slate-700'}`}>
                            {tech.avatarUrl ? <img src={tech.avatarUrl} alt={tech.name} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-500 text-base">person</span>}
                          </div>
                          {isFirst && <div className="absolute -top-3.5 -right-1 text-xl animate-bounce drop-shadow-[0_2px_5px_rgba(245,158,11,0.65)] z-20">🏆</div>}
                        </div>
                        <span className={`text-base tracking-tight ${isFirst ? 'text-amber-400' : tColor}`}>{tech.name}</span>
                      </div>
                    </td>
                    <td className={`py-4 px-6 font-semibold ${mColor}`}>{tech.role}</td>
                    <td className="py-4 px-6 text-right font-semibold">
                      <div className="flex flex-col items-end gap-1">
                        <div className={`px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wide border shadow-sm ${isFirst ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/10' : isLightCard ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800/40 border-slate-700/30 text-slate-300'}`}>
                          {tech.completedCount} de {tech.assignedCount} Concluídas
                        </div>
                        <div className={`w-28 h-1.5 rounded-full overflow-hidden ${isLightCard ? 'bg-slate-200' : 'bg-slate-800/80'}`}>
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${tech.assignedCount > 0 ? Math.round((tech.completedCount / tech.assignedCount) * 100) : 0}%`, backgroundColor: isFirst ? '#f59e0b' : accentColor }}></div>
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
            <h4 className={`text-sm font-bold mt-2 ${tColor}`}>{emptyMsg}</h4>
            <p className={`text-xs mt-1 max-w-xs ${mColor}`}>A lista será atualizada automaticamente conforme ordens sejam concluídas pelos técnicos.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render summary slide (preventives or correctives)
  const renderSummarySlide = (opts: { title: string; borderColor: string; inAttendanceVal: number; completedVal: number; chartData: any[]; rate: number; accent: string }) => (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-full">
      <div className="lg:col-span-5 flex flex-col justify-center gap-6">
        <div className="border-l-4 pl-4 mb-2" style={{ borderColor: opts.borderColor }}>
          <h3 className={`text-2xl font-bold ${tColor}`}>{opts.title}</h3>
        </div>
        <div className="flex flex-col gap-4">
          <div 
            className={`p-6 border rounded-2xl relative overflow-hidden transition-all duration-300 shadow-lg hover:scale-[1.02] ${
              isLightCard ? 'bg-white border-slate-200 shadow-md' : 'bg-[#161f30]/90'
            }`}
            style={!isLightCard ? { borderColor: `${opts.accent}30`, boxShadow: `0 10px 15px -3px ${opts.accent}08` } : {}}
          >
            <div 
              className="absolute top-4 right-4 size-10 rounded-full flex items-center justify-center animate-pulse"
              style={{ backgroundColor: `${opts.accent}15`, color: opts.accent }}
            >
              <span className="material-symbols-outlined text-[20px]">engineering</span>
            </div>
            <div 
              className="text-5xl font-black tracking-tight" 
              style={{ color: isLightCard ? '#1e293b' : '#ffffff', textShadow: `0 0 10px ${opts.accent}40` }}
            >
              {opts.inAttendanceVal}
            </div>
            <div className={`text-sm font-bold mt-2 ${tColor}`}>
              {opts.title.includes('Corretiva') ? 'Em Aberto' : 'Em Atendimento'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">
              {opts.title.includes('Corretiva') ? 'Ordens de serviço corretivas em aberto.' : 'Ordens de serviço atualmente sendo executadas.'}
            </p>
          </div>
          <div className={`p-6 border rounded-2xl relative overflow-hidden transition-all duration-300 shadow-lg hover:scale-[1.02] ${isLightCard ? 'bg-white border-slate-200 shadow-md' : 'bg-[#161f30]/90 border-emerald-500/25 shadow-emerald-500/5 hover:border-emerald-500/40'}`}>
            <div className="absolute top-4 right-4 size-10 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-400"><span className="material-symbols-outlined text-[20px]">task_alt</span></div>
            <div className="text-5xl font-black text-white tracking-tight" style={{ textShadow: '0 0 8px rgba(16,185,129,0.35)' }}>{opts.completedVal}</div>
            <div className={`text-sm font-bold mt-2 ${tColor}`}>Concluídas</div>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">Ordens de serviço finalizadas no mês.</p>
          </div>
        </div>
      </div>
      <div className={`lg:col-span-7 h-full flex flex-col p-6 border rounded-2xl gap-6 shadow-xl ${bgCardClass}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 flex-1 min-h-0">
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="relative size-36 flex items-center justify-center">
              <svg className="size-36 rotate-270">
                <circle cx="72" cy="72" r="58" className={`fill-none ${isLightCard ? 'stroke-slate-200' : 'stroke-slate-800'}`} strokeWidth="8.5" />
                <circle cx="72" cy="72" r="58" className="fill-none transition-all duration-1000" style={{ stroke: opts.accent }} strokeWidth="8.5" strokeDasharray={2 * Math.PI * 58} strokeDashoffset={2 * Math.PI * 58 - (opts.rate / 100) * 2 * Math.PI * 58} strokeLinecap="round" />
              </svg>
              <div className="absolute text-center">
                <span className={`text-3xl font-black ${tColor}`}>{opts.rate}%</span>
                <p className={`text-[10px] uppercase font-bold tracking-wider mt-0.5 ${mColor}`}>Concluído</p>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full h-[200px] flex flex-col justify-between min-w-0">
            <div className="flex justify-between items-center text-[10px] font-mono tracking-wider uppercase mb-2 text-slate-400"><span>Histograma Anual</span><span>{currentYearNum}</span></div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={opts.chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(148,163,184,0.05)' }} contentStyle={isLightCard ? { backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '11px' } : { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="total" fill={opts.accent} radius={[2, 2, 0, 0]} barSize={8} />
                  <Bar dataKey="concluidas" fill="#10b981" radius={[2, 2, 0, 0]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className={`pt-4 border-t ${isLightCard ? 'border-slate-200' : 'border-slate-800/80'} shrink-0`}>
          <span className={`text-[11px] uppercase font-bold tracking-wider ${mColor}`}>Taxa de Conclusão</span>
          <div className={`w-full h-2 rounded-full mt-2 overflow-hidden ${isLightCard ? 'bg-slate-200' : 'bg-slate-900'}`}>
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${opts.rate}%`, backgroundColor: opts.accent, boxShadow: `0 0 8px ${opts.accent}aa` }}></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex-1 flex flex-col overflow-hidden h-full relative p-6 select-none ${containerBgClass} transition-colors duration-500`}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes zoomIn { from { transform: scale(0.97); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes goldShine { 0%, 100% { border-color: rgba(245,158,11,0.35); box-shadow: 0 0 12px rgba(245,158,11,0.1); } 50% { border-color: rgba(245,158,11,0.7); box-shadow: 0 0 20px rgba(245,158,11,0.25); } }
        @keyframes float { 0% { transform: translateY(0); opacity: 0.6; } 50% { opacity: 1; } 100% { transform: translateY(-100vh); opacity: 0; } }
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        .animate-fade-in-up { opacity: 0; animation: fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        .animate-slide-in { animation: slideIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        .animate-zoom-in { animation: zoomIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        .animate-gold-shine { animation: goldShine 3s infinite ease-in-out; }
        .animate-first-place { opacity: 0; animation: fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards, goldShine 3s infinite ease-in-out; }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-spin-slow { animation: spinSlow 12s linear infinite; }
        .custom-glass { background: rgba(22,31,48,0.65); backdrop-filter: blur(16px); border: 1px solid rgba(40,53,76,0.7); }
        .custom-glass-light { background: rgba(255,255,255,0.85); backdrop-filter: blur(16px); border: 1px solid rgba(226,232,240,0.8); }
        .blue-blueprint-grid { background-size: 32px 32px; background-image: linear-gradient(to right, rgba(14,165,233,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(14,165,233,0.05) 1px, transparent 1px); }
      `}</style>

      {theme === 'cyberpunk' && <div className="absolute inset-0 bg-grid-pattern-dark opacity-30 pointer-events-none z-0"></div>}

      <div className="flex-1 flex flex-col lg:flex-row gap-6 z-10 overflow-hidden">
        {/* Slide Display Container */}
        <div ref={containerRef} className={`flex-1 flex flex-col justify-between rounded-2xl relative overflow-hidden shadow-2xl transition-all duration-500 ${isFullscreen ? 'p-12 bg-[#090e1a]' : 'p-6'} ${theme === 'safety' || isCustomSlide ? 'bg-[#090e1a]' : isLightCard ? 'custom-glass-light border-slate-200' : 'custom-glass border-slate-800'}`} style={theme === 'safety' || isCustomSlide ? { backgroundImage: `linear-gradient(rgba(9,14,26,0.85),rgba(9,14,26,0.85)), url(${isCustomSlide ? '/assets/safety_gear_background.png' : safetyBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>

          {/* Slide Header */}
          <div className={`flex items-center justify-between border-b ${isLightCard && !isCustomSlide ? 'border-slate-200' : 'border-slate-800/80'} pb-4 shrink-0`}>
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl flex items-center justify-center shadow-lg transition-colors" style={{ background: isCustomSlide ? 'linear-gradient(135deg,#eab308,#ca8a04)' : `linear-gradient(135deg,${slideAccentHex},${slideAccentHex}dd)`, boxShadow: `0 8px 16px -4px ${isCustomSlide ? '#eab308' : slideAccentHex}50` }}>
                <span className="material-symbols-outlined text-white text-[24px]">{isCustomSlide ? 'shield' : 'campaign'}</span>
              </div>
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${isCustomSlide ? 'text-white' : tColor}`}>{displayTitle}</h2>
                <p className={`text-xs font-mono uppercase tracking-wider mt-0.5 ${isCustomSlide ? 'text-slate-400' : mColor}`}>{isCustomSlide || theme === 'safety' ? 'Safety Compliance Notice' : 'Manequip 360 Industrial OS'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsPlaying(!isPlaying)} className={`size-9 rounded-lg flex items-center justify-center border transition-all active:scale-95 ${isCustomSlide ? 'bg-transparent border-[#eab308]/50 text-[#eab308] hover:bg-[#eab308]/15' : isLightCard ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-850 hover:bg-slate-800 border-slate-700/60 text-slate-300'}`} title={isPlaying ? 'Pausar' : 'Play'}>
                <span className="material-symbols-outlined text-[20px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
              </button>
              <button onClick={toggleFullscreen} className={`size-9 rounded-lg flex items-center justify-center border transition-all active:scale-95 ${isCustomSlide ? 'bg-transparent border-[#eab308]/50 text-[#eab308] hover:bg-[#eab308]/15' : isLightCard ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-850 hover:bg-slate-800 border-slate-700/60 text-slate-300'}`} title="Tela Cheia">
                <span className="material-symbols-outlined text-[20px]">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
              </button>
              {isPlaying && enabledSlides.length > 0 && (
                <div className="relative size-10 flex items-center justify-center ml-1 group scale-110">
                  <div className={`absolute -top-[3.5px] w-2.5 h-1.5 rounded-sm transition-colors z-20 ${isCustomSlide ? 'bg-[#eab308]' : 'bg-slate-400'}`}></div>
                  <svg className="size-10 rotate-270 relative z-10">
                    <circle cx="20" cy="20" r={radius} className={`fill-none ${isCustomSlide ? 'stroke-[#eab308]/20' : isLightCard ? 'stroke-slate-200' : 'stroke-slate-800/80'}`} strokeWidth="2.5" />
                    <circle cx="20" cy="20" r={radius} className="fill-none transition-all duration-1000 ease-linear" style={{ stroke: isCustomSlide ? '#eab308' : slideAccentHex }} strokeWidth="2.5" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-[10px] font-mono font-bold z-10" style={{ color: isCustomSlide ? '#eab308' : slideAccentHex }}>{timeLeft}</span>
                </div>
              )}
            </div>
          </div>

          {/* Slide Content */}
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
              <div className={`w-full h-full flex flex-col justify-center ${getTransitionClass()}`} key={currentSlide}>

                {/* SLIDE: Gestão de Preventivas */}
                {enabledSlides[currentSlide] === 'summaryPreventives' && renderSummarySlide({ title: getSlideTitle('summaryPreventives', 'Gestão de Preventivas'), borderColor: getSlideAccent('summaryPreventives', '#0ea5e9'), inAttendanceVal: preventivesInAttendance, completedVal: preventivesCompleted, chartData: monthlyChartData, rate: completionRate, accent: getSlideAccent('summaryPreventives', '#0ea5e9') })}

                {/* SLIDE: Gestão de Corretivas */}
                {enabledSlides[currentSlide] === 'summaryCorrectives' && renderSummarySlide({ title: getSlideTitle('summaryCorrectives', 'Gestão de Corretivas'), borderColor: getSlideAccent('summaryCorrectives', '#f43f5e'), inAttendanceVal: correctivesOpen, completedVal: correctivesCompleted, chartData: correctivesMonthlyChartData, rate: correctiveCompletionRate, accent: getSlideAccent('summaryCorrectives', '#f43f5e') })}

                {/* SLIDE: Preventivas em Atendimento */}
                {enabledSlides[currentSlide] === 'inAttendance' && (
                  <div className="w-full flex flex-col gap-6 h-full justify-center">
                    <div className="border-l-4 pl-4 shrink-0" style={{ borderColor: getSlideAccent('inAttendance', themeAccentHex) }}>
                      <h3 className={`text-2xl font-bold ${tColor}`}>{getSlideTitle('inAttendance', 'Preventivas em Atendimento')}</h3>
                      <p className={`text-xs mt-1 ${mColor}`}>{getSlideSubtitle('inAttendance', `Atividades em execução de manutenção preventiva para o mês de ${currentMonthName}.`)}</p>
                    </div>
                    <div className={`flex-1 border rounded-2xl overflow-hidden min-h-0 shadow-2xl ${bgCardClass}`}>
                      <div className="h-full overflow-y-auto pr-1">
                        {inAttendanceList.length > 0 ? (
                          <table className="w-full text-left border-collapse">
                            <thead><tr className={`border-b ${isLightCard ? 'border-slate-200 text-slate-500 bg-slate-50/50' : 'border-slate-800 text-slate-400 bg-slate-900/30'} text-xs font-bold uppercase tracking-wider`}><th className="py-4 px-6">Equipamento</th><th className="py-4 px-6">Atividade / Título</th><th className="py-4 px-6">Responsáveis</th><th className="py-4 px-6 text-right">Status</th></tr></thead>
                            <tbody>{inAttendanceList.map((pm, index) => (<tr key={pm.id} className={`border-b ${isLightCard ? 'border-slate-100' : 'border-slate-800/50'} hover:bg-slate-800/10 transition-colors text-sm animate-fade-in-up`} style={{ animationDelay: `${index * 80}ms` }}><td className="py-4 px-6 font-extrabold"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-cyan-400">precision_manufacturing</span><span className={tColor}>{pm.ativos?.nome || 'Sem Ativo'}</span></div></td><td className={`py-4 px-6 font-semibold ${tColor}`}>{pm.titulo}</td><td className="py-4 px-6 font-semibold"><span className={`text-xs ${mColor}`}>{[pm.tecnico_responsavel?.full_name, pm.tecnico_responsavel_2?.full_name].filter(Boolean).join(' & ') || 'Nenhum'}</span></td><td className="py-4 px-6 text-right"><div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm animate-pulse"><span className="size-2 rounded-full bg-amber-400"></span>Em Atendimento</div></td></tr>))}</tbody>
                          </table>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[220px]"><span className="material-symbols-outlined text-emerald-500 text-5xl">check_circle</span><h4 className={`text-base font-bold mt-3 ${tColor}`}>Sem Preventivas em Atendimento</h4></div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE: Corretivas em Aberto */}
                {enabledSlides[currentSlide] === 'openCorrectives' && (
                  <div className="w-full flex flex-col gap-6 h-full justify-center">
                    <div className="border-l-4 pl-4 shrink-0" style={{ borderColor: getSlideAccent('openCorrectives', '#ef4444') }}>
                      <h3 className={`text-2xl font-bold ${tColor}`}>{getSlideTitle('openCorrectives', 'Corretivas em Aberto')}</h3>
                      <p className={`text-xs mt-1 ${mColor}`}>{getSlideSubtitle('openCorrectives', 'Chamados de manutenção corretiva aguardando atendimento.')}</p>
                    </div>
                    <div className={`flex-1 border rounded-2xl overflow-hidden min-h-0 shadow-2xl ${bgCardClass}`}>
                      <div className="h-full overflow-y-auto pr-1">
                        {openCorrectivesList.length > 0 ? (
                          <table className="w-full text-left border-collapse">
                            <thead><tr className={`border-b ${isLightCard ? 'border-slate-200 text-slate-500 bg-slate-50/50' : 'border-slate-800 text-slate-400 bg-slate-900/30'} text-xs font-bold uppercase tracking-wider`}><th className="py-4 px-6">Chamado</th><th className="py-4 px-6">Descrição do Chamado</th><th className="py-4 px-6">Responsáveis</th><th className="py-4 px-6 text-right">Status</th></tr></thead>
                            <tbody>
                              {openCorrectivesList.map((wo, index) => (
                                <tr 
                                  key={wo.id} 
                                  className={`border-b ${isLightCard ? 'border-slate-100' : 'border-slate-800/50'} hover:bg-slate-800/10 transition-colors text-sm animate-fade-in-up`} 
                                  style={{ animationDelay: `${index * 80}ms` }}
                                >
                                  <td className="py-4 px-6 font-black text-lg">{wo.display_id || '—'}</td>
                                  <td className={`py-4 px-6 font-semibold ${tColor}`}>{wo.title || wo.descricao || '—'}</td>
                                  <td className="py-4 px-6 font-semibold">
                                    {wo.tecnico_responsavel ? (
                                      <div className="flex items-center gap-2.5">
                                        <div className="size-7 rounded-full overflow-hidden border border-slate-700/50 bg-slate-950 flex items-center justify-center shrink-0 shadow-sm">
                                          {wo.tecnico_responsavel.avatar_url ? (
                                            <img src={wo.tecnico_responsavel.avatar_url} alt={wo.tecnico_responsavel.full_name} className="w-full h-full object-cover" />
                                          ) : (
                                            <span className="material-symbols-outlined text-slate-500 text-[14px]">person</span>
                                          )}
                                        </div>
                                        <span className={`text-xs ${mColor}`}>{wo.tecnico_responsavel.full_name}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2.5">
                                        <div className="size-7 rounded-full border border-dashed border-slate-700/50 bg-slate-950/20 flex items-center justify-center shrink-0">
                                          <span className="material-symbols-outlined text-slate-600 text-[14px]">person_off</span>
                                        </div>
                                        <span className="text-xs text-slate-500 italic">Não atribuído</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">
                                      <span className="size-2 rounded-full bg-rose-400"></span>
                                      {wo.status}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[220px]"><span className="material-symbols-outlined text-emerald-500 text-5xl">check_circle</span><h4 className={`text-base font-bold mt-3 ${tColor}`}>Sem Corretivas em Aberto</h4></div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE: Ranking Preventivas */}
                {enabledSlides[currentSlide] === 'ranking' && (
                  <div className="w-full flex flex-col gap-6 h-full justify-center">
                    <div className="text-center shrink-0 mb-4 animate-fade-in">
                      <h3 className={`text-4xl font-extrabold tracking-tight ${tColor}`}>{getSlideTitle('ranking', 'Relatório de Desempenho dos Técnicos')} - <span className="text-cyan-400">Preventivas</span></h3>
                      <p className={`text-sm mt-2 ${mColor}`}>Colaboradores classificados por taxa de conclusão e rendimento no período.</p>
                    </div>
                    {renderRankingTable(technicianRanking, 'Sem preventivas concluídas neste período', themeAccentHex)}
                  </div>
                )}

                {/* SLIDE: Ranking Corretivas */}
                {enabledSlides[currentSlide] === 'rankingCorrective' && (
                  <div className="w-full flex flex-col gap-6 h-full justify-center">
                    <div className="text-center shrink-0 mb-4 animate-fade-in">
                      <h3 className={`text-4xl font-extrabold tracking-tight ${tColor}`}>{getSlideTitle('rankingCorrective', 'Relatório de Desempenho dos Técnicos')} - <span className="text-rose-400">Corretivas</span></h3>
                      <p className={`text-sm mt-2 ${mColor}`}>Técnicos classificados pelo desempenho em manutenções corretivas.</p>
                    </div>
                    {renderRankingTable(correctiveTechRanking, 'Sem corretivas concluídas neste período', '#f43f5e')}
                  </div>
                )}

                {/* SLIDE: Painel de Controle de Estoque */}
                {enabledSlides[currentSlide] === 'assets' && (
                  <div className="w-full flex flex-col gap-6 h-full justify-center relative">
                    {!isLightCard && <div className="absolute inset-0 blue-blueprint-grid opacity-30 pointer-events-none -m-6 rounded-2xl z-0"></div>}
                    <div className="border-l-4 pl-4 shrink-0 z-10" style={{ borderColor: themeAccentHex }}>
                      <h3 className={`text-2xl font-bold ${tColor}`}>{getSlideTitle('assets', 'Painel de Controle de Estoque')}</h3>
                      <p className={`text-[13px] font-medium mt-1 ${mColor}`}>Painel profissional de monitoramento de ativos e peças de reposição.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 z-10">
                      <div className={`p-5 rounded-2xl relative overflow-hidden group transition-all duration-300 border shadow-lg ${bgCardClass}`}><span className={`text-[11px] font-bold uppercase tracking-wider block ${mColor}`}>SKUs Cadastrados</span><div className={`text-4xl font-extrabold mt-2 tracking-tight ${tColor}`}>{totalInventoryItems}</div><p className={`text-xs font-semibold mt-2 ${mColor}`}>Peças e componentes registrados.</p></div>
                      <div className={`p-5 rounded-2xl relative overflow-hidden flex items-center justify-between group transition-all duration-300 border shadow-lg ${bgCardClass}`}><div><span className={`text-[11px] font-bold uppercase tracking-wider block ${mColor}`}>Estoque Crítico</span><div className="text-4xl font-extrabold mt-2 text-rose-500 tracking-tight">{criticalItems.length}</div><p className={`text-xs font-semibold mt-2 ${mColor}`}>Peças abaixo do estoque mínimo.</p></div><span className="material-symbols-outlined text-amber-500 text-5xl shrink-0 animate-pulse">warning</span></div>
                    </div>
                    <div className={`flex-1 rounded-2xl p-6 shadow-xl flex flex-col min-h-0 z-10 border ${bgCardClass}`}>
                      <div className={`flex items-center gap-2 text-[11px] font-bold font-mono uppercase tracking-wider mb-4 border-b pb-3 ${isLightCard ? 'border-slate-100' : 'border-slate-800/80'}`}><span className="material-symbols-outlined text-[18px] text-amber-500">warning</span><span className={tColor}>Estoque Crítico de Peças</span></div>
                      {criticalItems.length > 0 ? (
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                          {criticalItems.map(item => {
                            const minVal = item.estoque_minimo || 1;
                            const ratio = Math.min(100, (Math.max(0, item.quantidade_estoque) / minVal) * 100);
                            const isCritical = item.quantidade_estoque <= 0;
                            return (
                              <div key={item.id} className={`flex flex-col md:flex-row md:items-center justify-between p-3.5 border rounded-xl text-xs gap-4 transition-colors shadow-sm ${isLightCard ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-[#0f172a]/60 border-slate-800/70 hover:bg-[#0f172a]/90'}`}>
                                <span className={`font-extrabold w-32 md:w-44 truncate ${tColor}`}>{item.nome_peca}</span>
                                <span className={`text-[13px] font-bold font-mono w-44 truncate ${tColor}`}>SN-{item.id.slice(0, 5).toUpperCase()}</span>
                                <div className={`flex-1 h-3.5 rounded-full overflow-hidden relative mx-2 ${isLightCard ? 'bg-slate-200' : 'bg-slate-800'}`}><div className="h-full bg-[#f59e0b] rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Math.max(10, ratio))}%`, boxShadow: '0 0 8px rgba(245,158,11,0.4)' }}></div></div>
                                <div className="flex items-center gap-4 shrink-0 font-semibold text-[11px]"><span className={`text-[12px] ${mColor}`}>Mínimo: <strong className={`text-[13px] ${tColor}`}>{item.estoque_minimo}</strong></span><span className={`px-3 py-1 rounded-md font-extrabold text-[12px] ${isCritical ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'}`}>Qtd: {item.quantidade_estoque}</span></div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={`flex-1 border border-dashed rounded-xl flex items-center justify-center text-center p-6 ${isLightCard ? 'border-slate-200 bg-emerald-50/20' : 'border-slate-850/50 bg-emerald-500/5'}`}><div className="flex items-center gap-2 text-emerald-500 text-xs font-mono uppercase tracking-wider font-semibold"><span className="material-symbols-outlined text-[18px]">verified</span>Todos os Níveis de Estoque Estão Estáveis</div></div>
                      )}
                    </div>
                  </div>
                )}

                {/* SLIDE: Aniversariantes do Mês - IMPROVED VISUAL */}
                {enabledSlides[currentSlide] === 'birthdays' && (
                  <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-full relative overflow-hidden">
                    {/* Floating festive particles */}
                    <div className="absolute inset-0 pointer-events-none z-0">
                      {[...Array(8)].map((_, i) => {
                        const colors = ['bg-rose-500/10', 'bg-purple-500/10', 'bg-cyan-500/10', 'bg-amber-500/10'];
                        const col = colors[i % colors.length];
                        return (
                          <div key={i} className={`absolute ${col} rounded-full animate-float`} style={{ width: `${Math.random() * 40 + 20}px`, height: `${Math.random() * 40 + 20}px`, left: `${Math.random() * 100}%`, bottom: '-40px', animationDelay: `${Math.random() * 5}s`, animationDuration: `${Math.random() * 8 + 6}s`, filter: 'blur(4px)' }} />
                        );
                      })}
                      {[...Array(6)].map((_, i) => {
                        const emojis = ['🎈', '✨', '🎉', '🎁'];
                        const em = emojis[i % emojis.length];
                        return (
                          <div key={`em-${i}`} className="absolute text-lg select-none animate-float opacity-30" style={{ left: `${Math.random() * 100}%`, bottom: '-40px', animationDelay: `${Math.random() * 6}s`, animationDuration: `${Math.random() * 10 + 6}s` }}>
                            {em}
                          </div>
                        );
                      })}
                    </div>
                    {/* Left: Featured / Today */}
                    <div className="lg:col-span-6 flex flex-col justify-center gap-6 z-10">
                      {todaysBirthdays.length > 0 ? (
                        <div className={`p-6 border rounded-3xl text-center shadow-2xl relative overflow-hidden flex flex-col items-center justify-center gap-4 ${isLightCard ? 'bg-gradient-to-br from-amber-500/5 via-rose-500/5 to-white border-amber-300' : 'bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-purple-650/10 border-amber-500/35 shadow-[0_0_35px_rgba(245,158,11,0.15)]'} animate-gold-shine`}>
                          <div className="text-4xl animate-bounce">🎉 🎂 🥳</div>
                          <div className="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 text-amber-300 shadow-sm animate-pulse flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[12px]">celebration</span>Hoje é dia de Festa!
                          </div>
                          <div className="flex flex-col gap-4 my-2 w-full items-center">
                            {todaysBirthdays.map((b, i) => {
                              const avatar = getAvatarForBirthday(b.name);
                              return (
                                <div key={i} className="flex flex-col items-center gap-2 animate-fade-in-up">
                                  <div className="size-24 rounded-full overflow-hidden border-4 border-amber-450 ring-4 ring-amber-450/20 bg-slate-900 shadow-xl flex items-center justify-center">
                                    {avatar ? <img src={avatar} alt={b.name} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-500 text-4xl">person</span>}
                                  </div>
                                  <div className={`text-xl font-black tracking-tight ${tColor}`}>{b.name}</div>
                                  <span className="text-xs uppercase font-mono tracking-wider text-slate-400">{b.section}</span>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-sm font-medium text-slate-350 max-w-sm italic leading-relaxed">"Parabéns pelo seu dia! Desejamos a você muita saúde, paz, felicidade e realizações. É um orgulho ter você em nossa equipe!"</p>
                          {nextBirthday && <div className="mt-4 pt-3 border-t border-slate-800/40 w-full text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-semibold"><span>Próximo aniversariante:</span><strong className="text-cyan-400">{nextBirthday.name}</strong><span>({nextBirthday.day}/{monthNames[nextBirthday.month - 1].slice(0, 3)})</span></div>}
                        </div>
                      ) : (
                        <div className={`p-6 border rounded-3xl shadow-xl flex flex-col justify-center gap-5 bg-gradient-to-br ${isLightCard ? 'from-rose-50/25 via-white to-slate-50 border-slate-200' : 'from-rose-500/10 via-purple-950/5 to-cyan-500/10 border-rose-500/20 shadow-2xl'}`}>
                          <div className="border-l-4 pl-4 border-rose-500">
                            <h3 className={`text-2.5xl font-black tracking-tight ${tColor}`}>Aniversariantes de {currentMonthName}</h3>
                            <p className={`text-xs mt-1 ${mColor}`}>Nossas felicitações e homenagens aos colaboradores do mês.</p>
                          </div>
                          <div className="text-center p-5 bg-slate-900/40 border border-slate-800/40 rounded-2xl flex flex-col items-center gap-3">
                            <span className="material-symbols-outlined text-rose-400 text-5xl animate-bounce drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]">cake</span>
                            <div className="text-sm text-slate-355 leading-relaxed max-w-xs font-semibold">Parabéns a todos os aniversariantes do mês! Que esta nova jornada seja cheia de conquistas e alegrias.</div>
                          </div>
                          {nextBirthday && (() => {
                            const av = getAvatarForBirthday(nextBirthday.name);
                            const bDate = new Date(currentYearNum, nextBirthday.month - 1, nextBirthday.day);
                            if (bDate < now) bDate.setFullYear(currentYearNum + 1);
                            const daysUntil = Math.ceil((bDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            const label = daysUntil === 0 ? 'é hoje!' : daysUntil === 1 ? 'é amanhã!' : `faltam ${daysUntil} dias`;
                            return (
                              <div className="p-4 border border-cyan-500/20 bg-slate-900/30 rounded-2xl flex items-center justify-between gap-4 transition-all hover:border-cyan-500/45 hover:bg-slate-900/50 hover:scale-[1.01] hover:shadow-lg hover:shadow-cyan-500/5">
                                <div className="flex items-center gap-3.5">
                                  <div className="size-14 rounded-full overflow-hidden border-2 border-cyan-500/40 ring-2 ring-cyan-500/10 shrink-0 bg-slate-900 flex items-center justify-center">
                                    {av ? <img src={av} alt={nextBirthday.name} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-500 text-xl">person</span>}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Próximo Aniversariante</div>
                                    <div className={`text-sm font-extrabold truncate ${tColor}`}>{nextBirthday.name}</div>
                                    <div className="text-xs text-slate-400 truncate mt-0.5">{nextBirthday.day} de {monthNames[nextBirthday.month - 1]}</div>
                                  </div>
                                </div>
                                <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 border border-cyan-500/35 text-cyan-400 shadow-sm animate-pulse shrink-0">
                                  {label}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    {/* Right: Calendar + List — CLEAN DESIGN */}
                    <div className="lg:col-span-6 flex flex-col gap-4 z-10 h-full min-h-0">
                      {/* Calendar — borderless cells, circular highlights */}
                      <div className={`p-4 border rounded-2xl shadow-lg flex flex-col ${bgCardClass}`}>
                        <div className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400 flex items-center justify-between border-b border-slate-800/40 pb-2">
                          <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-rose-400">calendar_month</span>Calendário de Celebrações</span>
                          <span className="text-rose-400 font-black">{currentMonthName} {currentYearNum}</span>
                        </div>
                        <div className="grid grid-cols-7 gap-0.5 text-center font-semibold text-[10px]">
                          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d} className="text-slate-550 py-1 font-extrabold uppercase">{d}</div>)}
                          {calendarCells.map((day, i) => {
                            if (day === null) return <div key={`e-${i}`} className="p-1" />;
                            const isToday = day === todayDay;
                            const bdays = currentMonthBirthdays.filter(b => b.day === day);
                            const hasBirthday = bdays.length > 0;
                            return (
                              <div key={`d-${day}`} className="flex items-center justify-center p-1" title={hasBirthday ? bdays.map(b => b.name).join(', ') : undefined}>
                                <div className={`size-7 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-all duration-200 ${isToday ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30 ring-2 ring-cyan-400/20 font-black scale-105' : hasBirthday ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/30 font-black scale-105 animate-pulse' : 'text-slate-400 hover:bg-slate-800/40 cursor-default hover:text-white'}`}>
                                  {day}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* Birthday list — compact horizontal grid cards, optimized scrolling */}
                      <div className={`p-4 border rounded-2xl shadow-lg flex-1 min-h-0 flex flex-col ${bgCardClass}`}>
                        <div className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400 border-b border-slate-800/40 pb-2">Lista do Mês</div>
                        <div className="flex-1 overflow-y-auto pr-1 min-h-0 scrollbar-thin scrollbar-thumb-slate-700">
                          {currentMonthBirthdays.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {currentMonthBirthdays.map((b, i) => {
                                const av = getAvatarForBirthday(b.name);
                                const isBirthdayToday = b.day === todayDay;
                                return (
                                  <div key={i} className={`flex items-center gap-3 p-3 border rounded-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 ${isBirthdayToday ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/35 hover:border-amber-450/50 hover:shadow-lg hover:shadow-amber-500/5' : 'bg-slate-900/45 border-slate-800/70 hover:border-rose-500/30 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-rose-500/5'}`}>
                                    <div className="relative shrink-0">
                                      <div className={`size-9 rounded-full overflow-hidden border bg-slate-950 flex items-center justify-center ${isBirthdayToday ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-700'}`}>
                                        {av ? <img src={av} alt={b.name} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-500 text-sm">person</span>}
                                      </div>
                                      {isBirthdayToday && <span className="absolute -top-1.5 -right-1 text-[11px] animate-bounce">🎈</span>}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className={`font-extrabold truncate text-xs ${tColor}`}>{b.name}</div>
                                      <div className="text-[9px] text-slate-500 truncate leading-normal font-medium">{b.section}</div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-black shrink-0 ${isBirthdayToday ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'}`}>{b.day} de {monthNames[b.month - 1].slice(0, 3)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center p-8 text-xs text-slate-500 font-mono">Nenhum aniversariante cadastrado para este mês.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE: Melhoria Contínua - IMPROVED VISUAL */}
                {enabledSlides[currentSlide] === 'improvements' && (
                  <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-full relative overflow-hidden">
                    {/* Floating improvement particles */}
                    <div className="absolute inset-0 pointer-events-none z-0">
                      {[...Array(6)].map((_, i) => {
                        const colors = ['bg-emerald-500/10', 'bg-teal-500/10', 'bg-cyan-500/10'];
                        const col = colors[i % colors.length];
                        return (
                          <div key={i} className={`absolute ${col} rounded-full animate-float`} style={{ width: `${Math.random() * 45 + 15}px`, height: `${Math.random() * 45 + 15}px`, left: `${Math.random() * 100}%`, bottom: '-40px', animationDelay: `${Math.random() * 6}s`, animationDuration: `${Math.random() * 10 + 6}s`, filter: 'blur(5px)' }} />
                        );
                      })}
                      {[...Array(4)].map((_, i) => {
                        const emojis = ['💡', '🚀', '🛠️', '✨'];
                        const em = emojis[i % emojis.length];
                        return (
                          <div key={`em-${i}`} className="absolute text-lg select-none animate-float opacity-25" style={{ left: `${Math.random() * 100}%`, bottom: '-40px', animationDelay: `${Math.random() * 5}s`, animationDuration: `${Math.random() * 9 + 5}s` }}>
                            {em}
                          </div>
                        );
                      })}
                    </div>
                    {/* Left: Featured Improvement */}
                    <div className="lg:col-span-6 flex flex-col justify-center gap-4 z-10">
                      <div className="border-l-4 pl-4" style={{ borderColor: getSlideAccent('improvements', '#10b981') }}>
                        <h3 className={`text-2.5xl font-black tracking-tight ${tColor}`}>{getSlideTitle('improvements', 'Melhoria Contínua')}</h3>
                        <p className={`text-xs mt-1 ${mColor}`}>{getSlideSubtitle('improvements', `Iniciativas e melhorias de destaque implementadas pelos colaboradores em ${currentMonthName}.`)}</p>
                      </div>
                      {customImprovements.length > 0 ? (() => {
                        const featured = customImprovements[0];
                        const av = getAvatarForBirthday(featured.collaboratorName);
                        return (
                          <div className={`p-6 border rounded-3xl relative overflow-hidden transition-all duration-300 shadow-2xl flex flex-col justify-between h-full bg-gradient-to-br ${isLightCard ? 'from-emerald-50/30 to-white border-emerald-200' : 'from-emerald-950/10 via-slate-900/90 to-slate-900/95 border-emerald-500/20 shadow-emerald-500/5'} border-l-8 border-l-emerald-500`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3.5">
                                <div className="relative shrink-0">
                                  <div className="size-16 rounded-full overflow-hidden border-2 border-emerald-400 ring-4 ring-emerald-500/20 bg-slate-950 flex items-center justify-center shadow-xl">
                                    {av ? <img src={av} alt={featured.collaboratorName} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-500 text-3xl">person</span>}
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 size-5 rounded-full flex items-center justify-center border-2 border-slate-950 text-white shadow shadow-emerald-500/50">
                                    <span className="material-symbols-outlined text-[10px] font-black">award</span>
                                  </div>
                                </div>
                                <div>
                                  <h4 className={`text-base font-extrabold tracking-tight ${tColor}`}>{featured.collaboratorName}</h4>
                                  <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 mt-0.5">{featured.role}</p>
                                </div>
                              </div>
                              <div className="px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-450/40 text-emerald-300 shadow-sm shadow-emerald-500/10 flex items-center gap-1.5 shrink-0">
                                <span className="material-symbols-outlined text-[12px] animate-pulse">star</span>Destaque do Mês
                              </div>
                            </div>
                            <div className="my-5 flex-1 flex flex-col justify-center">
                              <h5 className={`text-lg font-black leading-snug ${tColor} mb-2`}>{featured.title}</h5>
                              <p className={`text-xs leading-relaxed text-slate-350`}>{featured.description}</p>
                            </div>
                            <div className={`p-4 border rounded-2xl flex items-center gap-3.5 transition-all duration-300 ${isLightCard ? 'bg-emerald-50/70 border-emerald-250' : 'bg-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/25'}`}>
                              <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner shrink-0">
                                <span className="material-symbols-outlined text-[20px] animate-pulse">trending_up</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Impacto Realizado</span>
                                <span className={`text-sm font-extrabold ${tColor}`}>{featured.impact}</span>
                              </div>
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-end gap-1 mt-2.5">
                              <span className="material-symbols-outlined text-[13px] text-slate-500">calendar_month</span>
                              <span>Implementado em: {new Date(featured.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        );
                      })() : (
                        <div className={`p-6 border rounded-3xl text-center py-12 ${bgCardClass}`}><span className="material-symbols-outlined text-slate-500 text-5xl">inventory_2</span><h4 className={`text-base font-bold mt-3 ${tColor}`}>Sem Melhorias Registradas</h4><p className={`text-xs mt-1 ${mColor}`}>Registre as melhorias do mês no painel de configurações.</p></div>
                      )}
                    </div>
                    {/* Right: Timeline of other improvements — premium card groups in timeline */}
                    <div className="lg:col-span-6 flex flex-col gap-4 z-10 h-full min-h-0">
                      <div className={`p-4 border rounded-2xl shadow-lg flex-1 min-h-0 flex flex-col ${bgCardClass}`}>
                        <div className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400 border-b border-slate-800/40 pb-2">Outras Melhorias do Mês</div>
                        <div className="flex-1 overflow-y-auto pr-1 min-h-0 scrollbar-thin scrollbar-thumb-slate-700">
                          {customImprovements.length > 1 ? (
                            <div className="relative pl-6">
                              {/* Vertical timeline line */}
                              <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-gradient-to-b from-emerald-500 to-emerald-950/20 rounded-full"></div>
                              {customImprovements.slice(1).map((item) => {
                                const av = getAvatarForBirthday(item.collaboratorName);
                                return (
                                  <div key={item.id} className="relative pb-5 last:pb-0 transition-all duration-300 group">
                                    {/* Timeline dot */}
                                    <div className="absolute -left-[20px] top-4.5 size-3.5 rounded-full bg-slate-900 border-2 border-emerald-500 shadow-md shadow-emerald-500/30 group-hover:bg-emerald-500 transition-colors z-20 flex items-center justify-center">
                                      <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    </div>
                                    <div className={`ml-2.5 p-3.5 border rounded-2xl transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${isLightCard ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-emerald-300' : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/60 hover:border-emerald-500/30 hover:shadow-emerald-500/5'}`}>
                                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/30">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className="size-7 rounded-full overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center shrink-0">
                                            {av ? <img src={av} alt={item.collaboratorName} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-500 text-[11px]">person</span>}
                                          </div>
                                          <div className="min-w-0">
                                            <span className={`font-bold text-xs ${tColor}`}>{item.collaboratorName}</span>
                                            <div className="text-[9px] text-slate-500 font-medium truncate leading-none mt-0.5">{item.role}</div>
                                          </div>
                                        </div>
                                        <span className="text-[9px] font-mono bg-slate-800/50 border border-slate-700/30 px-2 py-0.5 rounded-md text-slate-400 shrink-0">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                                      </div>
                                      <div className="pl-0.5">
                                        <h6 className={`font-extrabold text-xs ${tColor} group-hover:text-emerald-400 transition-colors`}>{item.title}</h6>
                                        <p className="text-[11px] text-slate-450 mt-1 leading-relaxed">{item.description}</p>
                                      </div>
                                      <div className={`mt-2.5 pt-2 border-t border-slate-850/40 flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold pl-0.5`}>
                                        <span className="material-symbols-outlined text-[13px] text-emerald-400 animate-pulse">trending_up</span>
                                        <span>Impacto: {item.impact}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center p-8 text-xs text-slate-500 font-mono flex flex-col items-center justify-center h-full"><span className="material-symbols-outlined text-slate-650 text-3xl mb-2">trending_flat</span>Nenhuma outra melhoria registrada para este mês.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE: Comunicado Customizado */}
                {enabledSlides[currentSlide] === 'custom' && (
                  <div className="w-full flex flex-col items-center justify-center text-center h-full max-w-3xl mx-auto px-4 z-10 animate-fade-in">
                    <div className="mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.45)]">
                      <svg className="size-24 text-[#eab308] mx-auto" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M50 12 L78 22 C78 48 65 72 50 85 C35 72 22 48 22 22 Z" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(234,179,8,0.05)" />
                        <path d="M36 56 C36 40 42 34 50 34 C58 34 64 40 64 56 C64 58 36 58 36 56 Z" fill="#eab308" />
                        <path d="M31 56 C31 56 50 59 69 56 L71 59 C71 59 50 62 29 59 Z" fill="#eab308" />
                        <rect x="48.5" y="28" width="3" height="15" rx="1.5" fill="#eab308" />
                      </svg>
                    </div>
                    <h3 className="text-4xl font-extrabold text-white tracking-tight leading-tight max-w-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{customAnnouncement.title}</h3>
                    <p className="text-lg text-slate-100 font-medium leading-relaxed mt-6 max-w-2xl mx-auto drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">{customAnnouncement.content}</p>
                    <div className="mt-12 flex items-center justify-center gap-2.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em] border-t border-slate-700/40 pt-5 w-64 mx-auto"><span className="size-2 rounded-full bg-[#eab308] animate-pulse"></span>COMUNICADO OFICIAL DA EQUIPE</div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Navigation */}
          {enabledSlides.length > 0 && (
            <div className={`flex items-center justify-between border-t ${isLightCard && !isCustomSlide ? 'border-slate-200' : 'border-slate-800/80'} pt-4 shrink-0 z-10`}>
              <button onClick={handlePrev} disabled={enabledSlides.length <= 1} className={isCustomSlide ? 'rounded-full px-6 py-2 bg-transparent border border-[#eab308] text-[#eab308] hover:bg-[#eab308]/15 font-bold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none' : 'rounded-full px-6 py-2 bg-[#0ea5e9] text-white hover:bg-[#0284c7] font-bold tracking-wide transition-all duration-300 shadow-md shadow-[#0ea5e9]/20 disabled:opacity-40 disabled:pointer-events-none'}>Voltar</button>
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-sm cursor-pointer select-none transition-colors ${isCustomSlide ? 'text-[#eab308]/60 hover:text-[#eab308]' : 'text-slate-500 hover:text-slate-355'}`} onClick={handlePrev}>chevron_left</span>
                <div className="flex gap-2">{enabledSlides.map((_, idx) => (<button key={idx} onClick={() => setCurrentSlide(idx)} className="size-2 rounded-full transition-all duration-300" style={{ width: currentSlide === idx ? '20px' : '8px', backgroundColor: currentSlide === idx ? (isCustomSlide ? '#eab308' : slideAccentHex) : isLightCard && !isCustomSlide ? '#cbd5e1' : '#475569', boxShadow: currentSlide === idx ? `0 0 8px ${isCustomSlide ? '#eab308' : slideAccentHex}70` : 'none' }} />))}</div>
                <span className={`material-symbols-outlined text-sm cursor-pointer select-none transition-colors ${isCustomSlide ? 'text-[#eab308]/60 hover:text-[#eab308]' : 'text-slate-500 hover:text-slate-355'}`} onClick={handleNext}>chevron_right</span>
              </div>
              <button onClick={handleNext} disabled={enabledSlides.length <= 1} className={isCustomSlide ? 'rounded-full px-6 py-2 bg-transparent border border-[#eab308] text-[#eab308] hover:bg-[#eab308]/15 font-bold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none' : 'rounded-full px-6 py-2 bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800/40 font-bold tracking-wide transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none'}>Avançar</button>
            </div>
          )}
        </div>

        {/* Configuration Panel */}
        <div className={`w-full lg:w-80 border rounded-2xl p-5 flex flex-col gap-5 shadow-xl shrink-0 ${isLightCard ? 'custom-glass-light border-slate-200' : 'custom-glass border-slate-800'}`}>
          <div className={`flex items-center gap-2 border-b ${isLightCard ? 'border-slate-200' : 'border-slate-850'} pb-3 shrink-0`}>
            <span className="material-symbols-outlined text-slate-400">settings</span>
            <h3 className={`font-bold text-sm ${tColor}`}>Painel de Configuração</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
            {/* Theme */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tema Visual</label>
              <select value={theme} onChange={e => setTheme(e.target.value as VisualTheme)} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 ${isLightCard ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`}>
                <option value="cyberpunk">Cyberpunk (Neon / Glow)</option>
                <option value="professional">Professional Steel (Navy)</option>
                <option value="industrial">Industrial Light (White / Glass)</option>
                <option value="safety">Safety Alert (Background Photo)</option>
              </select>
            </div>
            {/* General */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Configurações Gerais</label>
              <div><label className={`block mb-1 ${mColor}`}>Título Customizado</label><input type="text" value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder={`Ex: Comunicados de ${currentMonthName}`} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 ${isLightCard ? 'bg-white border-slate-350 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`} /></div>
              <div><label className={`block mb-1 ${mColor}`}>Tempo por Slide ({delay}s)</label><input type="range" min="5" max="30" step="5" value={delay} onChange={e => setDelay(Number(e.target.value))} className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-cyan-500" /><div className="flex justify-between text-[10px] text-slate-500 mt-1"><span>5s</span><span>15s</span><span>30s</span></div></div>
              <div><label className={`block mb-1 ${mColor}`}>Efeito de Transição</label><select value={transitionEffect} onChange={e => setTransitionEffect(e.target.value as TransitionEffect)} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 ${isLightCard ? 'bg-white border-slate-350 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`}><option value="fade">Esmaecer (Fade)</option><option value="slide">Deslizar (Slide)</option><option value="zoom">Zoom (Foco)</option></select></div>
              {theme === 'safety' && (<div><label className={`block mb-1 ${mColor}`}>URL Imagem de Fundo (Safety)</label><input type="text" value={safetyBgUrl} onChange={e => setSafetyBgUrl(e.target.value)} placeholder="URL da imagem..." className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 text-[10px] ${isLightCard ? 'bg-white border-slate-350 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`} /></div>)}
            </div>
            {/* Slide ordering with drag & drop + pencil edit */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ordem & Ativação dos Slides</label>
              <div className="space-y-1.5">
                {slideOrder.map((key, index) => {
                  const label = slideNameMap[key] || key;
                  const isActive = activeSlides[key];
                  return (
                    <div key={key} draggable onDragStart={e => handleDragStart(e, index)} onDragOver={e => handleDragOver(e, index)} onDragEnd={handleDragEnd} className={`flex items-center justify-between p-2 border rounded-lg transition-all select-none cursor-grab active:cursor-grabbing ${draggedIndex === index ? 'opacity-40 border-cyan-500 scale-[1.01] bg-cyan-950/20 shadow-md' : isActive ? (isLightCard ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-slate-900/30 border-slate-800 hover:bg-slate-900/50') : 'opacity-45 bg-slate-900/10 border-transparent'}`}>
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <span className="material-symbols-outlined text-[15px] text-slate-500 shrink-0 select-none">drag_indicator</span>
                        <span className={`text-[11px] font-semibold truncate ${tColor}`}>{index + 1}. {label}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={e => { e.stopPropagation(); const next = { ...activeSlides, [key]: !isActive }; setActiveSlides(next); setCurrentSlide(0); }} className={`size-6 rounded flex items-center justify-center border transition-all cursor-pointer ${isActive ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200'}`} title={isActive ? 'Desativar Slide' : 'Ativar Slide'}>
                          <span className="material-symbols-outlined text-[14px]">{isActive ? 'visibility' : 'visibility_off'}</span>
                        </button>
                        <button type="button" onClick={e => { e.stopPropagation(); setEditingSlideKey(key); }} className={`size-6 rounded flex items-center justify-center border transition-all cursor-pointer ${isLightCard ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'}`} title="Editar Configurações do Slide">
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <button onClick={fetchData} className={`w-full py-2.5 font-black border rounded-lg transition-all flex items-center justify-center gap-2 shrink-0 ${isLightCard ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-750 border-slate-700/60 text-slate-200 hover:text-white'}`}>
            <span className="material-symbols-outlined text-[16px]">sync</span>Sincronizar Banco de Dados
          </button>
        </div>
      </div>

      {/* Configuration Modal */}
      {editingSlideKey && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${isLightCard ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f172a] border-slate-800 text-slate-200'}`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isLightCard ? 'border-slate-100' : 'border-slate-850'}`}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-cyan-400 text-2xl">edit</span>
                <div><h3 className="text-lg font-black tracking-tight">Configurações do Slide: {slideNameMap[editingSlideKey] || editingSlideKey}</h3><p className="text-xs text-slate-400">Personalize o visual, cores, títulos e informações deste slide.</p></div>
              </div>
              <button onClick={() => setEditingSlideKey(null)} className={`size-8 rounded-full flex items-center justify-center transition-all hover:scale-105 ${isLightCard ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 text-slate-300'}`}><span className="material-symbols-outlined text-[18px]">close</span></button>
            </div>
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Título Customizado</label><input type="text" placeholder="Deixe em branco para usar o padrão" value={slideCustomTitles[editingSlideKey] || ''} onChange={e => { const v = e.target.value; setSlideCustomTitles(prev => { const n = { ...prev }; if (v) n[editingSlideKey!] = v; else delete n[editingSlideKey!]; return n; }); }} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 ${isLightCard ? 'bg-slate-50 border-slate-250 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`} /></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subtítulo Customizado</label><input type="text" placeholder="Deixe em branco para usar o padrão" value={slideCustomSubtitles[editingSlideKey] || ''} onChange={e => { const v = e.target.value; setSlideCustomSubtitles(prev => { const n = { ...prev }; if (v) n[editingSlideKey!] = v; else delete n[editingSlideKey!]; return n; }); }} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 ${isLightCard ? 'bg-slate-50 border-slate-250 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cor de Destaque / Visual</label><select value={slideCustomAccents[editingSlideKey] || ''} onChange={e => { const v = e.target.value; setSlideCustomAccents(prev => { const n = { ...prev }; if (v) n[editingSlideKey!] = v; else delete n[editingSlideKey!]; return n; }); }} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 ${isLightCard ? 'bg-slate-50 border-slate-250 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`}><option value="">Padrão do Tema</option><option value="#0ea5e9">Ciano / Sky</option><option value="#10b981">Esmeralda / Green</option><option value="#f59e0b">Âmbar / Laranja</option><option value="#eab308">Amarelo / Safety</option><option value="#f43f5e">Rosa / Red</option><option value="#a855f7">Roxo / Purple</option><option value="#6366f1">Índigo / Blue</option></select></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">URL Imagem de Fundo (Override)</label><input type="text" placeholder="URL para plano de fundo customizado..." value={slideCustomBgs[editingSlideKey] || ''} onChange={e => { const v = e.target.value; setSlideCustomBgs(prev => { const n = { ...prev }; if (v) n[editingSlideKey!] = v; else delete n[editingSlideKey!]; return n; }); }} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 text-[11px] ${isLightCard ? 'bg-slate-50 border-slate-250 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`} /></div>
              </div>

              {/* Custom announcement editor */}
              {editingSlideKey === 'custom' && (
                <div className={`space-y-4 pt-4 border-t ${isLightCard ? 'border-slate-100' : 'border-slate-850'}`}>
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">Conteúdo do Comunicado</h4>
                  <div><label className="text-[10px] font-bold text-slate-400 block mb-1">Título do Comunicado</label><input type="text" value={customAnnouncement.title} onChange={e => setCustomAnnouncement({ ...customAnnouncement, title: e.target.value })} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 ${isLightCard ? 'bg-slate-50 border-slate-250 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`} /></div>
                  <div><label className="text-[10px] font-bold text-slate-400 block mb-1">Conteúdo do Comunicado</label><textarea rows={4} value={customAnnouncement.content} onChange={e => setCustomAnnouncement({ ...customAnnouncement, content: e.target.value })} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 resize-none ${isLightCard ? 'bg-slate-50 border-slate-250 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'}`} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-bold text-slate-400 block mb-1">Tipo de Alerta</label><select value={customAnnouncement.type} onChange={e => setCustomAnnouncement({ ...customAnnouncement, type: e.target.value as any })} className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${isLightCard ? 'bg-slate-50 border-slate-250 text-slate-850' : 'bg-slate-900 border-slate-800 text-slate-200'}`}><option value="info">Informação (Azul)</option><option value="success">Sucesso (Verde)</option><option value="warning">Alerta (Amarelo)</option><option value="danger">Perigo (Vermelho)</option></select></div>
                    <div><label className="text-[10px] font-bold text-slate-400 block mb-1">Ícone</label><select value={customAnnouncement.icon} onChange={e => setCustomAnnouncement({ ...customAnnouncement, icon: e.target.value })} className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${isLightCard ? 'bg-slate-50 border-slate-250 text-slate-855' : 'bg-slate-900 border-slate-800 text-slate-200'}`}><option value="engineering">Capacete / Engenharia</option><option value="warning">Triângulo de Alerta</option><option value="verified">Selo Verificado</option><option value="info">Info Circular</option><option value="local_fire_department">Fogo / Calor</option></select></div>
                  </div>
                </div>
              )}

              {/* Birthdays editor */}
              {editingSlideKey === 'birthdays' && (
                <div className={`space-y-4 pt-4 border-t ${isLightCard ? 'border-slate-100' : 'border-slate-850'}`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">Gerenciar Aniversariantes</h4>
                    <button type="button" onClick={() => setCustomBirthdays(prev => [...prev, { name: 'Novo Colaborador', day: 1, month: currentMonthNum, section: 'MANUTENÇÃO INDUSTRIAL MANEQUIP' }])} className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-1 transition-colors"><span className="material-symbols-outlined text-[14px]">add</span>Adicionar</button>
                  </div>
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                    {customBirthdays.map((b, idx) => (
                      <div key={idx} className={`p-3 border rounded-xl flex flex-col md:flex-row gap-3 items-end md:items-center justify-between ${isLightCard ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-850'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 flex-1 w-full">
                          <div className="md:col-span-5"><label className="text-[9px] text-slate-500 font-bold block mb-0.5">Nome</label><input type="text" value={b.name} onChange={e => { const v = e.target.value; setCustomBirthdays(prev => { const n = [...prev]; n[idx] = { ...n[idx], name: v }; return n; }); }} className={`w-full px-2 py-1 border rounded text-[11px] focus:outline-none ${isLightCard ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-850 border-slate-700 text-slate-200'}`} /></div>
                          <div className="md:col-span-4"><label className="text-[9px] text-slate-500 font-bold block mb-0.5">Setor</label><input type="text" value={b.section} onChange={e => { const v = e.target.value; setCustomBirthdays(prev => { const n = [...prev]; n[idx] = { ...n[idx], section: v }; return n; }); }} className={`w-full px-2 py-1 border rounded text-[11px] focus:outline-none ${isLightCard ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-850 border-slate-700 text-slate-200'}`} /></div>
                          <div className="md:col-span-1 col-span-6"><label className="text-[9px] text-slate-500 font-bold block mb-0.5">Dia</label><input type="number" min="1" max="31" value={b.day} onChange={e => { const v = Number(e.target.value); setCustomBirthdays(prev => { const n = [...prev]; n[idx] = { ...n[idx], day: v }; return n; }); }} className={`w-full px-2 py-1 border rounded text-[11px] text-center focus:outline-none ${isLightCard ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-850 border-slate-700 text-slate-200'}`} /></div>
                          <div className="md:col-span-2 col-span-6"><label className="text-[9px] text-slate-500 font-bold block mb-0.5">Mês</label><input type="number" min="1" max="12" value={b.month} onChange={e => { const v = Number(e.target.value); setCustomBirthdays(prev => { const n = [...prev]; n[idx] = { ...n[idx], month: v }; return n; }); }} className={`w-full px-2 py-1 border rounded text-[11px] text-center focus:outline-none ${isLightCard ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-850 border-slate-700 text-slate-200'}`} /></div>
                        </div>
                        <button type="button" onClick={() => setCustomBirthdays(prev => prev.filter((_, i) => i !== idx))} className="size-7 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 flex items-center justify-center transition-all md:self-end shrink-0" title="Remover"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                      </div>
                    ))}
                    {customBirthdays.length === 0 && <div className="text-center p-8 text-slate-500 italic">Nenhum aniversariante cadastrado.</div>}
                  </div>
                </div>
              )}

              {/* Improvements editor */}
              {editingSlideKey === 'improvements' && (
                <div className={`space-y-4 pt-4 border-t ${isLightCard ? 'border-slate-100' : 'border-slate-850'}`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">Gerenciar Melhorias Contínuas</h4>
                    <button type="button" onClick={() => setCustomImprovements(prev => [...prev, { id: `imp-${Date.now()}`, collaboratorName: 'Novo Colaborador', role: 'MANUTENÇÃO INDUSTRIAL MANEQUIP', title: 'Título da Melhoria', description: 'Descreva a melhoria.', impact: 'Impacto estimado...', date: new Date().toISOString().split('T')[0] }])} className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-1 transition-colors"><span className="material-symbols-outlined text-[14px]">add</span>Adicionar</button>
                  </div>
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                    {customImprovements.map((item, idx) => (
                      <div key={item.id} className={`p-4 border rounded-xl flex flex-col gap-3 relative ${isLightCard ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-850'}`}>
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          {idx === 0 && <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">Destaque</span>}
                          <button type="button" onClick={() => setCustomImprovements(prev => prev.filter((_, i) => i !== idx))} className="size-7 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 flex items-center justify-center transition-all" title="Remover"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full pr-12">
                          <div><label className="text-[9px] text-slate-500 font-bold block mb-0.5">Colaborador</label><input type="text" value={item.collaboratorName} onChange={e => { const v = e.target.value; setCustomImprovements(prev => { const n = [...prev]; n[idx] = { ...n[idx], collaboratorName: v }; return n; }); }} className={`w-full px-2 py-1 border rounded text-[11px] focus:outline-none ${isLightCard ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-850 border-slate-700 text-slate-200'}`} /></div>
                          <div><label className="text-[9px] text-slate-500 font-bold block mb-0.5">Cargo / Setor</label><input type="text" value={item.role} onChange={e => { const v = e.target.value; setCustomImprovements(prev => { const n = [...prev]; n[idx] = { ...n[idx], role: v }; return n; }); }} className={`w-full px-2 py-1 border rounded text-[11px] focus:outline-none ${isLightCard ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-850 border-slate-700 text-slate-200'}`} /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                          <div className="md:col-span-2"><label className="text-[9px] text-slate-500 font-bold block mb-0.5">Título da Melhoria</label><input type="text" value={item.title} onChange={e => { const v = e.target.value; setCustomImprovements(prev => { const n = [...prev]; n[idx] = { ...n[idx], title: v }; return n; }); }} className={`w-full px-2 py-1 border rounded text-[11px] focus:outline-none ${isLightCard ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-850 border-slate-700 text-slate-200'}`} /></div>
                          <div><label className="text-[9px] text-slate-500 font-bold block mb-0.5">Data</label><input type="date" value={item.date} onChange={e => { const v = e.target.value; setCustomImprovements(prev => { const n = [...prev]; n[idx] = { ...n[idx], date: v }; return n; }); }} className={`w-full px-2 py-1 border rounded text-[11px] focus:outline-none ${isLightCard ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-850 border-slate-700 text-slate-200'}`} /></div>
                        </div>
                        <div><label className="text-[9px] text-slate-500 font-bold block mb-0.5">Descrição Curta</label><textarea rows={2} value={item.description} onChange={e => { const v = e.target.value; setCustomImprovements(prev => { const n = [...prev]; n[idx] = { ...n[idx], description: v }; return n; }); }} className={`w-full px-2 py-1 border rounded text-[11px] focus:outline-none resize-none ${isLightCard ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-850 border-slate-700 text-slate-200'}`} /></div>
                        <div><label className="text-[9px] text-slate-500 font-bold block mb-0.5">Impacto Estimado / Realizado</label><input type="text" value={item.impact} onChange={e => { const v = e.target.value; setCustomImprovements(prev => { const n = [...prev]; n[idx] = { ...n[idx], impact: v }; return n; }); }} placeholder="Ex: Redução de 2 horas de downtime" className={`w-full px-2 py-1 border rounded text-[11px] focus:outline-none ${isLightCard ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-850 border-slate-700 text-slate-200'}`} /></div>
                      </div>
                    ))}
                    {customImprovements.length === 0 && <div className="text-center p-8 text-slate-500 italic">Nenhuma melhoria contínua cadastrada.</div>}
                  </div>
                </div>
              )}
            </div>
            {/* Modal Footer */}
            <div className={`p-6 border-t flex justify-end gap-3 ${isLightCard ? 'border-slate-100' : 'border-slate-855'}`}>
              <button onClick={() => setEditingSlideKey(null)} className={`px-5 py-2.5 rounded-xl border font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${isLightCard ? 'bg-slate-100 hover:bg-slate-200 border-slate-250 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'}`}>Fechar / Concluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
