import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apolloResolversTypes } from '@2ly/common';
import { ColumnDef, createColumnHelper, ExpandedState, flexRender, getCoreRowModel, getExpandedRowModel, Row, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent } from '../ui/Card';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface GroupedMCPServer {
    id: string;
    name: string;
    description: string;
    tools: apolloResolversTypes.McpTool[];
}

type ToolTreeNode = GroupedMCPServer | apolloResolversTypes.McpTool;

interface ToolTreeTableProps {
    servers: GroupedMCPServer[];
    selectedTools: Set<string>;
    areAllVisibleSelected: boolean;
    isSomeVisibleSelected: boolean;
    onToggleAllVisible: () => void;
    onToggleTool: (toolId: string) => void;
    onToggleServerToolIds: (toolIds: string[]) => void;
}

const ROW_ESTIMATE_PX = 48;

const isServerNode = (node: ToolTreeNode): node is GroupedMCPServer => {
    return (node as GroupedMCPServer).tools !== undefined;
};

const getServerToolIds = (server: GroupedMCPServer): string[] => {
    return (server.tools || []).map(t => t.id);
};

const renderServerCheckbox = (
    server: GroupedMCPServer,
    selectedTools: Set<string>,
    onToggleServerToolIds: (toolIds: string[]) => void
) => {
    const serverToolIds = getServerToolIds(server);
    const areAll = serverToolIds.length > 0 && serverToolIds.every(id => selectedTools.has(id));
    const isSome = serverToolIds.some(id => selectedTools.has(id));
    return (
        <input
            type="checkbox"
            checked={areAll}
            ref={input => {
                if (input) input.indeterminate = isSome && !areAll;
            }}
            onChange={() => onToggleServerToolIds(serverToolIds)}
            className="h-3 w-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
    );
};

const renderToolCheckbox = (
    tool: apolloResolversTypes.McpTool,
    selectedTools: Set<string>,
    onToggleTool: (toolId: string) => void
) => {
    const isChecked = selectedTools.has(tool.id);
    return (
        <input
            type="checkbox"
            checked={isChecked}
            onChange={() => onToggleTool(tool.id)}
            className="h-3 w-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
    );
};

const NameCell: React.FC<{ row: Row<ToolTreeNode> }> = ({ row }) => {
    const node = row.original;
    return (
        <div className="min-w-0 py-2">
            <div className={isServerNode(node) ? 'text-sm font-semibold text-gray-900' : 'text-sm font-medium text-gray-900'}>
                {isServerNode(node) ? node.name : (node as apolloResolversTypes.McpTool).name}
            </div>
            <div className="text-xs text-gray-500 truncate">
                {isServerNode(node) ? node.description : (node as apolloResolversTypes.McpTool).description}
            </div>
        </div>
    );
};

const columnHelper = createColumnHelper<ToolTreeNode>();

const ToolTreeTable: React.FC<ToolTreeTableProps> = ({
    servers,
    selectedTools,
    areAllVisibleSelected,
    isSomeVisibleSelected,
    onToggleAllVisible,
    onToggleTool,
    onToggleServerToolIds,
}) => {
    const [expanded, setExpanded] = useState<ExpandedState>({});

    const data = useMemo<ToolTreeNode[]>(() => servers as ToolTreeNode[], [servers]);

    // Auto-expand all servers when there are 3 or fewer
    useEffect(() => {
        if (servers.length > 0 && servers.length <= 3) {
            const expandedState: ExpandedState = {};
            servers.forEach((_, index) => {
                expandedState[index] = true;
            });
            setExpanded(expandedState);
        } else {
            setExpanded({});
        }
    }, [servers]);

    const toolIdToServerName = useMemo(() => {
        const map = new Map<string, string>();
        servers.forEach(server => server.tools.forEach(tool => map.set(tool.id, server.name)));
        return map;
    }, [servers]);

    const renderTypeBadge = (node: ToolTreeNode) => {
        const label = isServerNode(node) ? 'Server' : 'MCP';
        const classes = isServerNode(node)
            ? 'bg-blue-50 text-blue-700'
            : 'bg-gray-100 text-gray-700';
        return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${classes}`}>{label}</span>;
    };

    const renderStatusBadge = (node: ToolTreeNode) => {
        if (isServerNode(node)) return <span className="text-xs text-gray-500">{node.tools.length} tools</span>;
        const statusValue = String((node as apolloResolversTypes.McpTool).status || 'available');
        const isDeprecated = statusValue.toLowerCase().includes('deprec');
        const classes = isDeprecated ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700';
        return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${classes}`}>{statusValue}</span>;
    };

    const columns = useMemo<ColumnDef<ToolTreeNode>[]>(
        () => [
            columnHelper.display({
                id: 'select',
                header: () => (
                    <input
                        type="checkbox"
                        checked={areAllVisibleSelected}
                        ref={input => {
                            if (input) input.indeterminate = isSomeVisibleSelected && !areAllVisibleSelected;
                        }}
                        onChange={onToggleAllVisible}
                        className="h-3 w-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                ),
                cell: ({ row }) =>
                    isServerNode(row.original)
                        ? renderServerCheckbox(row.original, selectedTools, onToggleServerToolIds)
                        : renderToolCheckbox(row.original as apolloResolversTypes.McpTool, selectedTools, onToggleTool),
                size: 36,
            }),
            columnHelper.display({
                id: 'expander',
                header: () => null,
                cell: ({ row }) =>
                    row.getCanExpand() ? (
                        <button
                            aria-label={row.getIsExpanded() ? 'Collapse' : 'Expand'}
                            onClick={row.getToggleExpandedHandler()}
                            className="flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600"
                        >
                            {row.getIsExpanded() ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </button>
                    ) : null,
                size: 28,
            }),
            columnHelper.display({
                id: 'name',
                header: () => <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Name</div>,
                cell: ({ row }) => <NameCell row={row} />,
                size: 480,
            }),
            columnHelper.display({
                id: 'type',
                header: () => <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Type</div>,
                cell: ({ row }) => renderTypeBadge(row.original),
                size: 120,
            }),
            columnHelper.display({
                id: 'status',
                header: () => <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</div>,
                cell: ({ row }) => renderStatusBadge(row.original),
                size: 140,
            }),
            columnHelper.display({
                id: 'server',
                header: () => <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Server</div>,
                cell: ({ row }) =>
                    isServerNode(row.original)
                        ? ''
                        : (() => {
                            const serverName = toolIdToServerName.get((row.original as apolloResolversTypes.McpTool).id) || '';
                            return (
                                <div className="text-xs text-gray-500 whitespace-nowrap truncate" title={serverName}>
                                    {serverName}
                                </div>
                            );
                        })(),
                size: 160,
            }),
        ],
        [areAllVisibleSelected, isSomeVisibleSelected, onToggleAllVisible, onToggleServerToolIds, onToggleTool, selectedTools, toolIdToServerName]
    );

    const table = useReactTable<ToolTreeNode>({
        data,
        columns,
        getSubRows: row => (isServerNode(row) ? (row.tools as ToolTreeNode[]) : undefined),
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getRowCanExpand: row => isServerNode(row.original) && (row.original.tools?.length || 0) > 0,
        state: { expanded },
        onExpandedChange: setExpanded,
    });

    const parentRef = useRef<HTMLDivElement | null>(null);
    const rowModel = table.getExpandedRowModel().rows;
    const virtualizer = useVirtualizer({
        count: rowModel.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_ESTIMATE_PX,
        overscan: 8,
    });

    const virtualItems = virtualizer.getVirtualItems();
    const totalSize = virtualizer.getTotalSize();
    const gridTemplateColumns = useMemo(() => table.getFlatHeaders().map(h => `${h.getSize()}px`).join(' '), [table]);
    const gridTotalWidth = useMemo(() => table.getFlatHeaders().reduce((sum, h) => sum + h.getSize(), 0), [table]);

    return (
        <Card className="border border-gray-200">
            <CardContent className="p-0">
                <div ref={parentRef} className="max-h-96 overflow-auto">
                    <div style={{ width: gridTotalWidth }}>
                        <div className="px-3 sticky top-0 z-10 bg-white border-b border-gray-100">
                            {table.getHeaderGroups().map(headerGroup => (
                                <div key={headerGroup.id} className="grid items-center" style={{ gridTemplateColumns }}>
                                    {headerGroup.headers.map(header => (
                                        <div key={header.id} className="py-2 text-gray-700">
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div style={{ height: totalSize, position: 'relative' }}>
                            {virtualItems.map(virtualRow => {
                                const row = rowModel[virtualRow.index];
                                return (
                                    <div
                                        key={row.id}
                                        data-index={virtualRow.index}
                                        ref={virtualizer.measureElement}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualRow.start}px)`, gridTemplateColumns }}
                                        className="grid px-3 border-b border-gray-100 hover:bg-gray-50"
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <div key={cell.id} className="flex items-center" style={{ height: ROW_ESTIMATE_PX }}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ToolTreeTable;


