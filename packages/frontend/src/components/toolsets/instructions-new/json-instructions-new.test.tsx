/**
 * Tests for JSONInstructionsNew
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JSONInstructionsNew } from './json-instructions-new';

describe('JSONInstructionsNew', () => {
  it('renders the title', () => {
    render(<JSONInstructionsNew />);
    expect(screen.getByText('JSON Configuration')).toBeInTheDocument();
  });

  it('renders image placeholder', () => {
    render(<JSONInstructionsNew />);
    expect(screen.getByText('JSON Configuration Example')).toBeInTheDocument();
  });

  it('renders instruction steps', () => {
    render(<JSONInstructionsNew />);
    expect(screen.getByText(/STDIO configuration/)).toBeInTheDocument();
    expect(screen.getByText(/mcp.json/)).toBeInTheDocument();
    expect(screen.getByText(/@2ly\/runtime/)).toBeInTheDocument();
  });

  it('mentions TOOLSET_KEY environment variable', () => {
    render(<JSONInstructionsNew />);
    expect(screen.getByText(/TOOLSET_KEY environment variable/)).toBeInTheDocument();
  });

  it('renders helper text about generic configuration', () => {
    render(<JSONInstructionsNew />);
    expect(screen.getByText(/MCP-compatible client/)).toBeInTheDocument();
  });
});
