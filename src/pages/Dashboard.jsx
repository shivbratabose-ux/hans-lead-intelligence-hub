import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Mail, Phone, Wand2, Upload, Target, ArrowRight,
  TrendingUp, Database, Sparkles, CheckCircle2, Flame,
  Activity, BarChart3, RefreshCw, ExternalLink, ClipboardEdit,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DQSummaryPanel } from '../components/DQBadge';
import './Dashboard.css';

const STAGE_CONFIG = {
  raw:       { label: 'Raw',       icon: '🧊', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  targeted:  { label: 'Targeted',  icon: '🔍', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)'  },
  contacted: { label: 'Contacted', icon: '📬', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  engaged:   { label: 'Engaged',   icon: '💬', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)'  },
  warm:      { label: 'Warm',      icon: '🔥', color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
  pushed:    { label: 'In CRM',    icon: '✅', color: '#06B6D4', bg: 'rgba(6,182,212,0.12)'   },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [stages, setStages] = useState([]);
  const [topIndustries, setTopIndustries] = useState([]);
  const [dqStats, setDqStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [totals, stageCounts, industries, dq] = await Promise.all([
      // Total + email/phone completeness
      supabase.from('contacts').select('id, email, phone', { count: 'exact', head: false })
        .limit(1).then(async () => {
          const { count } = await supabase.from('contacts').select('*', { count: 'exact', head: true });
          const { count: emailCount } = await supabase.from('contacts').select('*', { count: 'exact', head: true }).not('email', 'is', null).ilike('email', '%@%');
          const { count: phoneCount } = await supabase.from('contacts').select('*', { count: 'exact', head: true }).not('phone', 'is', null).neq('phone', '');
          return { total: count || 0, withEmail: emailCount || 0, withPhone: phoneCount || 0 };
        }),

      // Stage breakdown
      supabase.rpc('get_stage_counts').then(r => r.data)
        .catch(async () => {
          const { data } = await supabase.from('contacts').select('qual_stage');
          if (!data) return [];
          const map = {};
          data.forEach(r => { map[r.qual_stage] = (map[r.qual_stage] || 0) + 1; });
          return Object.entries(map).map(([qual_stage, count]) => ({ qual_stage, count }));
        }),

      // Top 6 industries
      supabase.from('contacts').select('industry').then(({ data }) => {
        if (!data) return [];
        const map = {};
        data.forEach(r => { if (r.industry) map[r.industry] = (map[r.industry] || 0) + 1; });
        return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([industry, count]) => ({ industry, count }));
      }),

      // DQ stats
      supabase.from('contacts').select('data_quality_score').then(({ data }) => {
        if (!data) return null;
        const total = data.length;
        const avg = Math.round(data.reduce((s, c) => s + (c.data_quality_score || 0), 0) / total);
        return {
          total,
          avg_score: avg,
          grade_a: data.filter(c => (c.data_quality_score || 0) >= 80).length,
          grade_b: data.filter(c => (c.data_quality_score || 0) >= 60 && (c.data_quality_score || 0) < 80).length,
          grade_c: data.filter(c => (c.data_quality_score || 0) >= 40 && (c.data_quality_score || 0) < 60).length,
          grade_d: data.filter(c => (c.data_quality_score || 0) >= 20 && (c.data_quality_score || 0) < 40).length,
          grade_f: data.filter(c => (c.data_quality_score || 0) < 20).length,
          has_email: data.length, has_phone: data.length, has_linkedin: 0,
        };
      }),
    ]);

    setStats(totals);
    setStages(stageCounts || []);
    setTopIndustries(industries);
    setDqStats(dq);
    setLastRefresh(new Date());
    setLoading(false);
  };

  const getStageCount = (key) => {
    const s = stages.find(s => s.qual_stage === key);
    return s ? Number(s.count) : 0;
  };

  const total = stats?.total || 0;
  const warmCount = getStageCount('warm');
  const targetedCount = getStageCount('targeted');
  const pushedCount = getStageCount('pushed');

  return (
    <div className="dashboard animate-in">

      {/* ── KPI Strip ── */}
      <div className="dash-kpi-strip">
        <div className="dash-kpi">
          <div className="dash-kpi-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <Users size={20} color="#10B981" />
          </div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-val">{loading ? '—' : total.toLocaleString()}</div>
            <div className="dash-kpi-label">Total Contacts</div>
          </div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>
            <Mail size={20} color="#3B82F6" />
          </div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-val">{loading ? '—' : stats?.withEmail?.toLocaleString()}</div>
            <div className="dash-kpi-label">Have Email</div>
          </div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <Phone size={20} color="#F59E0B" />
          </div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-val">{loading ? '—' : stats?.withPhone?.toLocaleString()}</div>
            <div className="dash-kpi-label">Have Phone</div>
          </div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <Flame size={20} color="#10B981" />
          </div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-val">{loading ? '—' : warmCount}</div>
            <div className="dash-kpi-label">Warm — Ready for CRM</div>
          </div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon" style={{ background: 'rgba(6,182,212,0.12)' }}>
            <CheckCircle2 size={20} color="#06B6D4" />
          </div>
          <div className="dash-kpi-body">
            <div className="dash-kpi-val">{loading ? '—' : pushedCount.toLocaleString()}</div>
            <div className="dash-kpi-label">Pushed to CRM</div>
          </div>
        </div>
      </div>

      {/* ── Qualification Funnel ── */}
      <div className="dash-section-title">
        <Target size={15} /> Cold Lead Qualification Funnel
        <button className="dash-refresh-btn" onClick={loadAll} disabled={loading}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
        </button>
      </div>
      <div className="dash-funnel-strip">
        {['raw', 'targeted', 'contacted', 'engaged', 'warm', 'pushed'].map((key, i, arr) => {
          const cfg = STAGE_CONFIG[key];
          const count = getStageCount(key);
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
          return (
            <div key={key} className="dash-funnel-item" onClick={() => navigate('/qualify')}>
              <div className="dash-funnel-icon">{cfg.icon}</div>
              <div className="dash-funnel-count" style={{ color: cfg.color }}>
                {loading ? '—' : count.toLocaleString()}
              </div>
              <div className="dash-funnel-label">{cfg.label}</div>
              <div className="dash-funnel-pct">{pct}%</div>
              <div className="dash-funnel-bar-wrap">
                <div className="dash-funnel-bar" style={{ height: `${Math.max(4, pct)}%`, background: cfg.color }} />
              </div>
              {i < arr.length - 1 && <div className="dash-funnel-arrow"><ArrowRight size={14} color="#334155" /></div>}
            </div>
          );
        })}
      </div>

      {/* ── Middle Row ── */}
      <div className="dash-mid-row">

        {/* Top Industries */}
        <div className="dash-card">
          <div className="dash-card-header">
            <BarChart3 size={14} /> Top Industries
          </div>
          <div className="dash-industries">
            {topIndustries.map(({ industry, count }) => (
              <div key={industry} className="dash-ind-row">
                <span className="dash-ind-label" title={industry}>{industry?.length > 22 ? industry.slice(0, 20) + '…' : industry}</span>
                <div className="dash-ind-bar-wrap">
                  <div className="dash-ind-bar" style={{ width: `${(count / (topIndustries[0]?.count || 1)) * 100}%` }} />
                </div>
                <span className="dash-ind-count">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dash-card">
          <div className="dash-card-header">
            <Sparkles size={14} /> Quick Actions
          </div>
          <div className="dash-quick-actions">
            <button className="dash-qa-btn" onClick={() => navigate('/qualify')}>
              <div className="dash-qa-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
                <Target size={18} color="#10B981" />
              </div>
              <div>
                <div className="dash-qa-title">Qualification Tracker</div>
                <div className="dash-qa-sub">{targetedCount.toLocaleString()} targeted — ready to contact</div>
              </div>
              <ArrowRight size={14} color="#475569" />
            </button>
            <button className="dash-qa-btn" onClick={() => navigate('/manual-enrich')}>
              <div className="dash-qa-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
                <ClipboardEdit size={18} color="#6366F1" />
              </div>
              <div>
                <div className="dash-qa-title">Manual Enrichment</div>
                <div className="dash-qa-sub">Update emails, phones & LinkedIn</div>
              </div>
              <ArrowRight size={14} color="#475569" />
            </button>
            <button className="dash-qa-btn" onClick={() => navigate('/enrich')}>
              <div className="dash-qa-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
                <Wand2 size={18} color="#F59E0B" />
              </div>
              <div>
                <div className="dash-qa-title">AI Enrichment</div>
                <div className="dash-qa-sub">Auto-find missing contact data</div>
              </div>
              <ArrowRight size={14} color="#475569" />
            </button>
            <button className="dash-qa-btn" onClick={() => navigate('/import')}>
              <div className="dash-qa-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>
                <Upload size={18} color="#3B82F6" />
              </div>
              <div>
                <div className="dash-qa-title">Smart Import</div>
                <div className="dash-qa-sub">Add new leads from any source</div>
              </div>
              <ArrowRight size={14} color="#475569" />
            </button>
            <a
              href="https://smartcrm-hans.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="dash-qa-btn dash-qa-crm"
            >
              <div className="dash-qa-icon" style={{ background: 'rgba(6,182,212,0.12)' }}>
                <ExternalLink size={18} color="#06B6D4" />
              </div>
              <div>
                <div className="dash-qa-title">Open SmartCRM</div>
                <div className="dash-qa-sub">{warmCount} warm leads ready to hand off</div>
              </div>
              <ArrowRight size={14} color="#06B6D4" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Data Quality Index ── */}
      <div className="dash-section-title">
        <Activity size={15} /> Data Quality Index
      </div>
      <DQSummaryPanel stats={dqStats} />

    </div>
  );
}
