import { useState } from 'react';
import { Download, Send, Sparkles, Zap } from 'lucide-react';
import { ENRICHED_LEADS, WEBHOOK_DESTINATIONS } from '../data/enrichedLeads';
import './LeadDatabase.css';

export default function LeadDatabase() {
  const [selected, setSelected] = useState([]);
  const [webhooks, setWebhooks] = useState(WEBHOOK_DESTINATIONS);

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === ENRICHED_LEADS.length ? [] : ENRICHED_LEADS.map(l => l.id));

  const fullCount = ENRICHED_LEADS.filter(l => l.enrichmentStatus === 'full').length;
  const verifiedCount = ENRICHED_LEADS.filter(l => l.emailStatus === 'verified').length;

  const toggleAutoSync = (id) => {
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, autoSync: !w.autoSync } : w));
  };

  return (
    <div className="database-page animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
        <div>
          <h2 className="page-title">Lead Database</h2>
          <p className="page-subtitle">Fully enriched lead data with AI personalization strings</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline"><Download size={14} /> Export CSV</button>
          <button className="btn btn-outline"><Download size={14} /> Export JSON</button>
          <button className="btn btn-primary"><Send size={14} /> Push to CRM</button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="db-stats-bar">
        <div className="db-stat"><strong>{ENRICHED_LEADS.length}</strong> Total Leads</div>
        <div className="db-divider" />
        <div className="db-stat">✅ <strong>{verifiedCount}</strong> Verified Emails</div>
        <div className="db-divider" />
        <div className="db-stat">🔄 <strong>{fullCount}</strong> Fully Enriched</div>
        <div className="db-divider" />
        <div className="db-stat">🤖 <strong>{ENRICHED_LEADS.filter(l => l.personalization).length}</strong> AI Personalized</div>
        {selected.length > 0 && (
          <>
            <div className="db-divider" />
            <div className="db-stat" style={{ color: 'var(--primary)' }}>
              <strong>{selected.length}</strong> selected
              <button className="btn btn-primary btn-sm" style={{ marginLeft: 8 }}><Send size={12} /> Push Selected</button>
              <button className="btn btn-outline btn-sm" style={{ marginLeft: 4 }}><Sparkles size={12} /> Run AI</button>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 4 }} onClick={() => setSelected([])}>Clear</button>
            </div>
          </>
        )}
      </div>

      {/* Data Table */}
      <div className="db-table-wrap">
        <div className="db-table-container">
          <table className="db-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={selected.length === ENRICHED_LEADS.length} onChange={toggleAll} /></th>
                <th>Name</th>
                <th>Title</th>
                <th>Company</th>
                <th>Verified Email</th>
                <th>Direct Dial</th>
                <th>LinkedIn</th>
                <th>Tech Stack</th>
                <th>Pain Points</th>
                <th>Intent Signals</th>
                <th>AI Personalization</th>
                <th>Source Chain</th>
                <th>Status</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {ENRICHED_LEADS.map(lead => (
                <tr key={lead.id}>
                  <td onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.includes(lead.id)} onChange={() => toggleSelect(lead.id)} />
                  </td>
                  <td>
                    <div className="lead-name-cell">
                      <div className="avatar" style={{ background: `hsl(${lead.name.charCodeAt(0)*7%360}, 55%, 50%)`, width: 28, height: 28, fontSize: 10 }}>
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{lead.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: '#64748B' }}>{lead.title}</td>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{lead.company}</td>
                  <td>
                    {lead.verifiedEmail ? (
                      <div className="email-verified">
                        <span className={`dot ${lead.emailStatus === 'verified' ? 'green' : 'red'}`} />
                        <span style={{ fontSize: 12 }}>{lead.verifiedEmail}</span>
                      </div>
                    ) : (
                      <div className="email-verified">
                        <span className="dot gray" />
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>Not found</span>
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: '#64748B' }}>{lead.directDial}</td>
                  <td>
                    <a href={`https://${lead.linkedinUrl}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#0A66C2' }}>
                      🔗 Profile
                    </a>
                  </td>
                  <td>
                    <div className="tag-pills">
                      {lead.techStack.slice(0, 3).map((t, i) => <span key={i} className="tag-pill-sm">{t}</span>)}
                      {lead.techStack.length > 3 && <span className="tag-pill-sm">+{lead.techStack.length - 3}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="tag-pills">
                      {lead.painPoints.map((p, i) => <span key={i} className="tag-pill-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>{p}</span>)}
                    </div>
                  </td>
                  <td>
                    <div className="tag-pills">
                      {lead.intentSignals.map((s, i) => <span key={i} className="tag-pill-sm" style={{ background: 'rgba(245,158,11,0.08)', color: '#F59E0B' }}>{s}</span>)}
                      {lead.intentSignals.length === 0 && <span style={{ fontSize: 11, color: '#CBD5E1' }}>—</span>}
                    </div>
                  </td>
                  <td><div className="personalization-preview" title={lead.personalization}>{lead.personalization}</div></td>
                  <td>
                    <div className="source-chain">
                      {lead.sourceChain.map((s, i) => <span key={i} className="source-chain-item">{s}</span>)}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${lead.enrichmentStatus === 'full' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                      {lead.enrichmentStatus === 'full' ? '✓ Full' : '◐ Partial'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: 13, color: lead.score > 85 ? 'var(--score-hot)' : lead.score > 60 ? '#F59E0B' : '#94A3B8' }}>
                      {lead.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Webhook Configuration */}
      <div className="webhook-panel">
        <h3><Zap size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--primary)' }} />Webhook Destinations</h3>
        <div className="webhook-grid">
          {webhooks.map(wh => (
            <div key={wh.id} className="webhook-card">
              <div className="webhook-card-header">
                <div className="webhook-card-left">
                  <span className="webhook-card-icon">{wh.icon}</span>
                  <div>
                    <div className="webhook-card-name">{wh.name}</div>
                    <div className="webhook-card-type">{wh.type}</div>
                  </div>
                </div>
                <span className={`badge ${wh.status === 'connected' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                  {wh.status === 'connected' ? '● Connected' : '○ Disconnected'}
                </span>
              </div>
              {wh.endpoint && <div className="webhook-endpoint">{wh.endpoint}</div>}
              <div className="webhook-toggle">
                <span>Auto-sync leads</span>
                <div className={`toggle-switch ${wh.autoSync ? 'on' : 'off'}`} onClick={() => toggleAutoSync(wh.id)} />
              </div>
              {wh.fieldMapping && Object.keys(wh.fieldMapping).length > 0 && (
                <div className="field-mapping">
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--neutral-400)', textTransform: 'uppercase', marginBottom: 4 }}>Field Mapping</div>
                  {Object.entries(wh.fieldMapping).map(([from, to]) => (
                    <div key={from} className="field-map-row">
                      <span className="field-map-from">{from}</span>
                      <span className="field-map-arrow">→</span>
                      <span className="field-map-to">{to}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="webhook-last-push">Last push: {wh.lastPush}</div>
              <div className="webhook-actions">
                <button className="btn btn-primary btn-sm" disabled={wh.status !== 'connected'}>Test Push</button>
                <button className="btn btn-ghost btn-sm">Configure</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
