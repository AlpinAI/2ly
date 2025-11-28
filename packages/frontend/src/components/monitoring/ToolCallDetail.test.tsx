/**
 * ToolCallDetail Component Tests
 *
 * WHY: Test the ToolCallDetail component displays tool call information correctly
 * and does not display the tool description field.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { ToolCallDetail } from './ToolCallDetail';
import { ToolCallStatus } from '@/graphql/generated/graphql';
import {
  createMockToolCall,
  createMockMcpToolRef,
  createMockToolSetRef,
  createMockRuntimeRef,
} from '@/test/factories';

describe('ToolCallDetail', () => {
  const mockToolCall = createMockToolCall({
    toolInput: JSON.stringify({ query: 'test query' }),
    toolOutput: 'test output',
    mcpTool: createMockMcpToolRef({
      description: 'This is a test tool description that should not be displayed',
    }),
    calledBy: createMockToolSetRef({ id: 'runtime-1' }),
    executedBy: createMockRuntimeRef({ id: 'runtime-2', hostname: 'runtime-host-1' }),
  });

  // Helper to render with router
  const renderWithRouter = (component: React.ReactElement) => {
    const router = createMemoryRouter(
      [
        {
          path: '/w/:workspaceId/monitoring',
          element: component,
        },
      ],
      {
        initialEntries: ['/w/test-workspace/monitoring'],
      }
    );
    return render(<RouterProvider router={router} />);
  };

  it('renders tool name', () => {
    renderWithRouter(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('test-tool')).toBeInTheDocument();
  });

  it('renders server name', () => {
    renderWithRouter(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('Server:')).toBeInTheDocument();
    expect(screen.getByText('Test Server')).toBeInTheDocument();
  });

  it('does not render tool description', () => {
    renderWithRouter(<ToolCallDetail toolCall={mockToolCall} />);

    // Description should not be in the document
    expect(screen.queryByText('This is a test tool description that should not be displayed')).not.toBeInTheDocument();
  });

  it('renders status with icon for completed calls', () => {
    renderWithRouter(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  it('renders status with icon for failed calls', () => {
    const failedToolCall = {
      ...mockToolCall,
      status: ToolCallStatus.Failed,
      error: 'Test error message',
      toolOutput: null,
    };

    renderWithRouter(<ToolCallDetail toolCall={failedToolCall} />);

    expect(screen.getByText('FAILED')).toBeInTheDocument();
  });

  it('renders status with icon for pending calls', () => {
    const pendingToolCall = {
      ...mockToolCall,
      status: ToolCallStatus.Pending,
      completedAt: null,
      toolOutput: null,
    };

    renderWithRouter(<ToolCallDetail toolCall={pendingToolCall} />);

    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('renders called by information', () => {
    renderWithRouter(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('Called By')).toBeInTheDocument();
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
  });

  it('renders executed by information', () => {
    renderWithRouter(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('Executed By')).toBeInTheDocument();
    expect(screen.getByText('Test Runtime')).toBeInTheDocument();
    expect(screen.getByText('runtime-host-1')).toBeInTheDocument();
  });

  it('does not render executed by section when executedBy is null', () => {
    const toolCallWithoutExecutor = {
      ...mockToolCall,
      executedBy: null,
    };

    renderWithRouter(<ToolCallDetail toolCall={toolCallWithoutExecutor} />);

    expect(screen.queryByText('Executed By')).not.toBeInTheDocument();
  });

  it('renders called at timestamp', () => {
    renderWithRouter(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('Called At')).toBeInTheDocument();
    // The exact format depends on locale, but should contain the year
    expect(screen.getByText(/2025/)).toBeInTheDocument();
  });

  it('renders duration when completed', () => {
    renderWithRouter(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('5000ms')).toBeInTheDocument();
  });

  it('does not render duration when not completed', () => {
    const pendingToolCall = {
      ...mockToolCall,
      status: ToolCallStatus.Pending,
      completedAt: null,
    };

    renderWithRouter(<ToolCallDetail toolCall={pendingToolCall} />);

    expect(screen.queryByText('Duration')).not.toBeInTheDocument();
  });

  it('renders tool input with JSON formatting', () => {
    renderWithRouter(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('Input')).toBeInTheDocument();
    // Should contain the formatted JSON
    expect(screen.getByText(/"query": "test query"/)).toBeInTheDocument();
  });

  it('renders tool output when completed successfully', () => {
    renderWithRouter(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('Output')).toBeInTheDocument();
    expect(screen.getByText('test output')).toBeInTheDocument();
  });

  it('renders error message when failed', () => {
    const failedToolCall = {
      ...mockToolCall,
      status: ToolCallStatus.Failed,
      error: 'Test error message',
      toolOutput: null,
    };

    renderWithRouter(<ToolCallDetail toolCall={failedToolCall} />);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('does not render output section when no output and no error', () => {
    const pendingToolCall = {
      ...mockToolCall,
      status: ToolCallStatus.Pending,
      completedAt: null,
      toolOutput: null,
      error: null,
    };

    renderWithRouter(<ToolCallDetail toolCall={pendingToolCall} />);

    expect(screen.queryByText('Output')).not.toBeInTheDocument();
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });

  it('renders without hostname when not provided', () => {
    const toolCallWithoutHostnames = {
      ...mockToolCall,
      calledBy: createMockToolSetRef({ id: 'runtime-1' }),
      executedBy: createMockRuntimeRef({ id: 'runtime-2', hostname: null }),
    };

    renderWithRouter(<ToolCallDetail toolCall={toolCallWithoutHostnames} />);

    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('Test Runtime')).toBeInTheDocument();
    // Hostnames should not be rendered
    expect(screen.queryByText('agent-host-1')).not.toBeInTheDocument();
    expect(screen.queryByText('runtime-host-1')).not.toBeInTheDocument();
  });

  it('handles non-JSON tool input gracefully', () => {
    const toolCallWithPlainTextInput = {
      ...mockToolCall,
      toolInput: 'plain text input that is not JSON',
    };

    renderWithRouter(<ToolCallDetail toolCall={toolCallWithPlainTextInput} />);

    // Should render the plain text as-is
    expect(screen.getByText('plain text input that is not JSON')).toBeInTheDocument();
  });

  it('applies correct styling for completed status', () => {
    const { container } = renderWithRouter(<ToolCallDetail toolCall={mockToolCall} />);

    const statusBadge = container.querySelector('.bg-green-100');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('text-green-800');
  });

  it('applies correct styling for failed status', () => {
    const failedToolCall = {
      ...mockToolCall,
      status: ToolCallStatus.Failed,
      error: 'Test error',
      toolOutput: null,
    };

    const { container } = renderWithRouter(<ToolCallDetail toolCall={failedToolCall} />);

    const statusBadge = container.querySelector('.bg-red-100');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('text-red-800');
  });

  it('applies correct styling for pending status', () => {
    const pendingToolCall = {
      ...mockToolCall,
      status: ToolCallStatus.Pending,
      completedAt: null,
      toolOutput: null,
    };

    const { container } = renderWithRouter(<ToolCallDetail toolCall={pendingToolCall} />);

    const statusBadge = container.querySelector('.bg-yellow-100');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('text-yellow-800');
  });

  it('maintains proper spacing after description removal', () => {
    const { container } = renderWithRouter(<ToolCallDetail toolCall={mockToolCall} />);

    // The tool info section should still exist
    const toolInfoSection = container.querySelector('.space-y-6');
    expect(toolInfoSection).toBeInTheDocument();

    // Tool name is in h3 and server text is in p - they should be in the same parent div
    const toolNameElement = screen.getByText('test-tool');
    const serverLabelElement = screen.getByText('Server:');

    // Both should be descendants of the same parent div
    expect(toolNameElement.closest('div')).toBe(serverLabelElement.closest('div'));
  });

  it('works with optional description field', () => {
    const toolCallWithoutDescription = {
      ...mockToolCall,
      mcpTool: createMockMcpToolRef({ description: '' }),
    };

    // Should not throw an error
    expect(() => renderWithRouter(<ToolCallDetail toolCall={toolCallWithoutDescription} />)).not.toThrow();

    expect(screen.getByText('test-tool')).toBeInTheDocument();
    expect(screen.getByText('Server:')).toBeInTheDocument();
    expect(screen.getByText('Test Server')).toBeInTheDocument();
  });

  it('renders token usage section with input, output, and total tokens', () => {
    renderWithRouter(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('Input Tokens')).toBeInTheDocument();
    expect(screen.getByText('Output Tokens')).toBeInTheDocument();
    expect(screen.getByText('Total Tokens')).toBeInTheDocument();
  });

  it('calculates and displays token counts correctly', () => {
    // toolInput: '{"query":"test query"}' = 22 chars / 4 = 5.5 -> 6 tokens
    // toolOutput: 'test output' = 11 chars / 4 = 2.75 -> 3 tokens
    // Total: 6 + 3 = 9 tokens
    renderWithRouter(<ToolCallDetail toolCall={mockToolCall} />);

    // Should display formatted token counts with ~ prefix
    expect(screen.getByText('~6 tokens')).toBeInTheDocument(); // Input
    expect(screen.getByText('~3 tokens')).toBeInTheDocument(); // Output
    expect(screen.getByText('~9 tokens')).toBeInTheDocument(); // Total
  });

  it('handles null toolOutput for token calculation', () => {
    const toolCallWithNullOutput = {
      ...mockToolCall,
      toolOutput: null,
    };

    renderWithRouter(<ToolCallDetail toolCall={toolCallWithNullOutput} />);

    // Input tokens should still be calculated
    expect(screen.getByText('Input Tokens')).toBeInTheDocument();
    expect(screen.getByText('Output Tokens')).toBeInTheDocument();
    expect(screen.getByText('~0 tokens')).toBeInTheDocument(); // Output should be 0 with ~ prefix
  });

  it('displays token usage before input/output sections', () => {
    const { container } = renderWithRouter(<ToolCallDetail toolCall={mockToolCall} />);

    const sections = container.querySelectorAll('.space-y-6 > div');
    const tokenSection = Array.from(sections).find((section) =>
      section.textContent?.includes('Input Tokens')
    );
    const inputSection = Array.from(sections).find((section) =>
      section.querySelector('p')?.textContent === 'Input'
    );

    expect(tokenSection).toBeInTheDocument();
    expect(inputSection).toBeInTheDocument();

    // Token section should come before input section
    const tokenIndex = Array.from(sections).indexOf(tokenSection!);
    const inputIndex = Array.from(sections).indexOf(inputSection!);
    expect(tokenIndex).toBeLessThan(inputIndex);
  });

  it('displays red error UI when output contains isError: true', () => {
    const toolCallWithOutputError = {
      ...mockToolCall,
      status: ToolCallStatus.Completed,
      toolOutput: '{"isError": true, "message": "Tool execution failed"}',
      error: null,
    };

    const { container } = renderWithRouter(<ToolCallDetail toolCall={toolCallWithOutputError} />);

    // Should show "Error" label instead of "Output"
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.queryByText('Output')).not.toBeInTheDocument();

    // Should have red styling
    const errorContainer = container.querySelector('.bg-red-50');
    expect(errorContainer).toBeInTheDocument();
    expect(errorContainer).toHaveClass('text-red-700');
    expect(errorContainer).toHaveClass('border-red-200');

    // Should display the output content
    expect(screen.getByText(/"isError": true/)).toBeInTheDocument();
  });

  it('displays green success UI when output contains isError: false', () => {
    const toolCallWithSuccessOutput = {
      ...mockToolCall,
      status: ToolCallStatus.Completed,
      toolOutput: '{"isError": false, "data": "success result"}',
      error: null,
    };

    const { container } = renderWithRouter(<ToolCallDetail toolCall={toolCallWithSuccessOutput} />);

    // Should show "Output" label
    expect(screen.getByText('Output')).toBeInTheDocument();
    expect(screen.queryByText('Error')).not.toBeInTheDocument();

    // Should have green styling
    const outputContainer = container.querySelector('.bg-green-50');
    expect(outputContainer).toBeInTheDocument();
    expect(outputContainer).toHaveClass('border-green-200');

    // Should display the output content
    expect(screen.getByText(/"data": "success result"/)).toBeInTheDocument();
  });

  it('displays green success UI when output does not contain isError field', () => {
    const toolCallWithoutErrorField = {
      ...mockToolCall,
      status: ToolCallStatus.Completed,
      toolOutput: '{"data": "success result"}',
      error: null,
    };

    const { container } = renderWithRouter(<ToolCallDetail toolCall={toolCallWithoutErrorField} />);

    // Should show "Output" label
    expect(screen.getByText('Output')).toBeInTheDocument();

    // Should have green styling
    const outputContainer = container.querySelector('.bg-green-50');
    expect(outputContainer).toBeInTheDocument();
  });

  it('handles non-JSON output gracefully and displays as success', () => {
    const toolCallWithPlainTextOutput = {
      ...mockToolCall,
      status: ToolCallStatus.Completed,
      toolOutput: 'Plain text output that is not JSON',
      error: null,
    };

    const { container } = renderWithRouter(<ToolCallDetail toolCall={toolCallWithPlainTextOutput} />);

    // Should show "Output" label (not error)
    expect(screen.getByText('Output')).toBeInTheDocument();
    expect(screen.queryByText('Error')).not.toBeInTheDocument();

    // Should have green styling
    const outputContainer = container.querySelector('.bg-green-50');
    expect(outputContainer).toBeInTheDocument();

    // Should display the plain text output
    expect(screen.getByText('Plain text output that is not JSON')).toBeInTheDocument();
  });

  it('prioritizes status Failed over isError in output', () => {
    // When status is FAILED with error field, it should use that instead of checking output
    const failedToolCallWithOutput = {
      ...mockToolCall,
      status: ToolCallStatus.Failed,
      error: 'GraphQL-level error',
      toolOutput: '{"isError": false, "data": "some data"}',
    };

    const { container } = renderWithRouter(<ToolCallDetail toolCall={failedToolCallWithOutput} />);

    // Should show "Error" label
    expect(screen.getAllByText('Error').length).toBeGreaterThan(0);

    // Should display the error field, not the output
    expect(screen.getByText('GraphQL-level error')).toBeInTheDocument();
    expect(screen.queryByText(/"data": "some data"/)).not.toBeInTheDocument();

    // Should have red styling
    const errorContainer = container.querySelector('.bg-red-50');
    expect(errorContainer).toBeInTheDocument();
  });

  it('applies correct dark mode styling for error outputs', () => {
    const toolCallWithOutputError = {
      ...mockToolCall,
      status: ToolCallStatus.Completed,
      toolOutput: '{"isError": true, "message": "Failed"}',
      error: null,
    };

    const { container } = renderWithRouter(<ToolCallDetail toolCall={toolCallWithOutputError} />);

    // Should have dark mode classes
    const errorContainer = container.querySelector('.dark\\:bg-red-900\\/20');
    expect(errorContainer).toBeInTheDocument();
    expect(errorContainer).toHaveClass('dark:text-red-300');
    expect(errorContainer).toHaveClass('dark:border-red-800');
  });

  it('applies correct dark mode styling for success outputs', () => {
    const toolCallWithSuccessOutput = {
      ...mockToolCall,
      status: ToolCallStatus.Completed,
      toolOutput: '{"data": "success"}',
      error: null,
    };

    const { container } = renderWithRouter(<ToolCallDetail toolCall={toolCallWithSuccessOutput} />);

    // Should have dark mode classes for success
    const outputContainer = container.querySelector('.dark\\:bg-green-900\\/20');
    expect(outputContainer).toBeInTheDocument();
    expect(outputContainer).toHaveClass('dark:border-green-800');
  });
});
