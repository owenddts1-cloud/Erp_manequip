// Fetch-based Gemini client for browser environments
const sanitizeKey = (val: any) => typeof val === 'string' ? val.trim().replace(/[\n\r]/g, '') : val;
const apiKey = sanitizeKey(import.meta.env.VITE_GEMINI_API_KEY);

export const sendMessageToGemini = async (message: string, model: string = 'gemini-2.0-flash'): Promise<string> => {
    if (!apiKey) {
        throw new Error('Chave de API do Gemini não configurada (VITE_GEMINI_API_KEY).');
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Você é um assistente especialista em manutenção industrial (Preventiva 360). Responda de forma técnica, direta e útil para engenheiros e técnicos.\n\nUsuário: ${message}`
                    }]
                }]
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API error:', data);
            return `Erro da API: ${data.error?.message || 'Desconhecido'}`;
        }

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return textResponse || 'Sem resposta da IA.';

    } catch (error) {
        console.error('Erro na integração com Gemini:', error);
        if (error instanceof Error) {
            return `Erro: ${error.message}`;
        }
        return 'Ocorreu um erro inesperado ao comunicar com a IA.';
    }
};
