import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingCard } from './onboarding-card';
import * as uiStore from '@/stores/uiStore';
import * as runtimeStore from '@/stores/runtimeStore';
import { ActiveStatus, OnboardingStepStatus, type OnboardingStep, type Runtime, OnboardingStepType, type McpServer, McpTransportType, McpServerRunOn, RuntimeType } from '@/graphql/generated/graphql';
import { useMCPServers } from '@/hooks/useMCPServers';
import { useToolSets } from '@/hooks/useToolSets';

// Mock stores and hooks
vi.mock('@/stores/uiStore');
vi.mock('@/stores/runtimeStore');
vi.mock('@/hooks/useMCPServers');
vi.mock('@/hooks/useToolSets');
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useParams: () => ({ workspaceId: 'workspace-1' }),
}));

describe('OnboardingCard', () => {
  // Helper to create minimal MCP server mock for tool relations
  const createMockMcpServerRef = (id: string, name: string) => ({
    __typename: 'MCPServer' as const,
    id,
    name,
    description: '',
    repositoryUrl: '',
    transport: McpTransportType.Stdio,
    runOn: null,
    config: '{}',
    tools: null,
    runtime: null,
    registryServer: null as never,
    workspace: null as never,
  });

  const mockRuntime: Runtime = {
    __typename: 'Runtime',
    id: 'runtime-1',
    name: 'Test Agent',
    description: 'Test agent description',
    status: ActiveStatus.Active,
    type: RuntimeType.Edge,
    mcpServers: [
      {
        __typename: 'MCPServer',
        id: 'server-1',
        name: 'test-server',
        description: '',
        repositoryUrl: '',
        transport: McpTransportType.Stdio,
        config: '{}',
        runOn: null,
        runtime: null,
        registryServer: null as never,
        workspace: null as never,
        tools: [
          {
            __typename: 'MCPTool',
            id: 'tool-1',
            name: 'test_tool',
            description: '',
            inputSchema: '',
            annotations: '{}',
            status: ActiveStatus.Active,
            createdAt: new Date(),
            lastSeenAt: new Date(),
            mcpServer: createMockMcpServerRef('server-1', 'test-server'),
            workspace: null as never,
            toolSets: [],
          },
        ],
      },
    ],
    createdAt: new Date(),
    hostIP: null,
    hostname: null,
    mcpClientName: null,
    lastSeenAt: null,
    roots: null,
    workspace: {
      __typename: 'Workspace',
      id: 'workspace-1',
      name: 'Test Workspace',
      createdAt: new Date(),
      globalRuntime: null,
      registryServers: [],
      mcpServers: [],
      mcpTools: [],
      onboardingSteps: [],
      runtimes: [],
      toolSets: [],
    },
    toolResponses: [],
  };

  const mockToolSet = {
    __typename: 'ToolSet' as const,
    id: 'toolset-1',
    name: 'Test Agent',
    description: 'Test toolset description',
    createdAt: new Date(),
    updatedAt: null,
    mcpTools: [
      {
        __typename: 'MCPTool' as const,
        id: 'tool-1',
        name: 'test_tool',
        description: '',
        inputSchema: '',
        annotations: '{}',
        createdAt: new Date(),
        lastSeenAt: new Date(),
        runtimes: null,
        status: ActiveStatus.Active,
        mcpServer: createMockMcpServerRef('server-1', 'test-server'),
        workspace: null as never,
        toolSets: [],
      },
    ],
    workspace: {
      __typename: 'Workspace',
      id: 'workspace-1',
      name: 'Test Workspace',
      createdAt: new Date(),
      globalRuntime: null,
      registryServers: [],
      mcpServers: [],
      mcpTools: [],
      onboardingSteps: [],
      runtimes: [],
      toolSets: [],
    },
  };

  const mockStep: OnboardingStep = {
    __typename: 'OnboardingStep',
    id: 'step-1',
    stepId: 'connect-tool-set-to-agent',
    status: OnboardingStepStatus.Pending,
    type: OnboardingStepType.Onboarding,
    priority: 3,
    createdAt: new Date(),
    updatedAt: null,
  };

  const mockSetAddSourceWorkflowOpen = vi.fn();
  const mockOpenCreateToolSetDialog = vi.fn();
  const mockSetManageToolsDialogOpen = vi.fn();
  const mockSetSelectedToolSetForManagement = vi.fn();
  const mockSetConnectToolsetDialogOpen = vi.fn();
  const mockSetSelectedToolsetName = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default store mocks
    vi.mocked(uiStore.useUIStore).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (selector?: any) => {
        const state = {
          setAddSourceWorkflowOpen: mockSetAddSourceWorkflowOpen,
        };
        return typeof selector === 'function' ? selector(state) : state;
      }
    );

    vi.mocked(uiStore.useCreateToolsetDialog).mockReturnValue({
      open: false,
      callback: null,
      openDialog: mockOpenCreateToolSetDialog,
      close: vi.fn(),
    });

    vi.mocked(uiStore.useManageToolsDialog).mockReturnValue({
      open: false,
      setOpen: mockSetManageToolsDialogOpen,
      selectedToolsetId: null,
      setSelectedToolsetId: mockSetSelectedToolSetForManagement,
    });

    vi.mocked(uiStore.useConnectToolsetDialog).mockReturnValue({
      open: false,
      setOpen: mockSetConnectToolsetDialogOpen,
      selectedToolsetName: null,
      setSelectedToolsetName: mockSetSelectedToolsetName,
      selectedToolsetId: null,
      setSelectedToolsetId: vi.fn(),
    });

    vi.mocked(runtimeStore.useRuntimeData).mockReturnValue({
      runtimes: [mockRuntime],
      loading: false,
      error: null,
      stats: { total: 1, active: 1, inactive: 0 },
    });

    vi.mocked(useMCPServers).mockReturnValue({
      servers: [],
      stats: { total: 0, withTools: 0, withoutTools: 0 },
      loading: false,
      error: undefined,
    });

    vi.mocked(useToolSets).mockReturnValue({
      toolSets: [mockToolSet],
      filteredToolSets: [mockToolSet],
      stats: { total: 1, filtered: 1 },
      loading: false,
      error: undefined,
      filters: {
        search: '',
        setSearch: vi.fn(),
        reset: vi.fn(),
      },
    });
  });

  describe('Step 3: Connect Tool Set to Agent', () => {
    it('renders step title and description', () => {
      render(<OnboardingCard step={mockStep} />);

      expect(screen.getByText('Connect your Agent')).toBeInTheDocument();
      expect(screen.getByText(/Connect your tool set to an agent to start using your tools in AI workflows/)).toBeInTheDocument();
    });

    it('shows Connect button when agent with tools exists and step is pending', () => {
      render(<OnboardingCard step={mockStep} isCurrentStep={true} />);

      const button = screen.getByRole('button', { name: /Connect/i });
      expect(button).toBeInTheDocument();
    });

    it('opens Connect Toolset dialog when Connect button is clicked', () => {
      render(<OnboardingCard step={mockStep} isCurrentStep={true} />);

      const button = screen.getByRole('button', { name: /Connect/i });
      fireEvent.click(button);

      expect(mockSetSelectedToolsetName).toHaveBeenCalledWith('Test Agent');
      expect(mockSetConnectToolsetDialogOpen).toHaveBeenCalledWith(true);
    });

    it('shows message when no tool set with tools exists', () => {
      vi.mocked(useToolSets).mockReturnValue({
        toolSets: [],
        filteredToolSets: [],
        stats: { total: 0, filtered: 0 },
        loading: false,
        error: undefined,
        filters: {
          search: '',
          setSearch: vi.fn(),
          reset: vi.fn(),
        },
      });

      render(<OnboardingCard step={mockStep} />);

      expect(screen.getByText(/Create a tool set first to connect to an agent/)).toBeInTheDocument();
    });

    it('shows completed status when step is completed', () => {
      const completedStep = {
        ...mockStep,
        status: OnboardingStepStatus.Completed,
      };

      render(<OnboardingCard step={completedStep} />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText(/Test Agent connected/)).toBeInTheDocument();
    });

    it('shows truncated runtime name when too long', () => {
      const longNameRuntime = {
        ...mockRuntime,
        name: 'This is a very long runtime name that should be truncated',
      };

      vi.mocked(runtimeStore.useRuntimeData).mockReturnValue({
        runtimes: [longNameRuntime],
        loading: false,
        error: null,
        stats: { total: 1, active: 1, inactive: 0 },
      });

      const completedStep = {
        ...mockStep,
        status: OnboardingStepStatus.Completed,
      };

      render(<OnboardingCard step={completedStep} />);

      const nameElement = screen.getByText(/This is a very long runtime name that should be truncated connected/);
      expect(nameElement).toBeInTheDocument();
      expect(nameElement.className).toContain('truncate');
    });

    it('applies correct styling for current step', () => {
      render(<OnboardingCard step={mockStep} isCurrentStep={true} />);

      const button = screen.getByRole('button', { name: /Connect/i });
      // Check that button has default variant (not outline)
      expect(button.className).not.toContain('variant-outline');
    });

    it('applies correct styling for non-current step', () => {
      render(<OnboardingCard step={mockStep} isCurrentStep={false} />);

      const button = screen.getByRole('button', { name: /Connect/i });
      // Check that button has outline variant
      expect(button.className).toContain('outline');
    });

    it('displays Link icon in Connect button', () => {
      render(<OnboardingCard step={mockStep} isCurrentStep={true} />);

      const button = screen.getByRole('button', { name: /Connect/i });
      expect(button).toBeInTheDocument();

      // Check that the Link icon is present (it's rendered as an svg)
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Step 1: Install MCP Server', () => {
    const step1: OnboardingStep = {
      ...mockStep,
      stepId: 'install-mcp-server',
      priority: 1,
    };

    it('renders Browse MCP Servers button', () => {
      render(<OnboardingCard step={step1} />);

      expect(screen.getByRole('button', { name: /Browse MCP Servers/i })).toBeInTheDocument();
    });

    it('opens Add Source Workflow when button clicked', () => {
      render(<OnboardingCard step={step1} />);

      const button = screen.getByRole('button', { name: /Browse MCP Servers/i });
      fireEvent.click(button);

      expect(mockSetAddSourceWorkflowOpen).toHaveBeenCalledWith(true);
    });

    it('shows completed server when step is completed', () => {
      const completedStep = {
        ...step1,
        status: OnboardingStepStatus.Completed,
      };

      const mockServer: McpServer = {
        __typename: 'MCPServer',
        id: 'server-1',
        name: 'Test Server',
        description: 'Test server description',
        repositoryUrl: 'https://test.com',
        transport: McpTransportType.Stdio,
        runOn: McpServerRunOn.Agent,
        config: '{}',
        tools: null,
        runtime: null,
        registryServer: {
          __typename: 'MCPRegistryServer',
          id: 'registry-1',
          name: 'Test Registry Server',
          description: 'Test registry',
          repositoryUrl: 'https://test.com',
          title: 'Test Registry Server',
          version: '1.0.0',
          packages: null,
          remotes: null,
          _meta: null,
          configurations: null,
          createdAt: new Date(),
          lastSeenAt: new Date(),
          workspace: mockRuntime.workspace,
        },
        workspace: mockRuntime.workspace,
      };

      vi.mocked(useMCPServers).mockReturnValue({
        servers: [mockServer],
        stats: { total: 1, withTools: 0, withoutTools: 1 },
        loading: false,
        error: undefined,
      });

      render(<OnboardingCard step={completedStep} />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Test Server')).toBeInTheDocument();
    });
  });

  describe('Step 2: Create Tool Set', () => {
    const step2: OnboardingStep = {
      ...mockStep,
      stepId: 'create-tool-set',
      priority: 2,
    };

    it('renders Create Tool Set button', () => {
      render(<OnboardingCard step={step2} />);

      expect(screen.getByRole('button', { name: /Create Tool Set/i })).toBeInTheDocument();
    });

    it('opens Create Tool Set dialog when button clicked', () => {
      render(<OnboardingCard step={step2} />);

      const button = screen.getByRole('button', { name: /Create Tool Set/i });
      fireEvent.click(button);

      expect(mockOpenCreateToolSetDialog).toHaveBeenCalled();
    });

    it('shows completed tool set with tool count when step is completed', () => {
      const completedStep = {
        ...step2,
        status: OnboardingStepStatus.Completed,
      };

      render(<OnboardingCard step={completedStep} />);

      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText(/Test Agent \(1 tool\)/)).toBeInTheDocument();
    });

    it('shows plural "tools" when tool set has multiple tools', () => {
      const multiToolToolSet = {
        ...mockToolSet,
        mcpTools: [
          {
            __typename: 'MCPTool' as const,
            id: 'tool-1',
            name: 'test_tool_1',
            description: '',
            inputSchema: '',
            annotations: '{}',
            createdAt: new Date(),
            lastSeenAt: new Date(),
            status: ActiveStatus.Active,
            mcpServer: createMockMcpServerRef('server-1', 'test-server'),
            workspace: null as never,
            toolSets: [],
          },
          {
            __typename: 'MCPTool' as const,
            id: 'tool-2',
            name: 'test_tool_2',
            description: '',
            inputSchema: '',
            annotations: '{}',
            createdAt: new Date(),
            lastSeenAt: new Date(),
            status: ActiveStatus.Active,
            mcpServer: createMockMcpServerRef('server-1', 'test-server'),
            workspace: null as never,
            toolSets: [],
          },
        ],
      };

      vi.mocked(useToolSets).mockReturnValue({
        toolSets: [multiToolToolSet],
        filteredToolSets: [multiToolToolSet],
        stats: { total: 1, filtered: 1 },
        loading: false,
        error: undefined,
        filters: {
          search: '',
          setSearch: vi.fn(),
          reset: vi.fn(),
        },
      });

      const completedStep = {
        ...step2,
        status: OnboardingStepStatus.Completed,
      };

      render(<OnboardingCard step={completedStep} />);

      expect(screen.getByText(/Test Agent \(2 tools\)/)).toBeInTheDocument();
    });
  });

  describe('General card behavior', () => {
    it('displays step priority badge', () => {
      render(<OnboardingCard step={mockStep} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('applies completed styling when step is completed', () => {
      const completedStep = {
        ...mockStep,
        status: OnboardingStepStatus.Completed,
      };

      const { container } = render(<OnboardingCard step={completedStep} />);

      // Check for green border/background classes
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-green');
      expect(card.className).toContain('bg-green');
    });

    it('does not show Completed badge when step is pending', () => {
      render(<OnboardingCard step={mockStep} />);

      expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    });
  });
});
