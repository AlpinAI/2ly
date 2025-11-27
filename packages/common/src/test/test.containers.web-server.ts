import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import getPort from 'get-port';
import { testLog } from './test.containers.logger';

const fastify = Fastify();

export const startControllerServer = async (): Promise<number> => {
    const port = await getPort();
    process.env.TEST_CONTROLLER_SERVER_PORT = String(port);
    await fastify.listen({ port, host: '0.0.0.0' });
    testLog(`Test web server listening on port: ${port}`);
    return port;
};

export const registerRoute = (route: string, handler: (request: FastifyRequest, reply: FastifyReply) => Promise<void>) => {
    fastify.route({
        method: 'GET',
        url: route,
        handler,
    });
};

export const callRoute = async <T = void>(route: string): Promise<T> => {
    const url = `http://localhost:${process.env.TEST_CONTROLLER_SERVER_PORT}${route}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to call route ${route}: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
};