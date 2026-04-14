// AI Enrichment Lab — Mock Data

export const PAIN_POINTS = [
  { id: 'PP001', lead: 'Rahul Kapoor', company: 'Maersk India', title: 'VP Logistics',
    painPoints: [
      { category: 'Manual Customs Filing', confidence: 94, detail: 'Recent LinkedIn post mentions "reducing clearance times" and company is hiring Customs Automation Engineers' },
      { category: 'Legacy System Migration', confidence: 87, detail: 'Blog post about migrating from legacy customs system, RFP for cloud-native platform detected' },
      { category: 'Multi-Port Coordination', confidence: 72, detail: 'Manages 12 ports — complexity of coordinating across locations a clear pain' },
    ],
    product: 'iCAFFE',
  },
  { id: 'PP002', lead: 'Smita Deshpande', company: 'All Cargo Logistics', title: 'CTO',
    painPoints: [
      { category: 'ERP Replacement', confidence: 96, detail: 'RFP published for new freight management system to replace legacy ERP — highest intent signal' },
      { category: 'Document Digitization', confidence: 82, detail: 'LinkedIn mentions "paperwork reduction" and "digital transformation" — WiseDOX alignment' },
      { category: 'Route Optimization', confidence: 68, detail: 'Bio mentions AI/ML for route optimization as focus area' },
    ],
    product: 'iCAFFE + WiseDOX',
  },
  { id: 'PP003', lead: 'Arjun Mehta', company: 'DP World India', title: 'Head of Digital',
    painPoints: [
      { category: 'Cargo Community Integration', confidence: 91, detail: 'LinkedIn posts about connecting airlines, forwarders, customs — exact WiseCCS use case' },
      { category: 'Trade Document Blockchain', confidence: 78, detail: 'Currently piloting blockchain for docs — may want comprehensive CCS alongside' },
      { category: 'Real-time Tracking', confidence: 85, detail: 'Mentions IoT and AI-powered container tracking as priority' },
    ],
    product: 'WiseCCS',
  },
  { id: 'PP004', lead: 'Fatimah Al-Harbi', company: 'Saudi Ports Authority', title: 'IT Manager',
    painPoints: [
      { category: 'Port Digitization', confidence: 88, detail: 'Government modernization drive for Saudi ports aligns with WiseCCS capabilities' },
      { category: 'Regulatory Compliance', confidence: 75, detail: 'New Saudi customs regulations require automated manifest filing' },
    ],
    product: 'WiseCCS + AMS',
  },
  { id: 'PP005', lead: 'Naveen Reddy', company: 'Gati-KWE', title: 'GM Operations',
    painPoints: [
      { category: 'Customs Automation', confidence: 80, detail: 'Express logistics company expanding international operations — needs customs filing' },
      { category: 'Document Management', confidence: 65, detail: 'Growing volume of shipping documents with expansion' },
    ],
    product: 'iCAFFE',
  },
];

export const ICEBREAKERS = [
  {
    lead: 'Rahul Kapoor',
    company: 'Maersk India',
    source: 'LinkedIn Post',
    sourceText: 'Excited to announce that Maersk India is implementing a new customs automation system across all Indian ports. This will reduce clearance times by 40%!',
    icebreaker: 'Saw your post about Maersk\'s customs automation rollout across Indian ports — iCAFFE has helped forwarders cut ICEGATE filing time by 60%. Would love to share how.',
    alternatives: [
      'Congrats on the customs automation initiative! We\'ve powered similar transformations for 200+ forwarding companies — happy to compare approaches.',
      'Your 40% clearance improvement goal is ambitious — our iCAFFE clients typically see 55-65%. Worth a quick benchmarking call?',
    ],
    score: 92,
  },
  {
    lead: 'Smita Deshpande',
    company: 'All Cargo Logistics',
    source: 'LinkedIn Post',
    sourceText: 'Just wrapped up an amazing session at TechSparks on "AI in Freight Management". The future of logistics is autonomous, connected, and intelligent.',
    icebreaker: 'Loved your TechSparks talk on AI in freight management — we\'re actually embedding GPT-4 into customs workflows at iCAFFE. Would your team be open to a tech preview?',
    alternatives: [
      'Your vision of "autonomous, connected, intelligent" logistics is exactly what iCAFFE delivers — interested in a demo showing AI-powered customs filing?',
      'Saw you\'re hiring a Head of Customs Technology — we might be able to help solve that challenge with technology instead.',
    ],
    score: 88,
  },
  {
    lead: 'Arjun Mehta',
    company: 'DP World India',
    source: 'LinkedIn Post',
    sourceText: 'Thrilled to share: DP World India just launched our blockchain-based trade documentation pilot at JNPT.',
    icebreaker: 'Congrats on the JNPT blockchain pilot! WiseCCS integrates beautifully alongside blockchain doc systems — providing the cargo community layer. Quick demo?',
    alternatives: [
      'Your blockchain docs pilot is cutting-edge — we see many ports pairing it with a cargo community system for full visibility. Could WiseCCS complement your stack?',
    ],
    score: 85,
  },
  {
    lead: 'Fatimah Al-Harbi',
    company: 'Saudi Ports Authority',
    source: 'Company News',
    sourceText: 'Saudi Ports Authority announces Vision 2030 digital transformation program for maritime sector.',
    icebreaker: 'With SPA\'s Vision 2030 digital program, WiseCCS could be the backbone for connecting your ports digitally — we\'ve deployed at 15+ airports and ports globally.',
    alternatives: [
      'Saw the Vision 2030 announcement — we specialize in port community systems and have implementations running in UAE, India, and SE Asia.',
    ],
    score: 78,
  },
  {
    lead: 'Naveen Reddy',
    company: 'Gati-KWE',
    source: 'Company News',
    sourceText: 'Gati-KWE expands international express services to 5 new countries in Southeast Asia.',
    icebreaker: 'As Gati-KWE expands into 5 new SE Asian markets, customs compliance complexity grows fast — iCAFFE handles multi-country filing out of the box.',
    alternatives: [
      'International expansion = customs headaches. iCAFFE supports ICEGATE + multi-country manifests — could save your ops team significant time.',
    ],
    score: 74,
  },
];

export const INTENT_SIGNALS = [
  {
    company: 'Maersk India',
    overallIntent: 'Very High',
    score: 95,
    signals: [
      { type: 'Hiring', icon: '👥', text: '12 new tech roles: "Customs Automation Engineer", "Data Platform Lead"', strength: 'Strong', date: 'Apr 10' },
      { type: 'Tech Change', icon: '🔧', text: 'Blog: Migrating from legacy customs system to cloud-native', strength: 'Strong', date: 'Apr 8' },
      { type: 'Expansion', icon: '📍', text: 'New inland container depot in Pune', strength: 'Moderate', date: 'Mar 28' },
      { type: 'Content', icon: '📝', text: 'VP posted about customs automation initiative', strength: 'Strong', date: 'Apr 11' },
    ],
  },
  {
    company: 'DP World India',
    overallIntent: 'High',
    score: 82,
    signals: [
      { type: 'Funding', icon: '💰', text: '$1.2B investment in Indian port infrastructure', strength: 'Strong', date: 'Apr 5' },
      { type: 'Hiring', icon: '👥', text: '8 roles for "Digital Innovation Center" including AI/ML', strength: 'Moderate', date: 'Apr 2' },
      { type: 'Partnership', icon: '🤝', text: 'MoU with Indian Railways for multimodal connectivity', strength: 'Moderate', date: 'Mar 20' },
    ],
  },
  {
    company: 'All Cargo Logistics',
    overallIntent: 'Very High',
    score: 98,
    signals: [
      { type: 'RFP', icon: '📋', text: 'Published RFP for new freight management system (replace legacy ERP)', strength: 'Strong', date: 'Apr 12' },
      { type: 'Hiring', icon: '👥', text: 'Hiring "Head of Customs Technology"', strength: 'Strong', date: 'Apr 8' },
    ],
  },
  {
    company: 'Saudi Ports Authority',
    overallIntent: 'High',
    score: 78,
    signals: [
      { type: 'Government', icon: '🏛️', text: 'Vision 2030 digital transformation for maritime sector', strength: 'Strong', date: 'Mar 15' },
      { type: 'Budget', icon: '💰', text: 'Digital infrastructure budget allocation for FY2027', strength: 'Moderate', date: 'Mar 10' },
    ],
  },
  {
    company: 'Gati-KWE',
    overallIntent: 'Moderate',
    score: 62,
    signals: [
      { type: 'Expansion', icon: '📍', text: 'Expanding to 5 new SE Asian countries', strength: 'Moderate', date: 'Apr 1' },
      { type: 'Hiring', icon: '👥', text: '3 new compliance roles posted', strength: 'Weak', date: 'Mar 25' },
    ],
  },
];

export const TECH_STACKS = [
  { company: 'Maersk India', stack: ['SAP ERP', 'Salesforce CRM', 'AWS', 'Oracle DB', 'Kubernetes', 'Tableau'], opportunity: 'Legacy customs system replacement — iCAFFE cloud migration' },
  { company: 'DP World India', stack: ['Microsoft Azure', 'Dynamics 365', 'IoT Hub', 'Power BI', 'Custom TOS'], opportunity: 'No community system detected — WiseCCS greenfield opportunity' },
  { company: 'All Cargo Logistics', stack: ['SAP (legacy)', 'Custom In-house', 'MySQL', 'On-premise servers'], opportunity: 'Outdated stack — full digital transformation with iCAFFE + WiseDOX' },
  { company: 'Saudi Ports Authority', stack: ['Oracle EBS', 'Custom VTMS', 'Linux servers'], opportunity: 'Government modernization — WiseCCS + AMS compliance suite' },
  { company: 'Gati-KWE', stack: ['Tally ERP', 'Custom logistics app', 'AWS'], opportunity: 'Basic setup — iCAFFE for customs as they go international' },
];
