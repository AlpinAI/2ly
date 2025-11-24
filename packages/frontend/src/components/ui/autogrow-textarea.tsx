import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AutoGrowTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

const AutoGrowTextarea = React.forwardRef<HTMLTextAreaElement, AutoGrowTextareaProps>(
  ({ className, minRows = 1, maxRows = 5, value, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [minHeight, setMinHeight] = React.useState<number>(0);
    const [maxHeight, setMaxHeight] = React.useState<number>(0);
    const previousHeightRef = React.useRef<number>(0);

    // Combine refs
    React.useImperativeHandle(ref, () => textareaRef.current!);

    // Calculate min and max heights based on line height
    React.useLayoutEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Get computed styles to calculate line height
      const styles = window.getComputedStyle(textarea);
      const lineHeight = parseFloat(styles.lineHeight);
      const paddingTop = parseFloat(styles.paddingTop);
      const paddingBottom = parseFloat(styles.paddingBottom);
      const borderTop = parseFloat(styles.borderTopWidth);
      const borderBottom = parseFloat(styles.borderBottomWidth);

      // Calculate heights
      const verticalPadding = paddingTop + paddingBottom + borderTop + borderBottom;
      const calculatedMinHeight = lineHeight * minRows + verticalPadding;
      const calculatedMaxHeight = lineHeight * maxRows + verticalPadding;

      setMinHeight(calculatedMinHeight);
      setMaxHeight(calculatedMaxHeight);
    }, [minRows, maxRows]);

    // Auto-grow based on content
    React.useLayoutEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea || !minHeight || !maxHeight) return;

      const currentHeight = textarea.clientHeight;

      // First, check if content is overflowing (growing case)
      if (textarea.scrollHeight > currentHeight) {
        // Growing: just set the new height directly
        const targetHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = `${targetHeight}px`;
        textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
        previousHeightRef.current = targetHeight;
      } else if (textarea.scrollHeight < currentHeight || currentHeight < minHeight) {
        // Shrinking or needs adjustment: reset to measure actual content size
        textarea.style.overflow = 'hidden';
        textarea.style.height = `${minHeight}px`;

        const contentHeight = textarea.scrollHeight;
        const targetHeight = Math.min(Math.max(contentHeight, minHeight), maxHeight);

        textarea.style.height = `${targetHeight}px`;
        textarea.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
        previousHeightRef.current = targetHeight;
      }
    }, [value, minHeight, maxHeight]);

    return (
      <textarea
        className={cn(
          'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'resize-none transition-[height] duration-[50ms] ease-out',
          className
        )}
        ref={textareaRef}
        value={value}
        {...props}
      />
    );
  }
);
AutoGrowTextarea.displayName = 'AutoGrowTextarea';

export { AutoGrowTextarea };
