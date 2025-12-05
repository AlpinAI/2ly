/**
 * StructuredSkillDescription Component
 *
 * WHY: Provides a structured three-section description editor for Skills.
 * Splits description into Scope, Guardrails, and Knowledge sections.
 *
 * FEATURES:
 * - Three labeled textarea fields with validation
 * - Character count indicators per section
 * - Scope: Required, max 300 chars
 * - Guardrails: Required, max 10,000 chars
 * - Knowledge: Optional, max 10,000 chars
 * - Serialization to/from markdown-style format for LLM interpretation
 *
 * USAGE:
 * ```tsx
 * const [description, setDescription] = useState('');
 *
 * <StructuredSkillDescription
 *   value={description}
 *   onChange={setDescription}
 *   disabled={false}
 * />
 * ```
 */

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface StructuredSkillDescriptionProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export interface SkillDescriptionSections {
  scope: string;
  guardrails: string;
  knowledge: string;
}

export interface ValidationErrors {
  scope?: string;
  guardrails?: string;
  knowledge?: string;
}

const SCOPE_MAX_LENGTH = 300;
const GUARDRAILS_MAX_LENGTH = 10000;
const KNOWLEDGE_MAX_LENGTH = 10000;

/**
 * Serialize three sections into markdown-style format for backend storage
 */
export function serializeSkillDescription(sections: SkillDescriptionSections): string {
  const parts: string[] = [];

  if (sections.scope) {
    parts.push(`# Scope\n${sections.scope.trim()}`);
  }

  if (sections.guardrails) {
    parts.push(`# Guardrails\n${sections.guardrails.trim()}`);
  }

  if (sections.knowledge) {
    parts.push(`# Knowledge\n${sections.knowledge.trim()}`);
  }

  return parts.join('\n\n');
}

/**
 * Deserialize markdown-style description into three sections
 * Handles backward compatibility for plain text descriptions
 */
export function deserializeSkillDescription(description: string): SkillDescriptionSections {
  if (!description) {
    return { scope: '', guardrails: '', knowledge: '' };
  }

  // Check if description uses structured format
  const hasStructuredFormat = description.includes('# Scope') ||
                               description.includes('# Guardrails') ||
                               description.includes('# Knowledge');

  if (!hasStructuredFormat) {
    // Backward compatibility: treat plain text as Scope
    return {
      scope: description.trim(),
      guardrails: '',
      knowledge: '',
    };
  }

  // Parse structured format
  const sections: SkillDescriptionSections = {
    scope: '',
    guardrails: '',
    knowledge: '',
  };

  // Split by headers and extract content
  const scopeMatch = description.match(/# Scope\n([\s\S]*?)(?=\n\n# |$)/);
  const guardrailsMatch = description.match(/# Guardrails\n([\s\S]*?)(?=\n\n# |$)/);
  const knowledgeMatch = description.match(/# Knowledge\n([\s\S]*?)(?=\n\n# |$)/);

  if (scopeMatch) {
    sections.scope = scopeMatch[1].trim();
  }

  if (guardrailsMatch) {
    sections.guardrails = guardrailsMatch[1].trim();
  }

  if (knowledgeMatch) {
    sections.knowledge = knowledgeMatch[1].trim();
  }

  return sections;
}

/**
 * Validate description sections
 */
export function validateSkillDescription(sections: SkillDescriptionSections): ValidationErrors {
  const errors: ValidationErrors = {};

  // Scope validation: required, max 300 chars
  if (!sections.scope.trim()) {
    errors.scope = 'Scope is required';
  } else if (sections.scope.length > SCOPE_MAX_LENGTH) {
    errors.scope = `Scope must not exceed ${SCOPE_MAX_LENGTH} characters`;
  }

  // Guardrails validation: required, max 10,000 chars
  if (!sections.guardrails.trim()) {
    errors.guardrails = 'Guardrails is required';
  } else if (sections.guardrails.length > GUARDRAILS_MAX_LENGTH) {
    errors.guardrails = `Guardrails must not exceed ${GUARDRAILS_MAX_LENGTH} characters`;
  }

  // Knowledge validation: optional, max 10,000 chars
  if (sections.knowledge.length > KNOWLEDGE_MAX_LENGTH) {
    errors.knowledge = `Knowledge must not exceed ${KNOWLEDGE_MAX_LENGTH} characters`;
  }

  return errors;
}

export function StructuredSkillDescription({
  value,
  onChange,
  disabled = false,
  className,
}: StructuredSkillDescriptionProps) {
  const [sections, setSections] = useState<SkillDescriptionSections>(() =>
    deserializeSkillDescription(value)
  );

  // Update sections when value changes externally
  useEffect(() => {
    setSections(deserializeSkillDescription(value));
  }, [value]);

  const handleSectionChange = (section: keyof SkillDescriptionSections, newValue: string) => {
    const updatedSections = { ...sections, [section]: newValue };
    setSections(updatedSections);

    // Serialize and propagate changes
    const serialized = serializeSkillDescription(updatedSections);
    onChange(serialized);
  };

  // Calculate character counts
  const scopeCount = sections.scope.length;
  const guardrailsCount = sections.guardrails.length;
  const knowledgeCount = sections.knowledge.length;

  // Determine if fields have errors
  const scopeError = scopeCount > SCOPE_MAX_LENGTH;
  const guardrailsError = guardrailsCount > GUARDRAILS_MAX_LENGTH;
  const knowledgeError = knowledgeCount > KNOWLEDGE_MAX_LENGTH;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Scope Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            Scope *
          </label>
          <span
            className={cn(
              'text-xs',
              scopeError ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {scopeCount} / {SCOPE_MAX_LENGTH}
          </span>
        </div>
        <Textarea
          placeholder="Define what this skill can do and its primary purpose..."
          value={sections.scope}
          onChange={(e) => handleSectionChange('scope', e.target.value)}
          disabled={disabled}
          rows={3}
          className={cn(scopeError && 'border-red-500 focus-visible:ring-red-500')}
        />
        {scopeError && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Scope must not exceed {SCOPE_MAX_LENGTH} characters
          </p>
        )}
      </div>

      {/* Guardrails Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            Guardrails *
          </label>
          <span
            className={cn(
              'text-xs',
              guardrailsError ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {guardrailsCount} / {GUARDRAILS_MAX_LENGTH}
          </span>
        </div>
        <Textarea
          placeholder="Specify what this skill should NOT do, limitations, and safety rules..."
          value={sections.guardrails}
          onChange={(e) => handleSectionChange('guardrails', e.target.value)}
          disabled={disabled}
          rows={6}
          className={cn(guardrailsError && 'border-red-500 focus-visible:ring-red-500')}
        />
        {guardrailsError && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Guardrails must not exceed {GUARDRAILS_MAX_LENGTH} characters
          </p>
        )}
      </div>

      {/* Knowledge Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-white">
            Knowledge
          </label>
          <span
            className={cn(
              'text-xs',
              knowledgeError ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {knowledgeCount} / {KNOWLEDGE_MAX_LENGTH}
          </span>
        </div>
        <Textarea
          placeholder="Provide additional context, domain knowledge, or background information (optional)..."
          value={sections.knowledge}
          onChange={(e) => handleSectionChange('knowledge', e.target.value)}
          disabled={disabled}
          rows={6}
          className={cn(knowledgeError && 'border-red-500 focus-visible:ring-red-500')}
        />
        {knowledgeError && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Knowledge must not exceed {KNOWLEDGE_MAX_LENGTH} characters
          </p>
        )}
      </div>
    </div>
  );
}
