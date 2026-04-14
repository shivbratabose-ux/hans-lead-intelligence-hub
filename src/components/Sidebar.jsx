import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  Kanban,
  Bot,
  CalendarDays,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  GitBranch,
  Sparkles,
  TableProperties,
  Users,
  Wand2,
  FileUp,
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { section: 'Main' },
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/leads', label: 'Lead Inbox', icon: Inbox, badge: 8 },
  { path: '/pipeline', label: 'Pipeline Board', icon: Kanban },
  { path: '/assistant', label: 'AI Assistant', icon: Bot },
  { section: 'Data Engine' },
  { path: '/sources', label: 'Data Sources', icon: Database },
  { path: '/workflows', label: 'Enrichment Flows', icon: GitBranch },
  { path: '/ai-lab', label: 'AI Lab', icon: Sparkles, badge: 'NEW' },
  { path: '/data', label: 'Lead Database', icon: TableProperties },
  { path: '/contacts', label: 'Contact Explorer', icon: Users, badge: '24.5K' },
  { path: '/enrich', label: 'AI Enrichment', icon: Wand2, badge: 'AI' },
  { path: '/import', label: 'Smart Import', icon: FileUp },
  { section: 'Manage' },
  { path: '/events', label: 'Events', icon: CalendarDays },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/admin', label: 'Admin', icon: Settings },
];

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
