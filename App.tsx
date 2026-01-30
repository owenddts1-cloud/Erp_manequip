import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Assets from './pages/Assets';
import Inventory from './pages/Inventory';
import WorkOrders from './pages/WorkOrders';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';
import TicketDetails from './pages/TicketDetails';
import Calendar from './pages/Calendar';

import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  React.useEffect(() => {
    // --- NUCLEAR CLEANUP (Fix for 431 Error) ---
    // This runs ONCE to wipe the massive "dirty" cookies/tokens causing the blockage.
    const hasCleaned = localStorage.getItem('cleanup_v2_done');
    if (!hasCleaned) {
      console.log('🧹 Executing Emergency Cleanup V2...');

      // 1. Wipe LocalStorage (Supabase tokens)
      localStorage.clear();

      // 2. Wipe SessionStorage
      sessionStorage.clear();

      // 3. Wipe all Cookies (The main culprit for 431)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // 4. Mark as done so it doesn't loop
      localStorage.setItem('cleanup_v2_done', 'true');

      // 5. Restore correct theme/mode if needed
      localStorage.setItem('theme', 'dark');

      // 6. Force reload to clear memory
      window.location.reload();
      return;
    }
    // ---------------------------------------------

    const compact = localStorage.getItem('compact') === 'true';
    document.documentElement.classList.toggle('compact-mode', compact);
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<Layout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="chat" element={<Chat />} />
            <Route path="assets" element={<Assets />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="work-orders" element={<WorkOrders />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="users" element={<Users />} />
            <Route path="ticket/:id" element={<TicketDetails />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;