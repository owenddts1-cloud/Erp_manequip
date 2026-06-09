import React, { useState, useEffect } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';
import { supabase } from '../services/supabase';

interface GLPITicket {
  id: string;
  title: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  status: string;
  date: string;
  requester: string;
}

const GLPIIntegration: React.FC = () => {
  const { t } = usePreferences();
  const [hasKey, setHasKey] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [glpiUrl, setGlpiUrl] = useState<string | null>(null);
  const [appToken, setAppToken] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testStep, setTestStep] = useState('');
  const [tickets, setTickets] = useState<GLPITicket[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadGLPISettings = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['GLPI', 'GLPI_URL', 'GLPI_APP_TOKEN']);
      
      if (data) {
        const settingsMap = data.reduce((acc: any, curr: any) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {});

        if (settingsMap.GLPI) {
          setHasKey(true);
          setApiKey(settingsMap.GLPI);
        } else {
          setHasKey(false);
          setApiKey(null);
        }
        setGlpiUrl(settingsMap.GLPI_URL || null);
        setAppToken(settingsMap.GLPI_APP_TOKEN || null);
      }
    } catch (err) {
      console.error('Error checking GLPI settings:', err);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    loadGLPISettings();
  }, []);

  const handleTestConnection = async () => {
    if (!hasKey) return;
    setTestStatus('testing');
    setTickets([]);
    setErrorMessage(null);

    // If no GLPI_URL is defined, display error
    if (!glpiUrl || !glpiUrl.trim()) {
      setErrorMessage('A URL da API do GLPI não está configurada nas configurações do sistema. Por favor, acesse o menu Configurações > Aba Administração e cadastre a URL de sua plataforma.');
      setTestStatus('failed');
      return;
    }

    try {
      setTestStep('Iniciando sessão na API do GLPI (via Proxy do Servidor)...');
      await new Promise(r => setTimeout(r, 400));

      const initHeaders: Record<string, string> = {
        'Authorization': `user_token ${apiKey}`
      };
      if (appToken && appToken.trim() !== '') {
        initHeaders['App-Token'] = appToken.trim();
      }

      // Format URL to ensure it has no trailing slash and correct API path
      let cleanUrl = glpiUrl.trim().replace(/\/$/, '');
      
      let sessionToken = '';
      let usedProxy = false;

      try {
        const { data: proxyResult, error: proxyError } = await supabase.rpc('proxy_glpi_request', {
          request_method: 'GET',
          request_url: `${cleanUrl}/initSession`,
          request_headers: initHeaders
        });

        if (proxyError) throw proxyError;

        if (proxyResult && proxyResult.success) {
          if (proxyResult.status === 200) {
            const body = JSON.parse(proxyResult.content);
            sessionToken = body.session_token;
            usedProxy = true;
          } else {
            throw new Error(`Proxy do servidor retornou erro HTTP ${proxyResult.status}: ${proxyResult.content}`);
          }
        } else if (proxyResult && !proxyResult.success) {
          throw new Error(proxyResult.error || 'Erro desconhecido no proxy.');
        } else {
          throw new Error('Retorno do proxy do servidor inválido.');
        }
      } catch (proxyErr: any) {
        console.warn('Database proxy failed, falling back to direct browser request:', proxyErr);
        
        setTestStep('Iniciando sessão na API do GLPI (Direto via Navegador)...');
        await new Promise(r => setTimeout(r, 400));

        const initHeadersInit: HeadersInit = {
          'Authorization': `user_token ${apiKey}`
        };
        if (appToken && appToken.trim() !== '') {
          initHeadersInit['App-Token'] = appToken.trim();
        }

        const initResponse = await fetch(`${cleanUrl}/initSession`, {
          method: 'GET',
          headers: initHeadersInit,
          mode: 'cors'
        });

        if (!initResponse.ok) {
          throw new Error(`Servidor GLPI respondeu com erro HTTP ${initResponse.status}: ${initResponse.statusText}`);
        }

        const initData = await initResponse.json();
        sessionToken = initData.session_token;
      }

      if (!sessionToken) {
        throw new Error('Retorno da API inválido: session_token não encontrado.');
      }

      setTestStep(usedProxy 
        ? 'Sessão autenticada. Buscando chamados (via Proxy do Servidor)...'
        : 'Sessão autenticada. Buscando chamados (Direto via Navegador)...'
      );
      await new Promise(r => setTimeout(r, 600));

      const ticketHeaders: Record<string, string> = {
        'Session-Token': sessionToken
      };
      if (appToken && appToken.trim() !== '') {
        ticketHeaders['App-Token'] = appToken.trim();
      }

      let ticketData: any = null;

      if (usedProxy) {
        const { data: proxyResult, error: proxyError } = await supabase.rpc('proxy_glpi_request', {
          request_method: 'GET',
          request_url: `${cleanUrl}/Ticket?expand_dropdowns=true&range=0-15`,
          request_headers: ticketHeaders
        });

        if (proxyError) throw proxyError;

        if (proxyResult && proxyResult.success) {
          if (proxyResult.status === 200) {
            ticketData = JSON.parse(proxyResult.content);
          } else {
            throw new Error(`Falha ao buscar chamados via proxy: HTTP ${proxyResult.status} ${proxyResult.content}`);
          }
        } else if (proxyResult && !proxyResult.success) {
          throw new Error(proxyResult.error || 'Erro ao buscar chamados via proxy.');
        }
      } else {
        const ticketHeadersInit: HeadersInit = {
          'Session-Token': sessionToken
        };
        if (appToken && appToken.trim() !== '') {
          ticketHeadersInit['App-Token'] = appToken.trim();
        }

        const ticketResponse = await fetch(`${cleanUrl}/Ticket?expand_dropdowns=true&range=0-15`, {
          method: 'GET',
          headers: ticketHeadersInit,
          mode: 'cors'
        });

        if (!ticketResponse.ok) {
          throw new Error(`Falha ao buscar chamados: HTTP ${ticketResponse.status} ${ticketResponse.statusText}`);
        }

        ticketData = await ticketResponse.json();
      }

      if (Array.isArray(ticketData)) {
        const parsedTickets: GLPITicket[] = ticketData.map((t: any) => {
          let priorityVal: 'Baixa' | 'Média' | 'Alta' | 'Crítica' = 'Média';
          if (t.priority <= 2) priorityVal = 'Baixa';
          else if (t.priority === 3) priorityVal = 'Média';
          else if (t.priority === 4) priorityVal = 'Alta';
          else if (t.priority >= 5) priorityVal = 'Crítica';

          let statusVal = 'Novo';
          if (t.status === 2) statusVal = 'Atribuído';
          else if (t.status === 3) statusVal = 'Planejado';
          else if (t.status === 4) statusVal = 'Pendente';
          else if (t.status === 5) statusVal = 'Solucionado';
          else if (t.status === 6) statusVal = 'Fechado';

          return {
            id: `GLPI-#${t.id}`,
            title: t.name || 'Sem título',
            priority: priorityVal,
            status: statusVal,
            date: t.date ? new Date(t.date).toLocaleDateString('pt-BR') : '---',
            requester: t.users_id_recipient || 'Usuário GLPI'
          };
        });
        setTickets(parsedTickets);
        setTestStatus('success');
      } else {
        setTickets([]);
        setTestStatus('success');
      }

      // Close session
      if (usedProxy) {
        (async () => {
          try {
            await supabase.rpc('proxy_glpi_request', {
              request_method: 'GET',
              request_url: `${cleanUrl}/killSession`,
              request_headers: ticketHeaders
            });
          } catch (e) {
            console.warn('Could not kill GLPI session via proxy:', e);
          }
        })();
      } else {
        const ticketHeadersInit: HeadersInit = {
          'Session-Token': sessionToken
        };
        if (appToken && appToken.trim() !== '') {
          ticketHeadersInit['App-Token'] = appToken.trim();
        }
        fetch(`${cleanUrl}/killSession`, {
          method: 'GET',
          headers: ticketHeadersInit,
          mode: 'cors'
        }).catch(e => console.warn('Could not kill GLPI session:', e));
      }

    } catch (err: any) {
      console.error('Real GLPI Connection failed:', err);
      setErrorMessage(err.message || 'Erro de conexão ou política de CORS. O servidor GLPI pode estar inacessível ou rejeitando requisições.');
      setTestStatus('failed');
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'Crítica': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Alta': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Média': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };


  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
      <header className="h-16 border-b border-[#1e293b] sticky top-0 z-10 flex items-center px-8 bg-[#0a0f1d]/90 backdrop-blur-md text-white shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-cyan-500 text-[28px]">sync_alt</span>
          <h1 className="text-xl font-bold font-display tracking-tight">{t('nav_glpi')}</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="bg-gradient-to-br from-slate-900 to-[#111827] border border-slate-800 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[120px]">api</span>
            </div>
            
            <h2 className="text-2xl font-bold text-white font-display mb-4">Integração GLPI (Módulo em Breve)</h2>
            <p className="text-slate-300 mb-6 max-w-2xl text-lg leading-relaxed">
              O Manequip 360 pode se conectar diretamente ao seu sistema GLPI para unificar a gestão de chamados, requisições e ativos da sua planta. Abaixo estão as capacidades da integração.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-[#0a0f1d]/50 border border-slate-800/80 p-5 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <span className="material-symbols-outlined">cloud_upload</span>
                  </div>
                  <h3 className="text-white font-bold text-base">O que é possível Enviar (Upload)</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-400 list-disc pl-5">
                  <li>Atualizações de status de ordens de serviço (Sincroniza status "Concluído").</li>
                  <li>Apontamento de horas de técnicos em chamados do GLPI.</li>
                  <li>Requisição automática de peças de reposição via ticket.</li>
                  <li>Criação de chamados incidentais a partir de alertas de IoT/Sensores.</li>
                </ul>
              </div>

              <div className="bg-[#0a0f1d]/50 border border-slate-800/80 p-5 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <span className="material-symbols-outlined">visibility</span>
                  </div>
                  <h3 className="text-white font-bold text-base">O que é possível Visualizar</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-400 list-disc pl-5">
                  <li>Listagem completa de tickets abertos no GLPI atribuídos à equipe de manutenção.</li>
                  <li>Base de conhecimento (FAQ) do GLPI diretamente na interface do Manequip 360.</li>
                  <li>Histórico de manutenção atrelado ao número de série dos equipamentos.</li>
                  <li>Nível de criticidade (SLA) definido pelos solicitantes.</li>
                </ul>
              </div>

              <div className="bg-[#0a0f1d]/50 border border-slate-800/80 p-5 rounded-xl md:col-span-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <span className="material-symbols-outlined">tune</span>
                  </div>
                  <h3 className="text-white font-bold text-base">O que é possível Manipular</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-400 list-disc pl-5">
                  <li>Transferência de atribuição (encaminhar chamado para outro setor/técnico).</li>
                  <li>Anexo de laudos em PDF e fotos de inspeção na O.S que são espelhados no GLPI.</li>
                  <li>Sincronização do cadastro de ativos (O que for criado no Manequip 360 atualiza o inventário do GLPI e vice-versa).</li>
                  <li>Gestão de prioridades e reagendamento de tarefas.</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1">
                {isChecking ? (
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <span className="animate-spin text-cyan-400 size-4 border-2 border-t-transparent border-cyan-400 rounded-full"></span>
                    Verificando configurações da API...
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400 flex flex-wrap gap-2 items-center">
                      <span>Token API (User):</span>
                      {hasKey ? (
                        <span className="font-mono text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded text-xs">
                          Cadastrado
                        </span>
                      ) : (
                        <span className="font-mono text-rose-400 font-bold bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded text-xs">
                          Nenhum
                        </span>
                      )}

                      <span className="ml-2">URL API:</span>
                      {glpiUrl ? (
                        <span className="font-mono text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded text-xs truncate max-w-[200px]" title={glpiUrl}>
                          Configurada
                        </span>
                      ) : (
                        <span className="font-mono text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded text-xs">
                          Pendente
                        </span>
                      )}

                      <span className="ml-2">App-Token:</span>
                      {appToken ? (
                        <span className="font-mono text-purple-400 font-bold bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded text-xs">
                          Cadastrado
                        </span>
                      ) : (
                        <span className="font-mono text-slate-500 font-bold bg-slate-500/10 border border-slate-800 px-2 py-0.5 rounded text-xs">
                          Nenhum
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {glpiUrl 
                        ? `Conectando a: ${glpiUrl}`
                        : 'Configure as credenciais (Token, URL e App-Token) em Configurações do Sistema > Aba Administração.'}
                    </p>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleTestConnection}
                disabled={!hasKey || testStatus === 'testing'}
                className={`px-6 py-2.5 font-bold rounded-lg border flex items-center gap-2 transition-all cursor-pointer ${
                  hasKey
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 hover:shadow-neon hover:scale-105 active:scale-95'
                    : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">cable</span>
                Testar Conexão
              </button>
            </div>
          </div>

          {/* Test Status Panel */}
          {testStatus === 'testing' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 shadow-xl animate-in fade-in duration-300">
              <span className="animate-spin material-symbols-outlined text-4xl text-cyan-400">sync</span>
              <p className="text-cyan-400 font-medium tracking-wide animate-pulse">Testando Conexão com GLPI...</p>
              <p className="text-slate-400 text-sm font-mono bg-slate-950 px-4 py-2 rounded-lg border border-slate-800/80">
                {testStep}
              </p>
            </div>
          )}

          {/* Test Connection Fail Panel */}
          {testStatus === 'failed' && (
            <div className="bg-gradient-to-br from-slate-900 to-[#1c1214] border border-rose-950 rounded-2xl p-6 space-y-6 shadow-2xl animate-in slide-in-from-bottom-6 duration-500">
              <div className="flex items-center justify-between border-b border-rose-900/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-lg">
                    <span className="material-symbols-outlined">error</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Falha na Conexão Física com GLPI</h3>
                    <p className="text-xs text-rose-400">A requisição externa falhou ou foi bloqueada pelo seu navegador.</p>
                  </div>
                </div>
                <button
                  onClick={() => setTestStatus('idle')}
                  className="text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-rose-950/20 border border-rose-500/10 rounded-xl">
                  <p className="text-xs font-bold text-rose-455 uppercase tracking-wider mb-1">Detalhes do Erro:</p>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                    {errorMessage}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Diagnóstico Local</p>
                    <ul className="space-y-2 text-xs font-mono">
                      <li className="flex justify-between gap-4">
                        <span className="text-slate-500">Servidor URL:</span>
                        <span className="text-slate-300 truncate max-w-[200px]" title={glpiUrl || ''}>{glpiUrl || 'Não configurado'}</span>
                      </li>
                      <li className="flex justify-between gap-4">
                        <span className="text-slate-500">API Key (Token):</span>
                        <span className="text-slate-300">{hasKey ? 'Presente' : 'Ausente'}</span>
                      </li>
                      <li className="flex justify-between gap-4">
                        <span className="text-slate-500">App-Token:</span>
                        <span className="text-slate-300">{appToken ? 'Presente' : 'Não configurado'}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl space-y-2 text-xs text-slate-400 leading-relaxed">
                    <p className="font-bold text-slate-300">Como corrigir:</p>
                    <p>• <strong>CORS:</strong> Certifique-se de que a API REST do GLPI está habilitada e configurada para aceitar origens externas (configuração de CORS no seu Apache/Nginx ou `config.php`).</p>
                    <p>• <strong>Endereço IP/Porta:</strong> Certifique-se de que o URL configurado na aba de Administração é acessível pelo seu computador atual.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/60 text-center">
                <p className="text-xs text-slate-500">
                  Por favor, ajuste suas credenciais nas Configurações do Sistema e verifique as conexões de rede e CORS no servidor.
                </p>
              </div>
            </div>
          )}

          {testStatus === 'success' && (
            <div className="bg-gradient-to-br from-slate-900 to-[#0e1726] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl animate-in slide-in-from-bottom-6 duration-500">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-neon">
                    <span className="material-symbols-outlined">check_circle</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Conexão Real Estabelecida</h3>
                    <p className="text-xs text-slate-400">Conectado com sucesso em: {glpiUrl}</p>
                  </div>
                </div>
                <button
                  onClick={() => setTestStatus('idle')}
                  className="text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-cyan-400">list_alt</span>
                  Chamados Localizados no Servidor ({tickets.length})
                </h4>
                
                {tickets.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 italic bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs">
                    Nenhum chamado pendente retornado do servidor GLPI.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-950 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/50">
                        <tr>
                          <th className="px-4 py-3">ID Chamado</th>
                          <th className="px-4 py-3">Título</th>
                          <th className="px-4 py-3">Solicitante</th>
                          <th className="px-4 py-3">Data</th>
                          <th className="px-4 py-3">Prioridade</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {tickets.map((ticket) => (
                          <tr key={ticket.id} className="hover:bg-slate-900/30 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-cyan-400 text-xs">{ticket.id}</td>
                            <td className="px-4 py-3 text-slate-200 font-medium max-w-xs truncate">{ticket.title}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{ticket.requester}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{ticket.date}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPriorityBadgeColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700/50">
                                {ticket.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="p-4 bg-cyan-950/20 border border-cyan-500/10 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-cyan-400 mt-0.5">info</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Estes chamados foram localizados no servidor do GLPI. Na versão final do módulo, eles serão listados no painel geral de chamados do Manequip 360 com sincronização em tempo real de status, histórico e alocação de técnicos.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default GLPIIntegration;
