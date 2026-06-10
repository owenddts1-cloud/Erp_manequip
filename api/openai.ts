import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const { message, model, dbContext } = req.body || {};

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI API key is not configured on the server.' });
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model || 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `Você é um assistente especialista em manutenção industrial (Manequip 360). Responda de forma técnica, direta e útil para engenheiros e técnicos.

${dbContext || ''}`
                    },
                    { role: 'user', content: message },
                ],
                temperature: 0.7,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenAI API error status:', response.status, data);
            return res.status(response.status).json({ error: data.error?.message || 'OpenAI API returned an error' });
        }

        const textResponse = data.choices?.[0]?.message?.content || 'Sem resposta da IA.';
        return res.status(200).json({ text: textResponse });

    } catch (error: any) {
        console.error('Error in OpenAI serverless function:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
