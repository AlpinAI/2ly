import { resolve } from 'path';
import { container, start } from './di/container';
import { MainService } from './services/backend.main.service';
import 'reflect-metadata';
import { loadEnv } from '@2ly/common';

// Load environment variables in layers (shared keys first, then package-specific)
const projectRoot = resolve(__dirname, '../../..');
const packagePath = resolve(__dirname, '../');
loadEnv(projectRoot, packagePath);

start();

const mainService = container.get(MainService);
mainService.start('index');

// REFERENCES
// as-integration-fastify is using a fork since: https://github.com/apollo-server-integrations/apollo-server-integration-fastify/issues/296
// Adding authorization with JWT, example of context : https://www.npmjs.com/package/@nitra/as-integrations-fastify
// Subscription pubsub lib: https://www.npmjs.com/package/graphql-subscriptions
