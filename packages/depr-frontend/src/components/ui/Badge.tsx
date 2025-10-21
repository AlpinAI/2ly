import React from 'react';
import { cn } from '../../utils/helpers';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  variant = 'default', 
  className, 
  ...props 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    primary: 'bg-primary-100 text-primary-800 hover:bg-primary-200',
    secondary: 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200',
    success: 'bg-green-100 text-green-800 hover:bg-green-200',
    warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    danger: 'bg-red-100 text-red-800 hover:bg-red-200',
    outline: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-100'
  };

  return (
    <div
      className={cn(
        'badge',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

export default Badge;