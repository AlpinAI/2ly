import { useState } from 'react';
import { Plus, X, Bot, BookOpen, ClipboardList, Wrench, GraduationCap, Upload, Link as LinkIcon, Pencil, Trash2, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { SkillTryChat } from './SkillTryChat';
import type { MockMCPTool, Capability } from '@/mocks/types';
import { allAvailableTools } from '@/mocks/tools';

interface ToolsetPreviewProps {
  capability: Capability;
  onNext: () => void;
  onBack: () => void;
}

interface KnowledgeSource {
  type: 'rag' | 'files';
  name: string;
  description: string;
}

type SubStep = 'instructions' | 'knowledge' | 'tools';

export function ToolsetPreview({ capability, onNext, onBack }: ToolsetPreviewProps) {
  const skill = capability.skill;
  const [currentSubStep, setCurrentSubStep] = useState<SubStep>('instructions');
  const [selectedTools, setSelectedTools] = useState<MockMCPTool[]>(skill.tools);
  const [showToolPicker, setShowToolPicker] = useState(false);
  const [showTryChat, setShowTryChat] = useState(false);

  // Instructions state
  const [scope, setScope] = useState(skill.instructions.scope);
  const [guardrails, setGuardrails] = useState<string[]>(skill.instructions.guardrails);
  const [isEditingScope, setIsEditingScope] = useState(false);
  const [newGuardrail, setNewGuardrail] = useState('');

  // Knowledge state
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>(skill.knowledge.sources);
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);

  const addTool = (tool: MockMCPTool) => {
    if (!selectedTools.find(t => t.id === tool.id)) {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const removeTool = (toolId: string) => {
    setSelectedTools(selectedTools.filter(t => t.id !== toolId));
  };

  const availableToAdd = allAvailableTools.filter(
    tool => !selectedTools.find(t => t.id === tool.id)
  );

  const categorizedTools = {
    input: selectedTools.filter(t => t.category === 'input'),
    processing: selectedTools.filter(t => t.category === 'processing'),
    output: selectedTools.filter(t => t.category === 'output'),
  };

  const addGuardrail = () => {
    if (newGuardrail.trim()) {
      setGuardrails([...guardrails, newGuardrail.trim()]);
      setNewGuardrail('');
    }
  };

  const removeGuardrail = (index: number) => {
    setGuardrails(guardrails.filter((_, i) => i !== index));
  };

  const addKnowledgeSource = (type: 'rag' | 'files') => {
    const mockSource: KnowledgeSource = {
      type,
      name: type === 'rag' ? 'New RAG Connection' : 'Uploaded Documents',
      description: type === 'rag' ? 'Connected vector database' : 'PDF, markdown, and text files',
    };
    setKnowledgeSources([...knowledgeSources, mockSource]);
    setShowAddKnowledge(false);
  };

  const removeKnowledgeSource = (index: number) => {
    setKnowledgeSources(knowledgeSources.filter((_, i) => i !== index));
  };

  const subSteps = [
    { id: 'instructions' as SubStep, label: 'Instructions', icon: ClipboardList },
    { id: 'knowledge' as SubStep, label: 'Knowledge', icon: BookOpen },
    { id: 'tools' as SubStep, label: 'Tools', icon: Wrench },
  ];

  const handleSubStepNext = () => {
    if (currentSubStep === 'instructions') {
      setCurrentSubStep('knowledge');
    } else if (currentSubStep === 'knowledge') {
      setCurrentSubStep('tools');
    } else {
      onNext();
    }
  };

  const handleSubStepBack = () => {
    if (currentSubStep === 'instructions') {
      onBack();
    } else if (currentSubStep === 'knowledge') {
      setCurrentSubStep('instructions');
    } else {
      setCurrentSubStep('knowledge');
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">{skill.name} Skill</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {skill.description}
        </p>
      </div>

      {/* Sub-step Progress */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2">
          {subSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentSubStep === step.id;
            const isCompleted =
              (step.id === 'instructions' && ['knowledge', 'tools'].includes(currentSubStep)) ||
              (step.id === 'knowledge' && currentSubStep === 'tools');

            return (
              <div key={step.id} className="flex items-center">
                {index > 0 && (
                  <div
                    className={`w-8 h-0.5 ${
                      isCompleted ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
                <button
                  onClick={() => setCurrentSubStep(step.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card hover:bg-accent transition-colors"
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isActive
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? '✓' : <Icon className="h-3 w-3" />}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* 1. Instructions */}
        {currentSubStep === 'instructions' && (
        <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-5">
          <div className="flex items-start gap-3">
            <ClipboardList className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <h3 className="font-semibold text-foreground">Instructions</h3>

              {/* Taxonomy */}
              {skill.instructions.taxonomy && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-purple-500/10 rounded px-3 py-2">
                  <span className="font-medium text-purple-600">Role:</span>
                  <span>{skill.instructions.taxonomy.industry}</span>
                  <span>→</span>
                  <span>{skill.instructions.taxonomy.department}</span>
                  <span>→</span>
                  <span className="font-medium">{skill.instructions.taxonomy.role}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Scope</div>
                    <button
                      onClick={() => setIsEditingScope(!isEditingScope)}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                  {isEditingScope ? (
                    <textarea
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                      className="w-full text-sm text-foreground bg-card border border-purple-500/20 rounded p-2 min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      onBlur={() => setIsEditingScope(false)}
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{scope}</p>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1.5">Guardrails</div>
                  <ul className="space-y-1">
                    {guardrails.map((guardrail, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2 group">
                        <span className="text-purple-600 mt-1">•</span>
                        <span className="flex-1">{guardrail}</span>
                        <button
                          onClick={() => removeGuardrail(idx)}
                          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newGuardrail}
                      onChange={(e) => setNewGuardrail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addGuardrail()}
                      placeholder="Add a guardrail..."
                      className="flex-1 text-sm text-foreground bg-card border border-purple-500/20 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                    <Button
                      onClick={addGuardrail}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* 2. Knowledge */}
        {currentSubStep === 'knowledge' && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-5">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Knowledge</h3>
                <Button
                  onClick={() => setShowAddKnowledge(!showAddKnowledge)}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  Add Source
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{skill.knowledge.description}</p>

              {/* Add Knowledge Source Picker */}
              {showAddKnowledge && (
                <div className="rounded-lg border border-blue-600/20 bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-semibold text-foreground">Add Knowledge Source</h5>
                    <button onClick={() => setShowAddKnowledge(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addKnowledgeSource('rag')}
                      className="flex items-center gap-2 text-left rounded border bg-card p-3 hover:bg-accent transition-colors"
                    >
                      <LinkIcon className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium">Connect RAG</div>
                        <div className="text-xs text-muted-foreground">Vector database</div>
                      </div>
                    </button>
                    <button
                      onClick={() => addKnowledgeSource('files')}
                      className="flex items-center gap-2 text-left rounded border bg-card p-3 hover:bg-accent transition-colors"
                    >
                      <Upload className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium">Upload Files</div>
                        <div className="text-xs text-muted-foreground">Documents, PDFs</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 mt-3">
                {knowledgeSources.map((source, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm group">
                    <span className="text-blue-600 font-mono text-xs mt-0.5 uppercase px-1.5 py-0.5 rounded bg-blue-600/10 flex items-center gap-1">
                      {source.type === 'rag' ? <LinkIcon className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
                      {source.type}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{source.name}</div>
                      <div className="text-xs text-muted-foreground">{source.description}</div>
                    </div>
                    <button
                      onClick={() => removeKnowledgeSource(idx)}
                      className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* 3. Tools */}
        {currentSubStep === 'tools' && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-5">
          <div className="flex items-start gap-3">
            <Wrench className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Tools ({selectedTools.length} MCP tools)</h3>
                <Button
                  onClick={() => setShowToolPicker(!showToolPicker)}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  Add Tools
                </Button>
              </div>

              {/* Tool Picker */}
              {showToolPicker && availableToAdd.length > 0 && (
                <div className="rounded-lg border border-green-600/20 bg-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-semibold text-foreground">Add Tools</h5>
                    <button onClick={() => setShowToolPicker(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {availableToAdd.map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => addTool(tool)}
                        className="text-left rounded border bg-card p-2 hover:bg-accent transition-colors text-xs"
                      >
                        <div className="font-mono font-medium">{tool.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input → Process → Output Flow */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    Input
                  </div>
                  {categorizedTools.input.map(tool => (
                    <div key={tool.id} className="group relative rounded border border-blue-500/20 bg-blue-500/5 p-2">
                      <button
                        onClick={() => removeTool(tool.id)}
                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-destructive text-white rounded-full p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                      <div className="font-mono text-xs">{tool.name}</div>
                    </div>
                  ))}
                  {categorizedTools.input.length === 0 && (
                    <div className="text-xs text-muted-foreground italic">No input tools</div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-purple-600 flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                    Process
                  </div>
                  {categorizedTools.processing.map(tool => (
                    <div key={tool.id} className="group relative rounded border border-purple-500/20 bg-purple-500/5 p-2">
                      <button
                        onClick={() => removeTool(tool.id)}
                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-destructive text-white rounded-full p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                      <div className="font-mono text-xs">{tool.name}</div>
                    </div>
                  ))}
                  {categorizedTools.processing.length === 0 && (
                    <div className="text-xs text-muted-foreground italic">No process tools</div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-green-600 flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    Output
                  </div>
                  {categorizedTools.output.map(tool => (
                    <div key={tool.id} className="group relative rounded border border-green-500/20 bg-green-500/5 p-2">
                      <button
                        onClick={() => removeTool(tool.id)}
                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-destructive text-white rounded-full p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                      <div className="font-mono text-xs">{tool.name}</div>
                    </div>
                  ))}
                  {categorizedTools.output.length === 0 && (
                    <div className="text-xs text-muted-foreground italic">No output tools</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Example Tasks - Always visible */}
        <div className="rounded-lg border border-border bg-card p-4 mt-5">
          <div className="flex items-start gap-2 mb-3">
            <Bot className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">What your agent can do</h4>
              <p className="text-xs text-muted-foreground">Example tasks once this skill is active</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {skill.exampleTasks.map((task, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <span className="text-primary mt-0.5">→</span>
                <span className="italic">"{task}"</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3 max-w-4xl mx-auto">
        <Button onClick={handleSubStepBack} variant="outline" size="lg" className="flex-1">
          Back
        </Button>
        <Button
          onClick={() => setShowTryChat(true)}
          variant="secondary"
          size="lg"
          className="flex-1 gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Try Skill
        </Button>
        <Button
          onClick={handleSubStepNext}
          size="lg"
          disabled={currentSubStep === 'tools' && selectedTools.length === 0}
          className="flex-1"
        >
          {currentSubStep === 'tools' ? 'Activate Skill' : 'Continue'}
        </Button>
      </div>

      {/* Try Skill Chat Dialog */}
      <SkillTryChat
        open={showTryChat}
        onOpenChange={setShowTryChat}
        capability={capability}
      />
    </div>
  );
}
