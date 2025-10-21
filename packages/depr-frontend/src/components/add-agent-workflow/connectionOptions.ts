import { type AgentSelectionOption } from './types';

export interface ConnectionOption {
    id: AgentSelectionOption;
    title: string;
    description: string;
    iconUrl: string;
}

export const ICON_URLS: Record<AgentSelectionOption, string> = {
    langchain: 'https://avatars.githubusercontent.com/u/126733545',
    langflow: 'https://avatars.githubusercontent.com/u/85702467',
    n8n: 'https://avatars.githubusercontent.com/u/45487711',
    zapier: 'https://avatars.githubusercontent.com/u/1261889',
    crewai: 'https://avatars.githubusercontent.com/u/170677839',
    claude: 'https://avatars.githubusercontent.com/u/76263028',
    inspector: 'https://avatars.githubusercontent.com/u/182288589',
    json: 'https://avatars.githubusercontent.com/u/182288589',
    manual: 'https://unpkg.com/lucide-static@latest/icons/settings.svg',
};

export const CONNECTION_OPTIONS: ConnectionOption[] = [
    { id: 'langchain', title: 'Langchain Integration', description: 'Using our MCP Connector', iconUrl: ICON_URLS.langchain },
    { id: 'langflow', title: 'Langflow Integration', description: 'With the MCP Node', iconUrl: ICON_URLS.langflow },
    { id: 'n8n', title: 'N8N', description: 'Connect via MCP Client Node', iconUrl: ICON_URLS.n8n },
    { id: 'json', title: 'JSON', description: 'Connect via JSON', iconUrl: ICON_URLS.json },
    // { id: 'zapier', title: 'Zapier', description: 'Connect via MCP app', iconUrl: ICON_URLS.zapier },
    // { id: 'crewai', title: 'CrewAI', description: 'Use 2ly runtime via MCP', iconUrl: ICON_URLS.crewai },
    // { id: 'claude', title: 'Claude', description: 'Run with 2ly runtime via MCP', iconUrl: ICON_URLS.claude },
    // { id: 'inspector', title: 'MCP Inspector', description: 'Inspect exposed tools', iconUrl: ICON_URLS.inspector },
    { id: 'manual', title: 'Add Manually', description: 'Add agent manually and connect it later', iconUrl: ICON_URLS.manual },
];