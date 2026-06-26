import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';

import {
  DDSTheme,
  defaultThemes,
  weeklySchedule,
  suggestedMonthsSchedule
} from './ddsThemes';

interface DDSHistoryEntry {
  id: string;
  date: string;
  themeTitle: string;
  conductor: string;
  participantsCount: number;
  notes?: string;
}

// Helper to dynamically assign highly relevant, beautiful industrial safety images to themes
const getThemeImage = (theme: DDSTheme): string => {
  if (theme.imageUrl && theme.imageUrl.trim()) return theme.imageUrl;
  
  const title = theme.title.toLowerCase();
  const content = theme.content.toLowerCase();
  const category = theme.category.toLowerCase();

  let codeText = "DDS";
  let subtitleText = "CONSCIENTIZAÇÃO";
  let categoryText = "SEGURANÇA";
  let accent1 = "#0ea5e9";
  let accent2 = "#00d2ff";
  let iconPaths = "";

  // 1. NR35 - Altura
  if (
    title.includes('altura') || 
    content.includes('queda') || 
    content.includes('andaime') || 
    content.includes('individual') || 
    title.includes('nr-35') || 
    title.includes('nr35') || 
    content.includes('nr35') || 
    content.includes('nr-35')
  ) {
    codeText = "NR-35";
    subtitleText = "TRABALHO EM ALTURA";
    categoryText = "RISCOS CRÍTICOS";
    accent1 = "#f59e0b"; // Warning amber
    accent2 = "#d97706";
    iconPaths = `
      <polygon points="0,-75 -75,55 75,55" fill="#f59e0b" opacity="0.1" />
      <polygon points="0,-75 -75,55 75,55" fill="none" stroke="#f59e0b" stroke-width="4" />
      <path d="M 0,-30 L 0,10 M -20,10 H 20 M -10,35 L 0,10 L 10,35" stroke="#f59e0b" stroke-width="6" stroke-linecap="round" />
      <circle cx="0" cy="-40" r="10" fill="#f59e0b" />
      <path d="M -30,-45 C -15,-55 15,-55 30,-45" fill="none" stroke="#ef4444" stroke-width="4" stroke-dasharray="5,5" />
    `;
  }
  // 2. Gripe / Vírus
  else if (
    title.includes('gripe') || 
    content.includes('gripe') || 
    title.includes('resfriado') || 
    title.includes('vírus') || 
    title.includes('virus') || 
    content.includes('espirro') || 
    content.includes('vacina')
  ) {
    codeText = "SAÚDE";
    subtitleText = "PREVENÇÃO DE GRIPE";
    categoryText = "SAÚDE E HIGIENE";
    accent1 = "#10b981"; // Lime/Green
    accent2 = "#059669";
    iconPaths = `
      <circle cx="0" cy="0" r="45" fill="#10b981" opacity="0.2" />
      <circle cx="0" cy="0" r="45" fill="none" stroke="#10b981" stroke-width="4" />
      <path d="M 0,-45 V -65 M 0,45 V 65 M -45,0 H -65 M 45,0 H 65 M -32,-32 L -47,-47 M 32,32 L 47,47 M -32,32 L -47,47 M 32,-32 L 47,-47" stroke="#10b981" stroke-width="6" stroke-linecap="round" />
      <circle cx="0" cy="-65" r="6" fill="#10b981" />
      <circle cx="0" cy="65" r="6" fill="#10b981" />
      <circle cx="-65" cy="0" r="6" fill="#10b981" />
      <circle cx="65" cy="0" r="6" fill="#10b981" />
      <circle cx="-47" cy="-47" r="6" fill="#10b981" />
      <circle cx="47" cy="47" r="6" fill="#10b981" />
      <circle cx="-47" cy="47" r="6" fill="#10b981" />
      <circle cx="47" cy="-47" r="6" fill="#10b981" />
      <circle cx="-15" cy="-10" r="5" fill="#047857" />
      <circle cx="15" cy="15" r="7" fill="#047857" />
      <circle cx="-10" cy="20" r="4" fill="#047857" />
    `;
  }
  // 3. Saúde / Cruz Vermelha
  else if (
    category.includes('saúde') || 
    category.includes('saude') || 
    category.includes('bem-estar') || 
    title.includes('saúde') || 
    title.includes('saude') || 
    content.includes('saúde') || 
    content.includes('saude') || 
    title.includes('cardíaca') || 
    title.includes('ferimento')
  ) {
    codeText = "SAÚDE";
    subtitleText = "CUIDADO ATIVO";
    categoryText = "BEM-ESTAR & VIDA";
    accent1 = "#ef4444"; // Red for cross
    accent2 = "#b91c1c";
    iconPaths = `
      <circle cx="0" cy="0" r="80" fill="#ef4444" opacity="0.1" />
      <circle cx="0" cy="0" r="80" fill="none" stroke="#ef4444" stroke-width="4" />
      <path d="M -15,-45 H 15 V -15 H 45 V 15 H 15 V 45 H -15 V 15 H -45 V -15 H -15 Z" fill="#ef4444" />
      <path d="M -15,-45 H 15 V -15 H 45 V 15 H 15 V 45 H -15 V 15 H -45 V -15 H -15 Z" fill="#ffffff" transform="scale(0.85)" />
    `;
  }
  // 4. NR10 - Elétrica
  else if (
    title.includes('elétric') || 
    content.includes('energia') || 
    content.includes('choque') || 
    title.includes('disjuntor') || 
    title.includes('nr-10') || 
    title.includes('nr10') || 
    content.includes('nr10') || 
    content.includes('nr-10')
  ) {
    codeText = "NR-10";
    subtitleText = "SEGURANÇA ELÉTRICA";
    categoryText = "RISCOS CRÍTICOS";
    accent1 = "#0ea5e9";
    accent2 = "#2563eb";
    iconPaths = `
      <circle cx="0" cy="0" r="80" fill="#00d2ff" opacity="0.1" />
      <circle cx="0" cy="0" r="80" fill="none" stroke="#00d2ff" stroke-width="4" />
      <path d="M 15,-55 L -25,5 H 5 L -15,55 L 35,-5 H 5 Z" fill="#fbbf24" />
      <path d="M 15,-55 L -25,5 H 5 L -15,55 L 35,-5 H 5 Z" fill="#ffffff" transform="scale(0.8)" />
    `;
  }
  // 5. NR12 - Máquinas
  else if (
    title.includes('nr-12') || 
    title.includes('nr12') || 
    title.includes('máquina') || 
    content.includes('máquina') || 
    title.includes('equipamento') || 
    content.includes('calandra') || 
    content.includes('esmerilhadeira') || 
    content.includes('torno')
  ) {
    codeText = "NR-12";
    subtitleText = "SEGURANÇA EM MÁQUINAS";
    categoryText = "MÁQUINAS & EQUIPAMENTOS";
    accent1 = "#f97316"; // Orange
    accent2 = "#c2410c";
    iconPaths = `
      <circle cx="0" cy="0" r="80" fill="#f97316" opacity="0.1" />
      <circle cx="0" cy="0" r="80" fill="none" stroke="#f97316" stroke-width="4" />
      <path d="M -40,-40 H 40 V -10 C 40,20 0,55 0,55 C 0,55 -40,20 -40,-10 Z" fill="none" stroke="#f97316" stroke-width="6" />
      <circle cx="0" cy="-10" r="22" fill="none" stroke="#f97316" stroke-width="8" stroke-dasharray="10,8" />
      <circle cx="0" cy="-10" r="10" fill="#0f172a" stroke="#f97316" stroke-width="3" />
    `;
  }
  // 6. 5S / Organização
  else if (
    title.includes('5s') || 
    title.includes('organização') || 
    content.includes('organização') || 
    title.includes('limpeza') || 
    content.includes('arrumação')
  ) {
    codeText = "5S";
    subtitleText = "ORGANIZAÇÃO & 5S";
    categoryText = "DISCIPLINA OPERACIONAL";
    accent1 = "#14b8a6"; // Teal
    accent2 = "#0f766e";
    iconPaths = `
      <circle cx="0" cy="0" r="80" fill="#14b8a6" opacity="0.1" />
      <rect x="-40" y="-50" width="80" height="100" rx="8" fill="none" stroke="#14b8a6" stroke-width="4" />
      <line x1="-20" y1="-20" x2="20" y2="-20" stroke="#14b8a6" stroke-width="4" stroke-linecap="round" />
      <line x1="-20" y1="10" x2="10" y2="10" stroke="#14b8a6" stroke-width="4" stroke-linecap="round" />
      <path d="M -30,-20 L -25,-15 L -15,-30" fill="none" stroke="#34d399" stroke-width="4" stroke-linecap="round" />
      <path d="M -30,10 L -25,15 L -15,0" fill="none" stroke="#34d399" stroke-width="4" stroke-linecap="round" />
    `;
  }
  // 7. Fire / Incêndio / Extintor
  else if (
    title.includes('incêndio') || 
    content.includes('incêndio') || 
    title.includes('fogo') || 
    title.includes('extintor') || 
    content.includes('extintor')
  ) {
    codeText = "FOGO";
    subtitleText = "PREVENÇÃO DE INCÊNDIOS";
    categoryText = "EMERGÊNCIAS";
    accent1 = "#ea580c"; // Red-orange
    accent2 = "#dc2626";
    iconPaths = `
      <circle cx="0" cy="0" r="80" fill="#ea580c" opacity="0.1" />
      <circle cx="0" cy="0" r="80" fill="none" stroke="#ea580c" stroke-width="4" />
      <path d="M 0,-50 C 20,-20 40,0 40,30 C 40,55 20,70 0,70 C -20,70 -40,55 -40,30 C -40,0 -20,-20 0,-50 Z" fill="#ea580c" />
      <path d="M -5,-15 C 5,0 15,10 15,25 C 15,35 5,45 -5,45 C -15,45 -25,35 -25,25 C -25,10 -15,0 -5,-15 Z" fill="#fbb500" />
    `;
  }
  // Default fallback
  else {
    codeText = "DDS";
    const cleanedTitle = theme.title.toUpperCase();
    subtitleText = cleanedTitle.length > 25 ? cleanedTitle.substring(0, 25) + "..." : cleanedTitle;
    categoryText = theme.category.toUpperCase();
    
    iconPaths = `
      <circle cx="0" cy="0" r="80" fill="#0ea5e9" opacity="0.1" />
      <path d="M -40,-45 L 0,-60 L 40,-45 V 0 C 40,25 0,55 0,55 C 0,55 -40,25 -40,0 Z" fill="none" stroke="#0ea5e9" stroke-width="5" />
      <path d="M -20,5 L -5,20 L 20,-10" fill="none" stroke="#0ea5e9" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
    `;
  }

  // Build the complete SVG string
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#070b19" />
          <stop offset="50%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accent1}" />
          <stop offset="100%" stop-color="${accent2}" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="15" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="800" height="450" fill="url(#bgGrad)" />
      <g opacity="0.04">
        <path d="M 0,50 L 800,50 M 0,100 L 800,100 M 0,150 L 800,150 M 0,200 L 800,200 M 0,250 L 800,250 M 0,300 L 800,300 M 0,350 L 800,350 M 0,400 L 800,400" stroke="#ffffff" stroke-width="1"/>
        <path d="M 100,0 L 100,450 M 200,0 L 200,450 M 300,0 L 300,450 M 400,0 L 400,450 M 500,0 L 500,450 M 600,0 L 600,450 M 700,0 L 700,450" stroke="#ffffff" stroke-width="1"/>
      </g>
      <circle cx="150" cy="225" r="120" fill="${accent1}" opacity="0.15" filter="url(#glow)" />
      <circle cx="650" cy="225" r="100" fill="${accent2}" opacity="0.1" filter="url(#glow)" />
      <rect x="20" y="20" width="760" height="410" rx="16" fill="none" stroke="url(#accentGrad)" stroke-width="2" opacity="0.4" />
      <g transform="translate(180, 225)">
        ${iconPaths}
      </g>
      <g transform="translate(360, 0)">
        <rect x="0" y="100" width="180" height="30" rx="6" fill="${accent1}" opacity="0.15" />
        <text x="90" y="119" fill="${accent1}" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="900" letter-spacing="1.5" text-anchor="middle">${categoryText}</text>
        <text x="0" y="200" fill="url(#accentGrad)" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="900" letter-spacing="1">${codeText}</text>
        <text x="0" y="250" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" opacity="0.95">${subtitleText}</text>
        <text x="0" y="285" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" opacity="0.7">MANEQUIP • DIÁLOGO DIÁRIO DE SEGURANÇA</text>
        <line x1="0" y1="315" x2="320" y2="315" stroke="url(#accentGrad)" stroke-width="3" opacity="0.5" />
      </g>
      <g transform="translate(700, 45)" opacity="0.3">
        <circle cx="20" cy="20" r="15" fill="none" stroke="#ffffff" stroke-width="2" />
        <path d="M 12,20 L 20,12 L 28,20 L 20,28 Z" fill="#ffffff" />
      </g>
    </svg>
  `;

  const base64 = btoa(unescape(encodeURIComponent(svgString.trim())));
  return 'data:image/svg+xml;base64,' + base64;
};

const DDS: React.FC = () => {
  const { userProfile } = usePreferences();
  const [activeTab, setActiveTab] = useState<'active' | 'calendar'>('active');
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const now = new Date();
    return now.getMonth() + 1;
  });
  const [themes, setThemes] = useState<DDSTheme[]>(() => {
    const saved = localStorage.getItem('manequip_dds_themes_v4');
    if (!saved) return defaultThemes;
    try {
      const parsed = JSON.parse(saved) as DDSTheme[];
      const parsedIds = new Set(parsed.map(t => t.id));
      const missing = defaultThemes.filter(t => !parsedIds.has(t.id));
      return [...parsed, ...missing];
    } catch (e) {
      return defaultThemes;
    }
  });

  const [history, setHistory] = useState<DDSHistoryEntry[]>(() => {
    const saved = localStorage.getItem('manequip_dds_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [hiddenThemes, setHiddenThemes] = useState<string[]>(() => {
    const saved = localStorage.getItem('manequip_dds_hidden_themes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('manequip_dds_hidden_themes', JSON.stringify(hiddenThemes));
  }, [hiddenThemes]);

  // Helper to find the scheduled month/week of a theme from the weeklySchedule
  const getThemeSchedule = (themeId: string) => {
    for (const mStr of Object.keys(weeklySchedule)) {
      const monthNum = parseInt(mStr);
      for (const wStr of Object.keys(weeklySchedule[monthNum])) {
        const weekNum = parseInt(wStr);
        if (weeklySchedule[monthNum][weekNum].includes(themeId)) {
          return { month: monthNum, week: weekNum };
        }
      }
    }
    return null;
  };

  const [selectedThemeId, setSelectedThemeId] = useState<string>(() => {
    return themes[0]?.id || 'theme-1';
  });

  // Manual input state (Official DDS)
  const [isManualOfficial, setIsManualOfficial] = useState(false);
  const [manualTitle, setManualTitle] = useState('DDS Oficial do Dia');
  const [manualContent, setManualContent] = useState('');
  const [manualReflection, setManualReflection] = useState('');
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [manualVideoUrl, setManualVideoUrl] = useState('');
  const [manualCategory, setManualCategory] = useState('DDS Oficial');

  // Presentation / Fullscreen states
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modal edit states
  const [editingTheme, setEditingTheme] = useState<DDSTheme | null>(null);

  // History log modal states
  const [logConductor, setLogConductor] = useState(userProfile?.name || '');
  const [logParticipants, setLogParticipants] = useState(10);
  const [logNotes, setLogNotes] = useState('');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Audio / Narration state variables
  const [isNarrating, setIsNarrating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showTtsWarning, setShowTtsWarning] = useState(false);
  const [narrationRate, setNarrationRate] = useState<number>(1.0);

  // Initialize SpeechSynthesis and load voices
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isTV = /smart-tv|smarttv|googletv|appletv|tizen|webos|hbbtv|netcast|viera|bravia|playstation|xbox|nintendo|roku|firetv|firestick|boxee|kylo|philips/i.test(window.navigator.userAgent);
    const hasTTS = !!window.speechSynthesis;

    if (isTV || !hasTTS) {
      setShowTtsWarning(true);
    }

    if (!hasTTS) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0 && !isTV) {
        // Double check after a small delay in case they load asynchronously
        const timer = setTimeout(() => {
          if (window.speechSynthesis && window.speechSynthesis.getVoices().length === 0) {
            setShowTtsWarning(true);
          }
        }, 1500);
        return () => clearTimeout(timer);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
      } catch (e) {}
    };
  }, []);

  // Fallback Audio API states (for Smart TVs without local TTS engine)
  const audioObjRef = useRef<HTMLAudioElement | null>(null);
  const audioChunksRef = useRef<string[]>([]);
  const currentChunkIndexRef = useRef<number>(0);
  const [isFallbackNarrating, setIsFallbackNarrating] = useState(false);
  const [isFallbackPaused, setIsFallbackPaused] = useState(false);

  // References for native TTS tracking
  const speechCharIndexRef = useRef<number>(0);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTextRef = useRef<string>('');

  // Helper to split text into chunks under maximum length (required by Google TTS API)
  const splitTextIntoChunks = (text: string, maxLength: number = 150): string[] => {
    if (!text) return [];
    // Clean up excessive spacing
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    const words = cleanedText.split(' ');
    const chunks: string[] = [];
    let currentChunk = '';

    for (const word of words) {
      if ((currentChunk + ' ' + word).trim().length <= maxLength) {
        currentChunk = (currentChunk + ' ' + word).trim();
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = word;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    return chunks;
  };

  // Play next chunk of the fallback Google TTS audio sequence
  const playFallbackChunk = (index: number) => {
    if (index >= audioChunksRef.current.length) {
      setIsFallbackNarrating(false);
      setIsFallbackPaused(false);
      setIsNarrating(false);
      setIsPaused(false);
      return;
    }

    currentChunkIndexRef.current = index;
    const text = audioChunksRef.current[index];
    const encodedText = encodeURIComponent(text);
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=pt-BR&client=tw-ob&q=${encodedText}`;

    if (audioObjRef.current) {
      try {
        audioObjRef.current.pause();
      } catch (e) {}
    }

    let audio: HTMLAudioElement;
    try {
      audio = new Audio(audioUrl);
    } catch (err) {
      console.error('Navegador não suporta construtor de Audio:', err);
      // Skip to next chunk or fail gracefully
      setIsFallbackNarrating(false);
      setIsFallbackPaused(false);
      setIsNarrating(false);
      setIsPaused(false);
      return;
    }
    audioObjRef.current = audio;
    audio.preload = 'auto';

    // Set user configured playback speed
    audio.defaultPlaybackRate = narrationRate;
    audio.playbackRate = narrationRate;

    // Apply speed settings when the audio actually plays (crucial for TV browsers)
    audio.onplay = () => {
      audio.playbackRate = narrationRate;
    };

    audio.onended = () => {
      playFallbackChunk(index + 1);
    };

    audio.onerror = (e) => {
      console.error('Google TTS playback error, skipping chunk:', e);
      playFallbackChunk(index + 1);
    };

    // Preload next chunk ahead of time for smooth continuous reading transition
    if (index + 1 < audioChunksRef.current.length) {
      try {
        const nextText = audioChunksRef.current[index + 1];
        const nextUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=pt-BR&client=tw-ob&q=${encodeURIComponent(nextText)}`;
        const nextAudio = new Audio(nextUrl);
        nextAudio.preload = 'auto';
      } catch (e) {}
    }

    audio.play().then(() => {
      // Force rate again just in case the browser reset it on play initiation
      audio.playbackRate = narrationRate;
      setIsFallbackNarrating(true);
      setIsFallbackPaused(false);
      setIsNarrating(true);
      setIsPaused(false);
    }).catch(err => {
      console.error('Failed to play audio chunk. Needs user interaction:', err);
      setIsFallbackNarrating(false);
      setIsFallbackPaused(false);
      setIsNarrating(false);
      setIsPaused(false);
    });
  };

  // Stop narration on theme selection change to prevent voice overlap
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    
    // Stop fallback audio playback
    if (audioObjRef.current) {
      try {
        audioObjRef.current.pause();
        audioObjRef.current = null;
      } catch (e) {}
    }
    setIsFallbackNarrating(false);
    setIsFallbackPaused(false);
    setIsNarrating(false);
    setIsPaused(false);
  }, [selectedThemeId, isManualOfficial]);

  const handleNarrate = () => {
    // Check if we should use Google Fallback (if it is a TV or has no local TTS engine)
    const isTV = /smart-tv|smarttv|googletv|appletv|tizen|webos|hbbtv|netcast|viera|bravia|playstation|xbox|nintendo|roku|firetv|firestick|boxee|kylo|philips/i.test(window.navigator.userAgent);
    const nativeVoices = typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    const useGoogleFallback = isTV || nativeVoices.length === 0;

    // Clean up text format for smoother voice presentation
    const cleanContent = activeTheme.content
      ? activeTheme.content.replace(/\n+/g, ' ').trim()
      : '';
    const textToSpeak = `${activeTheme.title}. ${cleanContent}. ${
      activeTheme.reflection ? `Frase para reflexão: ${activeTheme.reflection}` : ''
    }`;

    // Handle play/pause toggle for Fallback Audio
    if (isFallbackNarrating) {
      if (isFallbackPaused) {
        if (audioObjRef.current) {
          audioObjRef.current.play().then(() => {
            setIsFallbackPaused(false);
            setIsPaused(false);
          }).catch(e => console.error(e));
        }
      } else {
        if (audioObjRef.current) {
          audioObjRef.current.pause();
          setIsFallbackPaused(true);
          setIsPaused(true);
        }
      }
      return;
    }

    if (useGoogleFallback) {
      // Initialize fallback audio playlist
      if (audioObjRef.current) {
        try {
          audioObjRef.current.pause();
          audioObjRef.current = null;
        } catch (e) {}
      }

      const chunks = splitTextIntoChunks(textToSpeak, 180);
      audioChunksRef.current = chunks;
      setIsFallbackNarrating(true);
      setIsFallbackPaused(false);
      
      playFallbackChunk(0);
      return;
    }

    // Default browser speechSynthesis logic
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Funcionalidade de áudio indisponível neste navegador.');
      return;
    }

    if (isNarrating) {
      if (isPaused) {
        try {
          window.speechSynthesis.resume();
          setIsPaused(false);
        } catch (e) {
          console.error('Failed to resume voice:', e);
        }
      } else {
        try {
          window.speechSynthesis.pause();
          setIsPaused(true);
        } catch (e) {
          console.error('Failed to pause voice:', e);
        }
      }
    } else {
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
      } catch (e) {}

      // Store references for dynamic rate adjustment
      speechTextRef.current = textToSpeak;
      speechCharIndexRef.current = 0;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      speechUtteranceRef.current = utterance;
      utterance.lang = 'pt-BR';

      const ptVoices = nativeVoices.filter(v => v.lang.startsWith('pt'));

      let selectedVoice = ptVoices.find(v => 
        v.name.toLowerCase().includes('google') || 
        v.name.toLowerCase().includes('natural') || 
        v.name.toLowerCase().includes('neural')
      );

      if (!selectedVoice) {
        const preferredNames = ['francisca', 'daniel', 'felipe', 'maria', 'heloisa', 'julio', 'yago', 'lucas'];
        selectedVoice = ptVoices.find(v => 
          preferredNames.some(name => v.name.toLowerCase().includes(name))
        );
      }

      if (!selectedVoice && ptVoices.length > 0) {
        selectedVoice = ptVoices.find(v => v.lang.includes('BR')) || ptVoices[0];
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = narrationRate;
      utterance.pitch = 1.05;

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          speechCharIndexRef.current = event.charIndex;
        }
      };

      utterance.onend = () => {
        setIsNarrating(false);
        setIsPaused(false);
        speechUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        console.error('SpeechSynthesis error:', e);
        setIsNarrating(false);
        setIsPaused(false);
        speechUtteranceRef.current = null;
      };

      try {
        window.speechSynthesis.speak(utterance);
        setIsNarrating(true);
        setIsPaused(false);
      } catch (err) {
        console.error('Error starting native TTS:', err);
        setIsNarrating(false);
        setIsPaused(false);
        speechUtteranceRef.current = null;
      }
    }
  };

  // Real-time speed adjustment
  useEffect(() => {
    // 1. Update HTML5 Audio playback rate (Fallback mode)
    if (audioObjRef.current) {
      try {
        audioObjRef.current.playbackRate = narrationRate;
      } catch (e) {
        console.error('Failed to change fallback audio rate:', e);
      }
    }

    // 2. Update Native TTS rate (Native mode)
    if (
      typeof window !== 'undefined' && 
      window.speechSynthesis && 
      window.speechSynthesis.speaking && 
      !window.speechSynthesis.paused &&
      speechTextRef.current
    ) {
      try {
        const remainingText = speechTextRef.current.substring(speechCharIndexRef.current);
        if (remainingText.trim().length > 0) {
          // Temporarily remove the onend listener to prevent it from resetting state on cancel
          if (speechUtteranceRef.current) {
            speechUtteranceRef.current.onend = null;
            speechUtteranceRef.current.onerror = null;
          }
          
          window.speechSynthesis.cancel();

          const utterance = new SpeechSynthesisUtterance(remainingText);
          speechUtteranceRef.current = utterance;
          utterance.lang = 'pt-BR';

          const nativeVoices = window.speechSynthesis.getVoices();
          const ptVoices = nativeVoices.filter(v => v.lang.startsWith('pt'));
          let selectedVoice = ptVoices.find(v => 
            v.name.toLowerCase().includes('google') || 
            v.name.toLowerCase().includes('natural') || 
            v.name.toLowerCase().includes('neural')
          );
          if (!selectedVoice) {
            const preferredNames = ['francisca', 'daniel', 'felipe', 'maria', 'heloisa', 'julio', 'yago', 'lucas'];
            selectedVoice = ptVoices.find(v => 
              preferredNames.some(name => v.name.toLowerCase().includes(name))
            );
          }
          if (!selectedVoice && ptVoices.length > 0) {
            selectedVoice = ptVoices.find(v => v.lang.includes('BR')) || ptVoices[0];
          }
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }

          utterance.rate = narrationRate;
          utterance.pitch = 1.05;

          const initialOffset = speechCharIndexRef.current;
          utterance.onboundary = (event) => {
            if (event.name === 'word') {
              speechCharIndexRef.current = initialOffset + event.charIndex;
            }
          };

          utterance.onend = () => {
            setIsNarrating(false);
            setIsPaused(false);
            speechUtteranceRef.current = null;
          };

          utterance.onerror = (e) => {
            console.error('SpeechSynthesis error on rate change:', e);
            setIsNarrating(false);
            setIsPaused(false);
            speechUtteranceRef.current = null;
          };

          window.speechSynthesis.speak(utterance);
        }
      } catch (err) {
        console.error('Error adjusting native TTS speed in real-time:', err);
      }
    }
  }, [narrationRate]);

  const handleStopNarration = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    if (audioObjRef.current) {
      try {
        audioObjRef.current.pause();
        audioObjRef.current = null;
      } catch (e) {}
    }
    setIsFallbackNarrating(false);
    setIsFallbackPaused(false);
    setIsNarrating(false);
    setIsPaused(false);
  };

  // Helper to split text by double newlines into nicely formatted and spaced paragraphs
  const renderParagraphs = (text: string, isFullscreenView = false) => {
    if (!text) {
      return <p className="text-sm text-slate-400 italic">Nenhum texto informativo escrito.</p>;
    }
    return text.split('\n\n').map((paragraph, index) => {
      if (!paragraph.trim()) return null;
      return (
        <p 
          key={index} 
          className={`${
            isFullscreenView 
              ? 'text-lg md:text-xl xl:text-2xl leading-relaxed text-slate-100 font-medium' 
              : 'text-sm md:text-base leading-relaxed text-slate-100 font-medium'
          } mb-5 last:mb-0`}
        >
          {paragraph.split('\n').map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
              {line}
              {lineIndex < paragraph.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    });
  };

  // Time and schedules
  const now = new Date();
  const currentMonthNum = now.getMonth() + 1;
  const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const currentDayName = daysOfWeek[now.getDay()];
  const isDDSDay = [1, 3, 5].includes(now.getDay()); // Mon, Wed, Fri

  // YouTube parser - includes params for Smart TV browser compatibility and privacy enhancement
  const getEmbedUrl = (url: any) => {
    if (typeof url !== 'string' || !url.trim()) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
      return `https://www.youtube-nocookie.com/embed/${match[2]}?autoplay=0&mute=0&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`;
    }
    if (url.includes('youtube.com/embed/') || url.includes('youtube-nocookie.com/embed/')) {
      // Convert to nocookie if not already
      return url.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/');
    }
    return null;
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('manequip_dds_themes_v4', JSON.stringify(themes));
  }, [themes]);

  useEffect(() => {
    localStorage.setItem('manequip_dds_history', JSON.stringify(history));
  }, [history]);

  const activeTheme = useMemo(() => {
    if (isManualOfficial) {
      return {
        id: 'manual',
        title: manualTitle,
        content: manualContent,
        reflection: manualReflection,
        category: manualCategory,
        imageUrl: manualImageUrl,
        videoUrl: manualVideoUrl,
      };
    }
    return themes.find(t => t.id === selectedThemeId) || themes[0];
  }, [selectedThemeId, themes, isManualOfficial, manualTitle, manualContent, manualReflection, manualCategory, manualImageUrl, manualVideoUrl]);

  // Suggested priority theme for the current month
  const currentMonthPriorityTheme = useMemo(() => {
    return themes.find(t => t.suggestedMonth === currentMonthNum) || themes[0];
  }, [themes, currentMonthNum]);

  const handleSaveThemeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTheme) return;
    setThemes(prev => prev.map(t => t.id === editingTheme.id ? editingTheme : t));
    setEditingTheme(null);
  };

  const handleAddNewTheme = () => {
    const newTheme: DDSTheme = {
      id: `theme-${Date.now()}`,
      title: 'Novo Diálogo de Segurança',
      category: 'Geral',
      content: 'Escreva o texto informativo do DDS aqui...',
      reflection: 'Pense sobre isso hoje.',
      suggestedMonth: currentMonthNum,
    };
    setThemes(prev => [...prev, newTheme]);
    setSelectedThemeId(newTheme.id);
    setEditingTheme(newTheme);
  };

  const handleDeleteTheme = (id: string) => {
    if (confirm('Deseja realmente excluir este tema do DDS?')) {
      const updated = themes.filter(t => t.id !== id);
      setThemes(updated);
      if (selectedThemeId === id && updated.length > 0) {
        setSelectedThemeId(updated[0].id);
      }
    }
  };

  const handleRecordHistory = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: DDSHistoryEntry = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      themeTitle: activeTheme.title,
      conductor: logConductor,
      participantsCount: Number(logParticipants),
      notes: logNotes,
    };
    setHistory(prev => [newLog, ...prev]);
    setIsLogModalOpen(false);
    setLogNotes('');
    alert('DDS registrado com sucesso no histórico!');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full relative p-6 bg-[#0b1329] select-none text-slate-200">
      
      {/* Presentation Mode Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-[#060a13] z-50 flex flex-col p-12 overflow-y-auto justify-between animate-fade-in text-white">
          <div className="absolute inset-0 bg-grid-pattern-dark opacity-10 pointer-events-none z-0"></div>
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/80 pb-6 gap-4 z-10">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <span className="material-symbols-outlined text-slate-950 text-[32px] font-bold animate-pulse">security</span>
              </div>
              <div>
                <span className="text-[11px] font-mono tracking-widest text-[#00d2ff] uppercase font-bold">Apresentação de Diálogo Diário de Segurança (DDS)</span>
                <h1 className="text-3xl font-black tracking-tight text-white mt-1">{activeTheme.title}</h1>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Voice Speed Slider in Fullscreen */}
                <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-2 shrink-0">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]" title="Velocidade da voz">speed</span>
                  <input 
                    type="range" 
                    min="0.8" 
                    max="2.0" 
                    step="0.1" 
                    value={narrationRate} 
                    onChange={(e) => setNarrationRate(parseFloat(e.target.value))} 
                    className="w-16 md:w-20 accent-cyan-400 h-1 rounded-lg cursor-pointer bg-slate-800" 
                  />
                  <span className="text-xs font-mono font-bold text-slate-400 w-8">{narrationRate.toFixed(1)}x</span>
                </div>

                <button 
                  onClick={handleNarrate}
                  className={`px-5 py-2.5 rounded-xl border font-bold transition-all flex items-center gap-2 active:scale-95 shadow-lg cursor-pointer ${
                    isNarrating 
                      ? 'bg-amber-500/10 border-amber-500/35 text-amber-400 hover:bg-amber-500/20' 
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] animate-pulse">
                    {isNarrating && !isPaused ? 'pause_circle' : 'volume_up'}
                  </span>
                  {isNarrating ? (isPaused ? 'Retomar' : 'Pausar') : 'Narra'}
                </button>
                {isNarrating && (
                  <button 
                    onClick={handleStopNarration}
                    className="px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-lg cursor-pointer"
                    title="Parar Narração"
                  >
                    <span className="material-symbols-outlined text-[20px]">stop</span>Parar
                  </button>
                )}
                <button 
                  onClick={() => setIsFullscreen(false)} 
                  className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-bold transition-all flex items-center gap-2 active:scale-95 shadow-lg cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">fullscreen_exit</span>Sair da Tela Cheia
                </button>
              </div>
              {showTtsWarning && (
                <span className="text-[10px] text-amber-450 font-bold flex items-center gap-1 bg-amber-500/5 px-2.5 py-0.5 rounded-md border border-amber-500/15 max-w-xs text-right">
                  <span className="material-symbols-outlined text-[12px] text-amber-400 shrink-0 animate-pulse">info</span>
                  Sem suporte a áudio TTS nesta TV; use o vídeo ou espelhe do celular.
                </span>
              )}
            </div>
          </div>

          {/* Presentation Content */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 my-8 items-center min-h-0 z-10">
            
            {/* Text side */}
            <div className="lg:col-span-7 flex flex-col gap-6 justify-center h-full min-h-0">
              <div className="p-1 text-xs font-mono uppercase tracking-widest text-amber-450 font-bold flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-500 animate-ping"></span>
                Tema: {activeTheme.category}
              </div>
              <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-700/80 bg-slate-950/30 p-8 border border-slate-800/50 rounded-2xl">
                {renderParagraphs(activeTheme.content, true)}
              </div>
              {activeTheme.reflection && (
                <div className="p-6 border border-amber-500/20 bg-amber-500/5 rounded-2xl relative overflow-hidden shrink-0 shadow-lg shadow-amber-500/5 border-l-8 border-l-amber-500">
                  <span className="absolute -top-3 -right-3 text-7xl text-amber-500/10 font-serif select-none pointer-events-none">“</span>
                  <div className="text-[10px] uppercase font-mono font-bold text-amber-400 tracking-wider mb-1">Frase para Reflexão</div>
                  <p className="text-lg font-bold text-slate-100 italic leading-snug">
                    "{activeTheme.reflection}"
                  </p>
                </div>
              )}
            </div>

            {/* Media side */}
            <div className="lg:col-span-5 flex flex-col justify-center h-full max-h-[70vh]">
              {activeTheme.videoUrl ? (
                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-800/60 shadow-2xl bg-slate-950 flex items-center justify-center">
                  {getEmbedUrl(activeTheme.videoUrl) ? (
                    <iframe 
                      src={getEmbedUrl(activeTheme.videoUrl)!} 
                      title={activeTheme.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  ) : (
                    <video src={activeTheme.videoUrl} controls className="w-full h-full object-contain" />
                  )}
                </div>
              ) : (
                <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-800/60 shadow-2xl bg-slate-950 relative group">
                  <img src={getThemeImage(activeTheme)} alt={activeTheme.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="border-t border-slate-800/80 pt-6 flex items-center justify-between z-10 text-xs text-slate-400">
            <div>Fábrica de Manequip • Diálogo de Conscientização de Equipe</div>
            <div>{new Date().toLocaleDateString('pt-BR')} • {currentDayName}</div>
          </div>
        </div>
      )}

      {/* Normal View */}
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#1e293b]/70 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-gradient-to-br from-[#00d2ff] to-[#0ea5e9] flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="material-symbols-outlined text-white text-[24px]">security</span>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Diálogo Diário de Segurança (DDS)</h2>
            <p className="text-xs text-slate-400 mt-0.5">Rotina de prevenção, saúde e segurança do trabalho</p>
          </div>
        </div>
        
        {/* Day check banner */}
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 border rounded-xl flex items-center gap-2 text-xs font-bold ${isDDSDay ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
            <span className={`size-2 rounded-full ${isDDSDay ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`}></span>
            DDS Programado: {currentDayName} {isDDSDay ? '(Hoje é dia oficial!)' : ''}
          </div>
          <button 
            onClick={() => setIsFullscreen(true)}
            className="px-4 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-md shadow-[#0ea5e9]/20"
          >
            <span className="material-symbols-outlined text-[18px]">fullscreen</span>Apresentar
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-6 border-b border-slate-800/60 pb-1 mb-5 shrink-0 mt-2">
        <button 
          onClick={() => setActiveTab('active')} 
          className={`pb-2.5 text-xs.5 font-bold transition-all relative cursor-pointer ${activeTab === 'active' ? 'text-cyan-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            DDS Ativo
          </span>
          {activeTab === 'active' && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-cyan-400 rounded-full animate-fade-in"></span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('calendar')} 
          className={`pb-2.5 text-xs.5 font-bold transition-all relative cursor-pointer ${activeTab === 'calendar' ? 'text-cyan-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
            Cronograma Anual (52 Semanas)
          </span>
          {activeTab === 'calendar' && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-cyan-400 rounded-full animate-fade-in"></span>
          )}
        </button>
      </div>

      {activeTab === 'active' ? (
        /* Main Grid */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 min-h-0 overflow-hidden">
        
        {/* Left Column: Editor and Detail */}
        <div className="lg:col-span-8 flex flex-col gap-5 min-h-0 overflow-y-auto pr-1">
          
          {/* Settings / Mode Selector */}
          <div className="p-5 border rounded-2xl bg-[#161f30]/85 border-[#28354c]/70 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-lg">
            <div>
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-cyan-400 block mb-1">Fonte de Assunto</span>
              <h3 className="text-sm font-bold text-white">Selecione o modo de definição de conteúdo</h3>
            </div>
            <div className="flex border border-slate-800 bg-slate-950 p-1.5 rounded-xl shrink-0">
              <button 
                onClick={() => setIsManualOfficial(false)} 
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!isManualOfficial ? 'bg-slate-900 border border-slate-800/60 text-cyan-400 shadow-sm shadow-[#00d2ff]/10' : 'text-slate-400 hover:text-white'}`}
              >
                Temas Sugeridos / Banco
              </button>
              <button 
                onClick={() => setIsManualOfficial(true)} 
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isManualOfficial ? 'bg-slate-900 border border-slate-800/60 text-cyan-400 shadow-sm shadow-[#00d2ff]/10' : 'text-slate-400 hover:text-white'}`}
              >
                Tema Oficial (Manual)
              </button>
            </div>
          </div>

          {/* Active Manual Input fields (if Official Manual Mode is selected) */}
          {isManualOfficial ? (
            <div className="p-5 border rounded-2xl bg-[#161f30]/85 border-[#28354c]/70 flex flex-col gap-4 shrink-0 shadow-lg animate-fade-in">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <span className="material-symbols-outlined text-amber-500">edit_note</span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 font-mono">Inserir Dados do DDS Oficial</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-7">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Título do DDS</label>
                  <input 
                    type="text" 
                    value={manualTitle} 
                    onChange={e => setManualTitle(e.target.value)} 
                    placeholder="Ex: Trabalho em Altura e Ancoragem"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 bg-slate-950 border-slate-800 text-slate-200 text-xs" 
                  />
                </div>
                <div className="md:col-span-5">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Categoria / Setor</label>
                  <input 
                    type="text" 
                    value={manualCategory} 
                    onChange={e => setManualCategory(e.target.value)} 
                    placeholder="Ex: Riscos Críticos"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 bg-slate-950 border-slate-800 text-slate-200 text-xs" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Conteúdo Informativo</label>
                <textarea 
                  rows={4} 
                  value={manualContent} 
                  onChange={e => setManualContent(e.target.value)} 
                  placeholder="Escreva detalhadamente o assunto a ser discutido..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 bg-slate-950 border-slate-800 text-slate-200 text-xs resize-none" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Ponto para Reflexão (Opcional)</label>
                <input 
                  type="text" 
                  value={manualReflection} 
                  onChange={e => setManualReflection(e.target.value)} 
                  placeholder="Ex: Uma vida perdida nunca será reposta. Respeite as travas."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 bg-slate-950 border-slate-800 text-slate-200 text-xs" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">URL da Imagem Anexa</label>
                  <input 
                    type="text" 
                    value={manualImageUrl} 
                    onChange={e => setManualImageUrl(e.target.value)} 
                    placeholder="Link de imagem..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 bg-slate-950 border-slate-800 text-slate-200 text-xs" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">URL do Vídeo Anexo (YouTube ou MP4)</label>
                  <input 
                    type="text" 
                    value={manualVideoUrl} 
                    onChange={e => setManualVideoUrl(e.target.value)} 
                    placeholder="Link de vídeo..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 bg-slate-950 border-slate-800 text-slate-200 text-xs" 
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Theme preview box */}
          <div className="flex-1 p-6 border rounded-2xl bg-[#161f30]/85 border-[#28354c]/70 flex flex-col justify-between gap-6 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* Text detail */}
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                    {activeTheme.category}
                  </span>
                  {!isManualOfficial && activeTheme.suggestedMonth && (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      Recomendado em: {monthNames[activeTheme.suggestedMonth - 1]}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-black tracking-tight text-white leading-tight">{activeTheme.title}</h3>
                
                {/* Scrollable text container */}
                <div className="max-h-[280px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 bg-slate-950/20 p-5 border border-slate-800/50 rounded-xl">
                  {renderParagraphs(activeTheme.content, false)}
                </div>

                {activeTheme.reflection && (
                  <div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl border-l-4 border-l-amber-500 relative overflow-hidden">
                    <span className="absolute -top-1 -right-2 text-4xl text-amber-500/10 font-serif select-none">“</span>
                    <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block mb-0.5">Reflexão do Diálogo</span>
                    <p className="text-xs font-semibold text-slate-200 italic leading-snug">"{activeTheme.reflection}"</p>
                  </div>
                )}
              </div>

              {/* Media preview (Right side of details box) */}
              <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mídia Anexada</span>
                {activeTheme.videoUrl ? (
                  <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-800 shadow-md bg-slate-950 flex items-center justify-center">
                    {getEmbedUrl(activeTheme.videoUrl) ? (
                      <iframe 
                        src={getEmbedUrl(activeTheme.videoUrl)!} 
                        title={activeTheme.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    ) : (
                      <video src={activeTheme.videoUrl} controls className="w-full h-full object-contain" />
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-800/80 shadow-md bg-slate-950">
                    <img src={getThemeImage(activeTheme)} alt={activeTheme.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="flex flex-col gap-2.5">
                  <div className="flex gap-2">
                    <button 
                      onClick={handleNarrate}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm cursor-pointer ${
                        isNarrating 
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-450 border-amber-500/25' 
                          : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/25'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isNarrating && !isPaused ? 'pause' : 'volume_up'}
                      </span>
                      {isNarrating ? (isPaused ? 'Retomar' : 'Pausar') : 'Narra'}
                    </button>
                    {isNarrating && (
                      <button 
                        onClick={handleStopNarration}
                        className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition-all flex items-center justify-center active:scale-95 shadow-sm cursor-pointer"
                        title="Parar Narração"
                      >
                        <span className="material-symbols-outlined text-[16px]">stop</span>
                      </button>
                    )}
                  </div>

                  {/* Voice Speed Slider in Normal view */}
                  <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/80 rounded-xl px-3 py-2 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
                      <span className="material-symbols-outlined text-[14px] text-cyan-400">speed</span>Velocidade
                    </span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="range" 
                        min="0.8" 
                        max="2.0" 
                        step="0.1" 
                        value={narrationRate} 
                        onChange={(e) => setNarrationRate(parseFloat(e.target.value))} 
                        className="w-16 accent-cyan-400 h-1 rounded-lg cursor-pointer bg-slate-800" 
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-350 w-8 text-right">{narrationRate.toFixed(1)}x</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsFullscreen(true)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold border border-slate-700/60 text-slate-200 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">fullscreen</span>Tela Cheia
                    </button>
                    <button 
                      onClick={() => setIsLogModalOpen(true)}
                      className="flex-1 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">how_to_reg</span>Marcar Realizado
                    </button>
                  </div>
                  {showTtsWarning && (
                    <div className="mt-1 p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[10px] text-amber-300 leading-normal flex items-start gap-1.5 shadow-sm">
                      <span className="material-symbols-outlined text-[14px] text-amber-400 shrink-0">info</span>
                      <span>
                        <strong>Aviso TV/Navegador:</strong> Sintetizador de voz indisponível ou sem suporte. Em Smart TVs, transmita a tela do celular/computador ou assista ao vídeo acima.
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Suggested list & History */}
        <div className="lg:col-span-4 flex flex-col gap-5 min-h-0">
          
          {/* Monthly Priority Banner */}
          <div className="p-4.5 border rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#161f30]/85 to-transparent border-amber-500/20 shadow-md relative overflow-hidden shrink-0">
            <span className="absolute -right-6 -bottom-6 text-7xl text-amber-500/5 font-mono select-none">0{currentMonthNum}</span>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/15 border border-amber-500/35 text-amber-400 px-2 py-0.5 rounded">Programação do Mês</span>
              <span className="text-slate-400 text-[10px] font-bold font-mono uppercase">{monthNames[currentMonthNum - 1]}</span>
            </div>
            <h4 className="text-xs.5 font-extrabold text-white leading-tight mb-1">
              Foco do Mês: <span className="text-amber-450">{suggestedMonthsSchedule[currentMonthNum] || 'Segurança Industrial'}</span>
            </h4>
            <div className="text-[10px] text-slate-400 leading-normal mb-3 flex items-start gap-1">
              <span className="material-symbols-outlined text-[12px] text-slate-500 mt-0.5">priority_high</span>
              <span>Recomenda-se tratar os temas deste foco ao longo do mês nas reuniões.</span>
            </div>
            {!isManualOfficial && currentMonthPriorityTheme && (
              <button 
                onClick={() => { setSelectedThemeId(currentMonthPriorityTheme.id); setIsManualOfficial(false); }}
                className="w-full py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold transition-all"
              >
                Carregar Tema Recomendado
              </button>
            )}
          </div>

          {/* List of themes library */}
          <div className="p-4 border rounded-2xl bg-[#161f30]/85 border-[#28354c]/70 flex flex-col min-h-0 flex-1 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3 shrink-0 gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 min-w-0 flex-1">
                <span className="material-symbols-outlined text-[16px] text-cyan-400 shrink-0">library_books</span>
                <span className="truncate">Biblioteca de Temas</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {hiddenThemes.length > 0 && (
                  <button 
                    onClick={() => setHiddenThemes([])}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white text-[9px] rounded-lg border border-slate-700 transition-all font-bold cursor-pointer"
                    title="Restaurar todos os temas ocultados"
                  >
                    Restaurar Ocultos
                  </button>
                )}
                <button 
                  onClick={handleAddNewTheme}
                  className="size-7 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-[#00d2ff] border border-cyan-500/25 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  title="Adicionar Novo Tema"
                >
                  <span className="material-symbols-outlined text-[16px] font-bold">add</span>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0 scrollbar-thin scrollbar-thumb-slate-800">
              {themes
                .filter(t => !hiddenThemes.includes(t.id))
                .map((t) => {
                  const isSelected = selectedThemeId === t.id && !isManualOfficial;
                  const sched = getThemeSchedule(t.id);
                  const displayMonth = sched ? sched.month : t.suggestedMonth;
                  return (
                    <div 
                      key={t.id}
                      onClick={() => { setSelectedThemeId(t.id); setIsManualOfficial(false); }}
                      className={`p-3 border rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.01] flex items-center justify-between gap-3 ${isSelected ? 'bg-gradient-to-r from-cyan-500/10 to-transparent border-cyan-500/35 hover:border-cyan-450/50 shadow-md shadow-cyan-500/5' : 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-900/60'}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-450 border border-slate-700/50">
                            {t.category}
                          </span>
                          {displayMonth && (
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${displayMonth === currentMonthNum ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-500'}`}>
                              Mês: {displayMonth}
                            </span>
                          )}
                        </div>
                        <h5 className={`text-xs font-extrabold truncate ${isSelected ? 'text-cyan-450 font-black' : 'text-slate-200'}`}>
                          {t.title}
                        </h5>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setHiddenThemes(prev => [...prev, t.id]); }}
                          className="size-6 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                          title="Ocultar de visualização na Biblioteca"
                        >
                          <span className="material-symbols-outlined text-[13px]">visibility_off</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* History log library */}
          <div className="p-4 border rounded-2xl bg-[#161f30]/85 border-[#28354c]/70 flex flex-col min-h-0 flex-1 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3 shrink-0">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-400">history</span>Histórico de Realizados
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-505">{history.length} reuniões</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0 scrollbar-thin scrollbar-thumb-slate-800">
              {history.length > 0 ? (
                <div className="relative pl-4 border-l border-slate-800">
                  {history.map((log) => (
                    <div key={log.id} className="relative pb-4 last:pb-0 group">
                      {/* dot */}
                      <span className="absolute -left-[20px] top-1 text-[10px] animate-pulse">✅</span>
                      <div className="pl-0.5">
                        <span className="text-[9px] font-mono text-slate-505 block mb-0.5">{new Date(log.date).toLocaleDateString('pt-BR')}</span>
                        <h6 className="font-extrabold text-xs text-white leading-tight">{log.themeTitle}</h6>
                        <div className="flex justify-between items-center text-[9.5px] text-slate-450 font-medium mt-1">
                          <span>Condutor: <strong className="text-slate-300 font-bold">{log.conductor}</strong></span>
                          <span className="bg-slate-800/60 border border-slate-700/30 px-2 py-0.5 rounded-md font-mono text-slate-400">
                            {log.participantsCount} part.
                          </span>
                        </div>
                        {log.notes && <p className="text-[9.5px] text-slate-505 italic mt-1 pl-1.5 border-l border-slate-800">"{log.notes}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-xs text-slate-550 font-mono flex flex-col items-center justify-center h-full gap-2">
                  <span className="material-symbols-outlined text-slate-655 text-3xl">assignment_turned_in</span>
                  <span>Nenhum DDS registrado neste período.</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
      ) : (
        /* Cronograma Anual Grid */
        <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-hidden animate-fade-in">
          
          {/* Month Selector Tabs - Top row */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 shrink-0">
            {Array.from({ length: 12 }).map((_, idx) => {
              const monthNum = idx + 1;
              const isSelected = selectedMonth === monthNum;
              const isCurrent = currentMonthNum === monthNum;
              return (
                <button
                  key={monthNum}
                  type="button"
                  onClick={() => setSelectedMonth(monthNum)}
                  className={`py-2 px-1 rounded-xl border text-center transition-all duration-300 flex flex-col items-center justify-center gap-0.5 cursor-pointer relative ${
                    isSelected 
                      ? 'bg-gradient-to-b from-cyan-500/15 to-cyan-500/5 border-cyan-500/50 text-white shadow-md shadow-cyan-500/10' 
                      : 'bg-slate-900/30 border-slate-800/80 hover:bg-slate-900/60 text-slate-350 hover:text-white'
                  }`}
                >
                  <span className="text-[8px] font-mono font-bold text-slate-500">Mês {monthNum}</span>
                  <span className="text-[11px] font-extrabold leading-none">{monthNames[idx]}</span>
                  {isCurrent && (
                    <span className="absolute top-1 right-1 size-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" title="Mês Atual"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Panel: The Weeks Grid for the selected month */}
          <div className="flex-1 border rounded-2xl bg-[#161f30]/85 border-[#28354c]/70 p-5 flex flex-col min-h-0 overflow-hidden shadow-xl">
            <div className="border-b border-slate-800/80 pb-3 mb-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-cyan-400">
                  Programação Semanal • {monthNames[selectedMonth - 1]}
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  Foco do Mês: <span className="text-amber-450">{suggestedMonthsSchedule[selectedMonth]}</span>
                </h3>
              </div>
              <div className="text-slate-400 text-[10px] font-bold font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/50">
                12 OPÇÕES DE TEMAS • 4 SEMANAS
              </div>
            </div>

            {/* Responsive grid displaying all 4 weeks side-by-side (12 themes) */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-y-auto pr-1 min-h-0 scrollbar-thin scrollbar-thumb-slate-800">
              {[1, 2, 3, 4].map((weekNum) => {
                const scheduledIds = weeklySchedule[selectedMonth]?.[weekNum] || [];
                const weekThemes = scheduledIds.map(id => themes.find(t => t.id === id)).filter(Boolean) as DDSTheme[];

                let specialCampaignTag = null;
                if (selectedMonth === 3 && weekNum === 3) {
                  specialCampaignTag = "Dia da Água";
                } else if (selectedMonth === 4 && weekNum === 4) {
                  specialCampaignTag = "Abril Verde";
                } else if (selectedMonth === 6 && weekNum === 3) {
                  specialCampaignTag = "Inverno";
                }

                return (
                  <div key={weekNum} className="border border-[#28354c]/50 bg-[#161f30]/20 p-4 rounded-xl flex flex-col gap-3.5">
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="size-5 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px] font-mono font-black">
                          S{weekNum}
                        </span>
                        <h4 className="text-xs.5 font-extrabold text-white">Semana {weekNum}</h4>
                      </div>
                      {specialCampaignTag && (
                        <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/35 text-amber-400 rounded text-[7.5px] font-black uppercase tracking-wider animate-pulse flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[9px]">celebration</span>
                          {specialCampaignTag}
                        </span>
                      )}
                    </div>

                    {/* The 3 themes for this week */}
                    <div className="flex flex-col gap-3 min-h-0 flex-1 justify-between">
                      {weekThemes.map((theme, idx) => {
                        const weekdayLabel = idx === 0 ? 'Segunda' : idx === 1 ? 'Quarta' : 'Sexta';
                        const weekdayColor = 
                          idx === 0 ? 'border-l-[#0ea5e9]' : 
                          idx === 1 ? 'border-l-[#00d2ff]' : 
                          'border-l-[#10b981]';
                        
                        return (
                          <div 
                            key={theme.id}
                            className={`p-3 border border-slate-800/80 bg-[#0c1220]/75 hover:bg-slate-900/60 rounded-xl transition-all duration-300 hover:scale-[1.02] border-l-4 ${weekdayColor} flex flex-col justify-between gap-2.5 shadow-sm hover:shadow-md`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[7.5px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-slate-800 text-slate-455 border border-slate-700/50">
                                  {theme.category}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[8px] font-bold text-slate-400 mr-1">{weekdayLabel}</span>
                                  <button 
                                    type="button" 
                                    onClick={(e) => { e.stopPropagation(); setEditingTheme(theme); }}
                                    className="size-5 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center text-slate-450 hover:text-white transition-all cursor-pointer"
                                    title="Editar Tema"
                                  >
                                    <span className="material-symbols-outlined text-[10px]">edit</span>
                                  </button>
                                  {themes.length > 1 && (
                                    <button 
                                      type="button" 
                                      onClick={(e) => { e.stopPropagation(); handleDeleteTheme(theme.id); }}
                                      className="size-5 rounded bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 flex items-center justify-center text-rose-450 hover:text-white transition-all cursor-pointer"
                                      title="Excluir Tema permanentemente"
                                    >
                                      <span className="material-symbols-outlined text-[10px]">delete</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                              <h5 className="text-[11px] font-extrabold text-white line-clamp-2 leading-snug">
                                {theme.title}
                              </h5>
                            </div>

                            <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-800/50 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedThemeId(theme.id);
                                  setIsManualOfficial(false);
                                  setActiveTab('active');
                                }}
                                className="flex-1 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[9px] font-bold border border-cyan-500/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                title="Carregar para visualização principal"
                              >
                                <span className="material-symbols-outlined text-[10px]">visibility</span>
                                Carregar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedThemeId(theme.id);
                                  setIsManualOfficial(false);
                                  setIsFullscreen(true);
                                }}
                                className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-white text-[9px] font-bold border border-slate-700/60 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                title="Iniciar apresentação em tela cheia"
                              >
                                <span className="material-symbols-outlined text-[10px]">play_arrow</span>
                                Apresentar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Record History / Participants Register Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0f172a] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-450 text-2xl animate-pulse">how_to_reg</span>
                <div>
                  <h3 className="text-sm.5 font-black tracking-tight text-white">Registrar Reunião DDS</h3>
                  <p className="text-[10px] text-slate-450">Marque o DDS de hoje como realizado na fábrica</p>
                </div>
              </div>
              <button 
                onClick={() => setIsLogModalOpen(false)} 
                className="size-8 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-all hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleRecordHistory} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-950/40 p-3.5 border border-[#28354c]/50 rounded-xl">
                <span className="text-[9px] font-bold text-slate-500 block mb-0.5">DDS Selecionado</span>
                <strong className="text-xs.5 text-white block leading-tight font-extrabold">{activeTheme.title}</strong>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-455 block mb-1">Condutor do Diálogo</label>
                <input 
                  type="text" 
                  required
                  value={logConductor} 
                  onChange={e => setLogConductor(e.target.value)} 
                  placeholder="Nome do líder / supervisor"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 bg-slate-900 border-slate-800 text-slate-200" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 block mb-1">Número de Participantes</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  max="100"
                  value={logParticipants} 
                  onChange={e => setLogParticipants(Number(e.target.value))} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 bg-slate-900 border-slate-800 text-slate-200 text-center text-xs" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 block mb-1">Anotações / Observações (Opcional)</label>
                <textarea 
                  rows={3} 
                  value={logNotes} 
                  onChange={e => setLogNotes(e.target.value)} 
                  placeholder="Sugestões de melhorias de segurança recebidas dos colaboradores ou observações gerais..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 bg-slate-905 border-slate-800 text-slate-200 resize-none text-xs" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/60">
                <button 
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-350 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-bold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-bold flex items-center gap-1 shadow-md shadow-emerald-500/10"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editing Theme Modal */}
      {editingTheme && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0f172a] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-cyan-400 text-2xl">edit_note</span>
                <div>
                  <h3 className="text-sm.5 font-black tracking-tight text-white">Editar Tema de DDS</h3>
                  <p className="text-[10px] text-slate-450">Modifique o título, conteúdo e as mídias deste tema</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingTheme(null)} 
                className="size-8 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-all hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            {/* Body */}
            <form onSubmit={handleSaveThemeEdit} className="p-5 space-y-4 text-xs overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">Título do DDS</label>
                  <input 
                    type="text" 
                    required
                    value={editingTheme.title} 
                    onChange={e => setEditingTheme({ ...editingTheme, title: e.target.value })} 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 bg-slate-900 border-slate-800 text-slate-200" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">Categoria</label>
                  <input 
                    type="text" 
                    required
                    value={editingTheme.category} 
                    onChange={e => setEditingTheme({ ...editingTheme, category: e.target.value })} 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 bg-slate-900 border-slate-800 text-slate-200" 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-455 block mb-1">Conteúdo Informativo</label>
                <textarea 
                  rows={5} 
                  required
                  value={editingTheme.content} 
                  onChange={e => setEditingTheme({ ...editingTheme, content: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 bg-slate-900 border-slate-800 text-slate-200 resize-none text-[11.5px]" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 block mb-1">Ponto para Reflexão</label>
                <input 
                  type="text" 
                  required
                  value={editingTheme.reflection} 
                  onChange={e => setEditingTheme({ ...editingTheme, reflection: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 bg-slate-900 border-slate-800 text-slate-200" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">Mês Sugerido (1-12, opcional)</label>
                  <input 
                    type="number" 
                    min="1"
                    max="12"
                    value={editingTheme.suggestedMonth || ''} 
                    onChange={e => setEditingTheme({ ...editingTheme, suggestedMonth: e.target.value ? Number(e.target.value) : undefined })} 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 bg-slate-900 border-slate-800 text-slate-200 text-center" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">Imagem URL (opcional)</label>
                  <input 
                    type="text" 
                    value={editingTheme.imageUrl || ''} 
                    onChange={e => setEditingTheme({ ...editingTheme, imageUrl: e.target.value })} 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 bg-slate-900 border-slate-800 text-slate-200" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 block mb-1">Vídeo URL (opcional)</label>
                <input 
                  type="text" 
                  value={editingTheme.videoUrl || ''} 
                  onChange={e => setEditingTheme({ ...editingTheme, videoUrl: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500/50 bg-slate-900 border-slate-800 text-slate-200" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/60">
                <button 
                  type="button"
                  onClick={() => setEditingTheme(null)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-350 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-bold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-[#0284c7] text-white rounded-xl transition-all font-bold flex items-center gap-1 shadow-md shadow-cyan-500/10"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default DDS;
