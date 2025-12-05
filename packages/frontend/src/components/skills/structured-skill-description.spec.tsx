/**
 * Tests for StructuredSkillDescription component and utilities
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  StructuredSkillDescription,
  serializeSkillDescription,
  deserializeSkillDescription,
  validateSkillDescription,
  type SkillDescriptionSections,
} from './structured-skill-description';

describe('serializeSkillDescription', () => {
  it('serializes all three sections correctly', () => {
    const sections: SkillDescriptionSections = {
      scope: 'This skill handles data processing',
      guardrails: 'Do not process sensitive data',
      knowledge: 'Uses pandas library',
    };

    const result = serializeSkillDescription(sections);

    expect(result).toBe(
      '# Scope\nThis skill handles data processing\n\n# Guardrails\nDo not process sensitive data\n\n# Knowledge\nUses pandas library'
    );
  });

  it('serializes with only required sections', () => {
    const sections: SkillDescriptionSections = {
      scope: 'Basic scope',
      guardrails: 'Basic guardrails',
      knowledge: '',
    };

    const result = serializeSkillDescription(sections);

    expect(result).toBe('# Scope\nBasic scope\n\n# Guardrails\nBasic guardrails');
  });

  it('trims whitespace from sections', () => {
    const sections: SkillDescriptionSections = {
      scope: '  Scope with spaces  ',
      guardrails: '  Guardrails with spaces  ',
      knowledge: '',
    };

    const result = serializeSkillDescription(sections);

    expect(result).toBe('# Scope\nScope with spaces\n\n# Guardrails\nGuardrails with spaces');
  });

  it('handles empty sections by omitting them', () => {
    const sections: SkillDescriptionSections = {
      scope: 'Scope only',
      guardrails: '',
      knowledge: '',
    };

    const result = serializeSkillDescription(sections);

    expect(result).toBe('# Scope\nScope only');
  });

  it('preserves multiline content in sections', () => {
    const sections: SkillDescriptionSections = {
      scope: 'Line 1\nLine 2\nLine 3',
      guardrails: 'Rule 1\nRule 2',
      knowledge: 'Info 1\nInfo 2',
    };

    const result = serializeSkillDescription(sections);

    expect(result).toContain('Line 1\nLine 2\nLine 3');
    expect(result).toContain('Rule 1\nRule 2');
    expect(result).toContain('Info 1\nInfo 2');
  });
});

describe('deserializeSkillDescription', () => {
  it('deserializes structured format correctly', () => {
    const description =
      '# Scope\nThis skill handles data processing\n\n# Guardrails\nDo not process sensitive data\n\n# Knowledge\nUses pandas library';

    const result = deserializeSkillDescription(description);

    expect(result).toEqual({
      scope: 'This skill handles data processing',
      guardrails: 'Do not process sensitive data',
      knowledge: 'Uses pandas library',
    });
  });

  it('deserializes with only some sections present', () => {
    const description = '# Scope\nBasic scope\n\n# Guardrails\nBasic guardrails';

    const result = deserializeSkillDescription(description);

    expect(result).toEqual({
      scope: 'Basic scope',
      guardrails: 'Basic guardrails',
      knowledge: '',
    });
  });

  it('handles backward compatibility: plain text goes to Scope', () => {
    const description = 'This is a plain text description without structure';

    const result = deserializeSkillDescription(description);

    expect(result).toEqual({
      scope: 'This is a plain text description without structure',
      guardrails: '',
      knowledge: '',
    });
  });

  it('handles empty description', () => {
    const result = deserializeSkillDescription('');

    expect(result).toEqual({
      scope: '',
      guardrails: '',
      knowledge: '',
    });
  });

  it('preserves multiline content in sections', () => {
    const description = '# Scope\nLine 1\nLine 2\n\n# Guardrails\nRule 1\nRule 2';

    const result = deserializeSkillDescription(description);

    expect(result.scope).toBe('Line 1\nLine 2');
    expect(result.guardrails).toBe('Rule 1\nRule 2');
  });

  it('handles sections in different order', () => {
    const description = '# Guardrails\nGuardrails first\n\n# Scope\nScope second\n\n# Knowledge\nKnowledge last';

    const result = deserializeSkillDescription(description);

    expect(result).toEqual({
      scope: 'Scope second',
      guardrails: 'Guardrails first',
      knowledge: 'Knowledge last',
    });
  });

  it('trims whitespace from parsed sections', () => {
    const description = '# Scope\n  Scope with spaces  \n\n# Guardrails\n  Guardrails with spaces  ';

    const result = deserializeSkillDescription(description);

    expect(result.scope).toBe('Scope with spaces');
    expect(result.guardrails).toBe('Guardrails with spaces');
  });
});

describe('validateSkillDescription', () => {
  it('validates correct sections with no errors', () => {
    const sections: SkillDescriptionSections = {
      scope: 'Valid scope',
      guardrails: 'Valid guardrails',
      knowledge: 'Valid knowledge',
    };

    const errors = validateSkillDescription(sections);

    expect(errors).toEqual({});
  });

  it('requires scope section', () => {
    const sections: SkillDescriptionSections = {
      scope: '',
      guardrails: 'Valid guardrails',
      knowledge: '',
    };

    const errors = validateSkillDescription(sections);

    expect(errors.scope).toBe('Scope is required');
  });

  it('requires guardrails section', () => {
    const sections: SkillDescriptionSections = {
      scope: 'Valid scope',
      guardrails: '',
      knowledge: '',
    };

    const errors = validateSkillDescription(sections);

    expect(errors.guardrails).toBe('Guardrails is required');
  });

  it('allows empty knowledge section', () => {
    const sections: SkillDescriptionSections = {
      scope: 'Valid scope',
      guardrails: 'Valid guardrails',
      knowledge: '',
    };

    const errors = validateSkillDescription(sections);

    expect(errors.knowledge).toBeUndefined();
  });

  it('validates scope length (max 300)', () => {
    const sections: SkillDescriptionSections = {
      scope: 'A'.repeat(301),
      guardrails: 'Valid guardrails',
      knowledge: '',
    };

    const errors = validateSkillDescription(sections);

    expect(errors.scope).toBe('Scope must not exceed 300 characters');
  });

  it('validates guardrails length (max 10,000)', () => {
    const sections: SkillDescriptionSections = {
      scope: 'Valid scope',
      guardrails: 'A'.repeat(10001),
      knowledge: '',
    };

    const errors = validateSkillDescription(sections);

    expect(errors.guardrails).toBe('Guardrails must not exceed 10000 characters');
  });

  it('validates knowledge length (max 10,000)', () => {
    const sections: SkillDescriptionSections = {
      scope: 'Valid scope',
      guardrails: 'Valid guardrails',
      knowledge: 'A'.repeat(10001),
    };

    const errors = validateSkillDescription(sections);

    expect(errors.knowledge).toBe('Knowledge must not exceed 10000 characters');
  });

  it('allows scope at exactly 300 characters', () => {
    const sections: SkillDescriptionSections = {
      scope: 'A'.repeat(300),
      guardrails: 'Valid guardrails',
      knowledge: '',
    };

    const errors = validateSkillDescription(sections);

    expect(errors.scope).toBeUndefined();
  });

  it('trims whitespace before validation', () => {
    const sections: SkillDescriptionSections = {
      scope: '   ',
      guardrails: '   ',
      knowledge: '',
    };

    const errors = validateSkillDescription(sections);

    expect(errors.scope).toBe('Scope is required');
    expect(errors.guardrails).toBe('Guardrails is required');
  });

  it('returns multiple errors when multiple sections are invalid', () => {
    const sections: SkillDescriptionSections = {
      scope: '',
      guardrails: '',
      knowledge: 'A'.repeat(10001),
    };

    const errors = validateSkillDescription(sections);

    expect(errors.scope).toBe('Scope is required');
    expect(errors.guardrails).toBe('Guardrails is required');
    expect(errors.knowledge).toBe('Knowledge must not exceed 10000 characters');
  });
});

describe('StructuredSkillDescription Component', () => {
  it('renders all three section fields', () => {
    const mockOnChange = vi.fn();

    render(<StructuredSkillDescription value="" onChange={mockOnChange} />);

    expect(screen.getByText('Scope *')).toBeInTheDocument();
    expect(screen.getByText('Guardrails *')).toBeInTheDocument();
    expect(screen.getByText('Knowledge')).toBeInTheDocument();
  });

  it('displays character counters for each section', () => {
    const mockOnChange = vi.fn();

    render(<StructuredSkillDescription value="" onChange={mockOnChange} />);

    expect(screen.getByText('0 / 300')).toBeInTheDocument();
    expect(screen.getAllByText('0 / 10000')).toHaveLength(2); // Guardrails and Knowledge
  });

  it('deserializes initial value correctly', () => {
    const mockOnChange = vi.fn();
    const value = '# Scope\nTest scope\n\n# Guardrails\nTest guardrails\n\n# Knowledge\nTest knowledge';

    render(<StructuredSkillDescription value={value} onChange={mockOnChange} />);

    expect(screen.getByPlaceholderText(/Define what this skill can do/)).toHaveValue('Test scope');
    expect(screen.getByPlaceholderText(/Specify what this skill should NOT do/)).toHaveValue('Test guardrails');
    expect(screen.getByPlaceholderText(/Provide additional context/)).toHaveValue('Test knowledge');
  });

  it('handles backward compatibility for plain text', () => {
    const mockOnChange = vi.fn();
    const value = 'Plain text description';

    render(<StructuredSkillDescription value={value} onChange={mockOnChange} />);

    expect(screen.getByPlaceholderText(/Define what this skill can do/)).toHaveValue('Plain text description');
  });

  it('calls onChange with serialized value when scope changes', () => {
    const mockOnChange = vi.fn();

    render(<StructuredSkillDescription value="" onChange={mockOnChange} />);

    const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
    fireEvent.change(scopeTextarea, { target: { value: 'New scope' } });

    expect(mockOnChange).toHaveBeenCalledWith('# Scope\nNew scope');
  });

  it('calls onChange with serialized value when guardrails changes', () => {
    const mockOnChange = vi.fn();
    const initialValue = '# Scope\nExisting scope\n\n# Guardrails\nExisting guardrails';

    render(<StructuredSkillDescription value={initialValue} onChange={mockOnChange} />);

    const guardrailsTextarea = screen.getByPlaceholderText(/Specify what this skill should NOT do/);
    fireEvent.change(guardrailsTextarea, { target: { value: 'Updated guardrails' } });

    expect(mockOnChange).toHaveBeenCalledWith('# Scope\nExisting scope\n\n# Guardrails\nUpdated guardrails');
  });

  it('calls onChange with serialized value when knowledge changes', () => {
    const mockOnChange = vi.fn();
    const initialValue = '# Scope\nScope\n\n# Guardrails\nGuardrails';

    render(<StructuredSkillDescription value={initialValue} onChange={mockOnChange} />);

    const knowledgeTextarea = screen.getByPlaceholderText(/Provide additional context/);
    fireEvent.change(knowledgeTextarea, { target: { value: 'New knowledge' } });

    expect(mockOnChange).toHaveBeenCalledWith(
      '# Scope\nScope\n\n# Guardrails\nGuardrails\n\n# Knowledge\nNew knowledge'
    );
  });

  it('updates character count as user types', () => {
    const mockOnChange = vi.fn();

    render(<StructuredSkillDescription value="" onChange={mockOnChange} />);

    const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
    fireEvent.change(scopeTextarea, { target: { value: 'Hello' } });

    expect(screen.getByText('5 / 300')).toBeInTheDocument();
  });

  it('shows error styling when scope exceeds limit', () => {
    const mockOnChange = vi.fn();

    render(<StructuredSkillDescription value="" onChange={mockOnChange} />);

    const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
    fireEvent.change(scopeTextarea, { target: { value: 'A'.repeat(301) } });

    expect(screen.getByText('301 / 300')).toHaveClass('text-red-600');
    expect(screen.getByText('Scope must not exceed 300 characters')).toBeInTheDocument();
  });

  it('shows error styling when guardrails exceeds limit', () => {
    const mockOnChange = vi.fn();

    render(<StructuredSkillDescription value="" onChange={mockOnChange} />);

    const guardrailsTextarea = screen.getByPlaceholderText(/Specify what this skill should NOT do/);
    fireEvent.change(guardrailsTextarea, { target: { value: 'A'.repeat(10001) } });

    expect(screen.getByText('10001 / 10000')).toHaveClass('text-red-600');
    expect(screen.getByText('Guardrails must not exceed 10000 characters')).toBeInTheDocument();
  });

  it('shows error styling when knowledge exceeds limit', () => {
    const mockOnChange = vi.fn();

    render(<StructuredSkillDescription value="" onChange={mockOnChange} />);

    const knowledgeTextarea = screen.getByPlaceholderText(/Provide additional context/);
    fireEvent.change(knowledgeTextarea, { target: { value: 'A'.repeat(10001) } });

    expect(screen.getByText('10001 / 10000')).toHaveClass('text-red-600');
    expect(screen.getByText('Knowledge must not exceed 10000 characters')).toBeInTheDocument();
  });

  it('disables all fields when disabled prop is true', () => {
    const mockOnChange = vi.fn();

    render(<StructuredSkillDescription value="" onChange={mockOnChange} disabled={true} />);

    const scopeTextarea = screen.getByPlaceholderText(/Define what this skill can do/);
    const guardrailsTextarea = screen.getByPlaceholderText(/Specify what this skill should NOT do/);
    const knowledgeTextarea = screen.getByPlaceholderText(/Provide additional context/);

    expect(scopeTextarea).toBeDisabled();
    expect(guardrailsTextarea).toBeDisabled();
    expect(knowledgeTextarea).toBeDisabled();
  });

  it('updates when value prop changes externally', () => {
    const mockOnChange = vi.fn();
    const initialValue = '# Scope\nInitial\n\n# Guardrails\nInitial';

    const { rerender } = render(<StructuredSkillDescription value={initialValue} onChange={mockOnChange} />);

    expect(screen.getByPlaceholderText(/Define what this skill can do/)).toHaveValue('Initial');
    expect(screen.getByPlaceholderText(/Specify what this skill should NOT do/)).toHaveValue('Initial');

    const updatedValue = '# Scope\nUpdated\n\n# Guardrails\nUpdated';
    rerender(<StructuredSkillDescription value={updatedValue} onChange={mockOnChange} />);

    expect(screen.getByPlaceholderText(/Define what this skill can do/)).toHaveValue('Updated');
    expect(screen.getByPlaceholderText(/Specify what this skill should NOT do/)).toHaveValue('Updated');
  });

  it('applies custom className', () => {
    const mockOnChange = vi.fn();

    const { container } = render(
      <StructuredSkillDescription value="" onChange={mockOnChange} className="custom-class" />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });
});

describe('Round-trip serialization', () => {
  it('maintains data integrity through serialize -> deserialize cycle', () => {
    const original: SkillDescriptionSections = {
      scope: 'Original scope text',
      guardrails: 'Original guardrails text',
      knowledge: 'Original knowledge text',
    };

    const serialized = serializeSkillDescription(original);
    const deserialized = deserializeSkillDescription(serialized);

    expect(deserialized).toEqual(original);
  });

  it('handles empty knowledge through round-trip', () => {
    const original: SkillDescriptionSections = {
      scope: 'Scope text',
      guardrails: 'Guardrails text',
      knowledge: '',
    };

    const serialized = serializeSkillDescription(original);
    const deserialized = deserializeSkillDescription(serialized);

    expect(deserialized.scope).toBe(original.scope);
    expect(deserialized.guardrails).toBe(original.guardrails);
    expect(deserialized.knowledge).toBe('');
  });
});
