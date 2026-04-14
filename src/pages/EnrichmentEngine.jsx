import { useState, useMemo, useCallback } from 'react';
import {
  Sparkles, Search, Mail, Phone, AlertTriangle, CheckCircle, XCircle, Loader2,
  Settings, Play, Pause, RefreshCw, Download, ChevronDown, ChevronUp,
  Zap, Globe, Building2, Shield, Key
} from 'lucide-react';
import { ALL_CONTACTS, INDUSTRY_SUMMARY, INDUSTRY_COLORS, INDUSTRY_ICONS } from '../data/realContacts';
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

async function findEmailWithHunter(apiKey, domain, firstName, lastName) {
  const res = await fetch(
    `https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${apiKey}`
  );
  const data = await res.json();
  return data.data || null;
}

async function verifyEmailWithHunter(apiKey, email) {
  const res = await fetch(
    `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${apiKey}`
  );
  const data = await res.json();
  return data.data || null;
}

async function domainSearchHunter(apiKey, domain) {
  const res = await fetch(
    `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${apiKey}`
  );
  const data = await res.json();
  return data.data || null;
}

// ========== COMPONENT ==========

export default function EnrichmentEngine() {
  // API Keys
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [hunterKey, setHunterKey] = useState(localStorage.getItem('hunter_api_key') || '');
  const [showSettings, setShowSettings] = useState(!geminiKey);

  // Filters
  const [industry, setIndustry] = useState('');
  const [missingField, setMissingField] = useState('email');
  const [page, setPage] = useState(1);

  // Enrichment state
  const [enriching, setEnriching] = useState(false);
  const [enrichedResults, setEnrichedResults] = useState({});
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

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

  // Missing data analysis
  const stats = useMemo(() => {
    const noEmail = ALL_CONTACTS.filter(c => !c.email || !c.email.includes('@'));
    const noPhone = ALL_CONTACTS.filter(c => !c.phone || c.phone.length <= 4);
    const noBoth = ALL_CONTACTS.filter(c => (!c.email || !c.email.includes('@')) && (!c.phone || c.phone.length <= 4));
    const hasCompany = noEmail.filter(c => c.company && c.company.trim().length > 2);

    // By industry
    const byInd = {};
    ALL_CONTACTS.forEach(c => {
      if (!byInd[c.industry]) byInd[c.industry] = { total: 0, noEmail: 0, noPhone: 0 };
      byInd[c.industry].total++;
      if (!c.email || !c.email.includes('@')) byInd[c.industry].noEmail++;
      if (!c.phone || c.phone.length <= 4) byInd[c.industry].noPhone++;
    });

    return { noEmail: noEmail.length, noPhone: noPhone.length, noBoth: noBoth.length, hasCompany: hasCompany.length, byInd };
  }, []);

  // Contacts missing data
  const candidates = useMemo(() => {
    let list = ALL_CONTACTS;
    if (industry) list = list.filter(c => c.industry === industry);
    if (missingField === 'email') list = list.filter(c => !c.email || !c.email.includes('@'));
    else if (missingField === 'phone') list = list.filter(c => !c.phone || c.phone.length <= 4);
    else list = list.filter(c => (!c.email || !c.email.includes('@')) && (!c.phone || c.phone.length <= 4));
    // Prioritize contacts with company names
    return list.sort((a, b) => (b.company?.length || 0) - (a.company?.length || 0));
  }, [industry, missingField]);

  const PER_PAGE = 20;
  const totalPages = Math.ceil(candidates.length / PER_PAGE);
  const paged = candidates.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ========== AI ENRICHMENT ==========
  const runEnrichment = async (contacts) => {
    if (!geminiKey) { addLog('error', 'Gemini API key is required'); setShowSettings(true); return; }

    setEnriching(true);
    const total = contacts.length;
    setProgress({ current: 0, total });
    addLog('info', `Starting AI enrichment for ${total} contacts...`);

    const batchSize = 5;
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
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
        // Parse JSON from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const results = JSON.parse(jsonMatch[0]);
          results.forEach((r, idx) => {
            const contact = batch[idx];
            if (contact) {
              const key = `${contact.company}__${contact.name}`;
              setEnrichedResults(prev => ({
                ...prev,
                [key]: {
                  ...r,
                  original: contact,
                  verified: false,
                  accepted: false,
                }
              }));
            }
          });
          addLog('success', `Batch ${Math.floor(i/batchSize)+1}: Enriched ${results.length} contacts`);
        }
      } catch (err) {
        addLog('error', `Batch ${Math.floor(i/batchSize)+1} failed: ${err.message}`);
      }

      setProgress({ current: Math.min(i + batchSize, total), total });

      // Rate limiting: wait 2s between batches (free tier: 15 RPM)
      if (i + batchSize < contacts.length) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    setEnriching(false);
    addLog('success', `Enrichment complete! ${Object.keys(enrichedResults).length} contacts processed.`);
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
  const highConfCount = Object.values(enrichedResults).filter(r => r.confidence === 'HIGH').length;

  return (
    <div className="enrich-page animate-in">
      {/* Header */}
      <div className="enrich-header">
        <div>
          <h2 className="page-title">AI Enrichment Engine</h2>
          <p className="page-subtitle">Find missing emails & phone numbers using AI + verification APIs</p>
        </div>
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
          <Shield size={20} />
          <div className="missing-stat-number">{verifiedCount}</div>
          <div className="missing-stat-label">Verified</div>
        </div>
      </div>

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
                      <span style={{ width: `${(s.noEmail/s.total)*100}%` }} />
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
          <span className="result-count">{candidates.length.toLocaleString()} contacts to enrich</span>
        </div>
        <div className="enrich-actions">
          <button className="btn btn-primary"
            disabled={enriching || candidates.length === 0 || !geminiKey}
            onClick={() => runEnrichment(candidates.slice(0, 50))}>
            {enriching ? <><Loader2 size={14} className="spin" /> Enriching...</> : <><Sparkles size={14} /> Enrich Top 50</>}
          </button>
          <button className="btn btn-ghost"
            disabled={enriching || candidates.length === 0 || !geminiKey}
            onClick={() => runEnrichment(paged)}>
            <Zap size={14} /> Enrich This Page
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

      {/* Contact Table with Enrichment Results */}
      <div className="enrich-table-wrap">
        <table className="enrich-table">
          <thead>
            <tr>
              <th>Industry</th>
              <th>Name</th>
              <th>Company</th>
              <th>Title</th>
              <th>Current Email</th>
              <th>Current Phone</th>
              <th>AI Suggested Email</th>
              <th>Confidence</th>
              <th>AI Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((c, i) => {
              const key = `${c.company}__${c.name}`;
              const result = enrichedResults[key];
              const color = INDUSTRY_COLORS[c.industry] || '#94A3B8';
              return (
                <tr key={i}>
                  <td><span className="industry-badge" style={{ background: `${color}15`, color }}>{INDUSTRY_ICONS[c.industry]} {c.industry.length > 12 ? c.industry.slice(0,10)+'…' : c.industry}</span></td>
                  <td className="contact-name">{c.name || '—'}</td>
                  <td className="contact-company">{c.company || '—'}</td>
                  <td style={{ fontSize: 11, color: '#64748B' }}>{c.title || '—'}</td>
                  <td>{c.email && c.email.includes('@') ? <span className="has-data">{c.email}</span> : <span className="missing-data">✕ Missing</span>}</td>
                  <td>{c.phone && c.phone.length > 4 ? <span className="has-data">{c.phone}</span> : <span className="missing-data">✕ Missing</span>}</td>
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
                    {result && result.email !== 'UNKNOWN' && hunterKey && !result.verified && (
                      <button className="btn btn-ghost btn-xs" onClick={() => verifyEmail(key, result.email)}>
                        <Shield size={10} /> Verify
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                {candidates.length === 0 ? '🎉 All contacts in this segment have data!' : 'No contacts to show'}
              </td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="explorer-pagination">
            <span className="explorer-pagination-info">{((page-1)*PER_PAGE)+1}–{Math.min(page*PER_PAGE, candidates.length)} of {candidates.length.toLocaleString()}</span>
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
    </div>
  );
}
