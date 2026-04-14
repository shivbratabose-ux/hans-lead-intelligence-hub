import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Filter, Download } from 'lucide-react';
import LEADS from '../data/leads';
import './LeadInbox.css';

const ITEMS_PER_PAGE = 12;
const SOURCES = ['All', 'Web Chat', 'Event', 'Email', 'WhatsApp', 'Ad', 'Import'];
const BANDS = ['All', 'Hot', 'Warm', 'Cold'];
const STATUSES = ['All', 'New', 'Contacted', 'Demo Scheduled', 'Qualified', 'Opportunity', 'Disqualified'];

export default function LeadInbox() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('score');
  const [sortDir, setSortDir] = useState('desc');
  const [filterBand, setFilterBand] = useState('All');
  const [filterSource, setFilterSource] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = [...LEADS];
    if (filterBand !== 'All') list = list.filter(l => l.band === filterBand);
    if (filterSource !== 'All') list = list.filter(l => l.source === filterSource);
    if (filterStatus !== 'All') list = list.filter(l => l.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.product.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filterBand, filterSource, filterStatus, search, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageLeads = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const hotCount = filtered.filter(l => l.band === 'Hot').length;
  const warmCount = filtered.filter(l => l.band === 'Warm').length;
  const coldCount = filtered.filter(l => l.band === 'Cold').length;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === pageLeads.length) {
      setSelected([]);
    } else {
      setSelected(pageLeads.map(l => l.id));
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  return (
    <div className="lead-inbox animate-in">
      {/* Stats strip */}
      <div className="inbox-stats">
        <div className="inbox-stat">Showing <strong>{filtered.length}</strong> leads</div>
        <div className="inbox-stat-divider" />
        <div className="inbox-stat">🔥 <strong>{hotCount}</strong> Hot</div>
        <div className="inbox-stat-divider" />
        <div className="inbox-stat">🌡️ <strong>{warmCount}</strong> Warm</div>
        <div className="inbox-stat-divider" />
        <div className="inbox-stat">❄️ <strong>{coldCount}</strong> Cold</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="input"
            placeholder="Search leads..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 200 }}
          />
          <button className="btn btn-outline btn-sm"><Download size={14} /> Export</button>
        </div>
      </div>

      {/* Filters */}
      <div className="inbox-filters">
        <div className="filter-group">
          <span className="filter-label">Score</span>
          <div className="filter-pills">
            {BANDS.map(b => (
              <button key={b} className={`filter-pill ${filterBand === b ? 'active' : ''}`}
                onClick={() => { setFilterBand(b); setPage(1); }}>{b}</button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">Source</span>
          <select className="select" value={filterSource}
            onChange={e => { setFilterSource(e.target.value); setPage(1); }}>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">Status</span>
          <select className="select" value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="inbox-bulk-actions">
          <strong>{selected.length} selected</strong>
          <button className="btn btn-primary btn-sm">Assign To...</button>
          <button className="btn btn-outline btn-sm">Change Status</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected([])}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="inbox-table-wrap">
        <table className="inbox-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input type="checkbox" checked={selected.length === pageLeads.length && pageLeads.length > 0}
                  onChange={toggleAll} />
              </th>
              <th onClick={() => handleSort('name')} className={sortField === 'name' ? 'sorted' : ''}>
                Name <SortIcon field="name" />
              </th>
              <th>Company</th>
              <th onClick={() => handleSort('product')} className={sortField === 'product' ? 'sorted' : ''}>
                Product <SortIcon field="product" />
              </th>
              <th onClick={() => handleSort('score')} className={sortField === 'score' ? 'sorted' : ''}>
                Score <SortIcon field="score" />
              </th>
              <th>Source</th>
              <th onClick={() => handleSort('status')} className={sortField === 'status' ? 'sorted' : ''}>
                Status <SortIcon field="status" />
              </th>
              <th>Owner</th>
              <th onClick={() => handleSort('createdAt')} className={sortField === 'createdAt' ? 'sorted' : ''}>
                Date <SortIcon field="createdAt" />
              </th>
            </tr>
          </thead>
          <tbody>
            {pageLeads.map(lead => (
              <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                <td className="checkbox-col" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.includes(lead.id)}
                    onChange={() => toggleSelect(lead.id)} />
                </td>
                <td>
                  <div className="lead-name-cell">
                    <div className="avatar" style={{ background: `hsl(${lead.name.charCodeAt(0) * 7 % 360}, 55%, 50%)` }}>
                      {lead.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="lead-name-text">{lead.name}</div>
                      <div className="lead-company-text">{lead.title}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: '#64748B', fontSize: '13px' }}>{lead.company}</td>
                <td><span className="badge badge-primary">{lead.product}</span></td>
                <td><span className={`badge badge-${lead.band.toLowerCase()}`}>{lead.score} — {lead.band}</span></td>
                <td><span className="source-badge">{lead.source}</span></td>
                <td><span className="badge badge-neutral">{lead.status}</span></td>
                <td style={{ fontSize: '13px', color: '#64748B' }}>{lead.assignedName}</td>
                <td style={{ fontSize: '12px', color: '#94A3B8' }}>
                  {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="inbox-pagination">
          <span className="pagination-info">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="pagination-controls">
            <button className="pagination-btn" disabled={page === 1}
              onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} className={`pagination-btn ${page === i + 1 ? 'active' : ''}`}
                onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="pagination-btn" disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
