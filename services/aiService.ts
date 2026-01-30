
// Interface for AI response
export interface AIServiceResponse {
    text: string;
    error?: boolean;
}

// Current supported models
export type AIProvider = 'openai' | 'gemini';
export type OpenAIModel = 'gpt-4o-mini' | 'gpt-3.5-turbo';
export type GeminiModel = 'gemini-2.0-flash' | 'gemini-1.5-flash' | 'gemini-1.5-pro';

export interface AIConfig {
    provider: AIProvider;
    model: string;
}

import { sendMessageToOpenAI } from './openaiService';
import { sendMessageToGemini } from './geminiService';

export const sendMessageToAI = async (message: string, config: AIConfig): Promise<string> => {
    switch (config.provider) {
        case 'openai':
            return sendMessageToOpenAI(message, config.model);
        case 'gemini':
            return sendMessageToGemini(message, config.model);
        default:
            throw new Error(`Provedor de IA desconhecido: ${config.provider}`);
    }
};

export const AVAILABLE_MODELS = {
    openai: [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ],
    gemini: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Rápido/Gratuito)' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
    ]
};
