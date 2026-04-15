import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Bot,
  CalendarDays,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  GitBranch,
  Sparkles,
  Users,
  Wand2,
  FileUp,
  ClipboardEdit,
  ExternalLink,
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { section: 'Command Center' },
  { path: '/',           label: 'Dashboard',             icon: LayoutDashboard },
  { path: '/qualify',    label: 'Qualification Tracker', icon: Target,    badge: 'NEW' },
  { path: '/assistant',  label: 'AI Assistant',          icon: Bot },

  { section: 'Contact Universe' },
  { path: '/contacts',      label: 'Contact Universe',  icon: Users,        badge: '24.5K' },
  { path: '/enrich',        label: 'AI Enrichment',     icon: Wand2,        badge: 'AI' },
  { path: '/manual-enrich', label: 'Manual Enrich',     icon: ClipboardEdit },
  { path: '/import',        label: 'Smart Import',      icon: FileUp },

  { section: 'Intelligence' },
  { path: '/sources',    label: 'Data Sources',          icon: Database },
  { path: '/workflows',  label: 'Enrichment Flows',      icon: GitBranch },
  { path: '/ai-lab',     label: 'AI Lab',                icon: Sparkles,  badge: 'AI' },

  { section: 'Operations' },
  { path: '/events',     label: 'Events & Campaigns',    icon: CalendarDays },
  { path: '/reports',    label: 'Reports',               icon: BarChart3 },
  { path: '/admin',      label: 'Admin',                 icon: Settings },
];

const CRM_LINK = 'https://smartcrm-hans.vercel.app';

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">H</div>
        <div className="sidebar-brand">
          <span className="sidebar-brand-name">Hans Infomatic</span>
          <span className="sidebar-brand-sub">Lead Intelligence Hub</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, i) => {
          if (item.section) {
            return (
              <div key={i} className="sidebar-section-label">
                {item.section}
              </div>
            );
          }
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon />
              <span className="sidebar-link-text">{item.label}</span>
              {item.badge && (
                <span className="sidebar-link-badge">{item.badge}</span>
              )}
            </NavLink>
          );
        })}

        {/* CRM Handoff Link */}
        <div className="sidebar-section-label" style={{ marginTop: 8 }}>CRM Handoff</div>
        <a
          href={CRM_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-link sidebar-crm-link"
        >
          <ExternalLink />
          <span className="sidebar-link-text">SmartCRM ↗</span>
        </a>
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-collapse-btn" onClick={onToggle}>
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
