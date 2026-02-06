import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

const Users: React.FC = () => {
  const { userProfile } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'perfil' | 'cadastros' | 'aprovacoes'>('perfil');

  const role = userProfile?.role || 'Técnico';
  const isAdmin = role === 'Administrator';
  const isGestor = role === 'Gestor';

  useEffect(() => {
    // Prevent infinite loop by checking if profile actually loaded
    if (!userProfile?.id) return;

    const controller = new AbortController();
    fetchUserData(controller.signal);

    return () => controller.abort();
    // Dependency on specific fields, not the whole object, to prevent loops
  }, [userProfile?.id, userProfile?.role, isAdmin, isGestor]);

  const fetchUserData = async (signal?: AbortSignal) => {
    if (!userProfile) return;

    // Check if component is unmounted
    if (signal?.aborted) return;

    setLoading(true);
    // Do NOT reset error immediately to avoid flickering if it's a background refresh

    try {
      if (isAdmin || isGestor) {
        // Parallel requests for better performance
        const pPriority = isAdmin
          ? supabase.from('profiles').select('*')
          : isGestor
            ? supabase.from('profiles').select('*').eq('role', 'Técnico')
            : Promise.resolve({ data: [], error: null });

        const pPending = supabase.from('profiles').select('*').eq('is_approved', false);

        const [usersRes, pendingRes] = await Promise.all([pPriority, pPending]);

        if (signal?.aborted) return;

        if (usersRes.error) throw usersRes.error;
        if (pendingRes.error) throw pendingRes.error;

        // Stable updates
        setAllUsers(prev => JSON.stringify(prev) !== JSON.stringify(usersRes.data) ? (usersRes.data || []) : prev);
        setPendingUsers(prev => JSON.stringify(prev) !== JSON.stringify(pendingRes.data) ? (pendingRes.data || []) : prev);

        setError(null); // Clear error only on success
      }
    } catch (err: any) {
      if (signal?.aborted) return;
      console.error("Error fetching user data:", err);
      // Only set error if it's not a cancellation
      if (err.name !== 'AbortError') {
        setError(err.message || "Falha ao carregar dados.");
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleApprove = async (userId: string, approve: boolean) => {
    // Get current user role first so we don't override it
    const { data: userProfile } = await supabase.from('profiles').select('role').eq('id', userId).single();

    const { error } = await supabase
      .from('profiles')
      .update({
        is_approved: approve,
        // Only set role if rejecting, otherwise keep current role
        ...(approve ? {} : { role: 'Rejected' })
      })
      .eq('id', userId);

    if (error) alert("Erro: " + error.message);
    else {
      alert(approve ? `Usuário aprovado como ${userProfile?.role || 'Técnico'}!` : "Cadastro recusado.");
      fetchUserData();
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-background-dark">
      <span className="material-symbols-outlined text-primary animate-spin text-4xl">progress_activity</span>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-10 relative bg-transparent">

      <div className="relative z-10 mx-auto max-w-5xl flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center mb-4">
          <h2 className="text-4xl font-black tracking-tight text-white mb-2">Usuários e Permissões</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            {isAdmin ? 'Gerencie permissões, aprove novos acessos e administre os níveis de acesso ao sistema.' : isGestor ? 'Aprovação de acessos e listagem de técnicos da unidade.' : 'Gerencie suas informações de acesso e segurança.'}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="material-symbols-outlined">error</span>
            <span className="text-sm font-bold">Erro de sincronização: {error}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-center border-b border-border-dark gap-4 md:gap-12">
          <button
            onClick={() => setActiveTab('perfil')}
            className={`flex items-center gap-2 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'perfil' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <span className="material-symbols-outlined">person</span> <span className="hidden sm:inline">Minha Conta</span>
          </button>

          {(isAdmin || isGestor) && (
            <button
              onClick={() => setActiveTab('cadastros')}
              className={`flex items-center gap-2 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'cadastros' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              <span className="material-symbols-outlined">badge</span> <span className="hidden sm:inline">{isAdmin ? 'Gestão de Usuários' : 'Listagem de Técnicos'}</span>
            </button>
          )}

          {(isAdmin || isGestor) && (
            <button
              onClick={() => setActiveTab('aprovacoes')}
              className={`flex items-center gap-2 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'aprovacoes' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              <div className="relative flex items-center gap-2">
                <span className="material-symbols-outlined">how_to_reg</span>
                <span className="hidden sm:inline">Aprovações</span>
                {pendingUsers.length > 0 && <span className="size-2 bg-red-500 rounded-full animate-pulse ml-1"></span>}
              </div>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-500">
          {activeTab === 'perfil' && (
            <div className="mx-auto w-full max-w-2xl">
              <PasswordUpdateCard />
            </div>
          )}

          {activeTab === 'cadastros' && (isAdmin || isGestor) && (
            <div className="flex flex-col gap-8">
              {(isAdmin || isGestor) && (
                <div className="glass-panel rounded-xl border border-border-dark p-6 shadow-2xl bg-surface-dark/80">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">person_add</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white leading-none mb-1">Novo Cadastro Manual</h3>
                      <p className="text-xs text-slate-400">Registre novos administradores, gestores ou técnicos diretamente.</p>
                    </div>
                  </div>
                  <AdminRegistrationForm onRefresh={fetchUserData} />
                </div>
              )}

              <div className="glass-panel rounded-xl border border-border-dark p-6 bg-surface-dark/80 overflow-hidden">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">group</span>
                    {isAdmin ? 'Todos os Usuários' : 'Técnicos Ativos'}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{allUsers.length} usuários</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border-dark/50 text-[10px] font-bold uppercase text-slate-400">
                        <th className="px-4 py-3">Nome / Perfil</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Nível</th>
                        <th className="px-4 py-3">Status</th>
                        {isAdmin && <th className="px-4 py-3 text-right">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dark/30">
                      {allUsers.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-slate-500 italic">Nenhum usuário encontrado.</td></tr>
                      ) : (
                        allUsers.map((u) => (
                          <tr key={u.id} className="text-sm text-slate-300 hover:bg-white/5 transition-colors group">
                            <td className="px-4 py-4 font-medium text-white">{u.full_name}</td>
                            <td className="px-4 py-4 font-mono text-xs">{u.email}</td>
                            <td className="px-4 py-4">
                              {isAdmin && u.email !== 'admin@manequip.com' ? (
                                <select
                                  value={u.role}
                                  onChange={async (e) => {
                                    const newRole = e.target.value;
                                    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', u.id);
                                    if (error) alert('Erro: ' + error.message);
                                    else fetchUserData();
                                  }}
                                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-white cursor-pointer focus:border-primary outline-none"
                                >
                                  <option value="Administrator">Admin</option>
                                  <option value="Gestor">Gestor</option>
                                  <option value="Técnico">Técnico</option>
                                </select>
                              ) : (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${u.role === 'Administrator' ? 'bg-red-500/10 text-red-500 border-red-500/20' : u.role === 'Gestor' ? 'bg-sky-500/10 text-sky-500 border-sky-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                  {u.role === 'Administrator' ? 'Admin' : u.role}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${u.is_approved ? 'text-emerald-500' : 'text-slate-500'}`}>
                                <span className={`size-1.5 rounded-full ${u.is_approved ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                                {u.is_approved ? 'Ativo' : 'Pendente'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              {isAdmin && u.email !== 'admin@manequip.com' && (
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Excluir usuário ${u.full_name || u.email}?\nEsta ação não pode ser desfeita.`)) return;

                                    console.log('Attempting to delete user:', u.id, u.email);

                                    const { error, count } = await supabase
                                      .from('profiles')
                                      .delete()
                                      .eq('id', u.id)
                                      .select();

                                    console.log('Delete result:', { error, count });

                                    if (error) {
                                      console.error('Delete error:', error);
                                      alert('Erro ao excluir: ' + error.message);
                                    } else {
                                      alert('Usuário removido com sucesso.');
                                      fetchUserData();
                                    }
                                  }}
                                  className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all"
                                  title="Excluir usuário"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'aprovacoes' && (isAdmin || isGestor) && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">pending_actions</span>
                  Aprovações Pendentes
                </h3>
                <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider">{pendingUsers.length} Aguardando</span>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="text-center py-16 rounded-xl border border-dashed border-border-dark bg-white/5">
                  <span className="material-symbols-outlined text-slate-600 text-5xl mb-4 opacity-20">verified_user</span>
                  <p className="text-slate-500 text-sm font-medium italic">Nenhuma solicitação pendente no momento.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingUsers.map((user) => (
                    <div key={user.id} className="glass-panel p-5 rounded-xl border border-border-dark bg-surface-dark flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-amber-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold border border-amber-500/20">
                          {user.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{user.full_name || 'Usuário Novo'}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                            <span className="material-symbols-outlined text-[14px]">mail</span> {user.email}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <button onClick={() => handleApprove(user.id, false)} className="flex-1 md:flex-none px-4 py-2.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors text-sm font-bold">
                          Recusar
                        </button>
                        <button onClick={() => handleApprove(user.id, true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-lg hover:shadow-emerald-500/20">
                          <span className="material-symbols-outlined text-[18px]">done_all</span>
                          Aprovar Técnico
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminRegistrationForm: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'Técnico'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      alert("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (!confirm("Atenção: Ao criar um novo usuário neste modo, você será desconectado e logado como o novo usuário (Limitação do sistema sem Backend). Deseja continuar?")) {
      return;
    }

    setLoading(true);
    try {
      // Strict sanitization: Remove anything that is NOT a letter, number, @, dot, underscore, or dash.
      const cleanEmail = formData.email.replace(/[^a-zA-Z0-9@._-]/g, '').toLowerCase();

      // DEBUG: Verify what is actually being sent
      console.log("Tentando cadastrar email sanitizado:", cleanEmail);

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role,
            is_approved: true // Admins bypass approval
          }
        }
      });
      if (error) throw error;

      // Directly update profile to ensure role is correctly set
      // Wait a moment for trigger to create the profile first
      if (data?.user?.id) {
        await new Promise(r => setTimeout(r, 500)); // Small delay for trigger

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: cleanEmail,
            full_name: formData.full_name,
            role: formData.role,
            is_approved: true
          }, { onConflict: 'id' });

        if (profileError) {
          console.warn('Profile update warning:', profileError.message);
        }
      }

      alert(`Usuário ${formData.full_name} registrado como ${formData.role}!`);
      setFormData({ full_name: '', email: '', password: '', role: 'Técnico' });
      onRefresh();
    } catch (err: any) {
      alert("Erro ao cadastrar: " + (err.message || err.error_description || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
      <Input
        label="Nome Completo"
        placeholder="João Silva"
        value={formData.full_name}
        onChange={v => setFormData({ ...formData, full_name: v })}
        required
      />
      <Input
        label="E-mail"
        placeholder="tecnico@manequip.com"
        type="email"
        value={formData.email}
        onChange={v => setFormData({ ...formData, email: v.trim() })}
        required
      />
      <Input
        label="Senha"
        placeholder="••••••••"
        type="password"
        value={formData.password}
        onChange={v => setFormData({ ...formData, password: v })}
        required
      />
      <div className="flex flex-col gap-1.5 w-full">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Nível de Acesso</span>
        <select
          value={formData.role}
          onChange={e => setFormData({ ...formData, role: e.target.value })}
          className="bg-background-dark border border-border-dark rounded-lg p-2.5 text-white text-sm outline-none focus:border-primary transition-all cursor-pointer"
          required
        >
          <option value="Técnico">Técnico</option>
          <option value="Gestor">Gestor</option>
          <option value="Administrator">Administrador</option>
        </select>
      </div>
      <div className="lg:col-span-4 flex justify-end mt-2">
        <button
          disabled={loading}
          className="w-full md:w-auto bg-primary hover:bg-sky-400 text-white font-bold py-2.5 px-8 rounded-lg transition-all shadow-neon disabled:opacity-50"
          type="submit"
        >
          {loading ? 'Processando...' : 'Cadastrar e Autorizar'}
        </button>
      </div>
    </form>
  );
};

const PasswordUpdateCard: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return alert("As senhas não coincidem!");
    if (newPassword.length < 6) return alert("A senha deve ter pelo menos 6 caracteres.");

    setUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdating(false);

    if (error) alert("Erro ao atualizar: " + error.message);
    else {
      alert("Senha atualizada com sucesso!");
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="glass-panel rounded-xl border border-border-dark p-6 shadow-2xl bg-surface-dark/80 w-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">lock_reset</span>
        </div>
        <div>
          <h3 className="font-bold text-white leading-none mb-1">Atualizar Senha</h3>
          <p className="text-xs text-slate-400">Escolha uma nova senha segura para sua conta.</p>
        </div>
      </div>
      <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nova Senha"
            placeholder="••••••••"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            required
          />
          <Input
            label="Confirmar Senha"
            placeholder="••••••••"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
          />
        </div>
        <div className="flex justify-end pt-2">
          <button
            disabled={updating}
            className="w-full md:w-auto bg-primary hover:bg-sky-400 text-white font-bold py-2.5 px-8 rounded-lg transition-all shadow-neon disabled:opacity-50"
            type="submit"
          >
            {updating ? 'Atualizando...' : 'Salvar Nova Senha'}
          </button>
        </div>
      </form>
    </div>
  );
};

const Input: React.FC<{
  label: string,
  placeholder: string,
  type?: string,
  value: string,
  onChange: (v: string) => void,
  required?: boolean
}> = ({ label, placeholder, type = 'text', value, onChange, required }) => (
  <div className="flex flex-col gap-1.5 w-full text-left">
    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{label}</span>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-background-dark border border-border-dark rounded-lg p-2.5 text-white text-sm outline-none focus:border-primary transition-all placeholder:text-slate-600"
      placeholder={placeholder}
      type={type}
      required={required}
    />
  </div>
);

export default Users;