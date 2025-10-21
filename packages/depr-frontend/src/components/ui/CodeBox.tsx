import React, { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import Button from './Button';
import { Highlight, themes, type Language, type Token, type LineInputProps, type LineOutputProps, type TokenInputProps, type TokenOutputProps } from 'prism-react-renderer';

interface CodeBoxProps {
    code: string;
    language?: 'bash' | 'javascript' | 'typescript' | 'python' | 'json';
    className?: string;
    size?: 'small' | 'medium' | 'large';
}

const CodeBox: React.FC<CodeBoxProps> = ({ code, language = 'bash', className = '', size = 'medium' }) => {
    const [copied, setCopied] = useState(false);

    const LINE_NUMBER_GUTTER_WIDTH = 'w-12';
    const LINE_NUMBER_TEXT_COLOR = 'text-gray-500';

    const fontSizeClass = useMemo<string>(() => {
        if (size === 'small') return 'text-xs';
        if (size === 'large') return 'text-base';
        return 'text-sm';
    }, [size]);

    const prismLanguage = useMemo<Language>(() => {
        if (language === 'typescript') return 'tsx';
        if (language === 'javascript') return 'jsx';
        if (language === 'bash') return 'bash';
        if (language === 'json') return 'json';
        return 'python';
    }, [language]);

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
            {/* Code Content */}
            <div className="p-0">
                <Highlight code={code} language={prismLanguage} theme={themes.vsDark}>
                    {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }: {
                        className: string;
                        style: React.CSSProperties;
                        tokens: Token[][];
                        getLineProps: (input: LineInputProps) => LineOutputProps;
                        getTokenProps: (input: TokenInputProps) => TokenOutputProps;
                    }) => (
                        <div className="relative group rounded-lg" style={{ backgroundColor: style.backgroundColor }}>
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
                            <pre className={`${highlightClassName} m-0 ${fontSizeClass} whitespace-pre-wrap break-words overflow-x-hidden py-4 pr-4 pl-0`} style={style}>
                                {tokens.map((line: Token[], index: number) => {
                                    const lineProps = getLineProps({ line });
                                    const mergedLineClassName = `${lineProps.className ?? ''} whitespace-pre-wrap break-words flex-1`;
                                    return (
                                        <div key={`line-${index}`} className="flex">
                                            <span className={`${LINE_NUMBER_GUTTER_WIDTH} ${LINE_NUMBER_TEXT_COLOR} ${fontSizeClass} select-none text-right pr-4`}>{index + 1}</span>
                                            <div {...lineProps} className={mergedLineClassName}>
                                                {line.map((token: Token, tokenIndex: number) => {
                                                    const tokenProps = getTokenProps({ token });
                                                    return <span key={`token-${index}-${tokenIndex}`} {...tokenProps} />;
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
        </div>
    );
};

export default CodeBox;
