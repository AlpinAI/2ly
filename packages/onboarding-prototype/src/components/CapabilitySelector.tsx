import { CheckSquare, BookOpen, MessageCircle } from 'lucide-react';
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
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          Choose Your Starting Point
        </h2>
        <p className="text-muted-foreground text-lg">
          Select a capability to see how 2ly can enhance your workflow
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
