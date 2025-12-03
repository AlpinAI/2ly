/**
 * OnboardingSection Component
 *
 * WHY: Container component for onboarding cards with grid layout.
 * Only shows when there are pending onboarding steps.
 *
 * WHAT IT SHOWS:
 * - Section title "Get Started with 2LY"
 * - Grid layout for onboarding cards
 * - Responsive design (1 column on mobile, 3 on desktop)
 *
 * USAGE:
 * ```tsx
 * import { OnboardingSection } from '@/components/onboarding/onboarding-section';
 * import { useOnboarding } from '@/hooks/useOnboarding';
 * 
 * function DashboardPage() {
 *   const { pendingSteps } = useOnboarding();
 *   
 *   return (
 *     <div>
 *       {pendingSteps.length > 0 && (
 *         <OnboardingSection steps={pendingSteps} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

import { OnboardingCard } from './onboarding-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { OnboardingStep } from '@/graphql/generated/graphql';
import { useState } from 'react';

interface OnboardingSectionProps {
  steps: OnboardingStep[];
  isComplete: boolean;
  onHide: () => void;
}

type Industry =
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

interface TemplateSkill {
  id: string;
  name: string;
  description: string;
  category: string;
}

const INDUSTRIES: Record<Industry, string> = {
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

const INDUSTRY_TEMPLATE_SKILLS: Record<Industry, TemplateSkill[]> = {
  manufacturing: [
    { id: 'mfg-1', name: 'Production Planning & Scheduling', description: 'Optimize production schedules and resource allocation', category: 'Operations' },
    { id: 'mfg-2', name: 'Quality Control & Inspection', description: 'Automated defect detection and quality assurance', category: 'Quality' },
    { id: 'mfg-3', name: 'Supply Chain Management', description: 'Track inventory and manage supplier relationships', category: 'Supply Chain' },
    { id: 'mfg-4', name: 'Predictive Maintenance', description: 'Monitor equipment health and predict failures', category: 'Maintenance' },
    { id: 'mfg-5', name: 'Process Optimization', description: 'Analyze and improve manufacturing workflows', category: 'Operations' },
  ],
  banking: [
    { id: 'bank-1', name: 'Fraud Detection & Prevention', description: 'Real-time transaction monitoring and anomaly detection', category: 'Risk' },
    { id: 'bank-2', name: 'Customer Onboarding & KYC', description: 'Automated identity verification and compliance checks', category: 'Compliance' },
    { id: 'bank-3', name: 'Credit Risk Assessment', description: 'Evaluate creditworthiness and loan applications', category: 'Risk' },
    { id: 'bank-4', name: 'Transaction Processing', description: 'Automate payment processing and reconciliation', category: 'Operations' },
    { id: 'bank-5', name: 'Customer Support Automation', description: 'AI-powered chatbots for account inquiries', category: 'Customer Service' },
  ],
  technology: [
    { id: 'tech-1', name: 'Code Review & Analysis', description: 'Automated code quality checks and security scans', category: 'Development' },
    { id: 'tech-2', name: 'DevOps & CI/CD Pipeline', description: 'Continuous integration and deployment automation', category: 'DevOps' },
    { id: 'tech-3', name: 'Bug Tracking & Resolution', description: 'Intelligent issue triage and assignment', category: 'Support' },
    { id: 'tech-4', name: 'Documentation Generation', description: 'Auto-generate API docs and user guides', category: 'Documentation' },
    { id: 'tech-5', name: 'Performance Monitoring', description: 'Track system metrics and application health', category: 'Operations' },
  ],
  healthcare: [
    { id: 'health-1', name: 'Patient Records Management', description: 'Secure access and management of medical records', category: 'Administration' },
    { id: 'health-2', name: 'Appointment Scheduling', description: 'Optimize patient appointments and resource allocation', category: 'Operations' },
    { id: 'health-3', name: 'Diagnostic Assistance', description: 'AI-assisted medical image analysis and diagnosis', category: 'Clinical' },
    { id: 'health-4', name: 'Prescription Management', description: 'Automated prescription validation and drug interactions', category: 'Pharmacy' },
    { id: 'health-5', name: 'Insurance Claims Processing', description: 'Streamline claims submission and verification', category: 'Billing' },
  ],
  retail: [
    { id: 'retail-1', name: 'Inventory Management', description: 'Track stock levels and automate reordering', category: 'Supply Chain' },
    { id: 'retail-2', name: 'Customer Behavior Analysis', description: 'Analyze shopping patterns and preferences', category: 'Analytics' },
    { id: 'retail-3', name: 'Dynamic Pricing', description: 'Optimize pricing based on demand and competition', category: 'Pricing' },
    { id: 'retail-4', name: 'Personalized Recommendations', description: 'Product recommendations based on customer data', category: 'Marketing' },
    { id: 'retail-5', name: 'Order Fulfillment', description: 'Automate picking, packing, and shipping', category: 'Operations' },
  ],
  education: [
    { id: 'edu-1', name: 'Student Enrollment & Registration', description: 'Streamline admissions and course registration', category: 'Administration' },
    { id: 'edu-2', name: 'Learning Path Personalization', description: 'Adaptive learning based on student performance', category: 'Learning' },
    { id: 'edu-3', name: 'Grading & Assessment', description: 'Automated grading and feedback generation', category: 'Assessment' },
    { id: 'edu-4', name: 'Content Recommendation', description: 'Suggest relevant courses and materials', category: 'Content' },
    { id: 'edu-5', name: 'Student Support Services', description: 'AI tutoring and academic assistance', category: 'Support' },
  ],
  finance: [
    { id: 'fin-1', name: 'Portfolio Management', description: 'Optimize investment portfolios and asset allocation', category: 'Investment' },
    { id: 'fin-2', name: 'Market Analysis & Trading', description: 'Real-time market data analysis and trade execution', category: 'Trading' },
    { id: 'fin-3', name: 'Regulatory Compliance', description: 'Automated compliance reporting and monitoring', category: 'Compliance' },
    { id: 'fin-4', name: 'Financial Forecasting', description: 'Predict revenue and expense trends', category: 'Planning' },
    { id: 'fin-5', name: 'Risk Management', description: 'Identify and mitigate financial risks', category: 'Risk' },
  ],
  logistics: [
    { id: 'log-1', name: 'Route Optimization', description: 'Calculate optimal delivery routes and schedules', category: 'Transportation' },
    { id: 'log-2', name: 'Warehouse Management', description: 'Track inventory location and movement', category: 'Warehousing' },
    { id: 'log-3', name: 'Shipment Tracking', description: 'Real-time tracking and delivery updates', category: 'Tracking' },
    { id: 'log-4', name: 'Demand Forecasting', description: 'Predict shipping volume and capacity needs', category: 'Planning' },
    { id: 'log-5', name: 'Carrier Selection', description: 'Match shipments with optimal carriers', category: 'Transportation' },
  ],
  consulting: [
    { id: 'cons-1', name: 'Client Engagement Management', description: 'Track projects, deliverables, and milestones', category: 'Project Management' },
    { id: 'cons-2', name: 'Market Research & Analysis', description: 'Gather and analyze industry data and trends', category: 'Research' },
    { id: 'cons-3', name: 'Report Generation', description: 'Automated insights and recommendation reports', category: 'Reporting' },
    { id: 'cons-4', name: 'Resource Allocation', description: 'Match consultants to client engagements', category: 'Operations' },
    { id: 'cons-5', name: 'Knowledge Management', description: 'Organize and share best practices and case studies', category: 'Knowledge' },
  ],
  media: [
    { id: 'media-1', name: 'Content Creation & Editing', description: 'AI-assisted video and audio production', category: 'Production' },
    { id: 'media-2', name: 'Content Distribution', description: 'Multi-channel publishing and syndication', category: 'Distribution' },
    { id: 'media-3', name: 'Audience Analytics', description: 'Track engagement and viewer behavior', category: 'Analytics' },
    { id: 'media-4', name: 'Content Moderation', description: 'Automated content review and compliance', category: 'Compliance' },
    { id: 'media-5', name: 'Monetization & Ad Management', description: 'Optimize ad placement and revenue', category: 'Revenue' },
  ],
};

export function OnboardingSection({ steps, isComplete, onHide }: OnboardingSectionProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>('technology');
  const templateSkills = INDUSTRY_TEMPLATE_SKILLS[selectedIndustry];

  if (steps.length === 0) {
    return null;
  }

  // Find the current step (first PENDING step by priority)
  const currentStep = steps.find(step => step.status === 'PENDING');

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-[500px] xl:max-w-7xl">
        {/* Header with Title and Industry Selector */}
        <div className="mb-8">
          {/* Industry Selector - Top Right */}
          <div className="flex justify-end mb-4">
            <div className="w-64">
              <Select value={selectedIndustry} onValueChange={(value) => setSelectedIndustry(value as Industry)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INDUSTRIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Centered Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Get Started with 2LY
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Complete these steps to set up your workspace and start using MCP tools.
            </p>
          </div>
        </div>
        
        {/* Cards Grid - 1 column or 3 columns, no 2+1 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {steps.map((step) => (
            <OnboardingCard
              key={step.id}
              step={step}
              isCurrentStep={step.id === currentStep?.id}
            />
          ))}
        </div>

        {/* Template Skills Section */}
        <div className="mb-8">
          <div className="mb-4 text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Recommended Skills for {INDUSTRIES[selectedIndustry]}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pre-configured AI skills tailored for your industry
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {templateSkills.map((skill) => (
              <div
                key={skill.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-cyan-500 dark:hover:border-cyan-400 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 px-2 py-1 rounded">
                    {skill.category}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {skill.name}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {skill.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Centered Dismiss/Close Button */}
        <div className="flex justify-center mb-8">
          {isComplete ? (
            <Button
              onClick={onHide}
              size="lg"
              variant="default"
            >
              Close onboarding
            </Button>
          ) : (
            <button
              onClick={onHide}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Dismiss onboarding
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
