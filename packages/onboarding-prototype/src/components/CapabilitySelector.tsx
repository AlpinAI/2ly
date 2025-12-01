import { useState } from 'react';
import { CheckSquare, BookOpen, MessageCircle, Search, Send } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import type { Capability } from '@/mocks/types';

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

export function CapabilitySelector({
  capabilities,
  selectedCapability,
  onSelect,
  onNext,
}: CapabilitySelectorProps) {
  const [skillRequest, setSkillRequest] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

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

      {/* Search/Request Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={skillRequest}
            onChange={(e) => setSkillRequest(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSkillRequest()}
            placeholder="Don't see what you need? Request a skill... (e.g., 'Email management', 'Calendar scheduling')"
            className="w-full pl-10 pr-24 py-3 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Button
            onClick={handleSkillRequest}
            disabled={!skillRequest.trim() || isSubmittingRequest}
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            {isSubmittingRequest ? (
              'Submitting...'
            ) : (
              <>
                <Send className="h-3 w-3 mr-1" />
                Request
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Or choose from our pre-built skills below
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {capabilities.map((capability) => {
          const Icon = iconMap[capability.icon as keyof typeof iconMap] || CheckSquare;
          const isSelected = selectedCapability?.id === capability.id;

          return (
            <button
              key={capability.id}
              onClick={() => onSelect(capability)}
              className={cn(
                'relative rounded-lg border-2 p-6 text-left transition-all hover:shadow-lg',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/50'
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
    </div>
  );
}
