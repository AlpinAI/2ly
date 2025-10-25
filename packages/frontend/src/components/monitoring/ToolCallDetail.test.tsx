/**
 * ToolCallDetail Component Tests
 *
 * WHY: Test the ToolCallDetail component displays tool call information correctly
 * and does not display the tool description field.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToolCallDetail } from './ToolCallDetail';
import { ToolCallStatus } from '@/graphql/generated/graphql';

describe('ToolCallDetail', () => {
  const mockToolCall = {
    id: 'tc-1',
    status: ToolCallStatus.Completed,
    calledAt: new Date('2025-01-15T10:30:00Z'),
    completedAt: new Date('2025-01-15T10:30:05Z'),
    toolInput: JSON.stringify({ query: 'test query' }),
    toolOutput: 'test output',
    error: null,
    mcpTool: {
      name: 'test-tool',
      description: 'This is a test tool description that should not be displayed',
      mcpServer: {
        name: 'Test Server',
      },
    },
    calledBy: {
      name: 'Test Agent',
      hostname: 'agent-host-1',
    },
    executedBy: {
      name: 'Test Runtime',
      hostname: 'runtime-host-1',
    },
  };

  it('renders tool name', () => {
    render(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('test-tool')).toBeInTheDocument();
  });

  it('renders server name', () => {
    render(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText(/Server: Test Server/)).toBeInTheDocument();
  });

  it('does not render tool description', () => {
    render(<ToolCallDetail toolCall={mockToolCall} />);

    // Description should not be in the document
    expect(screen.queryByText('This is a test tool description that should not be displayed')).not.toBeInTheDocument();
  });

  it('renders status with icon for completed calls', () => {
    render(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  it('renders status with icon for failed calls', () => {
    const failedToolCall = {
      ...mockToolCall,
      status: ToolCallStatus.Failed,
      error: 'Test error message',
      toolOutput: null,
    };

    render(<ToolCallDetail toolCall={failedToolCall} />);

    expect(screen.getByText('FAILED')).toBeInTheDocument();
  });

  it('renders status with icon for pending calls', () => {
    const pendingToolCall = {
      ...mockToolCall,
      status: ToolCallStatus.Pending,
      completedAt: null,
      toolOutput: null,
    };

    render(<ToolCallDetail toolCall={pendingToolCall} />);

    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('renders called by information', () => {
    render(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('Called By')).toBeInTheDocument();
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('agent-host-1')).toBeInTheDocument();
  });

  it('renders executed by information', () => {
    render(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('Executed By')).toBeInTheDocument();
    expect(screen.getByText('Test Runtime')).toBeInTheDocument();
    expect(screen.getByText('runtime-host-1')).toBeInTheDocument();
  });

  it('does not render executed by section when executedBy is null', () => {
    const toolCallWithoutExecutor = {
      ...mockToolCall,
      executedBy: null,
    };

    render(<ToolCallDetail toolCall={toolCallWithoutExecutor} />);

    expect(screen.queryByText('Executed By')).not.toBeInTheDocument();
  });

  it('renders called at timestamp', () => {
    render(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('Called At')).toBeInTheDocument();
    // The exact format depends on locale, but should contain the year
    expect(screen.getByText(/2025/)).toBeInTheDocument();
  });

  it('renders duration when completed', () => {
    render(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('5000ms')).toBeInTheDocument();
  });

  it('does not render duration when not completed', () => {
    const pendingToolCall = {
      ...mockToolCall,
      status: ToolCallStatus.Pending,
      completedAt: null,
    };

    render(<ToolCallDetail toolCall={pendingToolCall} />);

    expect(screen.queryByText('Duration')).not.toBeInTheDocument();
  });

  it('renders tool input with JSON formatting', () => {
    render(<ToolCallDetail toolCall={mockToolCall} />);

    expect(screen.getByText('Input')).toBeInTheDocument();
    // Should contain the formatted JSON
    expect(screen.getByText(/"query": "test query"/)).toBeInTheDocument();
  });

  it('renders tool output when completed successfully', () => {
    render(<ToolCallDetail toolCall={mockToolCall} />);

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

    render(<ToolCallDetail toolCall={failedToolCall} />);

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

    render(<ToolCallDetail toolCall={pendingToolCall} />);

    expect(screen.queryByText('Output')).not.toBeInTheDocument();
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });

  it('renders without hostname when not provided', () => {
    const toolCallWithoutHostnames = {
      ...mockToolCall,
      calledBy: {
        name: 'Test Agent',
        hostname: null,
      },
      executedBy: {
        name: 'Test Runtime',
        hostname: null,
      },
    };

    render(<ToolCallDetail toolCall={toolCallWithoutHostnames} />);

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

    render(<ToolCallDetail toolCall={toolCallWithPlainTextInput} />);

    // Should render the plain text as-is
    expect(screen.getByText('plain text input that is not JSON')).toBeInTheDocument();
  });

  it('applies correct styling for completed status', () => {
    const { container } = render(<ToolCallDetail toolCall={mockToolCall} />);

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

    const { container } = render(<ToolCallDetail toolCall={failedToolCall} />);

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

    const { container } = render(<ToolCallDetail toolCall={pendingToolCall} />);

    const statusBadge = container.querySelector('.bg-yellow-100');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('text-yellow-800');
  });

  it('maintains proper spacing after description removal', () => {
    const { container } = render(<ToolCallDetail toolCall={mockToolCall} />);

    // The tool info section should still exist
    const toolInfoSection = container.querySelector('.space-y-6');
    expect(toolInfoSection).toBeInTheDocument();

    // Tool name and server name should be in the same div
    const toolNameElement = screen.getByText('test-tool');
    const serverNameElement = screen.getByText(/Server: Test Server/);

    expect(toolNameElement.parentElement).toBe(serverNameElement.parentElement);
  });

  it('works with optional description field', () => {
    const toolCallWithoutDescription = {
      ...mockToolCall,
      mcpTool: {
        name: 'test-tool',
        // description field is omitted
        mcpServer: {
          name: 'Test Server',
        },
      },
    };

    // Should not throw an error
    expect(() => render(<ToolCallDetail toolCall={toolCallWithoutDescription} />)).not.toThrow();

    expect(screen.getByText('test-tool')).toBeInTheDocument();
    expect(screen.getByText(/Server: Test Server/)).toBeInTheDocument();
  });
});
