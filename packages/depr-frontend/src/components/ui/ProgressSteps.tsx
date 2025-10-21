import React from 'react';
import { cn } from '../../utils/helpers';

export type StepStatus = 'completed' | 'in-progress' | 'pending' | 'error';

export interface ProgressStep {
    id: string;
    label: string;
    status: StepStatus;
}

interface ProgressStepsProps {
    steps: ProgressStep[];
    className?: string;
    stepClassName?: string;
    labelClassName?: string;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({
    steps,
    className,
    stepClassName,
    labelClassName,
}) => {
    const renderStepIcon = (status: ProgressStep['status']) => {
        switch (status) {
            case 'completed':
                return (
                    <svg
                        className="h-5 w-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                );
            case 'error':
                return (
                    <svg
                        className="h-5 w-5 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <circle cx="12" cy="12" r="10" />
                    </svg>
                );
            case 'in-progress':
                return (
                    <svg
                        className="h-5 w-5 text-blue-500 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                );
            case 'pending':
                return (
                    <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getStepTextColor = (status: ProgressStep['status']) => {
        switch (status) {
            case 'completed':
                return 'text-green-700';
            case 'error':
                return 'text-red-700';
            case 'in-progress':
                return 'text-blue-700';
            case 'pending':
                return 'text-gray-500';
            default:
                return 'text-gray-500';
        }
    };

    return (
        <div className={cn('space-y-2', className)}>
            {steps.map((step) => (
                <div
                    key={step.id}
                    className={cn(
                        'flex items-center space-x-3',
                        stepClassName
                    )}
                >
                    <div className="flex-shrink-0">
                        {renderStepIcon(step.status)}
                    </div>
                    <span
                        className={cn(
                            'text-sm font-medium',
                            getStepTextColor(step.status),
                            labelClassName
                        )}
                    >
                        {step.label}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default ProgressSteps;
