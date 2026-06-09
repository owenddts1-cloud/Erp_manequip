// Fetch-based OpenAI client for browser environments
const sanitizeKey = (val: any) => typeof val === 'string' ? val.trim().replace(/[\n\r]/g, '') : val;
const apiKey = sanitizeKey(import.meta.env.VITE_OPENAI_API_KEY);

export const sendMessageToOpenAI = async (message: string, model: string = 'gpt-4o-mini', dbContext: string = ''): Promise<string> => {
    if (!apiKey) {
        throw new Error('Chave de API da OpenAI não configurada (VITE_OPENAI_API_KEY).');
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: `Você é um assistente especialista em manutenção industrial (Manequip 360). Responda de forma técnica, direta e útil para engenheiros e técnicos.

${dbContext}` },
                    { role: 'user', content: message },
                ],
                temperature: 0.7,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('OpenAI API error:', data);
            return `Erro da API: ${data.error?.message || 'Desconhecido'}`;
        }
        return data.choices?.[0]?.message?.content || 'Sem resposta da IA.';
    } catch (error) {
        console.error('Erro na integração com OpenAI:', error);
        if (error instanceof Error) {
            return `Erro: ${error.message}`;
        }
        return 'Ocorreu um erro inesperado ao comunicar com a IA.';
    }
};
