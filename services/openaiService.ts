// Fetch-based OpenAI client that calls our local serverless proxy to prevent API key leakage

export const sendMessageToOpenAI = async (message: string, model: string = 'gpt-4o-mini', dbContext: string = ''): Promise<string> => {
    try {
        const response = await fetch('/api/openai', {
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
            console.error('OpenAI proxy error:', data);
            return `Erro da API: ${data.error || 'Desconhecido'}`;
        }

        return data.text || 'Sem resposta da IA.';

    } catch (error) {
        console.error('Erro na integração com OpenAI proxy:', error);
        if (error instanceof Error) {
            return `Erro: ${error.message}`;
        }
        return 'Ocorreu um erro inesperado ao comunicar com o proxy da IA.';
    }
};
