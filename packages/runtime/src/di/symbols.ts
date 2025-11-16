// Runtime operational mode types
export type RuntimeMode = 'MCP_STDIO' | 'EDGE' | 'EDGE_MCP_STREAM' | 'STANDALONE_MCP_STREAM';
export const RUNTIME_MODE = Symbol.for('RuntimeMode');