import { injectable, inject } from 'inversify';
import pino from 'pino';
import pretty from 'pino-pretty';

export const LOG_LEVEL = 'logLevel';
export const MAIN_LOGGER_NAME = '2ly';
export const FORWARD_STDERR = 'forwardStderr';

@injectable()
export class LoggerService {
  private pino: pino.Logger;

  private childLevels: Record<string, pino.Level> = {};

  constructor(
    @inject(MAIN_LOGGER_NAME) private readonly mainLoggerName: string,
    @inject(LOG_LEVEL) private readonly logLevel: pino.Level,
    @inject(FORWARD_STDERR) private readonly forwardStderr: boolean,
  ) {
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

  setLogLevel(scope: string, level: pino.Level) {
    this.childLevels[scope] = level;
  }

  private getLogLevel(scope: string): string {
    return this.childLevels[scope] ?? this.logLevel;
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
