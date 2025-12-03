import type { Capability } from './types';
import { INDUSTRY_TEMPLATE_SKILLS } from './industry-skills';

// Helper to generate tools for each skill
const generateTools = (skillId: string, count: number = 4) => {
  const toolCategories: Array<'input' | 'processing' | 'output'> = ['input', 'processing', 'output', 'output'];
  return Array.from({ length: count }, (_, i) => ({
    id: `${skillId}-tool-${i + 1}`,
    name: `${skillId.replace('skill-', '')}_action_${i + 1}`,
    description: `Tool ${i + 1} for ${skillId}`,
    mcpServerName: `${skillId.replace('skill-', '')}-server`,
    category: toolCategories[i % toolCategories.length],
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  }));
};

// Helper to find taxonomy for a capability ID
const getTaxonomy = (capabilityId: string) => {
  for (const skills of Object.values(INDUSTRY_TEMPLATE_SKILLS)) {
    const skill = skills.find(s => s.id === capabilityId);
    if (skill?.taxonomy) {
      return skill.taxonomy;
    }
  }
  return undefined;
};

const rawCapabilities: Capability[] = [
  // MANUFACTURING (5 skills)
  {
    id: 'mfg-1',
    name: 'Production Planning & Scheduling',
    description: 'Optimize production schedules and resource allocation across your manufacturing operations.',
    icon: 'CheckSquare',
    exampleActions: [
      'Create production schedule for next week',
      'Optimize resource allocation for Assembly Line 3',
      'Check capacity for urgent order #4521',
      'Adjust schedule for equipment maintenance',
    ],
    agentPrompt: 'Your agent learns to plan and optimize production schedules.',
    skill: {
      id: 'skill-mfg-production',
      name: 'Production Planning',
      description: 'AI-powered production scheduling and resource optimization',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Production capacity data, workforce schedules, and manufacturing constraints',
        sources: [
          {
            type: 'rag',
            name: 'Manufacturing Best Practices',
            description: 'Lean manufacturing, JIT principles, capacity planning methodologies',
          },
          {
            type: 'files',
            name: 'Production Templates',
            description: 'Schedule templates, resource allocation rules, shift patterns',
          },
        ],
      },
      instructions: {
        scope: 'Use for production planning, resource allocation, and schedule optimization. Applies to manufacturing lines, workforce planning, and capacity management.',
        guardrails: [
          'Never schedule beyond available capacity',
          'Always account for maintenance windows',
          'Respect worker shift limitations and labor rules',
          'Confirm major schedule changes with supervisors',
        ],
      },
      tools: generateTools('skill-mfg-production'),
      exampleTasks: [
        'Create production schedule for next week',
        'Optimize resource allocation for Assembly Line 3',
        'Check capacity for urgent order #4521',
        'Adjust schedule for equipment maintenance',
      ],
    },
    toolsetPreset: {
      id: 'toolset-mfg-production',
      name: 'Production Planning Tools',
      description: 'Tools for scheduling, capacity planning, and resource optimization',
      mcpTools: generateTools('skill-mfg-production'),
    },
  },
  {
    id: 'mfg-2',
    name: 'Quality Control & Inspection',
    description: 'Automated defect detection and quality assurance across manufacturing processes.',
    icon: 'CheckSquare',
    exampleActions: [
      'Run quality inspection on Batch #8842',
      'Analyze defect patterns from last week',
      'Create quality report for customer audit',
      'Flag non-conforming units for review',
    ],
    agentPrompt: 'Your agent learns quality control processes and defect analysis.',
    skill: {
      id: 'skill-mfg-quality',
      name: 'Quality Control',
      description: 'Automated quality inspection and defect management',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Quality standards, inspection protocols, and defect classification',
        sources: [
          {
            type: 'rag',
            name: 'Quality Standards',
            description: 'ISO standards, Six Sigma methodologies, inspection criteria',
          },
          {
            type: 'files',
            name: 'Inspection Checklists',
            description: 'Product specs, tolerance limits, defect categories',
          },
        ],
      },
      instructions: {
        scope: 'Use for quality inspections, defect tracking, and compliance reporting. Applies to product testing, batch analysis, and quality audits.',
        guardrails: [
          'Never override critical quality failures',
          'Always document inspection results',
          'Escalate safety-related defects immediately',
          'Follow established quality protocols',
        ],
      },
      tools: generateTools('skill-mfg-quality'),
      exampleTasks: [
        'Run quality inspection on Batch #8842',
        'Analyze defect patterns from last week',
        'Create quality report for customer audit',
        'Flag non-conforming units for review',
      ],
    },
    toolsetPreset: {
      id: 'toolset-mfg-quality',
      name: 'Quality Control Tools',
      description: 'Tools for inspections, defect tracking, and quality reporting',
      mcpTools: generateTools('skill-mfg-quality'),
    },
  },
  {
    id: 'mfg-3',
    name: 'Supply Chain Management',
    description: 'Track inventory levels and manage supplier relationships efficiently.',
    icon: 'CheckSquare',
    exampleActions: [
      'Check inventory for Part #SKU-4429',
      'Create purchase order for Supplier X',
      'Analyze supplier performance last quarter',
      'Alert when stock falls below reorder point',
    ],
    agentPrompt: 'Your agent learns supply chain coordination and inventory management.',
    skill: {
      id: 'skill-mfg-supply',
      name: 'Supply Chain Management',
      description: 'Inventory tracking and supplier relationship management',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Inventory data, supplier catalogs, and procurement policies',
        sources: [
          {
            type: 'rag',
            name: 'Supply Chain Best Practices',
            description: 'JIT inventory, supplier management, procurement strategies',
          },
          {
            type: 'files',
            name: 'Supplier Database',
            description: 'Vendor contacts, lead times, pricing agreements, part catalogs',
          },
        ],
      },
      instructions: {
        scope: 'Use for inventory management, supplier coordination, and procurement. Applies to stock tracking, order management, and vendor relations.',
        guardrails: [
          'Verify stock levels before creating orders',
          'Follow approved vendor list and contracts',
          'Respect budget limits for purchases',
          'Confirm large orders with purchasing manager',
        ],
      },
      tools: generateTools('skill-mfg-supply'),
      exampleTasks: [
        'Check inventory for Part #SKU-4429',
        'Create purchase order for Supplier X',
        'Analyze supplier performance last quarter',
        'Alert when stock falls below reorder point',
      ],
    },
    toolsetPreset: {
      id: 'toolset-mfg-supply',
      name: 'Supply Chain Tools',
      description: 'Tools for inventory tracking, ordering, and supplier management',
      mcpTools: generateTools('skill-mfg-supply'),
    },
  },
  {
    id: 'mfg-4',
    name: 'Predictive Maintenance',
    description: 'Monitor equipment health and predict failures before they occur.',
    icon: 'CheckSquare',
    exampleActions: [
      'Check health status of CNC Machine #12',
      'Predict next maintenance date for conveyor belt',
      'Analyze vibration data from press equipment',
      'Schedule preventive maintenance for at-risk assets',
    ],
    agentPrompt: 'Your agent learns predictive maintenance and equipment monitoring.',
    skill: {
      id: 'skill-mfg-maintenance',
      name: 'Predictive Maintenance',
      description: 'AI-powered equipment monitoring and failure prediction',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Equipment sensor data, maintenance histories, and failure patterns',
        sources: [
          {
            type: 'rag',
            name: 'Maintenance Knowledge Base',
            description: 'Equipment manuals, failure modes, maintenance procedures',
          },
          {
            type: 'files',
            name: 'Equipment Data',
            description: 'Sensor logs, maintenance schedules, spare parts inventory',
          },
        ],
      },
      instructions: {
        scope: 'Use for equipment monitoring, failure prediction, and maintenance scheduling. Applies to machinery health, downtime prevention, and asset management.',
        guardrails: [
          'Never delay critical safety-related maintenance',
          'Verify predictions with sensor data',
          'Coordinate maintenance with production schedules',
          'Alert supervisors for high-risk predictions',
        ],
      },
      tools: generateTools('skill-mfg-maintenance'),
      exampleTasks: [
        'Check health status of CNC Machine #12',
        'Predict next maintenance date for conveyor belt',
        'Analyze vibration data from press equipment',
        'Schedule preventive maintenance for at-risk assets',
      ],
    },
    toolsetPreset: {
      id: 'toolset-mfg-maintenance',
      name: 'Predictive Maintenance Tools',
      description: 'Tools for equipment monitoring, failure prediction, and scheduling',
      mcpTools: generateTools('skill-mfg-maintenance'),
    },
  },
  {
    id: 'mfg-5',
    name: 'Process Optimization',
    description: 'Analyze and improve manufacturing workflows for efficiency.',
    icon: 'CheckSquare',
    exampleActions: [
      'Analyze bottlenecks in Assembly Line 2',
      'Recommend efficiency improvements for packaging',
      'Calculate cycle time for Product X',
      'Generate process improvement report',
    ],
    agentPrompt: 'Your agent learns process analysis and workflow optimization.',
    skill: {
      id: 'skill-mfg-optimization',
      name: 'Process Optimization',
      description: 'Manufacturing workflow analysis and improvement',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Process data, efficiency metrics, and improvement methodologies',
        sources: [
          {
            type: 'rag',
            name: 'Process Engineering',
            description: 'Lean manufacturing, Six Sigma, process mapping techniques',
          },
          {
            type: 'files',
            name: 'Process Documentation',
            description: 'Workflow diagrams, cycle times, efficiency benchmarks',
          },
        ],
      },
      instructions: {
        scope: 'Use for process analysis, bottleneck identification, and efficiency improvements. Applies to workflow optimization, cycle time reduction, and continuous improvement.',
        guardrails: [
          'Base recommendations on actual data',
          'Consider safety implications of changes',
          'Test improvements in pilot before scaling',
          'Involve operators in process changes',
        ],
      },
      tools: generateTools('skill-mfg-optimization'),
      exampleTasks: [
        'Analyze bottlenecks in Assembly Line 2',
        'Recommend efficiency improvements for packaging',
        'Calculate cycle time for Product X',
        'Generate process improvement report',
      ],
    },
    toolsetPreset: {
      id: 'toolset-mfg-optimization',
      name: 'Process Optimization Tools',
      description: 'Tools for workflow analysis, bottleneck detection, and improvement',
      mcpTools: generateTools('skill-mfg-optimization'),
    },
  },

  // BANKING (5 skills)
  {
    id: 'bank-1',
    name: 'Fraud Detection & Prevention',
    description: 'Real-time transaction monitoring and anomaly detection to prevent fraud.',
    icon: 'CheckSquare',
    exampleActions: [
      'Flag suspicious transaction on Account #9987',
      'Analyze pattern in recent card transactions',
      'Generate fraud risk report for this month',
      'Review flagged transactions from last 24 hours',
    ],
    agentPrompt: 'Your agent learns fraud patterns and risk detection.',
    skill: {
      id: 'skill-bank-fraud',
      name: 'Fraud Detection',
      description: 'AI-powered fraud monitoring and prevention',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Transaction patterns, fraud indicators, and risk models',
        sources: [
          {
            type: 'rag',
            name: 'Fraud Detection Methods',
            description: 'AML regulations, fraud typologies, risk assessment frameworks',
          },
          {
            type: 'files',
            name: 'Risk Rules',
            description: 'Transaction thresholds, suspicious patterns, blocklist data',
          },
        ],
      },
      instructions: {
        scope: 'Use for transaction monitoring, fraud detection, and risk assessment. Applies to card transactions, wire transfers, and account activity.',
        guardrails: [
          'Immediately escalate high-risk transactions',
          'Follow regulatory reporting requirements',
          'Protect customer privacy in investigations',
          'Document all fraud decisions with reasoning',
        ],
      },
      tools: generateTools('skill-bank-fraud'),
      exampleTasks: [
        'Flag suspicious transaction on Account #9987',
        'Analyze pattern in recent card transactions',
        'Generate fraud risk report for this month',
        'Review flagged transactions from last 24 hours',
      ],
    },
    toolsetPreset: {
      id: 'toolset-bank-fraud',
      name: 'Fraud Detection Tools',
      description: 'Tools for transaction monitoring, risk scoring, and alerting',
      mcpTools: generateTools('skill-bank-fraud'),
    },
  },
  {
    id: 'bank-2',
    name: 'Customer Onboarding & KYC',
    description: 'Automated identity verification and compliance checks for new customers.',
    icon: 'CheckSquare',
    exampleActions: [
      'Verify identity documents for new customer',
      'Run KYC checks on business account application',
      'Generate compliance report for Account #4521',
      'Check sanctions list for customer name',
    ],
    agentPrompt: 'Your agent learns identity verification and compliance procedures.',
    skill: {
      id: 'skill-bank-kyc',
      name: 'Customer Onboarding',
      description: 'Automated KYC and identity verification',
      icon: 'CheckSquare',
      knowledge: {
        description: 'KYC regulations, identity verification methods, and compliance standards',
        sources: [
          {
            type: 'rag',
            name: 'Compliance Regulations',
            description: 'KYC/AML laws, identity verification standards, regulatory requirements',
          },
          {
            type: 'files',
            name: 'Verification Procedures',
            description: 'Document checklists, risk criteria, sanctions lists',
          },
        ],
      },
      instructions: {
        scope: 'Use for customer onboarding, identity verification, and KYC compliance. Applies to new accounts, document verification, and regulatory checks.',
        guardrails: [
          'Strictly follow KYC/AML regulations',
          'Escalate high-risk customers to compliance',
          'Verify all identity documents thoroughly',
          'Maintain audit trail of all checks',
        ],
      },
      tools: generateTools('skill-bank-kyc'),
      exampleTasks: [
        'Verify identity documents for new customer',
        'Run KYC checks on business account application',
        'Generate compliance report for Account #4521',
        'Check sanctions list for customer name',
      ],
    },
    toolsetPreset: {
      id: 'toolset-bank-kyc',
      name: 'KYC Tools',
      description: 'Tools for identity verification, compliance checks, and documentation',
      mcpTools: generateTools('skill-bank-kyc'),
    },
  },
  {
    id: 'bank-3',
    name: 'Credit Risk Assessment',
    description: 'Evaluate creditworthiness and loan applications using AI analysis.',
    icon: 'CheckSquare',
    exampleActions: [
      'Assess credit risk for loan application #7721',
      'Calculate debt-to-income ratio for applicant',
      'Review credit history for Account #5542',
      'Generate credit risk report with recommendations',
    ],
    agentPrompt: 'Your agent learns credit analysis and risk assessment.',
    skill: {
      id: 'skill-bank-credit',
      name: 'Credit Risk Assessment',
      description: 'AI-powered creditworthiness evaluation',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Credit scoring models, financial data, and lending criteria',
        sources: [
          {
            type: 'rag',
            name: 'Credit Risk Models',
            description: 'Underwriting standards, credit scoring methodologies, risk frameworks',
          },
          {
            type: 'files',
            name: 'Lending Policies',
            description: 'Approval criteria, risk thresholds, loan product rules',
          },
        ],
      },
      instructions: {
        scope: 'Use for loan evaluation, credit analysis, and risk assessment. Applies to personal loans, mortgages, and credit applications.',
        guardrails: [
          'Follow fair lending practices and regulations',
          'Base decisions on objective credit criteria',
          'Escalate borderline cases to underwriters',
          'Document reasoning for all credit decisions',
        ],
      },
      tools: generateTools('skill-bank-credit'),
      exampleTasks: [
        'Assess credit risk for loan application #7721',
        'Calculate debt-to-income ratio for applicant',
        'Review credit history for Account #5542',
        'Generate credit risk report with recommendations',
      ],
    },
    toolsetPreset: {
      id: 'toolset-bank-credit',
      name: 'Credit Assessment Tools',
      description: 'Tools for credit scoring, risk evaluation, and loan analysis',
      mcpTools: generateTools('skill-bank-credit'),
    },
  },
  {
    id: 'bank-4',
    name: 'Transaction Processing',
    description: 'Automate payment processing and reconciliation across accounts.',
    icon: 'CheckSquare',
    exampleActions: [
      'Process wire transfer to Account #8821',
      'Reconcile transactions for end-of-day',
      'Verify ACH batch for processing',
      'Generate transaction report for audit',
    ],
    agentPrompt: 'Your agent learns payment processing and reconciliation.',
    skill: {
      id: 'skill-bank-transactions',
      name: 'Transaction Processing',
      description: 'Automated payment and reconciliation system',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Payment systems, transaction protocols, and reconciliation rules',
        sources: [
          {
            type: 'rag',
            name: 'Payment Systems',
            description: 'ACH, wire transfer protocols, payment network rules',
          },
          {
            type: 'files',
            name: 'Processing Rules',
            description: 'Transaction limits, validation rules, reconciliation procedures',
          },
        ],
      },
      instructions: {
        scope: 'Use for payment processing, transaction reconciliation, and account management. Applies to wire transfers, ACH, card payments.',
        guardrails: [
          'Verify account details before processing',
          'Follow transaction limits and controls',
          'Maintain audit trail for all transactions',
          'Escalate failed transactions immediately',
        ],
      },
      tools: generateTools('skill-bank-transactions'),
      exampleTasks: [
        'Process wire transfer to Account #8821',
        'Reconcile transactions for end-of-day',
        'Verify ACH batch for processing',
        'Generate transaction report for audit',
      ],
    },
    toolsetPreset: {
      id: 'toolset-bank-transactions',
      name: 'Transaction Tools',
      description: 'Tools for payment processing, reconciliation, and reporting',
      mcpTools: generateTools('skill-bank-transactions'),
    },
  },
  {
    id: 'bank-5',
    name: 'Customer Support Automation',
    description: 'AI-powered chatbot for account inquiries and customer service.',
    icon: 'MessageCircle',
    exampleActions: [
      'Answer balance inquiry for customer',
      'Explain recent transaction on account',
      'Help customer reset online banking password',
      'Provide branch location and hours',
    ],
    agentPrompt: 'Your agent learns customer service and account assistance.',
    skill: {
      id: 'skill-bank-support',
      name: 'Customer Support',
      description: 'Automated customer service and inquiry handling',
      icon: 'MessageCircle',
      knowledge: {
        description: 'Banking products, procedures, and customer service protocols',
        sources: [
          {
            type: 'rag',
            name: 'Product Knowledge',
            description: 'Account types, services, fees, policies, FAQs',
          },
          {
            type: 'files',
            name: 'Support Scripts',
            description: 'Response templates, escalation procedures, service standards',
          },
        ],
      },
      instructions: {
        scope: 'Use for customer inquiries, account questions, and service requests. Applies to balance checks, transaction explanations, general banking info.',
        guardrails: [
          'Never share sensitive account data without verification',
          'Escalate complex issues to human agents',
          'Follow security protocols for authentication',
          'Be clear about AI vs human assistance',
        ],
      },
      tools: generateTools('skill-bank-support'),
      exampleTasks: [
        'Answer balance inquiry for customer',
        'Explain recent transaction on account',
        'Help customer reset online banking password',
        'Provide branch location and hours',
      ],
    },
    toolsetPreset: {
      id: 'toolset-bank-support',
      name: 'Customer Support Tools',
      description: 'Tools for inquiries, account access, and service requests',
      mcpTools: generateTools('skill-bank-support'),
    },
  },

  // TECHNOLOGY (5 skills)
  {
    id: 'tech-1',
    name: 'Code Review & Analysis',
    description: 'Automated code quality checks and security scans for your codebase.',
    icon: 'CheckSquare',
    exampleActions: [
      'Review pull request #445 for code quality',
      'Scan codebase for security vulnerabilities',
      'Check coding standards in new feature branch',
      'Analyze code complexity in authentication module',
    ],
    agentPrompt: 'Your agent learns code review and quality analysis.',
    skill: {
      id: 'skill-tech-code',
      name: 'Code Review',
      description: 'Automated code quality and security analysis',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Coding standards, security best practices, and code patterns',
        sources: [
          {
            type: 'rag',
            name: 'Code Standards',
            description: 'Style guides, security patterns, best practices, OWASP guidelines',
          },
          {
            type: 'files',
            name: 'Team Conventions',
            description: 'Project-specific standards, linting rules, review checklists',
          },
        ],
      },
      instructions: {
        scope: 'Use for code reviews, security scans, and quality analysis. Applies to pull requests, commits, and codebase audits.',
        guardrails: [
          'Flag critical security issues immediately',
          'Provide constructive feedback with examples',
          'Respect team coding conventions',
          'Escalate architectural concerns to senior devs',
        ],
      },
      tools: generateTools('skill-tech-code'),
      exampleTasks: [
        'Review pull request #445 for code quality',
        'Scan codebase for security vulnerabilities',
        'Check coding standards in new feature branch',
        'Analyze code complexity in authentication module',
      ],
    },
    toolsetPreset: {
      id: 'toolset-tech-code',
      name: 'Code Review Tools',
      description: 'Tools for code analysis, security scanning, and quality checks',
      mcpTools: generateTools('skill-tech-code'),
    },
  },
  {
    id: 'tech-2',
    name: 'DevOps & CI/CD Pipeline',
    description: 'Continuous integration and deployment automation for your projects.',
    icon: 'CheckSquare',
    exampleActions: [
      'Deploy feature branch to staging environment',
      'Run CI pipeline for pull request #332',
      'Rollback production deployment to previous version',
      'Check build status for main branch',
    ],
    agentPrompt: 'Your agent learns CI/CD and deployment automation.',
    skill: {
      id: 'skill-tech-devops',
      name: 'DevOps Automation',
      description: 'CI/CD pipeline management and deployment',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Deployment processes, infrastructure, and pipeline configurations',
        sources: [
          {
            type: 'rag',
            name: 'DevOps Practices',
            description: 'CI/CD patterns, infrastructure as code, deployment strategies',
          },
          {
            type: 'files',
            name: 'Pipeline Configs',
            description: 'Build scripts, deployment procedures, environment configs',
          },
        ],
      },
      instructions: {
        scope: 'Use for deployments, pipeline management, and CI/CD automation. Applies to builds, tests, staging, and production releases.',
        guardrails: [
          'Never deploy to production without approval',
          'Run all tests before deployment',
          'Maintain rollback capability for all releases',
          'Document deployment changes and versions',
        ],
      },
      tools: generateTools('skill-tech-devops'),
      exampleTasks: [
        'Deploy feature branch to staging environment',
        'Run CI pipeline for pull request #332',
        'Rollback production deployment to previous version',
        'Check build status for main branch',
      ],
    },
    toolsetPreset: {
      id: 'toolset-tech-devops',
      name: 'DevOps Tools',
      description: 'Tools for CI/CD, deployments, and pipeline management',
      mcpTools: generateTools('skill-tech-devops'),
    },
  },
  {
    id: 'tech-3',
    name: 'Bug Tracking & Resolution',
    description: 'Intelligent issue triage and assignment for efficient bug management.',
    icon: 'CheckSquare',
    exampleActions: [
      'Triage new bug report #1834',
      'Assign critical bug to appropriate developer',
      'Find similar past issues for Bug #1901',
      'Generate bug resolution summary for sprint',
    ],
    agentPrompt: 'Your agent learns bug triage and issue management.',
    skill: {
      id: 'skill-tech-bugs',
      name: 'Bug Tracking',
      description: 'Intelligent bug triage and issue management',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Issue patterns, team expertise, and bug resolution strategies',
        sources: [
          {
            type: 'rag',
            name: 'Bug Database',
            description: 'Historical issues, resolution patterns, common fixes',
          },
          {
            type: 'files',
            name: 'Team Skills',
            description: 'Developer expertise areas, component ownership, on-call schedules',
          },
        ],
      },
      instructions: {
        scope: 'Use for bug triage, assignment, and tracking. Applies to issue management, priority setting, and resolution workflow.',
        guardrails: [
          'Prioritize critical and security bugs immediately',
          'Assign based on component expertise',
          'Don\'t close issues without verification',
          'Escalate blocking issues to team leads',
        ],
      },
      tools: generateTools('skill-tech-bugs'),
      exampleTasks: [
        'Triage new bug report #1834',
        'Assign critical bug to appropriate developer',
        'Find similar past issues for Bug #1901',
        'Generate bug resolution summary for sprint',
      ],
    },
    toolsetPreset: {
      id: 'toolset-tech-bugs',
      name: 'Bug Tracking Tools',
      description: 'Tools for issue triage, assignment, and tracking',
      mcpTools: generateTools('skill-tech-bugs'),
    },
  },
  {
    id: 'tech-4',
    name: 'Documentation Generation',
    description: 'Auto-generate API docs and user guides from code.',
    icon: 'BookOpen',
    exampleActions: [
      'Generate API documentation for auth module',
      'Create user guide from feature specifications',
      'Update changelog for version 2.5.0',
      'Generate inline code documentation',
    ],
    agentPrompt: 'Your agent learns documentation generation and technical writing.',
    skill: {
      id: 'skill-tech-docs',
      name: 'Documentation Generator',
      description: 'Automated technical documentation creation',
      icon: 'BookOpen',
      knowledge: {
        description: 'Documentation standards, templates, and technical writing guidelines',
        sources: [
          {
            type: 'rag',
            name: 'Doc Standards',
            description: 'Documentation formats, API doc best practices, style guides',
          },
          {
            type: 'files',
            name: 'Doc Templates',
            description: 'README templates, API doc formats, changelog structures',
          },
        ],
      },
      instructions: {
        scope: 'Use for generating documentation from code, specs, or comments. Applies to API docs, user guides, and technical references.',
        guardrails: [
          'Verify accuracy of generated documentation',
          'Follow team documentation standards',
          'Include examples and usage patterns',
          'Keep docs synchronized with code changes',
        ],
      },
      tools: generateTools('skill-tech-docs'),
      exampleTasks: [
        'Generate API documentation for auth module',
        'Create user guide from feature specifications',
        'Update changelog for version 2.5.0',
        'Generate inline code documentation',
      ],
    },
    toolsetPreset: {
      id: 'toolset-tech-docs',
      name: 'Documentation Tools',
      description: 'Tools for doc generation, formatting, and publishing',
      mcpTools: generateTools('skill-tech-docs'),
    },
  },
  {
    id: 'tech-5',
    name: 'Performance Monitoring',
    description: 'Track system metrics and application health in real-time.',
    icon: 'CheckSquare',
    exampleActions: [
      'Check CPU usage on production servers',
      'Analyze API response times for last hour',
      'Alert when error rate exceeds threshold',
      'Generate performance report for last week',
    ],
    agentPrompt: 'Your agent learns system monitoring and performance analysis.',
    skill: {
      id: 'skill-tech-monitoring',
      name: 'Performance Monitoring',
      description: 'Real-time system and application monitoring',
      icon: 'CheckSquare',
      knowledge: {
        description: 'System metrics, performance baselines, and alert thresholds',
        sources: [
          {
            type: 'rag',
            name: 'Monitoring Best Practices',
            description: 'SRE principles, alerting strategies, performance optimization',
          },
          {
            type: 'files',
            name: 'System Baselines',
            description: 'Performance thresholds, alert configs, SLA definitions',
          },
        ],
      },
      instructions: {
        scope: 'Use for performance monitoring, alerting, and health checks. Applies to servers, applications, APIs, and infrastructure.',
        guardrails: [
          'Escalate critical performance degradation immediately',
          'Avoid alert fatigue with smart thresholds',
          'Correlate metrics for root cause analysis',
          'Document performance incidents thoroughly',
        ],
      },
      tools: generateTools('skill-tech-monitoring'),
      exampleTasks: [
        'Check CPU usage on production servers',
        'Analyze API response times for last hour',
        'Alert when error rate exceeds threshold',
        'Generate performance report for last week',
      ],
    },
    toolsetPreset: {
      id: 'toolset-tech-monitoring',
      name: 'Monitoring Tools',
      description: 'Tools for metrics collection, alerting, and analysis',
      mcpTools: generateTools('skill-tech-monitoring'),
    },
  },

  // HEALTHCARE (5 skills)
  {
    id: 'health-1',
    name: 'Patient Records Management',
    description: 'Secure access and management of electronic medical records.',
    icon: 'CheckSquare',
    exampleActions: [
      'Retrieve medical history for Patient #7821',
      'Update medication list for current patient',
      'Find lab results from last month',
      'Generate patient summary for specialist referral',
    ],
    agentPrompt: 'Your agent learns patient record access and medical data management.',
    skill: {
      id: 'skill-health-records',
      name: 'Patient Records',
      description: 'Electronic medical record management',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Medical terminology, record structure, and HIPAA requirements',
        sources: [
          {
            type: 'rag',
            name: 'Medical Knowledge',
            description: 'ICD codes, medical terminology, clinical protocols',
          },
          {
            type: 'files',
            name: 'EMR Procedures',
            description: 'Record access policies, documentation standards, templates',
          },
        ],
      },
      instructions: {
        scope: 'Use for patient record access, updates, and data retrieval. Applies to medical histories, test results, and clinical documentation.',
        guardrails: [
          'Strictly enforce HIPAA privacy rules',
          'Verify provider credentials before access',
          'Audit all record access',
          'Never share patient data without authorization',
        ],
      },
      tools: generateTools('skill-health-records'),
      exampleTasks: [
        'Retrieve medical history for Patient #7821',
        'Update medication list for current patient',
        'Find lab results from last month',
        'Generate patient summary for specialist referral',
      ],
    },
    toolsetPreset: {
      id: 'toolset-health-records',
      name: 'EMR Tools',
      description: 'Tools for record access, updates, and clinical documentation',
      mcpTools: generateTools('skill-health-records'),
    },
  },
  {
    id: 'health-2',
    name: 'Appointment Scheduling',
    description: 'Optimize patient appointments and resource allocation.',
    icon: 'CheckSquare',
    exampleActions: [
      'Schedule follow-up appointment for Patient #5521',
      'Find next available cardiology slot',
      'Reschedule cancelled appointments',
      'Check Dr. Smith\'s schedule for tomorrow',
    ],
    agentPrompt: 'Your agent learns appointment management and scheduling optimization.',
    skill: {
      id: 'skill-health-scheduling',
      name: 'Appointment Scheduling',
      description: 'Patient scheduling and resource management',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Provider schedules, appointment types, and facility resources',
        sources: [
          {
            type: 'rag',
            name: 'Scheduling Rules',
            description: 'Appointment durations, provider specialties, facility capacities',
          },
          {
            type: 'files',
            name: 'Provider Calendars',
            description: 'Availability, time-off schedules, room assignments',
          },
        ],
      },
      instructions: {
        scope: 'Use for appointment booking, rescheduling, and calendar management. Applies to patient visits, procedures, and consultations.',
        guardrails: [
          'Respect provider availability and time blocks',
          'Prioritize urgent appointments appropriately',
          'Confirm patient contact info before booking',
          'Send appointment reminders automatically',
        ],
      },
      tools: generateTools('skill-health-scheduling'),
      exampleTasks: [
        'Schedule follow-up appointment for Patient #5521',
        'Find next available cardiology slot',
        'Reschedule cancelled appointments',
        'Check Dr. Smith\'s schedule for tomorrow',
      ],
    },
    toolsetPreset: {
      id: 'toolset-health-scheduling',
      name: 'Scheduling Tools',
      description: 'Tools for appointments, calendar management, and resources',
      mcpTools: generateTools('skill-health-scheduling'),
    },
  },
  {
    id: 'health-3',
    name: 'Diagnostic Assistance',
    description: 'AI-assisted medical image analysis and clinical decision support.',
    icon: 'CheckSquare',
    exampleActions: [
      'Analyze chest X-ray for abnormalities',
      'Suggest differential diagnosis for symptoms',
      'Review lab values for critical results',
      'Generate clinical summary with recommendations',
    ],
    agentPrompt: 'Your agent learns diagnostic support and clinical analysis.',
    skill: {
      id: 'skill-health-diagnosis',
      name: 'Diagnostic Assistance',
      description: 'AI-powered clinical decision support',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Medical literature, diagnostic criteria, and clinical guidelines',
        sources: [
          {
            type: 'rag',
            name: 'Clinical Knowledge',
            description: 'Diagnostic algorithms, disease patterns, treatment guidelines',
          },
          {
            type: 'files',
            name: 'Reference Ranges',
            description: 'Lab normal values, imaging criteria, clinical protocols',
          },
        ],
      },
      instructions: {
        scope: 'Use for diagnostic support, image analysis, and clinical recommendations. Applies to imaging review, lab interpretation, and symptom assessment.',
        guardrails: [
          'Always defer final diagnosis to licensed clinicians',
          'Flag critical findings immediately',
          'Cite medical evidence for suggestions',
          'Clearly label AI-generated recommendations',
        ],
      },
      tools: generateTools('skill-health-diagnosis'),
      exampleTasks: [
        'Analyze chest X-ray for abnormalities',
        'Suggest differential diagnosis for symptoms',
        'Review lab values for critical results',
        'Generate clinical summary with recommendations',
      ],
    },
    toolsetPreset: {
      id: 'toolset-health-diagnosis',
      name: 'Diagnostic Tools',
      description: 'Tools for image analysis, lab review, and clinical support',
      mcpTools: generateTools('skill-health-diagnosis'),
    },
  },
  {
    id: 'health-4',
    name: 'Prescription Management',
    description: 'Automated prescription validation and drug interaction checking.',
    icon: 'CheckSquare',
    exampleActions: [
      'Check drug interactions for new prescription',
      'Verify dosage for pediatric patient',
      'Send prescription to patient\'s pharmacy',
      'Review medication history for Patient #9921',
    ],
    agentPrompt: 'Your agent learns prescription management and medication safety.',
    skill: {
      id: 'skill-health-pharmacy',
      name: 'Prescription Management',
      description: 'Medication ordering and interaction checking',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Drug database, interaction rules, and prescribing guidelines',
        sources: [
          {
            type: 'rag',
            name: 'Medication Database',
            description: 'Drug formulary, interaction database, dosing guidelines',
          },
          {
            type: 'files',
            name: 'Prescribing Protocols',
            description: 'Medication lists, allergy alerts, prescriber preferences',
          },
        ],
      },
      instructions: {
        scope: 'Use for prescription ordering, interaction checking, and medication management. Applies to e-prescribing, refills, and medication reconciliation.',
        guardrails: [
          'Always check drug interactions and allergies',
          'Verify dosage against clinical guidelines',
          'Require prescriber authentication',
          'Alert for high-risk medications',
        ],
      },
      tools: generateTools('skill-health-pharmacy'),
      exampleTasks: [
        'Check drug interactions for new prescription',
        'Verify dosage for pediatric patient',
        'Send prescription to patient\'s pharmacy',
        'Review medication history for Patient #9921',
      ],
    },
    toolsetPreset: {
      id: 'toolset-health-pharmacy',
      name: 'Pharmacy Tools',
      description: 'Tools for prescriptions, interactions, and medication orders',
      mcpTools: generateTools('skill-health-pharmacy'),
    },
  },
  {
    id: 'health-5',
    name: 'Insurance Claims Processing',
    description: 'Streamline claims submission and verification workflow.',
    icon: 'CheckSquare',
    exampleActions: [
      'Submit claim for Patient Visit #4421',
      'Check eligibility for insurance plan',
      'Track claim status for Claim #8834',
      'Generate billing report for last month',
    ],
    agentPrompt: 'Your agent learns claims processing and medical billing.',
    skill: {
      id: 'skill-health-billing',
      name: 'Claims Processing',
      description: 'Medical billing and insurance claims',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Medical coding, insurance rules, and billing procedures',
        sources: [
          {
            type: 'rag',
            name: 'Billing Codes',
            description: 'CPT codes, ICD-10 codes, billing guidelines, payer rules',
          },
          {
            type: 'files',
            name: 'Payer Policies',
            description: 'Insurance contracts, prior auth requirements, fee schedules',
          },
        ],
      },
      instructions: {
        scope: 'Use for claims submission, eligibility checks, and billing. Applies to insurance verification, coding, and revenue cycle management.',
        guardrails: [
          'Verify insurance eligibility before services',
          'Use correct billing codes',
          'Follow payer-specific requirements',
          'Document medical necessity appropriately',
        ],
      },
      tools: generateTools('skill-health-billing'),
      exampleTasks: [
        'Submit claim for Patient Visit #4421',
        'Check eligibility for insurance plan',
        'Track claim status for Claim #8834',
        'Generate billing report for last month',
      ],
    },
    toolsetPreset: {
      id: 'toolset-health-billing',
      name: 'Billing Tools',
      description: 'Tools for claims, eligibility checks, and billing',
      mcpTools: generateTools('skill-health-billing'),
    },
  },

  // RETAIL (5 skills)
  {
    id: 'retail-1',
    name: 'Inventory Management',
    description: 'Track stock levels and automate reordering decisions.',
    icon: 'CheckSquare',
    exampleActions: [
      'Check inventory for SKU #4428',
      'Create reorder for low-stock items',
      'Transfer stock between Store A and Store B',
      'Generate inventory report for last week',
    ],
    agentPrompt: 'Your agent learns inventory tracking and stock management.',
    skill: {
      id: 'skill-retail-inventory',
      name: 'Inventory Management',
      description: 'Stock tracking and automated reordering',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Product catalog, stock levels, and reorder rules',
        sources: [
          {
            type: 'rag',
            name: 'Inventory Best Practices',
            description: 'Reorder points, safety stock, ABC analysis, demand patterns',
          },
          {
            type: 'files',
            name: 'Product Data',
            description: 'SKU catalog, vendor lead times, reorder quantities, locations',
          },
        ],
      },
      instructions: {
        scope: 'Use for stock tracking, reordering, and inventory transfers. Applies to warehouses, retail stores, and product management.',
        guardrails: [
          'Verify stock counts before major decisions',
          'Respect budget limits for orders',
          'Account for lead times in reorder timing',
          'Alert for stockout risks',
        ],
      },
      tools: generateTools('skill-retail-inventory'),
      exampleTasks: [
        'Check inventory for SKU #4428',
        'Create reorder for low-stock items',
        'Transfer stock between Store A and Store B',
        'Generate inventory report for last week',
      ],
    },
    toolsetPreset: {
      id: 'toolset-retail-inventory',
      name: 'Inventory Tools',
      description: 'Tools for stock tracking, ordering, and transfers',
      mcpTools: generateTools('skill-retail-inventory'),
    },
  },
  {
    id: 'retail-2',
    name: 'Customer Behavior Analysis',
    description: 'Analyze shopping patterns and customer preferences.',
    icon: 'CheckSquare',
    exampleActions: [
      'Analyze purchase patterns for Customer #7721',
      'Identify trending products this month',
      'Segment customers by shopping behavior',
      'Predict churn risk for customer cohort',
    ],
    agentPrompt: 'Your agent learns customer analytics and behavior prediction.',
    skill: {
      id: 'skill-retail-analytics',
      name: 'Customer Analytics',
      description: 'Shopping behavior and preference analysis',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Purchase histories, customer segments, and behavioral patterns',
        sources: [
          {
            type: 'rag',
            name: 'Analytics Methods',
            description: 'RFM analysis, customer segmentation, predictive models',
          },
          {
            type: 'files',
            name: 'Customer Data',
            description: 'Transaction history, preferences, segment definitions',
          },
        ],
      },
      instructions: {
        scope: 'Use for customer analytics, behavior prediction, and segmentation. Applies to purchase analysis, trend identification, and customer insights.',
        guardrails: [
          'Protect customer privacy and PII',
          'Base insights on statistical significance',
          'Avoid discriminatory segmentation',
          'Comply with data protection regulations',
        ],
      },
      tools: generateTools('skill-retail-analytics'),
      exampleTasks: [
        'Analyze purchase patterns for Customer #7721',
        'Identify trending products this month',
        'Segment customers by shopping behavior',
        'Predict churn risk for customer cohort',
      ],
    },
    toolsetPreset: {
      id: 'toolset-retail-analytics',
      name: 'Analytics Tools',
      description: 'Tools for behavior analysis, segmentation, and predictions',
      mcpTools: generateTools('skill-retail-analytics'),
    },
  },
  {
    id: 'retail-3',
    name: 'Dynamic Pricing',
    description: 'Optimize pricing based on demand, competition, and inventory.',
    icon: 'CheckSquare',
    exampleActions: [
      'Suggest optimal price for Product #SKU-992',
      'Adjust prices based on competitor analysis',
      'Create promotional pricing for clearance items',
      'Analyze price elasticity for category',
    ],
    agentPrompt: 'Your agent learns dynamic pricing and price optimization.',
    skill: {
      id: 'skill-retail-pricing',
      name: 'Dynamic Pricing',
      description: 'AI-powered price optimization',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Pricing rules, competitor data, and demand patterns',
        sources: [
          {
            type: 'rag',
            name: 'Pricing Strategies',
            description: 'Price elasticity, competitive pricing, promotional tactics',
          },
          {
            type: 'files',
            name: 'Pricing Rules',
            description: 'Margin requirements, price floors/ceilings, markdown policies',
          },
        ],
      },
      instructions: {
        scope: 'Use for price optimization, competitive analysis, and promotional pricing. Applies to regular pricing, markdowns, and dynamic adjustments.',
        guardrails: [
          'Never price below cost unless approved',
          'Respect pricing rules and regulations',
          'Consider brand positioning in pricing',
          'Test price changes in limited scope first',
        ],
      },
      tools: generateTools('skill-retail-pricing'),
      exampleTasks: [
        'Suggest optimal price for Product #SKU-992',
        'Adjust prices based on competitor analysis',
        'Create promotional pricing for clearance items',
        'Analyze price elasticity for category',
      ],
    },
    toolsetPreset: {
      id: 'toolset-retail-pricing',
      name: 'Pricing Tools',
      description: 'Tools for price optimization, analysis, and adjustments',
      mcpTools: generateTools('skill-retail-pricing'),
    },
  },
  {
    id: 'retail-4',
    name: 'Personalized Recommendations',
    description: 'Product recommendations powered by customer data and AI.',
    icon: 'MessageCircle',
    exampleActions: [
      'Recommend products for Customer #5521',
      'Generate "frequently bought together" suggestions',
      'Create personalized email campaign',
      'Suggest upsell items for cart',
    ],
    agentPrompt: 'Your agent learns recommendation systems and personalization.',
    skill: {
      id: 'skill-retail-recommendations',
      name: 'Product Recommendations',
      description: 'Personalized product suggestions',
      icon: 'MessageCircle',
      knowledge: {
        description: 'Customer preferences, product relationships, and recommendation models',
        sources: [
          {
            type: 'rag',
            name: 'Recommendation Models',
            description: 'Collaborative filtering, content-based recommendations, hybrid approaches',
          },
          {
            type: 'files',
            name: 'Product Relationships',
            description: 'Product affinities, category hierarchies, bundle definitions',
          },
        ],
      },
      instructions: {
        scope: 'Use for product recommendations, upselling, and personalized marketing. Applies to website, email campaigns, and in-store suggestions.',
        guardrails: [
          'Respect customer preferences and opt-outs',
          'Avoid inappropriate or irrelevant suggestions',
          'Consider inventory availability',
          'Maintain diversity in recommendations',
        ],
      },
      tools: generateTools('skill-retail-recommendations'),
      exampleTasks: [
        'Recommend products for Customer #5521',
        'Generate "frequently bought together" suggestions',
        'Create personalized email campaign',
        'Suggest upsell items for cart',
      ],
    },
    toolsetPreset: {
      id: 'toolset-retail-recommendations',
      name: 'Recommendation Tools',
      description: 'Tools for personalization, suggestions, and campaigns',
      mcpTools: generateTools('skill-retail-recommendations'),
    },
  },
  {
    id: 'retail-5',
    name: 'Order Fulfillment',
    description: 'Automate picking, packing, and shipping for orders.',
    icon: 'CheckSquare',
    exampleActions: [
      'Process Order #7821 for shipment',
      'Generate picking list for warehouse',
      'Track shipment status for Order #5542',
      'Create return label for Customer #9921',
    ],
    agentPrompt: 'Your agent learns order fulfillment and shipping automation.',
    skill: {
      id: 'skill-retail-fulfillment',
      name: 'Order Fulfillment',
      description: 'Automated order processing and shipping',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Fulfillment processes, shipping rules, and carrier integrations',
        sources: [
          {
            type: 'rag',
            name: 'Fulfillment Methods',
            description: 'Pick-pack-ship, warehouse operations, carrier selection',
          },
          {
            type: 'files',
            name: 'Shipping Rules',
            description: 'Carrier rates, service levels, packaging requirements, zones',
          },
        ],
      },
      instructions: {
        scope: 'Use for order processing, shipping, and fulfillment tracking. Applies to warehouse operations, carrier integration, and delivery management.',
        guardrails: [
          'Verify shipping address before processing',
          'Select cost-effective carrier based on rules',
          'Notify customers of shipment status',
          'Handle exceptions and delays promptly',
        ],
      },
      tools: generateTools('skill-retail-fulfillment'),
      exampleTasks: [
        'Process Order #7821 for shipment',
        'Generate picking list for warehouse',
        'Track shipment status for Order #5542',
        'Create return label for Customer #9921',
      ],
    },
    toolsetPreset: {
      id: 'toolset-retail-fulfillment',
      name: 'Fulfillment Tools',
      description: 'Tools for order processing, shipping, and tracking',
      mcpTools: generateTools('skill-retail-fulfillment'),
    },
  },

  // EDUCATION (5 skills)
  {
    id: 'edu-1',
    name: 'Student Enrollment & Registration',
    description: 'Streamline student admissions and course registration.',
    icon: 'CheckSquare',
    exampleActions: [
      'Process enrollment for new student',
      'Register Student #4421 for Fall courses',
      'Check prerequisites for Course CS-301',
      'Generate enrollment report for semester',
    ],
    agentPrompt: 'Your agent learns enrollment processing and registration management.',
    skill: {
      id: 'skill-edu-enrollment',
      name: 'Enrollment Management',
      description: 'Student registration and admissions',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Course catalogs, prerequisites, and enrollment policies',
        sources: [
          {
            type: 'rag',
            name: 'Academic Policies',
            description: 'Enrollment rules, prerequisites, degree requirements, academic calendar',
          },
          {
            type: 'files',
            name: 'Course Data',
            description: 'Course catalog, schedules, capacity limits, waitlist rules',
          },
        ],
      },
      instructions: {
        scope: 'Use for student enrollment, course registration, and admissions. Applies to new students, course selection, and schedule management.',
        guardrails: [
          'Verify prerequisites before enrollment',
          'Respect course capacity limits',
          'Follow academic policies and deadlines',
          'Protect student privacy (FERPA)',
        ],
      },
      tools: generateTools('skill-edu-enrollment'),
      exampleTasks: [
        'Process enrollment for new student',
        'Register Student #4421 for Fall courses',
        'Check prerequisites for Course CS-301',
        'Generate enrollment report for semester',
      ],
    },
    toolsetPreset: {
      id: 'toolset-edu-enrollment',
      name: 'Enrollment Tools',
      description: 'Tools for registration, admissions, and course selection',
      mcpTools: generateTools('skill-edu-enrollment'),
    },
  },
  {
    id: 'edu-2',
    name: 'Learning Path Personalization',
    description: 'Adaptive learning experiences based on student performance.',
    icon: 'BookOpen',
    exampleActions: [
      'Create personalized study plan for Student #7721',
      'Recommend next lesson based on quiz results',
      'Identify knowledge gaps for remediation',
      'Adjust difficulty level for struggling students',
    ],
    agentPrompt: 'Your agent learns adaptive learning and personalization.',
    skill: {
      id: 'skill-edu-personalization',
      name: 'Learning Personalization',
      description: 'Adaptive learning path creation',
      icon: 'BookOpen',
      knowledge: {
        description: 'Learning objectives, student performance data, and pedagogical strategies',
        sources: [
          {
            type: 'rag',
            name: 'Learning Science',
            description: 'Mastery learning, spaced repetition, differentiated instruction',
          },
          {
            type: 'files',
            name: 'Course Content',
            description: 'Learning objectives, content hierarchy, assessment data',
          },
        ],
      },
      instructions: {
        scope: 'Use for personalized learning paths, content recommendations, and adaptive instruction. Applies to course progression, remediation, and enrichment.',
        guardrails: [
          'Base recommendations on learning objectives',
          'Respect student learning pace',
          'Provide appropriate challenge level',
          'Monitor for struggling students needing help',
        ],
      },
      tools: generateTools('skill-edu-personalization'),
      exampleTasks: [
        'Create personalized study plan for Student #7721',
        'Recommend next lesson based on quiz results',
        'Identify knowledge gaps for remediation',
        'Adjust difficulty level for struggling students',
      ],
    },
    toolsetPreset: {
      id: 'toolset-edu-personalization',
      name: 'Personalization Tools',
      description: 'Tools for adaptive learning, recommendations, and paths',
      mcpTools: generateTools('skill-edu-personalization'),
    },
  },
  {
    id: 'edu-3',
    name: 'Grading & Assessment',
    description: 'Automated grading and feedback generation for assignments.',
    icon: 'CheckSquare',
    exampleActions: [
      'Grade multiple choice quiz for Class #301',
      'Provide feedback on student essay',
      'Analyze class performance on midterm exam',
      'Generate grade report for semester',
    ],
    agentPrompt: 'Your agent learns assessment and automated grading.',
    skill: {
      id: 'skill-edu-grading',
      name: 'Grading & Assessment',
      description: 'Automated grading and feedback',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Rubrics, grading criteria, and assessment standards',
        sources: [
          {
            type: 'rag',
            name: 'Assessment Methods',
            description: 'Rubric design, formative assessment, feedback best practices',
          },
          {
            type: 'files',
            name: 'Grading Rubrics',
            description: 'Assignment rubrics, answer keys, grading policies',
          },
        ],
      },
      instructions: {
        scope: 'Use for grading assignments, providing feedback, and assessment analysis. Applies to quizzes, essays, projects, and exams.',
        guardrails: [
          'Apply rubrics consistently and fairly',
          'Provide constructive feedback',
          'Flag potential academic integrity issues',
          'Allow instructor override of automated grades',
        ],
      },
      tools: generateTools('skill-edu-grading'),
      exampleTasks: [
        'Grade multiple choice quiz for Class #301',
        'Provide feedback on student essay',
        'Analyze class performance on midterm exam',
        'Generate grade report for semester',
      ],
    },
    toolsetPreset: {
      id: 'toolset-edu-grading',
      name: 'Grading Tools',
      description: 'Tools for assessment, grading, and feedback',
      mcpTools: generateTools('skill-edu-grading'),
    },
  },
  {
    id: 'edu-4',
    name: 'Content Recommendation',
    description: 'Suggest relevant courses and learning materials.',
    icon: 'BookOpen',
    exampleActions: [
      'Recommend courses based on career goals',
      'Suggest supplementary materials for topic',
      'Find courses matching student interests',
      'Create learning resource playlist',
    ],
    agentPrompt: 'Your agent learns content curation and course recommendation.',
    skill: {
      id: 'skill-edu-content',
      name: 'Content Recommendation',
      description: 'Course and material suggestions',
      icon: 'BookOpen',
      knowledge: {
        description: 'Course catalog, learning resources, and student interests',
        sources: [
          {
            type: 'rag',
            name: 'Educational Content',
            description: 'Course descriptions, learning outcomes, skill pathways',
          },
          {
            type: 'files',
            name: 'Resource Library',
            description: 'Videos, articles, textbooks, supplementary materials',
          },
        ],
      },
      instructions: {
        scope: 'Use for course recommendations, resource curation, and learning path guidance. Applies to course selection, study materials, and career planning.',
        guardrails: [
          'Match recommendations to student level',
          'Consider prerequisites and background',
          'Align with career and academic goals',
          'Verify quality of recommended resources',
        ],
      },
      tools: generateTools('skill-edu-content'),
      exampleTasks: [
        'Recommend courses based on career goals',
        'Suggest supplementary materials for topic',
        'Find courses matching student interests',
        'Create learning resource playlist',
      ],
    },
    toolsetPreset: {
      id: 'toolset-edu-content',
      name: 'Content Tools',
      description: 'Tools for course search, recommendations, and curation',
      mcpTools: generateTools('skill-edu-content'),
    },
  },
  {
    id: 'edu-5',
    name: 'Student Support Services',
    description: 'AI tutoring and academic assistance for students.',
    icon: 'MessageCircle',
    exampleActions: [
      'Answer student question about calculus',
      'Provide study tips for upcoming exam',
      'Explain difficult concept with examples',
      'Connect student to academic advisor',
    ],
    agentPrompt: 'Your agent learns tutoring and student support.',
    skill: {
      id: 'skill-edu-support',
      name: 'Student Support',
      description: 'AI tutoring and academic assistance',
      icon: 'MessageCircle',
      knowledge: {
        description: 'Subject matter expertise, tutoring strategies, and support resources',
        sources: [
          {
            type: 'rag',
            name: 'Academic Content',
            description: 'Textbooks, course materials, concept explanations, examples',
          },
          {
            type: 'files',
            name: 'Support Resources',
            description: 'Tutoring guides, study strategies, support service contacts',
          },
        ],
      },
      instructions: {
        scope: 'Use for student questions, tutoring, and academic support. Applies to homework help, concept explanation, and study guidance.',
        guardrails: [
          'Don\'t provide direct answers to assignments',
          'Guide students to learn, don\'t just tell',
          'Escalate complex issues to human tutors',
          'Maintain appropriate tutor-student boundaries',
        ],
      },
      tools: generateTools('skill-edu-support'),
      exampleTasks: [
        'Answer student question about calculus',
        'Provide study tips for upcoming exam',
        'Explain difficult concept with examples',
        'Connect student to academic advisor',
      ],
    },
    toolsetPreset: {
      id: 'toolset-edu-support',
      name: 'Support Tools',
      description: 'Tools for tutoring, Q&A, and academic assistance',
      mcpTools: generateTools('skill-edu-support'),
    },
  },

  // FINANCE (5 skills)
  {
    id: 'fin-1',
    name: 'Portfolio Management',
    description: 'Optimize investment portfolios and asset allocation strategies.',
    icon: 'CheckSquare',
    exampleActions: [
      'Analyze portfolio allocation for Client #8821',
      'Rebalance portfolio to target weights',
      'Suggest investments matching risk profile',
      'Generate portfolio performance report',
    ],
    agentPrompt: 'Your agent learns portfolio optimization and investment management.',
    skill: {
      id: 'skill-fin-portfolio',
      name: 'Portfolio Management',
      description: 'Investment portfolio optimization',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Investment strategies, asset allocation, and market data',
        sources: [
          {
            type: 'rag',
            name: 'Investment Theory',
            description: 'Modern portfolio theory, asset allocation, risk management',
          },
          {
            type: 'files',
            name: 'Market Data',
            description: 'Securities data, performance history, risk metrics, benchmarks',
          },
        ],
      },
      instructions: {
        scope: 'Use for portfolio analysis, rebalancing, and investment recommendations. Applies to asset allocation, risk management, and performance tracking.',
        guardrails: [
          'Follow client risk tolerance and objectives',
          'Comply with investment regulations',
          'Document investment rationale',
          'Disclose conflicts of interest',
        ],
      },
      tools: generateTools('skill-fin-portfolio'),
      exampleTasks: [
        'Analyze portfolio allocation for Client #8821',
        'Rebalance portfolio to target weights',
        'Suggest investments matching risk profile',
        'Generate portfolio performance report',
      ],
    },
    toolsetPreset: {
      id: 'toolset-fin-portfolio',
      name: 'Portfolio Tools',
      description: 'Tools for analysis, rebalancing, and optimization',
      mcpTools: generateTools('skill-fin-portfolio'),
    },
  },
  {
    id: 'fin-2',
    name: 'Market Analysis & Trading',
    description: 'Real-time market data analysis and trade execution support.',
    icon: 'CheckSquare',
    exampleActions: [
      'Analyze price trends for Stock XYZ',
      'Execute trade order for 100 shares',
      'Monitor market sentiment for sector',
      'Generate trading signal based on indicators',
    ],
    agentPrompt: 'Your agent learns market analysis and trading systems.',
    skill: {
      id: 'skill-fin-trading',
      name: 'Market Analysis',
      description: 'Trading analytics and execution',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Technical analysis, market indicators, and trading strategies',
        sources: [
          {
            type: 'rag',
            name: 'Trading Methods',
            description: 'Technical analysis, chart patterns, indicators, trading strategies',
          },
          {
            type: 'files',
            name: 'Market Feeds',
            description: 'Real-time quotes, news feeds, economic data, trading signals',
          },
        ],
      },
      instructions: {
        scope: 'Use for market analysis, trading signals, and order execution. Applies to stocks, options, futures, and other securities.',
        guardrails: [
          'Verify orders before execution',
          'Follow trading limits and risk controls',
          'Comply with trading regulations',
          'Document trade rationale and timing',
        ],
      },
      tools: generateTools('skill-fin-trading'),
      exampleTasks: [
        'Analyze price trends for Stock XYZ',
        'Execute trade order for 100 shares',
        'Monitor market sentiment for sector',
        'Generate trading signal based on indicators',
      ],
    },
    toolsetPreset: {
      id: 'toolset-fin-trading',
      name: 'Trading Tools',
      description: 'Tools for analysis, signals, and execution',
      mcpTools: generateTools('skill-fin-trading'),
    },
  },
  {
    id: 'fin-3',
    name: 'Regulatory Compliance',
    description: 'Automated compliance reporting and regulatory monitoring.',
    icon: 'CheckSquare',
    exampleActions: [
      'Generate monthly compliance report',
      'Check transaction for regulatory requirements',
      'Monitor for insider trading patterns',
      'File required regulatory disclosures',
    ],
    agentPrompt: 'Your agent learns financial compliance and regulatory requirements.',
    skill: {
      id: 'skill-fin-compliance',
      name: 'Regulatory Compliance',
      description: 'Financial compliance and reporting',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Financial regulations, reporting requirements, and compliance rules',
        sources: [
          {
            type: 'rag',
            name: 'Regulations',
            description: 'SEC rules, FINRA requirements, compliance guidelines',
          },
          {
            type: 'files',
            name: 'Compliance Procedures',
            description: 'Filing templates, monitoring rules, escalation procedures',
          },
        ],
      },
      instructions: {
        scope: 'Use for compliance monitoring, reporting, and regulatory filings. Applies to transaction surveillance, disclosure requirements, and audits.',
        guardrails: [
          'Strictly follow all regulatory requirements',
          'Escalate potential violations immediately',
          'Maintain complete audit trails',
          'File reports accurately and on time',
        ],
      },
      tools: generateTools('skill-fin-compliance'),
      exampleTasks: [
        'Generate monthly compliance report',
        'Check transaction for regulatory requirements',
        'Monitor for insider trading patterns',
        'File required regulatory disclosures',
      ],
    },
    toolsetPreset: {
      id: 'toolset-fin-compliance',
      name: 'Compliance Tools',
      description: 'Tools for monitoring, reporting, and filings',
      mcpTools: generateTools('skill-fin-compliance'),
    },
  },
  {
    id: 'fin-4',
    name: 'Financial Forecasting',
    description: 'Predict revenue, expenses, and financial trends.',
    icon: 'CheckSquare',
    exampleActions: [
      'Forecast quarterly revenue for next year',
      'Predict cash flow for next 6 months',
      'Model financial impact of new product',
      'Generate budget vs actual variance report',
    ],
    agentPrompt: 'Your agent learns financial modeling and forecasting.',
    skill: {
      id: 'skill-fin-forecasting',
      name: 'Financial Forecasting',
      description: 'Revenue and expense prediction',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Financial models, historical data, and forecasting methods',
        sources: [
          {
            type: 'rag',
            name: 'Forecasting Methods',
            description: 'Time series analysis, regression models, scenario planning',
          },
          {
            type: 'files',
            name: 'Financial Data',
            description: 'Historical financials, budgets, assumptions, drivers',
          },
        ],
      },
      instructions: {
        scope: 'Use for financial forecasting, budgeting, and scenario analysis. Applies to revenue prediction, expense planning, and financial modeling.',
        guardrails: [
          'Base forecasts on reasonable assumptions',
          'Document modeling methodology',
          'Provide ranges and confidence levels',
          'Update forecasts with new information',
        ],
      },
      tools: generateTools('skill-fin-forecasting'),
      exampleTasks: [
        'Forecast quarterly revenue for next year',
        'Predict cash flow for next 6 months',
        'Model financial impact of new product',
        'Generate budget vs actual variance report',
      ],
    },
    toolsetPreset: {
      id: 'toolset-fin-forecasting',
      name: 'Forecasting Tools',
      description: 'Tools for prediction, modeling, and analysis',
      mcpTools: generateTools('skill-fin-forecasting'),
    },
  },
  {
    id: 'fin-5',
    name: 'Risk Management',
    description: 'Identify and mitigate financial risks across operations.',
    icon: 'CheckSquare',
    exampleActions: [
      'Assess risk exposure for portfolio',
      'Calculate Value at Risk (VaR) for positions',
      'Monitor credit risk for counterparties',
      'Generate risk management report',
    ],
    agentPrompt: 'Your agent learns financial risk assessment and management.',
    skill: {
      id: 'skill-fin-risk',
      name: 'Risk Management',
      description: 'Financial risk identification and mitigation',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Risk metrics, assessment methods, and mitigation strategies',
        sources: [
          {
            type: 'rag',
            name: 'Risk Management',
            description: 'VaR, stress testing, risk models, mitigation strategies',
          },
          {
            type: 'files',
            name: 'Risk Parameters',
            description: 'Risk limits, exposure data, correlation matrices, scenarios',
          },
        ],
      },
      instructions: {
        scope: 'Use for risk assessment, monitoring, and reporting. Applies to market risk, credit risk, operational risk, and liquidity risk.',
        guardrails: [
          'Alert immediately for limit breaches',
          'Use validated risk models',
          'Stress test under multiple scenarios',
          'Document risk assessment methodology',
        ],
      },
      tools: generateTools('skill-fin-risk'),
      exampleTasks: [
        'Assess risk exposure for portfolio',
        'Calculate Value at Risk (VaR) for positions',
        'Monitor credit risk for counterparties',
        'Generate risk management report',
      ],
    },
    toolsetPreset: {
      id: 'toolset-fin-risk',
      name: 'Risk Tools',
      description: 'Tools for assessment, monitoring, and reporting',
      mcpTools: generateTools('skill-fin-risk'),
    },
  },

  // LOGISTICS (5 skills)
  {
    id: 'log-1',
    name: 'Route Optimization',
    description: 'Calculate optimal delivery routes and schedules.',
    icon: 'CheckSquare',
    exampleActions: [
      'Optimize delivery route for 20 stops',
      'Calculate fastest route avoiding traffic',
      'Schedule driver assignments for tomorrow',
      'Generate route efficiency report',
    ],
    agentPrompt: 'Your agent learns route optimization and logistics planning.',
    skill: {
      id: 'skill-log-routing',
      name: 'Route Optimization',
      description: 'Delivery route planning and optimization',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Geographic data, traffic patterns, and routing algorithms',
        sources: [
          {
            type: 'rag',
            name: 'Routing Methods',
            description: 'Vehicle routing, TSP algorithms, constraint optimization',
          },
          {
            type: 'files',
            name: 'Route Data',
            description: 'Maps, traffic data, delivery zones, time windows, vehicle specs',
          },
        ],
      },
      instructions: {
        scope: 'Use for route planning, driver scheduling, and delivery optimization. Applies to last-mile delivery, long-haul, and multi-stop routes.',
        guardrails: [
          'Respect driver hours-of-service limits',
          'Account for traffic and weather conditions',
          'Balance route efficiency with delivery windows',
          'Consider vehicle capacity and restrictions',
        ],
      },
      tools: generateTools('skill-log-routing'),
      exampleTasks: [
        'Optimize delivery route for 20 stops',
        'Calculate fastest route avoiding traffic',
        'Schedule driver assignments for tomorrow',
        'Generate route efficiency report',
      ],
    },
    toolsetPreset: {
      id: 'toolset-log-routing',
      name: 'Routing Tools',
      description: 'Tools for route optimization, scheduling, and planning',
      mcpTools: generateTools('skill-log-routing'),
    },
  },
  {
    id: 'log-2',
    name: 'Warehouse Management',
    description: 'Track inventory location and movement in warehouses.',
    icon: 'CheckSquare',
    exampleActions: [
      'Locate Item SKU-4421 in warehouse',
      'Optimize bin placement for fast-moving items',
      'Generate pick list for Order Batch #82',
      'Track inventory movement report',
    ],
    agentPrompt: 'Your agent learns warehouse operations and inventory tracking.',
    skill: {
      id: 'skill-log-warehouse',
      name: 'Warehouse Management',
      description: 'Inventory location and movement tracking',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Warehouse layout, inventory data, and operational procedures',
        sources: [
          {
            type: 'rag',
            name: 'Warehouse Operations',
            description: 'Slotting optimization, picking strategies, cycle counting',
          },
          {
            type: 'files',
            name: 'Facility Data',
            description: 'Warehouse layouts, bin locations, equipment, inventory levels',
          },
        ],
      },
      instructions: {
        scope: 'Use for inventory tracking, bin management, and warehouse operations. Applies to receiving, putaway, picking, and shipping.',
        guardrails: [
          'Verify inventory counts before major moves',
          'Follow FIFO/FEFO rotation rules',
          'Respect safety and access restrictions',
          'Maintain accurate location data',
        ],
      },
      tools: generateTools('skill-log-warehouse'),
      exampleTasks: [
        'Locate Item SKU-4421 in warehouse',
        'Optimize bin placement for fast-moving items',
        'Generate pick list for Order Batch #82',
        'Track inventory movement report',
      ],
    },
    toolsetPreset: {
      id: 'toolset-log-warehouse',
      name: 'Warehouse Tools',
      description: 'Tools for inventory tracking, picking, and operations',
      mcpTools: generateTools('skill-log-warehouse'),
    },
  },
  {
    id: 'log-3',
    name: 'Shipment Tracking',
    description: 'Real-time tracking and delivery status updates.',
    icon: 'CheckSquare',
    exampleActions: [
      'Track shipment Tracking #7821KL92',
      'Get estimated delivery time for Order #5542',
      'Send delivery notification to customer',
      'Generate shipment status report',
    ],
    agentPrompt: 'Your agent learns shipment tracking and delivery monitoring.',
    skill: {
      id: 'skill-log-tracking',
      name: 'Shipment Tracking',
      description: 'Real-time tracking and notifications',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Carrier integrations, tracking data, and delivery workflows',
        sources: [
          {
            type: 'rag',
            name: 'Shipping Operations',
            description: 'Carrier APIs, tracking protocols, delivery exception handling',
          },
          {
            type: 'files',
            name: 'Shipment Data',
            description: 'Tracking numbers, carrier info, delivery addresses, schedules',
          },
        ],
      },
      instructions: {
        scope: 'Use for shipment tracking, delivery updates, and customer notifications. Applies to in-transit monitoring, ETAs, and exception handling.',
        guardrails: [
          'Provide accurate delivery estimates',
          'Notify customers of delays proactively',
          'Escalate delivery exceptions promptly',
          'Protect customer delivery information',
        ],
      },
      tools: generateTools('skill-log-tracking'),
      exampleTasks: [
        'Track shipment Tracking #7821KL92',
        'Get estimated delivery time for Order #5542',
        'Send delivery notification to customer',
        'Generate shipment status report',
      ],
    },
    toolsetPreset: {
      id: 'toolset-log-tracking',
      name: 'Tracking Tools',
      description: 'Tools for shipment tracking, notifications, and updates',
      mcpTools: generateTools('skill-log-tracking'),
    },
  },
  {
    id: 'log-4',
    name: 'Demand Forecasting',
    description: 'Predict shipping volume and capacity requirements.',
    icon: 'CheckSquare',
    exampleActions: [
      'Forecast shipping volume for next month',
      'Predict capacity needs for peak season',
      'Analyze demand patterns by region',
      'Generate capacity planning report',
    ],
    agentPrompt: 'Your agent learns demand forecasting and capacity planning.',
    skill: {
      id: 'skill-log-demand',
      name: 'Demand Forecasting',
      description: 'Volume prediction and capacity planning',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Historical volume data, seasonal patterns, and forecasting models',
        sources: [
          {
            type: 'rag',
            name: 'Forecasting Methods',
            description: 'Time series, demand sensing, seasonal adjustment, trend analysis',
          },
          {
            type: 'files',
            name: 'Shipment History',
            description: 'Volume data, seasonal patterns, special events, growth trends',
          },
        ],
      },
      instructions: {
        scope: 'Use for volume forecasting, capacity planning, and resource allocation. Applies to warehouse staffing, fleet sizing, and network planning.',
        guardrails: [
          'Account for seasonality and trends',
          'Adjust for known business changes',
          'Provide confidence intervals',
          'Update forecasts regularly',
        ],
      },
      tools: generateTools('skill-log-demand'),
      exampleTasks: [
        'Forecast shipping volume for next month',
        'Predict capacity needs for peak season',
        'Analyze demand patterns by region',
        'Generate capacity planning report',
      ],
    },
    toolsetPreset: {
      id: 'toolset-log-demand',
      name: 'Forecasting Tools',
      description: 'Tools for demand prediction and capacity planning',
      mcpTools: generateTools('skill-log-demand'),
    },
  },
  {
    id: 'log-5',
    name: 'Carrier Selection',
    description: 'Match shipments with optimal carriers based on criteria.',
    icon: 'CheckSquare',
    exampleActions: [
      'Select best carrier for Shipment #9921',
      'Compare carrier rates for route',
      'Find fastest option for urgent delivery',
      'Generate carrier performance report',
    ],
    agentPrompt: 'Your agent learns carrier selection and logistics optimization.',
    skill: {
      id: 'skill-log-carrier',
      name: 'Carrier Selection',
      description: 'Optimal carrier matching and selection',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Carrier capabilities, rates, service levels, and performance',
        sources: [
          {
            type: 'rag',
            name: 'Carrier Data',
            description: 'Service levels, coverage areas, specializations, reliability metrics',
          },
          {
            type: 'files',
            name: 'Rate Tables',
            description: 'Carrier contracts, rate cards, surcharges, performance history',
          },
        ],
      },
      instructions: {
        scope: 'Use for carrier selection, rate comparison, and service optimization. Applies to shipment planning, cost management, and service level requirements.',
        guardrails: [
          'Balance cost and service level appropriately',
          'Follow contract commitments with carriers',
          'Consider carrier performance history',
          'Respect shipping restrictions and requirements',
        ],
      },
      tools: generateTools('skill-log-carrier'),
      exampleTasks: [
        'Select best carrier for Shipment #9921',
        'Compare carrier rates for route',
        'Find fastest option for urgent delivery',
        'Generate carrier performance report',
      ],
    },
    toolsetPreset: {
      id: 'toolset-log-carrier',
      name: 'Carrier Tools',
      description: 'Tools for selection, rate comparison, and management',
      mcpTools: generateTools('skill-log-carrier'),
    },
  },

  // CONSULTING (5 skills)
  {
    id: 'cons-1',
    name: 'Client Engagement Management',
    description: 'Track projects, deliverables, and milestones for clients.',
    icon: 'CheckSquare',
    exampleActions: [
      'Update status for Project #4421',
      'Track deliverables for Client ABC',
      'Schedule milestone review meeting',
      'Generate engagement status report',
    ],
    agentPrompt: 'Your agent learns project management and client engagement.',
    skill: {
      id: 'skill-cons-engagement',
      name: 'Engagement Management',
      description: 'Client project and deliverable tracking',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Project methodologies, client data, and engagement workflows',
        sources: [
          {
            type: 'rag',
            name: 'Project Management',
            description: 'Agile, waterfall, consulting frameworks, delivery methods',
          },
          {
            type: 'files',
            name: 'Engagement Data',
            description: 'SOWs, project plans, deliverables, client contacts, status',
          },
        ],
      },
      instructions: {
        scope: 'Use for project tracking, milestone management, and client deliverables. Applies to engagement planning, status updates, and delivery.',
        guardrails: [
          'Protect confidential client information',
          'Track deliverable dependencies',
          'Alert for at-risk milestones',
          'Follow engagement governance',
        ],
      },
      tools: generateTools('skill-cons-engagement'),
      exampleTasks: [
        'Update status for Project #4421',
        'Track deliverables for Client ABC',
        'Schedule milestone review meeting',
        'Generate engagement status report',
      ],
    },
    toolsetPreset: {
      id: 'toolset-cons-engagement',
      name: 'Engagement Tools',
      description: 'Tools for project tracking, deliverables, and status',
      mcpTools: generateTools('skill-cons-engagement'),
    },
  },
  {
    id: 'cons-2',
    name: 'Market Research & Analysis',
    description: 'Gather and analyze industry data and competitive intelligence.',
    icon: 'CheckSquare',
    exampleActions: [
      'Research market size for Industry X',
      'Analyze competitor strategies',
      'Gather industry trend data',
      'Generate market analysis report',
    ],
    agentPrompt: 'Your agent learns market research and competitive analysis.',
    skill: {
      id: 'skill-cons-research',
      name: 'Market Research',
      description: 'Industry and competitive intelligence',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Industry data sources, research methods, and analysis frameworks',
        sources: [
          {
            type: 'rag',
            name: 'Research Methods',
            description: 'Market analysis, competitive intelligence, data sources',
          },
          {
            type: 'files',
            name: 'Industry Data',
            description: 'Market reports, competitor info, trends, benchmarks',
          },
        ],
      },
      instructions: {
        scope: 'Use for market research, competitive analysis, and industry insights. Applies to due diligence, strategy development, and opportunity assessment.',
        guardrails: [
          'Use only ethical research methods',
          'Verify data sources and credibility',
          'Respect confidentiality agreements',
          'Cite sources appropriately',
        ],
      },
      tools: generateTools('skill-cons-research'),
      exampleTasks: [
        'Research market size for Industry X',
        'Analyze competitor strategies',
        'Gather industry trend data',
        'Generate market analysis report',
      ],
    },
    toolsetPreset: {
      id: 'toolset-cons-research',
      name: 'Research Tools',
      description: 'Tools for data gathering, analysis, and insights',
      mcpTools: generateTools('skill-cons-research'),
    },
  },
  {
    id: 'cons-3',
    name: 'Report Generation',
    description: 'Automated insights and recommendation reports for clients.',
    icon: 'BookOpen',
    exampleActions: [
      'Generate executive summary for findings',
      'Create strategic recommendations report',
      'Format presentation for client review',
      'Compile appendix with supporting data',
    ],
    agentPrompt: 'Your agent learns report writing and insight generation.',
    skill: {
      id: 'skill-cons-reporting',
      name: 'Report Generation',
      description: 'Automated client reports and insights',
      icon: 'BookOpen',
      knowledge: {
        description: 'Report templates, writing standards, and consulting frameworks',
        sources: [
          {
            type: 'rag',
            name: 'Report Writing',
            description: 'Consulting frameworks, storytelling, executive communication',
          },
          {
            type: 'files',
            name: 'Templates',
            description: 'Slide templates, report formats, style guides, client branding',
          },
        ],
      },
      instructions: {
        scope: 'Use for client reports, presentations, and recommendations. Applies to findings documentation, strategy presentations, and deliverables.',
        guardrails: [
          'Follow client branding guidelines',
          'Ensure findings are evidence-based',
          'Structure for executive readability',
          'Include appropriate caveats and assumptions',
        ],
      },
      tools: generateTools('skill-cons-reporting'),
      exampleTasks: [
        'Generate executive summary for findings',
        'Create strategic recommendations report',
        'Format presentation for client review',
        'Compile appendix with supporting data',
      ],
    },
    toolsetPreset: {
      id: 'toolset-cons-reporting',
      name: 'Reporting Tools',
      description: 'Tools for report creation, formatting, and delivery',
      mcpTools: generateTools('skill-cons-reporting'),
    },
  },
  {
    id: 'cons-4',
    name: 'Resource Allocation',
    description: 'Match consultants to client engagements optimally.',
    icon: 'CheckSquare',
    exampleActions: [
      'Find consultant with AI expertise',
      'Staff Project #7821 with optimal team',
      'Check consultant availability next month',
      'Generate resource utilization report',
    ],
    agentPrompt: 'Your agent learns resource planning and team allocation.',
    skill: {
      id: 'skill-cons-resources',
      name: 'Resource Allocation',
      description: 'Consultant staffing and utilization',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Consultant skills, availability, and project requirements',
        sources: [
          {
            type: 'rag',
            name: 'Staffing Methods',
            description: 'Resource planning, skills matching, utilization optimization',
          },
          {
            type: 'files',
            name: 'Consultant Data',
            description: 'Skills inventory, availability, preferences, performance history',
          },
        ],
      },
      instructions: {
        scope: 'Use for team staffing, resource planning, and utilization tracking. Applies to project assignments, bench management, and capacity planning.',
        guardrails: [
          'Match skills to project requirements',
          'Respect consultant preferences and development goals',
          'Balance utilization across team',
          'Consider travel and location constraints',
        ],
      },
      tools: generateTools('skill-cons-resources'),
      exampleTasks: [
        'Find consultant with AI expertise',
        'Staff Project #7821 with optimal team',
        'Check consultant availability next month',
        'Generate resource utilization report',
      ],
    },
    toolsetPreset: {
      id: 'toolset-cons-resources',
      name: 'Resource Tools',
      description: 'Tools for staffing, skills matching, and planning',
      mcpTools: generateTools('skill-cons-resources'),
    },
  },
  {
    id: 'cons-5',
    name: 'Knowledge Management',
    description: 'Organize and share best practices and case studies.',
    icon: 'BookOpen',
    exampleActions: [
      'Find similar past projects for reference',
      'Add lessons learned to knowledge base',
      'Search for industry-specific frameworks',
      'Generate knowledge sharing summary',
    ],
    agentPrompt: 'Your agent learns knowledge curation and organizational learning.',
    skill: {
      id: 'skill-cons-knowledge',
      name: 'Knowledge Management',
      description: 'Best practice and case study management',
      icon: 'BookOpen',
      knowledge: {
        description: 'Case studies, frameworks, and institutional knowledge',
        sources: [
          {
            type: 'rag',
            name: 'Knowledge Base',
            description: 'Past projects, methodologies, frameworks, best practices',
          },
          {
            type: 'files',
            name: 'Case Studies',
            description: 'Project summaries, lessons learned, reusable assets',
          },
        ],
      },
      instructions: {
        scope: 'Use for knowledge search, capture, and sharing. Applies to finding past work, documenting learnings, and building capabilities.',
        guardrails: [
          'Protect client confidentiality',
          'Verify information accuracy',
          'Sanitize client-specific details',
          'Encourage knowledge contribution',
        ],
      },
      tools: generateTools('skill-cons-knowledge'),
      exampleTasks: [
        'Find similar past projects for reference',
        'Add lessons learned to knowledge base',
        'Search for industry-specific frameworks',
        'Generate knowledge sharing summary',
      ],
    },
    toolsetPreset: {
      id: 'toolset-cons-knowledge',
      name: 'Knowledge Tools',
      description: 'Tools for search, capture, and sharing',
      mcpTools: generateTools('skill-cons-knowledge'),
    },
  },

  // MEDIA (5 skills)
  {
    id: 'media-1',
    name: 'Content Creation & Editing',
    description: 'AI-assisted video and audio production workflows.',
    icon: 'CheckSquare',
    exampleActions: [
      'Generate video transcript with timestamps',
      'Suggest edits for pacing in video segment',
      'Create thumbnail variations for A/B test',
      'Auto-generate captions for accessibility',
    ],
    agentPrompt: 'Your agent learns content production and editing assistance.',
    skill: {
      id: 'skill-media-creation',
      name: 'Content Creation',
      description: 'AI-powered production assistance',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Production workflows, editing techniques, and content standards',
        sources: [
          {
            type: 'rag',
            name: 'Production Methods',
            description: 'Video editing, audio production, storytelling techniques',
          },
          {
            type: 'files',
            name: 'Style Guides',
            description: 'Brand guidelines, templates, production standards, formats',
          },
        ],
      },
      instructions: {
        scope: 'Use for production assistance, editing support, and content enhancement. Applies to video, audio, graphics, and multimedia.',
        guardrails: [
          'Follow brand and content guidelines',
          'Verify copyright and licensing',
          'Maintain content quality standards',
          'Preserve creative intent',
        ],
      },
      tools: generateTools('skill-media-creation'),
      exampleTasks: [
        'Generate video transcript with timestamps',
        'Suggest edits for pacing in video segment',
        'Create thumbnail variations for A/B test',
        'Auto-generate captions for accessibility',
      ],
    },
    toolsetPreset: {
      id: 'toolset-media-creation',
      name: 'Creation Tools',
      description: 'Tools for production, editing, and enhancement',
      mcpTools: generateTools('skill-media-creation'),
    },
  },
  {
    id: 'media-2',
    name: 'Content Distribution',
    description: 'Multi-channel publishing and syndication automation.',
    icon: 'CheckSquare',
    exampleActions: [
      'Publish video to YouTube and social channels',
      'Schedule content across platforms',
      'Syndicate article to partner sites',
      'Generate distribution report',
    ],
    agentPrompt: 'Your agent learns multi-channel distribution and publishing.',
    skill: {
      id: 'skill-media-distribution',
      name: 'Content Distribution',
      description: 'Multi-channel publishing automation',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Platform requirements, distribution strategies, and scheduling',
        sources: [
          {
            type: 'rag',
            name: 'Distribution Best Practices',
            description: 'Platform specs, timing strategies, cross-posting optimization',
          },
          {
            type: 'files',
            name: 'Platform Config',
            description: 'Channel credentials, format requirements, publishing rules',
          },
        ],
      },
      instructions: {
        scope: 'Use for content publishing, syndication, and distribution. Applies to video platforms, social media, websites, and partner channels.',
        guardrails: [
          'Follow platform-specific requirements',
          'Respect publishing schedules',
          'Verify content rights for each platform',
          'Track distribution performance',
        ],
      },
      tools: generateTools('skill-media-distribution'),
      exampleTasks: [
        'Publish video to YouTube and social channels',
        'Schedule content across platforms',
        'Syndicate article to partner sites',
        'Generate distribution report',
      ],
    },
    toolsetPreset: {
      id: 'toolset-media-distribution',
      name: 'Distribution Tools',
      description: 'Tools for publishing, scheduling, and syndication',
      mcpTools: generateTools('skill-media-distribution'),
    },
  },
  {
    id: 'media-3',
    name: 'Audience Analytics',
    description: 'Track engagement metrics and viewer behavior patterns.',
    icon: 'CheckSquare',
    exampleActions: [
      'Analyze engagement for latest video',
      'Identify trending topics with audience',
      'Track viewer retention across content',
      'Generate audience insights report',
    ],
    agentPrompt: 'Your agent learns audience analytics and engagement tracking.',
    skill: {
      id: 'skill-media-analytics',
      name: 'Audience Analytics',
      description: 'Engagement and behavior analysis',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Analytics platforms, engagement metrics, and audience insights',
        sources: [
          {
            type: 'rag',
            name: 'Analytics Methods',
            description: 'Engagement metrics, attribution, audience segmentation',
          },
          {
            type: 'files',
            name: 'Analytics Data',
            description: 'Platform analytics, audience demographics, engagement history',
          },
        ],
      },
      instructions: {
        scope: 'Use for audience analysis, engagement tracking, and content performance. Applies to views, likes, shares, comments, and watch time.',
        guardrails: [
          'Protect viewer privacy',
          'Use statistically valid samples',
          'Consider platform differences',
          'Identify actionable insights',
        ],
      },
      tools: generateTools('skill-media-analytics'),
      exampleTasks: [
        'Analyze engagement for latest video',
        'Identify trending topics with audience',
        'Track viewer retention across content',
        'Generate audience insights report',
      ],
    },
    toolsetPreset: {
      id: 'toolset-media-analytics',
      name: 'Analytics Tools',
      description: 'Tools for metrics, insights, and reporting',
      mcpTools: generateTools('skill-media-analytics'),
    },
  },
  {
    id: 'media-4',
    name: 'Content Moderation',
    description: 'Automated content review for policy and compliance.',
    icon: 'CheckSquare',
    exampleActions: [
      'Review user comments for violations',
      'Flag inappropriate content for review',
      'Check video for copyright issues',
      'Generate moderation activity report',
    ],
    agentPrompt: 'Your agent learns content moderation and policy enforcement.',
    skill: {
      id: 'skill-media-moderation',
      name: 'Content Moderation',
      description: 'Automated policy and compliance review',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Content policies, moderation guidelines, and compliance rules',
        sources: [
          {
            type: 'rag',
            name: 'Moderation Policies',
            description: 'Community guidelines, content policies, legal requirements',
          },
          {
            type: 'files',
            name: 'Moderation Rules',
            description: 'Blocklists, threshold settings, escalation procedures',
          },
        ],
      },
      instructions: {
        scope: 'Use for content review, policy enforcement, and compliance checking. Applies to user-generated content, comments, and uploads.',
        guardrails: [
          'Escalate ambiguous cases to humans',
          'Apply policies consistently',
          'Protect moderator wellbeing',
          'Document moderation decisions',
        ],
      },
      tools: generateTools('skill-media-moderation'),
      exampleTasks: [
        'Review user comments for violations',
        'Flag inappropriate content for review',
        'Check video for copyright issues',
        'Generate moderation activity report',
      ],
    },
    toolsetPreset: {
      id: 'toolset-media-moderation',
      name: 'Moderation Tools',
      description: 'Tools for review, flagging, and policy enforcement',
      mcpTools: generateTools('skill-media-moderation'),
    },
  },
  {
    id: 'media-5',
    name: 'Monetization & Ad Management',
    description: 'Optimize ad placement and revenue generation.',
    icon: 'CheckSquare',
    exampleActions: [
      'Optimize ad placement in video',
      'Analyze revenue by content type',
      'Test sponsorship integration formats',
      'Generate monetization report',
    ],
    agentPrompt: 'Your agent learns monetization and advertising optimization.',
    skill: {
      id: 'skill-media-monetization',
      name: 'Monetization',
      description: 'Ad optimization and revenue management',
      icon: 'CheckSquare',
      knowledge: {
        description: 'Monetization strategies, ad formats, and revenue optimization',
        sources: [
          {
            type: 'rag',
            name: 'Monetization Methods',
            description: 'Ad formats, pricing models, sponsorship strategies, yield optimization',
          },
          {
            type: 'files',
            name: 'Revenue Data',
            description: 'Ad performance, CPM rates, sponsorship deals, revenue history',
          },
        ],
      },
      instructions: {
        scope: 'Use for ad optimization, revenue analysis, and monetization strategy. Applies to video ads, sponsorships, and revenue management.',
        guardrails: [
          'Balance user experience with monetization',
          'Follow advertising policies',
          'Disclose sponsored content appropriately',
          'Track revenue attribution accurately',
        ],
      },
      tools: generateTools('skill-media-monetization'),
      exampleTasks: [
        'Optimize ad placement in video',
        'Analyze revenue by content type',
        'Test sponsorship integration formats',
        'Generate monetization report',
      ],
    },
    toolsetPreset: {
      id: 'toolset-media-monetization',
      name: 'Monetization Tools',
      description: 'Tools for ads, sponsorships, and revenue',
      mcpTools: generateTools('skill-media-monetization'),
    },
  },
];

// Enrich all capabilities with taxonomy data in their instructions
export const capabilities: Capability[] = rawCapabilities.map(cap => {
  const taxonomy = getTaxonomy(cap.id);
  if (taxonomy) {
    return {
      ...cap,
      skill: {
        ...cap.skill,
        instructions: {
          ...cap.skill.instructions,
          taxonomy,
        },
      },
    };
  }
  return cap;
});
