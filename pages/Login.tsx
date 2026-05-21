import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { validateEmail, sanitizeInput, checkLoginRateLimit, recordLoginAttempt, resetLoginRateLimit } from '../services/validation';

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

    // --- Security: Client-side rate limiting ---
    const rateCheck = checkLoginRateLimit();
    if (!rateCheck.allowed) {
      setError(`Muitas tentativas de login. Tente novamente em ${Math.ceil((rateCheck.retryAfterSeconds || 900) / 60)} minutos.`);
      setIsLoading(false);
      return;
    }

    // --- Security: Input validation ---
    const sanitizedEmail = sanitizeInput(email, 320).toLowerCase();
    const emailValidation = validateEmail(sanitizedEmail);
    if (!emailValidation.valid) {
      setError(emailValidation.error || 'Email inválido');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) {
        recordLoginAttempt();
        throw error;
      }

      if (data.session) {
        resetLoginRateLimit();
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // --- Security: Generic error message (don't reveal if email exists) ---
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] font-display text-slate-100 flex relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-sky-500/20 rounded-full blur-[150px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '10s' }}></div>

      {/* Main Container: Split Screen Design */}
      <div className="relative z-10 flex w-full h-screen">
        
        {/* Left Side: Branding & Value Proposition (Hidden on small screens) */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative border-r border-white/5 bg-gradient-to-br from-[#0B1221]/90 to-[#0A0F1C]/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <span className="material-symbols-outlined text-white text-[24px]">hub</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Preventiva <span className="text-sky-400">360</span></h2>
          </div>

          <div className="max-w-xl mx-auto w-full my-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 text-sky-400 text-xs font-semibold mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              Sistema Operacional v2.4.0
            </div>
            
            <h1 className="text-6xl font-black leading-[1.1] mb-6 tracking-tight">
              Gestão Industrial de <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-sky-300">Alta Performance</span>
            </h1>
            
            <p className="text-slate-400 text-lg mb-12 leading-relaxed max-w-md">
              Monitore ativos, preveja falhas e otimize sua operação com a plataforma mais avançada do mercado.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                <div className="size-10 rounded-full bg-sky-500/10 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-sky-400">insights</span>
                </div>
                <h3 className="text-sm font-bold text-white">Analytics em Tempo Real</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Dashboards preditivos e instantâneos para decisões ágeis.</p>
              </div>
              <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                <div className="size-10 rounded-full bg-indigo-500/10 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-indigo-400">security</span>
                </div>
                <h3 className="text-sm font-bold text-white">Segurança Avançada</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Criptografia de ponta a ponta e controle granular de acessos.</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <p>© {new Date().getFullYear()} Manequip Systems. Todos os direitos reservados.</p>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              Todos os sistemas operacionais
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 absolute top-8 left-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <span className="material-symbols-outlined text-white text-[20px]">hub</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Preventiva <span className="text-sky-400">360</span></h2>
          </div>

          <div className="w-full max-w-[420px]">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-white mb-3">Bem-vindo de volta</h2>
              <p className="text-slate-400 text-sm">Insira suas credenciais corporativas para acessar o painel de controle.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-[20px] mt-0.5">error</span>
                <p className="leading-tight">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2 group">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 transition-colors group-focus-within:text-sky-400">E-mail Corporativo</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-500 group-focus-within:text-sky-400 transition-colors">mail</span>
                  <input
                    className="w-full bg-[#111827]/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-sm"
                    placeholder="nome@empresa.com"
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2 group">
                <div className="flex justify-between items-center pl-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest transition-colors group-focus-within:text-sky-400">Senha</label>
                  <Link to="/forgot-password" className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors">Esqueceu a senha?</Link>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-500 group-focus-within:text-sky-400 transition-colors">lock</span>
                  <input
                    className="w-full bg-[#111827]/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-sm"
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
                    className="absolute right-4 text-slate-500 hover:text-white transition-colors focus:outline-none flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                className={`relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 transition-all duration-300 h-[52px] mt-6 shadow-lg shadow-sky-500/25 ${isLoading ? 'opacity-80 cursor-wait' : 'hover:-translate-y-0.5 hover:shadow-sky-500/40'}`}
              >
                {!isLoading && <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full hover:translate-x-full transition-transform duration-700 ease-in-out"></div>}
                <span className="relative flex items-center justify-center gap-2 text-white font-bold text-sm tracking-wide">
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      AUTENTICANDO...
                    </>
                  ) : (
                    <>
                      ENTRAR NO SISTEMA
                      <span className="material-symbols-outlined text-[18px]">login</span>
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-slate-500 text-sm">
                Ainda não tem acesso? <Link to="/register" className="text-white font-bold hover:text-sky-400 transition-colors ml-1 border-b border-white/20 hover:border-sky-400/50 pb-0.5">Solicite uma conta</Link>
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Login;