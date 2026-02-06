import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { usePreferences } from '../contexts/PreferencesContext';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, userProfile } = usePreferences();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);


  const isAdmin = userProfile?.role === 'Administrator';
  const isGestor = userProfile?.role === 'Gestor';
  const isTécnico = userProfile?.role === 'Técnico';


  const isActive = (path: string) => location.pathname.includes(path)
    ? 'bg-primary/20 text-primary border border-primary/30 font-bold'
    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#020617] text-[var(--text-main)] transition-colors duration-300 relative">
      {/* Global Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none z-0"></div>
      {/* Mobile Toggle */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg bg-surface-dark border border-border-dark text-white shadow-lg">
          <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed md:fixed inset-y-0 left-0 w-72 flex flex-col border-r border-[var(--border-color)] bg-[var(--surface-color)] backdrop-blur-sm z-40 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex h-16 items-center px-6 border-b border-[var(--border-color)] justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-700 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-[20px]">precision_manufacturing</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-slate-900 dark:text-white font-display font-bold text-lg tracking-tight leading-none">Preventiva 360</h1>
              <span className="text-[10px] text-primary font-bold tracking-wider uppercase mt-0.5">Industrial OS</span>
            </div>
          </div>
          {/* Close button for mobile inside sidebar/header optional, but toggle outside works */}
        </div>

        {/* ... (rest of sidebar content) ... */}

        <div className="flex flex-col justify-between h-full p-4 overflow-y-auto">
          <div className="flex flex-col gap-6">
            {/* User Profile Mini */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)]">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-primary/20 bg-[var(--surface-color)] overflow-hidden flex items-center justify-center relative"
                style={{ backgroundImage: userProfile?.avatar_url ? `url(${userProfile.avatar_url})` : 'none' }}
              >
                {!userProfile?.avatar_url && (
                  <span className="material-symbols-outlined text-slate-400">person</span>
                )}
              </div>
              <div className="flex flex-col">
                <h1 className="text-[var(--text-main)] text-sm font-bold leading-tight truncate max-w-[140px]">{userProfile?.name || 'Carregando...'}</h1>
                <p className="text-[var(--text-secondary)] text-xs font-normal truncate max-w-[140px]">
                  {userProfile?.job_title || userProfile?.role || '...'}
                </p>
              </div>
            </div>


            <nav className="flex flex-col gap-1">
              <Link to="/app/dashboard" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive('dashboard')}`}>
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">dashboard</span>
                <span className="font-medium font-display text-sm">{t('nav_dashboard')}</span>
              </Link>
              <Link to="/app/assets" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive('assets')}`}>
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">inventory_2</span>
                <span className="font-medium font-display text-sm">{t('nav_assets')}</span>
              </Link>
              <Link to="/app/work-orders" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive('work-orders')}`}>
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">assignment</span>
                <span className="font-medium font-display text-sm">{t('nav_work_orders')}</span>
              </Link>
              <Link to="/app/inventory" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive('inventory')}`}>
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">category</span>
                <span className="font-medium font-display text-sm">{t('nav_inventory')}</span>
              </Link>
              {(isAdmin || isGestor) && (
                <Link to="/app/reports" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive('reports')}`}>
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">bar_chart</span>
                  <span className="font-medium font-display text-sm">{t('nav_reports')}</span>
                </Link>
              )}
            </nav>
          </div>

          <div className="flex flex-col gap-2 border-t border-border-dark pt-4">
            <Link to="/app/users" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive('users')}`}>
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                {isAdmin ? 'group' : isGestor ? 'how_to_reg' : 'person_edit'}
              </span>
              <span className="font-medium font-display text-sm">
                {isAdmin ? 'Usuários' : isGestor ? 'Aprovações' : 'Alterar Senha'}
              </span>
            </Link>
            <Link to="/app/settings" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive('settings')}`}>
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">settings</span>
              <span className="font-medium font-display text-sm">{t('nav_settings')}</span>
            </Link>
            <button onClick={() => navigate('/')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 dark:text-text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group mt-2">
              <span className="material-symbols-outlined">logout</span>
              <span className="font-medium font-display text-sm">{t('nav_logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative md:ml-72 transition-all duration-300">
        {/* Mobile Header Overlay */}
        {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;