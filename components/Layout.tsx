import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { usePreferences } from '../contexts/PreferencesContext';
import NotificationPopover from './NotificationPopover';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, userProfile } = usePreferences();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mobileNotifOpen, setMobileNotifOpen] = React.useState(false);


  const isAdmin = userProfile?.role === 'Administrator';
  const isGestor = userProfile?.role === 'Gestor' || userProfile?.role === 'Supervisor';
  const isTécnico = userProfile?.role === 'Técnico';

  const canAccessProjects = 
    userProfile?.role === 'Gestor' || 
    userProfile?.role === 'Gerente' || 
    userProfile?.role === 'Administrator' || 
    userProfile?.role === 'Admin' || 
    userProfile?.role === 'Supervisor';


  const isActive = (path: string) => location.pathname.includes(path)
    ? 'bg-cyan-500/10 text-[#00d2ff] border border-cyan-500/20 font-bold shadow-[0_0_12px_rgba(6,182,212,0.15)]'
    : 'text-slate-400 hover:text-white hover:bg-[#1f2937]/50 border border-transparent';

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-[#0a0f1d] text-slate-100 transition-colors duration-300 relative print:bg-transparent print:h-auto print:overflow-visible">
      {/* Global Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern-dark opacity-100 pointer-events-none z-0 print:hidden"></div>

      {/* Mobile Header Bar */}
      <div className="print:hidden md:hidden flex h-14 w-full items-center justify-between px-4 bg-[#0a0f1d] border-b border-[#1e293b]/70 z-30 shrink-0 relative">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white hover:text-cyan-400 active:scale-95 transition-all">
          <span className="material-symbols-outlined block">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
        
        <span className="text-white font-display font-bold text-base tracking-tight text-center flex-1">
          Manequip <span className="text-[#00d2ff]">360</span>
        </span>

        <div className="relative">
          <button onClick={() => setMobileNotifOpen(!mobileNotifOpen)} className="p-2 text-white hover:text-cyan-400 active:scale-95 transition-all relative">
            <span className="material-symbols-outlined block text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 size-1.5 bg-rose-500 rounded-full ring-1 ring-slate-900 animate-pulse"></span>
          </button>
          <NotificationPopover isOpen={mobileNotifOpen} onClose={() => setMobileNotifOpen(false)} />
        </div>
      </div>

      {/* Dedicated sidebars for Mobile and Desktop layouts to bypass TV/old-browser reflow and variable transform bugs */}
      {(() => {
        const renderSidebarContent = () => (
          <>
            <div className="flex h-16 items-center px-6 border-b border-[#1f2937] justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00d2ff] to-[#0b84b5] shadow-lg shadow-cyan-500/20">
                  <span className="material-symbols-outlined text-white text-[20px]">precision_manufacturing</span>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-white font-display font-bold text-lg tracking-tight leading-none">Manequip 360</h1>
                  <span className="text-[10px] text-[#00d2ff] font-bold tracking-wider uppercase mt-0.5">Industrial OS</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between h-full p-4 overflow-y-auto">
              <div className="flex flex-col gap-6">
                {/* User Profile Mini */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1f2937]/50 border border-[#374151]/50">
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-[#00d2ff]/20 bg-[#111827] overflow-hidden flex items-center justify-center relative"
                    style={{ backgroundImage: userProfile?.avatar_url ? `url(${userProfile.avatar_url})` : 'none' }}
                  >
                    {!userProfile?.avatar_url && (
                      <span className="material-symbols-outlined text-slate-400">person</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-white text-sm font-bold leading-tight truncate max-w-[140px]">{userProfile?.name || 'Carregando...'}</h1>
                    <p className="text-slate-400 text-xs font-normal truncate max-w-[140px] leading-tight">
                      {userProfile?.job_title || userProfile?.role || '...'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-emerald-500 text-xs font-mono">
                        Online
                      </span>
                    </div>
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
                  <Link to="/app/preventives" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive('preventives')}`}>
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">build_circle</span>
                    <span className="font-medium font-display text-sm">{t('nav_preventives')}</span>
                  </Link>
                  <Link to="/app/map" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive('map')}`}>
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">map</span>
                    <span className="font-medium font-display text-sm">{t('nav_map') || 'Mapa'}</span>
                  </Link>
                  <Link to="/app/inventory" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive('inventory')}`}>
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">category</span>
                    <span className="font-medium font-display text-sm">{t('nav_inventory')}</span>
                  </Link>
                  <Link to="/app/reports" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive('reports')}`}>
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">bar_chart</span>
                    <span className="font-medium font-display text-sm">{t('nav_reports')}</span>
                  </Link>
                  <Link to="/app/announcements" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive('announcements')}`}>
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">campaign</span>
                    <span className="font-medium font-display text-sm">{t('nav_announcements')}</span>
                  </Link>
                  <Link to="/app/dds" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive('dds')}`}>
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">security</span>
                    <span className="font-medium font-display text-sm">{t('nav_dds') || 'DDS'}</span>
                  </Link>
                  <Link to="/app/chat" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive('chat')}`}>
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">smart_toy</span>
                    <span className="font-medium font-display text-sm">{t('nav_chat')}</span>
                  </Link>
                  {canAccessProjects && (
                    <Link to="/app/projects" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive('projects')}`}>
                      <span className="material-symbols-outlined group-hover:scale-110 transition-transform">account_tree</span>
                      <span className="font-medium font-display text-sm">{t('nav_projects')}</span>
                    </Link>
                  )}
                </nav>
              </div>

              <div className="flex flex-col gap-2 border-t border-[#1f2937] pt-4">
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
                <button onClick={async () => {
                  // --- Security: Proper sign out with full cleanup ---
                  await supabase.auth.signOut();
                  localStorage.removeItem('manequip-auth');
                  const isSecure = window.location.protocol === 'https:';
                  document.cookie = `manequip-auth=; path=/; ${isSecure ? 'Secure;' : ''} SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0`;
                  sessionStorage.clear();
                  navigate('/');
                }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-950/20 transition-colors group mt-2">
                  <span className="material-symbols-outlined">logout</span>
                  <span className="font-medium font-display text-sm">{t('nav_logout')}</span>
                </button>
              </div>
            </div>
          </>
        );

        return (
          <>
            {/* Desktop Sidebar (Always relative, hidden on mobile) */}
            <aside className="print:hidden hidden md:flex relative w-72 flex-col border-r border-[#1f2937] bg-[#111827] z-10 h-full shrink-0">
              {renderSidebarContent()}
            </aside>

            {/* Mobile Sidebar (Always fixed, hidden on desktop) */}
            <aside className={`fixed inset-y-0 left-0 w-72 flex flex-col border-r border-[#1f2937] bg-[#111827] z-40 transition-transform duration-300 md:hidden print:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              {renderSidebarContent()}
            </aside>
          </>
        );
      })()}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative pb-16 md:pb-0 transition-all duration-300 print:bg-transparent print:h-auto print:overflow-visible">
        {/* Mobile Header Overlay */}
        {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden print:hidden" onClick={() => setMobileMenuOpen(false)}></div>}
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="print:hidden md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0c101d] border-t border-slate-800/80 flex justify-around items-center z-50 px-2 pb-safe">
        <Link to="/app/dashboard" className={`flex flex-col items-center justify-center flex-1 py-1 relative ${location.pathname.includes('dashboard') ? 'text-[#00d2ff]' : 'text-slate-400'}`}>
          {location.pathname.includes('dashboard') && <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-[#00d2ff] rounded-full"></div>}
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
          <span className="text-[10px] font-medium mt-1">Dashboard</span>
        </Link>
        <Link to="/app/assets" className={`flex flex-col items-center justify-center flex-1 py-1 relative ${location.pathname.includes('assets') ? 'text-[#00d2ff]' : 'text-slate-400'}`}>
          {location.pathname.includes('assets') && <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-[#00d2ff] rounded-full"></div>}
          <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
          <span className="text-[10px] font-medium mt-1">Assets</span>
        </Link>
        <Link to="/app/work-orders" className={`flex flex-col items-center justify-center flex-1 py-1 relative ${location.pathname.includes('work-orders') ? 'text-[#00d2ff]' : 'text-slate-400'}`}>
          {location.pathname.includes('work-orders') && <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-[#00d2ff] rounded-full"></div>}
          <span className="material-symbols-outlined text-[20px]">engineering</span>
          <span className="text-[10px] font-medium mt-1">Work Orders</span>
        </Link>
        <Link to="/app/inventory" className={`flex flex-col items-center justify-center flex-1 py-1 relative ${location.pathname.includes('inventory') ? 'text-[#00d2ff]' : 'text-slate-400'}`}>
          {location.pathname.includes('inventory') && <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-[#00d2ff] rounded-full"></div>}
          <span className="material-symbols-outlined text-[20px]">inventory</span>
          <span className="text-[10px] font-medium mt-1">Inventory</span>
        </Link>
        <Link to="/app/settings" className={`flex flex-col items-center justify-center flex-1 py-1 relative ${location.pathname.includes('settings') ? 'text-[#00d2ff]' : 'text-slate-400'}`}>
          {location.pathname.includes('settings') && <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-[#00d2ff] rounded-full"></div>}
          <span className="material-symbols-outlined text-[20px]">person</span>
          <span className="text-[10px] font-medium mt-1">Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default Layout;