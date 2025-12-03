/**
 * Tests for LangflowInstructionsNew
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangflowInstructions } from './langflow-instructions';

describe('LangflowInstructions', () => {
  const defaultProps = {
    sseUrl: 'http://localhost:3000/sse',
    skillName: 'test-skill'
  };

  it('renders the title', () => {
    render(<LangflowInstructions {...defaultProps} />);
    expect(screen.getByText('Connect Langflow to 2LY')).toBeInTheDocument();
  });

  it('renders the image', () => {
    render(<LangflowInstructions {...defaultProps} />);
    const image = screen.getByAltText('Langflow MCP Client configuration');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/connect-instructions/langflow.png');
  });

  it('renders instruction steps', () => {
    render(<LangflowInstructions {...defaultProps} />);
    expect(screen.getByText(/MCP Tools/)).toBeInTheDocument();
    expect(screen.getByText(/Add MCP Server/)).toBeInTheDocument();
    expect(screen.getByText(/SSE URL/)).toBeInTheDocument();
  });

  it('renders the SSE URL and skill name', () => {
    render(<LangflowInstructions {...defaultProps} />);
    expect(screen.getByText('http://localhost:3000/sse')).toBeInTheDocument();
    expect(screen.getByText('test-skill')).toBeInTheDocument();
  });
});
