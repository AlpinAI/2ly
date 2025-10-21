import { useRef, useState } from 'react';
import { apolloResolversTypes } from '@2ly/common';
import WorkflowScaffold from './WorkflowScaffold';
import { AgentConnection, ManageTools } from './index';
import type { ManageToolsHandle } from './ManageTools';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '../ui/CloseIcon';

interface AddAgentWorkflowProps {
    onComplete: () => void;
    onCancel?: () => void;
}

function AddAgentWorkflow({ onComplete, onCancel }: AddAgentWorkflowProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isNextEnabled, setIsNextEnabled] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<apolloResolversTypes.Runtime | null>(null);
    const manageToolsRef = useRef<ManageToolsHandle>(null);
    const totalSteps = 2;
    const navigate = useNavigate();

    const stepSizing: Record<number, { widthClass: string }> = {
        1: { widthClass: 'w-full max-w-4xl' },
        2: { widthClass: 'w-[90%] max-w-6xl' }
    };

    const handleNext = async () => {
        if (currentStep === 2 && manageToolsRef.current) {
            const success = await manageToolsRef.current.applyTools();
            if (!success) return;
        }

        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
            setIsNextEnabled(false);
        } else {
            onComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setIsNextEnabled(false);
        }
    };
    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <AgentConnection
                        onCanProceedChange={setIsNextEnabled}
                        onAgentSelected={setSelectedAgent}
                    />
                );
            case 2:
                return (
                    <ManageTools
                        ref={manageToolsRef}
                        onCanProceedChange={setIsNextEnabled}
                        agent={selectedAgent}
                    />
                );
            default:
                return null;
        }
    };

    const nextButtonLabel = currentStep === 1 ? 'Manage Tools' : 'Finish';

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
            return;
        }
        navigate('/agents');
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center">
            <div className="absolute right-6 top-6">
                <CloseIcon onClick={handleCancel} ariaLabel="Close" />
            </div>
            <WorkflowScaffold
                currentStep={currentStep}
                totalSteps={totalSteps}
                isNextEnabled={isNextEnabled}
                onBack={handleBack}
                onNext={handleNext}
                nextButtonLabel={nextButtonLabel}
                widthClass={stepSizing[currentStep].widthClass}
            >
                {renderCurrentStep()}
            </WorkflowScaffold>
        </div>
    );
}

export default AddAgentWorkflow;


