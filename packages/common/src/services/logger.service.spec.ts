import { describe, it, expect } from 'vitest';
import { Container } from 'inversify';
import {
  LoggerService,
  MAIN_LOGGER_NAME,
  LOG_LEVEL,
  LOG_LEVELS,
  FORWARD_STDERR,
  patternToRegex,
  calculateSpecificity,
  parseLogLevels,
  matchLogLevel,
} from './logger.service';

interface MinimalLogger {
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}

describe('patternToRegex', () => {
  it('matches exact logger name', () => {
    const regex = patternToRegex('dgraph');
    expect(regex.test('dgraph')).toBe(true);
    expect(regex.test('dgraph.sub')).toBe(false);
    expect(regex.test('other')).toBe(false);
  });

  it('matches case-insensitively', () => {
    const regex = patternToRegex('DGraph');
    expect(regex.test('dgraph')).toBe(true);
    expect(regex.test('DGRAPH')).toBe(true);
  });

  it('matches wildcard at end', () => {
    const regex = patternToRegex('mcp.*');
    expect(regex.test('mcp.stdio')).toBe(true);
    expect(regex.test('mcp.sse')).toBe(true);
    expect(regex.test('mcp.streamable')).toBe(true);
    expect(regex.test('mcp')).toBe(false);
    expect(regex.test('other.mcp.stdio')).toBe(false);
  });

  it('matches wildcard for any single segment', () => {
    const regex = patternToRegex('*');
    expect(regex.test('dgraph')).toBe(true);
    expect(regex.test('nats')).toBe(true);
    expect(regex.test('mcp.stdio')).toBe(false); // has dot
  });

  it('matches multi-segment pattern with wildcard', () => {
    const regex = patternToRegex('tool.server.*');
    expect(regex.test('tool.server.github')).toBe(true);
    expect(regex.test('tool.server.filesystem')).toBe(true);
    expect(regex.test('tool.server')).toBe(false);
    expect(regex.test('tool.client')).toBe(false);
  });

  it('escapes regex special characters', () => {
    const regex = patternToRegex('test.name');
    expect(regex.test('test.name')).toBe(true);
    expect(regex.test('testXname')).toBe(false); // dot should be literal
  });
});

describe('calculateSpecificity', () => {
  it('returns higher value for more segments', () => {
    expect(calculateSpecificity('tool.server.github')).toBeGreaterThan(calculateSpecificity('tool.server'));
    expect(calculateSpecificity('tool.server')).toBeGreaterThan(calculateSpecificity('tool'));
  });

  it('returns lower value for wildcards', () => {
    expect(calculateSpecificity('tool.server')).toBeGreaterThan(calculateSpecificity('tool.*'));
    expect(calculateSpecificity('mcp.stdio')).toBeGreaterThan(calculateSpecificity('mcp.*'));
  });

  it('handles single wildcard', () => {
    expect(calculateSpecificity('*')).toBe(9); // 1 segment * 10 - 1 wildcard
  });

  it('handles exact match', () => {
    expect(calculateSpecificity('dgraph')).toBe(10); // 1 segment * 10 - 0 wildcards
  });
});

describe('parseLogLevels', () => {
  it('returns empty array for undefined input', () => {
    expect(parseLogLevels(undefined)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseLogLevels('')).toEqual([]);
    expect(parseLogLevels('   ')).toEqual([]);
  });

  it('parses single pattern', () => {
    const patterns = parseLogLevels('dgraph=debug');
    expect(patterns).toHaveLength(1);
    expect(patterns[0].original).toBe('dgraph');
    expect(patterns[0].level).toBe('debug');
  });

  it('parses multiple patterns', () => {
    const patterns = parseLogLevels('dgraph=debug,nats=warn,mcp.*=trace');
    expect(patterns).toHaveLength(3);
  });

  it('trims whitespace', () => {
    const patterns = parseLogLevels('  dgraph = debug , nats=warn  ');
    expect(patterns).toHaveLength(2);
    expect(patterns.find((p) => p.original === 'dgraph')).toBeDefined();
  });

  it('sorts by specificity (most specific first)', () => {
    const patterns = parseLogLevels('*=info,mcp.*=debug,mcp.stdio=trace');
    expect(patterns[0].original).toBe('mcp.stdio'); // most specific
    expect(patterns[1].original).toBe('mcp.*');
    expect(patterns[2].original).toBe('*'); // least specific
  });

  it('ignores invalid entries without equals sign', () => {
    const patterns = parseLogLevels('dgraph=debug,invalid,nats=warn');
    expect(patterns).toHaveLength(2);
  });

  it('ignores entries with empty pattern or level', () => {
    const patterns = parseLogLevels('=debug,dgraph=,valid=info');
    expect(patterns).toHaveLength(1);
    expect(patterns[0].original).toBe('valid');
  });
});

describe('matchLogLevel', () => {
  it('returns undefined for empty patterns', () => {
    expect(matchLogLevel('dgraph', [])).toBeUndefined();
  });

  it('matches exact pattern', () => {
    const patterns = parseLogLevels('dgraph=debug');
    expect(matchLogLevel('dgraph', patterns)).toBe('debug');
    expect(matchLogLevel('nats', patterns)).toBeUndefined();
  });

  it('matches wildcard pattern', () => {
    const patterns = parseLogLevels('mcp.*=debug');
    expect(matchLogLevel('mcp.stdio', patterns)).toBe('debug');
    expect(matchLogLevel('mcp.sse', patterns)).toBe('debug');
    expect(matchLogLevel('tool', patterns)).toBeUndefined();
  });

  it('prefers more specific pattern', () => {
    const patterns = parseLogLevels('*=info,mcp.*=debug,mcp.stdio=trace');
    expect(matchLogLevel('mcp.stdio', patterns)).toBe('trace');
    expect(matchLogLevel('mcp.sse', patterns)).toBe('debug');
    expect(matchLogLevel('dgraph', patterns)).toBe('info');
  });

  it('matches catch-all pattern', () => {
    const patterns = parseLogLevels('*=warn');
    expect(matchLogLevel('dgraph', patterns)).toBe('warn');
    expect(matchLogLevel('anything', patterns)).toBe('warn');
  });
});

describe('LoggerService', () => {
  function createContainer(logLevels?: string) {
    const container = new Container();
    container.bind(MAIN_LOGGER_NAME).toConstantValue('test');
    container.bind(LOG_LEVEL).toConstantValue('info');
    container.bind(LOG_LEVELS).toConstantValue(logLevels);
    container.bind(FORWARD_STDERR).toConstantValue(false);
    container.bind(LoggerService).toSelf().inSingletonScope();
    return container;
  }

  it('creates child logger with provided name', () => {
    const container = createContainer();
    const svc = container.get(LoggerService);
    const child = svc.getLogger('test') as unknown as MinimalLogger & { level?: string };
    expect(typeof child.info).toBe('function');
  });

  it('uses default log level when no patterns match', () => {
    const container = createContainer();
    const svc = container.get(LoggerService);
    const child = svc.getLogger('unknown') as unknown as MinimalLogger & { level?: string };
    expect(child.level).toBe('info');
  });

  it('applies pattern-based log level', () => {
    const container = createContainer('dgraph=debug');
    const svc = container.get(LoggerService);
    const child = svc.getLogger('dgraph') as unknown as MinimalLogger & { level?: string };
    expect(child.level).toBe('debug');
  });

  it('applies wildcard pattern', () => {
    const container = createContainer('mcp.*=trace');
    const svc = container.get(LoggerService);
    const mcpStdio = svc.getLogger('mcp.stdio') as unknown as MinimalLogger & { level?: string };
    const mcpSse = svc.getLogger('mcp.sse') as unknown as MinimalLogger & { level?: string };
    const other = svc.getLogger('nats') as unknown as MinimalLogger & { level?: string };

    expect(mcpStdio.level).toBe('trace');
    expect(mcpSse.level).toBe('trace');
    expect(other.level).toBe('info'); // default
  });

  it('applies most specific pattern', () => {
    const container = createContainer('*=warn,mcp.*=debug,mcp.stdio=trace');
    const svc = container.get(LoggerService);

    const stdio = svc.getLogger('mcp.stdio') as unknown as MinimalLogger & { level?: string };
    const sse = svc.getLogger('mcp.sse') as unknown as MinimalLogger & { level?: string };
    const dgraph = svc.getLogger('dgraph') as unknown as MinimalLogger & { level?: string };

    expect(stdio.level).toBe('trace'); // most specific match
    expect(sse.level).toBe('debug'); // mcp.* match
    expect(dgraph.level).toBe('warn'); // * match
  });
});
