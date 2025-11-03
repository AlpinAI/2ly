// Runtime operational mode types
export type RuntimeMode = 'MCP_STDIO' | 'EDGE' | 'EDGE_MCP_STREAM' | 'STANDALONE_MCP_STREAM';
export type RuntimeType = 'MCP' | 'EDGE';

// DI symbols for runtime configuration
export const RUNTIME_MODE = Symbol.for('RUNTIME_MODE');
export const RUNTIME_TYPE = Symbol.for('RUNTIME_TYPE');
