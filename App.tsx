import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for code splitting & performance optimization
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Chat = React.lazy(() => import('./pages/Chat'));
const Assets = React.lazy(() => import('./pages/Assets'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const WorkOrders = React.lazy(() => import('./pages/WorkOrders'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Announcements = React.lazy(() => import('./pages/Announcements'));
const DDS = React.lazy(() => import('./pages/DDS'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Users = React.lazy(() => import('./pages/Users'));
const TicketDetails = React.lazy(() => import('./pages/TicketDetails'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const Preventives = React.lazy(() => import('./pages/Preventives'));
const GLPIIntegration = React.lazy(() => import('./pages/GLPIIntegration'));
const Projects = React.lazy(() => import('./pages/Projects'));
const Map = React.lazy(() => import('./pages/Map'));
const RedeTA = React.lazy(() => import('./pages/RedeTA'));

const PageLoader: React.FC = () => {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#050B14] text-slate-100">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-[#00d2ff] text-4xl animate-spin">progress_activity</span>
        <span className="text-xs text-slate-400 font-mono tracking-widest uppercase">Carregando Sistema...</span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  React.useEffect(() => {
    const compact = localStorage.getItem('compact') === 'true';
    document.documentElement.classList.toggle('compact-mode', compact);
  }, []);

  return (
    <HashRouter>
      <React.Suspense fallback={<PageLoader />}>
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
              <Route path="projects" element={<Projects />} />
              <Route path="rede-ta" element={<RedeTA />} />
              <Route path="assets" element={<Assets />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="work-orders" element={<WorkOrders />} />
              <Route path="preventives" element={<Preventives />} />
              <Route path="map" element={<Map />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="reports" element={<Reports />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="dds" element={<DDS />} />
              <Route path="settings" element={<Settings />} />
              <Route path="users" element={<Users />} />
              <Route path="ticket/:id" element={<TicketDetails />} />
              <Route path="glpi" element={<GLPIIntegration />} />
            </Route>
          </Route>
        </Routes>
      </React.Suspense>
      <Analytics />
    </HashRouter>
  );
};

export default App;