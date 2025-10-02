/**
 * Base class for all services.
 */
export abstract class Service {

  readonly abstract name: string;
  private consumers = new Set<string>();
  protected state: 'STOPPED' | 'STARTING' | 'STARTED' | 'STOPPING' = 'STOPPED';
  private currentPromise?: Promise<void>;
  /**
 * The date and time the service was started.
 */
  protected startedAt = new Date().toISOString();

  async start(consumer: string): Promise<void> {
    if (this.consumers.has(consumer)) {
      throw new Error(`Service ${this.name} has already a consumer called ${consumer}. Consumers must be unique!`);
    }

    if (this.state === 'STARTING') {
      if (!this.currentPromise) {
        throw new Error(`Service state is STARTING but no currentPromise set -> should not happen`);
      }
      this.consumers.add(consumer);
      return this.currentPromise;
    } else if (this.state === 'STARTED') {
      this.consumers.add(consumer);
      return;
    } else if (this.state === 'STOPPED') {
      this.consumers.add(consumer);
      this.state = 'STARTING';
      this.currentPromise = this.initialize();
      await this.currentPromise;
      this.currentPromise = undefined;
      this.startedAt = new Date().toISOString();
      this.state = 'STARTED';
      return;
    } else if (this.state === 'STOPPING') {
      if (!this.currentPromise) {
        throw new Error(`Service state is STOPPING but no currentPromise set -> should not happen`);
      }
      await this.currentPromise;
      return this.start(consumer);
    } else {
      throw new Error(`Unknown state ${this.state}`);
    }
  }

  /**
   * Stop the service.
   */
  async stop(consumer: string) {
    if (!this.consumers.has(consumer)) {
      // silently ignore
    }

    this.consumers.delete(consumer);
    if (this.consumers.size > 0) {
      return;
    }

    // when consumers = 0 => shutdown the service
    if (this.state === 'STARTED') {
      this.state = 'STOPPING';
      this.currentPromise = this.shutdown();
      await this.currentPromise;
      this.state = 'STOPPED';
      this.currentPromise = undefined;
      return;
    } else if (this.state === 'STOPPING') {
      if (!this.currentPromise) {
        throw new Error(`Service state is STOPPING but no currentPromise set -> should not happen`);
      }
      console.warn('Not sure this should happen ?? A service should not be stopping and a consumer unregister itself one more time ??')
      return this.currentPromise;
    } else if (this.state === 'STARTING') {
      if (!this.currentPromise) {
        throw new Error(`Service state is STARTING but no currentPromise set -> should not happen`);
      }
    } else if (this.state === 'STOPPED') {
      console.warn('Not sure this should happen ?? A service should not be stopped and a consumer unregister itself one more time ??')
    } else {
      throw new Error(`Unknown state ${this.state}`);
    }
  }

  /**
   * Resolve when the service is STARTED
   */
  async waitForStarted() {
    if (this.state === 'STARTED') {
      return;
    } else if (this.state === 'STARTING') {
      return this.currentPromise;
    } else {
      throw new Error('Hum... can we waitForStarted when its not starting ?')
    }
  }

  protected abstract initialize(): Promise<void>;
  protected abstract shutdown(): Promise<void>;
}
