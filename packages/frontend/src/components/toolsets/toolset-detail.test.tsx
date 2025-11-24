/**
 * Tests for ToolsetDetail inline editing functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToolsetDetail } from './toolset-detail';
import * as uiStore from '@/stores/uiStore';
import * as NotificationContext from '@/contexts/NotificationContext';
import { BrowserRouter } from 'react-router-dom';
import { useMutation, useLazyQuery } from '@apollo/client/react';

// Mock dependencies
vi.mock('@/stores/uiStore', () => ({
  useManageToolsDialog: vi.fn(),
  useConnectToolsetDialog: vi.fn(),
}));

vi.mock('@/contexts/NotificationContext', () => ({
  useNotification: vi.fn(),
}));

vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(),
  useLazyQuery: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ workspaceId: 'test-workspace' }),
  };
});

const mockToolSet = {
  __typename: 'ToolSet' as const,
  id: 'toolset-1',
  name: 'Test Toolset',
  description: 'Test toolset description',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  mcpTools: [
    {
      __typename: 'MCPTool' as const,
      id: 'tool-1',
      name: 'Test Tool',
      description: 'Test tool description',
      mcpServer: {
        __typename: 'MCPServer' as const,
        id: 'server-1',
        name: 'Test Server',
      },
    },
  ],
};

describe('ToolsetDetail - Inline Editing', () => {
  const mockUpdateToolSet = vi.fn();
  const mockGetToolsetKey = vi.fn();
  const mockSetOpen = vi.fn();
  const mockSetSelectedToolsetId = vi.fn();
  const mockSetConnectDialogOpen = vi.fn();
  const mockSetSelectedToolsetName = vi.fn();
  const mockSetConnectToolsetId = vi.fn();
  const mockConfirm = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(uiStore.useManageToolsDialog).mockReturnValue({
      open: false,
      setOpen: mockSetOpen,
      selectedToolsetId: null,
      setSelectedToolsetId: mockSetSelectedToolsetId,
    });

    vi.mocked(uiStore.useConnectToolsetDialog).mockReturnValue({
      open: false,
      setOpen: mockSetConnectDialogOpen,
      selectedToolsetName: null,
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: null,
      setSelectedToolsetId: mockSetConnectToolsetId,
    });

    vi.mocked(NotificationContext.useNotification).mockReturnValue({
      confirm: mockConfirm,
      toast: mockToast,
    });

    // Mock useMutation - return updateToolSet by default
    vi.mocked(useMutation).mockReturnValue([
      mockUpdateToolSet,
      { loading: false, error: undefined, data: undefined },
    ] as never);

    // Mock useLazyQuery - return getToolsetKey by default
    vi.mocked(useLazyQuery).mockReturnValue([
      mockGetToolsetKey,
      { loading: false },
    ] as never);
  });

  describe('Name Editing', () => {
    it('allows editing toolset name', () => {
      render(
        <BrowserRouter>
          <ToolsetDetail toolSet={mockToolSet} />
        </BrowserRouter>
      );

      const nameInput = screen.getByDisplayValue('Test Toolset');
      expect(nameInput).toBeInTheDocument();

      fireEvent.change(nameInput, { target: { value: 'New Toolset Name' } });
      expect(nameInput).toHaveValue('New Toolset Name');
    });

    it('saves name on blur when changed', async () => {
      mockUpdateToolSet.mockResolvedValue({ data: {} });

      render(
        <BrowserRouter>
          <ToolsetDetail toolSet={mockToolSet} />
        </BrowserRouter>
      );

      const nameInput = screen.getByDisplayValue('Test Toolset');
      fireEvent.change(nameInput, { target: { value: 'New Toolset Name' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(mockUpdateToolSet).toHaveBeenCalledWith({
          variables: {
            id: 'toolset-1',
            name: 'New Toolset Name',
            description: 'Test toolset description',
          },
        });
      });
    });

    it('does not save name if unchanged', async () => {
      render(
        <BrowserRouter>
          <ToolsetDetail toolSet={mockToolSet} />
        </BrowserRouter>
      );

      const nameInput = screen.getByDisplayValue('Test Toolset');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(mockUpdateToolSet).not.toHaveBeenCalled();
      });
    });

    it('validates name length (minimum 3 characters)', async () => {
      render(
        <BrowserRouter>
          <ToolsetDetail toolSet={mockToolSet} />
        </BrowserRouter>
      );

      const nameInput = screen.getByDisplayValue('Test Toolset');
      fireEvent.change(nameInput, { target: { value: 'AB' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          description: 'Name must be between 3 and 100 characters',
          variant: 'error',
        });
        expect(mockUpdateToolSet).not.toHaveBeenCalled();
      });
    });

    it('validates name length (maximum 100 characters)', async () => {
      const longName = 'A'.repeat(101);
      render(
        <BrowserRouter>
          <ToolsetDetail toolSet={mockToolSet} />
        </BrowserRouter>
      );

      const nameInput = screen.getByDisplayValue('Test Toolset');
      fireEvent.change(nameInput, { target: { value: longName } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          description: 'Name must be between 3 and 100 characters',
          variant: 'error',
        });
        expect(mockUpdateToolSet).not.toHaveBeenCalled();
      });
    });

    it('trims whitespace before validation', async () => {
      mockUpdateToolSet.mockResolvedValue({ data: {} });

      render(
        <BrowserRouter>
          <ToolsetDetail toolSet={mockToolSet} />
        </BrowserRouter>
      );

      const nameInput = screen.getByDisplayValue('Test Toolset');
      fireEvent.change(nameInput, { target: { value: '  Valid Name  ' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(mockUpdateToolSet).toHaveBeenCalledWith({
          variables: {
            id: 'toolset-1',
            name: 'Valid Name',
            description: 'Test toolset description',
          },
        });
      });
    });

    it('shows error toast and reverts name on save failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUpdateToolSet.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <ToolsetDetail toolSet={mockToolSet} />
        </BrowserRouter>
      );

      const nameInput = screen.getByDisplayValue('Test Toolset');
      fireEvent.change(nameInput, { target: { value: 'New Toolset Name' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          description: 'Failed to save name',
          variant: 'error',
        });
        expect(nameInput).toHaveValue('Test Toolset');
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Description Editing', () => {
    it('allows editing toolset description', () => {
      render(
        <BrowserRouter>
          <ToolsetDetail toolSet={mockToolSet} />
        </BrowserRouter>
      );

      const descriptionTextarea = screen.getByDisplayValue('Test toolset description');
      expect(descriptionTextarea).toBeInTheDocument();

      fireEvent.change(descriptionTextarea, { target: { value: 'New description' } });
      expect(descriptionTextarea).toHaveValue('New description');
    });

    it('shows placeholder when description is empty', () => {
      const toolSetWithoutDescription = { ...mockToolSet, description: null };
      render(
        <BrowserRouter>
          <ToolsetDetail toolSet={toolSetWithoutDescription} />
        </BrowserRouter>
      );

      const descriptionTextarea = screen.getByPlaceholderText('Click to add description...');
      expect(descriptionTextarea).toBeInTheDocument();
    });

    it('saves description on blur when changed', async () => {
      mockUpdateToolSet.mockResolvedValue({ data: {} });

      render(
        <BrowserRouter>
          <ToolsetDetail toolSet={mockToolSet} />
        </BrowserRouter>
      );

      const descriptionTextarea = screen.getByDisplayValue('Test toolset description');
      fireEvent.change(descriptionTextarea, { target: { value: 'Updated description' } });
      fireEvent.blur(descriptionTextarea);

      await waitFor(() => {
        expect(mockUpdateToolSet).toHaveBeenCalledWith({
          variables: {
            id: 'toolset-1',
            name: 'Test Toolset',
            description: 'Updated description',
          },
        });
      });
    });

    it('does not save description if unchanged', async () => {
      render(
        <BrowserRouter>
          <ToolsetDetail toolSet={mockToolSet} />
        </BrowserRouter>
      );

      const descriptionTextarea = screen.getByDisplayValue('Test toolset description');
      fireEvent.blur(descriptionTextarea);

      await waitFor(() => {
        expect(mockUpdateToolSet).not.toHaveBeenCalled();
      });
    });

    it('allows empty description', async () => {
      mockUpdateToolSet.mockResolvedValue({ data: {} });

      render(
        <BrowserRouter>
          <ToolsetDetail toolSet={mockToolSet} />
        </BrowserRouter>
      );

      const descriptionTextarea = screen.getByDisplayValue('Test toolset description');
      fireEvent.change(descriptionTextarea, { target: { value: '' } });
      fireEvent.blur(descriptionTextarea);

      await waitFor(() => {
        expect(mockUpdateToolSet).toHaveBeenCalledWith({
          variables: {
            id: 'toolset-1',
            name: 'Test Toolset',
            description: '',
          },
        });
      });
    });

    it('validates description length (maximum 1000 characters)', async () => {
      const longDescription = 'A'.repeat(1001);
      render(
        <BrowserRouter>
          <ToolsetDetail toolSet={mockToolSet} />
        </BrowserRouter>
      );

      const descriptionTextarea = screen.getByDisplayValue('Test toolset description');
      fireEvent.change(descriptionTextarea, { target: { value: longDescription } });
      fireEvent.blur(descriptionTextarea);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          description: 'Description must not exceed 1000 characters',
          variant: 'error',
        });
        expect(mockUpdateToolSet).not.toHaveBeenCalled();
      });
    });

    it('shows error toast and reverts description on save failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUpdateToolSet.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <ToolsetDetail toolSet={mockToolSet} />
        </BrowserRouter>
      );

      const descriptionTextarea = screen.getByDisplayValue('Test toolset description');
      fireEvent.change(descriptionTextarea, { target: { value: 'New description' } });
      fireEvent.blur(descriptionTextarea);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          description: 'Failed to save description',
          variant: 'error',
        });
        expect(descriptionTextarea).toHaveValue('Test toolset description');
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('State Management', () => {
    it('resets local state when toolSet prop changes', () => {
      const { rerender } = render(
        <BrowserRouter>
          <ToolsetDetail toolSet={mockToolSet} />
        </BrowserRouter>
      );

      const nameInput = screen.getByDisplayValue('Test Toolset');
      fireEvent.change(nameInput, { target: { value: 'Changed Name' } });
      expect(nameInput).toHaveValue('Changed Name');

      const updatedToolSet = { ...mockToolSet, name: 'Updated Toolset' };
      rerender(
        <BrowserRouter>
          <ToolsetDetail toolSet={updatedToolSet} />
        </BrowserRouter>
      );

      expect(screen.getByDisplayValue('Updated Toolset')).toBeInTheDocument();
    });
  });

  describe('UI Integration', () => {
    it('renders editable fields alongside other UI elements', () => {
      render(
        <BrowserRouter>
          <ToolsetDetail toolSet={mockToolSet} />
        </BrowserRouter>
      );

      // Verify editable fields exist
      expect(screen.getByDisplayValue('Test Toolset')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test toolset description')).toBeInTheDocument();

      // Verify other UI elements still render
      expect(screen.getByText('Connect')).toBeInTheDocument();
      expect(screen.getByText('Manage Tools')).toBeInTheDocument();
      expect(screen.getByText('Identity Key')).toBeInTheDocument();
      expect(screen.getByText(/Timestamps/i)).toBeInTheDocument();
    });

    it('displays tools list correctly', () => {
      render(
        <BrowserRouter>
          <ToolsetDetail toolSet={mockToolSet} />
        </BrowserRouter>
      );

      expect(screen.getByText('Tools (1)')).toBeInTheDocument();
      expect(screen.getByText('Test Tool')).toBeInTheDocument();
    });
  });
});
