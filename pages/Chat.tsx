import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToAI, AIProvider, AIConfig, AVAILABLE_MODELS } from '../services/aiService';
import { usePreferences } from '../contexts/PreferencesContext';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  time: string;
  isLoading?: boolean;
}

const Chat: React.FC = () => {
  const { userProfile } = usePreferences();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: `Olá, ${userProfile?.name?.split(' ')[0] || 'Gestor'}! Sou o Assistente Preventiva 360.\n\nEstou conectado aos dados em tempo real da sua planta. Como posso otimizar a sua manutenção hoje?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
  }, [messages, isProcessing]);

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
      const responseText = await sendMessageToAI(userMsg.text, aiConfig);

      const aiMsg: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `⚠️ Houve uma falha de comunicação com o servidor de IA. Por favor, tente novamente mais tarde.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050B14] relative font-display overflow-hidden text-slate-200">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-50 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen opacity-50"></div>
      
      <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/5 bg-slate-950/40 px-6 lg:px-12 backdrop-blur-xl z-20 relative shadow-2xl shadow-black/20">
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 shadow-[0_0_20px_-5px_rgba(14,165,233,0.4)]">
            <span className="material-symbols-outlined text-white text-[22px]">auto_awesome</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-white text-[15px] font-bold tracking-wide">Preventiva AI</h2>
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
              <span className="text-emerald-400/80 text-[11px] font-mono font-medium tracking-wider uppercase">Sistema Operacional</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300 backdrop-blur-md shadow-inner shadow-white/5"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span className="hidden sm:inline">Modelo: {aiConfig.provider.toUpperCase()}</span>
          </button>

          <button 
            onClick={() => setMessages([])} 
            title="Limpar Conversa"
            className="flex items-center justify-center size-[34px] rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all duration-300"
          >
            <span className="material-symbols-outlined text-[18px]">mop</span>
          </button>

          {showSettings && (
            <div className="absolute top-[52px] right-0 w-72 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] p-5 z-50 transform origin-top-right transition-all animate-fade-in-up">
              <h3 className="text-white text-sm font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">memory</span>
                Motor de Inteligência
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5 block">Provedor API</label>
                  <select
                    value={aiConfig.provider}
                    onChange={(e) => {
                      const newProvider = e.target.value as AIProvider;
                      setAiConfig({ provider: newProvider, model: AVAILABLE_MODELS[newProvider][0].id });
                    }}
                    className="w-full bg-black/40 text-white text-xs rounded-xl border border-white/10 p-2.5 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all appearance-none"
                  >
                    <option value="gemini">Google Gemini (Free Tier)</option>
                    <option value="openai">OpenAI (Enterprise)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1.5 block">Modelo de Linguagem</label>
                  <select
                    value={aiConfig.model}
                    onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                    className="w-full bg-black/40 text-white text-xs rounded-xl border border-white/10 p-2.5 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:outline-none transition-all appearance-none"
                  >
                    {AVAILABLE_MODELS[aiConfig.provider].map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full mt-5 bg-gradient-to-r from-primary to-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-[0_0_15px_-3px_rgba(14,165,233,0.4)]"
              >
                Aplicar Configurações
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-32 py-8 scroll-smooth z-10 custom-scrollbar">
        <div className="flex justify-center mb-8">
          <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase bg-white/5 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
            Sessão Criptografada
          </span>
        </div>

        <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up w-full`}>
              <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {msg.sender === 'ai' ? (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 shadow-lg relative mt-1">
                    <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
                    <div className="absolute -bottom-1 -right-1 size-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                  </div>
                ) : (
                  <div className="size-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/10 shadow-lg flex items-center justify-center mt-1 overflow-hidden">
                     {userProfile?.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="User" className="w-full h-full object-cover" />
                     ) : (
                        <span className="material-symbols-outlined text-white text-[20px]">person</span>
                     )}
                  </div>
                )}

                <div className={`flex flex-col gap-1.5 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`relative px-5 py-3.5 text-[14px] leading-relaxed shadow-2xl backdrop-blur-md ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-br from-primary to-blue-600 text-white rounded-2xl rounded-tr-sm border border-white/10 shadow-primary/20' 
                      : 'bg-slate-800/80 text-slate-200 rounded-2xl rounded-tl-sm border border-white/5 shadow-black/20'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className="text-slate-500 text-[10px] font-mono px-1 flex items-center gap-1">
                    {msg.time} {msg.sender === 'user' && <span className="material-symbols-outlined text-[12px] text-primary">done_all</span>}
                  </span>
                </div>

              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start animate-fade-in-up w-full">
              <div className="flex gap-3 max-w-[85%]">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-white/10 shadow-lg mt-1 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent animate-pulse"></div>
                   <span className="material-symbols-outlined text-primary text-[20px] animate-spin">sync</span>
                </div>
                <div className="bg-slate-800/80 rounded-2xl rounded-tl-sm border border-white/5 px-5 py-4 flex items-center gap-2 backdrop-blur-md">
                  <span className="size-2 rounded-full bg-primary animate-bounce"></span>
                  <span className="size-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="size-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <div className="z-20 relative p-4 md:p-6 lg:px-32 bg-gradient-to-t from-[#050B14] via-[#050B14]/90 to-transparent pt-12">
        <div className="mx-auto max-w-4xl w-full">
          
          <div className="flex w-full gap-2.5 overflow-x-auto pb-4 scrollbar-hide px-1">
            {['Analisar Injetora 04', 'Resumo de Falhas', 'Gerar Relatório OEE'].map((suggestion) => (
              <button 
                key={suggestion} 
                onClick={() => setInputValue(suggestion)} 
                className="whitespace-nowrap flex h-8 shrink-0 items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 px-4 transition-all duration-300 backdrop-blur-md cursor-pointer group"
              >
                <span className="material-symbols-outlined text-primary text-[14px] group-hover:scale-110 transition-transform">bolt</span>
                <p className="text-slate-300 text-xs font-medium tracking-wide">{suggestion}</p>
              </button>
            ))}
          </div>

          <div className="relative flex items-end gap-2 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 p-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
            <button className="flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-colors" title="Anexar arquivo">
              <span className="material-symbols-outlined text-[22px]">add_circle</span>
            </button>
            
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              className="flex-1 resize-none bg-transparent py-3 text-[15px] text-white placeholder:text-slate-500 focus:outline-none max-h-32 min-h-[44px] custom-scrollbar"
              placeholder="Descreva o problema ou peça uma análise de dados..."
              rows={1}
            ></textarea>
            
            <button 
              onClick={handleSendMessage} 
              disabled={!inputValue.trim() || isProcessing}
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 shadow-lg ${
                inputValue.trim() && !isProcessing
                  ? 'bg-gradient-to-br from-primary to-blue-600 text-white shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95' 
                  : 'bg-white/5 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] ml-1">send</span>
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Chat;