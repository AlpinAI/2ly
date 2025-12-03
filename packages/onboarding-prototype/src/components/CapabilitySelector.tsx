import { useState } from 'react';
import { CheckSquare, BookOpen, MessageCircle, Search, Send, Upload, FileText, Sparkles, X } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { cn } from '@/lib/utils';
import type { Capability } from '@/mocks/types';
import { INDUSTRIES, type Industry } from '@/mocks/industry-skills';

interface CapabilitySelectorProps {
  capabilities: Capability[];
  selectedCapability: Capability | null;
  onSelect: (capability: Capability) => void;
  onNext: () => void;
}

const iconMap = {
  CheckSquare,
  BookOpen,
  MessageCircle,
};

// Map capability IDs to industries
const CAPABILITY_INDUSTRY_MAP: Record<string, Industry> = {
  'mfg-1': 'manufacturing', 'mfg-2': 'manufacturing', 'mfg-3': 'manufacturing', 'mfg-4': 'manufacturing', 'mfg-5': 'manufacturing',
  'bank-1': 'banking', 'bank-2': 'banking', 'bank-3': 'banking', 'bank-4': 'banking', 'bank-5': 'banking',
  'tech-1': 'technology', 'tech-2': 'technology', 'tech-3': 'technology', 'tech-4': 'technology', 'tech-5': 'technology',
  'health-1': 'healthcare', 'health-2': 'healthcare', 'health-3': 'healthcare', 'health-4': 'healthcare', 'health-5': 'healthcare',
  'retail-1': 'retail', 'retail-2': 'retail', 'retail-3': 'retail', 'retail-4': 'retail', 'retail-5': 'retail',
  'edu-1': 'education', 'edu-2': 'education', 'edu-3': 'education', 'edu-4': 'education', 'edu-5': 'education',
  'fin-1': 'finance', 'fin-2': 'finance', 'fin-3': 'finance', 'fin-4': 'finance', 'fin-5': 'finance',
  'log-1': 'logistics', 'log-2': 'logistics', 'log-3': 'logistics', 'log-4': 'logistics', 'log-5': 'logistics',
  'cons-1': 'consulting', 'cons-2': 'consulting', 'cons-3': 'consulting', 'cons-4': 'consulting', 'cons-5': 'consulting',
  'media-1': 'media', 'media-2': 'media', 'media-3': 'media', 'media-4': 'media', 'media-5': 'media',
};

// Mock suggested skills for accountant role
interface SuggestedSkill {
  id: string;
  name: string;
  description: string;
  confidence: number;
}

const MOCK_ACCOUNTANT_SKILLS: SuggestedSkill[] = [
  {
    id: 'fin-4',
    name: 'Financial Forecasting',
    description: 'Predict revenue and expense trends',
    confidence: 95,
  },
  {
    id: 'fin-3',
    name: 'Regulatory Compliance',
    description: 'Automated compliance reporting and monitoring',
    confidence: 88,
  },
  {
    id: 'bank-4',
    name: 'Transaction Processing',
    description: 'Automate payment processing and reconciliation',
    confidence: 82,
  },
];

export function CapabilitySelector({
  capabilities,
  selectedCapability,
  onSelect,
  onNext,
}: CapabilitySelectorProps) {
  const [skillRequest, setSkillRequest] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>('technology');

  // Job description modal state
  const [showJobDescModal, setShowJobDescModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState<SuggestedSkill[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter capabilities by selected industry
  const filteredCapabilities = capabilities.filter(cap =>
    CAPABILITY_INDUSTRY_MAP[cap.id] === selectedIndustry
  );

  const handleSkillRequest = () => {
    if (skillRequest.trim()) {
      setIsSubmittingRequest(true);
      // Mock submission - in real app would send to backend
      setTimeout(() => {
        alert(`Skill request submitted: "${skillRequest}"\n\nWe'll notify you when this skill is available!`);
        setSkillRequest('');
        setIsSubmittingRequest(false);
      }, 1000);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setShowSuggestions(false);
      setSuggestedSkills([]);
    }
  };

  const handleAnalyzeJobDesc = () => {
    if (uploadedFile) {
      setIsAnalyzing(true);
      // Mock analysis - simulate AI processing
      setTimeout(() => {
        setSuggestedSkills(MOCK_ACCOUNTANT_SKILLS);
        setShowSuggestions(true);
        setIsAnalyzing(false);
      }, 2000);
    }
  };

  const handleSelectSuggestedSkill = (skillId: string) => {
    const capability = capabilities.find(cap => cap.id === skillId);
    if (capability) {
      onSelect(capability);
      setShowJobDescModal(false);
      // Reset modal state
      setUploadedFile(null);
      setSuggestedSkills([]);
      setShowSuggestions(false);
    }
  };

  const handleCloseModal = () => {
    setShowJobDescModal(false);
    setUploadedFile(null);
    setSuggestedSkills([]);
    setShowSuggestions(false);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          What Skill Should Your AI Agent Learn?
        </h2>
        <p className="text-muted-foreground text-lg">
          Each skill combines knowledge, instructions, and tools to make your agent capable
        </p>
      </div>

      {/* Industry Selector - More Prominent */}
      <div className="flex items-center justify-center gap-3 p-4 rounded-lg border bg-card">
        <label htmlFor="industry-select" className="text-sm font-medium text-foreground whitespace-nowrap">
          Filter by Industry:
        </label>
        <div className="w-full max-w-xs">
          <Select value={selectedIndustry} onValueChange={(value) => setSelectedIndustry(value as Industry)}>
            <SelectTrigger id="industry-select" className="border-primary/50">
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
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {filteredCapabilities.length} skills
        </span>
      </div>

      {/* Search/Request Bar and Job Desc Button */}
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="flex gap-3">
          {/* Search Bar - Fixed */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={skillRequest}
              onChange={(e) => setSkillRequest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSkillRequest()}
              placeholder="Request a skill... (e.g., 'Email management')"
              className="w-full pl-10 pr-28 py-3 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button
              onClick={handleSkillRequest}
              disabled={!skillRequest.trim() || isSubmittingRequest}
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 gap-1"
            >
              {isSubmittingRequest ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  Request
                </>
              )}
            </Button>
          </div>

          {/* Job Description Button */}
          <Button
            onClick={() => setShowJobDescModal(true)}
            variant="outline"
            className="gap-2 whitespace-nowrap"
          >
            <Upload className="h-4 w-4" />
            Add from job desc
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Or choose from our pre-built skills below
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCapabilities.map((capability) => {
          const Icon = iconMap[capability.icon as keyof typeof iconMap] || CheckSquare;
          const isSelected = selectedCapability?.id === capability.id;

          return (
            <button
              key={capability.id}
              onClick={() => onSelect(capability)}
              className={cn(
                'relative rounded-lg border-2 p-6 text-left transition-all hover:shadow-lg',
                isSelected
                  ? 'border-primary border-2 bg-primary/5 shadow-md scale-[1.02] ring-2 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/50 hover:scale-[1.01]'
              )}
            >
              <div className="space-y-4">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-lg',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-card-foreground">
                    {capability.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {capability.description}
                  </p>

                  {/* Taxonomy */}
                  {capability.skill.instructions.taxonomy && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                      <span className="font-medium">{capability.skill.instructions.taxonomy.department}</span>
                      <span>→</span>
                      <span>{capability.skill.instructions.taxonomy.role}</span>
                    </div>
                  )}
                </div>

                {/* Skill Components */}
                <div className="space-y-1 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Knowledge</span>
                    <span className="text-blue-600 font-medium">{capability.skill.knowledge.sources.length} sources</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Instructions</span>
                    <span className="text-purple-600 font-medium">{capability.skill.instructions.guardrails.length} guardrails</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tools</span>
                    <span className="text-green-600 font-medium">{capability.skill.tools.length} MCP tools</span>
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!selectedCapability}
          size="lg"
        >
          Continue
        </Button>
      </div>

      {/* Job Description Upload Modal */}
      <Dialog open={showJobDescModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Add Skills from Job Description
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Upload Section */}
            {!showSuggestions && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a job description and we'll analyze it to suggest relevant skills for your AI agent.
                </p>

                {/* File Upload Area */}
                <div
                  className={cn(
                    'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                    uploadedFile
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 bg-muted/30'
                  )}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="job-desc-upload"
                  />
                  <div className="space-y-3">
                    {uploadedFile ? (
                      <>
                        <FileText className="h-12 w-12 mx-auto text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedFile(null);
                          }}
                          className="gap-1"
                        >
                          <X className="h-3 w-3" />
                          Remove
                        </Button>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">
                            Drop your job description here or click to browse
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Supports PDF, DOC, DOCX, TXT
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Analyze Button */}
                <Button
                  onClick={handleAnalyzeJobDesc}
                  disabled={!uploadedFile || isAnalyzing}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      Analyzing job description...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analyze & Suggest Skills
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Suggestions Section */}
            {showSuggestions && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Suggested Skills</h3>
                    <p className="text-sm text-muted-foreground">
                      Based on the job description analysis
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowSuggestions(false);
                      setUploadedFile(null);
                    }}
                  >
                    Upload New File
                  </Button>
                </div>

                {/* Suggested Skills Cards */}
                <div className="space-y-3">
                  {suggestedSkills.map((skill) => {
                    const capability = capabilities.find(cap => cap.id === skill.id);
                    if (!capability) return null;

                    return (
                      <button
                        key={skill.id}
                        onClick={() => handleSelectSuggestedSkill(skill.id)}
                        className="w-full p-4 rounded-lg border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-left group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground group-hover:text-primary">
                                {skill.name}
                              </h4>
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                                {skill.confidence}% match
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {skill.description}
                            </p>
                            {capability.skill.instructions.taxonomy && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="font-medium">
                                  {capability.skill.instructions.taxonomy.department}
                                </span>
                                <span>→</span>
                                <span>{capability.skill.instructions.taxonomy.role}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              <span className="text-lg">+</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Click on a skill to add it to your selection
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
