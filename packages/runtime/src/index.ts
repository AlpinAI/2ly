import 'reflect-metadata';
import dotenv from 'dotenv';
import { container, start } from './di/container';
import { MainService } from './services/runtime.main.service';

dotenv.config();
start();

const mainService = container.get(MainService);
mainService.start('index');
