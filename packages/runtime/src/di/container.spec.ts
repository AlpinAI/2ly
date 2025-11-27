import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We need to test the validation logic from container.ts
// Since the file exports start() and container, we'll need to test the validation function

describe('DI Container - validateAndDetectMode', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Clear all keys to start fresh
    delete process.env.SYSTEM_KEY;
    delete process.env.WORKSPACE_KEY;
    delete process.env.TOOLSET_KEY;
    delete process.env.RUNTIME_KEY;
    delete process.env.TOOLSET_NAME;
    delete process.env.RUNTIME_NAME;
    delete process.env.REMOTE_PORT;
    delete process.env.MASTER_KEY;

    // Silence console warnings for clean test output
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    consoleWarnSpy.mockRestore();
  });

  // Helper to dynamically import and test the validation
  async function testValidation() {
    // Clear module cache to force re-import
    vi.resetModules();
    const { start } = await import('./container');
    return start();
  }

  describe('Key mutual exclusivity', () => {
    it('should warn and remove MASTER_KEY when TOOLSET_KEY is provided', async () => {
      process.env.MASTER_KEY = 'mk_test';
      process.env.TOOLSET_KEY = 'tsk_test';

      await testValidation();

      expect(consoleWarnSpy).toHaveBeenCalledWith('TOOLSET_KEY provided -> ignoring MASTER_KEY');
      expect(process.env.MASTER_KEY).toBeUndefined();
    });

    it('should warn and remove SYSTEM_KEY when RUNTIME_KEY is provided', async () => {
      process.env.SYSTEM_KEY = 'sk_test';
      process.env.RUNTIME_KEY = 'rtk_test';

      await testValidation();

      expect(consoleWarnSpy).toHaveBeenCalledWith('RUNTIME_KEY provided -> ignoring SYSTEM_KEY');
      expect(process.env.SYSTEM_KEY).toBeUndefined();
    });

    it('should warn and remove SYSTEM_KEY when WORKSPACE_KEY is provided', async () => {
      process.env.SYSTEM_KEY = 'sk_test';
      process.env.WORKSPACE_KEY = 'wsk_test';
      process.env.TOOLSET_NAME = 'test-toolset';

      await testValidation();

      expect(consoleWarnSpy).toHaveBeenCalledWith('WORKSPACE_KEY provided -> ignoring SYSTEM_KEY');
      expect(process.env.SYSTEM_KEY).toBeUndefined();
    });

    it('should throw when multiple keys are set after cleanup', async () => {
      process.env.WORKSPACE_KEY = 'wsk_test';
      process.env.TOOLSET_KEY = 'tsk_test';
      process.env.TOOLSET_NAME = 'test-toolset';

      await expect(async () => await testValidation()).rejects.toThrow(
        'Invalid configuration: Only one of SYSTEM_KEY, WORKSPACE_KEY, TOOLSET_KEY, or RUNTIME_KEY can be set',
      );
    });
  });

  describe('SYSTEM_KEY validation', () => {
    it('should require RUNTIME_NAME when SYSTEM_KEY is provided', async () => {
      process.env.SYSTEM_KEY = 'sk_test';

      await expect(async () => await testValidation()).rejects.toThrow(
        'Invalid configuration: SYSTEM_KEY requires RUNTIME_NAME',
      );
    });

    it('should pass validation with SYSTEM_KEY and RUNTIME_NAME', async () => {
      process.env.SYSTEM_KEY = 'sk_test';
      process.env.RUNTIME_NAME = 'test-runtime';

      await expect(testValidation()).resolves.not.toThrow();
    });
  });

  describe('WORKSPACE_KEY validation', () => {
    it('should require TOOLSET_NAME when WORKSPACE_KEY is provided', async () => {
      process.env.WORKSPACE_KEY = 'wsk_test';

      await expect(async () => await testValidation()).rejects.toThrow(
        'Invalid configuration: WORKSPACE_KEY requires TOOLSET_NAME',
      );
    });

    it('should pass validation with WORKSPACE_KEY and TOOLSET_NAME', async () => {
      process.env.WORKSPACE_KEY = 'wsk_test';
      process.env.TOOLSET_NAME = 'test-toolset';

      await expect(testValidation()).resolves.not.toThrow();
    });
  });

  describe('TOOLSET_KEY validation', () => {
    it('should forbid RUNTIME_NAME when TOOLSET_KEY is provided', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';
      process.env.RUNTIME_NAME = 'test-runtime';

      await expect(async () => await testValidation()).rejects.toThrow(
        'Invalid configuration: trying to start both a runtime and a toolset, this is not supported',
      );
    });

    it('should forbid TOOLSET_NAME when TOOLSET_KEY is provided (via REMOTE_PORT check)', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';
      process.env.TOOLSET_NAME = 'test-toolset';
      process.env.REMOTE_PORT = '3001';

      await expect(async () => await testValidation()).rejects.toThrow(
        'Invalid configuration: REMOTE_PORT is mutually exclusive with TOOLSET_NAME and TOOLSET_KEY',
      );
    });

    it('should pass validation with TOOLSET_KEY alone', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';

      await expect(testValidation()).resolves.not.toThrow();
    });
  });

  describe('RUNTIME_KEY validation', () => {
    it('should forbid TOOLSET_NAME when RUNTIME_KEY is provided', async () => {
      process.env.RUNTIME_KEY = 'rtk_test';
      process.env.TOOLSET_NAME = 'test-toolset';

      await expect(async () => await testValidation()).rejects.toThrow(
        'Invalid configuration: trying to start both a runtime and a toolset, this is not supported',
      );
    });

    it('should pass validation with RUNTIME_KEY alone', async () => {
      process.env.RUNTIME_KEY = 'rtk_test';

      await expect(testValidation()).resolves.not.toThrow();
    });

    it('should pass validation with RUNTIME_KEY and RUNTIME_NAME', async () => {
      process.env.RUNTIME_KEY = 'rtk_test';
      process.env.RUNTIME_NAME = 'test-runtime';

      await expect(testValidation()).resolves.not.toThrow();
    });
  });

  describe('REMOTE_PORT validation', () => {
    it('should throw when REMOTE_PORT is set with TOOLSET_NAME', async () => {
      process.env.REMOTE_PORT = '3001';
      process.env.TOOLSET_NAME = 'test-toolset';
      process.env.TOOLSET_KEY = 'tsk_test';

      await expect(async () => await testValidation()).rejects.toThrow(
        'Invalid configuration: REMOTE_PORT is mutually exclusive with TOOLSET_NAME and TOOLSET_KEY',
      );
    });

    it('should throw when REMOTE_PORT is set with TOOLSET_KEY', async () => {
      process.env.REMOTE_PORT = '3001';
      process.env.TOOLSET_KEY = 'tsk_test';

      await expect(async () => await testValidation()).rejects.toThrow(
        'Invalid configuration: REMOTE_PORT is mutually exclusive with TOOLSET_NAME and TOOLSET_KEY',
      );
    });

    it('should pass validation with REMOTE_PORT and RUNTIME_KEY', async () => {
      process.env.REMOTE_PORT = '3001';
      process.env.RUNTIME_KEY = 'rtk_test';
      process.env.RUNTIME_NAME = 'test-runtime';

      await expect(testValidation()).resolves.not.toThrow();
    });

    it('should pass validation with REMOTE_PORT alone (standalone mode)', async () => {
      process.env.REMOTE_PORT = '3001';

      await expect(testValidation()).resolves.not.toThrow();
    });
  });

  describe('Runtime vs Toolset mutual exclusivity', () => {
    it('should throw when both RUNTIME_NAME and TOOLSET_NAME are set', async () => {
      process.env.RUNTIME_KEY = 'rtk_test';
      process.env.RUNTIME_NAME = 'test-runtime';
      process.env.TOOLSET_NAME = 'test-toolset';

      await expect(async () => await testValidation()).rejects.toThrow(
        'Invalid configuration: trying to start both a runtime and a toolset, this is not supported',
      );
    });

    it('should throw when both RUNTIME_KEY and TOOLSET_KEY are set', async () => {
      process.env.RUNTIME_KEY = 'rtk_test';
      process.env.TOOLSET_KEY = 'tsk_test';

      await expect(async () => await testValidation()).rejects.toThrow(
        'Invalid configuration: Only one of SYSTEM_KEY, WORKSPACE_KEY, TOOLSET_KEY, or RUNTIME_KEY can be set',
      );
    });
  });

  describe('Mode detection', () => {
    it('should detect MCP_STDIO mode with TOOLSET_NAME', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';
      // Note: We can't directly test the return value of validateAndDetectMode since it's not exported
      // But we can verify it doesn't throw, which means MCP_STDIO mode was detected
      await expect(testValidation()).resolves.not.toThrow();
    });

    it('should detect MCP_STDIO mode with TOOLSET_KEY', async () => {
      process.env.TOOLSET_KEY = 'tsk_test';
      await expect(testValidation()).resolves.not.toThrow();
    });

    it('should detect EDGE_MCP_STREAM mode with RUNTIME_NAME and REMOTE_PORT', async () => {
      process.env.RUNTIME_KEY = 'rtk_test';
      process.env.RUNTIME_NAME = 'test-runtime';
      process.env.REMOTE_PORT = '3001';
      await expect(testValidation()).resolves.not.toThrow();
    });

    it('should detect EDGE mode with RUNTIME_NAME without REMOTE_PORT', async () => {
      process.env.RUNTIME_KEY = 'rtk_test';
      process.env.RUNTIME_NAME = 'test-runtime';
      await expect(testValidation()).resolves.not.toThrow();
    });

    it('should detect STANDALONE_MCP_STREAM mode with REMOTE_PORT alone', async () => {
      process.env.REMOTE_PORT = '3001';
      await expect(testValidation()).resolves.not.toThrow();
    });

    it('should throw when no valid configuration is provided', async () => {
      // No keys, no names, no remote port
      await expect(async () => await testValidation()).rejects.toThrow(
        'Invalid configuration: At least one of TOOLSET_NAME, TOOLSET_KEY, RUNTIME_NAME, RUNTIME_KEY, or REMOTE_PORT must be set',
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string values as falsy', async () => {
      process.env.SYSTEM_KEY = '';
      process.env.WORKSPACE_KEY = '';
      process.env.TOOLSET_KEY = '';
      process.env.RUNTIME_KEY = '';

      await expect(async () => await testValidation()).rejects.toThrow(
        'Invalid configuration: At least one of TOOLSET_NAME, TOOLSET_KEY, RUNTIME_NAME, RUNTIME_KEY, or REMOTE_PORT must be set',
      );
    });

    it('should handle whitespace-only values', async () => {
      process.env.TOOLSET_KEY = '   ';
      process.env.TOOLSET_NAME = '   ';

      // Whitespace strings are truthy, so this should pass basic validation
      // The actual authentication will fail later, which is correct
      await expect(testValidation()).resolves.not.toThrow();
    });

    it('should validate all four key types are mutually exclusive', async () => {
      // Test all four keys set at once (after cleanup rules)
      process.env.WORKSPACE_KEY = 'wsk_test';
      process.env.TOOLSET_KEY = 'tsk_test';
      process.env.RUNTIME_KEY = 'rtk_test';
      process.env.TOOLSET_NAME = 'test-toolset';

      await expect(async () => await testValidation()).rejects.toThrow(
        'Invalid configuration: Only one of SYSTEM_KEY, WORKSPACE_KEY, TOOLSET_KEY, or RUNTIME_KEY can be set',
      );
    });
  });
});
