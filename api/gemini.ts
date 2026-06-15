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

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-3.5-flash'}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Você é um assistente especialista em manutenção industrial (Manequip 360). Responda de forma técnica, direta e útil para engenheiros e técnicos.

${dbContext || ''}

Usuário: ${message}`
                    }]
                }]
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API error status:', response.status, data);
            return res.status(response.status).json({ error: data.error?.message || 'Gemini API returned an error' });
        }

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta da IA.';
        return res.status(200).json({ text: textResponse });

    } catch (error: any) {
        console.error('Error in Gemini serverless function:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
