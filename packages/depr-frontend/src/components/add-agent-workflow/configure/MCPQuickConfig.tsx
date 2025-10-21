import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apolloResolversTypes } from '@2ly/common';
import { isConfigurationSupported, extractConfigurableParts, mapConfig, type McpServerFromRegistry, type McpServerConfig, type ConfigurableParts } from '../../../services/mcpRegistry.service';

interface Props {
    selectedServer: McpServerFromRegistry;
    onValidityChange?: (isValid: boolean) => void;
    onConfigChange?: (config: Partial<apolloResolversTypes.McpServer>) => void;
}

type VersionOption = {
    id: string;
    label: string;
    config: McpServerConfig;
    isSupported: boolean;
};

const MCPQuickConfig: React.FC<Props> = ({ selectedServer, onValidityChange, onConfigChange }) => {
    const [nameInput, setNameInput] = useState<string>('');
    const [isNameTouched, setIsNameTouched] = useState<boolean>(false);
    const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

    const versionOptions = useMemo<VersionOption[]>(() => {
        const options: VersionOption[] = [];
        for (const pkg of selectedServer.server.packages ?? []) {
            const id = `pkg:${pkg.identifier}@${pkg.version}-${pkg.transport?.type ?? 'unknown'}`;
            const label = `${pkg.identifier}@${pkg.version}`;
            const isSupported = isConfigurationSupported(pkg);
            options.push({ id, label, config: pkg, isSupported });
        }
        for (const remote of selectedServer.server.remotes ?? []) {
            const id = `remote:${remote.type}:${remote.url ?? ''}`;
            const label = `remote ${remote.type}`;
            const isSupported = isConfigurationSupported(remote);
            options.push({ id, label, config: remote, isSupported });
        }
        return options;
    }, [selectedServer]);

    const [selectedVersionId, setSelectedVersionId] = useState<string>('');
    const selectedVersion = useMemo<VersionOption | undefined>(() => {
        return versionOptions.find((v) => v.id === selectedVersionId);
    }, [versionOptions, selectedVersionId]);

    const [parts, setParts] = useState<ConfigurableParts[]>([]);

    const stripNamespaceFromName = useCallback((name: string): string => {
        const separatorIndex = name.indexOf('/');
        if (separatorIndex === -1) return name;
        return name.slice(separatorIndex + 1);
    }, []);

    const isPackageConfig = useCallback((config: McpServerConfig): config is McpServerConfig & { registry_type: string; version?: string } => {
        return Object.prototype.hasOwnProperty.call(config, 'registry_type');
    }, []);

    const defaultServerName = useMemo<string>(() => {
        const baseName = stripNamespaceFromName(selectedServer.server.name ?? '');
        const version = selectedVersion && selectedVersion.isSupported && isPackageConfig(selectedVersion.config)
            ? String(selectedVersion.config.version ?? '')
            : '';
        return version ? `${baseName}@${version}` : baseName;
    }, [selectedServer, selectedVersion, stripNamespaceFromName, isPackageConfig]);

    useEffect(() => {
        if (versionOptions.length === 0) return;
        if (!selectedVersionId) {
            const firstSupported = versionOptions.find((v) => v.isSupported);
            if (firstSupported) setSelectedVersionId(firstSupported.id);
            return;
        }
        const currentIsSupported = versionOptions.some((v) => v.id === selectedVersionId && v.isSupported);
        if (!currentIsSupported) {
            const firstSupported = versionOptions.find((v) => v.isSupported);
            setSelectedVersionId(firstSupported ? firstSupported.id : '');
        }
    }, [versionOptions, selectedVersionId]);

    useEffect(() => {
        if (!selectedVersion || !selectedVersion.isSupported) {
            setParts([]);
            return;
        }
        const next = extractConfigurableParts(selectedVersion.config).map((p) => ({ ...p }));
        setParts(next);
    }, [selectedVersion]);

    useEffect(() => {
        if (!isNameTouched) setNameInput(defaultServerName);
    }, [defaultServerName, isNameTouched]);

    useEffect(() => {
        if (!onConfigChange) return;
        if (!selectedVersion || !selectedVersion.isSupported) {
            onConfigChange({});
            return;
        }
        const mapped = mapConfig(selectedServer, selectedVersion.config, parts);
        const effectiveName = (nameInput || defaultServerName).trim();
        onConfigChange({ ...mapped, name: effectiveName });
    }, [parts, selectedVersion, selectedServer, nameInput, defaultServerName, onConfigChange]);

    const handlePartChange = useCallback((name: string, value: string): void => {
        setParts((prev) => prev.map((p) => (p.name === name ? { ...p, value } : p)));
    }, []);

    const toggleSecretVisibility = useCallback((partName: string) => {
        setVisibleSecrets(prev => {
            const next = new Set(prev);
            if (next.has(partName)) {
                next.delete(partName);
            } else {
                next.add(partName);
            }
            return next;
        });
    }, []);

    const isAllRequiredFilled = useMemo<boolean>(() => {
        if (!parts || parts.length === 0) return true;
        for (const part of parts) {
            if (part.required) {
                const effectiveValue = (part.value ?? part.default ?? '').toString().trim();
                if (effectiveValue === '') return false;
            }
        }
        return true;
    }, [parts]);

    useEffect(() => {
        if (onValidityChange) onValidityChange(isAllRequiredFilled);
    }, [isAllRequiredFilled, onValidityChange]);

    const renderPartInput = useCallback((
        part: ReturnType<typeof extractConfigurableParts>[number]
    ): React.ReactNode => {
        const currentValue = part.value ?? (part.default ?? '');
        switch (part.type) {
            case 'choices':
                return (
                    <select
                        value={currentValue}
                        onChange={(e) => handlePartChange(part.name, e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                        <option value="">Select…</option>
                        {part.choices.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                );
            case 'boolean':
                return (
                    <select
                        value={currentValue}
                        onChange={(e) => handlePartChange(part.name, e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                        <option value="true">true</option>
                        <option value="false">false</option>
                    </select>
                );
            case 'string':
            default: {
                const isSecret = part.secret === true;
                const isVisible = visibleSecrets.has(part.name);
                const inputType = isSecret && !isVisible ? 'password' : 'text';

                return (
                    <div className="relative">
                        <input
                            type={inputType}
                            value={currentValue}
                            onChange={(e) => handlePartChange(part.name, e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 pr-10"
                        />
                        {isSecret && (
                            <button
                                type="button"
                                onClick={() => toggleSecretVisibility(part.name)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            >
                                {isVisible ? (
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        )}
                    </div>
                );
            }
        }
    }, [handlePartChange, visibleSecrets, toggleSecretVisibility]);

    return (
        <div className="w-full space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => { setNameInput(e.target.value); setIsNameTouched(true); }}
                    placeholder={defaultServerName}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Version</label>
                <select
                    value={selectedVersion?.id ?? ''}
                    onChange={(e) => setSelectedVersionId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                    {versionOptions.map((v) => (
                        <option key={v.id} value={v.id} disabled={!v.isSupported}>{v.label}</option>
                    ))}
                </select>
            </div>

            {parts.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                    This MCP server doesn't expose configurable parts for this version.
                </div>
            ) : (
                <div className="space-y-4">
                    {parts.map((part) => (
                        <div key={part.name} className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                {part.name}
                                {part.required && <span className="ml-0.5 text-red-500">*</span>}
                            </label>
                            {part.description && <p className="text-xs text-gray-500">{part.description}</p>}
                            {renderPartInput(part)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MCPQuickConfig;


