import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import LeadInbox from './pages/LeadInbox';
import LeadDetail from './pages/LeadDetail';
import PipelineBoard from './pages/PipelineBoard';
import AIChat from './pages/AIChat';
import DataSources from './pages/DataSources';
import Workflows from './pages/Workflows';
import AILab from './pages/AILab';
import LeadDatabase from './pages/LeadDatabase';
import ContactExplorer from './pages/ContactExplorer';
import EnrichmentEngine from './pages/EnrichmentEngine';
import SmartImport from './pages/SmartImport';
import Events from './pages/Events';
import Reports from './pages/Reports';
import Admin from './pages/Admin';

const PAGE_TITLES = {
  '/': { title: 'Dashboard', subtitle: 'Lead Intelligence Hub — Executive Overview' },
  '/leads': { title: 'Lead Inbox', subtitle: 'View and manage all incoming leads' },
  '/pipeline': { title: 'Pipeline Board', subtitle: 'Visual pipeline management' },
  '/assistant': { title: 'AI Assistant', subtitle: 'Qualify leads with intelligent conversations' },
  '/sources': { title: 'Data Sources', subtitle: 'Multi-source lead data acquisition' },
  '/workflows': { title: 'Enrichment Flows', subtitle: 'Waterfall enrichment pipelines' },
  '/ai-lab': { title: 'AI Lab', subtitle: 'LLM-powered lead intelligence' },
  '/data': { title: 'Lead Database', subtitle: 'Enriched data table & webhook exports' },
  '/contacts': { title: 'Contact Explorer', subtitle: '24,498 real contacts structured by industry' },
  '/enrich': { title: 'AI Enrichment', subtitle: 'Find missing emails & phones with AI + verification' },
  '/import': { title: 'Smart Import', subtitle: 'Add leads in any format — AI auto-maps & deduplicates' },
  '/events': { title: 'Events', subtitle: 'Campaign and event management' },
  '/reports': { title: 'Reports', subtitle: 'Analytics and performance insights' },
  '/admin': { title: 'Admin Console', subtitle: 'System configuration and management' },
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
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<LeadInbox />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/pipeline" element={<PipelineBoard />} />
            <Route path="/assistant" element={<AIChat />} />
            <Route path="/sources" element={<DataSources />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/ai-lab" element={<AILab />} />
            <Route path="/data" element={<LeadDatabase />} />
            <Route path="/contacts" element={<ContactExplorer />} />
            <Route path="/enrich" element={<EnrichmentEngine />} />
            <Route path="/import" element={<SmartImport />} />
            <Route path="/events" element={<Events />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/admin" element={<Admin />} />
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
