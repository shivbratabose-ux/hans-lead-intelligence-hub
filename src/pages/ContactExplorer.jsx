import { useState, useMemo } from 'react';
import { Download, Mail, Phone, Link2, Filter, X, Search, SlidersHorizontal, Globe, Building2, Tag, Users, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ALL_CONTACTS, INDUSTRY_SUMMARY, INDUSTRY_COLORS, INDUSTRY_ICONS, INDUSTRY_PRODUCTS,
  FILTER_COUNTRIES, FILTER_REGIONS, FILTER_CONTACT_TYPES, FILTER_SOURCES
} from '../data/realContacts';
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
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [countryFilter, setCountryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');

  const activeFilterCount = [selectedIndustry, countryFilter, regionFilter, typeFilter, sourceFilter, emailFilter, phoneFilter].filter(Boolean).length + (search ? 1 : 0);

  const filtered = useMemo(() => {
    let list = ALL_CONTACTS;
    if (selectedIndustry) list = list.filter(c => c.industry === selectedIndustry);
    if (countryFilter) list = list.filter(c => c.country === countryFilter);
    if (regionFilter) list = list.filter(c => c.region === regionFilter);
    if (typeFilter) list = list.filter(c => c.contactType === typeFilter);
    if (sourceFilter) list = list.filter(c => c.source === sourceFilter);
    if (emailFilter === 'yes') list = list.filter(c => c.email && c.email.includes('@'));
    if (emailFilter === 'no') list = list.filter(c => !c.email || !c.email.includes('@'));
    if (phoneFilter === 'yes') list = list.filter(c => c.phone && c.phone.length > 4);
    if (phoneFilter === 'no') list = list.filter(c => !c.phone || c.phone.length <= 4);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q)) ||
        (c.title && c.title.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedIndustry, search, countryFilter, regionFilter, typeFilter, sourceFilter, emailFilter, phoneFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const clearFilters = () => {
    setSelectedIndustry(''); setSearch(''); setCountryFilter(''); setRegionFilter('');
    setTypeFilter(''); setSourceFilter(''); setEmailFilter(''); setPhoneFilter('');
    setPage(1);
  };

  // Analytics from filtered data
  const analytics = useMemo(() => {
    const bySrc = {}, byCountry = {}, byType = {}, byRegion = {};
    filtered.forEach(c => {
      bySrc[c.source] = (bySrc[c.source] || 0) + 1;
      byCountry[c.country] = (byCountry[c.country] || 0) + 1;
      byType[c.contactType] = (byType[c.contactType] || 0) + 1;
      byRegion[c.region] = (byRegion[c.region] || 0) + 1;
    });
    const sort = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]);
    return { bySrc: sort(bySrc), byCountry: sort(byCountry), byType: sort(byType), byRegion: sort(byRegion) };
  }, [filtered]);

  const totalContacts = ALL_CONTACTS.length;
  const totalEmails = ALL_CONTACTS.filter(c => c.email && c.email.includes('@')).length;
  const totalPhones = ALL_CONTACTS.filter(c => c.phone && c.phone.length > 4).length;
  const totalLinkedin = ALL_CONTACTS.filter(c => c.linkedin).length;
  const totalExisting = ALL_CONTACTS.filter(c => c.contactType === 'Existing Customer').length;

  const filteredEmails = filtered.filter(c => c.email && c.email.includes('@')).length;
  const filteredPhones = filtered.filter(c => c.phone && c.phone.length > 4).length;

  const donutData = INDUSTRY_SUMMARY.map(s => ({
    name: s.industry, value: s.count, color: INDUSTRY_COLORS[s.industry] || '#94A3B8',
  }));

  const exportCSV = () => {
    const headers = ['Industry','Name','Company','Title','Email','Phone','Location','Country','Region','Product','Source','Contact Type','Status','Score','LinkedIn'];
    const rows = filtered.map(c => [c.industry,c.name,c.company,c.title,c.email,c.phone,c.location,c.country,c.region,c.product,c.source,c.contactType,c.status,c.score,c.linkedin]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Hans_Contacts_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
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
        <button className="btn btn-primary" onClick={exportCSV}>
          <Download size={14} /> Export {filtered.length === totalContacts ? 'All' : filtered.length.toLocaleString()} Contacts
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
            {INDUSTRY_SUMMARY.slice(0, 5).map(s => (
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
              {INDUSTRY_SUMMARY.map(s => <option key={s.industry} value={s.industry}>{s.industry} ({s.count.toLocaleString()})</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label><Tag size={10} /> Contact Type</label>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              {FILTER_CONTACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label><Globe size={10} /> Country</label>
            <select value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setPage(1); }}>
              <option value="">All Countries</option>
              {FILTER_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label><Globe size={10} /> Region</label>
            <select value={regionFilter} onChange={e => { setRegionFilter(e.target.value); setPage(1); }}>
              <option value="">All Regions</option>
              {FILTER_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label><Users size={10} /> Source</label>
            <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }}>
              <option value="">All Sources</option>
              {FILTER_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
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
        {/* Active filter pills */}
        {activeFilters.length > 0 && (
          <div className="active-filters">
            {activeFilters.map(f => (
              <span key={f.key} className="filter-pill" onClick={() => { f.clear(); setPage(1); }}>
                {f.label} <span className="x">×</span>
              </span>
            ))}
            <span style={{ fontSize: 12, color: 'var(--neutral-500)', padding: '3px 0', fontWeight: 500 }}>
              → <strong style={{ color: 'var(--primary)' }}>{filtered.length.toLocaleString()}</strong> results
              ({filteredEmails.toLocaleString()} emails, {filteredPhones.toLocaleString()} phones)
            </span>
          </div>
        )}
      </div>

      {/* Analytics Row — shows breakdown of filtered data */}
      <div className="analytics-row">
        <div className="analytics-card">
          <div className="analytics-card-title"><BarChart3 size={12} /> By Source</div>
          <AnalyticsBar items={analytics.bySrc} maxVal={analytics.bySrc[0]?.[1] || 1} color="#10B981" />
        </div>
        <div className="analytics-card">
          <div className="analytics-card-title"><Tag size={12} /> By Contact Type</div>
          <AnalyticsBar items={analytics.byType} maxVal={analytics.byType[0]?.[1] || 1} color="#6366F1" />
        </div>
        <div className="analytics-card">
          <div className="analytics-card-title"><Globe size={12} /> By Country</div>
          <AnalyticsBar items={analytics.byCountry} maxVal={analytics.byCountry[0]?.[1] || 1} color="#0EA5E9" />
        </div>
        <div className="analytics-card">
          <div className="analytics-card-title"><Globe size={12} /> By Region</div>
          <AnalyticsBar items={analytics.byRegion} maxVal={analytics.byRegion[0]?.[1] || 1} color="#F97316" />
        </div>
      </div>

      {/* Industry Cards */}
      <div className="industry-grid">
        {INDUSTRY_SUMMARY.map(ind => {
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
          <span style={{ fontSize: 11, color: 'var(--neutral-400)' }}>{filtered.length.toLocaleString()} records</span>
        </div>
        <div className="contact-table-scroll">
          <table className="contact-table">
            <thead>
              <tr>
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
              {paged.map((c, i) => {
                const color = INDUSTRY_COLORS[c.industry] || '#94A3B8';
                return (
                  <tr key={i}>
                    <td>
                      <span className="industry-badge" style={{ background: `${color}15`, color }}>
                        {INDUSTRY_ICONS[c.industry]} {c.industry.length > 14 ? c.industry.slice(0,12)+'…' : c.industry}
                      </span>
                    </td>
                    <td className="contact-name">{c.name || '—'}</td>
                    <td className="contact-company">{c.company || '—'}</td>
                    <td style={{ fontSize: 11, color: '#64748B', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title || '—'}</td>
                    <td>{c.email && c.email.includes('@') ? <span className="contact-email">{c.email}</span> : <span style={{ color: '#CBD5E1' }}>—</span>}</td>
                    <td>{c.phone && c.phone.length > 4 ? <span className="contact-phone">{c.phone}</span> : <span style={{ color: '#CBD5E1' }}>—</span>}</td>
                    <td style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>{c.country !== 'Unknown' ? c.country : <span style={{color:'#CBD5E1'}}>—</span>}</td>
                    <td style={{ fontSize: 10, color: '#64748B' }}>{c.product || '—'}</td>
                    <td style={{ fontSize: 10, color: '#94A3B8' }}>{c.source || '—'}</td>
                    <td><span className={`type-badge ${getTypeBadgeClass(c.contactType)}`}>{c.contactType}</span></td>
                    <td>
                      {c.linkedin ? <a className="contact-linkedin" href={c.linkedin} target="_blank" rel="noopener noreferrer">🔗 View</a> : <span style={{ color: '#CBD5E1' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>No contacts match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="explorer-pagination">
            <span className="explorer-pagination-info">
              {filtered.length > 0 ? `${((page-1)*PER_PAGE)+1}–${Math.min(page*PER_PAGE, filtered.length)}` : '0'} of {filtered.length.toLocaleString()}
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
    </div>
  );
}
