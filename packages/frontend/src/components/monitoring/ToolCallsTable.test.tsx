/**
 * ToolCallsTable Component Tests
 *
 * WHY: Test the ToolCallsTable component displays tool calls with token estimation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToolCallsTable } from './ToolCallsTable';
import { ToolCallStatus, OrderDirection } from '@/graphql/generated/graphql';
import * as apolloClient from '@apollo/client/react';
import * as workspaceStore from '@/stores/workspaceStore';
import {
  createMockToolCall,
  createMockMcpToolRef,
  createMockMcpServerRef,
  createMockToolSetRef,
} from '@/test/factories';

// Mock Apollo Client
vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(),
}));

// Mock workspace store
vi.mock('@/stores/workspaceStore', () => ({
  useWorkspaceId: vi.fn(),
}));

// Mock scroll hook
vi.mock('@/hooks/useScrollToEntity', () => ({
  useScrollToEntity: () => vi.fn(),
}));

// Mock Tooltip components to render children directly (Radix UI portals don't work well in tests)
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => (
    <div>{children}</div>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ToolCallsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock workspace ID
    vi.mocked(workspaceStore.useWorkspaceId).mockReturnValue('workspace-1');

    // Mock Apollo queries
    vi.mocked(apolloClient.useQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  // tc-1: toolInput (16 chars / 4 = 4 tokens) + toolOutput (6 chars / 4 = 2 tokens) = 6 tokens
  // tc-2: toolInput (16 chars / 4 = 4 tokens) + toolOutput (null = 0 tokens) = 4 tokens
  const mockToolCalls = [
    createMockToolCall({
      id: 'tc-1',
      toolInput: '{"query":"test"}',
      toolOutput: 'result',
      calledBy: createMockToolSetRef(),
    }),
    createMockToolCall({
      id: 'tc-2',
      status: ToolCallStatus.Failed,
      isTest: true,
      calledAt: new Date('2025-01-15T10:31:00Z'),
      completedAt: null,
      toolInput: '{"test":"input"}',
      toolOutput: null,
      error: 'Test error',
      mcpTool: createMockMcpToolRef({
        id: 'tool-2',
        name: 'another-tool',
        description: 'Another tool description',
        mcpServer: createMockMcpServerRef({ id: 'server-2', name: 'Another Server' }),
      }),
      calledBy: null,
    }),
  ];

  const defaultProps = {
    toolCalls: mockToolCalls,
    loading: false,
    selectedToolCallId: null,
    onSelectToolCall: vi.fn(),
    filters: {
      status: [],
      setStatus: vi.fn(),
      toolIds: [],
      setToolIds: vi.fn(),
      runtimeIds: [],
      setRuntimeIds: vi.fn(),
      search: '',
      setSearch: vi.fn(),
      reset: vi.fn(),
    },
    sorting: {
      orderDirection: OrderDirection.Desc,
      setOrderDirection: vi.fn(),
    },
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalCount: 2,
      offset: 0,
      hasMore: false,
      prevPage: vi.fn(),
      nextPage: vi.fn(),
    },
  };

  it('renders tool calls table with all columns including Tokens', () => {
    render(<ToolCallsTable {...defaultProps} />);

    // Check column headers - use getAllByText for items that appear multiple times
    const statusElements = screen.getAllByText('Status');
    expect(statusElements.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tool').length).toBeGreaterThan(0);
    expect(screen.getByText('Called By')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Tokens')).toBeInTheDocument();
  });

  it('displays formatted token counts with ~ prefix', () => {
    const { container } = render(<ToolCallsTable {...defaultProps} />);

    // Debug: Check if table body exists
    const tbody = container.querySelector('tbody');
    expect(tbody).toBeInTheDocument();

    // Debug: Check if rows exist
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);

    // tc-1: 4 + 2 = 6 tokens
    expect(screen.getByText('~6')).toBeInTheDocument();

    // tc-2: 4 + 0 = 4 tokens
    expect(screen.getByText('~4')).toBeInTheDocument();
  });

  it('calculates tokens from both input and output', () => {
    // 4000 / 4 = 1000 tokens input + 1000 tokens output = 2000 tokens total
    const toolCallWithLargeTokens = [
      createMockToolCall({
        id: 'tc-large',
        toolInput: 'a'.repeat(4000),
        toolOutput: 'b'.repeat(4000),
        mcpTool: createMockMcpToolRef({
          id: 'tool-large',
          name: 'large-tool',
          description: 'Large tool description',
          mcpServer: createMockMcpServerRef({ id: 'server-large', name: 'Large Server' }),
        }),
      }),
    ];

    render(<ToolCallsTable {...defaultProps} toolCalls={toolCallWithLargeTokens} />);

    // Should format as ~2.0k
    expect(screen.getByText('~2.0k')).toBeInTheDocument();
  });

  it('handles null toolOutput gracefully', () => {
    // 15 chars / 4 = 3.75 -> 4 tokens input, 0 tokens output
    const toolCallWithNullOutput = [
      createMockToolCall({
        id: 'tc-null',
        status: ToolCallStatus.Pending,
        completedAt: null,
        toolInput: '{"test":"data"}',
        toolOutput: null,
        mcpTool: createMockMcpToolRef({
          id: 'tool-null',
          name: 'null-tool',
          description: 'Null tool description',
          mcpServer: createMockMcpServerRef({ id: 'server-null', name: 'Null Server' }),
        }),
      }),
    ];

    render(<ToolCallsTable {...defaultProps} toolCalls={toolCallWithNullOutput} />);

    // Should show only input tokens
    expect(screen.getByText('~4')).toBeInTheDocument();
  });

  it('displays tooltip trigger with cursor-help class', () => {
    const { container } = render(<ToolCallsTable {...defaultProps} />);

    const tooltipTriggers = container.querySelectorAll('.cursor-help');
    expect(tooltipTriggers.length).toBeGreaterThan(0);
  });

  it('shows loading state correctly', () => {
    render(<ToolCallsTable {...defaultProps} loading={true} toolCalls={[]} />);

    expect(screen.getByText('Loading tool calls...')).toBeInTheDocument();
  });

  it('shows empty state when no tool calls', () => {
    render(<ToolCallsTable {...defaultProps} loading={false} toolCalls={[]} />);

    expect(screen.getByText('No tool calls found')).toBeInTheDocument();
  });

  it('displays pagination information', () => {
    render(<ToolCallsTable {...defaultProps} />);

    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
    expect(screen.getByText(/2 total/)).toBeInTheDocument();
  });
});
