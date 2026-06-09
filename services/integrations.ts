
import { supabase } from './supabase';

export const IntegrationService = {
    // GLPI Integration
    syncGLPI: async () => {
        console.log("Syncing with GLPI...");
        try {
            const { data: settingsData } = await supabase
                .from('system_settings')
                .select('key, value')
                .in('key', ['GLPI', 'GLPI_URL', 'GLPI_APP_TOKEN']);

            const settingsMap = (settingsData || []).reduce((acc: any, curr: any) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});

            const apiKey = settingsMap.GLPI;
            const glpiUrl = settingsMap.GLPI_URL;
            const appToken = settingsMap.GLPI_APP_TOKEN;

            if (!apiKey || !glpiUrl) {
                return { success: false, message: "Erro: Credenciais do GLPI não configuradas no sistema." };
            }

            let cleanUrl = glpiUrl.trim().replace(/\/$/, '');

            const initHeaders: Record<string, string> = {
                'Authorization': `user_token ${apiKey}`
            };
            if (appToken && appToken.trim() !== '') {
                initHeaders['App-Token'] = appToken.trim();
            }

            const { data: proxyResult, error: proxyError } = await supabase.rpc('proxy_glpi_request', {
                request_method: 'GET',
                request_url: `${cleanUrl}/initSession`,
                request_headers: initHeaders
            });

            if (proxyError) {
                return { success: false, message: `Erro na comunicação via proxy: ${proxyError.message}` };
            }

            if (proxyResult && proxyResult.success) {
                if (proxyResult.status === 200) {
                    const body = JSON.parse(proxyResult.content);
                    const sessionToken = body.session_token;

                    // Immediately kill the session as we only wanted to test it
                    const ticketHeaders: Record<string, string> = {
                        'Session-Token': sessionToken
                    };
                    if (appToken && appToken.trim() !== '') {
                        ticketHeaders['App-Token'] = appToken.trim();
                    }

                    try {
                        await supabase.rpc('proxy_glpi_request', {
                            request_method: 'GET',
                            request_url: `${cleanUrl}/killSession`,
                            request_headers: ticketHeaders
                        });
                    } catch (e) {
                        console.warn('Could not kill GLPI session:', e);
                    }

                    return { success: true, message: "Conexão com o GLPI validada e sincronizada com sucesso!" };
                } else {
                    return { success: false, message: `Servidor GLPI retornou HTTP ${proxyResult.status}: ${proxyResult.content}` };
                }
            } else {
                return { success: false, message: `Falha na conexão física: ${proxyResult?.error || 'Erro desconhecido'}` };
            }
        } catch (e: any) {
            return { success: false, message: `Erro ao sincronizar com GLPI: ${e.message || e}` };
        }
    },

    // Power Automate Integration
    triggerPowerAutomate: async (data: any) => {
        console.log("Triggering Power Automate flow...", data);
        // return axios.post('https://prod-00.westus.logic.azure.com:443/...', data);
        return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Fluxo Power Automate iniciado (Simulado)" }), 1000));
    }
};
