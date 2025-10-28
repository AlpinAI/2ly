import {
    DocsBody,
    DocsDescription,
    DocsPage,
    DocsTitle,
} from 'fumadocs-ui/page';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Mermaid } from '@/components/mdx/mermaid';

export const metadata: Metadata = {
    title: 'Welcome to 2LY',
    description: 'Manage Your AI Tools Across All Agents',
};

export default function HomePage() {
    return (
        <DocsPage>
            <DocsTitle>Welcome to 2LY</DocsTitle>
            <DocsDescription>Manage Your AI Tools Across All Agents</DocsDescription>
            <DocsBody>
                <p>
                    2LY solves tool fragmentation in AI development by providing a unified infrastructure for managing tools across any agent framework.
                </p>

                <h2>Key Features</h2>

                <p>
                    <strong>Tool Registry</strong> - Centralized catalog of MCP servers, APIs, and custom functions available to all agents
                </p>

                <p>
                    <strong>Agents</strong> - Connect any AI framework through MCP protocol to access your tool ecosystem
                </p>

                <p>
                    <strong>Playground</strong> - Test tools in real-time for debugging
                </p>

                <p>
                    <strong>Deployment</strong> - Distribute tools across local, cloud, or edge runtimes with flexible execution
                </p>

                <p>
                    <strong>Monitoring</strong> - Track agent-tool interactions amongst all your workflows
                </p>

                <h2>How It Works</h2>

                <Mermaid chart={`graph LR
    Agent[AI Agent] -->|MCP| Runtime[Agent Runtime]
    Runtime -->|NATS| Backend[Backend]
    Backend --> ToolRuntime[Tool Runtime]
    ToolRuntime --> Tools[Tools]

    style Agent fill:#e1f5fe
    style Tools fill:#e8f5e9`} />

                <ol>
                    <li>Agents connect as MCP clients through agent runtimes</li>
                    <li>Tool requests flow through NATS message bus</li>
                    <li>Backend routes to appropriate tool runtimes</li>
                    <li>Tools execute and return results</li>
                </ol>

                <h2>Next Steps</h2>

                <ol>
                    <li><Link href="/getting-started/installation">Install 2LY</Link></li>
                    <li><Link href="/getting-started/quick-start">Quick Start</Link></li>
                    <li><Link href="/your-first-toolflow/overview">Your First Toolflow</Link></li>
                </ol>

                <p><strong>Learn More:</strong></p>
                <ul>
                    <li><Link href="/core-concepts/agents">Core Concepts</Link> - Agents, Tools, Runtime</li>
                    <li><Link href="/core-concepts/architecture">Architecture</Link> - System overview</li>
                </ul>
            </DocsBody>
        </DocsPage>
    );
}
