/**
 * CodeViewerDialog Component
 *
 * WHY: Provides a modal viewer for large code/JSON content with advanced features.
 * Used for viewing tool call inputs/outputs and test results in detail.
 *
 * FEATURES:
 * - JSON tree view with collapsible nested objects/arrays
 * - Syntax highlighting for JSON and text content
 * - Line numbers for navigation
 * - Search functionality to find text within content
 * - Maximum height with scrolling (not unlimited expansion)
 * - Dark mode support
 * - ESC key and close button support
 *
 * USAGE:
 * ```tsx
 * <CodeViewerDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Tool Input"
 *   content={jsonString}
 *   language="json"
 * />
 * ```
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { X, Search, Code2, Braces } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { JsonView, defaultStyles } from 'react-json-view-lite';
import { Highlight, themes } from 'prism-react-renderer';
import type { Language } from 'prism-react-renderer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import 'react-json-view-lite/dist/index.css';

export interface CodeViewerDialogProps {
  /** Controls whether dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Content to display (string) */
  content: string;
  /** Content language for syntax highlighting */
  language?: 'json' | 'text';
}

type ViewMode = 'tree' | 'code';

export function CodeViewerDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  content,
  language = 'json',
}: CodeViewerDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const prevOpenRef = useRef(open);

  // Reset state when dialog opens (transitions from closed to open)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setSearchQuery('');
      setViewMode('tree');
    }
    prevOpenRef.current = open;
  }, [open]);

  // Track dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Parse JSON if content is JSON
  const parsedJson = useMemo(() => {
    if (language === 'json') {
      try {
        return JSON.parse(content);
      } catch {
        return null;
      }
    }
    return null;
  }, [content, language]);

  // Determine if we should show tree/code toggle
  const canShowTree = parsedJson !== null;

  // Filter content based on search query
  const highlightedContent = useMemo(() => {
    if (!searchQuery.trim()) return content;

    // For JSON, pretty-format it first
    let displayContent = content;
    if (language === 'json' && parsedJson) {
      displayContent = JSON.stringify(parsedJson, null, 2);
    }

    return displayContent;
  }, [content, language, parsedJson, searchQuery]);

  // Count search matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const regex = new RegExp(searchQuery, 'gi');
    const matches = highlightedContent.match(regex);
    return matches ? matches.length : 0;
  }, [highlightedContent, searchQuery]);

  // Handle dialog close - reset state
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setSearchQuery('');
        setViewMode('tree');
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  // Custom JSON view styles for dark mode
  const jsonViewStyles = useMemo(() => {
    return {
      ...defaultStyles,
      container: `${defaultStyles.container} font-mono text-sm`,
      basicChildStyle: isDark
        ? 'text-gray-100'
        : defaultStyles.basicChildStyle,
      label: isDark
        ? 'text-cyan-400'
        : 'text-cyan-600',
      nullValue: isDark
        ? 'text-gray-500'
        : 'text-gray-400',
      undefinedValue: isDark
        ? 'text-gray-500'
        : 'text-gray-400',
      numberValue: isDark
        ? 'text-purple-400'
        : 'text-purple-600',
      stringValue: isDark
        ? 'text-green-400'
        : 'text-green-600',
      booleanValue: isDark
        ? 'text-yellow-400'
        : 'text-yellow-600',
      otherValue: isDark
        ? 'text-gray-300'
        : 'text-gray-600',
      punctuation: isDark
        ? 'text-gray-400'
        : 'text-gray-500',
    };
  }, [isDark]);

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[90vh] w-[90vw] max-w-4xl translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div className="flex-1 mr-4">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </Dialog.Title>
              {subtitle && (
                <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {subtitle}
                </Dialog.Description>
              )}
            </div>

            {/* View Mode Toggle (only for JSON) */}
            {canShowTree && (
              <div className="flex items-center gap-1 mr-4 bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('tree')}
                  className={`h-8 px-3 gap-2 ${
                    viewMode === 'tree'
                      ? 'bg-white dark:bg-gray-800 shadow-sm'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <Braces className="h-4 w-4" />
                  Pretty
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('code')}
                  className={`h-8 px-3 gap-2 ${
                    viewMode === 'code'
                      ? 'bg-white dark:bg-gray-800 shadow-sm'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <Code2 className="h-4 w-4" />
                  Raw
                </Button>
              </div>
            )}

            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="rounded-full shrink-0">
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search in content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {searchMatches} {searchMatches === 1 ? 'match' : 'matches'}
                </span>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900/50">
            {viewMode === 'tree' && parsedJson ? (
              // JSON Tree View
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 [&_[role='tree']]:!bg-transparent">
                <JsonView
                  data={parsedJson}
                  shouldExpandNode={(level) => level < 3}
                  style={jsonViewStyles}
                />
              </div>
            ) : (
              // Code View with Syntax Highlighting
              <CodeHighlightView
                content={highlightedContent}
                language={language}
                searchQuery={searchQuery}
              />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Separate component for code highlighting to keep the main component clean
interface CodeHighlightViewProps {
  content: string;
  language: 'json' | 'text';
  searchQuery: string;
}

function CodeHighlightView({ content, language, searchQuery }: CodeHighlightViewProps) {
  // Map language to Prism language
  const prismLanguage = useMemo<Language>(() => {
    return language === 'json' ? 'json' : 'markup';
  }, [language]);

  // Highlight search matches in token
  const highlightToken = useCallback(
    (tokenText: string) => {
      if (!searchQuery.trim()) return tokenText;

      const parts: { text: string; highlight: boolean }[] = [];
      const regex = new RegExp(`(${searchQuery})`, 'gi');
      const matches = tokenText.split(regex);

      matches.forEach((part) => {
        if (part.toLowerCase() === searchQuery.toLowerCase()) {
          parts.push({ text: part, highlight: true });
        } else if (part) {
          parts.push({ text: part, highlight: false });
        }
      });

      return parts;
    },
    [searchQuery]
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <Highlight code={content} language={prismLanguage} theme={themes.vsDark}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} m-0 text-sm p-4 overflow-x-auto`}
            style={{ ...style, backgroundColor: 'transparent' }}
          >
            {tokens.map((line, lineIndex) => {
              const { className: lineClassName, ...lineProps } = getLineProps({ line });
              return (
                <div key={`line-${lineIndex}`} className={`flex ${lineClassName}`} {...lineProps}>
                  {/* Line Number */}
                  <span className="w-12 text-gray-500 text-right pr-4 select-none shrink-0">
                    {lineIndex + 1}
                  </span>

                  {/* Line Content */}
                  <div className="flex-1 whitespace-pre-wrap break-words">
                    {line.map((token, tokenIndex) => {
                      const tokenProps = getTokenProps({ token });
                      const tokenText = token.content;

                      // Apply search highlighting
                      if (searchQuery.trim()) {
                        const parts = highlightToken(tokenText);
                        if (Array.isArray(parts)) {
                          return (
                            <span key={`token-${lineIndex}-${tokenIndex}`} {...tokenProps}>
                              {parts.map((part, partIndex) =>
                                part.highlight ? (
                                  <mark
                                    key={`mark-${partIndex}`}
                                    className="bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-white"
                                  >
                                    {part.text}
                                  </mark>
                                ) : (
                                  <span key={`text-${partIndex}`}>{part.text}</span>
                                )
                              )}
                            </span>
                          );
                        }
                      }

                      return <span key={`token-${lineIndex}-${tokenIndex}`} {...tokenProps} />;
                    })}
                  </div>
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
