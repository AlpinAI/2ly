import { describe, it, expect } from 'vitest';
import { cn, sanitizeIdentifier, hasOutputError } from './utils';

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const condition = false;
    expect(cn('foo', condition && 'bar', 'baz')).toBe('foo baz');
  });

  it('resolves Tailwind conflicts', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});

describe('sanitizeIdentifier', () => {
  describe('basic transformations', () => {
    it('converts to lowercase', () => {
      expect(sanitizeIdentifier('MyAgent')).toBe('myagent');
      expect(sanitizeIdentifier('PRODUCTION')).toBe('production');
    });

    it('replaces spaces with hyphens', () => {
      expect(sanitizeIdentifier('My Agent')).toBe('my-agent');
      expect(sanitizeIdentifier('Production Runtime')).toBe('production-runtime');
      expect(sanitizeIdentifier('Agent With Multiple Spaces')).toBe('agent-with-multiple-spaces');
    });

    it('replaces multiple consecutive spaces with single hyphen', () => {
      expect(sanitizeIdentifier('Agent  With   Multiple    Spaces')).toBe('agent-with-multiple-spaces');
    });

    it('removes special characters', () => {
      expect(sanitizeIdentifier('Agent #1')).toBe('agent-1');
      expect(sanitizeIdentifier('Agent@Runtime')).toBe('agentruntime');
      expect(sanitizeIdentifier('Agent!@#$%^&*()Runtime')).toBe('agentruntime');
      expect(sanitizeIdentifier('Agent[Test]')).toBe('agenttest');
    });

    it('keeps hyphens and underscores', () => {
      expect(sanitizeIdentifier('my-agent')).toBe('my-agent');
      expect(sanitizeIdentifier('my_agent')).toBe('my_agent');
      expect(sanitizeIdentifier('my-agent_v2')).toBe('my-agent_v2');
    });

    it('collapses multiple hyphens', () => {
      expect(sanitizeIdentifier('my--agent')).toBe('my-agent');
      expect(sanitizeIdentifier('my---agent')).toBe('my-agent');
    });

    it('removes leading and trailing hyphens', () => {
      expect(sanitizeIdentifier('-agent')).toBe('agent');
      expect(sanitizeIdentifier('agent-')).toBe('agent');
      expect(sanitizeIdentifier('-agent-')).toBe('agent');
      expect(sanitizeIdentifier('---agent---')).toBe('agent');
    });

    it('trims whitespace', () => {
      expect(sanitizeIdentifier('  agent  ')).toBe('agent');
      expect(sanitizeIdentifier('\tagent\n')).toBe('agent');
    });
  });

  describe('edge cases', () => {
    it('prefixes identifiers starting with numbers', () => {
      expect(sanitizeIdentifier('123')).toBe('_123');
      expect(sanitizeIdentifier('123 Agent')).toBe('_123-agent');
      expect(sanitizeIdentifier('1st Agent')).toBe('_1st-agent');
    });

    it('returns "agent" for empty strings', () => {
      expect(sanitizeIdentifier('')).toBe('agent');
      expect(sanitizeIdentifier('   ')).toBe('agent');
    });

    it('returns "agent" for strings with only special characters', () => {
      expect(sanitizeIdentifier('!!!')).toBe('agent');
      expect(sanitizeIdentifier('###')).toBe('agent');
      expect(sanitizeIdentifier('@#$%^&*()')).toBe('agent');
    });

    it('returns "agent" for null or undefined input', () => {
      expect(sanitizeIdentifier(null as unknown as string)).toBe('agent');
      expect(sanitizeIdentifier(undefined as unknown as string)).toBe('agent');
    });

    it('returns "agent" for non-string input', () => {
      expect(sanitizeIdentifier(123 as unknown as string)).toBe('agent');
      expect(sanitizeIdentifier({} as unknown as string)).toBe('agent');
      expect(sanitizeIdentifier([] as unknown as string)).toBe('agent');
    });
  });

  describe('real-world examples', () => {
    it('handles common agent names', () => {
      expect(sanitizeIdentifier('Production Runtime')).toBe('production-runtime');
      expect(sanitizeIdentifier('Dev Agent')).toBe('dev-agent');
      expect(sanitizeIdentifier('Staging Environment')).toBe('staging-environment');
    });

    it('handles names with version numbers', () => {
      expect(sanitizeIdentifier('Agent v2')).toBe('agent-v2');
      expect(sanitizeIdentifier('Runtime v1.0.0')).toBe('runtime-v100');
    });

    it('handles names with special formatting', () => {
      expect(sanitizeIdentifier('Agent (Production)')).toBe('agent-production');
      expect(sanitizeIdentifier('Agent [Test]')).toBe('agent-test');
      expect(sanitizeIdentifier('Agent/Runtime')).toBe('agentruntime');
    });

    it('handles unicode characters', () => {
      expect(sanitizeIdentifier('Agent 😀')).toBe('agent');
      expect(sanitizeIdentifier('Agéñt Tést')).toBe('agt-tst');
    });

    it('handles mixed case with numbers and special chars', () => {
      expect(sanitizeIdentifier('MyAgent_v2.0 (Production) #1')).toBe('myagent_v20-production-1');
    });
  });

  describe('acceptance criteria examples', () => {
    it('matches example: "My Agent" → "my-agent"', () => {
      expect(sanitizeIdentifier('My Agent')).toBe('my-agent');
    });

    it('matches example: "Production Runtime" → "production-runtime"', () => {
      expect(sanitizeIdentifier('Production Runtime')).toBe('production-runtime');
    });
  });
});

describe('hasOutputError', () => {
  describe('valid JSON with isError', () => {
    it('returns true when isError is true', () => {
      expect(hasOutputError('{"isError": true}')).toBe(true);
      expect(hasOutputError('{"isError": true, "message": "Failed"}')).toBe(true);
      expect(hasOutputError('{"data": "result", "isError": true}')).toBe(true);
    });

    it('returns false when isError is false', () => {
      expect(hasOutputError('{"isError": false}')).toBe(false);
      expect(hasOutputError('{"isError": false, "data": "success"}')).toBe(false);
    });

    it('returns false when isError is missing', () => {
      expect(hasOutputError('{"data": "success"}')).toBe(false);
      expect(hasOutputError('{"message": "completed"}')).toBe(false);
      expect(hasOutputError('{}')).toBe(false);
    });

    it('returns false when isError is not a boolean', () => {
      expect(hasOutputError('{"isError": "true"}')).toBe(false);
      expect(hasOutputError('{"isError": 1}')).toBe(false);
      expect(hasOutputError('{"isError": null}')).toBe(false);
    });
  });

  describe('invalid JSON', () => {
    it('returns false for plain text output', () => {
      expect(hasOutputError('Plain text result')).toBe(false);
      expect(hasOutputError('Tool executed successfully')).toBe(false);
    });

    it('returns false for malformed JSON', () => {
      expect(hasOutputError('{"incomplete": ')).toBe(false);
      expect(hasOutputError('{invalid json}')).toBe(false);
      expect(hasOutputError('not json at all')).toBe(false);
    });
  });

  describe('null/undefined/empty inputs', () => {
    it('returns false for null', () => {
      expect(hasOutputError(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(hasOutputError(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(hasOutputError('')).toBe(false);
    });
  });

  describe('complex nested objects', () => {
    it('checks top-level isError only', () => {
      expect(hasOutputError('{"nested": {"isError": true}, "isError": false}')).toBe(false);
      expect(hasOutputError('{"nested": {"isError": false}, "isError": true}')).toBe(true);
    });

    it('handles arrays correctly', () => {
      expect(hasOutputError('{"items": [1, 2, 3], "isError": true}')).toBe(true);
      expect(hasOutputError('{"items": [1, 2, 3]}')).toBe(false);
    });
  });
});
