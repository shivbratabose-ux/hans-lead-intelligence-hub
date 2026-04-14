import { Search, Bell } from 'lucide-react';
import './Header.css';

export default function Header({ title, subtitle }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="header-page-info">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="header-search">
        <Search className="header-search-icon" />
        <input type="text" placeholder="Search leads, companies, events..." />
      </div>

      <div className="header-right">
        <button className="header-notification-btn">
          <Bell size={20} />
          <span className="header-notification-dot" />
        </button>

        <div className="header-user">
          <div className="header-user-avatar">RK</div>
          <div className="header-user-info">
            <span className="header-user-name">Rajiv Khanna</span>
            <span className="header-user-role">Sales Manager</span>
          </div>
        </div>
      </div>
    </header>
  );
}
