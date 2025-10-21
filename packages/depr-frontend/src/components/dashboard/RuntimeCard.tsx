import React, { useState } from 'react';
import { Server, Trash, Edit } from 'lucide-react';
import Button from '../ui/Button';
import Status from '../ui/Status';
import { Card, CardContent, CardFooter } from '../ui/Card';
import Badge from '../ui/Badge';
import { apolloResolversTypes } from '@2ly/common';
import { formatRelativeTime } from '../../utils/helpers';
import EditRuntimeDialog from './EditRuntimeDialog';
import { client } from '../../services/apollo.client';
import { UPDATE_RUNTIME_MUTATION } from '../../graphql/mutations';

interface RuntimeCardProps {
    runtime: apolloResolversTypes.Runtime;
    className?: string;
}

const RuntimeCard: React.FC<RuntimeCardProps> = ({ runtime, className = '' }) => {
    const isActive = runtime.status === 'ACTIVE';
    const mcpServerCount = runtime.mcpServers?.length || 0;
    const [showEditDialog, setShowEditDialog] = useState(false);

    const handleSaveEdit = async (id: string, name: string, description: string) => {
        await client.mutate({
            mutation: UPDATE_RUNTIME_MUTATION,
            variables: { id, name, description },
        });
    };

    return (
        <>
            <Card className={`h-full flex flex-col ${className}`}>
                <CardContent className="p-0 flex-1">
                    <div className="flex items-center gap-4 border-b border-gray-100 p-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                            <Server className="h-5 w-5" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h3 className="truncate text-base font-semibold">{runtime.name}</h3>
                            <p className="truncate text-sm text-gray-500">Runtime</p>
                        </div>
                        <Status status={runtime.status} className="capitalize" size="sm" />
                    </div>

                    <div className="p-2">
                        <p className="mb-3 text-sm text-gray-600">{runtime.description}</p>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">MCP Servers:</span>
                                <Badge variant="outline" className="text-xs">
                                    {mcpServerCount} Server{mcpServerCount !== 1 ? 's' : ''}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Created:</span>
                                <span className="text-sm text-gray-500">{new Date(runtime.createdAt).toLocaleDateString()}</span>
                            </div>

                            {runtime.lastSeenAt && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Last seen:</span>
                                    <span className="text-sm text-gray-500">{formatRelativeTime(runtime.lastSeenAt.toString())}</span>
                                </div>
                            )}

                            {runtime.hostname && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Host:</span>
                                    <span className={`text-sm ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>{runtime.hostname}</span>
                                </div>
                            )}

                            {runtime.hostIP && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">IP:</span>
                                    <span className={`text-sm ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>{runtime.hostIP}</span>
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
                            disabled={isActive}
                        >
                            Delete
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Edit className="h-4 w-4" />}
                            onClick={() => setShowEditDialog(true)}
                        >
                            Edit
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {/* Edit Runtime Dialog */}
            <EditRuntimeDialog
                runtime={runtime}
                isOpen={showEditDialog}
                onClose={() => setShowEditDialog(false)}
                onSave={handleSaveEdit}
            />
        </>
    );
};

export default RuntimeCard;
