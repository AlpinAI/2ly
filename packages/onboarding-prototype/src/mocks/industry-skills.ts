export type Industry =
  | 'manufacturing'
  | 'banking'
  | 'technology'
  | 'healthcare'
  | 'retail'
  | 'education'
  | 'finance'
  | 'logistics'
  | 'consulting'
  | 'media';

export interface TemplateSkill {
  id: string;
  name: string;
  description: string;
  category: string;
  taxonomy: {
    industry: string;
    department: string;
    role: string;
  };
}

export const INDUSTRIES: Record<Industry, string> = {
  manufacturing: 'Manufacturing',
  banking: 'Banking',
  technology: 'Technology',
  healthcare: 'Healthcare',
  retail: 'Retail',
  education: 'Education',
  finance: 'Finance',
  logistics: 'Logistics',
  consulting: 'Consulting',
  media: 'Media & Entertainment',
};

export const INDUSTRY_TEMPLATE_SKILLS: Record<Industry, TemplateSkill[]> = {
  manufacturing: [
    {
      id: 'mfg-1',
      name: 'Production Planning & Scheduling',
      description: 'Optimize production schedules and resource allocation',
      category: 'Operations',
      taxonomy: { industry: 'Manufacturing', department: 'Production', role: 'Production Planner' }
    },
    {
      id: 'mfg-2',
      name: 'Quality Control & Inspection',
      description: 'Automated defect detection and quality assurance',
      category: 'Quality',
      taxonomy: { industry: 'Manufacturing', department: 'Quality Assurance', role: 'Quality Inspector' }
    },
    {
      id: 'mfg-3',
      name: 'Supply Chain Management',
      description: 'Track inventory and manage supplier relationships',
      category: 'Supply Chain',
      taxonomy: { industry: 'Manufacturing', department: 'Supply Chain', role: 'Supply Chain Manager' }
    },
    {
      id: 'mfg-4',
      name: 'Predictive Maintenance',
      description: 'Monitor equipment health and predict failures',
      category: 'Maintenance',
      taxonomy: { industry: 'Manufacturing', department: 'Maintenance', role: 'Maintenance Engineer' }
    },
    {
      id: 'mfg-5',
      name: 'Process Optimization',
      description: 'Analyze and improve manufacturing workflows',
      category: 'Operations',
      taxonomy: { industry: 'Manufacturing', department: 'Continuous Improvement', role: 'Process Engineer' }
    },
  ],
  banking: [
    {
      id: 'bank-1',
      name: 'Fraud Detection & Prevention',
      description: 'Real-time transaction monitoring and anomaly detection',
      category: 'Risk',
      taxonomy: { industry: 'Banking', department: 'Risk Management', role: 'Fraud Analyst' }
    },
    {
      id: 'bank-2',
      name: 'Customer Onboarding & KYC',
      description: 'Automated identity verification and compliance checks',
      category: 'Compliance',
      taxonomy: { industry: 'Banking', department: 'Compliance', role: 'Compliance Officer' }
    },
    {
      id: 'bank-3',
      name: 'Debt Capacity Analysis',
      description: 'Evaluate creditworthiness and loan applications',
      category: 'Risk',
      taxonomy: { industry: 'Banking', department: 'Credit Risk', role: 'Risk Officer' }
    },
    {
      id: 'bank-4',
      name: 'Transaction Processing',
      description: 'Automate payment processing and reconciliation',
      category: 'Operations',
      taxonomy: { industry: 'Banking', department: 'Operations', role: 'Operations Specialist' }
    },
    {
      id: 'bank-5',
      name: 'Customer Support Automation',
      description: 'AI-powered chatbots for account inquiries',
      category: 'Customer Service',
      taxonomy: { industry: 'Banking', department: 'Customer Service', role: 'Support Agent' }
    },
  ],
  technology: [
    {
      id: 'tech-1',
      name: 'Code Review & Analysis',
      description: 'Automated code quality checks and security scans',
      category: 'Development',
      taxonomy: { industry: 'Technology', department: 'Engineering', role: 'Software Engineer' }
    },
    {
      id: 'tech-2',
      name: 'DevOps & CI/CD Pipeline',
      description: 'Continuous integration and deployment automation',
      category: 'DevOps',
      taxonomy: { industry: 'Technology', department: 'Platform Engineering', role: 'DevOps Engineer' }
    },
    {
      id: 'tech-3',
      name: 'Bug Tracking & Resolution',
      description: 'Intelligent issue triage and assignment',
      category: 'Support',
      taxonomy: { industry: 'Technology', department: 'Product Engineering', role: 'Technical Support' }
    },
    {
      id: 'tech-4',
      name: 'Documentation Generation',
      description: 'Auto-generate API docs and user guides',
      category: 'Documentation',
      taxonomy: { industry: 'Technology', department: 'Documentation', role: 'Technical Writer' }
    },
    {
      id: 'tech-5',
      name: 'Performance Monitoring',
      description: 'Track system metrics and application health',
      category: 'Operations',
      taxonomy: { industry: 'Technology', department: 'Site Reliability', role: 'SRE Engineer' }
    },
  ],
  healthcare: [
    {
      id: 'health-1',
      name: 'Patient Records Management',
      description: 'Secure access and management of medical records',
      category: 'Administration',
      taxonomy: { industry: 'Healthcare', department: 'Health Information', role: 'Medical Records Specialist' }
    },
    {
      id: 'health-2',
      name: 'Appointment Scheduling',
      description: 'Optimize patient appointments and resource allocation',
      category: 'Operations',
      taxonomy: { industry: 'Healthcare', department: 'Patient Services', role: 'Scheduling Coordinator' }
    },
    {
      id: 'health-3',
      name: 'Diagnostic Assistance',
      description: 'AI-assisted medical image analysis and diagnosis',
      category: 'Clinical',
      taxonomy: { industry: 'Healthcare', department: 'Radiology', role: 'Radiologist' }
    },
    {
      id: 'health-4',
      name: 'Prescription Management',
      description: 'Automated prescription validation and drug interactions',
      category: 'Pharmacy',
      taxonomy: { industry: 'Healthcare', department: 'Pharmacy', role: 'Pharmacist' }
    },
    {
      id: 'health-5',
      name: 'Insurance Claims Processing',
      description: 'Streamline claims submission and verification',
      category: 'Billing',
      taxonomy: { industry: 'Healthcare', department: 'Revenue Cycle', role: 'Billing Specialist' }
    },
  ],
  retail: [
    {
      id: 'retail-1',
      name: 'Inventory Management',
      description: 'Track stock levels and automate reordering',
      category: 'Supply Chain',
      taxonomy: { industry: 'Retail', department: 'Supply Chain', role: 'Inventory Manager' }
    },
    {
      id: 'retail-2',
      name: 'Customer Behavior Analysis',
      description: 'Analyze shopping patterns and preferences',
      category: 'Analytics',
      taxonomy: { industry: 'Retail', department: 'Data Analytics', role: 'Data Analyst' }
    },
    {
      id: 'retail-3',
      name: 'Dynamic Pricing',
      description: 'Optimize pricing based on demand and competition',
      category: 'Pricing',
      taxonomy: { industry: 'Retail', department: 'Pricing Strategy', role: 'Pricing Analyst' }
    },
    {
      id: 'retail-4',
      name: 'Personalized Recommendations',
      description: 'Product recommendations based on customer data',
      category: 'Marketing',
      taxonomy: { industry: 'Retail', department: 'Marketing', role: 'Marketing Specialist' }
    },
    {
      id: 'retail-5',
      name: 'Order Fulfillment',
      description: 'Automate picking, packing, and shipping',
      category: 'Operations',
      taxonomy: { industry: 'Retail', department: 'Fulfillment', role: 'Fulfillment Manager' }
    },
  ],
  education: [
    {
      id: 'edu-1',
      name: 'Student Enrollment & Registration',
      description: 'Streamline admissions and course registration',
      category: 'Administration',
      taxonomy: { industry: 'Education', department: 'Student Services', role: 'Registrar' }
    },
    {
      id: 'edu-2',
      name: 'Learning Path Personalization',
      description: 'Adaptive learning based on student performance',
      category: 'Learning',
      taxonomy: { industry: 'Education', department: 'Instructional Design', role: 'Instructional Designer' }
    },
    {
      id: 'edu-3',
      name: 'Grading & Assessment',
      description: 'Automated grading and feedback generation',
      category: 'Assessment',
      taxonomy: { industry: 'Education', department: 'Academic Affairs', role: 'Faculty' }
    },
    {
      id: 'edu-4',
      name: 'Content Recommendation',
      description: 'Suggest relevant courses and materials',
      category: 'Content',
      taxonomy: { industry: 'Education', department: 'Curriculum Development', role: 'Curriculum Developer' }
    },
    {
      id: 'edu-5',
      name: 'Student Support Services',
      description: 'AI tutoring and academic assistance',
      category: 'Support',
      taxonomy: { industry: 'Education', department: 'Academic Support', role: 'Academic Advisor' }
    },
  ],
  finance: [
    {
      id: 'fin-1',
      name: 'Portfolio Management',
      description: 'Optimize investment portfolios and asset allocation',
      category: 'Investment',
      taxonomy: { industry: 'Finance', department: 'Investment Management', role: 'Portfolio Manager' }
    },
    {
      id: 'fin-2',
      name: 'Market Analysis & Trading',
      description: 'Real-time market data analysis and trade execution',
      category: 'Trading',
      taxonomy: { industry: 'Finance', department: 'Trading', role: 'Trader' }
    },
    {
      id: 'fin-3',
      name: 'Regulatory Compliance',
      description: 'Automated compliance reporting and monitoring',
      category: 'Compliance',
      taxonomy: { industry: 'Finance', department: 'Compliance', role: 'Compliance Officer' }
    },
    {
      id: 'fin-4',
      name: 'Financial Forecasting',
      description: 'Predict revenue and expense trends',
      category: 'Planning',
      taxonomy: { industry: 'Finance', department: 'Financial Planning', role: 'Financial Analyst' }
    },
    {
      id: 'fin-5',
      name: 'Risk Management',
      description: 'Identify and mitigate financial risks',
      category: 'Risk',
      taxonomy: { industry: 'Finance', department: 'Risk Management', role: 'Risk Analyst' }
    },
  ],
  logistics: [
    {
      id: 'log-1',
      name: 'Route Optimization',
      description: 'Calculate optimal delivery routes and schedules',
      category: 'Transportation',
      taxonomy: { industry: 'Logistics', department: 'Transportation', role: 'Fleet Manager' }
    },
    {
      id: 'log-2',
      name: 'Warehouse Management',
      description: 'Track inventory location and movement',
      category: 'Warehousing',
      taxonomy: { industry: 'Logistics', department: 'Warehouse Operations', role: 'Warehouse Manager' }
    },
    {
      id: 'log-3',
      name: 'Shipment Tracking',
      description: 'Real-time tracking and delivery updates',
      category: 'Tracking',
      taxonomy: { industry: 'Logistics', department: 'Operations', role: 'Operations Coordinator' }
    },
    {
      id: 'log-4',
      name: 'Demand Forecasting',
      description: 'Predict shipping volume and capacity needs',
      category: 'Planning',
      taxonomy: { industry: 'Logistics', department: 'Supply Chain Planning', role: 'Demand Planner' }
    },
    {
      id: 'log-5',
      name: 'Carrier Selection',
      description: 'Match shipments with optimal carriers',
      category: 'Transportation',
      taxonomy: { industry: 'Logistics', department: 'Procurement', role: 'Carrier Manager' }
    },
  ],
  consulting: [
    {
      id: 'cons-1',
      name: 'Client Engagement Management',
      description: 'Track projects, deliverables, and milestones',
      category: 'Project Management',
      taxonomy: { industry: 'Consulting', department: 'Project Management', role: 'Project Manager' }
    },
    {
      id: 'cons-2',
      name: 'Market Research & Analysis',
      description: 'Gather and analyze industry data and trends',
      category: 'Research',
      taxonomy: { industry: 'Consulting', department: 'Research & Insights', role: 'Research Analyst' }
    },
    {
      id: 'cons-3',
      name: 'Report Generation',
      description: 'Automated insights and recommendation reports',
      category: 'Reporting',
      taxonomy: { industry: 'Consulting', department: 'Strategy', role: 'Strategy Consultant' }
    },
    {
      id: 'cons-4',
      name: 'Resource Allocation',
      description: 'Match consultants to client engagements',
      category: 'Operations',
      taxonomy: { industry: 'Consulting', department: 'Resource Management', role: 'Resource Manager' }
    },
    {
      id: 'cons-5',
      name: 'Knowledge Management',
      description: 'Organize and share best practices and case studies',
      category: 'Knowledge',
      taxonomy: { industry: 'Consulting', department: 'Knowledge Management', role: 'Knowledge Manager' }
    },
  ],
  media: [
    {
      id: 'media-1',
      name: 'Content Creation & Editing',
      description: 'AI-assisted video and audio production',
      category: 'Production',
      taxonomy: { industry: 'Media & Entertainment', department: 'Content Production', role: 'Content Producer' }
    },
    {
      id: 'media-2',
      name: 'Content Distribution',
      description: 'Multi-channel publishing and syndication',
      category: 'Distribution',
      taxonomy: { industry: 'Media & Entertainment', department: 'Distribution', role: 'Distribution Manager' }
    },
    {
      id: 'media-3',
      name: 'Audience Analytics',
      description: 'Track engagement and viewer behavior',
      category: 'Analytics',
      taxonomy: { industry: 'Media & Entertainment', department: 'Audience Insights', role: 'Data Analyst' }
    },
    {
      id: 'media-4',
      name: 'Content Moderation',
      description: 'Automated content review and compliance',
      category: 'Compliance',
      taxonomy: { industry: 'Media & Entertainment', department: 'Content Operations', role: 'Content Moderator' }
    },
    {
      id: 'media-5',
      name: 'Monetization & Ad Management',
      description: 'Optimize ad placement and revenue',
      category: 'Revenue',
      taxonomy: { industry: 'Media & Entertainment', department: 'Ad Operations', role: 'Ad Operations Manager' }
    },
  ],
};
