
// Interface for AI response
export interface AIServiceResponse {
    text: string;
    error?: boolean;
}

// Current supported models
export type AIProvider = 'openai' | 'gemini' | 'ollama';
export type OpenAIModel = 'gpt-4o-mini' | 'gpt-3.5-turbo';
export type GeminiModel = 'gemini-3.5-flash' | 'gemini-2.5-flash' | 'gemini-2.0-flash' | 'gemini-1.5-flash' | 'gemini-1.5-pro';
export type OllamaModel = 'llama3' | 'mistral' | 'gemma' | 'phi3';

export interface AIConfig {
    provider: AIProvider;
    model: string;
}

import { sendMessageToOpenAI } from './openaiService';
import { sendMessageToGemini } from './geminiService';
import { sendMessageToOllama } from './ollamaService';
import { supabase } from './supabase';

export const getDatabaseContext = async (): Promise<string> => {
    try {
        // Fetch active assets count and status counts
        const { data: assets, error: assetsErr } = await supabase
            .from('ativos')
            .select('status, criticidade');
        
        if (assetsErr) throw assetsErr;

        let totalAssets = assets?.length || 0;
        let opCount = 0;
        let maintCount = 0;
        let stopCount = 0;
        let criticalAlta = 0;

        assets?.forEach(a => {
            if (a.status === 'Operacional') opCount++;
            else if (a.status === 'Manutenção' || a.status === 'Em manutenção') maintCount++;
            else if (a.status === 'Parado') stopCount++;

            if (a.criticidade === 'Alta') criticalAlta++;
        });

        // Fetch active work orders (OS) counts
        const { data: wos, error: wosErr } = await supabase
            .from('work_orders')
            .select('status');
        
        if (wosErr) throw wosErr;

        let totalActiveWos = 0;
        let woPendente = 0;
        let woAndamento = 0;
        let woPeca = 0;
        let woConcluido = 0;

        wos?.forEach(w => {
            if (w.status === 'Pendente') { woPendente++; totalActiveWos++; }
            else if (w.status === 'Em Andamento') { woAndamento++; totalActiveWos++; }
            else if (w.status === 'Aguardando Peça') { woPeca++; totalActiveWos++; }
            else if (w.status === 'Concluido' || w.status === 'Concluída') { woConcluido++; }
        });

        // Fetch monthly preventives count for this month
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const { data: preventivas, error: prevErr } = await supabase
            .from('preventivas_mensais')
            .select('status, mes, ano')
            .eq('mes', currentMonth)
            .eq('ano', currentYear);

        if (prevErr) throw prevErr;

        let prevAberto = 0;
        let prevAtendimento = 0;
        let prevConcluido = 0;

        preventivas?.forEach(p => {
            if (p.status === 'Em aberto') prevAberto++;
            else if (p.status === 'Em atendimento') prevAtendimento++;
            else if (p.status === 'Concluído') prevConcluido++;
        });

        // Fetch low inventory stock items
        const { data: inventory, error: invErr } = await supabase
            .from('inventario')
            .select('nome_peca, quantidade_estoque, estoque_minimo');

        if (invErr) throw invErr;

        const lowStock = inventory?.filter(i => (i.quantidade_estoque ?? 0) <= (i.estoque_minimo ?? 5)) || [];
        const lowStockSummary = lowStock.slice(0, 5).map(i => `${i.nome_peca} (${i.quantidade_estoque} no estoque, mín: ${i.estoque_minimo})`).join(', ');

        return `CONTEXTO DO SISTEMA EM TEMPO REAL:
- Total de Ativos Cadastrados: ${totalAssets} (${opCount} Operacionais, ${maintCount} Em Manutenção, ${stopCount} Parados, ${criticalAlta} de Criticidade Alta).
- Ordens de Serviço (OS): ${totalActiveWos} ativas (${woPendente} Pendentes, ${woAndamento} Em Andamento, ${woPeca} Aguardando Peça, ${woConcluido} Concluídas).
- Cronograma de Preventivas do Mês Atual (${currentMonth}/${currentYear}):
  * Total de Preventivas no Mês: ${preventivas?.length || 0}
  * Status: ${prevAberto} Em aberto, ${prevAtendimento} Em atendimento, ${prevConcluido} Concluídas.
- Estoque Crítico (Itens abaixo do estoque mínimo): ${lowStock.length} itens${lowStockSummary ? ` (Exemplos: ${lowStockSummary})` : ' (Nenhum item com estoque crítico)'}.`;
    } catch (e) {
        console.error('Erro ao ler contexto do banco:', e);
        return 'CONTEXTO DO SISTEMA: Erro ao carregar dados do banco de dados em tempo real.';
    }
};

export const sendMessageToAI = async (message: string, config: AIConfig): Promise<string> => {
    const dbContext = await getDatabaseContext();
    const providersToTry: { provider: AIProvider; model: string }[] = [];

    // 1. First, try the user's selected provider and model
    providersToTry.push({ provider: config.provider, model: config.model });

    // 2. Queue fallback candidates
    if (config.provider === 'gemini') {
        // Fallback to other Gemini models
        const otherGemini = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'].filter(m => m !== config.model);
        otherGemini.forEach(m => providersToTry.push({ provider: 'gemini', model: m }));
        
        // Fallback to Ollama local LLaMA 3
        providersToTry.push({ provider: 'ollama', model: 'llama3' });
    } else if (config.provider === 'openai') {
        // Fallback to other OpenAI model, then Gemini, then local Ollama
        providersToTry.push({ provider: 'openai', model: config.model === 'gpt-4o-mini' ? 'gpt-3.5-turbo' : 'gpt-4o-mini' });
        providersToTry.push({ provider: 'gemini', model: 'gemini-3.5-flash' });
        providersToTry.push({ provider: 'ollama', model: 'llama3' });
    } else if (config.provider === 'ollama') {
        // Fallback to other local Ollama models, then Gemini
        const otherOllama = ['phi3', 'gemma', 'mistral'].filter(m => m !== config.model);
        otherOllama.forEach(m => providersToTry.push({ provider: 'ollama', model: m }));
        providersToTry.push({ provider: 'gemini', model: 'gemini-3.5-flash' });
    }

    let lastError = '';
    for (const attempt of providersToTry) {
        try {
            let res = '';
            if (attempt.provider === 'openai') {
                res = await sendMessageToOpenAI(message, attempt.model, dbContext);
            } else if (attempt.provider === 'gemini') {
                res = await sendMessageToGemini(message, attempt.model, dbContext);
            } else if (attempt.provider === 'ollama') {
                res = await sendMessageToOllama(message, attempt.model, dbContext);
            }

            // Check if result corresponds to a typical rate/quota limit or connection error string
            const isErrorMsg = res.startsWith('Erro da API:') || 
                               res.startsWith('Erro:') || 
                               res.includes('exceeded your current quota') || 
                               res.includes('Failed to fetch') ||
                               res.includes('Ollama desligado') ||
                               res.includes('erro CORS');

            if (isErrorMsg) {
                lastError = res;
                console.warn(`[Failover] Model ${attempt.provider}/${attempt.model} failed with message: "${res}". Trying next candidate...`);
                continue;
            }

            // If we ended up using a fallback candidate, append a transparent note
            if (attempt.provider !== config.provider || attempt.model !== config.model) {
                const fallbackNote = `\n\n*(Nota: O provedor original [${config.provider.toUpperCase()} - ${config.model}] falhou/excedeu cota. O sistema alternou automaticamente para o backup: **${attempt.provider.toUpperCase()} - ${attempt.model}**).*`;
                return res + fallbackNote;
            }

            return res;
        } catch (e: any) {
            lastError = e.message || String(e);
            console.warn(`[Failover] Exception calling ${attempt.provider}/${attempt.model}:`, e);
        }
    }

    return `⚠️ Todos os provedores de inteligência falharam. 
Último erro registrado: ${lastError}

Dica: Se você estiver offline ou sem cota na nuvem, certifique-se de iniciar o Ollama local no Windows (com OLLAMA_ORIGINS="*") para ter um atendimento ininterrupto.`;
};

export const AVAILABLE_MODELS = {
    openai: [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ],
    gemini: [
        { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Mais Rápido/Atual)' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Bloqueado/Limite 0)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
    ],
    ollama: [
        { id: 'llama3', name: 'LLaMA 3' },
        { id: 'mistral', name: 'Mistral' },
        { id: 'gemma', name: 'Gemma' },
        { id: 'phi3', name: 'Microsoft Phi-3' }
    ]
};

export interface ModelStatus {
    id: string;
    provider: AIProvider;
    status: 'working' | 'quota_exceeded' | 'not_found' | 'error' | 'testing';
    message: string;
}

export const testModelConnection = async (provider: AIProvider, model: string): Promise<ModelStatus> => {
    try {
        if (provider === 'openai') {
            const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
            if (!apiKey) {
                return { id: model, provider, status: 'error', message: 'Chave de API não configurada.' };
            }
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey.trim().replace(/[\n\r]/g, '')}`,
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: 'ping' }],
                    max_tokens: 5
                }),
            });

            if (response.status === 429) {
                return { id: model, provider, status: 'quota_exceeded', message: 'Cota de uso excedida (429).' };
            }
            if (response.status === 404) {
                return { id: model, provider, status: 'not_found', message: 'Modelo não encontrado (404).' };
            }
            if (!response.ok) {
                return { id: model, provider, status: 'error', message: `Erro HTTP ${response.status}.` };
            }
            return { id: model, provider, status: 'working', message: 'Disponível (OK)' };
        } else if (provider === 'gemini') {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                return { id: model, provider, status: 'error', message: 'Chave de API não configurada.' };
            }
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim().replace(/[\n\r]/g, '')}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'ping' }] }]
                })
            });

            if (response.status === 429) {
                return { id: model, provider, status: 'quota_exceeded', message: 'Cota de uso excedida (429).' };
            }
            if (response.status === 404) {
                return { id: model, provider, status: 'not_found', message: 'Modelo não encontrado (404).' };
            }
            if (!response.ok) {
                return { id: model, provider, status: 'error', message: `Erro HTTP ${response.status}.` };
            }
            return { id: model, provider, status: 'working', message: 'Disponível (OK)' };
        } else {
            // ollama
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    prompt: 'ping',
                    stream: false
                })
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return { id: model, provider, status: 'not_found', message: `Modelo '${model}' ausente.` };
                }
                return { id: model, provider, status: 'error', message: `Erro HTTP ${response.status}.` };
            }
            return { id: model, provider, status: 'working', message: 'Disponível (OK)' };
        }
    } catch (e: any) {
        console.error(`Error testing model ${model}:`, e);
        if (e.message && e.message.includes('Failed to fetch')) {
            if (provider === 'openai') {
                return { id: model, provider, status: 'quota_exceeded', message: 'Erro de Cota ou CORS (Browser).' };
            }
            if (provider === 'ollama') {
                return { id: model, provider, status: 'error', message: 'Ollama desligado ou erro CORS.' };
            }
            return { id: model, provider, status: 'error', message: 'Erro de Conexão (Failed to fetch).' };
        }
        return { id: model, provider, status: 'error', message: e.message || 'Erro de comunicação.' };
    }
};
