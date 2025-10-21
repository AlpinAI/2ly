import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { type ToolSelectionOption } from './types.ts';
import McpConfigure from './configure/McpConfigure.tsx';
import ApiConfigure from './configure/ApiConfigure.tsx';
import CodeConfigure from './configure/CodeConfigure.tsx';
import { useMCPToolsCount } from '../../hooks/useMCPToolsCount.ts';
import { useRequiredWorkspace } from '../../contexts/useRequiredWorkspace.ts';

interface AddToolsProps {
    onCanProceedChange: (canProceed: boolean) => void;
    onSuccessExit?: () => void;
}

const AddTools: React.FC<AddToolsProps> = ({ onCanProceedChange, onSuccessExit }) => {
    const { currentWorkspace } = useRequiredWorkspace();
    const [selectedOption, setSelectedOption] = useState<ToolSelectionOption | null>(null);
    const [isConfigureView, setIsConfigureView] = useState<boolean>(false);
    const [isOptionMenuOpen, setIsOptionMenuOpen] = useState<boolean>(false);
    const toolsCount = useMCPToolsCount(currentWorkspace.id);

    useEffect(() => {
        if (selectedOption !== null) {
            setIsConfigureView(true);
        }
    }, [selectedOption]);

    useEffect(() => {
        const isAllowedToProceed = toolsCount > 0;
        onCanProceedChange(isAllowedToProceed);
    }, [toolsCount, onCanProceedChange]);

    const toolOptions = useMemo(() => (
        [
            {
                id: 'mcp' as ToolSelectionOption,
                title: 'Add MCP Server',
                description:
                    'Plug a Model Context Protocol (MCP) server to give your agent superpowers.',
                icon: 'https://avatars.githubusercontent.com/u/182288589',
                features: [
                    'Browse the official MCP registry',
                    'Or configure a server manually',
                    'Fast setup, secure by design'
                ]
            },
            {
                id: 'api' as ToolSelectionOption,
                title: 'Connect to an API',
                description:
                    'Turn any REST API into a tool your agent can call with confidence.',
                icon: '🌐',
                features: [
                    'Quickly import a Swagger/OpenAPI file',
                    'Auto-generate endpoints and parameters',
                    'Auth helpers and validation'
                ],
                comingSoon: true,
            },
            {
                id: 'code' as ToolSelectionOption,
                title: 'Code your own Tool',
                description:
                    'Build delightful custom tools that run right beside your agent.',
                icon: '🛠️',
                features: ['Write tools in Python or TypeScript', 'Local dev, smooth DX', 'Starter templates included'],
                comingSoon: true,
            }
        ]
    ), []);

    const activeType = selectedOption;
    const activeOption = useMemo(() => toolOptions.find(o => o.id === activeType) || null, [toolOptions, activeType]);

    return (
        <div className="w-full space-y-6 flex flex-col add-tools">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Select the tool category</h2>
                <p className="text-gray-600">Choose an option below and start adding tools to your registry</p>
            </div>

            <div className="relative flex-1 min-h-0">
                <div className={`${isConfigureView ? '-translate-y-6 opacity-0 pointer-events-none absolute inset-0' : 'translate-y-0 opacity-100 relative'} transition-all duration-500`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {toolOptions.map((option) => (
                            <div
                                key={option.id}
                                className={`relative p-6 border-2 rounded-lg transition-all duration-200 select-none bg-white/80 backdrop-blur ${option.comingSoon ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:shadow-lg'} ${activeType === option.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : option.comingSoon ? 'border-gray-200' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                onClick={option.comingSoon ? undefined : () => setSelectedOption(option.id)}
                                role={option.comingSoon ? undefined : 'button'}
                                tabIndex={option.comingSoon ? -1 : 0}
                                onKeyDown={option.comingSoon ? undefined : (e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setSelectedOption(option.id);
                                    }
                                }}
                            >
                                {option.comingSoon && (
                                    <span className="absolute top-3 left-3 text-[10px] font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                                        Coming soon
                                    </span>
                                )}
                                <div className="text-center">
                                    <div className="text-4xl mb-3 flex justify-center">
                                        {option.icon.startsWith('http') ? (
                                            <img src={option.icon} alt={option.title} className="w-12 h-12 object-contain" />
                                        ) : (
                                            option.icon
                                        )}
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">{option.title}</h3>
                                    <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                                </div>

                                {activeType === option.id && (
                                    <div className="absolute top-2 right-2">
                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">✓</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`${isConfigureView ? 'translate-y-0 opacity-100 relative' : 'translate-y-6 opacity-0 pointer-events-none absolute inset-0'} transition-all duration-500 flex flex-col min-h-0`}>
                    <div className="relative w-full shrink-0 flex items-center gap-2 mb-2">
                        <button
                            type="button"
                            aria-label="Go back to selection"
                            className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"
                            onClick={() => { setIsConfigureView(false); setSelectedOption(null); setIsOptionMenuOpen(false); }}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="relative w-full">
                            <button
                                type="button"
                                className="w-full px-2 py-1 rounded-md bg-blue-50 border border-blue-200 flex items-center gap-2 text-sm text-gray-700"
                                onClick={() => setIsOptionMenuOpen(!isOptionMenuOpen)}
                            >
                                {activeOption?.icon.startsWith('http') ? (
                                    <img src={activeOption.icon} alt={activeOption.title} className="w-5 h-5 object-contain" />
                                ) : (
                                    <span className="text-base">{activeOption?.icon}</span>
                                )}
                                <span className="font-medium">{activeOption?.title ?? 'Select'}</span>
                                <ChevronDown className={`ml-auto w-4 h-4 transition-transform ${isOptionMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isOptionMenuOpen && (
                                <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-md">
                                    <ul className="max-h-60 overflow-auto py-1">
                                        {toolOptions.map(option => (
                                            <li key={option.id}>
                                                <button
                                                    type="button"
                                                    disabled={!!option.comingSoon}
                                                    className={`w-full text-left px-3 py-2 flex items-center gap-2 ${option.comingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-50'} ${option.id === activeType ? 'bg-blue-50' : ''}`}
                                                    onClick={() => {
                                                        if (option.comingSoon) return;
                                                        setSelectedOption(option.id);
                                                        setIsOptionMenuOpen(false);
                                                    }}
                                                >
                                                    {option.icon.startsWith('http') ? (
                                                        <img src={option.icon} alt={option.title} className="w-5 h-5 object-contain" />
                                                    ) : (
                                                        <span className="text-base">{option.icon}</span>
                                                    )}
                                                    <span className="text-sm font-medium text-gray-800">{option.title}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        {activeType === 'mcp' && <McpConfigure onSuccessExit={onSuccessExit} />}
                        {activeType === 'api' && <ApiConfigure />}
                        {activeType === 'code' && <CodeConfigure />}
                        {isConfigureView && toolsCount === 0 && (
                            <div className="mt-4 text-sm text-gray-600">
                                Connect an MCP server and wait for at least one tool to appear to continue.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddTools;


