/**
 * Prompt Template Utilities
 *
 * WHY: Manages custom AI prompt templates for skill generation.
 * Provides default templates, variable replacement, and validation.
 *
 * FEATURES:
 * - Default prompt template for skill generation
 * - Variable replacement ({{intent}}, {{tools}}, {{workspace}})
 * - Template validation
 * - Type-safe interfaces
 */

export interface CustomPrompts {
  skillGeneration?: string;
  // Future: add more prompt types (skillEditing, toolSuggestion, etc.)
}

export interface PromptVariables {
  intent: string;
  tools: string;
  workspace?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Default prompt template for skill generation
 * Note: {{intent}} is passed separately as the user message, not part of system prompt
 */
export const DEFAULT_SKILL_GENERATION_PROMPT = `Available tools in the workspace:
{{tools}}

Generate a skill configuration with:
1. NAME (3-100 characters): A concise name for this skill
2. SCOPE (max 300 characters): What this skill does
3. GUARDRAILS (max 10000 characters): How to use it safely, limitations, constraints
4. KNOWLEDGE (max 10000 characters): Relevant background, policies, best practices
5. SUGGESTED_TOOLS (array of tool IDs): Which tools from the available list are relevant

Respond ONLY with valid JSON in this exact format:
{
  "name": "...",
  "scope": "...",
  "guardrails": "...",
  "knowledge": "...",
  "toolIds": ["tool-id-1", "tool-id-2"]
}

Important:
- Do not exceed character limits
- Only suggest tool IDs that exist in the available tools list
- Return valid JSON only, no markdown or additional text`;

/**
 * Replace variables in a prompt template
 *
 * @param template - The template string with {{variable}} placeholders
 * @param variables - Object with variable values
 * @returns The template with variables replaced
 */
export function replaceVariables(template: string, variables: PromptVariables): string {
  let result = template;

  // Replace {{intent}}
  result = result.replace(/\{\{intent\}\}/g, variables.intent);

  // Replace {{tools}}
  result = result.replace(/\{\{tools\}\}/g, variables.tools);

  // Replace {{workspace}} if provided
  if (variables.workspace) {
    result = result.replace(/\{\{workspace\}\}/g, variables.workspace);
  }

  return result;
}

/**
 * Validate a prompt template
 *
 * @param template - The template string to validate
 * @returns Validation result with errors if any
 */
export function validatePromptTemplate(template: string): ValidationResult {
  const errors: string[] = [];

  // Check length
  if (template.length < 100) {
    errors.push('Template must be at least 100 characters');
  }

  if (template.length > 10000) {
    errors.push('Template must not exceed 10,000 characters');
  }

  // Check for required variables
  // Note: {{intent}} is optional as it goes in the user message, not system prompt
  if (!template.includes('{{tools}}')) {
    errors.push('Template must contain {{tools}} variable');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse custom prompts JSON string
 *
 * @param customPromptsJson - JSON string from workspace.customPrompts
 * @returns Parsed CustomPrompts object or null if invalid
 */
export function parseCustomPrompts(customPromptsJson: string | null | undefined): CustomPrompts | null {
  if (!customPromptsJson) {
    return null;
  }

  try {
    return JSON.parse(customPromptsJson) as CustomPrompts;
  } catch (error) {
    console.error('Failed to parse custom prompts:', error);
    return null;
  }
}

/**
 * Get the skill generation prompt (custom or default)
 *
 * @param customPrompts - Parsed custom prompts object
 * @returns The skill generation prompt template
 */
export function getSkillGenerationPrompt(customPrompts: CustomPrompts | null): string {
  if (customPrompts?.skillGeneration) {
    // Validate custom prompt before using
    const validation = validatePromptTemplate(customPrompts.skillGeneration);
    if (validation.valid) {
      return customPrompts.skillGeneration;
    }
    console.warn('Custom skill generation prompt is invalid, using default');
  }

  return DEFAULT_SKILL_GENERATION_PROMPT;
}
