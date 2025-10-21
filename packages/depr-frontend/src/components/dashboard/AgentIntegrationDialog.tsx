import React, { useState } from 'react';
import { X } from 'lucide-react';
import { apolloResolversTypes } from '@2ly/common';
import Button from '../ui/Button';
import ConnectionInstructionsPanel from '../add-agent-workflow/ConnectionInstructionsPanel';
import { type AgentSelectionOption } from '../add-agent-workflow/types';
import { useWorkspace } from '../../contexts/useWorkspace';

interface AgentIntegrationDialogProps {
    agent: apolloResolversTypes.Runtime;
    isOpen: boolean;
    onClose: () => void;
}

const AgentIntegrationDialog: React.FC<AgentIntegrationDialogProps> = ({ agent, isOpen, onClose }) => {
    const { infra } = useWorkspace();
    const [selectedOption, setSelectedOption] = useState<AgentSelectionOption>('langchain');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-3xl h-[80vh] rounded-lg bg-white shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-6 shrink-0">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Integrate {agent.name}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Choose how you want to connect this agent to your workflow
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content Area - Fixed height container */}
                <div className="p-6 flex-1 min-h-0 overflow-hidden flex flex-col">
                    <ConnectionInstructionsPanel
                        natsServer={infra?.nats ?? ''}
                        agentName={agent.name}
                        selectedOption={selectedOption}
                        onOptionChange={setSelectedOption}
                        hideManualOption={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default AgentIntegrationDialog;