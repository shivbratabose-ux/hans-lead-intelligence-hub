import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Download } from 'lucide-react';
import { LEAD_STATS, LEADS_BY_SOURCE, LEADS_BY_PRODUCT, LEAD_TREND, FUNNEL_DATA } from '../data/leads';
import EVENTS from '../data/events';
import './Reports.css';

const TABS = ['Overview', 'Sources', 'Products', 'Funnel', 'Response Time', 'Events'];

const RESPONSE_DATA = [
  { rep: 'Priya Mehta', avgTime: 1.2, leads: 8 },
  { rep: 'Amit Desai', avgTime: 0.8, leads: 10 },
  { rep: 'Kavita Singh', avgTime: 2.1, leads: 7 },
];

const MONTHLY_TREND = [
  { month: 'Jan', leads: 45, qualified: 12, won: 3 },
  { month: 'Feb', leads: 58, qualified: 18, won: 5 },
  { month: 'Mar', leads: 72, qualified: 24, won: 7 },
  { month: 'Apr', leads: 30, qualified: 10, won: 2 },
];

export default function Reports() {
  const [tab, setTab] = useState('Overview');

  return (
    <div className="reports-page animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
        <div>
          <h2 className="page-title">Reports & Analytics</h2>
          <p className="page-subtitle">Track performance across all channels and teams</p>
        </div>
        <button className="btn btn-outline"><Download size={14} /> Export CSV</button>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'Overview' && (
        <>
          <div className="reports-kpi-row stagger">
            <div className="report-kpi"><div className="report-kpi-value">{LEAD_STATS.totalThisMonth}</div><div className="report-kpi-label">Total Leads</div></div>
            <div className="report-kpi"><div className="report-kpi-value">{LEAD_STATS.qualified}</div><div className="report-kpi-label">Qualified</div></div>
            <div className="report-kpi"><div className="report-kpi-value">{LEAD_STATS.conversionRate}%</div><div className="report-kpi-label">Conversion Rate</div></div>
            <div className="report-kpi"><div className="report-kpi-value">{LEAD_STATS.avgResponseTime}</div><div className="report-kpi-label">Avg Response</div></div>
            <div className="report-kpi"><div className="report-kpi-value">{LEAD_STATS.avgScore}</div><div className="report-kpi-label">Avg Score</div></div>
          </div>
          <div className="reports-charts">
            <div className="chart-card">
              <div className="chart-card-header"><div className="chart-card-title">Monthly Trend</div></div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={MONTHLY_TREND}>
                  <defs>
                    <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }}/>
                  <Area type="monotone" dataKey="leads" stroke="#10B981" strokeWidth={2} fill="url(#gLeads)" name="Leads" />
                  <Area type="monotone" dataKey="qualified" stroke="#006853" strokeWidth={2} fill="none" name="Qualified" />
                  <Area type="monotone" dataKey="won" stroke="#F59E0B" strokeWidth={2} fill="none" name="Won" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-card-header"><div className="chart-card-title">By Source</div></div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={LEADS_BY_SOURCE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="source" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }}/>
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} name="Total" />
                  <Bar dataKey="qualified" fill="#006853" radius={[4, 4, 0, 0]} name="Qualified" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {tab === 'Sources' && (
        <div className="reports-charts">
          <div className="chart-card">
            <div className="chart-card-header"><div className="chart-card-title">Leads by Source Channel</div></div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={LEADS_BY_SOURCE} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis dataKey="source" type="category" tick={{ fontSize: 12, fill: '#64748B' }} width={80} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }}/>
                <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} name="Total" />
                <Bar dataKey="qualified" fill="#006853" radius={[0, 4, 4, 0]} name="Qualified" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <div className="chart-card-header"><div className="chart-card-title">Source Conversion Rate</div></div>
            <div style={{ padding: '16px 0' }}>
              {LEADS_BY_SOURCE.map((s, i) => {
                const rate = s.count > 0 ? Math.round((s.qualified / s.count) * 100) : 0;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <span style={{ width: 80, fontSize: 13, color: '#64748B', textAlign: 'right' }}>{s.source}</span>
                    <div style={{ flex: 1, height: 10, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${rate}%`, height: '100%', background: rate > 40 ? '#10B981' : '#F59E0B', borderRadius: 999, transition: 'width 1s ease' }} />
                    </div>
                    <span style={{ width: 40, fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{rate}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'Products' && (
        <div className="reports-charts">
          <div className="chart-card">
            <div className="chart-card-header"><div className="chart-card-title">Product Interest Distribution</div></div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={LEADS_BY_PRODUCT} cx="50%" cy="50%" outerRadius={110} paddingAngle={3} dataKey="count" nameKey="product" label={({ product, count }) => `${product} (${count})`}>
                  {LEADS_BY_PRODUCT.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <div className="chart-card-header"><div className="chart-card-title">Product Details</div></div>
            <table className="inbox-table">
              <thead><tr><th>Product</th><th>Leads</th><th>% of Total</th></tr></thead>
              <tbody>
                {LEADS_BY_PRODUCT.map((p, i) => (
                  <tr key={i}>
                    <td><span className="badge" style={{ background: `${p.color}15`, color: p.color }}>{p.product}</span></td>
                    <td style={{ fontWeight: 700 }}>{p.count}</td>
                    <td>{Math.round((p.count / 30) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Funnel' && (
        <div className="chart-card" style={{ maxWidth: 700 }}>
          <div className="chart-card-header"><div className="chart-card-title">Conversion Funnel</div></div>
          <div className="funnel-container">
            {FUNNEL_DATA.map((s, i) => (
              <div key={i} className="funnel-stage">
                <span className="funnel-label">{s.stage}</span>
                <div className="funnel-bar-wrap" style={{ height: 40 }}>
                  <div className="funnel-bar" style={{ width: `${(s.count / FUNNEL_DATA[0].count) * 100}%`, background: s.color }}>
                    <span>{s.count}</span>
                  </div>
                </div>
                <span className="funnel-count">{s.count}</span>
                {i > 0 && <span style={{ fontSize: 11, color: '#94A3B8', width: 50 }}>{Math.round((s.count / FUNNEL_DATA[i - 1].count) * 100)}%</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Response Time' && (
        <div className="chart-card" style={{ maxWidth: 600 }}>
          <div className="chart-card-header"><div className="chart-card-title">Response Time by Rep</div></div>
          <table className="inbox-table">
            <thead><tr><th>Rep</th><th>Avg Response (hrs)</th><th>Leads Handled</th><th>Status</th></tr></thead>
            <tbody>
              {RESPONSE_DATA.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{r.rep}</td>
                  <td><span className={`badge ${r.avgTime < 1 ? 'badge-success' : r.avgTime < 2 ? 'badge-warning' : 'badge-danger'}`}>{r.avgTime}h</span></td>
                  <td>{r.leads}</td>
                  <td><span className={`badge ${r.avgTime < 1 ? 'badge-success' : 'badge-warning'}`}>{r.avgTime < 1 ? 'Excellent' : r.avgTime < 2 ? 'Good' : 'Needs Improvement'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Events' && (
        <div className="chart-card">
          <div className="chart-card-header"><div className="chart-card-title">Event ROI</div></div>
          <table className="inbox-table">
            <thead><tr><th>Event</th><th>Date</th><th>Location</th><th>Leads</th><th>Qualified</th><th>Demos</th><th>Conv. Rate</th></tr></thead>
            <tbody>
              {EVENTS.map(e => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 600 }}>{e.name}</td>
                  <td style={{ color: '#94A3B8', fontSize: 13 }}>{e.date}</td>
                  <td style={{ color: '#64748B', fontSize: 13 }}>{e.location}</td>
                  <td style={{ fontWeight: 700 }}>{e.leadsCapured}</td>
                  <td>{e.qualified}</td>
                  <td>{e.demosBooked}</td>
                  <td><span className="badge badge-success">{e.leadsCapured > 0 ? Math.round((e.qualified / e.leadsCapured) * 100) : 0}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
