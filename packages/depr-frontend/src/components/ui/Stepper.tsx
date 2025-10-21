import React from 'react';
import { Check } from 'lucide-react';

interface StepperStep {
    id: string;
    title: string;
    description?: string;
}

interface StepperProps {
    steps: StepperStep[];
    currentStep: number;
    onStepClick?: (stepIndex: number) => void;
    className?: string;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick, className = '' }) => {
    return (
        <div className={`flex items-center justify-between ${className}`}>
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isClickable = onStepClick && index <= currentStep;

                return (
                    <div key={step.id} className="flex items-center">
                        <div className="flex flex-col items-center">
                            <button
                                onClick={() => isClickable && onStepClick(index)}
                                disabled={!isClickable}
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200 ${isCompleted
                                    ? 'border-primary-500 bg-primary-500 text-white'
                                    : isCurrent
                                        ? 'border-primary-500 bg-white text-primary-500'
                                        : 'border-gray-300 bg-white text-gray-400'
                                    } ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                            >
                                {isCompleted ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    <span className="text-sm font-medium">{index + 1}</span>
                                )}
                            </button>
                            <div className="mt-2 text-center">
                                <div
                                    className={`text-sm font-medium ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                                        }`}
                                >
                                    {step.title}
                                </div>
                                {step.description && (
                                    <div className="text-xs text-gray-500 mt-1 max-w-24">
                                        {step.description}
                                    </div>
                                )}
                            </div>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={`h-0.5 w-16 mx-4 transition-colors duration-200 ${isCompleted ? 'bg-primary-500' : 'bg-gray-300'
                                    }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default Stepper;
