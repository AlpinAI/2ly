import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CodeBlock } from './code-block';

describe('CodeBlock', () => {
  // Mock clipboard API
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });
  });

  it('renders code with syntax highlighting', () => {
    render(<CodeBlock code="console.log('Hello World');" language="javascript" />);
    expect(screen.getByText(/console\.log/)).toBeInTheDocument();
  });

  it('displays line numbers', () => {
    const multiLineCode = `line 1
line 2
line 3`;
    render(<CodeBlock code={multiLineCode} language="bash" />);

    // Check for line number elements
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('copies code to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup();
    const testCode = 'npm install @2ly/runtime';

    const { container } = render(<CodeBlock code={testCode} language="bash" />);

    // Find and click the copy button
    const copyButton = container.querySelector('button');
    expect(copyButton).toBeInTheDocument();

    if (copyButton) {
      await user.click(copyButton);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testCode);
    }
  });

  it('shows check icon after successful copy', async () => {
    const user = userEvent.setup();
    const { container } = render(<CodeBlock code="test code" language="bash" />);

    const copyButton = container.querySelector('button');
    if (copyButton) {
      await user.click(copyButton);
      // Check icon should be visible
      const checkIcon = container.querySelector('svg.lucide-check');
      expect(checkIcon).toBeInTheDocument();
    }
  });

  it('applies correct font size based on size prop', () => {
    const { rerender, container } = render(
      <CodeBlock code="test" language="bash" size="small" />
    );

    let pre = container.querySelector('pre');
    expect(pre?.className).toContain('text-xs');

    rerender(<CodeBlock code="test" language="bash" size="medium" />);
    pre = container.querySelector('pre');
    expect(pre?.className).toContain('text-sm');

    rerender(<CodeBlock code="test" language="bash" size="large" />);
    pre = container.querySelector('pre');
    expect(pre?.className).toContain('text-base');
  });

  it('handles different language types', () => {
    const { rerender } = render(<CodeBlock code="test" language="python" />);
    expect(screen.getByText('test')).toBeInTheDocument();

    rerender(<CodeBlock code="test" language="json" />);
    expect(screen.getByText('test')).toBeInTheDocument();

    rerender(<CodeBlock code="test" language="typescript" />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CodeBlock code="test" language="bash" className="custom-class" />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper?.className).toContain('custom-class');
  });
});
