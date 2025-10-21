import React, { createContext, useContext } from 'react';
import { cn } from '../../utils/helpers';

interface TabsContextValue {
    value: string;
    onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
    value: string;
    onValueChange: (value: string) => void;
    className?: string;
    children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, className, children }) => {
    return (
        <TabsContext.Provider value={{ value, onValueChange }}>
            <div className={cn('w-full', className)}>{children}</div>
        </TabsContext.Provider>
    );
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> { }

export const TabsList: React.FC<TabsListProps> = ({ className, children, ...props }) => {
    return (
        <div className={cn('border-b border-gray-200 flex items-center gap-2', className)} {...props}>
            {children}
        </div>
    );
};

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, className, children, ...props }) => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('TabsTrigger must be used within Tabs');
    }

    const isActive = context.value === value;

    return (
        <button
            type="button"
            aria-selected={isActive}
            className={cn(
                'relative -mb-px px-3 py-2 text-sm font-medium border-b-2 transition-colors',
                isActive ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-600 hover:text-gray-800',
                className
            )}
            data-tabs-trigger-value={value}
            onClick={(event) => {
                context.onValueChange(value);
                if (props.onClick) {
                    props.onClick(event);
                }
            }}
            {...props}
        >
            {children}
        </button>
    );
};

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({ value, className, children, ...props }) => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('TabsContent must be used within Tabs');
    }

    if (context.value !== value) return null;

    return (
        <div className={cn('pt-4', className)} {...props}>
            {children}
        </div>
    );
};


