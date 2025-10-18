import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { apolloResolversTypes } from '@2ly/common';
import { searchServers, type McpServerFromRegistry } from '../../../services/mcpRegistry.service';
import MCPQuickConfig from './MCPQuickConfig';
import { useWorkspace } from '../../../contexts/useWorkspace';
import { client, observe } from '../../../services/apollo.client';
import { CREATE_MCP_SERVER_MUTATION, DELETE_MCP_SERVER_MUTATION, MCP_SERVERS_SUBSCRIPTION, UPDATE_MCP_SERVER_RUN_ON_MUTATION } from '../../../graphql';
import { buildConfigFromFormData } from '../../../utils/mcpServerConfig';

// Extended type for frontend form data that includes config properties
interface McpServerFormData extends Partial<apolloResolversTypes.McpServer> {
    command?: string;
    args?: string;
    ENV?: string;
    serverUrl?: string;
    headers?: string;
}

const PAGE_SIZE_DEFAULT = 20;
const CARD_FIXED_HEIGHT_PX = 560;

const IDENTIFY_TOOLS_TIMEOUT = 20000;

type TestViewState = 'idle' | 'running' | 'success' | 'timeout' | 'error';

interface McpConfigureProps {
    onSuccessExit?: () => void;
}

const FEATURED_SERVERS: McpServerFromRegistry[] = [
    {
        _meta: {
            'io.modelcontextprotocol.registry/official': {
                isLatest: true,
                publishedAt: new Date().toISOString(),
                status: 'active',
                updatedAt: new Date().toISOString(),
            },
        },
        server: {
            name: 'io.github.github/github-mcp-server',
            description: 'Connect AI assistants to GitHub - manage repos, issues, PRs, and workflows through natural language.',
            version: '0.17.1',
            repository: {
                url: 'https://github.com/github/github-mcp-server',
                source: 'github',
                id: 'github/github-mcp-server',
            },
            packages: [],
            remotes: [
                {
                    type: 'streamable',
                    url: 'https://api.githubcopilot.com/mcp/',
                    headers: [
                        {
                            name: 'Authorization',
                            description: 'Bearer token with your GitHub personal access token. Format as `Bearer $PAT`',
                            format: 'string',
                            isRequired: true,
                            isSecret: true,
                        },
                    ],
                },
            ],
        },
    },
    {
        _meta: {
            'io.modelcontextprotocol.registry/official': {
                isLatest: true,
                publishedAt: new Date().toISOString(),
                status: 'active',
                updatedAt: new Date().toISOString(),
            },
        },
        server: {
            name: 'modelcontextprotocol/server-filesystem',
            description: 'MCP server for filesystem access - read, write, create, list, delete files and directories',
            version: '0.6.3',
            repository: {
                url: 'https://github.com/modelcontextprotocol/servers',
                source: 'github',
                id: 'modelcontextprotocol/servers',
                subfolder: 'src/filesystem',
            },
            packages: [
                {
                    identifier: '@modelcontextprotocol/server-filesystem',
                    version: '2025.8.21',
                    registryType: 'npm',
                    registryBaseUrl: 'https://registry.npmjs.org',
                    runtimeHint: 'npx',
                    transport: {
                        type: 'stdio',
                    },
                    packageArguments: [
                        {
                            name: 'directory_path',
                            description: 'The directory path to allow access to',
                            format: 'string',
                            type: 'positional',
                            isRequired: false,
                        },
                    ],
                    environmentVariables: [],
                },
                {
                    identifier: 'mcp/filesystem',
                    version: 'latest',
                    registryType: 'docker',
                    registryBaseUrl: 'https://hub.docker.com',
                    runtimeHint: 'docker',
                    transport: {
                        type: 'stdio',
                    },
                    packageArguments: [
                        {
                            name: 'directory_path',
                            description: 'The directory path to allow access to (inside container)',
                            format: 'string',
                            type: 'positional',
                            isRequired: true,
                            default: '/projects',
                        },
                    ],
                    environmentVariables: [],
                },
            ],
        },
    },
    {
        _meta: {
            'io.modelcontextprotocol.registry/official': {
                isLatest: true,
                publishedAt: new Date().toISOString(),
                status: 'active',
                updatedAt: new Date().toISOString(),
            },
        },
        server: {
            name: 'erithwik/mcp-hn',
            description: 'MCP Server for Hacker News - fetch stories, search, get user info and story comments',
            version: '0.1.0',
            repository: {
                url: 'https://github.com/erithwik/mcp-hn',
                source: 'github',
                id: 'erithwik/mcp-hn',
            },
            packages: [
                {
                    identifier: 'mcp-hn',
                    version: '0.1.0',
                    registryType: 'pypi',
                    registryBaseUrl: 'https://pypi.org',
                    runtimeHint: 'uvx',
                    transport: {
                        type: 'stdio',
                    },
                    packageArguments: [],
                    environmentVariables: [],
                },
            ],
        },
    },
];

const McpConfigure: React.FC<McpConfigureProps> = ({ onSuccessExit }) => {
    const [pageSize] = useState<number>(PAGE_SIZE_DEFAULT);
    const [searchResults, setSearchResults] = useState<McpServerFromRegistry[]>([]);
    const [isLoadingRegistry, setIsLoadingRegistry] = useState<boolean>(false);
    const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
    const [listHasMore, setListHasMore] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [selectedServer, setSelectedServer] = useState<McpServerFromRegistry | null>(null);
    const [isManualMode, setIsManualMode] = useState<boolean>(false);
    const [formData, setFormData] = useState<McpServerFormData>({
        name: '',
        description: '',
        repositoryUrl: '',
        transport: 'STDIO' as apolloResolversTypes.McpTransportType,
        command: '',
        args: '',
        ENV: '',
        serverUrl: '',
        headers: '',
    });
    const [testView, setTestView] = useState<TestViewState>('idle');
    const [isQuickConfigValid, setIsQuickConfigValid] = useState<boolean>(true);
    const [quickConfigFormData, setQuickConfigFormData] = useState<McpServerFormData>({});
    const [testingServerName, setTestingServerName] = useState<string>('');
    const [testingTools, setTestingTools] = useState<apolloResolversTypes.McpTool[]>([]);
    const [testingError, setTestingError] = useState<string>('');
    const [createdServerId, setCreatedServerId] = useState<string>('');

    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const searchDebounceRef = useRef<number | undefined>(undefined);
    const toolsTimeoutRef = useRef<number | null>(null);

    const currentQuery = searchTerm.trim();
    const { currentWorkspace, runtimes } = useWorkspace();

    const handleQuickConfigChange = useCallback((cfg: McpServerFormData): void => {
        setQuickConfigFormData(cfg);
    }, []);

    const initFormFromServer = useCallback((): void => {
        setFormData({
            name: '',
            description: '',
            repositoryUrl: '',
            transport: 'STDIO' as apolloResolversTypes.McpTransportType,
            command: '',
            args: '',
            ENV: '',
            serverUrl: '',
            headers: '',
        });
    }, []);

    const handleServerSelect = useCallback((server: McpServerFromRegistry): void => {
        setSelectedServer(server);
        setTestView('idle');
        setIsManualMode(false);
        initFormFromServer();
    }, [initFormFromServer]);

    const onFormDataChange = useCallback((field: keyof McpServerFormData, value: string | apolloResolversTypes.McpTransportType): void => {
        setFormData(prev => ({ ...prev, [field]: value as string }));
    }, []);



    const handleInfiniteScroll = useCallback((): void => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const threshold = 120;
        const isNearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
        if (isNearBottom) {
            if (currentQuery === '') return;
            if (listHasMore && !isLoadingRegistry && !isSearching && nextCursor) {
                setIsLoadingRegistry(true);
                void searchServers(currentQuery, { limit: pageSize, cursor: nextCursor })
                    .then(({ servers, hasMore, nextCursor: newCursor }) => {
                        setSearchResults(prev => [...prev, ...servers]);
                        setNextCursor(newCursor);
                        setListHasMore(hasMore);
                    })
                    .finally(() => setIsLoadingRegistry(false));
            }
        }
    }, [pageSize, listHasMore, nextCursor, isLoadingRegistry, isSearching, currentQuery]);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const onScroll = (): void => handleInfiniteScroll();
        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, [handleInfiniteScroll]);

    const performSearch = useCallback(async (query: string): Promise<void> => {
        const trimmedQuery = query.trim();
        if (trimmedQuery === '') {
            setIsSearching(false);
            setSearchResults([]);
            setNextCursor(undefined);
            setListHasMore(false);
            return;
        }
        setIsSearching(true);
        try {
            const { servers, hasMore, nextCursor: newCursor } = await searchServers(trimmedQuery, { limit: pageSize });
            setSearchResults(servers);
            setNextCursor(newCursor);
            setListHasMore(hasMore);
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [pageSize]);

    useEffect(() => {
        if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
        if (currentQuery === '') {
            setIsSearching(false);
            setSearchResults([]);
            setNextCursor(undefined);
            setListHasMore(false);
        } else {
            setIsSearching(true);
            setSearchResults([]);
            setNextCursor(undefined);
            setListHasMore(true);
            searchDebounceRef.current = window.setTimeout(() => {
                void performSearch(currentQuery);
            }, 400);
        }
        return () => {
            if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
        };
    }, [searchTerm, currentQuery, performSearch]);

    const stripNamespaceFromName = useCallback((name: string): string => {
        const separatorIndex = name.indexOf('/');
        if (separatorIndex === -1) return name;
        return name.slice(separatorIndex + 1);
    }, []);

    const renderServerItem = useCallback((serverResponse: McpServerFromRegistry, isActive: boolean): React.ReactNode => {
        const repositoryUrl = serverResponse.server.repository?.url || '';
        const displayName = stripNamespaceFromName(serverResponse.server.name || '');
        return (
            <div
                key={`${serverResponse.server.name}-${serverResponse.server.version}`}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${isActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                onClick={() => handleServerSelect(serverResponse)}
            >
                <div className="font-medium text-gray-900">{displayName}</div>
                <div className="text-sm text-gray-600">{serverResponse.server.description}</div>
                {repositoryUrl && (
                    <a
                        href={repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:text-primary-700 mt-1 inline-block truncate"
                        onClick={(e) => e.stopPropagation()}
                        title={repositoryUrl}
                    >
                        {repositoryUrl}
                    </a>
                )}
            </div>
        );
    }, [handleServerSelect, stripNamespaceFromName]);



    const renderFullSetupForm = useCallback((includeIdentity: boolean): React.ReactNode => {
        return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {includeIdentity && (
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-800">Manual Configuration</h3>
                    </div>
                )}
                {includeIdentity && (
                    <>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => onFormDataChange('name', e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => onFormDataChange('description', e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
                    </>
                )}

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Repository URL</label>
                    <input
                        type="url"
                        value={formData.repositoryUrl}
                        onChange={(e) => onFormDataChange('repositoryUrl', e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Transport<span className="ml-0.5 text-red-500">*</span></label>
                    <select
                        value={formData.transport}
                        onChange={(e) => {
                            const next = e.target.value as apolloResolversTypes.McpTransportType;
                            onFormDataChange('transport', next);
                            if (next === 'STDIO') {
                                onFormDataChange('serverUrl', '');
                                onFormDataChange('headers', '');
                            } else if (next === 'STREAM') {
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
                            <label className="block text-sm font-medium text-gray-700">Command<span className="ml-0.5 text-red-500">*</span></label>
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
                            <label className="block text-sm font-medium text-gray-700">Server URL<span className="ml-0.5 text-red-500">*</span></label>
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
                                placeholder="Enter headers in format: Header-Name: header-value (one per line)"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Format: Header-Name: header-value (one per line)</p>
                        </div>
                    </>
                )}
            </div>
        );
    }, [formData, onFormDataChange]);

    const renderConfigurePlaceholder = useCallback((): React.ReactNode => {
        return (
            <div className="h-full min-h-0 flex flex-col">
                <div className="mb-3">
                    <h3 className="text-base font-semibold text-gray-800">Configuration</h3>
                    <p className="text-sm text-gray-500">Select a server on the left to continue</p>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                    <div className="space-y-4 animate-pulse">
                        <div>
                            <div className="h-3 w-28 bg-gray-200 rounded mb-2"></div>
                            <div className="h-9 bg-gray-200 rounded"></div>
                        </div>
                        <div>
                            <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
                            <div className="h-9 bg-gray-200 rounded"></div>
                        </div>
                        <div>
                            <div className="h-3 w-32 bg-gray-200 rounded mb-2"></div>
                            <div className="h-24 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }, []);

    const isManualFormValid = useMemo<boolean>(() => {
        if (!isManualMode) return true;
        const transportOk = Boolean(formData.transport);
        const commandOk = formData.transport === 'STDIO' ? Boolean((formData.command || '').toString().trim()) : true;
        const serverUrlOk = formData.transport === 'STREAM' ? Boolean((formData.serverUrl || '').toString().trim()) : true;
        return transportOk && commandOk && serverUrlOk;
    }, [isManualMode, formData.transport, formData.command, formData.serverUrl]);

    const initFormForManual = useCallback((): void => {
        setSelectedServer(null);
        setIsManualMode(true);
        setTestView('idle');
        setFormData({
            name: '',
            description: '',
            repositoryUrl: '',
            transport: 'STDIO' as apolloResolversTypes.McpTransportType,
            command: '',
            args: '',
            ENV: '',
            serverUrl: '',
            headers: '',
        });
    }, []);

    const renderLeft = useCallback((): React.ReactNode => {
        return (
            <>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search the registry (by name or description)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                </div>
                {currentQuery === '' ? (
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-2 mt-3">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-700">Featured MCP Servers</h3>
                            <button
                                type="button"
                                onClick={initFormForManual}
                                className="text-xs text-primary-600 hover:text-primary-700 underline"
                            >
                                Configure manually
                            </button>
                        </div>
                        {FEATURED_SERVERS.map((s) => renderServerItem(s, Boolean(selectedServer && s.server.repository?.url === selectedServer.server.repository?.url && s.server.name === selectedServer.server.name)))}
                    </div>
                ) : (
                    <div
                        ref={scrollContainerRef}
                        className="flex-1 min-h-0 overflow-y-auto space-y-2 mt-3"
                    >
                        {isSearching && (
                            <div className="text-center text-gray-500 py-4">Searching…</div>
                        )}
                        {searchResults.length === 0 && !isSearching && !isLoadingRegistry && (
                            <div className="text-center text-gray-500 py-4">
                                No servers found
                            </div>
                        )}
                        {searchResults.map((s) => renderServerItem(s, Boolean(selectedServer && s.server.repository?.url === selectedServer.server.repository?.url && s.server.name === selectedServer.server.name)))}
                        {listHasMore && (
                            <div className="text-center text-gray-400 text-xs py-2">Scroll to load more…</div>
                        )}
                    </div>
                )}
            </>
        );
    }, [currentQuery, searchTerm, isLoadingRegistry, isSearching, searchResults, selectedServer, initFormForManual, renderServerItem, listHasMore]);

    const startTestRef = useRef<() => void>();

    const renderConfigureServer = useCallback((): React.ReactNode => {
        if (isManualMode) {
            return (
                <div>
                    {renderFullSetupForm(true)}
                </div>
            );
        }
        if (!selectedServer) return renderConfigurePlaceholder();
        return (
            <div>
                <div className="md:col-span-2 mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">{stripNamespaceFromName(selectedServer.server.name || '')}</h3>
                    {selectedServer.server.repository?.url && (
                        <a
                            href={selectedServer.server.repository.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 hover:text-primary-700 mt-1 inline-block truncate"
                            title={selectedServer.server.repository.url}
                        >
                            {selectedServer.server.repository.url}
                        </a>
                    )}
                </div>
                <MCPQuickConfig
                    selectedServer={selectedServer}
                    onValidityChange={setIsQuickConfigValid}
                    onConfigChange={handleQuickConfigChange}
                />
            </div>
        );
    }, [isManualMode, selectedServer, stripNamespaceFromName, handleQuickConfigChange, renderFullSetupForm, renderConfigurePlaceholder]);

    const renderTestingAnimation = useCallback((): React.ReactNode => {
        return (
            <div className="relative flex items-center justify-center h-full">
                <div className="absolute rounded-full bg-blue-300 opacity-20 animate-ping" style={{ width: '16rem', height: '16rem', animationDuration: '3.5s' }}></div>
                <div className="absolute rounded-full bg-indigo-300 opacity-20 animate-ping" style={{ width: '12rem', height: '12rem', animationDelay: '400ms', animationDuration: '3s' }}></div>
                <div className="absolute rounded-full bg-purple-300 opacity-20 animate-ping" style={{ width: '8rem', height: '8rem', animationDelay: '800ms', animationDuration: '2.5s' }}></div>

                <div className="relative text-center">
                    <span className="text-4xl">🧩</span>
                    <p className="mt-4 text-lg font-semibold text-gray-800">Testing {testingServerName}</p>
                    <p className="text-sm text-gray-500">Trying to start the server and discover its tools</p>
                </div>
            </div>
        );
    }, [testingServerName]);

    const renderTestSuccess = useCallback((): React.ReactNode => {
        const tools = testingTools || [];
        const maxToShow = 3;
        const toShow = tools.slice(0, maxToShow);
        const remaining = Math.max(0, tools.length - maxToShow);
        return (
            <div className="relative flex items-center justify-center h-full">
                <div className="absolute rounded-full bg-blue-300 opacity-20" style={{ width: '16rem', height: '16rem' }}></div>
                <div className="absolute rounded-full bg-indigo-300 opacity-20" style={{ width: '12rem', height: '12rem', animationDelay: '400ms' }}></div>
                <div className="absolute rounded-full bg-purple-300 opacity-20" style={{ width: '8rem', height: '8rem', animationDelay: '800ms' }}></div>
                <div className="relative w-full max-w-xl mx-auto text-center">
                    <div className="text-4xl">🎉</div>
                    <p className="mt-3 text-lg font-semibold text-gray-800">Tools discovered for {testingServerName}</p>
                    <div className="mt-4 space-y-2 text-left">
                        {toShow.map((t) => (
                            <div key={t.id} className="px-3 py-2 bg-white/70 border border-gray-200 rounded-md shadow-sm">
                                <div className="text-sm font-medium text-gray-900 truncate">{t.name}</div>
                            </div>
                        ))}
                        {remaining > 0 && (
                            <div className="text-sm text-gray-600 pl-3">+{remaining} more tools</div>
                        )}
                    </div>
                </div>
            </div>
        );
    }, [testingTools, testingServerName]);

    const renderTestTimeout = useCallback((): React.ReactNode => {
        return (
            <div className="relative flex items-center justify-center h-full">
                <div className="absolute rounded-full bg-blue-300 opacity-20" style={{ width: '16rem', height: '16rem' }}></div>
                <div className="absolute rounded-full bg-indigo-300 opacity-20" style={{ width: '12rem', height: '12rem', animationDelay: '400ms' }}></div>
                <div className="absolute rounded-full bg-purple-300 opacity-20" style={{ width: '8rem', height: '8rem', animationDelay: '800ms' }}></div>
                <div className="relative w-full max-w-xl mx-auto text-center">
                    <div className="text-4xl">🙂</div>
                    <p className="mt-3 text-lg font-semibold text-gray-800">No tools discovered yet</p>
                    <div className="mt-4 flex items-center gap-3 justify-center">
                        <button
                            type="button"
                            onClick={() => { setCreatedServerId(''); setTestingTools([]); setTestingError(''); setTestView('idle'); }}
                            className="px-4 py-2 text-sm rounded-md text-white bg-primary-600 hover:bg-primary-700"
                        >
                            Change configuration and test again
                        </button>
                    </div>
                </div>
            </div>
        );
    }, []);

    const renderTestingPanel = useCallback((): React.ReactNode => {
        if (testView === 'idle') return null;
        if (testView === 'running') return renderTestingAnimation();
        if (testView === 'success') return renderTestSuccess();
        if (testView === 'timeout') return renderTestTimeout();
        return (
            <div className="relative flex items-center justify-center h-full">
                <div className="relative text-center">
                    <div className="text-4xl">⚠️</div>
                    <p className="mt-3 text-sm text-red-600">{testingError || 'Something went wrong while testing.'}</p>
                </div>
            </div>
        );
    }, [testView, renderTestingAnimation, renderTestSuccess, renderTestTimeout, testingError]);

    const resetForNewServer = useCallback((): void => {
        setSearchTerm('');
        setSearchResults([]);
        setNextCursor(undefined);
        setListHasMore(false);
        setSelectedServer(null);
        setIsManualMode(false);
        setTestView('idle');
        setQuickConfigFormData({});
        setIsQuickConfigValid(true);
        initFormFromServer();
        setCreatedServerId('');
        setTestingTools([]);
        setTestingError('');
        setTestingServerName('');
    }, [initFormFromServer]);

    const buildCreateVariables = useCallback((): { data: McpServerFormData; nameForDisplay: string } => {
        if (isManualMode) {
            const name = ((formData.name || '') as string).trim() || 'MCP Server';
            return { data: formData, nameForDisplay: name };
        }
        const configuredName = ((quickConfigFormData.name || '') as string).trim();
        const fallbackName = stripNamespaceFromName(selectedServer ? (selectedServer.server.name || '') : '') || 'MCP Server';
        const nameForDisplay = configuredName || fallbackName;
        return { data: { ...quickConfigFormData, name: nameForDisplay }, nameForDisplay };
    }, [isManualMode, formData, quickConfigFormData, selectedServer, stripNamespaceFromName]);

    const waitForToolsOrTimeout = useCallback(async (serverId: string): Promise<apolloResolversTypes.McpTool[] | null> => {
        if (!currentWorkspace?.id) return null;
        const subscription = observe<{ mcpServers: apolloResolversTypes.McpServer[] }>({
            query: MCP_SERVERS_SUBSCRIPTION,
            variables: { workspaceId: currentWorkspace.id },
        });
        return await new Promise<apolloResolversTypes.McpTool[] | null>((resolve) => {
            const sub = subscription.subscribe({
                next: (data) => {
                    const server = (data.mcpServers || []).find((s) => s.id === serverId);
                    if (server && server.tools && server.tools.length > 0) {
                        if (toolsTimeoutRef.current !== null) {
                            clearTimeout(toolsTimeoutRef.current);
                            toolsTimeoutRef.current = null;
                        }
                        sub.unsubscribe();
                        resolve(server.tools);
                    }
                },
                error: () => {
                    resolve(null);
                },
            });
            if (toolsTimeoutRef.current !== null) {
                clearTimeout(toolsTimeoutRef.current);
            }
            toolsTimeoutRef.current = window.setTimeout(() => {
                sub.unsubscribe();
                resolve([]);
                toolsTimeoutRef.current = null;
            }, IDENTIFY_TOOLS_TIMEOUT);
        });
    }, [currentWorkspace?.id]);

    const updateServerRunOn = useCallback(async (serverId: string, runOn: apolloResolversTypes.McpServerRunOn = 'GLOBAL' as apolloResolversTypes.McpServerRunOn, runtimeId?: string): Promise<void> => {
        await client.mutate({
            mutation: UPDATE_MCP_SERVER_RUN_ON_MUTATION,
            variables: { mcpServerId: serverId, runOn, runtimeId },
        });
    }, []);

    const deleteMCPServer = useCallback(async (serverId: string): Promise<void> => {
        await client.mutate({
            mutation: DELETE_MCP_SERVER_MUTATION,
            variables: { id: serverId },
        });
    }, []);

    const startTest = useCallback(async (): Promise<void> => {
        if (!currentWorkspace?.id) {
            setTestingError('No workspace selected.');
            setTestView('error');
            return;
        }
        setTestingError('');
        setTestingTools([]);
        setTestView('running');
        try {
            const { data: createData, nameForDisplay } = buildCreateVariables();
            setTestingServerName(nameForDisplay);
            let serverId = createdServerId;
            if (!serverId) {
                // Build config from form data
                const config = buildConfigFromFormData({
                    command: createData.command,
                    args: createData.args,
                    ENV: createData.ENV,
                    serverUrl: createData.serverUrl,
                    headers: createData.headers,
                    transport: createData.transport!,
                });
                
                const createResult = await client.mutate({
                    mutation: CREATE_MCP_SERVER_MUTATION,
                    variables: {
                        name: createData.name,
                        description: createData.description,
                        repositoryUrl: createData.repositoryUrl,
                        transport: createData.transport,
                        config: config,
                        workspaceId: currentWorkspace.id,
                    },
                });
                serverId = createResult.data?.createMCPServer?.id as string;
                if (!serverId) throw new Error('CREATE_MCP_SERVER_NO_ID');
                setCreatedServerId(serverId);
            }

            const availableRuntimes = runtimes;
            const defaultRuntimeId = currentWorkspace.defaultTestingRuntime?.id || availableRuntimes[0]?.id || '';
            if (!defaultRuntimeId) throw new Error('NO_RUNTIME_AVAILABLE');
            await updateServerRunOn(serverId, 'EDGE' as apolloResolversTypes.McpServerRunOn, defaultRuntimeId);
            const tools = await waitForToolsOrTimeout(serverId);
            if (tools && tools.length > 0) {
                await updateServerRunOn(serverId);
                setTestingTools(tools);
                setTestView('success');
            } else {
                await deleteMCPServer(serverId);
                setTestView('timeout');
            }

        } catch (e) {
            setTestingError(e instanceof Error ? e.message : String(e));
            setTestView('error');
        }
    }, [currentWorkspace, buildCreateVariables, createdServerId, runtimes, updateServerRunOn, waitForToolsOrTimeout, deleteMCPServer]);

    useEffect(() => {
        startTestRef.current = () => { void startTest(); };
    }, [startTest]);

    const showTesting = testView !== 'idle';

    return (
        <div className="mt-4 h-full min-h-0">
            <div className="h-full min-h-0 overflow-hidden">
                <div
                    className={`flex h-full transition-transform duration-500 ease-in-out`}
                    style={{ transform: showTesting ? 'translateX(-50%)' as const : 'translateX(0%)' as const }}
                >
                    <div className="flex-none w-1/2 pr-3 h-full min-h-0">
                        <div className="flex flex-col bg-white border border-gray-200 rounded-xl p-4 h-full min-h-0 overflow-hidden" style={{ height: CARD_FIXED_HEIGHT_PX }}>
                            {renderLeft()}
                        </div>
                    </div>
                    <div className="flex-none w-1/2 pr-3 h-full min-h-0">
                        <div className="flex flex-col bg-gray-50 border border-gray-200 rounded-xl p-4 h-full min-h-0 overflow-hidden" style={{ height: CARD_FIXED_HEIGHT_PX }}>
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                {renderConfigureServer()}
                            </div>
                            <div className="pt-3 mt-3 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isManualMode) {
                                            setTestingServerName((formData.name || '').toString().trim() || 'MCP Server');
                                        } else if (selectedServer) {
                                            setTestingServerName(((quickConfigFormData.name || '') as string).trim() || stripNamespaceFromName(selectedServer.server.name || 'MCP Server'));
                                        }
                                        startTestRef.current?.();
                                    }}
                                    disabled={testView === 'running' || (isManualMode ? !isManualFormValid : !isQuickConfigValid || !selectedServer)}
                                    className={`w-full px-4 py-2 text-sm rounded-md text-white ${testView === 'running' || (isManualMode ? !isManualFormValid : !isQuickConfigValid || !selectedServer) ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
                                >
                                    {testView === 'running' ? 'Testing…' : 'Test server'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex-none w-1/2 pl-3 h-full min-h-0">
                        <div className="flex flex-col relative rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 h-full min-h-0 overflow-hidden" style={{ height: CARD_FIXED_HEIGHT_PX }}>
                            <div className={`flex-1 min-h-0 ${testView === 'running' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                                {renderTestingPanel()}
                            </div>
                            {testView === 'success' && (
                                <div className={`mt-3 flex ${onSuccessExit ? 'justify-between' : 'justify-end'}`}>
                                    <button
                                        type="button"
                                        onClick={resetForNewServer}
                                        className="px-3 py-1.5 text-sm text-gray-700 hover:text-primary-700 hover:bg-primary-50 rounded-md"
                                    >
                                        Add another MCP Server
                                    </button>
                                    {onSuccessExit && (
                                        <button
                                            type="button"
                                            onClick={() => onSuccessExit?.()}
                                            className="px-3 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                                        >
                                            Finish
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-tr from-yellow-200 to-pink-200 rounded-full blur-2xl opacity-60"></div>
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-tr from-cyan-200 to-violet-200 rounded-full blur-2xl opacity-60"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default McpConfigure;


