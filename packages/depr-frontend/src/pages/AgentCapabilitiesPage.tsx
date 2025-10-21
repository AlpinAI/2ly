import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRequiredWorkspace } from '../contexts/useRequiredWorkspace';
import { useRuntimes } from '../hooks/useRuntimes';
import { apolloResolversTypes } from '@2ly/common';
import ManageTools, { ManageToolsHandle } from '../components/add-agent-workflow/ManageTools';
import CloseIcon from '../components/ui/CloseIcon';

function AgentCapabilitiesPage() {
    const navigate = useNavigate();
    const { runtimeId } = useParams();
    const { currentWorkspace } = useRequiredWorkspace();
    const runtimes = useRuntimes(currentWorkspace.id, ['agent']);
    const manageToolsRef = useRef<ManageToolsHandle | null>(null);
    const [isApplying, setIsApplying] = useState(false);

    const agent: apolloResolversTypes.Runtime | null = useMemo(() => {
        const found = runtimes.find((r) => r.id === runtimeId);
        return found ?? null;
    }, [runtimes, runtimeId]);

    const handleClose = () => {
        navigate('/agents');
    };

    const handleApply = async (): Promise<void> => {
        if (isApplying) return;
        const ref = manageToolsRef.current;
        if (!ref) return;
        setIsApplying(true);
        const success = await ref.applyTools();
        setIsApplying(false);
        if (success) navigate('/agents');
    };

    return (
        <div className="relative min-h-screen bg-gray-50">
            <div className="absolute right-4 top-4">
                <CloseIcon onClick={handleClose} ariaLabel="Cancel and go back" />
            </div>

            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl">
                    <ManageTools ref={manageToolsRef} agent={agent} onCanProceedChange={() => { }} />
                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={handleApply}
                            disabled={isApplying || !agent}
                            aria-label="Apply changes to agent tools"
                            className="inline-flex items-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isApplying ? 'Applying…' : 'Apply'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AgentCapabilitiesPage;


