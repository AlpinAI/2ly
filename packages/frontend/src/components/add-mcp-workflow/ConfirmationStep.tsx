import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProgressSteps, { StepStatus } from '../ui/ProgressSteps';
import { apolloResolversTypes, MCP_SERVER_RUN_ON } from '@2ly/common';
import { client, observe } from '../../services/apollo.client';
import { CREATE_MCP_SERVER_MUTATION, MCP_SERVERS_SUBSCRIPTION, UPDATE_MCP_SERVER_RUN_ON_MUTATION } from '../../graphql';
import { useRuntimes } from '../../hooks/useRuntimes';
import { buildConfigFromFormData } from '../../utils/mcpServerConfig';

interface ConfirmationStepProps {
    formData: Partial<apolloResolversTypes.McpServer> & { config?: string | false };
    currentWorkspace: { id: string; defaultTestingRuntime?: { id: string; name: string } | null; globalRuntime?: { id: string; name: string } | null };
    runtimes: Array<{ id: string; name: string; hostname?: string | null }>;
    onServerCreated?: (id: string) => void;
    onTestingStateChange?: (isRunning: boolean) => void;
    onRunLocationChange?: (runOn: MCP_SERVER_RUN_ON) => void;
    onEdgeRuntimeSelectionChange?: (runtimeId: string) => void;
}

const IDENTIFY_TOOLS_TIMEOUT = 20000;

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
    formData,
    currentWorkspace,
    runtimes,
    onServerCreated,
    onTestingStateChange,
    onRunLocationChange,
    onEdgeRuntimeSelectionChange,
}) => {
    const [workflowStarted, setWorkflowStarted] = useState<boolean>(false);
    // 1. Server creation
    const [createStepStatus, setCreateStepStatus] = useState<StepStatus>('pending');
    // 2. Testing on runtime
    const [testStepStatus, setTestStepStatus] = useState<StepStatus>('pending');
    // 3. Identify tools
    const [identifyStepStatus, setIdentifyStepStatus] = useState<StepStatus>('pending');
    // In case of an error
    const [progressError, setProgressError] = useState<string>('');


    const [createdServerId, setCreatedServerId] = useState<string>('');
    const [testingRuntime, setTestingRuntime] = useState<{ id: string; name: string } | null>(null);
    const [edgeRuntimeId, setEdgeRuntimeId] = useState<string>('');
    const [toolWaitStarted, setToolWaitStarted] = useState<boolean>(false);
    const toolsTimeoutRef = useRef<number | null>(null);
    const [serverRunLocation, setServerRunLocation] = useState<MCP_SERVER_RUN_ON>('GLOBAL');
    const subscribedRuntimes = useRuntimes(currentWorkspace.id);

    const isTesting =
        createStepStatus === 'in-progress' ||
        testStepStatus === 'in-progress' ||
        identifyStepStatus === 'in-progress';

    useEffect(() => {
        if (onTestingStateChange) onTestingStateChange(isTesting);
    }, [isTesting, onTestingStateChange]);

    useEffect(() => {
        if (onRunLocationChange) onRunLocationChange(serverRunLocation);
    }, [serverRunLocation, onRunLocationChange]);

    // 1. Server creation
    const createMcpServer = useCallback(async (): Promise<string> => {
        setCreateStepStatus('in-progress');
        try {
            // Build config from form data
            const config = buildConfigFromFormData({
                command: formData.command,
                args: formData.args,
                ENV: formData.ENV,
                serverUrl: formData.serverUrl,
                headers: formData.headers,
                transport: formData.transport!,
            });
            
            const createResult = await client.mutate({
                mutation: CREATE_MCP_SERVER_MUTATION,
                variables: {
                    name: formData.name,
                    description: formData.description,
                    repositoryUrl: formData.repositoryUrl,
                    transport: formData.transport,
                    config: config,
                    workspaceId: currentWorkspace.id,
                },
            });
            const serverId: string | undefined = createResult.data?.createMCPServer?.id;
            if (!serverId) throw new Error('CREATE_MCP_SERVER_NO_ID');
            setCreateStepStatus('completed');
            return serverId;
        } catch (error: unknown) {
            setCreateStepStatus('error');
            setProgressError('Failed to create MCP Server.');
            throw error instanceof Error ? error : new Error(String(error));
        }
    }, [formData, currentWorkspace.id]);

    // 2. Testing on runtime
    const linkServerToRuntime = useCallback(async (serverId: string, runtimeId: string): Promise<void> => {
        setTestStepStatus('in-progress');
        try {
            await client.mutate({
                mutation: UPDATE_MCP_SERVER_RUN_ON_MUTATION,
                variables: {
                    mcpServerId: serverId,
                    runOn: 'EDGE',
                    runtimeId,
                },
            });
            setTestStepStatus('completed');
        } catch (error: unknown) {
            setTestStepStatus('error');
            setProgressError('Failed to link MCP Server to runtime. You can select another runtime and retry.');
            throw error instanceof Error ? error : new Error(String(error));
        }
    }, []);

    // 3. Identify tools
    const waitForToolsOrTimeout = useCallback((serverId: string): Promise<boolean> => {
        if (toolWaitStarted) return Promise.resolve(false);
        setToolWaitStarted(true);
        setIdentifyStepStatus('in-progress');
        const subscription = observe<{ mcpServers: apolloResolversTypes.McpServer[] }>({
            query: MCP_SERVERS_SUBSCRIPTION,
            variables: { workspaceId: currentWorkspace.id },
        });
        return new Promise<boolean>((resolve) => {
            const sub = subscription.subscribe({
                next: (data) => {
                    const server = (data.mcpServers || []).find(s => s.id === serverId);
                    if (server && server.tools && server.tools.length > 0) {
                        setIdentifyStepStatus('completed');
                        if (toolsTimeoutRef.current !== null) {
                            clearTimeout(toolsTimeoutRef.current);
                            toolsTimeoutRef.current = null;
                        }
                        setProgressError('');
                        sub.unsubscribe();
                        resolve(true);
                    }
                },
                error: () => {
                    setProgressError('Subscription error while identifying tools.');
                },
            });
            if (toolsTimeoutRef.current !== null) {
                clearTimeout(toolsTimeoutRef.current);
            }
            toolsTimeoutRef.current = window.setTimeout(() => {
                setIdentifyStepStatus((prev) => {
                    if (prev !== 'completed') {
                        setProgressError('No tools identified within 20 seconds.');
                        sub.unsubscribe();
                        resolve(false);
                        return 'pending';
                    }
                    return prev;
                });
                toolsTimeoutRef.current = null;
            }, IDENTIFY_TOOLS_TIMEOUT);
        });
    }, [currentWorkspace.id, toolWaitStarted]);

    // Select the testing runtime
    useEffect(() => {
        if (testingRuntime) return;
        const availableRuntimes = (subscribedRuntimes && subscribedRuntimes.length > 0) ? subscribedRuntimes : runtimes;
        const defaultId = currentWorkspace.defaultTestingRuntime?.id || availableRuntimes[0]?.id || '';
        const defaultName = currentWorkspace.defaultTestingRuntime?.name || (availableRuntimes.find(r => r.id === defaultId)?.name ?? '');
        if (defaultId) {
            setTestingRuntime({ id: defaultId, name: defaultName });
        }
    }, [runtimes, subscribedRuntimes, currentWorkspace.defaultTestingRuntime, testingRuntime]);

    // Start the workflow
    useEffect(() => {
        // don't start twice the workflow
        if (workflowStarted) return;
        // wait for all required information before starting the workflow
        if (!formData.name || !formData.description || !formData.repositoryUrl || !testingRuntime) return;
        setWorkflowStarted(true);
        (async () => {
            try {
                const serverId = await createMcpServer();
                setCreatedServerId(serverId);
                if (onServerCreated) onServerCreated(serverId);
                const runtimeId = testingRuntime.id;
                if (!runtimeId) throw new Error('NO_RUNTIME_SELECTED');
                await linkServerToRuntime(serverId, runtimeId);
                await waitForToolsOrTimeout(serverId);
            } catch {
                // Error already handled and displayed via progressError
            } finally {
                // When the Initialize MCP Server workflow is completed or error, we need to unlink the server from the runtime
                try {
                    await client.mutate({
                        mutation: UPDATE_MCP_SERVER_RUN_ON_MUTATION,
                        variables: {
                            mcpServerId: createdServerId,
                            runOn: 'GLOBAL',
                        },
                    });
                } catch {
                    // ignore unlink errors
                }
            }
        })();
    }, [workflowStarted, createMcpServer, testingRuntime, linkServerToRuntime, waitForToolsOrTimeout, formData, createdServerId, onServerCreated]);

    return (
        <div className="space-y-6">
            <div>
                <div className="mb-4">
                    <h4 className="text-base font-medium text-gray-900 mb-2">Initialize MCP Server</h4>
                    {/* Progress Steps */}
                    <ProgressSteps
                        steps={[
                            { id: 'create', label: 'Server creation', status: createStepStatus },
                            { id: 'test', label: `Testing on ${testingRuntime?.name || '<runtime>'}`, status: testStepStatus },
                            { id: 'identify', label: 'Identify tools', status: identifyStepStatus },
                        ]}
                    />
                </div>
                {progressError && (
                    <div className="mt-2 space-y-1">
                        <div className="text-sm text-red-600">{progressError}</div>
                        <div className="text-sm text-gray-500">
                            You can save the server without a successful test and try to make it run on a runtime later
                        </div>
                    </div>
                )}

                {/* Where to run section */}
                <div className="mt-6">
                    <h4 className="text-base font-medium text-gray-900 mb-3">Where do you want this server to run?</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
                        <button
                            type="button"
                            aria-selected={serverRunLocation === 'GLOBAL'}
                            aria-disabled={isTesting}
                            onClick={() => { if (!isTesting) setServerRunLocation('GLOBAL'); }}
                            className={`h-full flex flex-col text-left p-4 rounded-lg border transition-colors ${serverRunLocation === 'GLOBAL' ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                            <div className="text-sm font-medium text-gray-900">Main Runtime</div>
                            <div className="mt-1 text-sm text-gray-600">
                                The server is run once on the global runtime and is made available to all agents. Best for servers which are independant of the agent running it
                            </div>
                            <div className="mt-2">
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                    {currentWorkspace.globalRuntime?.name ?? 'No Global Runtime for now'}
                                </span>
                            </div>
                        </button>
                        <button
                            type="button"
                            aria-selected={serverRunLocation === 'AGENT'}
                            aria-disabled={isTesting}
                            onClick={() => { if (!isTesting) setServerRunLocation('AGENT'); }}
                            className={`h-full flex flex-col text-left p-4 rounded-lg border transition-colors ${serverRunLocation === 'AGENT' ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                            <div className="text-sm font-medium text-gray-900">On Agent Side</div>
                            <div className="mt-1 text-sm text-gray-600">
                                Each agent run its one version of the server. Best for servers which requires access to the direct environment of the agent.
                            </div>
                        </button>
                        <button
                            type="button"
                            aria-selected={serverRunLocation === 'EDGE'}
                            aria-disabled={isTesting}
                            onClick={() => { if (!isTesting) setServerRunLocation('EDGE'); }}
                            className={`h-full flex flex-col text-left p-4 rounded-lg border transition-colors ${serverRunLocation === 'EDGE' ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                            <div className="text-sm font-medium text-gray-900">On the Edge</div>
                            <div className="mt-1 text-sm text-gray-600">
                                Select a specific runtime. This advanced usage is best for giving access from an agent to a remote environment.
                            </div>
                            {serverRunLocation === 'EDGE' && (
                                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                                    <select
                                        value={edgeRuntimeId}
                                        onChange={(e) => {
                                            const runtimeId = e.target.value;
                                            setEdgeRuntimeId(runtimeId);
                                            if (onEdgeRuntimeSelectionChange) {
                                                onEdgeRuntimeSelectionChange(runtimeId);
                                            }
                                        }}
                                        disabled={isTesting}
                                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                                    >
                                        <option value="">Select a runtime...</option>
                                        {(subscribedRuntimes.length > 0 ? subscribedRuntimes : runtimes).map((runtime) => (
                                            <option key={runtime.id} value={runtime.id}>
                                                {runtime.name} {runtime.hostname && `(${runtime.hostname})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationStep;
