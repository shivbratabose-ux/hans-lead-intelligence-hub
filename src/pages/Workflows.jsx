import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Clock, CheckCircle2, Plus } from 'lucide-react';
import { WORKFLOW_TEMPLATES, NODE_TYPES, EXECUTION_HISTORY } from '../data/workflows';
import './Workflows.css';

const NODE_EMOJIS = { apollo: '🚀', cognism: '🧠', linkedin: '💼', webscrape: '🌐', hunter: '📧', contactout: '📬', verify: '✅', ai: '🤖', crm: '📤', outreach: '📨' };

export default function Workflows() {
  const [selected, setSelected] = useState(null);
  const [running, setRunning] = useState(false);
  const [activeNode, setActiveNode] = useState(-1);
  const timerRef = useRef(null);

  const runWorkflow = (wf) => {
    setRunning(true);
    setActiveNode(0);
    let step = 0;
    timerRef.current = setInterval(() => {
      step++;
      if (step >= wf.nodes.length) {
        clearInterval(timerRef.current);
        setRunning(false);
        setActiveNode(wf.nodes.length);
      } else {
        setActiveNode(step);
      }
    }, 1200);
  };

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  if (selected) {
    const wf = WORKFLOW_TEMPLATES.find(w => w.id === selected);
    return (
      <div className="workflows-page animate-in">
        <button className="lead-detail-back" onClick={() => { setSelected(null); setRunning(false); setActiveNode(-1); clearInterval(timerRef.current); }}><ArrowLeft size={16} /> Back to Workflows</button>
        <div className="wf-execution">
          <div className="wf-exec-header">
            <div>
              <span style={{ fontSize: 28, marginRight: 8 }}>{wf.icon}</span>
              <span className="wf-exec-title">{wf.name}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={() => runWorkflow(wf)} disabled={running}>
                <Play size={14} /> {running ? 'Running...' : 'Run Workflow'}
              </button>
            </div>
          </div>
          <p style={{ fontSize: 14, color: 'var(--neutral-500)', marginBottom: 24 }}>{wf.description}</p>

          {/* Visual Pipeline */}
          <div className="wf-exec-pipeline">
            {wf.nodes.map((node, i) => (
              <div key={node.id} style={{ display: 'flex', alignItems: 'center' }}>
                <div className="wf-exec-node">
                  <div className={`wf-exec-node-box ${activeNode === i ? 'active' : ''} ${activeNode > i ? 'done' : ''}`}>
                    <span className="node-emoji">{NODE_EMOJIS[node.type]}</span>
                    <span className="node-name">{node.label}</span>
                  </div>
                  <span className="wf-exec-node-status" style={{
                    color: activeNode > i ? 'var(--primary)' : activeNode === i ? '#3B82F6' : 'var(--neutral-400)'
                  }}>
                    {activeNode > i ? '✓ Done' : activeNode === i ? (running ? '⟳ Running...' : 'Ready') : '○ Pending'}
                  </span>
                  {activeNode > i && <span style={{ fontSize: 10, color: 'var(--primary)' }}>{node.result}</span>}
                </div>
                {i < wf.nodes.length - 1 && (
                  <div className={`wf-exec-connector ${activeNode > i ? 'done' : ''}`} />
                )}
              </div>
            ))}
          </div>

          {/* Waterfall Logic */}
          {wf.name === 'Email Waterfall' && (
            <div className="waterfall-flow">
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--neutral-600)', marginBottom: 12 }}>Waterfall Logic: If Source A fails → try Source B → try Source C</h4>
              {[
                { icon: '🚀', name: 'Apollo.io', desc: 'Primary lookup: search by name + domain', result: '78% emails found', isActive: activeNode >= 0 },
                { icon: '📧', name: 'Hunter.io', desc: 'Fallback #1: domain-based email finder', result: '12% found from remaining', isActive: activeNode >= 1 },
                { icon: '📬', name: 'ContactOut', desc: 'Fallback #2: cross-platform email/phone', result: '5% found from remaining', isActive: activeNode >= 2 },
                { icon: '✅', name: 'ZeroBounce', desc: 'Mandatory: verify all found emails', result: '92% deliverable', isActive: activeNode >= 3 },
              ].map((step, i) => (
                <div key={i}>
                  {i > 0 && <div className="waterfall-arrow">↓ {i < 3 ? 'if not found' : 'always run'}</div>}
                  <div className={`waterfall-box ${step.isActive ? 'active' : ''}`}>
                    <span className="step-icon">{step.icon}</span>
                    <div className="step-info">
                      <div className="step-name">{step.name}</div>
                      <div className="step-desc">{step.desc}</div>
                    </div>
                    <span className="step-result" style={{ color: step.isActive ? 'var(--primary)' : 'var(--neutral-300)' }}>
                      {step.isActive ? step.result : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Execution History */}
        <div className="inbox-table-wrap" style={{ boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ padding: '16px 20px', borderBottom: 'var(--border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)', margin: 0 }}>Execution History</h3>
          </div>
          <table className="inbox-table">
            <thead><tr><th>Workflow</th><th>Started</th><th>Duration</th><th>Input</th><th>Output</th><th>Status</th></tr></thead>
            <tbody>
              {EXECUTION_HISTORY.filter(e => e.workflow === wf.name).map(ex => (
                <tr key={ex.id}>
                  <td style={{ fontWeight: 600 }}>{ex.workflow}</td>
                  <td style={{ fontSize: 13, color: '#94A3B8' }}>{new Date(ex.started).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{ex.duration}</td>
                  <td style={{ fontWeight: 700 }}>{ex.inputLeads}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{ex.outputLeads}</td>
                  <td><span className={`badge ${ex.status === 'success' ? 'badge-success' : 'badge-warning'}`}>{ex.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="workflows-page animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
        <div>
          <h2 className="page-title">Enrichment Workflows</h2>
          <p className="page-subtitle">Visual waterfall pipelines — the "Clay" model for lead enrichment</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> New Workflow</button>
      </div>

      {/* Node Palette */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Available Nodes</h4>
        <div className="node-palette">
          {NODE_TYPES.map(n => (
            <div key={n.type} className="node-palette-item">
              <span className="node-emoji">{n.icon}</span>
              <span>{n.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Templates */}
      <div className="wf-grid stagger">
        {WORKFLOW_TEMPLATES.map(wf => (
          <div key={wf.id} className="wf-card" onClick={() => setSelected(wf.id)}>
            <div className="wf-card-body">
              <div className="wf-card-header">
                <div className="wf-card-icon">{wf.icon}</div>
                <div>
                  <div className="wf-card-title">{wf.name}</div>
                  <div className="wf-card-cat">{wf.category}</div>
                </div>
              </div>
              <div className="wf-card-desc">{wf.description}</div>

              {/* Mini Pipeline */}
              <div className="wf-pipeline">
                {wf.nodes.map((node, i) => (
                  <div key={node.id} style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="wf-node">
                      <div className={`wf-node-box success`}>
                        <span>{NODE_EMOJIS[node.type]}</span>
                      </div>
                      <span className="wf-node-label">{node.label}</span>
                    </div>
                    {i < wf.nodes.length - 1 && <div className="wf-connector active" />}
                  </div>
                ))}
              </div>

              <div className="wf-card-stats">
                <div className="wf-stat"><strong>{wf.executions}</strong> runs</div>
                <div className="wf-stat"><strong>{wf.successRate}%</strong> success</div>
                <div className="wf-stat"><strong>{wf.avgTime}</strong> avg</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* All Execution History */}
      <div className="inbox-table-wrap" style={{ boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ padding: '16px 20px', borderBottom: 'var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)', margin: 0 }}>Recent Executions</h3>
        </div>
        <table className="inbox-table">
          <thead><tr><th>Workflow</th><th>Started</th><th>Duration</th><th>Input</th><th>Output</th><th>Status</th></tr></thead>
          <tbody>
            {EXECUTION_HISTORY.map(ex => (
              <tr key={ex.id}>
                <td style={{ fontWeight: 600 }}>{ex.workflow}</td>
                <td style={{ fontSize: 13, color: '#94A3B8' }}>{new Date(ex.started).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                <td>{ex.duration}</td>
                <td style={{ fontWeight: 700 }}>{ex.inputLeads}</td>
                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{ex.outputLeads}</td>
                <td><span className={`badge ${ex.status === 'success' ? 'badge-success' : 'badge-warning'}`}>{ex.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
