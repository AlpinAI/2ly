/**
 * TestPanel Component Tests
 *
 * WHY: Test the TestPanel component with lifecycle stage display, status states, and progress indicators
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestPanel } from './test-panel';

describe('TestPanel', () => {
  const defaultProps = {
    status: 'idle' as const,
    serverName: 'test-server',
  };

  describe('idle state', () => {
    it('renders ready to test message', () => {
      render(<TestPanel {...defaultProps} />);

      expect(screen.getByText('Ready to test')).toBeInTheDocument();
      expect(screen.getByText(/Configure your server and click/)).toBeInTheDocument();
    });
  });

  describe('running state', () => {
    it('renders default preparing message when no lifecycle stage', () => {
      render(<TestPanel {...defaultProps} status="running" />);

      expect(screen.getByText('Preparing test...')).toBeInTheDocument();
    });

    it('renders installing stage correctly', () => {
      render(
        <TestPanel
          {...defaultProps}
          status="running"
          lifecycleStage="INSTALLING"
          lifecycleMessage="Installing @anthropic/mcp-server..."
        />
      );

      expect(screen.getByText('Installing dependencies...')).toBeInTheDocument();
      expect(screen.getByText('Installing @anthropic/mcp-server...')).toBeInTheDocument();
    });

    it('renders starting stage correctly', () => {
      render(
        <TestPanel
          {...defaultProps}
          status="running"
          lifecycleStage="STARTING"
          lifecycleMessage="Starting MCP server process..."
        />
      );

      expect(screen.getByText('Starting server...')).toBeInTheDocument();
      expect(screen.getByText('Starting MCP server process...')).toBeInTheDocument();
    });

    it('renders listing tools stage correctly', () => {
      render(
        <TestPanel
          {...defaultProps}
          status="running"
          lifecycleStage="LISTING_TOOLS"
          lifecycleMessage="Discovering available tools..."
        />
      );

      expect(screen.getByText('Discovering tools...')).toBeInTheDocument();
      expect(screen.getByText('Discovering available tools...')).toBeInTheDocument();
    });

    it('renders stage indicator dots', () => {
      const { container } = render(
        <TestPanel {...defaultProps} status="running" lifecycleStage="STARTING" />
      );

      // Should render 3 dots for the stage indicator
      const dots = container.querySelectorAll('.rounded-full.w-2\\.5');
      expect(dots.length).toBe(3);
    });
  });

  describe('success state', () => {
    it('renders success with tools list', () => {
      const tools = [
        { id: '1', name: 'tool-one' },
        { id: '2', name: 'tool-two' },
      ];

      render(<TestPanel {...defaultProps} status="success" tools={tools} />);

      expect(screen.getByText(/Tools discovered/)).toBeInTheDocument();
      expect(screen.getByText('tool-one')).toBeInTheDocument();
      expect(screen.getByText('tool-two')).toBeInTheDocument();
    });

    it('shows more tools count when more than 3 tools', () => {
      const tools = [
        { id: '1', name: 'tool-one' },
        { id: '2', name: 'tool-two' },
        { id: '3', name: 'tool-three' },
        { id: '4', name: 'tool-four' },
        { id: '5', name: 'tool-five' },
      ];

      render(<TestPanel {...defaultProps} status="success" tools={tools} />);

      expect(screen.getByText('+2 more tools')).toBeInTheDocument();
    });

    it('shows no tools message when empty', () => {
      render(<TestPanel {...defaultProps} status="success" tools={[]} />);

      expect(screen.getByText(/no tools were found/)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders error message', () => {
      render(
        <TestPanel
          {...defaultProps}
          status="error"
          error="Server failed to start: npm install failed"
        />
      );

      expect(screen.getByText('Test failed')).toBeInTheDocument();
      expect(screen.getByText('Server failed to start: npm install failed')).toBeInTheDocument();
    });

    it('shows default error when no message provided', () => {
      render(<TestPanel {...defaultProps} status="error" />);

      expect(screen.getByText(/unexpected error occurred/)).toBeInTheDocument();
    });
  });

  describe('timeout state', () => {
    it('renders timeout message', () => {
      render(<TestPanel {...defaultProps} status="timeout" />);

      expect(screen.getByText('No tools discovered yet')).toBeInTheDocument();
      expect(screen.getByText(/20 seconds/)).toBeInTheDocument();
    });
  });
});
