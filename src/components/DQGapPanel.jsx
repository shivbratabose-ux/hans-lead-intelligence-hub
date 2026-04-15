import { useState } from 'react';
import {
  Zap, Mail, Phone, User, Building2, Tag, Link2, MapPin, Globe,
  CheckCircle2, AlertCircle, ChevronRight, Copy, Lightbulb,
  ArrowUpRight, Sparkles, TrendingUp,
} from 'lucide-react';
import { DQ_FIELDS, getDQBreakdown, getDQGrade, getDQColor, getDQBgColor, computeDQScore } from '../lib/dataQuality';
import './DQGapPanel.css';

// ── AI Suggestion Engine ────────────────────────────────────────────────────
// Pure client-side heuristics — no API needed

function guessEmail(contact) {
  const name = (contact.name || '').trim().toLowerCase().replace(/[^a-z\s]/g, '');
  const parts = name.split(/\s+/).filter(Boolean);
  const company = (contact.company || '').trim().toLowerCase()
    .replace(/\s+(pvt|ltd|llp|inc|corp|group|international|india|private|limited|co\.?)\b.*/i, '')
    .replace(/[^a-z0-9]/g, '');

  if (!parts.length || !company) return null;

  const first = parts[0];
  const last  = parts[parts.length - 1];

  if (company.length < 2) return null;

  return [
    `${first}.${last}@${company}.com`,
    `${first}@${company}.com`,
    `${first[0]}${last}@${company}.com`,
    `${last}.${first}@${company}.com`,
  ];
}

function guessLinkedIn(contact) {
  const name = (contact.name || '').trim().toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '-');
  if (!name || name.length < 3) return null;
  return `https://linkedin.com/in/${name}`;
}

function guessLocation(contact) {
  if (contact.country) return contact.country;
  return null;
}

function guessTitle(contact) {
  const industry = contact.industry || '';
  const titleMap = {
    'Shipping & Logistics':    ['Manager – Exports', 'Director of Operations', 'Logistics Manager'],
    'Manufacturing':           ['Plant Manager', 'Production Head', 'Supply Chain Manager'],
    'Trading':                 ['Export Manager', 'Senior Trader', 'Business Development Manager'],
    'IT & Technology':         ['CTO', 'IT Manager', 'Head of Technology'],
    'Healthcare':              ['Medical Director', 'Operations Manager', 'Procurement Head'],
    'Pharmaceuticals':         ['Regulatory Affairs Manager', 'Supply Chain Manager'],
    'FMCG':                    ['National Sales Manager', 'Distribution Head'],
    'Retail':                  ['Store Operations Manager', 'Head of Procurement'],
    'Automobiles':             ['Plant Manager', 'Quality Head', 'Supply Chain Director'],
    'Finance & Banking':       ['CFO', 'Finance Manager', 'Head of Operations'],
    'Aviation & Aerospace':    ['Ground Operations Manager', 'Cargo Manager'],
    'Chemicals':               ['Plant Head', 'Production Manager', 'Quality Manager'],
    'Textiles':                ['Export Manager', 'Merchandising Head', 'Production Director'],
    'Agriculture':             ['Agri-Business Manager', 'Export Head'],
    'Food & Beverages':        ['Supply Chain Manager', 'Production Head'],
    'Real Estate':             ['Project Director', 'Operations Head'],
    'Education':               ['Academic Director', 'Operations Manager'],
    'Government':              ['Director', 'Joint Secretary', 'Deputy Commissioner'],
    'Mining & Metals':         ['Plant Manager', 'Operations Director'],
    'Energy':                  ['Project Manager', 'Operations Head'],
  };
  const suggestions = titleMap[industry] || ['Manager', 'Director', 'Head of Department'];
  return suggestions;
}

// ── Field Icons ─────────────────────────────────────────────────────────────
const FIELD_ICONS = {
  email:    Mail,
  phone:    Phone,
  name:     User,
  company:  Building2,
  title:    Tag,
  linkedin: Link2,
  location: MapPin,
  country:  Globe,
};

const COMPLETION_TIPS = {
  email:    'Find via LinkedIn, company website, or email finder tools',
  phone:    'Check LinkedIn, WhatsApp Business, or the company directory',
  name:     'Look up LinkedIn profile or business card',
  company:  'Verify on LinkedIn or MCA database',
  title:    'Check LinkedIn, company website, or email signature',
  linkedin: 'Search on LinkedIn by name + company',
  location: 'Use company HQ or LinkedIn location',
  country:  'Determine from phone prefix or company address',
};

// ── Main Component ───────────────────────────────────────────────────────────

/**
 * DQGapPanel — full gap analysis for a single contact
 * Props:
 *   contact       — contact object
 *   onApply(field, value) — called when user applies a suggested value
 *   compact       — boolean, shows condensed version
 */
export function DQGapPanel({ contact, onApply, compact = false }) {
  const [copiedField, setCopiedField] = useState(null);
  const [expandedField, setExpandedField] = useState(null);

  if (!contact) return null;

  const score     = computeDQScore(contact);
  const breakdown = getDQBreakdown(contact);
  const missing   = breakdown.filter(f => !f.present);
  const present   = breakdown.filter(f => f.present);
  const gap       = 100 - score;
  const color     = getDQColor(score);

  // Build AI suggestions per missing field
  const suggestions = {};
  missing.forEach(f => {
    if (f.key === 'email')    suggestions.email    = guessEmail(contact);
    if (f.key === 'linkedin') suggestions.linkedin = guessLinkedIn(contact) ? [guessLinkedIn(contact)] : null;
    if (f.key === 'location') suggestions.location = guessLocation(contact) ? [guessLocation(contact)] : null;
    if (f.key === 'title')    suggestions.title    = guessTitle(contact);
    if (f.key === 'country')  suggestions.country  = contact.location ? [contact.location.split(',').pop().trim()] : null;
  });

  const copyValue = (value, field) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedField(field + value);
    setTimeout(() => setCopiedField(null), 1500);
  };

  if (compact) {
    // Compact inline version — just shows missing fields as chips
    return (
      <div className="dq-gap-compact">
        {missing.length === 0 ? (
          <span className="dq-gap-perfect">
            <CheckCircle2 size={11} color="#10B981" /> Perfect Score!
          </span>
        ) : (
          <div className="dq-gap-chips">
            {missing.slice(0, 3).map(f => {
              const Icon = FIELD_ICONS[f.key] || Tag;
              return (
                <span key={f.key} className="dq-gap-chip"
                  style={{ borderColor: '#F59E0B30', color: '#F59E0B' }}
                  title={`Add ${f.label} to gain +${f.points} pts`}>
                  <Icon size={9} />
                  +{f.points}
                </span>
              );
            })}
            {missing.length > 3 && (
              <span className="dq-gap-chip-more">+{missing.length - 3} more</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full panel
  return (
    <div className="dq-gap-panel">
      {/* Score Overview */}
      <div className="dq-gap-overview" style={{ borderColor: `${color}30` }}>
        <div className="dq-gap-score-block">
          <div className="dq-gap-circle" style={{ background: getDQBgColor(score), borderColor: `${color}50` }}>
            <span className="dq-gap-score-num" style={{ color }}>{score}</span>
            <span className="dq-gap-score-sub">/100</span>
          </div>
          <div className="dq-gap-meta">
            <div className="dq-gap-grade" style={{ color }}>{getDQGrade(score)} Grade</div>
            <div className="dq-gap-contact-name">{contact.name || 'Unknown'}</div>
            <div className="dq-gap-contact-co">{contact.company || '—'}</div>
          </div>
        </div>
        <div className="dq-gap-bar-col">
          <div className="dq-gap-bar-track">
            <div className="dq-gap-bar-fill"
              style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
            <div className="dq-gap-bar-gap"
              style={{ width: `${gap}%`, background: 'rgba(239,68,68,0.08)', borderLeft: `2px dashed rgba(239,68,68,0.35)` }} />
          </div>
          <div className="dq-gap-bar-labels">
            <span style={{ color }}>{score} pts earned</span>
            {gap > 0 && <span style={{ color: '#EF4444' }}>+{gap} pts missing</span>}
          </div>
        </div>
      </div>

      {/* ── Missing Fields (Action Items) ── */}
      {missing.length > 0 && (
        <div className="dq-gap-section">
          <div className="dq-gap-section-title">
            <AlertCircle size={12} color="#F59E0B" />
            Missing Fields — add these to reach 100
          </div>
          {missing.map((f, idx) => {
            const Icon = FIELD_ICONS[f.key] || Tag;
            const sugg = suggestions[f.key];
            const isExpanded = expandedField === f.key;
            return (
              <div key={f.key} className={`dq-gap-field-row missing ${isExpanded ? 'expanded' : ''}`}
                style={{ animationDelay: `${idx * 0.04}s` }}>
                <div className="dq-gap-field-header" onClick={() => setExpandedField(isExpanded ? null : f.key)}>
                  <div className="dq-gap-field-left">
                    <div className="dq-gap-field-icon-wrap" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>
                      <Icon size={12} />
                    </div>
                    <div>
                      <div className="dq-gap-field-name">{f.label}</div>
                      <div className="dq-gap-field-tip">{COMPLETION_TIPS[f.key]}</div>
                    </div>
                  </div>
                  <div className="dq-gap-field-right">
                    <span className="dq-gap-pts-badge">+{f.points} pts</span>
                    <ChevronRight size={12} className={`dq-gap-chevron ${isExpanded ? 'open' : ''}`} />
                  </div>
                </div>

                {/* AI Suggestions */}
                {isExpanded && (
                  <div className="dq-gap-suggestions">
                    {sugg && sugg.length > 0 ? (
                      <>
                        <div className="dq-gap-sugg-title">
                          <Sparkles size={10} color="#8B5CF6" /> AI-suggested values:
                        </div>
                        {sugg.slice(0, 4).map((s, si) => (
                          <div key={si} className="dq-gap-sugg-item">
                            <span className="dq-gap-sugg-val">{s}</span>
                            <div className="dq-gap-sugg-actions">
                              <button className="dq-gap-sugg-btn copy"
                                onClick={() => copyValue(s, f.key)}
                                title="Copy to clipboard">
                                {copiedField === f.key + s ? <CheckCircle2 size={10} /> : <Copy size={10} />}
                              </button>
                              {onApply && (
                                <button className="dq-gap-sugg-btn apply"
                                  onClick={() => { onApply(f.key, s); setExpandedField(null); }}
                                  title="Apply this value">
                                  <CheckCircle2 size={10} /> Apply
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="dq-gap-no-sugg">
                        <Lightbulb size={11} />
                        No AI suggestion available — enrich manually or use LinkedIn
                        {f.key === 'phone' && contact.name && (
                          <a
                            href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(contact.name + ' ' + (contact.company || ''))}`}
                            target="_blank" rel="noopener noreferrer"
                            className="dq-gap-linkedin-link">
                            Search on LinkedIn <ArrowUpRight size={10} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Present Fields ── */}
      {present.length > 0 && (
        <div className="dq-gap-section">
          <div className="dq-gap-section-title">
            <CheckCircle2 size={12} color="#10B981" />
            Completed Fields
          </div>
          <div className="dq-gap-present-grid">
            {present.map(f => {
              const Icon = FIELD_ICONS[f.key] || Tag;
              return (
                <div key={f.key} className="dq-gap-present-item">
                  <Icon size={10} color="#10B981" />
                  <span>{f.label}</span>
                  <span className="dq-gap-present-pts">+{f.points}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Score Projection ── */}
      {missing.length > 0 && (
        <div className="dq-gap-projection">
          <TrendingUp size={12} color="#8B5CF6" />
          <div className="dq-gap-proj-text">
            Adding <strong>{missing[0].label}</strong> alone will push score to{' '}
            <strong style={{ color: getDQColor(score + missing[0].points) }}>
              {Math.min(100, score + missing[0].points)}
            </strong>
            {' '}({getDQGrade(Math.min(100, score + missing[0].points))} Grade)
          </div>
        </div>
      )}

      {missing.length === 0 && (
        <div className="dq-gap-perfect-state">
          <CheckCircle2 size={22} color="#10B981" />
          <div>
            <strong>Perfect Data Quality!</strong>
            <p>All fields filled — this contact scored 100/100</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Smart Enrich Queue Stats ─────────────────────────────────────────────────

/**
 * DQSmartQueueBanner — shows a row of "field gap" stats for a list of contacts
 * Props: contacts (array)
 */
export function DQSmartQueueBanner({ contacts }) {
  if (!contacts || contacts.length === 0) return null;

  const stats = DQ_FIELDS.map(f => ({
    ...f,
    missing: contacts.filter(c => !f.check(c[f.key])).length,
    pct: Math.round((contacts.filter(c => !f.check(c[f.key])).length / contacts.length) * 100),
  })).sort((a, b) => b.missing - a.missing);

  const avgScore = Math.round(contacts.reduce((s, c) => s + computeDQScore(c), 0) / contacts.length);
  const potentialGain = 100 - avgScore;

  return (
    <div className="dq-queue-banner">
      <div className="dq-queue-avg">
        <Zap size={14} color="#8B5CF6" />
        <div>
          <div className="dq-queue-avg-val" style={{ color: getDQColor(avgScore) }}>{avgScore}</div>
          <div className="dq-queue-avg-label">avg score</div>
        </div>
        {potentialGain > 0 && (
          <div className="dq-queue-potential">
            <TrendingUp size={11} color="#10B981" />
            +{potentialGain} pts possible
          </div>
        )}
      </div>
      <div className="dq-queue-fields">
        {stats.slice(0, 5).map(f => {
          const Icon = FIELD_ICONS[f.key] || Tag;
          const urgency = f.pct > 70 ? '#EF4444' : f.pct > 40 ? '#F59E0B' : '#10B981';
          return (
            <div key={f.key} className="dq-queue-field-stat">
              <div className="dq-queue-field-top">
                <Icon size={10} color={urgency} />
                <span style={{ color: urgency }}>{f.label}</span>
              </div>
              <div className="dq-queue-field-bar-wrap">
                <div className="dq-queue-field-bar-miss"
                  style={{ width: `${f.pct}%`, background: `${urgency}30`, border: `1px solid ${urgency}40` }} />
              </div>
              <div className="dq-queue-field-pct" style={{ color: urgency }}>{f.pct}% missing</div>
              <div className="dq-queue-field-pts">+{f.points}pts each</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
