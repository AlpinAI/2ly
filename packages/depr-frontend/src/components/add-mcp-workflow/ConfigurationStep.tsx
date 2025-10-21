import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { apolloResolversTypes } from '@2ly/common';
import { MCPServerFromRegistry } from './ServerSelectionStep';

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

interface QuickSetupFormData {
    [key: string]: string | number | boolean;
}

interface ConfigurationStepProps {
    selectedServer: MCPServerFromRegistry | null;
    formData: Partial<apolloResolversTypes.McpServer> & { config?: string | false };
    onFormDataChange: (field: keyof Partial<apolloResolversTypes.McpServer>, value: string) => void;
    quickSetupFormData: QuickSetupFormData;
    onQuickSetupFormDataChange: (data: QuickSetupFormData) => void;
    initialMode?: 'quick' | 'full';
}

const ConfigurationStep: React.FC<ConfigurationStepProps> = ({
    selectedServer,
    formData,
    onFormDataChange,
    quickSetupFormData,
    onQuickSetupFormDataChange,
    initialMode,
}) => {
    const [configureMode, setConfigureMode] = useState<'quick' | 'full'>(initialMode ?? 'full');

    useEffect(() => {
        if (formData.config === false && configureMode === 'quick') {
            setConfigureMode('full');
        }
    }, [formData.config, configureMode]);

    useEffect(() => {
        if (!initialMode) return;
        if (initialMode === 'quick' && formData.config !== false) {
            setConfigureMode('quick');
        } else {
            setConfigureMode('full');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialMode]);

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

    const generateQuickSetupForm = useCallback((schema: JSONSchema): React.ReactNode => {
        if (!schema.properties || Object.keys(schema.properties).length === 0) {
            return (
                <div className="text-center text-gray-500 py-4">
                    No configuration properties found in this MCP server
                </div>
            );
        }

        const requiredFields = schema.required || [];

        return (
            <div className="space-y-4">
                {Object.entries(schema.properties).map(([propertyName, propertySchema]) => {
                    const isRequired = requiredFields.includes(propertyName);
                    const currentValue = quickSetupFormData[propertyName];

                    const handleInputChange = (value: string | number | boolean) => {
                        const newData = {
                            ...quickSetupFormData,
                            [propertyName]: value
                        };
                        onQuickSetupFormDataChange(newData);
                    };

                    const renderInputField = () => {
                        const getPlaceholder = () => {
                            if (propertySchema.examples && propertySchema.examples.length > 0) {
                                return `e.g., ${propertySchema.examples[0]}`;
                            }
                            return `Enter ${propertyName} (use $${propertyName} in server config)`;
                        };

                        switch (propertySchema.type) {
                            case 'string':
                                return (
                                    <input
                                        type="text"
                                        required={isRequired}
                                        value={currentValue as string || ''}
                                        onChange={(e) => handleInputChange(e.target.value)}
                                        placeholder={getPlaceholder()}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    />
                                );

                            case 'number':
                                return (
                                    <input
                                        type="number"
                                        required={isRequired}
                                        value={currentValue as number || ''}
                                        onChange={(e) => handleInputChange(Number(e.target.value))}
                                        placeholder={getPlaceholder()}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    />
                                );

                            case 'boolean':
                                return (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`quick-${propertyName}`}
                                            checked={currentValue as boolean || false}
                                            onChange={(e) => handleInputChange(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <label htmlFor={`quick-${propertyName}`} className="text-sm text-gray-700">
                                            {propertySchema.description || propertyName}
                                        </label>
                                    </div>
                                );

                            default:
                                return null;
                        }
                    };

                    return (
                        <div key={propertyName} className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                {propertyName}
                                {isRequired && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {propertySchema.description && (
                                <p className="text-xs text-gray-500">{propertySchema.description}</p>
                            )}
                            {propertySchema.examples && propertySchema.examples.length > 0 && (
                                <div className="text-xs text-gray-400">
                                    Examples: {propertySchema.examples.slice(0, 3).map((example, index) => (
                                        <span key={index} className="bg-gray-100 px-2 py-1 rounded mr-2 font-mono">
                                            {String(example)}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {renderInputField()}
                        </div>
                    );
                })}
            </div>
        );
    }, [quickSetupFormData, onQuickSetupFormDataChange]);


    const replaceTemplatePlaceholders = useCallback((template: string | null | undefined, replacements: Record<string, string | number | boolean>): string => {
        if (!template) return '';

        let result = template;
        Object.entries(replacements).forEach(([key, value]) => {
            const placeholder = `$${key}`;
            const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            result = result.replace(regex, String(value));
        });

        return result;
    }, []);

    useEffect(() => {
        if (configureMode !== 'quick' || !selectedServer) return;
        if (Object.keys(quickSetupFormData).length === 0) return;

        const next = {
            command: replaceTemplatePlaceholders(selectedServer.command, quickSetupFormData),
            args: replaceTemplatePlaceholders(selectedServer.args, quickSetupFormData),
            ENV: replaceTemplatePlaceholders(selectedServer.ENV, quickSetupFormData),
            serverUrl: replaceTemplatePlaceholders(selectedServer.serverUrl, quickSetupFormData),
            headers: replaceTemplatePlaceholders(selectedServer.headers, quickSetupFormData),
        };

        const shouldUpdateCommand = next.command !== (formData.command || '');
        const shouldUpdateArgs = next.args !== (formData.args || '');
        const shouldUpdateEnv = next.ENV !== (formData.ENV || '');
        const shouldUpdateServerUrl = next.serverUrl !== (formData.serverUrl || '');
        const shouldUpdateHeaders = next.headers !== (formData.headers || '');

        if (!shouldUpdateCommand && !shouldUpdateArgs && !shouldUpdateEnv && !shouldUpdateServerUrl && !shouldUpdateHeaders) {
            return;
        }

        if (shouldUpdateCommand) onFormDataChange('command', next.command);
        if (shouldUpdateArgs) onFormDataChange('args', next.args);
        if (shouldUpdateEnv) onFormDataChange('ENV', next.ENV);
        if (shouldUpdateServerUrl) onFormDataChange('serverUrl', next.serverUrl);
        if (shouldUpdateHeaders) onFormDataChange('headers', next.headers);
    }, [quickSetupFormData, configureMode, selectedServer, replaceTemplatePlaceholders, onFormDataChange, formData]);

    return (
        <div className="space-y-6">
            <div>
                <Tabs value={configureMode} onValueChange={(val) => setConfigureMode(val as 'quick' | 'full')}>
                    <TabsList className="mb-4">
                        <TabsTrigger
                            value="quick"
                            disabled={formData.config === false}
                            className={formData.config === false ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                            Quick Setup
                        </TabsTrigger>
                        <TabsTrigger value="full">Full Setup</TabsTrigger>
                    </TabsList>

                    <TabsContent value="quick">
                        {selectedServer?.config ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h4 className="text-sm font-medium text-blue-800 mb-2">Quick Setup</h4>
                                    <p className="text-sm text-blue-700">
                                        Configure your MCP server using the form below. Required fields are marked with an asterisk (*).
                                        <br />
                                        <span className="text-xs">
                                            💡 <strong>Tip:</strong> You can switch to "Full Setup" mode if you wish to manually configure the MCP server.
                                        </span>
                                    </p>
                                </div>

                                {(() => {
                                    const schema = parseJSONSchema(selectedServer.config);
                                    if (schema) {
                                        return generateQuickSetupForm(schema);
                                    }
                                    return (
                                        <div className="text-center text-gray-500 py-4">
                                            Invalid configuration schema found
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                This MCP server doesn't have a configuration schema available for quick setup.
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="full">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => onFormDataChange('name', e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => onFormDataChange('description', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Repository URL</label>
                                <input
                                    type="url"
                                    required
                                    value={formData.repositoryUrl}
                                    onChange={(e) => onFormDataChange('repositoryUrl', e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Transport</label>
                                <select
                                    value={formData.transport}
                                    onChange={(e) => {
                                        const nextTransport = e.target.value as apolloResolversTypes.McpTransportType;
                                        onFormDataChange('transport', nextTransport);
                                        if (nextTransport === 'STDIO') {
                                            onFormDataChange('serverUrl', '');
                                            onFormDataChange('headers', '');
                                        } else if (nextTransport === 'STREAM') {
                                            onFormDataChange('command', '');
                                            onFormDataChange('args', '');
                                            onFormDataChange('ENV', '');
                                        }
                                    }}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                >
                                    <option value="STDIO">STDIO</option>
                                    <option value="STREAM">STREAM</option>
                                </select>
                            </div>

                            {formData.transport === 'STDIO' && (
                                <>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Command</label>
                                        <input
                                            type="text"
                                            value={formData.command}
                                            onChange={(e) => onFormDataChange('command', e.target.value)}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Args</label>
                                        <input
                                            type="text"
                                            value={formData.args}
                                            onChange={(e) => onFormDataChange('args', e.target.value)}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">ENV</label>
                                        <textarea
                                            rows={3}
                                            value={formData.ENV}
                                            onChange={(e) => onFormDataChange('ENV', e.target.value)}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        />
                                    </div>
                                </>
                            )}

                            {formData.transport === 'STREAM' && (
                                <>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Server URL</label>
                                        <input
                                            type="url"
                                            value={formData.serverUrl}
                                            onChange={(e) => onFormDataChange('serverUrl', e.target.value)}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Headers</label>
                                        <textarea
                                            rows={3}
                                            value={formData.headers || ''}
                                            onChange={(e) => onFormDataChange('headers', e.target.value)}
                                            placeholder="Enter headers in format: header_name header_value (one per line)"
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Format: &lt;header_name&gt;&lt;space&gt;&lt;header_value&gt; (one per line)
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default ConfigurationStep;
export type { QuickSetupFormData };
