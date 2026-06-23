import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

interface TargetColumn {
  name: string;
  type: string;
  description: string;
}

interface MappingSuggestion {
  coluna_original: string;
  coluna_mapeada: string | null;
  confianca: number;
  justificativa: string;
}

interface AppliedStep {
  id: string;
  name: string;
  type: 'source' | 'remove_column' | 'change_type' | 'replace_value' | 'custom_js_transform' | 'quick_transform';
  code?: string;
  params?: Record<string, any>;
}

interface SheetState {
  sheetName: string;
  originalHeaders: string[];
  originalRows: string[][];
  appliedSteps: AppliedStep[];
  mappings: Record<string, string>; // coluna_original -> coluna_mapeada
  activeColumns: Record<string, boolean>; // coluna_original -> active
}

interface QueryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSheetsData: Record<string, { headers: string[]; rows: string[][] }>;
  targetColumns: TargetColumn[];
  importCategory: 'EAP' | 'Materiais' | 'Suprimentos' | 'Fornecedores';
  setImportCategory: (cat: 'EAP' | 'Materiais' | 'Suprimentos' | 'Fornecedores') => void;
  onImportComplete: (finalData: any[], sheetName: string) => void;
  projects: { id: string; name: string }[];
  importDestinationProjId: string;
  setImportDestinationProjId: (id: string) => void;
}

const parseFormattedNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  
  let str = String(val).trim();
  
  // Remove currency symbol and spaces
  str = str.replace(/R\$\s?/, '').replace(/\s/g, '');
  
  const hasComma = str.includes(',');
  const hasDot = str.includes('.');
  
  if (hasComma && hasDot) {
    const commaIndex = str.indexOf(',');
    const dotIndex = str.indexOf('.');
    if (commaIndex > dotIndex) {
      // Brazilian format: 1.234,56
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56
      str = str.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Only comma: could be 12,5 or 1,234 (thousands)
    const parts = str.split(',');
    if (parts[1] && parts[1].length <= 2) {
      str = str.replace(',', '.');
    } else {
      str = str.replace(',', '');
    }
  }
  
  str = str.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
};

export const QueryEditorModal: React.FC<QueryEditorModalProps> = ({
  isOpen,
  onClose,
  initialSheetsData,
  targetColumns,
  importCategory,
  setImportCategory,
  onImportComplete,
  projects,
  importDestinationProjId,
  setImportDestinationProjId
}) => {
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [sheetsState, setSheetsState] = useState<Record<string, SheetState>>({});
  const [iaPrompt, setIaPrompt] = useState('');
  const [processingIA, setProcessingIA] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, MappingSuggestion>>({});
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number>(100);

  // Estados para o Passo a Passo Explicativo (Tour Onboarding)
  const [showTour, setShowTour] = useState(() => {
    try {
      const saved = localStorage.getItem('manequip_query_editor_tour_finished');
      return saved !== 'true';
    } catch {
      return true;
    }
  });
  const [currentTourStep, setCurrentTourStep] = useState(0);

  const finishTour = () => {
    setShowTour(false);
    try {
      localStorage.setItem('manequip_query_editor_tour_finished', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  const tourSteps = [
    {
      title: "Passo 1 de 4: Selecao e Navegacao de Abas 📂",
      description: "Carregou um arquivo com multiplas abas? Use a barra superior roxa para alternar entre as abas. Cada aba possui seu proprio conjunto de dados, mapeamentos e transformacoes. O numero de registros e exibido ao lado de cada aba.",
      tip: "Dica: Voce pode tratar e importar cada aba individualmente!"
    },
    {
      title: "Passo 2 de 4: Selecionar e Mapear Colunas 🎯",
      description: "Ative as colunas que deseja importar marcando as caixas de selecao no cabecalho da tabela. Depois, faca a associacao: use as Sugestoes de IA do painel direito (basta clicar em 'Aceitar') ou associe manualmente usando o menu de selecao do painel lateral.",
      tip: "Apenas colunas mapeadas e marcadas com ✔️ serao importadas para o banco de dados."
    },
    {
      title: "Passo 3 de 4: IA Co-pilot & Acoes de Coluna ⚡",
      description: "Limpe e formate dados facilmente! Digite uma instrucao no Co-pilot de IA (ex: 'deixe em maiusculo a coluna Nome' ou 'remova espacos') e clique em 'Transformar'. Voce tambem pode selecionar uma coluna na tabela para aplicar acoes rapidas no rodape lateral.",
      tip: "Dica: De um duplo clique em qualquer celula da tabela para editar o texto manualmente!"
    },
    {
      title: "Passo 4 de 4: Historico (Steps) & Importacao Final 🚀",
      description: "Todas as alteracoes que voce fizer (remover colunas, IA, edicoes) aparecem na lista de 'Etapas Aplicadas'. Se errar, basta clicar em 'Desfazer'. Quando terminar, clique no botao roxo 'Importar Aba' no canto inferior direito para consolidar os dados.",
      tip: "Tudo pronto? Vamos la!"
    }
  ];
  
  const suggestionsCache = useRef<Record<string, Record<string, MappingSuggestion>>>({});

  // Inicializar o estado das abas quando o modal e aberto ou os dados iniciais mudam
  useEffect(() => {
    if (isOpen && Object.keys(initialSheetsData).length > 0) {
      const state: Record<string, SheetState> = {};
      Object.entries(initialSheetsData).forEach(([name, dataValue]) => {
        const data = dataValue as { headers: string[]; rows: string[][] };
        const activeCols: Record<string, boolean> = {};
        data.headers.forEach(h => {
          activeCols[h] = true;
        });

        state[name] = {
          sheetName: name,
          originalHeaders: data.headers,
          originalRows: data.rows,
          appliedSteps: [{ id: 'src', name: 'Fonte de Dados Importada', type: 'source' }],
          mappings: {},
          activeColumns: activeCols
        };
      });
      setSheetsState(state);
      const firstSheet = Object.keys(initialSheetsData)[0];
      setActiveSheet(firstSheet);
      setCurrentPage(0);
      setSearchTerm('');
      setSuggestions({});
    }
  }, [isOpen, initialSheetsData]);

  const currentSheet = sheetsState[activeSheet];

  // Executa o mapeamento de cabecalhos via IA para a aba ativa
  useEffect(() => {
    if (isOpen && activeSheet && currentSheet) {
      fetchSemanticMappings();
    }
  }, [isOpen, activeSheet, importCategory]);

  const fetchSemanticMappings = async () => {
    if (!currentSheet) return;
    
    // Clear mappings that are not valid for the new target columns to prevent stale data
    const validTargetFieldNames = targetColumns.map(tc => tc.name);
    const cleanedMappings: Record<string, string> = {};
    Object.entries(currentSheet.mappings).forEach(([originalCol, mappedField]) => {
      const fieldStr = mappedField as string;
      if (validTargetFieldNames.includes(fieldStr)) {
        cleanedMappings[originalCol] = fieldStr;
      }
    });

    const cacheKey = `${activeSheet}_${importCategory}`;
    if (suggestionsCache.current[cacheKey]) {
      setSuggestions(suggestionsCache.current[cacheKey]);
      const cached = suggestionsCache.current[cacheKey];
      const newMappings = { ...cleanedMappings };
      Object.entries(cached).forEach(([originalCol, sugValue]) => {
        const sug = sugValue as MappingSuggestion;
        if (sug.coluna_mapeada && sug.confianca >= 0.75 && !newMappings[originalCol]) {
          newMappings[originalCol] = sug.coluna_mapeada;
        }
      });
      updateSheetState({ mappings: newMappings });
      return;
    }

    setLoadingSuggestions(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/map-headers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          sourceHeaders: currentSheet.originalHeaders,
          targetColumns: targetColumns
        })
      });
      
      const data = await response.json();
      const newSuggestions: Record<string, MappingSuggestion> = {};
      const newMappings = { ...cleanedMappings };

      if (data.mapeamentos && Array.isArray(data.mapeamentos)) {
        data.mapeamentos.forEach((m: MappingSuggestion) => {
          newSuggestions[m.coluna_original] = m;
          if (m.coluna_mapeada && m.confianca >= 0.75 && !newMappings[m.coluna_original]) {
            newMappings[m.coluna_original] = m.coluna_mapeada;
          }
        });
      }

      suggestionsCache.current[cacheKey] = newSuggestions;
      setSuggestions(newSuggestions);
      updateSheetState({ mappings: newMappings });
    } catch (err) {
      console.error('Erro ao obter mapeamento de IA:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const updateSheetState = (updates: Partial<SheetState>) => {
    if (!activeSheet) return;
    setSheetsState(prev => ({
      ...prev,
      [activeSheet]: {
        ...prev[activeSheet],
        ...updates
      }
    }));
  };

  // Processador de transformacoes aplicadas em ordem sequencial (Applied Steps)
  const getProcessedData = (sheet: SheetState) => {
    if (!sheet) return { headers: [], rows: [] };
    let tempHeaders = [...sheet.originalHeaders];
    let tempRows = sheet.originalRows.map(row => [...row]);

    sheet.appliedSteps.forEach(step => {
      if (step.type === 'remove_column' && step.params?.colName) {
        const idx = tempHeaders.indexOf(step.params.colName);
        if (idx !== -1) {
          tempHeaders = tempHeaders.filter(h => h !== step.params.colName);
          tempRows = tempRows.map(row => row.filter((_, colIdx) => colIdx !== idx));
        }
      } else if (step.type === 'quick_transform' && step.params) {
        const { colName, transformType } = step.params;
        const colIdx = tempHeaders.indexOf(colName);
        if (colIdx !== -1) {
          tempRows = tempRows.map(row => {
            const copy = [...row];
            let val = copy[colIdx] || '';
            if (transformType === 'trim') val = String(val).trim().replace(/\s+/g, ' ');
            else if (transformType === 'upper') val = String(val).toUpperCase();
            else if (transformType === 'lower') val = String(val).toLowerCase();
            else if (transformType === 'clean_accents') {
              val = String(val).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            }
            copy[colIdx] = val;
            return copy;
          });
        }
      } else if (step.type === 'custom_js_transform' && step.code) {
        try {
          let objRows = tempRows.map(row => {
            const obj: Record<string, any> = {};
            tempHeaders.forEach((h, idx) => {
              obj[h] = row[idx];
            });
            return obj;
          });

          const runTransform = new Function('rows', `return ${step.code}`);
          const resultObjRows = runTransform(objRows);

          if (Array.isArray(resultObjRows)) {
            tempRows = resultObjRows.map((obj: any) => {
              return tempHeaders.map(h => {
                const val = obj[h];
                return val === null || val === undefined ? '' : String(val);
              });
            });
          }
        } catch (e) {
          console.error("Erro ao executar transformacao customizada por IA:", e);
        }
      }
    });

    return { headers: tempHeaders, rows: tempRows };
  };

  const { headers: processedHeaders, rows: processedRows } = getProcessedData(currentSheet);

  const addStep = (step: Omit<AppliedStep, 'id'>) => {
    const newStep: AppliedStep = { ...step, id: Math.random().toString(36).substring(2, 9) };
    updateSheetState({
      appliedSteps: [...currentSheet.appliedSteps, newStep]
    });
    setCurrentPage(0);
  };

  const removeLastStep = () => {
    if (currentSheet.appliedSteps.length <= 1) return;
    updateSheetState({
      appliedSteps: currentSheet.appliedSteps.slice(0, -1)
    });
    setCurrentPage(0);
  };

  const handleCellEdit = (rowIndex: number, colIndex: number, newValue: string) => {
    const colName = processedHeaders[colIndex];
    if (!colName) return;
    
    const originalColIdx = currentSheet.originalHeaders.indexOf(colName);
    if (originalColIdx === -1) return;

    const updatedRows = currentSheet.originalRows.map((row, rIdx) => {
      if (rIdx === rowIndex) {
        const copy = [...row];
        copy[originalColIdx] = newValue;
        return copy;
      }
      return row;
    });
    updateSheetState({ originalRows: updatedRows });
    setEditingCell(null);
  };

  const handleApplyIaTransform = async () => {
    if (!iaPrompt.trim()) return;
    setProcessingIA(true);

    const objRows = processedRows.map(row => {
      const obj: Record<string, any> = {};
      processedHeaders.forEach((h, idx) => {
        obj[h] = row[idx];
      });
      return obj;
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/transform-data', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          columns: processedHeaders,
          sampleRows: objRows.slice(0, 5),
          prompt: iaPrompt
        })
      });

      const data = await response.json();
      if (data.code) {
        addStep({
          name: data.stepName || `IA: ${iaPrompt}`,
          type: 'custom_js_transform',
          code: data.code
        });
        setIaPrompt('');
      } else {
        alert('Nao foi possivel processar a transformacao. Tente reescrever a instrucao.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexao ao processar comando de IA.');
    } finally {
      setProcessingIA(false);
    }
  };

  const handleImportSubmit = () => {
    const finalData = processedRows.map(row => {
      const obj: Record<string, any> = {};
      processedHeaders.forEach((h, idx) => {
        const isActive = currentSheet.activeColumns[h] !== false;
        const targetField = currentSheet.mappings[h];
        if (isActive && targetField) {
          const colInfo = targetColumns.find(c => c.name === targetField);
          let val = row[idx];
          
          if (colInfo?.type === 'number') {
            obj[targetField] = parseFormattedNumber(val);
          } else {
            obj[targetField] = String(val ?? '').trim();
          }
        }
      });
      return obj;
    }).filter(obj => Object.keys(obj).length > 0);

    if (finalData.length === 0) {
      alert('Selecione e mapeie pelo menos uma coluna para importacao.');
      return;
    }

    onImportComplete(finalData, activeSheet);
  };

  if (!isOpen || !currentSheet) return null;

  // Filtragem local
  const filteredRows = processedRows.map((row, idx) => ({ row, originalIdx: idx }))
    .filter(item => {
      if (!searchTerm.trim()) return true;
      return item.row.some(cell => String(cell).toLowerCase().includes(searchTerm.toLowerCase()));
    });

  const limit = itemsPerPage === -1 ? (filteredRows.length || 1) : itemsPerPage;
  const totalPages = Math.ceil(filteredRows.length / limit);
  const paginatedRows = filteredRows.slice(currentPage * limit, (currentPage + 1) * limit);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-7xl h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-950 border-b border-slate-700">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-violet-400 animate-pulse">database</span>
              Power Query Editor Inteligente (Manequip 360)
            </h3>
            <p className="text-[11px] text-slate-350">
              Trate, edite e valide os dados da planilha antes de importa-los para o banco de dados.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowTour(true);
                setCurrentTourStep(0);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer border border-slate-700"
            >
              <span className="material-symbols-outlined text-[15px]">help</span>
              Guia Passo a Passo
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#ffffff]/10 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] block">close</span>
            </button>
          </div>
        </div>

        {/* Abas da Planilha (Sheets Selector) - Roxo Premium */}
        <div className={`flex bg-slate-950 border-b border-slate-700 overflow-x-auto px-4 py-2 gap-2 scrollbar-thin transition-all duration-300 ${
          showTour && currentTourStep === 0 ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-950 z-20 relative bg-slate-950' : ''
        }`}>
          {Object.keys(sheetsState).map(name => {
            const isSelected = activeSheet === name;
            const rowCount = sheetsState[name].originalRows.length;
            return (
              <button
                key={name}
                onClick={() => {
                  setActiveSheet(name);
                  setCurrentPage(0);
                  setSearchTerm('');
                  setSelectedColumn(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'border-violet-500/70 text-violet-300 bg-violet-600/10 shadow-[inset_0_-1px_0_rgba(139,92,246,0.3),_0_2px_8px_rgba(139,92,246,0.12)]'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span className="truncate">{name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                  isSelected ? 'bg-violet-500/20 text-violet-300' : 'bg-slate-850 text-slate-450'
                }`}>
                  {rowCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Onboarding Tour Banner */}
        {showTour && (
          <div className="mx-6 mt-4 p-4 bg-slate-800/95 border border-violet-500/40 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-[0_4px_20px_rgba(139,92,246,0.15)] animate-fade-in text-slate-100 z-10">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-400 text-[20px]">explore</span>
                <h4 className="font-extrabold text-xs tracking-wide text-violet-300 uppercase">
                  {tourSteps[currentTourStep].title}
                </h4>
              </div>
              <p className="text-xs text-slate-200 font-medium">
                {tourSteps[currentTourStep].description}
              </p>
              <div className="text-[10px] text-violet-350 font-medium italic flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] block text-violet-405">info</span>
                {tourSteps[currentTourStep].tip}
              </div>
            </div>
            
            {/* Controles de Navegacao do Tour */}
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 self-stretch md:self-auto justify-end">
              {/* Pontos de Progresso */}
              <div className="flex gap-1.5 mr-2">
                {tourSteps.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      idx === currentTourStep ? 'w-4 bg-violet-450' : 'w-1.5 bg-slate-650'
                    }`}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTourStep(s => Math.max(0, s - 1))}
                  disabled={currentTourStep === 0}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-[10px] font-bold rounded-lg text-slate-350 hover:text-white hover:bg-slate-750 disabled:opacity-40 disabled:hover:bg-slate-900 transition-all cursor-pointer"
                >
                  Anterior
                </button>
                {tourSteps.length - 1 > currentTourStep ? (
                  <button
                    onClick={() => setCurrentTourStep(s => s + 1)}
                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-slate-950 font-extrabold rounded-lg text-[10px] transition-all cursor-pointer"
                  >
                    Proximo
                  </button>
                ) : (
                  <button
                    onClick={finishTour}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-[10px] transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
                  >
                    Entendi!
                  </button>
                )}
                <button
                  onClick={finishTour}
                  className="px-2.5 py-1.5 bg-transparent text-slate-400 hover:text-slate-205 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Pular Guia
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard de Metricas do Editor */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mx-6 mt-4 mb-2">
          {/* Card 1: Aba Ativa */}
          <div className="bg-slate-900 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-violet-400 text-[18px]">table_chart</span>
            </div>
            <div className="min-w-0">
              <span className="text-[9px] text-slate-450 uppercase font-extrabold tracking-wider block">Aba Selecionada</span>
              <span className="text-xs font-bold text-white truncate block">{activeSheet}</span>
            </div>
          </div>

          {/* Card 2: Linhas */}
          <div className="bg-slate-900 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-cyan-400 text-[18px]">list_alt</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-455 uppercase font-extrabold tracking-wider block">Registros Encontrados</span>
              <span className="text-xs font-bold text-white block">{processedRows.length} linhas</span>
            </div>
          </div>

          {/* Card 3: Colunas Ativas */}
          <div className="bg-slate-900 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-emerald-400 text-[18px]">view_column</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-455 uppercase font-extrabold tracking-wider block">Colunas Ativas</span>
              <span className="text-xs font-bold text-white block">
                {Object.values(currentSheet.activeColumns).filter(Boolean).length} / {processedHeaders.length}
              </span>
            </div>
          </div>

          {/* Card 4: Mapeamento Schema */}
          <div className="bg-slate-900 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-amber-400 text-[18px]">verified</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-455 uppercase font-extrabold tracking-wider block">Mapeadas para {importCategory}</span>
              <span className="text-xs font-bold text-white block">
                {Object.values(currentSheet.mappings).filter(Boolean).length} de {targetColumns.length} campos
              </span>
            </div>
          </div>
        </div>

        {/* Principal Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Esquerdo: Editor e Grade */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/40">
            
            {/* Barra IA Co-pilot */}
            <div className={`p-3 bg-slate-950 border-b border-slate-700 flex gap-2 items-center transition-all duration-300 ${
              showTour && currentTourStep === 2 ? 'ring-2 ring-violet-500 ring-offset-1 ring-offset-slate-900 z-20 relative' : ''
            }`}>
              <span className="material-symbols-outlined text-violet-400 text-[18px]">psychology</span>
              <input
                type="text"
                value={iaPrompt}
                onChange={(e) => setIaPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyIaTransform()}
                placeholder="Peca a IA para transformar a tabela... Ex: 'remova espacos vazios' ou 'substitua R$ e deixe apenas numeros na coluna Preco'"
                className="flex-1 bg-slate-900 border border-slate-700 text-xs rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:border-violet-500 outline-none transition-all focus:ring-1 focus:ring-violet-500/20"
              />
              <button
                onClick={handleApplyIaTransform}
                disabled={processingIA || !iaPrompt.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-lg shadow-violet-500/10 active:scale-98"
              >
                {processingIA ? (
                  <>
                    <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                    Executando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                    Transformar
                  </>
                )}
              </button>
            </div>

            {/* Barra de Pesquisa */}
            <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-700/60 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(0);
                  }}
                  placeholder="Pesquisar registros..."
                  className="w-full bg-slate-950 border border-slate-700 text-[11px] py-1.5 pl-8 pr-3 rounded-lg text-slate-100 outline-none focus:border-violet-500 transition-all placeholder-slate-400"
                />
                <span className="material-symbols-outlined text-[14px] text-slate-455 absolute left-2.5 top-1/2 -translate-y-1/2">search</span>
              </div>
              
              <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
                <span className="text-[10px] text-slate-200 font-medium bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 hidden md:inline-block">
                  Duplo clique em uma celula para editar seu conteudo
                </span>
                
                <button
                  onClick={() => {
                    const copy = { ...currentSheet.activeColumns };
                    processedHeaders.forEach(h => { copy[h] = true; });
                    updateSheetState({ activeColumns: copy });
                  }}
                  className="text-[10px] text-violet-300 hover:text-white font-bold bg-violet-600/10 hover:bg-violet-600/20 px-2.5 py-1.5 rounded-lg border border-violet-500/30 transition-all cursor-pointer hover:scale-[1.02]"
                >
                  Marcar Todas
                </button>
                <button
                  onClick={() => {
                    const copy = { ...currentSheet.activeColumns };
                    processedHeaders.forEach(h => { copy[h] = false; });
                    updateSheetState({ activeColumns: copy });
                  }}
                  className="text-[10px] text-slate-450 hover:text-slate-200 font-bold bg-slate-800 hover:bg-slate-750 px-2.5 py-1.5 rounded-lg border border-slate-750 transition-all cursor-pointer"
                >
                  Desmarcar Todas
                </button>
              </div>
            </div>

            {/* Grade de Dados com Contraste Otimizado (Mais Claro e Legivel) */}
            <div className="flex-1 overflow-auto bg-slate-950/20 scrollbar-thin">
              <table className="w-full text-left text-[11px] border-collapse table-fixed min-w-[600px]">
                <thead>
                  <tr className={`bg-slate-800 border-b border-slate-700 text-slate-150 sticky top-0 z-10 shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-all duration-300 ${
                    showTour && currentTourStep === 1 ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-900 z-20 relative bg-slate-800' : ''
                  }`}>
                    <th className="py-3 px-3 w-[60px] text-center bg-slate-850/50 font-bold border-r border-slate-700/60">Excluir</th>
                    {processedHeaders.map((col, colIdx) => {
                      const isActive = currentSheet.activeColumns[col] !== false;
                      const isSelected = selectedColumn === col;
                      const mappedField = currentSheet.mappings[col];
                      
                      return (
                        <th
                          key={col}
                          onClick={() => setSelectedColumn(col)}
                          className={`py-3 px-3 border-l border-slate-700/60 cursor-pointer select-none transition-all min-w-[160px] ${
                            isSelected 
                              ? 'bg-violet-900/50 text-violet-205 border-b border-violet-500' 
                              : isActive 
                                ? 'hover:bg-slate-750 text-white border-b border-transparent' 
                                : 'bg-slate-900 text-slate-450 line-through border-b border-transparent'
                          }`}
                        >
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isActive}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const copy = { ...currentSheet.activeColumns };
                                  copy[col] = e.target.checked;
                                  updateSheetState({ activeColumns: copy });
                                }}
                                className="rounded border-slate-600 text-violet-500 bg-slate-950 focus:ring-0 cursor-pointer size-4"
                              />
                              <span className="font-extrabold truncate text-xs" title={col}>{col}</span>
                            </div>
                            {mappedField ? (
                              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/30 max-w-fit">
                                <span className="material-symbols-outlined text-[12px] block">arrow_right_alt</span>
                                {mappedField}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-medium bg-slate-850 px-1.5 py-0.5 rounded border border-slate-750 max-w-fit">Ignorada</span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-100 bg-[#0c1424]/40">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={processedHeaders.length + 1} className="py-12 text-center text-slate-400 font-semibold text-xs bg-slate-900/20">
                        Nenhum registro encontrado nesta aba.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((item, rIdx) => (
                      <tr 
                        key={item.originalIdx} 
                        className="border-b border-slate-800/40 hover:bg-slate-800/50 transition-colors odd:bg-slate-900/70 even:bg-slate-900/30"
                      >
                        <td className="py-2.5 px-3 text-center bg-slate-950/30 border-r border-slate-700/60">
                          <button
                            onClick={() => {
                              const updatedRows = currentSheet.originalRows.filter((_, idx) => idx !== item.originalIdx);
                              updateSheetState({ originalRows: updatedRows });
                            }}
                            className="p-1 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                            title="Excluir esta linha"
                          >
                            <span className="material-symbols-outlined text-[16px] block">delete</span>
                          </button>
                        </td>

                        {item.row.map((cellVal, colIdx) => {
                          const colName = processedHeaders[colIdx];
                          const isActive = currentSheet.activeColumns[colName] !== false;
                          const isEditing = editingCell?.rowIndex === item.originalIdx && editingCell?.colIndex === colIdx;

                          return (
                            <td
                              key={colIdx}
                              onDoubleClick={() => isActive && setEditingCell({ rowIndex: item.originalIdx, colIndex: colIdx })}
                              className={`p-2.5 border-l border-slate-700/40 transition-all truncate max-w-[250px] font-mono text-xs ${
                                !isActive 
                                  ? 'bg-slate-950/50 text-slate-400 line-through opacity-45' 
                                  : 'text-slate-100 hover:bg-slate-800/50 cursor-pointer'
                              }`}
                            >
                              {isEditing ? (
                                <input
                                  type="text"
                                  defaultValue={cellVal}
                                  onBlur={(e) => handleCellEdit(item.originalIdx, colIdx, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCellEdit(item.originalIdx, colIdx, (e.target as HTMLInputElement).value);
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  autoFocus
                                  className="w-full bg-slate-950 border border-violet-500 text-white rounded px-2 py-1 outline-none font-mono text-xs focus:ring-1 focus:ring-violet-500/20"
                                />
                              ) : (
                                <span className="px-1">{cellVal}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginador */}
            {filteredRows.length > 0 && (
              <div className="px-6 py-4 bg-slate-950 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-305 shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    Exibindo registros <strong className="text-violet-305 font-mono">{currentPage * limit + 1}</strong> a <strong className="text-violet-355 font-mono">{Math.min((currentPage + 1) * limit, filteredRows.length)}</strong> de <strong className="text-white font-mono">{filteredRows.length}</strong>
                  </span>
                  
                  {/* Seletor de Limite de Linhas */}
                  <div className="flex items-center gap-2 border-l border-slate-700/60 pl-4">
                    <span className="text-slate-400">Linhas exibidas:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(0);
                      }}
                      className="bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs px-2.5 py-1.5 outline-none cursor-pointer focus:border-violet-500 font-bold transition-all focus:ring-1 focus:ring-violet-500/20"
                    >
                      <option value={100}>100 linhas</option>
                      <option value={300}>300 linhas</option>
                      <option value={500}>500 linhas</option>
                      <option value={-1}>Ver todas</option>
                    </select>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className={`px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 transition-all font-semibold ${
                        currentPage === 0 ? 'text-slate-500 cursor-not-allowed opacity-50' : 'text-slate-205 hover:bg-slate-750 hover:text-white cursor-pointer'
                      }`}
                    >
                      Anterior
                    </button>
                    <span className="font-semibold text-slate-200 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">Pagina {currentPage + 1} de {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage === totalPages - 1}
                      className={`px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 transition-all font-semibold ${
                        currentPage === totalPages - 1 ? 'text-slate-500 cursor-not-allowed opacity-50' : 'text-slate-205 hover:bg-slate-750 hover:text-white cursor-pointer'
                      }`}
                    >
                      Proxima
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Direito: Painel de Controle e Historico */}
          <div className="w-80 bg-slate-950 border-l border-slate-700 flex flex-col justify-between overflow-y-auto">
            <div className="p-4 space-y-5 flex-1">
              
              {/* Titulo e Configuracao */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mapeamento de Schema</h4>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Categoria de Destino (IA):</label>
                  <select
                    value={importCategory}
                    onChange={(e) => setImportCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-violet-500 transition-all cursor-pointer font-bold focus:ring-1 focus:ring-violet-500/20"
                  >
                    <option value="EAP">Orcamento EAP / Custos</option>
                    <option value="Materiais">Levantamento de Insumos</option>
                    <option value="Suprimentos">Requisicoes de Compra</option>
                    <option value="Fornecedores">Carteira de Fornecedores</option>
                  </select>
                </div>
                {importCategory !== 'Fornecedores' && (
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Projeto de Destino:</label>
                    <select
                      value={importDestinationProjId}
                      onChange={(e) => setImportDestinationProjId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-violet-500 transition-all cursor-pointer font-bold focus:ring-1 focus:ring-violet-500/20"
                    >
                      <option value="new">(Criar Novo Projeto)</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Sugestoes de IA De / Para */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sugestoes de IA (Mapeamento)</h4>
                  {loadingSuggestions && (
                    <span className="material-symbols-outlined text-[14px] text-violet-400 animate-spin">sync</span>
                  )}
                </div>
                
                {loadingSuggestions ? (
                  <div className="text-center py-5 text-xs text-slate-400 animate-pulse flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-violet-400 animate-pulse">psychology</span>
                    IA analisando sinonimos...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                    {processedHeaders.map(col => {
                      const sug = suggestions[col];
                      const isMapped = !!currentSheet.mappings[col];

                      if (!sug || !sug.coluna_mapeada || isMapped) return null;

                      return (
                        <div key={col} className="p-3 bg-violet-900/10 border border-violet-850/60 rounded-xl space-y-1.5 text-[11px] animate-fade-in">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-200 truncate max-w-[125px]">{col}</span>
                            <span className="text-[9px] bg-violet-900/50 border border-violet-700/30 text-violet-300 px-1.5 py-0.5 rounded font-mono font-bold">
                              {Math.round(sug.confianca * 100)}% Match
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-tight font-medium">
                            Mapear para a coluna <strong className="text-violet-400">"{sug.coluna_mapeada}"</strong>?
                          </p>
                          <p className="text-[9px] text-slate-450 leading-normal italic">
                            {sug.justificativa}
                          </p>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => {
                                const m = { ...currentSheet.mappings, [col]: sug.coluna_mapeada! };
                                updateSheetState({ mappings: m });
                              }}
                              className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-slate-950 font-extrabold rounded-lg text-[10px] cursor-pointer transition-colors"
                            >
                              Aceitar
                            </button>
                            <button
                              onClick={() => {
                                const m = { ...currentSheet.mappings, [col]: '' };
                                updateSheetState({ mappings: m });
                              }}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-[10px] cursor-pointer transition-colors border border-slate-750"
                            >
                              Recusar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Configuracao de Mapeamento Manual por Coluna */}
              <div className={`space-y-2 transition-all duration-300 ${
                showTour && currentTourStep === 1 ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-950 rounded-xl p-2 bg-violet-900/10' : ''
              }`}>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-1.5">
                  Associacao Manual
                </h4>
                <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                  {processedHeaders.map(col => {
                    const mappedField = currentSheet.mappings[col] || '';
                    const isActive = currentSheet.activeColumns[col] !== false;

                    if (!isActive) return null;

                    return (
                      <div key={col} className="flex flex-col gap-1 bg-slate-900 border border-slate-700 p-2 rounded-xl">
                        <span className="text-[10px] font-extrabold text-slate-250 truncate">{col}</span>
                        <select
                          value={mappedField}
                          onChange={(e) => {
                            const m = { ...currentSheet.mappings, [col]: e.target.value };
                            updateSheetState({ mappings: m });
                          }}
                          className="w-full bg-slate-950 border border-slate-700 text-[10px] p-1.5 rounded-lg font-bold cursor-pointer outline-none focus:border-violet-500 transition-colors text-slate-200"
                        >
                          <option value="">(Ignorar Coluna)</option>
                          {targetColumns.map(tc => (
                            <option key={tc.name} value={tc.name}>
                              {tc.name} ({tc.description})
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Etapas Aplicadas (Applied Steps) */}
              <div className={`space-y-2 border-t border-slate-700 pt-4 transition-all duration-300 ${
                showTour && currentTourStep === 3 ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-955 rounded-xl p-2 bg-violet-900/10' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etapas Aplicadas</h4>
                  {currentSheet.appliedSteps.length > 1 && (
                    <button
                      onClick={removeLastStep}
                      className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer font-bold bg-rose-950/30 border border-rose-900/30 px-2 py-0.5 rounded"
                    >
                      <span className="material-symbols-outlined text-[13px] block">undo</span>
                      Desfazer
                    </button>
                  )}
                </div>
                <div className="space-y-1 bg-slate-950 border border-slate-700 rounded-xl p-2.5 max-h-[180px] overflow-y-auto custom-scrollbar">
                  {currentSheet.appliedSteps.map((step, idx) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 p-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        idx === currentSheet.appliedSteps.length - 1
                          ? 'bg-violet-900/20 text-violet-300 border border-violet-750'
                          : 'text-slate-400'
                      }`}
                    >
                      <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-450 px-1 py-0.5 rounded font-mono shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate flex-1">{step.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Menu Acoes Rapidas de Coluna */}
            {selectedColumn && (
              <div className="p-4 bg-slate-950 border-t border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold text-violet-350 uppercase tracking-wider">Coluna: {selectedColumn}</span>
                  <button onClick={() => setSelectedColumn(null)} className="text-slate-450 hover:text-white text-[10px] cursor-pointer">Fechar</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      addStep({ name: `Coluna Removida: ${selectedColumn}`, type: 'remove_column', params: { colName: selectedColumn } });
                      setSelectedColumn(null);
                    }}
                    className="px-2 py-2 bg-slate-900 hover:bg-rose-950/30 hover:text-rose-450 border border-slate-700 text-[10px] text-slate-205 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold"
                  >
                    <span className="material-symbols-outlined text-[14px] block">delete</span>
                    Remover
                  </button>
                  <button
                    onClick={() => {
                      addStep({ name: `Trim: ${selectedColumn}`, type: 'quick_transform', params: { colName: selectedColumn, transformType: 'trim' } });
                    }}
                    className="px-2 py-2 bg-slate-900 hover:bg-violet-900/30 hover:text-violet-300 border border-slate-700 text-[10px] text-slate-205 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold"
                    title="Remove espacos excessivos"
                  >
                    <span className="material-symbols-outlined text-[14px] block">format_align_left</span>
                    Trim
                  </button>
                  <button
                    onClick={() => {
                      addStep({ name: `MAIUSCULO: ${selectedColumn}`, type: 'quick_transform', params: { colName: selectedColumn, transformType: 'upper' } });
                    }}
                    className="px-2 py-2 bg-slate-900 hover:bg-violet-900/30 hover:text-violet-300 border border-slate-700 text-[10px] text-slate-205 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold"
                  >
                    <span className="material-symbols-outlined text-[14px] block">text_fields</span>
                    UPPER
                  </button>
                  <button
                    onClick={() => {
                      addStep({ name: `Limpar Acentos: ${selectedColumn}`, type: 'quick_transform', params: { colName: selectedColumn, transformType: 'clean_accents' } });
                    }}
                    className="px-2 py-2 bg-slate-900 hover:bg-violet-900/30 hover:text-violet-300 border border-slate-700 text-[10px] text-slate-205 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold"
                  >
                    <span className="material-symbols-outlined text-[14px] block">abc</span>
                    Acentos
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className={`p-4 bg-slate-900 border-t border-slate-700 flex gap-3 shrink-0 transition-all duration-300 ${
              showTour && currentTourStep === 3 ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-950 z-20 relative bg-slate-900' : ''
            }`}>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-850/40 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportSubmit}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-slate-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center shadow-lg shadow-violet-500/10 active:scale-98"
              >
                Importar Aba
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
