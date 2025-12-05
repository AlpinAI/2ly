import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NatsContainer, StartedNatsContainer } from '@testcontainers/nats';
import { Container } from 'inversify';
import { LoggerService, MAIN_LOGGER_NAME, LOG_LEVEL, LOG_LEVELS, FORWARD_STDERR } from './logger.service';
import { NatsService, NATS_CONNECTION_OPTIONS, HEARTBAT_TTL, EPHEMERAL_TTL } from './nats.service';
import { NatsConnection } from '@nats-io/nats-core';
import { NatsMessage, NatsPublish, NatsRequest, NatsResponse } from './nats.message';
import { DEFAULT_REQUEST_TIMEOUT } from '../constants';

// Helper function to access private nats connection for testing
function getNatsConnection(service: NatsService): NatsConnection | null {
    return (service as unknown as { nats: NatsConnection | null }).nats;
}

// Test message types
class TestPublishMessage extends NatsPublish<{ content: string }> {
    static type = 'test.publish';

    validate(data: { content: string }): boolean {
        return typeof data.content === 'string';
    }

    getSubject(): string {
        return 'test.publish.subject';
    }
}

class TestRequestMessage extends NatsRequest<{ query: string }> {
    static type = 'test.request';

    validate(data: { query: string }): boolean {
        return typeof data.query === 'string';
    }

    getSubject(): string {
        return 'test.request.subject';
    }
}

class TestResponseMessage extends NatsResponse<{ result: string }> {
    static type = 'test.response';

    validate(data: { result: string }): boolean {
        return typeof data.result === 'string';
    }
}

describe('NatsService Integration', () => {
    let container: Container;
    let natsContainer: StartedNatsContainer;

    beforeAll(async () => {
        natsContainer = await new NatsContainer('nats:2.10-alpine')
            .withJetStream()
            .start();

        // Register test message types
        NatsMessage.register(TestPublishMessage);
        NatsMessage.register(TestRequestMessage);
        NatsMessage.register(TestResponseMessage);
    }, 60000);

    afterAll(async () => {
        if (natsContainer) {
            await natsContainer.stop();
        }

        // Unregister test message types
        NatsMessage.unregister(TestPublishMessage as typeof NatsMessage);
        NatsMessage.unregister(TestRequestMessage as typeof NatsMessage);
        NatsMessage.unregister(TestResponseMessage as typeof NatsMessage);
    }, 30000);

    beforeEach(async () => {
        container = new Container();
        container.bind(MAIN_LOGGER_NAME).toConstantValue('test');
        container.bind(LOG_LEVEL).toConstantValue('silent');
        container.bind(LOG_LEVELS).toConstantValue(undefined);
        container.bind(FORWARD_STDERR).toConstantValue(false);
        container.bind(LoggerService).toSelf().inSingletonScope();
        container.bind(HEARTBAT_TTL).toConstantValue(1000);
        container.bind(EPHEMERAL_TTL).toConstantValue(1000);
        container.bind(NATS_CONNECTION_OPTIONS).toConstantValue({
            ...natsContainer.getConnectionOptions(),
            name: 'test-client',
        });
        container.bind(NatsService).toSelf().inSingletonScope();
    });

    afterEach(async () => {
        const svc = container.get(NatsService);
        if (svc.isConnected()) await svc.stop('nats');

    });

    it('connects and reports isConnected', async () => {
        const svc = container.get(NatsService);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await svc.start('nats');
        // Verify that the NATS connection was established
        const natsConnection = getNatsConnection(svc);
        expect(natsConnection).toBeDefined();
        expect(natsConnection?.isClosed()).toBe(false);
        expect(svc.isConnected()).toBe(true);
    });

    it('tear down when stopping', async () => {
        const svc = container.get(NatsService);
        await svc.start('nats');
        // Access the private nats property using helper function
        const natsConnection = getNatsConnection(svc);
        expect(svc.isConnected()).toBe(true);
        await svc.stop('nats');
        expect(svc.isConnected()).toBe(false);
        expect(natsConnection?.isClosed()).toBe(true);
    });

    it('publish correctly NatsPublish objects', async () => {
        const svc = container.get(NatsService);
        await svc.start('nats');

        const message = TestPublishMessage.create({ content: 'test message' }) as TestPublishMessage;
        const subscription = svc.subscribe('test.publish.subject');

        const messages: NatsMessage[] = [];
        const messagePromise = (async () => {
            for await (const msg of subscription) {
                messages.push(msg);
                break;
            }
        })();

        svc.publish(message);
        await messagePromise;

        expect(messages).toHaveLength(1);
        expect((messages[0] as TestPublishMessage).data.content).toBe('test message');
        expect(messages[0].type).toBe('test.publish');
    });

    it('throw when using publish with invalid input', async () => {
        const svc = container.get(NatsService);
        await svc.start('nats');

        // Create a message without using the create method to avoid setting subject
        const invalidMessage = new TestPublishMessage({ content: 'test' });
        // Manually clear the subject to make it invalid
        Object.defineProperty(invalidMessage, 'subject', { value: undefined, writable: true });

        expect(() => svc.publish(invalidMessage)).toThrow('Subject is required for NATS publish');
    });

    it('converts NatsPublish objects into core NATS messages', async () => {
        const svc = container.get(NatsService);
        await svc.start('nats');
        const message = TestPublishMessage.create({ content: 'test message' }) as TestPublishMessage;
        const natsConnection = getNatsConnection(svc);
        const publishSpy = vi.spyOn(natsConnection!, 'publish');
        svc.publish(message);
        expect(publishSpy).toHaveBeenCalledWith('test.publish.subject', expect.any(String));
    });

    it('request correctly NatsRequest objects', async () => {
        const svc = container.get(NatsService);
        await svc.start('nats');

        // Set up a responder
        const subscription = svc.subscribe('test.request.subject');
        const responderPromise = (async () => {
            for await (const msg of subscription) {
                if (msg instanceof TestRequestMessage && msg.shouldRespond()) {
                    const response = TestResponseMessage.create({ result: 'response data' });
                    msg.respond(response);
                }
                break;
            }
        })();

        const requestMessage = TestRequestMessage.create({ query: 'test query' }) as TestRequestMessage;
        const response = await svc.request(requestMessage);

        expect((response as TestResponseMessage).data.result).toBe('response data');
        expect(response.type).toBe('test.response');

        await responderPromise;
    });
    it('throw when using request with invalid input', async () => {
        const svc = container.get(NatsService);
        await svc.start('nats');

        // Create a message without using the create method to avoid setting subject
        const invalidMessage = new TestRequestMessage({ query: 'test' });
        // Manually clear the subject to make it invalid
        Object.defineProperty(invalidMessage, 'subject', { value: undefined, writable: true });

        await expect(svc.request(invalidMessage)).rejects.toThrow('Subject is required for NATS request');
    });
    it('converts NatsRequest objects into core NATS messages', async () => {
        const svc = container.get(NatsService);
        await svc.start('nats');
        const message = TestRequestMessage.create({ query: 'test query' }) as TestRequestMessage;
        const natsConnection = getNatsConnection(svc);
        const requestSpy = vi.spyOn(natsConnection!, 'request');
        try {
            await svc.request(message);
        } catch (error) {
            // Expect to throw since no responder is set up
            expect(error).toBeDefined();
        }
        expect(requestSpy).toHaveBeenCalledWith('test.request.subject', expect.any(String), { retryOnTimeout: false, timeout: DEFAULT_REQUEST_TIMEOUT });
    });
    it('await request and gets a NatsResponse in return', async () => {
        const svc = container.get(NatsService);
        await svc.start('nats');

        // Set up a responder that returns a proper NatsResponse
        const subscription = svc.subscribe('test.request.subject');
        const responderPromise = (async () => {
            for await (const msg of subscription) {
                if (msg instanceof TestRequestMessage && msg.shouldRespond()) {
                    const response = TestResponseMessage.create({ result: 'success' });
                    msg.respond(response);
                }
                break;
            }
        })();

        const requestMessage = TestRequestMessage.create({ query: 'test' }) as TestRequestMessage;
        const response = await svc.request(requestMessage);

        expect(response).toBeInstanceOf(NatsResponse);
        expect((response as TestResponseMessage).data.result).toBe('success');

        await responderPromise;
    });
    it('throw when request reply is not a NatsResponse', async () => {
        const svc = container.get(NatsService);
        await svc.start('nats');

        // Set up a responder that returns a non-NatsResponse message
        const subscription = svc.subscribe('test.request.subject');
        const responderPromise = (async () => {
            for await (const msg of subscription) {
                if (msg instanceof TestRequestMessage && msg.shouldRespond()) {
                    // Respond with a regular NatsMessage instead of NatsResponse
                    const response = TestPublishMessage.create({ content: 'wrong type' });
                    msg.respond(response);
                }
                break;
            }
        })();

        const requestMessage = TestRequestMessage.create({ query: 'test' }) as TestRequestMessage;

        await expect(svc.request(requestMessage)).rejects.toThrow('Invalid response, must be a NatsResponse');

        await responderPromise;
    });
    it('subscribe to subjects and yields NatsMessage objects accordingly', async () => {
        const svc = container.get(NatsService);
        await svc.start('nats');

        const subscription = svc.subscribe('test.publish.subject');
        const messages: NatsMessage[] = [];

        const messagePromise = (async () => {
            for await (const msg of subscription) {
                messages.push(msg);
                if (messages.length >= 2) break;
            }
        })();

        // Publish two messages
        const message1 = TestPublishMessage.create({ content: 'message 1' }) as TestPublishMessage;
        const message2 = TestPublishMessage.create({ content: 'message 2' }) as TestPublishMessage;

        svc.publish(message1);
        svc.publish(message2);

        await messagePromise;

        expect(messages).toHaveLength(2);
        expect(messages[0]).toBeInstanceOf(TestPublishMessage);
        expect(messages[1]).toBeInstanceOf(TestPublishMessage);
        expect((messages[0] as TestPublishMessage).data.content).toBe('message 1');
        expect((messages[1] as TestPublishMessage).data.content).toBe('message 2');
    });

    it('heartbeat puts value, lists keys, and deletes with kill', async () => {
        const svc = container.get(NatsService);
        await svc.start('nats');

        const id = 'hb-1';
        svc.heartbeat(id, { node: 'n1' });

        const keysBeforeKill = await svc.heartbeatKeys();
        expect(keysBeforeKill).toContain(id);

        svc.kill(id);
        const keysAfterKill = await svc.heartbeatKeys();
        expect(keysAfterKill).not.toContain(id);
    });

    it('observeHeartbeat yields updates and then terminates on timeout', async () => {
        const svc = container.get(NatsService);
        await svc.start('nats');

        const id = 'hb-obs-1';
        const iterator = await svc.observeHeartbeat(id);

        const received: Array<Record<string, string>> = [];
        const consume = (async () => {
            for await (const v of iterator) {
                received.push(v);
                break;
            }
        })();

        svc.heartbeat(id, { node: 'n2' });
        await consume;
        expect(received.length).toBe(1);

        // Do not send more heartbeats; iterator should close after TTL silently
        await new Promise((r) => setTimeout(r, 1300));
    });

    it('observeHeartbeat terminates when heartbeat is missed', async () => {
        const svc = container.get(NatsService);
        await svc.start('nats');
        const id = 'hb-obs-2';
        const stream = await svc.observeHeartbeat(id);
        let closed = false;
        const consumer = (async () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for await (const _ of stream) {
                // no-op
            }
            closed = true;
        })();
        await new Promise((r) => setTimeout(r, 1300));
        expect(closed).toBe(true);
        await consumer;
    });

    it('ephemeral publish is observed via observeEphemeral', async () => {
        const svc = container.get(NatsService);
        await svc.start('nats');

        const subject = 'ephemeral.subject.test';
        const watcher = await svc.observeEphemeral(subject);

        const messages: NatsMessage[] = [];
        const waitOne = (async () => {
            for await (const m of watcher) {
                messages.push(m);
                break;
            }
        })();

        const msg = TestPublishMessage.create({ content: 'e1' }) as TestPublishMessage;
        Object.defineProperty(msg, 'subject', { value: subject, writable: true });
        await svc.publishEphemeral(msg);

        await waitOne;
        expect(messages).toHaveLength(1);
        expect(messages[0]).toBeInstanceOf(TestPublishMessage);
        expect((messages[0] as TestPublishMessage).data.content).toBe('e1');
    });
});