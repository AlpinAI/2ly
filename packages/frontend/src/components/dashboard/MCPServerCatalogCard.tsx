import React from 'react';
import { motion } from 'framer-motion';
import { Server, ExternalLink, Package } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { apolloResolversTypes } from '@2ly/common';
import { cn } from '../../utils/helpers';
import { parseMcpServerConfig } from '../../utils/mcpServerConfig';

interface MCPServerCatalogCardProps {
  server: apolloResolversTypes.McpServer;
  className?: string;
  onConfigure?: (server: apolloResolversTypes.McpServer) => void;
}

const MCPServerCatalogCard: React.FC<MCPServerCatalogCardProps> = ({ server, className, onConfigure }) => {
  // Parse the server config to extract additional properties
  const serverWithConfig = parseMcpServerConfig(server);
  
  const getServerTypeColor = (type: string) => {
    return type === 'STREAM' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className={cn('h-full flex flex-col', className)}>
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="flex items-center gap-4 border-b border-gray-100 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Server className="h-5 w-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="truncate text-base font-semibold">{server.name}</h3>
              <p className="truncate text-sm text-gray-500">{server.transport}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Badge className={cn(getServerTypeColor(server.transport), 'text-xs')}>{server.transport}</Badge>
            </div>
          </div>

          <div className="p-4 flex-1">
            <p className="mb-3 text-sm text-gray-600">{server.description}</p>

            <div className="mb-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-gray-50 p-2">
                  <span className="block text-gray-500">Command</span>
                  <span className="font-medium truncate">{serverWithConfig.command}</span>
                </div>
              </div>

              {serverWithConfig.args && (
                <div className="rounded-md bg-gray-50 p-2 text-xs">
                  <span className="block text-gray-500">Arguments</span>
                  <span className="font-medium truncate">{serverWithConfig.args}</span>
                </div>
              )}

              {serverWithConfig.ENV && (
                <div className="rounded-md bg-gray-50 p-2 text-xs">
                  <span className="block text-gray-500">Environment</span>
                  <span className="font-medium truncate">{serverWithConfig.ENV}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {server.repositoryUrl && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate">{server.repositoryUrl}</span>
                </div>
              )}

              {serverWithConfig.serverUrl && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Server className="h-3 w-3" />
                  <span className="truncate">{serverWithConfig.serverUrl}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t border-gray-100 p-4">
          <div className="flex w-full justify-between gap-2">
            <Button variant="outline" size="sm" leftIcon={<Package className="h-4 w-4" />}>
              View Details
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Server className="h-4 w-4" />}
              onClick={() => onConfigure?.(server)}
            >
              Configure
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default MCPServerCatalogCard;
