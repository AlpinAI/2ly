/**
 * Tests for N8NInstructionsNew
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { N8NInstructions } from './n8n-instructions';

describe('N8NInstructions', () => {
  const defaultProps = {
    streamUrl: 'http://localhost:3000/stream'
  };

  it('renders the title', () => {
    render(<N8NInstructions {...defaultProps} />);
    expect(screen.getByText('Connect N8N to 2LY')).toBeInTheDocument();
  });

  it('renders the image', () => {
    render(<N8NInstructions {...defaultProps} />);
    const image = screen.getByAltText('N8N MCP Client configuration');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/connect-instructions/n8n.png');
  });

  it('renders instruction steps', () => {
    render(<N8NInstructions {...defaultProps} />);
    expect(screen.getByText(/MCP Client/)).toBeInTheDocument();
    expect(screen.getByText(/HTTP Streamable/)).toBeInTheDocument();
    expect(screen.getByText(/STREAM URL/)).toBeInTheDocument();
  });

  it('renders the STREAM URL', () => {
    render(<N8NInstructions {...defaultProps} />);
    expect(screen.getByText('http://localhost:3000/stream')).toBeInTheDocument();
  });
});
