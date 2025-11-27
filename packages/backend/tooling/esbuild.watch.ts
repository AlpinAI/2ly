import * as esbuild from 'esbuild';
import { createBuildSettings } from './esbuild.settings';
import { spawn, ChildProcess } from 'child_process';
import { config } from 'dotenv';
import { join } from 'path';

// Load .env file from backend package root (cwd is packages/backend when running npm run dev)
const result = config({ path: join(process.cwd(), '.env') });

if (result.error) {
  console.warn('Could not load .env file:', result.error.message);
  console.warn('Trying to start without .env - make sure ENCRYPTION_KEY is set');
} else {
  console.log('Loaded .env file successfully');
  console.log('ENCRYPTION_KEY is set:', !!process.env.ENCRYPTION_KEY);
}

const settings = createBuildSettings({ minify: false, sourcemap: true });

let nodeProcess: ChildProcess | null = null;
const startNodeProcess = () => {
  if (nodeProcess) {
    nodeProcess.kill();
  }
  nodeProcess = spawn('node', ['--enable-source-maps', 'dist/index.js'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env, // Inherit environment variables including those from .env
  });

  nodeProcess.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`Node process exited with code ${code}`);
    }
  });
};

const restartPlugin = {
  name: 'restart-plugin',
  setup(build: esbuild.PluginBuild) {
    build.onEnd(() => {
      console.log('Build complete, restarting node process');
      startNodeProcess();
    });
  },
};

settings.plugins!.push(restartPlugin);

async function dev() {
  const ctx = await esbuild.context(settings);

  // initial build
  await ctx.rebuild();
  startNodeProcess();

  // watch for changes
  await ctx.watch();
  console.log('Watching for changes...');
}

// Clean up on exit
process.on('SIGINT', () => {
  if (nodeProcess) {
    nodeProcess.kill();
  }
  process.exit(0);
});

dev().catch(console.error);
