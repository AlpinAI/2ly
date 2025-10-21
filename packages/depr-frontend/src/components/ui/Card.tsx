import React from 'react';
import { cn } from '../../utils/helpers';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('card overflow-hidden p-2', className)} {...props} />;
});

Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('mb-4 flex flex-col space-y-1.5', className)} {...props} />;
});

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
}

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(({ className, ...props }, ref) => {
  return <h3 ref={ref} className={cn('text-lg font-semibold leading-none', className)} {...props} />;
});

CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(({ className, ...props }, ref) => {
  return <p ref={ref} className={cn('text-sm text-gray-500', className)} {...props} />;
});

CardDescription.displayName = 'CardDescription';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('', className)} {...props} />;
});

CardContent.displayName = 'CardContent';

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('mt-4 flex items-center', className)} {...props} />;
});

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
