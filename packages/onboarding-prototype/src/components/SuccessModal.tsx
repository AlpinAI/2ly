import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import type { Capability } from '@/mocks/types';

interface SuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capability: Capability;
  onCreateAnother: () => void;
}

export function SuccessModal({ open, onOpenChange, capability, onCreateAnother }: SuccessModalProps) {
  const skill = capability.skill;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="items-center text-center space-y-4">
          {/* Success Icon with Animation */}
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <CheckCircle2 className="h-20 w-20 text-primary/20 mx-auto" />
            </div>
            <CheckCircle2 className="h-20 w-20 text-primary mx-auto relative" />
          </div>

          <DialogTitle className="text-3xl">
            Skill Setup Complete! 🎉
          </DialogTitle>

          <p className="text-muted-foreground text-lg">
            Your <span className="font-semibold text-foreground">{skill.name}</span> skill is ready to integrate
          </p>
        </DialogHeader>

        {/* Summary */}
        <div className="space-y-4 py-6">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              What You've Configured
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{skill.knowledge.sources.length}</div>
                <div className="text-muted-foreground">Knowledge Sources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{skill.instructions.guardrails.length}</div>
                <div className="text-muted-foreground">Guardrails</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{skill.tools.length}</div>
                <div className="text-muted-foreground">MCP Tools</div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">Next Steps</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Choose an integration from 13 available options</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Copy the configuration code for your platform</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Start using your AI skill in production</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onCreateAnother}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Create Another Skill
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            size="lg"
            className="flex-1"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
