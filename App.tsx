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