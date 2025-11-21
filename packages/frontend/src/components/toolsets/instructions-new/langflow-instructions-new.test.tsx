/**
 * Tests for LangflowInstructionsNew
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangflowInstructionsNew } from './langflow-instructions-new';

describe('LangflowInstructionsNew', () => {
  it('renders the title', () => {
    render(<LangflowInstructionsNew />);
    expect(screen.getByText('Connect Langflow to 2LY')).toBeInTheDocument();
  });

  it('renders image placeholder', () => {
    render(<LangflowInstructionsNew />);
    expect(screen.getByText('Langflow Setup Screenshot')).toBeInTheDocument();
  });

  it('renders instruction steps', () => {
    render(<LangflowInstructionsNew />);
    expect(screen.getAllByText(/MCP Server/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SSE/).length).toBeGreaterThan(0);
    expect(screen.getByText(/SSE URL/)).toBeInTheDocument();
  });

  it('renders helper text about SSE connection', () => {
    render(<LangflowInstructionsNew />);
    expect(screen.getByText(/Server-Sent Events/)).toBeInTheDocument();
  });
});
