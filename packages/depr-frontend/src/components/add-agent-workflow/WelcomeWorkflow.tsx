import { useState, useRef } from 'react';
import { apolloResolversTypes } from '@2ly/common';
import WorkflowScaffold from './WorkflowScaffold';
import { AgentConnection, AddTools } from './index';
import ManageTools, { ManageToolsHandle } from './ManageTools';

interface WelcomeWorkflowProps {
    onComplete: () => void;
}

function WelcomeWorkflow({ onComplete }: WelcomeWorkflowProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isNextEnabled, setIsNextEnabled] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<apolloResolversTypes.Runtime | null>(null);
    const manageToolsRef = useRef<ManageToolsHandle>(null);
    const totalSteps = 3;

    const stepSizing: Record<number, { widthClass: string }> = {
        1: { widthClass: 'w-full max-w-4xl' },
        2: { widthClass: 'w-full max-w-4xl' },
        3: { widthClass: 'w-[90%] max-w-6xl' }
    };

    const handleNext = async () => {
        if (currentStep === 3 && manageToolsRef.current) {
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
                return <AddTools onCanProceedChange={setIsNextEnabled} />;
            case 3:
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

    let nextButtonLabel = 'Add Tools';
    if (currentStep === 2) {
        nextButtonLabel = 'Manage Tools';
    } else if (currentStep === 3) {
        nextButtonLabel = 'Finish';
    }

    return (
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
    );
}

export default WelcomeWorkflow;


