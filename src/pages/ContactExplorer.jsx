import { useState, useEffect } from 'react';
import { Download, Mail, Phone, Link2, Filter, X, Search, SlidersHorizontal, Globe, Building2, Tag, Users, BarChart3, ShieldAlert, Lock, Clock, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../auth/AuthContext';
import { fetchContacts, fetchContactsForExport, fetchContactsSummary, fetchFilterOptions } from '../lib/contactsApi';
import { INDUSTRY_COLORS, INDUSTRY_ICONS, INDUSTRY_PRODUCTS } from '../data/realContacts';
import { supabase } from '../lib/supabase';
import { DQBadge, DQSummaryPanel } from '../components/DQBadge';
import './ContactExplorer.css';

const PER_PAGE = 30;

function getTypeBadgeClass(type) {
  if (!type) return 'new';
  const t = type.toLowerCase();
  if (t.includes('existing')) return 'existing';
  if (t.includes('sales qual')) return 'sql';
  if (t.includes('marketing')) return 'mql';
  if (t.includes('opportunity')) return 'opp';
  if (t.includes('disqualified')) return 'disq';
  if (t.includes('target')) return 'target';
  if (t.includes('prospect')) return 'prospect';
  return 'new';
}

function AnalyticsBar({ items, maxVal, color }) {
  return (
    <div className="analytics-bar-list">
      {items.slice(0, 6).map(([label, count]) => (
        <div key={label} className="analytics-bar-item">
          <span className="analytics-bar-label" title={label}>{label}</span>
          <div className="analytics-bar-track">
            <div className="analytics-bar-fill" style={{ width: `${Math.max(4, (count / maxVal) * 100)}%`, background: color }}>
              {count / maxVal > 0.15 && <span className="analytics-bar-value">{count.toLocaleString()}</span>}
            </div>
          </div>
          <span className="analytics-bar-count">{count.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function ContactExplorer() {
  const { user, isAdmin } = useAuth();
  const canExport = isAdmin || user?.role === 'Sales Manager';

  // Filters
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [countryFilter, setCountryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');

  // Data from Supabase
  const [contacts, setContacts] = useState([]);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [filterOptions, setFilterOptions] = useState({ countries: [], regions: [], contactTypes: [], sources: [] });
  const [dqStats, setDqStats] = useState(null);

  // Export gate
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportRequestSent, setExportRequestSent] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Load summary & filter options on mount
  useEffect(() => {
    loadSummaryAndFilters();
  }, []);

  // Load contacts when filters change
  useEffect(() => {
    loadContacts();
  }, [selectedIndustry, debouncedSearch, page, countryFilter, regionFilter, typeFilter, sourceFilter, emailFilter, phoneFilter]);

  const loadSummaryAndFilters = async () => {
    const [summaryData, options, dqResult] = await Promise.all([
      fetchContactsSummary(),
      fetchFilterOptions(),
      supabase.rpc('get_dq_stats').then(r => r.data).catch(() => null),
    ]);
    if (summaryData) setSummary(summaryData);
    if (options) setFilterOptions(options);
    // Fallback if RPC not set up yet — use direct query
    if (!dqResult) {
      const { data } = await supabase
        .from('contacts')
        .select('data_quality_score, email, phone, linkedin')
        .limit(24999);
      if (data) {
        const total = data.length;
        const avg_score = Math.round(data.reduce((s, c) => s + (c.data_quality_score || 0), 0) / total);
        setDqStats({
          total,
          avg_score,
          grade_a: data.filter(c => (c.data_quality_score||0) >= 80).length,
          grade_b: data.filter(c => (c.data_quality_score||0) >= 60 && (c.data_quality_score||0) < 80).length,
          grade_c: data.filter(c => (c.data_quality_score||0) >= 40 && (c.data_quality_score||0) < 60).length,
          grade_d: data.filter(c => (c.data_quality_score||0) >= 20 && (c.data_quality_score||0) < 40).length,
          grade_f: data.filter(c => (c.data_quality_score||0) < 20).length,
          has_email: data.filter(c => c.email && c.email.includes('@')).length,
          has_phone: data.filter(c => c.phone && c.phone.trim().length > 4).length,
          has_linkedin: data.filter(c => c.linkedin && c.linkedin.trim() !== '').length,
        });
      }
    } else {
      setDqStats(dqResult);
    }
  };

  const loadContacts = async () => {
    setLoading(true);
    const result = await fetchContacts({
      industry: selectedIndustry,
      country: countryFilter,
      region: regionFilter,
      contactType: typeFilter,
      source: sourceFilter,
      emailFilter,
      phoneFilter,
      search: debouncedSearch,
      page,
      perPage: PER_PAGE,
    });
    setContacts(result.contacts);
    setTotalFiltered(result.total);
    setLoading(false);
  };

  const activeFilterCount = [selectedIndustry, countryFilter, regionFilter, typeFilter, sourceFilter, emailFilter, phoneFilter].filter(Boolean).length + (debouncedSearch ? 1 : 0);
  const totalPages = Math.ceil(totalFiltered / PER_PAGE);

  const clearFilters = () => {
    setSelectedIndustry(''); setSearch(''); setCountryFilter(''); setRegionFilter('');
    setTypeFilter(''); setSourceFilter(''); setEmailFilter(''); setPhoneFilter('');
    setPage(1);
  };

  // Analytics from loaded summary
  const industrySummary = summary?.industrySummary || [];
  const totalContacts = summary?.total || 0;
  const totalEmails = summary?.totalEmails || 0;
  const totalPhones = summary?.totalPhones || 0;
  const totalLinkedin = summary?.totalLinkedin || 0;
  const totalExisting = summary?.totalExisting || 0;

  const donutData = industrySummary.map(s => ({
    name: s.industry, value: s.count, color: INDUSTRY_COLORS[s.industry] || '#94A3B8',
  }));

  // Export CSV — gated by role
  const handleExport = async () => {
    if (!canExport) {
      setShowExportModal(true);
      return;
    }

    setExportLoading(true);
    const result = await fetchContactsForExport({
      industry: selectedIndustry,
      country: countryFilter,
      region: regionFilter,
      contactType: typeFilter,
      source: sourceFilter,
      search: debouncedSearch,
    }, user?.email);

    if (result.error) {
      alert('Export failed: ' + result.error);
      setExportLoading(false);
      return;
    }

    const watermark = `"Exported by: ${user?.email} | Date: ${new Date().toISOString().slice(0,10)} | Hans Infomatic Pvt. Ltd. — CONFIDENTIAL"`;
    const headers = ['Industry','Name','Company','Title','Email','Phone','Location','Country','Region','Product','Source','Contact Type','Status','Score','LinkedIn'];
    const rows = result.contacts.map(c => [c.industry,c.name,c.company,c.title,c.email,c.phone,c.location,c.country,c.region,c.product,c.source,c.contact_type,c.status,c.score,c.linkedin]);
    const csv = [watermark, '', headers.join(','), ...rows.map(r => r.map(v => `"${(v||'').replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Hans_Contacts_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    setExportLoading(false);
  };

  // Request export approval (non-admin)
  const handleRequestExport = async () => {
    setExportLoading(true);
    const { error } = await supabase.from('export_requests').insert({
      user_id: user?.id,
      user_email: user?.email,
      user_name: user?.name,
      page: 'Contact Explorer',
      record_count: totalFiltered,
      filters: {
        industry: selectedIndustry,
        country: countryFilter,
        region: regionFilter,
        search: debouncedSearch,
      },
      status: 'pending',
    });

    if (!error) {
      setExportRequestSent(true);
      // Also log the request
      await supabase.from('export_audit_log').insert({
        user_email: user?.email,
        action: 'request',
        page: 'Contact Explorer',
        record_count: totalFiltered,
      });
    }
    setExportLoading(false);
  };

  // Mask email/phone for non-admin
  const maskEmail = (email) => {
    if (!email || !email.includes('@')) return email;
    if (canExport) return email;
    const [local, domain] = email.split('@');
    return `${local.slice(0,2)}${'•'.repeat(Math.max(3, local.length - 2))}@${domain}`;
  };

  const maskPhone = (phone) => {
    if (!phone || phone.length <= 4) return phone;
    if (canExport) return phone;
    return `${phone.slice(0,4)}${'•'.repeat(Math.max(4, phone.length - 4))}`;
  };

  const activeFilters = [];
  if (selectedIndustry) activeFilters.push({ key: 'industry', label: `Industry: ${selectedIndustry}`, clear: () => setSelectedIndustry('') });
  if (countryFilter) activeFilters.push({ key: 'country', label: `Country: ${countryFilter}`, clear: () => setCountryFilter('') });
  if (regionFilter) activeFilters.push({ key: 'region', label: `Region: ${regionFilter}`, clear: () => setRegionFilter('') });
  if (typeFilter) activeFilters.push({ key: 'type', label: `Type: ${typeFilter}`, clear: () => setTypeFilter('') });
  if (sourceFilter) activeFilters.push({ key: 'source', label: `Source: ${sourceFilter}`, clear: () => setSourceFilter('') });
  if (emailFilter) activeFilters.push({ key: 'email', label: `Email: ${emailFilter === 'yes' ? 'Has Email' : 'No Email'}`, clear: () => setEmailFilter('') });
  if (phoneFilter) activeFilters.push({ key: 'phone', label: `Phone: ${phoneFilter === 'yes' ? 'Has Phone' : 'No Phone'}`, clear: () => setPhoneFilter('') });
  if (search) activeFilters.push({ key: 'search', label: `Search: "${search}"`, clear: () => setSearch('') });

  return (
    <div className="explorer-page animate-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <h2 className="page-title">Contact Explorer</h2>
          <p className="page-subtitle">{totalContacts.toLocaleString()} contacts from 14 data sources — structured by industry</p>
        </div>
        <button
          className={`btn ${canExport ? 'btn-primary' : 'btn-secondary'}`}
          onClick={handleExport}
          disabled={exportLoading}
        >
          {canExport ? (
            <><Download size={14} /> {exportLoading ? 'Exporting...' : `Export ${totalFiltered.toLocaleString()} Contacts`}</>
          ) : (
            <><Lock size={14} /> Export Restricted</>
          )}
        </button>
      </div>

      {/* Top Stats Strip */}
      <div className="explorer-stats-strip">
        <div className="stat-card-mini">
          <div className="stat-card-mini-number" style={{ color: 'var(--tertiary-dark)' }}>{totalContacts.toLocaleString()}</div>
          <div className="stat-card-mini-label">Total Contacts</div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-card-mini-number" style={{ color: '#10B981' }}>{totalEmails.toLocaleString()}</div>
          <div className="stat-card-mini-label">With Email</div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-card-mini-number" style={{ color: '#3B82F6' }}>{totalPhones.toLocaleString()}</div>
          <div className="stat-card-mini-label">With Phone</div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-card-mini-number" style={{ color: '#0A66C2' }}>{totalLinkedin}</div>
          <div className="stat-card-mini-label">LinkedIn</div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-card-mini-number" style={{ color: '#6366F1' }}>{totalExisting.toLocaleString()}</div>
          <div className="stat-card-mini-label">Existing Customers</div>
        </div>
        <div className="stat-card-mini" style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
          <ResponsiveContainer width={80} height={80}>
            <PieChart>
              <Pie data={donutData} dataKey="value" cx="50%" cy="50%" innerRadius={22} outerRadius={36} paddingAngle={1}>
                {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => v.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: 'var(--neutral-500)', lineHeight: 1.6 }}>
            {industrySummary.slice(0, 5).map(s => (
              <div key={s.industry} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: INDUSTRY_COLORS[s.industry], flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.industry.length > 18 ? s.industry.slice(0,15)+'…' : s.industry}</span>
                <strong>{s.count.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Filter Panel */}
      <div className="filter-panel">
        <div className="filter-panel-header">
          <div className="filter-panel-title">
            <SlidersHorizontal size={14} /> Filters
            {activeFilterCount > 0 && <span className="active-filter-count">{activeFilterCount}</span>}
          </div>
          {activeFilterCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}><X size={12} /> Clear All</button>
          )}
        </div>
        <div className="filter-row">
          <div className="filter-group">
            <label><Search size={10} /> Search</label>
            <input className="search-input" placeholder="Name, company, email…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="filter-group">
            <label><Building2 size={10} /> Industry</label>
            <select value={selectedIndustry} onChange={e => { setSelectedIndustry(e.target.value); setPage(1); }}>
              <option value="">All Industries</option>
              {industrySummary.map(s => <option key={s.industry} value={s.industry}>{s.industry} ({s.count.toLocaleString()})</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label><Tag size={10} /> Contact Type</label>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              {filterOptions.contactTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label><Globe size={10} /> Country</label>
            <select value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setPage(1); }}>
              <option value="">All Countries</option>
              {filterOptions.countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label><Globe size={10} /> Region</label>
            <select value={regionFilter} onChange={e => { setRegionFilter(e.target.value); setPage(1); }}>
              <option value="">All Regions</option>
              {filterOptions.regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label><Users size={10} /> Source</label>
            <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }}>
              <option value="">All Sources</option>
              {filterOptions.sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label><Mail size={10} /> Email</label>
            <select value={emailFilter} onChange={e => { setEmailFilter(e.target.value); setPage(1); }} style={{ minWidth: 100 }}>
              <option value="">Any</option>
              <option value="yes">Has Email</option>
              <option value="no">No Email</option>
            </select>
          </div>
          <div className="filter-group">
            <label><Phone size={10} /> Phone</label>
            <select value={phoneFilter} onChange={e => { setPhoneFilter(e.target.value); setPage(1); }} style={{ minWidth: 100 }}>
              <option value="">Any</option>
              <option value="yes">Has Phone</option>
              <option value="no">No Phone</option>
            </select>
          </div>
        </div>
        {activeFilters.length > 0 && (
          <div className="active-filters">
            {activeFilters.map(f => (
              <span key={f.key} className="filter-pill" onClick={() => { f.clear(); setPage(1); }}>
                {f.label} <span className="x">×</span>
              </span>
            ))}
            <span style={{ fontSize: 12, color: 'var(--neutral-500)', padding: '3px 0', fontWeight: 500 }}>
              → <strong style={{ color: 'var(--primary)' }}>{totalFiltered.toLocaleString()}</strong> results
            </span>
          </div>
        )}
      </div>

      {/* Data Quality Summary */}
      <DQSummaryPanel stats={dqStats} />

      {/* Industry Cards */}
      <div className="industry-grid">
        {industrySummary.map(ind => {
          const color = INDUSTRY_COLORS[ind.industry] || '#94A3B8';
          const icon = INDUSTRY_ICONS[ind.industry] || '📁';
          const product = INDUSTRY_PRODUCTS[ind.industry] || '';
          const isSelected = selectedIndustry === ind.industry;
          const emailPct = ind.count > 0 ? Math.round((ind.withEmail / ind.count) * 100) : 0;
          return (
            <div key={ind.industry} className={`industry-card ${isSelected ? 'selected' : ''}`}
              style={{ borderColor: isSelected ? color : undefined }}
              onClick={() => { setSelectedIndustry(isSelected ? '' : ind.industry); setPage(1); }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
              <div className="industry-card-top">
                <span className="industry-card-icon">{icon}</span>
                <span className="industry-card-count" style={{ color }}>{ind.count.toLocaleString()}</span>
              </div>
              <div className="industry-card-name">{ind.industry}</div>
              <div className="industry-card-stats">
                <span className="industry-card-stat"><Mail size={9} /> {ind.withEmail.toLocaleString()}</span>
                <span className="industry-card-stat"><Phone size={9} /> {ind.withPhone.toLocaleString()}</span>
                {ind.withLinkedin > 0 && <span className="industry-card-stat"><Link2 size={9} /> {ind.withLinkedin}</span>}
              </div>
              <div className="industry-card-bar">
                <div className="industry-card-bar-fill" style={{ width: `${emailPct}%`, background: color }} />
              </div>
              <div className="industry-product-tag">{product}</div>
            </div>
          );
        })}
      </div>

      {/* Contact Table */}
      <div className="contact-table-wrap">
        <div className="contact-table-header">
          <h3>{selectedIndustry ? `${INDUSTRY_ICONS[selectedIndustry] || ''} ${selectedIndustry}` : 'All Contacts'}</h3>
          <span style={{ fontSize: 11, color: 'var(--neutral-400)' }}>
            {loading ? 'Loading...' : `${totalFiltered.toLocaleString()} records`}
            {!canExport && <span style={{ marginLeft: 8, color: '#F59E0B', fontSize: 10 }}>🔒 Email/Phone masked</span>}
          </span>
        </div>
        <div className="contact-table-scroll">
          <table className="contact-table" style={!canExport ? { userSelect: 'none' } : {}}>
            <thead>
              <tr>
                <th>DQ Score</th>
                <th>Industry</th>
                <th>Name</th>
                <th>Company</th>
                <th>Title</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Country</th>
                <th>Product</th>
                <th>Source</th>
                <th>Type</th>
                <th>LinkedIn</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                  <div className="loading-spinner" /> Loading contacts from database...
                </td></tr>
              ) : contacts.map((c, i) => {
                const color = INDUSTRY_COLORS[c.industry] || '#94A3B8';
                return (
                  <tr key={c.id || i}>
                    <td><DQBadge score={c.data_quality_score} contact={c} size="sm" /></td>
                    <td>
                      <span className="industry-badge" style={{ background: `${color}15`, color }}>
                        {INDUSTRY_ICONS[c.industry]} {c.industry?.length > 14 ? c.industry.slice(0,12)+'…' : c.industry}
                      </span>
                    </td>
                    <td className="contact-name">{c.name || '—'}</td>
                    <td className="contact-company">{c.company || '—'}</td>
                    <td style={{ fontSize: 11, color: '#64748B', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title || '—'}</td>
                    <td>{c.email && c.email.includes('@') ? <span className="contact-email">{maskEmail(c.email)}</span> : <span style={{ color: '#CBD5E1' }}>—</span>}</td>
                    <td>{c.phone && c.phone.length > 4 ? <span className="contact-phone">{maskPhone(c.phone)}</span> : <span style={{ color: '#CBD5E1' }}>—</span>}</td>
                    <td style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>{c.country !== 'Unknown' ? c.country : <span style={{color:'#CBD5E1'}}>—</span>}</td>
                    <td style={{ fontSize: 10, color: '#64748B' }}>{c.product || '—'}</td>
                    <td style={{ fontSize: 10, color: '#94A3B8' }}>{c.source || '—'}</td>
                    <td><span className={`type-badge ${getTypeBadgeClass(c.contact_type)}`}>{c.contact_type}</span></td>
                    <td>
                      {c.linkedin ? <a className="contact-linkedin" href={c.linkedin} target="_blank" rel="noopener noreferrer">🔗 View</a> : <span style={{ color: '#CBD5E1' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
              {!loading && contacts.length === 0 && (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>No contacts match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="explorer-pagination">
            <span className="explorer-pagination-info">
              {totalFiltered > 0 ? `${((page-1)*PER_PAGE)+1}–${Math.min(page*PER_PAGE, totalFiltered)}` : '0'} of {totalFiltered.toLocaleString()}
            </span>
            <div className="explorer-pagination-buttons">
              <button className="page-btn" disabled={page===1} onClick={() => setPage(1)}>«</button>
              <button className="page-btn" disabled={page===1} onClick={() => setPage(p => p-1)}>‹</button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pg;
                if (totalPages <= 7) pg = i+1;
                else if (page <= 4) pg = i+1;
                else if (page >= totalPages-3) pg = totalPages-6+i;
                else pg = page-3+i;
                return <button key={pg} className={`page-btn ${page===pg?'active':''}`} onClick={() => setPage(pg)}>{pg}</button>;
              })}
              <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(p => p+1)}>›</button>
              <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(totalPages)}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* Export Gate Modal */}
      {showExportModal && (
        <div className="pw-modal-overlay" onClick={() => { setShowExportModal(false); setExportRequestSent(false); }}>
          <div className="pw-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="pw-modal-header">
              <div className="pw-modal-icon" style={{ background: '#FEF3C7' }}>
                <ShieldAlert size={20} color="#F59E0B" />
              </div>
              <div>
                <h3>Export Restricted</h3>
                <p>Contact data exports require admin approval</p>
              </div>
              <button className="pw-modal-close" onClick={() => { setShowExportModal(false); setExportRequestSent(false); }}>×</button>
            </div>
            <div className="pw-modal-body" style={{ padding: '20px 24px' }}>
              {exportRequestSent ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <CheckCircle size={48} color="#10B981" style={{ marginBottom: 12 }} />
                  <h4 style={{ color: '#10B981', marginBottom: 8 }}>Request Submitted!</h4>
                  <p style={{ color: '#64748B', fontSize: 13 }}>
                    Your export request for {totalFiltered.toLocaleString()} contacts has been sent to the admin for approval.
                    You'll be notified when it's approved.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ background: '#FEF3C7', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
                    <strong>Why is export restricted?</strong><br/>
                    Contact data is sensitive business intelligence. Exports are limited to Admin and Sales Manager roles to protect data privacy.
                  </div>
                  <div style={{ background: '#F1F5F9', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 12, color: '#475569' }}>
                    <div><strong>Your role:</strong> {user?.role}</div>
                    <div><strong>Records requested:</strong> {totalFiltered.toLocaleString()}</div>
                    <div><strong>Filters:</strong> {activeFilters.length > 0 ? activeFilters.map(f => f.label).join(', ') : 'None'}</div>
                  </div>
                </>
              )}
            </div>
            <div className="pw-modal-footer">
              <button className="pw-btn-cancel" onClick={() => { setShowExportModal(false); setExportRequestSent(false); }}>
                {exportRequestSent ? 'Close' : 'Cancel'}
              </button>
              {!exportRequestSent && (
                <button className="pw-btn-save" onClick={handleRequestExport} disabled={exportLoading}>
                  {exportLoading ? <span className="pw-spinner" /> : '📋 Request Export Approval'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
