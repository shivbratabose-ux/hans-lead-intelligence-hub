import { useState } from 'react';
import { Sparkles, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';
import { PAIN_POINTS, ICEBREAKERS, INTENT_SIGNALS, TECH_STACKS } from '../data/aiEnrichment';
import './AILab.css';

const TABS = ['Pain Point Analysis', 'Icebreaker Generator', 'Intent Signals', 'Tech Stack Detector'];

export default function AILab() {
  const [tab, setTab] = useState('Pain Point Analysis');
  const [copiedIdx, setCopiedIdx] = useState(null);

  const copyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="ailab-page animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
        <div>
          <h2 className="page-title"><Sparkles size={22} style={{ display: 'inline', marginRight: 8, color: 'var(--primary)' }} />AI Enrichment Lab</h2>
          <p className="page-subtitle">LLM-powered lead intelligence — pain points, icebreakers, intent signals, tech stacks</p>
        </div>
        <button className="btn btn-primary"><Sparkles size={14} /> Run AI on All Leads</button>
      </div>

      <div className="tabs ailab-tabs">
        {TABS.map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Pain Point Analysis */}
      {tab === 'Pain Point Analysis' && (
        <div className="stagger">
          {PAIN_POINTS.map(pp => (
            <div key={pp.id} className="pp-card">
              <div className="pp-card-header">
                <div className="pp-card-lead">
                  <div className="avatar" style={{ background: `hsl(${pp.lead.charCodeAt(0)*7%360}, 55%, 50%)` }}>
                    {pp.lead.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="pp-card-name">{pp.lead}</div>
                    <div className="pp-card-meta">{pp.title} at {pp.company}</div>
                  </div>
                </div>
                <span className="badge badge-primary">Best fit: {pp.product}</span>
              </div>
              <div className="pp-list">
                {pp.painPoints.map((p, i) => (
                  <div key={i} className="pp-item">
                    <span className="pp-item-category">🎯 {p.category}</span>
                    <span className="pp-item-detail">{p.detail}</span>
                    <div className="pp-confidence">
                      <div className="pp-confidence-bar">
                        <div className="pp-confidence-fill" style={{
                          width: `${p.confidence}%`,
                          background: p.confidence > 85 ? 'var(--primary)' : p.confidence > 70 ? '#F59E0B' : '#94A3B8'
                        }} />
                      </div>
                      <span className="pp-confidence-text" style={{
                        color: p.confidence > 85 ? 'var(--primary)' : p.confidence > 70 ? '#F59E0B' : '#94A3B8'
                      }}>{p.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Icebreaker Generator */}
      {tab === 'Icebreaker Generator' && (
        <div className="stagger">
          {ICEBREAKERS.map((ib, idx) => (
            <div key={idx} className="ib-card">
              <div className="pp-card-header">
                <div className="pp-card-lead">
                  <div className="avatar" style={{ background: `hsl(${ib.lead.charCodeAt(0)*7%360}, 55%, 50%)` }}>
                    {ib.lead.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="pp-card-name">{ib.lead}</div>
                    <div className="pp-card-meta">{ib.company}</div>
                  </div>
                </div>
                <span className="ib-score" style={{ color: ib.score > 85 ? 'var(--primary)' : '#F59E0B' }}>{ib.score}/100</span>
              </div>
              <div className="ib-source">📄 Source: {ib.source}</div>
              <div className="ib-source-text">"{ib.sourceText}"</div>
              <div className="ib-main">✨ {ib.icebreaker}</div>
              {ib.alternatives.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--neutral-400)', textTransform: 'uppercase', marginBottom: 4 }}>Alternative Openers</div>
                  <div className="ib-alternatives">
                    {ib.alternatives.map((alt, i) => (
                      <div key={i} className="ib-alt" onClick={() => copyText(alt, `${idx}-${i}`)}>
                        {alt}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="ib-actions">
                <button className="btn btn-primary btn-sm" onClick={() => copyText(ib.icebreaker, idx)}>
                  {copiedIdx === idx ? <><CheckCircle2 size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                </button>
                <button className="btn btn-outline btn-sm"><RefreshCw size={14} /> Regenerate</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Intent Signals */}
      {tab === 'Intent Signals' && (
        <div className="stagger">
          {INTENT_SIGNALS.map((company, idx) => (
            <div key={idx} className="intent-card">
              <div className="intent-header">
                <div>
                  <div className="intent-company">{company.company}</div>
                  <div style={{ fontSize: 12, color: 'var(--neutral-400)' }}>Overall Intent: {company.overallIntent}</div>
                </div>
                <span className="intent-score-badge" style={{
                  background: company.score > 90 ? 'rgba(239,68,68,0.1)' : company.score > 70 ? 'rgba(245,158,11,0.1)' : 'rgba(148,163,184,0.1)',
                  color: company.score > 90 ? '#EF4444' : company.score > 70 ? '#F59E0B' : '#94A3B8',
                }}>
                  🎯 {company.score}/100
                </span>
              </div>
              <div className="signal-list">
                {company.signals.map((signal, i) => (
                  <div key={i} className="signal-item">
                    <span className="signal-icon">{signal.icon}</span>
                    <span className="signal-text">{signal.text}</span>
                    <span className="signal-strength" style={{
                      background: signal.strength === 'Strong' ? 'rgba(16,185,129,0.1)' : signal.strength === 'Moderate' ? 'rgba(245,158,11,0.1)' : 'rgba(148,163,184,0.1)',
                      color: signal.strength === 'Strong' ? 'var(--primary)' : signal.strength === 'Moderate' ? '#F59E0B' : '#94A3B8',
                    }}>{signal.strength}</span>
                    <span className="signal-date">{signal.date}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tech Stack */}
      {tab === 'Tech Stack Detector' && (
        <div className="stagger">
          {TECH_STACKS.map((t, idx) => (
            <div key={idx} className="tech-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className="pp-card-name">{t.company}</div>
                </div>
                <span className="badge badge-neutral">🔧 {t.stack.length} technologies</span>
              </div>
              <div className="tech-stack-pills">
                {t.stack.map((tech, i) => <span key={i} className="tech-pill">{tech}</span>)}
              </div>
              <div className="tech-opportunity">💡 <strong>Opportunity:</strong> {t.opportunity}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
