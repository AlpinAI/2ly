import { X } from 'lucide-react';

type CloseIconSize = 'sm' | 'md' | 'lg';

const DEFAULT_SIZE: CloseIconSize = 'md';
const BUTTON_SIZE_CLASSES: Record<CloseIconSize, string> = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
};
const ICON_SIZE_CLASSES: Record<CloseIconSize, string> = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
};

interface CloseIconProps {
    onClick: () => void;
    ariaLabel?: string;
    size?: CloseIconSize;
    className?: string;
}

function CloseIcon({ onClick, ariaLabel = 'Close', size = DEFAULT_SIZE, className = '' }: CloseIconProps) {
    return (
        <button
            type="button"
            aria-label={ariaLabel}
            onClick={onClick}
            className={`inline-flex items-center justify-center text-gray-500 hover:text-gray-800 focus:outline-none transition-colors transform duration-150 hover:scale-110 active:scale-95 ${BUTTON_SIZE_CLASSES[size]} ${className}`}
        >
            <X className={`${ICON_SIZE_CLASSES[size]}`} />
        </button>
    );
}

export default CloseIcon;


