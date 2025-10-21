import React, { useCallback, useState } from 'react';
import StepperLine from '../ui/StepperLine';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface WorkflowScaffoldProps {
    currentStep: number;
    totalSteps: number;
    isNextEnabled: boolean;
    onBack: () => void;
    onNext: () => void;
    nextButtonLabel: string;
    children: React.ReactNode;
    onCancel?: () => void;
    widthClass?: string;
}

const WorkflowScaffold: React.FC<WorkflowScaffoldProps> = ({
    currentStep,
    totalSteps,
    isNextEnabled,
    onBack,
    onNext,
    nextButtonLabel,
    children,
    onCancel,
    widthClass = 'w-full max-w-4xl',
}) => {
    // const containerClass = currentStep >= 3 ? 'w-[90%] h-[90%] max-w-none' : 'w-full max-w-4xl h-[70vh]';
    const [isNextLoading, setIsNextLoading] = useState(false);

    const handleNextClick = useCallback(async () => {
        if (isNextLoading) return;

        setIsNextLoading(true);
        try {
            await onNext();
        } finally {
            setIsNextLoading(false);
        }
    }, [onNext, isNextLoading]);

    return (
        <div className="flex items-center justify-center h-full welcome-workflow-scaffold">
            <div className={`bg-white shadow-lg rounded-lg p-8 flex flex-col ${widthClass} max-h-[85vh]`}>

                <div className="flex-1 min-h-0 overflow-hidden">
                    {children}
                </div>


                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-3 items-center">
                        <div className="justify-self-start flex items-center gap-3">
                            {typeof onCancel === 'function' && (
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                                    aria-label="Cancel"
                                >
                                    Cancel
                                </button>
                            )}
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                                    aria-label="Go back"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Back to Agent
                                </button>
                            )}
                        </div>
                        <div className="justify-self-center">
                            <StepperLine currentStep={currentStep} totalSteps={totalSteps} className="mb-0" />
                        </div>
                        <div className="justify-self-end">
                            <button
                                type="button"
                                onClick={handleNextClick}
                                className={`inline-flex items-center gap-1 text-sm px-3 py-2 rounded-md shadow-sm ${isNextEnabled && !isNextLoading ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-gray-400 bg-gray-200 cursor-not-allowed'}`}
                                aria-label="Next step"
                                disabled={!isNextEnabled || isNextLoading}
                            >
                                {isNextLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {nextButtonLabel}
                                {!isNextLoading && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkflowScaffold;


