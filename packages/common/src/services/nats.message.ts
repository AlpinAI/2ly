import { Msg } from '@nats-io/nats-core';

export class NatsMessage<T = unknown> {
  static type: string;
  static registry: Map<string, typeof NatsMessage<unknown>> = new Map();

  public readonly type: string;
  public readonly data: T;
  public readonly originalMsg: Msg | undefined;

  constructor(data: T, originalMsg: Msg | undefined = undefined) {
    try {
      this.validate(data);
    } catch (error) {
      throw new Error(`Invalid message data: ${error}`);
    }
    this.data = data;
    this.type = (this.constructor as typeof NatsMessage).type;
    this.originalMsg = originalMsg;
  }

  static create<T = unknown>(data: T): NatsMessage<T> {
    const messageClass = this.registry.get(this.type);
    if (!messageClass || !this.type) {
      throw new Error(`Message type ${this.type} was not registered`);
    }
    const message = new messageClass(data) as NatsMessage<T>;
    if (message instanceof NatsRequest || message instanceof NatsPublish) {
      message.setSubject(message.getSubject());
    }
    return message;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(_data: T): boolean {
    throw new Error('validate method not implemented.');
  }

  static register(message: typeof NatsMessage<unknown>) {
    if (this.registry.has(message.type)) {
      throw new Error(`Message type ${message.type} already registered`);
    }
    this.registry.set(message.type, message);
  }

  static unregister(message: typeof NatsMessage) {
    if (!this.registry.has(message.type)) {
      throw new Error(`Message type ${message.type} was not registered`);
    }
    this.registry.delete(message.type);
  }

  static get<T = unknown>(msg: Msg): NatsMessage<T | { error: string }> {
    const data = msg.json() as RawMessage<T>;

    const messageClass = this.registry.get(data.type);
    if (!messageClass) {
      return this.getError(`Message type ${data.type} was not registered`) as NatsMessage<T | { error: string }>;
    }

    try {
      const message = new messageClass(data.data, msg) as NatsMessage<T>;
      if (message instanceof NatsRequest || message instanceof NatsPublish) {
        message.setSubject(msg.subject);
      }
      return message;
    } catch (error) {
      return this.getError(`Invalid message ${data.type}: ${error}`) as NatsMessage<T | { error: string }>;
    }
  }

  /**
   * Parse a message from raw data (e.g., from cache).
   * Unlike get(), this doesn't require a NATS Msg object.
   */
  static fromRawData<T = unknown>(rawData: RawMessage<T>): NatsMessage<T | { error: string }> {
    const messageClass = this.registry.get(rawData.type);
    if (!messageClass) {
      return this.getError(`Message type ${rawData.type} was not registered`) as NatsMessage<T | { error: string }>;
    }

    try {
      const message = new messageClass(rawData.data) as NatsMessage<T>;
      if (message instanceof NatsRequest || message instanceof NatsPublish) {
        if (rawData.subject) {
          message.setSubject(rawData.subject);
        }
      }
      return message;
    } catch (error) {
      return this.getError(`Invalid message ${rawData.type}: ${error}`) as NatsMessage<T | { error: string }>;
    }
  }

  static getError(message: string) {
    const messageClass = this.registry.get('error');
    if (!messageClass) {
      throw new Error(`Message type error was not registered`);
    }
    return new messageClass({ error: message });
  }

  prepareData(): RawMessage<T> {
    return {
      type: this.type,
      data: this.data,
    };
  }
}

class NatsWithSubject<T = unknown> extends NatsMessage<T> {
  protected subject: string;
  constructor(data: T, originalMsg: Msg | undefined = undefined) {
    super(data, originalMsg);
    this.subject = this.getSubject() ?? '';
  }
  /**
   * Requests must have a specific subject based on its message type and message content
   * Therefore, this method must be implemented by the request message type
   */
  getSubject(): string {
    throw new Error('getSubject method not implemented.');
  }

  setSubject(subject: string) {
    this.subject = subject;
  }

  prepareData(): RawMessage<T> {
    const data = super.prepareData();
    return {
      ...data,
      subject: this.subject,
    };
  }
}

export class NatsRequest<T = unknown> extends NatsWithSubject<T> {

  shouldRespond(): boolean {
    return this.originalMsg?.reply !== undefined;
  }

  respond<T = unknown>(msg: NatsMessage<T>) {
    if (!this.shouldRespond()) {
      return;
    }
    this.originalMsg!.respond(JSON.stringify(msg.prepareData()));
  }
}

export class NatsPublish<T = unknown> extends NatsWithSubject<T> {

}

export class NatsResponse<T = unknown> extends NatsMessage<T> {

  /**
   * Responses don't need to have a specific subject
   */
  getSubject(): string {
    return '';
  }
}

export interface RawMessage<T> {
  type: string;
  subject?: string;
  data: T;
}
