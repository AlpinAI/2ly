/**
 * ToolDetail Component Tests
 *
 * WHY: Test the ToolDetail router component routes to correct detail components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToolDetail } from './tool-detail';
import * as useSkillsHook from '@/hooks/useSkills';
import * as notificationContext from '@/contexts/NotificationContext';
import { ActiveStatus } from '@/graphql/generated/graphql';
import { ToolItemType } from '@/types/tools';
import type { MCPToolItem, AgentItem } from '@/types/tools';

// Mock hooks and contexts
vi.mock('@/hooks/useSkills');
vi.mock('@/contexts/NotificationContext');

// Mock Apollo Client
vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
  useQuery: vi.fn(() => ({ data: null, loading: false, error: undefined, refetch: vi.fn() })),
}));

// Mock react-router-dom to provide useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ workspaceId: 'test-workspace' }),
  };
});

// Mock ToolTester component
vi.mock('./tool-tester', () => ({
  ToolTester: ({ toolId, toolName }: { toolId: string; toolName: string }) => (
    <div data-testid="tool-tester">
      Tool Tester for {toolName} ({toolId})
    </div>
  ),
}));

// Mock AgentTester component
vi.mock('./agent-tester', () => ({
  AgentTester: ({ agentId, agentName }: { agentId: string; agentName: string }) => (
    <div data-testid="agent-tester">
      Agent Tester for {agentName} ({agentId})
    </div>
  ),
}));

// Mock LinkSkillDialog component
vi.mock('./link-skill-dialog', () => ({
  LinkSkillDialog: () => <div data-testid="link-skill-dialog">Link Skill Dialog</div>,
}));

// Mock runtimeStore
vi.mock('@/stores/runtimeStore', () => ({
  useRuntimeData: () => ({
    runtimes: [],
  }),
}));

describe('ToolDetail', () => {
  const mockMCPTool: MCPToolItem = {
    __typename: 'MCPTool',
    itemType: ToolItemType.MCP_TOOL,
    id: 'tool-1',
    name: 'test-tool',
    description: 'A test tool for testing',
    status: ActiveStatus.Active,
    inputSchema: '{"type":"object","properties":{"query":{"type":"string"}}}',
    annotations: '',
    createdAt: new Date('2025-01-01'),
    lastSeenAt: new Date('2025-01-01'),
    mcpServer: {
      __typename: 'MCPServer',
      id: 'server-1',
      name: 'Test Server',
      description: 'Test server description',
      repositoryUrl: 'https://github.com/test/server',
      executionTarget: null,
    },
    skills: [
      {
        __typename: 'Skill',
        id: 'skill-1',
        name: 'Test Skill',
        description: 'Test skill description',
      },
    ],
  };

  const mockAgent: AgentItem = {
    __typename: 'Agent',
    itemType: ToolItemType.AGENT,
    id: 'agent-1',
    name: 'test-agent',
    description: 'A test agent for testing',
    systemPrompt: 'You are a helpful assistant.',
    model: 'openai/gpt-4',
    temperature: 1.0,
    maxTokens: 4096,
    executionTarget: null,
    runtime: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: null,
    skills: [],
    tools: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useSkills hook
    vi.mocked(useSkillsHook.useSkills).mockReturnValue({
      skills: [
        {
          __typename: 'Skill',
          id: 'skill-1',
          name: 'Test Skill',
          description: 'Test skill description',
          createdAt: new Date('2025-01-01'),
          updatedAt: null,
          mcpTools: null,
          agentTools: null,
        },
      ],
      filteredSkills: [
        {
          __typename: 'Skill',
          id: 'skill-1',
          name: 'Test Skill',
          description: 'Test skill description',
          createdAt: new Date('2025-01-01'),
          updatedAt: null,
          mcpTools: null,
          agentTools: null,
        },
      ],
      loading: false,
      error: undefined,
      stats: { total: 1, filtered: 1 },
      filters: {
        search: '',
        setSearch: vi.fn(),
        reset: vi.fn(),
      },
    });

    // Mock notification context
    vi.mocked(notificationContext.useNotification).mockReturnValue({
      toast: vi.fn(),
      confirm: vi.fn(),
    });
  });

  const renderComponent = (item: MCPToolItem | AgentItem) => {
    return render(
      <MemoryRouter initialEntries={['/w/test-workspace/tools']}>
        <ToolDetail item={item} />
      </MemoryRouter>
    );
  };

  it('renders MCPToolDetail for MCP tool items', () => {
    renderComponent(mockMCPTool);

    expect(screen.getByText('test-tool')).toBeInTheDocument();
    expect(screen.getByText('A test tool for testing')).toBeInTheDocument();
    expect(screen.getByText('MCP Server')).toBeInTheDocument();
    expect(screen.getByTestId('tool-tester')).toBeInTheDocument();
  });

  it('renders AgentDetail for Agent items', () => {
    renderComponent(mockAgent);

    // Agent detail should show the agent name in an input
    const nameInput = screen.getByDisplayValue('test-agent');
    expect(nameInput).toBeInTheDocument();
    expect(screen.getByTestId('agent-tester')).toBeInTheDocument();
  });

  it('renders MCP tool with scroll-smooth class', () => {
    const { container } = renderComponent(mockMCPTool);

    const mainContainer = container.querySelector('.scroll-smooth');
    expect(mainContainer).toBeInTheDocument();
  });

  it('renders tool name and description', () => {
    renderComponent(mockMCPTool);

    expect(screen.getByText('test-tool')).toBeInTheDocument();
    expect(screen.getByText('A test tool for testing')).toBeInTheDocument();
  });

  it('renders tool status', () => {
    renderComponent(mockMCPTool);

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('renders MCP server information', () => {
    renderComponent(mockMCPTool);

    expect(screen.getByText('MCP Server')).toBeInTheDocument();
    expect(screen.getByText('Test Server')).toBeInTheDocument();
  });

  it('renders linked skills for MCP tool', () => {
    renderComponent(mockMCPTool);

    expect(screen.getByText(/Available in Skills \(1\)/)).toBeInTheDocument();
    expect(screen.getByText('Test Skill')).toBeInTheDocument();
  });

  it('renders ToolTester component for MCP tools', () => {
    renderComponent(mockMCPTool);

    const toolTester = screen.getByTestId('tool-tester');
    expect(toolTester).toBeInTheDocument();
    expect(toolTester).toHaveTextContent('Tool Tester for test-tool (tool-1)');
  });

  it('renders AgentTester component for Agents', () => {
    renderComponent(mockAgent);

    const agentTester = screen.getByTestId('agent-tester');
    expect(agentTester).toBeInTheDocument();
    expect(agentTester).toHaveTextContent('Agent Tester for test-agent (agent-1)');
  });
});
