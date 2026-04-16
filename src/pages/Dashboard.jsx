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

const STAGE_KEYS = ['raw', 'targeted', 'contacted', 'engaged', 'warm', 'pushed'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [stageCounts, setStageCounts] = useState({});
  const [topIndustries, setTopIndustries] = useState([]);
  const [dqStats, setDqStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      // 1. Total + email/phone counts (3 parallel HEAD queries — very fast)
      const [totalRes, emailRes, phoneRes] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('contacts').select('*', { count: 'exact', head: true })
          .not('email', 'is', null).ilike('email', '%@%'),
        supabase.from('contacts').select('*', { count: 'exact', head: true })
          .not('phone', 'is', null).neq('phone', '').neq('phone', '??'),
      ]);
      setStats({
        total:     totalRes.count   || 0,
        withEmail: emailRes.count   || 0,
        withPhone: phoneRes.count   || 0,
      });

      // 2. Stage counts — one HEAD query per stage (6 parallel) — bypasses broken RPC
      const stageResults = await Promise.all(
        STAGE_KEYS.map(key =>
          supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('qual_stage', key)
        )
      );
      const counts = {};
      STAGE_KEYS.forEach((key, i) => { counts[key] = stageResults[i].count || 0; });
      setStageCounts(counts);

      // 3. Top 6 industries — stream all industry values and count client-side
      const { data: indData } = await supabase.from('contacts').select('industry');
      if (indData) {
        const map = {};
        indData.forEach(r => { if (r.industry) map[r.industry] = (map[r.industry] || 0) + 1; });
        setTopIndustries(Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([industry, count]) => ({ industry, count })));
      }

      // 4. DQ stats — sample up to 5000 for speed
      const { data: dqData } = await supabase
        .from('contacts')
        .select('data_quality_score, email, phone, linkedin')
        .limit(5000);
      if (dqData && dqData.length > 0) {
        const total = dqData.length;
        const avg = Math.round(dqData.reduce((s, c) => s + (c.data_quality_score || 0), 0) / total);
        setDqStats({
          total,
          avg_score: avg,
          grade_a: dqData.filter(c => (c.data_quality_score || 0) >= 80).length,
          grade_b: dqData.filter(c => (c.data_quality_score || 0) >= 60 && (c.data_quality_score || 0) < 80).length,
          grade_c: dqData.filter(c => (c.data_quality_score || 0) >= 40 && (c.data_quality_score || 0) < 60).length,
          grade_d: dqData.filter(c => (c.data_quality_score || 0) >= 20 && (c.data_quality_score || 0) < 40).length,
          grade_f: dqData.filter(c => (c.data_quality_score || 0) < 20).length,
          has_email:   dqData.filter(c => c.email && c.email.includes('@')).length,
          has_phone:   dqData.filter(c => c.phone && c.phone.trim().length > 4).length,
          has_linkedin: dqData.filter(c => c.linkedin && c.linkedin.includes('linkedin')).length,
        });
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
    setLoading(false);
  };

  const getStage = (key) => stageCounts[key] || 0;
  const total      = stats?.total || 0;
  const warmCount  = getStage('warm');
  const targetedCount = getStage('targeted');
  const pushedCount   = getStage('pushed');

  return (
    <div className="dashboard animate-in">

      {/* ── KPI Strip ── */}
      <div className="dash-kpi-strip stagger">
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
            <div className="dash-kpi-val">{loading ? '—' : warmCount.toLocaleString()}</div>
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
        {STAGE_KEYS.map((key, i, arr) => {
          const cfg = STAGE_CONFIG[key];
          const count = getStage(key);
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
          return (
            <div key={key} className="dash-funnel-item" onClick={() => navigate('/qualify')}>
              <div className="dash-funnel-icon">{cfg.icon}</div>
              <div className="dash-funnel-count" style={{ color: cfg.color }}>
                {loading ? '—' : count.toLocaleString()}
              </div>
              <div className="dash-funnel-label">{cfg.label}</div>
              <div className="dash-funnel-pct">{loading ? '…' : `${pct}%`}</div>
              <div className="dash-funnel-bar-wrap">
                <div className="dash-funnel-bar" style={{ height: `${Math.max(4, Number(pct))}%`, background: cfg.color }} />
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
                <div className="dash-qa-sub">Update emails, phones &amp; LinkedIn</div>
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
