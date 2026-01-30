import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToAI, AIProvider, AIConfig, AVAILABLE_MODELS } from '../services/aiService';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  time: string;
  isLoading?: boolean;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Olá, Eng. Carlos. Sou o Assistente Preventiva 360. Como posso ajudar com a manutenção hoje?',
      time: '09:12'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>({ provider: 'openai', model: 'gpt-4o-mini' });
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);

    try {
      console.log(`Enviando mensagem para ${aiConfig.provider}...`);
      const responseText = await sendMessageToAI(userMsg.text, aiConfig);
      console.log("Resposta recebida com sucesso.");

      const aiMsg: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      const errorMsg: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `⚠️ Erro no sistema: ${error.message || 'Falha na comunicação'}. Verifique se as chaves API estão no .env.local e se há conexão com a internet. Detalhes: ${JSON.stringify(error)}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-dark relative">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-dark bg-background-dark/80 px-6 backdrop-blur-md z-10 sticky top-0">
        <div className="flex flex-col">
          <h2 className="text-white text-lg font-bold tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">smart_toy</span>
            Assistente Preventiva 360
          </h2>
          <p className="text-slate-400 text-xs pl-8">Online • V 2.4.0 • {aiConfig.provider.toUpperCase()} ({aiConfig.model})</p>
        </div>
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 rounded-lg border border-border-dark px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-surface-dark hover:text-white transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">settings</span>
            <span className="hidden sm:inline">Configurar IA</span>
          </button>

          <button onClick={() => setMessages([])} className="flex items-center gap-2 rounded-lg border border-border-dark px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-surface-dark hover:text-white hover:border-danger/50 hover:text-danger transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
          </button>

          {showSettings && (
            <div className="absolute top-12 right-0 w-64 bg-surface-dark border border-border-dark rounded-xl shadow-2xl p-4 z-50 animate-fade-in-up">
              <h3 className="text-white text-sm font-bold mb-3 border-b border-border-dark pb-2">Configuração do Modelo</h3>

              <div className="mb-3">
                <label className="text-xs text-slate-400 block mb-1">Provedor</label>
                <select
                  value={aiConfig.provider}
                  onChange={(e) => {
                    const newProvider = e.target.value as AIProvider;
                    setAiConfig({
                      provider: newProvider,
                      model: AVAILABLE_MODELS[newProvider][0].id
                    });
                  }}
                  className="w-full bg-background-dark text-white text-xs rounded border border-border-dark p-2 focus:border-primary focus:outline-none"
                >
                  <option value="gemini">Google Gemini (Gratuito)</option>
                  <option value="openai">OpenAI (Pago)</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="text-xs text-slate-400 block mb-1">Modelo</label>
                <select
                  value={aiConfig.model}
                  onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                  className="w-full bg-background-dark text-white text-xs rounded border border-border-dark p-2 focus:border-primary focus:outline-none"
                >
                  {AVAILABLE_MODELS[aiConfig.provider].map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full bg-primary/20 text-primary text-xs font-bold py-2 rounded hover:bg-primary/30 transition-colors"
              >
                Concluir
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:px-32 md:pt-12 scroll-smooth">
        <div className="flex justify-center mb-6">
          <span className="text-[10px] font-mono text-slate-600 bg-surface-dark px-3 py-1 rounded-full border border-border-dark">Hoje</span>
        </div>

        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'items-end justify-end' : 'items-start'} gap-3 animate-fade-in-up`}>
              {msg.sender === 'ai' && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-dark border border-primary/30 shadow-[0_0_15px_-3px_rgba(14,165,233,0.3)]">
                  <span className="material-symbols-outlined text-primary text-lg">smart_toy</span>
                </div>
              )}

              <div className={`flex max-w-[85%] md:max-w-[70%] flex-col gap-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-5 py-3 shadow-lg ${msg.sender === 'user' ? 'rounded-br-none bg-gradient-to-br from-primary to-sky-600 text-white shadow-primary/10 border border-primary/20' : 'rounded-tl-none border border-border-dark bg-surface-dark/90 text-slate-300 backdrop-blur-sm'}`}>
                  <p className="text-sm md:text-base font-normal leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-slate-500 text-[10px] font-mono pr-1">{msg.time}</span>
              </div>

              {msg.sender === 'user' && (
                <div className="bg-center bg-no-repeat bg-cover rounded-full h-8 w-8 shrink-0 ring-2 ring-surface-dark shadow-lg" style={{ backgroundImage: 'url("https://picsum.photos/100")' }}></div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-start gap-4 animate-fade-in-up">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-dark border border-primary/30">
                <span className="material-symbols-outlined text-primary text-lg animate-spin">sync</span>
              </div>
              <div className="flex items-center gap-1 pt-3">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '100ms' }}></span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '200ms' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="z-20">
        <div className="bg-surface-dark/80 backdrop-blur-xl border-t border-border-dark px-4 pb-6 pt-2">
          <div className="mx-auto flex max-w-4xl flex-col gap-3">
            <div className="flex w-full gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
              {['Gerar Gráfico Comparativo', 'Histórico de Manutenção', 'Lista de Peças'].map((suggestion) => (
                <button key={suggestion} onClick={() => { setInputValue(suggestion); /* Auto-focus or future auto-send logic */ }} className="whitespace-nowrap flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-primary/50 px-3 transition-all backdrop-blur-md cursor-pointer relative z-30">
                  <p className="text-slate-300 text-[11px] font-medium">{suggestion}</p>
                </button>
              ))}
            </div>

            <div className="relative flex items-end gap-2 rounded-xl bg-background-dark/60 border border-border-dark p-2 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/60 transition-all shadow-lg ring-offset-2 ring-offset-background-dark/0">
              <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors" title="Anexar arquivo">
                <span className="material-symbols-outlined text-[20px]">attach_file</span>
              </button>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                className="flex-1 resize-none bg-transparent py-2.5 text-sm md:text-base text-white placeholder:text-slate-500 focus:outline-none max-h-32 min-h-[44px]"
                placeholder="Digite sua pergunta ou comando para a IA..."
                rows={1}
              ></textarea>
              <button onClick={handleSendMessage} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover transition-all shadow-[0_0_15px_-5px_rgba(14,165,233,0.6)] hover:shadow-[0_0_20px_-5px_rgba(14,165,233,0.8)] hover:scale-105 active:scale-95">
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
            <div className="flex justify-between items-center px-1">
              <p className="text-[10px] text-slate-500 font-mono">
                Preventiva AI pode cometer erros. Verifique manuais críticos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;