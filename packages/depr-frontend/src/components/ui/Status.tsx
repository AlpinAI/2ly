import React from 'react';
import { cn } from '../../utils/helpers';

interface StatusProps extends React.HTMLAttributes<HTMLSpanElement> {
    status: 'active' | 'inactive' | 'ACTIVE' | 'INACTIVE' | string;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
    className?: string;
}

const Status: React.FC<StatusProps> = ({
    status,
    size = 'md',
    showIcon = false,
    className,
    ...props
}) => {
    const normalizedStatus = status.toLowerCase();
    const isActive = normalizedStatus === 'active';

    const sizeClasses = {
        sm: 'px-2 py-1 text-[10px]',
        md: 'px-2 py-1 text-xs',
        lg: 'px-3 py-2 text-sm'
    };

    const statusClasses = isActive
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800';

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full font-medium',
                sizeClasses[size],
                statusClasses,
                className
            )}
            {...props}
        >
            {showIcon && (
                <div className={cn(
                    'mr-1 h-2 w-2 rounded-full',
                    isActive ? 'bg-green-600' : 'bg-red-600'
                )} />
            )}
            {status}
        </span>
    );
};

export default Status;
