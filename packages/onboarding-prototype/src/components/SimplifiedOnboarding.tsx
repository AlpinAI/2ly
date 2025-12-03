import { useState } from 'react';
import { ArrowRight, Sparkles, MessageSquare, Copy, Check, BookOpen, ClipboardList, Wrench, Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { SkillTryChat } from './SkillTryChat';
import type { Capability, Skill, MockMCPTool } from '@/mocks/types';
import { capabilities } from '@/mocks/capabilities';
import { INDUSTRIES, INDUSTRY_TEMPLATE_SKILLS, type Industry } from '@/mocks/industry-skills';

type Step = 'select' | 'configure' | 'integrate' | 'complete';
type ConfigSection = 'instructions' | 'knowledge' | 'tools';
type KnowledgeSource = { type: 'rag' | 'files'; name: string; description: string };

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

interface Platform {
  id: string;
  name: string;
  icon: string;
  popular?: boolean;
}

const PLATFORMS: Platform[] = [
  { id: 'chatgpt', name: 'ChatGPT', icon: '💬', popular: true },
  { id: 'claude', name: 'Claude', icon: '✨', popular: true },
  { id: 'copilot', name: 'Microsoft 365', icon: '🏢', popular: true },
  { id: 'cursor', name: 'Cursor', icon: '🖱️' },
  { id: 'langchain', name: 'LangChain', icon: '🔗' },
  { id: 'n8n', name: 'n8n', icon: '⚡' },
];

export function SimplifiedOnboarding() {
  const [step, setStep] = useState<Step>('select');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>('technology');
  const [selectedCapability, setSelectedCapability] = useState<Capability | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showTryChat, setShowTryChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeConfigSection, setActiveConfigSection] = useState<ConfigSection>('instructions');

  // Editable skill state
  const [editedSkill, setEditedSkill] = useState<Skill | null>(null);

  const filteredCapabilities = capabilities.filter(
    cap => CAPABILITY_INDUSTRY_MAP[cap.id] === selectedIndustry
  );

  // Get current skill (either edited or original)
  const currentSkill = editedSkill || selectedCapability?.skill;

  const handleCopyCode = () => {
    const code = generateIntegrationCode();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateIntegrationCode = () => {
    if (!currentSkill) return '';

    return `// ${selectedPlatform?.toUpperCase()} Integration
{
  "skill": "${currentSkill.name}",
  "tools": ${JSON.stringify(currentSkill.tools.slice(0, 3).map(t => t.name))},
  "instructions": "${currentSkill.instructions.scope.substring(0, 100)}...",
  "guardrails": ${JSON.stringify(currentSkill.instructions.guardrails.slice(0, 2))}
}`;
  };

  // Initialize edited skill when capability is selected
  const handleCapabilitySelect = (capability: Capability) => {
    setSelectedCapability(capability);
    setEditedSkill(JSON.parse(JSON.stringify(capability.skill))); // Deep clone
    setStep('configure');
  };

  // Edit handlers
  const handleUpdateScope = (newScope: string) => {
    if (!editedSkill) return;
    setEditedSkill({
      ...editedSkill,
      instructions: {
        ...editedSkill.instructions,
        scope: newScope
      }
    });
  };

  const handleUpdateGuardrail = (index: number, value: string) => {
    if (!editedSkill) return;
    const newGuardrails = [...editedSkill.instructions.guardrails];
    newGuardrails[index] = value;
    setEditedSkill({
      ...editedSkill,
      instructions: {
        ...editedSkill.instructions,
        guardrails: newGuardrails
      }
    });
  };

  const handleAddGuardrail = () => {
    if (!editedSkill) return;
    setEditedSkill({
      ...editedSkill,
      instructions: {
        ...editedSkill.instructions,
        guardrails: [...editedSkill.instructions.guardrails, 'New guardrail']
      }
    });
  };

  const handleRemoveGuardrail = (index: number) => {
    if (!editedSkill) return;
    setEditedSkill({
      ...editedSkill,
      instructions: {
        ...editedSkill.instructions,
        guardrails: editedSkill.instructions.guardrails.filter((_, i) => i !== index)
      }
    });
  };

  const handleAddKnowledgeSource = () => {
    if (!editedSkill) return;
    const newSource: KnowledgeSource = {
      type: 'files',
      name: 'New Source',
      description: 'Description of the source'
    };
    setEditedSkill({
      ...editedSkill,
      knowledge: {
        ...editedSkill.knowledge,
        sources: [...editedSkill.knowledge.sources, newSource]
      }
    });
  };

  const handleUpdateKnowledgeSource = (index: number, field: keyof KnowledgeSource, value: string) => {
    if (!editedSkill) return;
    const newSources = [...editedSkill.knowledge.sources];
    newSources[index] = { ...newSources[index], [field]: value };
    setEditedSkill({
      ...editedSkill,
      knowledge: {
        ...editedSkill.knowledge,
        sources: newSources
      }
    });
  };

  const handleRemoveKnowledgeSource = (index: number) => {
    if (!editedSkill) return;
    setEditedSkill({
      ...editedSkill,
      knowledge: {
        ...editedSkill.knowledge,
        sources: editedSkill.knowledge.sources.filter((_, i) => i !== index)
      }
    });
  };

  const handleAddTool = () => {
    if (!editedSkill) return;
    const newTool: MockMCPTool = {
      id: `tool-${Date.now()}`,
      name: 'new_tool',
      description: 'Description of the tool',
      mcpServerName: 'custom',
      category: 'processing',
      inputSchema: { type: 'object' }
    };
    setEditedSkill({
      ...editedSkill,
      tools: [...editedSkill.tools, newTool]
    });
  };

  const handleUpdateTool = (index: number, field: 'name' | 'description', value: string) => {
    if (!editedSkill) return;
    const newTools = [...editedSkill.tools];
    newTools[index] = { ...newTools[index], [field]: value };
    setEditedSkill({
      ...editedSkill,
      tools: newTools
    });
  };

  const handleRemoveTool = (index: number) => {
    if (!editedSkill) return;
    setEditedSkill({
      ...editedSkill,
      tools: editedSkill.tools.filter((_, i) => i !== index)
    });
  };

  // STEP 1: Select Skill
  if (step === 'select') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Simple Progress */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-2 text-primary">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-sm font-medium">Choose</span>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-border" />
            <span className="text-sm">Configure</span>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-border" />
            <span className="text-sm">Integrate</span>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-foreground">
            What should your AI do?
          </h1>
          <p className="text-xl text-muted-foreground">
            Pick a skill, we'll handle the rest
          </p>
        </div>

        {/* Industry Quick Filter */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {Object.entries(INDUSTRIES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedIndustry(key as Industry)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedIndustry === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Simple Skill Cards */}
        <div className="grid md:grid-cols-5 gap-4">
          {filteredCapabilities.map((capability) => {
            const templateSkill = INDUSTRY_TEMPLATE_SKILLS[selectedIndustry]?.find(ts => ts.id === capability.id);
            return (
              <button
                key={capability.id}
                onClick={() => handleCapabilitySelect(capability)}
                className="group relative p-6 rounded-xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all text-left"
              >
                <div className="space-y-3">
                  <div className="text-4xl mx-auto text-center">
                    {capability.icon === 'CheckSquare' ? '✅' :
                     capability.icon === 'BookOpen' ? '📚' :
                     capability.icon === 'MessageCircle' ? '💬' : '🤖'}
                  </div>
                  <h3 className="font-semibold text-sm text-foreground line-clamp-2 text-center">
                    {capability.name}
                  </h3>
                  {templateSkill?.taxonomy && (
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <div className="truncate">
                        <span className="font-medium">{templateSkill.taxonomy.department}</span>
                      </div>
                      <div className="truncate">
                        {templateSkill.taxonomy.role}
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // STEP 2: Configure
  if (step === 'configure' && selectedCapability && currentSkill) {
    const sections = [
      { id: 'instructions' as ConfigSection, label: 'Instructions', icon: ClipboardList, color: 'purple' },
      { id: 'knowledge' as ConfigSection, label: 'Knowledge', icon: BookOpen, color: 'blue' },
      { id: 'tools' as ConfigSection, label: 'Tools', icon: Wrench, color: 'green' },
    ];

    const templateSkill = INDUSTRY_TEMPLATE_SKILLS[selectedIndustry]?.find(ts => ts.id === selectedCapability.id);

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-sm">Choose</span>
          </div>
          <div className="h-px w-8 bg-primary" />
          <div className="flex items-center gap-2 text-primary">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-sm font-medium">Configure</span>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-border" />
            <span className="text-sm">Integrate</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-foreground">{currentSkill.name}</h2>
          <p className="text-lg text-muted-foreground">{currentSkill.description}</p>

          {/* Taxonomy Breadcrumb */}
          {templateSkill?.taxonomy && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>{templateSkill.taxonomy.industry}</span>
              <span>→</span>
              <span>{templateSkill.taxonomy.department}</span>
              <span>→</span>
              <span>{templateSkill.taxonomy.role}</span>
            </div>
          )}

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="text-muted-foreground">{currentSkill.knowledge.sources.length} sources</span>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-purple-600" />
              <span className="text-muted-foreground">{currentSkill.instructions.guardrails.length} guardrails</span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">{currentSkill.tools.length} tools</span>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center justify-center gap-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeConfigSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveConfigSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                  isActive
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Card */}
        <div className="rounded-xl border-2 border-primary/20 bg-card p-6 min-h-[300px]">
          {activeConfigSection === 'instructions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Instructions</h3>

              <div>
                <div className="text-sm font-medium text-purple-600 mb-2">SCOPE</div>
                <textarea
                  value={currentSkill.instructions.scope}
                  onChange={(e) => handleUpdateScope(e.target.value)}
                  className="w-full min-h-[80px] p-3 text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Define the scope of this skill..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-purple-600">GUARDRAILS</div>
                  <Button onClick={handleAddGuardrail} variant="ghost" size="sm" className="gap-1 h-7">
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {currentSkill.instructions.guardrails.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <input
                        type="text"
                        value={rule}
                        onChange={(e) => handleUpdateGuardrail(idx, e.target.value)}
                        className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <Button
                        onClick={() => handleRemoveGuardrail(idx)}
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeConfigSection === 'knowledge' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-foreground">Knowledge Sources</h3>
                <Button onClick={handleAddKnowledgeSource} variant="ghost" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Source
                </Button>
              </div>
              <div className="space-y-3">
                {currentSkill.knowledge.sources.map((source, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-muted/30 space-y-3">
                    <div className="flex items-start gap-3">
                      <select
                        value={source.type}
                        onChange={(e) => handleUpdateKnowledgeSource(idx, 'type', e.target.value)}
                        className="px-2 py-1 text-xs rounded border bg-background text-foreground uppercase font-mono"
                      >
                        <option value="rag">RAG</option>
                        <option value="files">FILES</option>
                      </select>
                      <input
                        type="text"
                        value={source.name}
                        onChange={(e) => handleUpdateKnowledgeSource(idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-1 text-sm font-medium rounded border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Source name"
                      />
                      <Button
                        onClick={() => handleRemoveKnowledgeSource(idx)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <input
                      type="text"
                      value={source.description}
                      onChange={(e) => handleUpdateKnowledgeSource(idx, 'description', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded border bg-background text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Source description"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeConfigSection === 'tools' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-foreground">MCP Tools</h3>
                <Button onClick={handleAddTool} variant="ghost" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Tool
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {currentSkill.tools.map((tool, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                    <div className="flex items-start gap-2">
                      <input
                        type="text"
                        value={tool.name}
                        onChange={(e) => handleUpdateTool(idx, 'name', e.target.value)}
                        className="flex-1 px-2 py-1 text-xs font-mono rounded border bg-background text-green-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="tool_name"
                      />
                      <Button
                        onClick={() => handleRemoveTool(idx)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <input
                      type="text"
                      value={tool.description}
                      onChange={(e) => handleUpdateTool(idx, 'description', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border bg-background text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Tool description"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Try Button */}
        <Button
          onClick={() => setShowTryChat(true)}
          variant="secondary"
          size="lg"
          className="w-full gap-2"
        >
          <MessageSquare className="h-5 w-5" />
          Try This Skill
        </Button>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={() => setStep('select')} variant="outline" size="lg" className="flex-1">
            Back
          </Button>
          <Button onClick={() => setStep('integrate')} size="lg" className="flex-1 gap-2">
            Continue to Integration
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat Modal */}
        <SkillTryChat
          open={showTryChat}
          onOpenChange={setShowTryChat}
          capability={selectedCapability}
        />
      </div>
    );
  }

  // STEP 3: Integrate
  if (step === 'integrate' && selectedCapability) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-sm">Choose</span>
          </div>
          <div className="h-px w-8 bg-primary" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-sm">Configure</span>
          </div>
          <div className="h-px w-8 bg-primary" />
          <div className="flex items-center gap-2 text-primary">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-sm font-medium">Integrate</span>
          </div>
        </div>

        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-foreground">Choose Your Integration</h2>
          <p className="text-lg text-muted-foreground">Pick your AI platform</p>
        </div>

        {/* Platform Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => {
                setSelectedPlatform(platform.id);
                setStep('complete');
              }}
              className="relative p-8 rounded-xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all group"
            >
              {platform.popular && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                  Popular
                </div>
              )}
              <div className="space-y-3 text-center">
                <div className="text-5xl mx-auto">{platform.icon}</div>
                <h3 className="font-semibold text-lg text-foreground">{platform.name}</h3>
                <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={() => setStep('configure')} variant="outline" size="lg" className="flex-1">
            Back
          </Button>
        </div>
      </div>
    );
  }

  // STEP 4: Complete
  if (step === 'complete' && selectedCapability && selectedPlatform && currentSkill) {
    const platform = PLATFORMS.find(p => p.id === selectedPlatform);

    return (
      <>
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Success Animation */}
          <div className="text-center space-y-4">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary animate-bounce">
              <Sparkles className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">You're All Set! 🎉</h2>
            <p className="text-lg text-muted-foreground">
              Your <span className="font-semibold text-foreground">{currentSkill.name}</span> skill is ready for{' '}
              <span className="font-semibold text-foreground">{platform?.name}</span>
            </p>
          </div>

        {/* Code Block */}
        <div className="rounded-lg border bg-muted/30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
            <span className="text-sm font-mono text-muted-foreground">config.json</span>
            <Button onClick={handleCopyCode} variant="ghost" size="sm" className="gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <pre className="p-4 text-sm font-mono overflow-x-auto">
            <code>{generateIntegrationCode()}</code>
          </pre>
        </div>

        {/* Simple Steps */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Next Steps:</h3>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
                1
              </span>
              <span className="text-sm text-muted-foreground pt-0.5">
                Copy the code above
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
                2
              </span>
              <span className="text-sm text-muted-foreground pt-0.5">
                Paste it into {platform?.name} settings
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
                3
              </span>
              <span className="text-sm text-muted-foreground pt-0.5">
                Start using your AI skill!
              </span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setStep('select');
              setSelectedCapability(null);
              setSelectedPlatform(null);
            }}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Create Another
          </Button>
          <Button
            onClick={() => window.open(`https://${platform?.name.toLowerCase()}.com`, '_blank')}
            size="lg"
            className="flex-1 gap-2"
          >
            Open {platform?.name}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        </div>

        {/* Chat Modal */}
        {selectedCapability && (
          <SkillTryChat
            open={showTryChat}
            onOpenChange={setShowTryChat}
            capability={selectedCapability}
          />
        )}
      </>
    );
  }

  // Fallback with Chat Modal for other steps
  return selectedCapability ? (
    <SkillTryChat
      open={showTryChat}
      onOpenChange={setShowTryChat}
      capability={selectedCapability}
    />
  ) : null;
}
