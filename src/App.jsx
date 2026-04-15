import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import QualificationTracker from './pages/QualificationTracker';
import AIChat from './pages/AIChat';
import DataSources from './pages/DataSources';
import Workflows from './pages/Workflows';
import AILab from './pages/AILab';
import ContactExplorer from './pages/ContactExplorer';
import EnrichmentEngine from './pages/EnrichmentEngine';
import SmartImport from './pages/SmartImport';
import Events from './pages/Events';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import ManualEnrich from './pages/ManualEnrich';

const PAGE_TITLES = {
  '/':              { title: 'Command Center',         subtitle: 'Live pipeline intelligence — FY2027 Revenue Engine' },
  '/qualify':       { title: 'Qualification Tracker',  subtitle: '5-stage cold → warm pipeline — handoff to SmartCRM' },
  '/assistant':     { title: 'AI Assistant',           subtitle: 'Qualify leads with intelligent conversations' },
  '/sources':       { title: 'Data Sources',           subtitle: 'Multi-source lead data acquisition' },
  '/workflows':     { title: 'Enrichment Flows',       subtitle: 'Waterfall enrichment pipelines' },
  '/ai-lab':        { title: 'AI Lab',                 subtitle: 'LLM-powered lead intelligence' },
  '/contacts':      { title: 'Contact Universe',       subtitle: '24,498 contacts structured by industry — with DQ scoring' },
  '/enrich':        { title: 'AI Enrichment',          subtitle: 'Find missing emails & phones with AI + verification' },
  '/manual-enrich': { title: 'Manual Enrichment',      subtitle: 'Search, edit and update any contact directly in the database' },
  '/import':        { title: 'Smart Import',           subtitle: 'Add leads in any format — AI auto-maps & deduplicates' },
  '/events':        { title: 'Events & Campaigns',     subtitle: 'Campaign and event management' },
  '/reports':       { title: 'Reports',                subtitle: 'Analytics and performance insights' },
  '/admin':         { title: 'Admin Console',          subtitle: 'System configuration and management' },
};

function AppContent() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const pathKey = Object.keys(PAGE_TITLES).find(k => {
    if (k === '/') return location.pathname === '/';
    return location.pathname.startsWith(k);
  }) || '/';

  const { title, subtitle } = PAGE_TITLES[pathKey] || PAGE_TITLES['/'];

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="app-main">
        <Header title={title} subtitle={subtitle} />
        <main className="app-content">
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/qualify"       element={<QualificationTracker />} />
            <Route path="/assistant"     element={<AIChat />} />
            <Route path="/sources"       element={<DataSources />} />
            <Route path="/workflows"     element={<Workflows />} />
            <Route path="/ai-lab"        element={<AILab />} />
            <Route path="/contacts"      element={<ContactExplorer />} />
            <Route path="/enrich"        element={<EnrichmentEngine />} />
            <Route path="/manual-enrich" element={<ManualEnrich />} />
            <Route path="/import"        element={<SmartImport />} />
            <Route path="/events"        element={<Events />} />
            <Route path="/reports"       element={<Reports />} />
            <Route path="/admin"         element={<Admin />} />

            {/* Deprecated routes — redirect gracefully */}
            <Route path="/leads"         element={<Navigate to="/qualify" replace />} />
            <Route path="/leads/:id"     element={<Navigate to="/qualify" replace />} />
            <Route path="/pipeline"      element={<Navigate to="/qualify" replace />} />
            <Route path="/data"          element={<Navigate to="/contacts" replace />} />

            {/* Catch-all */}
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
