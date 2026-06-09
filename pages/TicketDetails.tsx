import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { sendMessageToGemini } from '../services/geminiService';

const TicketDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  const fetchTicketDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: woData, error: woError } = await supabase
        .from('work_orders')
        .select('*, ativos(nome, setor, modelo, tag_id), tecnico:profiles!tecnico_responsavel(full_name, email)')
        .eq('id', id)
        .maybeSingle();

      if (woError) throw woError;

      if (woData) {
        setTicket({
          ...woData,
          tecnico_nome: woData.tecnico?.full_name || woData.tecnico?.email || '',
          isPreventiveTable: false
        });
      } else {
        const { data: prevData, error: prevError } = await supabase
          .from('preventivas_mensais')
          .select('*, ativos(nome, setor, modelo, tag_id), tecnico:profiles!tecnico_responsavel(full_name, email), tecnico2:profiles!tecnico_responsavel_2(full_name, email)')
          .eq('id', id)
          .maybeSingle();

        if (prevError) throw prevError;

        if (prevData) {
          const names = [
            prevData.tecnico?.full_name || prevData.tecnico?.email,
            prevData.tecnico2?.full_name || prevData.tecnico2?.email
          ].filter(Boolean).join(' / ');

          setTicket({
            ...prevData,
            display_id: `PM-${prevData.id.slice(0, 4).toUpperCase()}`,
            tipo: 'Preventiva',
            prioridade: 'Baixa',
            tecnico_nome: names || '',
            isPreventiveTable: true
          });
        } else {
          setTicket(null);
        }
      }
    } catch (err) {
      console.error("Error fetching ticket:", err);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAskAi = async () => {
    if (!ticket) return;
    setIsAiLoading(true);
    setAiResponse('');
    try {
      const prompt = `Analise o seguinte chamado técnico e forneça uma recomendação de ação imediata:
      Ativo: ${ticket.ativos?.nome}
      Descrição: ${ticket.descricao}
      Tipo: ${ticket.tipo}
      Prioridade: ${ticket.prioridade}`;

      const response = await sendMessageToGemini(prompt);
      setAiResponse(response);
    } catch (err) {
      setAiResponse("Não foi possível obter uma resposta da IA no momento.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-background-dark min-h-screen">
      <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
    </div>
  );

  if (!ticket) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background-dark min-h-screen text-white">
      <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
      <h2 className="text-xl font-bold">Chamado não encontrado</h2>
      <button onClick={() => navigate('/app/work-orders')} className="mt-4 text-primary hover:underline">Voltar para a lista</button>
    </div>
  );

  const displayId = ticket.display_id || ticket.id.slice(0, 6).toUpperCase();

  return (
    <div className="flex-1 px-4 md:px-8 lg:px-12 py-8 max-w-[1600px] mx-auto w-full overflow-y-auto bg-transparent text-white">
      {/* Breadcrumb */}
      <nav className="flex mb-6 text-sm font-medium text-slate-500">
        <button onClick={() => navigate('/app/dashboard')} className="hover:text-primary transition-colors">Dashboard</button>
        <span className="mx-2">/</span>
        <button onClick={() => navigate('/app/work-orders')} className="hover:text-primary transition-colors">Manutenção</button>
        <span className="mx-2">/</span>
        <span className="text-slate-200 font-bold tracking-wide">#{displayId}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Chamado #{displayId}</h1>
            <div className="flex gap-2">
              <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${ticket.tipo === 'Corretiva' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-sky-500/20 text-sky-400 border border-sky-500/20'
                }`}>
                {ticket.tipo}
              </span>
              <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${ticket.status === 'Concluída' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/20 text-amber-400 border-amber-500/20'
                }`}>
                {ticket.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-sm">
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">precision_manufacturing</span> {ticket.ativos?.nome || 'Ativo Pendente'}</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">location_on</span> {ticket.ativos?.setor || 'Setor N/A'}</span>
          </div>
        </div>
        <button
          onClick={() => {
            // Create print-friendly content
            const printContent = `
              <html>
              <head>
                <title>OS #${displayId}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                  h1 { color: #0066cc; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
                  .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                  .section { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
                  .section h3 { margin: 0 0 10px 0; color: #333; }
                  .row { display: flex; gap: 20px; margin: 10px 0; }
                  .label { font-weight: bold; color: #666; width: 150px; }
                  .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                  .preventiva { background: #e0f2fe; color: #0369a1; }
                  .corretiva { background: #fef2f2; color: #dc2626; }
                  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                </style>
              </head>
              <body>
                <div class="header">
                  <div>
                    <h1>Ordem de Serviço #${displayId}</h1>
                    <p><strong>Manequip 360</strong> - Sistema de Gestão de Manutenção</p>
                  </div>
                  <div style="text-align: right;">
                    <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
                    <span class="badge ${ticket.tipo === 'Preventiva' ? 'preventiva' : 'corretiva'}">${ticket.tipo}</span>
                  </div>
                </div>
                
                <div class="section">
                  <h3>Informações do Ativo</h3>
                  <div class="row"><span class="label">Nome:</span> ${ticket.ativos?.nome || 'N/A'}</div>
                  <div class="row"><span class="label">Setor:</span> ${ticket.ativos?.setor || 'N/A'}</div>
                  <div class="row"><span class="label">Modelo:</span> ${ticket.ativos?.modelo || 'N/A'}</div>
                </div>
                
                <div class="section">
                  <h3>Detalhes da Ocorrência</h3>
                  <div class="row"><span class="label">Descrição:</span> ${ticket.descricao || 'N/A'}</div>
                  <div class="row"><span class="label">Prioridade:</span> ${ticket.prioridade || 'N/A'}</div>
                  <div class="row"><span class="label">Status:</span> ${ticket.status || 'Aberto'}</div>
                  <div class="row"><span class="label">Responsável:</span> ${ticket.tecnico_nome || 'Não atribuído'}</div>
                  <div class="row"><span class="label">Prazo:</span> ${ticket.data_limite ? new Date(ticket.data_limite).toLocaleDateString('pt-BR') : 'N/A'}</div>
                </div>
                
                <div class="section">
                  <h3>Custos e Tempo</h3>
                  <div class="row"><span class="label">Custo Total:</span> R$ ${(ticket.custo_total || 0).toFixed(2)}</div>
                  <div class="row"><span class="label">Tempo de Reparo:</span> ${ticket.tempo_reparo_minutos || 0} minutos</div>
                </div>
                
                <div class="footer">
                  <p>Documento gerado automaticamente pelo sistema Manequip 360</p>
                  <p>Impresso em: ${new Date().toLocaleString('pt-BR')}</p>
                </div>
              </body>
              </html>
            `;
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(printContent);
              printWindow.document.close();
              printWindow.focus();
              setTimeout(() => printWindow.print(), 500);
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border-dark bg-surface-dark/50 text-slate-300 hover:text-white hover:border-text-secondary transition-all text-sm font-bold shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          Imprimir OS
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass-panel rounded-xl border border-border-dark bg-surface-dark/40 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/40"></div>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-border-dark/50 pb-4">
                <span className="material-symbols-outlined text-primary">description</span>
                Detalhes da Ocorrência
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Descrição</p>
                    <p className="text-slate-200 text-sm leading-relaxed">{ticket.descricao}</p>
                  </div>
                  {ticket.status === 'Aguardando Peça' && ticket.peca_solicitada && (
                    <div className="mt-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/25 text-amber-400 text-xs flex items-center gap-2 font-bold w-fit">
                      <span className="material-symbols-outlined text-[16px] text-amber-400">inventory</span>
                      <span>Peça Aguardada: {ticket.peca_solicitada}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Prioridade</p>
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${ticket.prioridade === 'Alta' ? 'bg-red-500 animate-pulse' : 'bg-primary'}`}></span>
                      <span className={`text-sm font-bold ${ticket.prioridade === 'Alta' ? 'text-red-400' : 'text-primary'}`}>{ticket.prioridade}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Responsável</p>
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20 font-bold text-xs uppercase">
                        {ticket.tecnico_nome?.[0] || 'T'}
                      </div>
                      <span className="text-sm font-medium">{ticket.tecnico_nome || 'Aguardando Atribuição'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Prazo Estimado</p>
                    <div className="flex items-center gap-2 text-slate-200">
                      <span className="material-symbols-outlined text-[18px] text-primary">event</span>
                      <span className="text-sm font-mono">{ticket.data_limite ? new Date(ticket.data_limite).toLocaleDateString() : 'Não definido'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Assistant Insight */}
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-6 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 size-32 bg-sky-500/10 blur-3xl group-hover:bg-sky-500/20 transition-all"></div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
                  <span className="material-symbols-outlined text-sky-400">robot_2</span>
                </div>
                <div>
                  <h3 className="font-bold text-sky-100">Consultoria Técnica IA</h3>
                  <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">Powered by Gemini 2.0</p>
                </div>
              </div>
              <button
                onClick={handleAskAi}
                disabled={isAiLoading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-neon disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAiLoading ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                )}
                {isAiLoading ? 'Processando...' : 'Gerar Diagnóstico'}
              </button>
            </div>

            <div className="relative z-10">
              {aiResponse ? (
                <div className="p-4 rounded-lg bg-background-dark/80 border border-sky-500/20 animate-in fade-in zoom-in-95 duration-500">
                  <p className="text-sm text-slate-300 leading-relaxed italic">"{aiResponse}"</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 max-w-md italic">
                  Utilize a inteligência artificial para obter recomendações de reparo baseadas nas especificações deste ativo e na descrição do problema.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Status */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel rounded-xl border border-border-dark bg-surface-dark/40 p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Timeline do Chamado</h3>
            <div className="relative pl-6 border-l border-border-dark space-y-8">
              <div className="relative">
                <div className="absolute -left-[29.5px] top-1 size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(10,160,235,0.8)]"></div>
                <p className="text-xs font-bold text-white mb-0.5">Chamado Registrado</p>
                <p className="text-[10px] text-slate-500 uppercase">{new Date(ticket.created_at).toLocaleString()}</p>
              </div>
              <div className="relative">
                <div className={`absolute -left-[29.5px] top-1 size-1.5 rounded-full ${ticket.status === 'Concluída' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-700'}`}></div>
                <p className={`text-xs font-bold mb-0.5 ${ticket.status === 'Concluída' ? 'text-emerald-400' : 'text-slate-500'}`}>Encerramento</p>
                <p className="text-[10px] text-slate-500 uppercase">
                  {ticket.status === 'Concluída' ? 'Técnico finalizou o serviço' : 'Pendente de execução'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-border-dark bg-surface-dark/20 text-center">
            <span className="material-symbols-outlined text-slate-600 text-4xl mb-2">history</span>
            <p className="text-xs text-slate-500 italic">O histórico completo de manutenções deste ativo pode ser consultado na aba de Ativos.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;