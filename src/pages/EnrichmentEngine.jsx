import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Sparkles, Search, Mail, Phone, AlertTriangle, CheckCircle, XCircle, Loader2,
  Settings, Play, Pause, RefreshCw, Download, ChevronDown, ChevronUp,
  Zap, Globe, Building2, Shield, Key, Edit3, Save, X, Pencil, Check, UserPlus
} from 'lucide-react';
import { INDUSTRY_COLORS, INDUSTRY_ICONS, INDUSTRY_SUMMARY } from '../data/realContacts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import './EnrichmentEngine.css';

// ========== API INTEGRATION LAYER ==========

async function callGemini(apiKey, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
      })
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function verifyEmailWithHunter(apiKey, email) {
  const res = await fetch(
    `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${apiKey}`
  );
  const data = await res.json();
  return data.data || null;
}

// ========== COMPONENT ==========

export default function EnrichmentEngine() {
  const { user } = useAuth();

  // API Keys
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [hunterKey, setHunterKey] = useState(localStorage.getItem('hunter_api_key') || '');
  const [showSettings, setShowSettings] = useState(!geminiKey);

  // Filters
  const [industry, setIndustry] = useState('');
  const [missingField, setMissingField] = useState('email');
  const [page, setPage] = useState(1);

  // Data from Supabase
  const [contacts, setContacts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ noEmail: 0, noPhone: 0, noBoth: 0, hasCompany: 0, manualUpdates: 0, byInd: {} });

  // Enrichment state
  const [enriching, setEnriching] = useState(false);
  const [enrichedResults, setEnrichedResults] = useState({});
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  // Manual edit state
  const [editingCell, setEditingCell] = useState(null); // { id, field }
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState(null); // full contact edit modal
  const [editForm, setEditForm] = useState({});
  const [recentUpdates, setRecentUpdates] = useState([]);

  const PER_PAGE = 20;

  // Save API keys
  const saveKeys = () => {
    localStorage.setItem('gemini_api_key', geminiKey);
    localStorage.setItem('hunter_api_key', hunterKey);
    setShowSettings(false);
    addLog('info', 'API keys saved securely to browser storage');
  };

  const addLog = useCallback((type, msg) => {
    setLogs(prev => [{ type, msg, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 200));
  }, []);

  // ========== SUPABASE DATA LOADING ==========

  // Load stats
  useEffect(() => {
    loadStats();
  }, []);

  // Load contacts when filters change
  useEffect(() => {
    loadContacts();
  }, [industry, missingField, page]);

  const loadStats = async () => {
    // Get missing data counts using batched queries
    let allData = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data } = await supabase
        .from('contacts')
        .select('industry, email, phone, company')
        .range(from, from + batchSize - 1);

      if (data && data.length > 0) {
        allData = allData.concat(data);
        from += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    const byInd = {};
    let noEmail = 0, noPhone = 0, noBoth = 0, hasCompany = 0;

    allData.forEach(c => {
      const missingEmail = !c.email || !c.email.includes('@');
      const missingPhone = !c.phone || c.phone.length <= 4;

      if (!byInd[c.industry]) byInd[c.industry] = { total: 0, noEmail: 0, noPhone: 0 };
      byInd[c.industry].total++;

      if (missingEmail) { noEmail++; byInd[c.industry].noEmail++; }
      if (missingPhone) { noPhone++; byInd[c.industry].noPhone++; }
      if (missingEmail && missingPhone) noBoth++;
      if (missingEmail && c.company && c.company.trim().length > 2) hasCompany++;
    });

    setStats({ noEmail, noPhone, noBoth, hasCompany, manualUpdates: recentUpdates.length, byInd });
  };

  const loadContacts = async () => {
    setLoading(true);

    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' });

    if (industry) query = query.eq('industry', industry);

    // Filter by missing data
    if (missingField === 'email') {
      query = query.or('email.is.null,email.not.ilike.%@%');
    } else if (missingField === 'phone') {
      query = query.or('phone.is.null,phone.eq.,phone.lte.1234');
    } else {
      // Missing both
      query = query.or('email.is.null,email.not.ilike.%@%').or('phone.is.null,phone.eq.,phone.lte.1234');
    }

    const from = (page - 1) * PER_PAGE;
    query = query.range(from, from + PER_PAGE - 1).order('company', { ascending: true });

    const { data, count, error } = await query;

    if (error) {
      console.error('Error loading contacts:', error);
      addLog('error', `Failed to load contacts: ${error.message}`);
    }

    setContacts(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  // ========== MANUAL INLINE EDITING ==========

  const startEdit = (contactId, field, currentValue) => {
    setEditingCell({ id: contactId, field });
    setEditValue(currentValue || '');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    setSaving(true);

    const { id, field } = editingCell;
    const updates = { [field]: editValue.trim() || null };

    const { error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id);

    if (error) {
      addLog('error', `Failed to save ${field}: ${error.message}`);
    } else {
      // Update local state
      setContacts(prev => prev.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ));
      setRecentUpdates(prev => [
        { id, field, value: editValue.trim(), time: new Date().toLocaleTimeString(), user: user?.email },
        ...prev
      ].slice(0, 50));
      addLog('success', `Updated ${field} for contact ${id.slice(0,8)}...`);
    }

    setSaving(false);
    setEditingCell(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  // ========== FULL CONTACT EDIT MODAL ==========

  const openEditModal = (contact) => {
    setEditModal(contact);
    setEditForm({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      title: contact.title || '',
      linkedin: contact.linkedin || '',
      location: contact.location || '',
      status: contact.status || '',
      score: contact.score || '',
    });
  };

  const saveEditModal = async () => {
    if (!editModal) return;
    setSaving(true);

    const updates = {};
    Object.entries(editForm).forEach(([key, val]) => {
      if (val !== (editModal[key] || '')) {
        updates[key] = val.trim() || null;
      }
    });

    if (Object.keys(updates).length === 0) {
      setSaving(false);
      setEditModal(null);
      return;
    }

    const { error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', editModal.id);

    if (error) {
      addLog('error', `Failed to update contact: ${error.message}`);
    } else {
      setContacts(prev => prev.map(c =>
        c.id === editModal.id ? { ...c, ...updates } : c
      ));
      const changedFields = Object.keys(updates).join(', ');
      setRecentUpdates(prev => [
        { id: editModal.id, field: changedFields, value: 'multiple fields', time: new Date().toLocaleTimeString(), user: user?.email },
        ...prev
      ].slice(0, 50));
      addLog('success', `Updated ${changedFields} for ${editModal.name || editModal.company}`);
    }

    setSaving(false);
    setEditModal(null);
  };

  // ========== AI ENRICHMENT ==========
  const runEnrichment = async (contactList) => {
    if (!geminiKey) { addLog('error', 'Gemini API key is required'); setShowSettings(true); return; }

    setEnriching(true);
    const total = contactList.length;
    setProgress({ current: 0, total });
    addLog('info', `Starting AI enrichment for ${total} contacts...`);

    const batchSize = 5;
    for (let i = 0; i < contactList.length; i += batchSize) {
      const batch = contactList.slice(i, i + batchSize);
      const batchInfo = batch.map(c => `- Name: "${c.name}", Company: "${c.company}", Title: "${c.title}", Industry: "${c.industry}", Location: "${c.location}"`).join('\n');

      const prompt = `You are a B2B contact data enrichment assistant for the logistics and air cargo industry.

For each contact below, generate the most likely professional email address and phone number.

Rules:
1. Use common email patterns: firstname.lastname@domain.com, first.last@domain.com, firstname@domain.com, f.lastname@domain.com
2. Try to identify the company's actual domain from the company name (e.g., "Swissport" → swissport.com)
3. For phone numbers, use the country code based on location (India: +91, UAE: +971, UK: +44, USA: +1, Germany: +49, etc.)
4. If you cannot determine a likely email, output "UNKNOWN"
5. Rate your confidence: HIGH (known company domain), MEDIUM (guessed domain), LOW (uncertain)

Contacts:
${batchInfo}

Respond in STRICT JSON array format:
[{"name":"...","email":"...","phone":"...","domain":"...","confidence":"HIGH|MEDIUM|LOW","reasoning":"..."}]
JSON only, no other text.`;

      try {
        const response = await callGemini(geminiKey, prompt);
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const results = JSON.parse(jsonMatch[0]);
          results.forEach((r, idx) => {
            const contact = batch[idx];
            if (contact) {
              const key = contact.id;
              setEnrichedResults(prev => ({
                ...prev,
                [key]: { ...r, original: contact, verified: false, accepted: false }
              }));
            }
          });
          addLog('success', `Batch ${Math.floor(i/batchSize)+1}: Enriched ${results.length} contacts`);
        }
      } catch (err) {
        addLog('error', `Batch ${Math.floor(i/batchSize)+1} failed: ${err.message}`);
      }

      setProgress({ current: Math.min(i + batchSize, total), total });
      if (i + batchSize < contactList.length) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    setEnriching(false);
    addLog('success', `Enrichment complete! Processed ${total} contacts.`);
  };

  // Accept AI suggestion — save to Supabase
  const acceptSuggestion = async (contactId, result) => {
    const updates = {};
    if (result.email && result.email !== 'UNKNOWN') updates.email = result.email;
    if (result.phone && result.phone !== 'UNKNOWN') updates.phone = result.phone;

    if (Object.keys(updates).length === 0) return;

    const { error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', contactId);

    if (error) {
      addLog('error', `Failed to accept suggestion: ${error.message}`);
    } else {
      setContacts(prev => prev.map(c =>
        c.id === contactId ? { ...c, ...updates } : c
      ));
      setEnrichedResults(prev => ({
        ...prev,
        [contactId]: { ...prev[contactId], accepted: true }
      }));
      addLog('success', `Accepted AI suggestion for ${result.original?.name || 'contact'}`);
    }
  };

  // Verify single email with Hunter
  const verifyEmail = async (key, email) => {
    if (!hunterKey) { addLog('error', 'Hunter.io API key required for verification'); return; }
    addLog('info', `Verifying ${email}...`);
    try {
      const result = await verifyEmailWithHunter(hunterKey, email);
      setEnrichedResults(prev => ({
        ...prev,
        [key]: { ...prev[key], verified: true, verifyResult: result }
      }));
      addLog(result?.result === 'deliverable' ? 'success' : 'warn',
        `${email}: ${result?.result || 'unknown'} (score: ${result?.score || 'N/A'})`);
    } catch (err) {
      addLog('error', `Verification failed: ${err.message}`);
    }
  };

  // Export enriched results
  const exportResults = () => {
    const results = Object.values(enrichedResults).filter(r => r.email !== 'UNKNOWN');
    const headers = ['Name','Company','Industry','Original Email','Suggested Email','Confidence','Phone','Verified','Reasoning'];
    const rows = results.map(r => [
      r.original?.name, r.original?.company, r.original?.industry,
      r.original?.email, r.email, r.confidence, r.phone,
      r.verified ? (r.verifyResult?.result || 'checked') : 'pending',
      r.reasoning
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Hans_Enriched_Contacts_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const enrichedCount = Object.keys(enrichedResults).length;
  const verifiedCount = Object.values(enrichedResults).filter(r => r.verified).length;

  // Render editable cell
  const renderEditableCell = (contact, field, displayFn) => {
    const isEditing = editingCell?.id === contact.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <div className="inline-edit-wrap">
          <input
            className="inline-edit-input"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleEditKeyDown}
            autoFocus
            placeholder={`Enter ${field}...`}
          />
          <button className="inline-edit-btn save" onClick={saveEdit} disabled={saving}>
            <Check size={10} />
          </button>
          <button className="inline-edit-btn cancel" onClick={cancelEdit}>
            <X size={10} />
          </button>
        </div>
      );
    }

    return (
      <div className="editable-cell" onClick={() => startEdit(contact.id, field, contact[field])}>
        {displayFn ? displayFn(contact[field]) : (contact[field] || '—')}
        <Pencil size={9} className="edit-pencil" />
      </div>
    );
  };

  return (
    <div className="enrich-page animate-in">
      {/* Header — title shown in topbar, keep only action buttons */}
      <div className="enrich-header">
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setShowSettings(!showSettings)}>
            <Key size={14} /> API Keys
          </button>
          {enrichedCount > 0 && (
            <button className="btn btn-primary" onClick={exportResults}>
              <Download size={14} /> Export {enrichedCount} Results
            </button>
          )}
        </div>
      </div>

      {/* API Key Settings */}
      {showSettings && (
        <div className="enrich-settings-panel">
          <h3><Key size={14} /> API Configuration (Free Tiers)</h3>
          <div className="settings-grid">
            <div className="setting-group">
              <label>Google Gemini API Key <span className="free-tag">FREE</span></label>
              <p className="setting-desc">Powers AI email pattern generation. Get key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">aistudio.google.com</a></p>
              <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..." className="setting-input" />
              <span className="setting-limit">Free: 15 RPM / 1,000 RPD</span>
            </div>
            <div className="setting-group">
              <label>Hunter.io API Key <span className="free-tag">FREE</span></label>
              <p className="setting-desc">Email finder + verification. Get key at <a href="https://hunter.io" target="_blank" rel="noopener noreferrer">hunter.io</a></p>
              <input type="password" value={hunterKey} onChange={e => setHunterKey(e.target.value)}
                placeholder="abc123..." className="setting-input" />
              <span className="setting-limit">Free: 25 searches + 50 verifications/mo</span>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={saveKeys}><CheckCircle size={12} /> Save Keys</button>
        </div>
      )}

      {/* Missing Data Dashboard */}
      <div className="missing-data-dashboard">
        <div className="missing-stat-card red">
          <Mail size={20} />
          <div className="missing-stat-number">{stats.noEmail.toLocaleString()}</div>
          <div className="missing-stat-label">Missing Email</div>
        </div>
        <div className="missing-stat-card orange">
          <Phone size={20} />
          <div className="missing-stat-number">{stats.noPhone.toLocaleString()}</div>
          <div className="missing-stat-label">Missing Phone</div>
        </div>
        <div className="missing-stat-card yellow">
          <AlertTriangle size={20} />
          <div className="missing-stat-number">{stats.noBoth.toLocaleString()}</div>
          <div className="missing-stat-label">Missing Both</div>
        </div>
        <div className="missing-stat-card green">
          <Building2 size={20} />
          <div className="missing-stat-number">{stats.hasCompany.toLocaleString()}</div>
          <div className="missing-stat-label">Enrichable (Has Company)</div>
        </div>
        <div className="missing-stat-card blue">
          <Sparkles size={20} />
          <div className="missing-stat-number">{enrichedCount}</div>
          <div className="missing-stat-label">AI Enriched</div>
        </div>
        <div className="missing-stat-card purple">
          <Edit3 size={20} />
          <div className="missing-stat-number">{recentUpdates.length}</div>
          <div className="missing-stat-label">Manual Updates</div>
        </div>
      </div>

      {/* Recent Manual Updates Strip */}
      {recentUpdates.length > 0 && (
        <div className="recent-updates-strip">
          <div className="recent-updates-header">
            <Edit3 size={12} />
            <span>Recent Manual Updates ({recentUpdates.length})</span>
            <button className="btn btn-ghost btn-xs" onClick={() => setRecentUpdates([])}>Clear</button>
          </div>
          <div className="recent-updates-list">
            {recentUpdates.slice(0, 5).map((u, i) => (
              <div key={i} className="recent-update-item">
                <span className="update-time">{u.time}</span>
                <span className="update-field">{u.field}</span>
                <span className="update-value">{typeof u.value === 'string' && u.value.length > 30 ? u.value.slice(0,28)+'…' : u.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Industry Breakdown */}
      <div className="missing-by-industry">
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Missing Data by Industry</h3>
        <div className="industry-missing-grid">
          {Object.entries(stats.byInd)
            .sort((a, b) => b[1].noEmail - a[1].noEmail)
            .map(([ind, s]) => (
              <div key={ind} className={`ind-missing-card ${industry === ind ? 'selected' : ''}`}
                onClick={() => { setIndustry(industry === ind ? '' : ind); setPage(1); }}>
                <span className="ind-icon">{INDUSTRY_ICONS[ind] || '📁'}</span>
                <div className="ind-info">
                  <div className="ind-name">{ind.length > 20 ? ind.slice(0,18)+'…' : ind}</div>
                  <div className="ind-missing-bars">
                    <span className="missing-bar email-bar">
                      <span style={{ width: `${s.total > 0 ? (s.noEmail/s.total)*100 : 0}%` }} />
                    </span>
                    <span className="missing-nums">
                      <Mail size={9} /> {s.noEmail}/{s.total}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Controls */}
      <div className="enrich-controls">
        <div className="enrich-filters">
          <select value={missingField} onChange={e => { setMissingField(e.target.value); setPage(1); }}>
            <option value="email">Missing Email</option>
            <option value="phone">Missing Phone</option>
            <option value="both">Missing Both</option>
          </select>
          <select value={industry} onChange={e => { setIndustry(e.target.value); setPage(1); }}>
            <option value="">All Industries</option>
            {INDUSTRY_SUMMARY.map(s => <option key={s.industry} value={s.industry}>{s.industry}</option>)}
          </select>
          <span className="result-count">
            {loading ? 'Loading...' : `${totalCount.toLocaleString()} contacts to enrich`}
          </span>
        </div>
        <div className="enrich-actions">
          <button className="btn btn-primary"
            disabled={enriching || totalCount === 0 || !geminiKey}
            onClick={() => runEnrichment(contacts.slice(0, 50))}>
            {enriching ? <><Loader2 size={14} className="spin" /> Enriching...</> : <><Sparkles size={14} /> Enrich Top 50</>}
          </button>
          <button className="btn btn-ghost"
            disabled={enriching || totalCount === 0 || !geminiKey}
            onClick={() => runEnrichment(contacts)}>
            <Zap size={14} /> Enrich This Page
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => { loadContacts(); loadStats(); }}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowLogs(!showLogs)}>
            {showLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Logs ({logs.length})
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {enriching && (
        <div className="enrich-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(progress.current/progress.total)*100}%` }} />
          </div>
          <span className="progress-text">{progress.current} / {progress.total} contacts</span>
        </div>
      )}

      {/* Logs */}
      {showLogs && (
        <div className="enrich-logs">
          {logs.map((l, i) => (
            <div key={i} className={`log-entry log-${l.type}`}>
              <span className="log-time">{l.time}</span>
              <span className="log-msg">{l.msg}</span>
            </div>
          ))}
          {logs.length === 0 && <span style={{ color: '#94A3B8', fontSize: 12 }}>No activity yet</span>}
        </div>
      )}

      {/* Contact Table with Manual Edit + AI Enrichment */}
      <div className="enrich-table-wrap">
        <div className="enrich-table-toolbar">
          <span className="table-info">
            <Edit3 size={12} /> Click any <span className="highlight">email</span>, <span className="highlight">phone</span>, or <span className="highlight">title</span> cell to edit manually
          </span>
        </div>
        <table className="enrich-table">
          <thead>
            <tr>
              <th>Industry</th>
              <th>Name</th>
              <th>Company</th>
              <th>Title</th>
              <th>Email</th>
              <th>Phone</th>
              <th>AI Suggested Email</th>
              <th>Confidence</th>
              <th>AI Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                <div className="loading-spinner" /> Loading contacts from database...
              </td></tr>
            ) : contacts.map((c) => {
              const result = enrichedResults[c.id];
              const color = INDUSTRY_COLORS[c.industry] || '#94A3B8';
              return (
                <tr key={c.id}>
                  <td><span className="industry-badge" style={{ background: `${color}15`, color }}>{INDUSTRY_ICONS[c.industry]} {c.industry?.length > 12 ? c.industry.slice(0,10)+'…' : c.industry}</span></td>
                  <td className="contact-name">
                    {renderEditableCell(c, 'name', (val) => val || '—')}
                  </td>
                  <td className="contact-company">{c.company || '—'}</td>
                  <td style={{ fontSize: 11, color: '#64748B', maxWidth: 140 }}>
                    {renderEditableCell(c, 'title', (val) => val || '—')}
                  </td>
                  <td>
                    {renderEditableCell(c, 'email', (val) =>
                      val && val.includes('@')
                        ? <span className="has-data">{val}</span>
                        : <span className="missing-data">✕ Missing</span>
                    )}
                  </td>
                  <td>
                    {renderEditableCell(c, 'phone', (val) =>
                      val && val.length > 4
                        ? <span className="has-data">{val}</span>
                        : <span className="missing-data">✕ Missing</span>
                    )}
                  </td>
                  <td>
                    {result ? (
                      result.email !== 'UNKNOWN' ? (
                        <span className="suggested-email">
                          {result.verified && result.verifyResult?.result === 'deliverable' && <CheckCircle size={10} color="#10B981" />}
                          {result.verified && result.verifyResult?.result !== 'deliverable' && <XCircle size={10} color="#EF4444" />}
                          {result.email}
                        </span>
                      ) : <span style={{ color: '#CBD5E1', fontSize: 11 }}>Could not determine</span>
                    ) : <span style={{ color: '#E2E8F0', fontSize: 11 }}>—</span>}
                  </td>
                  <td>
                    {result && result.email !== 'UNKNOWN' && (
                      <span className={`conf-badge conf-${(result.confidence||'low').toLowerCase()}`}>
                        {result.confidence}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 11, color: '#64748B' }}>{result?.phone || '—'}</td>
                  <td>
                    <div className="action-buttons">
                      {result && result.email !== 'UNKNOWN' && !result.accepted && (
                        <button className="btn btn-ghost btn-xs accept-btn" onClick={() => acceptSuggestion(c.id, result)} title="Accept AI suggestion and save to database">
                          <Check size={10} /> Accept
                        </button>
                      )}
                      {result?.accepted && (
                        <span className="accepted-badge"><CheckCircle size={10} /> Saved</span>
                      )}
                      {result && result.email !== 'UNKNOWN' && hunterKey && !result.verified && (
                        <button className="btn btn-ghost btn-xs" onClick={() => verifyEmail(c.id, result.email)}>
                          <Shield size={10} /> Verify
                        </button>
                      )}
                      <button className="btn btn-ghost btn-xs edit-full-btn" onClick={() => openEditModal(c)} title="Edit all fields">
                        <Edit3 size={10} /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && contacts.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                {totalCount === 0 ? '🎉 All contacts in this segment have data!' : 'No contacts to show'}
              </td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="explorer-pagination">
            <span className="explorer-pagination-info">{((page-1)*PER_PAGE)+1}–{Math.min(page*PER_PAGE, totalCount)} of {totalCount.toLocaleString()}</span>
            <div className="explorer-pagination-buttons">
              <button className="page-btn" disabled={page===1} onClick={() => setPage(1)}>«</button>
              <button className="page-btn" disabled={page===1} onClick={() => setPage(p => p-1)}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pg = totalPages <= 5 ? i+1 : page <= 3 ? i+1 : page >= totalPages-2 ? totalPages-4+i : page-2+i;
                return <button key={pg} className={`page-btn ${page===pg?'active':''}`} onClick={() => setPage(pg)}>{pg}</button>;
              })}
              <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(p => p+1)}>›</button>
              <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(totalPages)}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* Full Edit Modal */}
      {editModal && (
        <div className="pw-modal-overlay" onClick={() => setEditModal(null)}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <div className="edit-modal-header">
              <div className="edit-modal-icon">
                <Edit3 size={20} color="#10B981" />
              </div>
              <div>
                <h3>Edit Contact</h3>
                <p>Manually update contact information — saved directly to database</p>
              </div>
              <button className="pw-modal-close" onClick={() => setEditModal(null)}>×</button>
            </div>

            <div className="edit-modal-body">
              <div className="edit-modal-info">
                <span className="industry-badge" style={{ background: `${INDUSTRY_COLORS[editModal.industry] || '#94A3B8'}15`, color: INDUSTRY_COLORS[editModal.industry] }}>
                  {INDUSTRY_ICONS[editModal.industry]} {editModal.industry}
                </span>
                <span className="edit-company-name">{editModal.company}</span>
              </div>

              <div className="edit-form-grid">
                <div className="edit-form-group">
                  <label>Full Name</label>
                  <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Enter full name..." />
                </div>
                <div className="edit-form-group">
                  <label>Job Title</label>
                  <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Enter job title..." />
                </div>
                <div className="edit-form-group full-width">
                  <label><Mail size={12} /> Email Address</label>
                  <input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="name@company.com" type="email" className="highlight-field" />
                </div>
                <div className="edit-form-group full-width">
                  <label><Phone size={12} /> Phone Number</label>
                  <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91-XXXXX-XXXXX" type="tel" className="highlight-field" />
                </div>
                <div className="edit-form-group full-width">
                  <label>LinkedIn Profile</label>
                  <input value={editForm.linkedin} onChange={e => setEditForm(f => ({ ...f, linkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="edit-form-group">
                  <label>Location</label>
                  <input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="City, Country" />
                </div>
                <div className="edit-form-group">
                  <label>Lead Score</label>
                  <input value={editForm.score} onChange={e => setEditForm(f => ({ ...f, score: e.target.value }))}
                    placeholder="0-100" />
                </div>
              </div>
            </div>

            <div className="edit-modal-footer">
              <button className="pw-btn-cancel" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="pw-btn-save" onClick={saveEditModal} disabled={saving}>
                {saving ? <span className="pw-spinner" /> : <><Save size={14} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
