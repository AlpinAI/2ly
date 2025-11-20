import 'reflect-metadata';
import { resolve } from 'path';
import { container, start } from './di/container';
import { MainService } from './services/runtime.main.service';
import { loadEnv } from '@2ly/common';

// Load environment variables in layers (shared keys first, then package-specific)
const projectRoot = resolve(__dirname, '../../..');
const packagePath = resolve(__dirname, '../');
loadEnv(projectRoot, packagePath, process.env.FORWARD_STDERR !== 'false');

start();

const mainService = container.get(MainService);
mainService.start('index');
