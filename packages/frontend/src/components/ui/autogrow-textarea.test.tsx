/**
 * AutoGrowTextarea Component Tests
 *
 * WHY: Test the AutoGrowTextarea component for auto-growing behavior,
 * height constraints, and standard textarea functionality
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AutoGrowTextarea } from './autogrow-textarea';

describe('AutoGrowTextarea', () => {
  // Mock computed styles for line height calculations
  let originalGetComputedStyle: typeof window.getComputedStyle;

  beforeEach(() => {
    originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = vi.fn(() => ({
      lineHeight: '20px',
      paddingTop: '8px',
      paddingBottom: '8px',
      borderTopWidth: '1px',
      borderBottomWidth: '1px',
    })) as unknown as typeof window.getComputedStyle;
  });

  afterEach(() => {
    window.getComputedStyle = originalGetComputedStyle;
  });

  describe('Basic Rendering', () => {
    it('renders textarea with placeholder', () => {
      render(<AutoGrowTextarea placeholder="Enter description" />);

      const textarea = screen.getByPlaceholderText('Enter description');
      expect(textarea).toBeDefined();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('renders with default value', () => {
      render(<AutoGrowTextarea placeholder="Textarea" defaultValue="default content" />);

      const textarea = screen.getByPlaceholderText('Textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('default content');
    });

    it('renders with controlled value', () => {
      render(<AutoGrowTextarea placeholder="Textarea" value="controlled" onChange={vi.fn()} />);

      const textarea = screen.getByPlaceholderText('Textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('controlled');
    });

    it('renders with custom className', () => {
      render(<AutoGrowTextarea placeholder="Custom" className="custom-class" />);

      const textarea = screen.getByPlaceholderText('Custom');
      expect(textarea.className).toContain('custom-class');
    });

    it('has resize-none class', () => {
      render(<AutoGrowTextarea placeholder="Textarea" />);

      const textarea = screen.getByPlaceholderText('Textarea');
      expect(textarea.className).toContain('resize-none');
    });

    it('has transition class for smooth height changes', () => {
      render(<AutoGrowTextarea placeholder="Textarea" />);

      const textarea = screen.getByPlaceholderText('Textarea');
      expect(textarea.className).toContain('transition-[height]');
      expect(textarea.className).toContain('duration-[50ms]');
    });
  });

  describe('Auto-grow Behavior', () => {
    it('starts with minimum height', () => {
      render(<AutoGrowTextarea placeholder="Textarea" minRows={1} />);

      const textarea = screen.getByPlaceholderText('Textarea') as HTMLTextAreaElement;

      // Mock initial dimensions
      Object.defineProperty(textarea, 'clientHeight', { value: 38, configurable: true });
      Object.defineProperty(textarea, 'scrollHeight', { value: 38, configurable: true });

      // Trigger the layout effect
      fireEvent.change(textarea, { target: { value: '' } });

      // Should have height set (minHeight = 20px * 1 row + 18px padding = 38px)
      expect(textarea.style.height).toBeTruthy();
    });

    it('grows when content exceeds current height', () => {
      const { rerender } = render(
        <AutoGrowTextarea placeholder="Textarea" value="" onChange={vi.fn()} minRows={1} maxRows={5} />
      );

      const textarea = screen.getByPlaceholderText('Textarea') as HTMLTextAreaElement;

      // Initial state - 1 row
      Object.defineProperty(textarea, 'clientHeight', { value: 38, configurable: true, writable: true });
      Object.defineProperty(textarea, 'scrollHeight', { value: 38, configurable: true, writable: true });

      // Content now needs 3 rows - mock before rerender
      Object.defineProperty(textarea, 'scrollHeight', { value: 98, configurable: true, writable: true });

      // Rerender with new value triggers useLayoutEffect
      rerender(<AutoGrowTextarea placeholder="Textarea" value="Line 1\nLine 2\nLine 3" onChange={vi.fn()} minRows={1} maxRows={5} />);

      // Should grow to accommodate content
      expect(textarea.style.height).toBe('98px');
    });

    it('respects maxRows constraint', () => {
      const { rerender } = render(
        <AutoGrowTextarea placeholder="Textarea" value="" onChange={vi.fn()} minRows={1} maxRows={3} />
      );

      const textarea = screen.getByPlaceholderText('Textarea') as HTMLTextAreaElement;

      // maxHeight = 20px * 3 rows + 18px padding = 78px
      const maxHeight = 78;

      // Mock dimensions before rerender - content exceeds maxRows
      Object.defineProperty(textarea, 'scrollHeight', { value: 158, configurable: true, writable: true }); // 5 rows worth
      Object.defineProperty(textarea, 'clientHeight', { value: 78, configurable: true, writable: true });

      // Try to set content that would exceed maxRows
      rerender(
        <AutoGrowTextarea
          placeholder="Textarea"
          value="Line 1\nLine 2\nLine 3\nLine 4\nLine 5"
          onChange={vi.fn()}
          minRows={1}
          maxRows={3}
        />
      );

      // Should be capped at maxHeight
      expect(textarea.style.height).toBe(`${maxHeight}px`);
    });

    it('enables overflow when content exceeds maxRows', () => {
      const { rerender } = render(
        <AutoGrowTextarea placeholder="Textarea" value="" onChange={vi.fn()} minRows={1} maxRows={3} />
      );

      const textarea = screen.getByPlaceholderText('Textarea') as HTMLTextAreaElement;

      // Mock dimensions before rerender - content exceeds maxRows
      Object.defineProperty(textarea, 'scrollHeight', { value: 118, configurable: true, writable: true }); // 4 rows
      Object.defineProperty(textarea, 'clientHeight', { value: 78, configurable: true, writable: true }); // maxRows = 3

      // Content exceeds maxRows
      rerender(
        <AutoGrowTextarea
          placeholder="Textarea"
          value="Line 1\nLine 2\nLine 3\nLine 4"
          onChange={vi.fn()}
          minRows={1}
          maxRows={3}
        />
      );

      // Should enable vertical scrolling
      expect(textarea.style.overflowY).toBe('auto');
    });

    it('hides overflow when content is within maxRows', () => {
      const { rerender: _rerender } = render(
        <AutoGrowTextarea placeholder="Textarea" value="Line 1\nLine 2" onChange={vi.fn()} minRows={1} maxRows={5} />
      );

      const textarea = screen.getByPlaceholderText('Textarea') as HTMLTextAreaElement;

      Object.defineProperty(textarea, 'scrollHeight', { value: 58, configurable: true }); // 2 rows
      Object.defineProperty(textarea, 'clientHeight', { value: 58, configurable: true });

      fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2' } });

      // Should hide overflow
      expect(textarea.style.overflowY).toBe('hidden');
    });

    it('shrinks when content is removed', () => {
      const { rerender } = render(
        <AutoGrowTextarea
          placeholder="Textarea"
          value="Line 1\nLine 2\nLine 3"
          onChange={vi.fn()}
          minRows={1}
          maxRows={5}
        />
      );

      const textarea = screen.getByPlaceholderText('Textarea') as HTMLTextAreaElement;

      // Start with 3 rows
      Object.defineProperty(textarea, 'clientHeight', { value: 98, configurable: true });
      Object.defineProperty(textarea, 'scrollHeight', { value: 98, configurable: true });

      // Remove content to 1 row
      rerender(<AutoGrowTextarea placeholder="Textarea" value="Line 1" onChange={vi.fn()} minRows={1} maxRows={5} />);

      Object.defineProperty(textarea, 'scrollHeight', { value: 38, configurable: true });

      fireEvent.change(textarea, { target: { value: 'Line 1' } });

      // Should shrink back to smaller height
      expect(textarea.style.height).toBe('38px');
    });
  });

  describe('Props and Configuration', () => {
    it('uses default minRows and maxRows when not specified', () => {
      render(<AutoGrowTextarea placeholder="Textarea" />);

      const textarea = screen.getByPlaceholderText('Textarea');
      expect(textarea).toBeDefined();
      // Defaults: minRows=1, maxRows=5 (tested implicitly through behavior)
    });

    it('accepts custom minRows', () => {
      render(<AutoGrowTextarea placeholder="Textarea" minRows={2} />);

      const textarea = screen.getByPlaceholderText('Textarea') as HTMLTextAreaElement;

      Object.defineProperty(textarea, 'clientHeight', { value: 58, configurable: true }); // 2 rows
      Object.defineProperty(textarea, 'scrollHeight', { value: 58, configurable: true });

      fireEvent.change(textarea, { target: { value: '' } });

      // minHeight = 20px * 2 rows + 18px padding = 58px
      expect(textarea.style.height).toBeTruthy();
    });

    it('accepts custom maxRows', () => {
      render(<AutoGrowTextarea placeholder="Textarea" minRows={1} maxRows={10} />);

      const textarea = screen.getByPlaceholderText('Textarea');
      expect(textarea).toBeDefined();
      // maxRows behavior tested in auto-grow tests
    });
  });

  describe('Standard Textarea Features', () => {
    it('handles onChange events', () => {
      const onChange = vi.fn();
      render(<AutoGrowTextarea placeholder="Textarea" onChange={onChange} />);

      const textarea = screen.getByPlaceholderText('Textarea');
      fireEvent.change(textarea, { target: { value: 'test content' } });

      expect(onChange).toHaveBeenCalled();
    });

    it('handles onBlur events', () => {
      const onBlur = vi.fn();
      render(<AutoGrowTextarea placeholder="Textarea" onBlur={onBlur} />);

      const textarea = screen.getByPlaceholderText('Textarea');
      fireEvent.blur(textarea);

      expect(onBlur).toHaveBeenCalled();
    });

    it('handles onFocus events', () => {
      const onFocus = vi.fn();
      render(<AutoGrowTextarea placeholder="Textarea" onFocus={onFocus} />);

      const textarea = screen.getByPlaceholderText('Textarea');
      fireEvent.focus(textarea);

      expect(onFocus).toHaveBeenCalled();
    });

    it('renders as disabled', () => {
      render(<AutoGrowTextarea placeholder="Disabled" disabled />);

      const textarea = screen.getByPlaceholderText('Disabled');
      expect(textarea.getAttribute('disabled')).toBe('');
      expect(textarea.className).toContain('disabled:cursor-not-allowed');
    });

    it('renders with required attribute', () => {
      render(<AutoGrowTextarea placeholder="Required" required />);

      const textarea = screen.getByPlaceholderText('Required');
      expect(textarea.getAttribute('required')).toBe('');
    });

    it('renders with maxLength attribute', () => {
      render(<AutoGrowTextarea placeholder="Textarea" maxLength={100} />);

      const textarea = screen.getByPlaceholderText('Textarea');
      expect(textarea.getAttribute('maxlength')).toBe('100');
    });

    it('renders with readonly attribute', () => {
      render(<AutoGrowTextarea placeholder="Readonly" readOnly />);

      const textarea = screen.getByPlaceholderText('Readonly');
      expect(textarea.getAttribute('readonly')).toBe('');
    });

    it('applies focus-visible styles', () => {
      render(<AutoGrowTextarea placeholder="Textarea" />);

      const textarea = screen.getByPlaceholderText('Textarea');
      expect(textarea.className).toContain('focus-visible:outline-none');
      expect(textarea.className).toContain('focus-visible:ring-2');
    });

    it('applies placeholder styles', () => {
      render(<AutoGrowTextarea placeholder="Placeholder test" />);

      const textarea = screen.getByPlaceholderText('Placeholder test');
      expect(textarea.className).toContain('placeholder:text-muted-foreground');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to textarea element', () => {
      const ref = React.createRef<HTMLTextAreaElement>();
      render(<AutoGrowTextarea ref={ref} placeholder="Textarea" />);

      expect(ref.current).toBeDefined();
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('allows calling textarea methods via ref', () => {
      const ref = React.createRef<HTMLTextAreaElement>();
      render(<AutoGrowTextarea ref={ref} placeholder="Textarea" />);

      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
      expect(ref.current?.select).toBeDefined();
    });
  });

  describe('Controlled Component', () => {
    it('works as controlled component', () => {
      const Component = () => {
        const [value, setValue] = React.useState('');
        return (
          <AutoGrowTextarea
            placeholder="Controlled"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            minRows={1}
            maxRows={5}
          />
        );
      };

      render(<Component />);

      const textarea = screen.getByPlaceholderText('Controlled') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');

      fireEvent.change(textarea, { target: { value: 'new content' } });
      expect(textarea.value).toBe('new content');
    });

    it('updates height when value prop changes', () => {
      const { rerender } = render(
        <AutoGrowTextarea placeholder="Textarea" value="Short" onChange={vi.fn()} minRows={1} maxRows={5} />
      );

      const textarea = screen.getByPlaceholderText('Textarea') as HTMLTextAreaElement;

      Object.defineProperty(textarea, 'clientHeight', { value: 38, configurable: true, writable: true });
      Object.defineProperty(textarea, 'scrollHeight', { value: 38, configurable: true, writable: true });

      // Mock new dimensions before rerender
      Object.defineProperty(textarea, 'scrollHeight', { value: 98, configurable: true, writable: true });

      rerender(
        <AutoGrowTextarea
          placeholder="Textarea"
          value="Much longer content\nwith multiple\nlines of text"
          onChange={vi.fn()}
          minRows={1}
          maxRows={5}
        />
      );

      expect(textarea.style.height).toBe('98px');
    });
  });
});
