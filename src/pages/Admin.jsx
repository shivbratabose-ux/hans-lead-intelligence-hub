import { useState } from 'react';
import { Database, Mail, MessageCircle, CalendarDays, Search, Link, ArrowRight, Shield, Plus, Edit2, Trash2, X, ChevronUp, ChevronDown, Power, Save, GripVertical, Copy } from 'lucide-react';
import { SCORING_CRITERIA, SCORE_THRESHOLDS, ROUTING_RULES, INTEGRATIONS, AUDIT_LOG } from '../data/scoringRules';
import USERS from '../data/users';
import './Admin.css';

const TABS = ['Scoring Rules', 'Routing Rules', 'Integrations', 'Users', 'Audit Log'];
const ICONS = { database: Database, mail: Mail, 'message-circle': MessageCircle, calendar: CalendarDays, search: Search, link: Link };

const CONDITION_FIELDS = ['product', 'location', 'industry', 'companySize', 'score', 'source', 'country', 'contactType', 'region'];
const OPERATORS = ['equals', 'contains', 'in', 'gte', 'lte', 'not_equals'];
const OPERATOR_LABELS = { equals: '=', contains: 'contains', in: 'in', gte: '≥', lte: '≤', not_equals: '≠' };
const TEAM_MEMBERS = [
  { id: 'U001', name: 'Priya Mehta' },
  { id: 'U002', name: 'Amit Desai' },
  { id: 'U003', name: 'Kavita Singh' },
  { id: 'U004', name: 'Rajiv Khanna' },
  { id: 'U005', name: 'Sunita Rao' },
  { id: 'U006', name: 'Rohit Sharma' },
];

export default function Admin() {
  const [tab, setTab] = useState('Scoring Rules');
  const [criteria, setCriteria] = useState(SCORING_CRITERIA);
  const [thresholds, setThresholds] = useState(SCORE_THRESHOLDS);
  const [rules, setRules] = useState(ROUTING_RULES.map(r => ({ ...r, conditions: r.conditions.map(c => ({ ...c })) })));
  const [editingRule, setEditingRule] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  // User management state
  const [users, setUsers] = useState(USERS.map(u => ({ ...u })));
  const [editingUser, setEditingUser] = useState(null);
  const [showUserEditor, setShowUserEditor] = useState(false);

  const handleWeightChange = (id, value) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, currentWeight: parseInt(value) } : c));
  };

  // === ROUTING RULE CRUD ===
  const toggleRuleActive = (id) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteRule = (id) => {
    if (window.confirm('Delete this routing rule? This cannot be undone.')) {
      setRules(prev => prev.filter(r => r.id !== id));
    }
  };

  const moveRule = (id, direction) => {
    setRules(prev => {
      const sorted = [...prev].sort((a, b) => a.priority - b.priority);
      const idx = sorted.findIndex(r => r.id === id);
      if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      const tempPriority = sorted[idx].priority;
      sorted[idx].priority = sorted[swapIdx].priority;
      sorted[swapIdx].priority = tempPriority;
      return sorted;
    });
  };

  const duplicateRule = (rule) => {
    const newRule = {
      ...rule,
      id: `R${String(Date.now()).slice(-3)}`,
      name: `${rule.name} (Copy)`,
      priority: Math.max(...rules.map(r => r.priority)) + 1,
      conditions: rule.conditions.map(c => ({ ...c })),
    };
    setRules(prev => [...prev, newRule]);
  };

  const openEditor = (rule = null) => {
    if (rule) {
      setEditingRule({ ...rule, conditions: rule.conditions.map(c => ({ ...c, value: Array.isArray(c.value) ? c.value.join(', ') : String(c.value) })) });
    } else {
      setEditingRule({
        id: `R${String(Date.now()).slice(-3)}`,
        name: '',
        conditions: [{ field: 'product', operator: 'equals', value: '' }],
        action: 'assign',
        assignTo: TEAM_MEMBERS[0].id,
        assignName: TEAM_MEMBERS[0].name,
        priority: Math.max(...rules.map(r => r.priority), 0) + 1,
        active: true,
      });
    }
    setShowEditor(true);
  };

  const saveRule = () => {
    if (!editingRule.name.trim()) { alert('Rule name is required'); return; }
    const finalRule = {
      ...editingRule,
      conditions: editingRule.conditions.map(c => ({
        ...c,
        value: c.operator === 'in' ? c.value.split(',').map(v => v.trim()) : c.operator === 'gte' || c.operator === 'lte' ? parseInt(c.value) : c.value,
      })).filter(c => c.value && (Array.isArray(c.value) ? c.value.length > 0 : true)),
    };
    setRules(prev => {
      const exists = prev.find(r => r.id === finalRule.id);
      if (exists) return prev.map(r => r.id === finalRule.id ? finalRule : r);
      return [...prev, finalRule];
    });
    setShowEditor(false);
    setEditingRule(null);
  };

  const updateCondition = (idx, key, value) => {
    setEditingRule(prev => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => i === idx ? { ...c, [key]: value } : c),
    }));
  };

  const addCondition = () => {
    setEditingRule(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: 'product', operator: 'equals', value: '' }],
    }));
  };

  const removeCondition = (idx) => {
    setEditingRule(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== idx),
    }));
  };

  const updateAssign = (memberId) => {
    const member = TEAM_MEMBERS.find(m => m.id === memberId);
    setEditingRule(prev => ({ ...prev, assignTo: memberId, assignName: member?.name || '' }));
  };

  return (
    <div className="admin-page animate-in">
      <div style={{ marginBottom: 'var(--space-2)' }}>
        <h2 className="page-title">Admin Console</h2>
        <p className="page-subtitle">Configure scoring, routing, integrations, and user access</p>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Scoring Rules */}
      {tab === 'Scoring Rules' && (
        <div className="admin-section">
          <h3>Lead Scoring Criteria</h3>
          <p style={{ fontSize: '13px', color: 'var(--neutral-500)', marginBottom: 20 }}>
            Adjust point weights for each criterion. Total max score determines Hot/Warm/Cold thresholds.
          </p>
          {criteria.map(c => (
            <div key={c.id} className="scoring-rule">
              <div className="scoring-rule-info">
                <div className="scoring-rule-name">{c.label}</div>
                <div className="scoring-rule-desc">{c.description}</div>
              </div>
              <div className="scoring-slider">
                <input type="range" min={c.id === 'negative' ? -30 : 0} max={c.maxPoints || 25}
                  value={c.currentWeight}
                  onChange={e => handleWeightChange(c.id, e.target.value)} />
                <span className="scoring-slider-value">{c.currentWeight > 0 ? `+${c.currentWeight}` : c.currentWeight}</span>
              </div>
            </div>
          ))}
          <div className="divider" />
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Score Thresholds</h4>
          <div className="threshold-inputs">
            <div className="threshold-input">
              <label>🔥 Hot ≥</label>
              <input className="input" type="number" value={thresholds.hot} onChange={e => setThresholds(p => ({ ...p, hot: parseInt(e.target.value) }))} />
            </div>
            <div className="threshold-input">
              <label>🌡️ Warm ≥</label>
              <input className="input" type="number" value={thresholds.warm} onChange={e => setThresholds(p => ({ ...p, warm: parseInt(e.target.value) }))} />
            </div>
            <div className="threshold-input">
              <label>❄️ Cold below</label>
              <input className="input" type="number" value={thresholds.warm} disabled />
            </div>
          </div>
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <button className="btn btn-primary">Save Changes</button>
          </div>
        </div>
      )}

      {/* Routing Rules — EDITABLE */}
      {tab === 'Routing Rules' && (
        <div className="admin-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0 }}>Lead Routing Rules</h3>
              <p style={{ fontSize: 12, color: 'var(--neutral-400)', margin: '4px 0 0' }}>{rules.length} rules · {rules.filter(r => r.active).length} active</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => openEditor()}><Plus size={14} /> Add Rule</button>
          </div>

          {[...rules].sort((a, b) => a.priority - b.priority).map(rule => (
            <div key={rule.id} className={`routing-rule-editable ${!rule.active ? 'inactive' : ''}`}>
              <div className="rule-priority-controls">
                <button className="rule-move-btn" onClick={() => moveRule(rule.id, 'up')} title="Move up"><ChevronUp size={12} /></button>
                <span className="rule-priority-badge">P{rule.priority}</span>
                <button className="rule-move-btn" onClick={() => moveRule(rule.id, 'down')} title="Move down"><ChevronDown size={12} /></button>
              </div>

              <div className="rule-main">
                <div className="routing-rule-name">{rule.name}</div>
                <div className="routing-rule-conditions">
                  {rule.conditions.map((c, i) => (
                    <span key={i} className="routing-condition">
                      <strong>{c.field}</strong> {OPERATOR_LABELS[c.operator] || c.operator} <em>{Array.isArray(c.value) ? c.value.join(', ') : c.value}</em>
                    </span>
                  ))}
                </div>
              </div>

              <ArrowRight size={14} color="var(--neutral-400)" />
              <div className="routing-rule-assign">{rule.assignName}</div>

              <div className="rule-actions">
                <button className={`rule-toggle ${rule.active ? 'on' : 'off'}`} onClick={() => toggleRuleActive(rule.id)} title={rule.active ? 'Deactivate' : 'Activate'}>
                  <Power size={12} />
                </button>
                <button className="btn btn-ghost btn-xs" onClick={() => openEditor(rule)} title="Edit"><Edit2 size={12} /></button>
                <button className="btn btn-ghost btn-xs" onClick={() => duplicateRule(rule)} title="Duplicate"><Copy size={12} /></button>
                <button className="btn btn-ghost btn-xs rule-delete" onClick={() => deleteRule(rule.id)} title="Delete"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}

          {rules.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
              No routing rules yet. Click "Add Rule" to create one.
            </div>
          )}
        </div>
      )}

      {/* Rule Editor Modal */}
      {showEditor && editingRule && (
        <div className="modal-overlay" onClick={() => setShowEditor(false)}>
          <div className="rule-editor-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{rules.find(r => r.id === editingRule.id) ? 'Edit Rule' : 'New Routing Rule'}</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setShowEditor(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="editor-row">
                <label>Rule Name</label>
                <input className="input" value={editingRule.name} onChange={e => setEditingRule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., India CHA → Priya" />
              </div>
              <div className="editor-row">
                <label>Priority</label>
                <input className="input" type="number" min={0} max={99} value={editingRule.priority}
                  onChange={e => setEditingRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                  style={{ width: 80 }} />
              </div>

              <div className="editor-section">
                <label>Conditions <span style={{ fontWeight: 400, color: '#94A3B8' }}>(all must match)</span></label>
                {editingRule.conditions.map((c, i) => (
                  <div key={i} className="condition-editor-row">
                    <select value={c.field} onChange={e => updateCondition(i, 'field', e.target.value)}>
                      {CONDITION_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select value={c.operator} onChange={e => updateCondition(i, 'operator', e.target.value)}>
                      {OPERATORS.map(o => <option key={o} value={o}>{OPERATOR_LABELS[o]}</option>)}
                    </select>
                    <input className="input" value={c.value} onChange={e => updateCondition(i, 'value', e.target.value)}
                      placeholder={c.operator === 'in' ? 'value1, value2, ...' : 'value'} />
                    {editingRule.conditions.length > 1 && (
                      <button className="btn btn-ghost btn-xs rule-delete" onClick={() => removeCondition(i)}><X size={12} /></button>
                    )}
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={addCondition}><Plus size={12} /> Add Condition</button>
              </div>

              <div className="editor-row">
                <label>Action</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={editingRule.action} onChange={e => setEditingRule(prev => ({ ...prev, action: e.target.value }))} style={{ width: 140 }}>
                    <option value="assign">Assign to</option>
                    <option value="flag">Flag for Review</option>
                    <option value="notify">Notify</option>
                  </select>
                  <select value={editingRule.assignTo} onChange={e => updateAssign(e.target.value)} style={{ flex: 1 }}>
                    {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="editor-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={editingRule.active}
                    onChange={e => setEditingRule(prev => ({ ...prev, active: e.target.checked }))} />
                  Active
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowEditor(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveRule}><Save size={14} /> Save Rule</button>
            </div>
          </div>
        </div>
      )}

      {/* Integrations */}
      {tab === 'Integrations' && (
        <div className="admin-section">
          <h3>Connected Integrations</h3>
          {INTEGRATIONS.map(integ => {
            const Icon = ICONS[integ.icon] || Database;
            return (
              <div key={integ.id} className="integration-card">
                <div className="integration-icon"><Icon size={20} /></div>
                <div className="integration-info">
                  <div className="integration-name">{integ.name}</div>
                  <div className="integration-type">{integ.type} • Last sync: {integ.lastSync}</div>
                </div>
                <div className="integration-status">
                  <span className={`status-dot ${integ.status === 'connected' ? 'active' : 'error'}`} />
                  <span style={{ color: integ.status === 'connected' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                    {integ.status === 'connected' ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <button className="btn btn-ghost btn-sm">Configure</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Users — EDITABLE */}
      {tab === 'Users' && (
        <div className="admin-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0 }}>User Management</h3>
              <p style={{ fontSize: 12, color: 'var(--neutral-400)', margin: '4px 0 0' }}>{users.length} users · {users.filter(u => u.role === 'Admin').length} admins · {users.filter(u => u.role === 'Sales Rep').length} sales reps</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => {
              setEditingUser({
                id: `U${String(Date.now()).slice(-3)}`,
                name: '', email: '', role: 'Sales Rep', region: 'India',
                avatar: '#10B981', initials: '', leadsAssigned: 0, qualified: 0, conversionRate: 0,
              });
              setShowUserEditor(true);
            }}><Plus size={14} /> Add User</button>
          </div>
          <table className="inbox-table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Role</th><th>Region</th><th>Leads</th><th>Qualified</th><th>Conv. %</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="user-row">
                  <td>
                    <div className="lead-name-cell">
                      <div className="avatar" style={{ background: u.avatar }}>{u.initials}</div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: '#64748B' }}>{u.email}</td>
                  <td><span className={`badge ${u.role === 'Admin' ? 'badge-danger' : u.role === 'Sales Manager' ? 'badge-warning' : u.role === 'Marketing' ? 'badge-info' : 'badge-primary'}`}>{u.role}</span></td>
                  <td style={{ fontSize: 13, color: '#64748B' }}>{u.region}</td>
                  <td style={{ fontWeight: 700 }}>{u.leadsAssigned}</td>
                  <td style={{ fontWeight: 600, color: '#10B981' }}>{u.qualified}</td>
                  <td style={{ fontWeight: 600 }}>{u.conversionRate}%</td>
                  <td>
                    <div className="user-actions">
                      <button className="btn btn-ghost btn-xs" onClick={() => {
                        setEditingUser({ ...u });
                        setShowUserEditor(true);
                      }} title="Edit"><Edit2 size={12} /></button>
                      <button className="btn btn-ghost btn-xs rule-delete" onClick={() => {
                        if (window.confirm(`Delete user ${u.name}? This cannot be undone.`)) {
                          setUsers(prev => prev.filter(x => x.id !== u.id));
                        }
                      }} title="Delete"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
              No users yet. Click "Add User" to create one.
            </div>
          )}
        </div>
      )}

      {/* User Editor Modal */}
      {showUserEditor && editingUser && (
        <div className="modal-overlay" onClick={() => setShowUserEditor(false)}>
          <div className="rule-editor-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{users.find(u => u.id === editingUser.id) ? 'Edit User' : 'New User'}</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setShowUserEditor(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="user-editor-avatar-row">
                <div className="avatar avatar-lg" style={{ background: editingUser.avatar }}>{editingUser.initials || '?'}</div>
                <div className="avatar-color-picker">
                  {['#10B981','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#6366F1','#EC4899','#14B8A6','#F97316'].map(c => (
                    <button key={c} className={`color-dot ${editingUser.avatar === c ? 'selected' : ''}`}
                      style={{ background: c }} onClick={() => setEditingUser(prev => ({ ...prev, avatar: c }))} />
                  ))}
                </div>
              </div>
              <div className="editor-grid-2">
                <div className="editor-row">
                  <label>Full Name</label>
                  <input className="input" value={editingUser.name}
                    onChange={e => {
                      const name = e.target.value;
                      const parts = name.trim().split(' ');
                      const initials = parts.length >= 2 ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase() : name.slice(0,2).toUpperCase();
                      setEditingUser(prev => ({ ...prev, name, initials }));
                    }}
                    placeholder="e.g., Rohit Sharma" />
                </div>
                <div className="editor-row">
                  <label>Email</label>
                  <input className="input" type="email" value={editingUser.email}
                    onChange={e => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g., rohit@hansinfomatic.com" />
                </div>
              </div>
              <div className="editor-grid-2">
                <div className="editor-row">
                  <label>Role</label>
                  <select value={editingUser.role} onChange={e => setEditingUser(prev => ({ ...prev, role: e.target.value }))} style={{ width: '100%', padding: '8px 10px', border: 'var(--border)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                    <option value="Sales Rep">Sales Rep</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Admin">Admin</option>
                    <option value="Support">Support</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
                <div className="editor-row">
                  <label>Region</label>
                  <select value={editingUser.region} onChange={e => setEditingUser(prev => ({ ...prev, region: e.target.value }))} style={{ width: '100%', padding: '8px 10px', border: 'var(--border)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                    <option value="India">India</option>
                    <option value="APAC & Middle East">APAC & Middle East</option>
                    <option value="Europe">Europe</option>
                    <option value="Americas">Americas</option>
                    <option value="Africa">Africa</option>
                    <option value="Global">Global</option>
                    <option value="All">All</option>
                  </select>
                </div>
              </div>
              <div className="editor-grid-3">
                <div className="editor-row">
                  <label>Leads Assigned</label>
                  <input className="input" type="number" min={0} value={editingUser.leadsAssigned}
                    onChange={e => setEditingUser(prev => ({ ...prev, leadsAssigned: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="editor-row">
                  <label>Qualified</label>
                  <input className="input" type="number" min={0} value={editingUser.qualified}
                    onChange={e => setEditingUser(prev => ({ ...prev, qualified: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="editor-row">
                  <label>Conversion %</label>
                  <input className="input" type="number" min={0} max={100} value={editingUser.conversionRate}
                    onChange={e => setEditingUser(prev => ({ ...prev, conversionRate: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowUserEditor(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                if (!editingUser.name.trim()) { alert('Name is required'); return; }
                if (!editingUser.email.trim()) { alert('Email is required'); return; }
                setUsers(prev => {
                  const exists = prev.find(u => u.id === editingUser.id);
                  if (exists) return prev.map(u => u.id === editingUser.id ? editingUser : u);
                  return [...prev, editingUser];
                });
                setShowUserEditor(false);
                setEditingUser(null);
              }}><Save size={14} /> Save User</button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log */}
      {tab === 'Audit Log' && (
        <div className="admin-section">
          <h3><Shield size={18} style={{ display: 'inline', marginRight: 8 }} />Audit Trail</h3>
          <table className="inbox-table">
            <thead>
              <tr><th>Timestamp</th><th>Action</th><th>Detail</th><th>User</th></tr>
            </thead>
            <tbody>
              {AUDIT_LOG.map(log => (
                <tr key={log.id}>
                  <td className="audit-time">{new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td><span className="badge badge-neutral">{log.action}</span></td>
                  <td style={{ fontSize: 13, color: '#64748B' }}>{log.detail}</td>
                  <td style={{ fontSize: 13, color: '#475569' }}>{log.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
