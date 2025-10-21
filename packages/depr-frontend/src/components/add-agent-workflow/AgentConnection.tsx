import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Check } from 'lucide-react';
import { useWorkspace } from '../../contexts/useWorkspace';
import { apolloResolversTypes } from '@2ly/common';
import { type AgentSelectionOption } from './types';
import ConnectionInstructionsPanel from './ConnectionInstructionsPanel';
import { CONNECTION_OPTIONS } from './connectionOptions';

interface AgentConnectionProps {
    onCanProceedChange: (canProceed: boolean) => void;
    onAgentSelected?: (agent: apolloResolversTypes.Runtime | null) => void;
}

const AgentConnection: React.FC<AgentConnectionProps> = ({ onCanProceedChange, onAgentSelected }) => {
    const { runtimes, infra } = useWorkspace();
    const [selectedOption, setSelectedOption] = useState<AgentSelectionOption | null>(null);
    const [isConnectingView, setIsConnectingView] = useState<boolean>(false);
    const [existingAgents, setExistingAgents] = useState<apolloResolversTypes.Runtime[] | null>(null);
    const [selectedAgent, setSelectedAgent] = useState<apolloResolversTypes.Runtime | null>(null);
    const hasInitializedSelectionRef = useRef<boolean>(false);

    useEffect(() => {
        if (selectedOption !== null) {
            setIsConnectingView(true);
        }
    }, [selectedOption]);

    useEffect(() => {
        if (existingAgents === null) {
            setExistingAgents(runtimes.filter(r => r.capabilities?.includes('agent')));
        }
    }, [runtimes, existingAgents]);

    const newAgents = useMemo(() => {
        const baseline = existingAgents ?? [];
        return runtimes.filter(r => r.capabilities?.includes('agent') && !baseline.some(e => e.id === r.id));
    }, [runtimes, existingAgents]);

    useEffect(() => {
        if (!hasInitializedSelectionRef.current && !selectedAgent && newAgents.length > 0) {
            setSelectedAgent(newAgents[0]);
            hasInitializedSelectionRef.current = true;
        }
    }, [newAgents, selectedAgent]);

    const discoverTitle = newAgents.length > 0 ? 'New agent detected' : 'No agent detected';
    const discoverDescription = newAgents.length > 0 ? 'We have discovered the following agents: ' : 'Looks like they\'re still undercover. Connect one, and it\'ll report in right here.';

    useEffect(() => {
        onCanProceedChange(isConnectingView ? selectedAgent !== null : false);
    }, [selectedAgent, onCanProceedChange, isConnectingView]);

    useEffect(() => {
        if (onAgentSelected) {
            onAgentSelected(selectedAgent);
        }
    }, [selectedAgent, onAgentSelected]);

    const handleBackToSelectView = (): void => {
        setSelectedOption(null);
        setIsConnectingView(false);
        setSelectedAgent(null);
    };

    const FALLBACK_ICON_URL = 'https://unpkg.com/lucide-static@latest/icons/puzzle.svg';

    const handleIconError = (event: React.SyntheticEvent<HTMLImageElement>): void => {
        event.currentTarget.src = FALLBACK_ICON_URL;
    };

    const activeType = selectedOption;

    return (
        <div className="w-full flex flex-col h-full min-h-0 agent-connection">
            <div className="text-center mb-6 shrink-0">
                <h2 className="text-2xl font-bold mb-2">Select your integration</h2>
                <p className="text-gray-600">Prefer to skip this step? Select <strong>Add Manually</strong> to continue onboarding without a framework</p>
            </div>

            <div className="relative flex-1 min-h-0 overflow-hidden">
                <div className={`${isConnectingView ? '-translate-y-6 opacity-0 pointer-events-none absolute inset-0' : 'translate-y-0 opacity-100 relative'} transition-all duration-500`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {CONNECTION_OPTIONS.slice(0, 3).map(option => {
                            const isSelected = activeType === option.id;
                            return (
                                <div
                                    key={option.id}
                                    className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg ${isSelected
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    onClick={() => setSelectedOption(option.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setSelectedOption(option.id);
                                        }
                                    }}
                                >
                                    <div className="text-center">
                                        <div className="mb-3 flex items-center justify-center">
                                            <img src={option.iconUrl} alt={`${option.title} logo`} className="w-10 h-10 rounded-lg" onError={handleIconError} />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">{option.title}</h3>
                                    </div>
                                    {isSelected && (
                                        <div className="absolute top-2 right-2">
                                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-sm">✓</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        {CONNECTION_OPTIONS.slice(3).map(option => {
                            const isSelected = activeType === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    className={`flex items-center gap-2 p-3 rounded-md border text-left ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    onClick={() => setSelectedOption(option.id)}
                                >
                                    <img src={option.iconUrl} alt={`${option.title} logo`} className="w-5 h-5 rounded" onError={handleIconError} />
                                    <span className="text-sm font-medium text-gray-800">{option.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className={`${isConnectingView ? 'translate-y-0 opacity-100 relative' : 'translate-y-6 opacity-0 pointer-events-none absolute inset-0'} transition-all duration-500 min-h-0 h-full flex flex-col`}>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-4 flex-1 min-h-0">
                        <div className="lg:col-span-3 flex flex-col min-h-0">
                            <ConnectionInstructionsPanel
                                natsServer={infra?.nats ?? ''}
                                selectedOption={selectedOption ?? 'langchain'}
                                onOptionChange={setSelectedOption}
                                showBackButton={true}
                                onBack={handleBackToSelectView}
                            />
                        </div>

                        <div className="lg:col-span-2 flex flex-col justify-center h-full min-h-[300px] space-y-4 agent-connectivity-area">
                            <div className="relative flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 overflow-hidden">
                                <div className="absolute rounded-full bg-blue-300 opacity-20 animate-ping" style={{ width: '16rem', height: '16rem', animationDuration: '3.5s' }}></div>
                                <div className="absolute rounded-full bg-indigo-300 opacity-20 animate-ping" style={{ width: '12rem', height: '12rem', animationDelay: '400ms', animationDuration: '3s' }}></div>
                                <div className="absolute rounded-full bg-purple-300 opacity-20 animate-ping" style={{ width: '8rem', height: '8rem', animationDelay: '800ms', animationDuration: '2.5s' }}></div>

                                <div className="relative text-center">
                                    <span className="text-4xl">🕵️</span>
                                    <p className="mt-4 text-lg font-semibold text-gray-800">{discoverTitle}</p>
                                    <p className="text-sm text-gray-500">{discoverDescription}</p>

                                    <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
                                        {newAgents.map(agent => {
                                            const isSelected = selectedAgent?.id === agent.id;
                                            return (
                                                <div
                                                    key={agent.id}
                                                    role="radio"
                                                    aria-checked={isSelected}
                                                    tabIndex={0}
                                                    onClick={() => setSelectedAgent(isSelected ? null : agent)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            setSelectedAgent(isSelected ? null : agent);
                                                        }
                                                    }}
                                                    className={`${isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'} flex items-center gap-3 p-3 bg-white/60 border rounded-lg shadow-sm hover:border-blue-300 cursor-pointer transition-colors`}
                                                >
                                                    <span className={`flex items-center justify-center rounded-full ${isSelected ? 'bg-blue-600 text-white' : 'border-2 border-gray-300 text-transparent'} w-6 h-6`}>
                                                        {isSelected ? <Check className="w-4 h-4" /> : '•'}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-800">{agent.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-tr from-yellow-200 to-pink-200 rounded-full blur-2xl opacity-60"></div>
                                <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-tr from-cyan-200 to-violet-200 rounded-full blur-2xl opacity-60"></div>

                                {existingAgents && existingAgents.length > 0 && (
                                    <div className="absolute bottom-3 left-0 right-0 flex justify-center px-3">
                                        <div className="backdrop-blur-sm bg-white/60 border border-gray-200 rounded-md shadow-sm px-2 py-1 flex items-center gap-2 text-sm text-gray-700">
                                            <span className="text-xs text-gray-500">Or pick an existing agent:</span>
                                            <select
                                                className="bg-transparent outline-none text-gray-800 text-sm"
                                                value={selectedAgent?.id ?? ''}
                                                onChange={(e) => setSelectedAgent(existingAgents.find(a => a.id === e.target.value) || null)}
                                            >
                                                <option value="">Select…</option>
                                                {existingAgents.map((agent) => (
                                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <p className="text-sm text-gray-500 mt-6 shrink-0">Once your agent is connected, you'll be able to start adding tools right aways.
                <br /><a href="https://docs.2ly.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 underline">Need help? Get more information from our documentation</a>
            </p>
        </div >
    );
};

export default AgentConnection;

