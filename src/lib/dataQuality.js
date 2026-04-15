// ─── Data Quality Score Utility ───────────────────────────────────────────
// Score breakdown (matches Postgres trigger in compute_data_quality_score):
//   Email valid   → 25 pts
//   Phone valid   → 20 pts
//   Name          → 15 pts
//   Company       → 15 pts
//   Title         → 10 pts
//   LinkedIn      →  8 pts
//   Location      →  4 pts
//   Country       →  3 pts
//   Total possible: 100 pts

export const DQ_FIELDS = [
  { key: 'email',    label: 'Email',    points: 25, check: v => v && v.includes('@') },
  { key: 'phone',    label: 'Phone',    points: 20, check: v => v && v.trim().length > 4 },
  { key: 'name',     label: 'Name',     points: 15, check: v => v && v.trim() !== '' },
  { key: 'company',  label: 'Company',  points: 15, check: v => v && v.trim() !== '' },
  { key: 'title',    label: 'Title',    points: 10, check: v => v && v.trim() !== '' },
  { key: 'linkedin', label: 'LinkedIn', points:  8, check: v => v && v.trim() !== '' },
  { key: 'location', label: 'Location', points:  4, check: v => v && v.trim() !== '' },
  { key: 'country',  label: 'Country',  points:  3, check: v => v && v.trim() !== '' },
];

/** Compute score client-side (mirrors the Postgres trigger) */
export function computeDQScore(contact) {
  return DQ_FIELDS.reduce((sum, f) => sum + (f.check(contact[f.key]) ? f.points : 0), 0);
}

/** Get grade letter from numeric score */
export function getDQGrade(score) {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'F';
}

/** Get grade label */
export function getDQLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Incomplete';
}

/** Get color for a score */
export function getDQColor(score) {
  if (score >= 80) return '#10B981'; // green
  if (score >= 60) return '#3B82F6'; // blue
  if (score >= 40) return '#F59E0B'; // amber
  if (score >= 20) return '#F97316'; // orange
  return '#EF4444';                  // red
}

/** Get background (muted) color */
export function getDQBgColor(score) {
  if (score >= 80) return 'rgba(16,185,129,0.12)';
  if (score >= 60) return 'rgba(59,130,246,0.12)';
  if (score >= 40) return 'rgba(245,158,11,0.12)';
  if (score >= 20) return 'rgba(249,115,22,0.12)';
  return 'rgba(239,68,68,0.12)';
}

/** Get per-field breakdown for a contact */
export function getDQBreakdown(contact) {
  return DQ_FIELDS.map(f => ({
    ...f,
    present: f.check(contact[f.key]),
    earned: f.check(contact[f.key]) ? f.points : 0,
  }));
}

export const DQ_GRADE_STATS = {
  A: { label: 'Excellent', color: '#10B981', bg: 'rgba(16,185,129,0.12)', range: '80–100' },
  B: { label: 'Good',      color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  range: '60–79'  },
  C: { label: 'Fair',      color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', range: '40–59'  },
  D: { label: 'Poor',      color: '#F97316', bg: 'rgba(249,115,22,0.12)', range: '20–39'  },
  F: { label: 'Incomplete',color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  range: '0–19'   },
};
