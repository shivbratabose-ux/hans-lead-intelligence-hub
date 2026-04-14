// Enrichment Workflows — Mock Data

export const WORKFLOW_TEMPLATES = [
  {
    id: 'WF001',
    name: 'Email Waterfall',
    description: 'Find verified email using cascading sources: Apollo → Hunter.io → ContactOut → ZeroBounce verify',
    icon: '📧',
    category: 'Enrichment',
    nodes: [
      { id: 'N1', type: 'apollo', label: 'Apollo Lookup', x: 80, status: 'success', result: '78% found' },
      { id: 'N2', type: 'hunter', label: 'Hunter.io', x: 280, status: 'success', result: '12% found (fallback)' },
      { id: 'N3', type: 'contactout', label: 'ContactOut', x: 480, status: 'success', result: '5% found (fallback)' },
      { id: 'N4', type: 'verify', label: 'ZeroBounce Verify', x: 680, status: 'success', result: '92% verified' },
    ],
    executions: 34,
    successRate: 95,
    avgTime: '12s',
  },
  {
    id: 'WF002',
    name: 'Full Lead Enrichment',
    description: 'Complete enrichment: LinkedIn scrape + Apollo data + Web scrape + AI analysis + Email verify + CRM push',
    icon: '🔄',
    category: 'Full Pipeline',
    nodes: [
      { id: 'N1', type: 'linkedin', label: 'LinkedIn Scrape', x: 80, status: 'success', result: '100% scraped' },
      { id: 'N2', type: 'apollo', label: 'Apollo Enrich', x: 230, status: 'success', result: 'Email + Phone found' },
      { id: 'N3', type: 'webscrape', label: 'Web Scrape', x: 380, status: 'success', result: 'Intent signals found' },
      { id: 'N4', type: 'ai', label: 'AI Analyze', x: 530, status: 'success', result: 'Pain points + Icebreaker' },
      { id: 'N5', type: 'verify', label: 'Email Verify', x: 680, status: 'success', result: 'Valid ✓' },
      { id: 'N6', type: 'crm', label: 'Push to CRM', x: 830, status: 'success', result: 'Sent to HubSpot' },
    ],
    executions: 12,
    successRate: 88,
    avgTime: '45s',
  },
  {
    id: 'WF003',
    name: 'Intent Signal Scan',
    description: 'Scrape company websites for buying signals: hiring, funding, tech changes, partnerships',
    icon: '🎯',
    category: 'Intelligence',
    nodes: [
      { id: 'N1', type: 'webscrape', label: 'Scrape Website', x: 80, status: 'success', result: 'Pages crawled' },
      { id: 'N2', type: 'webscrape', label: 'Scrape News', x: 280, status: 'success', result: 'Press releases found' },
      { id: 'N3', type: 'ai', label: 'AI: Detect Signals', x: 480, status: 'success', result: '3 signals detected' },
      { id: 'N4', type: 'ai', label: 'AI: Score Intent', x: 680, status: 'success', result: 'High intent scored' },
    ],
    executions: 28,
    successRate: 92,
    avgTime: '25s',
  },
  {
    id: 'WF004',
    name: 'Outreach Ready Pipeline',
    description: 'Full enrichment + AI icebreaker generation + push to cold outreach tool',
    icon: '🚀',
    category: 'Outreach',
    nodes: [
      { id: 'N1', type: 'apollo', label: 'Apollo Search', x: 80, status: 'success', result: '50 contacts' },
      { id: 'N2', type: 'linkedin', label: 'LinkedIn Enrich', x: 230, status: 'success', result: 'Bios + posts' },
      { id: 'N3', type: 'verify', label: 'Email Verify', x: 380, status: 'success', result: '45 verified' },
      { id: 'N4', type: 'ai', label: 'Generate Icebreaker', x: 530, status: 'success', result: '45 personalized' },
      { id: 'N5', type: 'outreach', label: 'Push to Instantly', x: 680, status: 'success', result: '45 leads sent' },
    ],
    executions: 8,
    successRate: 90,
    avgTime: '60s',
  },
];

export const NODE_TYPES = [
  { type: 'apollo', label: 'Apollo Lookup', icon: '🚀', color: '#6366F1', category: 'Source' },
  { type: 'cognism', label: 'Cognism Search', icon: '🧠', color: '#EC4899', category: 'Source' },
  { type: 'linkedin', label: 'LinkedIn Scrape', icon: '💼', color: '#0A66C2', category: 'Source' },
  { type: 'webscrape', label: 'Web Scrape', icon: '🌐', color: '#10B981', category: 'Source' },
  { type: 'hunter', label: 'Hunter.io', icon: '📧', color: '#F97316', category: 'Email' },
  { type: 'contactout', label: 'ContactOut', icon: '📬', color: '#8B5CF6', category: 'Email' },
  { type: 'verify', label: 'Email Verify', icon: '✅', color: '#22C55E', category: 'Verify' },
  { type: 'ai', label: 'AI Analyze', icon: '🤖', color: '#F59E0B', category: 'AI' },
  { type: 'crm', label: 'CRM Push', icon: '📤', color: '#3B82F6', category: 'Export' },
  { type: 'outreach', label: 'Outreach Push', icon: '📨', color: '#EF4444', category: 'Export' },
];

export const EXECUTION_HISTORY = [
  { id: 'EX001', workflow: 'Email Waterfall', started: '2026-04-13T14:30:00Z', duration: '11s', inputLeads: 25, outputLeads: 24, status: 'success' },
  { id: 'EX002', workflow: 'Full Lead Enrichment', started: '2026-04-13T12:00:00Z', duration: '42s', inputLeads: 10, outputLeads: 9, status: 'success' },
  { id: 'EX003', workflow: 'Intent Signal Scan', started: '2026-04-13T10:15:00Z', duration: '28s', inputLeads: 15, outputLeads: 15, status: 'success' },
  { id: 'EX004', workflow: 'Email Waterfall', started: '2026-04-12T16:00:00Z', duration: '14s', inputLeads: 30, outputLeads: 28, status: 'success' },
  { id: 'EX005', workflow: 'Outreach Ready Pipeline', started: '2026-04-12T09:00:00Z', duration: '58s', inputLeads: 50, outputLeads: 45, status: 'partial' },
];
