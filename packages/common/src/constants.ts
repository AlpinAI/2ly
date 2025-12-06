export const MCP_CALL_TOOL_TIMEOUT = 10000;
export const DEFAULT_REQUEST_TIMEOUT = 10 * 1000; // 10 seconds in milliseconds

// AI Provider defaults
export const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434/api';

// AI Provider API endpoints
export const AI_PROVIDER_API_URLS = {
  OPENAI: 'https://api.openai.com/v1/models',
  ANTHROPIC: 'https://api.anthropic.com/v1/models',
  GOOGLE: 'https://generativelanguage.googleapis.com/v1',
} as const;