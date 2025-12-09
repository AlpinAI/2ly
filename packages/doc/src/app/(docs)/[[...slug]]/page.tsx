import { source } from '@/lib/source';
import {
    DocsBody,
    DocsDescription,
    DocsPage,
    DocsTitle,
} from 'fumadocs-ui/page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getMDXComponents } from '@/mdx-components';
import Link from 'next/link';
import { Mermaid } from '@/components/mdx/mermaid';

export default async function Page(props: PageProps<'/[[...slug]]'>) {
    const params = (await props.params) as { slug: string[] };

    // Handle root route specially
    if (!params.slug || params.slug.length === 0) {
        return (
            <DocsPage>
                <DocsTitle>Welcome to Skilder Docs</DocsTitle>
                <DocsDescription>Manage Your AI Tools Across All Agents</DocsDescription>
                <DocsBody>
                    <p>
                        Skilder solves tool fragmentation in AI development by providing a unified infrastructure for managing tools across any agent framework.
                    </p>

                    <h2>Key Features</h2>

                    <ul>
                    <li>
                        <strong>Tool Registry</strong> - Centralized catalog of MCP servers, APIs, and custom functions available to all agents.
                    </li>
                    <li>
                        <strong>Agents</strong> - Connect any AI framework through MCP protocol to access your tool ecosystem.
                    </li>
                    <li>
                        <strong>Playground</strong> - Test tools in real-time for debugging.
                    </li>
                    <li>
                        <strong>Deployment</strong> - Distribute tools across local, cloud, or edge runtimes with flexible execution.
                    </li>
                    <li>
                        <strong>Monitoring</strong> - Track agent-tool interactions amongst all your workflows.
                    </li>
                    </ul>


                    <h2>How It Works</h2>

                    <ol>
                        <li>Configure your tools and their secret (setup once, use many times)</li>
                        <li>Prepare skills - curated sets of tools design to solve specific problems</li>
                        <li>Consume your skills by connect Skilder to your agents</li>
                    </ol>

                    <h2>Next Steps</h2>

                    <ol>
                        <li><Link href="/getting-started/installation">Install Skilder</Link></li>
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

    const page = source.getPage(params.slug);
    if (!page) notFound();

    const MDXContent = page.data.body;

    return (
        <DocsPage toc={page.data.toc} full={page.data.full}>
            <DocsTitle>{page.data.title}</DocsTitle>
            <DocsDescription>{page.data.description}</DocsDescription>
            <DocsBody>
                <MDXContent
                    components={getMDXComponents({
                        a: createRelativeLink(source, page),
                    })}
                />
            </DocsBody>
        </DocsPage>
    );
}

export async function generateStaticParams() {
    return source.generateParams();
}

export async function generateMetadata(
    props: PageProps<'/[[...slug]]'>,
): Promise<Metadata> {
    const params = (await props.params) as { slug: string[] };

    // Handle root route metadata
    if (!params.slug || params.slug.length === 0) {
        return {
            title: 'Welcome to Skilder',
            description: 'Manage Your AI Tools Across All Agents',
        };
    }

    const page = source.getPage(params.slug);
    if (!page) notFound();

    return {
        title: page.data.title,
        description: page.data.description,
    };
}


