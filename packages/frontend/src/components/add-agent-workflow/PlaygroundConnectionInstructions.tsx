import React, { useState } from 'react';
import { client } from '../../services/apollo.client';
import { CREATE_RUNTIME_MUTATION } from '../../graphql/mutations';
import { useRequiredWorkspace } from '../../contexts/useRequiredWorkspace';

const PlaygroundConnectionInstructions: React.FC = () => {
    const { currentWorkspace } = useRequiredWorkspace();
    const [agentName, setAgentName] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleAddAgent = async () => {
        if (agentName.trim().length === 0) return;

        setIsSubmitting(true);
        try {
            await client.mutate({
                mutation: CREATE_RUNTIME_MUTATION,
                variables: {
                    name: agentName.trim(),
                    description: '',
                    capabilities: ['agent'],
                    workspaceId: currentWorkspace.id,
                },
            });
            setAgentName('');
        } catch (error) {
            console.error('Error creating agent:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-3">
            <p>Use the Manual Creation option if you cannot connect an agent right now.</p>
            <h3 className="text-lg font-semibold text-gray-800">How should we call your agent?</h3>
            <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g. My First Agent"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                type="button"
                disabled={agentName.trim().length === 0 || isSubmitting}
                onClick={handleAddAgent}
                className={`w-full rounded-md px-4 py-2 font-medium text-white transition-colors ${agentName.trim().length === 0 || isSubmitting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {isSubmitting ? 'Adding...' : 'Add agent'}
            </button>
        </div>
    );
};

export default PlaygroundConnectionInstructions;


