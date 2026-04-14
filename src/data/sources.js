// Data Sources Hub — Mock Data

export const DATA_SOURCES = [
  {
    id: 'DS001',
    name: 'Apollo.io',
    type: 'Database',
    icon: '🚀',
    color: '#6366F1',
    status: 'connected',
    apiKeySet: true,
    recordsPulled: 1247,
    lastSync: '12 min ago',
    dailyCredits: { used: 342, total: 1000 },
    description: 'B2B contact database with 275M+ contacts. Search by title, company, industry, and technology.',
    capabilities: ['Contact Search', 'Company Search', 'Email Finder', 'Phone Finder', 'Tech Stack'],
  },
  {
    id: 'DS002',
    name: 'Cognism',
    type: 'Database',
    icon: '🧠',
    color: '#EC4899',
    status: 'connected',
    apiKeySet: true,
    recordsPulled: 856,
    lastSync: '1 hr ago',
    dailyCredits: { used: 178, total: 500 },
    description: 'GDPR-compliant B2B data provider. Premium phone-verified mobile numbers and emails for EU markets.',
    capabilities: ['Contact Search', 'Phone Verified Data', 'GDPR Compliant', 'Intent Data'],
  },
  {
    id: 'DS003',
    name: 'LinkedIn Scraper',
    type: 'Scraper',
    icon: '💼',
    color: '#0A66C2',
    status: 'connected',
    apiKeySet: true,
    recordsPulled: 2341,
    lastSync: '5 min ago',
    dailyCredits: { used: 89, total: 200 },
    description: 'Real-time LinkedIn profile scraping via Proxycurl API. Pull bios, recent posts, job changes, and company data.',
    capabilities: ['Profile Scrape', 'Recent Posts', 'Job Changes', 'Company Pages', 'Employee Lists'],
  },
  {
    id: 'DS004',
    name: 'Web Scraper',
    type: 'Scraper',
    icon: '🌐',
    color: '#10B981',
    status: 'connected',
    apiKeySet: true,
    recordsPulled: 567,
    lastSync: '30 min ago',
    dailyCredits: { used: 45, total: 500 },
    description: 'AI-powered web crawler. Scrapes company About pages, news sections, careers pages for intent signals.',
    capabilities: ['About Page', 'News & Press', 'Careers/Hiring', 'Tech Stack Detection', 'Funding News'],
  },
];

export const ENRICHMENT_SOURCES = [
  { id: 'ES001', name: 'Hunter.io', icon: '📧', type: 'Email Finder', status: 'connected', credits: '450/1000' },
  { id: 'ES002', name: 'ContactOut', icon: '📬', type: 'Email + Phone', status: 'connected', credits: '120/300' },
  { id: 'ES003', name: 'ZeroBounce', icon: '✅', type: 'Email Verify', status: 'connected', credits: '890/2000' },
  { id: 'ES004', name: 'Debounce', icon: '🛡️', type: 'Email Verify', status: 'disconnected', credits: '0/500' },
  { id: 'ES005', name: 'Clearbit', icon: '🔍', type: 'Enrichment', status: 'connected', credits: '234/500' },
  { id: 'ES006', name: 'BuiltWith', icon: '🔧', type: 'Tech Stack', status: 'connected', credits: '67/200' },
];

export const APOLLO_RESULTS = [
  { name: 'Rahul Kapoor', title: 'VP Logistics', company: 'Maersk India', email: 'r.kapoor@maersk.com', phone: '+91 98765 43210', linkedin: 'linkedin.com/in/rahulkapoor', location: 'Mumbai', employees: '5000+', industry: 'Shipping', verified: true },
  { name: 'Smita Deshpande', title: 'CTO', company: 'All Cargo Logistics', email: 'smita.d@allcargo.com', phone: '+91 98234 56789', linkedin: 'linkedin.com/in/smitad', location: 'Mumbai', employees: '1000+', industry: 'Freight Forwarding', verified: true },
  { name: 'Arjun Mehta', title: 'Head of Digital', company: 'DP World India', email: 'a.mehta@dpworld.com', phone: '+91 88765 43210', linkedin: 'linkedin.com/in/arjunm', location: 'Delhi', employees: '5000+', industry: 'Port Operations', verified: true },
  { name: 'Sandra Chen', title: 'Director IT', company: 'PSA International', email: 's.chen@globalpsa.com', phone: '+65 9123 4567', linkedin: 'linkedin.com/in/sandrachen', location: 'Singapore', employees: '5000+', industry: 'Port Operations', verified: false },
  { name: 'Naveen Reddy', title: 'GM Operations', company: 'Gati-KWE', email: 'naveen.r@gatikwe.com', phone: '+91 97654 32100', linkedin: 'linkedin.com/in/naveenreddy', location: 'Hyderabad', employees: '500-1000', industry: 'Express Logistics', verified: true },
  { name: 'Fatimah Al-Harbi', title: 'IT Manager', company: 'Saudi Ports Authority', email: 'f.alharbi@spa.gov.sa', phone: '+966 50 123 4567', linkedin: 'linkedin.com/in/fatimahh', location: 'Riyadh', employees: '1000+', industry: 'Port Authority', verified: true },
  { name: 'Tomoko Hayashi', title: 'VP Cargo', company: 'ANA Cargo', email: 't.hayashi@anacargo.jp', phone: '+81 3 6735 1234', linkedin: 'linkedin.com/in/tomokoh', location: 'Tokyo', employees: '5000+', industry: 'Airlines/Cargo', verified: false },
  { name: 'Pradeep Sharma', title: 'CFO', company: 'Jet Freight Logistics', email: 'pradeep.s@jetfreight.com', phone: '+91 22 6788 9900', linkedin: 'linkedin.com/in/pradeeps', location: 'Mumbai', employees: '100-500', industry: 'Freight Forwarding', verified: true },
];

export const LINKEDIN_PROFILES = [
  {
    name: 'Rahul Kapoor',
    headline: 'VP Logistics at Maersk India | Supply Chain Transformation | 15+ years in Shipping',
    bio: 'Passionate about digitizing logistics operations across South Asia. Currently leading Maersk India\'s digital transformation initiative covering 12 ports and 30+ inland depots. Former McKinsey consultant.',
    company: 'Maersk India',
    location: 'Mumbai, India',
    connections: '12K+',
    recentPost: 'Excited to announce that Maersk India is implementing a new customs automation system across all Indian ports. This will reduce clearance times by 40%! #logistics #customs #digitalization',
    postDate: '2 days ago',
    skills: ['Supply Chain Management', 'Freight Forwarding', 'Customs Compliance', 'Digital Transformation'],
    experience: [
      { title: 'VP Logistics', company: 'Maersk India', duration: '3 years' },
      { title: 'Director Operations', company: 'DHL India', duration: '5 years' },
    ],
  },
  {
    name: 'Smita Deshpande',
    headline: 'CTO at All Cargo Logistics | Tech-led Logistics | Cloud & AI',
    bio: 'Building the technology backbone for India\'s largest integrated logistics company. Focus areas: cloud migration, AI/ML for route optimization, cargo tracking IoT. Previously at TCS and Infosys.',
    company: 'All Cargo Logistics',
    location: 'Mumbai, India',
    connections: '8K+',
    recentPost: 'Just wrapped up an amazing session at TechSparks on "AI in Freight Management". The future of logistics is autonomous, connected, and intelligent. Who\'s ready? 🚀 #AI #logistics #tech',
    postDate: '5 days ago',
    skills: ['Cloud Architecture', 'AI/ML', 'Logistics Tech', 'Digital Strategy'],
    experience: [
      { title: 'CTO', company: 'All Cargo Logistics', duration: '2 years' },
      { title: 'VP Engineering', company: 'TCS', duration: '7 years' },
    ],
  },
  {
    name: 'Arjun Mehta',
    headline: 'Head of Digital at DP World India | Port Automation | Smart Ports',
    bio: 'Leading digital innovation at DP World\'s Indian operations. Implementing smart port solutions across Nhava Sheva, Mundra, and Chennai. Focus on IoT, blockchain for trade docs, and AI-powered container tracking.',
    company: 'DP World India',
    location: 'Delhi, India',
    connections: '6K+',
    recentPost: 'Thrilled to share: DP World India just launched our blockchain-based trade documentation pilot at JNPT. Cutting paperwork processing time from 3 days to 3 hours! 📦⛓️ #blockchain #smartports',
    postDate: '1 week ago',
    skills: ['Port Operations', 'IoT', 'Blockchain', 'Smart Infrastructure'],
    experience: [
      { title: 'Head of Digital', company: 'DP World India', duration: '4 years' },
      { title: 'Digital Lead', company: 'Adani Ports', duration: '3 years' },
    ],
  },
];

export const WEB_SCRAPE_RESULTS = [
  {
    company: 'Maersk India',
    url: 'maersk.com',
    scrapedAt: '2026-04-13T10:00:00Z',
    aboutText: 'Maersk is an integrated logistics company working to connect and simplify global trade. Operating in 130 countries with 100,000 employees.',
    intentSignals: [
      { type: 'Hiring', signal: 'Posted 12 new tech roles including "Customs Automation Engineer" and "Data Platform Lead"', strength: 'Strong', date: 'Apr 10' },
      { type: 'Tech Change', signal: 'Blog post about migrating from legacy customs system to cloud-native platform', strength: 'Strong', date: 'Apr 8' },
      { type: 'Expansion', signal: 'Announced new inland container depot in Pune', strength: 'Moderate', date: 'Mar 28' },
    ],
    techStack: ['SAP ERP', 'Salesforce CRM', 'AWS', 'Oracle DB', 'Kubernetes'],
    newsItems: [
      { title: 'Maersk India launches customs automation initiative', date: 'Apr 10', url: '#' },
      { title: 'New ICD facility opened in Pune', date: 'Mar 28', url: '#' },
    ],
  },
  {
    company: 'DP World India',
    url: 'dpworld.com',
    scrapedAt: '2026-04-13T09:30:00Z',
    aboutText: 'DP World operates multiple marine and inland terminals across India. Focus on port automation and smart logistics.',
    intentSignals: [
      { type: 'Funding', signal: 'Parent company announced $1.2B investment in Indian port infrastructure', strength: 'Strong', date: 'Apr 5' },
      { type: 'Hiring', signal: '8 new positions for "Digital Innovation Center" including AI/ML roles', strength: 'Moderate', date: 'Apr 2' },
      { type: 'Partnership', signal: 'MoU signed with Indian Railways for multimodal connectivity', strength: 'Moderate', date: 'Mar 20' },
    ],
    techStack: ['Microsoft Azure', 'Dynamics 365', 'IoT Hub', 'Power BI', 'Custom TOS'],
    newsItems: [
      { title: 'DP World invests $1.2B in India expansion', date: 'Apr 5', url: '#' },
      { title: 'Blockchain pilot launched at JNPT', date: 'Mar 15', url: '#' },
    ],
  },
  {
    company: 'All Cargo Logistics',
    url: 'allcargologistics.com',
    scrapedAt: '2026-04-13T09:00:00Z',
    aboutText: 'Allcargo Logistics is India\'s largest integrated logistics company offering multimodal solutions.',
    intentSignals: [
      { type: 'Tech Change', signal: 'RFP published for new freight management system to replace legacy ERP', strength: 'Strong', date: 'Apr 12' },
      { type: 'Hiring', signal: 'Hiring "Head of Customs Technology" — indicates customs tech investment', strength: 'Strong', date: 'Apr 8' },
    ],
    techStack: ['SAP', 'Custom In-house', 'MySQL', 'On-premise servers'],
    newsItems: [
      { title: 'Allcargo publishes RFP for freight management system', date: 'Apr 12', url: '#' },
    ],
  },
];

export const IMPORT_QUEUE = [
  { id: 'IQ001', source: 'Apollo.io', query: 'VP Logistics, India, Freight', records: 47, status: 'completed', progress: 100, startedAt: '10 min ago' },
  { id: 'IQ002', source: 'LinkedIn', query: 'Profile batch (12 URLs)', records: 12, status: 'running', progress: 67, startedAt: '2 min ago' },
  { id: 'IQ003', source: 'Web Scraper', query: 'maersk.com, dpworld.com', records: 2, status: 'completed', progress: 100, startedAt: '15 min ago' },
  { id: 'IQ004', source: 'Cognism', query: 'CTO, Airlines/Cargo, APAC', records: 23, status: 'queued', progress: 0, startedAt: 'pending' },
];
