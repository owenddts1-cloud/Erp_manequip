import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Falha ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark font-display text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[128px] pointer-events-none"></div>

      <div className="relative z-10 w-full px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3 text-white">
          <div className="size-8 text-primary animate-pulse">
            <span className="material-symbols-outlined text-[32px]">hub</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Preventiva <span className="text-primary">360</span></h2>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center p-4 lg:p-0">
        <div className="hidden lg:flex flex-1 flex-col justify-center items-start px-20 h-full relative">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              Sistema Operacional v2.4.0 Online
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Gestão Industrial de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-300">Alta Performance</span>
            </h1>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Monitore ativos, preveja falhas e otimize sua operação com a plataforma mais avançada do mercado. Sua manutenção, redefinida.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-dark border border-border-dark">
                <span className="material-symbols-outlined text-primary">insights</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Analytics em Tempo Real</h3>
                  <p className="text-xs text-slate-500 mt-1">Dashboards preditivos instantâneos.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-dark border border-border-dark">
                <span className="material-symbols-outlined text-primary">security</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Segurança Avançada</h3>
                  <p className="text-xs text-slate-500 mt-1">Criptografia de ponta a ponta.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[480px] lg:mr-20">
          <div className="glass-panel rounded-2xl p-8 lg:p-10 w-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>
            <div className="relative z-10">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Acesse sua conta</h2>
                <p className="text-slate-400 text-sm">Entre com suas credenciais corporativas.</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">E-mail Corporativo</label>
                  <div className="flex items-center w-full bg-slate-900/50 border border-border-dark rounded-lg transition-colors duration-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                    <span className="material-symbols-outlined text-slate-500 pl-4">mail</span>
                    <input
                      className="w-full bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 h-12 text-sm"
                      placeholder="nome@empresa.com"
                      required
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Senha</label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:text-cyan-400 transition-colors">Esqueci minha senha</Link>
                  </div>
                  <div className="flex items-center w-full bg-slate-900/50 border border-border-dark rounded-lg transition-colors duration-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                    <span className="material-symbols-outlined text-slate-500 pl-4">lock</span>
                    <input
                      className="w-full bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 h-12 text-sm"
                      placeholder="••••••••"
                      required
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="pr-4 text-slate-500 hover:text-white transition-colors focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className={`relative w-full overflow-hidden rounded-lg group bg-primary hover:bg-sky-600 transition-all duration-300 h-12 mt-4 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {!isLoading && <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>}
                  <span className="relative flex items-center justify-center gap-2 text-white font-bold text-sm tracking-wide">
                    {isLoading ? 'ACESSANDO...' : 'ENTRAR NO SISTEMA'}
                    {!isLoading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                  </span>
                </button>
              </form>
              <div className="mt-8 pt-6 border-t border-border-dark text-center">
                <p className="text-slate-500 text-xs">
                  Ainda não tem acesso? <Link to="/register" className="text-white font-medium hover:text-primary transition-colors ml-1">Criar conta</Link>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-between text-[10px] text-slate-600 uppercase tracking-widest px-2">
            <span>Server: SA-EAST-1</span>
            <span>Status: <span className="text-emerald-500">Operational</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;