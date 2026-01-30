import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        cargo: '',
        senha: '',
        confirmarSenha: ''
    });
    const [loading, setLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const calculateStrength = (password: string) => {
        let strength = 0;
        if (password.length > 7) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    const strength = calculateStrength(formData.senha);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.senha !== formData.confirmarSenha) {
            setError('As senhas não coincidem.');
            return;
        }

        if (!termsAccepted) {
            setError('Você precisa aceitar os Termos de Uso.');
            return;
        }

        try {
            setLoading(true);
            const cleanEmail = formData.email.replace(/\s/g, '').toLowerCase(); // Remove all spaces and lowercase

            const { data, error: authError } = await supabase.auth.signUp({
                email: cleanEmail,
                password: formData.senha,
                options: {
                    data: {
                        full_name: formData.nome,
                        job_title: formData.cargo,
                    }
                }
            });

            if (authError) throw authError;

            alert('Cadastro realizado! Sua conta foi criada e está aguardando aprovação de um administrador. Você será notificado por e-mail quando o acesso for liberado.');
            navigate('/');
        } catch (err: any) {
            console.error(err);
            let errorMessage = err.message || 'Erro ao criar conta.';

            // Translate common Supabase errors
            if (errorMessage.includes('already registered')) {
                errorMessage = 'Este e-mail já está cadastrado. Tente fazer login ou recupere sua senha.';
            } else if (errorMessage.includes('invalid') || errorMessage.includes('valid email')) {
                errorMessage = 'O endereço de e-mail informado é inválido. Verifique se há erros de digitação.';
            } else if (errorMessage.includes('password')) {
                errorMessage = 'A senha não atende aos requisitos de segurança.';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
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
                    <h2 className="text-xl font-bold tracking-tight">Preventiva <span className="text-primary">360</span></h2>
                </div>
                <Link to="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Voltar para Login</Link>
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    <div className="glass-panel rounded-2xl p-8 w-full relative overflow-hidden group border border-border-dark bg-surface-dark/50 backdrop-blur-xl">
                        <div className="mb-8 text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">Criar Nova Conta</h2>
                            <p className="text-slate-400 text-sm">Junte-se à equipe de manutenção de alta performance.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Nome Completo</label>
                                <div className="flex items-center w-full bg-slate-900/50 border border-border-dark rounded-lg transition-colors duration-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                                    <span className="material-symbols-outlined text-slate-500 pl-4">person</span>
                                    <input name="nome" value={formData.nome} onChange={handleChange} className="w-full bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 h-10 text-sm" placeholder="Seu nome" required type="text" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">E-mail Corporativo</label>
                                <div className="flex items-center w-full bg-slate-900/50 border border-border-dark rounded-lg transition-colors duration-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                                    <span className="material-symbols-outlined text-slate-500 pl-4">mail</span>
                                    <input name="email" value={formData.email} onChange={handleChange} className="w-full bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 h-10 text-sm" placeholder="nome@empresa.com" required type="email" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Cargo / Função</label>
                                <div className="relative">
                                    <select name="cargo" value={formData.cargo} onChange={handleChange} className="w-full bg-slate-900/50 border border-border-dark rounded-lg text-white appearance-none pl-4 pr-10 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm">
                                        <option value="" disabled>Selecione seu cargo</option>
                                        <option value="tecnico">Técnico de Manutenção</option>
                                        <option value="engenheiro">Engenheiro / Supervisor</option>
                                        <option value="operador">Operador de Máquina</option>
                                        <option value="gestor">Gestor de Planta</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Senha</label>
                                    <div className="flex items-center w-full bg-slate-900/50 border border-border-dark rounded-lg transition-colors duration-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                                        <span className="material-symbols-outlined text-slate-500 pl-3">lock</span>
                                        <input name="senha" value={formData.senha} onChange={handleChange} className="w-full bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 h-10 text-sm" placeholder="••••••••" required type="password" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Confirmar</label>
                                    <div className="flex items-center w-full bg-slate-900/50 border border-border-dark rounded-lg transition-colors duration-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                                        <span className="material-symbols-outlined text-slate-500 pl-3">lock_reset</span>
                                        <input name="confirmarSenha" value={formData.confirmarSenha} onChange={handleChange} className="w-full bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 h-10 text-sm" placeholder="••••••••" required type="password" />
                                    </div>
                                </div>
                            </div>

                            {/* Password Strength */}
                            {formData.senha && (
                                <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden flex">
                                    <div className={`h-full ${strength >= 1 ? 'bg-red-500' : 'bg-transparent'} w-1/4 transition-all duration-300`}></div>
                                    <div className={`h-full ${strength >= 2 ? 'bg-orange-500' : 'bg-transparent'} w-1/4 transition-all duration-300`}></div>
                                    <div className={`h-full ${strength >= 3 ? 'bg-yellow-500' : 'bg-transparent'} w-1/4 transition-all duration-300`}></div>
                                    <div className={`h-full ${strength >= 4 ? 'bg-emerald-500' : 'bg-transparent'} w-1/4 transition-all duration-300`}></div>
                                </div>
                            )}

                            <div
                                className="flex items-start gap-2 pt-2 relative z-20 cursor-pointer group/checkbox"
                                onClick={() => setTermsAccepted(!termsAccepted)}
                            >
                                <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={termsAccepted}
                                    className={`mt-0.5 text-primary transition-colors focus:outline-none ${termsAccepted ? 'text-primary' : 'text-slate-500 hover:text-slate-400'}`}
                                >
                                    <span className="material-symbols-outlined text-[24px]">
                                        {termsAccepted ? 'check_box' : 'check_box_outline_blank'}
                                    </span>
                                </button>
                                <div className="text-xs text-slate-400 select-none leading-relaxed">
                                    Li e concordo com os <a href="#" className="text-primary hover:underline hover:text-cyan-400 relative z-30" onClick={(e) => e.stopPropagation()}>Termos de Uso</a> e <a href="#" className="text-primary hover:underline hover:text-cyan-400 relative z-30" onClick={(e) => e.stopPropagation()}>Política de Privacidade</a> da organização.
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 mb-4 text-sm text-red-500 bg-red-400/10 border border-red-500/20 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <button type="submit" disabled={loading} className="relative w-full overflow-hidden rounded-lg group bg-primary hover:bg-sky-600 transition-all duration-300 h-12 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                                <span className="relative flex items-center justify-center gap-2 text-white font-bold text-sm tracking-wide">
                                    {loading ? 'CRIANDO...' : 'CRIAR CONTA'}
                                    {!loading && <span className="material-symbols-outlined text-sm">person_add</span>}
                                </span>
                            </button>
                        </form>
                    </div>
                    <div className="mt-6 text-center">
                        <p className="text-slate-500 text-xs">
                            Já possui credenciais? <Link to="/" className="text-white font-medium hover:text-primary transition-colors ml-1">Fazer login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
