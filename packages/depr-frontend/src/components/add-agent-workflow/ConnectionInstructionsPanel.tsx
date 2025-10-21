import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import PlaygroundConnectionInstructions from './PlaygroundConnectionInstructions';
import LanggraphConnectionInstructions from './instructions/LanggraphConnectionInstructions';
import N8NConnectionInstructions from './instructions/N8NConnectionInstructions';
import LangflowConnectionInstructions from './instructions/LangflowConnectionInstructions';
import JSONConnectionInstructions from './instructions/JSONConnectionInstructions';
import { type AgentSelectionOption } from './types';
import { CONNECTION_OPTIONS } from './connectionOptions';

const FALLBACK_ICON_URL = 'https://unpkg.com/lucide-static@latest/icons/puzzle.svg';

interface ConnectionInstructionsPanelProps {
    natsServer?: string;
    agentName?: string;
    selectedOption?: AgentSelectionOption;
    onOptionChange?: (option: AgentSelectionOption) => void;
    showBackButton?: boolean;
    onBack?: () => void;
    hideManualOption?: boolean;
}

const ConnectionInstructionsPanel: React.FC<ConnectionInstructionsPanelProps> = ({
    natsServer = '',
    agentName,
    selectedOption = 'langchain',
    onOptionChange,
    showBackButton = false,
    onBack,
    hideManualOption = false,
}) => {
    const [isOptionMenuOpen, setIsOptionMenuOpen] = useState<boolean>(false);

    const handleIconError = (event: React.SyntheticEvent<HTMLImageElement>): void => {
        event.currentTarget.src = FALLBACK_ICON_URL;
    };

    const filteredOptions = hideManualOption
        ? CONNECTION_OPTIONS.filter(opt => opt.id !== 'manual')
        : CONNECTION_OPTIONS;

    const activeOption = filteredOptions.find(o => o.id === selectedOption);

    return (
        <div className="flex flex-col bg-white border border-gray-200 rounded-xl p-4 h-full min-h-0">
            <div className="relative w-full shrink-0 flex items-center gap-2 mb-4">
                {showBackButton && onBack && (
                    <button
                        type="button"
                        aria-label="Go back"
                        className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"
                        onClick={onBack}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}
                <div className="relative w-full">
                    <button
                        type="button"
                        className="w-full px-2 py-1 rounded-md bg-blue-50 border border-blue-200 flex items-center gap-2 text-sm text-gray-700"
                        onClick={() => setIsOptionMenuOpen(!isOptionMenuOpen)}
                    >
                        {activeOption && (
                            <img src={activeOption.iconUrl} alt={`${activeOption.title} logo`} className="w-5 h-5 rounded" onError={handleIconError} />
                        )}
                        <span className="font-medium">{activeOption?.title}</span>
                        <ChevronDown className={`ml-auto w-4 h-4 transition-transform ${isOptionMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOptionMenuOpen && (
                        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-md">
                            <ul className="max-h-60 overflow-auto py-1">
                                {filteredOptions.map(option => (
                                    <li key={option.id}>
                                        <button
                                            type="button"
                                            className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-blue-50 ${option.id === selectedOption ? 'bg-blue-50' : ''}`}
                                            onClick={() => {
                                                if (onOptionChange) {
                                                    onOptionChange(option.id);
                                                }
                                                setIsOptionMenuOpen(false);
                                            }}
                                        >
                                            <img src={option.iconUrl} alt={`${option.title} logo`} className="w-5 h-5 rounded" onError={handleIconError} />
                                            <span className="text-sm font-medium text-gray-800">{option.title}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-1 min-h-0 max-h-[80vh] overflow-y-auto overflow-x-hidden px-2 agent-connection-instructions">
                {selectedOption === 'langchain' && <LanggraphConnectionInstructions natsServer={natsServer} agentName={agentName} />}
                {selectedOption === 'langflow' && <LangflowConnectionInstructions natsServer={natsServer} agentName={agentName} />}
                {selectedOption === 'n8n' && <N8NConnectionInstructions agentName={agentName} />}
                {selectedOption === 'json' && <JSONConnectionInstructions natsServer={natsServer} agentName={agentName} />}
                {/* {selectedOption === 'zapier' && (
                    <div className="text-sm text-gray-700">
                        Zapier integration coming soon.
                    </div>
                )} */}
                {/* {selectedOption === 'crewai' && <CrewAIConnectionInstructions agentName={agentName} />} */}
                {/* {selectedOption === 'claude' && <ClaudeConnectionInstructions agentName={agentName} />} */}
                {/* {selectedOption === 'inspector' && <InspectorConnectionInstructions agentName={agentName} />} */}
                {selectedOption === 'manual' && <PlaygroundConnectionInstructions />}
            </div>
        </div>
    );
};

export default ConnectionInstructionsPanel;