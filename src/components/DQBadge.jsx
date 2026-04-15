import { useState } from 'react';
import { getDQGrade, getDQLabel, getDQColor, getDQBgColor, getDQBreakdown, computeDQScore, DQ_GRADE_STATS } from '../lib/dataQuality';
import './DQBadge.css';

/**
 * DQBadge — compact grade badge with hover tooltip showing field breakdown
 * Props:
 *   score   — numeric score (0-100) from DB or computed
 *   contact — contact object (to compute breakdown)
 *   size    — 'sm' | 'md' (default 'md')
 */
export function DQBadge({ score, contact, size = 'md' }) {
  const [showTip, setShowTip] = useState(false);
  const s = score ?? (contact ? computeDQScore(contact) : 0);
  const grade = getDQGrade(s);
  const label = getDQLabel(s);
  const color = getDQColor(s);
  const bg    = getDQBgColor(s);
  const breakdown = contact ? getDQBreakdown(contact) : null;

  return (
    <div
      className={`dq-badge-wrap dq-size-${size}`}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <div className="dq-badge" style={{ color, background: bg, borderColor: `${color}40` }}>
        <span className="dq-grade">{grade}</span>
        <span className="dq-score">{s}</span>
      </div>

      {showTip && (
        <div className="dq-tooltip">
          <div className="dq-tooltip-header">
            <span className="dq-tooltip-grade" style={{ color }}>{grade} — {label}</span>
            <span className="dq-tooltip-pts" style={{ color }}>{s}/100</span>
          </div>
          <div className="dq-tooltip-bar-wrap">
            <div className="dq-tooltip-bar" style={{ width: `${s}%`, background: color }} />
          </div>
          {breakdown && (
            <div className="dq-tooltip-fields">
              {breakdown.map(f => (
                <div key={f.key} className={`dq-field-row ${f.present ? 'present' : 'missing'}`}>
                  <span className="dq-field-icon">{f.present ? '✓' : '○'}</span>
                  <span className="dq-field-label">{f.label}</span>
                  <span className="dq-field-pts" style={{ color: f.present ? color : '#475569' }}>
                    {f.present ? `+${f.points}` : `+0`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * DQSummaryPanel — full-width summary card for dashboard / top of page
 * Props: stats = { total, avg_score, grade_a, grade_b, grade_c, grade_d, grade_f, has_email, has_phone, has_linkedin }
 */
export function DQSummaryPanel({ stats }) {
  if (!stats) return null;
  const total = stats.total || 1;
  const grades = [
    { grade: 'A', count: stats.grade_a || 0 },
    { grade: 'B', count: stats.grade_b || 0 },
    { grade: 'C', count: stats.grade_c || 0 },
    { grade: 'D', count: stats.grade_d || 0 },
    { grade: 'F', count: stats.grade_f || 0 },
  ];

  return (
    <div className="dq-summary-panel">
      <div className="dq-summary-left">
        <div className="dq-summary-score-ring">
          <svg viewBox="0 0 64 64" className="dq-ring-svg">
            <circle cx="32" cy="32" r="26" className="dq-ring-bg" />
            <circle
              cx="32" cy="32" r="26"
              className="dq-ring-fill"
              style={{
                strokeDasharray: `${2 * Math.PI * 26}`,
                strokeDashoffset: `${2 * Math.PI * 26 * (1 - (stats.avg_score || 0) / 100)}`,
                stroke: getDQColor(stats.avg_score || 0),
              }}
            />
          </svg>
          <div className="dq-ring-label">
            <span className="dq-ring-score">{stats.avg_score || 0}</span>
            <span className="dq-ring-sub">avg score</span>
          </div>
        </div>
        <div className="dq-summary-meta">
          <div className="dq-summary-title">Data Quality Index</div>
          <div className="dq-summary-subtitle">{total.toLocaleString()} contacts scored</div>
          <div className="dq-grade-row">
            {grades.map(g => (
              <div key={g.grade} className="dq-grade-pill"
                style={{ background: DQ_GRADE_STATS[g.grade].bg, color: DQ_GRADE_STATS[g.grade].color }}>
                <span className="dq-grade-letter">{g.grade}</span>
                <span className="dq-grade-count">{g.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="dq-summary-right">
        <div className="dq-completeness-title">Field Completeness</div>
        {[
          { label: 'Email',    count: stats.has_email,    pts: 25, color: '#10B981' },
          { label: 'Phone',    count: stats.has_phone,    pts: 20, color: '#3B82F6' },
          { label: 'LinkedIn', count: stats.has_linkedin, pts:  8, color: '#0A66C2' },
        ].map(f => {
          const pct = Math.round((f.count / total) * 100);
          return (
            <div key={f.label} className="dq-completeness-row">
              <span className="dq-completeness-label">{f.label}</span>
              <div className="dq-completeness-bar-wrap">
                <div className="dq-completeness-bar" style={{ width: `${pct}%`, background: f.color }} />
              </div>
              <span className="dq-completeness-pct" style={{ color: f.color }}>{pct}%</span>
              <span className="dq-completeness-pts">+{f.pts}pts</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
