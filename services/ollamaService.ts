// Client for local Ollama instances running on localhost
export const sendMessageToOllama = async (
  message: string,
  model: string = 'llama3',
  dbContext: string = ''
): Promise<string> => {
  try {
    const prompt = `Você é um assistente especialista em manutenção industrial (Manequip 360). Responda de forma técnica, direta e útil para engenheiros e técnicos.

${dbContext}

Usuário: ${message}`;

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return `⚠️ Modelo '${model}' não foi encontrado no seu Ollama local. Rode 'ollama pull ${model}' no seu terminal.`;
      }
      return `Erro da API Ollama: Status HTTP ${response.status}`;
    }

    const data = await response.json();
    return data.response || 'Sem resposta da IA local.';
  } catch (error: any) {
    console.error('Erro na integração com Ollama local:', error);
    return `⚠️ Erro de conexão com o Ollama local (localhost:11434). 

Possíveis causas:
1. O Ollama não está aberto. Abra o aplicativo Ollama.
2. O modelo '${model}' não foi baixado. Rode 'ollama pull ${model}' no terminal.
3. Bloqueio de CORS. No Windows, configure a variável de ambiente:
   - Defina a variável de sistema OLLAMA_ORIGINS com o valor *
   - Reinicie o Ollama e recarregue a página.`;
  }
};
