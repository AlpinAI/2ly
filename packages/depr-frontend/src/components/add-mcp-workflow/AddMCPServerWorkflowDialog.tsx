import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import Stepper from '../ui/Stepper';
import { apolloResolversTypes, MCP_SERVER_RUN_ON } from '@2ly/common';
import { client } from '../../services/apollo.client';
import { REGISTRY_QUERY, FETCH_MCP_SERVER_CONFIG_QUERY, IS_MCP_AUTO_CONFIG_ENABLED_QUERY } from '../../graphql';
import { DELETE_MCP_SERVER_MUTATION } from '../../graphql/mutations';
import { UPDATE_MCP_SERVER_RUN_ON_MUTATION } from '../../graphql/mutations';
import { useRequiredWorkspace } from '../../contexts/useRequiredWorkspace';
import { useRuntimes } from '../../hooks/useRuntimes';
import ServerSelectionStep from './ServerSelectionStep';
import ConfigurationStep from './ConfigurationStep';
import ConfirmationStep from './ConfirmationStep';
import { MCPServerFromRegistry } from './ServerSelectionStep';
import { QuickSetupFormData } from './ConfigurationStep';

interface AddMCPServerWorkflowDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Main Workflow steps
 */
const STEPS = [
    { id: 'select', title: 'Select / Add Server', description: 'Choose existing or search' },
    { id: 'configure', title: 'Configure', description: 'Set up details' },
    { id: 'confirm', title: 'Confirm & Create', description: 'Finalize setup' },
];

/**
 * Empty form data for the configuration step
 */
const emptyFormData: Partial<apolloResolversTypes.McpServer> & { config: false } = {
    name: '',
    description: '',
    repositoryUrl: '',
    transport: 'STDIO' as apolloResolversTypes.McpTransportType,
    command: '',
    args: '',
    ENV: '',
    serverUrl: '',
    headers: '',
    config: false,
};

interface JSONSchemaProperty {
    type: 'string' | 'number' | 'boolean';
    description?: string;
    default?: string | number | boolean;
    examples?: (string | number | boolean)[];
}

interface JSONSchema {
    type: 'object';
    properties?: Record<string, JSONSchemaProperty>;
    required?: string[];
}

const AddMCPServerWorkflowDialog: React.FC<AddMCPServerWorkflowDialogProps> = ({
    isOpen,
    onClose,
}) => {
    const { currentWorkspace } = useRequiredWorkspace();
    /**
     * Current step of the workflow
     */
    const [currentStep, setCurrentStep] = useState(0);
    /**
     * Registry data, fetched from the backend
     */
    const [registryData, setRegistryData] = useState<apolloResolversTypes.Registry>({
        version: '1.0.0',
        description: '',
        servers: [],
    });
    const runtimes = useRuntimes(currentWorkspace.id, ['tool']);
    /**
     * State values of the select server step
     */
    const [selectedServer, setSelectedServer] = useState<MCPServerFromRegistry | null>(null);
    const [urlRepositoryUrl, setUrlRepositoryUrl] = useState<string>('');
    const [shouldFetchConfigurationFromRepositoryWithIA, setShouldFetchConfigurationFromRepositoryWithIA] = useState<boolean>(false);
    const [isFetchingConfiguration, setIsFetchingConfiguration] = useState<boolean>(false);
    const [quickSetupFormData, setQuickSetupFormData] = useState<QuickSetupFormData>({});
    const [createdServerId, setCreatedServerId] = useState<string>('');
    const [isTestingServer, setIsTestingServer] = useState<boolean>(false);
    const [selectedRunLocation, setSelectedRunLocation] = useState<MCP_SERVER_RUN_ON>('GLOBAL');
    const [edgeRuntimeId, setEdgeRuntimeId] = useState<string>('');
    const [isMCPAutoConfigEnabled, setIsMCPAutoConfigEnabled] = useState<boolean>(true);

    /**
     * Form data for the configuration step, passed along the workflow steps
     */
    const [formData, setFormData] = useState<Partial<apolloResolversTypes.McpServer> & { config?: string | false }>(emptyFormData);

    // Fetch registry data and auto config status
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            try {
                const [registryResult, autoConfigResult] = await Promise.all([
                    client.query({
                        query: REGISTRY_QUERY,
                    }),
                    client.query({
                        query: IS_MCP_AUTO_CONFIG_ENABLED_QUERY,
                    })
                ]);

                if (registryResult.data?.registry) {
                    setRegistryData(registryResult.data.registry);
                }

                if (autoConfigResult.data?.isMCPAutoConfigEnabled !== undefined) {
                    setIsMCPAutoConfigEnabled(autoConfigResult.data.isMCPAutoConfigEnabled);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [isOpen]);

    const isStep0ReadyToProceed = () => {
        if (urlRepositoryUrl.trim().length > 0) return true;
        return selectedServer !== null;
    };

    const isStep1ReadyToProceed = () => {
        if (!formData.name || !formData.description || !formData.repositoryUrl) return false;
        if (selectedServer?.config && Object.keys(quickSetupFormData).length > 0) {
            // Check if all required fields are filled for quick setup
            const schema = parseJSONSchema(selectedServer.config);
            if (schema?.required) {
                return (schema.required as string[]).every((fieldName: string) => {
                    const value = quickSetupFormData[fieldName];
                    if (value === undefined || value === null) return false;
                    if (typeof value === 'string' && value.trim() === '') return false;
                    return true;
                });
            }
        }
        return true;
    };

    const parseJSONSchema = useCallback((configString: string | null): JSONSchema | null => {
        if (!configString) return null;

        try {
            const parsed = JSON.parse(configString);
            let schema = parsed;
            if (parsed.schema && typeof parsed.schema === 'object') {
                schema = parsed.schema;
            }
            if (schema && typeof schema === 'object' && schema.type === 'object') {
                return schema as JSONSchema;
            }
            return null;
        } catch (error) {
            console.error('Failed to parse JSON Schema:', error);
            return null;
        }
    }, []);

    const handleNext = async () => {
        if (currentStep === 0 && shouldFetchConfigurationFromRepositoryWithIA && urlRepositoryUrl.trim()) {
            setIsFetchingConfiguration(true);
            try {
                type FetchMCPServerConfigResponse = { fetchMCPServerConfig: apolloResolversTypes.McpRegistryServer | null };
                const { data } = await client.query<FetchMCPServerConfigResponse>({
                    query: FETCH_MCP_SERVER_CONFIG_QUERY,
                    variables: { repositoryUrl: urlRepositoryUrl.trim() },
                });
                const server = data?.fetchMCPServerConfig;
                if (server) {
                    setFormData({
                        name: server.name,
                        description: server.description,
                        repositoryUrl: server.repositoryUrl,
                        transport: server.transport,
                        command: server.command || '',
                        args: server.args || '',
                        ENV: server.ENV || '',
                        serverUrl: server.serverUrl || '',
                        headers: server.headers || '',
                        config: server.config ?? false,
                    });
                }
            } catch (error) {
                console.error('Error fetching MCP server config:', error);
            } finally {
                setIsFetchingConfiguration(false);
            }
        }
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const deleteCreatedServerIfAny = async () => {
        if (!createdServerId) return;
        try {
            await client.mutate({
                mutation: DELETE_MCP_SERVER_MUTATION,
                variables: { id: createdServerId },
            });
        } catch (error) {
            console.error('ERR_DELETE_MCP_SERVER', error);
        } finally {
            setCreatedServerId('');
        }
    };

    const handlePrevious = async () => {
        if (currentStep === 2) {
            await deleteCreatedServerIfAny();
        }
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleStepClick = async (stepIndex: number) => {
        if (stepIndex <= currentStep) {
            if (currentStep === 2 && stepIndex <= 1) {
                await deleteCreatedServerIfAny();
            }
            setCurrentStep(stepIndex);
        }
    };

    const handleFinalizeCreate = async () => {
        if (!createdServerId) return;
        await client.mutate({
            mutation: UPDATE_MCP_SERVER_RUN_ON_MUTATION,
            variables: {
                mcpServerId: createdServerId,
                runOn: selectedRunLocation,
                runtimeId: selectedRunLocation === 'EDGE' ? edgeRuntimeId : undefined,
            },
        });
        onClose();
        resetDialog();
    };

    const handleServerSelect = (server: MCPServerFromRegistry) => {
        setSelectedServer(server);
        setFormData({
            name: server.name,
            description: server.description,
            repositoryUrl: server.repositoryUrl,
            transport: server.transport,
            command: server.command || '',
            args: server.args || '',
            ENV: server.ENV || '',
            serverUrl: server.serverUrl || '',
            headers: server.headers || '',
            config: server.config ?? false,
        });

        // Initialize quick setup form data if config is available
        if (server.config) {
            const schema = parseJSONSchema(server.config);
            if (schema?.properties) {
                const initialData: QuickSetupFormData = {};
                Object.entries(schema.properties as Record<string, { type: 'string' | 'number' | 'boolean'; default?: string | number | boolean }>)
                    .forEach(([propertyName, propertySchema]) => {
                        if (propertySchema.default !== undefined) {
                            initialData[propertyName] = propertySchema.default;
                        } else if (propertySchema.type === 'boolean') {
                            initialData[propertyName] = false;
                        } else {
                            initialData[propertyName] = '';
                        }
                    });
                setQuickSetupFormData(initialData);
            }
        } else {
            setQuickSetupFormData({});
        }
    };

    const handleFormDataChange = useCallback((field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleEdgeRuntimeSelectionChange = useCallback((runtimeId: string) => {
        setEdgeRuntimeId(runtimeId);
    }, []);

    const resetDialog = () => {
        setCurrentStep(0);
        setSelectedServer(null);
        setFormData(emptyFormData);
        setUrlRepositoryUrl('');
        setShouldFetchConfigurationFromRepositoryWithIA(false);
        setQuickSetupFormData({});
        setEdgeRuntimeId('');
    };

    const handleClose = async () => {
        await deleteCreatedServerIfAny();
        resetDialog();
        onClose();
    };

    if (!isOpen) return null;

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <ServerSelectionStep
                        registryData={registryData}
                        selectedServer={selectedServer}
                        onServerSelect={handleServerSelect}
                        onFormDataChange={handleFormDataChange}
                        urlRepositoryUrl={urlRepositoryUrl}
                        onUrlRepositoryUrlChange={setUrlRepositoryUrl}
                        shouldFetchConfigurationFromRepositoryWithIA={shouldFetchConfigurationFromRepositoryWithIA}
                        onShouldFetchConfigurationFromRepositoryWithIAChange={setShouldFetchConfigurationFromRepositoryWithIA}
                        isMCPAutoConfigEnabled={isMCPAutoConfigEnabled}
                    />
                );
            case 1:
                return (
                    <ConfigurationStep
                        selectedServer={selectedServer}
                        formData={formData}
                        onFormDataChange={handleFormDataChange}
                        quickSetupFormData={quickSetupFormData}
                        onQuickSetupFormDataChange={setQuickSetupFormData}
                        initialMode={formData.config !== false ? 'quick' : 'full'}
                    />
                );
            case 2:
                return (
                    <ConfirmationStep
                        formData={formData}
                        currentWorkspace={currentWorkspace}
                        runtimes={runtimes}
                        onServerCreated={setCreatedServerId}
                        onTestingStateChange={setIsTestingServer}
                        onRunLocationChange={setSelectedRunLocation}
                        onEdgeRuntimeSelectionChange={handleEdgeRuntimeSelectionChange}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-4xl max-h-[90vh] rounded-lg bg-white shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex-1">
                        <Stepper
                            steps={STEPS}
                            currentStep={currentStep}
                            onStepClick={handleStepClick}
                            className="justify-start"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {renderCurrentStep()}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 0}
                        leftIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                        Previous
                    </Button>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>

                        {currentStep < STEPS.length - 1 ? (
                            <Button
                                onClick={handleNext}
                                disabled={
                                    isFetchingConfiguration ||
                                    (currentStep === 0 && !isStep0ReadyToProceed()) ||
                                    (currentStep === 1 && !isStep1ReadyToProceed())
                                }
                                rightIcon={isFetchingConfiguration ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                            >
                                {isFetchingConfiguration ? 'Loading...' : 'Next'}
                            </Button>
                        ) : (
                            isTestingServer ? (
                                <Button disabled>
                                    Processing...
                                </Button>
                            ) : (
                                <Button onClick={handleFinalizeCreate} disabled={!createdServerId}>
                                    Create
                                </Button>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddMCPServerWorkflowDialog;
