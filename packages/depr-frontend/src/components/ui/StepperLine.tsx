import React from 'react';

interface StepperLineProps {
    currentStep: number;
    totalSteps: number;
    className?: string;
}

const StepperLine: React.FC<StepperLineProps> = ({
    currentStep,
    totalSteps,
    className = ''
}) => {
    return (
        <div className={`flex items-center justify-center space-x-2 ${className}`}>
            {Array.from({ length: totalSteps }, (_, index) => {
                const isActive = index < currentStep;
                const isCurrent = index === currentStep - 1;

                return (
                    <div
                        key={index}
                        className={`h-1 rounded-full transition-all duration-300 ${isActive
                                ? 'bg-blue-600 w-8'
                                : isCurrent
                                    ? 'bg-blue-400 w-6'
                                    : 'bg-gray-300 w-4'
                            }`}
                    />
                );
            })}
        </div>
    );
};

export default StepperLine;

