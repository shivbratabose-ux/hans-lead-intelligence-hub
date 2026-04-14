import { useState } from 'react';
import { MapPin, Calendar, QrCode, Users, CheckCircle2, Eye, ArrowLeft, Plus } from 'lucide-react';
import EVENTS from '../data/events';
import LEADS from '../data/leads';
import './Events.css';

export default function Events() {
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (selectedEvent) {
    const event = EVENTS.find(e => e.id === selectedEvent);
    const eventLeads = LEADS.filter(l =>
      l.tags.some(t => t.includes(event.name.split(' ').slice(0, 3).join(' '))) ||
      l.sourceDetail?.includes(event.name.split(' ').slice(0, 3).join(' '))
    );

    return (
      <div className="events-page animate-in">
        <button className="lead-detail-back" onClick={() => setSelectedEvent(null)}>
          <ArrowLeft size={16} /> Back to Events
        </button>

        <div className="event-detail-modal">
          <div className="event-detail-header">
            <div>
              <span className={`badge ${event.status === 'Active' ? 'badge-success' : event.status === 'Upcoming' ? 'badge-warning' : 'badge-neutral'}`}>{event.status}</span>
              <h2 style={{ margin: '8px 0 4px', fontFamily: 'var(--font-heading)' }}>{event.name}</h2>
              <div className="event-card-detail"><Calendar size={14} />{event.date} — {event.endDate}</div>
              <div className="event-card-detail"><MapPin size={14} />{event.location}</div>
              <p style={{ marginTop: 12, fontSize: '14px', color: 'var(--neutral-500)', lineHeight: 1.6 }}>{event.description}</p>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <span className="badge badge-primary">Code: {event.campaignCode}</span>
                <span className="badge badge-info">{event.type}</span>
                <span className="badge badge-neutral">Top: {event.topProduct}</span>
              </div>
            </div>
            <div className="event-detail-qr">
              <QrCode />
              <span>Scan QR</span>
            </div>
          </div>

          <div className="event-card-stats" style={{ maxWidth: 400 }}>
            <div className="event-stat">
              <div className="event-stat-value">{event.leadsCapured}</div>
              <div className="event-stat-label">Leads Captured</div>
            </div>
            <div className="event-stat">
              <div className="event-stat-value">{event.qualified}</div>
              <div className="event-stat-label">Qualified</div>
            </div>
            <div className="event-stat">
              <div className="event-stat-value">{event.demosBooked}</div>
              <div className="event-stat-label">Demos Booked</div>
            </div>
          </div>
        </div>

        {/* Event Leads Table */}
        <div className="inbox-table-wrap" style={{ boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ padding: '16px 20px', borderBottom: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--tertiary-dark)', fontFamily: 'var(--font-heading)' }}>
              Event Leads ({eventLeads.length})
            </h3>
          </div>
          <table className="inbox-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Product</th>
                <th>Score</th>
                <th>Status</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {eventLeads.length > 0 ? eventLeads.map(lead => (
                <tr key={lead.id}>
                  <td>
                    <div className="lead-name-cell">
                      <div className="avatar" style={{ background: `hsl(${lead.name.charCodeAt(0) * 7 % 360}, 55%, 50%)` }}>
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="lead-name-text">{lead.name}</div>
                        <div className="lead-company-text">{lead.title}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#64748B' }}>{lead.company}</td>
                  <td><span className="badge badge-primary">{lead.product}</span></td>
                  <td><span className={`badge badge-${lead.band.toLowerCase()}`}>{lead.score}</span></td>
                  <td><span className="badge badge-neutral">{lead.status}</span></td>
                  <td style={{ color: '#64748B', fontSize: '13px' }}>{lead.assignedName}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8', padding: 32 }}>No leads captured for this event yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="events-page animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 className="page-title">Events & Campaigns</h2>
          <p className="page-subtitle">Track leads captured from trade shows, webinars, and campaigns</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> Create Event</button>
      </div>

      <div className="events-grid stagger">
        {EVENTS.map(event => (
          <div key={event.id} className="event-card" onClick={() => setSelectedEvent(event.id)}>
            <div className={`event-card-banner ${event.status === 'Completed' ? 'completed' : ''} ${event.status === 'Upcoming' ? 'upcoming' : ''}`} />
            <div className="event-card-body">
              <div className="event-card-status" style={{
                color: event.status === 'Active' ? 'var(--primary)' :
                  event.status === 'Upcoming' ? 'var(--warning)' : 'var(--neutral-400)'
              }}>
                {event.status === 'Active' ? '● Live Now' : event.status === 'Upcoming' ? '○ Upcoming' : '✓ Completed'}
              </div>
              <div className="event-card-name">{event.name}</div>
              <div className="event-card-detail"><Calendar size={14} />{event.date}</div>
              <div className="event-card-detail"><MapPin size={14} />{event.location}</div>
              <div className="event-card-stats">
                <div className="event-stat">
                  <div className="event-stat-value">{event.leadsCapured}</div>
                  <div className="event-stat-label">Leads</div>
                </div>
                <div className="event-stat">
                  <div className="event-stat-value">{event.qualified}</div>
                  <div className="event-stat-label">Qualified</div>
                </div>
                <div className="event-stat">
                  <div className="event-stat-value">{event.demosBooked}</div>
                  <div className="event-stat-label">Demos</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
