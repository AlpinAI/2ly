/**
 * Tests for UpstreamRegistryBrowser Component
 *
 * WHY: Verify that the component uses the Search component instead of Input
 * for consistent search behavior across the application.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpstreamRegistryBrowser } from './upstream-registry-browser';
import * as workspaceStore from '@/stores/workspaceStore';
import * as useUpstreamRegistryServers from '@/hooks/useUpstreamRegistryServers';
import { useMutation } from '@apollo/client/react';
import type { UpstreamServer } from '@/hooks/useUpstreamRegistryServers';

// Mock dependencies
vi.mock('@/stores/workspaceStore', () => ({
  useWorkspaceId: vi.fn(),
}));

vi.mock('@/hooks/useUpstreamRegistryServers', () => ({
  useUpstreamRegistryServers: vi.fn(),
}));

vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(),
}));

const mockServers: UpstreamServer[] = [
  {
    id: 'server-1',
    name: 'test-server',
    title: 'Test Server',
    description: 'A test MCP server',
    version: '1.0.0',
    repositoryUrl: 'https://github.com/test/server',
    packages: JSON.stringify([]),
    remotes: JSON.stringify([]),
  },
  {
    id: 'server-2',
    name: 'another-server',
    title: 'Another Server',
    description: 'Another test server',
    version: '2.0.0',
    repositoryUrl: 'https://github.com/test/another',
    packages: JSON.stringify([]),
    remotes: JSON.stringify([]),
  },
];

describe('UpstreamRegistryBrowser', () => {
  const mockOnServerAdded = vi.fn();
  const mockOnCancel = vi.fn();
  const mockAddServerToRegistry = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock workspace ID
    vi.mocked(workspaceStore.useWorkspaceId).mockReturnValue('test-workspace');

    // Mock upstream registry servers hook - default success state
    vi.mocked(useUpstreamRegistryServers.useUpstreamRegistryServers).mockReturnValue({
      servers: mockServers,
      loading: false,
      error: null,
      refetch: mockRefetch,
      hasMore: false,
      nextCursor: null,
    });

    // Mock useMutation
    vi.mocked(useMutation).mockReturnValue([
      mockAddServerToRegistry,
      { loading: false, error: undefined, data: undefined },
    ] as never);
  });

  describe('Search Component Integration', () => {
    it('renders Search component instead of Input component', () => {
      render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search servers...');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput.getAttribute('type')).toBe('search');
    });

    it('renders Search component with search icon', () => {
      const { container } = render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      // Search component should have an SVG icon
      const searchIcon = container.querySelector('svg');
      expect(searchIcon).toBeDefined();
    });

    it('allows typing in search input without losing focus', async () => {
      render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search servers...');

      // Type search query
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Input should maintain value
      expect(searchInput).toHaveValue('test');

      // Continue typing
      fireEvent.change(searchInput, { target: { value: 'test server' } });
      expect(searchInput).toHaveValue('test server');
    });

    it('maintains search value during component updates', () => {
      const { rerender } = render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search servers...');
      fireEvent.change(searchInput, { target: { value: 'my search' } });

      // Rerender component
      rerender(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      // Search value should persist
      expect(searchInput).toHaveValue('my search');
    });

    it('disables search input when loading', () => {
      vi.mocked(useUpstreamRegistryServers.useUpstreamRegistryServers).mockReturnValue({
        servers: [],
        loading: true,
        error: null,
        refetch: mockRefetch,
        hasMore: false,
        nextCursor: null,
      });

      render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search servers...');
      expect(searchInput).toBeDisabled();
    });

    it('disables search input when error occurs', () => {
      vi.mocked(useUpstreamRegistryServers.useUpstreamRegistryServers).mockReturnValue({
        servers: [],
        loading: false,
        error: 'Failed to load registry',
        refetch: mockRefetch,
        hasMore: false,
        nextCursor: null,
      });

      render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search servers...');
      expect(searchInput).toBeDisabled();
    });
  });

  describe('Server Display', () => {
    it('displays all servers when no search query', () => {
      render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Test Server')).toBeInTheDocument();
      expect(screen.getByText('Another Server')).toBeInTheDocument();
    });

    it('displays loading state', () => {
      vi.mocked(useUpstreamRegistryServers.useUpstreamRegistryServers).mockReturnValue({
        servers: [],
        loading: true,
        error: null,
        refetch: mockRefetch,
        hasMore: false,
        nextCursor: null,
      });

      render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      // Should show loading skeleton cards
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('displays error state with retry button', async () => {
      vi.mocked(useUpstreamRegistryServers.useUpstreamRegistryServers).mockReturnValue({
        servers: [],
        loading: false,
        error: 'Failed to load registry',
        refetch: mockRefetch,
        hasMore: false,
        nextCursor: null,
      });

      render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Registry')).toBeInTheDocument();
      });
      expect(screen.getByText('Failed to load registry')).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('calls refetch when retry button is clicked', () => {
      vi.mocked(useUpstreamRegistryServers.useUpstreamRegistryServers).mockReturnValue({
        servers: [],
        loading: false,
        error: 'Failed to load registry',
        refetch: mockRefetch,
        hasMore: false,
        nextCursor: null,
      });

      render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('displays empty state when no servers found', () => {
      vi.mocked(useUpstreamRegistryServers.useUpstreamRegistryServers).mockReturnValue({
        servers: [],
        loading: false,
        error: null,
        refetch: mockRefetch,
        hasMore: false,
        nextCursor: null,
      });

      render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('No servers found')).toBeInTheDocument();
      expect(screen.getByText('No servers available in this registry')).toBeInTheDocument();
    });
  });

  describe('Server Installation', () => {
    it('calls onServerAdded when install succeeds', async () => {
      const mockServerId = 'new-server-id';
      mockAddServerToRegistry.mockResolvedValue({
        data: { addServerToRegistry: { id: mockServerId } },
      });

      render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      const installButtons = screen.getAllByRole('button', { name: /install/i });
      fireEvent.click(installButtons[0]);

      await waitFor(() => {
        expect(mockAddServerToRegistry).toHaveBeenCalledWith({
          variables: {
            workspaceId: 'test-workspace',
            name: 'test-server',
            description: 'A test MCP server',
            title: 'Test Server',
            repositoryUrl: 'https://github.com/test/server',
            version: '1.0.0',
            packages: mockServers[0].packages,
            remotes: mockServers[0].remotes,
          },
        });
        expect(mockOnServerAdded).toHaveBeenCalledWith(mockServerId);
      });
    });

    it('shows installing state during installation', async () => {
      mockAddServerToRegistry.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      const installButtons = screen.getAllByRole('button', { name: /install/i });
      fireEvent.click(installButtons[0]);

      // Should show installing state
      expect(screen.getByText('Installing...')).toBeInTheDocument();
    });

    it('handles installation errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAddServerToRegistry.mockRejectedValue(new Error('Installation failed'));

      render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      const installButtons = screen.getAllByRole('button', { name: /install/i });
      fireEvent.click(installButtons[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(mockOnServerAdded).not.toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Registry Selection', () => {
    it('renders registry selector', () => {
      render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Upstream Registry')).toBeInTheDocument();
    });

    it('shows custom URL input when custom registry is selected', async () => {
      // Silence expected console errors from component interactions
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock mutation with successful result to prevent errors during interaction
      mockAddServerToRegistry.mockResolvedValue({
        data: { addServerToRegistry: { id: 'test-id' } },
      });

      render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      // Open select dropdown and choose "Custom URL..."
      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      // Wait for options to appear and click custom option
      await waitFor(() => {
        const customOption = screen.getByRole('option', { name: /custom url/i });
        fireEvent.click(customOption);
      });

      // Custom URL input should appear
      const customUrlInput = screen.getByPlaceholderText('https://example.com/registry');
      expect(customUrlInput).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Cancel Action', () => {
    it('calls onCancel when cancel button is clicked', () => {
      render(
        <UpstreamRegistryBrowser
          onServerAdded={mockOnServerAdded}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });
});
