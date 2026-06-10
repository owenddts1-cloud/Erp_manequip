// Fetch-based Gemini client that calls our local serverless proxy to prevent API key leakage

export const sendMessageToGemini = async (message: string, model: string = 'gemini-3.5-flash', dbContext: string = ''): Promise<string> => {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                model,
                dbContext
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini proxy error:', data);
            return `Erro da API: ${data.error || 'Desconhecido'}`;
        }

        return data.text || 'Sem resposta da IA.';

    } catch (error) {
        console.error('Erro na integração com Gemini proxy:', error);
        if (error instanceof Error) {
            return `Erro: ${error.message}`;
        }
        return 'Ocorreu um erro inesperado ao comunicar com o proxy da IA.';
    }
};
