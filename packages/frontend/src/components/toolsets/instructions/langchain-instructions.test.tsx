/**
 * Tests for LangchainInstructionsNew
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangchainInstructions } from './langchain-instructions';

describe('LangchainInstructions', () => {
  it('renders the title', () => {
    render(<LangchainInstructions toolsetKey="test-key" />);
    expect(screen.getByText('Connect Langchain/Langgraph to 2LY')).toBeInTheDocument();
  });

  it('renders image placeholder', () => {
    render(<LangchainInstructions toolsetKey="test-key" />);
    expect(screen.getByText('Langchain Setup Screenshot')).toBeInTheDocument();
  });

  it('renders install command', () => {
    render(<LangchainInstructions toolsetKey="test-key" />);
    expect(screen.getByText(/pip install langchain_2ly/)).toBeInTheDocument();
  });

  it('includes toolset key in code example', () => {
    render(<LangchainInstructions toolsetKey="my-custom-key" />);
    expect(screen.getByText(/my-custom-key/)).toBeInTheDocument();
  });

  it('renders helper text about STDIO connection', () => {
    render(<LangchainInstructions toolsetKey="test-key" />);
    expect(screen.getByText(/STDIO provides local process-based communication/)).toBeInTheDocument();
  });
});
