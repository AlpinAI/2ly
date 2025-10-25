/**
 * ToolTester Component Tests
 *
 * WHY: Test the ToolTester component with auto-scroll, loading states, and execution results
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToolTester } from './tool-tester';
import * as apolloClient from '@apollo/client/react';

// Mock Apollo Client
vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(),
}));

// Mock the SchemaInput component
vi.mock('./schema-input', () => ({
  SchemaInput: ({
    property,
    value,
    onChange,
  }: {
    property: { name: string };
    value: unknown;
    onChange: (value: string) => void;
  }) => (
    <div data-testid={`schema-input-${property.name}`}>
      <label>{property.name}</label>
      <input
        type="text"
        value={value as string || ''}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`input-${property.name}`}
      />
    </div>
  ),
}));

describe('ToolTester', () => {
  const mockCallTool = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    vi.mocked(apolloClient.useMutation).mockReturnValue([
      mockCallTool,
      { loading: false, error: undefined, data: undefined },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);
  });

  it('renders tool tester with test button', () => {
    render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema="{}"
      />
    );

    expect(screen.getByText('Test Tool')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test/i })).toBeInTheDocument();
  });

  it('shows no input parameters message when schema is empty', () => {
    render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema="{}"
      />
    );

    expect(screen.getByText('This tool does not require any input parameters.')).toBeInTheDocument();
  });

  it('renders input fields based on schema', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Result limit' },
      },
    });

    render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema={schema}
      />
    );

    expect(screen.getByTestId('schema-input-query')).toBeInTheDocument();
    expect(screen.getByTestId('schema-input-limit')).toBeInTheDocument();
  });

  it('scrolls to result section when test button is clicked', async () => {
    const scrollIntoViewMock = vi.fn();
    HTMLDivElement.prototype.scrollIntoView = scrollIntoViewMock;

    // Mock mutation to return loading: true when called
    mockCallTool.mockResolvedValue({
      data: {
        callMCPTool: {
          success: true,
          result: 'test result',
        },
      },
    });

    vi.mocked(apolloClient.useMutation).mockReturnValue([
      mockCallTool,
      { loading: true, error: undefined, data: undefined },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema="{}"
      />
    );

    // Wait for the scroll to be called (triggered by useEffect when isExecuting is true)
    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'nearest',
      });
    }, { timeout: 1000 });
  });

  it('shows loading indicator when test is executing', () => {
    vi.mocked(apolloClient.useMutation).mockReturnValue([
      mockCallTool,
      { loading: true, error: undefined, data: undefined },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema="{}"
      />
    );

    expect(screen.getByText('Testing tool...')).toBeInTheDocument();
    expect(screen.getByText('Testing...')).toBeInTheDocument(); // Button text
  });

  it('shows loading skeleton while executing', () => {
    vi.mocked(apolloClient.useMutation).mockReturnValue([
      mockCallTool,
      { loading: true, error: undefined, data: undefined },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    const { container } = render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema="{}"
      />
    );

    // Check for skeleton loader elements
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('disables test button during execution', () => {
    vi.mocked(apolloClient.useMutation).mockReturnValue([
      mockCallTool,
      { loading: true, error: undefined, data: undefined },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema="{}"
      />
    );

    const testButton = screen.getByRole('button', { name: /testing/i });
    expect(testButton).toBeDisabled();
  });

  it('calls tool mutation with correct parameters', async () => {
    mockCallTool.mockResolvedValue({
      data: {
        callMCPTool: {
          success: true,
          result: '{"data": "test result"}',
        },
      },
    });

    const schema = JSON.stringify({
      type: 'object',
      properties: {
        query: { type: 'string' },
      },
    });

    render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema={schema}
      />
    );

    // Set input value
    const input = screen.getByTestId('input-query');
    fireEvent.change(input, { target: { value: 'test query' } });

    // Click test button
    const testButton = screen.getByRole('button', { name: /test/i });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(mockCallTool).toHaveBeenCalledWith({
        variables: {
          toolId: 'tool-1',
          input: JSON.stringify({ query: 'test query' }),
        },
      });
    });
  });

  it('displays success result after execution', async () => {
    let isExecuting = false;
    vi.mocked(apolloClient.useMutation).mockReturnValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (...args: any[]) => {
        isExecuting = true;
        const result = await mockCallTool(...args);
        isExecuting = false;
        return result;
      },
      { loading: isExecuting, error: undefined, data: undefined },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    mockCallTool.mockResolvedValue({
      data: {
        callMCPTool: {
          success: true,
          result: '{"data": "test result"}',
        },
      },
    });

    render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema="{}"
      />
    );

    const testButton = screen.getByRole('button', { name: /test/i });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    // Check for formatted JSON result
    const resultElement = screen.getByText(/"data": "test result"/);
    expect(resultElement).toBeInTheDocument();
  });

  it('displays error result when execution fails', async () => {
    mockCallTool.mockResolvedValue({
      data: {
        callMCPTool: {
          success: false,
          result: '',
        },
      },
    });

    render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema="{}"
      />
    );

    const testButton = screen.getByRole('button', { name: /test/i });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Tool execution failed')).toBeInTheDocument();
    });
  });

  it('displays validation errors for invalid input', async () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: {
        age: { type: 'number' },
      },
      required: ['age'],
    });

    render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema={schema}
      />
    );

    // Don't set the required field
    const testButton = screen.getByRole('button', { name: /test/i });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    // Should not call the mutation if validation fails
    expect(mockCallTool).not.toHaveBeenCalled();
  });

  it('handles mutation errors gracefully', async () => {
    mockCallTool.mockRejectedValue(new Error('Network error'));

    render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema="{}"
      />
    );

    const testButton = screen.getByRole('button', { name: /test/i });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('clears previous result when starting new test', async () => {
    mockCallTool.mockResolvedValueOnce({
      data: {
        callMCPTool: {
          success: true,
          result: 'first result',
        },
      },
    });

    const { rerender } = render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema="{}"
      />
    );

    const testButton = screen.getByRole('button', { name: /test/i });

    // First execution
    fireEvent.click(testButton);
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    // Mock loading state for second execution
    vi.mocked(apolloClient.useMutation).mockReturnValue([
      mockCallTool,
      { loading: true, error: undefined, data: undefined },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    rerender(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema="{}"
      />
    );

    // Second execution should show loading, not previous result
    expect(screen.getByText('Testing tool...')).toBeInTheDocument();
    expect(screen.queryByText('first result')).not.toBeInTheDocument();
  });

  it('handles input value changes', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema={schema}
      />
    );

    const input = screen.getByTestId('input-name');
    fireEvent.change(input, { target: { value: 'John Doe' } });

    expect(input).toHaveValue('John Doe');
  });

  it('formats JSON results for display', async () => {
    mockCallTool.mockResolvedValue({
      data: {
        callMCPTool: {
          success: true,
          result: '{"nested":{"value":"test"}}',
        },
      },
    });

    render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema="{}"
      />
    );

    const testButton = screen.getByRole('button', { name: /test/i });
    fireEvent.click(testButton);

    await waitFor(() => {
      // Check for formatted/indented JSON
      const preElement = screen.getByText(/"nested"/);
      expect(preElement.tagName).toBe('PRE');
    });
  });

  it('displays non-JSON results as-is', async () => {
    mockCallTool.mockResolvedValue({
      data: {
        callMCPTool: {
          success: true,
          result: 'Plain text result',
        },
      },
    });

    render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema="{}"
      />
    );

    const testButton = screen.getByRole('button', { name: /test/i });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText('Plain text result')).toBeInTheDocument();
    });
  });

  it('does not show result section before first execution', () => {
    const { container } = render(
      <ToolTester
        toolId="tool-1"
        toolName="test-tool"
        inputSchema="{}"
      />
    );

    // Result section should exist (for ref) but should be empty
    const resultSection = container.querySelector('[class*="space-y-2"]');
    expect(resultSection).toBeInTheDocument();

    // But should not show success or error indicators
    expect(screen.queryByText('Success')).not.toBeInTheDocument();
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
    expect(screen.queryByText('Testing tool...')).not.toBeInTheDocument();
  });
});
