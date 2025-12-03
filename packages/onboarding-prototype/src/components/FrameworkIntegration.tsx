import { useState } from 'react';
import { Code, Copy, Check, Terminal, FileCode, Sparkles, Bot, Zap, Box, ChevronDown, ChevronRight, MessageSquare, Workflow, GitBranch } from 'lucide-react';
import { Button } from './ui/button';
import type { Capability } from '@/mocks/types';

interface FrameworkIntegrationProps {
  capability: Capability;
  onBack: () => void;
  onComplete: () => void;
}

type Framework =
  | 'claude-desktop'
  | 'cline'
  | 'cursor'
  | 'continue'
  | 'langchain'
  | 'crewai'
  | 'autogen'
  | 'n8n'
  | 'langflow'
  | 'copilot'
  | 'chatgpt'
  | 'mistral'
  | 'custom';

interface IntegrationGuide {
  id: Framework;
  name: string;
  icon: typeof Terminal;
  category: 'ide' | 'agent' | 'conversational';
  description: string;
  code: string;
  steps: string[];
}

export function FrameworkIntegration({ capability, onBack, onComplete }: FrameworkIntegrationProps) {
  const [expandedFramework, setExpandedFramework] = useState<Framework | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const skill = capability.skill;

  const frameworks: IntegrationGuide[] = [
    // IDEs
    {
      id: 'cline',
      name: 'Cline',
      icon: Terminal,
      category: 'ide',
      description: 'VS Code extension for AI coding assistance',
      code: `// Add to Cline MCP settings
{
  "mcpServers": {
    "${skill.name.toLowerCase().replace(/\s+/g, '-')}": {
      "command": "npx",
      "args": ["-y", "@2ly/runtime"],
      "env": {
        "SKILL_ID": "${skill.id}"
      }
    }
  }
}`,
      steps: [
        'Open VS Code and install Cline extension',
        'Open Cline settings (Cmd/Ctrl + Shift + P > "Cline: Settings")',
        'Navigate to MCP Servers configuration',
        'Add the configuration above',
        'Reload Cline to activate the skill',
      ],
    },
    {
      id: 'cursor',
      name: 'Cursor',
      icon: Code,
      category: 'ide',
      description: 'AI-first code editor with MCP support',
      code: `// Add to .cursor/mcp.json
{
  "${skill.name.toLowerCase().replace(/\s+/g, '-')}": {
    "command": "npx",
    "args": ["-y", "@2ly/runtime"],
    "env": {
      "SKILL_ID": "${skill.id}",
      "TOOLS": "${skill.tools.map(t => t.name).join(',')}"
    }
  }
}`,
      steps: [
        'Open Cursor IDE',
        'Create/edit .cursor/mcp.json in your workspace',
        'Add the skill configuration',
        'Restart Cursor',
        'Skill tools will be available in AI chat',
      ],
    },
    {
      id: 'continue',
      name: 'Continue',
      icon: FileCode,
      category: 'ide',
      description: 'Open-source autopilot for VS Code and JetBrains',
      code: `// Add to config.json (~/.continue/config.json)
{
  "mcpServers": {
    "${skill.name.toLowerCase().replace(/\s+/g, '-')}": {
      "command": "npx",
      "args": ["-y", "@2ly/runtime"],
      "env": {
        "SKILL_ID": "${skill.id}"
      }
    }
  }
}`,
      steps: [
        'Install Continue extension in VS Code or JetBrains',
        'Open Continue settings',
        'Edit config.json file',
        'Add the MCP server configuration',
        'Reload IDE to activate skill',
      ],
    },
    {
      id: 'claude-desktop',
      name: 'Claude Desktop',
      icon: Sparkles,
      category: 'conversational',
      description: 'Connect via MCP to Claude Desktop app',
      code: `{
  "mcpServers": {
    "${skill.name.toLowerCase().replace(/\s+/g, '-')}": {
      "command": "npx",
      "args": ["-y", "@2ly/runtime"],
      "env": {
        "SKILL_ID": "${skill.id}",
        "MCP_TOOLS": "${skill.tools.map(t => t.name).join(',')}"
      }
    }
  }
}`,
      steps: [
        'Open Claude Desktop settings',
        'Navigate to Developer > Edit Config',
        'Add the configuration to your claude_desktop_config.json',
        'Restart Claude Desktop',
        'Start using your skill!',
      ],
    },
    {
      id: 'langchain',
      name: 'LangChain',
      icon: Terminal,
      category: 'agent',
      description: 'Integrate as LangChain tools with custom instructions',
      code: `from langchain.agents import initialize_agent, AgentType
from langchain.tools import Tool
from twoly import TwolySkill

# Initialize your ${skill.name}
skill = TwolySkill(
    skill_id="${skill.id}",
    knowledge_sources=${JSON.stringify(skill.knowledge.sources.map(s => s.name))},
    instructions={
        "scope": "${skill.instructions.scope.substring(0, 50)}...",
        "guardrails": ${JSON.stringify(skill.instructions.guardrails.slice(0, 2))}
    }
)

# Create LangChain tools
tools = [
    Tool(
        name=tool.name,
        func=skill.execute_tool,
        description=tool.description
    ) for tool in skill.get_tools()
]

# Initialize agent with skill knowledge
agent = initialize_agent(
    tools,
    llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    agent_kwargs={"prefix": skill.get_instruction_prompt()}
)`,
      steps: [
        'Install the 2ly Python package: pip install twoly',
        'Import TwolySkill and configure with your skill ID',
        'Convert MCP tools to LangChain Tool objects',
        'Initialize agent with skill instructions as system prompt',
        'Knowledge sources are automatically loaded via RAG',
      ],
    },
    {
      id: 'crewai',
      name: 'CrewAI',
      icon: Bot,
      category: 'agent',
      description: 'Create a specialized crew member with this skill',
      code: `from crewai import Agent, Task, Crew
from twoly import TwolySkill

# Load your configured skill
skill = TwolySkill(skill_id="${skill.id}")

# Create specialized agent
${skill.name.toLowerCase().replace(/\s+/g, '_')}_agent = Agent(
    role="${skill.name} Specialist",
    goal="${skill.instructions.scope}",
    backstory="""${skill.knowledge.description}""",
    tools=skill.get_crewai_tools(),
    verbose=True
)

# Create task
task = Task(
    description="Use ${skill.name.toLowerCase()} to help the user",
    agent=${skill.name.toLowerCase().replace(/\s+/g, '_')}_agent,
    expected_output="Completed action with proper guardrails applied"
)

# Create crew
crew = Crew(
    agents=[${skill.name.toLowerCase().replace(/\s+/g, '_')}_agent],
    tasks=[task],
    verbose=True
)`,
      steps: [
        'Install dependencies: pip install crewai twoly',
        'Load your skill configuration from 2ly',
        'Create an Agent with skill knowledge as backstory',
        'Skill scope becomes the agent goal',
        'Tools are automatically converted for CrewAI',
        'Guardrails are enforced through agent instructions',
      ],
    },
    {
      id: 'autogen',
      name: 'AutoGen',
      icon: Zap,
      category: 'agent',
      description: 'Multi-agent conversation framework by Microsoft',
      code: `from autogen import AssistantAgent, UserProxyAgent
from twoly import TwolySkill

# Load your configured skill
skill = TwolySkill(skill_id="${skill.id}")

# Create specialized assistant with skill
${skill.name.toLowerCase().replace(/\s+/g, '_')}_assistant = AssistantAgent(
    name="${skill.name}",
    system_message=f"""
    ${skill.instructions.scope}

    Guardrails:
    ${skill.instructions.guardrails.map(g => `- ${g}`).join('\n    ')}

    Knowledge: ${skill.knowledge.description}
    """,
    llm_config={"config_list": config_list},
    function_map=skill.get_autogen_functions()
)

# Create user proxy
user_proxy = UserProxyAgent(
    name="user_proxy",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10
)

# Start conversation
user_proxy.initiate_chat(
    ${skill.name.toLowerCase().replace(/\s+/g, '_')}_assistant,
    message="Help me with ${skill.name.toLowerCase()}"
)`,
      steps: [
        'Install dependencies: pip install pyautogen twoly',
        'Load your skill from 2ly',
        'Create AssistantAgent with skill instructions as system message',
        'Register skill tools as function_map',
        'Knowledge automatically available via RAG',
        'Initiate multi-agent conversation',
      ],
    },
    {
      id: 'n8n',
      name: 'n8n',
      icon: Workflow,
      category: 'agent',
      description: 'Low-code workflow automation with AI agents',
      code: `// n8n Workflow Integration

// 1. Add AI Agent node
{
  "type": "n8n-nodes-langchain.agent",
  "parameters": {
    "agent": "conversationalAgent",
    "systemMessage": "${skill.instructions.scope}\\n\\nGuardrails:\\n${skill.instructions.guardrails.map(g => `- ${g}`).join('\\n')}",
    "memory": {
      "type": "bufferMemory"
    }
  }
}

// 2. Add MCP Tool nodes for each skill tool
${skill.tools.slice(0, 3).map((tool) => `{
  "type": "n8n-nodes-base.httpRequest",
  "name": "${tool.name}",
  "parameters": {
    "url": "https://your-domain.com/mcp/${tool.name}",
    "method": "POST",
    "authentication": "genericCredentialType",
    "options": {
      "tool": {
        "name": "${tool.name}",
        "description": "${tool.description}"
      }
    }
  }
}`).join(',\n\n')}

// 3. Connect tools to agent
// Agent will automatically use tools based on user input

// 4. Add knowledge retrieval (optional)
{
  "type": "n8n-nodes-langchain.vectorStore",
  "parameters": {
    "mode": "retrieve",
    "vectorStore": "pinecone",
    "query": "={{$json.query}}"
  }
}`,
      steps: [
        'Install n8n: npm install n8n -g',
        'Start n8n and create new workflow',
        'Add AI Agent node and configure with skill instructions',
        'Add HTTP Request nodes for each MCP tool',
        'Configure tool descriptions and parameters',
        'Optionally add Vector Store for knowledge retrieval',
        'Connect nodes and test workflow',
        'Deploy workflow and get webhook URL',
      ],
    },
    {
      id: 'langflow',
      name: 'Langflow',
      icon: GitBranch,
      category: 'agent',
      description: 'Visual AI workflow builder powered by LangChain',
      code: `# Langflow Component Configuration

# 1. Create Agent Component
{
  "type": "Agent",
  "name": "${skill.name} Agent",
  "parameters": {
    "agent_type": "zero-shot-react-description",
    "system_message": """
${skill.instructions.scope}

Guardrails:
${skill.instructions.guardrails.map(g => `- ${g}`).join('\n')}

Knowledge: ${skill.knowledge.description}
    """,
    "memory_type": "ConversationBufferMemory"
  }
}

# 2. Add Tool Components
${skill.tools.slice(0, 3).map(tool => `{
  "type": "Tool",
  "name": "${tool.name}",
  "parameters": {
    "name": "${tool.name}",
    "description": "${tool.description}",
    "endpoint": "https://your-domain.com/mcp/${tool.name}",
    "method": "POST",
    "return_direct": false
  }
}`).join(',\n\n')}

# 3. Add Vector Store (for knowledge)
{
  "type": "VectorStoreRetriever",
  "parameters": {
    "vector_store_type": "Chroma",
    "collection_name": "${skill.id}_knowledge",
    "embedding_model": "text-embedding-ada-002"
  }
}

# Connect: Tools -> Agent -> LLM -> Output`,
      steps: [
        'Install Langflow: pip install langflow',
        'Run Langflow: langflow run',
        'Create new flow in UI',
        'Add Agent component with skill instructions',
        'Add Tool components for each MCP tool endpoint',
        'Add Vector Store component for knowledge retrieval',
        'Connect components: Tools → Agent → LLM',
        'Test flow and export as Python or JSON',
        'Deploy via Langflow Cloud or self-hosted',
      ],
    },
    {
      id: 'copilot',
      name: 'Microsoft Copilot',
      icon: MessageSquare,
      category: 'conversational',
      description: 'Connect your skill to Microsoft 365 Copilot',
      code: `// Microsoft Copilot Plugin Configuration
{
  "schema_version": "v2",
  "name_for_human": "${skill.name}",
  "name_for_model": "${skill.name.toLowerCase().replace(/\s+/g, '_')}",
  "description_for_human": "${skill.description}",
  "description_for_model": "${skill.instructions.scope}",
  "auth": {
    "type": "service_http",
    "authorization_type": "bearer",
    "verification_tokens": {
      "openai": "$COPILOT_VERIFICATION_TOKEN"
    }
  },
  "api": {
    "type": "openapi",
    "url": "https://your-domain.com/openapi.json"
  },
  "functions": ${JSON.stringify(
    skill.tools.slice(0, 3).map(tool => ({
      name: tool.name,
      description: tool.description,
    }))
  )}
}`,
      steps: [
        'Register your app in Microsoft Teams Developer Portal',
        'Configure the plugin manifest with your skill details',
        'Deploy your MCP tools as REST API endpoints',
        'Upload manifest to Copilot admin center',
        'Enable the plugin for your organization',
        'Users can invoke your skill from Microsoft 365 Copilot',
      ],
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      icon: MessageSquare,
      category: 'conversational',
      description: 'Create a custom GPT with your skill',
      code: `# ChatGPT Custom GPT Configuration

**Name:** ${skill.name}

**Description:** ${skill.description}

**Instructions:**
You are a specialized assistant for ${skill.name.toLowerCase()}.

${skill.instructions.scope}

**Guardrails:**
${skill.instructions.guardrails.map(g => `- ${g}`).join('\n')}

**Knowledge:**
${skill.knowledge.description}

**Actions (OpenAPI Schema):**
{
  "openapi": "3.0.0",
  "info": {
    "title": "${skill.name} API",
    "version": "1.0.0"
  },
  "servers": [
    { "url": "https://your-domain.com/api" }
  ],
  "paths": {
${skill.tools.slice(0, 2).map(tool => `    "/${tool.name}": {
      "post": {
        "summary": "${tool.description}",
        "operationId": "${tool.name}",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "type": "object" }
            }
          }
        }
      }
    }`).join(',\n')}
  }
}`,
      steps: [
        'Go to ChatGPT and click "Explore GPTs"',
        'Click "Create a GPT" and choose "Configure"',
        'Paste the name, description, and instructions above',
        'Upload knowledge files in the Knowledge section',
        'Add Actions by pasting the OpenAPI schema',
        'Configure authentication (API key or OAuth)',
        'Test your GPT and publish',
      ],
    },
    {
      id: 'mistral',
      name: 'Mistral AI',
      icon: MessageSquare,
      category: 'conversational',
      description: 'Deploy your skill as a Mistral Le Chat agent',
      code: `# Mistral Agent Configuration

from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage

# Initialize Mistral client
client = MistralClient(api_key="your_api_key")

# Define your skill as a function
tools = [
${skill.tools.slice(0, 3).map(tool => `    {
        "type": "function",
        "function": {
            "name": "${tool.name}",
            "description": "${tool.description}",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    }`).join(',\n')}
]

# System prompt with your skill configuration
system_prompt = f"""
You are a ${skill.name} specialist.

${skill.instructions.scope}

Guardrails:
${skill.instructions.guardrails.map(g => `- ${g}`).join('\n')}

Knowledge: ${skill.knowledge.description}
"""

# Chat with function calling
messages = [
    ChatMessage(role="system", content=system_prompt),
    ChatMessage(role="user", content="Help me with ${skill.name.toLowerCase()}")
]

response = client.chat(
    model="mistral-large-latest",
    messages=messages,
    tools=tools,
    tool_choice="auto"
)`,
      steps: [
        'Sign up for Mistral AI API access',
        'Install the Mistral Python SDK: pip install mistralai',
        'Configure your skill as Mistral function tools',
        'Add instructions and guardrails to system prompt',
        'Deploy your MCP tools as HTTP endpoints',
        'Use function calling to execute skill actions',
        'Optionally deploy as Le Chat custom agent',
      ],
    },
    {
      id: 'custom',
      name: 'Custom Integration',
      icon: Box,
      category: 'agent',
      description: 'Direct API integration for any framework',
      code: `// GraphQL API integration
const SKILL_CONFIG = {
  skillId: "${skill.id}",
  instructions: {
    scope: "${skill.instructions.scope.substring(0, 50)}...",
    guardrails: ${JSON.stringify(skill.instructions.guardrails.slice(0, 2))}
  },
  knowledge: ${JSON.stringify(skill.knowledge.sources.map(s => ({ type: s.type, name: s.name })))},
  tools: ${JSON.stringify(skill.tools.map(t => ({ name: t.name, server: t.mcpServerName })))}
};

// Fetch skill configuration
async function loadSkill() {
  const response = await fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: \`
        query GetSkill($id: ID!) {
          skill(id: $id) {
            instructions { scope guardrails }
            knowledge { sources { type name } }
            tools { name mcpServerName }
          }
        }
      \`,
      variables: { id: "${skill.id}" }
    })
  });
  return response.json();
}

// Use with your framework
const skill = await loadSkill();
// Inject instructions into system prompt
// Load knowledge sources into RAG
// Register MCP tools with your agent`,
      steps: [
        'Use 2ly GraphQL API to fetch skill configuration',
        'Inject scope and guardrails into your system prompt',
        'Load knowledge sources into your RAG system',
        'Connect to MCP tools via 2ly runtime',
        'Full flexibility for any agent framework',
      ],
    },
  ];

  const ideFrameworks = frameworks.filter(f => f.category === 'ide');
  const conversationalFrameworks = frameworks.filter(f => f.category === 'conversational');
  const agentFrameworks = frameworks.filter(f => f.category === 'agent');

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const toggleFramework = (id: Framework) => {
    setExpandedFramework(expandedFramework === id ? null : id);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Integrate Your Skill
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose how to connect <span className="font-semibold text-foreground">{skill.name}</span> to your AI agent framework
        </p>
      </div>

      {/* Minimalistic Framework List */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* IDEs Section */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-2">
            IDEs & Code Editors
          </h3>
          <div className="space-y-2">
            {ideFrameworks.map((framework) => {
              const Icon = framework.icon;
              const isExpanded = expandedFramework === framework.id;
              const fileExtension = ['cline', 'cursor', 'continue'].includes(framework.id) ? 'json' : 'py';

              return (
                <div key={framework.id} className="rounded-lg border bg-card overflow-hidden">
                  <button
                    onClick={() => toggleFramework(framework.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{framework.name}</h4>
                        <p className="text-xs text-muted-foreground">{framework.description}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t p-4 space-y-4 bg-muted/20">
                      {/* Code Block */}
                      <div className="relative rounded-lg bg-muted/50 border">
                        <div className="flex items-center justify-between border-b px-3 py-2 bg-muted/30">
                          <span className="text-xs font-mono text-muted-foreground">
                            config.{fileExtension}
                          </span>
                          <button
                            onClick={() => handleCopyCode(framework.code)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedCode ? (
                              <>
                                <Check className="h-3 w-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-3 overflow-x-auto text-xs">
                          <code className="font-mono text-foreground">{framework.code}</code>
                        </pre>
                      </div>

                      {/* Steps */}
                      <div>
                        <h5 className="text-xs font-semibold text-foreground mb-2">Setup Steps</h5>
                        <ol className="space-y-1.5">
                          {framework.steps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-[10px] flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversational AI Section */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-2">
            Conversational AI
          </h3>
          <div className="space-y-2">
            {conversationalFrameworks.map((framework) => {
              const Icon = framework.icon;
              const isExpanded = expandedFramework === framework.id;
              const fileExtension = framework.id === 'copilot' ? 'json' : framework.id === 'chatgpt' ? 'txt' : 'py';

              return (
                <div key={framework.id} className="rounded-lg border bg-card overflow-hidden">
                  <button
                    onClick={() => toggleFramework(framework.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{framework.name}</h4>
                        <p className="text-xs text-muted-foreground">{framework.description}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t p-4 space-y-4 bg-muted/20">
                      {/* Code Block */}
                      <div className="relative rounded-lg bg-muted/50 border">
                        <div className="flex items-center justify-between border-b px-3 py-2 bg-muted/30">
                          <span className="text-xs font-mono text-muted-foreground">
                            config.{fileExtension}
                          </span>
                          <button
                            onClick={() => handleCopyCode(framework.code)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedCode ? (
                              <>
                                <Check className="h-3 w-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-3 overflow-x-auto text-xs">
                          <code className="font-mono text-foreground">{framework.code}</code>
                        </pre>
                      </div>

                      {/* Steps */}
                      <div>
                        <h5 className="text-xs font-semibold text-foreground mb-2">Setup Steps</h5>
                        <ol className="space-y-1.5">
                          {framework.steps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-[10px] flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Agent Frameworks Section */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-2">
            Agent Frameworks
          </h3>
          <div className="space-y-2">
            {agentFrameworks.map((framework) => {
              const Icon = framework.icon;
              const isExpanded = expandedFramework === framework.id;
              const fileExtension = framework.id === 'claude-desktop' ? 'json' : framework.id === 'custom' ? 'js' : 'py';

              return (
                <div key={framework.id} className="rounded-lg border bg-card overflow-hidden">
                  <button
                    onClick={() => toggleFramework(framework.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{framework.name}</h4>
                        <p className="text-xs text-muted-foreground">{framework.description}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t p-4 space-y-4 bg-muted/20">
                      {/* Code Block */}
                      <div className="relative rounded-lg bg-muted/50 border">
                        <div className="flex items-center justify-between border-b px-3 py-2 bg-muted/30">
                          <span className="text-xs font-mono text-muted-foreground">
                            integration.{fileExtension}
                          </span>
                          <button
                            onClick={() => handleCopyCode(framework.code)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedCode ? (
                              <>
                                <Check className="h-3 w-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-3 overflow-x-auto text-xs">
                          <code className="font-mono text-foreground">{framework.code}</code>
                        </pre>
                      </div>

                      {/* Steps */}
                      <div>
                        <h5 className="text-xs font-semibold text-foreground mb-2">Setup Steps</h5>
                        <ol className="space-y-1.5">
                          {framework.steps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-[10px] flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Skill Summary */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <h5 className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
            Your Configured Skill
          </h5>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Knowledge:</span>
              <span className="ml-1 font-medium text-foreground">{skill.knowledge.sources.length} sources</span>
            </div>
            <div>
              <span className="text-muted-foreground">Guardrails:</span>
              <span className="ml-1 font-medium text-foreground">{skill.instructions.guardrails.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tools:</span>
              <span className="ml-1 font-medium text-foreground">{skill.tools.length} MCP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3 max-w-5xl mx-auto">
        <Button onClick={onBack} variant="outline" size="lg" className="flex-1">
          Back
        </Button>
        <Button onClick={onComplete} size="lg" className="flex-1">
          Complete Setup
        </Button>
      </div>
    </div>
  );
}
