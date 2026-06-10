import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { columns, sampleRows, prompt } = req.body || {};

  if (!prompt || !columns || !sampleRows) {
    return res.status(400).json({ error: 'Os campos prompt, columns e sampleRows são obrigatórios.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave do Gemini API não configurada no servidor.' });
  }

  const systemInstruction = `Você é o interpretador de transformações JavaScript de um Query Editor de planilhas.
Sua tarefa é ler uma lista de colunas atuais de uma tabela, uma amostra das primeiras linhas de dados, e um pedido de transformação em linguagem natural feito pelo usuário.
Você deve retornar estritamente um código JavaScript moderno que realize essa transformação.

### FORMATO DE RETORNO (JSON)
{
  "stepName": "Nome descritivo e amigável da etapa (em português)",
  "code": "Código javascript executável (expressão pura) que recebe uma variável 'rows' (array de objetos) e retorna o array transformado."
}

### EXEMPLO DE RETORNO
{
  "stepName": "IA: Limpeza e conversão de dados",
  "code": "rows.map(r => ({ ...r, 'Nome': typeof r['Nome'] === 'string' ? r['Nome'].trim() : r['Nome'] }))"
}

### DIRETRIZES IMPORTANTES:
- O código Javascript fornecido na chave "code" deve ser uma expressão pura aplicável diretamente a um array de objetos (ex: \`rows.map(...)\`, \`rows.filter(...)\` ou \`rows.reduce(...)\`).
- O código não deve ser encapsulado em uma função nomeada. Deve ser a expressão JavaScript direta aplicável.
- Use chaves normais ou aspas para acessar colunas do objeto (ex: \`r['Telefone']\`).
- Trate valores nulos ou indefinidos de forma segura.
- Retorne apenas o JSON puro, sem usar crases de bloco de código (\`\`\`json).`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemInstruction}\n\nColunas Atuais: ${JSON.stringify(columns)}\nAmostra de Dados: ${JSON.stringify(sampleRows)}\nPedido de Transformação do Usuário: "${prompt}"`
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error status:', response.status, data);
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API returned an error' });
    }

    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let result;
    try {
      result = JSON.parse(textResponse.trim());
    } catch (e) {
      console.error('Error parsing Gemini response as JSON. Raw text:', textResponse);
      return res.status(500).json({ error: 'Erro ao analisar a resposta da IA como JSON.' });
    }

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('Error in transform-data serverless function:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
