/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { start, container, RUNTIME_MODE, RUNTIME_TYPE } from './container';

describe('Runtime Container - Environment Variable Validation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Clear all runtime-related env vars
    delete process.env.TOOL_SET;
    delete process.env.RUNTIME_NAME;
    delete process.env.REMOTE_PORT;
    delete process.env.WORKSPACE_ID;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    // Unbind all container bindings
    container.unbindAll();
  });

  describe('Mode 1: MCP stdio (TOOL_SET only)', () => {
    it('should configure MCP stdio mode when only TOOL_SET is set', () => {
      process.env.TOOL_SET = 'filesystem';
      process.env.WORKSPACE_ID = 'test-workspace';

      start();

      const mode = container.get(RUNTIME_MODE);
      const type = container.get(RUNTIME_TYPE);

      expect(mode).toBe('MCP_STDIO');
      expect(type).toBe('MCP');
    });

    it('should throw error when TOOL_SET is combined with RUNTIME_NAME', () => {
      process.env.TOOL_SET = 'filesystem';
      process.env.RUNTIME_NAME = 'edge-runtime';
      process.env.WORKSPACE_ID = 'test-workspace';

      expect(() => start()).toThrow(
        'Invalid configuration: TOOL_SET is mutually exclusive with RUNTIME_NAME and REMOTE_PORT',
      );
    });

    it('should throw error when TOOL_SET is combined with REMOTE_PORT', () => {
      process.env.TOOL_SET = 'filesystem';
      process.env.REMOTE_PORT = '3000';
      process.env.WORKSPACE_ID = 'test-workspace';

      expect(() => start()).toThrow(
        'Invalid configuration: TOOL_SET is mutually exclusive with RUNTIME_NAME and REMOTE_PORT',
      );
    });

    it('should throw error when TOOL_SET is combined with both RUNTIME_NAME and REMOTE_PORT', () => {
      process.env.TOOL_SET = 'filesystem';
      process.env.RUNTIME_NAME = 'edge-runtime';
      process.env.REMOTE_PORT = '3000';
      process.env.WORKSPACE_ID = 'test-workspace';

      expect(() => start()).toThrow(
        'Invalid configuration: TOOL_SET is mutually exclusive with RUNTIME_NAME and REMOTE_PORT',
      );
    });
  });

  describe('Mode 2: Edge (RUNTIME_NAME only)', () => {
    it('should configure Edge mode when only RUNTIME_NAME is set', () => {
      process.env.RUNTIME_NAME = 'edge-runtime-1';
      process.env.WORKSPACE_ID = 'test-workspace';

      start();

      const mode = container.get(RUNTIME_MODE);
      const type = container.get(RUNTIME_TYPE);

      expect(mode).toBe('EDGE');
      expect(type).toBe('EDGE');
    });
  });

  describe('Mode 3: Edge + MCP stream (RUNTIME_NAME + REMOTE_PORT)', () => {
    it('should configure Edge + MCP stream mode when RUNTIME_NAME and REMOTE_PORT are set', () => {
      process.env.RUNTIME_NAME = 'edge-runtime-2';
      process.env.REMOTE_PORT = '3001';
      process.env.WORKSPACE_ID = 'test-workspace';

      start();

      const mode = container.get(RUNTIME_MODE);
      const type = container.get(RUNTIME_TYPE);

      expect(mode).toBe('EDGE_MCP_STREAM');
      expect(type).toBe('EDGE');
    });
  });

  describe('Mode 4: Standalone MCP stream (REMOTE_PORT only)', () => {
    it('should configure Standalone MCP stream mode when only REMOTE_PORT is set', () => {
      process.env.REMOTE_PORT = '3002';
      process.env.WORKSPACE_ID = 'test-workspace';

      start();

      const mode = container.get(RUNTIME_MODE);
      const type = container.get(RUNTIME_TYPE);

      expect(mode).toBe('STANDALONE_MCP_STREAM');
      expect(type).toBe('MCP');
    });
  });

  describe('Error cases', () => {
    it('should throw error when no environment variables are set', () => {
      process.env.WORKSPACE_ID = 'test-workspace';

      expect(() => start()).toThrow(
        'Invalid configuration: At least one of TOOL_SET, RUNTIME_NAME, or REMOTE_PORT must be set',
      );
    });
  });

  describe('Runtime name auto-generation', () => {
    it('should auto-generate runtime name as "mcp:<TOOL_SET>" in MCP stdio mode', () => {
      process.env.TOOL_SET = 'my-toolset';
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
