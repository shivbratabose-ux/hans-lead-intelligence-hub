// Hans Lead Intelligence Hub — Scoring & Routing Rules Data

export const SCORING_CRITERIA = [
  { id: 'industry', label: 'Industry Match', description: 'Core sectors: Cargo, Airlines, Customs, Airports', maxPoints: 20, currentWeight: 20 },
  { id: 'companySize', label: 'Company Size', description: '>500 = +10, 100-500 = +5, <100 = 0', maxPoints: 10, currentWeight: 10 },
  { id: 'role', label: 'Job Role / Seniority', description: 'C-level/VP = +15, Manager = +10, Staff = +5', maxPoints: 15, currentWeight: 15 },
  { id: 'engagement', label: 'Engagement Level', description: 'Form complete, answered all Qs, high responsiveness', maxPoints: 10, currentWeight: 10 },
  { id: 'behavior', label: 'Website Behavior', description: 'Visited pricing (+5), downloaded guide (+10)', maxPoints: 10, currentWeight: 10 },
  { id: 'event', label: 'Event Attendance', description: 'Scanned QR or registered at booth', maxPoints: 20, currentWeight: 20 },
  { id: 'demo', label: 'Demo Requested', description: 'In conversation, user asked for demo', maxPoints: 25, currentWeight: 25 },
  { id: 'budget', label: 'Budget Indicated', description: 'Budget confirmed from chat or field', maxPoints: 10, currentWeight: 10 },
  { id: 'timeline', label: 'Timeline / Urgency', description: 'Immediate = +10, 1-3 months = +5', maxPoints: 10, currentWeight: 10 },
  { id: 'negative', label: 'Negative Signals', description: 'Ghosted (-20), Unsubscribed (-30)', maxPoints: 0, currentWeight: -30 },
];

export const SCORE_THRESHOLDS = {
  hot: 70,
  warm: 30,
  cold: 0,
};

export const ROUTING_RULES = [
  {
    id: 'R001',
    name: 'India Freight → Priya',
    conditions: [
      { field: 'product', operator: 'equals', value: 'iCAFFE' },
      { field: 'location', operator: 'contains', value: 'India' },
    ],
    action: 'assign',
    assignTo: 'U001',
    assignName: 'Priya Mehta',
    priority: 1,
    active: true,
  },
  {
    id: 'R002',
    name: 'APAC/ME Airports → Amit',
    conditions: [
      { field: 'product', operator: 'in', value: ['WiseCCS', 'WiseDOX'] },
      { field: 'location', operator: 'in', value: ['UAE', 'Singapore', 'Saudi Arabia', 'Oman'] },
    ],
    action: 'assign',
    assignTo: 'U002',
    assignName: 'Amit Desai',
    priority: 2,
    active: true,
  },
  {
    id: 'R003',
    name: 'GSA/Airlines → Kavita',
    conditions: [
      { field: 'product', operator: 'equals', value: 'WiseGSA' },
    ],
    action: 'assign',
    assignTo: 'U003',
    assignName: 'Kavita Singh',
    priority: 3,
    active: true,
  },
  {
    id: 'R004',
    name: 'Enterprise (5000+) → Manager Review',
    conditions: [
      { field: 'companySize', operator: 'equals', value: '5000+' },
      { field: 'score', operator: 'gte', value: 80 },
    ],
    action: 'flag',
    assignTo: 'U004',
    assignName: 'Rajiv Khanna (Manager Review)',
    priority: 0,
    active: true,
  },
  {
    id: 'R005',
    name: 'AMS Product → Kavita',
    conditions: [
      { field: 'product', operator: 'equals', value: 'AMS' },
    ],
    action: 'assign',
    assignTo: 'U003',
    assignName: 'Kavita Singh',
    priority: 4,
    active: true,
  },
];

export const INTEGRATIONS = [
  { id: 'I001', name: 'CRM (Salesforce)', type: 'CRM', status: 'connected', lastSync: '2 min ago', icon: 'database' },
  { id: 'I002', name: 'Email (SendGrid)', type: 'Email', status: 'connected', lastSync: '5 min ago', icon: 'mail' },
  { id: 'I003', name: 'WhatsApp (Twilio)', type: 'Messaging', status: 'connected', lastSync: '1 min ago', icon: 'message-circle' },
  { id: 'I004', name: 'Calendar (Google)', type: 'Calendar', status: 'disconnected', lastSync: 'Never', icon: 'calendar' },
  { id: 'I005', name: 'Clearbit (Enrichment)', type: 'Enrichment', status: 'connected', lastSync: '10 min ago', icon: 'search' },
  { id: 'I006', name: 'LinkedIn Ads', type: 'Ads', status: 'connected', lastSync: '15 min ago', icon: 'link' },
];

export const AUDIT_LOG = [
  { id: 'A001', action: 'Lead Status Changed', detail: 'L001 → Qualified', user: 'Priya Mehta', timestamp: '2026-04-13T14:20:00Z' },
  { id: 'A002', action: 'Lead Assigned', detail: 'L004 → Kavita Singh', user: 'System (Auto-Route)', timestamp: '2026-04-13T14:01:00Z' },
  { id: 'A003', action: 'Scoring Rule Updated', detail: 'Demo Requested weight: 20 → 25', user: 'Admin User', timestamp: '2026-04-13T12:00:00Z' },
  { id: 'A004', action: 'CRM Sync', detail: 'L029 pushed to Salesforce', user: 'System', timestamp: '2026-04-13T11:30:00Z' },
  { id: 'A005', action: 'Lead Created', detail: 'L030 imported from webinar', user: 'Sunita Rao', timestamp: '2026-04-13T19:00:00Z' },
  { id: 'A006', action: 'Lead Disqualified', detail: 'L028 — Wrong product fit', user: 'System (AI)', timestamp: '2026-04-12T16:10:00Z' },
  { id: 'A007', action: 'Routing Rule Added', detail: 'R005 — AMS → Kavita', user: 'Admin User', timestamp: '2026-04-12T10:00:00Z' },
  { id: 'A008', action: 'Event Created', detail: 'E006 — Customs Automation Webinar', user: 'Sunita Rao', timestamp: '2026-04-11T09:00:00Z' },
  { id: 'A009', action: 'Integration Connected', detail: 'LinkedIn Ads integration active', user: 'Admin User', timestamp: '2026-04-10T15:00:00Z' },
  { id: 'A010', action: 'Lead Score Updated', detail: 'L002 score: 78 → 88 (demo scheduled)', user: 'System', timestamp: '2026-04-12T09:20:00Z' },
];
