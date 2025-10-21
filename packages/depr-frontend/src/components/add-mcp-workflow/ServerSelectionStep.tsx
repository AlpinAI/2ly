import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { apolloResolversTypes } from '@2ly/common';
import { client } from '../../services/apollo.client';
import { SEARCH_MCP_SERVERS_QUERY } from '../../graphql';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';

interface MCPServerFromRegistry {
    name: string;
    description: string;
    repositoryUrl: string;
    transport: apolloResolversTypes.McpTransportType;
    command?: string | null;
    args?: string | null;
    ENV?: string | null;
    serverUrl?: string | null;
    headers?: string | null;
    config?: string | null;
    _2ly: apolloResolversTypes.McpRegistry2lyMetadata;
}

interface SearchResultsListProps {
    servers: MCPServerFromRegistry[];
    selectedServer: MCPServerFromRegistry | null;
    onServerSelect: (server: MCPServerFromRegistry) => void;
    emptyMessage?: string;
}

const SearchResultsList: React.FC<SearchResultsListProps> = ({
    servers,
    selectedServer,
    onServerSelect,
    emptyMessage = 'No servers found'
}) => {
    if (servers.length === 0) {
        return (
            <div className="text-center text-gray-500 py-4">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
            {servers.map((server, index) => (
                <div
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedServer === server
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`
                    }
                    onClick={() => onServerSelect(server)}
                >
                    <div className="font-medium text-gray-900">{server.name}</div>
                    <div className="text-sm text-gray-600">{server.description}</div>
                    <div className="text-xs text-gray-500 mt-1">{server.repositoryUrl}</div>
                </div>
            ))}
        </div>
    );
};

interface ServerSelectionStepProps {
    registryData: apolloResolversTypes.Registry;
    selectedServer: MCPServerFromRegistry | null;
    onServerSelect: (server: MCPServerFromRegistry) => void;
    onFormDataChange: (field: keyof Partial<apolloResolversTypes.McpServer>, value: string) => void;
    urlRepositoryUrl: string;
    onUrlRepositoryUrlChange: (value: string) => void;
    shouldFetchConfigurationFromRepositoryWithIA: boolean;
    onShouldFetchConfigurationFromRepositoryWithIAChange: (value: boolean) => void;
    isMCPAutoConfigEnabled: boolean;
}

const ServerSelectionStep: React.FC<ServerSelectionStepProps> = ({
    registryData,
    selectedServer,
    onServerSelect,
    onFormDataChange,
    urlRepositoryUrl,
    onUrlRepositoryUrlChange,
    shouldFetchConfigurationFromRepositoryWithIA,
    onShouldFetchConfigurationFromRepositoryWithIAChange,
    isMCPAutoConfigEnabled,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectMode, setSelectMode] = useState<'registry' | 'url' | 'auto'>('registry');
    const [autoSearchTerm, setAutoSearchTerm] = useState<string>('');
    const [isAutoSearching, setIsAutoSearching] = useState<boolean>(false);
    const [autoSearchResults, setAutoSearchResults] = useState<MCPServerFromRegistry[]>([]);
    const [hasAutoSearched, setHasAutoSearched] = useState<boolean>(false);

    // Switch away from auto tab if auto config gets disabled
    useEffect(() => {
        if (selectMode === 'auto' && !isMCPAutoConfigEnabled) {
            setSelectMode('registry');
            setAutoSearchResults([]);
            setHasAutoSearched(false);
            setAutoSearchTerm('');
        }
    }, [isMCPAutoConfigEnabled, selectMode]);

    type SearchMCPServersResponse = {
        searchMCPServers: apolloResolversTypes.McpRegistryServer[];
    };

    const parseRegistryData = useCallback((): MCPServerFromRegistry[] => {
        if (!registryData.version || registryData.version !== '1.0.0') {
            console.error('Invalid registry version', registryData.version);
            return [];
        }

        if (!registryData.servers || !Array.isArray(registryData.servers)) {
            console.error('Invalid registry servers', registryData.servers);
            return [];
        }

        const servers = registryData.servers.map((server: apolloResolversTypes.McpRegistryServer) => {
            return {
                name: server.name,
                description: server.description,
                repositoryUrl: server.repositoryUrl,
                transport: server.transport,
                command: server.command,
                args: server.args,
                ENV: server.ENV,
                serverUrl: server.serverUrl,
                headers: server.headers,
                config: server.config,
                _2ly: server._2ly,
            };
        });

        return servers;
    }, [registryData]);

    const filteredServers = useMemo(() => {
        const registryServers = parseRegistryData();
        return registryServers.filter(
            (server) =>
                server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                server.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [parseRegistryData, searchTerm]);

    const handleServerSelect = (server: MCPServerFromRegistry) => {
        onServerSelect(server);
        onFormDataChange('name', server.name);
        onFormDataChange('description', server.description);
        onFormDataChange('repositoryUrl', server.repositoryUrl);
        onFormDataChange('transport', server.transport);
        onFormDataChange('command', server.command || '');
        onFormDataChange('args', server.args || '');
        onFormDataChange('ENV', server.ENV || '');
        onFormDataChange('serverUrl', server.serverUrl || '');
        onFormDataChange('headers', server.headers || '');
    };

    const handleModeChange = (val: string) => {
        const nextMode = val as 'registry' | 'url' | 'auto';

        setSelectMode(nextMode);
        if (nextMode === 'registry') {
            setAutoSearchResults([]);
            setHasAutoSearched(false);
            setAutoSearchTerm('');
            onUrlRepositoryUrlChange('');
            onShouldFetchConfigurationFromRepositoryWithIAChange(false);
        }
        if (nextMode === 'url') {
            setSearchTerm('');
            setAutoSearchResults([]);
            setHasAutoSearched(false);
            setAutoSearchTerm('');
        }
        if (nextMode === 'auto') {
            setSearchTerm('');
            onUrlRepositoryUrlChange('');
            onShouldFetchConfigurationFromRepositoryWithIAChange(false);
        }
    };

    const handleAutoSearch = async () => {
        const trimmedQuery = autoSearchTerm.trim();
        if (!trimmedQuery || isAutoSearching) return;
        setIsAutoSearching(true);
        try {
            const { data } = await client.query<SearchMCPServersResponse>({
                query: SEARCH_MCP_SERVERS_QUERY,
                variables: { query: trimmedQuery },
            });

            if (data?.searchMCPServers) {
                const results = data.searchMCPServers.map((server: apolloResolversTypes.McpRegistryServer) => ({
                    name: server.name,
                    description: server.description,
                    repositoryUrl: server.repositoryUrl,
                    transport: server.transport,
                    command: server.command,
                    args: server.args,
                    ENV: server.ENV,
                    serverUrl: server.serverUrl,
                    headers: server.headers,
                    config: server.config,
                    _2ly: server._2ly,
                }));
                setAutoSearchResults(results);
                setHasAutoSearched(true);
            }
        } catch (error) {
            console.error('Error searching MCP servers:', error);
            setAutoSearchResults([]);
            setHasAutoSearched(true);
        } finally {
            setIsAutoSearching(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <Tabs value={selectMode} onValueChange={handleModeChange}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="registry">Select from Registry</TabsTrigger>
                        <TabsTrigger value="url">Select from URL</TabsTrigger>
                        {isMCPAutoConfigEnabled && (
                            <TabsTrigger value="auto">Auto Search (beta)</TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="registry">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search MCP servers in registry..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                        </div>

                        <SearchResultsList
                            servers={filteredServers}
                            selectedServer={selectedServer}
                            onServerSelect={handleServerSelect}
                            emptyMessage={searchTerm ? `No servers found matching "${searchTerm}"` : "No servers available"}
                        />
                    </TabsContent>

                    <TabsContent value="url">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Repository URL</label>
                                <input
                                    type="url"
                                    placeholder="https://github.com/owner/repo"
                                    value={urlRepositoryUrl}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        onUrlRepositoryUrlChange(value);
                                        onFormDataChange('repositoryUrl', value);
                                    }}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                            </div>
                            {isMCPAutoConfigEnabled && (
                                <div className="flex items-center gap-2">
                                    <input
                                        id="fetch-with-ia"
                                        type="checkbox"
                                        checked={shouldFetchConfigurationFromRepositoryWithIA}
                                        onChange={(e) => onShouldFetchConfigurationFromRepositoryWithIAChange(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="fetch-with-ia" className="text-sm text-gray-700">
                                        Fetch configuration from repository with IA
                                    </label>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="auto">
                        <p className="text-sm text-gray-500">
                            Search by name or explain what you would like your MCP server to achieve
                        </p>
                        <div className="flex gap-2 mt-2">
                            <input
                                type="text"
                                placeholder="Enter MCP server URL, name, or specify your needs"
                                value={autoSearchTerm}
                                onChange={(e) => setAutoSearchTerm(e.target.value)}
                                disabled={isAutoSearching}
                                className="flex-1 h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                            <button
                                type="button"
                                onClick={handleAutoSearch}
                                disabled={isAutoSearching || autoSearchTerm.trim() === ''}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isAutoSearching ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search className="h-4 w-4 inline mr-2" />
                                        Search
                                    </>
                                )}
                            </button>
                        </div>

                        {!hasAutoSearched && (
                            <div className="text-center text-gray-500 py-4">
                                Enter a search term and click Search to find MCP servers
                            </div>
                        )}
                        {hasAutoSearched && (
                            <SearchResultsList
                                servers={autoSearchResults}
                                selectedServer={selectedServer}
                                onServerSelect={handleServerSelect}
                                emptyMessage="No servers found matching your search"
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default ServerSelectionStep;
export type { MCPServerFromRegistry };
