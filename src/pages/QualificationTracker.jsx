import { useState, useEffect, useCallback } from 'react';
import {
  Target, Search, X, RefreshCw, ChevronLeft, ChevronRight,
  ArrowRight, ExternalLink, CheckCircle2, AlertCircle,
  Loader2, Mail, Phone, Link2, Building2, Flame,
  Eye, LayoutGrid, List, Filter,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { INDUSTRY_COLORS, INDUSTRY_ICONS } from '../data/realContacts';
import { DQBadge } from '../components/DQBadge';
import './QualificationTracker.css';

const CRM_URL = 'https://smartcrm-hans.vercel.app';
const PER_PAGE = 30;

const STAGES = [
  { key: 'raw',       label: 'Raw Data',   icon: '🧊', color: '#94A3B8', desc: 'No email or phone' },
  { key: 'targeted',  label: 'Targeted',   icon: '🔍', color: '#3B82F6', desc: 'Has email or phone — ready to reach' },
  { key: 'contacted', label: 'Contacted',  icon: '📬', color: '#F59E0B', desc: 'First outreach sent' },
  { key: 'engaged',   label: 'Engaged',    icon: '💬', color: '#8B5CF6', desc: 'Replied or showed interest' },
  { key: 'warm',      label: 'Warm 🔥',    icon: '🔥', color: '#10B981', desc: 'Ready for CRM handoff' },
];

const NEXT_STAGE = { raw: 'targeted', targeted: 'contacted', contacted: 'engaged', engaged: 'warm' };
const PREV_STAGE = { targeted: 'raw', contacted: 'targeted', engaged: 'contacted', warm: 'engaged' };

function buildCRMUrl(contact) {
  const params = new URLSearchParams({
    name:     contact.name     || '',
    company:  contact.company  || '',
    email:    contact.email    || '',
    phone:    contact.phone    || '',
    industry: contact.industry || '',
    title:    contact.title    || '',
    country:  contact.country  || '',
    source:   'Hans LeadGen',
  });
  return `${CRM_URL}/new-lead?${params.toString()}`;
}

export default function QualificationTracker() {
  const { user } = useAuth();

  // View: 'table' | 'kanban'
  const [view, setView] = useState('table');

  // Table state
  const [activeStage, setActiveStage] = useState('targeted');
  const [contacts, setContacts]       = useState([]);
  const [stageCounts, setStageCounts] = useState({});
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  // Kanban state (one slice per column)
  const [kanbanData, setKanbanData] = useState({});
  const [kanbanLoading, setKanbanLoading] = useState(false);

  // Optimistic update tracking
  const [movingId, setMovingId] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Load stage counts on mount
  useEffect(() => { loadStageCounts(); }, []);

  // Load table data when stage/page/search/filter changes
  useEffect(() => {
    if (view === 'table') loadTableData();
  }, [activeStage, page, debouncedSearch, industryFilter, view]);

  // Load kanban data when switching to kanban
  useEffect(() => {
    if (view === 'kanban') loadKanbanData();
  }, [view]);

  const loadStageCounts = async () => {
    const { data } = await supabase
      .from('contacts')
      .select('qual_stage');
    if (!data) return;
    const map = {};
    data.forEach(r => { map[r.qual_stage] = (map[r.qual_stage] || 0) + 1; });
    setStageCounts(map);
  };

  const loadTableData = async () => {
    setLoading(true);
    let q = supabase
      .from('contacts')
      .select('id,name,company,title,email,phone,linkedin,industry,country,qual_stage,data_quality_score,contact_type', { count: 'exact' })
      .eq('qual_stage', activeStage);

    if (debouncedSearch.trim()) {
      const s = debouncedSearch.trim();
      q = q.or(`name.ilike.%${s}%,company.ilike.%${s}%,email.ilike.%${s}%`);
    }
    if (industryFilter) q = q.eq('industry', industryFilter);

    const from = (page - 1) * PER_PAGE;
    q = q.range(from, from + PER_PAGE - 1).order('data_quality_score', { ascending: false });

    const { data, count } = await q;
    setContacts(data || []);
    setTotal(count || 0);
    setLoading(false);
  };

  const loadKanbanData = async () => {
    setKanbanLoading(true);
    const result = {};
    await Promise.all(
      STAGES.map(async (s) => {
        const { data } = await supabase
          .from('contacts')
          .select('id,name,company,title,email,phone,industry,country,qual_stage,data_quality_score')
          .eq('qual_stage', s.key)
          .order('data_quality_score', { ascending: false })
          .limit(20);
        result[s.key] = data || [];
      })
    );
    setKanbanData(result);
    setKanbanLoading(false);
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Advance stage
  const advanceStage = async (contact, direction = 'next') => {
    const newStage = direction === 'next'
      ? NEXT_STAGE[contact.qual_stage]
      : PREV_STAGE[contact.qual_stage];
    if (!newStage) return;

    setMovingId(contact.id);
    const { error } = await supabase
      .from('contacts')
      .update({ qual_stage: newStage })
      .eq('id', contact.id);

    if (error) {
      showToast('Failed to update stage', 'error');
    } else {
      // Optimistic: remove from current table view
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      setTotal(prev => prev - 1);
      setStageCounts(prev => ({
        ...prev,
        [contact.qual_stage]: Math.max(0, (prev[contact.qual_stage] || 1) - 1),
        [newStage]: (prev[newStage] || 0) + 1,
      }));
      showToast(`Moved to ${STAGES.find(s => s.key === newStage)?.label} ✓`);
    }
    setMovingId(null);
  };

  // Push to CRM
  const pushToCRM = async (contact) => {
    setMovingId(contact.id);
    const { error } = await supabase
      .from('contacts')
      .update({ qual_stage: 'pushed', contact_type: 'Existing Customer' })
      .eq('id', contact.id);

    if (!error) {
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      setTotal(prev => prev - 1);
      setStageCounts(prev => ({
        ...prev,
        warm: Math.max(0, (prev.warm || 1) - 1),
        pushed: (prev.pushed || 0) + 1,
      }));
      // Open CRM
      window.open(buildCRMUrl(contact), '_blank');
      showToast('Pushed to CRM ✓');
    } else {
      showToast('CRM push failed', 'error');
    }
    setMovingId(null);
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="qt-page animate-in">

      {/* Toast */}
      {toast && (
        <div className={`qt-toast ${toast.type}`}>
          {toast.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="qt-header">
        <div>
          <h2 className="page-title">Qualification Tracker</h2>
          <p className="page-subtitle">Move contacts from Cold → Warm, then hand off to CRM</p>
        </div>
        <div className="qt-header-actions">
          <a href={CRM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            <ExternalLink size={14} /> Open SmartCRM
          </a>
        </div>
      </div>

      {/* Stage Pipeline Banner */}
      <div className="qt-pipeline-banner">
        {STAGES.map((s, i) => {
          const count = stageCounts[s.key] || 0;
          const isActive = activeStage === s.key && view === 'table';
          return (
            <div key={s.key} className={`qt-stage-pill ${isActive ? 'active' : ''}`}
              style={{ '--stage-color': s.color }}
              onClick={() => { setActiveStage(s.key); setView('table'); setPage(1); }}>
              <span className="qt-stage-icon">{s.icon}</span>
              <div className="qt-stage-info">
                <span className="qt-stage-label">{s.label}</span>
                <span className="qt-stage-count" style={{ color: s.color }}>{count.toLocaleString()}</span>
              </div>
              {i < STAGES.length - 1 && (
                <ArrowRight size={12} className="qt-stage-arrow" />
              )}
            </div>
          );
        })}
        <div className="qt-pushed-pill">
          <CheckCircle2 size={14} color="#06B6D4" />
          <span>{(stageCounts.pushed || 0).toLocaleString()} in CRM</span>
        </div>
      </div>

      {/* Controls Row */}
      <div className="qt-controls">
        <div className="qt-search-wrap">
          <Search size={14} className="qt-search-icon" />
          <input
            className="qt-search"
            placeholder="Search name, company, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="qt-search-clear" onClick={() => setSearch('')}><X size={12} /></button>}
        </div>
        <select className="qt-filter-select" value={industryFilter}
          onChange={e => { setIndustryFilter(e.target.value); setPage(1); }}>
          <option value="">All Industries</option>
          {Object.keys(INDUSTRY_COLORS).map(ind => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
        <button className="qt-refresh-btn" onClick={() => { loadTableData(); loadStageCounts(); }}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
        </button>
        <div className="qt-view-toggle">
          <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')} title="Table view">
            <List size={14} />
          </button>
          <button className={view === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')} title="Kanban view">
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      {view === 'table' && (
        <>
          <div className="qt-table-wrap">
            <div className="qt-table-header">
              <span className="qt-table-stage-label">
                {STAGES.find(s => s.key === activeStage)?.icon}{' '}
                {STAGES.find(s => s.key === activeStage)?.label}
                <span className="qt-table-count">{total.toLocaleString()} contacts</span>
              </span>
              <span className="qt-table-desc">{STAGES.find(s => s.key === activeStage)?.desc}</span>
            </div>
            <table className="qt-table">
              <thead>
                <tr>
                  <th>DQ</th>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Industry</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Country</th>
                  <th>Stage Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && contacts.length === 0 ? (
                  <tr><td colSpan={8} className="qt-loading">
                    <Loader2 size={20} className="spin" /> Loading contacts…
                  </td></tr>
                ) : contacts.length === 0 ? (
                  <tr><td colSpan={8} className="qt-empty">
                    <Target size={28} />
                    <p>No contacts in this stage</p>
                    <small>Try a different stage or clear your filters</small>
                  </td></tr>
                ) : contacts.map(c => {
                  const color = INDUSTRY_COLORS[c.industry] || '#94A3B8';
                  const isMoving = movingId === c.id;
                  return (
                    <tr key={c.id} className={isMoving ? 'qt-row-moving' : ''}>
                      <td><DQBadge score={c.data_quality_score} contact={c} size="sm" /></td>
                      <td className="qt-name">{c.name || <span className="qt-empty-val">—</span>}</td>
                      <td className="qt-company">{c.company || <span className="qt-empty-val">—</span>}</td>
                      <td>
                        <span className="qt-ind-badge" style={{ background: `${color}18`, color }}>
                          {INDUSTRY_ICONS[c.industry] || '📁'}
                          {c.industry?.length > 14 ? c.industry.slice(0, 12) + '…' : (c.industry || '—')}
                        </span>
                      </td>
                      <td>
                        {c.email && c.email.includes('@')
                          ? <a href={`mailto:${c.email}`} className="qt-email">{c.email.length > 24 ? c.email.slice(0, 22) + '…' : c.email}</a>
                          : <span className="qt-missing"><AlertCircle size={10} /> Missing</span>
                        }
                      </td>
                      <td>
                        {c.phone && c.phone.trim().length > 4
                          ? <span className="qt-phone">{c.phone}</span>
                          : <span className="qt-missing"><AlertCircle size={10} /> Missing</span>
                        }
                      </td>
                      <td className="qt-country">{c.country || '—'}</td>
                      <td>
                        <div className="qt-actions">
                          {/* Back button (not for raw) */}
                          {PREV_STAGE[c.qual_stage] && (
                            <button className="qt-btn qt-btn-back"
                              onClick={() => advanceStage(c, 'prev')}
                              disabled={isMoving}
                              title={`Move back to ${STAGES.find(s => s.key === PREV_STAGE[c.qual_stage])?.label}`}>
                              ←
                            </button>
                          )}

                          {/* Warm → Push to CRM */}
                          {c.qual_stage === 'warm' ? (
                            <button className="qt-btn qt-btn-crm"
                              onClick={() => pushToCRM(c)}
                              disabled={isMoving}>
                              {isMoving ? <Loader2 size={11} className="spin" /> : <><Flame size={11} /> Push to CRM</>}
                            </button>
                          ) : (
                            <button className="qt-btn qt-btn-advance"
                              onClick={() => advanceStage(c, 'next')}
                              disabled={isMoving}>
                              {isMoving
                                ? <Loader2 size={11} className="spin" />
                                : <>{STAGES.find(s => s.key === NEXT_STAGE[c.qual_stage])?.icon} Advance</>
                              }
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="qt-pagination">
              <span className="qt-page-info">
                {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, total)} of {total.toLocaleString()}
              </span>
              <div className="qt-page-btns">
                <button className="qt-page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                <button className="qt-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={13} /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return <button key={pg} className={`qt-page-btn ${page === pg ? 'active' : ''}`} onClick={() => setPage(pg)}>{pg}</button>;
                })}
                <button className="qt-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={13} /></button>
                <button className="qt-page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── KANBAN VIEW ── */}
      {view === 'kanban' && (
        <div className="qt-kanban">
          {kanbanLoading ? (
            <div className="qt-kanban-loading"><Loader2 size={24} className="spin" /> Loading kanban…</div>
          ) : (
            STAGES.map(stage => {
              const cards = kanbanData[stage.key] || [];
              const count = stageCounts[stage.key] || 0;
              return (
                <div key={stage.key} className="qt-kanban-col" style={{ '--col-color': stage.color }}>
                  <div className="qt-kanban-col-header">
                    <span>{stage.icon} {stage.label}</span>
                    <span className="qt-kanban-count" style={{ color: stage.color }}>{count.toLocaleString()}</span>
                  </div>
                  <div className="qt-kanban-cards">
                    {cards.map(c => {
                      const color = INDUSTRY_COLORS[c.industry] || '#94A3B8';
                      return (
                        <div key={c.id} className="qt-kanban-card">
                          <div className="qt-card-top">
                            <span className="qt-card-name">{c.name || 'Unknown'}</span>
                            <DQBadge score={c.data_quality_score} contact={c} size="sm" />
                          </div>
                          <div className="qt-card-company">{c.company || '—'}</div>
                          <div className="qt-card-ind" style={{ color }}>
                            {INDUSTRY_ICONS[c.industry] || '📁'} {c.industry?.length > 16 ? c.industry.slice(0, 14) + '…' : (c.industry || '—')}
                          </div>
                          <div className="qt-card-meta">
                            {c.email && c.email.includes('@') ? <span className="qt-card-has"><Mail size={9} /></span> : <span className="qt-card-miss"><Mail size={9} /></span>}
                            {c.phone && c.phone.trim().length > 4 ? <span className="qt-card-has"><Phone size={9} /></span> : <span className="qt-card-miss"><Phone size={9} /></span>}
                            {c.country && <span className="qt-card-country">{c.country}</span>}
                          </div>
                          <div className="qt-card-actions">
                            {stage.key !== 'warm' ? (
                              <button className="qt-card-btn advance"
                                onClick={() => advanceStage(c, 'next')}
                                disabled={movingId === c.id}>
                                {STAGES.find(s => s.key === NEXT_STAGE[stage.key])?.icon} Advance
                              </button>
                            ) : (
                              <button className="qt-card-btn crm"
                                onClick={() => pushToCRM(c)}
                                disabled={movingId === c.id}>
                                <Flame size={10} /> Push to CRM
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {count > 20 && (
                      <div className="qt-kanban-more">
                        +{(count - 20).toLocaleString()} more — use Table view
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
