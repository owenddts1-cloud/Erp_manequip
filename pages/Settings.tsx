import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

// --- Sub-components (Stylized for Industrial OS) ---

const InputSetting: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder: string; disabled?: boolean }> = ({ label, value, onChange, placeholder, disabled }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] px-4 py-2.5 text-[var(--text-main)] focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:cursor-not-allowed disabled:bg-[var(--bg-color)]/50"
    />
  </div>
);

const SelectSetting: React.FC<{ label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }> = ({ label, options, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] px-4 py-2.5 text-[var(--text-main)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary pr-10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
        <span className="material-symbols-outlined text-xl">expand_more</span>
      </div>
    </div>
  </div>
);

const ToggleSetting: React.FC<{ label: string, desc: string, checked?: boolean, onChange?: (val: boolean) => void }> = ({ label, desc, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <div className="flex flex-col">
      <span className="font-medium text-[var(--text-main)]">{label}</span>
      <span className="text-sm text-[var(--text-secondary)]">{desc}</span>
    </div>
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange?.(e.target.checked)} />
      <div className="w-11 h-6 bg-[var(--border-color)] rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/40 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
  </div>
);

// --- Main Settings Component ---

const Settings: React.FC = () => {
  const { t, themeMode, setThemeMode, language, setLanguage, timezone, setTimezone } = usePreferences();

  const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'admin'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    job_title: '',
    email: '',
    avatar_url: ''
  });

  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('compact') === 'true');

  // API Admin State
  const [apiSettings, setApiSettings] = useState<any[]>([]);
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{ key: string, value: string } | null>(null);
  const [isAddKeyOpen, setIsAddKeyOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState({ key: '', value: '', description: '' });

  // Initial Load
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch from profiles table (Source of Truth)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setProfile({
          name: profileData?.full_name || user.user_metadata?.full_name || '',
          job_title: profileData?.job_title || user.user_metadata?.job_title || '',
          email: user.email || '',
          avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url || ''
        });

        const jobTitle = (profileData?.job_title || user.user_metadata?.job_title || '').toLowerCase();
        const userRole = (profileData?.role || user.user_metadata?.role || '').toLowerCase();

        const isAdm = user.email === 'admin@manequip.com' || user.email === 'data@manequip.com' ||
          userRole === 'administrator' || userRole === 'gestor' ||
          jobTitle.includes('admin') || jobTitle.includes('gestor');

        setIsAdmin(isAdm);
        if (isAdm) fetchApiSettings();
      }
    };
    loadProfile();
  }, []);

  // Update Compact Mode Class
  useEffect(() => {
    document.documentElement.classList.toggle('compact-mode', compactMode);
    localStorage.setItem('compact', compactMode.toString());
  }, [compactMode]);

  const fetchApiSettings = async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('*')
      .eq('is_top_secret', false);
    if (data) setApiSettings(data);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB antes da compressão.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // Compress the image using an off-screen canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setProfile(prev => ({ ...prev, avatar_url: compressedDataUrl }));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Sessão expirada. Por favor, saia e entre novamente.');
      }

      // Update auth user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.name,
          job_title: profile.job_title,
          avatar_url: profile.avatar_url
        }
      });

      if (error) throw error;

      // ALSO update profiles table so sidebar syncs correctly
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.name,
          job_title: profile.job_title,
          avatar_url: profile.avatar_url
        })
        .eq('id', session.user.id);

      if (profileError) {
        console.warn('Profile table update failed:', profileError.message);
      }

      // Force session refresh and local reload to ensure metadata is updated everywhere
      await supabase.auth.refreshSession();

      alert(t('msg_success') || 'Configurações atualizadas!');
      window.location.reload();
    } catch (error: any) {
      console.error('Error saving:', error);
      alert(`${t('msg_error') || 'Erro ao salvar'}: ${error.message || error.error_description || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const requestUpdateKey = (key: string, newValue: string) => {
    setPendingUpdate({ key, value: newValue });
    setIsConfirmOpen(true);
  };

  const confirmUpdateKey = async () => {
    if (!pendingUpdate) return;
    const { error } = await supabase
      .from('system_settings')
      .update({ value: pendingUpdate.value })
      .eq('key', pendingUpdate.key);

    if (!error) {
      alert(`Chave ${pendingUpdate.key} atualizada!`);
      fetchApiSettings();
    }
    setIsConfirmOpen(false);
    setPendingUpdate(null);
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('system_settings').insert([{
      key: newKeyData.key,
      value: newKeyData.value,
      description: newKeyData.description,
      category: 'Geral',
      is_top_secret: false
    }]);

    if (!error) {
      setIsAddKeyOpen(false);
      setNewKeyData({ key: '', value: '', description: '' });
      fetchApiSettings();
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:px-8 md:py-8 overflow-y-auto max-w-4xl mx-auto w-full gap-8 animate-in fade-in duration-500 bg-transparent">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">{t('config_title')}</h1>
        <p className="text-[var(--text-secondary)] mt-1">{t('config_subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--surface-color)] rounded-xl border border-[var(--border-color)] self-start">
        <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-[var(--bg-color)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'}`}>
          {t('settings.profile')}
        </button>
        <button onClick={() => setActiveTab('system')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'system' ? 'bg-[var(--bg-color)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'}`}>
          {t('settings.system')}
        </button>
        {isAdmin && (
          <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'admin' ? 'bg-[var(--bg-color)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'}`}>
            {t('settings.admin')}
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1">

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col items-center gap-4">
              <div
                className="size-24 rounded-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] flex items-center justify-center overflow-hidden cursor-pointer relative group"
                style={profile.avatar_url ? { backgroundImage: `url("${profile.avatar_url}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                {!profile.avatar_url && <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)]">person</span>}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full text-white">
                  <span className="material-symbols-outlined">edit</span>
                </div>
              </div>
              <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
              <p className="text-sm text-[var(--text-secondary)]">{t('settings.avatar_helper')}</p>
            </div>

            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 space-y-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputSetting label={t('settings.label_name')} value={profile.name} onChange={(v) => setProfile(p => ({ ...p, name: v }))} placeholder={t('settings.placeholder_name')} />
                <InputSetting label={t('settings.label_role') || "Cargo"} value={profile.job_title} onChange={(v) => setProfile(p => ({ ...p, job_title: v }))} placeholder={t('settings.placeholder_role') || "Ex: Técnico de Manutenção"} />
                <div className="col-span-1 md:col-span-2 opacity-60">
                  <InputSetting label={t('settings.label_email')} value={profile.email} onChange={() => { }} placeholder="" disabled />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 space-y-6 animate-in slide-in-from-right-4 duration-300 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectSetting
                label={t('label_language')}
                options={[{ value: 'pt', label: 'Português (BR)' }, { value: 'en', label: 'English (US)' }, { value: 'es', label: 'Español' }]}
                value={language}
                onChange={setLanguage}
              />
              <SelectSetting
                label={t('label_timezone')}
                options={[{ value: '(GMT-03:00) Brasília', label: '(GMT-03:00) Brasília' }, { value: 'UTC', label: 'UTC' }]}
                value={timezone}
                onChange={setTimezone}
              />
              <SelectSetting
                label={t('label_theme')}
                options={[{ value: 'light', label: t('theme.light') }, { value: 'dark', label: t('theme.dark') }, { value: 'contrast', label: t('theme.contrast') }]}
                value={themeMode}
                onChange={(v) => setThemeMode(v as any)}
              />
            </div>
            <div className="border-t border-[var(--border-color)] pt-6">
              <ToggleSetting
                label={t('label_compact')}
                desc="Reduz o espaçamento para exibir mais dados na tela."
                checked={compactMode}
                onChange={setCompactMode}
              />
            </div>
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-color)] pb-4">
                <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                <div>
                  <h3 className="font-bold text-[var(--text-main)]">{t('settings.section_admin_title')}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{t('settings.section_admin_desc')}</p>
                </div>
              </div>

              <div className="space-y-3">
                {apiSettings.map(setting => (
                  <div key={setting.key} className="flex flex-col gap-2 p-3 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] group">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-primary font-mono">{setting.key}</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">{setting.description}</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type={showApiKeys[setting.key] ? "text" : "password"}
                          defaultValue={setting.value}
                          id={`key-${setting.key}`}
                          className="w-full bg-[var(--surface-color)] border border-[var(--border-color)] rounded px-3 py-1.5 text-xs text-[var(--text-main)] font-mono outline-none"
                        />
                        <button onClick={() => setShowApiKeys(p => ({ ...p, [setting.key]: !p[setting.key] }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                          <span className="material-symbols-outlined text-sm">{showApiKeys[setting.key] ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                      <button
                        onClick={() => requestUpdateKey(setting.key, (document.getElementById(`key-${setting.key}`) as HTMLInputElement).value)}
                        className="px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded hover:bg-primary hover:text-white transition-all whitespace-nowrap uppercase"
                      >
                        {t('settings.btn_save_key')}
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setIsAddKeyOpen(true)} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-primary transition-colors mt-4">
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  {t('settings.btn_add_key')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Persistence Action Button */}
      <div className="flex justify-end pt-4 border-t border-[var(--border-color)]">
        <button
          onClick={handleSaveProfile}
          disabled={isLoading}
          className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-sky-400 text-white rounded-xl font-bold shadow-neon transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <><span className="animate-spin material-symbols-outlined">progress_activity</span> {t('btn_saving')}</>
          ) : (
            <><span className="material-symbols-outlined">save</span> {t('btn_save')}</>
          )}
        </button>
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">Confirmar Mudança</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">Deseja realmente atualizar a chave <strong>{pendingUpdate?.key}</strong>?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsConfirmOpen(false)} className="px-4 py-2 text-[var(--text-secondary)] font-medium">Cancelar</button>
              <button onClick={confirmUpdateKey} className="px-5 py-2 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Key Modal */}
      {isAddKeyOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-[var(--text-main)] mb-4">Adicionar Chave</h3>
            <form onSubmit={handleAddKey} className="space-y-4">
              <InputSetting label="Nome da Chave" value={newKeyData.key} onChange={v => setNewKeyData(p => ({ ...p, key: v.toUpperCase().replace(/\s/g, '_') }))} placeholder="Ex: GOOGLE_MAPS_KEY" />
              <InputSetting label="Valor" value={newKeyData.value} onChange={v => setNewKeyData(p => ({ ...p, value: v }))} placeholder="Cole a chave aqui" />
              <InputSetting label="Descrição" value={newKeyData.description} onChange={v => setNewKeyData(p => ({ ...p, description: v }))} placeholder="Para que serve?" />
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                <button type="button" onClick={() => setIsAddKeyOpen(false)} className="px-4 py-2 text-[var(--text-secondary)] font-medium">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-primary text-white font-bold rounded-lg">Salvar Chave</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;