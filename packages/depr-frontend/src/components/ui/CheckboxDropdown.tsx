import React, { useEffect, useRef, useState } from 'react';
import Button from './Button';
import { ChevronDown, Filter } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface CheckboxItem {
    id: string;
    label: string;
}

interface CheckboxDropdownProps {
    label: string;
    items: CheckboxItem[];
    selectedIds: string[];
    onChange: (nextSelectedIds: string[]) => void;
    className?: string;
    align?: 'left' | 'right';
}

const CheckboxDropdown: React.FC<CheckboxDropdownProps> = ({
    label,
    items,
    selectedIds,
    onChange,
    className,
    align = 'right',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleItem = (id: string) => {
        const isSelected = selectedIds.includes(id);
        const next = isSelected ? selectedIds.filter(x => x !== id) : [...selectedIds, id];
        onChange(next);
    };

    return (
        <div className={cn('relative', className)} ref={containerRef}>
            <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="h-4 w-4" />}
                onClick={() => setIsOpen(prev => !prev)}
            >
                <span className="flex items-center gap-1">{label} <ChevronDown className="h-4 w-4" /></span>
            </Button>
            {isOpen && (
                <div className={cn(
                    'absolute z-50 mt-1 w-64 rounded-md border border-gray-200 bg-white shadow-lg',
                    align === 'right' ? 'right-0' : 'left-0'
                )}>
                    <div className="max-h-64 overflow-auto p-2">
                        {items.length === 0 ? (
                            <div className="px-2 py-3 text-sm text-gray-500 text-center">
                                No items available
                            </div>
                        ) : (
                            items.map(item => {
                                const isChecked = selectedIds.includes(item.id);
                                return (
                                    <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleItem(item.id)}
                                            className="h-3 w-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        {item.label}
                                    </label>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckboxDropdown;


