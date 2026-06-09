import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus(null);

        // Sanitize email
        const cleanEmail = email.replace(/\s/g, '').toLowerCase();

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
                redirectTo: `${window.location.origin}/#/reset-password`, // Placeholder redirect
            });

            if (error) throw error;

            setStatus({
                type: 'success',
                message: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha em instantes.'
            });
        } catch (err: any) {
            console.error('Reset password error:', err);
            // We usually don't want to reveal if an email exists or not for security, 
            // but Supabase might throw specific errors. We'll show a generic error or the specific one if harmless.
            let errorMessage = 'Falha ao enviar e-mail de recuperação.';
            if (err.message.includes('rate limit')) {
                errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
            }
            setStatus({ type: 'error', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-dark font-display text-slate-100 flex flex-col relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[size:40px_40px] opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)' }}></div>
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[128px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[128px] pointer-events-none"></div>

            <div className="relative z-10 w-full px-8 py-6 flex justify-between items-center">
                <div className="flex items-center gap-3 text-white">
                    <div className="size-8 text-primary animate-pulse">
                        <span className="material-symbols-outlined text-[32px]">hub</span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Manequip <span className="text-[#00d2ff]">360</span></h2>
                </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-[480px]">
                    <div className="glass-panel rounded-2xl p-8 lg:p-10 w-full relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">Recuperar Senha</h2>
                                <p className="text-slate-400 text-sm">Informe seu e-mail para receber as instruções.</p>
                            </div>

                            {status && (
                                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${status.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-500' : 'bg-red-500/10 border border-red-500/50 text-red-500'}`}>
                                    <span className="material-symbols-outlined text-[18px]">{status.type === 'success' ? 'check_circle' : 'error'}</span>
                                    {status.message}
                                </div>
                            )}

                            <form onSubmit={handleReset} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">E-mail Corporativo</label>
                                    <div className="flex items-center w-full bg-slate-900/50 border border-border-dark rounded-lg transition-colors duration-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                                        <span className="material-symbols-outlined text-slate-500 pl-4">mail</span>
                                        <input
                                            className="w-full bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 h-12 text-sm"
                                            placeholder="nome@empresa.com"
                                            required
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button type="submit" disabled={isLoading} className={`relative w-full overflow-hidden rounded-lg group bg-primary hover:bg-sky-600 transition-all duration-300 h-12 mt-4 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                    {!isLoading && <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>}
                                    <span className="relative flex items-center justify-center gap-2 text-white font-bold text-sm tracking-wide">
                                        {isLoading ? 'ENVIANDO...' : 'ENVIAR LINK DE RECUPERAÇÃO'}
                                        {!isLoading && <span className="material-symbols-outlined text-sm">send</span>}
                                    </span>
                                </button>
                            </form>

                            <div className="mt-8 pt-6 border-t border-border-dark text-center">
                                <p className="text-slate-500 text-xs">
                                    Lembrou sua senha? <Link to="/" className="text-white font-medium hover:text-primary transition-colors ml-1">Voltar para o login</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
