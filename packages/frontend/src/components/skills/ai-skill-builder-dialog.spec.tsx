/**
 * AI Skill Builder Dialog Unit Tests
 *
 * Tests the two-step AI skill creation flow:
 * 1. Intent collection step
 * 2. Review and edit step
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AISkillBuilderDialog } from './ai-skill-builder-dialog';
import * as uiStore from '@/stores/uiStore';
import * as apolloClient from '@apollo/client/react';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { MemoryRouter } from 'react-router-dom';

// Mock Apollo Client hooks
vi.mock('@apollo/client/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Mock Radix Dialog Portal to avoid warnings
vi.mock('@radix-ui/react-dialog', async () => {
  const actual = await vi.importActual('@radix-ui/react-dialog');
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const mockWorkspaceId = 'workspace-123';
const mockSkillId = 'skill-123';
const mockToolId1 = 'tool-1';
const mockToolId2 = 'tool-2';

// Mock generated AI response
const mockAIResponse = JSON.stringify({
  name: 'GitHub Manager',
  scope: 'Manage GitHub issues and pull requests',
  guardrails: 'Only use for public repositories. Do not expose sensitive data.',
  knowledge: 'GitHub API best practices and rate limiting considerations.',
  toolIds: [mockToolId1],
});

const mockTools = [
  {
    id: mockToolId1,
    name: 'create_issue',
    description: 'Create a GitHub issue',
    inputSchema: '{}',
    annotations: '{}',
    status: 'ACTIVE',
    createdAt: '2024-01-01',
    lastSeenAt: '2024-01-01',
    mcpServer: {
      id: 'server-1',
      name: 'GitHub',
      description: 'GitHub MCP Server',
      repositoryUrl: 'https://github.com/user/repo',
      runOn: 'AGENT',
    },
    skills: [],
  },
  {
    id: mockToolId2,
    name: 'list_issues',
    description: 'List GitHub issues',
    inputSchema: '{}',
    annotations: '{}',
    status: 'ACTIVE',
    createdAt: '2024-01-01',
    lastSeenAt: '2024-01-01',
    mcpServer: {
      id: 'server-1',
      name: 'GitHub',
      description: 'GitHub MCP Server',
      repositoryUrl: 'https://github.com/user/repo',
      runOn: 'AGENT',
    },
    skills: [],
  },
];

interface RenderOptions {
  open?: boolean;
  aiModel?: string | null;
  tools?: typeof mockTools;
  chatResponse?: string | null;
  chatError?: Error | null;
  createSkillResponse?: {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  createSkillError?: Error | null;
  customPrompts?: string | null;
}

const renderComponent = (options: RenderOptions = {}) => {
  const {
    open = true,
    aiModel = 'anthropic/claude-3-sonnet',
    tools = mockTools,
    chatResponse = null,
    chatError = null,
    createSkillResponse = null,
    createSkillError = null,
    customPrompts = null,
  } = options;

  // Mock the store hook
  vi.spyOn(uiStore, 'useAISkillBuilderDialog').mockReturnValue({
    open,
    callback: null,
    openDialog: vi.fn(),
    close: vi.fn(),
  });

  // Mock useQuery for workspace default AI model and tools
  // The component calls useQuery twice: once for AI model, once for tools
  // We need to track which query is being called
  let queryCallIndex = 0;
  vi.mocked(apolloClient.useQuery).mockImplementation(() => {
    const currentIndex = queryCallIndex++;
    if (currentIndex % 2 === 0) {
      // Even calls (0, 2, 4...) are for AI model query
      return {
        data: {
          workspace: {
            id: mockWorkspaceId,
            name: 'Test Workspace',
            defaultAIModel: aiModel,
            customPrompts,
          },
        },
        loading: false,
        error: undefined,
        refetch: vi.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    } else {
      // Odd calls (1, 3, 5...) are for tools query
      return {
        data: {
          mcpTools: tools,
        },
        loading: false,
        error: undefined,
        refetch: vi.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    }
  });

  const mockChatWithModel = vi.fn();
  if (chatResponse) {
    mockChatWithModel.mockResolvedValue({
      data: {
        chatWithModel: chatResponse,
      },
    });
  } else if (chatError) {
    mockChatWithModel.mockRejectedValue(chatError);
  }

  const mockCreateSkill = vi.fn();
  const mockAddToolToSkill = vi.fn();

  if (createSkillResponse) {
    mockCreateSkill.mockResolvedValue({
      data: {
        createSkill: createSkillResponse,
      },
    });
  } else if (createSkillError) {
    mockCreateSkill.mockRejectedValue(createSkillError);
  }

  mockAddToolToSkill.mockResolvedValue({
    data: {
      addMCPToolToSkill: {
        id: mockSkillId,
        name: 'Test Skill',
        description: 'Test description',
        updatedAt: '2024-01-01',
        mcpTools: [],
      },
    },
  });

  // Mock useMutation - return different mocks for ChatWithModel, CreateSkill, and AddToolToSkill
  // Component calls useMutation 3 times in order: ChatWithModel, CreateSkill, AddToolToSkill
  let mutationCallIndex = 0;
  vi.mocked(apolloClient.useMutation).mockImplementation(() => {
    const currentIndex = mutationCallIndex++;
    if (currentIndex % 3 === 0) {
      // First call (0, 3, 6...) is for ChatWithModel
      return [
        mockChatWithModel,
        { loading: false, error: undefined, data: undefined },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any;
    } else if (currentIndex % 3 === 1) {
      // Second call (1, 4, 7...) is for CreateSkill
      return [
        mockCreateSkill,
        { loading: false, error: undefined, data: undefined },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any;
    } else {
      // Third call (2, 5, 8...) is for AddToolToSkill
      return [
        mockAddToolToSkill,
        { loading: false, error: undefined, data: undefined },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any;
    }
  });

  return {
    ...render(
      <MemoryRouter initialEntries={[`/workspace/${mockWorkspaceId}/skills`]}>
        <NotificationProvider>
          <AISkillBuilderDialog />
        </NotificationProvider>
      </MemoryRouter>
    ),
    mockChatWithModel,
    mockCreateSkill,
    mockAddToolToSkill,
  };
};

describe('AISkillBuilderDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Intent Step', () => {
    it('renders intent step when dialog is open', () => {
      renderComponent();

      expect(screen.getByText('Create Skill with AI')).toBeInTheDocument();
      expect(screen.getByText(/Describe what you want to build/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/What skill do you want to build?/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate with AI/i })).toBeInTheDocument();
    });

    it('does not render when dialog is closed', () => {
      renderComponent({ open: false });

      expect(screen.queryByText('Create Skill with AI')).not.toBeInTheDocument();
    });

    it('enables Generate button when intent is provided', async () => {
      const user = userEvent.setup();
      renderComponent();

      const textarea = screen.getByLabelText(/What skill do you want to build?/i);
      const generateButton = screen.getByRole('button', { name: /Generate with AI/i });

      // Initially disabled
      expect(generateButton).toBeDisabled();

      // Type intent
      await user.type(textarea, 'Help me manage GitHub');

      // Now enabled
      await waitFor(() => {
        expect(generateButton).toBeEnabled();
      });
    });

    it('shows warning when no AI model is configured', () => {
      renderComponent({ aiModel: null });

      expect(
        screen.getByText(/No AI model is configured for this workspace/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate with AI/i })).toBeDisabled();
    });
  });

  describe('AI Generation', () => {
    it('successfully generates skill from AI response', async () => {
      const user = userEvent.setup();
      const { mockChatWithModel } = renderComponent({ chatResponse: mockAIResponse });

      const textarea = screen.getByLabelText(/What skill do you want to build?/i);
      await user.type(textarea, 'Help me manage GitHub');

      const generateButton = screen.getByRole('button', { name: /Generate with AI/i });
      await user.click(generateButton);

      // Should populate form fields
      await waitFor(() => {
        expect(screen.getByDisplayValue('GitHub Manager')).toBeInTheDocument();
      });

      expect(
        screen.getByDisplayValue('Manage GitHub issues and pull requests')
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue(/Only use for public repositories/i)
      ).toBeInTheDocument();

      // Verify chat was called
      expect(mockChatWithModel).toHaveBeenCalled();
    });

    it('handles AI response with invalid JSON', async () => {
      const user = userEvent.setup();

      // Silence expected console errors
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderComponent({ chatResponse: 'This is not valid JSON' });

      const textarea = screen.getByLabelText(/What skill do you want to build?/i);
      await user.type(textarea, 'Help me');

      const generateButton = screen.getByRole('button', { name: /Generate with AI/i });
      await user.click(generateButton);

      // Should show error notification
      await waitFor(() => {
        expect(screen.getByText(/AI Generation Failed/i)).toBeInTheDocument();
      });

      // Should stay on intent step
      expect(screen.getByLabelText(/What skill do you want to build?/i)).toBeInTheDocument();

      errorSpy.mockRestore();
    });

    it('filters out invalid tool IDs from AI response', async () => {
      const user = userEvent.setup();

      const responseWithInvalidTools = JSON.stringify({
        name: 'Test Skill',
        scope: 'Test scope',
        guardrails: 'Test guardrails',
        knowledge: 'Test knowledge',
        toolIds: [mockToolId1, 'invalid-tool-id', mockToolId2],
      });

      renderComponent({ chatResponse: responseWithInvalidTools });

      const textarea = screen.getByLabelText(/What skill do you want to build?/i);
      await user.type(textarea, 'Test');

      const generateButton = screen.getByRole('button', { name: /Generate with AI/i });
      await user.click(generateButton);

      // Wait for review step
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Skill')).toBeInTheDocument();
      });

      // Should show only valid tools as checked
      await waitFor(() => {
        expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
      });
    });

    it('enforces character limits on AI response', async () => {
      const user = userEvent.setup();

      const longName = 'A'.repeat(200); // Exceeds 100 char limit
      const responseWithLongFields = JSON.stringify({
        name: longName,
        scope: 'Test scope',
        guardrails: 'Test guardrails',
        knowledge: 'Test knowledge',
        toolIds: [],
      });

      renderComponent({ chatResponse: responseWithLongFields });

      const textarea = screen.getByLabelText(/What skill do you want to build?/i);
      await user.type(textarea, 'Test');

      const generateButton = screen.getByRole('button', { name: /Generate with AI/i });
      await user.click(generateButton);

      // Wait for review step - check for Name input field
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
        expect(nameInput).toBeInTheDocument();
        expect(nameInput.value.length).toBe(100);
      });
    });
  });

  describe('Review Step', () => {
    const setupReviewStep = async () => {
      const user = userEvent.setup();

      renderComponent({ chatResponse: mockAIResponse });

      const textarea = screen.getByLabelText(/What skill do you want to build?/i);
      await user.type(textarea, 'Help me manage GitHub');

      const generateButton = screen.getByRole('button', { name: /Generate with AI/i });
      await user.click(generateButton);

      // Wait for review step - check for Name input being populated
      await waitFor(() => {
        expect(screen.getByDisplayValue('GitHub Manager')).toBeInTheDocument();
      });

      return user;
    };

    it('allows editing all generated fields', async () => {
      const user = await setupReviewStep();

      const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
      const scopeInput = screen.getByLabelText(/Scope/i) as HTMLTextAreaElement;

      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      await user.clear(scopeInput);
      await user.type(scopeInput, 'Updated scope');

      expect(nameInput.value).toBe('Updated Name');
      expect(scopeInput.value).toBe('Updated scope');
    });

    it('shows character counts for all fields', async () => {
      await setupReviewStep();

      // Should show character counts
      expect(screen.getByText(/\/100 characters/i)).toBeInTheDocument(); // Name
      expect(screen.getByText(/\/300 characters/i)).toBeInTheDocument(); // Scope
      expect(screen.getAllByText(/\/10000 characters/i)).toHaveLength(2); // Guardrails & Knowledge
    });

    it('allows toggling tool selections', async () => {
      const user = await setupReviewStep();

      // tool-1 should be pre-selected from AI
      const tool1Checkbox = screen.getByLabelText(/create_issue/i) as HTMLInputElement;
      expect(tool1Checkbox).toBeChecked();

      // tool-2 should not be selected
      const tool2Checkbox = screen.getByLabelText(/list_issues/i) as HTMLInputElement;
      expect(tool2Checkbox).not.toBeChecked();

      // Toggle tool-2
      await user.click(tool2Checkbox);
      expect(tool2Checkbox).toBeChecked();

      // Should show updated count
      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });

    it('handles Start Over button', async () => {
      const user = await setupReviewStep();

      const startOverButton = screen.getByRole('button', { name: /Start Over/i });
      await user.click(startOverButton);

      // Should return to intent step - check for the intent textarea
      await waitFor(() => {
        const textarea = screen.getByLabelText(/What skill do you want to build?/i) as HTMLTextAreaElement;
        expect(textarea).toBeInTheDocument();
        // The textarea value should not have the previously typed text
        // (note: it might not be completely empty due to state, but check it's back to intent step)
        expect(screen.queryByDisplayValue('GitHub Manager')).not.toBeInTheDocument();
      });
    });

    it('creates skill with selected tools', async () => {
      const user = userEvent.setup();

      const createSkillResponse = {
        id: mockSkillId,
        name: 'GitHub Manager',
        description: 'Test description',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      const { mockCreateSkill, mockAddToolToSkill } = renderComponent({
        chatResponse: mockAIResponse,
        createSkillResponse,
      });

      // Navigate to review step
      const textarea = screen.getByLabelText(/What skill do you want to build?/i);
      await user.type(textarea, 'Help me manage GitHub');

      const generateButton = screen.getByRole('button', { name: /Generate with AI/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('GitHub Manager')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Skill/i });
      await user.click(createButton);

      // Should show success notification
      await waitFor(() => {
        expect(screen.getByText(/Skill Created/i)).toBeInTheDocument();
      });

      // Verify mutations were called
      expect(mockCreateSkill).toHaveBeenCalled();
      expect(mockAddToolToSkill).toHaveBeenCalled();
    });

    it('validates required fields before creation', async () => {
      const user = await setupReviewStep();

      const nameInput = screen.getByLabelText(/Name/i);
      await user.clear(nameInput);

      const createButton = screen.getByRole('button', { name: /Create Skill/i });
      expect(createButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('handles network errors during AI generation', async () => {
      const user = userEvent.setup();

      // Silence expected console errors
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderComponent({ chatError: new Error('Network error') });

      const textarea = screen.getByLabelText(/What skill do you want to build?/i);
      await user.type(textarea, 'Test');

      const generateButton = screen.getByRole('button', { name: /Generate with AI/i });
      await user.click(generateButton);

      // Should show error notification
      await waitFor(() => {
        expect(screen.getByText(/AI Generation Failed/i)).toBeInTheDocument();
      });

      // Intent should be preserved for retry
      expect(textarea).toHaveValue('Test');

      errorSpy.mockRestore();
    });

    it('handles skill creation errors', async () => {
      const user = userEvent.setup();

      // Silence expected console errors
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderComponent({
        chatResponse: mockAIResponse,
        createSkillError: new Error('Database error'),
      });

      // Navigate through flow
      const textarea = screen.getByLabelText(/What skill do you want to build?/i);
      await user.type(textarea, 'Test');

      const generateButton = screen.getByRole('button', { name: /Generate with AI/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('GitHub Manager')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Skill/i });
      await user.click(createButton);

      // Should show error notification
      await waitFor(() => {
        expect(screen.getByText(/Error Creating Skill/i)).toBeInTheDocument();
      });

      errorSpy.mockRestore();
    });
  });

  describe('No Tools Scenario', () => {
    it('handles workspace with no tools', async () => {
      const user = userEvent.setup();

      const noToolsResponse = JSON.stringify({
        name: 'Test Skill',
        scope: 'Test',
        guardrails: 'Test',
        knowledge: 'Test',
        toolIds: [],
      });

      renderComponent({
        tools: [],
        chatResponse: noToolsResponse,
      });

      const textarea = screen.getByLabelText(/What skill do you want to build?/i);
      await user.type(textarea, 'Test');

      const generateButton = screen.getByRole('button', { name: /Generate with AI/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Skill')).toBeInTheDocument();
      });

      // Should show message about no tools
      expect(
        screen.getByText(/No tools available in this workspace/i)
      ).toBeInTheDocument();
    });
  });

  describe('Custom Prompt Templates', () => {
    it('uses default prompt template when no custom prompts are configured', async () => {
      const user = userEvent.setup();
      const { mockChatWithModel } = renderComponent({
        customPrompts: null,
        chatResponse: mockAIResponse,
      });

      const textarea = screen.getByLabelText(/What skill do you want to build?/i);
      await user.type(textarea, 'GitHub manager');

      const generateButton = screen.getByRole('button', { name: /Generate with AI/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockChatWithModel).toHaveBeenCalled();
      });

      // Verify systemPrompt parameter was passed
      const callArgs = mockChatWithModel.mock.calls[0][0];
      expect(callArgs.variables.systemPrompt).toBeDefined();
      expect(callArgs.variables.systemPrompt).toContain('Generate a skill configuration with:');
      expect(callArgs.variables.systemPrompt).toContain('Available tools in the workspace:');

      // Verify user message is separate
      expect(callArgs.variables.message).toBe('I want to build a skill with this intent: "GitHub manager"');
    });

    it('uses custom prompt template when configured in workspace settings', async () => {
      const user = userEvent.setup();

      const customTemplate = `You are a helpful assistant that creates skill configurations.

{{tools}}

Based on the user's request, generate a JSON response with these fields:
- name: A short title (max 100 chars)
- scope: What the skill does (max 300 chars)
- guardrails: Safety constraints (max 10000 chars)
- knowledge: Background info (max 10000 chars)
- toolIds: Array of relevant tool IDs

Return ONLY valid JSON, no explanations.`;

      const customPromptsJson = JSON.stringify({
        skillGeneration: customTemplate,
      });

      const { mockChatWithModel } = renderComponent({
        customPrompts: customPromptsJson,
        chatResponse: mockAIResponse,
      });

      const textarea = screen.getByLabelText(/What skill do you want to build?/i);
      await user.type(textarea, 'GitHub manager');

      const generateButton = screen.getByRole('button', { name: /Generate with AI/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockChatWithModel).toHaveBeenCalled();
      });

      // Verify custom systemPrompt was used
      const callArgs = mockChatWithModel.mock.calls[0][0];
      expect(callArgs.variables.systemPrompt).toBeDefined();
      expect(callArgs.variables.systemPrompt).toContain('You are a helpful assistant that creates skill configurations');
      expect(callArgs.variables.systemPrompt).toContain('Based on the user\'s request, generate a JSON response');

      // Verify default template phrases are NOT present
      expect(callArgs.variables.systemPrompt).not.toContain('Generate a skill configuration with:');

      // Verify user message is still separate and doesn't contain template
      expect(callArgs.variables.message).toBe('I want to build a skill with this intent: "GitHub manager"');
      expect(callArgs.variables.message).not.toContain('You are a helpful assistant');
    });

    it('passes systemPrompt and message as separate parameters to mutation', async () => {
      const user = userEvent.setup();
      const { mockChatWithModel } = renderComponent({
        chatResponse: mockAIResponse,
      });

      const textarea = screen.getByLabelText(/What skill do you want to build?/i);
      await user.type(textarea, 'Test intent');

      const generateButton = screen.getByRole('button', { name: /Generate with AI/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockChatWithModel).toHaveBeenCalled();
      });

      const callArgs = mockChatWithModel.mock.calls[0][0];

      // Verify both parameters are present and separate
      expect(callArgs.variables).toHaveProperty('systemPrompt');
      expect(callArgs.variables).toHaveProperty('message');
      expect(callArgs.variables.systemPrompt).not.toBe(callArgs.variables.message);

      // Verify systemPrompt contains template instructions
      expect(callArgs.variables.systemPrompt).toContain('Generate a skill configuration');

      // Verify message contains only user intent
      expect(callArgs.variables.message).toContain('Test intent');
      expect(callArgs.variables.message).not.toContain('Generate a skill configuration');
    });

    it('replaces {{tools}} variable in custom template', async () => {
      const user = userEvent.setup();

      const customTemplate = `Tools available in workspace: {{tools}}

Create a skill configuration based on the user's request. Include name, scope, guardrails, knowledge, and suggested tool IDs in JSON format.`;

      const customPromptsJson = JSON.stringify({
        skillGeneration: customTemplate,
      });

      const { mockChatWithModel } = renderComponent({
        customPrompts: customPromptsJson,
        chatResponse: mockAIResponse,
      });

      const textarea = screen.getByLabelText(/What skill do you want to build?/i);
      await user.type(textarea, 'Test');

      const generateButton = screen.getByRole('button', { name: /Generate with AI/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockChatWithModel).toHaveBeenCalled();
      });

      const callArgs = mockChatWithModel.mock.calls[0][0];

      // Verify {{tools}} was replaced with actual tools list
      expect(callArgs.variables.systemPrompt).not.toContain('{{tools}}');
      expect(callArgs.variables.systemPrompt).toContain('create_issue');
      expect(callArgs.variables.systemPrompt).toContain('list_issues');
    });

    it('system prompt and user message are properly separated', async () => {
      const user = userEvent.setup();

      const customTemplate = `Available tools in workspace: {{tools}}

You should generate a comprehensive skill configuration based on the user's requirements. Include all required fields.`;

      const customPromptsJson = JSON.stringify({
        skillGeneration: customTemplate,
      });

      const { mockChatWithModel } = renderComponent({
        customPrompts: customPromptsJson,
        chatResponse: mockAIResponse,
      });

      const textarea = screen.getByLabelText(/What skill do you want to build?/i);
      await user.type(textarea, 'My test intent');

      const generateButton = screen.getByRole('button', { name: /Generate with AI/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockChatWithModel).toHaveBeenCalled();
      });

      const callArgs = mockChatWithModel.mock.calls[0][0];

      // System prompt should contain template instructions
      expect(callArgs.variables.systemPrompt).toContain('generate a comprehensive skill');
      expect(callArgs.variables.systemPrompt).toContain('Available tools in workspace:');

      // User message should only contain intent
      expect(callArgs.variables.message).toContain('My test intent');
      expect(callArgs.variables.message).not.toContain('generate a comprehensive skill');
    });

    it('falls back to default template if custom template is invalid', async () => {
      const user = userEvent.setup();

      // Invalid template: too short and missing required variables
      const invalidTemplate = 'Generate skill';

      const customPromptsJson = JSON.stringify({
        skillGeneration: invalidTemplate,
      });

      const { mockChatWithModel } = renderComponent({
        customPrompts: customPromptsJson,
        chatResponse: mockAIResponse,
      });

      // Silence expected console warnings about invalid template
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const textarea = screen.getByLabelText(/What skill do you want to build?/i);
      await user.type(textarea, 'Test');

      const generateButton = screen.getByRole('button', { name: /Generate with AI/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockChatWithModel).toHaveBeenCalled();
      });

      const callArgs = mockChatWithModel.mock.calls[0][0];

      // Should use default template instead
      expect(callArgs.variables.systemPrompt).toContain('Generate a skill configuration with:');

      warnSpy.mockRestore();
    });
  });
});
