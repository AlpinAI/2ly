import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Settings, ChevronDown, ChevronUp, Trash, Link, Edit, Wrench } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import Status from '../ui/Status';
import { Tool } from '../../types';
import { apolloResolversTypes } from '@2ly/common';
import { cn, formatRelativeTime } from '../../utils/helpers';
import AgentIntegrationDialog from './AgentIntegrationDialog';
import EditRuntimeDialog from './EditRuntimeDialog';
import { useNavigate } from 'react-router-dom';
import { client } from '../../services/apollo.client';
import { UPDATE_RUNTIME_MUTATION } from '../../graphql/mutations';

interface AgentCardProps {
  agent: apolloResolversTypes.Runtime;
  tools?: Tool[];
  className?: string;
  onDelete?: (runtime: apolloResolversTypes.Runtime) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, tools = [], className, onDelete }) => {
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAgentIntegration, setShowAgentIntegration] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const navigate = useNavigate();

  // Helper function to safely convert Date to ISO string
  const toISOString = (date: Date | string | undefined): string | undefined => {
    if (!date) return undefined;
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toISOString();
    return undefined;
  };

  const toggleToolsExpansion = () => {
    setIsToolsExpanded(!isToolsExpanded);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(agent);
    }
    setShowDeleteConfirm(false);
  };

  const handleSaveEdit = async (id: string, name: string, description: string) => {
    await client.mutate({
      mutation: UPDATE_RUNTIME_MUTATION,
      variables: { id, name, description },
    });
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} as="div">
        <Card className={cn('h-full flex flex-col', className)}>
          <CardContent className="p-0 flex-1">
            <div className="flex items-center gap-4 border-b border-gray-100 p-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Cpu className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="truncate text-base font-semibold">{agent.name}</h3>
                <p className="truncate text-sm text-gray-500">{agent.mcpClientName ?? ''}</p>
              </div>
              <Status status={agent.status.toLowerCase() as 'active' | 'inactive'} className="capitalize" size="sm" />
            </div>

            <div className="p-2">
              <p className="mb-3 text-sm text-gray-600">{agent.description}</p>

              {tools.length > 0 && (
                <div className="mb-3 border-t border-gray-100 pt-3">
                  <button
                    onClick={toggleToolsExpansion}
                    className="flex w-full items-center justify-between text-xs font-medium text-gray-700 hover:text-gray-900"
                  >
                    <span>Tools ({tools.length})</span>
                    {isToolsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {isToolsExpanded && (
                    <div className="mt-2 space-y-2">
                      {tools.map((tool) => (
                        <div key={tool.id} className="rounded-md bg-gray-50 p-2 text-xs">
                          <div className="font-medium text-gray-900">{tool.name}</div>
                          <div className="text-gray-600 mt-1">{tool.description}</div>
                          <Status status={tool.status ?? 'inactive'} size="sm" className="mt-1 capitalize" />
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Wrench className="h-4 w-4" />}
                    className="w-full mt-2 text-primary-600 hover:bg-primary-50 hover:text-primary-700"
                    onClick={() => navigate(`/playground?agentIds=${agent.id}`)}
                  >
                    Test the tools
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {agent.status === 'ACTIVE' && agent.lastSeenAt && (
                  <div className="rounded-md bg-green-50 p-2">
                    <div className="text-xs text-green-700">
                      <span className="block font-medium">
                        Connected since {formatRelativeTime(toISOString(agent.lastSeenAt) ?? '')}
                      </span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-gray-100 p-2 mt-auto">
            <div className="flex w-full justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Trash className="h-4 w-4" />}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Edit className="h-4 w-4" />}
                  onClick={() => setShowEditDialog(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Link className="h-4 w-4" />}
                  onClick={() => setShowAgentIntegration(true)}
                >
                  Integrate
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Settings className="h-4 w-4" />}
                  onClick={() => navigate(`/agents/${agent.id}/capabilities`)}
                >
                  Tool Set
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Delete Agent</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete "{agent.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Capabilities handled by dedicated page */}

      {/* Edit Runtime Dialog */}
      <EditRuntimeDialog
        runtime={agent}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSave={handleSaveEdit}
      />

      {/* Agent Integration Dialog */}
      <AgentIntegrationDialog
        agent={agent}
        isOpen={showAgentIntegration}
        onClose={() => setShowAgentIntegration(false)}
      />
    </>
  );
};

export default AgentCard;
