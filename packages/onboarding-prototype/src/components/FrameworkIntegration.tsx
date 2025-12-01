import { useState } from 'react';
import { Code, Copy, Check, Terminal, FileCode, Sparkles, Bot, Zap, Box, ChevronDown, ChevronRight } from 'lucide-react';
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
  | 'custom';

interface IntegrationGuide {
  id: Framework;
  name: string;
  icon: typeof Terminal;
  category: 'ide' | 'agent';
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
      category: 'agent',
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
