import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Edit3, Save, X, Check, Pencil, Mail, Phone, Link2,
  MapPin, Building2, User, Tag, Globe, Database, Clock,
  ChevronLeft, ChevronRight, RefreshCw, CheckCircle, AlertCircle,
  ClipboardList, Loader2, Star, Plus, Trash2, Filter,
  Zap, TrendingUp, Brain, ChevronDown, ChevronUp,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { INDUSTRY_COLORS, INDUSTRY_ICONS, INDUSTRY_SUMMARY } from '../data/realContacts';
import { DQBadge } from '../components/DQBadge';
import { DQGapPanel, DQSmartQueueBanner } from '../components/DQGapPanel';
import { computeDQScore } from '../lib/dataQuality';
import './ManualEnrich.css';

const PER_PAGE = 25;

const STATUS_OPTIONS = ['New Lead', 'Prospect', 'MQL', 'SQL', 'Opportunity', 'Existing Customer', 'Disqualified'];
const CONTACT_TYPE_OPTIONS = ['New Lead', 'Prospect', 'Marketing Qualified', 'Sales Qualified', 'Opportunity', 'Existing Customer', 'Target Account', 'Disqualified'];
const SOURCE_OPTIONS = [
  'ACAAI Bali 2025','ACE OPENeX 2025','ACS Mumbai 2026','Ace Cargo Event',
  'Airport LinkedIn Database','BCBA Members 2025','CHA & Forwarder Master DB',
  'CHA Tuticorin Registry','CPH Event 2026','CRM Export','CRM Export 2026',
  'Central Asia Event','EximIndia CTL 2025','Existing Customer List',
  'Existing Customers 2026','GHI Delegate List','GLA Event 2025',
  'JNPT CHA Registry','Leads Batch 1','Leads Batch 2','Leads Batch 3',
  'Leads Batch 4','MailChimp Leads','Master DB Intl (ACCAI Bali 2025)',
  'Master DB Intl (Event Contact Rajeev)','Master DB Intl (IICS 2025 Visit)',
  'Master Database India','Non-Customer DB','Visiting Cards','Manual Entry',
];

const FIELD_META = [
  { key: 'name',         label: 'Full Name',      icon: User,      type: 'text',   placeholder: 'Enter full name...' },
  { key: 'title',        label: 'Job Title',       icon: Tag,       type: 'text',   placeholder: 'e.g. Manager – Exports' },
  { key: 'company',      label: 'Company',         icon: Building2, type: 'text',   placeholder: 'Company name' },
  { key: 'email',        label: 'Email',           icon: Mail,      type: 'email',  placeholder: 'name@company.com', highlight: true },
  { key: 'phone',        label: 'Phone',           icon: Phone,     type: 'tel',    placeholder: '+91 XXXXX XXXXX', highlight: true },
  { key: 'linkedin',     label: 'LinkedIn',        icon: Link2,     type: 'url',    placeholder: 'https://linkedin.com/in/...' },
  { key: 'location',     label: 'Location',        icon: MapPin,    type: 'text',   placeholder: 'City, Country' },
  { key: 'country',      label: 'Country',         icon: Globe,     type: 'text',   placeholder: 'e.g. India' },
  { key: 'industry',     label: 'Industry',        icon: Database,  type: 'select', options: INDUSTRY_SUMMARY.map(s => s.industry) },
  { key: 'product',      label: 'Product Interest',icon: Star,      type: 'text',   placeholder: 'e.g. iCAFFE / WiseCargo' },
  { key: 'source',       label: 'Source',          icon: ClipboardList, type: 'select', options: SOURCE_OPTIONS },
  { key: 'status',       label: 'Status',          icon: CheckCircle, type: 'select', options: STATUS_OPTIONS },
  { key: 'contact_type', label: 'Contact Type',    icon: Tag,       type: 'select', options: CONTACT_TYPE_OPTIONS },
  { key: 'score',        label: 'Score',           icon: Star,      type: 'number', placeholder: '0-100' },
];

export default function ManualEnrich() {
  const { user, isAdmin } = useAuth();

  // Search & Filter
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [missingFilter, setMissingFilter] = useState('');
  const [page, setPage] = useState(1);
  const debounceRef = useRef(null);

  // Smart Queue / Gap Analysis  
  const [smartQueue, setSmartQueue] = useState(false); // sort by lowest DQ score
  const [gapContactId, setGapContactId] = useState(null); // contact whose gap panel is open

  // Data
  const [contacts, setContacts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Editing
  const [editingCell, setEditingCell] = useState(null); // { id, field }
  const [editValue, setEditValue] = useState('');
  const [savingCell, setSavingCell] = useState(false);

  // Modal
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingModal, setSavingModal] = useState(false);
  const [modalErrors, setModalErrors] = useState({});

  // Audit
  const [auditLog, setAuditLog] = useState([]);
  const [showAudit, setShowAudit] = useState(false);
  const [toast, setToast] = useState(null);

  // Add new contact
  const [showAddModal, setShowAddModal] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', company: '', email: '', phone: '', industry: '', title: '', source: 'Manual Entry', status: 'New Lead', contact_type: 'New Lead', country: '' });
  const [savingNew, setSavingNew] = useState(false);

  // Debounce search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Load contacts
  useEffect(() => {
    loadContacts();
  }, [debouncedSearch, industryFilter, missingFilter, page, smartQueue]);

  const loadContacts = async () => {
    setLoading(true);
    let query = supabase.from('contacts').select('*', { count: 'exact' });

    if (debouncedSearch.trim()) {
      const s = debouncedSearch.trim();
      query = query.or(`name.ilike.%${s}%,company.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,title.ilike.%${s}%`);
    }

    if (industryFilter) query = query.eq('industry', industryFilter);

    if (missingFilter === 'email') query = query.or('email.is.null,email.not.ilike.%@%');
    else if (missingFilter === 'phone') query = query.or('phone.is.null,phone.eq.');
    else if (missingFilter === 'linkedin') query = query.or('linkedin.is.null,linkedin.eq.');
    else if (missingFilter === 'incomplete') query = query.lt('data_quality_score', 100);

    const from = (page - 1) * PER_PAGE;
    if (smartQueue) {
      query = query.range(from, from + PER_PAGE - 1).order('data_quality_score', { ascending: true });
    } else {
      query = query.range(from, from + PER_PAGE - 1).order('company', { ascending: true });
    }

    const { data, count, error } = await query;
    if (!error) {
      setContacts(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addAuditEntry = (contact, changes) => {
    const entry = {
      time: new Date().toLocaleTimeString(),
      user: user?.email || 'unknown',
      contactName: contact.name || contact.company || 'Unknown',
      contactId: contact.id,
      changes,
    };
    setAuditLog(prev => [entry, ...prev].slice(0, 100));
  };

  // ========== INLINE CELL EDITING ==========

  const startCellEdit = (contactId, field, currentValue) => {
    setEditingCell({ id: contactId, field });
    setEditValue(currentValue || '');
  };

  const cancelCellEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveCellEdit = async () => {
    if (!editingCell) return;
    setSavingCell(true);
    const { id, field } = editingCell;
    const newVal = editValue.trim() || null;
    const contact = contacts.find(c => c.id === id);
    const oldVal = contact?.[field];

    if (newVal === (oldVal || '').trim()) {
      cancelCellEdit();
      setSavingCell(false);
      return;
    }

    const { error } = await supabase.from('contacts').update({ [field]: newVal }).eq('id', id);

    if (error) {
      showToast(`Failed to save: ${error.message}`, 'error');
    } else {
      // Recompute DQ score client-side for instant feedback
      const updatedContact = { ...contact, [field]: newVal };
      const newDQScore = computeDQScore(updatedContact);
      setContacts(prev => prev.map(c => c.id === id
        ? { ...c, [field]: newVal, data_quality_score: newDQScore }
        : c
      ));
      addAuditEntry(contact, { [field]: { from: oldVal, to: newVal } });
      showToast(`${field} updated ✓`);
    }

    setSavingCell(false);
    cancelCellEdit();
  };

  const handleCellKeyDown = (e) => {
    if (e.key === 'Enter') saveCellEdit();
    if (e.key === 'Escape') cancelCellEdit();
  };

  // ========== FULL EDIT MODAL ==========

  const openEditModal = (contact) => {
    setEditModal(contact);
    const form = {};
    FIELD_META.forEach(f => { form[f.key] = contact[f.key] || ''; });
    setEditForm(form);
    setModalErrors({});
  };

  const validateModal = () => {
    const errors = {};
    if (editForm.email && editForm.email.trim() && !editForm.email.includes('@')) {
      errors.email = 'Enter a valid email address';
    }
    if (editForm.score && (isNaN(editForm.score) || +editForm.score < 0 || +editForm.score > 100)) {
      errors.score = 'Score must be 0–100';
    }
    setModalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveEditModal = async () => {
    if (!editModal || !validateModal()) return;
    setSavingModal(true);

    const updates = {};
    FIELD_META.forEach(f => {
      const newVal = (editForm[f.key] || '').trim() || null;
      const oldVal = (editModal[f.key] || '').trim() || null;
      if (newVal !== oldVal) updates[f.key] = newVal;
    });

    if (Object.keys(updates).length === 0) {
      setSavingModal(false);
      setEditModal(null);
      return;
    }

    const { error } = await supabase.from('contacts').update(updates).eq('id', editModal.id);

    if (error) {
      showToast(`Save failed: ${error.message}`, 'error');
    } else {
      // Recompute DQ score after full modal save
      const updatedContact = { ...editModal, ...updates };
      const newDQScore = computeDQScore(updatedContact);
      setContacts(prev => prev.map(c => c.id === editModal.id
        ? { ...c, ...updates, data_quality_score: newDQScore }
        : c
      ));
      const changeDetails = {};
      Object.entries(updates).forEach(([k, v]) => {
        changeDetails[k] = { from: editModal[k] || null, to: v };
      });
      addAuditEntry(editModal, changeDetails);
      showToast(`${Object.keys(updates).length} field(s) updated ✓`);
      setEditModal(null);
    }

    setSavingModal(false);
  };

  // ========== ADD NEW CONTACT ==========

  const saveNewContact = async () => {
    if (!newForm.name && !newForm.company) {
      showToast('Name or Company is required', 'error');
      return;
    }
    setSavingNew(true);

    const { data, error } = await supabase.from('contacts').insert([newForm]).select().single();

    if (error) {
      showToast(`Failed to add: ${error.message}`, 'error');
    } else {
      setContacts(prev => [data, ...prev]);
      setTotalCount(prev => prev + 1);
      addAuditEntry(data, { _action: { from: null, to: 'Contact created' } });
      showToast('New contact added ✓');
      setShowAddModal(false);
      setNewForm({ name: '', company: '', email: '', phone: '', industry: '', title: '', source: 'Manual Entry', status: 'New Lead', contact_type: 'New Lead', country: '' });
    }

    setSavingNew(false);
  };

  // ========== RENDER HELPERS ==========

  const renderInlineCell = (contact, field, displayFn) => {
    const isEditing = editingCell?.id === contact.id && editingCell?.field === field;
    const fieldMeta = FIELD_META.find(f => f.key === field);

    if (isEditing) {
      if (fieldMeta?.type === 'select') {
        return (
          <div className="me-inline-wrap">
            <select
              className="me-inline-select"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={saveCellEdit}
              autoFocus
            >
              <option value="">— None —</option>
              {fieldMeta.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <button className="me-cell-btn save" onClick={saveCellEdit} disabled={savingCell}><Check size={10}/></button>
            <button className="me-cell-btn cancel" onClick={cancelCellEdit}><X size={10}/></button>
          </div>
        );
      }
      return (
        <div className="me-inline-wrap">
          <input
            className="me-inline-input"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleCellKeyDown}
            autoFocus
            placeholder={fieldMeta?.placeholder}
          />
          <button className="me-cell-btn save" onClick={saveCellEdit} disabled={savingCell}>
            {savingCell ? <Loader2 size={10} className="spin"/> : <Check size={10}/>}
          </button>
          <button className="me-cell-btn cancel" onClick={cancelCellEdit}><X size={10}/></button>
        </div>
      );
    }

    return (
      <div className="me-editable-cell" onClick={() => startCellEdit(contact.id, field, contact[field])}>
        <span className="me-cell-value">{displayFn ? displayFn(contact[field]) : (contact[field] || <span className="me-empty">—</span>)}</span>
        <Pencil size={9} className="me-pencil"/>
      </div>
    );
  };

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  return (
    <div className="me-page animate-in">

      {/* Toast */}
      {toast && (
        <div className={`me-toast ${toast.type}`}>
          {toast.type === 'error' ? <AlertCircle size={14}/> : <CheckCircle size={14}/>}
          {toast.msg}
        </div>
      )}

      {/* Header — title shown in topbar, so only actions row here */}
      <div className="me-header">
        <div className="me-header-actions">
          <button className="btn btn-ghost" onClick={() => setShowAudit(!showAudit)}>
            <Clock size={14}/> Audit Log {auditLog.length > 0 && <span className="me-audit-count">{auditLog.length}</span>}
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={14}/> Add Contact
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="me-search-bar">
        <div className="me-search-input-wrap">
          <Search size={16} className="me-search-icon"/>
          <input
            className="me-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, company, email, phone, title…"
            autoComplete="off"
          />
          {search && (
            <button className="me-search-clear" onClick={() => setSearch('')}><X size={14}/></button>
          )}
        </div>
        <div className="me-filters">
          <select className="me-filter-select" value={industryFilter} onChange={e => { setIndustryFilter(e.target.value); setPage(1); }}>
            <option value="">All Industries</option>
            {INDUSTRY_SUMMARY.map(s => <option key={s.industry} value={s.industry}>{s.industry}</option>)}
          </select>
          <select className="me-filter-select" value={missingFilter} onChange={e => { setMissingFilter(e.target.value); setPage(1); }}>
            <option value="">All Contacts</option>
            <option value="email">Missing Email</option>
            <option value="phone">Missing Phone</option>
            <option value="linkedin">Missing LinkedIn</option>
            <option value="incomplete">Score &lt; 100</option>
          </select>
          {/* Smart Queue Toggle */}
          <button
            className={`btn btn-sm ${smartQueue ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setSmartQueue(q => !q); setPage(1); }}
            title={smartQueue ? 'Showing lowest-score contacts first (Smart Queue ON)' : 'Enable Smart Queue — lowest scores first'}
          >
            <Brain size={12}/> {smartQueue ? 'Smart Queue ON' : 'Smart Queue'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setIndustryFilter(''); setMissingFilter(''); setSmartQueue(false); setPage(1); }}>
            <RefreshCw size={12}/> Reset
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="me-stats-bar">
        <span className="me-stat"><Database size={12}/> <strong>{totalCount.toLocaleString()}</strong> contacts found</span>
        <span className="me-stat-divider"/>
        <span className="me-stat"><Edit3 size={12}/> <strong>{auditLog.length}</strong> edits this session</span>
        {smartQueue && (
          <><span className="me-stat-divider"/>
          <span className="me-stat" style={{ color: '#8B5CF6', fontWeight: 700 }}>
            <Zap size={11}/> Smart Queue — lowest scores first
          </span></>
        )}
        {loading && <><span className="me-stat-divider"/><span className="me-stat"><Loader2 size={12} className="spin"/> Loading...</span></>}
      </div>

      {/* Smart Queue Gap Banner — shows field-level stats for this page */}
      {smartQueue && contacts.length > 0 && (
        <DQSmartQueueBanner contacts={contacts} />
      )}

      {/* Audit Log Panel */}
      {showAudit && (
        <div className="me-audit-panel">
          <div className="me-audit-header">
            <Clock size={13}/>
            <span>Session Audit Log ({auditLog.length} changes)</span>
            <button className="btn btn-ghost btn-xs" onClick={() => setAuditLog([])}>Clear</button>
            <button className="btn btn-ghost btn-xs" onClick={() => setShowAudit(false)}><X size={11}/></button>
          </div>
          {auditLog.length === 0 ? (
            <div className="me-audit-empty">No changes yet this session</div>
          ) : (
            <div className="me-audit-list">
              {auditLog.map((entry, i) => (
                <div key={i} className="me-audit-entry">
                  <span className="me-audit-time">{entry.time}</span>
                  <span className="me-audit-contact">{entry.contactName}</span>
                  <div className="me-audit-changes">
                    {Object.entries(entry.changes).map(([field, { from, to }]) => (
                      <span key={field} className="me-audit-change">
                        <span className="me-change-field">{field}</span>
                        {from && <span className="me-change-from">{String(from).slice(0, 20)}</span>}
                        <span className="me-change-arrow">→</span>
                        <span className="me-change-to">{to ? String(to).slice(0, 30) : '(removed)'}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hint */}
      <div className="me-table-hint">
        <Edit3 size={11}/>
        Click any <span className="hl">email</span>, <span className="hl">phone</span>, <span className="hl">title</span>, or <span className="hl">name</span> cell to edit inline · Or click <strong>Edit</strong> for all fields
      </div>

      {/* Table */}
      <div className="me-table-wrap">
        <table className="me-table" style={{ minWidth: 960 }}>
          <thead>
            <tr>
              <th>DQ</th>
              <th>Gap</th>
              <th>Industry</th>
              <th>Name</th>
              <th>Company</th>
              <th>Title</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && contacts.length === 0 ? (
              <tr><td colSpan={10} className="me-table-loading">
                <Loader2 size={20} className="spin"/> Loading contacts…
              </td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={10} className="me-table-empty">
                <Search size={28}/>
                <p>No contacts found</p>
                <small>{debouncedSearch ? `No results for "${debouncedSearch}"` : 'Try adjusting your filters'}</small>
              </td></tr>
            ) : contacts.map(c => {
              const color = INDUSTRY_COLORS[c.industry] || '#94A3B8';
              const hasEmail = c.email && c.email.includes('@');
              const hasPhone = c.phone && c.phone.length > 4;
              return (
                <>
                  <tr key={c.id} className={`me-row ${editingCell?.id === c.id ? 'editing' : ''}`}>
                  <td><DQBadge score={c.data_quality_score} contact={c} size="sm" /></td>
                  {/* Gap Analysis column */}
                  <td>
                    <button
                      className={`me-gap-toggle ${gapContactId === c.id ? 'active' : ''}`}
                      onClick={() => setGapContactId(gapContactId === c.id ? null : c.id)}
                      title="Show gap analysis — what to fill to reach 100"
                    >
                      <Zap size={11} />
                      {100 - (c.data_quality_score || 0) > 0
                        ? <span className="me-gap-pts">+{100 - (c.data_quality_score || 0)}</span>
                        : <span className="me-gap-full">✓</span>
                      }
                    </button>
                  </td>
                  <td>
                    <span className="me-ind-badge" style={{ background: `${color}18`, color }}>
                      <span>{INDUSTRY_ICONS[c.industry] || '📁'}</span>
                      <span className="me-ind-text">{c.industry?.length > 14 ? c.industry.slice(0,12)+'…' : (c.industry || '—')}</span>
                    </span>
                  </td>
                  <td className="me-name-cell">
                    {renderInlineCell(c, 'name', v => v || <span className="me-empty">Unnamed</span>)}
                  </td>
                  <td className="me-company-cell">
                    <span className="me-company">{c.company && c.company !== '??' ? c.company : <span className="me-empty">—</span>}</span>
                  </td>
                  <td className="me-title-cell">
                    {renderInlineCell(c, 'title', v => v || <span className="me-empty">—</span>)}
                  </td>
                  <td className="me-email-cell">
                    {renderInlineCell(c, 'email', v =>
                      hasEmail
                        ? <a href={`mailto:${v}`} className="me-link-email" onClick={e => e.stopPropagation()}>{v}</a>
                        : <span className="me-missing"><AlertCircle size={10}/> Missing</span>
                    )}
                  </td>
                  <td className="me-phone-cell">
                    {renderInlineCell(c, 'phone', v =>
                      hasPhone
                        ? <a href={`tel:${v}`} className="me-link-phone" onClick={e => e.stopPropagation()}>{v}</a>
                        : <span className="me-missing"><AlertCircle size={10}/> Missing</span>
                    )}
                  </td>
                  <td>
                    {renderInlineCell(c, 'status', v => (
                      <span className={`me-status-badge me-status-${(v || 'new').toLowerCase().replace(/\s+/g,'-')}`}>{v || '—'}</span>
                    ))}
                  </td>
                  <td className="me-source-cell">
                    <span className="me-source" title={c.source}>{c.source?.length > 18 ? c.source.slice(0,16)+'…' : (c.source || '—')}</span>
                  </td>
                  <td>
                    <div className="me-row-actions">
                      <button className="me-edit-btn" onClick={() => openEditModal(c)} title="Edit all fields">
                        <Edit3 size={13}/> Edit
                      </button>
                    </div>
                  </td>
                </tr>
                {/* Gap Analysis Slide-out Panel */}
                {gapContactId === c.id && (
                  <tr className="me-gap-row">
                    <td colSpan={11} className="me-gap-cell">
                      <DQGapPanel
                        contact={c}
                        onApply={(field, value) => {
                          openEditModal(c);
                          setEditForm(prev => ({ ...prev, [field]: value }));
                        }}
                      />
                    </td>
                  </tr>
                )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="me-pagination">
          <span className="me-page-info">
            {((page-1)*PER_PAGE)+1}–{Math.min(page*PER_PAGE, totalCount)} of {totalCount.toLocaleString()}
          </span>
          <div className="me-page-btns">
            <button className="me-page-btn" disabled={page===1} onClick={() => setPage(1)}>«</button>
            <button className="me-page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}><ChevronLeft size={14}/></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pg = totalPages <= 5 ? i+1 : page <= 3 ? i+1 : page >= totalPages-2 ? totalPages-4+i : page-2+i;
              return <button key={pg} className={`me-page-btn ${page===pg?'active':''}`} onClick={() => setPage(pg)}>{pg}</button>;
            })}
            <button className="me-page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}><ChevronRight size={14}/></button>
            <button className="me-page-btn" disabled={page===totalPages} onClick={() => setPage(totalPages)}>»</button>
          </div>
        </div>
      )}

      {/* ========== FULL EDIT MODAL ========== */}
      {editModal && (
        <div className="me-modal-overlay" onClick={() => !savingModal && setEditModal(null)}>
          <div className="me-modal" onClick={e => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-icon">
                <Edit3 size={18} color="#10B981"/>
              </div>
              <div className="me-modal-title-wrap">
                <h3>Edit Contact</h3>
                <p>{editModal.name || editModal.company || 'Unknown Contact'}</p>
              </div>
              <button className="me-modal-close" onClick={() => setEditModal(null)}><X size={18}/></button>
            </div>

            <div className="me-modal-body">
              {/* Industry badge */}
              <div className="me-modal-badges">
                <span className="me-ind-badge" style={{
                  background: `${INDUSTRY_COLORS[editModal.industry] || '#94A3B8'}18`,
                  color: INDUSTRY_COLORS[editModal.industry] || '#94A3B8',
                }}>
                  {INDUSTRY_ICONS[editModal.industry]} {editModal.industry || 'Unknown Industry'}
                </span>
                {editModal.country && (
                  <span className="me-modal-country"><Globe size={11}/> {editModal.country}</span>
                )}
              </div>

              <div className="me-modal-grid">
                {FIELD_META.map(field => (
                  <div key={field.key} className={`me-modal-field ${field.highlight ? 'highlight' : ''} ${field.key === 'linkedin' || field.key === 'product' ? 'full' : ''}`}>
                    <label>
                      <field.icon size={11}/>
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={editForm[field.key] || ''}
                        onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                        className={modalErrors[field.key] ? 'error' : ''}
                      >
                        <option value="">— Select —</option>
                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={editForm[field.key] || ''}
                        onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className={modalErrors[field.key] ? 'error' : ''}
                      />
                    )}
                    {modalErrors[field.key] && (
                      <span className="me-modal-error"><AlertCircle size={10}/> {modalErrors[field.key]}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="me-modal-footer">
              <div className="me-modal-footer-info">
                <Clock size={11}/>
                Changes saved instantly to Supabase
              </div>
              <div className="me-modal-footer-actions">
                <button className="btn btn-ghost" onClick={() => setEditModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveEditModal} disabled={savingModal}>
                  {savingModal ? <><Loader2 size={13} className="spin"/> Saving…</> : <><Save size={13}/> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== ADD NEW CONTACT MODAL ========== */}
      {showAddModal && (
        <div className="me-modal-overlay" onClick={() => !savingNew && setShowAddModal(false)}>
          <div className="me-modal" onClick={e => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Plus size={18} color="#6366F1"/>
              </div>
              <div className="me-modal-title-wrap">
                <h3>Add New Contact</h3>
                <p>Manually add a contact to the database</p>
              </div>
              <button className="me-modal-close" onClick={() => setShowAddModal(false)}><X size={18}/></button>
            </div>

            <div className="me-modal-body">
              <div className="me-modal-grid">
                {[
                  { key: 'name', label: 'Full Name *', type: 'text', placeholder: 'e.g. Rajiv Kumar' },
                  { key: 'company', label: 'Company *', type: 'text', placeholder: 'e.g. Air India Cargo' },
                  { key: 'title', label: 'Job Title', type: 'text', placeholder: 'e.g. Manager – Exports' },
                  { key: 'email', label: 'Email', type: 'email', placeholder: 'name@company.com', highlight: true },
                  { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 XXXXX XXXXX', highlight: true },
                  { key: 'country', label: 'Country', type: 'text', placeholder: 'e.g. India' },
                ].map(f => (
                  <div key={f.key} className={`me-modal-field ${f.highlight ? 'highlight' : ''}`}>
                    <label>{f.label}</label>
                    <input type={f.type} value={newForm[f.key] || ''} placeholder={f.placeholder}
                      onChange={e => setNewForm(p => ({ ...p, [f.key]: e.target.value }))}/>
                  </div>
                ))}
                <div className="me-modal-field">
                  <label>Industry</label>
                  <select value={newForm.industry} onChange={e => setNewForm(p => ({ ...p, industry: e.target.value }))}>
                    <option value="">— Select —</option>
                    {INDUSTRY_SUMMARY.map(s => <option key={s.industry} value={s.industry}>{s.industry}</option>)}
                  </select>
                </div>
                <div className="me-modal-field">
                  <label>Source</label>
                  <select value={newForm.source} onChange={e => setNewForm(p => ({ ...p, source: e.target.value }))}>
                    {SOURCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="me-modal-field">
                  <label>Status</label>
                  <select value={newForm.status} onChange={e => setNewForm(p => ({ ...p, status: e.target.value }))}>
                    {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="me-modal-footer">
              <div className="me-modal-footer-info">
                <CheckCircle size={11}/>
                Will be added to Supabase contacts table
              </div>
              <div className="me-modal-footer-actions">
                <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveNewContact} disabled={savingNew}>
                  {savingNew ? <><Loader2 size={13} className="spin"/> Adding…</> : <><Plus size={13}/> Add Contact</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
