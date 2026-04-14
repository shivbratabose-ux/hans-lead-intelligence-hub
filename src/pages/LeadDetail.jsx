import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Globe, MapPin, Building2, Sparkles, Send, ExternalLink } from 'lucide-react';
import LEADS from '../data/leads';
import './LeadDetail.css';

const STAGE_ORDER = ['New', 'Contacted', 'Demo Scheduled', 'Qualified', 'Opportunity', 'Won'];
const SCORE_COLORS = {
  industry: '#10B981', companySize: '#006853', role: '#3B82F6',
  engagement: '#8B5CF6', behavior: '#F59E0B', event: '#EF4444',
  demo: '#EC4899', budget: '#14B8A6', timeline: '#6366F1',
};
const SCORE_MAX = {
  industry: 20, companySize: 10, role: 15, engagement: 10, behavior: 10,
  event: 20, demo: 25, budget: 10, timeline: 10,
};
const SCORE_LABELS = {
  industry: 'Industry Fit', companySize: 'Company Size', role: 'Role Seniority',
  engagement: 'Engagement', behavior: 'Web Behavior', event: 'Event Attendance',
  demo: 'Demo Requested', budget: 'Budget Signal', timeline: 'Timeline',
};

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const lead = LEADS.find(l => l.id === id);

  if (!lead) {
    return (
      <div className="lead-detail">
        <button className="lead-detail-back" onClick={() => navigate('/leads')}>
          <ArrowLeft size={16} /> Back to Inbox
        </button>
        <div className="empty-state"><p>Lead not found</p></div>
      </div>
    );
  }

  const stageIdx = STAGE_ORDER.indexOf(lead.status);

  return (
    <div className="lead-detail animate-in">
      <button className="lead-detail-back" onClick={() => navigate('/leads')}>
        <ArrowLeft size={16} /> Back to Inbox
      </button>

      <div className="lead-detail-grid">
        {/* Left Panel */}
        <div className="lead-left-panel">
          {/* Profile Card */}
          <div className="lead-profile-card">
            <div className="lead-profile-avatar" style={{
              background: `linear-gradient(135deg, hsl(${lead.name.charCodeAt(0) * 7 % 360}, 55%, 50%), hsl(${lead.name.charCodeAt(0) * 7 % 360 + 30}, 55%, 40%))`
            }}>
              {lead.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="lead-profile-name">{lead.name}</div>
            <div className="lead-profile-title">{lead.title} at {lead.company}</div>
            <div className="lead-profile-badges">
              <span className={`badge badge-${lead.band.toLowerCase()}`}>{lead.score} — {lead.band}</span>
              <span className="badge badge-primary">{lead.product}</span>
              <span className="badge badge-neutral">{lead.source}</span>
            </div>
            <div className="lead-contact-info">
              <div className="lead-contact-row">
                <Mail /><span className="lead-contact-label">Email</span><span>{lead.email}</span>
              </div>
              <div className="lead-contact-row">
                <Phone /><span className="lead-contact-label">Phone</span><span>{lead.phone}</span>
              </div>
              <div className="lead-contact-row">
                <MapPin /><span className="lead-contact-label">Location</span><span>{lead.location}</span>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="lead-company-card">
            <h4><Building2 size={14} style={{ display: 'inline', marginRight: 6 }} />Company Details</h4>
            <div className="company-detail-row">
              <span className="company-detail-key">Company</span>
              <span className="company-detail-val">{lead.company}</span>
            </div>
            <div className="company-detail-row">
              <span className="company-detail-key">Industry</span>
              <span className="company-detail-val">{lead.industry}</span>
            </div>
            <div className="company-detail-row">
              <span className="company-detail-key">Size</span>
              <span className="company-detail-val">{lead.companySize} employees</span>
            </div>
            <div className="company-detail-row">
              <span className="company-detail-key">Location</span>
              <span className="company-detail-val">{lead.location}</span>
            </div>
            <div className="lead-tags">
              {lead.tags.map((t, i) => <span key={i} className="lead-tag">{t}</span>)}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lead-right-panel">
          {/* AI Summary */}
          <div className="ai-summary-card">
            <div className="ai-summary-header">
              <Sparkles size={16} color="var(--primary)" />
              <span className="ai-summary-label">AI-Generated Summary</span>
            </div>
            <div className="ai-summary-text">{lead.aiSummary}</div>
          </div>

          {/* Score Breakdown */}
          <div className="score-card">
            <div className="score-header">
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--neutral-600)' }}>Score Breakdown</h4>
              </div>
              <div className="score-total" style={{ color: lead.band === 'Hot' ? 'var(--score-hot)' : lead.band === 'Warm' ? 'var(--score-warm)' : 'var(--score-cold)' }}>
                {lead.score}/100
              </div>
            </div>
            <div className="score-bars">
              {Object.entries(lead.scoreBreakdown).filter(([k]) => k !== 'negative').map(([key, val]) => (
                <div key={key} className="score-bar-row">
                  <span className="score-bar-label">{SCORE_LABELS[key] || key}</span>
                  <div className="score-bar-track">
                    <div className="score-bar-fill" style={{
                      width: `${(val / (SCORE_MAX[key] || 25)) * 100}%`,
                      background: SCORE_COLORS[key] || '#10B981',
                    }} />
                  </div>
                  <span className="score-bar-value">{val > 0 ? `+${val}` : val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Qualification Panel */}
          <div className="qualification-card">
            <h4>Qualification Stage</h4>
            <div className="qual-status-row">
              {STAGE_ORDER.map((stage, i) => (
                <div key={stage} className={`qual-status-step ${i === stageIdx ? 'active' : ''} ${i < stageIdx ? 'completed' : ''}`}>
                  {stage}
                </div>
              ))}
            </div>
            <div className="qual-actions">
              <button className="btn btn-primary"><Send size={14} /> Push to CRM</button>
              <button className="btn btn-secondary"><ExternalLink size={14} /> View in CRM</button>
            </div>
          </div>

          {/* Conversation Log */}
          <div className="conversation-card">
            <h4>Conversation Log ({lead.transcript.length} messages)</h4>
            {lead.transcript.length > 0 ? (
              <div className="conversation-messages">
                {lead.transcript.map((msg, i) => (
                  <div key={i} className={`conv-message ${msg.role}`}>
                    <div className="conv-avatar">
                      {msg.role === 'ai' ? '🤖' : lead.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="conv-bubble">{msg.text}</div>
                      <div className="conv-time">{msg.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-conversation">No conversation transcript available for this lead.</div>
            )}
          </div>

          {/* Notes */}
          <div className="notes-card">
            <h4>Notes</h4>
            <textarea className="notes-textarea" placeholder="Add a note about this lead..." />
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <button className="btn btn-primary btn-sm">Save Note</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
