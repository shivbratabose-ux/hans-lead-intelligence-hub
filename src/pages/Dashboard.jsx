import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Area, AreaChart
} from 'recharts';
import { Users, Flame, CheckCircle2, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import LEADS, { LEAD_STATS, LEADS_BY_SOURCE, LEADS_BY_PRODUCT, LEAD_TREND, FUNNEL_DATA } from '../data/leads';
import './Dashboard.css';

const COLORS = ['#10B981', '#006853', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function Dashboard() {
  const navigate = useNavigate();
  const hotLeads = LEADS.filter(l => l.band === 'Hot').slice(0, 8);

  return (
    <div className="dashboard animate-in">
      {/* KPI Cards */}
      <div className="dashboard-kpis stagger">
        <div className="kpi-card">
          <div className="kpi-icon green"><Users size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Total Leads Today</div>
            <div className="kpi-value">{LEAD_STATS.totalToday}</div>
            <span className="kpi-change up"><TrendingUp size={12} /> +23%</span>
          </div>
        </div>
        <div className="kpi-card qualified">
          <div className="kpi-icon blue"><CheckCircle2 size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Qualified Leads</div>
            <div className="kpi-value">{LEAD_STATS.qualified}</div>
            <span className="kpi-change up"><TrendingUp size={12} /> +15%</span>
          </div>
        </div>
        <div className="kpi-card hot">
          <div className="kpi-icon red"><Flame size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Hot Leads</div>
            <div className="kpi-value">{LEAD_STATS.hot}</div>
            <span className="kpi-change up"><TrendingUp size={12} /> +8%</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon amber"><Clock size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Pending Follow-ups</div>
            <div className="kpi-value">{LEAD_STATS.pendingFollowUps}</div>
            <span className="kpi-change down"><TrendingDown size={12} /> 3 overdue</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="dashboard-charts">
        {/* Lead Trend Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Lead Trend</div>
              <div className="chart-card-subtitle">Last 30 days</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={LEAD_TREND}>
              <defs>
                <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradQualified" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006853" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#006853" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              />
              <Area type="monotone" dataKey="leads" stroke="#10B981" strokeWidth={2} fill="url(#gradLeads)" name="All Leads" />
              <Area type="monotone" dataKey="qualified" stroke="#006853" strokeWidth={2} fill="url(#gradQualified)" name="Qualified" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Product Interest Donut */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">By Product</div>
              <div className="chart-card-subtitle">Lead interest distribution</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={LEADS_BY_PRODUCT}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="count"
                nameKey="product"
              >
                {LEADS_BY_PRODUCT.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {LEADS_BY_PRODUCT.map((p, i) => (
              <span key={i} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', color: '#64748B'
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: p.color, display: 'inline-block'
                }} />
                {p.product}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="dashboard-charts-row">
        {/* Leads by Source */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Leads by Source</div>
              <div className="chart-card-subtitle">All channels</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={LEADS_BY_SOURCE} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="source" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              />
              <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} name="Total" />
              <Bar dataKey="qualified" fill="#006853" radius={[4, 4, 0, 0]} name="Qualified" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Funnel */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Conversion Funnel</div>
              <div className="chart-card-subtitle">Lead → Won pipeline</div>
            </div>
          </div>
          <div className="funnel-container">
            {FUNNEL_DATA.map((stage, i) => (
              <div key={i} className="funnel-stage">
                <span className="funnel-label">{stage.stage}</span>
                <div className="funnel-bar-wrap">
                  <div
                    className="funnel-bar"
                    style={{
                      width: `${(stage.count / FUNNEL_DATA[0].count) * 100}%`,
                      background: stage.color,
                    }}
                  >
                    {(stage.count / FUNNEL_DATA[0].count) * 100 > 15 && (
                      <span>{stage.count}</span>
                    )}
                  </div>
                </div>
                <span className="funnel-count">{stage.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Hot Leads */}
      <div className="recent-leads-card">
        <div className="recent-leads-header">
          <span className="recent-leads-title">🔥 Recent Hot Leads</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leads')}>View All →</button>
        </div>
        <table className="recent-leads-table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Product Interest</th>
              <th>Score</th>
              <th>Source</th>
              <th>Status</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {hotLeads.map(lead => (
              <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                <td>
                  <div className="lead-name-cell">
                    <div className="avatar" style={{ background: `hsl(${lead.name.charCodeAt(0) * 7 % 360}, 55%, 50%)` }}>
                      {lead.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="lead-name-text">{lead.name}</div>
                      <div className="lead-company-text">{lead.company}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-primary">{lead.product}</span></td>
                <td><span className={`badge badge-${lead.band.toLowerCase()}`}>{lead.score} — {lead.band}</span></td>
                <td><span className="source-badge">{lead.source}</span></td>
                <td><span className="badge badge-neutral">{lead.status}</span></td>
                <td style={{ fontSize: '13px', color: '#64748B' }}>{lead.assignedName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
