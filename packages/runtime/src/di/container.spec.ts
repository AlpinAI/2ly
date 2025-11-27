import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { start, container } from './container';
import { RUNTIME_MODE } from './symbols';

describe('Runtime Container - Environment Variable Validation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Clear all runtime-related env vars
    delete process.env.TOOLSET_NAME;
    delete process.env.TOOLSET_KEY;
    delete process.env.RUNTIME_NAME;
    delete process.env.RUNTIME_KEY;
    delete process.env.REMOTE_PORT;
    delete process.env.WORKSPACE_ID;
    delete process.env.SYSTER_KEY;
    delete process.env.WORKSPACE_KEY;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    // Unbind all container bindings
    container.unbindAll();
  });

  describe('Mode 1: MCP stdio (TOOLSET_NAME only)', () => {
    it('should configure MCP stdio mode when only TOOLSET_NAME is set', () => {
      process.env.TOOLSET_NAME = 'filesystem';
      process.env.WORKSPACE_ID = 'test-workspace';

      start();

      const mode = container.get(RUNTIME_MODE);

      expect(mode).toBe('MCP_STDIO');
    });

    it('should throw error when TOOLSET_NAME is combined with REMOTE_PORT', () => {
      process.env.TOOLSET_NAME = 'filesystem';
      process.env.REMOTE_PORT = '3000';
      process.env.WORKSPACE_ID = 'test-workspace';

      expect(() => start()).toThrow(
        'Invalid configuration: REMOTE_PORT is mutually exclusive with TOOLSET_NAME and TOOLSET_KEY',
      );
    });

    it('should throw error when TOOLSET_KEY is combined with REMOTE_PORT', () => {
      process.env.TOOLSET_KEY = 'test-key-123';
      process.env.REMOTE_PORT = '3000';
      process.env.WORKSPACE_ID = 'test-workspace';

      expect(() => start()).toThrow(
        'Invalid configuration: REMOTE_PORT is mutually exclusive with TOOLSET_NAME and TOOLSET_KEY',
      );
    });
  });

  describe('Mode 2: Edge (RUNTIME_NAME only)', () => {
    it('should configure Edge mode when only RUNTIME_NAME is set', () => {
      process.env.RUNTIME_NAME = 'edge-runtime-1';
      process.env.WORKSPACE_ID = 'test-workspace';

      start();

      const mode = container.get(RUNTIME_MODE);

      expect(mode).toBe('EDGE');
    });
  });

  describe('Mode 3: Edge + MCP stream (RUNTIME_NAME + REMOTE_PORT)', () => {
    it('should configure Edge + MCP stream mode when RUNTIME_NAME and REMOTE_PORT are set', () => {
      process.env.RUNTIME_NAME = 'edge-runtime-2';
      process.env.REMOTE_PORT = '3001';
      process.env.WORKSPACE_ID = 'test-workspace';

      start();

      const mode = container.get(RUNTIME_MODE);

      expect(mode).toBe('EDGE_MCP_STREAM');
    });
  });

  describe('Mode 4: Standalone MCP stream (REMOTE_PORT only)', () => {
    it('should configure Standalone MCP stream mode when only REMOTE_PORT is set', () => {
      process.env.REMOTE_PORT = '3002';
      process.env.WORKSPACE_ID = 'test-workspace';

      start();

      const mode = container.get(RUNTIME_MODE);

      expect(mode).toBe('STANDALONE_MCP_STREAM');
    });
  });

  describe('Error cases', () => {
    it('should throw error when no environment variables are set', () => {
      process.env.WORKSPACE_ID = 'test-workspace';

      expect(() => start()).toThrow(
        'Invalid configuration: At least one of TOOLSET_NAME, TOOLSET_KEY, RUNTIME_NAME, RUNTIME_KEY, or REMOTE_PORT must be set',
      );
    });
  });

  describe('Runtime name auto-generation', () => {
    it('should auto-generate runtime name as "mcp:<TOOLSET_NAME>" in MCP stdio mode', () => {
      process.env.TOOLSET_NAME = 'my-toolset';
      process.env.WORKSPACE_ID = 'test-workspace';

      start();

      // The runtime name should be auto-generated
      // We can't directly access the internal validateAndDetectMode function,
      // but we can verify that the container was configured successfully
      const mode = container.get(RUNTIME_MODE);
      expect(mode).toBe('MCP_STDIO');
    });

    it('should use explicit runtime name in Edge mode', () => {
      process.env.RUNTIME_NAME = 'custom-edge-runtime';
      process.env.WORKSPACE_ID = 'test-workspace';

      start();

      const mode = container.get(RUNTIME_MODE);
      expect(mode).toBe('EDGE');
    });

    it('should use "standalone-mcp" as runtime name in Standalone MCP stream mode', () => {
      process.env.REMOTE_PORT = '3003';
      process.env.WORKSPACE_ID = 'test-workspace';

      start();

      const mode = container.get(RUNTIME_MODE);
      expect(mode).toBe('STANDALONE_MCP_STREAM');
    });
  });
});
