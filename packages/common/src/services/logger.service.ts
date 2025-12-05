import { injectable, inject } from 'inversify';
import pino from 'pino';
import pretty from 'pino-pretty';

export const LOG_LEVEL = 'logLevel';
export const LOG_LEVELS = 'logLevels';
export const MAIN_LOGGER_NAME = '2ly';
export const FORWARD_STDERR = 'forwardStderr';

/**
 * Pattern for matching logger names with optional wildcards.
 * Example patterns:
 * - "mcp.*" matches "mcp.stdio", "mcp.sse"
 * - "*" matches any single-segment logger name
 * - "tool.server.*" matches "tool.server.github", etc.
 */
export interface LogLevelPattern {
  original: string;
  pattern: RegExp;
  level: pino.Level;
  specificity: number;
}

/**
 * Convert a glob-like pattern to a regex.
 * - "*" matches any characters except dots
 * - Dots are literal separators
 */
export function patternToRegex(pattern: string): RegExp {
  // Escape special regex characters except *
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^.]*');
  return new RegExp(`^${escaped}$`, 'i');
}

/**
 * Calculate specificity of a pattern.
 * More segments and fewer wildcards = higher specificity.
 */
export function calculateSpecificity(pattern: string): number {
  const segments = pattern.split('.');
  const wildcards = (pattern.match(/\*/g) || []).length;
  return segments.length * 10 - wildcards;
}

/**
 * Parse a LOG_LEVELS string into patterns sorted by specificity.
 *
 * Format: "logger=level,logger2=level2,mcp.*=debug"
 *
 * Examples:
 * - "mcp.*=debug" - all MCP loggers to debug
 * - "*=warn,tool.*=debug" - default warn, but tools at debug
 * - "dgraph=debug,nats=warn" - specific loggers
 */
export function parseLogLevels(config: string | undefined): LogLevelPattern[] {
  if (!config || config.trim() === '') return [];

  return config
    .split(',')
    .map((entry) => {
      const trimmed = entry.trim();
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) return null;

      const pattern = trimmed.slice(0, eqIndex).trim();
      const level = trimmed.slice(eqIndex + 1).trim() as pino.Level;

      if (!pattern || !level) return null;

      return {
        original: pattern,
        pattern: patternToRegex(pattern),
        level,
        specificity: calculateSpecificity(pattern),
      };
    })
    .filter((p): p is LogLevelPattern => p !== null)
    .sort((a, b) => b.specificity - a.specificity);
}

/**
 * Find the log level for a logger name by matching against patterns.
 * Returns the level from the most specific matching pattern, or undefined if no match.
 */
export function matchLogLevel(name: string, patterns: LogLevelPattern[]): pino.Level | undefined {
  for (const p of patterns) {
    if (p.pattern.test(name)) {
      return p.level;
    }
  }
  return undefined;
}

@injectable()
export class LoggerService {
  private pino: pino.Logger;
  private patterns: LogLevelPattern[];

  constructor(
    @inject(MAIN_LOGGER_NAME) private readonly mainLoggerName: string,
    @inject(LOG_LEVEL) private readonly logLevel: pino.Level,
    @inject(FORWARD_STDERR) private readonly forwardStderr: boolean,
    @inject(LOG_LEVELS) logLevels: string | undefined,
  ) {
    this.patterns = parseLogLevels(logLevels);

    const stream = pretty({
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname,childName',
      messageFormat: (log: Record<string, unknown>, messageKey: string): string => {
        const message = log[messageKey] as string;
        if (log.childName) return `[${log.childName}] ${message}`;
        return message;
      },
      messageKey: 'message',
      singleLine: true,
      destination: this.forwardStderr ? 2 : 1,
    });

    this.pino = pino(
      {
        name: this.mainLoggerName,
        level: this.logLevel,
      },
      stream,
    );
  }

  private getLogLevel(name: string): pino.Level {
    const matched = matchLogLevel(name, this.patterns);
    return matched ?? this.logLevel;
  }

  getLogger(name: string): pino.Logger {
    const logLevel = this.getLogLevel(name);
    return this.pino.child(
      {
        childName: name,
      },
      { level: logLevel },
    );
  }
}
