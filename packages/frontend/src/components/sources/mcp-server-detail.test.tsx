/**
 * Tests for MCPServerDetail inline editing functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MCPServerDetail } from './mcp-server-detail';
import * as runtimeStore from '@/stores/runtimeStore';
import * as NotificationContext from '@/contexts/NotificationContext';
import { BrowserRouter } from 'react-router-dom';
import { McpTransportType, McpServerRunOn } from '@/graphql/generated/graphql';
import { useMutation } from '@apollo/client/react';

// Mock dependencies
vi.mock('@/stores/runtimeStore', () => ({
  useRuntimeData: vi.fn(),
}));

vi.mock('@/contexts/NotificationContext', () => ({
  useNotification: vi.fn(),
}));

vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ workspaceId: 'test-workspace' }),
  };
});

const mockServer = {
  __typename: 'MCPServer' as const,
  id: 'server-1',
  name: 'Test Server',
  description: 'Test server description',
  transport: McpTransportType.Stdio,
  config: '{"command":"test"}',
  repositoryUrl: 'https://github.com/test/repo',
  runOn: McpServerRunOn.Edge,
  runtime: null,
  tools: [],
};

describe('MCPServerDetail - Inline Editing', () => {
  const mockUpdateServer = vi.fn();
  const mockConfirm = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(runtimeStore.useRuntimeData).mockReturnValue({
      runtimes: [],
      loading: false,
      error: null,
      stats: { total: 0, active: 0, inactive: 0 },
    });

    vi.mocked(NotificationContext.useNotification).mockReturnValue({
      confirm: mockConfirm,
      toast: mockToast,
    });

    // Mock useMutation - return updateServer by default
    vi.mocked(useMutation).mockReturnValue([
      mockUpdateServer,
      { loading: false, error: undefined, data: undefined },
    ] as never);
  });

  describe('Name Editing', () => {
    it('allows editing server name', () => {
      render(
        <BrowserRouter>
          <MCPServerDetail server={mockServer} />
        </BrowserRouter>
      );

      const nameInput = screen.getByDisplayValue('Test Server');
      expect(nameInput).toBeInTheDocument();

      fireEvent.change(nameInput, { target: { value: 'New Server Name' } });
      expect(nameInput).toHaveValue('New Server Name');
    });

    it('saves name on blur when changed', async () => {
      mockUpdateServer.mockResolvedValue({ data: {} });

      render(
        <BrowserRouter>
          <MCPServerDetail server={mockServer} />
        </BrowserRouter>
      );

      const nameInput = screen.getByDisplayValue('Test Server');
      fireEvent.change(nameInput, { target: { value: 'New Server Name' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(mockUpdateServer).toHaveBeenCalledWith({
          variables: {
            id: 'server-1',
            name: 'New Server Name',
            description: 'Test server description',
            repositoryUrl: 'https://github.com/test/repo',
            transport: McpTransportType.Stdio,
            config: '{"command":"test"}',
          },
        });
      });
    });

    it('does not save name if unchanged', async () => {
      render(
        <BrowserRouter>
          <MCPServerDetail server={mockServer} />
        </BrowserRouter>
      );

      const nameInput = screen.getByDisplayValue('Test Server');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(mockUpdateServer).not.toHaveBeenCalled();
      });
    });

    it('validates name length (minimum 3 characters)', async () => {
      render(
        <BrowserRouter>
          <MCPServerDetail server={mockServer} />
        </BrowserRouter>
      );

      const nameInput = screen.getByDisplayValue('Test Server');
      fireEvent.change(nameInput, { target: { value: 'AB' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          description: 'Name must be between 3 and 100 characters',
          variant: 'error',
        });
        expect(mockUpdateServer).not.toHaveBeenCalled();
      });
    });

    it('validates name length (maximum 100 characters)', async () => {
      const longName = 'A'.repeat(101);
      render(
        <BrowserRouter>
          <MCPServerDetail server={mockServer} />
        </BrowserRouter>
      );

      const nameInput = screen.getByDisplayValue('Test Server');
      fireEvent.change(nameInput, { target: { value: longName } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          description: 'Name must be between 3 and 100 characters',
          variant: 'error',
        });
        expect(mockUpdateServer).not.toHaveBeenCalled();
      });
    });

    it('shows error toast and reverts name on save failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUpdateServer.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <MCPServerDetail server={mockServer} />
        </BrowserRouter>
      );

      const nameInput = screen.getByDisplayValue('Test Server');
      fireEvent.change(nameInput, { target: { value: 'New Server Name' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          description: 'Failed to save name',
          variant: 'error',
        });
        expect(nameInput).toHaveValue('Test Server');
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Description Editing', () => {
    it('allows editing server description', () => {
      render(
        <BrowserRouter>
          <MCPServerDetail server={mockServer} />
        </BrowserRouter>
      );

      const descriptionTextarea = screen.getByDisplayValue('Test server description');
      expect(descriptionTextarea).toBeInTheDocument();

      fireEvent.change(descriptionTextarea, { target: { value: 'New description' } });
      expect(descriptionTextarea).toHaveValue('New description');
    });

    it('shows placeholder when description is empty', () => {
      const serverWithoutDescription = { ...mockServer, description: '' };
      render(
        <BrowserRouter>
          <MCPServerDetail server={serverWithoutDescription} />
        </BrowserRouter>
      );

      const descriptionTextarea = screen.getByPlaceholderText('Click to add description...');
      expect(descriptionTextarea).toBeInTheDocument();
    });

    it('saves description on blur when changed', async () => {
      mockUpdateServer.mockResolvedValue({ data: {} });

      render(
        <BrowserRouter>
          <MCPServerDetail server={mockServer} />
        </BrowserRouter>
      );

      const descriptionTextarea = screen.getByDisplayValue('Test server description');
      fireEvent.change(descriptionTextarea, { target: { value: 'Updated description' } });
      fireEvent.blur(descriptionTextarea);

      await waitFor(() => {
        expect(mockUpdateServer).toHaveBeenCalledWith({
          variables: {
            id: 'server-1',
            name: 'Test Server',
            description: 'Updated description',
            repositoryUrl: 'https://github.com/test/repo',
            transport: McpTransportType.Stdio,
            config: '{"command":"test"}',
          },
        });
      });
    });

    it('does not save description if unchanged', async () => {
      render(
        <BrowserRouter>
          <MCPServerDetail server={mockServer} />
        </BrowserRouter>
      );

      const descriptionTextarea = screen.getByDisplayValue('Test server description');
      fireEvent.blur(descriptionTextarea);

      await waitFor(() => {
        expect(mockUpdateServer).not.toHaveBeenCalled();
      });
    });

    it('allows empty description', async () => {
      mockUpdateServer.mockResolvedValue({ data: {} });

      render(
        <BrowserRouter>
          <MCPServerDetail server={mockServer} />
        </BrowserRouter>
      );

      const descriptionTextarea = screen.getByDisplayValue('Test server description');
      fireEvent.change(descriptionTextarea, { target: { value: '' } });
      fireEvent.blur(descriptionTextarea);

      await waitFor(() => {
        expect(mockUpdateServer).toHaveBeenCalledWith({
          variables: {
            id: 'server-1',
            name: 'Test Server',
            description: '',
            repositoryUrl: 'https://github.com/test/repo',
            transport: McpTransportType.Stdio,
            config: '{"command":"test"}',
          },
        });
      });
    });

    it('validates description length (maximum 1000 characters)', async () => {
      const longDescription = 'A'.repeat(1001);
      render(
        <BrowserRouter>
          <MCPServerDetail server={mockServer} />
        </BrowserRouter>
      );

      const descriptionTextarea = screen.getByDisplayValue('Test server description');
      fireEvent.change(descriptionTextarea, { target: { value: longDescription } });
      fireEvent.blur(descriptionTextarea);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          description: 'Description must not exceed 1000 characters',
          variant: 'error',
        });
        expect(mockUpdateServer).not.toHaveBeenCalled();
      });
    });

    it('shows error toast and reverts description on save failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUpdateServer.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <MCPServerDetail server={mockServer} />
        </BrowserRouter>
      );

      const descriptionTextarea = screen.getByDisplayValue('Test server description');
      fireEvent.change(descriptionTextarea, { target: { value: 'New description' } });
      fireEvent.blur(descriptionTextarea);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          description: 'Failed to save description',
          variant: 'error',
        });
        expect(descriptionTextarea).toHaveValue('Test server description');
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('State Management', () => {
    it('resets local state when server prop changes', () => {
      const { rerender } = render(
        <BrowserRouter>
          <MCPServerDetail server={mockServer} />
        </BrowserRouter>
      );

      const nameInput = screen.getByDisplayValue('Test Server');
      fireEvent.change(nameInput, { target: { value: 'Changed Name' } });
      expect(nameInput).toHaveValue('Changed Name');

      const updatedServer = { ...mockServer, name: 'Updated Server' };
      rerender(
        <BrowserRouter>
          <MCPServerDetail server={updatedServer} />
        </BrowserRouter>
      );

      expect(screen.getByDisplayValue('Updated Server')).toBeInTheDocument();
    });
  });
});
