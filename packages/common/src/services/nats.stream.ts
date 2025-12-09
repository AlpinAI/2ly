import { ConsumerConfig, ConsumerCreateOptions, JetStreamClient, JetStreamManager, RetentionPolicy, StorageType, StreamConfig, StreamInfo, ConsumerInfo } from "@nats-io/jetstream";
import { WithRequired } from "@nats-io/nats-core/internal";

/**
 * This class is a first-attempt to create a stream utility for skilder. Not yet used.
 */
export class NatsStream {

    private js?: JetStreamClient;
    private jsm?: JetStreamManager;
    private stream?: StreamInfo;

    constructor(private name: string, private subjects: string[]) {
    }

    async init(js: JetStreamClient, jsm: JetStreamManager, config: Partial<StreamConfig> = {}) {
        this.js = js;
        this.jsm = jsm;

        const streamConfig: WithRequired<Partial<StreamConfig>, 'name'> = {
            name: this.name,
            subjects: this.subjects,
            storage: StorageType.File,
            retention: RetentionPolicy.Workqueue,
            ...config,
        };

        // check if the stream already exists
        let streamExist = false;
        try {
            const stream = await this.jsm.streams.get(this.name);
            if (stream) {
                streamExist = true;
            }
        } catch {
            streamExist = false;
        }

        if (streamExist) {
            // if the stream already exists, we do not change its retention policy
            delete streamConfig.retention;
            this.stream = await this.jsm.streams.update(this.name, streamConfig);
        } else {
            this.stream = await this.jsm.streams.add(streamConfig);
        }
    }

    getName() {
        return this.name;
    }

    getSubjects() {
        return this.subjects;
    }

    createConsumer(config: Partial<ConsumerConfig>, opts?: ConsumerCreateOptions) {
        if (!this.jsm || !this.stream) {
            throw new Error('Stream not initialized');
        }
        return this.jsm.consumers.add(this.name, {
            ...config,
            ...opts,
        });
    }

    getConsumer(consumer: string | ConsumerInfo) {
        if (!this.js || !this.stream) {
            throw new Error('Stream not initialized');
        }
        return this.js.consumers.get(this.name, typeof consumer === 'string' ? consumer : consumer.name);
    }
}