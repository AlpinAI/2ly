/**
 * CodeBlock Component
 *
 * WHY: Displays syntax-highlighted code snippets with copy functionality.
 * Used for showing connection instructions, configuration examples, etc.
 *
 * DESIGN DECISIONS:
 * - Uses prism-react-renderer for syntax highlighting
 * - Includes copy-to-clipboard button (appears on hover)
 * - Supports multiple languages (bash, python, json, typescript, javascript)
 * - Dark theme for better code readability
 * - Line numbers for reference
 * - Responsive text sizing
 *
 * USAGE:
 * ```tsx
 * <CodeBlock
 *   code="npm install @2ly/runtime"
 *   language="bash"
 *   size="small"
 * />
 * ```
 */

import { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import type { Language } from 'prism-react-renderer';
import { Button } from '@/components/ui/button';

export interface CodeBlockProps {
  /** The code to display */
  code: string;
  /** Programming language for syntax highlighting */
  language?: 'bash' | 'javascript' | 'typescript' | 'python' | 'json';
  /** Optional className for additional styling */
  className?: string;
  /** Text size variant */
  size?: 'small' | 'medium' | 'large';
}

export function CodeBlock({
  code,
  language = 'bash',
  className = '',
  size = 'medium',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const LINE_NUMBER_GUTTER_WIDTH = 'w-12';
  const LINE_NUMBER_TEXT_COLOR = 'text-gray-500';

  // Map size prop to Tailwind classes
  const fontSizeClass = useMemo<string>(() => {
    if (size === 'small') return 'text-xs';
    if (size === 'large') return 'text-base';
    return 'text-sm';
  }, [size]);

  // Map language to Prism language identifier
  const prismLanguage = useMemo<Language>(() => {
    if (language === 'typescript') return 'tsx';
    if (language === 'javascript') return 'jsx';
    if (language === 'bash') return 'bash';
    if (language === 'json') return 'json';
    return 'python';
  }, [language]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className={`relative rounded-lg ${className}`}>
      <Highlight code={code} language={prismLanguage} theme={themes.vsDark}>
        {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
          <div
            className="relative group rounded-lg"
            style={{ backgroundColor: style.backgroundColor }}
          >
            {/* Copy Button (appears on hover) */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 w-8 p-0 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Code Content */}
            <pre
              className={`${highlightClassName} m-0 ${fontSizeClass} whitespace-pre-wrap break-words overflow-x-hidden py-4 pr-4 pl-0`}
              style={style}
            >
              {tokens.map((line, lineIndex) => {
                const lineProps = getLineProps({ line });
                const mergedLineClassName = `${lineProps.className ?? ''} whitespace-pre-wrap break-words flex-1`;
                return (
                  <div key={`line-${lineIndex}`} className="flex">
                    <span
                      className={`${LINE_NUMBER_GUTTER_WIDTH} ${LINE_NUMBER_TEXT_COLOR} ${fontSizeClass} select-none text-right pr-4`}
                    >
                      {lineIndex + 1}
                    </span>
                    <div {...lineProps} className={mergedLineClassName}>
                      {line.map((token, tokenIndex) => {
                        const tokenProps = getTokenProps({ token });
                        return <span key={`token-${lineIndex}-${tokenIndex}`} {...tokenProps} />;
                      })}
                    </div>
                  </div>
                );
              })}
            </pre>
          </div>
        )}
      </Highlight>
    </div>
  );
}
