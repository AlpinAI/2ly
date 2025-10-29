import { describe, it, expect } from 'vitest';
import { cn, sanitizeIdentifier } from './utils';

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
