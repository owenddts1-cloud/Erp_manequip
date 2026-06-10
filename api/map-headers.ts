import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { sourceHeaders, targetColumns } = req.body || {};

  if (!sourceHeaders || !targetColumns) {
    return res.status(400).json({ error: 'Os campos sourceHeaders e targetColumns são obrigatórios.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave do Gemini API não configurada no servidor.' });
  }

  const systemPrompt = `Você é um Engenheiro de Dados especialista em mapeamento de schemas. Sua tarefa é analisar os cabeçalhos (headers) originais de uma planilha importada e mapeá-los para a lista de colunas esperada pelo banco de dados do nosso aplicativo.
Você deve fazer uma análise semântica inteligente, compreendendo sinônimos, abreviações e traduções (português/inglês).

### ENTRADA
1. **Campos Esperados no App (Target Schema)**: Uma lista de objetos com o nome da coluna no banco, tipo de dado e descrição curta.
2. **Cabeçalhos da Planilha do Usuário (Source Headers)**: Uma lista de strings contendo os títulos das colunas na planilha importada.

### REGRAS DE NEGÓCIO:
- Se encontrar uma correspondência semântica clara (mesmo que seja sinônimo ou tradução), mapeie-a.
- Associe uma confiança de 0.0 a 1.0 no mapeamento. Se a confiança for menor que 0.6 ou não houver correspondência lógica, defina coluna_mapeada como null.
- Gere uma justificativa simples e amigável em português explicando a relação (ex: "'Lojistas' refere-se aos fornecedores cadastrados").
- Retorne APENAS um objeto JSON válido contendo um array de mapeamentos, sem explicações em markdown fora do JSON.

### FORMATO DE RETORNO (JSON)
{
  "mapeamentos": [
    {
      "coluna_original": "nome da coluna na planilha",
      "coluna_mapeada": "nome da coluna no banco ou null se não houver correspondência",
      "confianca": número de 0 a 1,
      "justificativa": "breve frase explicando o mapeamento"
    }
  ]
}`;

  const userMessage = `
Mapeie as seguintes colunas da planilha para o schema de destino:

Cabeçalhos da Planilha: ${JSON.stringify(sourceHeaders)}

Colunas Alvo do Banco: ${JSON.stringify(targetColumns)}

Retorne o JSON de mapeamentos correspondente.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\n${userMessage}`
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
    let mappingResult;
    try {
      mappingResult = JSON.parse(textResponse.trim());
    } catch (e) {
      console.error('Error parsing Gemini response as JSON. Raw text:', textResponse);
      return res.status(500).json({ error: 'Erro ao analisar a resposta da IA como JSON.' });
    }

    return res.status(200).json(mappingResult);

  } catch (error: any) {
    console.error('Error in map-headers serverless function:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
