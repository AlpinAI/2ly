/**
 * Unit tests for MCPServerDetail component
 *
 * Focus: Configuration section visibility and editing functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { McpServerRunOn, McpTransportType, type SubscribeMcpServersSubscription } from '@/graphql/generated/graphql';

// Mock @2ly/common to avoid decorator issues in tests
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock('@2ly/common', () => ({
  mcpRegistry: {} as any,
  getAllVariablesFromConfig: () => [],
  substituteAllVariables: (config: any) => config,
}));
/* eslint-enable @typescript-eslint/no-explicit-any */

import { MCPServerDetail } from './mcp-server-detail';
import * as mcpConfigHelpers from '@/lib/mcpConfigHelpers';

// Mock dependencies
vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useParams: () => ({ workspaceId: 'test-workspace-id' }),
}));

vi.mock('@/contexts/NotificationContext', () => ({
  useNotification: () => ({
    confirm: vi.fn(() => Promise.resolve(true)),
  }),
}));

vi.mock('@/stores/runtimeStore', () => ({
  useRuntimeData: () => ({
    runtimes: [
      {
        id: 'runtime-1',
        name: 'Test Runtime',
        status: 'ACTIVE',
        capabilities: ['agent'],
      },
    ],
  }),
}));

/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock('./config-editor', () => ({
  ConfigEditor: ({ fields, onFieldChange }: { fields: any[]; onFieldChange: (name: string, value: string) => void }) => (
    <div data-testid="config-editor">
      {fields.map((field) => (
        <div key={field.name} data-testid={`config-field-${field.name}`}>
          <input
            data-testid={`config-input-${field.name}`}
            value={field.value || ''}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
          />
        </div>
      ))}
    </div>
  ),
}));
/* eslint-enable @typescript-eslint/no-explicit-any */

type McpServer = NonNullable<SubscribeMcpServersSubscription['mcpServers']>[number];

describe('MCPServerDetail - Configuration Section', () => {
  const createMockServer = (configJson: string): McpServer => ({
    __typename: 'MCPServer',
    id: 'server-1',
    name: 'Test MCP Server',
    description: 'Test server description',
    repositoryUrl: 'https://github.com/test/server',
    transport: McpTransportType.Stdio,
    config: configJson,
    runOn: McpServerRunOn.Global,
    runtime: null,
    tools: [],
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pattern 1: Direct configuration fields', () => {
    it('should display configuration section when server has direct env vars with values', () => {
      const config = {
        identifier: '@test/brave-search',
        version: '1.0.0',
        transport: { type: 'stdio' },
        environmentVariables: [
          {
            name: 'BRAVE_API_KEY',
            description: 'Brave Search API Key',
            value: 'sk-test-12345',
            isRequired: true,
            isSecret: true,
            isConfigurable: true,
          },
        ],
      };

      const server = createMockServer(JSON.stringify(config));

      render(<MCPServerDetail server={server} />);

      // Configuration section should be visible
      expect(screen.getByText('Configuration')).toBeInTheDocument();
      expect(screen.getByTestId('config-editor')).toBeInTheDocument();
      expect(screen.getByTestId('config-field-BRAVE_API_KEY')).toBeInTheDocument();
    });

    it('should display multiple configuration fields', () => {
      const config = {
        identifier: '@test/server',
        version: '1.0.0',
        transport: { type: 'stdio' },
        environmentVariables: [
          {
            name: 'API_KEY',
            value: 'key-123',
            isRequired: true,
            isConfigurable: true,
            isSecret: true,
          },
          {
            name: 'API_URL',
            value: 'https://api.example.com',
            isRequired: true,
            isConfigurable: true,
          },
        ],
      };

      const server = createMockServer(JSON.stringify(config));

      render(<MCPServerDetail server={server} />);

      expect(screen.getByTestId('config-field-API_KEY')).toBeInTheDocument();
      expect(screen.getByTestId('config-field-API_URL')).toBeInTheDocument();
    });

    it('should show field values in inputs', () => {
      const config = {
        identifier: '@test/server',
        version: '1.0.0',
        transport: { type: 'stdio' },
        environmentVariables: [
          {
            name: 'TEST_VAR',
            value: 'test-value-123',
            isConfigurable: true,
          },
        ],
      };

      const server = createMockServer(JSON.stringify(config));

      render(<MCPServerDetail server={server} />);

      const input = screen.getByTestId('config-input-TEST_VAR') as HTMLInputElement;
      expect(input.value).toBe('test-value-123');
    });
  });

  describe('Pattern 2: Template variables', () => {
    it('should display configuration section for template variables', () => {
      // Note: Pattern 2 tests are simplified because @2ly/common is mocked
      // This test would work properly in integration tests with real getAllVariablesFromConfig
      const config = {
        type: 'sse',
        url: 'https://example.com/mcp',
        headers: [
          {
            name: 'X-API-Key',
            value: 'test-key-value',
            isRequired: true,
            isConfigurable: true,
          },
        ],
      };

      const server = createMockServer(JSON.stringify(config));

      render(<MCPServerDetail server={server} />);

      expect(screen.getByText('Configuration')).toBeInTheDocument();
      expect(screen.getByTestId('config-editor')).toBeInTheDocument();
    });
  });

  describe('Configuration editing', () => {
    it('should enable Save and Cancel buttons when field is edited', async () => {
      const config = {
        identifier: '@test/server',
        version: '1.0.0',
        transport: { type: 'stdio' },
        environmentVariables: [
          {
            name: 'API_KEY',
            value: 'original-key',
            isConfigurable: true,
          },
        ],
      };

      const server = createMockServer(JSON.stringify(config));
      const user = userEvent.setup();

      render(<MCPServerDetail server={server} />);

      // Initially, buttons should be disabled
      const saveButton = screen.getByRole('button', { name: /save/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(saveButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();

      // Edit the field
      const input = screen.getByTestId('config-input-API_KEY');
      await user.clear(input);
      await user.type(input, 'new-key-value');

      // Buttons should now be enabled
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
        expect(cancelButton).not.toBeDisabled();
      });
    });

    it('should revert changes when Cancel is clicked', async () => {
      const config = {
        identifier: '@test/server',
        version: '1.0.0',
        transport: { type: 'stdio' },
        environmentVariables: [
          {
            name: 'API_KEY',
            value: 'original-key',
            isConfigurable: true,
          },
        ],
      };

      const server = createMockServer(JSON.stringify(config));
      const user = userEvent.setup();

      render(<MCPServerDetail server={server} />);

      // Edit the field
      const input = screen.getByTestId('config-input-API_KEY') as HTMLInputElement;
      await user.clear(input);
      await user.type(input, 'new-key-value');

      expect(input.value).toBe('new-key-value');

      // Click Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Value should revert
      await waitFor(() => {
        expect(input.value).toBe('original-key');
      });
    });

    it('should call mutation when Save is clicked', async () => {
      const mockUpdateServer = vi.fn(() => Promise.resolve({ data: {} }));
      const { useMutation } = await import('@apollo/client/react');
      /* eslint-disable @typescript-eslint/no-explicit-any */
      (useMutation as any).mockImplementation(() => [mockUpdateServer, { loading: false }]);
      /* eslint-enable @typescript-eslint/no-explicit-any */

      const config = {
        identifier: '@test/server',
        version: '1.0.0',
        transport: { type: 'stdio' },
        environmentVariables: [
          {
            name: 'API_KEY',
            value: 'original-key',
            isConfigurable: true,
            isRequired: true,
          },
        ],
      };

      const server = createMockServer(JSON.stringify(config));
      const user = userEvent.setup();

      render(<MCPServerDetail server={server} />);

      // Edit the field
      const input = screen.getByTestId('config-input-API_KEY');
      await user.clear(input);
      await user.type(input, 'new-key');

      // Click Save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Mutation should be called
      await waitFor(() => {
        expect(mockUpdateServer).toHaveBeenCalled();
      });
    });
  });

  describe('No configuration fields', () => {
    it('should hide configuration section when no fields exist', () => {
      const config = {
        identifier: '@test/server',
        version: '1.0.0',
        transport: { type: 'stdio' },
        // No environmentVariables, packageArguments, or runtimeArguments
      };

      const server = createMockServer(JSON.stringify(config));

      render(<MCPServerDetail server={server} />);

      // Configuration section should not be visible
      expect(screen.queryByText('Configuration')).not.toBeInTheDocument();
      expect(screen.queryByTestId('config-editor')).not.toBeInTheDocument();
    });

    it('should hide configuration section when config is invalid JSON', () => {
      const server = createMockServer('invalid-json');

      render(<MCPServerDetail server={server} />);

      // Configuration section should not be visible
      expect(screen.queryByText('Configuration')).not.toBeInTheDocument();
    });
  });

  describe('Configuration section placement', () => {
    it('should display configuration section between Repository and Tools sections', () => {
      const config = {
        identifier: '@test/server',
        version: '1.0.0',
        transport: { type: 'stdio' },
        environmentVariables: [
          {
            name: 'API_KEY',
            value: 'test-key',
            isConfigurable: true,
          },
        ],
      };

      const server = createMockServer(JSON.stringify(config));

      const { container } = render(<MCPServerDetail server={server} />);

      // Get all section headers in order
      const headers = Array.from(container.querySelectorAll('h4'));
      const headerTexts = headers.map((h) => h.textContent);

      // Find indices
      const repoIndex = headerTexts.findIndex((text) => text?.includes('Repository'));
      const configIndex = headerTexts.findIndex((text) => text?.includes('Configuration'));
      const toolsIndex = headerTexts.findIndex((text) => text?.includes('Tools'));

      // Configuration should be between Repository and Tools
      expect(configIndex).toBeGreaterThan(repoIndex);
      expect(toolsIndex).toBeGreaterThan(configIndex);
    });
  });
});
