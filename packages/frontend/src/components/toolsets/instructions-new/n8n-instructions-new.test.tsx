/**
 * Tests for N8NInstructionsNew
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { N8NInstructionsNew } from './n8n-instructions-new';

describe('N8NInstructionsNew', () => {
  it('renders the title', () => {
    render(<N8NInstructionsNew />);
    expect(screen.getByText('Connect N8N to 2LY')).toBeInTheDocument();
  });

  it('renders image placeholder', () => {
    render(<N8NInstructionsNew />);
    expect(screen.getByText('N8N Setup Screenshot')).toBeInTheDocument();
  });

  it('renders instruction steps', () => {
    render(<N8NInstructionsNew />);
    expect(screen.getByText(/MCP Client Tool/)).toBeInTheDocument();
    expect(screen.getByText(/Streamable HTTP/)).toBeInTheDocument();
    expect(screen.getByText(/STREAM URL/)).toBeInTheDocument();
  });

  it('renders helper text about STREAM connection', () => {
    render(<N8NInstructionsNew />);
    expect(screen.getByText(/real-time bidirectional communication/)).toBeInTheDocument();
  });
});
