import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CodeBlock } from '@/components/ui/code-block';

export type ConnectionTab = 'stream' | 'sse' | 'stdio';

interface ManualConnectionInstructionsProps {
  streamUrl: string;
  sseUrl: string;
  skillKey: string;
}

export function ManualConnectionInstructions({
  streamUrl,
  sseUrl,
  skillKey,
}: ManualConnectionInstructionsProps) {
  const [selectedTab, setSelectedTab] = useState<ConnectionTab>('stream');

  const stdioConfig = JSON.stringify(
    {
      command: 'npx',
      args: ['-y', '@2ly/runtime'],
      env: { SKILL_KEY: skillKey || '<skill_key>' },
    },
    null,
    2
  );

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
        Manual Connection to an MCP Client
      </h3>
      <Tabs
        value={selectedTab}
        onValueChange={(v) => setSelectedTab(v as ConnectionTab)}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="stream">STREAM</TabsTrigger>
          <TabsTrigger value="sse">SSE</TabsTrigger>
          <TabsTrigger value="stdio">STDIO</TabsTrigger>
        </TabsList>
        <TabsContent value="stream">
          <p className="text-base text-gray-500 dark:text-gray-400 mb-2 font-sans">
            Unique URL to connect to this skill using streamable-http transport
          </p>
          <CodeBlock code={streamUrl} language="bash" size="small" />
        </TabsContent>
        <TabsContent value="sse">
          <p className="text-base text-gray-500 dark:text-gray-400 mb-2 font-sans">
            Unique URL to connect to this skill using SSE transport
          </p>
          <CodeBlock code={sseUrl} language="bash" size="small" />
        </TabsContent>
        <TabsContent value="stdio">
          <p className="text-base text-gray-500 dark:text-gray-400 mb-2 font-sans">
            Unique STDIO configuration to connect to this skill
          </p>
          <CodeBlock code={stdioConfig} language="json" size="small" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
