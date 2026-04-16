import { useState } from 'react';
import { ArrowLeft, Search, Download, Plus, RefreshCw } from 'lucide-react';
import { DATA_SOURCES, ENRICHMENT_SOURCES, APOLLO_RESULTS, IMPORT_QUEUE } from '../data/sources';
import './DataSources.css';

export default function DataSources() {
  const [selectedSource, setSelectedSource] = useState(null);
  const [importingStates, setImportingStates] = useState({});

  const handleImport = (id) => {
    setImportingStates(prev => ({ ...prev, [id]: 'loading' }));
    setTimeout(() => {
      setImportingStates(prev => ({ ...prev, [id]: 'success' }));
    }, 800);
  };

  if (selectedSource) {
    const src = DATA_SOURCES.find(s => s.id === selectedSource);
    return (
      <div className="sources-page animate-in">
        <button className="lead-detail-back" onClick={() => setSelectedSource(null)}><ArrowLeft size={16} /> Back to Sources</button>
        <div className="source-detail-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div className="source-card-icon" style={{ background: `${src.color}15`, fontSize: 28 }}>{src.icon}</div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{src.name}</h2>
              <p style={{ fontSize: 13, color: 'var(--neutral-400)', margin: 0 }}>{src.description}</p>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span className={`badge ${src.status === 'connected' ? 'badge-success' : 'badge-danger'}`}>● {src.status}</span>
            </div>
          </div>
          <div className="source-search-bar">
            <select className="select"><option>Job Title</option><option>Company</option><option>Industry</option></select>
            <input className="input" placeholder={`Search ${src.name}...`} defaultValue="VP Logistics, India, Freight" />
            <button className="btn btn-primary"><Search size={14} /> Search</button>
          </div>
          <div className="source-results-count">Showing {APOLLO_RESULTS.length} results</div>
          <div className="inbox-table-wrap">
            <table className="inbox-table">
              <thead>
                <tr>
                  <th><input type="checkbox" /></th><th>Name</th><th>Title</th><th>Company</th><th>Email</th><th>Phone</th><th>Location</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {APOLLO_RESULTS.map((r, i) => (
                  <tr key={i}>
                    <td><input type="checkbox" /></td>
                    <td><div className="lead-name-cell"><div className="avatar" style={{ background: `hsl(${r.name.charCodeAt(0)*7%360}, 55%, 50%)` }}>{r.name.split(' ').map(n=>n[0]).join('')}</div><span style={{ fontWeight: 600 }}>{r.name}</span></div></td>
                    <td style={{ fontSize: 13, color: '#64748B' }}>{r.title}</td>
                    <td style={{ fontWeight: 500 }}>{r.company}</td>
                    <td style={{ fontSize: 13 }}>{r.email}</td>
                    <td style={{ fontSize: 12, color: '#94A3B8' }}>{r.phone}</td>
                    <td style={{ fontSize: 12, color: '#94A3B8' }}>{r.location}</td>
                    <td><span className={`badge ${r.verified ? 'badge-success' : 'badge-warning'}`}>{r.verified ? '✓ Verified' : '? Unverified'}</span></td>
                    <td>
                      <button 
                        className={`btn btn-sm ${importingStates[i] === 'success' ? 'btn-outline' : 'btn-primary'}`} 
                        onClick={() => handleImport(i)}
                        disabled={importingStates[i] === 'loading' || importingStates[i] === 'success'}
                        style={importingStates[i] === 'success' ? { borderColor: '#10B981', color: '#10B981', background: 'transparent' } : {}}
                      >
                        {importingStates[i] === 'loading' ? 'Importing...' : importingStates[i] === 'success' ? 'Imported ✓' : 'Import'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sources-page animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
        <div>
          <h2 className="page-title">Data Sources Hub</h2>
          <p className="page-subtitle">Connect, search, and import B2B lead data from multiple sources</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> Add Source</button>
      </div>

      {/* Main Source Cards */}
      <div className="sources-grid stagger">
        {DATA_SOURCES.map(src => (
          <div key={src.id} className="source-card" onClick={() => setSelectedSource(src.id)} style={{ borderTopColor: src.color }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: src.color }} />
            <div className="source-card-header">
              <div className="source-card-left">
                <div className="source-card-icon" style={{ background: `${src.color}12` }}>{src.icon}</div>
                <div>
                  <div className="source-card-name">{src.name}</div>
                  <div className="source-card-type">{src.type}</div>
                </div>
              </div>
              <span className={`badge ${src.status === 'connected' ? 'badge-success' : 'badge-danger'}`}>
                {src.status === 'connected' ? '● Connected' : '○ Disconnected'}
              </span>
            </div>
            <div className="source-card-desc">{src.description}</div>
            <div className="source-card-stats">
              <div className="source-stat"><div className="source-stat-value">{src.recordsPulled.toLocaleString()}</div><div className="source-stat-label">Records</div></div>
              <div className="source-stat"><div className="source-stat-value">{src.lastSync}</div><div className="source-stat-label">Last Sync</div></div>
              <div className="source-stat"><div className="source-stat-value">{src.dailyCredits.used}/{src.dailyCredits.total}</div><div className="source-stat-label">Credits</div></div>
            </div>
            <div className="source-credits-bar">
              <div className="source-credits-fill" style={{ width: `${(src.dailyCredits.used / src.dailyCredits.total) * 100}%`, background: src.color }} />
            </div>
            <div className="source-caps">
              {src.capabilities.map((c, i) => <span key={i} className="source-cap">{c}</span>)}
            </div>
          </div>
        ))}
      </div>

      {/* Enrichment Sources */}
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, marginBottom: 16 }}>Enrichment Sources</h3>
      <div className="enrich-sources stagger">
        {ENRICHMENT_SOURCES.map(src => (
          <div key={src.id} className="enrich-card">
            <div className="enrich-card-icon">{src.icon}</div>
            <div className="enrich-card-info">
              <div className="enrich-card-name">{src.name}</div>
              <div className="enrich-card-type">{src.type} • {src.credits}</div>
            </div>
            <span className={`badge ${src.status === 'connected' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10 }}>
              {src.status === 'connected' ? '●' : '○'}
            </span>
          </div>
        ))}
      </div>

      {/* Import Queue */}
      <div className="import-queue">
        <div className="import-queue-header">
          <h3>Import Queue</h3>
          <button className="btn btn-ghost btn-sm"><RefreshCw size={14} /> Refresh</button>
        </div>
        {IMPORT_QUEUE.map(item => (
          <div key={item.id} className="import-row">
            <span className="import-source">{item.source}</span>
            <span className="import-query">{item.query}</span>
            <span style={{ fontSize: 13, fontWeight: 700, minWidth: 40 }}>{item.records}</span>
            <div className="import-progress">
              <div className="import-progress-bar">
                <div className="import-progress-fill" style={{ width: `${item.progress}%`, background: item.status === 'completed' ? 'var(--primary)' : item.status === 'running' ? '#3B82F6' : 'var(--neutral-300)' }} />
              </div>
              <div className="import-progress-text">{item.progress}%</div>
            </div>
            <span className={`badge ${item.status === 'completed' ? 'badge-success' : item.status === 'running' ? 'badge-info' : 'badge-neutral'}`}>{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
