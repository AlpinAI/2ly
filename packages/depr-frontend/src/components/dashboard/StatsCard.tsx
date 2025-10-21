import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { cn } from '../../utils/helpers';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  change,
  className,
}) => {
  const isPositiveChange = change !== undefined && change >= 0;
  
  return (
    <Card className={cn('h-full transition-all', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        <motion.div 
          className="rounded-full bg-gray-100 p-2 text-gray-600"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {icon}
        </motion.div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="mt-1 flex items-center">
            <span
              className={cn(
                "flex items-center text-xs font-medium",
                isPositiveChange ? "text-green-600" : "text-red-600"
              )}
            >
              {isPositiveChange ? (
                <ArrowUp className="mr-1 h-3 w-3" />
              ) : (
                <ArrowDown className="mr-1 h-3 w-3" />
              )}
              {Math.abs(change)}%
            </span>
            <span className="ml-1 text-xs text-gray-500">from last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;