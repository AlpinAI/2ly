import { inject, injectable } from 'inversify';
import { LoggerService, Service, NatsService, SkillCallToolRequest, RuntimeCallToolResponse, dgraphResolversTypes, MCP_CALL_TOOL_TIMEOUT, isSmartSkillCall, isMCPToolCall } from '@skilder-ai/common';
import { DGraphService } from './dgraph.service';
import pino from 'pino';
import { MonitoringRepository } from '../repositories/monitoring/monitoring.repository';

@injectable()
export class MonitoringService extends Service {

    name = 'monitoring';
    private logger: pino.Logger;

    constructor(
        @inject(LoggerService) private loggerService: LoggerService,
        @inject(NatsService) private natsService: NatsService,
        @inject(DGraphService) private dgraphService: DGraphService,
        @inject(MonitoringRepository) private monitoringRepository: MonitoringRepository,
    ) {
        super();
        this.logger = this.loggerService.getLogger('monitoring');
    }

    protected async initialize() {
        this.logger.info('Initializing MonitoringService');
        await this.startService(this.natsService);
        await this.startService(this.dgraphService);
        this.monitorCallTools();
    }

    protected async shutdown() {
        this.logger.info('Shutting down MonitoringService');
        await this.stopService(this.dgraphService);
        await this.stopService(this.natsService);
    }

    private async monitorCallTools() {
        const messages = this.natsService.subscribe(SkillCallToolRequest.subscribeToAll());
        for await (const message of messages) {

            if (message instanceof SkillCallToolRequest) {
                // Persist the tool call
                this.logger.info(`TOOL CALL: ${message.originalMsg?.reply}`);
                try {
                    const promise = Promise.withResolvers<void>();
                    let toolCall: dgraphResolversTypes.ToolCall | null = null;

                    // start listening for the response immediately
                    if (message.originalMsg?.reply) {
                        (async () => {
                            this.logger.info(`Listening for the response on ${message.originalMsg!.reply!}`);
                            const response = this.natsService.subscribe(message.originalMsg!.reply!);
                            const timeout = setTimeout(async () => {
                                if (!response.isClosed()) {
                                    response.unsubscribe();
                                    await promise.promise;
                                    this.logger.error(`Tool call timed out: ${toolCall!.id}`);
                                    try {
                                        await this.monitoringRepository.errorToolCall(toolCall!.id, 'Timeout', undefined);
                                    } catch (error) {
                                        this.logger.warn(`Failed to register the tool call timeout: ${error}`);
                                    }
                                }
                            }, MCP_CALL_TOOL_TIMEOUT);
                            for await (const msg of response) {
                                if (msg instanceof RuntimeCallToolResponse) {
                                    await promise.promise;
                                    this.logger.info(`Tool call response from ${msg.data.executedByIdOrAgent}: ${JSON.stringify(msg.data)}`);
                                    clearTimeout(timeout);
                                    await this.monitoringRepository.completeToolCall(toolCall!.id, JSON.stringify(msg.data.result), msg.data.executedByIdOrAgent);
                                }
                            }
                        })()
                    }
                    // Get the tool/skill ID based on the request type
                    const mcpToolId = isMCPToolCall(message.data) ? message.data.toolId : undefined;
                    const skillId = isSmartSkillCall(message.data) ? message.data.skillId : undefined;

                    this.monitoringRepository.createToolCall({
                        toolInput: JSON.stringify(message.data.arguments),
                        calledById: message.data.from,
                        mcpToolId,
                        skillId,
                        isTest: message.data.isTest,
                    }).then((result) => {
                        toolCall = result;
                        this.logger.info(`Tool call persisted: ${toolCall.id}`);
                        promise.resolve();
                    }).catch((error) => {
                        promise.reject(error);
                    });
                } catch (error) {
                    this.logger.error(`Error monitoring tool call: ${error}`);
                }
            }


        }

    }

}