import { vi } from 'vitest';

export class ControllableAsyncIterator<T> implements AsyncIterableIterator<T> {
    private queue: T[] = [];
    private resolvers: ((value: IteratorResult<T>) => void)[] = [];
    private done = false;

    push(value: T) {
        if (this.done) return;
        if (this.resolvers.length > 0) {
            const resolve = this.resolvers.shift()!;
            resolve({ value, done: false });
        } else {
            this.queue.push(value);
        }
    }

    complete() {
        this.done = true;
        while (this.resolvers.length > 0) {
            const resolve = this.resolvers.shift()!;
            resolve({ value: undefined as unknown as T, done: true });
        }
    }

    [Symbol.asyncIterator]() {
        return this;
    }

    next(): Promise<IteratorResult<T>> {
        if (this.queue.length > 0) {
            const value = this.queue.shift()!;
            return Promise.resolve({ value, done: false });
        }
        if (this.done) {
            return Promise.resolve({ value: undefined as unknown as T, done: true });
        }
        return new Promise((resolve) => this.resolvers.push(resolve));
    }
}

export class FakeNatsSubscription<T> implements AsyncIterable<T> {
    constructor(private iterator: ControllableAsyncIterator<T>) { }
    [Symbol.asyncIterator]() { return this.iterator; }
    unsubscribe = vi.fn();
    drain = vi.fn(async () => { });
    isClosed = vi.fn(() => false);
}