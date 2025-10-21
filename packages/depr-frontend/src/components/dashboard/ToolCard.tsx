import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Cog, 
  Copy, 
  Trash, 
  ChevronDown,
  Cloud,
  Database,
  Code,
  Cpu
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Tool } from '../../types';
import { cn, formatDate, getToolTypeColor } from '../../utils/helpers';

interface ToolCardProps {
  tool: Tool;
  className?: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, className }) => {
  const [expanded, setExpanded] = React.useState(false);
  
  const renderTypeIcon = () => {
    switch (tool.type) {
      case 'api':
        return <Cloud className="h-5 w-5" />;
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'custom':
        return <Code className="h-5 w-5" />;
      case 'mcp':
        return <Cpu className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('h-full', className)}>
        <CardContent className="p-0">
          <div className="flex items-center gap-4 border-b border-gray-100 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              {renderTypeIcon()}
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="truncate text-base font-semibold">{tool.name}</h3>
              <p className="truncate text-sm text-gray-500">Used in {tool.agentIds.length} agents</p>
            </div>
            <Badge
              className={cn(
                getToolTypeColor(tool.type),
                'capitalize'
              )}
            >
              {tool.type}
            </Badge>
          </div>
          
          <div className="p-4">
            <p className="mb-3 text-sm text-gray-600">{tool.description}</p>
            
            <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-gray-50 p-2">
                <span className="block text-gray-500">Created</span>
                <span className="font-medium">{formatDate(tool.createdAt)}</span>
              </div>
              <div className="rounded-md bg-gray-50 p-2">
                <span className="block text-gray-500">Usage</span>
                <span className="font-medium">{tool.usage} calls</span>
              </div>
            </div>
            
            {expanded && (
              <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3">
                <h4 className="mb-2 text-xs font-medium text-gray-700">Configuration:</h4>
                <pre className="overflow-x-auto rounded bg-white p-2 text-xs">
                  {JSON.stringify(tool.configuration, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="border-t border-gray-100 p-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Copy className="h-4 w-4" />}
              >
                Clone
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Trash className="h-4 w-4" />}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Delete
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Less" : "More"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Cog className="h-4 w-4" />}
              >
                Configure
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ToolCard;